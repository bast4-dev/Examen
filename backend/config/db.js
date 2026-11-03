// config/db.js
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Neutralise les opérateurs MongoDB ($gt, $ne…) injectés dans les filtres de requête (injection NoSQL)
mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

mongoose.connection.on('disconnected', () => logger.warn('MongoDB déconnecté'));
mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnecté'));

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10_000 });
  logger.info('MongoDB connecté', { db: mongoose.connection.name });
};

module.exports = connectDB;
