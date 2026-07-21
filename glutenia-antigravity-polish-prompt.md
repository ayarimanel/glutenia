# Antigravity task: Visual/UX polish pass on Glutenia's gamification & badge experience

## Context (read this first — you have no memory of prior work on this repo)

Glutenia is a React Native (Expo) + Node/Express/MongoDB app for people managing a gluten-free
lifestyle. It has a gamification system (XP, levels, streaks, badges) that was just rebuilt
end-to-end: the reward-awarding backend logic was already correct, and a brand-new badge visual
system, badge grid, badge detail modal, and unlock-celebration animation were just built on top of
it. Everything is *functionally* complete and wired to real data — nothing in this prompt is about
making things work. This is a pure design/UX refinement pass: make it look and feel like it belongs
in a premium, award-winning consumer app, without changing what any of it does.

Do not modify backend code, data models, or API contracts. Do not change navigation structure,
route names, or what data is fetched. Only touch presentation: colors, typography, spacing,
animation timing/easing, icon/illustration choices, and layout polish. If you find a genuine
functional bug while doing this (not just a visual rough edge), flag it in your summary rather than
silently changing behavior.

## The app's existing design language (respect this — do not invent a new one)

- Design tokens live in `glutenia-mobile/src/theme/colors.js`: `Colors`, `Spacing` (xs=4, sm=8,
  md=16, lg=24, xl=32), `Radius` (sm=8, md=12, lg=16, xl=24, pill=999), `Shadow` (a single shared
  soft-shadow recipe used on nearly every card in the app).
- Light/dark palettes live in `glutenia-mobile/src/context/ThemeContext.js` as `lightColors` /
  `darkColors`, consumed everywhere via `useTheme()`. Primary brand color is a leaf green
  (`#8BC34A`), secondary is an earthy brown (`#7B4626`). Every component must work correctly in
  both light and dark mode — check both.
- Icons come from `lucide-react-native`, either through the shared `AppIcon` wrapper
  (`glutenia-mobile/src/components/AppIcon.js`) or imported directly (both patterns are used in the
  existing codebase — follow whichever the file you're editing already uses). Do not introduce a
  new icon library.
- Modals in this app follow one consistent recipe: a `Modal transparent` with a `Pressable`
  backdrop (`rgba(0,0,0,0.5)` light / `rgba(0,0,0,0.7)` dark), a centered card
  (`borderRadius: 24`, `padding: 24`, `maxWidth: 320-340`), and a scale+fade entrance
  (`Animated.timing`, ~250-260ms, `Easing.bezier(0.16, 1, 0.3, 1)`). See
  `glutenia-mobile/src/components/CustomAlertDialog.js` as the canonical reference.
- Animation is done with React Native's core `Animated` API throughout the app (not Reanimated,
  Moti, or Lottie — those aren't used anywhere despite `react-native-reanimated` being in
  `package.json` as a transitive dependency of other libraries). Keep using core `Animated` for
  consistency; do not introduce a new animation library.
- No `expo-linear-gradient` is installed. Gradients are built with `react-native-svg`'s
  `<Defs><LinearGradient>` primitives (already used for the badge medallions — see below).

## What was just built (your subject matter)

1. **`glutenia-mobile/src/theme/badgeTheme.js`** — design tokens for the badge system: category
   colors (`CATEGORY_COLORS`, one per badge category: journey/scanner/community/safety/shopper/
   streak), a 4-tier rarity system (`bronze`/`silver`/`gold`/`platinum` in `TIER_TOKENS`, controlling
   gradient brightness, ring width, and glow), a `BADGE_TIER_MAP` assigning each of the 15 catalog
   badges to a tier, and small hex color-math helpers (`shade`, `mix`, `withAlpha`) since there's no
   color library in the project.

