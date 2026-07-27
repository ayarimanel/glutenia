# Glutenia Backend — Engineering Audit

**Scope:** `glutenia-backend/` (Node.js 20 + Express 4 + Mongoose 8), read-only.
**Consumer:** `glutenia-mobile` (React Native, recently migrated to TypeScript).
**Purpose:** PFE (final-year engineering project) defense preparation.
**Method:** every file in `src/`, `scripts/`, `test/`, `package.json`, `.env*`, and every backend-calling line in the mobile app's `src/api/client.ts` was read directly. No claim below is inferred from "typical Express app" behavior — each one cites the actual file and line.

Legend for hats: 🔧 Backend Engineer · 🏗️ Architect · 🎓 PFE Evaluator · 📖 Reviewer

---

## 0. Executive Summary

- **This is real engineering, not a tutorial clone.** The order-checkout flow uses a genuine MongoDB transaction with atomic stock reservation to prevent overselling under concurrency, and it's the one thing in the codebase with a dedicated race-condition test (`test/api.test.js:609`). That is graduate-level backend work for a student project.
- **The one finding that actually matters for security is a hardcoded JWT fallback secret** in `src/config/auth.js:1-2`. It's low-probability (only triggers if `JWT_SECRET` is unset in production) but high-impact (full auth bypass) if it ever fires — verify your deployment's environment variables before the defense.
- **Authorization is consistently and correctly enforced.** Every protected route was checked against its middleware; there is no route that's missing auth where it should have it, and IDOR checks (order ownership, product ownership, notification ownership) are present everywhere they're needed.
- **Five endpoints and three npm dependencies are confirmed dead** by cross-referencing every call site in `glutenia-mobile/src/api/client.ts`. This is easy, safe, high-value cleanup before a jury asks "what does this endpoint do?" and you don't have an answer.
- **The biggest structural gap is pagination — there is none, anywhere.** Every list endpoint (`/products`, `/orders`, `/users`, etc.) returns the full collection. This is invisible at demo scale and worth naming honestly as a "perspective d'évolution" rather than fixing under deadline pressure.

### Severity Summary

| Severity | Count | Examples |
|---|---|---|
| High | 1 | Hardcoded JWT fallback secret |
| Medium | 9 | Stale role in JWT, no rate limiting on auth, undocumented `GROQ_API_KEY`, non-transactional account deletion, no pagination, missing `Order.user` index, base64 images in MongoDB, `scanLabel` bypasses central error handler, stale README route list |
| Low | 11 | Dead endpoints (5), unused dependencies (3), `pickFields` duplication (5×), `isAdmin`/`requireRole` overlap, snake_case/camelCase split on `User`, duplicated delivery-fee constant, upload MIME-type trust, `favoriteSpots` shape validation, verb-in-path inconsistency, uncommented fire-and-forget, sequential awaits in `recordAction` |
| Strengths worth presenting | 8 | Transactional checkout, three-layer password protection, systemic `select:false`, escaped regex search, consistent error-to-`next()` pattern, test-DB guard rail, "why" comments, consistent response envelope |

### The three things that matter most

1. **Verify `JWT_SECRET` is actually set on your production host.** This is the only finding in this report that could be a real vulnerability rather than a code-quality note — and it takes five minutes to check.
2. **Pagination is missing everywhere.** Don't fix it under time pressure — name it explicitly as a known limitation in your report. A jury respects "I know this doesn't scale and here's why I didn't fix it before the deadline" far more than silence.
3. **Your test suite (748 lines, including a concurrent-order race-condition test) and your transactional checkout are your strongest engineering evidence.** Lead with them in the defense — don't bury them under CRUD explanations.

---

## Phase A — Inventory

### Folder Structure

```
glutenia-backend/
├── server.js                       # entry point
├── src/
│   ├── app.js                      # Express app, route mounting, CORS, 404, error handler
│   ├── config/
│   │   ├── auth.js                 # JWT secret/expiry accessors
│   │   └── db.js                   # Mongo connection
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   ├── isAdmin.js
│   │   ├── requireRole.js
│   │   ├── validateRequest.js
│   │   └── verifyToken.js
│   ├── models/                     # 15 Mongoose schemas
│   ├── routes/                     # 14 route files
│   ├── controllers/                # 14 controller files
│   ├── services/
│   │   ├── gamificationService.js  # XP/levels/streaks/badges
│   │   ├── notificationService.js
│   │   ├── pushService.js          # Expo push
│   │   └── scanService.js
│   ├── utils/barcode.js            # GS1 checksum validation
│   ├── seed/                       # seed.js, seedRecipes.js (auto-run on boot)
│   └── scripts/                    # one-off admin/migration scripts (not part of the running app)
├── scripts/                        # check-syntax.js, exportOrphanedData.js
├── test/
│   ├── api.test.js                 # 748-line integration suite (supertest + real test DB)
│   └── db-config.test.js
├── orphaned-data-backup-2026-07-22/  # untracked JSON export, see §5
└── .env / .env.example / .env.production.example
```

### Every Endpoint (62 total, 14 resource groups + health check)

> **Update (backend-hardening branch):** of the 5 endpoints flagged "dead" below, only 2 were actually unused everywhere (`GET /community-products/barcode/:code`, `GET /gamification/badges`) and have been deleted. The other 3 (`GET /orders/:id`, `GET /users`, `GET /users/:id/orders`) turned out to be exercised by `test/api.test.js:480-520` even though the mobile app never calls them — they were kept. See the table below for the corrected annotations and the `backend-hardening` branch commit history for the full reasoning.

| Method | Path | Auth | Role | Body | Success | Errors |
|---|---|---|---|---|---|---|
| GET | `/` | — | — | — | 200 | — |
| POST | `/api/auth/register` | — | — | name,email,password,role?,phone? | 201 | 400,409 |
| POST | `/api/auth/login` | — | — | email,password | 200 | 400,401,403 |
| GET | `/api/auth/me` | ✓ | any | — | 200 | 401,404 |
| PUT | `/api/auth/me` | ✓ | any | name?,avatar?,phone?,... | 200 | 400,401,404 |
| POST | `/api/auth/push-token` | ✓ | any | token | 200 | 400,401 |
| DELETE | `/api/auth/push-token` | ✓ | any | token? | 200 | 401 |
| PUT | `/api/auth/change-password` | ✓ | any | currentPassword,newPassword | 200 | 400,401,404 |
| DELETE | `/api/auth/me` | ✓ | any | password | 200 | 400,401,404 |
| POST | `/api/community-products` | ✓ | any | barcode,name,imageUrl,isGlutenFree,brand?,category? | 201 | 400,401,409,429 |
| POST | `/api/community-products/:id/flag` | ✓ | any | — | 200 | 400,401,404,409 |
| GET | `/api/establishments` | — | — | query: category? | 200 | 400 |
| GET | `/api/establishments/mine` | ✓ | admin,professional | — | 200 | 401,403 |
| PUT | `/api/establishments/mine` | ✓ | admin,professional | name?,category?,... | 200 | 400,401,403 |
| PUT | `/api/establishments/mine/image` | ✓ | admin,professional | multipart `image` | 200 | 400,401,403,404,413 |
| GET | `/api/establishments/:id` | — | — | — | 200 | 400,404 |
| GET | `/api/events` | optional | — | — | 200 | — |
| GET | `/api/events/:id` | optional | — | — | 200 | 400,404 |
| POST | `/api/events` | ✓ | admin | title,date,location,category,... | 201 | 400,401,403 |
| PUT | `/api/events/:id` | ✓ | admin | partial | 200 | 400,401,403,404 |
| DELETE | `/api/events/:id` | ✓ | admin | — | 200 | 400,401,403,404 |
| POST | `/api/events/:id/rsvp` | ✓ | any | — | 200 | 400,401,404 |
| GET | `/api/gamification/profile` | ✓ | any | — | 200 | 401,404 |
| GET | `/api/gamification/home` | ✓ | any | — | 200 | 401,404 |
| PUT | `/api/gamification/badges/:badgeId/pin` | ✓ | any | isPinned | 200 | 400,401,404 |
| GET | `/api/notifications` | ✓ | any | — | 200 | 401 |
| PUT | `/api/notifications/read-all` | ✓ | any | — | 200 | 401 |
| PUT | `/api/notifications/:id/read` | ✓ | any | — | 200 | 400,401,404 |
| PUT | `/api/onboarding/profile` | ✓ | any | roleType,... | 200 | 400,401,404 |
| POST | `/api/orders` | ✓ | any | items[],address | 201 | 400,401,404,409 |
| GET | `/api/orders/my` | ✓ | any | — | 200 | 401 |
| GET | `/api/orders/seller` | ✓ | admin,professional | — | 200 | 401,403 |
| GET | `/api/orders` | ✓ | admin | — | 200 | 401,403 |
| GET | `/api/orders/:id` | ✓ | any (owner or admin) | — | 200 | 400,401,403,404 | unused by mobile, **kept** — covered by `test/api.test.js:480` |
| PUT | `/api/orders/:id/status` | ✓ | admin,professional | status | 200 | 400,401,403,404 |
| GET | `/api/patient-resources` | — | — | query: category? | 200 | — |
| GET | `/api/patient-resources/:id` | — | — | — | 200 | 400,404 |
| POST | `/api/patient-resources` | ✓ | admin | title,... | 201 | 400,401,403 |
| PUT | `/api/patient-resources/:id` | ✓ | admin | partial | 200 | 400,401,403,404 |
| DELETE | `/api/patient-resources/:id` | ✓ | admin | — | 200 | 400,401,403,404 |
| GET | `/api/products` | — | — | query: category?,search? | 200 | — |
| GET | `/api/products/barcode/:code` | ✓ | any | — | 200 | 401,404 |
| GET | `/api/products/mine` | ✓ | admin,professional | — | 200 | 401,403 |
| GET | `/api/products/:id` | — | — | — | 200 | 400,404 |
| POST | `/api/products` | ✓ | admin,professional | name,price,... | 201 | 400,401,403 |
| PUT | `/api/products/:id/image` | ✓ | admin,professional | multipart `image` | 200 | 400,401,403,404,413 |
| PUT | `/api/products/:id` | ✓ | admin,professional (owner) | partial | 200 | 400,401,403,404 |
| DELETE | `/api/products/:id` | ✓ | admin,professional (owner) | — | 200 | 400,401,403,404 |
| GET | `/api/professionals/requests` | ✓ | admin | query: status? | 200 | 400,401,403 |
| POST | `/api/professionals/requests/:id/approve` | ✓ | admin | — | 200 | 400,401,403,404 |
| POST | `/api/professionals/requests/:id/reject` | ✓ | admin | — | 200 | 400,401,403,404 |
| GET | `/api/recipes` | — | — | query: category? | 200 | — |
| GET | `/api/recipes/:id` | — | — | — | 200 | 400,404 |
| POST | `/api/recipes` | ✓ | admin | name,... | 201 | 400,401,403 |
| PUT | `/api/recipes/:id` | ✓ | admin | partial | 200 | 400,401,403,404 |
| DELETE | `/api/recipes/:id` | ✓ | admin | — | 200 | 400,401,403,404 |
| POST | `/api/scan/label` | ✓ | any | imageBase64,mimeType? | 200 | 400,401,422,500 |
| GET | `/api/scan/history` | ✓ | any | — | 200 | 401 |
| GET | `/api/users` | ✓ | admin | — | 200 | 401,403 | unused by mobile, **kept** — covered by `test/api.test.js:500` |
| GET | `/api/users/analytics` | ✓ | admin | — | 200 | 401,403 |
| GET | `/api/users/me/favorites` | ✓ | any | — | 200 | 401 |
| PUT | `/api/users/me/favorites` | ✓ | any | favorites[] | 200 | 400,401 |
| GET | `/api/users/:id/orders` | ✓ | admin | — | 200 | 400,401,403,404 | unused by mobile, **kept** — covered by `test/api.test.js:508` |

