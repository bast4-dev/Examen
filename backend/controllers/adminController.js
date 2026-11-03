// backend/controllers/adminController.js
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const logger = require('../utils/logger');
const HttpError = require('../utils/httpError');
const { sendEmail, notifyStockUpdate } = require('../services/notificationService');
const { releaseStock } = require('./orderController');

/**
 * Informe le client du nouveau statut de sa commande. Appelée après l'envoi de la réponse :
 * ne lève jamais d'erreur.
 * @param {object} order - commande Mongoose
 */
const notifyCustomer = async (order) => {
  try {
    const user = await User.findById(order.userId).select('email username');
    await sendEmail({
      to: user?.email,
      subject: `Votre commande est « ${order.status} »`,
      text: `Bonjour ${user?.username},\n\nLe statut de votre commande n°${order._id} est désormais : ${order.status}.`,
    });
  } catch (error) {
    logger.error('Échec de la notification client', { orderId: order._id, error: error.message });
  }
};

/**
 * Liste toutes les commandes (admin).
 * @route GET /api/admin/orders
 */
exports.getOrders = async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
};

/**
 * Change le statut d'une commande (admin). Une annulation remet les produits en stock.
 * @route PUT /api/admin/orders/:id/status
 * @param {express.Request} req - params.id, body : { status }
 */
exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const order = await Order.findById(id);
  if (!order) throw new HttpError(404, 'Commande non trouvée');
  if (order.status === 'Annulée') throw new HttpError(409, 'Une commande annulée ne peut plus changer de statut');

  // Une annulation remet les produits en stock
  if (status === 'Annulée') {
    await releaseStock(order.items.map(({ productId, quantity }) => ({ productId, quantity })));
  }

  order.status = status;
  await order.save();

  logger.info('Statut de commande modifié', { orderId: id, status, adminId: req.user.userId });
  res.json({ message: 'Statut mis à jour avec succès', order });
  notifyCustomer(order);
};

/**
 * Valide une commande : « En attente » → « En cours de traitement » (admin).
 * @route PUT /api/admin/orders/:id/validate
 */
exports.validateOrder = async (req, res) => {
  const { id } = req.params;

  const order = await Order.findOneAndUpdate(
    { _id: id, status: 'En attente' },
    { status: 'En cours de traitement' },
    { new: true }
  );
  if (!order) {
    const exists = await Order.exists({ _id: id });
    throw exists ? new HttpError(409, 'Seule une commande en attente peut être validée') : new HttpError(404, 'Commande non trouvée');
  }

  logger.info('Commande validée', { orderId: id, adminId: req.user.userId });
  res.json({ message: `Commande ${id} validée`, order });
  notifyCustomer(order);
};

/**
 * Liste tous les produits avec leur stock (admin).
 * @route GET /api/admin/products
 */
exports.getProducts = async (req, res) => {
  const products = await Product.find().sort({ name: 1 });
  res.json(products);
};

/**
 * Met à jour le stock d'un produit (admin) et prévient le microservice de stock.
 * @route PUT /api/admin/products/:id/stock
 * @param {express.Request} req - params.id, body : { stock } (entier ≥ 0)
 */
exports.updateProductStock = async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;

  const product = await Product.findByIdAndUpdate(id, { stock }, { new: true, runValidators: true });
  if (!product) throw new HttpError(404, 'Produit non trouvé');

  logger.info('Stock mis à jour', { productId: id, stock, adminId: req.user.userId });
  res.json({ message: 'Stock mis à jour avec succès', product });
  notifyStockUpdate(product._id, product.stock);
};
