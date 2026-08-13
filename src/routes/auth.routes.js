const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const { User, UserSession, RoleChangeLog } = require('../models');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireNotBanned } = require('../middlewares/status.middleware');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/token');
const { sendWelcomeEmail, sendVerificationCodeEmail, sendPasswordResetCodeEmail, sendPasswordChangedEmail } = require('../utils/email');
const { generateOtpCode, getOtpExpiration } = require('../utils/otp');
const { isTemporaryBlockActive } = require('../utils/user-access');
const { createSession, validateSession } = require('../utils/sessions');
const Joi = require('joi');

const router = express.Router();

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
const passwordResetLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false });

const passwordRule = Joi.string().min(8).max(72).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/);

async function verifyGoogleCredential(credential) {
    if (!credential) {
        throw new Error('Identifiant Google manquant');
    }

    const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();

    if (!clientId) {
        throw new Error(
            'GOOGLE_CLIENT_ID est manquant dans les variables d’environnement'
        );
    }

    const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );

    if (!response.ok) {
        const errorText = await response.text();

        console.error('[Google] tokeninfo rejected:', errorText);

        throw new Error('Token Google invalide');
    }

    const payload = await response.json();

    console.log('[Google] Token information:', {
        aud: payload.aud,
        azp: payload.azp,
        email: payload.email,
        sub: payload.sub,
        iss: payload.iss,
    });

    // Vérification de l'émetteur
    if (
        payload.iss !== 'https://accounts.google.com' &&
        payload.iss !== 'accounts.google.com'
    ) {
        throw new Error('Émetteur Google invalide');
    }

    // Vérification de l'audience
    if (payload.aud !== clientId) {
        console.error('[Google] Audience incorrecte:', {
            received: payload.aud,
            expected: clientId,
        });

        throw new Error('Audience Google invalide');
    }

    if (!payload.email) {
        throw new Error('Email Google manquant');
    }

    if (!payload.sub) {
        throw new Error('Identifiant Google manquant');
    }

    return payload;
}

function buildUniqueUsername(baseUsername) {
    const normalized = String(baseUsername || 'user')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 30);

    return normalized || 'user';
}

const registerSchema = Joi.object({
    username: Joi.string().min(3).max(30).pattern(/^[a-zA-Z0-9_]+$/).required(),
    email: Joi.string().email().required(),
    password: passwordRule.required(),
    device: Joi.string().min(2).max(100).required(),
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
    code: Joi.string().length(6).required(),
    newPassword: passwordRule.required(),
});

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: passwordRule.required(),
});

