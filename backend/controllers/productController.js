// controllers/productController.js
const Product = require('../models/Product');

// Liste publique : seuls les champs utiles au catalogue sont exposés
exports.getProducts = async (req, res) => {
  const products = await Product.find().select('name price description stock').sort({ name: 1 });
  res.json(products);
};