2. **`glutenia-mobile/src/components/BadgeIcon.js`** — the single reusable badge medallion
   component. Renders an SVG circular "coin": gradient fill (category color, brightened per tier),
   a stroke ring (thicker/brighter at higher tiers), a centered `lucide-react-native` icon per badge
   slug (see `BADGE_ICONS` map at the top of the file), a diagonal glossy highlight ellipse, and —
   when `locked` — a desaturated gray fill, muted icon color, and a small corner lock-badge overlay
   (mirrors the existing avatar role-badge corner-overlay pattern already used on
   `AccountScreen.js`). When `locked` and given a `progressRatio`, it also draws a thin partial
   progress ring around the medallion. This component is used in exactly three places: the badge
   grid, the badge detail modal, and the unlock celebration — it must stay the *only* place badge
   visuals are drawn.

3. **`glutenia-mobile/src/components/BadgeDetailModal.js`** — tap-to-view detail modal (follows the
   `CustomAlertDialog` modal recipe above). Shows a large (112px) `BadgeIcon`, a tier+category pill,
   name, description, a "How to unlock" requirement line, a progress bar (locked badges only), a
   "date earned" pill (unlocked badges only), and an optional CTA button that deep-links to the
   screen where the badge's action happens (e.g. "Go scan a product" → Scan tab).

4. **`glutenia-mobile/src/screens/user/BadgeCollectionScreen.js`** — rebuilt from a flat list into a
   3-column responsive grid, with a summary card ("X of Y badges earned" + progress bar), an
   "Earned" section and a "Locked" section, each tile opening `BadgeDetailModal` on tap. Earned
   tiles keep the pre-existing pin/unpin affordance (max 3 pins) as a small corner button.

5. **`glutenia-mobile/src/components/GamificationUnlockModal.js`** — the "big moment" celebration
   shown when a badge unlocks or the user levels up (queued if multiple fire from one action).
   Badge unlocks now show the real `BadgeIcon` medallion (spring-scale entrance) with a one-shot
   particle burst (`ParticleBurst`, 8 small dots flying outward, tier-colored) and a diagonal shine
   sweep (`ShineSweep`) across the badge face. Level-ups keep a simpler trophy-style treatment (no
   specific badge art exists for a level-up). Routine XP gains still show a separate, much lighter
   toast — `glutenia-mobile/src/components/GamificationToast.js` — which was deliberately left
   untouched (small pill, top-of-screen, auto-dismiss ~2.2s).

6. **`glutenia-mobile/src/screens/AccountScreen.js`** — the Profile screen. Its pinned/recent badge
   preview row and its "in progress" badge list now both render through `BadgeIcon` instead of the
   old placeholder (a colored dot + text pill), so badge visuals are consistent between this preview
   and the full grid screen.

7. **`glutenia-mobile/src/screens/user/HomeScreen.js`** — has a small level/XP-bar/streak strip near
   the top (`gamStrip` styles), unrelated to badges directly but part of the same gamification
   surface — in scope for a consistency pass.

8. Badge display copy (name/description/unlock-requirement per badge, tier names, section labels,
   CTA labels) lives in the i18n locale files: `glutenia-mobile/src/i18n/locales/en.js`,
   `fr.js`, `ar.js`, under the `badges` key (`badges.catalog.<slug>.{name,description,requirement}`,
   `badges.tierNames`, `badges.detail.*`). The app supports French, Arabic (RTL-aware text, though
   layout isn't force-mirrored), and English — verify any layout change you make still reads
   correctly with longer French strings and with Arabic text.

## Your task

Do a full visual/UX polish pass over everything listed above — badges, the Achievements/Badges
Profile section, the badge detail modal, the unlock celebration, the XP/level/streak displays, and
related micro-interactions. Specifically:

1. **Color palette refinement.** Review `badgeTheme.js`'s tier/category color math (`shade`, `mix`,
   the gradient stop construction in `getBadgeVisualTokens`). Check every category+tier combination
   (24 total) renders with good contrast for the centered white icon, doesn't clash with the app's
   green/brown brand palette, and that the bronze→platinum progression actually *reads* as
   increasing rarity at a glance, in both light and dark mode. Adjust the tier tokens
   (`highlightMix`, `accentMix`, `glowRadius`, etc.) if any combination looks muddy, too similar to
   its neighbor tier, or clashes with a category color.

