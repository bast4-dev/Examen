// backend/middlewares/requestLogger.js
// Journal d'accès : une ligne par requête HTTP (méthode, route, statut, durée, IP, utilisateur)
const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger.log(level, 'http', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs),
      ip: req.ip,
      userId: req.user?.userId,
    });
  });

  next();
};
