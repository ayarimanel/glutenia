# Glutenia Backend

REST API for Glutenia, a gluten-free e-commerce and community app for people managing celiac disease or gluten intolerance. Serves the [glutenia-mobile](../glutenia-mobile) React Native app.

## Tech stack

- **Node.js 20+** (`engines.node: >=20` in `package.json`) + **Express 4**
- **MongoDB + Mongoose 8** — 15 schemas, including a transactional checkout (`session.withTransaction()`) that atomically reserves stock to prevent overselling under concurrent orders
- **JWT** (`jsonwebtoken`) for auth, **bcrypt** (`bcryptjs`, cost factor 12) for password hashing
- **express-validator** for request validation, applied on every mutating route
- **multer** for in-memory file uploads (images stored as base64 in MongoDB — see `LIMITATIONS.md`)
- **Groq SDK** for AI-assisted ingredient-label scanning (vision model)
- **Node's built-in test runner** (`node --test`) + `supertest` for integration tests against a real (guarded) test database

## Features

14 REST resources, ~62 endpoints, all sharing one response envelope (`{success, data}` / `{success, message}`):

- Auth (register/login, customer + professional signup with admin approval), profile management, push-token registration
- Product catalog (CRUD, barcode lookup, search) and orders (transactional checkout, seller/admin views, status updates)
- Crowdsourced community product reports with a checksum-validated barcode and a community-dispute mechanism
- Establishments (seller storefronts) with owner-managed profiles and cover images
- Events with RSVP and broadcast notifications
- Gamification: XP, levels, streaks (with shields), badges — a single `recordAction()` entry point wired into every real user action
- Recipes and patient resources (admin-managed content)
- Push + in-app notifications, gated by per-category user preferences

See `LIMITATIONS.md` for 3 deliberate, documented tradeoffs (no pagination, base64 image storage, JWT role not re-validated after issuance) and `PROJECT_FACTS.md` (repo root) for exact counts, versions, and every endpoint listed individually.

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

## API Routes

Every endpoint is defined in `src/routes/` (one file per resource) and mounted
under `/api/<resource>` in `src/app.js`: `auth`, `community-products`,
`establishments`, `events`, `gamification`, `notifications`, `onboarding`,
`orders`, `patient-resources`, `products`, `professionals`, `recipes`,
`scan`, `users`.

This list used to enumerate individual routes, but it drifted out of sync
with the actual API as routes were added — a hand-maintained duplicate of
`src/routes/` will always eventually go stale. For the exact methods, paths,
auth/role requirements, and request bodies, read the relevant
`src/routes/*.routes.js` file directly; each one is short and follows the
same shape.

All JSON responses use `{ "success": true, "data": ... }` or `{ "success": false, "message": "..." }`.

## Testing

```bash
npm test
```

Runs `node --test` against `test/*.test.js` — integration tests via `supertest` against a real MongoDB test database (the suite refuses to run if the connected database name doesn't look like a test database). Currently 25 tests across 10 suites, including a genuine concurrency test for the checkout transaction (two simultaneous orders for the last unit of stock — exactly one succeeds).