2. **Typography.** Audit font sizes/weights across `BadgeCollectionScreen.js` (summary text, section
   headers, tile names), `BadgeDetailModal.js` (name, description, requirement, pills), and
   `GamificationUnlockModal.js` (eyebrow, title, description) against the type scale actually used
   elsewhere in the app (check `AccountScreen.js` and `CustomAlertDialog.js` for the established
   hierarchy). Fix any inconsistency in size/weight/line-height that breaks that hierarchy.

3. **Spacing, padding, alignment.** Go tile-by-tile in the badge grid, section-by-section in the
   detail modal, and element-by-element in the celebration modal. Check the grid's 3-column math
   (`BadgeCollectionScreen.js`, `tileSize` calculation) looks balanced on both small phones (~360px
   wide) and large ones (~430px wide), and that the last (possibly partial) row doesn't look
   awkward. Verify safe-area handling on notch/dynamic-island devices for the grid header and the
   two modals.

4. **Animation and micro-interaction polish.** Review the entrance/exit timing and easing on
   `BadgeDetailModal`, the grid tile press feedback, the pin-toggle button, and especially
   `GamificationUnlockModal`'s `ParticleBurst` and `ShineSweep` (currently: 8 particles, 620ms
   stagger-out, a single diagonal shine sweep at 520ms). Judge whether the celebration reads as
   satisfying-but-not-excessive per Glutenia's calm, health-focused tone — tune particle count,
   distance, color, or timing if it feels either too subtle or too gimmicky. Make sure rapid
   multiple-unlock queuing (the `modalQueue` in `GamificationContext.js`) doesn't feel jarring when
   celebrations fire back-to-back.

5. **Icon/illustration quality and consistency.** Review the `BADGE_ICONS` map in `BadgeIcon.js` (15
   `lucide-react-native` icons, one per badge slug — e.g. `ScanLine` for first scan, `Crown` for 100
   scans, `Flame` reused across all three streak badges, `Sprout`/`Award` for the two journey
   badges). Judge whether each icon choice is immediately legible at small (grid tile, ~70-80px) and
   large (detail modal, 112px) sizes, whether icon weight/style feels consistent across the set, and
   whether reusing `Flame` for all three streak tiers is the right call or whether tier alone
   (color/glow) sufficiently differentiates them. Propose/implement better icon choices only within
   `lucide-react-native` (already installed) — do not add a new icon or illustration library.

6. **Empty states and edge cases.** Test and polish: a brand-new user (0 badges earned, all 15
   locked — should look inviting, not broken); a badge with an unusually long translated name or
   description (check the French and Arabic strings in the locale files, some run longer than
   English); a user who unlocks several badges from a single action (e.g. placing an order that
   simultaneously crosses an order-count and a streak threshold) and sees the celebrations queue.

7. **Overall visual consistency.** The end goal: someone browsing the Profile tab should not be able
   to tell the badge system was added after the fact — it should read as original, native
   Glutenia design. Cross-check against `AccountScreen.js`'s existing cards (XP card, stats card,
   role card, journey tracker) for shadow depth, corner radius, and card-background consistency.

## Constraints

- Do not add new npm dependencies. Everything needed (`react-native-svg`, `lucide-react-native`,
  core `Animated`, `react-i18next`) is already installed.
- Do not change the `Badge` data model, the gamification API responses, or any backend file under
  `glutenia-backend/`.
- Do not remove the pin/unpin functionality, the progress-ring-on-locked-badges behavior, or the
  CTA deep-links in the detail modal — restyle them, don't cut them.
- Keep all three locale files (`en.js`, `fr.js`, `ar.js`) in sync if you add or rename any
  `badges.*` or `gamification.*` translation key — every key that exists in one must exist,
  correctly translated, in all three.
- Test in both light and dark mode, and ideally in at least French alongside English, before calling
  anything done.

## Deliverable

Implement the improvements directly (this is a real, functioning app — not a mockup). At the end,
summarize what you changed and why, file by file, and flag anything you noticed but chose not to
touch (with reasoning), so it can be prioritized separately.