### Every Mongoose Model

| Model | Key fields | Relationships | Notable |
|---|---|---|---|
| `User` | name, email(unique), password(select:false), role(enum), professionalStatus, role_type, experience_level, primary_goal, favoriteSpots(Mixed) | — | password hidden by default at schema level |
| `Cart` | user(ref, unique), items[] | → Product | **never read via any API route** (§Cross-check) |
| `Product` | name, price, category(enum), stock, barcode(sparse unique) | ← Order, Cart, ScanHistory | |
| `CommunityProduct` | barcode(unique), isGlutenFree, flagCount, disputed | → User (submittedBy) | |
| `Establishment` | owner(ref, unique), category(enum), coordinates | → User | one establishment per owner |
| `Event` | title, category(enum), attendees[] | → User (attendees, createdBy) | |
| `Notification` | user(ref, indexed), type, read | → User | |
| `Order` | user(ref), items[], total, status(enum) | → User, Product | **`user` field not indexed** |
| `PatientResource` | title, category(enum) | → User (createdBy) | |
| `Recipe` | name, category(enum), ingredients[] | → User (createdBy) | |
| `ScanHistory` | userId(ref, indexed), scanType(enum), verdict | → User, Product | |
| `Badge` | slug(unique), targetMetric, targetValue, track(enum) | — | badge catalog, seeded |
| `UserBadge` | userId+badgeId(compound unique) | → User, Badge | |
| `UserGamification` | userId(ref, unique), totalXp, currentStreak | → User | |
| `XpLedger` | userId(ref), amount, sourceType | → User | audit trail for XP |

### Every Middleware

| Middleware | Applied where | Purpose |
|---|---|---|
| `verifyToken` | ~45 of 64 routes | Requires valid JWT, sets `req.user` from token payload |
| `isAdmin` | events (write), patient-resources (write), recipes (write), professionals, orders (all), users (admin) | Requires `req.user.role === "admin"` |
| `requireRole(...roles)` | establishments (owner), products (write), orders (seller/status) | Requires role in allowlist |
| `validateRequest` | ~40 routes | Runs `express-validator` results, 400 on failure |
| `errorHandler` | global, last in `app.js` | Central error → JSON translation |
| `optionalAuth` (event.routes.js, inline, not extracted) | events (read) | Attaches `req.user` if present, never blocks |

### npm Dependencies — used vs. not

| Package | Used? | Where |
|---|---|---|
| express, mongoose, cors, dotenv, jsonwebtoken, bcryptjs, express-validator, multer, groq-sdk | ✅ | throughout |
| `@google/genai` | ❌ | zero `require()` anywhere in the repo |
| `@google/generative-ai` | ❌ | zero `require()` anywhere in the repo |
| `nodemailer` | ❌ | zero `require()` anywhere in the repo |
| `supertest` (dev) | ✅ | `test/api.test.js` |

Matching `.env`/`.env.example` also carry `GEMINI_API_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `MAIL_FROM` — env vars for the three unused packages. Meanwhile `GROQ_API_KEY`, which `scan.controller.js:41` actually requires, appears in **none** of the three env files (verified with `grep -i GROQ .env .env.example .env.production.example` → no match).

### Size

- **6,271 total lines** across all `.js` files (app code + scripts + seed + tests), per `wc -l`.
- Largest files: `test/api.test.js` (748), `gamificationService.js` (394), `auth.controller.js` (311), `product.controller.js` (271), `order.controller.js` (242).
- No file exceeds ~400 lines; see §1 for whether that size is justified.

---

## 1. Architecture

**Layering:** `routes → (express-validator chains) → controllers → [services for gamification/notification/push/scan] → models`. This is consistent across all 14 resource groups — every route file follows the identical shape (validators defined at top, `router.METHOD(path, ...middleware, validators, validateRequest, controller.fn)`).

**Verdict:** consistent, not god-file-ridden, genuinely easy to extend. One real inconsistency and one duplication pattern worth fixing before the report.

### Where business logic lives

🏗️ Most business logic correctly lives in controllers (thin CRUD) or services (genuinely stateful logic: XP math, streaks, notifications). One exception:

- **`order.controller.js:48-134`** (`reserveStock` + `createOrder`) contains the single most complex piece of business logic in the app — atomic stock reservation, a Mongo transaction, subtotal/delivery-fee computation — and it lives directly in the controller, not a service. Contrast this with `gamificationService.js`, which extracts comparably complex logic (leveling, streaks, badge eligibility) into a dedicated service. This isn't wrong at this scale, but it's an inconsistency a jury could reasonably ask about: "why does order logic live in the controller while gamification logic doesn't?" Honest answer: no strong reason, it just wasn't extracted yet.

### God-files?

| File | Lines | Justified? |
|---|---|---|
| `gamificationService.js` | 394 | **Yes.** It owns 5 distinct-but-related responsibilities (level math, streak+shield logic, three separate badge-eligibility paths, two read-aggregation functions for two different screens) but each function is short, single-purpose, and independently testable. Not a god-file — a cohesive service. |
| `auth.controller.js` | 311 | **Yes.** 8 straightforward handlers (register/login/profile/push-token×2/password/delete), no shared complexity, no branching beyond role/status checks. |
| `product.controller.js` | 271 | **Yes.** 8 CRUD-ish handlers plus barcode lookup with community-product fallback; the extra length is the fallback logic (lines 45-87), which is legitimate domain complexity, not sprawl. |

No file in the codebase qualifies as a genuine god-file under any reasonable line-count or responsibility-count threshold.

### Adding a new resource — concrete walkthrough

Following the existing pattern (e.g. to add "Reviews"):
1. `src/models/Review.js` — schema (~15 min, copy an existing model's shape)
2. `src/routes/review.routes.js` — express-validator chains + route wiring (~20 min, copy `patientResource.routes.js` as the closest template)
3. `src/controllers/review.controller.js` — 5 CRUD handlers using the existing `pickFields` pattern (~20 min)
4. `src/app.js` — two lines: `require` + `app.use("/api/reviews", reviewRoutes)`

Four touch points, ~1 hour, following an identical pattern used 14 times already. **This is a genuine strength** — the architecture is uniform enough that a new contributor (or you, at 2am before the defense) can extend it mechanically.

### Circular dependencies / ownership

None found. Dependency direction is strictly `routes → controllers → services → models`; no model imports a controller or service, no service imports a controller. Clean unidirectional graph.

**Verdict: 🏗️ Consistent layering, no god-files, cheap to extend. The one thing to name honestly in the report: order logic sits in the controller while comparably complex gamification logic sits in a service — a minor, explainable inconsistency, not a defect.**

---

## 2. Code Quality

### Duplication

The same "whitelist fields from `req.body`" pattern is reimplemented independently **five times**, nearly identically:

- `establishment.controller.js:3-20` (`allowedFields` / `pickFields`)
- `patientResource.controller.js:3-18` (`ALLOWED_FIELDS` / `pickFields`)
- `recipe.controller.js:3-22` (`ALLOWED_FIELDS` / `pickFields`)
- `product.controller.js:5-39` (`allowedProductFields` / `pickProductFields`, with extra barcode-unset logic)
- `event.controller.js:6,79-82` (`ALLOWED_FIELDS`, inlined as a `.reduce()` rather than a named helper)

```js
// patientResource.controller.js:12-18 — representative of all five
const pickFields = (body) =>
  ALLOWED_FIELDS.reduce((fields, key) => {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      fields[key] = body[key];
    }
    return fields;
  }, {});
