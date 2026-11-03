// backend/validators/schemas.js
// Schémas Joi de validation des entrées utilisateur
const Joi = require('joi');

const ORDER_STATUSES = ['En attente', 'En cours de traitement', 'Expédiée', 'Délivrée', 'Annulée'];
const PAYMENT_METHODS = ['Carte bancaire', 'PayPal', 'Virement'];
const SHIPPING_METHODS = ['colissimo', 'chronopost'];

const objectId = Joi.string().hex().length(24).messages({
  'string.hex': '{{#label}} doit être un identifiant valide',
  'string.length': '{{#label}} doit être un identifiant valide',
});

const idParam = Joi.object({ id: objectId.required() });

const register = Joi.object({
  username: Joi.string().trim().alphanum().min(3).max(30).required().label("Nom d'utilisateur"),
  email: Joi.string().trim().lowercase().email().max(254).required().label('Email'),
  password: Joi.string().min(8).max(128).required().label('Mot de passe'),
});

const login = Joi.object({
  username: Joi.string().trim().max(30).required().label("Nom d'utilisateur"),
  password: Joi.string().max(128).required().label('Mot de passe'),
});

const createOrder = Joi.object({
  // Les prix et le total envoyés par le client sont volontairement ignorés (stripUnknown)
  items: Joi.array()
    .items(
      Joi.object({
        productId: objectId.required().label('Produit'),
        quantity: Joi.number().integer().min(1).max(100).required().label('Quantité'),
      })
    )
    .min(1)
    .max(50)
    .required()
    .label('Articles'),
  shippingAddress: Joi.object({
    street: Joi.string().trim().min(3).max(200).required().label('Rue'),
    city: Joi.string().trim().min(1).max(100).required().label('Ville'),
    postalCode: Joi.string()
      .trim()
      .pattern(/^[0-9A-Za-z -]{3,10}$/)
      .required()
      .label('Code postal'),
    country: Joi.string().trim().min(2).max(60).required().label('Pays'),
  }).required(),
  paymentMethod: Joi.string()
    .valid(...PAYMENT_METHODS)
    .required()
    .label('Mode de paiement'),
  shippingMethod: Joi.string()
    .valid(...SHIPPING_METHODS)
    .required()
    .label('Méthode de livraison'),
});

const orderStatus = Joi.object({
  status: Joi.string()
    .valid(...ORDER_STATUSES)
    .required()
    .label('Statut'),
});

const productStock = Joi.object({
  stock: Joi.number().integer().min(0).max(1_000_000).required().label('Stock'),
});

module.exports = {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  SHIPPING_METHODS,
  idParam,
  register,
  login,
  createOrder,
  orderStatus,
  productStock,
};
