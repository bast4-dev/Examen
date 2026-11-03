// backend/controllers/orderController.js
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const logger = require('../utils/logger');
const HttpError = require('../utils/httpError');
const { sendEmail, notifyStockUpdate } = require('../services/notificationService');

// Réserve le stock de façon atomique : la mise à jour n'a lieu que si le stock est suffisant,
// ce qui empêche la survente même avec des commandes simultanées.
const reserveStock = async (productId, quantity) => {
  const product = await Product.findOneAndUpdate(
    { _id: productId, stock: mongoose.trusted({ $gte: quantity }) },
    { $inc: { stock: -quantity } },
    { new: true }
  );
  if (product) return product;

  const exists = await Product.exists({ _id: productId });
  throw exists
    ? new HttpError(409, 'Stock insuffisant pour un des produits de la commande')
    : new HttpError(404, "Un des produits de la commande n'existe plus");
};

const releaseStock = (reserved) =>
  Promise.all(reserved.map(({ productId, quantity }) => Product.updateOne({ _id: productId }, { $inc: { stock: quantity } })));

exports.createOrder = async (req, res) => {
  const { items, shippingAddress, paymentMethod, shippingMethod } = req.body;

  // Regroupe les lignes portant sur le même produit
  const quantities = new Map();
  for (const { productId, quantity } of items) {
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  const reserved = [];
  const reservedProducts = [];
  let order;
  try {
    for (const [productId, quantity] of quantities) {
      const product = await reserveStock(productId, quantity);
      reserved.push({ productId, quantity });
      reservedProducts.push(product);
    }

    // Le prix vient TOUJOURS de la base, jamais du client
    const orderItems = reservedProducts.map((product, i) => ({
      productId: product._id,
      quantity: reserved[i].quantity,
      price: product.price,
    }));
    const total = Math.round(orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0) * 100) / 100;

    order = await Order.create({
      userId: req.user.userId,
      items: orderItems,
      total,
      shippingAddress,
      paymentMethod,
      shippingMethod,
    });
  } catch (error) {
    // Échec : on rend le stock déjà réservé
    if (reserved.length > 0) await releaseStock(reserved);
    throw error;
  }

  logger.info('Commande créée', { orderId: order._id, userId: req.user.userId, total: order.total });
  res.status(201).json({ message: 'Commande créée avec succès', order });

  // Notifications après la réponse : elles ne retardent ni ne font échouer la commande
  try {
    const user = await User.findById(req.user.userId).select('email username');
    const lines = reservedProducts.map((p, i) => `- ${p.name} x${reserved[i].quantity} : ${p.price} €`).join('\n');
    sendEmail({
      to: user?.email,
      subject: 'Confirmation de votre commande',
      text: `Bonjour ${user?.username},\n\nVotre commande n°${order._id} a bien été enregistrée :\n${lines}\n\nTotal : ${order.total} €`,
    });
    sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: 'Nouvelle commande créée',
      text: `Nouvelle commande n°${order._id} de ${user?.username} :\n${lines}\n\nTotal : ${order.total} €`,
    });
    reservedProducts.forEach((p) => notifyStockUpdate(p._id, p.stock));
  } catch (error) {
    logger.error("Échec de l'envoi des notifications de commande", { orderId: order._id, error: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  const orders = await Order.find({ userId: req.user.userId }).sort({ createdAt: -1 });
  res.json(orders);
};

exports.releaseStock = releaseStock;
