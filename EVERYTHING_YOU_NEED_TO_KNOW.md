# Glutenia — Everything You Need to Know

A technical reference for integrating your project with Glutenia. Covers the full stack: repo structure, tech, API conventions, data models, auth, environment variables, and mobile app architecture.

---

## 1. What Glutenia is

A cross-platform (Android/iOS via Expo) app for people managing celiac disease or gluten intolerance. Core features: AI-assisted ingredient-label scanning, barcode product lookup, a gluten-free storefront, community events, a map of gluten-free-friendly places, and a gamification system (XP, levels, streaks, badges).

**Stack**: React Native (Expo) mobile app + Node.js/Express REST API + MongoDB (Mongoose). Deployed on Render (backend) and built via EAS (mobile).

---

## 2. Repo structure

```
glutenia-backend/
├── src/
│   ├── config/         # db.js (Mongo connection), auth.js (JWT secret/expiry)
│   ├── controllers/     # 12 files, one per resource
│   ├── middleware/      # errorHandler, isAdmin, requireRole, validateRequest, verifyToken
│   ├── models/          # 12 Mongoose models
│   ├── routes/          # 12 route files, mirrors controllers
│   ├── services/        # gamificationService, notificationService, pushService, scanService
│   ├── seed/            # seed.js (npm run seed), seedRecipes.js (auto-runs at boot if empty)
│   └── app.js           # Express app, route mounting, CORS, error handler
├── test/                # node:test + supertest integration tests
├── server.js            # entrypoint
├── .env.example
└── .env.production.example

glutenia-mobile/
├── App.js, app.json, eas.json
├── assets/{images,markers,onboarding}/
├── patches/              # patch-package patches
└── src/
    ├── api/client.js     # single fetch-based API client
    ├── components/       # ~28 shared UI components
    ├── context/          # 7 React Context providers
    ├── i18n/             # en/fr/ar locales
    ├── navigation/       # RootNavigator.js
    ├── screens/
    │   ├── admin/        # 10 admin-only screens
    │   ├── auth/         # Login, Register, ProfessionalPending
    │   ├── onboarding/   # 5-step profile onboarding wizard
    │   └── user/         # ~30 customer/professional-facing screens
    └── theme/            # colors.js, badgeTheme.js
```

---

## 3. Backend tech stack

- **Node.js** >= 20, **Express** ^4.21.2, **Mongoose** ^8.9.5
- **Auth**: `bcryptjs` (password hashing) + `jsonwebtoken`
- **Validation**: `express-validator`
- **File uploads**: `multer` (memory storage, 5MB limit)
- **AI**: `groq-sdk` — actively used for label scanning. `@google/genai` / `@google/generative-ai` are installed but **not currently wired up anywhere in the code** — treat as vestigial unless you find a use for them.
- `nodemailer` is installed but also unused/dead in the current codebase.

**npm scripts**: `start` (`node server.js`), `dev` (`node --watch server.js`), `seed`, `check` (syntax check), `test` (`node --test test/**/*.test.js`)

---

## 4. API reference

### Route mounts (all under `/api`)

| Base path | Resource |
|---|---|
| `/api/auth` | login/register/session |
| `/api/users` | user profile |
| `/api/onboarding` | 5-step profile questionnaire |
| `/api/products` | product catalog, barcode lookup |
| `/api/orders` | cart/checkout/order history |
| `/api/events` | community events, RSVP |
| `/api/establishments` | seller/professional storefronts |
| `/api/professionals` | professional account approval flow |
| `/api/recipes` | recipe catalog |
| `/api/scan` | AI label scanning |
| `/api/gamification` | XP/levels/streaks/badges |
| `/api/notifications` | in-app notifications |

`GET /` is a health check: `{ success: true, data: { name: "Glutenia API", status: "running" } }`. Unknown routes → 404 → central error handler.

### Response envelope — consistent across the entire API

Every endpoint returns:
```json
{ "success": true, "data": { ... } }
```
or on failure:
```json
{ "success": false, "message": "..." }
```
This is confirmed consistent across every controller — no exceptions found. **Your integration should rely on this shape everywhere.**

### Error handling

Central error middleware maps error types to status codes:
- Custom `err.statusCode` if thrown explicitly → that code
- Mongoose `CastError` (bad ObjectId) → 404
- Mongoose `ValidationError` → 400
- Mongo duplicate key (`err.code === 11000`) → 409, `"<field> already exists"`
- Multer file-too-large → 413

### CORS

