# FleetPro

**Plateforme SaaS de gestion de flotte multi-tenant** — véhicules, conducteurs, trajets, maintenance, facturation et audit.

---

## Aperçu

FleetPro est une application full-stack conçue pour les organisations qui gèrent une flotte de véhicules. Chaque locataire dispose de son propre espace isolé, avec des rôles (admin, manager, mécanicien) et un tableau de bord en temps réel.

| Module | Description |
|--------|-------------|
| Flotte | Véhicules, conducteurs, affectations, trajets |
| Opérations | Planification et suivi de la maintenance |
| Entreprise | Analytique, facturation Stripe, tarification |
| Sécurité | Journal d'audit, notifications, authentification Sanctum |

---

## Stack technique

| Couche | Technologies |
|--------|--------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query |
| Backend | Laravel 11, PHP 8.2+, Sanctum, PostgreSQL / SQLite |
| Temps réel | Socket.IO ([`realtime/`](realtime/)) |
| Infra | Docker Compose, [GitHub Actions](.github/workflows/ci.yml) |

---

## Structure du projet

```
FleetPro/
├── frontend/     → Application React (port 5173)
├── backend/      → API REST Laravel (port 9000)
├── realtime/     → Serveur WebSocket (port 6001)
└── docker-compose.yml
```

Dossiers : [`frontend/`](frontend/) · [`backend/`](backend/) · [`realtime/`](realtime/)

---

## Prérequis

- **PHP** 8.2+ et **Composer**
- **Node.js** 20+ et **npm**
- **SQLite** (défaut local) ou **PostgreSQL**

---

## Démarrage rapide

### Installation locale

```bash
# Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed --class=EssentialSeeder
php artisan serve --host=127.0.0.1 --port=9000

# Frontend (nouveau terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

| Service | URL |
|---------|-----|
| Application | [localhost:5173](http://localhost:5173) |
| API | [localhost:9000/api/v1](http://localhost:9000/api/v1) |
| Health check | [localhost:9000/api/v1/health/ready](http://localhost:9000/api/v1/health/ready) |

> Créez un compte sur [localhost:5173/register](http://localhost:5173/register) lors de la première utilisation.

### Docker

```bash
cp .env.docker.example .env.docker
docker compose up --build
```

---

## Configuration

Copiez les fichiers [`.env.example`](backend/.env.example) vers `.env` dans [`backend/`](backend/) et [`frontend/`](frontend/). Les valeurs par défaut suffisent pour le développement local.

Les options avancées (facturation Stripe, WebSocket, CORS) sont documentées en commentaires dans chaque fichier `.env.example` ([backend](backend/.env.example), [frontend](frontend/.env.example), [docker](.env.docker.example)).

---

## Commandes utiles

| Contexte | Commande |
|----------|----------|
| Tests backend | `cd backend && vendor/bin/phpunit` |
| Tests frontend | `cd frontend && npm run test` |
| Lint frontend | `cd frontend && npm run lint` |
| Build production | `cd frontend && npm run build` |
| Validation env | `cd backend && php artisan env:validate` |
| Facturation (cron) | `php artisan billing:generate-invoices` |

En production, planifiez le scheduler Laravel : `* * * * * php artisan schedule:run`

---

## Dépannage

| Symptôme | Solution |
|----------|----------|
| Erreur 503 au démarrage | `php artisan env:validate` — consulter [`backend/storage/logs/`](backend/storage/logs/) |
| Base de données inaccessible | `php artisan db:show` — vérifier [`backend/.env`](backend/.env.example) |
| Erreurs CORS / auth | Aligner l'URL frontend avec `CORS_ALLOWED_ORIGINS` dans [`backend/.env`](backend/.env.example) |
| Temps réel inactif | Démarrer [`realtime/`](realtime/) ou activer `VITE_ENABLE_WS=true` dans [`frontend/.env`](frontend/.env.example) |