```

**Fix:** extract `src/utils/pickFields.js` exporting `pickFields(body, allowedFields)`. Low effort (~15 min), removes ~40 duplicated lines, and is exactly the kind of "I noticed the pattern and factored it" observation that reads well in a report.

### Code smells

- **Magic number duplicated in two places that must stay in sync manually:** delivery fee is `7` in `Order.js:80` (schema default) **and** `DELIVERY_FEE = 7` in `order.controller.js:8`. If one changes without the other, existing orders and new orders silently disagree. Low effort fix: import the constant from one place.
- **Two middleware doing overlapping jobs:** `isAdmin.js` hardcodes a check for `role === "admin"`; `requireRole.js` takes a variadic role list and is used as `requireRole("admin", "professional")` elsewhere. `isAdmin` is functionally identical to `requireRole("admin")`. Not a bug, but an avoidable second abstraction for the same concept — cite `src/middleware/isAdmin.js` and `src/middleware/requireRole.js`.
- **Async pattern consistency:** async/await is used uniformly across all 14 controllers and 4 services — no callback style anywhere. The one `.then()/.catch()` chain is a deliberate fire-and-forget in `event.controller.js:56-69` (notify all customers of a new event, without blocking the response). This is a legitimate pattern — `server.js:18-20` does the same thing for recipe seeding — but `server.js`'s version has a `// Fire-and-forget:` comment explaining why it's unawaited, while `event.controller.js`'s does not. Minor: a reader could mistake the latter for a missing `await` bug.

### Complexity

| Function | Approx. cyclomatic complexity | Why it's the most complex in the codebase |
|---|---|---|
| `order.controller.js:48-77` `reserveStock` | ~5 | Atomic guarded update, then a fallback query to distinguish "product missing" from "insufficient stock" for a better error message |
| `order.controller.js:79-134` `createOrder` | ~6 | Loop-with-await inside a Mongo session/transaction, plus post-commit gamification side effect outside the transaction |
| `gamificationService.js:98-149` `updateStreak` | ~6 | Same-day/consecutive-day/gap-with-shield/gap-without-shield branching — inherently branchy domain logic (calendar streak + shield economy), reasonably factored into one function rather than scattered |

These are complex **because the problem is complex**, not because the code is messy — worth saying explicitly to a jury: the complexity maps to genuine business rules (no double-selling stock, streak-with-forgiveness-shield), not accidental complexity.

### Dead code

See the "dead" endpoints tagged in the Phase A table, and the unused-dependency table. Additionally:

- `src/scripts/*` (8 files: `addDemoEvents.js`, `addDemoProducts.js`, `addPatientResources.js`, `addMorePatientResources.js`, `addProfileFactBadges.js`, `addCommunityContributorBadge.js`, `migrateGamification.js`) and `scripts/exportOrphanedData.js`, `scripts/check-syntax.js` are one-off operational tools, never `require()`'d by `app.js`/`server.js`. Not dead code — legitimate ops tooling — but shouldn't be counted as "the app" when discussing line counts or architecture.

### Naming

📖 One real inconsistency, confirmed at the model level: `User.js:70-118` uses `snake_case` for every onboarding-related field (`role_type`, `gluten_free_since`, `experience_level`, `primary_goal`, `eating_out_frequency`, `confidence_identifying_gf`) while **every other field in every other model** — including the rest of `User.js` itself (`createdAt`, `pushNotificationsEnabled`, `theme_preference`... wait, `theme_preference` is also snake_case, `pushNotificationsEnabled` is camelCase) — uses `camelCase`. The API surface (`onboarding.routes.js:32-55`, request bodies) is consistently `camelCase` (`roleType`, `glutenFreeSince`), so there's a translation layer between a clean camelCase API contract and a partially snake_case DB schema. Not a bug — but a real "why is this different" a jury could ask, and worth having an honest one-line answer ready ("the onboarding fields were added in a later pass and didn't match the original schema's convention").

### Refactoring opportunities, ranked by value/effort

| Refactor | Value | Effort |
|---|---|---|
| Extract shared `pickFields` util (5 call sites) | Medium | 15 min |
| Single source of truth for delivery fee | Low | 5 min |
| Collapse `isAdmin` into `requireRole("admin")` | Low | 10 min |
| Comment the fire-and-forget in `event.controller.js` | Low | 2 min |

**Verdict: 📖 Clean, consistent async style and no accidental complexity — the complex functions are complex because the domain is. The `pickFields` duplication is the one refactor worth actually doing; everything else is cosmetic.**

---

## 3. API Design

See the full endpoint table in Phase A for the required per-endpoint columns.

### REST conventions

- Resource nouns are plural and consistent: `products`, `recipes`, `orders`, `events`, `establishments`, `users`, `notifications`, `patient-resources`, `community-products`, `professionals`. ✅
- `auth`, `onboarding`, `scan` are singleton/action-style resources by design (a session, a one-time survey, an AI action) — not a REST violation, a deliberate and reasonable exception.
- **Verb-in-path inconsistency:** `professional.routes.js:20-35` exposes `POST /professionals/requests/:id/approve` and `POST /professionals/requests/:id/reject` — verbs in the path for a state transition. Compare this to the *conceptually identical* problem (transition a resource's status) solved differently in `order.routes.js:68-76`: `PUT /orders/:id/status` with `{ status: "..." }` in the body. Two different patterns for the same kind of operation, in the same codebase. Not wrong (verb-suffixed action endpoints are a common, accepted REST pragmatism for binary approve/reject decisions), but worth naming as an inconsistency if asked.
- `POST /events/:id/rsvp`, `POST /community-products/:id/flag`, `PUT /gamification/badges/:badgeId/pin` are all similar action-suffix endpoints — reasonable, RSVP/flag/pin don't map cleanly to plain CRUD verbs.

### HTTP status codes

Checked every controller's status codes against the table in Phase A. **No incorrect status codes found** — creates return 201, reads/updates return 200, deletes return 200 with a message body (not 204, but consistent across the whole API, and 200-with-body is a defensible choice since every response uses the same envelope). 404s are used correctly for missing resources; 403s for authorization failures; 409s for conflicts (duplicate email, duplicate barcode, already-flagged); 429 for the community-product rate limit; 413 for oversized uploads (via `errorHandler.js:27-30` catching Multer's `LIMIT_FILE_SIZE`).

### Response shape consistency

Every single response in the codebase — across all 14 controllers, the 404 handler (`app.js:71-76`), and `errorHandler.js` — uses exactly one of two shapes:
```json
{ "success": true, "data": ... }
{ "success": false, "message": "..." }
```
This is enforced almost everywhere by construction (controllers always call `res.json({success, data})` or delegate to `next(error)` → `errorHandler`). **One genuine exception:** `scan.controller.js:110-115` catches its own errors and responds directly with `res.status(500).json({success:false, message: error?.message || String(error)})`, bypassing `next(error)` and the central `errorHandler` entirely. The shape is still correct, but it means Groq API errors are surfaced to the client **unfiltered** — see §7 for why that matters.

