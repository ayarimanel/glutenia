# Project Facts — Offline Reference

**Measured on 2026-07-31, directly from the repo, on branch `backend-hardening`.** Every number below was produced by actually running the command shown next to it today — nothing here was copied from an older document without re-checking it. If a number in an older report (`MIGRATION_REPORT.md`, `BACKEND_REPORT.md`, etc.) disagrees with this file, **this file is the one measured today** — see `CONSISTENCY_ISSUES.md` for the specific disagreements found.

If something isn't in this file, it wasn't measured today — don't guess at a number while writing offline; write "not measured" and move on.

---

## 1. Counts — Frontend (`glutenia-mobile`)

| Metric | Count | Command used |
|---|---|---|
| TypeScript files (`.ts`/`.tsx`) in `src/` | 108 | `find src -name "*.ts" -o -name "*.tsx" \| wc -l` |
| `App.tsx` | 1 file, 39 lines | `wc -l App.tsx` |
| **Total TS/TSX files (incl. App.tsx)** | **109** | sum of the two rows above |
| Lines of code in `src/` | 27,763 | `find src -name "*.ts" -o -name "*.tsx" \| xargs cat \| wc -l` |
| Screens | 57 | `find src -ipath "*screens*" -name "*.tsx" \| wc -l` |
| Components (excl. tests) | 27 | manual count of `src/components/*.tsx` + `src/components/charts/*.tsx` |
| Context providers | 7 | manual count of `src/context/*.tsx` (excl. `__tests__`) |
| Test files | 3 | `find . -name "*.test.ts" -o -name "*.test.tsx" \| grep -v node_modules` |
| Test cases (Jest) | 61, all passing | `npx jest --silent` (re-run today) |
| Test suites | 3 | same run |
| TypeScript errors | 0 | `npx tsc --noEmit` (re-run today, no output = clean) |
| ESLint problems | 0 errors, 74 warnings | `npx eslint .` (re-run today) |
| Dependencies (`dependencies`) | 32 | count of keys in `package.json` `dependencies` |
| Dev dependencies (`devDependencies`) | 12 | count of keys in `package.json` `devDependencies` |
| **Total declared dependencies** | **44** | sum of the two rows above |

Screen breakdown by folder: `screens/` root (3: `AccountScreen`, `OnboardingScreen`, `SplashScreen`), `screens/admin/` (13), `screens/auth/` (3), `screens/onboarding/` (5), `screens/user/` (33).

Test files, exactly:
- `src/api/__tests__/client.test.ts` — 38 lines, 2 test cases
- `src/context/__tests__/CartContext.test.tsx` — 62 lines, 1 test case
- `src/components/__tests__/AppIcon.test.tsx` — 22 lines, 1 `it` + `it.each` over every icon key (57 icons) = 58 generated cases → 2+1+58 = **61 total**, matching Jest's own count.

---

## 2. Counts — Backend (`glutenia-backend`)

