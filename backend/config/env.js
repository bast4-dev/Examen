// config/env.js
// Vérifie au démarrage que la configuration obligatoire est présente (évite un serveur à moitié fonctionnel)
const REQUIRED = ['MONGO_URI', 'JWT_SECRET', 'FRONTEND_URL'];

module.exports = function checkEnv() {
  const missing = REQUIRED.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Variables d'environnement manquantes : ${missing.join(', ')}`);
  }
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET doit contenir au moins 32 caractères');
  }
};
