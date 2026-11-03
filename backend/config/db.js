// config/db.js
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const debug = require('debug')('app:db');

// Neutralise les opérateurs MongoDB ($gt, $ne…) injectés dans les filtres de requête (injection NoSQL)
mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

mongoose.connection.on('disconnected', () => logger.warn('MongoDB déconnecté'));
mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnecté'));

const connectDB = async () => {
  // Seul l'hôte est affiché : l'URI complète peut contenir des identifiants
  debug('Connexion à MongoDB sur %s', process.env.MONGO_URI.replace(/^.*@/, '').replace(/^mongodb(\+srv)?:\/\//, ''));
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10_000 });
  logger.info('MongoDB connecté', { db: mongoose.connection.name });
};

module.exports = connectDB;