One deliberate, justified exception to the "error responses never carry `data`" rule: `auth.controller.js:105-115` returns `403` with `data: { professionalStatus, approvalCode }` on a pending-professional login attempt, because the client genuinely needs that data to route the user correctly. Worth having this ready as an answer if a juror asks "why does this error have a data field?"

**Verdict: 🔧 Status codes and response envelope are correct and consistent almost everywhere — this alone puts the API above a typical student project. The one inconsistency (approve/reject verb-paths vs. status-in-body) is worth a one-line mention, not a fix.**

---

## 4. Security

### Authentication

**JWT creation** (`auth.controller.js:12-23`): signs `{ id, name, email, role }`, expiry from `JWT_EXPIRES_IN` (default `7d`).

```js
// auth.controller.js:12-23
const createToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: getJwtExpiresIn() }
  );
};
```

**🔴 HIGH — Hardcoded fallback JWT secret.**
`src/config/auth.js:1-4`:
```js
const FALLBACK_JWT_SECRET =
  "glutenia-render-fallback-jwt-secret-change-after-deploy-2026";
const getJwtSecret = () => process.env.JWT_SECRET || FALLBACK_JWT_SECRET;
```
- **Current implementation:** if `process.env.JWT_SECRET` is ever unset, unreachable, or empty in a running instance, the app silently signs and verifies tokens with a secret that is committed to source control (visible to anyone with repo access — including, presumably, your PFE jury if the repo is shared).
- **Risk:** anyone who reads this file can forge a JWT for any user ID and any role, including `"admin"`, and every protected route (`verifyToken.js:17`) will accept it. This is a full authentication and authorization bypass.
- **Realistic exploit scenario:** the fallback exists specifically because the comment says "render-fallback... change-after-deploy" — this reads like a secret that was meant to be temporary during initial deployment. If `JWT_SECRET` was never actually set on the live host (or was reset and not restored), the API is currently signing tokens with a secret anyone can read on GitHub.
- **Not verified:** I cannot check your production environment variables from this codebase. **You should verify this yourself before the defense** — if a real random `JWT_SECRET` is confirmed set on the live server, this finding drops from a live vulnerability to "notice how defensively I designed my fallback story" — still worth fixing, but no longer urgent.
- **Fix:** remove the fallback; throw at startup if `JWT_SECRET` is missing (fail loud, not silently insecure). Locally, `.env` does have a real 33-character secret set (verified length only, not printed).

**🟡 MEDIUM — Role is trusted from the JWT payload, never re-checked against the database.**
`isAdmin.js:2` and `requireRole.js:2` both check `req.user.role`, which comes straight from the decoded JWT (`verifyToken.js:17`) — not a fresh DB lookup.
- **Risk:** if a user's role is ever changed server-side (e.g. an admin account is demoted during incident response), any token issued before that change remains fully privileged for up to 7 days (`JWT_EXPIRES_IN`), because nothing re-validates role against current DB state.
- **Realistic scenario:** you (as admin) discover a compromised account and change its role to `customer` in the database directly. If that account already has a valid token, it keeps admin access for up to a week — there is no token revocation or blacklist.
- **Calibration:** this is standard behavior for stateless JWTs and not a defect unique to this codebase — every JWT-based system has this tradeoff unless it adds a revocation list or short-lived tokens + refresh. Flagging it as **medium, not high**, because there's currently no code path that actually demotes a role after creation (only `professionalStatus` changes on approve/reject, which `login.controller.js:105` does check server-side on every login). Worth naming as a known limitation, not fixing under deadline pressure.

### Authorization / IDOR

Every protected route was checked against the Phase A auth/role table. **No route is missing authorization where it should have one.** IDOR checks were verified present at every point where a user could otherwise reach another user's data:

| Location | Check |
|---|---|
| `order.controller.js:185` `getOrderById` | `req.user.role !== "admin" && orderUserId !== req.user.id` → 403 |
| `order.controller.js:212-223` `updateOrderStatus` | non-admin sellers restricted to orders containing their own products |
| `product.controller.js:41-43` `canManageProduct` | admin or `product.createdBy === req.user.id`, applied to update/delete/image-upload |
| `notification.controller.js:20-24` `markRead` | `findOneAndUpdate({_id, user: req.user.id}, ...)` — scoped by ownership in the query itself, not a separate check |
| `establishment.controller.js:69,92-96` | all "mine" operations scoped by `owner: req.user.id` |
| `gamification.controller.js:39-43` `updateBadgePin` | scoped by `userId: req.user.id` |

This is genuinely solid, uniform IDOR discipline across a 14-resource API — call this out explicitly in the report as a design strength.

### Password hashing

**✅ Done correctly, three layers of defense-in-depth.**
1. `bcrypt.hash(password, 12)` — 12 salt rounds (`auth.controller.js:47,258`), an appropriate cost factor.
2. Schema-level `select: false` (`User.js:51-55`) — the password hash is excluded from **every** query by default, including `professional.controller.js`'s and `user.controller.js`'s unfiltered `User.find()` calls, which never call `.select("+password")` and therefore never see the hash, without the developer having to remember to strip it.
3. `toJSON` transform (`User.js:125-130`) additionally deletes `password` on serialization, and `auth.controller.js:25-29`'s `toSafeUser()` does it a third time before sending the register/login response.

This is more careful than most production codebases I'd expect from this scale — worth highlighting explicitly per the ground rule to say when something is already good.

### Input validation

`express-validator` is used consistently on nearly every mutating route (see Phase A — ~40 of 64 routes have a validator chain). This *is* "the one approach" the report should recommend, because it's already in place and working — no need to introduce a second validation library.

**Coverage gaps found:**

| Endpoint | Gap |
|---|---|
| `POST /scan/label` | `imageBase64` only checked for truthiness (`scan.controller.js:37`), no size/format validation; `mimeType` accepted as-is with no allowlist |
| `PUT /users/me/favorites` | only `Array.isArray(favorites)` is checked (`user.controller.js:90`); item shape is unconstrained because `favoriteSpots` is `Schema.Types.Mixed` (`User.js:110-113`) |

Both are low-severity: `scanLabel` only accepts input from an authenticated user and the payload just gets forwarded to Groq; `favoriteSpots` is a user's own data with no cross-user exposure.

### Injection

- **NoSQL injection:** `User.findOne({ email })` (`auth.controller.js:38,88`) takes `req.body.email` directly, but the route validator requires `body("email").isEmail()` (`auth.routes.js:32-35`) before the controller ever runs — `express-validator`'s `isEmail()` rejects non-string values, which blocks the classic `{ email: { "$ne": null } }` injection attempt at the validation layer. **Verified safe**, not just assumed.
- **Regex injection / ReDoS in search:** `product.controller.js:16,99` builds a search regex from user input but runs it through `escapeRegex()` first, correctly neutralizing regex metacharacters. **Done right** — call this out as a strength; many student (and professional) codebases skip this.
- No use of `$where`, dynamic object keys built from user input, or any other injection-prone pattern was found anywhere in the 14 controllers.

### Sensitive data exposure

- Password is never returned (§ above).
- No stack traces leak to clients: `errorHandler.js` only ever sends `message` and normalizes unknown errors to `"Server error"` with a 500. **One exception:** `scan.controller.js:111-114` sends `error?.message || String(error)` directly to the client on any unexpected failure in the Groq call path — this bypasses the sanitization the rest of the app relies on. Low real-world risk (Groq SDK errors are unlikely to contain secrets), but it's the one inconsistent spot in an otherwise disciplined error-handling story. See §7.

### Environment variables