router.post('/register', registerLimiter, async (req, res) => {
    console.log('=== REGISTER START ===');

    try {
        const { value, error } = registerSchema.validate(req.body);

        if (error) {
            console.log('Validation error:', error.message);
            return res.status(400).json({
                message: error.message,
            });
        }

        console.log('Validation OK');

        const existingByEmail = await User.findOne({
            where: { email: value.email }
        });

        const existingByUsername = await User.findOne({
            where: { username: value.username }
        });

        if (existingByEmail) {
            if (existingByEmail.is_verified) {
                console.log('Email already exists and verified');
                return res.status(409).json({
                    message: 'Cet email est déjà utilisé par un autre compte'
                });
            } else {
                if (existingByUsername && existingByUsername.id !== existingByEmail.id) {
                    console.log('Username already exists');
                    return res.status(409).json({
                        message: 'Ce nom d’utilisateur est déjà pris'
                    });
                }
                
                if (existingByEmail.verification_attempts >= 5) {
                    return res.status(429).json({
                        message: 'Trop de tentatives. Veuillez patienter ou demander un nouveau code.'
                    });
                }

                console.log('User not verified, updating and resending code...');
                const password_hash = await bcrypt.hash(value.password, 10);
                const otpCode = generateOtpCode();

                await existingByEmail.update({
                    username: value.username,
                    password_hash,
                    device: value.device,
                    verification_code: otpCode,
                    verification_code_expires_at: getOtpExpiration(10),
                    verification_attempts: existingByEmail.verification_attempts + 1,
                });

                try {
                    console.log('Sending verification email...');
                    await sendVerificationCodeEmail(existingByEmail.email, otpCode);
                    console.log('Verification email sent');
                } catch (emailError) {
                    console.error('EMAIL ERROR:', emailError);
                }

                return res.status(201).json({
                    success: true,
                    message: 'Inscription mise à jour. Vérifiez votre email avec le nouveau code envoyé.',
                    user: {
                        id: existingByEmail.id,
                        username: existingByEmail.username,
                        email: existingByEmail.email,
                        is_verified: existingByEmail.is_verified,
                    },
                });
            }
        }

        if (existingByUsername) {
            console.log('Username already exists');
            return res.status(409).json({
                message: 'Ce nom d’utilisateur est déjà pris'
            });
        }

        console.log('Creating user...');

        const password_hash = await bcrypt.hash(value.password, 10);
        const otpCode = generateOtpCode();

        const user = await User.create({
            username: value.username,
            email: value.email,
            password_hash,
            device: value.device,
            is_verified: false,
            verification_code: otpCode,
            verification_code_expires_at: getOtpExpiration(10),
            verification_attempts: 0,
        });

        console.log('User created:', user.id);

        try {
            console.log('Sending verification email...');
            await sendVerificationCodeEmail(user.email, otpCode);
            console.log('Verification email sent');
        } catch (emailError) {
            console.error('EMAIL ERROR:', emailError);
        }

        console.log('Sending response to client...');

        return res.status(201).json({
            success: true,
            message: 'Inscription effectuée. Vérifiez votre email avec le code envoyé.',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                is_verified: user.is_verified,
            },
        });

    } catch (e) {
        console.error('REGISTER ERROR');
        console.error(e);
        console.error(e.stack);

        return res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de l’inscription',
            error: e.message,
        });
    }
});

router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password, device } = req.body;
        if (!device || String(device).trim() === '') {
            return res.status(400).json({ message: 'Le champ device est obligatoire' });
        }
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ message: 'Aucun compte associé à cet email' });
        if (user.is_banned) return res.status(403).json({ message: 'Votre compte a été banni. Contactez le support pour plus d’informations.' });
        if (isTemporaryBlockActive(user)) return res.status(403).json({ message: `Votre compte est temporairement bloqué jusqu’au ${new Date(user.blocked_until).toLocaleDateString('fr-FR')}`, blocked_until: user.blocked_until, reason: user.block_reason });
        if (!user.is_verified) return res.status(403).json({ message: 'Votre compte n’est pas encore vérifié. Consultez votre boîte mail pour le code de vérification.' });
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ message: 'Mot de passe incorrect' });
        await user.update({ device: String(device).trim() });
        const session = await createSession(user, req, device);
        const accessToken = generateAccessToken(user, session);
        const refreshToken = generateRefreshToken(user, session);
        res.json({ accessToken, refreshToken, user: { id: user.id, username: user.username, email: user.email, role: user.role, status: user.status, is_verified: user.is_verified, device: user.device } });
    } catch (e) {
        console.error('[auth:login]', e.message);
        res.status(500).json({ message: 'Erreur serveur lors de la connexion', error: e.message });
    }
});

