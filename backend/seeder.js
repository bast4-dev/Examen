// backend/seeder.js
// Usage : npm run seed  (remplace TOUS les produits — ne pas lancer en production)
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

// Jeux de produits à insérer
const products = [
  {
    name: 'Ordinateur Portable',
    price: 1000,
    description: 'Un ordinateur portable performant pour tous vos besoins.',
    stock: 20,
  },
  {
    name: 'Smartphone',
    price: 700,
    description: 'Un smartphone moderne avec un écran OLED.',
    stock: 50,
  },
  {
    name: 'Casque Audio',
    price: 150,
    description: 'Un casque audio sans fil avec réduction de bruit.',
    stock: 30,
  },
  {
    name: 'Tablette',
    price: 400,
    description: 'Une tablette légère et puissante.',
    stock: 25,
  },
  {
    name: 'Clavier Mécanique',
    price: 120,
    description: 'Un clavier mécanique pour les gamers.',
    stock: 15,
  },
];

// Fonction pour insérer les produits
const seedProducts = async () => {
  try {
    if (process.env.NODE_ENV === 'production' && process.argv[2] !== '--force') {
      throw new Error('Seed refusé en production (ajouter --force pour passer outre)');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connecté pour le seed');

    await Product.deleteMany();
    await Product.insertMany(products);

    console.log('Jeux de produits insérés avec succès !');
    process.exit(0);
  } catch (error) {
    console.error("Erreur lors de l'insertion des produits :", error.message);
    process.exit(1);
  }
};

// Lancer le seed
seedProducts();
