// backend/scripts/createAdmin.js
// Crée (ou promeut) un compte administrateur sans exposer de route publique pour cela.
// Usage : ADMIN_USERNAME=admin ADMIN_EMAIL=admin@exemple.fr ADMIN_PASSWORD='...' npm run create-admin
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const { ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI } = process.env;

(async () => {
  try {
    if (!ADMIN_USERNAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error('ADMIN_USERNAME, ADMIN_EMAIL et ADMIN_PASSWORD sont obligatoires');
    }
    if (ADMIN_PASSWORD.length < 12) throw new Error('Le mot de passe admin doit faire au moins 12 caractères');

    await mongoose.connect(MONGO_URI);
    let user = await User.findOne({ username: ADMIN_USERNAME });
    if (user) {
      user.role = 'admin';
      user.password = ADMIN_PASSWORD;
    } else {
      user = new User({ username: ADMIN_USERNAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' });
    }
    await user.save();
    console.log(`Administrateur « ${ADMIN_USERNAME} » prêt.`);
    process.exit(0);
  } catch (error) {
    console.error('Erreur :', error.message);
    process.exit(1);
  }
})();
