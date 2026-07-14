# Glutenia — Tooling Analysis for "Development Environment" and "Testing and Software Quality Tools" Chapters

Grounded in the actual repository state (checked 2026-07-12), not generic inference. Evidence cited per tool.

## Evidence found in the repo

- **Automated testing**: Node.js's built-in test runner (`node --test`) + `supertest` for HTTP integration tests against a real (non-mocked) MongoDB test database. No Jest, no Mocha. (`glutenia-backend/test/api.test.js`, `package.json`)
- **No linter/formatter configured anywhere** — no `.eslintrc`, no `.prettierrc`, in either package. Do not write a "Code Quality: ESLint/Prettier" section — it would be inaccurate.
- **IDE**: a `.vscode/` folder exists locally (gitignored) → VS Code was used.
- **Version control**: `git remote` confirms a GitHub repo (`github.com/ayarimanel/glutenia`).
- **Deployment**: `render.yaml` present → Render Blueprint (Infrastructure-as-Code), not just manual dashboard clicking.
- **No CI/CD** — no `.github/workflows`. Don't claim GitHub Actions/Jenkins.
- **`eas.json` exists**, but the actual APK build script (`build:apk`) calls `gradlew assembleRelease` directly, bypassing EAS cloud build. EAS is *configured* but the evidence points to **local Gradle builds**, not EAS Build. Verify actual usage before including.
- **Custom orchestration script** (`glutenia-backend/run.ps1`): checks Node/npm versions, verifies MongoDB reachability, runs `npm audit`, runs the test suite against an isolated test DB, then does an HTTP smoke test before allowing a start. Genuinely good, original artifact for the report.
- **Logging**: plain `console.log`/`console.error` redirected to files. No Winston/Morgan/Pino. No external monitoring (no Sentry, no APM). Render's built-in log viewer is the only observability mechanism — state this honestly rather than inventing a monitoring stack.

---

## Category breakdown

### Core development technologies (already covered — not re-analyzed)
Node.js, Express.js, MongoDB Atlas, Mongoose, React Native + Expo.

### Development tools / IDE

| Tool | Why likely used | Own subsection? | Or mention elsewhere? | Logo? |
|---|---|---|---|---|
| **VS Code** | `.vscode/` folder present locally | Yes, short (1 paragraph) | — | Yes |
| **npm** | Sole package manager in both `package.json` files (no yarn/pnpm lockfiles found) | No | One sentence under Node.js/Express | Yes |
| **Expo CLI** | Standard for any Expo project (`expo start`, `expo prebuild` in scripts) | No | Mention under React Native/Expo | Yes (Expo logo) |
| **Expo Go** (device testing) | Common for iterative dev, but **not confirmed** by repo | No | Only if you confirm you used it | Covered by Expo logo |

### Testing tools

| Tool | Why likely used | Own subsection? | Or mention elsewhere? | Logo? |
|---|---|---|---|---|
| **Postman** | Confirmed by user; standard for REST API manual testing | Yes | — | Yes |
| **Node.js Test Runner + Supertest** | Confirmed in `test/api.test.js`, `package.json` | Yes — strongest, most factual testing content | — | No distinct logo; use a terminal-output screenshot instead |
| **Android Studio Emulator** | Already listed; also doubles as manual UI test device | No new subsection | Mention once under Dev Environment, reference again in Testing as "manual test device" | Yes |
| **MongoDB Compass** | Very common for inspecting Atlas data during dev, but **not in any config file** | No | Only if actually used — verify first | Yes |

### Debugging tools

| Tool | Why likely used | Own subsection? | Or mention elsewhere? | Logo? |
|---|---|---|---|---|
| **Metro bundler logs / React Native dev menu** | Default RN/Expo debugging surface | No | One sentence under React Native | No standalone logo commonly used in reports |
| **Chrome DevTools (remote JS debugging)** | Standard if "Debug remote JS" was ever used | No | Optional one-liner | Yes, but low value to include |
| **Postman** (again) | Doubles as an API debugging tool for error responses | — | Reference back to Testing section | — |

### Deployment tools

| Tool | Why likely used | Own subsection? | Or mention elsewhere? | Logo? |
|---|---|---|---|---|
| **Render** | `render.yaml` confirms Blueprint-based deploy, env var management, health check path | Yes | — | Yes |
| **Android Gradle Wrapper (`gradlew`)** | Confirmed in `build:apk` script; produces the release APK | No | Mention under Android Studio subsection | Gradle has a logo, but not essential |
| **EAS (Expo Application Services)** | `eas.json` exists, but build script bypasses it | Only if you actually ran `eas build` — verify first | Otherwise omit entirely | Covered by Expo logo |

### Version control tools

| Tool | Why likely used | Own subsection? | Or mention elsewhere? | Logo? |
|---|---|---|---|---|
| **Git** | Repo is a git working tree | Yes (combine with GitHub) | — | Yes |
| **GitHub** | Remote confirmed (`ayarimanel/glutenia`) | Yes (combined subsection) | — | Yes |

### Code quality / software quality tools

| Tool | Why likely used | Own subsection? | Or mention elsewhere? | Logo? |
|---|---|---|---|---|
| **`npm audit`** | Explicitly invoked in `run.ps1` at `--audit-level=high` | Yes, short — real, defensible "software quality" content | — | No standalone logo; use npm logo |
| **Custom `run.ps1` orchestration script** | Env checks, DB reachability checks, audit, tests, smoke test, all gated sequentially | Yes — worth a dedicated short subsection or figure (flowchart of the pipeline); original engineering work, not a name-dropped tool | — | N/A (it's yours — a diagram works better than a logo) |
| ~~ESLint / Prettier~~ | **Not found in repo** | **Do not include.** Add ESLint before submitting if you want this section, don't write about a tool you didn't configure. | — | — |

---

## Final ranking

### Essential (must appear)
- Node.js, Express.js, MongoDB Atlas, Mongoose, React Native + Expo *(already covered)*
- Visual Studio Code
- Git + GitHub
- Android Studio (emulator + Gradle build)
- Render (mention `render.yaml` / Blueprint explicitly — stronger evidence of real DevOps understanding than "we deployed to Render")
- Postman
- Node.js Test Runner + Supertest (actual automated test suite — lead with this in the Testing chapter, not Postman)

### Recommended (nice to include, strengthens the report)
- `npm audit` (dependency vulnerability scanning)
- Custom `run.ps1` pipeline (an examiner will notice a student who documents their own quality-gate script more than one who lists Postman for the fifth time)
- MongoDB Compass / Expo Go — **only if honestly confirmed as used**

### Implementation details (do NOT put in the tech/tools chapters — belong in system design/features chapter, if anywhere)
- `multer`, `bcryptjs`, `jsonwebtoken`, `express-validator` (feature-level libraries: upload, auth, validation)
- `@google/generative-ai`, `groq-sdk` (AI provider SDKs — belongs in the AI ingredient-analysis feature description)
- `react-navigation`, `async-storage`, `gesture-handler`, `reanimated`, `expo-camera`, `expo-image-picker`, `i18next` (mobile app implementation libraries, not dev-environment tooling)
- EAS config (unless verified as actually used for building)

### Explicitly absent — state this rather than inventing something
- No CI/CD pipeline (no GitHub Actions)
- No linter/formatter
- No monitoring/APM tool (Sentry, Datadog, etc.) — only Render's built-in logs
- No Docker

An examiner will trust a "Limitations" or "Tooling not yet adopted" line (CI/CD, linting, monitoring) far more than a chapter that silently omits them while listing unrelated libraries as if they were "tools."
