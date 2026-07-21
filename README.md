# Glutenia

A mobile app for people managing celiac disease or gluten intolerance — scan barcodes and ingredient labels to check for gluten, browse a gluten-free storefront, find gluten-free-friendly places on a map, join community events, and track personal progress through a gamification system (XP, levels, streaks, badges).

## Stack

- **Mobile**: React Native (Expo)
- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **AI**: Groq/Gemini vision models for ingredient-label scanning
- **Deployment**: Render (backend), Expo/EAS (mobile)

## Structure

```
glutenia-backend/   REST API — models, controllers, routes, services
glutenia-mobile/    Expo React Native app — screens, navigation, components
render.yaml         Render deployment blueprint for the backend
```

## Getting started

Set up the backend first, then the mobile app:

- [`glutenia-backend/README.md`](glutenia-backend/README.md) — API setup, environment variables, seeding
- [`glutenia-mobile/README.md`](glutenia-mobile/README.md) — running the Expo app against the local backend
