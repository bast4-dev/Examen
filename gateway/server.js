// gateway/server.js
const express = require('express');
const helmet = require('helmet');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

if (!process.env.INTERNAL_API_KEY) {
  console.error("INTERNAL_API_KEY manquante : le gateway refuse de démarrer sans authentification");
  process.exit(1);
}

const notifiProxy = require('./routes/notifi');
const stockProxy = require('./routes/stock');

const app = express();
app.use(helmet());

// Sonde de supervision (sans authentification)
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'gateway', uptime: Math.round(process.uptime()) }));

// Seuls les services internes (backend) possédant la clé d'API peuvent appeler les microservices
const expectedKey = Buffer.from(process.env.INTERNAL_API_KEY);
app.use((req, res, next) => {
  const key = Buffer.from(req.get('x-api-key') || '');
  if (key.length !== expectedKey.length || !crypto.timingSafeEqual(key, expectedKey)) {
    console.warn(`[gateway] accès refusé ${req.method} ${req.originalUrl} depuis ${req.ip}`);
    return res.status(401).json({ message: 'Clé API invalide' });
  }
  next();
});

// Routes principales pour chaque microservice (le corps de la requête est relayé tel quel)
app.use('/notify', notifiProxy);
app.use('/update-stock', stockProxy);

app.use((req, res) => res.status(404).json({ message: 'Route inconnue' }));

// Lancer le Gateway
const PORT = process.env.GATEWAY_PORT || 8000;
app.listen(PORT, () => {
  console.log(`Gateway opérationnel sur le port ${PORT}`);
});
