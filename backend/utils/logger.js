// backend/utils/logger.js
// Journalisation structurée (JSON) : console + fichiers (logs/error.log, logs/combined.log)
const path = require('path');
const winston = require('winston');

const { combine, timestamp, errors, json, colorize, simple } = winston.format;
const isProduction = process.env.NODE_ENV === 'production';
const logDir = process.env.LOG_DIR || path.join(__dirname, '..', 'logs');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: combine(timestamp(), errors({ stack: true }), json()),
  defaultMeta: { service: 'backend' },
  transports: [
    new winston.transports.Console({
      format: isProduction ? combine(timestamp(), json()) : combine(colorize(), simple()),
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5_000_000,
      maxFiles: 5,
    }),
    new winston.transports.File({ filename: path.join(logDir, 'combined.log'), maxsize: 5_000_000, maxFiles: 5 }),
  ],
});

module.exports = logger;
