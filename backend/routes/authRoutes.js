// backend/routes/authRoutes.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, logout, me, register } = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const schemas = require('../validators/schemas');

const router = express.Router();

// Protection contre la force brute : 10 tentatives / 15 min / IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT) || 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Trop de tentatives, réessayez dans quelques minutes.' },
});

router.post('/login', authLimiter, validate(schemas.login), asyncHandler(login));
router.post('/register', authLimiter, validate(schemas.register), asyncHandler(register));
router.post('/logout', logout);
router.get('/me', authenticateToken, asyncHandler(me));

module.exports = router;
