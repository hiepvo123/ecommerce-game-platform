
# Ecommerce Game Platform (Personal Extension)

⚠️ Project Origin  
This project is forked from the academic group project:
KhoiDang1209 / E-commerce-PTPL. This repository is a small full-stack e-commerce application for selling games. It contains a Node.js + Express backend (with PostgreSQL) and a React frontend. The README below explains how the project is structured, how to run it locally on Windows (PowerShell), and important API/session/database configuration notes.

The original project was completed as part of a university course.
This repository represents independent development, refactoring,
and feature expansion by the author after course completion.


## Contents

- `backend/` — Express API server, DB helpers, controllers, routes and API docs.
- `frontend/` — React single page application (Create React App).
- `db/` — DB connection helpers, migrations and SQL helpers.
- `docs/` — Design diagrams and API screenshots.
- `data_csv/` — CSV source data used for imports.

## Tech stack

- Backend: Node.js, Express, Sequelize (Postgres), express-session with `connect-pg-simple`.
- Database: PostgreSQL (connection via environment variables / DATABASE_URL).
- Frontend: React (react-scripts / Create React App), react-router-dom, axios.

## Prerequisites

- Node.js (>= 18 recommended)
- npm (comes with Node.js)
- PostgreSQL (running instance reachable by the backend)

## Quick start (Windows PowerShell)

1. Clone the repo and open PowerShell in the project root `d:\E-commerce-PTPL`.

2. Backend

	 - Install dependencies and start server:

	 ```powershell
	 cd .\backend
	 npm install
	 # Create a .env file (see example below) and then run
	 npm start
	 # For development with auto-reload (if you prefer), run:
	 npx nodemon server.js
	 ```

	 The backend listens on `process.env.PORT` or `3000` by default. Health check: `GET /api/health`.

3. Frontend

	 - Install dependencies and start the React dev server:

	 ```powershell
	 cd ..\frontend
	 npm install
	 npm start
	 ```

	 The frontend dev server runs on `http://localhost:3000` by default (react-scripts). The backend CORS config allows common dev origins; if you change the frontend port, update `FRONTEND_URL` in the backend `.env` or adjust the allowed origins in `backend/server.js`.

4. Running both

	 - Open two PowerShell windows/tabs: run the backend in one and the frontend in the other (steps above).

## Environment variables (.env example)

Create a `backend/.env` file in `backend/` root. Example values:

```
PORT=3001
FRONTEND_URL=http://localhost:3000

# Postgres connection (either provide DATABASE_URL or individual parts below)
DATABASE_URL=postgresql://dbuser:dbpassword@localhost:5432/gameshop
# or use these:
DB_USER=dbuser
DB_PASSWORD=dbpassword
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gameshop

SESSION_SECRET=change-this-secret

# Optional: email SMTP settings used by backend email services
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=yourpassword
```

