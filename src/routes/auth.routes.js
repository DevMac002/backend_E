const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const { User, RoleChangeLog } = require('../models');
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

const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).pattern(/^[a-zA-Z0-9_]+$/).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(72).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/).required(),
  device: Joi.string().min(2).max(100).required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { value, error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const existingByEmail = await User.findOne({ where: { email: value.email } });
    const existingByUsername = await User.findOne({ where: { username: value.username } });
    if (existingByEmail || existingByUsername) {
      return res.status(409).json({ message: 'Un compte avec cet email ou ce nom d’utilisateur existe déjà' });
    }

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

    try {
      await sendVerificationCodeEmail(user.email, otpCode);
    } catch (emailError) {
      console.warn('Verification email could not be sent:', emailError.message);
    }

    res.status(201).json({
      message: 'Inscription effectuée. Vérifiez votre email avec le code envoyé.',
      user: { id: user.id, username: user.username, email: user.email, is_verified: user.is_verified },
    });
  } catch (e) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password, device } = req.body;
    if (!device || String(device).trim() === '') {
      return res.status(400).json({ message: 'Le champ device est obligatoire' });
    }
    const user = await User.findOne({ where: { email } });
    if (!user || user.is_banned) return res.status(401).json({ message: 'Identifiants invalides' });
    if (isTemporaryBlockActive(user)) return res.status(403).json({ message: 'Compte temporairement bloqué', blocked_until: user.blocked_until, reason: user.block_reason });
    if (!user.is_verified) return res.status(403).json({ message: 'Compte non vérifié. Vérifiez votre email.' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Identifiants invalides' });
    await user.update({ device: String(device).trim() });
    const session = await createSession(user, req, device);
    const accessToken = generateAccessToken(user, session);
    const refreshToken = generateRefreshToken(user, session);
    res.json({ accessToken, refreshToken, user: { id: user.id, username: user.username, email: user.email, role: user.role, status: user.status, is_verified: user.is_verified, device: user.device } });
  } catch (e) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.post('/forgot-password', async (req, res) => {
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
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.post('/reset-password', async (req, res) => {
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

    try {
      await sendPasswordChangedEmail(user);
    } catch (emailError) {
      console.warn('Password changed email could not be sent:', emailError.message);
    }

    res.json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (e) {
    res.status(500).json({ message: 'Erreur serveur' });
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
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.post('/send-verification-code', async (req, res) => {
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
    res.status(500).json({ message: 'Échec de l’envoi du code' });
  }
});

router.post('/verify-email', async (req, res) => {
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
    res.status(500).json({ message: 'Erreur serveur' });
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

router.post('/logout', (_req, res) => res.json({ message: 'Déconnecté' }));

module.exports = router;