- Non-production: wide open (`origin: "*"`).
- Production: `CORS_ORIGIN` env var is a comma-separated allowlist. Requests with no `Origin` header (native app fetches typically have none) are always allowed. **`CORS_ORIGIN` defaults to empty in `render.yaml`** — must be set to your actual origin(s) if you're calling the API from a browser/web context.

---

## 5. Authentication

- Header: `Authorization: Bearer <token>`
- Missing/malformed → `401 { success:false, message:"Authorization token is required" }`
- Invalid/expired → `401 { success:false, message:"Invalid or expired token" }`
- On success, `req.user` = decoded JWT payload: `{ id, name, email, role, iat, exp }`
- **Role enforcement**: `isAdmin` middleware (hard check for `role === "admin"`), or `requireRole(...roles)` factory (e.g. `requireRole("admin", "professional")` on seller-facing routes)
- Some routes (e.g. public event listing) use an inline `optionalAuth` that attaches `req.user` if a valid token is present but never blocks the request

**JWT_SECRET has a hardcoded fallback in `config/auth.js` if the env var isn't set — always set it explicitly in any environment you deploy.**

---

## 6. Data models (MongoDB / Mongoose)

| Model | Key fields |
|---|---|
| **User** | name, avatar, phone, pushTokens[], email(unique), password(hashed, select:false), role(customer/admin/professional), professionalStatus, role_type(warrior/supporter), gluten_free_since, experience_level, primary_goal, eating_out_frequency, confidence_identifying_gf, favoriteSpots[], theme_preference, language |
| **Product** | name, description, price, category, imageUrl, stock, isGlutenFree, barcode(unique+sparse), createdBy |
| **Order** | user, items[{product,name,qty,price}], total, deliveryFee, address{...}, status(pending/confirmed/shipped/delivered) |
| **Cart** | user(unique), items[{product,name,qty,price,imageUrl}] |
| **Event** | title, description, date, location, category, price, emoji, color, attendees[], createdBy |
| **Recipe** | name, description, category, imageUrl, calories, carbo, protein, ingredients[], preparation, popular |
| **Establishment** | owner(unique), name, category, description, coverImageUrl, address, phone, hours, coordinates{lat,lng}, verified |
| **Notification** | user, type, title, body, referenceId, read |
| **ScanHistory** | userId, scanType(barcode/label), verdict, summary, product |
| **Badge** | slug(unique), name, description, iconUrl, category, track(warrior/supporter/both), targetMetric, targetValue, xpReward |
| **UserBadge** | userId, badgeId, earnedAt, isPinned (unique on userId+badgeId) |
| **UserGamification** | userId(unique), totalXp, currentLevel, currentTitle, currentStreak, longestStreak, streakShields, scanCount, ingredientCheckCount, eventAttendanceCount, orderCount |
| **XpLedger** | userId, amount, sourceType, sourceId |

---

## 7. Environment variables

| Variable | Purpose |
|---|---|
| `NODE_ENV` | switches CORS behavior |
| `PORT` / `HOST` | server bind (default 5000 / 0.0.0.0) |
| `MONGO_URI` (or `MONGODB_URI`) | Mongo connection string — **required, no fallback** |
| `MONGO_DB_NAME` | DB name override if the URI has no path segment (default `glutenia`) |
| `TEST_MONGO_URI` | used only by the test suite |
| `JWT_SECRET` | token signing secret — always set explicitly |
| `JWT_EXPIRES_IN` | token TTL (default `7d`) |
| `CORS_ORIGIN` | comma-separated allowlist, production only |
| `GROQ_API_KEY` | **required** for `/api/scan/label` — not listed in `.env.example`, easy to miss |
| `GEMINI_API_KEY` | provisioned in `render.yaml` but not currently read by any code |

---

## 8. AI label scanning

- `POST /api/scan/label` (auth required)
- Input: `{ imageBase64, mimeType }` (mimeType defaults to `image/jpeg`)
- Uses Groq's OpenAI-compatible API, model `qwen/qwen3.6-27b`, with `reasoning_effort: "none"` to force plain JSON output
- Response: `{ verdict, flagged[], safe_highlights[], raw_text, confidence, confidence_note, error }`
- On success, also records a `ScanHistory` entry and awards gamification XP (+10, action type `label_scan`)

---

## 9. Mobile app architecture

### Navigation