- `.env` is correctly listed in `.gitignore:2` and confirmed **not** tracked by git (`git ls-files | grep env` returns only `.env.example` and `.env.production.example`).
- No hardcoded secrets found in source **except** the JWT fallback discussed above.
- `GEMINI_API_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `MAIL_FROM` exist in `.env`/`.env.example` but back **zero** actual code paths (`@google/genai`, `@google/generative-ai`, `nodemailer` are all unused, confirmed by grep across the whole repo).
- **`GROQ_API_KEY`, which `scan.controller.js:41` actually reads and requires for the label-scan feature to function, is absent from `.env`, `.env.example`, and `.env.production.example`.** Either it's set directly on the hosting platform without being documented anywhere in the repo, or the scan feature silently fails with an auth error from Groq. **Not verified** which — worth checking before a live demo of the scan feature.

### Rate limiting, CORS, security headers

- **No global rate limiting** (no `express-rate-limit` or equivalent) — `/auth/login` and `/auth/register` are unthrottled, so brute-forcing a password is only slowed by bcrypt's cost factor, not blocked. Calibrated as **medium, not high** for a student project with no current userbase to attack — but cheap to add (`express-rate-limit` is a ~10-line change) if you have an hour.
- **One targeted rate limiter does exist**, app-level, hand-rolled: `communityProduct.controller.js:7,44-54` caps community-product submissions at 20/day per user via `countDocuments`. This shows you *did* think about abuse — just only for this one endpoint. Good discussion point if a jury asks "did you consider rate limiting?": yes, selectively, where you judged the abuse risk (crowdsourced spam) highest.
- **CORS is correctly environment-aware** (`app.js:20-39`): wide open (`origin: "*"`) in development, and in production restricted to an explicit allowlist read from `CORS_ORIGIN`, validated via a proper callback rather than a naive string compare. This is good practice, done correctly — call it out as a strength.
- **No security headers** (`helmet` or manual `X-Content-Type-Options` etc.) are set. Low severity at this scale; cheap one-line fix (`app.use(helmet())`) if time allows.

### File upload

- `multer.memoryStorage()` with a 5MB limit (`establishment.routes.js:10-15`, `product.routes.js:10-15`) — no disk writes, so **no path traversal risk** (there's no filename ever touched on a filesystem).
- MIME type is checked (`establishment.controller.js:116`, `product.controller.js:209`) via `req.file.mimetype.startsWith("image/")` — but this header is client-supplied and not content-sniffed, so a file with a spoofed `Content-Type` could pass the check. **Low severity**: the file is only ever re-served as a base64 data URI back through your own API, not executed or served with attacker-controlled headers, so this isn't an XSS/RCE vector in the current architecture — but it's not a real content-type guarantee either.
- Images are stored as base64 data URIs **directly inside MongoDB documents** (`establishment.controller.js:123`, `product.controller.js:232`) rather than in object storage. This isn't a security issue but a real architecture/performance tradeoff — see §5 and §9.

**Verdict: 🔧 Authorization and IDOR discipline are genuinely strong across the whole API — better than I'd expect at this stage. The JWT fallback secret is the one finding worth taking seriously before the defense; everything else here is either already handled well or a reasonable, explainable limitation for a project at this scope.**

---

## 5. Database

### Schema design

Reviewed in full in Phase A's model table. All 15 models use appropriate types, sensible `required`/`default`/`enum` constraints, and `trim: true` on free-text fields. `Order` and `Cart` correctly embed line-item sub-schemas with `{ _id: false }` where a separate `_id` per line item would be waste.

### Relationships: refs vs. embedding

Every relationship uses `ObjectId` refs (`User`, `Product`, `Badge`, `Event`), never embedding of full related documents — appropriate, since none of these relationships are "always read together and never queried independently" (the one case where embedding would be preferable). `Order.items` and `Cart.items` correctly embed a **snapshot** of product name/price/qty rather than just a ref — this is the right call, since an order must preserve the price at time of purchase even if the product's price later changes. Worth noting as a deliberate, correct design decision, not an oversight.

### Indexes

| Model.field | Indexed? | Query that would benefit |
|---|---|---|
| `Product.barcode` | ✅ sparse unique (`Product.js:54`) | barcode lookups |
| `CommunityProduct.barcode` | ✅ unique | community barcode lookups |
| `User.email` | ✅ unique (implicit) | login |
| `Establishment.owner` | ✅ unique (implicit) | "mine" queries |
| `Notification.user` | ✅ (`Notification.js:8`) | `getMyNotifications` |
| `ScanHistory.userId` | ✅ (`ScanHistory.js:8`) | `getScanHistory` |
| `UserBadge.{userId,badgeId}` | ✅ compound unique (`UserBadge.js:21`) | badge-award idempotency |
| `UserGamification.userId` | ✅ unique | per-user gamification lookup |
| **`Order.user`** | ❌ **missing** | `getMyOrders` (`order.controller.js:138`) and `getUserOrders` (`user.controller.js:115`) both filter directly on this field with no index |
| `Product.createdBy` | ❌ missing | `getMyProducts`, `getSellerOrders`'s `Product.find({createdBy})` |

**Missing-index severity:** low right now (demo-scale data), but `Order.user` is the most-hit unindexed field in the app — every "my orders" screen load does a full collection scan. Cheap fix (`orderSchema.index({ user: 1 })`), worth doing even before the deadline since it's a 1-line, zero-risk change.

### Schema-level vs. application-level validation

Both are used, and used correctly together: Mongoose enums/required/min enforce data integrity at the DB layer (last line of defense, e.g. against direct DB scripts), while `express-validator` gives better, translatable error messages at the API boundary. This is the right split, not redundant — say so explicitly.

### Query efficiency

- **No N+1 patterns found.** `getSellerOrders` (`order.controller.js:17-24`) does exactly 2 queries (distinct product IDs, then one `Order.find` with `$in`), not one query per order.
- **`.lean()` is never used anywhere**, including on fully read-only list endpoints (`getProducts`, `getRecipes`, `getEvents`, `getPatientResources`, `getEstablishments`, `getAllOrders`, `getMyOrders`, `getMyNotifications`). Every read returns full hydrated Mongoose documents (with virtuals, getters, change-tracking overhead) when a plain object would do. Consistent, low-effort, real performance opportunity — a good "I know about this" line for the report even if you don't apply it everywhere before the defense.
- `.select()` is used appropriately where payload size matters (`user.controller.js:80` `.select("favoriteSpots")`, `notificationService.js:22-24` selecting only the fields needed for the push-gate check).

### Data consistency — atomic vs. non-atomic multi-document writes

**✅ `createOrder` is correctly transactional.** `order.controller.js:80-133` wraps stock reservation (potentially across multiple products), order creation, and cart clearing in a single `session.withTransaction(...)`. This is the standout piece of engineering in the codebase — genuinely production-grade handling of the classic "don't oversell stock under concurrency" problem, and it's the one thing with a dedicated test for it (`test/api.test.js:609`, "lets only one of two concurrent orders win the last unit of stock"). **Lead with this in your defense.**

**🟡 MEDIUM — `deleteAccount` is not transactional.** `auth.controller.js:293-302`:
```js
await Promise.all([
  Cart.deleteOne({ user: userId }),
  Notification.deleteMany({ user: userId }),
  UserGamification.deleteOne({ userId }),
  UserBadge.deleteMany({ userId }),
  XpLedger.deleteMany({ userId }),
  Event.updateMany({ attendees: userId }, { $pull: { attendees: userId } }),
]);
await User.findByIdAndDelete(userId);
```
If any one of these six operations fails (network blip, validation error), the others have already committed and there's no rollback — the user could end up partially deleted (e.g. notifications gone, gamification record still present). `Promise.all` also means one rejection doesn't stop the others from running, but does cause the whole handler to throw before `User.findByIdAndDelete` runs — so the **user document itself** would survive a partial failure here, which is actually the safer failure mode (better to leave an intact-but-messy account than a phantom user with orphaned Cart/Badge/XP rows). Still worth wrapping in a transaction for correctness, low effort given you already use `mongoose.startSession()` elsewhere in the codebase.

**Contextual note, not a direct causal claim:** the repo contains an **untracked** `orphaned-data-backup-2026-07-22/` directory (confirmed via `git ls-files` — not committed) with a comment in `scripts/exportOrphanedData.js:1-3` referring to "records left orphaned by the 2026-07-22 accidental User/Product wipe." This confirms that **a real data-consistency incident happened operationally** on this project. I have no evidence connecting that specific incident to the `deleteAccount` code path above — the comment describes an "accidental wipe," which sounds like a manual/ops mistake, not a code bug — but it's worth knowing that this class of problem (partial or unintended multi-document writes) is not purely theoretical for this project, which strengthens the case for fixing `deleteAccount` even under time pressure.

**Verdict: 🔧 The transactional checkout is the single best piece of database engineering in this project — it solves a real, well-known hard problem correctly and is tested for it. The one real gap (non-transactional account deletion) is worth a 20-minute fix given you already have the transaction pattern to copy.**

---

## 6. Performance

- **No pagination anywhere.** Every list endpoint (`/products`, `/recipes`, `/patient-resources`, `/establishments`, `/events`, `/orders` admin-all, `/users` admin-all) does an unbounded `Model.find()`. The only two endpoints with any limit are `getMyNotifications` (`.limit(50)`, `notification.controller.js:7`) and `getScanHistory` (`.limit(20)`, `scan.controller.js:122`). At current (demo) data volumes this is invisible; at real scale, `/api/orders` or `/api/users` returning every row ever created would become a real problem. **This is the single most consistent gap in the codebase** — worth naming explicitly and honestly as a scaling limitation rather than patching under deadline pressure (see §13).
- **Sequential awaits that could run in parallel:** `gamificationService.js:266-294` (`recordAction`, which runs on *every* scan, RSVP, order, and community contribution) does `await awardXP(...)` then `await updateStreak(...)` then `await checkAndAwardBadges(...)` sequentially. `awardXP` mutates `totalXp`/`currentLevel`; `updateStreak` mutates `currentStreak`/`lastActivityDate`/`streakShields`/`longestStreak` — disjoint fields on the same document, no data dependency between the two calls. These two could be `Promise.all`'d, cutting one DB round-trip off the hot path that runs on nearly every user action. `checkAndAwardBadges` already has the `currentValue` it needs computed earlier, so it doesn't block on either — genuinely a free, safe optimization.
- **Sequential loop in `createOrder` — correct, not a bug.** `order.controller.js:86-88` awaits `reserveStock` once per cart item, inside a Mongo session. This *looks* like a naive sequential-loop performance smell, but it's actually necessary: a single Mongo session only supports one in-flight operation at a time, so parallelizing these calls would be incorrect, not just unnecessary. Worth understanding and being able to explain this distinction if a jury asks "why didn't you `Promise.all` this loop?"
- **No unhandled promise rejections.** Every single async controller across all 14 files wraps its logic in `try { ... } catch (error) { return next(error); }` — Express 4 doesn't auto-catch async rejections, and this codebase manually guarantees it everywhere except `scan.controller.js`'s `scanLabel` (which still catches internally, just doesn't hand off to the central handler — no crash risk, just a formatting inconsistency, see §3/§7).
- **`express.json({ limit: "8mb" })`** (`app.js:44`) is a deliberately generous body limit to accommodate base64-encoded images sent as JSON (`scan.controller.js`'s `imageBase64`). This is a reasonable, purposeful choice, not an oversight — but it does mean a single malicious 8MB JSON payload is accepted per request with no additional throttling, compounding the "no rate limiting" gap above.

**Verdict: 🔧 No pagination is the one performance finding that's both real and consistent across the whole API — everything else here is either a small free win (`Promise.all` in `recordAction`) or a non-issue once explained (the sequential order loop).**

---

## 7. Error Handling

- **Central error middleware exists and is used almost universally.** `errorHandler.js` translates Mongoose `CastError` → 404, `ValidationError` → 400 with joined messages, duplicate-key `11000` → 409 with the offending field named, and Multer's `LIMIT_FILE_SIZE` → 413. This is a well-thought-out translation layer — it correctly turns raw Mongoose/Multer errors into meaningful HTTP responses rather than leaking a generic 500 everywhere.
- **try/catch → `next(error)` is used consistently in every controller function across all 14 files** — I checked every single exported handler. This is a real, verified strength: Express 4 gives you nothing for free here, and this codebase never relies on that safety net accidentally.
- **One exception, already noted in §3/§4:** `scan.controller.js:110-115` catches locally and responds directly instead of calling `next(error)`, which means Groq/parsing failures skip the central handler's message normalization and return the raw `error.message` to the client. Fix is trivial (`return next(error)` instead of the inline `res.status(500).json(...)`), but note that `errorHandler.js` would need a default-500 fallback message check first, since it currently doesn't special-case Groq SDK errors — a two-line change either way.
- **Logging:** only `console.log`/`console.error`, scattered through `server.js`, `db.js`, and the four services (each service labels its own errors, e.g. `console.error("[gamificationService] awardXP error:", err)` — a nice, consistent tagging convention worth keeping). No structured logger (winston/pino), no log levels, no request logging (no `morgan`). `logs/server.out.log` / `logs/server.err.log` exist (gitignored) as a result of `run.ps1` redirecting stdout/stderr to files — functional, but not "logging" in the observability sense.
- **No stack traces reach clients** except via the `scanLabel` exception above — everywhere else, `errorHandler.js` only ever sends a `message` string.

**Verdict: 🔧 This is a disciplined, consistent error-handling story — the try/catch-to-`next()` pattern with zero exceptions across 13 of 14 controllers is genuinely above-average diligence. Fix the one `scanLabel` inconsistency; it's a 2-line change with an outsized "I was thorough" payoff for the report.**

---

## 8. Validation

**What validates requests today:** `express-validator`, applied at the route layer, consistently, on ~40 of 64 routes (every route that accepts a meaningful body/param does; read-only and simple-toggle routes correctly skip it).

### Coverage table (representative sample — full detail in §4)

| Endpoint | Validated? | Gaps |
|---|---|---|
| `/auth/register`, `/auth/login` | ✅ full | — |
| `/products` (create/update) | ✅ full (type, range, enum) | — |
| `/orders` (create) | ✅ full, including nested `items.*` | — |
| `/community-products` (submit) | ✅ full, plus custom barcode-checksum validator | — |
| `/onboarding/profile` | ✅ full, every enum field validated | — |
| `/scan/label` | ⚠️ partial | no size/format check on `imageBase64`, no `mimeType` allowlist |
| `/users/me/favorites` (PUT) | ⚠️ partial | array-of-anything, no per-item shape check (schema is `Mixed` too) |

### Recommendation

**Keep `express-validator` as the one approach — don't introduce a second library.** It's already applied consistently, its error messages are already wired into the standard `{success:false, message}` envelope via `validateRequest.js`, and it covers the vast majority of endpoints correctly. The only work needed is closing the two gaps above, not a strategy change. This is worth stating plainly in the report: you already made the right call here, you don't need to defend a rewrite.

**Verdict: 📖 Validation strategy is sound and consistently applied — the gaps are two low-traffic, low-risk endpoints, not a systemic weakness.**

---

## 9. Maintainability

- **Readability:** consistently named handlers (`getX`, `createX`, `updateX`, `deleteX`), consistent file organization, no clever/obscure code found anywhere in the 14 controllers or 4 services.
- **Modularity:** the routes/controllers/services split is real, not cosmetic — services are genuinely reusable (`notificationService.notify()` is called from `event.controller.js`, `order.controller.js`, and `professional.controller.js`; `gamificationService.recordAction()` is called from `scanService`, `communityProduct.controller.js`, `event.controller.js`, and `order.controller.js`).
- **Reusability example already in the code:** `scanService.recordScanEvent()` is explicitly commented as "the single writer for both the ScanHistory row and the gamification counter, so the two can never drift apart" — this is a real architectural decision to prevent a specific bug class (two independent writers of related data going out of sync), not an accident. Good evidence of engineering judgement.

### What would break at 10x growth

1. **No pagination** (§6) — admin list endpoints would return megabytes of JSON.
2. **Base64 images inside MongoDB documents** (§4, §5) — `Product`/`Establishment` documents would balloon in size, slowing every list query that touches them (no image is ever excluded via `.select()` on list endpoints today), and MongoDB's 16MB document limit becomes a real (if distant) ceiling. Moving images to object storage (S3/Cloudinary) and storing only a URL is the standard fix — reasonable to defer, but name it.
3. **`Order.user` missing index** (§5) would go from invisible to a real slow-query problem.
4. **No caching layer** — the badge catalog (`Badge.find()`, effectively static reference data) is re-queried on every profile-gamification fetch (`gamificationService.js:346`) with no cache.

### What would confuse a new developer on day one

- The `snake_case`/`camelCase` split on `User` (§2) — "why do only these six fields look different?"
- The unused `@google/genai`/`@google/generative-ai`/`nodemailer` dependencies and their matching unused env vars — a new dev would reasonably assume there's an email or Gemini integration somewhere and go looking for it.
- The undocumented `GROQ_API_KEY` requirement (§4) — nothing in `.env.example` tells you the scan feature needs it.
- The README's route list (§12) documents only 4 of 14 resource groups — a new dev reading it would believe half the API doesn't exist.

**Verdict: 🏗️ Genuinely modular and reusable — the service layer is doing real work, not just ceremony. The 10x-growth risks are the standard ones for this architecture (pagination, blob storage, indexing) and are honestly presentable as known, deferred tradeoffs rather than oversights.**

---

## 10. PFE Evaluation

### Does this read as engineering-level work, or a tutorial project?

**Engineering-level**, with specific, concrete evidence — not just "well-organized CRUD":

- A correctly-implemented MongoDB transaction solving a real concurrency problem (overselling stock), verified by a dedicated race-condition test.
- A three-layer password-exposure defense (`select:false` + `toJSON` transform + manual strip) that most tutorials don't bother with even one layer of.
- A custom rate limiter for one specific, reasoned-about abuse vector (community submissions) rather than either "no rate limiting" or a copy-pasted generic one.
- A regex-injection-safe search implementation (`escapeRegex`).
- 748 lines of integration tests against a real (guarded) test database, including edge cases like "rolls back the whole order when one of several items has insufficient stock."
- Comments throughout that explain **why**, not what — e.g. the sparse-index barcode comment (`Product.js:44-47`), the "single writer" rationale in `scanService.js`, the badge-track filtering rationale in `gamificationService.js`. This is a specific, learnable skill (writing comments that justify non-obvious decisions) that most student code — and a fair amount of professional code — doesn't demonstrate.

### Parts that genuinely demonstrate engineering judgement (name them to the jury)

1. Transactional stock reservation + its concurrency test (`order.controller.js` + `test/api.test.js:609`).
2. The test-database guard rail: `test/api.test.js:39-44` asserts the connected DB name matches `/test/i` **before running any test**, specifically to prevent a misconfigured `MONGO_URI` from wiping real data during test runs. This is a mature, defensive habit most students don't think to add.
3. Systemic password protection via schema-level `select: false` rather than remembering to strip it ad hoc.
4. The barcode GS1 checksum validator (`utils/barcode.js`) — implementing a real industry checksum algorithm rather than trusting client input at face value.
5. The `scanService` "single writer" pattern preventing ScanHistory/gamification drift.

### Parts too basic to highlight (better to hear it from me than the jury)

1. Most CRUD controllers (recipe, patient-resource, event) are close to boilerplate — fine to have, but don't spend defense time walking through them as if they were interesting.
2. No pagination anywhere — if asked "how does this scale," don't claim it does; say you know and why you deprioritized it (§13).
3. The `pickFields` pattern duplicated 5× (§2) — if a juror reads the code closely, this reads as "didn't notice the repetition," not as a design choice. Fixing it is cheap and removes that risk entirely.
4. The unused dependencies/env vars (§Phase A) — if a juror asks "what's the Gemini API for?" and the honest answer is "nothing, it's leftover," that's a worse moment than if it were already cleaned up.

### What must be improved before you present it

- Verify `JWT_SECRET` is actually set on your deployed backend (§4) — five minutes, removes your one real risk.
- Remove or explain the three unused dependencies and their env vars — 10 minutes, removes an easy "what does this do?" question you can't answer well.
- Update the README's route list, or delete it in favor of pointing at the route files — currently actively misleading (§12).

### What's missing that would meaningfully raise the technical value

- API documentation (OpenAPI/Swagger) — you have 64 well-structured endpoints and zero machine-readable documentation of them. Even a generated spec from the existing `express-validator` chains would be a strong, low-effort addition.
- A visible architecture diagram (§11) — you have a genuinely clean layered architecture; right now it only exists in your head and in the file tree.

### 8 hard questions a jury could ask — with honest answers

1. **"What happens if `JWT_SECRET` isn't set on your server?"**
   Honestly: it falls back to a hardcoded secret committed in `src/config/auth.js`, which would let anyone forge an admin token. I've verified this is a fallback in the code and flagged it as the top fix in my own audit; I have/haven't [fill in after you check] confirmed the production environment has a real secret set.

2. **"How do you prevent two customers from buying the last unit of the same product at the same time?"**
   `reserveStock` uses an atomic `findOneAndUpdate` with a `stock: {$gte: qty}` guard inside a MongoDB transaction — the update only applies if enough stock is available at that instant, so it's impossible for two concurrent requests to both succeed past available stock. I have a test that specifically exercises this with two simultaneous requests for the last unit.

3. **"Why doesn't `/api/orders` (admin, list all orders) paginate?"**
   It doesn't currently — every list endpoint in the API returns the full collection. At the data volumes this project runs at, that's invisible; at real scale it would need `limit`/`skip` or cursor-based pagination. I made a conscious call to prioritize other engineering problems (like the checkout transaction) given the deadline.

4. **"If an admin's role is revoked, does their existing session lose access immediately?"**
   No — role is baked into the JWT at login time and never re-checked against the database on each request, so a previously-issued token keeps its privileges until it naturally expires (up to 7 days). This is a standard stateless-JWT tradeoff; fixing it would mean either short-lived tokens with refresh, or a server-side revocation list.

5. **"Why is there a `Cart` model in your database if the cart lives in AsyncStorage on the phone?"**
   Cart syncs to the server only as a side effect of checkout (cleared after an order is placed) and account deletion (cleared as cleanup) — there's no endpoint that reads or writes it as a cart. It's effectively a server-side artifact of a design that changed (or was simplified) to a client-only cart, and I can defend that: local cart means faster UX with no network dependency for the most-touched screen in the app, at the cost of the server keeping an unused model around. [See Cross-check section below for the full reasoning.]

6. **"What testing do you have, and what don't you have?"**
   748 lines of integration tests covering auth, profile, products, recipes, patient resources, barcode lookup, orders (including a concurrency test), and notifications. Not covered: community products, establishments, events (beyond RSVP notifications), gamification, professional approval flow, or scan history. I prioritized testing the highest-risk logic (money/stock) over full endpoint coverage.

7. **"You use `express-validator` for input validation — why not Joi or Zod?"**
   `express-validator` integrates directly with Express middleware chains and I used it consistently across the whole API from the start; introducing a second library partway through would add inconsistency for no functional benefit at this scale. It's an intentional decision to have one validation strategy applied uniformly rather than the "best" library in isolation.

8. **"What would you change first if you had another month?"**
   Pagination on every list endpoint, moving uploaded images out of MongoDB into object storage, and closing the account-deletion transaction gap — in that order, by how much they'd actually matter at real usage.

**Verdict: 🎓 This holds up. The transactional checkout and its test are your strongest single piece of evidence — don't undersell them by leading with CRUD. Be ready for the JWT-fallback and pagination questions specifically; both have honest, non-defensive answers already worked out above.**

---

## 11. Report Worthiness

| Component | Include? | Why | How to present it |
|---|---|---|---|
| Transactional checkout + stock reservation | **Yes — lead with it** | Your single best piece of evidence of real engineering | Sequence diagram (see below) + the concurrency test as proof |
| Layered architecture (routes/controllers/services/models) | Yes | Clean, consistent, demonstrates structural thinking | Simple architecture diagram (see below) |
| Auth flow (JWT + bcrypt + role middleware) | Yes, with the fallback-secret caveat named upfront | Shows understanding of stateless auth; naming the JWT-fallback limitation yourself pre-empts the jury's question | Sequence diagram: register/login → token → protected route |
| IDOR / authorization discipline | Yes | Genuinely consistent across 14 resources — a real strength, not automatic | Authorization matrix table (you already have one in this report) |
| Password security (3-layer) | Yes, briefly | Concrete, defensible, shows depth beyond "we used bcrypt" | One paragraph + the `select:false` code snippet |
| Gamification service (XP/levels/streaks/badges) | Yes, as a "domain complexity" example | Shows you can model non-trivial business rules (streak+shield economy) cleanly | Don't diagram it — it's better explained in prose with the `LEVEL_THRESHOLDS`/streak logic as the example |
| express-validator strategy | Mention briefly | Shows a considered, consistent choice | One paragraph, not a deep dive |
| Test suite (748 lines, concurrency test) | Yes — this is a differentiator | Most student projects have thin or no tests | Cite the concurrent-order test specifically by name |
| Pagination gap | Yes — as a named limitation | Shows self-awareness; hiding it is worse than naming it | One line in "Limitations et perspectives" |
| Base64 images in MongoDB | Yes — as a named limitation | Same reasoning | One line in "Limitations et perspectives," with "object storage" as the stated next step |
| The `pickFields` duplication | **No** | Too small to be worth report space; fix it instead (15 min) if you have time | — |
| Unused dependencies (`@google/genai` etc.) | **No — remove them, don't write about them** | Nothing to present; only downside if noticed | Delete from `package.json` before the defense |
| Cart model / client-side cart design | Mention only if directly asked | It's a real, defensible tradeoff (see Q5 above) but not something to volunteer, since it invites "so why does it exist server-side at all?" | Have the one-paragraph answer ready, don't put it in the slides |
| JWT-role-staleness limitation | Mention only if directly asked, or in "perspectives" | Correct but somewhat advanced/negative framing for a general audience | One line in "perspectives d'évolution": "token revocation on role change" |

### What NOT to put in the report

- The dead endpoints and unused dependencies — clean them up instead of explaining them (all low effort). (Done on `backend-hardening`: 2 of the original 5 candidates were genuinely unused everywhere and were deleted; the other 3 turned out to be exercised by the test suite and were kept — see the endpoint table's update note.)
- The `snake_case`/`camelCase` inconsistency on `User` — invites a "why" you don't have a strong answer for; fix it or say nothing.
- The `isAdmin`/`requireRole` duplication — too minor to be worth a slide, not worth defending.
- Deep internals of the badge/streak math — interesting to you, but a rabbit hole in a defense; keep it to "the service models streaks with a forgiveness-shield mechanic" and move on if not asked further.

### Diagrams worth drawing

1. **Layered architecture diagram** — boxes for `Routes → Middleware (auth/validation) → Controllers → Services → Models → MongoDB`, with 2-3 concrete examples of each layer labeled (e.g. `order.routes.js → verifyToken/requireRole → order.controller.js → gamificationService.js → Order/Product models`). Shows structural understanding at a glance.
2. **Order-creation sequence diagram** — client → `POST /orders` → transaction start → `reserveStock` (atomic per item, loop) → `Order.create` → `Cart.clear` → transaction commit → gamification side effect (outside transaction) → response. This is your best diagram — it visually proves you understand both the happy path and the failure/rollback path.
3. **Auth flow sequence diagram** — register/login → bcrypt hash/compare → JWT sign (show the payload fields) → client stores token → subsequent request → `verifyToken` middleware decodes → `req.user` → role middleware (`isAdmin`/`requireRole`) → controller. Good place to visually flag "role is read from the token, not re-checked" as an annotated limitation, turning a weakness into evidence of self-awareness.

**Verdict: 📖 You have more report-worthy material than most PFE backends — the risk isn't a thin report, it's over-explaining minor findings and under-selling the transaction/testing story. Lead with those two.**

---

## 12. Missing Professional Practices

| Practice | Present? | Worth adding before deadline? |
|---|---|---|
| Logging | Partial (`console.log`/`console.error`, tagged by service) | **Quick FIX**: add `morgan` for request logging (~10 min, cheap, visible in a demo). Structured logging (winston/pino) → **MENTION** as future work. |
| Monitoring | No | **MENTION** — genuinely out of scope for this stage. |
| Testing | Yes, substantial (748 lines, includes a concurrency test) | Already a strength — **expand coverage** (community products, establishments, gamification are untested) only if you have spare time; not urgent. |
| API documentation | No (README route list is stale/incomplete) | **MENTION**, but at minimum **fix the README** (see below) — that's a FIX, not a MENTION, since it's actively misleading right now. |
| Code documentation | No JSDoc, but strong "why"-comments in the tricky spots | Already good — don't add JSDoc boilerplate, it wouldn't add value here. |
| Caching | No | **MENTION** — not worth the complexity at this scale. |
| Rate limiting | Partial (one hand-rolled limiter on community submissions) | **MENTION** for global coverage; optionally a quick `express-rate-limit` on `/auth/login` if you have an hour (cheap, directly answers a predictable jury question). |
| API versioning | No (`/api/*`, no `/v1`) | **MENTION** — non-issue at this stage, don't spend time on it. |
| CI/CD | No (no `.github/workflows` or equivalent found) | **MENTION** — reasonable to defer for a project without a team or frequent releases. |
| Containerization | No Dockerfile | **MENTION** — genuinely low value for a single-host PFE deployment. |
| Environment separation | **Yes, done well** | Already present: `.env.example`/`.env.production.example`, `NODE_ENV`-gated CORS behavior, and a test suite that refuses to run against a non-test database (`test/api.test.js:39-44`). Present this as a strength, not a gap. |

**README fix specifically (not optional, cheap):** `README.md:34-49` lists routes only for `auth`, `products`, `orders`, `users` — 4 of the 14 resource groups actually mounted in `app.js:56-69`. Either delete the stale "Main Routes" section or regenerate it to match reality; leaving it as-is is worse than having no route documentation at all, because it actively misleads.

**Verdict: 🎓 Given the deadline, the only two items worth actual time are the README fix (trivial, currently actively wrong) and possibly `morgan` for request logging (10 minutes, visible value in a live demo). Everything else in this table is legitimately better presented as "perspectives d'évolution" than rushed in.**

---

## 13. Prioritised Action Plan

### High Priority

| Finding | File | Why it matters | Difficulty | Est. time | Code quality impact | PFE impact |
|---|---|---|---|---|---|---|
| Verify/rotate `JWT_SECRET` on production; remove hardcoded fallback | `src/config/auth.js:1-4` | Only real security risk in the report | Easy | 15 min | Medium | High — removes your one live-risk question |
| Confirm `GROQ_API_KEY` is set wherever the backend runs | `.env*`, `scan.controller.js:41` | Scan feature may silently fail in a live demo | Easy | 5 min (verify) | Low | High — a broken live demo is worse than any code finding |
| Fix stale README route list | `README.md:34-49` | Actively misleading, cheap to fix | Easy | 15 min | Low | Medium |

### Medium Priority

| Finding | File | Why it matters | Difficulty | Est. time | Code quality impact | PFE impact |
|---|---|---|---|---|---|---|
| Remove unused deps (`@google/genai`, `@google/generative-ai`, `nodemailer`) + their env vars | `package.json`, `.env.example` | Avoids an unanswerable "what's this for?" | Easy | 10 min | Medium | Medium |
| Delete the dead endpoints | routes/controllers listed in Phase A | Smaller, more honest API surface | Easy | 20 min | Medium | Medium | **Done** — 2 of 5 deleted; 3 kept because `test/api.test.js` exercises them |
| Add index on `Order.user` | `src/models/Order.js` | Cheapest real performance fix available | Easy | 5 min | Low | Low |
| Wrap `deleteAccount` in a transaction | `auth.controller.js:293-302` | Matches the transaction pattern you already use; prevents partial deletes | Medium | 30 min | Medium | Medium |
| Route `scanLabel` errors through `next(error)` | `scan.controller.js:110-115` | Consistency with the rest of the app's error handling | Easy | 10 min | Low | Low |
| Extract shared `pickFields` util | 5 controllers (§2) | Removes real, visible duplication | Easy | 15 min | Medium | Low |
| Add `morgan` request logging | `src/app.js` | Cheap, visible in a live demo | Easy | 10 min | Low | Medium |

### Nice-to-have

| Finding | File | Why it matters | Difficulty | Est. time | Code quality impact | PFE impact |
|---|---|---|---|---|---|---|
| Parallelize `awardXP`/`updateStreak` in `recordAction` | `gamificationService.js:266-294` | Free perf win on a hot path | Easy | 15 min | Low | Low |
| Unify `isAdmin` into `requireRole("admin")` | `src/middleware/isAdmin.js` | Removes a redundant abstraction | Easy | 10 min | Low | Low |
| Single source of truth for delivery fee | `Order.js:80`, `order.controller.js:8` | Avoids future drift | Easy | 5 min | Low | Low |
| Comment the fire-and-forget pattern | `event.controller.js:56-69` | Matches the same pattern's comment in `server.js` | Easy | 2 min | Low | Low |

### FIX vs. MENTION

| Finding | Call | Justification |
|---|---|---|
| JWT fallback secret | **FIX** | Cheap, and it's the one thing that could be a real live vulnerability — not defensible to leave and just mention. |
| `GROQ_API_KEY` undocumented | **FIX** (verify + document) | 5-minute check that prevents a broken live demo — highest ROI item in this whole report. |
| Stale README | **FIX** | Actively wrong is worse than absent; 15 minutes. |
| Unused dependencies | **FIX** | Zero risk to remove, removes an easy "what's this for?" trap. |
| Dead endpoints | **FIX** | Zero risk to remove (confirmed dead via mobile cross-check), tightens the API surface you have to defend. |
| Missing `Order.user` index | **FIX** | Zero-risk, 5-minute, genuinely correct improvement. |
| Non-transactional `deleteAccount` | **FIX if time allows, otherwise MENTION** | You already have the exact transaction pattern to copy from `createOrder`; 30 minutes if you have them, otherwise an honest one-liner in limitations. |
| No pagination | **MENTION** | Real, but fixing it properly (cursor-based, updated client too) is not a one-day job; naming it shows more judgement than a rushed partial fix. |
| Base64 images in MongoDB | **MENTION** | Same reasoning — a real architecture change (object storage integration), not a quick patch. |
| Stale JWT role on demotion | **MENTION** | Standard JWT tradeoff, not a code defect; explain it, don't "fix" it under time pressure (a real fix means refresh tokens or short expiry + UX cost). |
| No global rate limiting | **MENTION** (or quick FIX on `/auth/login` only if you have an hour) | Low real risk at this scale; the targeted limiter you already built is better evidence than a blanket one bolted on last-minute. |
| `pickFields` duplication | **FIX if time allows, otherwise skip entirely (don't mention)** | Purely a code-quality nit; not worth defense time either way. |
| snake_case/camelCase split on `User` | **Don't fix, don't mention** | Fixing it now risks breaking the mobile app's already-verified TypeScript types; not worth the risk this close to the defense. |

### If you only have one day, do exactly these things:

1. **Verify `JWT_SECRET` is set on your production host** (15 min).
2. **Confirm `GROQ_API_KEY` is set wherever you're demoing from, and test the scan feature live** (15 min).
3. **Remove `@google/genai`, `@google/generative-ai`, `nodemailer` from `package.json` and their unused `.env` vars** (10 min).
4. **Delete the dead endpoints** (or leave them but know they're dead if asked) (20 min if removing). *(Done: 2 of the 5 were unused everywhere and got deleted; the other 3 are exercised by the test suite despite the mobile app never calling them, so they were kept.)*
5. **Fix the README's route list** (15 min).
6. **Add the `Order.user` index** (5 min).
7. **Write one paragraph each for your "Limitations et perspectives" section**: no pagination, images in MongoDB instead of object storage, JWT role staleness (30 min).

Total: well under a day, and it converts every question you currently can't answer well into either a fixed problem or a named, honest limitation.
