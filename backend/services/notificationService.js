// backend/services/notificationService.js
// Appels aux microservices via le gateway. Les échecs sont journalisés mais ne bloquent jamais
// l'action métier (une commande reste valide même si l'e-mail ne part pas).
const axios = require('axios');
const logger = require('../utils/logger');
const debug = require('debug')('app:notify');

const gateway = axios.create({
  baseURL: process.env.GATEWAY_URL || 'http://localhost:8000',
  timeout: 5000,
  headers: { 'x-api-key': process.env.INTERNAL_API_KEY },
});

/**
 * Envoie un e-mail via le gateway → microservice de notification. Ne lève jamais d'erreur.
 * @param {{to: string, subject: string, text: string}} mail
 * @returns {Promise<void>}
 */
exports.sendEmail = async ({ to, subject, text }) => {
  if (!to) return;
  debug("Envoi de l'e-mail « %s » via le gateway", subject);
  try {
    await gateway.post('/notify', { to, subject, text });
    logger.info('Notification e-mail envoyée', { subject });
  } catch (error) {
    logger.error("Échec de l'envoi de la notification", { subject, error: error.message });
  }
};

/**
 * Signale un nouveau niveau de stock au microservice de stock (alerte stock bas).
 * @param {string} productId
 * @param {number} stock
 * @returns {Promise<void>}
 */
exports.notifyStockUpdate = async (productId, stock) => {
  try {
    await gateway.post('/update-stock', { productId: String(productId), stock });
  } catch (error) {
    logger.error('Échec de la notification de mise à jour du stock', { productId, error: error.message });
  }
};
