// backend/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

// Le JWT est lu dans un cookie HttpOnly (inaccessible au JavaScript du navigateur, donc protégé du vol par XSS)
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

exports.isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Accès interdit' });
  next();
};