| Metric | Count | Command used |
|---|---|---|
| JavaScript files in `src/` | 65 | `find src -name "*.js" \| wc -l` |
| Lines of code in `src/` | 5,360 | `find src -name "*.js" \| xargs cat \| wc -l` |
| Route files | 14 | `find src/routes -name "*.js" \| wc -l` |
| Controller files | 14 | `find src/controllers -name "*.js" \| wc -l` |
| Model files (Mongoose schemas) | 15 | `find src/models -name "*.js" \| wc -l` |
| Middleware files | 5 | `find src/middleware -name "*.js" \| wc -l` |
| Service files | 4 | `find src/services -name "*.js" \| wc -l` |
| Config files | 2 | `find src/config -name "*.js" \| wc -l` |
| Utility files | 1 | `find src/utils -name "*.js" \| wc -l` |
| One-off admin/data scripts | 7 | `find src/scripts -name "*.js" \| wc -l` |
| Seed files | 2 | `find src/seed -name "*.js" \| wc -l` |
| `src/app.js` | 1 file, 81 lines | `wc -l src/app.js` |
| **Total endpoints (all 14 route files)** | **62** | manual count from every `router.<verb>(...)` call — see §4 |
| Test files | 2 | `find test -name "*.js" \| wc -l` |
| Test cases (Node's built-in test runner) | 25, all passing, 10 suites | `node --test test/**/*.test.js` (re-run today) |
| `test/api.test.js` | 751 lines | `wc -l` |
| `test/db-config.test.js` | 26 lines | `wc -l` |
| Dependencies (`dependencies`) | 9 | count of keys in `package.json` `dependencies` |
| Dev dependencies (`devDependencies`) | 1 | count of keys in `package.json` `devDependencies` |
| **Total declared dependencies** | **10** | sum of the two rows above |

**Runtime versions actually installed** (from `node --version` / lockfile, not from any doc):
- Node.js: **v24.15.0** (locally installed; `package.json` `engines` requires `>=20`)
- npm lockfile version: 3 (both repos)

---

## 3. Backend Models — full field lists, types, relationships

All 15 Mongoose models, read directly from `glutenia-backend/src/models/*.js` today.

### User (`src/models/User.js`, 132 lines)

| Field | Type | Notes |
|---|---|---|
| `name` | String | required, trim |
| `avatar` | String | default `null` |
| `phone` | String | trim, default `""` |
| `pushTokens` | [String] | default `[]` |
| `pushNotificationsEnabled` | Boolean | default `true` |
| `notifyOrders` | Boolean | default `true` |
| `notifyEvents` | Boolean | default `true` |
| `theme_preference` | String enum `"light"\|"dark"` | default `null` |
| `language` | String enum `"en"\|"fr"\|"ar"` | default `null` |
| `email` | String | required, unique, lowercase, trim |
| `password` | String | required, `select: false` (never returned by default) |
| `role` | String enum `"customer"\|"admin"\|"professional"` | default `"customer"` |
| `professionalStatus` | String enum `"pending"\|"approved"\|"rejected"` | default `null` |
| `approvalCode` | String | default `null` — 6-digit code shown to pending professionals |
| `role_type` | String enum `"warrior"\|"supporter"` | default `null` |
| `gluten_free_since` | Date | default `null` |
| `experience_level` | String enum (5 values, `just_started` → `3_plus_years`) | default `null` |
| `primary_goal` | String enum (6 values) | default `null` |
| `eating_out_frequency` | String enum (4 values) | default `null` |
| `favoriteSpots` | [Mixed] | default `[]` — mixed static + real establishment favorites |
| `confidence_identifying_gf` | String enum `"low"\|"medium"\|"high"` | default `null` |
| `createdAt` | Date | default `Date.now` |

No `id` field — only Mongo's default `_id`. `toJSON` transform (line 125-130) deletes `password` before serialization; this is the **only** field ever stripped.

**Relationships:** referenced by `ref: "User"` from `Cart.user`, `Establishment.owner`, `Event.attendees`/`createdBy`, `Notification.user`, `Order.user`, `PatientResource.createdBy`, `Product.createdBy`, `Recipe.createdBy`, `CommunityProduct.submittedBy`/`flaggedBy`, `ScanHistory.userId`, `UserBadge.userId`, `UserGamification.userId`, `XpLedger.userId`.

### Product (`src/models/Product.js`, 57 lines)

| Field | Type | Notes |
|---|---|---|
| `name` | String | required, trim |
| `description` | String | trim |
| `price` | Number | required, min 0 |
| `category` | String enum (6 values) | default `"Other"` |
| `imageUrl` | String | trim (base64 data URI) |
| `stock` | Number | default 0, min 0 |
| `isGlutenFree` | Boolean | default `true` |
| `createdBy` | ObjectId → `User` | |
| `createdAt` | Date | default `Date.now` |
| `barcode` | String | trim, **no default** (see comment: a default would break the sparse unique index) |

Index: `{ barcode: 1 }` unique + sparse.

### Order (`src/models/Order.js`, 101 lines)

Sub-schema `orderItemSchema` (`_id: false`): `product` (ObjectId → Product, required), `name` (String, required), `qty` (Number, required, min 1), `price` (Number, required, min 0).

Sub-schema `addressSchema` (`_id: false`): `fullName`, `addressLine`, `city`, `phone` — all String, required, trim.

| Field | Type | Notes |
|---|---|---|
| `user` | ObjectId → `User` | required |
| `items` | [orderItemSchema] | required, custom validator: length > 0 |
| `total` | Number | required, min 0 |
| `deliveryFee` | Number | required, min 0, default 7 |
| `address` | addressSchema | required |
| `status` | String enum `pending\|confirmed\|shipped\|delivered` | default `"confirmed"` |
| `createdAt` | Date | default `Date.now` |

Index: `{ user: 1 }` (added 2026-07-28, commit `3c7f043` — `getMyOrders`/`getUserOrders` filter on this field).

### Cart (`src/models/Cart.js`, 52 lines)

Sub-schema `cartItemSchema` (`_id: false`): `product` (ObjectId → Product, required), `name` (String, required, trim), `qty` (Number, required, min 1), `price` (Number, required, min 0), `imageUrl` (String, trim).

| Field | Type | Notes |
|---|---|---|
| `user` | ObjectId → `User` | required, **unique** (one cart per user) |
| `items` | [cartItemSchema] | |
| `updatedAt` | Date | default `Date.now`, also refreshed by a `pre("save")` hook |

### CommunityProduct (`src/models/CommunityProduct.js`, 39 lines)

| Field | Type | Notes |
|---|---|---|
| `barcode` | String | required, trim, unique |
| `name` | String | required, trim |
| `imageUrl` | String | trim, required |
| `isGlutenFree` | Boolean | required |
| `brand` | String | trim, default `null` |
| `category` | String enum (6 values + `null`) | default `null` |
| `submittedBy` | ObjectId → `User` | required |
| `flagCount` | Number | default 0 |
| `flaggedBy` | [ObjectId → `User`] | |
| `disputed` | Boolean | default `false` |
| `createdAt`/`updatedAt` | Date | `{ timestamps: true }` |

### Establishment (`src/models/Establishment.js`, 54 lines)

| Field | Type | Notes |
|---|---|---|
| `owner` | ObjectId → `User` | required, unique (one establishment per owner) |
| `name` | String | required, trim |
| `category` | String enum (6 values) | default `"Other"` |
| `description`, `coverImageUrl`, `address`, `phone`, `hours` | String | trim |
| `coordinates.latitude` / `.longitude` | Number | default `null` each |
| `verified` | Boolean | default `false` |
| `createdAt` | Date | default `Date.now` |

### Event (`src/models/Event.js`, 20 lines)

| Field | Type | Notes |
|---|---|---|
| `title` | String | required, trim |
| `description` | String | trim |
| `date` | String | required, trim (stored as free-form string, not `Date`) |
| `location` | String | required, trim |
| `category` | String enum `Meetups\|Classes\|Markets\|Workshops` | required |
| `price` | Number | default 0, min 0 |
| `emoji` | String | default `"🎉"` |
| `color` | String | default `"#E8F5E9"` |
| `imageUrl` | String | trim, default `""` |
| `attendees` | [ObjectId → `User`] | |
| `createdBy` | ObjectId → `User` | |
| `createdAt` | Date | default `Date.now` |

Note: the raw `attendees` array is deleted server-side before every API response (`event.controller.js` `serialize()`), replaced by `attendeeCount` + `isGoing`.

### PatientResource (`src/models/PatientResource.js`, 18 lines)

`title` (String, required, trim), `description`/`body` (String, trim, default `""`), `category` (enum `celiac|diet|safe|lifestyle`, default `celiac`), `readTimeMinutes` (Number, default 0), `featured` (Boolean, default `false`), `createdBy` (ObjectId → User), `createdAt` (Date, default now).

### Recipe (`src/models/Recipe.js`, 62 lines)

`name` (String, required, trim), `description` (String, default `""`), `category` (enum `Quick|Tunisian|Easy`, default `Quick`), `imageUrl` (String, default `""`), `calories`/`carbo`/`protein` (Number, default 0, min 0 each), `popular` (Boolean, default `false`), `ingredients` ([String], default `[]`), `preparation` (String, default `""`), `createdBy` (ObjectId → User), `createdAt` (Date, default now).

### Notification (`src/models/Notification.js`, 41 lines)

`user` (ObjectId → User, required, indexed), `type` (String, required — free-form, no enum: observed values `order_status`, `event_join`, `event_leave`, `event_new`, `professional_approved`, `professional_rejected`), `title` (String, required), `body` (String, default `""`), `referenceId` (String, default `null` — id of the order/event this notification is about), `read` (Boolean, default `false`), `createdAt` (Date, default now).

### Badge (`src/models/Badge.js`, 34 lines)

`slug` (String, required, unique), `name`/`description` (String, required), `iconUrl` (String, default `null`), `category` (enum: `scanner|safety|community|shopper|streak|journey`, required), `track` (enum: `warrior|supporter|both`, default `both`), `targetMetric` (String, required), `targetValue` (Number, required), `targetField` (String, default `null` — only set on "profile fact" badges), `targetEquals` ([String], `default: undefined`), `xpReward` (Number, default 0). `{ timestamps: true }`.

### UserBadge (`src/models/UserBadge.js`, 23 lines)

`userId` (ObjectId → User, required), `badgeId` (ObjectId → Badge, required), `earnedAt` (Date, default now), `isPinned` (Boolean, default `false`). `{ timestamps: true }`. Index: `{ userId: 1, badgeId: 1 }` unique — prevents earning the same badge twice.

### UserGamification (`src/models/UserGamification.js`, 27 lines)

`userId` (ObjectId → User, required, unique), `totalXp` (Number, default 0), `currentLevel` (Number, default 1), `currentTitle` (String, default `"Newcomer"`), `currentStreak`/`longestStreak` (Number, default 0), `streakShields` (Number, default 0, max 2), `lastActivityDate` (Date, default `null`), `scanCount`, `ingredientCheckCount`, `eventAttendanceCount`, `orderCount`, `productContributionCount` (Number, default 0 each). `{ timestamps: true }`.

### XpLedger (`src/models/XpLedger.js`, 17 lines)

`userId` (ObjectId → User, required), `amount` (Number, required), `sourceType` (String, required — e.g. `order_placed`, `badge_unlock`), `sourceId` (String, default `null`). `{ timestamps: true }`. Append-only audit log for every XP grant.

### ScanHistory (`src/models/ScanHistory.js`, 35 lines)

`userId` (ObjectId → User, required, indexed), `scanType` (enum `barcode|label`, required), `verdict` (String, default `null`), `summary` (String, trim, default `""`), `product` (ObjectId → Product, default `null` — only set for barcode scans that matched a real Product), `createdAt` (Date, default now).

---

## 4. Backend Endpoints — every route

62 endpoints across 14 route files, all mounted in `src/app.js` under the prefixes shown. Middleware chain is exactly what's in the code (order matters: auth → role → validators → validation error handler → controller).

### `/api/auth` (`src/routes/auth.routes.js`) — 8 endpoints

| Method | Path | Auth | Role | Purpose |
|---|---|---|---|---|
| POST | `/register` | none | — | Create account (customer or pending-professional) |
| POST | `/login` | none | — | Log in, get JWT |
| GET | `/me` | verifyToken | any | Get own profile |
| PUT | `/me` | verifyToken | any | Update own profile fields |
| POST | `/push-token` | verifyToken | any | Register an Expo push token |
| DELETE | `/push-token` | verifyToken | any | Unregister a push token |
| PUT | `/change-password` | verifyToken | any | Change own password |
| DELETE | `/me` | verifyToken | any | Delete own account (password-confirmed) |

### `/api/community-products` (`src/routes/communityProduct.routes.js`) — 2 endpoints

| Method | Path | Auth | Role | Purpose |
|---|---|---|---|---|
| POST | `/` | verifyToken | any | Submit a crowdsourced barcode report |
| POST | `/:id/flag` | verifyToken | any | Flag a community entry as disputed |

### `/api/establishments` (`src/routes/establishment.routes.js`) — 5 endpoints

| Method | Path | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/` | none | — | List establishments (optional `?category=`) |
| GET | `/mine` | verifyToken | admin, professional | Get own establishment profile |
| PUT | `/mine` | verifyToken | admin, professional | Create/update own establishment (upsert) |
| PUT | `/mine/image` | verifyToken | admin, professional | Upload cover image (multer, 5MB limit) |
| GET | `/:id` | none | — | Get one establishment by id |

### `/api/events` (`src/routes/event.routes.js`) — 6 endpoints

| Method | Path | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/` | optional (`optionalAuth`) | — | List events, with `isGoing` if logged in |
| GET | `/:id` | optional | — | Get one event |
| POST | `/` | verifyToken | admin (`isAdmin`) | Create event; broadcasts a notification to all customers |
| PUT | `/:id` | verifyToken | admin | Update event |
| DELETE | `/:id` | verifyToken | admin | Delete event |
| POST | `/:id/rsvp` | verifyToken | any | Toggle attendance; awards gamification XP on join |

### `/api/gamification` (`src/routes/gamification.routes.js`) — 3 endpoints

| Method | Path | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/profile` | verifyToken | any | Full gamification profile (XP, level, badges) |
| GET | `/home` | verifyToken | any | Lightweight XP/level summary for the Home screen |
| PUT | `/badges/:badgeId/pin` | verifyToken | any | Pin/unpin a badge (max 3 pinned) |

### `/api/notifications` (`src/routes/notification.routes.js`) — 3 endpoints

| Method | Path | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/` | verifyToken | any | List own notifications (last 50) |
| PUT | `/read-all` | verifyToken | any | Mark all own notifications read |
| PUT | `/:id/read` | verifyToken | any | Mark one notification read |

### `/api/onboarding` (`src/routes/onboarding.routes.js`) — 1 endpoint

| Method | Path | Auth | Role | Purpose |
|---|---|---|---|---|
| PUT | `/profile` | verifyToken | any | Complete/edit the onboarding survey; awards a one-time 50 XP bonus |

### `/api/orders` (`src/routes/order.routes.js`) — 6 endpoints

| Method | Path | Auth | Role | Purpose |
|---|---|---|---|---|
| POST | `/` | verifyToken | any | Place an order (transactional stock reservation, see §6) |
| GET | `/my` | verifyToken | any | List own orders |
| GET | `/seller` | verifyToken | admin, professional | List orders containing the seller's own products |
| GET | `/` | verifyToken | admin (`isAdmin`) | List every order |
| GET | `/:id` | verifyToken | owner or admin | Get one order |
| PUT | `/:id/status` | verifyToken | admin, professional (must own an item in it) | Update order status; notifies the buyer |

### `/api/patient-resources` (`src/routes/patientResource.routes.js`) — 5 endpoints

| Method | Path | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/` | none | — | List resources (optional `?category=`) |
| GET | `/:id` | none | — | Get one resource |
| POST | `/` | verifyToken | admin | Create resource |
| PUT | `/:id` | verifyToken | admin | Update resource |
| DELETE | `/:id` | verifyToken | admin | Delete resource |

### `/api/products` (`src/routes/product.routes.js`) — 8 endpoints

| Method | Path | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/` | none | — | List products (optional `?category=`, `?search=`) |
| GET | `/barcode/:code` | verifyToken | any | Look up by barcode (real catalog, falls back to community reports); records a scan event |
| GET | `/mine` | verifyToken | admin, professional | List own products |
| GET | `/:id` | none | — | Get one product |
| POST | `/` | verifyToken | admin, professional | Create product |
| PUT | `/:id/image` | verifyToken | admin, professional (owner or admin) | Upload product image |
| PUT | `/:id` | verifyToken | admin, professional (owner or admin) | Update product |
| DELETE | `/:id` | verifyToken | admin, professional (owner or admin) | Delete product |

### `/api/professionals` (`src/routes/professional.routes.js`) — 3 endpoints

| Method | Path | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/requests` | verifyToken | admin | List professional signup requests (optional `?status=`) |
| POST | `/requests/:id/approve` | verifyToken | admin | Approve a professional request |
| POST | `/requests/:id/reject` | verifyToken | admin | Reject a professional request |

### `/api/recipes` (`src/routes/recipe.routes.js`) — 5 endpoints

| Method | Path | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/` | none | — | List recipes (optional `?category=`) |
| GET | `/:id` | none | — | Get one recipe |
| POST | `/` | verifyToken | admin | Create recipe |
| PUT | `/:id` | verifyToken | admin | Update recipe |
| DELETE | `/:id` | verifyToken | admin | Delete recipe |

### `/api/scan` (`src/routes/scan.routes.js`) — 2 endpoints

| Method | Path | Auth | Role | Purpose |
|---|---|---|---|---|
| POST | `/label` | verifyToken | any | AI ingredient-label scan (Groq vision model) |
| GET | `/history` | verifyToken | any | List own scan history (last 20) |

### `/api/users` (`src/routes/user.routes.js`) — 5 endpoints

| Method | Path | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/` | verifyToken | admin | List all users |
| GET | `/analytics` | verifyToken | admin | Aggregate signup/role/onboarding analytics |
| GET | `/me/favorites` | verifyToken | any | Get own favorite map spots |
| PUT | `/me/favorites` | verifyToken | any | Replace own favorite map spots |
| GET | `/:id/orders` | verifyToken | admin | List a specific user's orders |

**Root** (`src/app.js`): `GET /` returns `{ success: true, data: { name: "Glutenia API", status: "running" } }`. Unmatched routes get a `404 { success: false, message: "Route not found" }`. All errors funnel through `errorHandler` (`src/middleware/errorHandler.js`).

---

## 5. Technologies — exact versions from the lockfiles

### Backend (`glutenia-backend/package-lock.json`, lockfileVersion 3)

| Package | package.json range | **Resolved (lockfile)** |
|---|---|---|
| bcryptjs | ^2.4.3 | **2.4.3** |
| cors | ^2.8.5 | **2.8.6** |
| dotenv | ^16.4.7 | **16.6.1** |
| express | ^4.21.2 | **4.22.2** |
| express-validator | ^7.2.1 | **7.3.2** |
| groq-sdk | ^1.3.0 | **1.3.0** |
| jsonwebtoken | ^9.0.2 | **9.0.3** |
| mongoose | ^8.9.5 | **8.24.0** |
| multer | ^2.1.1 | **2.2.0** |
| supertest (dev) | ^7.2.2 | **7.2.2** |

`engines.node`: `>=20`.

### Frontend (`glutenia-mobile/package-lock.json`, lockfileVersion 3)

| Package | package.json range | **Resolved (lockfile)** |
|---|---|---|
| @expo/metro-runtime | ~5.0.5 | **5.0.5** |
| @expo/vector-icons | 14.1.0 | **14.1.0** |
| @google/generative-ai | ^0.24.1 | **0.24.1** |
| @gorhom/bottom-sheet | ^5.2.14 | **5.2.14** |
| @react-native-async-storage/async-storage | 2.1.2 | **2.1.2** |
| @react-navigation/bottom-tabs | 6.6.1 | **6.6.1** |
| @react-navigation/native | 6.1.18 | **6.1.18** |
| @react-navigation/native-stack | 6.11.0 | **6.11.0** |
| expo | 53.0.27 | **53.0.27** |
| expo-asset | ~11.1.7 | **11.1.7** |
| expo-camera | ~16.1.11 | **16.1.11** |
| expo-constants | 17.1.8 | **17.1.8** |
| expo-file-system | ~18.1.7 | **18.1.11** |
| expo-font | ~13.3.2 | **13.3.2** |
| expo-image-manipulator | ~13.1.7 | **13.1.7** |
| expo-image-picker | ~16.1.4 | **16.1.4** |
| expo-localization | ~16.1.6 | **16.1.6** |
| expo-notifications | ~0.31.5 | **0.31.5** |
| expo-status-bar | 2.2.3 | **2.2.3** |
| i18next | ^26.3.2 | **26.3.2** |
| lucide-react-native | ^1.17.0 | **1.17.0** |
| react | 19.0.0 | **19.0.0** |
| react-dom | 19.0.0 | **19.0.0** |
| react-i18next | ^17.0.8 | **17.0.8** |
| react-native | 0.79.6 | **0.79.6** |
| react-native-gesture-handler | ~2.24.0 | **2.24.0** |
| react-native-reanimated | ~3.17.4 | **3.17.5** |
| react-native-safe-area-context | 5.4.0 | **5.4.0** |
| react-native-screens | 4.11.1 | **4.11.1** |
| react-native-svg | 15.11.2 | **15.11.2** |
| react-native-web | ^0.20.0 | **0.20.0** |
| react-native-webview | 13.13.5 | **13.13.5** |
| @babel/core (dev) | ^7.25.2 | **7.29.7** |
| @testing-library/react-native (dev) | ^14.0.1 | **14.0.1** |
| @types/jest (dev) | ^30.0.0 | **30.0.0** |
| @types/react (dev) | ~19.0.10 | **19.0.14** |
| @types/react-dom (dev) | ~19.0.4 | **19.0.6** |
| eslint (dev) | ^9.0.0 | **9.39.5** |
| eslint-config-expo (dev) | ~9.2.0 | **9.2.0** |
| jest (dev) | ~29.7.0 | **29.7.0** |
| jest-expo (dev) | ~53.0.14 | **53.0.14** |
| patch-package (dev) | ^8.0.1 | **8.0.1** |
| sharp (dev) | ^0.34.5 | **0.34.5** |
| typescript (dev) | ~5.8.3 | **5.8.3** |

Notable: `@google/generative-ai` is still a declared **frontend** dependency even though the backend's own copy was removed in commit `24890cd` ("Remove unused @google/genai, @google/generative-ai, and nodemailer deps"). Checked today: `grep -r "generative-ai|GoogleGenerativeAI" glutenia-mobile/src` returns **zero matches** — it is genuinely unused dead weight in `glutenia-mobile/package.json`, left over from before the backend switched to Groq (commit `a0f84ac`). Not removed here (out of scope for a fact sheet); flagged in `CONSISTENCY_ISSUES.md`.

### Root (`glutenia/package.json` — Render deploy entrypoint, not an app)

```json
{
  "name": "glutenia",
  "description": "Render entrypoint for the Glutenia backend service.",
  "scripts": { "postinstall": "npm --prefix glutenia-backend ci", "build": "npm --prefix glutenia-backend ci", "start": "npm --prefix glutenia-backend start" },
  "dependencies": { "expo": "^56.0.12" }
}
```
The `expo` dependency here looks stray (the description says this file's only job is proxying to the backend) — flagged in `CONSISTENCY_ISSUES.md`, not fixed here.

---

## 6. Code snippets most likely to be quoted

All paths relative to repo root; line numbers as of 2026-07-31.

### 1. Checkout transaction — atomic stock reservation + all-or-nothing order

`glutenia-backend/src/controllers/order.controller.js:41-134`

```js
// Atomically reserves stock for a single line item: the $gte guard means the
// update only applies (and only then does stock actually decrement) if
// enough stock is still available at the moment this runs, so concurrent
// checkouts for the same product can never both succeed for more than what's
// really in stock. Combined with the transaction in createOrder, a failure
// on any one item rolls back every decrement already made for earlier items
// in the same order — an order is all-or-nothing, never partially reserved.
const reserveStock = async (item, session) => {
  const qty = item.qty;
  const updated = await Product.findOneAndUpdate(
    { _id: item.productId, stock: { $gte: qty } },
    { $inc: { stock: -qty } },
    { new: true, session }
  );

  if (updated) {
    return { product: updated._id, name: updated.name, qty, price: updated.price };
  }
  // ... 404/409 branching omitted, see file
};

exports.createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    let order;
    await session.withTransaction(async () => {
      const orderItems = [];
      for (const item of req.body.items) {
        orderItems.push(await reserveStock(item, session));
      }
      const subtotal = orderItems.reduce((sum, item) => sum + item.qty * item.price, 0);
      const total = subtotal + DELIVERY_FEE;

      const [createdOrder] = await Order.create(
        [{ user: req.user.id, items: orderItems, total, deliveryFee: DELIVERY_FEE,
           address: req.body.address, status: "confirmed" }],
        { session }
      );
      order = createdOrder;

      await Cart.findOneAndUpdate({ user: req.user.id }, { items: [], updatedAt: new Date() }, { session });
    });

    const gamification = await gamificationService.recordAction(req.user.id, "order_placed", {
      sourceId: order._id.toString(),
    });
    return res.status(201).json({ success: true, data: { ...order.toObject(), gamification } });
  } catch (error) {
    return next(error);
  } finally {
    await session.endSession();
  }
};
```

### 2. JWT auth middleware

`glutenia-backend/src/middleware/verifyToken.js:1-27` (full file)

```js
const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config/auth");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authorization token is required" });
  }

  const token = authHeader.split(" ")[1];

  try {
    req.user = jwt.verify(token, getJwtSecret());
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = verifyToken;
```

### 3. Password hashing (register + change-password)

`glutenia-backend/src/controllers/auth.controller.js:12-23, 47, 258`

```js
const createToken = (user) => jwt.sign(
  { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
  getJwtSecret(),
  { expiresIn: getJwtExpiresIn() }
);
// register() — line 47:
const hashedPassword = await bcrypt.hash(password, 12);
// changePassword() — line 258:
user.password = await bcrypt.hash(newPassword, 12);
```
Cost factor: **12** salt rounds, both places. Login compares with `bcrypt.compare(password, user.password)` (line 97).

### 4. express-validator chain (registration)

`glutenia-backend/src/routes/auth.routes.js:28-47`

```js
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("A valid email is required").normalizeEmail(NORMALIZE_EMAIL_OPTIONS),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role").optional().isIn(["customer", "professional"]).withMessage("Role must be customer or professional"),
    phoneValidator("phone"),
  ],
  validateRequest,
  authController.register
);
```
Note (lines 9-19 of the same file): `normalizeEmail` is deliberately configured with every Gmail/Outlook/Yahoo/iCloud dot- and subaddress-stripping option turned **off** — the default behavior silently collapses visually distinct addresses onto one account and caused false "email already taken" conflicts.

### 5. `validateRequest` — turns express-validator errors into the API's error shape

`glutenia-backend/src/middleware/validateRequest.js` (full file, 19 lines)

```js
const { validationResult } = require("express-validator");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({
    success: false,
    message: errors.array().map((error) => error.msg).join("; "),
  });
};
```

### 6. Role-gate middleware (two variants actually used)

`glutenia-backend/src/middleware/isAdmin.js` (full, 12 lines) and `src/middleware/requireRole.js` (full, 12 lines):

```js
// isAdmin.js
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  return next();
};

