# Glutenia Mobile

Expo React Native app for Glutenia, a gluten-free e-commerce and community app for people managing celiac disease or gluten intolerance. Talks to the [glutenia-backend](../glutenia-backend) REST API.

## Tech stack

- **Expo 53** / **React Native 0.79** / **React 19**, written in **TypeScript** (`strict: true`) — 108 `.ts`/`.tsx` files, 0 type errors
- **React Navigation** (bottom tabs + native stack), with a typed `RootParamList`
- **React Context** for state (7 providers: Auth, Cart, Events, Gamification, Notifications, Theme, Alert) — no external state library
- **i18next** — full English/French/Arabic translations
- **Jest + React Native Testing Library** — 61 tests across 3 files (unit, integration, and icon-map coverage)
- **ESLint** (`expo lint`) — 0 errors, 74 reviewed-and-left warnings

## Features

~57 screens across customer, seller/professional, and admin roles:

- AI-assisted ingredient-label scanning and barcode product lookup (falls back to community-reported barcodes)
- Gluten-free storefront: browse, cart, checkout, order history and status tracking
- Community: events with RSVP, a map of gluten-free-friendly places with favorites, crowdsourced product reports
- Gamification: XP, levels, streaks, unlockable badges, tied to real actions (scans, orders, RSVPs, contributions)
- Professional/seller accounts: establishment profiles, product/order management, admin approval flow
- Admin dashboard: analytics, user/professional management, content management (recipes, patient resources, events)
- Onboarding survey that personalizes the Home screen's layout and content

See `MIGRATION_REPORT.md` for the JavaScript → TypeScript migration (2 real bugs found and fixed, 1 prevented) and `PROJECT_FACTS.md` (repo root) for exact counts and versions.

## Run

Start the backend first:

```powershell
cd ..\glutenia-backend
.\run.ps1 -Seed
.\run.ps1 -Start
```

Then start the mobile app:

```powershell
cd ..\glutenia-mobile
.\run.ps1 -Start
```

Use Expo Go to scan the QR code, or press `a` for Android emulator.

If you use a physical phone, the app automatically tries to use the Expo host IP for the backend. You can override it:

```powershell
.\run.ps1 -Start -ApiUrl "http://YOUR-LAN-IP:5000/api"
```

Seed admin:

```text
admin@glutenia.tn / admin123
```

## Build APK

The APK uses the API URL configured in `app.json` under `extra.apiBaseUrl`.

```powershell
npm run build:apk
```

The final installable file is written to `Glutenia.apk`.

## Testing & type checking

```powershell
npm test         # Jest — 61 tests across 3 files
npm run typecheck  # tsc --noEmit — 0 errors expected
npm run lint       # expo lint — 0 errors, 74 known warnings expected
```
