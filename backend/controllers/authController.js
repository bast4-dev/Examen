// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const HttpError = require('../utils/httpError');
const { sendEmail } = require('../services/notificationService');
// Traces de développement (DEBUG=app:*) : jamais de mot de passe ni de token
const debug = require('debug')('app:auth');

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 heure

const cookieOptions = () => ({
  httpOnly: true, // inaccessible depuis JavaScript (protection XSS)
  secure: process.env.NODE_ENV === 'production', // HTTPS uniquement en production
  sameSite: 'strict', // non envoyé par des sites tiers (protection CSRF)
  path: '/',
  ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN }),
});

/**
 * Connecte un utilisateur et pose le JWT dans un cookie HttpOnly.
 * @route POST /api/auth/login
 * @param {express.Request} req - body : { username, password } (validé par Joi)
 * @param {express.Response} res - 200 { username, role } | 401 Identifiants invalides
 */
exports.login = async (req, res) => {
  const { username, password } = req.body;
  debug('Tentative de connexion : %s', username);

  const user = await User.findOne({ username });
  // Même réponse que l'utilisateur existe ou non (pas d'énumération des comptes)
  if (!user || !(await user.comparePassword(password))) {
    logger.warn('Échec de connexion', { username, ip: req.ip });
    throw new HttpError(401, 'Identifiants invalides');
  }

  const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: TOKEN_TTL_MS / 1000,
    algorithm: 'HS256',
  });

  debug('Jeton émis pour %s (rôle %s), valable %d min', user.username, user.role, TOKEN_TTL_MS / 60000);
  res.cookie('token', token, { ...cookieOptions(), maxAge: TOKEN_TTL_MS });
  logger.info('Connexion réussie', { userId: user._id, role: user.role });
  res.json({ username: user.username, role: user.role });
};

/**
 * Déconnecte l'utilisateur en supprimant le cookie de session.
 * @route POST /api/auth/logout
 */
exports.logout = (req, res) => {
  res.clearCookie('token', cookieOptions());
  res.json({ message: 'Déconnecté' });
};

/**
 * Renvoie l'utilisateur de la session en cours (le cookie n'est pas lisible en JavaScript).
 * @route GET /api/auth/me
 * @returns {{username: string, email: string, role: string}}
 */
exports.me = async (req, res) => {
  const user = await User.findById(req.user.userId).select('username email role');
  if (!user) throw new HttpError(401, 'Session invalide');
  res.json({ username: user.username, email: user.email, role: user.role });
};

/**
 * Inscrit un nouvel utilisateur (rôle toujours « user ») et envoie un e-mail de bienvenue.
 * @route POST /api/auth/register
 * @param {express.Request} req - body : { username, email, password }
 * @param {express.Response} res - 201 | 409 si le nom ou l'email existe déjà
 */
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw new HttpError(409, "Ce nom d'utilisateur ou cet email est déjà utilisé.");
  }

  // Le rôle n'est jamais repris de la requête : tout nouveau compte est un simple utilisateur
  const user = await User.create({ username, email, password });
  logger.info('Nouvel utilisateur inscrit', { userId: user._id });

  sendEmail({
    to: email,
    subject: 'Bienvenue dans notre application',
    text: `Bonjour ${username},\n\nMerci de vous être inscrit. Nous sommes ravis de vous accueillir !`,
  });

  res.status(201).json({ message: 'Utilisateur créé avec succès.' });
};
