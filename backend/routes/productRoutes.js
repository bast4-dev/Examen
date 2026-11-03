// routes/productRoutes.js
const express = require('express');
const { getProducts } = require('../controllers/productController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Catalogue public (la mise à jour du stock est réservée à /api/admin)
router.get('/', asyncHandler(getProducts));

module.exports = router;
