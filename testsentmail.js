require('dotenv').config();
const dns = require('dns');
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}
const nodemailer = require('nodemailer');

async function testSMTP() {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      family: 4,
    });

    console.log('Connexion SMTP...');

    await transporter.verify();

    console.log('✅ SMTP connecté');

    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: 'Test SMTP Gmail',
      text: 'Test SMTP OK',
      html: '<h1>Test SMTP OK</h1><p>Le serveur SMTP fonctionne.</p>',
    });

    console.log('✅ Email envoyé');
    console.log('Message ID :', info.messageId);

  } catch (error) {
    console.error('❌ Erreur SMTP');
    console.error(error);
  }
}

testSMTP();