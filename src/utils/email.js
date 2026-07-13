const nodemailer = require('nodemailer');

const smtpUser = process.env.SMTP_USER || '';
const normalizedSmtpUser = smtpUser.includes('@') ? smtpUser : `${smtpUser}@gmail.com`;
const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: normalizedSmtpUser,
    pass: smtpPass,
  },
});

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEmailTemplate({
  title = 'Epika Social',
  preheader = '',
  greeting = 'Bonjour,',
  message = '',
  highlightLabel = '',
  highlightValue = '',
  ctaLabel = '',
  ctaHref = '',
  secondaryText = '',
  footerNote = '',
}) {
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br />');
  const highlightBlock = highlightValue
    ? `
      <div style="margin:24px 0;border:1px solid #e2e8f0;border-radius:14px;padding:18px 20px;background:#f8fafc;text-align:center;">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.2em;color:#64748b;margin-bottom:8px;">${escapeHtml(highlightLabel)}</div>
        <div style="font-size:30px;font-weight:700;letter-spacing:0.18em;color:#111827;">${escapeHtml(highlightValue)}</div>
      </div>`
    : '';
  const ctaBlock = ctaLabel && ctaHref
    ? `<div style="margin:20px 0 8px;"><a href="${escapeHtml(ctaHref)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:600;">${escapeHtml(ctaLabel)}</a></div>`
    : '';
  const secondaryBlock = secondaryText ? `<p style="margin-top:16px;font-size:13px;color:#64748b;">${escapeHtml(secondaryText)}</p>` : '';

  return `
    <div style="background:#f4f7fb;padding:24px 0;font-family:Inter, Arial, sans-serif;color:#101828;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,0.08);">
        <div style="background:linear-gradient(135deg,#312e81,#7c3aed 55%,#2563eb);padding:28px 24px;">
          <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:rgba(255,255,255,0.8);margin-bottom:8px;">Epika Social</div>
          <h1 style="margin:0;color:#ffffff;font-size:26px;">${escapeHtml(title)}</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">${escapeHtml(preheader || title)}</p>
        </div>
        <div style="padding:28px 24px 32px;">
          <p style="margin:0 0 12px;font-size:15px;color:#344054;">${escapeHtml(greeting)}</p>
          <div style="font-size:15px;line-height:1.7;color:#475467;">${safeMessage}</div>
          ${highlightBlock}
          ${ctaBlock}
          ${secondaryBlock}
        </div>
        <div style="padding:0 24px 24px;font-size:12px;color:#94a3b8;">
          <p style="margin:0;">${escapeHtml(footerNote || 'Merci pour votre confiance, l’équipe Epika Social.')}</p>
        </div>
      </div>
    </div>`;
}

async function sendMail({ to, subject, html, text }) {
  if (!normalizedSmtpUser || !smtpPass) {
    console.warn('SMTP credentials not configured. Email not sent.');
    return { ok: false, reason: 'missing_credentials' };
  }

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || normalizedSmtpUser,
    to,
    subject,
    html,
    text,
  });

  return { ok: true, messageId: info.messageId };
}

async function sendWelcomeEmail(user) {
  const appUrl = process.env.APP_URL || 'https://epika-social.app';
  return sendMail({
    to: user.email,
    subject: 'Bienvenue sur Epika Social',
    text: `Bonjour ${user.username},\n\nBienvenue sur Epika Social. Merci pour votre inscription.`,
    html: buildEmailTemplate({
      title: 'Bienvenue à bord',
      preheader: 'Votre espace de communauté chrétienne est prêt.',
      greeting: `Bonjour ${user.username},`,
      message: 'Merci pour votre inscription sur Epika Social. Votre compte est maintenant prêt à être utilisé et vous pouvez commencer à explorer la communauté.',
      ctaLabel: 'Ouvrir l’application',
      ctaHref: appUrl,
      secondaryText: 'Si vous avez des questions, notre équipe est là pour vous aider.',
    }),
  });
}

async function sendVerificationCodeEmail(email, code) {
  return sendMail({
    to: email,
    subject: 'Code de vérification Epika Social',
    text: `Votre code de vérification est : ${code}`,
    html: buildEmailTemplate({
      title: 'Vérification de votre compte',
      preheader: 'Utilisez ce code pour valider votre inscription.',
      greeting: 'Bonjour,',
      message: 'Pour sécuriser votre inscription sur Epika Social, veuillez utiliser le code ci-dessous. Ce code est valable 10 minutes.',
      highlightLabel: 'Code de vérification',
      highlightValue: code,
      secondaryText: 'Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet e-mail.',
    }),
  });
}

async function sendAccountVerifiedEmail(user) {
  return sendMail({
    to: user.email,
    subject: 'Compte vérifié avec succès',
    text: `Bonjour ${user.username},\n\nVotre compte a été vérifié avec succès. Bienvenue sur Epika Social.`,
    html: buildEmailTemplate({
      title: 'Compte vérifié',
      preheader: 'Votre accès à Epika Social est activé.',
      greeting: `Bonjour ${user.username},`,
      message: 'Votre compte a été vérifié avec succès. Vous pouvez désormais vous connecter, rejoindre des groupes et interagir avec la communauté.',
    }),
  });
}

async function sendPasswordResetCodeEmail(email, code) {
  return sendMail({
    to: email,
    subject: 'Réinitialisation de votre mot de passe',
    text: `Votre code de réinitialisation est : ${code}`,
    html: buildEmailTemplate({
      title: 'Réinitialisation du mot de passe',
      preheader: 'Utilisez ce code pour définir un nouveau mot de passe.',
      greeting: 'Bonjour,',
      message: 'Une demande de réinitialisation de mot de passe a été envoyée pour votre compte Epika Social. Veuillez utiliser le code ci-dessous pour continuer.',
      highlightLabel: 'Code de réinitialisation',
      highlightValue: code,
      secondaryText: 'Ce code est valable 10 minutes. Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.',
    }),
  });
}

async function sendPasswordChangedEmail(user) {
  return sendMail({
    to: user.email,
    subject: 'Mot de passe modifié',
    text: `Bonjour ${user.username},\n\nVotre mot de passe a été modifié avec succès.`,
    html: buildEmailTemplate({
      title: 'Mot de passe mis à jour',
      preheader: 'Votre mot de passe a été changé avec succès.',
      greeting: `Bonjour ${user.username},`,
      message: 'Votre mot de passe a été modifié avec succès. Si vous n’êtes pas à l’origine de cette action, contactez immédiatement l’équipe de sécurité.',
    }),
  });
}

module.exports = {
  buildEmailTemplate,
  sendMail,
  sendWelcomeEmail,
  sendVerificationCodeEmail,
  sendAccountVerifiedEmail,
  sendPasswordResetCodeEmail,
  sendPasswordChangedEmail,
};
