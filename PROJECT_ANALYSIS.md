# Glutenia — Project Analysis

**Purpose of this document**: a comprehensive, evidence-based technical and functional analysis of the Glutenia repository, detailed enough to serve as the sole source for writing an internship/final-year report without needing to re-read the source code.

**Methodology note**: This analysis was produced by directly reading the backend source (models, controllers, routes, middleware, services, seed data), the mobile source (navigation, screens, contexts, API client), `package.json` files, `render.yaml`, `app.json`, and the full git commit history (`git log`, `git show --stat`) of the repository at `C:\Users\manel\OneDrive\Desktop\glutenia`, as it existed on **2026-07-13**. Anything not directly observable in code or config is explicitly marked **INFERRED**, with the reasoning stated. Where the codebase contains dead code, duplicated logic, or unresolved inconsistencies, this is reported honestly rather than smoothed over — an examiner will trust a report more if it acknowledges rough edges.

---

## 0. Executive Summary

**Glutenia** is a cross-platform (Android/iOS via Expo) mobile application, backed by a Node.js/Express REST API and MongoDB, that helps people with celiac disease or gluten intolerance (and their supporters/caregivers) live gluten-free. It combines:

- **AI-assisted ingredient-label scanning** (photograph a food label → an LLM vision model extracts text and flags gluten-containing ingredients).
- **Barcode scanning** against an in-house product catalog.
- **A gluten-free e-commerce storefront** (browse, cart, checkout, order history).
- **A map of gluten-free-friendly establishments** (supermarkets, restaurants, health stores, bakeries, pharmacies), combining demo data with real professional/seller-submitted businesses.
- **Community events** (meetups, classes, markets, workshops) with RSVP.
- **A gamification layer** (XP, levels, streaks, badges, achievements) — largely built on the backend but only partially wired into live features.
- **Three user roles**: customer, professional (seller/business owner, admin-approved), and admin.
- **Educational content**: static recipes and patient-resource articles/videos about celiac disease.
- **Full i18n** in French, English, and Arabic.

The project is a two-package monorepo: `glutenia-backend` (Express REST API) and `glutenia-mobile` (Expo/React Native app), deployed to **Render** (backend) with the mobile app built to a standalone **APK** via local Gradle builds.

---

## 1. Complete List of Implemented Features

### Core / cross-cutting
- Email + password authentication with JWT sessions (7-day expiry).
- Three-role system: customer, professional, admin, with role-based navigation trees.
- Professional account approval workflow (register → pending → admin approve/reject).
- Full i18n: French (default/fallback), English, Arabic — ~840 translation keys per locale.
- Light/dark theme toggle (global, persisted) — **partially applied** across screens (see §6.13, flagged as incomplete rollout).
- Session persistence and auto-login (AsyncStorage + server-side token re-validation on app start).
- Multi-step first-run onboarding carousel (marketing) + a separate 4-step post-registration profile questionnaire (personalization).

### Product discovery & scanning
- Barcode scanner (EAN-13/EAN-8/UPC-A/UPC-E/Code128) against the product catalog.
- AI ingredient-label scanner: photograph a label → Groq-hosted Llama 4 vision model returns a gluten-safety verdict (`safe`/`caution`/`unsafe`/`error`), flagged ingredients with reasons, safe-ingredient highlights, raw OCR'd text, and a confidence level. Multilingual (Arabic/French/English) prompt handling.
- Product catalog browsing with search (name/description) and category filters (Bread, Pasta, Snacks, Flour, Sweets, Other).
- Product detail view with gluten-free badge.

### E-commerce
- Shopping cart (fully client-side/local, per-user-scoped in AsyncStorage).
- Checkout with delivery address form; server recomputes prices/totals from the authoritative product records (never trusts client-submitted prices).
- Order history (customer), seller order view (professional, scoped to their own products/line-items only), all-orders view (admin).
- Order confirmation screen.

### Map / establishment discovery
- Interactive Leaflet map (rendered via an injected HTML/JS WebView, no native maps SDK/API key needed) showing gluten-free-friendly spots.
- Combines hardcoded demo establishments with real professional-submitted establishments (from the backend).
- Category filtering, distance calculation (haversine from a fixed reference point), bottom-sheet detail view with hours, facilities, tags, reviews (demo), call/directions deep links.

### Events
- Browse community events (Meetups, Classes, Markets, Workshops) with category filters.
- Event detail view with RSVP (join/leave), attendee count.
- Admin-only event creation/editing/deletion (emoji + color customization).