Root switches between 5 top-level navigators based on state:
1. **OnboardingStack** — first-launch intro carousel
2. **AuthStack** — Login / Register / ProfessionalPending
3. **AdminStack** — bottom tabs (Dashboard, Products, Scan, Orders, Account) + admin-only stacked screens
4. **ProfileOnboardingStack** — 5-step questionnaire (Role → Journey → Goal → EatingOut → Confidence)
5. **UserStack** (default) — bottom tabs (Home, Events, Scan, Map, Profile) + ~25 stacked screens (cart/checkout, badges, map/favorites, shop, recipes, seller screens for professionals, settings, etc.)

### API client (`src/api/client.js`)

**Base URL resolution**, in priority order:
1. `process.env.EXPO_PUBLIC_API_URL` (set at build time — production EAS profile points this at `https://glutenia-2ksi.onrender.com/api`)
2. `app.json`'s `extra.apiBaseUrl` (`http://10.0.2.2:5000/api` — Android emulator loopback)
3. Dev-server host inferred from Expo's `hostUri` (LAN dev)
4. Platform fallback (`10.0.2.2` Android / `localhost` else)

- Auth token sent as `Authorization: Bearer <token>` — matches backend exactly
- The client automatically unwraps `{ success, data, message }`: returns `data` on success, throws an `Error` (with `.status`/`.data`) otherwise
- Default request timeout 20s, longer (30–45s) for uploads/AI calls
- ~40 typed API methods, one-to-one with backend routes

### Context providers (`src/context/`)

| Provider | Purpose |
|---|---|
| `AuthContext` | session state, login/register/logout, restores from AsyncStorage, registers push token |
| `ThemeContext` | light/dark theme, persisted |
| `CartContext` | cart items, persisted per-user |
| `EventsContext` | locally-cached "joined events" state, persisted per-user |
| `GamificationContext` | triggers XP toasts / badge-unlock / level-up modals from API response deltas |
| `NotificationContext` | polls `GET /api/notifications` every 30s |
| `AlertContext` | overrides `Alert.alert` with a custom themed dialog |

### Mobile key dependencies

- `expo` 53.0.27, `react-native` 0.79.6, `react`/`react-dom` 19.0.0
- `@react-navigation/native` 6.1.18 (bottom-tabs 6.6.1, native-stack 6.11.0)
- `expo-camera`, `expo-image-picker`, `expo-notifications`, `expo-localization`
- `@react-native-async-storage/async-storage` 2.1.2
- `i18next`/`react-i18next` (en/fr/ar)
- `jsEngine: "jsc"`, `newArchEnabled: false`

---

## 10. Deployment

**Backend (Render)** — `render.yaml`:
- Single web service, `rootDir: glutenia-backend`, build `npm ci`, start `npm start`
- Health check: `GET /`
- Env vars managed in Render dashboard: `MONGO_URI`, `JWT_SECRET` (auto-generated), `GROQ_API_KEY`, `GEMINI_API_KEY`, `CORS_ORIGIN` (defaults empty — **set this if you're calling from a browser**)

**Mobile (EAS)** — `eas.json` build profiles:
- `development` — dev client, internal distribution
- `preview` — internal distribution, Android APK
- `production` — Android APK, `EXPO_PUBLIC_API_URL=https://glutenia-2ksi.onrender.com/api`

`app.json`: package `com.glutenia.mobile`, EAS project ID `fd258cdb-960b-415e-b93d-d1d01d1d3c08`.

---

## 11. Testing

- Node's built-in `node:test` runner + `supertest`, no Jest/Mocha
- `glutenia-backend/test/api.test.js` (main integration suite) + `db-config.test.js` (unit test)
- Run: `npm test`
- Requires a **real, reachable MongoDB** (local or `TEST_MONGO_URI`) — no in-memory mock. The suite refuses to run unless the connected DB name contains `test`, then wipes all collections before and after.
- Coverage: auth, profile, product CRUD + image upload, barcode lookup, recipes, orders + gamification side effects, access control, scan endpoint auth/validation (not the real Groq call itself), notification delivery.

---

## 12. Things to double-check before integrating

- `GROQ_API_KEY` is required for label scanning but isn't documented in `.env.example` — don't miss it.
- `CORS_ORIGIN` defaults to empty string in production — set it explicitly if your integration calls this API from a browser context.
- Gemini packages are installed on both sides but not wired up anywhere found in this pass — don't assume Gemini-based features exist unless you locate an actual call site.
- The API response envelope (`{ success, data, message }`) is consistent everywhere — safe to build a shared unwrapping layer around it.
