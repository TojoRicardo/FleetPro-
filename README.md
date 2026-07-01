# FleetPro

React + Laravel — gestion de flotte multi-tenant.

## Démarrage

```bash
cd backend && composer install && cp .env.example .env && php artisan key:generate && php artisan migrate && php artisan db:seed --class=EssentialSeeder
php artisan serve --host=127.0.0.1 --port=9000

cd frontend && npm install && cp .env.example .env && npm run dev
```

- http://localhost:5173 — App  
- http://localhost:9000/api/v1 — API  
- Première utilisation : créer un compte sur `/register`

Windows : `.\start.ps1` · Docker : `cp .env.docker.example .env.docker` puis `docker compose up --build`

## Env

**backend/.env** — `DB_*`, `CORS_ALLOWED_ORIGINS`, `STRIPE_*`, `REALTIME_*`  
**frontend/.env** — `VITE_API_URL=/api/v1`, `VITE_DEV_API_PROXY=http://localhost:9000`

## Tests & build

```bash
cd backend && vendor/bin/phpunit
cd frontend && npm run typecheck && npm run build
```

## Dépannage

| Problème | Action |
|----------|--------|
| 503 au boot | `php artisan env:validate`, logs `storage/logs/laravel.log` |
| DB down | `php artisan db:show`, vérifier `.env` |
| CORS / 401 | `CORS_ALLOWED_ORIGINS`, `VITE_API_URL` |
| WS inactif | `VITE_ENABLE_WS=true`, `cd realtime && npm start` |
| Backup | `php artisan backup:database` / `backup:restore {id} --force` |
| Stripe | `STRIPE_WEBHOOK_SECRET`, endpoint `POST /api/v1/webhooks/stripe` |

Health : `GET /api/v1/health/ready`
