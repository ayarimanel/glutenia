# Code Map — Defense Lookup Table

**One job: if a juror asks about X, find it here in ten seconds.** Organized by topic, not by file. Every path is relative to the repo root. Line numbers as of 2026-07-31 (see `PROJECT_FACTS.md` for how these were measured).

Ctrl+F this file for a keyword (e.g. "password", "transaction", "role") — don't scroll.

---

## Security

| If asked about... | It's here | One line |
|---|---|---|
| How login works end to end | `glutenia-backend/src/controllers/auth.controller.js:85-129` | `login()` — finds user by email, `bcrypt.compare`, blocks unapproved professionals, signs JWT |
| JWT creation | `glutenia-backend/src/controllers/auth.controller.js:12-23` | `createToken()` — signs `{id, name, email, role}`, expiry from `JWT_EXPIRES_IN` (default 7d) |
| JWT verification / auth middleware | `glutenia-backend/src/middleware/verifyToken.js` (27 lines, full file) | Reads `Authorization: Bearer <token>`, `jwt.verify`, sets `req.user` |
| Why the JWT secret can't have a fallback | `glutenia-backend/src/config/auth.js:1-9` | `getJwtSecret()` throws if `JWT_SECRET` unset — fixed in commit `54622ca`, was previously a hardcoded fallback string in source |
| Password hashing | `glutenia-backend/src/controllers/auth.controller.js:47` (register), `:258` (change) | `bcrypt.hash(password, 12)` — cost factor 12 both places |
| Password never returned — 3 layers | `User.js:51-55` (`select:false`), `User.js:125-130` (`toJSON` transform strips it), `auth.controller.js:25-29` (`toSafeUser()` strips it again) | Each layer catches a different mistake (see `BACKEND_REPORT.md` Part 2.2) |
| Role-based access control (admin-only) | `glutenia-backend/src/middleware/isAdmin.js` (12 lines, full file) | `req.user.role !== "admin"` → 403 |
| Role-based access control (admin OR professional) | `glutenia-backend/src/middleware/requireRole.js` (12 lines, full file) | `requireRole(...roles)` — parameterized version |
| IDOR protection — orders | `order.controller.js:180-190` (`getOrderById`), `:212-223` (`updateOrderStatus`) | Non-admin must own the order / own a product in it |
| IDOR protection — products | `product.controller.js:41-43` | `canManageProduct()` — admin or `product.createdBy === req.user.id` |
| IDOR protection — notifications (scoped query, not check-then-act) | `notification.controller.js:20-24` | `findOneAndUpdate({_id, user: req.user.id}, ...)` — ownership baked into the query itself |
| IDOR protection — establishments/gamification ("mine" pattern) | `establishment.controller.js:67-105`, `gamification.controller.js:19-55` | Every "mine" op scoped by `owner`/`userId: req.user.id` |
| Input validation library and pattern | `glutenia-backend/src/middleware/validateRequest.js` (19 lines, full file) | Runs `express-validator`'s `validationResult`, 400 + joined messages on failure |
| A representative validator chain | `glutenia-backend/src/routes/auth.routes.js:28-47` (register) | Full chain: name, email, password length, role enum, phone regex |
| Why `normalizeEmail`'s defaults are turned off | `auth.routes.js:9-19` | Default Gmail-dot/`+tag` stripping caused false "email taken" conflicts |
| NoSQL injection defense | `auth.routes.js:32-35` (`isEmail()`) + `auth.controller.js:38,88` (`User.findOne({email})`) | Validator rejects non-string `email` before it reaches Mongo — blocks `{"$ne":null}`-style attacks |
| Regex/ReDoS-safe search | `product.controller.js:16,99` | `escapeRegex()` neutralizes user input before building a `RegExp` |
| Barcode checksum validation | `glutenia-backend/src/utils/barcode.js` (22 lines, full file) | GS1 check-digit algorithm, standard EAN/UPC math |
| Centralized error → HTTP status mapping | `glutenia-backend/src/middleware/errorHandler.js` (38 lines, full file) | `CastError`→404, `ValidationError`→400, dup key `11000`→409, Multer size→413 |
| CORS policy (dev vs prod) | `glutenia-backend/src/app.js:20-39` | Wide open in dev; explicit allowlist from `CORS_ORIGIN` env var in prod |
| Rate limiting (the one that exists) | `communityProduct.controller.js:7,27-37` | 20 submissions/day per user, via `countDocuments` — no global rate limiter exists |
| File upload handling / size limit | `establishment.routes.js:10-15`, `product.routes.js:10-15` | `multer.memoryStorage()`, 5MB limit, no disk writes (no path traversal surface) |
| Env vars required at boot (fail-fast) | `server.js:11-14` (JWT secret), `src/config/db.js:15-21` (Mongo URI) | Both throw before the server binds a port if unset |

