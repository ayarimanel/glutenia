# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project overview

Glutenia is a gluten-free e-commerce app for Tunisia. It has two sub-projects in this monorepo:

| Folder | Stack | Purpose |
|---|---|---|
| `glutenia-backend/` | Node 20+, Express 4, Mongoose 8, MongoDB | REST API |
| `glutenia-mobile/` | React Native, Expo SDK 53, JSC engine | Android app |

---

## Backend commands

All commands run from `glutenia-backend/`.

```powershell
# Recommended: full run script (checks Node, MongoDB, env, then starts)
.\run.ps1 -SkipTests -SkipSmoke -Start        # dev server only
.\run.ps1 -SkipTests -SkipSmoke -Seed -Start  # seed then start
.\run.ps1                                      # full check: install, audit, tests, smoke, no server

# Individual npm scripts
npm run dev      # node --watch server.js (hot-reload)
npm start        # node server.js (no reload)
npm run seed     # wipe users+products, insert 6 products + gamification catalog
npm test         # Node built-in test runner against glutenia_test database
npm run check    # JS syntax check across all src files (no Node modules needed)
```

Tests require a running MongoDB at `TEST_MONGO_URI` (default `mongodb://127.0.0.1:27017/glutenia_test`). The test suite asserts the connected database name contains "test" and refuses to run otherwise.

**Environment** — copy `.env.example` to `.env`. The only mandatory secret is `JWT_SECRET`. `MONGO_URI` defaults to local MongoDB; a cloud Atlas fallback is hardcoded in `src/config/db.js` for convenience.

---

## Mobile commands

All commands run from `glutenia-mobile/`.

```powershell
npm run start           # Expo dev server (LAN mode)
npm run android         # run debug build in connected emulator
npm run build:apk       # full release APK → outputs Glutenia.apk

# build:apk expands to:
# npm run assets && npm run prebuild:android && .\android\gradlew.bat assembleRelease && node scripts/finalize-apk.js
```

If `build:apk` fails at the Gradle step (common on Windows), run the steps manually:
```powershell
npm run assets
npm run prebuild:android
Set-Location android; .\gradlew.bat assembleRelease; Set-Location ..
node scripts/finalize-apk.js
```

**Environment** — `glutenia-mobile/.env` contains `EXPO_PUBLIC_API_URL`. This env var takes priority over everything else in `src/api/client.js`. For emulator use `http://10.0.2.2:5000/api`; for a physical device use the laptop's LAN IP. For production it points to Render (`https://glutenia-2ksi.onrender.com/api`).

After changing `apiBaseUrl`, a full rebuild is required because Expo prebuild bakes the value into the native bundle.

---

## Backend architecture

### Request lifecycle

```
HTTP request
  → express-validator validators (in route file)
  → validateRequest middleware  (returns 400 with field errors)
  → verifyToken / isAdmin middleware (optional, per route)
  → controller function
  → errorHandler middleware (catches next(error))
```

All success responses: `{ success: true, data: <payload> }`
All error responses: `{ success: false, message: "<string>" }`

The `errorHandler` (`src/middleware/errorHandler.js`) normalises Mongoose `CastError` → 404, `ValidationError` → 400, duplicate key 11000 → 409, multer file size → 413.

### Auth

`verifyToken` reads `Authorization: Bearer <token>`, verifies it with `getJwtSecret()`, and attaches the decoded payload to `req.user` (fields: `id`, `name`, `email`, `role`). `isAdmin` simply asserts `req.user.role === 'admin'`.

Login and register both return `{ token, user }` under `data`. The mobile app stores this session in AsyncStorage under key `glutenia.session`.

### Route map

| Prefix | File | Auth |
|---|---|---|
| `/api/auth` | `auth.routes.js` | public (except `/me`) |
| `/api/products` | `product.routes.js` | public GET, admin POST/PUT/DELETE |
| `/api/orders` | `order.routes.js` | customer + admin |
| `/api/users` | `user.routes.js` | verifyToken |
| `/api/onboarding` | `onboarding.routes.js` | verifyToken |
| `/api/gamification` | `gamification.routes.js` | verifyToken |

### Product model fields

`name`, `description`, `price`, `category` (enum), `imageUrl`, `stock`, `isGlutenFree`, `createdBy` (ref User), `createdAt`, `barcode`.

`barcode` has a **sparse unique index** — multiple `null` values are allowed, but two non-null barcodes cannot be identical.

### Gamification

`src/services/gamificationService.js` is called after scan events and other user actions. It manages XP ledger, level calculation, badge awards (threshold-based), and achievement progress. Models: `UserGamification`, `XpLedger`, `Badge`, `UserBadge`, `Achievement`, `UserAchievement`.

---

## Mobile architecture

### Navigation structure

`RootNavigator` renders one of five stacks based on auth state (checked in order):

1. `OnboardingStack` — first-launch walkthrough (one screen)
2. `AuthStack` — Login / Register
3. `AdminStack` → `AdminTabs` + `AdminProductForm`
4. `ProfileOnboardingStack` — post-login role/goal setup
5. `UserStack` → `UserTabs` + detail screens (ProductDetail, Cart, Checkout, etc.)

