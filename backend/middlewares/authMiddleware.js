// backend/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

/**
 * Vérifie le JWT lu dans le cookie HttpOnly et place son contenu dans req.user.
 * Répond 401 si le cookie est absent, invalide ou expiré.
 * @type {express.RequestHandler}
 */
exports.authenticateToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Authentification requise' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    next();
  } catch {
    return res.status(401).json({ message: 'Session invalide ou expirée' });
  }
};

/**
 * Autorise uniquement les utilisateurs de rôle « admin » (403 sinon). À placer après authenticateToken.
 * @type {express.RequestHandler}
 */
exports.isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Accès interdit' });
  next();
};
