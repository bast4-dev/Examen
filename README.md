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
cp .env.example .env          # puis renseigner les secrets (openssl rand -hex 32)
docker compose up -d --build
docker compose exec backend node seeder.js --force
docker compose exec -e ADMIN_USERNAME=admin -e ADMIN_EMAIL=admin@example.com -e ADMIN_PASSWORD='MotDePasseLong!' backend node scripts/createAdmin.js
```

Application : http://localhost:3000 — santé de l'API : http://localhost:5000/api/health

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

## Intégration continue

`.github/workflows/ci.yml` : audit de sécurité npm, build et vérification de chaque service, puis build et test de la stack Docker à chaque push.
