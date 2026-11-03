# Changelog

Toutes les évolutions notables du projet sont consignées dans ce fichier.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) — versionnage : [SemVer](https://semver.org/lang/fr/).
Les références (S1, B4…) renvoient au rapport d'audit [`docs/AUDIT.md`](docs/AUDIT.md).

## [1.1.0] — 2026-11-03

### Sécurité
- **Commande** : le prix et le total sont recalculés côté serveur à partir de la base ; les valeurs envoyées par le client sont ignorées (S1).
- **Gateway et microservices** : authentification par clé d'API interne (`x-api-key`, comparaison à temps constant) — fin du relais de mail ouvert (S2).
- **Logs** : suppression de toutes les traces de secrets (mot de passe SMTP, URI MongoDB, mots de passe utilisateurs, tokens JWT) (S3).
- **Authentification** : JWT déplacé de `localStorage` vers un cookie `HttpOnly`, `Secure` (prod), `SameSite=Strict` ; ajout de `/api/auth/logout` et `/api/auth/me` (S4).
- **Validation des entrées** avec Joi sur toutes les routes (types, longueurs, formats, listes de valeurs) + `mongoose.sanitizeFilter` contre l'injection NoSQL (S5).
- **Limitation de débit** sur `/api/auth/login` et `/api/auth/register` (10 requêtes / 15 min / IP) (S6).
- **Dépendances** mises à jour : 0 vulnérabilité en production sur tous les paquets (contre 100 au total auparavant) (S7).
- **CORS** restreint à l'URL du frontend ; en-têtes de sécurité HTTP via `helmet` (S9, S10).
- Message d'erreur de connexion unique « Identifiants invalides » (S11).
- Routes d'administration regroupées sous `/api/admin` et protégées par `authenticateToken` + `isAdmin` ; rôle utilisateur limité à `user` / `admin` (S12, S13).
- Destinataires des e-mails issus de la base / de la configuration (`ADMIN_EMAIL`) au lieu d'une adresse codée en dur (S14).
- Vérification des variables d'environnement au démarrage, taille des requêtes limitée (S15).
- Serveur partagé : réseau Docker dédié `exam1-proxy` (les conteneurs exam1 ne peuvent plus joindre les services des autres sites hébergés) et limites mémoire / CPU par conteneur.
- Accès de vérification au serveur à moindre privilège (compte sans sudo ni Docker, deux commandes de consultation, expiration automatique).
- Microservice de notification : serveur SMTP configurable (`SMTP_HOST`, `SMTP_PORT`, Gmail par défaut). Les identifiants Gmail fournis étant refusés (erreur 535), les environnements utilisent un SMTP de test (Ethereal) qui capture les e-mails envoyés.
- Politique de mot de passe renforcée à l'inscription (recommandations ANSSI) : 12 caractères minimum dont une majuscule, une minuscule, un chiffre et un caractère spécial, vérifiée par l'API (Joi) et par le formulaire.
- Coût bcrypt porté de 10 à 12 ; le hash du mot de passe n'est plus jamais sérialisé en JSON.

### Corrigé
- Le stock est décrémenté de façon atomique à la commande (pas de survente) et restitué si la commande échoue ou est annulée (B1).
- Suppression de la route `DELETE /api/orders/:id` qui ne répondait jamais (B2).
- La validation d'une commande la fait réellement passer de « En attente » à « En cours de traitement » (B3).
- Gestion d'erreurs centralisée : plus aucune promesse rejetée non gérée, plus de crash si MongoDB est indisponible (B4).
- Les actions admin ne renvoient plus d'erreur 500 à cause d'un appel de notification vers un port inexistant ; les notifications sont non bloquantes (B5).
- Statut de commande validé ; 404 si la commande ou le produit n'existe pas (B6).
- Inscription avec un nom d'utilisateur existant : 409 au lieu de 500 (B7).
- Stock validé comme entier ≥ 0 ; contraintes `min: 0` sur les prix et stocks (B8).
- Suppression des options Mongoose obsolètes et des champs de date en double (B9).
- Frontend : méthode de livraison / paiement réellement enregistrée (option vide par défaut) (B10).
- Frontend : la page d'administration ne plante plus en cas d'erreur API (B11) ; un stock peut être mis à 0 (B12).
- Frontend : reducer du panier immuable (B13) ; clé React correcte dans la liste des produits (B14) ; messages d'erreur du serveur affichés (B15) ; déconnexion complète (B16).
- Frontend : le panier, l'adresse de livraison et les choix de livraison/paiement sont effacés à la déconnexion (B21).
- Frontend : URL de l'API configurable (`VITE_API_URL`) ; route `/shipping-payment` (faute de frappe) (B17).
- Le code du frontend est désormais versionné dans le dépôt principal (dépôt git imbriqué supprimé) (B18).

### Ajouté
- Journalisation structurée avec Winston (`backend/logs/error.log`, `backend/logs/combined.log`, rotation 5 × 5 Mo) et journal d'accès HTTP.
- Sondes de supervision : `GET /api/health` (backend + état MongoDB), `GET /health` (gateway, notifications, stock).
- Microservice de stock : validation des événements et alerte « stock bas » (seuil `LOW_STOCK_THRESHOLD`).
- E-mails : bienvenue à l'inscription, confirmation de commande au client et à l'admin, changement de statut.
- Administration : annulation de commande avec remise en stock, statut « Délivrée », détails de livraison et noms des produits.
- `GET /api/orders/mine` : historique des commandes de l'utilisateur connecté.
- Script `npm run create-admin` (création d'un administrateur sans route publique) ; seed refusé en production.
- Fichiers `.env.example` pour chaque service ; script racine `npm run install:all`.
- Conteneurisation : un `Dockerfile` par service (utilisateur non-root, healthchecks), frontend servi par Nginx, `docker-compose.yml` complet (seuls le front et l'API sont exposés).
- Intégration continue GitHub Actions : audit npm, build, vérification de syntaxe et test de la stack Docker à chaque push.
- Qualité du code : ESLint 9 (configuration unique pour Node et React) et Prettier, vérifiés à chaque push dans le CI (`npm run lint`, `npm run format:check`).
- Traces de développement avec le module `debug` (`npm run dev:debug` → `DEBUG=app:*`), sans aucune donnée sensible.
- Rotation des journaux Docker en préproduction / production (3 × 10 Mo par conteneur).
- Déploiement continu : `development` → préproduction, `main` → production (SSH, clé dédiée, vérification post-déploiement).
- Documentation du code générée par JSDoc (`npm --prefix backend run docs` → `docs/code/backend/`) et `README.md` racine.

### Modifié
- Frontend migré de Create React App (abandonné) vers **Vite 8** ; React 18 → 19, React Router 6.4 → 7.
- Backend : Express 4.22, Mongoose 8.24, Axios 1.21, bcryptjs 3 ; notifications : Nodemailer 6 → 10 (`body-parser` retiré, intégré à Express).
- `npm start` lance désormais `node` (production) ; `npm run dev` lance `nodemon`.

### Supprimé
- Code mort : `gateway/routes/auth.js`, `gateway/routes/notif.js`, `microservices/auth-gateway` (vide), `frontend/src/components/ProductList.js` (doublon), fichiers de démo CRA.

## [1.0.0] — 2025-03-04

### Ajouté
- Version initiale fournie : catalogue, panier (Context API), commande avec adresse / livraison / paiement, gestion des rôles `user` / `admin`, microservices de notification et de stock, gateway.
