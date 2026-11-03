// backend/routes/adminRoutes.js
const express = require('express');
const {
  getOrders,
  updateOrderStatus,
  validateOrder,
  getProducts,
  updateProductStock,
} = require('../controllers/adminController');
const { authenticateToken, isAdmin } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const schemas = require('../validators/schemas');

const router = express.Router();

// Toutes les routes de ce fichier sont réservées aux administrateurs
router.use(authenticateToken, isAdmin);

// Récupérer la liste des commandes
router.get('/orders', asyncHandler(getOrders));

// Changer l'état d'une commande
router.put(
  '/orders/:id/status',
  validate(schemas.idParam, 'params'),
  validate(schemas.orderStatus),
  asyncHandler(updateOrderStatus)
);

// Valider une commande
router.put('/orders/:id/validate', validate(schemas.idParam, 'params'), asyncHandler(validateOrder));

// Récupérer la liste des produits
router.get('/products', asyncHandler(getProducts));

// Mettre à jour le stock d'un produit
router.put(
  '/products/:id/stock',
  validate(schemas.idParam, 'params'),
  validate(schemas.productStock),
  asyncHandler(updateProductStock)
);

module.exports = router;