router.post('/google', async (req, res) => {
    try {
        const { credential, device } = req.body || {};
        if (!device || String(device).trim() === '') {
            return res.status(400).json({ message: 'Le champ device est obligatoire' });
        }

        const payload = await verifyGoogleCredential(credential);
        const email = String(payload.email).trim().toLowerCase();
        const normalizedDevice = String(device).trim();

        let user = await User.findOne({ where: { google_sub: payload.sub } });
        if (!user) {
            user = await User.findOne({ where: { email } });
        }

        if (!user) {
            const baseUsername = buildUniqueUsername(payload.name || payload.given_name || email.split('@')[0]);
            let username = baseUsername;
            let index = 1;

            while (await User.findOne({ where: { username } })) {
                username = `${baseUsername}${index}`;
                index += 1;
            }

            const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
            user = await User.create({
                username,
                email,
                password_hash: passwordHash,
                auth_provider: 'google',
                google_sub: payload.sub,
                device: normalizedDevice,
                is_verified: true,
                status: 'user',
            });
        } else {
            await user.update({
                email,
                auth_provider: 'google',
                google_sub: payload.sub,
                is_verified: true,
                device: normalizedDevice,
            });
        }

        if (user.is_banned) {
            return res.status(403).json({ message: 'Votre compte a été banni. Contactez le support pour plus d’informations.' });
        }
        if (isTemporaryBlockActive(user)) {
            return res.status(403).json({ message: `Votre compte est temporairement bloqué jusqu’au ${new Date(user.blocked_until).toLocaleDateString('fr-FR')}`, blocked_until: user.blocked_until, reason: user.block_reason });
        }

        const session = await createSession(user, req, normalizedDevice);
        const accessToken = generateAccessToken(user, session);
        const refreshToken = generateRefreshToken(user, session);

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                status: user.status,
                is_verified: user.is_verified,
                device: user.device,
                auth_provider: user.auth_provider,
            },
        });
    } catch (e) {
        console.error('[auth:google]', e.message);
        res.status(401).json({ message: 'Connexion Google invalide ou refusée', error: e.message });
    }
});

router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
    try {
        const { value, error } = forgotPasswordSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.message });

        const user = await User.findOne({ where: { email: value.email } });
        if (!user) return res.status(200).json({ message: 'Si un compte correspond à cet e-mail, un code a été envoyé.' });

        const code = generateOtpCode();
        await user.update({
            password_reset_code: code,
            password_reset_code_expires_at: getOtpExpiration(10),
            password_reset_attempts: 0,
        });

        try {
            await sendPasswordResetCodeEmail(user.email, code);
        } catch (emailError) {
            console.warn('Password reset email could not be sent:', emailError.message);
        }

        res.json({ message: 'Si un compte correspond à cet e-mail, un code a été envoyé.' });
    } catch (e) {
        console.error('[auth:forgot-password]', e.message);
        res.status(500).json({ message: 'Erreur serveur lors de la demande de réinitialisation', error: e.message });
    }
});

router.post('/reset-password', passwordResetLimiter, async (req, res) => {
    try {
        const { value, error } = resetPasswordSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.message });

        const user = await User.findOne({ where: { email: value.email } });
        if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

        if (user.password_reset_attempts >= 5) {
            return res.status(403).json({ message: 'Trop de tentatives. Demandez un nouveau code.' });
        }

        const now = new Date();
        if (!user.password_reset_code_expires_at || new Date(user.password_reset_code_expires_at) < now) {
            return res.status(410).json({ message: 'Code expiré. Demandez un nouveau code.' });
        }

        if (String(user.password_reset_code) !== String(value.code)) {
            await user.update({ password_reset_attempts: user.password_reset_attempts + 1 });
            return res.status(401).json({ message: 'Code invalide' });
        }

        const password_hash = await bcrypt.hash(value.newPassword, 10);
        await user.update({
            password_hash,
            password_reset_code: null,
            password_reset_code_expires_at: null,
            password_reset_attempts: 0,
        });
        await UserSession.update({ revoked_at: new Date() }, { where: { user_id: user.id, revoked_at: null } });

        try {
            await sendPasswordChangedEmail(user);
        } catch (emailError) {
            console.warn('Password changed email could not be sent:', emailError.message);
        }

        res.json({ message: 'Mot de passe réinitialisé avec succès.' });
    } catch (e) {
        console.error('[auth:reset-password]', e.message);
        res.status(500).json({ message: 'Erreur serveur lors de la réinitialisation du mot de passe', error: e.message });
    }
});

