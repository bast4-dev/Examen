// backend/routes/orderRoutes.js
const express = require('express');
const { createOrder, getMyOrders } = require('../controllers/orderController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const schemas = require('../validators/schemas');

const router = express.Router();

// Accès réservé aux utilisateurs connectés (les routes d'administration sont dans adminRoutes.js)
router.use(authenticateToken);
router.get('/mine', asyncHandler(getMyOrders));
router.post('/', validate(schemas.createOrder), asyncHandler(createOrder));

module.exports = router;
