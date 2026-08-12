require('dotenv').config();
const dns = require('dns');
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}
const nodemailer = require('nodemailer');

async function testSMTP() {
  try {
    const port = Number(process.env.SMTP_PORT || 465);
    const isSecure = process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === 'true'
      : port === 465;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: isSecure,
      requireTLS: !isSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      family: 4,
      lookup: (hostname, options, callback) => {
        return dns.lookup(hostname, { ...options, family: 4 }, callback);
      },
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