---

## Database / Data integrity

| If asked about... | It's here | One line |
|---|---|---|
| The checkout transaction (your best evidence) | `order.controller.js:41-134` | Full transaction + atomic stock guard — see `PROJECT_FACTS.md` §6.1 for the annotated snippet |
| The atomic stock-reservation guard specifically | `order.controller.js:48-54` | `findOneAndUpdate({stock: {$gte: qty}}, {$inc: {stock: -qty}})` — the one line that prevents overselling |
| The transaction wrapper | `order.controller.js:80-116` | `session.withTransaction(...)` — reserve stock, create order, clear cart, all-or-nothing |
| The concurrency test proving it | `test/api.test.js` — search for `"lets only one of two concurrent orders win the last unit of stock"` | `Promise.all([placeOrder(), placeOrder()])`, asserts exactly one 201 and one 409 |
| Why the reservation loop isn't `Promise.all`'d | `order.controller.js:86-88` | One Mongo session = one in-flight op at a time; parallelizing would break, not just be redundant |
| Non-transactional account deletion (a named gap) | `auth.controller.js:270-311` | `deleteAccount()` — `Promise.all` across 6 deletes, not wrapped in a session; see `BACKEND_AUDIT.md` §5 |
| Reference vs. embed decision | `Order.js:3-27` (embed: `orderItemSchema`, frozen price snapshot) vs `Order.js:56-60` (`ref: "User"`, always-current) | Embed when it must be a snapshot; reference when it should track the live record |
| Every index in the schema | `Product.js:54` (barcode, sparse unique), `Order.js:99` (user), `Notification.js:8` (user), `ScanHistory.js:8` (userId), `UserBadge.js:21` (userId+badgeId compound unique), `CommunityProduct.js:8` (barcode unique), `Establishment.js:8` (owner unique), `UserGamification.js:9` (userId unique) | Full list — see `PROJECT_FACTS.md` §3 for the schema each belongs to |
| Why `Order.user` was indexed in this hardening pass | commit `3c7f043`, `Order.js:99` | `getMyOrders`/`getUserOrders` both filtered on it with no index before |
| Sparse unique index gotcha (barcode) | `Product.js:44-51` (comment) + `product.controller.js:27-38` (`pickProductFields`) | A `default: null` would make every barcode-less product collide on the unique index — field must be genuinely absent, not null |
| MongoDB transactions require a replica set | `BACKEND_REPORT.md` §4.3 | Not in this repo's code — an infra fact, not a code fact; know it if asked why `mongod` alone won't run the concurrency test |

---

## Features (business logic)

