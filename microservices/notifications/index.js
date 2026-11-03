// microservices/notifications/index.js
const express = require('express');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

const { EMAIL_USER, EMAIL_APPLICATION_PASSWORD, INTERNAL_API_KEY } = process.env;
if (!EMAIL_USER || !EMAIL_APPLICATION_PASSWORD || !INTERNAL_API_KEY) {
  console.error(
    'Configuration incomplète : EMAIL_USER, EMAIL_APPLICATION_PASSWORD et INTERNAL_API_KEY sont obligatoires'
  );
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));

// Configuration de Nodemailer (les identifiants ne sont jamais journalisés)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: EMAIL_USER, pass: EMAIL_APPLICATION_PASSWORD },
});

app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'notifications', uptime: Math.round(process.uptime()) })
);

// Défense en profondeur : la clé est revérifiée même derrière le gateway
const expectedKey = Buffer.from(INTERNAL_API_KEY);
app.use((req, res, next) => {
  const key = Buffer.from(req.get('x-api-key') || '');
  if (key.length !== expectedKey.length || !crypto.timingSafeEqual(key, expectedKey)) {
    return res.status(401).json({ message: 'Clé API invalide' });
  }
  next();
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Route pour envoyer un email
app.post('/notify', async (req, res) => {
  const { to, subject, text } = req.body || {};

  if (typeof to !== 'string' || !EMAIL_REGEX.test(to) || to.length > 254) {
    return res.status(400).json({ message: 'Destinataire invalide.' });
  }
  if (typeof subject !== 'string' || !subject.trim() || subject.length > 200 || /[\r\n]/.test(subject)) {
    return res.status(400).json({ message: 'Sujet invalide.' });
  }
  if (typeof text !== 'string' || !text.trim() || text.length > 10_000) {
    return res.status(400).json({ message: 'Contenu invalide.' });
  }

  try {
    await transporter.sendMail({ from: EMAIL_USER, to, subject, text });
    console.log(`Email envoyé : « ${subject} »`);
    return res.status(200).json({ message: 'Email envoyé avec succès.' });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email :", error.message);
    return res.status(502).json({ message: "Erreur lors de l'envoi de l'email." });
  }
});

// Lancer le service Notification
const PORT = process.env.NOTIFI_PORT || 4002;
app.listen(PORT, () => {
  console.log(`Service de notification en écoute sur le port ${PORT}`);
});
