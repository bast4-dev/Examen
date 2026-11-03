// controllers/productController.js
const Product = require('../models/Product');

/**
 * Catalogue public : seuls les champs utiles sont exposés.
 * @route GET /api/products
 */
exports.getProducts = async (req, res) => {
  const products = await Product.find().select('name price description stock').sort({ name: 1 });
  res.json(products);
};