// requireRole.js — parameterized version used where admin OR professional is allowed
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "You don't have permission to perform this action" });
  }
  return next();
};
```

### 7. Centralized error handler

`glutenia-backend/src/middleware/errorHandler.js` (full file, 38 lines) — maps Mongoose `CastError` → 404, `ValidationError` → 400 (joined messages), duplicate-key `code === 11000` → 409, Multer's `LIMIT_FILE_SIZE` → 413, everything else → 500.

### 8. CartContext test — the regression test for the `user.id` vs `user._id` bug

`glutenia-mobile/src/context/__tests__/CartContext.test.tsx` (full file, 62 lines)

```tsx
// The real backend User document has no `id` field, only `_id` (verified
// against User.js and every controller that serializes it - Mongoose's `id`
// virtual is not included in JSON output anywhere in this app). A test user
// shaped exactly like the real API response, deliberately without `id`, so
// this test fails the same way production silently failed before the
// TS migration: if CartContext's storage key or effect guards ever go back
// to reading `user.id` instead of `user._id`, `user.id` here is `undefined`,
// the `if (!user?.id) return` guard fires, and the cart is never persisted -
// the assertion below on the stored content would then fail.
const testUser = { _id: "user-123" } as User;

describe("CartContext persistence", () => {
  it("persists added items to AsyncStorage under a key derived from user._id", async () => {
    const { result } = await renderHook(() => useCart(), { wrapper: CartProvider });
    await act(async () => { result.current.addItem(product, 1); });
    await waitFor(async () => {
      const stored = await AsyncStorage.getItem("glutenia.cart.user-123");
      const items = stored ? JSON.parse(stored) : [];
      expect(items).toHaveLength(1);
    });
    // ...
  });
});
```

### 9. The actual fix in `CartContext.tsx`

`glutenia-mobile/src/context/CartContext.tsx:8, 48, 57-59`

```ts
const storageKey = (userId: string) => `glutenia.cart.${userId}`;
// ...
if (!user?._id) return;
AsyncStorage.setItem(storageKey(user._id), JSON.stringify(items));
```

### 10. `User` interface — mirrors the backend Mongoose schema exactly

`glutenia-mobile/src/types/models.ts:37-60`

```ts
// The User document as it comes back from the API. The backend's toJSON
// transform always strips `password` before serializing, so it's never part
// of this type.
export interface User {
  _id: string;
  name: string;
  avatar: string | null;
  phone: string;
  pushTokens: string[];
  pushNotificationsEnabled: boolean;
  notifyOrders: boolean;
  notifyEvents: boolean;
  theme_preference: ThemePreference | null;
  language: Language | null;
  email: string;
  role: UserRole;
  professionalStatus: ProfessionalStatus | null;
  approvalCode: string | null;
  role_type: RoleType | null;
  gluten_free_since: string | null;
  experience_level: ExperienceLevel | null;
  primary_goal: PrimaryGoal | null;
  eating_out_frequency: EatingOutFrequency | null;
  favoriteSpots: unknown[];
  confidence_identifying_gf: ConfidenceLevel | null;
  createdAt: string;
}
```

### 11. `OrderAddress` interface (a small, quotable one for "what an interface is")

`glutenia-mobile/src/types/models.ts:187-192`

```ts
export interface OrderAddress {
  fullName: string;
  addressLine: string;
  city: string;
  phone: string;
}
```

### 12. `IconName` union type — derived, not hand-duplicated

`glutenia-mobile/src/components/AppIcon.tsx:56-118`

```tsx
export const icons = {
  add: CirclePlus,
  "add-circle": CirclePlus,
  "arrow-back": ArrowLeft,
  basket: ShoppingBasket,
  // ... 57 entries total, string key -> lucide-react-native component
  "play-circle": PlayCircle,
};