Notes:
- The backend `config/session.js` will use `DATABASE_URL` if present to configure `connect-pg-simple`. If not present it builds a connection string from `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, and `DB_NAME`.
- `SESSION_SECRET` should be set to a strong value in production.

## API basics / configuration

- Base path for API routes: `/api`.
- Routes are mounted in `backend/server.js`:
	- `/api/auth` — authentication (login, logout, register)
	- `/api/admin` — admin endpoints
	- `/api/user` — user profile and details
	- `/api/games` — game listing / search / details
	- `/api/wishlist`, `/api/cart`, `/api/orders`, `/api/payments`, `/api/library` etc.

- CORS: Allowed origins are set in `backend/server.js`. It defaults to common dev origins and uses `FRONTEND_URL` from environment variables.

- Sessions: Sessions are stored in PostgreSQL via `connect-pg-simple`. See `backend/config/session.js`. Session cookie name is `gameShop.sid` by default and session table will be created automatically if missing (`createTableIfMissing: true`).

## Database & migrations

- Database connection and helpers: `db/index.js` (used by `server.js` at startup). The server calls `db.connectDB()` before listening.
- SQL migrations and helper SQL are under `db/migrations/` and `db/helpers/queries/`.
- There are SQL files to add indexes for fulltext search under `db/migrations/`.

## Project structure (high level)

- `backend/`
	- `server.js` — application entry point, mounts routes & middleware
	- `config/` — session and other configuration helpers (`session.js`)
	- `controllers/` — route handlers for features (auth, cart, games, orders, ...)
	- `routes/` — Express routing files
	- `models/` — Sequelize models
	- `db/` — database helpers, migrations and SQL queries
	- `middleware/` — express middleware (auth, error handling, logger)
	- `services/` — utilities like `emailServices.js`

- `frontend/`
	- `src/` — React app source
	- `src/pages/` — page components (Cart, Checkout, GameDetail...)
	- `src/components/` — shared components and UI
	- `src/context/` — React contexts (Auth, Cart, Wishlist)

## Database structure (summary)

This project uses PostgreSQL. The schema is documented in `backend/db/schema.md`; below is a concise summary of the main tables, important columns and relationships to help navigation and development.

- Enums
	- `user_role` (user, admin)
	- `order_status` (pending, paid, canceled, refunded, failed)
	- `payment_status` (initiated, authorized, captured, failed, refunded, canceled)

- Core game tables
	- `games` — primary game table keyed by `app_id` (Steam App ID). Important columns: `name`, `release_date`, `price_final`, `price_org`, `discount_percent`, `platforms_windows/mac/linux`.
	- `game_descriptions` — media and long descriptions (1:1 with `games` via `app_id`).
	- `game_specs` — PC requirements (1:1 with `games`).

- Reference / many-to-many tables
	- `languages`, `developers`, `publishers`, `genres`, `categories` — master lists.
	- `game_languages`, `game_developers`, `game_publishers`, `game_genres`, `game_categories` — link tables (many-to-many with `games`).

- Users & auth
	- `users` — core user table (`id`, `email`, `username`, `password_hash`, `role`, `is_verified`, ...).
	- `user_profiles` — 1:1 preferences (arrays of preferred language/genre/category ids).
	- `user_verifications` — OTP/verification tokens.
	- `session` — session store (used by `connect-pg-simple`); columns: `sid`, `sess`, `expire`.

- Shopping & orders
	- `carts` & `cart_items` — one active cart per user (`carts.user_id` unique). `cart_items` links `cart_id` → `games.app_id`.
	- `orders` & `order_items` — orders with `order_status`, `total_price`, `billing_address_id`. `order_items` stores `app_id`, `unit_price_paid` and applied discounts.
	- `payments` & `payment_methods` — payment records and types; `payments` references `orders`.

- Library & wishlist
	- `user_game_library` — games owned by users (unique `(user_id, app_id)`).
	- `user_wishlist_items` — wishlist entries (unique `(user_id, app_id)`).

- Reviews & coupons
	- `reviews` — user reviews per game (unique `(user_id, app_id)`).
	- `coupons` & `user_coupon_usage` — coupon definitions and usage tracking.

- Relationships (high-level)
	- One-to-many: users → orders, users → user_billing_addresses, orders → order_items, orders → payments.
	- One-to-one: games → game_descriptions, games → game_specs, users → user_profiles.
	- Many-to-many: games ↔ languages/developers/publishers/genres/categories via link tables.

See `backend/db/schema.md` for detailed column lists, constraints, enums and indexes. If you want, I can extract the full CREATE TABLE definitions into a SQL file or generate a visual ERD from the schema.

## API documentation

- There is a basic API documentation file at `backend/API_DOC.md`. Refer to it for endpoint details and example requests.

## Notes for developers

- Session store: During development `session.cookie.secure` is `false` to allow HTTP. In production set `secure: true` and configure `sameSite` appropriately.
- The backend `package.json` has `start` script: `node server.js`. For development, `nodemon` is included as a dev dependency — run via `npx nodemon server.js`.
- The frontend uses Create React App (`react-scripts start`) — port 3000 by default.

## Troubleshooting

- If the server can't connect to Postgres, check `DATABASE_URL` or the `DB_*` env vars, and ensure Postgres is running and accessible.
- If sessions are not persisted, confirm the session table exists or allow the `connect-pg-simple` option to create it automatically.
- CORS issues: ensure `FRONTEND_URL` matches the URL served by the React dev server.

## Next steps / deployment

- For production deployments:
	- Use a process manager (PM2, systemd) or container (Docker) to run the backend.
	- Use HTTPS and set `cookie.secure = true`.
	- Use a managed Postgres or properly secured DB instance and set `SESSION_SECRET` to a strong secret.

## Where to look in the repo

- Start here: `backend/server.js` (server boot & route mounting).
- API routes and controllers: `backend/routes/` and `backend/controllers/`.
- DB helpers & migrations: `db/`.
- Frontend app: `frontend/src/`.

If you want, I can also:
- add a `backend/.env.example` file to the repo,
- add npm scripts for `dev` that call `nodemon`, or
- add a composite script to run both frontend and backend concurrently (requires adding `concurrently`).

---
Last updated: December 2025