Both `UserTabs` and `AdminTabs` use `CustomTabBar` with the "Scan" tab always in the center position. The tab bar is `position: absolute` at the bottom — all screens must account for this with bottom padding (`insets.bottom + 66` minimum).

### API client (`src/api/client.js`)

Single `request()` function handles timeout (20s default), AbortController, JSON serialisation, FormData detection, and the `{ success, data/message }` envelope unwrapping. It throws an `Error` with `.status = HTTP status code` on any failure. The `api` object exposes all backend endpoints as named functions.

URL resolution priority: `EXPO_PUBLIC_API_URL` env var → `app.json extra.apiBaseUrl` → Expo dev server host → platform fallback.

### State management

No Redux or Zustand. Two contexts only:

- `AuthContext` — `user`, `token`, `hasSeenOnboarding`, `profileOnboardingDone`, `login`, `register`, `logout`, `updateUser`
- `CartContext` — `items`, `addItem(product, qty)`, `updateQty`, `removeItem`, `clearCart`, `total`, `count`. Cart is persisted to AsyncStorage (`glutenia.cart`); it is **not** synced to the backend until checkout.

### Screens convention

- User screens: `src/screens/user/`
- Admin screens: `src/screens/admin/`
- Auth screens: `src/screens/auth/`
- Non-role screens: `src/screens/` (AccountScreen, OnboardingScreen, SplashScreen)
- Screens use `AppHeader` (identity bar with cart badge) with `safeTop` prop when not inside a `SafeAreaView`
- `Screen` component wraps `SafeAreaView` with the app background colour

### Theme

Import from `src/theme/colors.js`: `Colors`, `Spacing` (xs/sm/md/lg/xl), `Radius` (sm/md/lg/xl/pill), `Shadow`. Icons via `AppIcon` component which maps string names to `lucide-react-native` exports.

---

## Barcode scan feature — how it works end to end

### For a teacher: plain-language summary

The barcode scanner lets a user point their phone camera at any food product. The app reads the barcode number printed on the packaging, sends it to the server, and the server looks up whether that product is in the gluten-free database. If it is, the app shows the product name, price, and a green "Gluten-Free" badge. If not, it shows a "not found" message. The whole process takes about one second on a good connection.

### Backend side

**Model change** (`src/models/Product.js`):
- Added `barcode: { type: String, default: null, trim: true }`
- Sparse unique index: `productSchema.index({ barcode: 1 }, { unique: true, sparse: true })`
- Sparse means MongoDB ignores `null` values for uniqueness — many products can have no barcode, but no two products can share the same non-null barcode.

**New route** (`src/routes/product.routes.js`):
```
GET /api/products/barcode/:code   (no auth required)
```
Placed **before** `GET /:id` so Express doesn't interpret the string "barcode" as a MongoDB ObjectId.

**Controller** (`src/controllers/product.controller.js`):
```js
exports.getProductByBarcode = async (req, res, next) => {
  const product = await Product.findOne({ barcode: req.params.code });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  return res.json({ success: true, data: product });
};
```

**Seed data** (`src/seed/seed.js`): Each of the 6 seeded products has a realistic EAN-13 barcode (13-digit European Article Number, e.g. `3017620422003` for "Pain sans gluten").

### Mobile side

**API call** (`src/api/client.js`):
```js
productByBarcode: (barcode, token) =>
  request(`/products/barcode/${encodeURIComponent(barcode)}`, { token })
```

**ScanScreen** (`src/screens/user/ScanScreen.js`) — four-state machine:

| State | What renders |
|---|---|
| `scanning` | Full-screen `CameraView` + dark overlay mask with transparent guide frame |
| `loading` | Spinner + "Checking product…" (shown immediately on scan, before API responds) |
| `found` | Product card: name, price in TND, green Gluten-Free badge, description, Add to Cart button |
| `not_found` | "Product not found" + "This product is not in our gluten-free database yet." + Try Again |

Key implementation details:
- `useCameraPermissions()` from `expo-camera` (SDK 53 API — not the old `Camera.Constants`)
- `useRef` scan lock (`scanLock.current`) prevents duplicate API calls when the camera fires `onBarcodeScanned` multiple times for the same barcode
- `useIsFocused()` gates the `CameraView` render — camera only activates when the Scan tab is visible, not on every tab in the background
- `useFocusEffect` resets the scan lock when the user navigates away and returns
- Bottom padding is computed as `insets.bottom + 66` (safe area + tab bar height) to keep content above the floating tab bar

**Camera overlay**: built from four plain `View` components (top mask, left side, transparent frame, right side, bottom mask) with `rgba(0,0,0,0.55)` background — no external library.

**app.json** additions required for the camera to work on Android:
```json
"android": { "permissions": ["android.permission.CAMERA"] }
"plugins": [["expo-camera", { "cameraPermission": "Glutenia needs camera access to scan product barcodes." }]]
```