export type IconName = keyof typeof icons;
```
`IconName` is `keyof typeof icons` — a **derived** union of the 57 map keys, not a hand-written/duplicated list. This is deliberate: it can never drift from the map (see the coverage test below).

### 13. Icon-map coverage test — the thing `IconName` alone can't catch

`glutenia-mobile/src/components/__tests__/AppIcon.test.tsx` (full file, 22 lines)

```tsx
// `IconName` is `keyof typeof icons`, so it can never itself drift from the
// map's keys - but that only guarantees every *key* has a *value*, not that
// every value is a real, renderable component (a typo'd import ... is
// `undefined` at runtime and AppIcon's `icons[name] || Circle` fallback would
// silently swallow it as a generic circle everywhere that icon is used).
describe("AppIcon icon map coverage", () => {
  const names = Object.keys(icons) as IconName[];
  it("has icons defined", () => { expect(names.length).toBeGreaterThan(0); });
  it.each(names)("maps %s to a defined, renderable icon component", (name) => {
    expect(icons[name]).toBeDefined();
    expect(() => render(<AppIcon name={name} />)).not.toThrow();
  });
});
```

### 14. Barcode checksum validator (GS1 check-digit algorithm)

`glutenia-backend/src/utils/barcode.js` (full file, 22 lines)

```js
// Standard GS1 check-digit algorithm — shared by EAN-8, UPC-A, EAN-13, and
// GTIN-14. Rejects most fabricated/typo'd barcodes: a random digit string
// only has a 1-in-10 chance of passing by accident.
function isValidBarcodeChecksum(barcode) {
  if (typeof barcode !== "string" || !/^\d+$/.test(barcode)) return false;
  if (![8, 12, 13, 14].includes(barcode.length)) return false;

  const digits = barcode.split("").map(Number);
  const checkDigit = digits.pop();
  let sum = 0;
  digits.reverse().forEach((digit, i) => { sum += digit * (i % 2 === 0 ? 3 : 1); });

  return (10 - (sum % 10)) % 10 === checkDigit;
}
```

### 15. Gamification `recordAction` — single entry point for XP/streak/badges

`glutenia-backend/src/services/gamificationService.js:266-294`

```js
// Single entry point for every real user action that should earn XP. Wraps
// its own try/catch so a gamification bug never breaks the underlying
// scan/RSVP/order request that triggered it.
async function recordAction(userId, actionType, metadata = {}) {
  try {
    const config = ACTION_CONFIG[actionType];
    if (!config) return null;

    const updatedGamification = await UserGamification.findOneAndUpdate(
      { userId }, { $inc: { [config.counterField]: 1 } }, { new: true, upsert: true }
    );
    const currentValue = updatedGamification[config.counterField];

    const xpResult = await awardXP(userId, config.xp, actionType, metadata?.sourceId ?? null);
    const streakResult = await updateStreak(userId);
    const badgesUnlocked = await checkAndAwardBadges(userId, config.metric, currentValue);

    return { xpGained: config.xp, leveledUp: xpResult?.leveledUp ?? false, /* ... */ badgesUnlocked };
  } catch (err) {
    console.error("[gamificationService] recordAction error:", err);
    return null;
  }
}
```

---

## 7. TypeScript migration — measured figures (from `MIGRATION_REPORT.md`, cross-checked today)

| Metric | Migration report's figure | **Re-measured today (2026-07-31)** | Match? |
|---|---|---|---|
| TS/TSX files in `src/` | 103→108 | 108 | ✅ |
| Total files (incl. `App.tsx`) | 104→109 | 109 | ✅ |
| Lines of code | 26,027→27,802 | 27,763 | ~✅ (39-line difference; likely small edits since the report was written — not investigated further) |
| TypeScript errors | 0 | 0 | ✅ |
| ESLint | 0 errors, 74 warnings | 0 errors, 74 warnings | ✅ exact match |
| Jest | 3 files, 61 tests, all passing | 3 files, 61 tests, all passing | ✅ exact match |
| Bugs found & fixed by the migration | 2 fixed (`user.id`/`user._id` cart bug; `lineColor` chart-color bug), 1 prevented (39 unchecked token casts) | not independently re-audited today; code for both fixes is present and covered by tests (see snippets §6.8-6.9 and `f1fe0a0`, `842432f` in the commit log) | — |
| `noUncheckedIndexedAccess` audit (42 errors / 13 files, all hand-confirmed safe) | claimed in report | **not re-measured today** — the scratch `tsconfig.strict-audit.json` used for that audit no longer exists in the repo; re-creating it and re-doing the 42-case manual safety judgment was out of scope for today's fact-gathering | ⚠️ take this one on the report's word only |

Migration order (bottom-up, unchanged from the report): types → API client → contexts → navigation → components → screens → app entry point. Commit hashes for each phase are in the git log tables in §9.

---

## 8. Backend hardening — measured figures

This branch (`backend-hardening`) contains the following backend-only work, confirmed against `git log` and `LIMITATIONS.md` today:

| Change | Commit | Verified today |
|---|---|---|
| Removed hardcoded JWT fallback secret; server now fails fast if `JWT_SECRET` is unset | `54622ca` | `src/config/auth.js` `getJwtSecret()` throws if unset (see §6.2) |
| `GROQ_API_KEY` documented + explicit failure if missing | `f2b293a` | `scan.controller.js` line 41-46 returns a clear 500 instead of an SDK crash |
| Removed 2 of 5 candidate dead endpoints, kept 3 covered by tests | `4e9a447` | — |
| Removed unused `@google/genai`, `@google/generative-ai`, `nodemailer` backend deps | `24890cd` | confirmed absent from `glutenia-backend/package.json` today (still present in `glutenia-mobile/package.json` — see §5 flag) |
| Added index on `Order.user` | `3c7f043` | confirmed in `src/models/Order.js` line 99 |
| Fixed 2 pre-existing test bugs, exposed once transactions actually run | `844808d` | backend test suite re-run today: **25/25 passing, 10 suites, 0 failures** |
| Replaced stale README route list with a pointer to `src/routes/` | `e74595f` | confirmed current `glutenia-backend/README.md` (§10 quotes it in full) |
| 3 deliberate, documented tradeoffs (no pagination; base64 images in Mongo; JWT role not re-validated) | — | `LIMITATIONS.md`, full text below |

**`LIMITATIONS.md` — full current text** (3 tradeoffs, each with a stated reason and a stated fix-path):
1. **No pagination on list endpoints** — every list endpoint (`GET /products`, `/recipes`, admin `/orders`, `/events`, etc.) returns the full collection; only `/notifications` (cap 50) and `/scan/history` (cap 20) are capped. Justified by demo-scale data volumes; flagged as the first thing to add if real user volume arrives.
2. **Images stored as base64 inside MongoDB documents**, not in object storage (S3/Cloudinary) — zero external services/cost, but no CDN and a theoretical 16MB document ceiling.
3. **JWT role is not re-validated against the database after issuance** — standard stateless-JWT tradeoff; no code path currently changes a user's role after login, so there's nothing today that this would protect against.

---

## 9. Git commit log

Both apps live in one monorepo (single `git log`, filtered by path — not two separate repositories). Commands used:
```
git log --date=short --pretty=format:"COMMIT|%h|%ad|%s" --name-only -- glutenia-backend
git log --date=short --pretty=format:"COMMIT|%h|%ad|%s" --name-only -- glutenia-mobile
```

### Backend — 44 commits touching `glutenia-backend/`

| Hash | Date | Message | Files changed |
|---|---|---|---|
| `844808d` | 2026-07-28 | Fix 2 pre-existing test bugs, exposed now that transactions actually run | `test/api.test.js` |
| `e74595f` | 2026-07-28 | Replace stale README route list with a pointer to src/routes/ | `README.md` |
| `3c7f043` | 2026-07-28 | Add index on Order.user | `src/models/Order.js` |
| `4e9a447` | 2026-07-28 | Remove 2 of 5 candidate dead endpoints; keep 3 covered by tests | `src/controllers/communityProduct.controller.js`, `src/controllers/gamification.controller.js`, `src/routes/communityProduct.routes.js`, `src/routes/gamification.routes.js` |
| `24890cd` | 2026-07-28 | Remove unused @google/genai, @google/generative-ai, and nodemailer deps | `package-lock.json`, `package.json` |
| `f2b293a` | 2026-07-28 | Document GROQ_API_KEY and fail explicitly when it's missing | `.env.example`, `.env.production.example`, `src/controllers/scan.controller.js` |
| `54622ca` | 2026-07-28 | Remove hardcoded JWT fallback secret, fail fast if JWT_SECRET is unset | `server.js`, `src/config/auth.js` |
| `b081f32` | 2026-07-25 | Checkpoint in-progress event capacity, product stock, and role medallion work | `scripts/exportOrphanedData.js`, `src/controllers/event.controller.js`, `src/controllers/product.controller.js`, `src/models/Event.js`, `src/models/Product.js`, `src/routes/event.routes.js`, `src/scripts/addDemoEvents.js`, `src/scripts/addDemoProducts.js`, `src/scripts/addMorePatientResources.js` |
| `1e4d159` | 2026-07-22 | Fix stock integrity and product management gaps across the Products feature | `src/controllers/order.controller.js`, `src/controllers/product.controller.js`, `src/routes/product.routes.js`, `test/api.test.js` |
| `a1623ae` | 2026-07-22 | Add admin-manageable Patient Resources | `src/app.js`, `src/controllers/patientResource.controller.js`, `src/models/PatientResource.js`, `src/routes/patientResource.routes.js`, `src/scripts/addPatientResources.js`, `test/api.test.js` |
| `ffa3fe5` | 2026-07-22 | Add shared personalization layer and gamification engagement titles | `src/controllers/onboarding.controller.js`, `src/models/Badge.js`, `src/scripts/addProfileFactBadges.js`, `src/seed/seed.js`, `src/services/gamificationService.js` |
| `b0668c3` | 2026-07-22 | Remove unreachable legacy onboarding endpoint | `src/controllers/onboarding.controller.js`, `src/routes/onboarding.routes.js` |
| `ab025f4` | 2026-07-22 | Add crowdsourced product contribution with community verification | `src/app.js`, `src/controllers/communityProduct.controller.js`, `src/controllers/product.controller.js`, `src/models/CommunityProduct.js`, `src/models/UserGamification.js`, `src/routes/communityProduct.routes.js`, `src/scripts/addCommunityContributorBadge.js`, `src/seed/seed.js`, `src/services/gamificationService.js`, `src/utils/barcode.js` |
| `18ca366` | 2026-07-21 | Require MONGO_URI from environment configuration | `src/config/db.js` |
| `8907e70` | 2026-07-21 | Sync map favorites to the user's account with a dedicated Favorite Places screen | `src/controllers/user.controller.js`, `src/models/User.js`, `src/routes/user.routes.js` |
| `9c52077` | 2026-07-21 | Make notifications deep-link and stop journey edits from resetting start date | `src/controllers/event.controller.js`, `src/controllers/order.controller.js`, `src/models/Notification.js`, `src/services/notificationService.js` |
| `b9d09af` | 2026-07-21 | Add badge visual system with tiers, grid, detail view, and unlock celebration | `src/controllers/gamification.controller.js`, `src/routes/gamification.routes.js`, `src/services/gamificationService.js` |
| `8846430` | 2026-07-21 | Fix profile/RSVP/map bugs, add coordinate paste and time-range picker, redesign admin home | `src/services/gamificationService.js` |
| `5d8057f` | 2026-07-21 | Migrate label-scan model from deprecated Llama 4 Scout to Qwen 3.6 27B | `src/controllers/scan.controller.js` |
| `c3d0e79` | 2026-07-21 | Rewrite gamification reward pipeline and wire it into real user actions | 26 files: `src/app.js`, controllers (`auth`,`event`,`gamification`,`onboarding`,`order`,`product`,`professional`,`scan`,`user`), models (`Achievement`,`Badge`,`Order`,`ScanHistory`,`User`,`UserAchievement`,`UserGamification`), routes (`auth`,`gamification`,`product`,`scan`,`user`), `src/scripts/migrateGamification.js`, `src/seed/seed.js`, services (`gamificationService`,`notificationService`,`pushService`,`scanService`) |
| `bd45483` | 2026-07-14 | Add admin recipe management (CRUD) backed by a real database | `server.js`, `src/app.js`, `src/controllers/recipe.controller.js`, `src/models/Recipe.js`, `src/routes/recipe.routes.js`, `src/seed/seedRecipes.js`, `test/api.test.js` |
| `bc82fa2` | 2026-07-14 | Make edit profile, avatar, and change password actually work | `src/controllers/auth.controller.js`, `src/models/User.js`, `src/routes/auth.routes.js`, `test/api.test.js` |
| `af862ae` | 2026-07-14 | Remove email verification (Gmail SMTP unreachable on Render) | `.env.example`, `.env.production.example`, `src/config/mail.js`, `src/controllers/auth.controller.js`, `src/models/User.js`, `src/routes/auth.routes.js`, `src/services/emailService.js`, `test/api.test.js` |
| `cd4eaae` | 2026-07-14 | Try Gmail SMTP over port 587 instead of 465 | `src/config/mail.js` |
| `5127cf1` | 2026-07-14 | Stop blocking registration/resend responses on SMTP send | `src/controllers/auth.controller.js` |
| `7895b8f` | 2026-07-14 | Fix false "email already taken" and stuck accounts on registration | `src/controllers/auth.controller.js`, `src/routes/auth.routes.js` |
| `991bb9d` | 2026-07-14 | Add email verification, notifications, and misc fixes | 13 files: `.env.example`, `.env.production.example`, `package-lock.json`, `package.json`, `src/app.js`, `src/config/mail.js`, `src/controllers/auth.controller.js`, `src/controllers/event.controller.js`, `src/controllers/notification.controller.js`, `src/controllers/order.controller.js`, `src/models/Notification.js`, `src/models/Order.js`, `src/models/User.js`, `src/routes/auth.routes.js`, `src/routes/notification.routes.js`, `src/routes/order.routes.js`, `src/services/emailService.js`, `src/services/notificationService.js`, `test/api.test.js` |
| `be11a39` | 2026-07-10 | Add professional accounts, establishments, and app-wide theming | 14 files: `src/app.js`, `src/controllers/auth.controller.js`, `src/controllers/establishment.controller.js`, `src/controllers/order.controller.js`, `src/controllers/product.controller.js`, `src/controllers/professional.controller.js`, `src/middleware/requireRole.js`, `src/models/Establishment.js`, `src/models/User.js`, `src/routes/auth.routes.js`, `src/routes/establishment.routes.js`, `src/routes/order.routes.js`, `src/routes/product.routes.js`, `src/routes/professional.routes.js` |
| `902c335` | 2026-06-29 | Add events feature: model, controller, routes, and mount in app | `src/app.js`, `src/controllers/event.controller.js`, `src/models/Event.js`, `src/routes/event.routes.js` |
| `a0f84ac` | 2026-06-29 | Switch AI provider from Gemini to Groq (Llama 4 vision) | `package-lock.json`, `package.json`, `src/controllers/scan.controller.js` |
| `d39f7d2` | 2026-06-29 | Switch to gemini-2.0-flash-lite (free tier, v1beta) | `src/controllers/scan.controller.js` |
| `fcdf7b4` | 2026-06-29 | Use gemini-1.5-flash on v1 API endpoint (confirmed free tier) | `src/controllers/scan.controller.js` |
| `13a05ed` | 2026-06-29 | Switch to @google/genai SDK (uses v1 stable API endpoint) | `package-lock.json`, `package.json`, `src/controllers/scan.controller.js` |
| `5ab1ae7` | 2026-06-29 | Force Gemini SDK to use v1 API endpoint (free tier quota) | `src/controllers/scan.controller.js` |
| `6a8ecd2` | 2026-06-29 | Expose raw Gemini error for debugging | `src/controllers/scan.controller.js` |
| `d19ef50` | 2026-06-29 | Switch to gemini-2.0-flash (available on v1beta endpoint) | `src/controllers/scan.controller.js` |
| `5c2903c` | 2026-06-29 | Revert to gemini-1.5-flash for API key compatibility | `src/controllers/scan.controller.js` |
| `39065e7` | 2026-06-29 | Fix scan route: verifyToken is a default export not named | `src/routes/scan.routes.js` |
| `89e6630` | 2026-06-29 | Fix scan route: import verifyToken from correct middleware path | `src/routes/scan.routes.js` |
| `47f7c2d` | 2026-06-29 | Fix server crash: initialize Gemini client lazily inside request handler | `src/controllers/scan.controller.js` |
| `694e818` | 2026-06-29 | Upgrade scan controller to gemini-2.0-flash-lite with response validation | `src/controllers/scan.controller.js` |
| `80c4d2c` | 2026-06-28 | Add AI label scan endpoint using Gemini | `package-lock.json`, `package.json`, `src/app.js`, `src/controllers/scan.controller.js`, `src/routes/scan.routes.js` |
| `d82bd09` | 2026-06-27 | Add temporary seed endpoint for production database | `src/app.js` |
| `4b5f141` | 2026-06-27 | Real work from main computer | `src/controllers/product.controller.js`, `src/models/Product.js`, `src/routes/product.routes.js`, `src/seed/seed.js` |
| `8856126` | 2026-06-25 | Initial commit | 34 files — full backend scaffold (server.js, app.js, all initial controllers/models/routes/middleware, `.env.example`, `run.ps1`, `README.md`) |

### Frontend — 60 commits touching `glutenia-mobile/`

| Hash | Date | Message | Files changed |
|---|---|---|---|
| `cc7dde8` | 2026-07-25 | Mark known-dead StarRating/STARS_*/options as intentionally unused | `src/components/CustomTabBar.tsx`, `src/screens/user/MapDetailScreen.tsx`, `src/screens/user/MapScreen.tsx` |
| `6d818c6` | 2026-07-25 | Add t to CartContext's value useMemo deps to avoid a stale-translation closure | `src/context/CartContext.tsx` |
| `f1fe0a0` | 2026-07-25 | Fix CurveChartView using undefined color instead of the primary-color fallback | `src/components/charts/CurveChartView.tsx` |
| `ebf48d7` | 2026-07-25 | Add isApiError type guard and apply it to the 15 catch sites reading status/data | `src/api/client.ts` + 14 screens |
| `842432f` | 2026-07-25 | Add useAuthenticated and replace 39 unguarded token-as-string casts across 24 screens | `src/context/AuthContext.tsx`, `src/context/NotificationContext.tsx` + 22 screens |
| `dd0542c` | 2026-07-25 | Set up jest-expo + RNTL and add regression tests for CartContext, AppIcon, and api client parsing | `package.json`, `package-lock.json`, 3 new test files, `src/components/AppIcon.tsx` |
| `7c0644b` | 2026-07-25 | Scaffold ESLint (expo lint), fix build-artifact ignores, apply safe array-type autofixes | `eslint.config.js`, `package.json`, `package-lock.json`, `src/api/client.ts`, `src/types/models.ts` + 6 screens |
| `84ac029` | 2026-07-25 | Fix stale i18n/index.js reference in AuthContext comment | `src/context/AuthContext.tsx` |
| `6c0bfb9` | 2026-07-25 | Derive AdminAnalyticsScreen chart key order from labels via keyof typeof | `src/screens/admin/AdminAnalyticsScreen.tsx` |
| `319198f` | 2026-07-25 | Replace context useContext(...) as X casts with throwing guards | `AuthContext.tsx`, `CartContext.tsx`, `EventsContext.tsx`, `NotificationContext.tsx` |
| `728c6ae` | 2026-07-25 | Convert App.js to TypeScript (Phase 6c final) | `App.tsx` |
| `8a5d6bf` | 2026-07-25 | Convert remaining settings/account/seller screens and push service to TypeScript (Phase 6c batch 4 of 4) | 10 files |
| `d56072a` | 2026-07-25 | Convert scan/recipe/resource/legal/badge user screens to TypeScript (Phase 6c batch 3 of 4) | 13 files |
| `757171f` | 2026-07-25 | Convert events/map screens to TypeScript (Phase 6c batch 2 of 4) | 9 files |
| `b7bf431` | 2026-07-25 | Convert shop/cart/checkout screens to TypeScript (Phase 6c, batch 1 of 4) | 10 files |
| `20c87ee` | 2026-07-25 | Convert all 13 admin screens to TypeScript (Phase 6b) | 17 files |
| `9c3a1b8` | 2026-07-25 | Convert onboarding/auth/root screens to TypeScript (Phase 6a) | 12 files |
| `adbbab0` | 2026-07-25 | Convert all 27 components to TypeScript (Phase 5) | 29 files |
| `74c6787` | 2026-07-25 | Convert navigation to TypeScript with a typed RootParamList (Phase 4) | 6 files |
| `936fe51` | 2026-07-25 | Convert the 7 context providers to TypeScript (Phase 3) | 8 files |
| `e497e28` | 2026-07-25 | Convert api/client to TypeScript with modeled response types (Phase 2) | 3 files |
| `fb082a7` | 2026-07-25 | Convert theme/utils/i18n leaf files to TypeScript (Phase 1) | 9 files |
| `7a8c7b7` | 2026-07-25 | Add TypeScript tooling to glutenia-mobile (Phase 0 of JS->TS migration) | `expo-env.d.ts`, `package.json`, `package-lock.json`, `tsconfig.json` |
| `b081f32` | 2026-07-25 | Checkpoint in-progress event capacity, product stock, and role medallion work | 12 files (pre-TS, `.js`) |
| `04d92ff` | 2026-07-23 | Remove Patient Resources row from the profile settings list | `src/screens/AccountScreen.js` |
| `1e4d159` | 2026-07-22 | Fix stock integrity and product management gaps across the Products feature | 13 files |
| `a1623ae` | 2026-07-22 | Add admin-manageable Patient Resources | 9 files |
| `ffa3fe5` | 2026-07-22 | Add shared personalization layer and gamification engagement titles | 6 files |
| `e0532ab` | 2026-07-22 | Fix badge modal layout, profile refetch-on-focus, and photo upload badge | 3 files |
| `22813e1` | 2026-07-22 | Add translated strings for the above changes across en/fr/ar | 3 locale files |
| `4f79a4a` | 2026-07-22 | Fix cold-start onboarding replay, cross-device language, and dead UI | 5 files |
| `4115df6` | 2026-07-22 | Personalize Home quick-access order by onboarding goal | `src/screens/user/HomeScreen.js` |
| `1d5beb3` | 2026-07-22 | Derive profile Title from the same source as the Journey tracker | `src/screens/AccountScreen.js` |
| `ab025f4` | 2026-07-22 | Add crowdsourced product contribution with community verification | 4 files |
| `68e1a91` | 2026-07-21 | Add root README and update setup docs | `README.md` |
| `96ab815` | 2026-07-21 | Add Expo web support and memoize onboarding FlatList viewability config | `package.json`, `package-lock.json`, `OnboardingScreen.js` |
| `17c25e6` | 2026-07-21 | Fix AppIcon rendering icons with a solid black fill | `src/components/AppIcon.js` |
| `8907e70` | 2026-07-21 | Sync map favorites to the user's account with a dedicated Favorite Places screen | 3 files |
| `5cfc66c` | 2026-07-21 | Add eating-out-frequency onboarding question and use answers to personalize the app | 9 files |
| `9c52077` | 2026-07-21 | Make notifications deep-link and stop journey edits from resetting start date | 2 files |
| `1157125` | 2026-07-21 | Fix undersized splash logo and shrink onboarding illustrations | 3 files (incl. 1 image asset) |
| `b9d09af` | 2026-07-21 | Add badge visual system with tiers, grid, detail view, and unlock celebration | 10 files |
| `c8db991` | 2026-07-21 | Simplify map shop card and make the favorite heart functional | 2 files |
| `39c585e` | 2026-07-21 | Remove non-functional Text Size row from settings | `src/screens/user/SettingsScreen.js` |
| `59a900e` | 2026-07-21 | Add fr/ar translations for new admin dashboard strings, fix item-count label collision | 4 files |
| `8846430` | 2026-07-21 | Fix profile/RSVP/map bugs, add coordinate paste and time-range picker, redesign admin home | 19 files (incl. 3 image assets) |
| `130ed60` | 2026-07-21 | Bump react-native-webview to fix likely native crash on standalone APK | `package.json`, `package-lock.json`, 1 patch file |
| `d96b825` | 2026-07-21 | Finish dark theme across the app and fix map not showing new locations | **62 files** — nearly every component and screen |
| `c3d0e79` | 2026-07-21 | Rewrite gamification reward pipeline and wire it into real user actions | 45 files |
| `bd45483` | 2026-07-14 | Add admin recipe management (CRUD) backed by a real database | 9 files |
| `bc82fa2` | 2026-07-14 | Make edit profile, avatar, and change password actually work | 9 files |
| `af862ae` | 2026-07-14 | Remove email verification (Gmail SMTP unreachable on Render) | 9 files |
| `991bb9d` | 2026-07-14 | Add email verification, notifications, and misc fixes | 21 files |
| `be11a39` | 2026-07-10 | Add professional accounts, establishments, and app-wide theming | 33 files (incl. 4 image assets) |
| `a74a50a` | 2026-06-28 | Add full translations and AI label scanner screen | 39 files |
| `b38f183` | 2026-06-28 | Fix shared AsyncStorage keys leaking data between user accounts | `CartContext.js`, `EventsContext.js` |
| `e4db33b` | 2026-06-28 | Add new screens, contexts, and mobile features | 22 files |
| `4b5f141` | 2026-06-27 | Real work from main computer | 15 files |
| `5d95fb6` | 2026-06-25 | Let EAS generate android folder | 27 files (native Android project scaffold) |
| `4cd7ba6` | 2026-06-25 | Regenerate android folder | 7 files |
| `8856126` | 2026-06-25 | Initial commit | 84 files — full initial Expo app scaffold |

Full per-file diffs for any commit: `git show --name-only <hash>`.

---

## 10. Existing README content (for reference — see also §7 of `CODE_MAP.md`/README updates)

Both repo READMEs were already re-verified as accurate on 2026-07-31 (see task list); their content is quoted here so it's available offline even if they change again later.

**`glutenia-backend/README.md`** — describes setup (`npm install`, `.env`, `npm run seed`, `npm run dev`), the Windows `run.ps1` runner, and explicitly points to `src/routes/` for the endpoint list instead of hand-duplicating it (fixed in commit `e74595f` after the hand-written list drifted stale).

**`glutenia-mobile/README.md`** — describes running the backend first, then the mobile app via `run.ps1`, Expo Go usage, the seed admin login (`admin@glutenia.tn` / `admin123`), and the APK build command.

---

## Known gaps in this file (things NOT measured today)

- `noUncheckedIndexedAccess` 42-error audit — see §7, taken on the migration report's word only.
- No performance/load testing numbers exist anywhere in this repo — don't cite any.
- No code coverage percentage — neither Jest nor `node --test` were run with a coverage flag today.
