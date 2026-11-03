# Mini site e-commerce — stack MERN + microservices

Catalogue, panier, commande (adresse, transporteur, paiement), rôles `user` / `admin`, notifications e-mail et gestion de stock en microservices.

| Composant | Dossier | Port | Exposé |
|---|---|---|---|
| Frontend React (Vite, servi par Nginx en Docker) | `frontend/` | 3000 | oui |
| API Node.js / Express | `backend/` | 5000 | oui |
| Gateway (point d'entrée des microservices) | `gateway/` | 8000 | non (réseau interne) |
| Notifications (Nodemailer) | `microservices/notifications/` | 4002 | non |
| Gestion du stock | `microservices/stock-management/` | 4003 | non |
| MongoDB | — | 27017 | non |

## Démarrage rapide (Docker)

Prérequis : Docker et Docker Compose.

```bash
cp .env.example .env
# Génère des secrets aléatoires (le backend refuse de démarrer avec un JWT_SECRET de moins de 32 caractères)
sed -i.bak -e "s/^JWT_SECRET=.*/JWT_SECRET=$(openssl rand -hex 32)/" -e "s/^INTERNAL_API_KEY=.*/INTERNAL_API_KEY=$(openssl rand -hex 32)/" .env
docker compose up -d --build
docker compose exec backend node seeder.js --force
docker compose exec -e ADMIN_USERNAME=admin -e ADMIN_EMAIL=admin@example.com -e ADMIN_PASSWORD='MotDePasseLong!' backend node scripts/createAdmin.js
```

Application : http://localhost:3000 — santé de l'API : http://localhost:5000/api/health

### E-mails (SMTP)

⚠️ **Le compte SMTP Gmail fourni avec le sujet n'est plus valide** : Gmail refuse ses identifiants (`535-5.7.8 Username and Password not accepted`), son mot de passe d'application ayant vraisemblablement été révoqué. Le microservice de notification accepte donc n'importe quel serveur SMTP via `SMTP_HOST` / `SMTP_PORT` (Gmail si vide). La préproduction et la production utilisent un SMTP de test, [Ethereal](https://ethereal.email), qui reçoit réellement les e-mails envoyés et les affiche dans une boîte web, sans les distribuer.

Pour créer un compte Ethereal de test :

```bash
cd microservices/notifications && node -e "require('nodemailer').createTestAccount().then(a => console.log(a.user, a.pass))"
```

Puis dans `.env` : `SMTP_HOST=smtp.ethereal.email`, `SMTP_PORT=587`, `EMAIL_USER=<user>`, `EMAIL_APPLICATION_PASSWORD=<pass>`. Sans SMTP valide, l'application fonctionne normalement : les envois échouent et sont simplement journalisés.

## Démarrage sans Docker

Prérequis : Node.js 22+, MongoDB local.

```bash
npm run install:all
cp .env.example .env          # et un .env par service à partir de leurs .env.example
npm --prefix backend run seed
npm run start:all
```

## Documentation

- [Rapport d'audit (bugs et failles)](docs/AUDIT.md)
- [Journal des évolutions](CHANGELOG.md)
- Documentation du code backend générée par JSDoc : `npm --prefix backend run docs` → `docs/code/backend/index.html`

## Qualité du code

```bash
npm install          # à la racine : ESLint + Prettier
npm run lint         # ESLint
npm run format       # Prettier
npm --prefix backend run dev:debug   # traces de développement (DEBUG=app:*)
```

## CI/CD et déploiement

`.github/workflows/ci.yml`, à chaque push :

1. qualité du code (ESLint, Prettier) ;
2. audit de sécurité npm, build et vérification de chaque service ;
3. build et test de la stack Docker ;
4. déploiement par SSH : `development` → préproduction, `main` → production.

| Environnement | Frontend | API |
|---|---|---|
| Production | https://exam1-prod.duckdns.org | https://api.exam1-prod.duckdns.org/api |
| Préproduction | https://exam1-preprod.duckdns.org | https://api.exam1-preprod.duckdns.org/api |

Sur le serveur, chaque environnement est un projet Docker Compose distinct utilisant `docker-compose.prod.yml` (aucun port publié, réseau dédié `exam1-proxy` partagé uniquement avec le reverse proxy Caddy qui gère le HTTPS, limites mémoire/CPU, rotation des journaux) :

```bash
docker compose -p exam1-prod --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Sauvegardes

`scripts/backup-mongo.sh` sauvegarde chaque nuit les bases de préproduction et de production (`mongodump` compressé, 7 jours de rétention) :

```bash
crontab -e   # puis : 0 3 * * * $HOME/exam1/scripts/backup-mongo.sh >> $HOME/backups/exam1/backup.log 2>&1
# Restauration :
docker exec -i exam1-prod-mongo-1 mongorestore --archive --gzip --drop < exam1-prod-AAAA-MM-JJ_HHMM.archive.gz
```

Secrets requis côté GitHub (Settings → Secrets → Actions) : `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (clé privée encodée en base64).
