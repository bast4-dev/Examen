// backend/middlewares/errorHandler.js
const logger = require('../utils/logger');

exports.notFound = (req, res) => {
  res.status(404).json({ message: 'Ressource introuvable' });
};

// Middleware d'erreur centralisé : ne renvoie jamais le détail technique d'une erreur 500 au client
// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message;

  if (err.type === 'entity.parse.failed') {
    message = 'Corps de requête JSON invalide';
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Identifiant invalide';
  } else if (err.code === 11000) {
    status = 409;
    message = 'Cette ressource existe déjà';
  }

  const context = { method: req.method, path: req.originalUrl, status, userId: req.user?.userId };
  if (status >= 500) {
    logger.error(err.message, { ...context, stack: err.stack });
    message = 'Erreur serveur';
  } else {
    logger.warn(message, context);
  }

  res.status(status).json({ message });
};