router.post('/change-password', authMiddleware, requireNotBanned, async (req, res) => {
    try {
        const { value, error } = changePasswordSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.message });

        const valid = await bcrypt.compare(value.currentPassword, req.user.password_hash);
        if (!valid) return res.status(401).json({ message: 'Mot de passe actuel invalide' });

        const password_hash = await bcrypt.hash(value.newPassword, 10);
        await req.user.update({ password_hash });

        try {
            await sendPasswordChangedEmail(req.user);
        } catch (emailError) {
            console.warn('Password changed email could not be sent:', emailError.message);
        }

        res.json({ message: 'Mot de passe modifié avec succès.' });
    } catch (e) {
        console.error('[auth:change-password]', e.message);
        res.status(500).json({ message: 'Erreur serveur lors du changement de mot de passe', error: e.message });
    }
});

router.post('/send-verification-code', otpLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email requis' });
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
        if (user.is_verified) return res.status(400).json({ message: 'Compte déjà vérifié' });

        const code = generateOtpCode();
        await user.update({
            verification_code: code,
            verification_code_expires_at: getOtpExpiration(10),
            verification_attempts: 0,
        });

        await sendVerificationCodeEmail(user.email, code);
        res.json({ message: 'Code envoyé' });
    } catch (e) {
        console.error('[auth:send-verification-code]', e.message);
        res.status(500).json({ message: 'Échec de l’envoi du code de vérification', error: e.message });
    }
});

router.post('/verify-email', otpLimiter, async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) return res.status(400).json({ message: 'Email et code requis' });

        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
        if (user.is_verified) return res.status(400).json({ message: 'Compte déjà vérifié' });

        if (user.verification_attempts >= 5) {
            return res.status(403).json({ message: 'Trop de tentatives. Demandez un nouveau code.' });
        }

        const now = new Date();
        if (!user.verification_code_expires_at || new Date(user.verification_code_expires_at) < now) {
            return res.status(410).json({ message: 'Code expiré. Demandez un nouveau code.' });
        }

        if (String(user.verification_code) !== String(code)) {
            await user.update({ verification_attempts: user.verification_attempts + 1 });
            return res.status(401).json({ message: 'Code invalide' });
        }

        await user.update({
            is_verified: true,
            verification_code: null,
            verification_code_expires_at: null,
            verification_attempts: 0,
        });

        try {
            await sendWelcomeEmail(user);
        } catch (emailError) {
            console.warn('Welcome/verification email could not be sent:', emailError.message);
        }

        const session = await createSession(user, req, user.device);
        const accessToken = generateAccessToken(user, session);
        const refreshToken = generateRefreshToken(user, session);

        res.json({
            message: 'Email vérifié avec succès. Bienvenue !',
            accessToken,
            refreshToken,
            user: { id: user.id, username: user.username, email: user.email, role: user.role, status: user.status, is_verified: true },
        });
    } catch (e) {
        console.error('[auth:verify-email]', e.message);
        res.status(500).json({ message: 'Erreur serveur lors de la vérification de l’email', error: e.message });
    }
});

router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token manquant' });
    try {
        const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findByPk(decoded.id);
        if (!user || user.is_banned) return res.status(403).json({ message: 'Utilisateur inaccessible' });
        const session = decoded.sid ? await validateSession(decoded.sid, user.id) : null;
        if (decoded.sid && !session) return res.status(401).json({ message: 'Session expirée ou révoquée' });
        const accessToken = generateAccessToken(user, session);
        res.json({ accessToken });
    } catch (e) {
        res.status(401).json({ message: 'Refresh token invalide' });
    }
});

router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body || {};
    if (refreshToken) {
        try {
            const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
            if (decoded.sid) await UserSession.update({ revoked_at: new Date() }, { where: { id: decoded.sid, user_id: decoded.id, revoked_at: null } });
        } catch (_error) {
            // Logout is deliberately idempotent and must not disclose token details.
        }
    }
    res.json({ message: 'Déconnecté' });
});

module.exports = router;
