# Consistency Issues — Docs vs Code vs Each Other

**Checked on 2026-07-31**, against the measurements in `PROJECT_FACTS.md` (all re-run today) and the current code in `glutenia-backend/` and `glutenia-mobile/`.

**Nothing below has been fixed.** This is a list to decide from, not a changelog. Each entry states the file, the claim, and the value confirmed correct today, so you can judge each one instead of taking my word for it.

**Scope of this check** — read in full: `PROJECT_FACTS.md` (today's own numbers), `MIGRATION_REPORT.md`, `BACKEND_REPORT.md`, `BACKEND_AUDIT.md`, `LIMITATIONS.md`, `EVERYTHING_YOU_NEED_TO_KNOW.md`, both current READMEs. Spot-checked by grepping every number-bearing line: `PFE_PRESENTATION_PREPARATION_GUIDE.md`, `SOUTENANCE_TECHNIQUE_GUIDE.md`, `TECHNOLOGIES_STUDY_GUIDE.md`, `DEFENSE_DEMO.md`, `PROJECT_ANALYSIS.md`. **Not read in full**, only grep-checked for numbers, so prose claims in those five files that don't involve a count could still be stale without it showing up here — if you quote a specific sentence from one of them, worth a second look before using it.

---

## Real contradictions (fix or reconcile before using)

### 1. `EVERYTHING_YOU_NEED_TO_KNOW.md` — file counts are stale by 2

**Claim** (lines 21, 23-24):
```
controllers/     # 12 files, one per resource
models/          # 12 Mongoose models
routes/          # 12 route files, mirrors controllers
```
**Confirmed today:** 14 controller files, 15 models, 14 route files (`PROJECT_FACTS.md` §2). This document also still describes `App.js` and `src/api/client.js` (lines 34, 38) — the TypeScript migration renamed these to `App.tsx` / `client.ts` back in commits `728c6ae` / `e497e28` (2026-07-25).

**Why it drifted:** this file predates both the TypeScript migration and at least two backend resources added afterward (Community Products and Patient Resources — both post-date the "12 route files" count; see commits `a1623ae`, `ab025f4` in `PROJECT_FACTS.md` §9). It reads as a snapshot from mid-project, not touched since.

**Decide:** either update the counts (14/15/14, `.tsx`/`.ts`) or mark the whole file as a historical snapshot rather than a current reference, so a reader doesn't quote a 2-resource-old number.

---

### 2. Endpoint count: "62" and "63" are both used, inconsistently, without the same document always explaining why

**"62" is used in:** `PROJECT_FACTS.md` (this session's own count — every `router.<verb>` call in the 14 route files, not counting the bare `GET /` health check), `TECHNOLOGIES_STUDY_GUIDE.md` (lines 71, 698, 1130, 1255), `BACKEND_REPORT.md`'s own prose (line 247, 700-702), `SOUTENANCE_TECHNIQUE_GUIDE.md` line 143 ("~50 of 62 routes").

**"63" is used in:** `BACKEND_REPORT.md`'s own appendix header (line 606: *"Endpoints (63 total: 62 across 14 resource groups + 1 health check)"*) and `SOUTENANCE_TECHNIQUE_GUIDE.md` (lines 91, 139, 1147, 1181, 1224, 1492) — every one of these repeats "63 endpoints" **without** the "+1 health check" caveat that `BACKEND_REPORT.md` itself states.

**Confirmed today:** 62 real API routes across the 14 resource files, mounted under `/api/*`. Plus one more route, `GET /` at the app root (`src/app.js:46-54`), which returns a static status payload and isn't part of any resource — whether that counts as "an endpoint" is a definitional choice, not a fact in dispute.

**Decide:** pick one number and one definition for the report and say it the same way every time — e.g. "62 REST endpoints across 14 resources, plus one root health-check route." Right now a juror who reads two of your prep docs back to back gets two different totals with no visible reconciliation.

---

### 3. `PROJECT_ANALYSIS.md` cites a commit hash that no longer exists in this repo's history

**Claim** (line 668): *"**Commit**: `e0c4172` Add professional accounts, establishments, and app-wide theming (56 files changed, +3,875/−1,255 lines)"*

**Confirmed today:**
- `e0c4172` is a real git object (`git cat-file -t e0c4172` → `commit`) but **`git merge-base --is-ancestor e0c4172 HEAD` fails** — it is not reachable from the current branch. `git show e0c4172` will still work today (the object hasn't been garbage-collected yet) but there is no guarantee it'll still be there tomorrow, and `git log` will never show it.
- The commit **currently** carrying that exact message, on this branch, is `be11a39` (2026-07-10) — and its stat line is identical: `56 files changed, 3875 insertions(+), 1255 deletions(-)`.

**Why it drifted:** at some point this branch's history was rewritten (a rebase, or the mobile/backend repos being folded into one monorepo) — same commit content, new hash. `PROJECT_ANALYSIS.md` was written against the old hash before that rewrite.

**Decide:** if you cite this commit while writing offline, use `be11a39`, not `e0c4172` — the git log table in `PROJECT_FACTS.md` §9 already has the correct hash. I did not re-check every other commit hash `PROJECT_ANALYSIS.md` cites for the same problem (out of scope for today) — treat any hash from that specific file as unverified until you check it against `PROJECT_FACTS.md`'s git log tables or `git show <hash>` yourself.

---

## Not contradictions — just two different, both-correct scopes (worth stating the scope explicitly so they don't look like a mismatch)

### 4. Backend line count: "5,360" vs "~6,264" / "6,271" / "748 lines"

- `PROJECT_FACTS.md` §2 says **5,360 lines** — this is `src/` only (`find src -name "*.js" | xargs cat | wc -l`).
- `PFE_PRESENTATION_PREPARATION_GUIDE.md` (line 1024) and `SOUTENANCE_TECHNIQUE_GUIDE.md` (line 540) both say **"~6,264 lines"** — re-counted today with `find . -name "*.js" -not -path "./node_modules/*" | xargs wc -l` (whole backend repo: `src/` + `test/` + `scripts/` + `server.js`) → **6,264**, an exact match to both docs.
- `BACKEND_AUDIT.md` (line 189) says **"6,271 total lines"** for the same whole-repo scope — 7 lines higher than today's 6,264, most likely from small edits between when that audit was written and today (not investigated further; a 7-line drift is not worth chasing).
- The test-file line counts also differ by scope: `PROJECT_FACTS.md` gives `test/api.test.js` as **751 lines** today; `BACKEND_AUDIT.md` says **748** (line 68) — this is real drift, not a scope difference, and is explicitly already reconciled in `BACKEND_REPORT.md` line 470-472: *"751 lines ... re-measured — the audit's 748 is stale; two test bugs were fixed in commit `844808d`"*. So **751 is current and correct**; 748 is deliberately superseded, not a live contradiction.

**None of these are wrong** — they're measuring different things (`src/` vs the whole backend repo) or different points in time (before/after `844808d`). **Decide:** when you state a backend line count in the report, say which scope you mean ("5,360 lines of `src/`" vs "6,264 lines including tests and scripts") so it can't look like you have two different counts for the same thing.

### 5. `BACKEND_AUDIT.md`'s route-count-relative stats (64 routes) vs `BACKEND_REPORT.md`'s (62 routes)

`BACKEND_AUDIT.md` (pre-hardening) says `verifyToken` covers "~45 of 64 routes" and `validateRequest` "~40 routes" (line 168, 171, 391, 524) — at that point there were 64 routes, before 2 dead endpoints were removed in commit `4e9a447`. `BACKEND_REPORT.md` (post-hardening) gives exact counts against the current 62: **`verifyToken`: 50, `validateRequest`: 39, `requireRole`+`isAdmin`: 26**.

**Re-verified today, directly against the code** (`grep` across all 14 route files, excluding the `require(...)` lines):
- `verifyToken` used as middleware: **50** occurrences — exact match to `BACKEND_REPORT.md`.
- `validateRequest` used as middleware: **39** — exact match.
- `requireRole(...)` + `isAdmin`: **10 + 16 = 26** — exact match.

This is not a contradiction — the audit's "64" numbers are simply from before the 2 endpoints were deleted, and `BACKEND_REPORT.md` explicitly supersedes them. All three of `BACKEND_REPORT.md`'s current numbers check out exactly against today's code. **Cite `BACKEND_REPORT.md`'s numbers, not `BACKEND_AUDIT.md`'s, if asked about middleware coverage.**

---

## Confirmed NOT stale (checked today, no action needed — listed so you don't waste time re-checking these)

| Claim | Where repeated | Confirmed today |
|---|---|---|
| 57 mobile screens | `MIGRATION_REPORT.md`, `SOUTENANCE_TECHNIQUE_GUIDE.md`, `TECHNOLOGIES_STUDY_GUIDE.md`, `PFE_PRESENTATION_PREPARATION_GUIDE.md`, `DEFENSE_DEMO.md` | ✅ 57 |
| 15 Mongoose models | `SOUTENANCE_TECHNIQUE_GUIDE.md`, `TECHNOLOGIES_STUDY_GUIDE.md` (multiple places) | ✅ 15 |
| 14 route files / 14 controller files | `SOUTENANCE_TECHNIQUE_GUIDE.md` line 533, 1291-1292 | ✅ 14 / 14 |
| 108 mobile TS/TSX files, ~27,800 lines | `SOUTENANCE_TECHNIQUE_GUIDE.md`, `PFE_PRESENTATION_PREPARATION_GUIDE.md`, `TECHNOLOGIES_STUDY_GUIDE.md` | ✅ 108 files, 27,763 lines (close enough to "~27,800" to not be an issue) |
| 25 backend tests, 61 mobile tests, 3 mobile test files | Repeated identically across `BACKEND_REPORT.md`, `SOUTENANCE_TECHNIQUE_GUIDE.md`, `TECHNOLOGIES_STUDY_GUIDE.md`, `PFE_PRESENTATION_PREPARATION_GUIDE.md`, `DEFENSE_DEMO.md`, `MIGRATION_REPORT.md` | ✅ both re-run today, exact match |
| 0 TypeScript errors, 0 ESLint errors, 74 ESLint warnings | `MIGRATION_REPORT.md`, `SOUTENANCE_TECHNIQUE_GUIDE.md` | ✅ re-run today, exact match |
| `pickFields` duplicated across 5 controllers | `BACKEND_AUDIT.md`, `PFE_PRESENTATION_PREPARATION_GUIDE.md` | ✅ confirmed present in `establishment`, `patientResource`, `recipe`, `product` (as `pickProductFields`) controllers, plus an inlined `.reduce()` in `event.controller.js` — still true, not fixed |
| No pagination / base64 images / JWT role staleness (the 3 `LIMITATIONS.md` items) | `BACKEND_REPORT.md`, `BACKEND_AUDIT.md`, `PFE_PRESENTATION_PREPARATION_GUIDE.md` | ✅ all 3 still true in current code |

---

## Flagged in `PROJECT_FACTS.md`, cross-referenced here

- **`@google/generative-ai`** is declared in `glutenia-mobile/package.json` but has zero references anywhere in `glutenia-mobile/src` (confirmed by grep today) — dead weight, leftover from before the backend switched label-scanning from Gemini to Groq (commit `a0f84ac`). The backend's own copy was already removed in the hardening pass (`24890cd`); the mobile one was missed. Not mentioned as an issue in any of the study/defense docs — worth deciding whether to remove it or leave it named as a known loose end.
- **Root `glutenia/package.json`** describes itself as *"Render entrypoint for the Glutenia backend service"* but declares `expo` as a dependency — inconsistent with its own stated purpose. Not mentioned in any doc.
- **`noUncheckedIndexedAccess` audit (42 errors / 13 files)** — `MIGRATION_REPORT.md` states this as re-verified "today" (whenever that document was written); **not independently re-verified in this session** because the scratch `tsconfig.strict-audit.json` it references no longer exists in the repo. Not a contradiction — just something you'd be citing on that report's word alone, not today's, if you use it.

---

## What this check did not cover

- Full prose read of `PFE_PRESENTATION_PREPARATION_GUIDE.md` (1000+ lines), `SOUTENANCE_TECHNIQUE_GUIDE.md` (1500+ lines), `TECHNOLOGIES_STUDY_GUIDE.md` (1500+ lines), `DEFENSE_DEMO.md`, `PROJECT_ANALYSIS.md` — only every numeric claim in these was grepped and spot-checked. A qualitative claim in one of them (e.g. "screen X does Y") was not verified against the current screen's code unless it happened to also carry a number.
- The gamification-specific docs (`glutenia-gamification-*.md`, 5 files) were not checked at all — out of scope for today given the time available; if your report draws on those, they'd need their own pass.
- Every other commit hash `PROJECT_ANALYSIS.md` cites besides `e0c4172` — only that one was spot-checked (see finding 3). Treat other hashes in that file as unverified.