| If asked about... | It's here | One line |
|---|---|---|
| Gamification — single entry point for XP | `gamificationService.js:266-294` | `recordAction()` — every scan/RSVP/order/contribution funnels through here |
| Gamification — level calculation | `gamificationService.js:9-35` | `calculateLevel()`, `getLevelInfo()` — threshold table + formula above level 10 |
| Gamification — streak + shield logic | `gamificationService.js:98-149` | `updateStreak()` — same-day/consecutive/gap-with-shield/gap-without-shield branches |
| Gamification — badge awarding (race-safe) | `gamificationService.js:157-201` | `_awardEligibleBadges()` — `insertMany({ordered:false})`, unique index resolves concurrent races |
| Gamification — profile-fact badges (onboarding-based) | `gamificationService.js:232-252` | `checkProfileFactBadges()` — equality check against a declared User field, not a counter |
| Barcode scanning flow | `product.controller.js:45-87` (`getProductByBarcode`) | Checks real `Product` catalog first, falls back to `CommunityProduct` reports |
| AI label scanning | `scan.controller.js:33-123` | Groq vision model, prompt at lines 5-31, JSON-parses and validates the response shape |
| Crowdsourced product contribution + dispute mechanism | `communityProduct.controller.js` (full file, 95 lines) | Submit (rate-limited 20/day) + flag (3 flags → `disputed: true`) |
| Event RSVP + broadcast notification | `event.controller.js:104-139` (`rsvp`), `:56-69` (`createEvent`'s fire-and-forget broadcast) | RSVP toggles attendance + awards XP; new events notify every customer async |
| Professional signup/approval flow | `auth.controller.js:34-83` (register w/ `professionalStatus: "pending"`), `professional.controller.js` (full file) | Admin approves/rejects via `POST /professionals/requests/:id/approve|reject` |
| Onboarding survey + one-time XP bonus | `onboarding.controller.js` (full file, 47 lines) | `isFirstCompletion` check gates the one-time 50 XP award |
| Push notifications | `services/pushService.js` (full file, 34 lines) | Batches to Expo's push API, 100 tokens/batch |
| In-app notification creation + preference gating | `services/notificationService.js` (full file, 72 lines) | `CATEGORY_FIELD_BY_TYPE` maps notification type → which User preference gates it |
| Favorite map spots | `user.controller.js:78-102` | `getFavorites`/`updateFavorites` — stored as `Schema.Types.Mixed`, no shape validation |
| User analytics aggregation (admin) | `user.controller.js:17-76` | `getUserAnalytics()` — role/experience/goal tallies + 14-day signup trend |

---

## Architecture / cross-cutting patterns

| If asked about... | It's here | One line |
|---|---|---|
| The 5-layer request flow | `BACKEND_REPORT.md` Part 1.3 | routes → middleware → controllers → services → models, all 14 resources follow it identically |
| Response envelope (the only 2 shapes used) | every controller; enforced centrally at `errorHandler.js` + `app.js:71-76` (404) | `{success:true, data}` / `{success:false, message}` |
| The one exception to the response-envelope rule | `scan.controller.js:117-122` | Catches its own errors, responds directly instead of via `next(error)` — bypasses `errorHandler`'s sanitization |
| Duplicated `pickFields` pattern (5 places, not yet extracted) | `establishment.controller.js:13-20`, `patientResource.controller.js:12-18`, `recipe.controller.js:16-22`, `product.controller.js:18-39` (`pickProductFields`), `event.controller.js:79-82` (inlined) | Same whitelist-fields-from-body idea, five independent implementations |
| Duplicated delivery-fee constant | `Order.js:80` (schema default `7`) and `order.controller.js:8` (`DELIVERY_FEE = 7`) | Two places that must be kept in sync manually |
| `isAdmin` vs `requireRole` overlap | `middleware/isAdmin.js` + `middleware/requireRole.js` | `isAdmin` is functionally `requireRole("admin")` — two abstractions for one concept |
| snake_case/camelCase split on `User` | `User.js:70-118` (onboarding fields: `role_type`, `gluten_free_since`, etc. — snake_case) vs the rest of the schema (camelCase) | Onboarding fields added in a later pass, didn't match original convention |
| Mounting every route + the 404/error handler order | `glutenia-backend/src/app.js` (81 lines, full file) | CORS → JSON body parsing → 14 route mounts → 404 → `errorHandler` (order matters) |

---

## Mobile app — architecture

| If asked about... | It's here | One line |
|---|---|---|
| The `User` type mirroring the backend schema | `src/types/models.ts:37-60` | See `PROJECT_FACTS.md` §6.10 for the full annotated snippet |
| Every other domain type (`Order`, `Product`, `Event`, gamification types...) | `src/types/models.ts` (351 lines, full file) | One file, all API response shapes, with "why" comments where shape varies per-endpoint |
| API client + typed responses | `src/api/client.ts` | Single fetch-based client, `ApiError` type, `isApiError()` guard |
| The cart-persistence bug and its fix | `src/context/CartContext.tsx:8,48,57-59` (fix), `src/context/__tests__/CartContext.test.tsx` (regression test, full 62-line file) | `user.id` (undefined) → `user._id` (real field) — see `PROJECT_FACTS.md` §6.8-6.9 |
| The chart-color bug ESLint caught (not TypeScript) | `src/components/charts/CurveChartView.tsx`, fixed in commit `f1fe0a0` | `lineColor` computed but never used — same type as `color`, so TS saw nothing wrong |
| The 39 unguarded token casts, and the fix | `src/context/AuthContext.tsx` (`useAuthenticated()`), fixed in commit `842432f` | One throwing hook replaces 39 `token as string` assertions across 24 screens |
| `IconName` union + coverage test | `src/components/AppIcon.tsx:56-118` (derived union), `src/components/__tests__/AppIcon.test.tsx` (full 22-line file) | `keyof typeof icons` — can't drift from the map; the test proves every value also renders |
| Typed navigation params | `src/navigation/types.ts`, `src/navigation/RootNavigator.tsx` | `RootParamList`, added in Phase 4 of the TS migration (commit `74c6787`) |
| All 7 context providers | `src/context/*.tsx` (`Alert`, `Auth`, `Cart`, `Events`, `Gamification`, `Notification`, `Theme`) | Converted together in commit `936fe51` (Phase 3) |
| i18n / translations (en/fr/ar) | `src/i18n/locales/{en,fr,ar}.ts` | 3 languages, kept in sync per-PR (see git log — every feature commit touches all 3) |
| Known-dead code, intentionally left and commented | `src/screens/user/MapScreen.tsx`/`MapDetailScreen.tsx` (`StarRating`, `STARS_*`), commit `cc7dde8` | Marked dead on purpose, not deleted — see `MIGRATION_REPORT.md` Part 6 |

---

## Testing

| If asked about... | It's here | One line |
|---|---|---|
| Backend test suite entry point | `glutenia-backend/test/api.test.js` (751 lines) | `node --test`, supertest, real (guarded) test DB |
| The test-DB guard rail | `test/api.test.js:36-44` (per `BACKEND_REPORT.md` citation) | Asserts DB name matches `/test/i` before any test runs — refuses to run against anything that isn't obviously a test DB |
| The concurrency test | `test/api.test.js` — search `"lets only one of two concurrent orders win the last unit of stock"` | Fires two real concurrent requests via `Promise.all`, not a simulation |
| What backend testing does NOT cover | `BACKEND_REPORT.md` Part 5.4 | Community products, establishments, gamification, professional flow, scan history |
| Mobile test files (all 3, in full) | `src/api/__tests__/client.test.ts` (38 lines), `src/context/__tests__/CartContext.test.tsx` (62 lines), `src/components/__tests__/AppIcon.test.tsx` (22 lines) | Unit test (mocked fetch), integration test (real CartProvider), icon-map coverage test |
| Why AppIcon's test generates 58 cases from a 22-line file | `src/components/__tests__/AppIcon.test.tsx:18-21` | `it.each(names)` — one generated case per icon key |

---

## Deployment / environment

| If asked about... | It's here | One line |
|---|---|---|
| Backend entry point | `glutenia-backend/server.js` (32 lines, full file) | Fails fast on missing `JWT_SECRET`, connects DB, seeds recipes fire-and-forget, then listens |
| Render deploy config | `glutenia-backend/render.yaml`, root `glutenia/package.json` | Root package.json's `postinstall`/`build`/`start` all proxy into `glutenia-backend` |
| Required env vars | `glutenia-backend/.env.example` (14 lines, full file) | `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `GROQ_API_KEY` |
| Mobile run/build instructions | `glutenia-mobile/README.md` | `run.ps1 -Start`, Expo Go / Android emulator, `npm run build:apk` |
| Seed admin login | `glutenia-mobile/README.md` | `admin@glutenia.tn` / `admin123` |

---

## Documented, deliberate limitations (say these out loud if asked "what's left")

All three in full in `LIMITATIONS.md`; one-line pointers here:

| Limitation | Why it exists | Real fix |
|---|---|---|
| No pagination anywhere | Demo-scale data, unbounded queries cost milliseconds today | `limit`/`skip` or cursor pagination, server + every mobile list screen |
| Images stored as base64 in MongoDB | Zero external services/cost; multer already hands you the buffer | Object storage (S3/Cloudinary), store only the URL |
| JWT role not re-validated against DB | Standard stateless-JWT tradeoff; no "demote user" feature exists yet | Short-lived tokens + refresh, or a revocation list |
