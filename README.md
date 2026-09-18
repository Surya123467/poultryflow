# PoultryFlow

PoultryFlow is a full-stack poultry farm operations tracker built as an Agri-Tech ERP portfolio project. It combines a React dashboard with a modular vanilla PHP REST API and MySQL analytics.

## Features

- Create and view poultry batches
- Capture daily feed, water, mortality, and egg production
- Prevent duplicate daily logs and impossible mortality values
- Track live bird count, mortality rate, feed per egg, and production trends
- Responsive dashboard with loading, success, empty, and error states
- PDO prepared statements, transactional writes, CORS, and strict server-side validation

## Project structure

```text
poultryflow/
├── src/                         React application
├── public/                      Static assets
├── backend/
│   ├── config/database.php      PDO, CORS, and shared helpers
│   └── api/
│       ├── batch/               Batch endpoints
│       ├── logs/                Daily-log endpoint
│       └── analytics/           Summary endpoint
└── database/poultryflow.sql     MySQL schema
```

## Run the frontend locally

Requirements: Node.js 20 or newer.

```bash
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` in `.env` to the URL where the contents of `backend/` are hosted. Do not include a trailing slash.

## Run the backend locally

Requirements: PHP 8.1+, PDO MySQL, and MySQL 8+ or compatible MariaDB.

1. Import `database/poultryflow.sql`.
2. Configure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`, and `ALLOWED_ORIGINS` in the PHP host environment.
3. Serve `backend/` as the web root.

Example local environment:

```text
DB_HOST=localhost
DB_PORT=3306
DB_NAME=poultryflow
DB_USER=root
DB_PASS=
ALLOWED_ORIGINS=http://localhost:5173
```

API routes:

```text
POST /api/batch/create.php
GET  /api/batch/list.php
POST /api/logs/create.php
GET  /api/analytics/summary.php?batch_id=1
```

## Deploy

### PHP and MySQL

1. Create a PHP/MySQL hosting account and database.
2. Import `database/poultryflow.sql` through phpMyAdmin.
3. Upload the contents of `backend/` into the host's public web directory.
4. Configure the database credentials in the host environment. If the host does not support environment variables, replace only the fallback values in `backend/config/database.php` with the supplied database credentials and never commit that edited file.
5. Set `ALLOWED_ORIGINS` to the deployed Vercel URL.

### React on Vercel

1. Import this GitHub repository into Vercel.
2. Keep the framework preset as Vite, build command as `npm run build`, and output directory as `dist`.
3. Add `VITE_API_BASE_URL` with the live PHP backend URL.
4. Deploy. When the backend URL changes, update the environment variable and redeploy.

## Analytics formulas

- Current live birds = initial birds − total mortality
- Mortality rate = total mortality ÷ initial birds × 100
- Feed per egg = total feed consumed in kg ÷ total eggs collected

The requested feed-to-egg-count metric is labelled “Feed per egg” in the interface because conventional poultry FCR is normally calculated using body-weight gain or egg mass.
