// microservices/stock-management/index.js
// Reçoit les événements de mise à jour du stock (commande, action admin) et alerte en cas de stock bas.
const express = require('express');
const crypto = require('crypto');
require('dotenv').config();

if (!process.env.INTERNAL_API_KEY) {
  console.error('INTERNAL_API_KEY manquante');
  process.exit(1);
}

const app = express();
const PORT = process.env.STOCK_PORT || 4003;
const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD) || 5;

app.disable('x-powered-by');
app.use(express.json({ limit: '5kb' }));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'stock-management', uptime: Math.round(process.uptime()) }));

const expectedKey = Buffer.from(process.env.INTERNAL_API_KEY);
app.use((req, res, next) => {
  const key = Buffer.from(req.get('x-api-key') || '');
  if (key.length !== expectedKey.length || !crypto.timingSafeEqual(key, expectedKey)) {
    return res.status(401).json({ message: 'Clé API invalide' });
  }
  next();
});

app.post('/update-stock', (req, res) => {
  const { productId, stock } = req.body || {};

  if (typeof productId !== 'string' || !/^[0-9a-f]{24}$/i.test(productId)) {
    return res.status(400).json({ message: 'Identifiant produit invalide.' });
  }
  if (!Number.isInteger(stock) || stock < 0) {
    return res.status(400).json({ message: 'Stock invalide.' });
  }

  console.log(JSON.stringify({ level: 'info', event: 'stock_updated', productId, stock, at: new Date().toISOString() }));
  if (stock <= LOW_STOCK_THRESHOLD) {
    console.warn(JSON.stringify({ level: 'warn', event: 'low_stock', productId, stock, threshold: LOW_STOCK_THRESHOLD }));
  }

  res.json({ message: `Stock mis à jour pour le produit ${productId}`, lowStock: stock <= LOW_STOCK_THRESHOLD });
});

app.listen(PORT, () => console.log(`Service de gestion des stocks sur le port ${PORT}`));