### Professional / seller features
- Professional registration with admin-approval gating (approval code shown to the applicant).
- Establishment ("my business") profile management: name, category, description, address, phone, hours, cover image, GPS location (map picker).
- Product management scoped to the professional's own listings (reusing admin product screens with role-based branching).
- Seller order view (their own products' line items only).
- Seller "dashboard" (product count, order count, computed revenue, low-stock hint).

### Gamification
- XP, levels (10 defined thresholds + extrapolated levels beyond), titles (role- and experience-based), streaks with "streak shield" protection, badges (7 categories), achievements with progress tracking.
- Badge collection screen with pin/unpin (max 3 pinned).
- **Note**: most of this engine is built but not triggered by real user actions yet — see §7 and the Backend Findings section.

### Admin features
- Dashboard with aggregate metrics (products, orders, revenue).
- Full product CRUD (any product, not just own).
- All-orders view (read-only).
- Event CRUD.
- Professional-request moderation queue (approve/reject).
- Admin-specific settings screen.

### Educational content (static/demo data, not backend-driven)
- Recipes catalog (8 hardcoded Tunisian/gluten-free recipes) with detail view (nutrition stats, ingredients, prep instructions).
- Patient resources: articles about celiac disease, hidden gluten sources, nutritional deficiencies, dining out safely — plus embedded YouTube videos.

### DevOps / tooling (see also the separate tooling analysis file `internship-report-tools-analysis.md` in this repo)
- Render Blueprint (`render.yaml`) deployment for the backend.
- Custom PowerShell orchestration script (`run.ps1`) performing environment checks, dependency install, syntax check, `npm audit`, integration tests, and a smoke test before allowing a server start.
- Node.js built-in test runner + Supertest integration tests against a real (non-mocked) MongoDB test database.
- Local Gradle-based Android APK build pipeline (`npm run build:apk`).

---

## 2. User Roles and Permissions

| Role | How obtained | Key permissions |
|---|---|---|
| **customer** | Default role on registration | Browse products/establishments/events/recipes/resources; scan (barcode + AI label); manage own cart; place orders; view own orders; RSVP to events; earn/view gamification progress; edit own account/settings. |
| **professional** | Registers with `role: "professional"` → account is `professionalStatus: "pending"` until an admin approves it. Cannot log in while pending or rejected. | Everything a customer can do, **plus**: manage one Establishment ("business") profile; create/edit/delete their **own** products; view orders containing their **own** products (line-items only, not the full buyer order); see a seller dashboard (revenue/stock). **Cannot** create events (admin-only) and skips the post-registration profile-personalization questionnaire entirely. |
| **admin** | Set directly in the database (e.g., via the seed script; no in-app path to become admin) | Full product CRUD (any product); full event CRUD; view all orders and all users; view any user's order history; moderate professional-account requests (approve/reject); (implicitly) do anything a professional can do on routes that use `requireRole("admin","professional")`, including managing arbitrary products (admins bypass the "own product only" ownership check). |

**Permission enforcement mechanism (backend)**: three middleware functions gate access —
- `verifyToken` — requires and decodes a valid JWT, populating `req.user` (`{id, name, email, role}`).
- `requireRole(...roles)` — generic allow-list check against `req.user.role`.
- `isAdmin` — shorthand requiring `req.user.role === "admin"`.

Additional **ownership-based** authorization exists inline in controllers (not middleware): `canManageProduct` (product.controller.js) allows an admin to manage any product but restricts a professional to products where `product.createdBy === req.user.id`. A parallel ownership check protects order retrieval by ID (`getOrderById`): admin or the order's own buyer only.

**Client-side role routing (mobile)**: `RootNavigator.js` mounts an entirely different navigator tree depending on role — `AdminStack` for admins, `UserStack` for customers/professionals (with professional-only screens conditionally surfaced inside shared screens like `AccountScreen`), rather than swapping tabs within one shared navigator.

**INFERRED**: There is no in-app UI or API endpoint for promoting a user to admin — this is presumably done directly in the database or via the seed script, i.e., an out-of-band operational task.

---

## 3. Database Models & Relationships

Backend: **MongoDB + Mongoose 8.9.5**. All models below live in `glutenia-backend/src/models/`.

### User
| Field | Type | Notes |
|---|---|---|
| name | String | required |
| email | String | required, unique, lowercase |
| password | String | required, `select:false` (bcrypt hash, cost 12) |
| role | enum `customer`, `admin`, `professional` | default `customer` |
| professionalStatus | enum `pending`, `approved`, `rejected` | default `null`; only meaningful when `role==="professional"` |
| approvalCode | String | default `null`; random 6-digit code generated at professional registration (informational only — no endpoint validates it) |
| role_type | enum `warrior`, `supporter` | default `null`; set during the post-registration onboarding questionnaire. "warrior" = person managing their own celiac/intolerance; "supporter" = caregiver/ally (**INFERRED** from title-mapping naming) |
| gluten_free_since | Date | default `null` |
| experience_level | enum `just_started`, `1_to_6_months`, `6_to_12_months`, `1_to_3_years`, `3_plus_years` | default `null` |
| primary_goal | enum `manage_celiac`, `manage_intolerance`, `support_child`, `support_partner`, `dietary_choice`, `exploring` | default `null` |
| eating_out_frequency | enum `rarely`, `few_times_month`, `weekly`, `multiple_week` | default `null` |
| confidence_identifying_gf | enum `low`, `medium`, `high` | default `null` |
| createdAt | Date | default now |

`toJSON` transform strips `password` from all serialized output (defense in depth alongside `select:false`).

**Relationships**: User is referenced by `Establishment.owner` (1:1, unique), `Product.createdBy` (1:many), `Order.user` (1:many), `Event.createdBy`/`attendees` (1:many / many:many), `Cart.user` (1:1, unique), `UserGamification.userId` (1:1), `UserAchievement.userId`/`UserBadge.userId`/`XpLedger.userId` (1:many each).

### Establishment
| Field | Type | Notes |
|---|---|---|
| owner | ObjectId ref User | required, **unique** — one establishment per user |
| name | String | required |
| category | enum `Supermarket`, `Restaurant`, `Health Store`, `Bakery`, `Pharmacy`, `Other` | default `Other` |
| description, address, phone, hours | String | trimmed |
| coverImageUrl | String | base64 data-URI, stored inline (no external image storage) |
| coordinates.latitude / .longitude | Number | default `null` |
| verified | Boolean | default `false` — **schema field exists but no code path anywhere sets it to `true`** (no admin "verify" endpoint implemented) |
| createdAt | Date | default now |

### Event
| Field | Type | Notes |
|---|---|---|
| title, location | String | required |
| description | String | |
| date | **String** | required — free-form/display text, not a native Date type (**INFERRED**: client sends a pre-formatted string rather than an ISO date) |
| category | enum `Meetups`, `Classes`, `Markets`, `Workshops` | required |
| price | Number | default 0 |
| emoji | String | default `🎉` |
| color | String | default `#E8F5E9` |
| attendees | [ObjectId ref User] | RSVP list |
| createdBy | ObjectId ref User | |
| createdAt | Date | default now |

### Product
| Field | Type | Notes |
|---|---|---|
| name | String | required |
| description | String | |
| price | Number | required, min 0 |
| category | enum `Bread`, `Pasta`, `Snacks`, `Flour`, `Sweets`, `Other` | default `Other` |
| imageUrl | String | base64 data-URI, stored inline |
| stock | Number | default 0, min 0 |
| isGlutenFree | Boolean | default `true` |
| createdBy | ObjectId ref User | seller/admin who created it |
| barcode | String | default `null`; **unique + sparse index** (uniqueness enforced only among non-null values) |
| createdAt | Date | default now |

### Cart
- `user`: ObjectId ref User, required, **unique** (one cart per user).
- `items`: array of subdocuments `{ product: ref Product, name, qty (min 1), price (min 0), imageUrl }`.
- `updatedAt`: Date, auto-updated via a `pre("save")` hook.
- **No dedicated Cart controller/routes exist** — the only server-side touch is clearing it (`items:[]`) after a successful checkout. Cart state is effectively managed entirely client-side (AsyncStorage) and this model is a vestigial/partial server mirror (**INFERRED**).

### Order
- `items`: array of `{ product: ref Product, name, qty (min 1), price (min 0) }` (required, custom validator enforcing at least 1 item).
- `address`: subdocument `{ fullName, addressLine, city, phone }`, all required.
- `user`: ref User, required.
- `total`: Number, required, min 0 — computed server-side, never trusted from the client.
- `status`: enum `pending`, `confirmed`, `delivered` — default **`confirmed`** (orders are auto-confirmed immediately; there is no payment gateway and **no endpoint to transition status** to `pending` or `delivered` — these enum values are currently unused/future-facing, **INFERRED**).
- `createdAt`: Date, default now.

### Gamification models
- **Achievement**: `slug` (unique), `name`, `description`, `targetMetric`, `targetValue`, `xpReward` (default 0), `badgeRewardId` (optional ref Badge).
- **Badge**: `slug` (unique), `name`, `description`, `iconUrl`, `category` (enum `journey`, `scanner`, `community`, `safety`, `discovery`, `supporter`, `secret`), `track` (enum `warrior`, `supporter`, `both`), `isSecret` (Boolean, default false).
- **UserAchievement**: `userId`, `achievementId`, `currentProgress` (default 0), `completedAt` (default null). Compound unique index on `{userId, achievementId}`.
- **UserBadge**: `userId`, `badgeId`, `earnedAt` (default now), `isPinned` (default false). Compound unique index on `{userId, badgeId}`.
- **UserGamification**: `userId` (unique), `totalXp`, `currentLevel` (default 1), `currentTitle` (default `"Newcomer"`), `currentStreak`, `longestStreak`, `streakShields` (default 0, max 2), `lastActivityDate`, plus six activity counters: `scanCount`, `ingredientCheckCount`, `communityPostCount`, `restaurantCheckinCount`, `eventAttendanceCount`, `helpfulVotesReceived`.
- **XpLedger**: append-only audit trail — `userId`, `amount`, `sourceType` (e.g. `"onboarding_complete"`, `"achievement_complete"`), `sourceId`.

### Entity-relationship summary (textual)
```
User 1───1 Establishment (owner)
User 1───N Product (createdBy)
User 1───N Order (user)
User 1───1 Cart (user)
User 1───N Event (createdBy)      User N───N Event (attendees)
User 1───1 UserGamification
User 1───N XpLedger
User 1───N UserAchievement N───1 Achievement N───1 Badge (badgeRewardId, optional)
User 1───N UserBadge N───1 Badge
Order N───N Product (via order.items[].product, denormalized name/price snapshot)
Cart  N───N Product (via cart.items[].product, denormalized name/price/imageUrl)
```

---

## 4. Application Architecture

### High-level structure
Monorepo with two independently deployable applications:
- `glutenia-backend/` — Node.js 20 + Express 4 REST API, MongoDB via Mongoose, layered as `routes → middleware → controllers → models`, plus a standalone `services/gamificationService.js` business-logic layer and a `seed/seed.js` database-seeding script.
- `glutenia-mobile/` — Expo (SDK 53) + React Native 0.79 app using the classic (non-new-architecture) engine (`newArchEnabled: false`, `jsEngine: "jsc"`), structured as `screens → navigation → context → api client`.

### Backend request lifecycle
```
Express app (app.js)
  → CORS (open "*" outside production; env-restricted allow-list in production)
  → express.json({ limit: "8mb" })   (large limit to accommodate base64 image/scan payloads)
  → mounted routers (/api/auth, /api/products, /api/orders, /api/users,
     /api/onboarding, /api/gamification, /api/scan, /api/events,
     /api/establishments, /api/professionals)
  → per-route middleware chain: [verifyToken] → [requireRole/isAdmin] → [express-validator chain] → [validateRequest] → controller
  → controller responds { success: true, data } or throws
  → 404 handler for unmatched paths
  → global errorHandler (maps Mongoose/Multer/JWT errors to appropriate HTTP codes)
```
Every controller response follows one consistent envelope: `{ success: true, data: ... }` or `{ success: false, message: "..." }` — no deviation anywhere in the codebase.

### Mobile app architecture
```
App.js
  → AuthProvider (session/token, role, onboarding flags)
    → ThemeProvider (light/dark palette, persisted)
      → CartProvider (per-user local cart)
        → EventsProvider (per-user local "my RSVPs" cache — see caveat in §6.9)
          → NavigationContainer
            → RootNavigator (role/onboarding-based stack selection)
              → screens (organized into auth/, onboarding/, user/, admin/)
```
State management is entirely React Context + hooks (no Redux/MobX/Zustand). Persistence is `@react-native-async-storage/async-storage`, namespaced per user id for cart/events data to avoid cross-account data leakage (this was in fact a bug that was fixed mid-project — see §15 sprint chronology, commit `39c1b1c`).

### Images
Both backend and mobile use a **base64 data-URI-in-MongoDB-document** strategy for images (products, establishment covers) — there is no S3/Cloudinary/CDN integration. Images are capped at 5MB (multer) / 5.5MB (client-side pre-check) and the overall JSON body limit is 8MB to accommodate this plus AI scan payloads. This is a pragmatic but non-scalable choice worth calling out explicitly as a known limitation (**INFERRED design tradeoff**, likely chosen for simplicity/speed given project scope and no budget for object storage).

### Maps
No native map SDK (e.g., react-native-maps/Google Maps API key) is used. Instead, a Leaflet.js map is rendered inside a `react-native-webview` `WebView` via an injected HTML/JS string, communicating with the React Native side via `postMessage`/`injectJavaScript`. This avoids needing Google Maps API keys/billing but means map rendering performance and interactivity depend on the WebView's JS engine.

### Deployment topology
- Backend → **Render** (Blueprint via `render.yaml`), Node web service, free plan, health check on `/`.
- Database → MongoDB Atlas (connection string via `MONGO_URI` env var — **but see §8 security note**: a real-looking Atlas connection string is hardcoded as a fallback in `config/db.js` if the env var is unset).
- Mobile → distributed as a directly-installed **APK** (`Glutenia.apk`), built locally via `expo prebuild` + Gradle (`gradlew assembleRelease`), not via EAS cloud build despite `eas.json` being present and configured.

---

## 5. REST API Endpoints

Base path convention: all routes are mounted under `/api/...` in `src/app.js`. Two routes are defined directly in `app.js` rather than a router file (see the note on `/api/admin/run-seed` in §8 — a security-relevant finding).

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | none | Register; if `role="professional"`, account created `pending`, returns `{pending:true, approvalCode}`, **no token issued**. Otherwise issues JWT immediately. |
| POST | `/login` | none | Validates credentials; blocks login (403) for professional accounts not yet `approved`. |
| GET | `/me` | token | Returns the current authenticated user (password stripped). |

### Products — `/api/products`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | none | List, optional `category`/`search` (regex over name+description) filters. |
| GET | `/barcode/:code` | none | Exact-match barcode lookup. |
| GET | `/mine` | professional/admin | Caller's own products. |
| GET | `/:id` | none | Single product. |
| POST | `/` | professional/admin | Create (creator = caller). |
| PUT | `/:id` | professional/admin (own or admin) | Update. |
| PUT | `/:id/image` | professional/admin (own or admin) | Upload cover image (multer, 5MB, stored as base64). |
| DELETE | `/:id` | professional/admin (own or admin) | Delete. |

### Orders — `/api/orders`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | token | Create order; server re-derives item name/price from DB, computes total, sets `status:"confirmed"`, clears the user's Cart record. |
| GET | `/my` | token | Caller's own orders. |
| GET | `/seller` | professional/admin | Orders containing the caller's own products, **filtered to only that seller's line items** per order. |
| GET | `/` | admin | All orders. |
| GET | `/:id` | token (owner or admin) | Single order. |

### Users — `/api/users` (all admin-only)
| Method | Path | Description |
|---|---|---|
| GET | `/` | All users. |
| GET | `/:id/orders` | A specific user's orders. |

### Onboarding — `/api/onboarding` (both require token)
| Method | Path | Description |
|---|---|---|
| POST | `/` | Legacy/alternate snake_case onboarding submission; no XP granted. |
| PUT | `/profile` | camelCase onboarding submission (used by the current mobile app); computes title via a role×experience lookup table, **awards 50 XP**, creates/updates `UserGamification`. |

### Gamification — `/api/gamification` (all require token)
| Method | Path | Description |
|---|---|---|
| GET | `/profile` | Aggregate profile view: gamification stats + earned/pinned badges + top 3 in-progress achievements. |
| GET | `/badges` | Public (any logged-in user) badge catalog, excluding secret badges. |
| GET | `/achievements` | Achievement catalog. |
| PUT | `/badges/:badgeId/pin` | Explicit pin/unpin with a **hard cap of 3 pinned badges** enforced server-side. |
| GET | `/me` | Caller's raw `UserGamification` record. |
| GET | `/me/badges` | Caller's earned badges (populated), pinned-first. |
| PATCH | `/me/badges/:badgeId/pin` | A second, older pin-toggle endpoint **without** the 3-badge cap (duplicate/legacy — see §8). |
| GET | `/me/achievements` | Caller's achievement progress. |

### Scan — `/api/scan`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/label` | token | AI ingredient-label analysis (see §7). |

### Events — `/api/events`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | optional | Public list with per-user `isGoing`/`attendeeCount` if authenticated. |
| GET | `/:id` | optional | Single event. |
| POST | `/` | admin | Create. |
| PUT | `/:id` | admin | Update. |
| DELETE | `/:id` | admin | Delete. |
| POST | `/:id/rsvp` | token | Toggle the caller's own attendance. |

### Establishments — `/api/establishments`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | none | Public list, optional category filter. |
| GET | `/mine` | professional/admin | Caller's own establishment. |
| PUT | `/mine` | professional/admin | Upsert (create-or-update) caller's establishment. |
| PUT | `/mine/image` | professional/admin | Upload cover image. |
| GET | `/:id` | none | Public single establishment. |

### Professionals — `/api/professionals` (all admin-only)
| Method | Path | Description |
|---|---|---|
| GET | `/requests?status=pending\|approved\|rejected\|all` | List professional accounts by status (default `pending`). |
| POST | `/requests/:id/approve` | Approve a professional account. |
| POST | `/requests/:id/reject` | Reject a professional account. |

### Miscellaneous (`app.js`, not in router files)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | none | Health check: `{success:true, data:{name:"Glutenia API", status:"running"}}`. |
| POST | `/api/admin/run-seed` | shared-secret header (`x-seed-token`, hardcoded value) | Wipes and reseeds Users/Products/Badges/Achievements. **Not gated by JWT/role — see security note in §8.** |

---

## 6. Screens and Navigation

**Library**: React Navigation v6 (`@react-navigation/native`, `native-stack`, `bottom-tabs`). File: `glutenia-mobile/src/navigation/RootNavigator.js`.

### 6.1 Root selection logic
On launch, `SplashScreen` shows for a fixed 2.5s. Then, based on `AuthContext` state, one of five completely separate navigator trees is mounted (no single shared tab bar swapping roles — the whole stack changes):

1. First-run and onboarding carousel not yet seen → **OnboardingStack**
2. Not logged in → **AuthStack**
3. Logged in, `role === "admin"` → **AdminStack**
4. Logged in, non-professional, profile questionnaire not completed → **ProfileOnboardingStack**
5. Otherwise (customer or professional, questionnaire done) → **UserStack**

### 6.2 Navigator trees (exact screen inventory)

**OnboardingStack**: `Onboarding` (3-slide marketing carousel + language selector).

**AuthStack**: `Login`, `Register`, `ProfessionalPending`.

**ProfileOnboardingStack** (4-step wizard, 25/50/75/100% progress): `OnboardingRole` → `OnboardingJourney` → `OnboardingGoal` → `OnboardingConfidence`.

**UserStack** (wraps `UserTabs` bottom-tab navigator + pushed screens):
- Tabs: `Home`, `Events`, `Scan` (raised/highlighted center button), `Map`, `Profile` (=`AccountScreen`).
- Pushed: `CartPage`, `ProductDetail`, `Checkout`, `OrderSuccess`, `Orders`, `EventDetail`, `BadgeCollection`, `MapDetail`, `ShopScreen`, `PatientResources`, `VideoPlayer`, `ResourceDetail`, `Recipes`, `RecipeDetail`, `Settings`, `LabelScan`, `SellerProducts` (reuses `AdminProductsScreen`), `SellerProductForm` (reuses `AdminProductFormScreen`), `SellerVisibility`, `SellerOrders`, `SellerEstablishment`, `SellerEstablishmentForm`.

**AdminStack** (wraps `AdminTabs` + pushed screens):
- Tabs: `Dashboard`, `Products`, `Scan` (shared component), `Orders`, `Account` (shared `AccountScreen`).
- Pushed: `AdminProductForm`, `AdminEvents`, `AdminProfessionalRequests`, `CreateEvent`, `Settings` (=`AdminSettingsScreen`).

A single custom component, `CustomTabBar.js`, renders both `UserTabs` and `AdminTabs` (not React Navigation's built-in tab bar), with the `Scan` route always rendered as a raised circular floating-action-style button.

### 6.3 Full screen inventory and purpose

| Screen | Role(s) | Purpose |
|---|---|---|
| `SplashScreen` | all | Fixed-duration logo screen shown before auth state resolves. |
| `OnboardingScreen` | all (first run) | 3-slide marketing carousel (Scan/Discover/Community) + language picker. |
| `LoginScreen` | all | Email/password login; special-case handling for pending/rejected professional accounts. |
| `RegisterScreen` | all | Registration with role choice (customer/professional). |
| `ProfessionalPendingScreen` | professional (pending) | Shows approval code, awaiting admin action. |
| `OnboardingRoleScreen` → `OnboardingConfidenceScreen` | customer, professional-excluded | 4-step profile personalization wizard (see §6.5). |
| `HomeScreen` | all | Dashboard: scan CTA, product preview, quick-access grid, event preview (static local data). |
| `ShopScreen` | all | Full product catalog, search + category filters. |
| `ProductDetailScreen` | all | Single product view, add to cart. |
| `CartScreen` | all | Local cart management. |
| `CheckoutScreen` | all | Delivery form + order submission. |
| `OrderSuccessScreen` | all | Order confirmation. |
| `UserOrdersScreen` | all | Own order history. |
| `ScanScreen` | all | Barcode scanner → product lookup. |
| `LabelScanScreen` | all | AI ingredient-label scanner. |
| `MapScreen` | all | Interactive establishment map. |
| `MapDetailScreen` | all | Alternate/legacy static spot-detail view (registered route, not reachable from `MapScreen`'s own flow). |
| `EventsScreen` / `EventDetailScreen` | all | Browse/RSVP events. |
| `CreateEventScreen` | admin (only route wired to it) | Create/edit event — lives under `user/` folder but is admin-only in practice. |
| `BadgeCollectionScreen` | all | Full badge grid, pin/unpin. |
| `RecipesScreen` / `RecipeDetailScreen` | all | Static recipe content. |
| `PatientResourcesScreen` / `ResourceDetailScreen` / `VideoPlayerScreen` | all | Static educational content + embedded YouTube videos. |
| `SettingsScreen` | customer/professional | Account stubs, notifications (local only), theme toggle, language, logout. |
| `SellerEstablishmentScreen` / `...FormScreen` | professional | Manage own business profile. |
| `SellerVisibilityScreen` | professional | Seller dashboard (products/orders/revenue/low-stock). |
| `SellerOrdersScreen` | professional | Own-product order list. |
| `AccountScreen` | all (shared) | Profile + gamification hub; surfaces professional-only "Activity" section conditionally. |
| `AdminDashboardScreen` | admin | Aggregate metrics + action grid. |
| `AdminProductsScreen` / `AdminProductFormScreen` | admin (and reused by professional) | Product CRUD, branching behavior on `user.role === "admin"`. |
| `AdminOrdersScreen` | admin | All orders, read-only. |
| `AdminEventsScreen` | admin | Event CRUD list. |
| `AdminProfessionalRequestsScreen` | admin | Approve/reject professional accounts. |
| `AdminSettingsScreen` | admin | Slimmer settings variant (no account/notifications sections). |

### 6.4 Authentication flow (client side)
`AuthContext.js` holds `user`, `token`, `loading`, `hasSeenOnboarding` (in-memory only — **resets every cold start**, so the marketing carousel reappears each fresh launch, **INFERRED** as unintentional since a persisted flag exists for the *other* onboarding flow), and `profileOnboardingDone`.

On mount: reads `glutenia.session` (token+user) and `onboarding_complete` from AsyncStorage; if a session exists, re-validates the token against `GET /api/auth/me` (picks up server-side role/status changes since the token was issued); wipes the session on any failure. `profileOnboardingDone` is considered true if either the local flag was set, **or** the freshly-fetched user already has `role_type` populated (covers completing onboarding on a different device/session).

### 6.5 Onboarding flow(s) — two distinct flows
1. **First-run marketing carousel** (`OnboardingScreen`) — not persisted, shown every cold start, purely informational.
2. **Post-registration profile questionnaire** (4 screens, `ProfileOnboardingStack`) — collects `roleType` (warrior/supporter) → `experienceLevel` (+ computed `glutenFreeSince` date) → `primaryGoal` → `confidenceIdentifyingGf`, then submits everything in one `PUT /api/onboarding/profile` call. Skipped entirely for professionals.

### 6.6 AI/scan feature (client side)
Two separate features: `ScanScreen` (camera barcode reader via `expo-camera`, looks up `GET /products/barcode/:code`, falls back to `LabelScan` on a 404) and `LabelScanScreen` (photographs a label via `expo-image-picker`, client-side compresses to ~800px width/0.7 quality JPEG via `expo-image-manipulator`, POSTs base64 to `/scan/label`, renders the verdict/flagged-ingredients/highlights/raw-text/confidence/disclaimer UI).

### 6.7 E-commerce flow (client side)
Browse (`HomeScreen`/`ShopScreen`) → `ProductDetailScreen`/scan-found-product → `CartContext` (local, per-user AsyncStorage key `glutenia.cart.${userId}`) → `CartScreen` → `CheckoutScreen` (→ `POST /orders`) → `OrderSuccessScreen` → `UserOrdersScreen`.

### 6.8 Professional/seller features (client side)
Registration role choice → pending screen with approval code → (after admin approval) login → `AccountScreen`'s "Activity" section surfaces `SellerEstablishmentScreen`, `SellerEstablishmentFormScreen` (business profile + map location picker), `SellerProducts`/`SellerProductForm` (reused admin screens, role-branched to caller's own products), `SellerVisibilityScreen` (dashboard), `SellerOrdersScreen`.

### 6.9 Events feature (client side) — caveat
`EventsScreen`/`EventDetailScreen` drive the real RSVP flow directly against the backend (`POST /events/:id/rsvp`). A separate `EventsContext` (persisted per-user "my RSVPs" cache) exists and is read by `AccountScreen`'s "Events Attending" section, **but nothing in the reviewed code calls its `joinEvent`/`leaveEvent` functions** — it appears to be an orphaned/parallel mechanism from an earlier design (**INFERRED**), meaning the "Events Attending" list on the account screen may not reflect actual RSVPs.

### 6.10 Gamification (client side)
`AccountScreen` (XP/level/streak summary, hardcoded client-side level-threshold table mirroring the backend's) and `BadgeCollectionScreen` (full badge grid by category, pin/unpin with optimistic UI + rollback).

### 6.11 Maps feature
`MapScreen`: Leaflet map (WebView-embedded HTML/JS, CartoDB tiles, no native SDK), 10 hardcoded demo spots + real establishments from `GET /establishments`, haversine distance from a fixed reference coordinate, category filter pills, custom SVG category-colored markers, bottom info card + `@gorhom/bottom-sheet` detail sheet (hours/facilities/reviews/tags/call/directions). The "Locate Me" button recenters on a fixed demo spot rather than using real device GPS (**INFERRED placeholder behavior**).

### 6.12 Recipes & Patient Resources
Entirely static/hardcoded content modules (8 recipes, 4 articles + 1 featured article, 2 embedded YouTube videos) — i18n-translated but not backend-driven.

### 6.13 Theming & i18n
`ThemeContext` provides a persisted global light/dark toggle sharing one green primary color across both palettes. **However**, most screens import a separate, non-reactive static `Colors` object from `src/theme/colors.js` (light-only) rather than consuming `useTheme()` — meaning dark mode is only fully honored in the Settings screens and a handful of others, not app-wide (**incomplete rollout, INFERRED from code inspection**, despite the commit message "app-wide theming").

i18n via `i18next`/`react-i18next`, three languages (fr default/fallback, en, ar), device-locale auto-detection with persisted override. **Arabic is a fully translated locale but the app has no RTL layout support** (no `I18nManager` usage found anywhere) — text renders right-to-left at the font level, but UI layout (nav bars, icon ordering, flex direction) does not mirror (**INFERRED gap**).

### 6.14 API client
`src/api/client.js` resolves its base URL in priority order: build-time env var → `app.json`'s `extra.apiBaseUrl` (`http://10.0.2.2:5000/api`, Android-emulator loopback) → auto-detected Expo dev-server LAN host → platform fallback. Every authenticated call passes `token` explicitly per-function call (no global interceptor). Errors are normalized into `Error` objects carrying `.status` and `.data` so screens can branch on specific server error payloads (e.g., professional pending/rejected status).

---

## 7. AI Features

### Current implementation (as of the latest commit)
- **Endpoint**: `POST /api/scan/label` (auth required, any role).
- **Provider**: **Groq**, model **`meta-llama/llama-4-scout-17b-16e-instruct`** (a vision-capable Llama 4 model), `temperature: 0.1`, `max_tokens: 1024`.
- **Input**: `{ imageBase64, mimeType }` (a photographed ingredient label, client-compressed to ~800px/0.7 quality JPEG before upload).
- **Prompt design**: instructs the model to act as "a celiac disease specialist," handle labels in Arabic/French/English/mixed text, extract all label text, and identify gluten-containing/possibly-containing ingredients against an explicit multilingual keyword list (wheat/blé/قمح, barley/orge/شعير, rye/seigle/جاودار, spelt, kamut, malt, malt extract, semolina, durum, farro, triticale, seitan, hydrolyzed wheat protein, explicit "gluten" mentions, "may contain wheat"/"peut contenir du blé", "traces de gluten", facility cross-contact disclaimers), with ambiguous "modified starch"/"amidon modifié" flagged **only if the source is unspecified** (not explicitly corn/potato).
- **Output contract** (strict JSON, no markdown fences): `{ verdict: "safe"|"caution"|"unsafe"|"error", flagged: [{ingredient, reason}], safe_highlights: [...], raw_text, confidence: "high"|"medium"|"low", confidence_note, error }`.
- **Verdict rules** (delegated to the LLM via the prompt, not enforced in application code): `unsafe` = confirmed gluten source present; `caution` = only a trace/"may contain" warning or unresolved ambiguous starch; `safe` = no gluten sources detected; `error` = image unreadable/not a label/no text.
- **Server-side hardening**: strips markdown code fences from the raw completion if present, `JSON.parse`s defensively (422 on failure), validates the `verdict` is one of the four allowed values (422 on failure), and coerces/defaults every output field to a safe shape before responding (`flagged`/`safe_highlights` forced to arrays, `confidence` defaulted to `"low"`, etc.) — the code does not blindly trust the model's structured output.
- **Not wired into gamification**: a successful scan does **not** increment `UserGamification.scanCount` or trigger any XP/badge award, despite scan-count-based badges (`first_scan`, `ten_scans`, `fifty_scans`, `hundred_scans`) existing in the seed data and the gamification service's threshold logic (**dead integration point**, see §11).

### AI provider history (from git log — see §15 for the full chronology)
The AI feature went through substantial iteration before settling on its current form:
1. First implemented against **Google Gemini** (`gemini-1.5-flash`), commit `5811579`.
2. A full day (2026-06-29) of rapid provider/version churn chasing free-tier API quota and endpoint-compatibility issues: `gemini-2.0-flash-lite` → `gemini-1.5-flash` (revert) → `@google/genai` SDK → forcing v1 endpoint → `gemini-2.0-flash` → back to `gemini-1.5-flash` → `gemini-2.0-flash-lite` again, interleaved with unrelated bug fixes (lazy client init to stop server crashes, corrected middleware import).
3. Finally switched to **Groq (Llama 4 vision)**, commit `9e6a436`, which is the AI provider used in the current codebase.
4. Leftover artifacts: `@google/genai` and `@google/generative-ai` remain as **unused dependencies** in `glutenia-backend/package.json` despite the code no longer calling them (**INFERRED**: cleanup oversight after the provider switch — worth noting in a "lessons learned"/technical debt section of a report).

This history is a strong, genuine "engineering decision-making under real-world constraints" narrative for a report — the free-tier Gemini quota/API-version instability was a real blocker that motivated the switch to Groq.

---

## 8. Business Rules (consolidated reference table)

| Rule / constant | Value | Source |
|---|---|---|
| Password hashing | bcrypt, cost factor 12 | `auth.controller.js`, `seed.js` |
| JWT expiry | `7d` (env-overridable via `JWT_EXPIRES_IN`) | `config/auth.js` |
| JWT payload | `{ id, name, email, role }` — does **not** include `professionalStatus`, so a token issued before an admin later rejects a professional remains valid until it naturally expires (no revocation list) | `auth.controller.js` |
| Professional approval code | random 6-digit numeric string, informational only (not validated against anything server-side) | `auth.controller.js` |
| Max pinned badges | 3 (enforced on `PUT /gamification/badges/:badgeId/pin`, **not** enforced on the older `PATCH /gamification/me/badges/:badgeId/pin` — inconsistency) | `gamification.controller.js` |
| Max streak shields | 2 | `UserGamification` schema |
| Onboarding-completion XP | flat 50 XP, one-time (`PUT /onboarding/profile` only; the older `POST /onboarding/` grants none) | `onboarding.controller.js` |
| XP level thresholds | Levels 1–10: `{0,150,350,600,800,1200,1800,2200,2700,3500}`; beyond level 10, +1 level per +800 XP indefinitely | `gamificationService.js` (mirrored client-side in `AccountScreen.js`) |
| Badge unlock thresholds (defined, **not currently triggered** by any feature) | scanCount 1/10/50/100; ingredientCheckCount 50; communityPostCount 1; helpfulVotesReceived 10/50; restaurantCheckinCount 1/5; eventAttendanceCount 1/5 | `gamificationService.js` |
| Image upload limits | 5MB per file (multer); 5.5MB client-side pre-check; 8MB overall JSON body limit (to fit base64 images + AI scan payloads) | `product.routes.js`, `establishment.routes.js`, mobile form screens, `app.js` |
| Product barcode | unique when present, many nulls allowed (sparse index) | `Product` model |
| Order minimum items | ≥ 1 (enforced both by express-validator and a Mongoose custom validator) | `Order` model, `order.routes.js` |
| Order status | Always created `"confirmed"` immediately — no payment gate, no status-transition endpoint exists yet for `"pending"`/`"delivered"` | `Order` model & controller |
| Establishment / Cart uniqueness | One per user (unique index on `owner`/`user` respectively) | `Establishment`, `Cart` models |
| CORS | Open (`origin:"*"`) outside production; restricted to a `CORS_ORIGIN` env allow-list in production | `app.js` |
| Currency / country context | Seed admin email `admin@glutenia.tn`, demo map data centered on Tunis (36.82, 10.2) | `seed.js`, `MapScreen.js` — **INFERRED**: primary target market is Tunisia |

### Security-relevant findings worth reporting honestly
- A **hardcoded MongoDB Atlas connection string with real-looking credentials** exists as a fallback default in `config/db.js` if `MONGO_URI` is unset.
- A **hardcoded JWT signing-secret fallback** (`"glutenia-render-fallback-jwt-secret-change-after-deploy-2026"`) exists in `config/auth.js` if `JWT_SECRET` is unset.
- `POST /api/admin/run-seed` is a **destructive, production-capable database-reset endpoint** gated only by a hardcoded shared-secret header (`x-seed-token: glutenia-seed-2026`) rather than real JWT/admin authentication — added, per its commit message, as a one-time convenience for seeding the deployed Render database, but left live in the code.
- These are the kind of things a report should flag under a "Limitations" or "Technical Debt" section rather than omit — they demonstrate awareness of security practice even where the implementation took shortcuts under time pressure.

---

## 9. Authentication Flow (End-to-End)

1. **Registration** (`POST /api/auth/register`): checks email uniqueness → hashes password (bcrypt/12) → if `role==="professional"`, creates the user with `professionalStatus:"pending"` and a random `approvalCode`, returns `{pending:true, approvalCode}` with **no JWT** → otherwise creates a `customer` and immediately issues a JWT (`{id,name,email,role}`, 7-day expiry).
2. **Professional review**: an admin calls `GET /api/professionals/requests` (default filter `pending`), then `POST /requests/:id/approve` or `/reject`.
3. **Login** (`POST /api/auth/login`): looks up the user (re-including the normally-hidden password field), compares bcrypt hash, returns a generic "Invalid email or password" for both wrong-email and wrong-password cases (avoids user enumeration). If the user is a `professional` whose status isn't `approved`, returns 403 with the current `professionalStatus` and `approvalCode` rather than a token. Otherwise issues a JWT and the safe (password-stripped) user object.
4. **Client-side session bootstrap**: on app start, `AuthContext` reads a persisted `{token, user}` blob from AsyncStorage, re-validates it against `GET /api/auth/me` (catching expired/invalid tokens and wiping the session), and derives `profileOnboardingDone` from either a local flag or the presence of `user.role_type`.
5. **Every protected request**: client attaches `Authorization: Bearer <token>` (explicitly, per API call — no global interceptor); `verifyToken` middleware decodes and validates the JWT server-side, populating `req.user`; downstream `requireRole`/`isAdmin`/ownership checks gate the specific action.
6. **Logout**: clears in-memory state and removes both the session and onboarding-completion flags from AsyncStorage.

---

## 10. Product Workflow

1. A professional (approved) or admin creates a product (`POST /api/products`) — whitelisted fields only, `createdBy` set to the caller.
2. Products go **live immediately** — there is no moderation/approval queue for product listings (unlike the account-level professional approval flow).
3. Image upload is a separate call (`PUT /:id/image`, multer, 5MB cap) storing a base64 data URI directly in `imageUrl`.
4. Ownership is enforced on update/delete/image-upload: an admin can manage any product; a professional only their own (`canManageProduct` helper).
5. Customers discover products via public listing (`GET /api/products`, with `category`/`search` filters), single-product detail (`GET /:id`), or barcode lookup (`GET /barcode/:code`, used by the mobile barcode scanner).
6. There is no dedicated cart API — the mobile app manages cart state entirely client-side and only talks to the server at checkout.

---

## 11. Order Workflow

1. Customer builds a cart client-side (`CartContext`, AsyncStorage, per-user key).
2. At checkout, the client submits `{items:[{productId, qty}], address:{fullName, addressLine, city, phone}}` to `POST /api/orders`.
3. The server **re-derives** each item's authoritative `name`/`price` from its own Product records (never trusting client-submitted price data), computes the order `total`, creates the Order with `status:"confirmed"` (instant — no payment gateway integration, no pending/awaiting-payment state currently used), and clears the user's server-side Cart record.
4. The customer sees `OrderSuccessScreen`, then can view history via `GET /api/orders/my`.
5. A professional views orders containing their own products via `GET /api/orders/seller` — the backend **filters the returned items array down to only that seller's own line items** even within a mixed multi-seller cart order, so sellers never see another seller's revenue/items in the same order.
6. Admins can view all orders (`GET /api/orders`) or a specific user's orders (`GET /api/users/:id/orders`).
7. **Gap**: the `Order.status` enum (`pending`/`confirmed`/`delivered`) has no endpoint to transition it — there is currently no way for a seller or admin to mark an order "delivered" (**INFERRED**: planned but not yet built).

---

## 12. Event Management

- **Creation/editing/deletion is admin-only** (`isAdmin` middleware) — despite the app having a rich professional/seller concept elsewhere, professionals **cannot** create their own events in the current implementation.
- **Browsing is public** (optional-auth middleware personalizes `isGoing`/`attendeeCount` for logged-in users without blocking anonymous access).
- **RSVP** is a simple toggle (`POST /:id/rsvp`): if the caller's user ID is already in the event's `attendees` array, it's removed; otherwise added. No capacity limits, no waitlist, no reminder/notification system.
- Events carry lightweight visual customization (emoji + pastel color) chosen from admin-curated presets in `CreateEventScreen`.
- **Client-side caveat**: a separate `EventsContext` "my RSVPs" cache exists and feeds `AccountScreen`'s "Events Attending" section, but it is not actually updated by the real RSVP flow (see §6.9) — likely an integration gap.
- Gamification's `eventAttendanceCount` counter and its associated badges (`event_attendee`, `event_regular`) are **not incremented** by the RSVP endpoint — another dormant gamification hook (see §11 in the backend findings / §16 below).

---

## 13. Admin Features (Consolidated)

Endpoints requiring `isAdmin`:
1. `POST /api/events`, `PUT /api/events/:id`, `DELETE /api/events/:id` — full event CRUD.
2. `GET /api/orders` — view all orders platform-wide.
3. `GET /api/professionals/requests`, `POST .../approve`, `POST .../reject` — professional account moderation.
4. `GET /api/users`, `GET /api/users/:id/orders` — user management/order lookup.
5. Admins additionally inherit all `requireRole("admin","professional")` capabilities (product CRUD, establishment management) with elevated scope — e.g., `canManageProduct` lets an admin edit/delete/re-image **any** product, not just their own.

Client-side admin screens: `AdminDashboardScreen` (aggregate metrics + action grid), `AdminProductsScreen`/`AdminProductFormScreen` (all-products CRUD), `AdminOrdersScreen` (read-only), `AdminEventsScreen` (event CRUD), `AdminProfessionalRequestsScreen` (approve/reject queue with approval-code display), `AdminSettingsScreen` (slimmed-down settings). Admins reach the app through an entirely separate `AdminStack`/`AdminTabs` navigator tree rather than a role-toggle within the customer experience.

---

## 14. Professional Features (Consolidated)

1. **Onboarding path**: register with `role:"professional"` → `ProfessionalPendingScreen` (shows approval code) → blocked from login until an admin approves → once approved, logs in normally and — uniquely among roles — **skips the post-registration profile-personalization questionnaire** entirely (`RootNavigator` condition explicitly excludes `role==="professional"`).
2. **Business profile** ("Establishment"): one per professional (unique `owner` index), managed via `GET/PUT /api/establishments/mine` and `PUT /api/establishments/mine/image`; fields include category (Supermarket/Restaurant/Health Store/Bakery/Pharmacy/Other), description, address, phone, hours, cover image, and GPS coordinates set via an in-app draggable-marker Leaflet map picker (`SellerEstablishmentFormScreen`).
3. **Product management**: scoped to their own listings only (`GET /products/mine`, ownership-checked update/delete/image-upload) — reuses the same UI components as the admin product screens, branching purely on `user.role`.
4. **Order visibility**: `GET /api/orders/seller` returns only orders containing their products, and only their own line-items within those orders (buyer/other-seller data is not exposed).
5. **Seller dashboard** (`SellerVisibilityScreen`): client-computed metrics — product count, order count, revenue (sum of `qty*price` across their order line-items), and a low-stock hint (`stock <= 5`); no dedicated backend "seller stats" endpoint exists, all aggregation happens client-side from the raw products/orders responses.
6. **Establishment "verified" status**: the schema has a `verified` boolean, but **no code path (admin or otherwise) currently sets it true** — a "verified seller" trust badge appears to be planned but not implemented on the backend (**INFERRED** from the presence of the field and matching UI copy in `SellerEstablishmentScreen` with no way to actually flip it).
7. **Not available to professionals**: creating events, approving other professionals, viewing platform-wide orders/users.

---

## 15. Technologies Used

### Backend (`glutenia-backend`)
| Category | Technology | Version |
|---|---|---|
| Runtime | Node.js | ≥ 20 |
| Web framework | Express | 4.21.2 |
| ODM / Database | Mongoose (MongoDB) | 8.9.5 |
| Auth | jsonwebtoken | 9.0.2 |
| Password hashing | bcryptjs | 2.4.3 |
| Validation | express-validator | 7.2.1 |
| File upload | multer (memory storage) | 2.1.1 |
| AI (active) | groq-sdk (Llama 4 vision via Groq) | 1.3.0 |
| AI (leftover/unused) | @google/genai, @google/generative-ai | 2.10.0 / 0.24.1 |
| CORS | cors | 2.8.5 |
| Env config | dotenv | 16.4.7 |
| Testing | Node.js built-in test runner (`node --test`) + supertest | 7.2.2 |

### Mobile (`glutenia-mobile`)
| Category | Technology | Version |
|---|---|---|
| Framework | Expo | 53.0.27 |
| UI runtime | React 19 / React Native | 19.0.0 / 0.79.6 |
| Navigation | @react-navigation (native, native-stack, bottom-tabs) | 6.x |
| Local storage | @react-native-async-storage/async-storage | 2.1.2 |
| Camera / image | expo-camera, expo-image-picker, expo-image-manipulator | 16.1.11 / 16.1.4 / 13.1.7 |
| Maps | react-native-webview + injected Leaflet.js (no native map SDK) | 13.12.5 |
| Bottom sheets | @gorhom/bottom-sheet | 5.2.14 |
| Gestures/animation | react-native-gesture-handler, react-native-reanimated | 2.24.0 / 3.17.4 |
| i18n | i18next, react-i18next, expo-localization | 26.3.2 / 17.0.8 / 16.1.6 |
| Icons | @expo/vector-icons, lucide-react-native | 14.1.0 / 1.17.0 |
| AI SDK (client dep, unused directly — actual call is server-side) | @google/generative-ai | 0.24.1 |
| Dev tooling | patch-package (2 patches: reanimated, webview), sharp (asset generation) | 8.0.1 |

### Infrastructure / DevOps
- **Deployment**: Render (Blueprint via `render.yaml`), Node web service, free plan, health-checked on `/`.
- **Database hosting**: MongoDB Atlas.
- **Mobile distribution**: standalone APK via local Gradle build (`expo prebuild` + `gradlew assembleRelease`), not EAS cloud build (though `eas.json` is present/configured).
- **Version control**: Git + GitHub (`ayarimanel/glutenia`).
- **IDE**: Visual Studio Code (local `.vscode/` folder present, gitignored).
- **No CI/CD** (no GitHub Actions or equivalent configured).
- **No linter/formatter** configured (no ESLint/Prettier config in either package).
- **Custom quality gate**: `glutenia-backend/run.ps1`, a PowerShell orchestration script that checks Node/npm versions and `.env`, verifies MongoDB reachability, installs dependencies, runs a syntax check, runs `npm audit` (`--audit-level=high`), runs the integration test suite against an isolated test database, and performs an HTTP smoke test — all gated sequentially before allowing a real server start. This is original engineering work distinct from any off-the-shelf tool.
- **Manual API testing**: Postman (per user confirmation, referenced in the existing tooling-analysis document).

*(For a more exhaustive tool-by-tool breakdown intended specifically for a report's "Development Environment"/"Testing Tools" chapters, see the sibling file `internship-report-tools-analysis.md` already present in this repository — it was produced from the same evidence base and should be treated as authoritative for that narrower topic.)*

---

## 16. Sprint Chronology (Inferred from Git History)

**Method**: derived from `git log` commit dates/messages and `git show --stat` file-churn per commit. The repository has **21 commits** across **4 active development dates** plus a large gap, authored solely by `ayarimanel`. This is almost certainly a **solo project** with squashed/batched commits rather than granular day-to-day commits — the very large initial commit (155 files, ~27,600 lines) indicates substantial work was done locally before the repository's history begins. All sprint/milestone framing below is **INFERRED** from commit boundaries and content — there is no explicit sprint-tracking artifact (no Jira/Trello board reference found in the repo).

### Milestone 0 — Project Scaffold & Core MVP (2026-06-25)
**Commit**: `8856126 Initial commit` (155 files, +27,590 lines), followed same-day by two Android-project regeneration commits (`4cd7ba6`, `5d95fb6` — EAS-generated native Android folder housekeeping).

Delivered in this single commit (representing accumulated pre-repository work): the entire backend skeleton — Express app, auth (register/login/me), product/order/user CRUD, the full gamification data model *and* service layer (achievements/badges/XP ledger/streaks — built ahead of any feature actually using it), onboarding controller, seed script, integration test suite (Supertest), the `run.ps1` quality-gate script, and Render deployment config. On the mobile side: full navigation skeleton, auth screens, the first onboarding carousel, home/shop/cart/checkout/order screens, admin dashboard/products/orders screens, gamification UI (badge collection, account screen with XP/level), i18n scaffolding (en/fr/ar structure), and the Android native project.

**INFERRED**: this represents essentially a full "Sprint 0 + Sprint 1" of a real project compressed into one commit — a working, testable MVP covering auth, catalog, cart/checkout, orders, admin CRUD, and a gamification foundation.

### Milestone 1 — Location & Barcode Scanning (2026-06-27)
**Commits**: `4b5f141 Real work from main computer`, `d82bd09 Add temporary seed endpoint for production database`.

Major addition: the **Map feature** (`MapScreen.js` alone grew to 1,532 lines in this commit — the single largest screen in the app), `MapDetailScreen`, custom category marker assets, and a marker-resizing build script. The `ScanScreen` was substantially rewritten (703-line diff), and the Product model gained a `barcode` field — indicating barcode-based product lookup was implemented/hardened in this milestone. A `CLAUDE.md` project-instructions file was added (later removed in Milestone 4), suggesting AI-assisted development tooling was introduced around this point. A temporary seed endpoint was added directly to `app.js` to bootstrap the production Render database — a pragmatic, if security-loose, deployment necessity (see §8).

### Milestone 2 — AI Label Scanning v1 (Gemini) & Content Screens (2026-06-28)
**Commits**: `c13205c Add new screens, contexts, and mobile features`, `39c1b1c Fix shared AsyncStorage keys leaking data between user accounts`, `5811579 Add AI label scan endpoint using Gemini`, `b984be8 Add full translations and AI label scanner screen`.

Two work-streams converged this day: (1) a wave of new content/context screens — `EventsContext`, `PatientResourcesScreen`, `RecipesScreen`/`RecipeDetailScreen`/`ResourceDetailScreen`/`VideoPlayerScreen`, `SettingsScreen`, `ShopScreen`, and a major `HomeScreen` rewrite (440-line diff); and (2) the **first AI feature** — `scan.controller.js` built against Google Gemini (`gemini-1.5-flash`), paired with `LabelScanScreen` and a full pass of translations across all three locales (each locale file grew by ~670+ lines in one commit, `677`/`668`/`677` for en/fr/ar respectively). A real, user-impacting bug was found and fixed same day: cart/events AsyncStorage keys were shared across accounts on the same device, leaking one user's cart/RSVP data into another's session — fixed by namespacing storage keys per user ID (this is a good "bug found via testing" anecdote for a report's QA section).

### Milestone 3 — AI Provider Stabilization & Events Backend (2026-06-29)
**Commits**: 13 commits, all same day, almost entirely iterating on the scan controller's AI provider (`8cc6b1f` through `9e6a436`), plus `0a4b6b2 Add events feature: model, controller, routes, and mount in app`.

This day is best framed as **stabilization/hardening**, not new-feature work: repeatedly encountering Gemini free-tier quota and API-version incompatibilities (v1 vs v1beta, model name deprecations, SDK migration from `@google/generative-ai` to `@google/genai`, a server crash from eager client initialization), before ultimately abandoning Gemini for **Groq/Llama 4 vision** as the stable, working solution. In parallel, the **Events feature's backend** (Event model, controller, routes, admin-gated CRUD + public RSVP) was built and mounted — this is the day the client-side Events UI (built Milestone 2) got its real backend counterpart.

### Milestone 4 — Professional Accounts, Establishments & Theming (2026-07-10)
**Commit**: `e0c4172 Add professional accounts, establishments, and app-wide theming` (56 files changed, +3,875/−1,255 lines) — an 11-day gap since the previous commit, suggesting either a pause in active development or a large chunk of offline/local work landing as one commit.

This is the largest single feature milestone: the **professional role and its full approval workflow** (User model gains `professionalStatus`/`approvalCode`, auth controller gains pending-account handling, new `professional.controller.js`/`routes.js`), the **Establishment model and CRUD** (`establishment.controller.js`/`routes.js`, `Establishment` model), a `requireRole` middleware (generalizing beyond the binary `isAdmin` check), and **five new/rewritten seller screens** (`SellerEstablishmentScreen`, `SellerEstablishmentFormScreen`, `SellerVisibilityScreen`, `SellerOrdersScreen`, plus admin-side `AdminEventsScreen`, `AdminProfessionalRequestsScreen`, `AdminSettingsScreen`). Also introduced **app-wide dark/light theming** (`ThemeContext`), regenerated app icon/splash/branding assets, and cleaned up two temporary documentation files (`AI_LABEL_SCANNER.md`, `CLAUDE.md`) that had accumulated during earlier AI-assisted development. The commit message itself notes these features were "previously local-only," explaining why the deployed API had been 404ing on professional/establishment routes — direct evidence of a **local-vs-deployed environment drift** being caught and fixed.

### Milestone 5 — In Progress (uncommitted, as of 2026-07-13)
Working-tree changes not yet committed: a substantial rewrite of the backend integration test suite (`test/api.test.js`, +309/−232 lines — very likely extending test coverage to the professional/establishment features added in Milestone 4), a mobile app version bump (`app.json`/`package.json`), and `SplashScreen.js` tweaks. **INFERRED**: this represents the start of a stabilization/testing pass following the large Milestone 4 feature drop, consistent with good practice (tests catching up to features) rather than a new feature push.

### Summary timeline table

| Date | Milestone | Headline deliverable |
|---|---|---|
| 2026-06-25 | 0 — Scaffold | Full-stack MVP: auth, catalog, cart/checkout, orders, admin CRUD, gamification data model |
| 2026-06-27 | 1 — Location & Barcode | Interactive map, barcode scanning, product barcode field |
| 2026-06-28 | 2 — AI v1 & Content | Gemini-based label scanner, recipes/resources/settings screens, full i18n pass, cross-account storage bug fix |
| 2026-06-29 | 3 — AI Stabilization & Events | Provider migration Gemini→Groq/Llama4, Events feature backend |
| 2026-07-10 | 4 — Professional Accounts | Professional approval workflow, Establishments, seller dashboard, app-wide theming |
| 2026-07-13 (in progress) | 5 — Test hardening | Expanded backend test suite, version bump |

---

## 17. Potential Scrum User Stories

Organized by epic, in "As a [role], I want [capability], so that [benefit]" form, derived from what is actually implemented (not aspirational) — suitable for a report's "Product Backlog" or "Requirements" chapter. Marked **[inferred]** where the underlying feature exists but the story is a plausible reconstruction rather than something documented verbatim anywhere in the repo.

### Epic: Account & Onboarding
- As a new user, I want to register with an email and password, so that I can create a personal account. *(implemented)*
- As a returning user, I want to stay logged in between app sessions, so that I don't have to re-enter my credentials every time. *(implemented — session persistence)*
- As a new user, I want to see a short introduction to the app's key features on first launch, so that I understand what Glutenia offers. *(implemented — marketing carousel)* **[inferred]**
- As a customer, I want to answer a few questions about my gluten-free journey (role, experience, goals, confidence), so that the app can personalize my experience and title. *(implemented — profile onboarding wizard)*
- As a business owner, I want to register as a "professional" account, so that I can list my gluten-free products/business. *(implemented)*
- As an admin, I want to review and approve/reject professional account requests, so that only legitimate businesses gain seller access. *(implemented)*

### Epic: Scanning & Ingredient Safety
- As a customer, I want to scan a product's barcode, so that I can instantly see if it's gluten-free without reading the label myself. *(implemented)*
- As a customer, I want to photograph an ingredient label when a barcode isn't recognized, so that I can still check for gluten using AI. *(implemented)*
- As a customer, I want the AI to explain *why* an ingredient is flagged as unsafe, so that I can learn to recognize it myself next time. *(implemented — `flagged[].reason`)*
- As a customer scanning a label in Arabic or French, I want the AI to understand it correctly, so that the app works regardless of my region/language. *(implemented — multilingual prompt)*
- As a customer, I want to be warned when the AI isn't confident in its reading, so that I don't rely on an uncertain result. *(implemented — confidence level + note)*

### Epic: Shopping & Orders
- As a customer, I want to browse a catalog of gluten-free products by category or search, so that I can find what I need quickly. *(implemented)*
- As a customer, I want to add products to a cart and adjust quantities, so that I can build an order before committing. *(implemented)*
- As a customer, I want to enter a delivery address and place an order, so that I can receive my products. *(implemented)*
- As a customer, I want to see my past orders, so that I can track what I've purchased. *(implemented)*
- As a professional, I want to see only the orders (and only the items) relevant to my own products, so that I can fulfill them without seeing unrelated customer/seller data. *(implemented)*
- As an admin, I want to see all orders across the platform, so that I can monitor overall activity. *(implemented)*
- As a seller/admin, I want to update an order's status as it moves toward delivery, so that customers know where their order stands. **[inferred/gap — schema supports it, no endpoint exists yet]**

### Epic: Product & Establishment Management (Professional)
- As a professional, I want to create and edit my own product listings with photos, prices, and stock, so that customers can find and buy them. *(implemented)*
- As a professional, I want to set up a business profile (name, category, hours, location on a map), so that customers can discover and visit me. *(implemented)*
- As a professional, I want a simple dashboard showing my product count, order count, and revenue, so that I can gauge how my business is doing on the platform. *(implemented)*
- As a professional, I want my business to display a "verified" badge once an admin confirms it's legitimate, so that customers trust it more. **[inferred/gap — schema field exists, no admin action implemented yet]**

### Epic: Discovery (Map & Recipes)
- As a customer, I want to see gluten-free-friendly supermarkets, restaurants, and pharmacies near me on a map, so that I know where it's safe to shop or eat out. *(implemented)*
- As a customer, I want to filter the map by establishment category, so that I can find exactly the type of place I need. *(implemented)*
- As a customer, I want to see hours, facilities, and contact/directions for a place, so that I can plan a visit. *(implemented)*
- As a customer, I want gluten-free recipe ideas (especially local/Tunisian ones), so that I can cook safely at home. *(implemented, static content)*

### Epic: Community & Events
- As a customer, I want to browse upcoming gluten-free-related events (meetups, markets, classes), so that I can connect with the community. *(implemented)*
- As a customer, I want to RSVP to an event, so that organizers know I'm attending. *(implemented)*
- As an admin, I want to create and manage community events, so that the platform has a curated, trustworthy events calendar. *(implemented)*
- As a professional, I want to host my own events (e.g., a bakery hosting a tasting), so that I can promote my business to the community. **[inferred/gap — currently admin-only]**

### Epic: Motivation & Gamification
- As a customer, I want to earn XP and level up as I use the app, so that I feel a sense of progress on my gluten-free journey. *(implemented — engine exists, but only onboarding currently grants XP)*
- As a customer, I want to earn badges for milestones (scanning, checking ingredients, attending events), so that my achievements feel recognized. **[inferred/gap — badge thresholds and models exist, but scanning/events don't currently trigger them]**
- As a customer, I want to maintain a daily streak, so that I stay engaged with the app regularly. **[inferred/gap — streak logic exists in the service layer but nothing currently calls it]**
- As a customer, I want to pin my favorite badges to my profile, so that I can showcase my proudest achievements. *(implemented)*

### Epic: Localization & Accessibility
- As a customer in Tunisia, I want the app in French or Arabic, so that I can use it in my preferred language. *(implemented)*
- As an Arabic-speaking customer, I want the interface to mirror right-to-left, so that the layout feels natural in my language. **[inferred/gap — translations exist, RTL layout mirroring does not]**
- As a customer, I want a dark mode option, so that I can use the app comfortably at night. *(implemented, partially — not all screens honor it)*

### Epic: Platform Administration
- As an admin, I want a dashboard summarizing products, orders, and revenue, so that I can monitor the platform at a glance. *(implemented)*
- As an admin, I want to manage the full product catalog (not just my own), so that I can correct or remove problematic listings. *(implemented)*
- As an admin, I want to approve or reject professional account applications, so that I control who can sell on the platform. *(implemented)*

---

## 18. Summary of Explicitly Flagged Assumptions / Inferences

For quick reference, every claim in this document not directly verifiable from a single unambiguous code artifact was marked **INFERRED** inline. The recurring categories of inference were:
1. **Intent behind naming/enum values** where no comment exists (e.g., "warrior" = person with the condition, "supporter" = caregiver).
2. **Dead/dormant code paths** — features whose data model and service logic are fully built but never invoked by any live controller (most of the gamification engine beyond the flat onboarding XP grant).
3. **Design tradeoffs** not explained in commit messages (e.g., storing images as base64 in MongoDB rather than using object storage — plausibly a scope/budget/time decision for a student project).
4. **Sprint/milestone framing** — the repository has no formal sprint-tracking artifact; milestone boundaries were reconstructed purely from commit dates and diff content.
5. **Target market** — Tunisia, inferred from the seed admin email domain (`.tn`) and the map feature's demo data being centered on Tunis.
6. **Gaps between schema and feature** — e.g., `Order.status` supporting `pending`/`delivered` with no endpoint to reach those states, `Establishment.verified` with no way to set it true.

Where this document states something as fact without an INFERRED marker, it reflects a direct, literal reading of the code (a specific route definition, a specific schema field with its exact type/enum/default, a specific middleware chain, or a specific commit's diff).
