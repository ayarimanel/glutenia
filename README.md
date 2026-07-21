# Glutenia

A cross-platform mobile app (Android/iOS via Expo) for people managing celiac disease or gluten intolerance — and for those supporting someone who does. It turns the daily work of staying safe gluten-free into something guided, trackable, and rewarding.

## Features

- **AI-assisted ingredient-label scanning** — photograph a label; a Groq-hosted vision model reads the ingredients and flags gluten in English, French, or Arabic.
- **Barcode product lookup** — check packaged products against an in-house catalog.
- **Gluten-free storefront** — browse, cart, checkout, and track orders.
- **Community events** — browse and RSVP to local gluten-free meetups, classes, and markets.
- **Map** — find and save gluten-free-friendly places nearby.
- **Personalized onboarding** — a 5-step questionnaire tailors guidance (beginner label tips, restaurant nudges) to each user's experience level and goals.
- **Gamification** — XP, levels, daily streaks, and a full badge system reward everyday safety habits (scanning, label-checking, event attendance, orders) rather than turning the app into a competition.
- **Professional/seller accounts** — approved professionals manage their own storefront, products, and orders.
- **Admin dashboard** — product/recipe/event management, order handling, and aggregated user-insight analytics.

## Stack

- **Mobile**: React Native 0.79 via Expo 53, React Navigation (bottom tabs + native stack), i18next (English/French/Arabic), AsyncStorage-backed local state
- **Backend**: Node.js 20 + Express 4 + MongoDB (Mongoose 8), JWT auth, express-validator, multer
- **AI**: Groq (OpenAI-compatible API) for ingredient-label analysis
- **Deployment**: Render (backend), EAS (mobile Android builds)
- **Testing**: Node's built-in test runner + Supertest, integration-style against a real MongoDB test database

## Project structure

```
glutenia-backend/
├── src/
│   ├── controllers/    business logic, one file per resource
│   ├── routes/         Express routers, mounted under /api
│   ├── models/         Mongoose schemas (User, Product, Order, Event, Badge, ...)
│   ├── middleware/      auth, role checks, validation, error handling
│   ├── services/       gamification, notifications, push, scan recording
│   └── seed/            database seeding scripts
└── test/                 integration tests (Supertest + real MongoDB)

glutenia-mobile/
└── src/
    ├── api/client.js     single fetch-based API client
    ├── navigation/        role-aware navigation (auth / onboarding / user / admin)
    ├── screens/           user, admin, auth, and onboarding screens
    ├── context/           auth, theme, cart, events, gamification, notifications
    └── components/        shared UI components
```

## Getting started

Set up the backend first, then the mobile app:

- [`glutenia-backend/README.md`](glutenia-backend/README.md) — API setup, environment variables, seeding
- [`glutenia-mobile/README.md`](glutenia-mobile/README.md) — running the Expo app against the local backend

For a full technical deep-dive — API conventions, every data model, auth flow, environment variables, and mobile architecture — see [`EVERYTHING_YOU_NEED_TO_KNOW.md`](EVERYTHING_YOU_NEED_TO_KNOW.md).

## Deployment

The backend deploys to Render via `render.yaml` (see the file for the exact env vars it manages). The mobile app builds Android APKs through EAS (`glutenia-mobile/eas.json`), with production builds pointed at the deployed Render API.
