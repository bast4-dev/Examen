// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const checkEnv = require('./config/env');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const requestLogger = require('./middlewares/requestLogger');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

checkEnv();

const app = express();

// Derrière un reverse proxy (Nginx, Traefik…) : nécessaire pour la vraie IP client et le rate limiting
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL.split(',').map((url) => url.trim()),
    credentials: true, // autorise l'envoi du cookie d'authentification
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(requestLogger);

// Sonde de supervision (uptime, état de la base)
app.get('/api/health', (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({ status: dbUp ? 'ok' : 'degraded', db: dbUp ? 'up' : 'down', uptime: Math.round(process.uptime()) });
});

app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => logger.info(`Serveur en écoute sur le port ${PORT}`, { env: process.env.NODE_ENV || 'development' }));
  })
  .catch((error) => {
    logger.error('Connexion MongoDB impossible, arrêt du serveur', { error: error.message });
    process.exit(1);
  });

process.on('unhandledRejection', (reason) => logger.error('Promesse rejetée non gérée', { reason: String(reason) }));

module.exports = app;
