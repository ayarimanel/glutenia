# Glutenia Backend

Node.js 20 + Express 4 REST API for the Glutenia gluten-free e-commerce app.

## Setup

```bash
npm install
cp .env.example .env
npm run seed
npm run dev
```

The API starts on `http://localhost:5000` by default.

For MongoDB Atlas or MongoDB Compass connection strings that do not include a database path, set:

```env
MONGO_DB_NAME=glutenia
```

That keeps the app data in the `glutenia` database.

On Windows, you can use the runner instead:

```powershell
.\run.ps1
.\run.ps1 -Seed
.\run.ps1 -Start
```

The runner checks Node.js, npm, `.env`, MongoDB reachability, dependencies, syntax, audit status, integration tests, and a short server smoke test.

## Main Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/products`
- `POST /api/products` admin only
- `PUT /api/products/:id` admin only
- `DELETE /api/products/:id` admin only
- `POST /api/orders`
- `GET /api/orders/my`
- `GET /api/orders` admin only
- `GET /api/orders/:id`
- `GET /api/users` admin only
- `GET /api/users/:id/orders` admin only

All JSON responses use `{ "success": true, "data": ... }` or `{ "success": false, "message": "..." }`.
