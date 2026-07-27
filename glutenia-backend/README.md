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
