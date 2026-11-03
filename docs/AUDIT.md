# Audit de l'application — Bugs (E27) et failles de sécurité (E28)

Audit réalisé le 03/11/2026 par lecture complète du code source (backend, frontend, gateway, microservices), `npm audit` et `npm outdated` sur chaque paquet.

Niveaux de gravité : 🔴 Critique · 🟠 Haute · 🟡 Moyenne · ⚪ Faible

---

## 1. Failles de sécurité (E28)

| # | Gravité | Faille | Localisation | Mesure corrective |
|---|---|---|---|---|
| S1 | 🔴 | **Manipulation du prix par le client** : le prix et le total de la commande sont envoyés par le navigateur et enregistrés tels quels. Un utilisateur peut commander un ordinateur à 0,01 €. | `backend/controllers/orderController.js` (`createOrder`) | Ignorer les prix reçus ; relire le prix de chaque produit en base et recalculer le total côté serveur. |
| S2 | 🔴 | **Relais de mail ouvert** : le gateway et le microservice de notification acceptent n'importe quelle requête `POST /notify` sans authentification → n'importe qui peut envoyer des e-mails depuis le compte Gmail de l'entreprise (spam, phishing). Idem pour `/update-stock`. | `gateway/server.js`, `microservices/notifications/index.js`, `microservices/stock-management/index.js` | Clé d'API interne partagée (`x-api-key`) vérifiée par le gateway et par chaque microservice ; microservices non exposés publiquement (réseau Docker interne). |
| S3 | 🔴 | **Fuite de secrets dans les logs** : le mot de passe SMTP, l'URI MongoDB, les mots de passe utilisateurs (login/register) et les tokens JWT sont écrits en clair dans la console. | `notifications/index.js:20`, `config/db.js:7`, `authController.js:12,35`, `authMiddleware.js:7`, `frontend/src/services/api.js:11` | Suppression de ces logs ; journalisation structurée (Winston) sans données sensibles. |
| S4 | 🟠 | **Token JWT stocké dans `localStorage`** : volable par n'importe quelle faille XSS (ou extension malveillante). | `frontend/src/pages/Login.js`, `services/*.js` | Token placé dans un **cookie `HttpOnly`, `Secure`, `SameSite=Strict`** posé par le serveur ; route `/api/auth/logout` pour l'effacer. |
| S5 | 🟠 | **Injection NoSQL** : `User.findOne({ username })` avec `username = {"$gt": ""}` renvoie le premier utilisateur de la base (souvent l'admin). Aucune entrée n'est validée. | `authController.js` (`login`) et toutes les routes | Validation stricte de toutes les entrées avec **Joi** (types, longueurs, formats) + `mongoose.set('sanitizeFilter', true)`. |
| S6 | 🟠 | **Aucune protection contre la force brute** sur `/api/auth/login` et `/register`. | `backend/routes/authRoutes.js` | Limitation de débit (`express-rate-limit`) sur les routes d'authentification. |
| S7 | 🟠 | **Dépendances vulnérables** : backend 10 vulnérabilités (3 critiques : `mongoose`, `form-data`, `proxy-addr`), frontend 74 (4 critiques, 36 hautes), gateway/microservices 5 à 6 chacun (`express`, `body-parser`, `path-to-regexp`, `nodemailer`). | Tous les `package.json` | Mise à jour des dépendances (cf. §3). |
| S8 | 🟠 | **Composant obsolète** : `react-scripts` (Create React App) est abandonné depuis 2025 et embarque la majorité des vulnérabilités du frontend. | `frontend/package.json` | Migration du frontend vers **Vite**. |
| S9 | 🟡 | **CORS ouvert à tous les domaines** (`cors()` sans option). | `backend/server.js` | CORS restreint à l'URL du frontend (`FRONTEND_URL`) avec `credentials: true`. |
| S10 | 🟡 | **En-têtes HTTP de sécurité absents** et en-tête `X-Powered-By: Express` exposé. | `backend/server.js`, `gateway/server.js` | `helmet()`. |
| S11 | 🟡 | **Énumération des comptes** : le login répond « Utilisateur non trouvé » ou « Mot de passe incorrect ». | `authController.js` | Message unique « Identifiants invalides » (HTTP 401). |
| S12 | 🟡 | **Contrôle d'accès incohérent** : `DELETE /api/orders/:id` est accessible à tout utilisateur connecté (commentaire « administrateurs ») ; `adminRoutes.js` existe mais n'est pas monté. | `orderRoutes.js`, `server.js` | Toutes les routes d'administration regroupées sous `/api/admin`, protégées par `authenticateToken` + `isAdmin`. |
| S13 | 🟡 | **Rôle non contraint** dans le modèle `User` (n'importe quelle chaîne acceptée). | `models/User.js` | `enum: ['user', 'admin']`. |
| S14 | ⚪ | **Adresse e-mail personnelle codée en dur** comme destinataire des notifications. | `orderController.js:62` | Destinataires issus de la base (client) et de la configuration (`ADMIN_EMAIL`). |
| S15 | ⚪ | **Corps de requête sans limite de taille explicite** ; pas de vérification des variables d'environnement au démarrage. | `backend/server.js` | `express.json({ limit: '10kb' })` ; arrêt au démarrage si une variable obligatoire manque. |
| S16 | 🟡 | **Politique de mot de passe faible** : 8 caractères suffisent, sans aucune exigence (`aaaaaaaa` est accepté). | `validators/schemas.js`, `pages/Register.jsx` | 12 caractères minimum dont une majuscule, une minuscule, un chiffre et un caractère spécial (recommandations ANSSI), vérifiés par l'API et par le formulaire. |

> Point positif : les fichiers `.env` sont bien exclus du dépôt git (`.gitignore`), et les mots de passe sont hachés avec bcrypt.

---

## 2. Bugs techniques (E27)

### Backend

| # | Gravité | Bug | Localisation | Correction |
|---|---|---|---|---|
| B1 | 🔴 | **Stock jamais décrémenté** à la commande (appel au microservice commenté, microservice factice) → on peut vendre des produits en rupture. | `orderController.js:72-81` | Décrément **atomique** du stock (`findOneAndUpdate` avec `stock >= quantité`) et remise en stock si la commande échoue ; refus (409) si stock insuffisant. |
| B2 | 🟠 | **Routes qui ne répondent jamais** : `deleteOrder` ne renvoie aucune réponse → la requête reste bloquée jusqu'au timeout. | `orderController.js:150` | Route supprimée (non utilisée par le front). |
| B3 | 🟠 | **`validateOrder` factice** : renvoie « validée » sans rien modifier en base. La version de `adminController` utilise le statut `'Validée'`, absent de l'enum du modèle. | `orderController.js:162`, `adminController.js:37` | Passe la commande de « En attente » à « En cours de traitement ». |
| B4 | 🟠 | **Crash possible du serveur** : `getProducts` et `getOrders` n'ont pas de `try/catch` → promesse rejetée non gérée si MongoDB est indisponible. | `productController.js:4`, `orderController.js:155` | Gestion d'erreurs centralisée (wrapper async + middleware d'erreur). |
| B5 | 🟠 | **Notifications admin envoyées sur un mauvais port** (`localhost:3001`, rien n'y écoute) et avec un mauvais format (`{message}` au lieu de `{to, subject, text}`) → toute action admin renvoie une erreur 500 alors que la base a été modifiée. | `adminController.js:23,38,64` | Service de notification unique, via le gateway, non bloquant (un échec d'e-mail n'annule pas l'action). |
| B6 | 🟡 | **Statut de commande non validé** : `findByIdAndUpdate` sans `runValidators` → n'importe quel statut est enregistré. Commande inexistante → 200 au lieu de 404. | `adminController.js:22` | Validation Joi + `runValidators` + 404. |
| B7 | 🟡 | **Inscription avec un nom d'utilisateur déjà pris** → erreur MongoDB E11000 renvoyée en 500. | `authController.js:39` | Vérification e-mail **et** nom d'utilisateur, réponse 409. |
| B8 | 🟡 | **Stock non typé** : une valeur `"abc"` provoque une erreur 500 ; aucun minimum sur `price`/`stock` dans le modèle. | `productController.js`, `models/Product.js` | Validation Joi (entier ≥ 0) + `min: 0` dans le schéma. |
| B9 | ⚪ | Options Mongoose obsolètes (`useNewUrlParser`, `useUnifiedTopology`) → avertissements au démarrage ; champs `createdAt`/`updatedAt` déclarés en double avec `timestamps`. | `config/db.js`, `seeder.js`, `models/Order.js` | Options et champs supprimés. |

### Frontend

| # | Gravité | Bug | Localisation | Correction |
|---|---|---|---|---|
| B10 | 🟠 | **Méthode de livraison / paiement « manquante » alors qu'elle est affichée** : la liste déroulante affiche « Colissimo » / « Carte bancaire » mais l'état vaut `null` tant que l'utilisateur n'a pas changé la sélection → commande refusée. | `ShippingMethodSelection.js`, `handlePaymentChange.js` | Option vide « — Choisir — » par défaut. |
| B11 | 🟠 | **Page admin plante** si l'API renvoie une erreur (token expiré…) : `fetchData` sans `try/catch`. | `pages/Admin.js:19` | Gestion d'erreur + message à l'utilisateur. |
| B12 | 🟠 | **Impossible de mettre un stock à 0** (`!stockValue` rejette `"0"`). | `pages/Admin.js:58` | Test explicite sur la chaîne vide et la valeur numérique. |
| B13 | 🟡 | **Mutation de l'état** dans le reducer du panier (`updatedCart[i].quantity += …` modifie l'objet existant). | `context/CartContext.js:14` | Mise à jour immuable. |
| B14 | 🟡 | **Clé React invalide** dans la liste des produits (`product.id` est `undefined`, l'identifiant est `_id`). | `pages/ProductList.js:27` | `key={product._id}`. |
| B15 | 🟡 | **Erreurs serveur jamais affichées** à la commande (`response.error` n'existe pas avec axios) et pas de redirection après succès. | `pages/Order.js:66` | Affichage du message renvoyé par l'API. |
| B16 | 🟡 | **Déconnexion incomplète** : le rôle reste dans `localStorage`. | `components/Navbar.js` | Appel à `/api/auth/logout` + nettoyage complet. |
| B17 | ⚪ | URL de l'API codée en dur (`http://localhost:5000`) → impossible à déployer. Faute de frappe dans la route `/shippig_payment`. Fichier `components/ProductList.js` en double (copie de `ProtectedRoute`). | `services/*.js`, `App.js` | Variable d'environnement `VITE_API_URL` ; route `/shipping-payment` ; fichier supprimé. |
| B21 | 🟡 | **Panier conservé après la déconnexion** : le panier, l'adresse de livraison et les choix de livraison/paiement restent affichés pour la personne suivante (fuite de données personnelles sur un poste partagé). | `components/Navbar.jsx`, `context/CartContext.jsx` | Réinitialisation complète du panier et des données de livraison à la déconnexion (action `RESET`). |

### Infrastructure / projet

| # | Gravité | Bug | Localisation | Correction |
|---|---|---|---|---|
| B18 | 🔴 | **Le code du frontend n'est pas versionné** : `frontend/` contient son propre dépôt `.git`, le dépôt racine ne stocke qu'un lien de sous-module sans `.gitmodules`. | `frontend/.git` | Suppression du dépôt imbriqué et ajout des fichiers au dépôt principal. |
| B19 | 🟠 | **`docker-compose.yml` inutilisable** : aucun `Dockerfile` n'existe ; ports des microservices incohérents (compose : 3001/3002, code : 4002/4003) ; gateway absent ; aucune variable d'environnement transmise. | `docker-compose.yml` | Dockerfiles + compose complet (traité en E24). |
| B20 | ⚪ | Code mort : `gateway/routes/notif.js` (vide), `gateway/routes/auth.js` et `microservices/auth-gateway` (vides / non branchés). `nodemon` et `npm-run-all` utilisés par les scripts mais non déclarés en dépendances. | — | Nettoyage ; dépendances de développement déclarées. |

---

## 3. Dépendances (état initial)

| Paquet | Vulnérabilités `npm audit` | Principales dépendances obsolètes |
|---|---|---|
| backend | 10 (3 critiques, 5 hautes, 2 moyennes) | mongoose 8.8 → 8.24, express 4.21 → 4.22, axios 1.7 → 1.21 |
| frontend | 74 (4 critiques, 36 hautes, 15 moyennes, 19 faibles) | react-scripts 5 (abandonné), react-router-dom 6.4 |
| gateway | 5 (1 critique, 3 hautes) | express, express-http-proxy |
| notifications | 6 (1 critique, 4 hautes) | nodemailer 6 → 10, body-parser (inutile avec express ≥ 4.16) |
| stock-management | 5 (1 critique, 3 hautes) | express |
