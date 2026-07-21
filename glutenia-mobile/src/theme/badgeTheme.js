// Design tokens for the badge/achievement visual system. Colors are derived
// from the app's existing brand palette (theme/colors.js) — this file adds
// tier and category tokens on top of it, it doesn't invent a new palette.

// ---- Color math (no color lib in the project — small local helpers) ----

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex({ r, g, b }) {
  const toHex = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// amount: -1 (black) .. 0 (unchanged) .. 1 (white)
export function shade(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const target = amount >= 0 ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
  const t = Math.abs(amount);
  return rgbToHex({
    r: r + (target.r - r) * t,
    g: g + (target.g - g) * t,
    b: b + (target.b - b) * t,
  });
}

export function mix(hexA, hexB, amount) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return rgbToHex({
    r: a.r + (b.r - a.r) * amount,
    g: a.g + (b.g - a.g) * amount,
    b: a.b + (b.b - a.b) * amount,
  });
}

export function withAlpha(hex, alpha) {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

// ---- Category colors ----
// Matches the category coloring already shipped on the badge list screen,
// kept identical so earned-badge colors don't shift under existing users.
export const CATEGORY_COLORS = {
  journey: "#8BC34A", // primary green
  scanner: "#7B4626", // secondary brown
  community: "#9C27B0",
  safety: "#FF9800",
  shopper: "#2196F3",
  streak: "#E85D2C",
};

const GOLD_ACCENT = "#FFC94A";
const PLATINUM_ACCENT = "#E6ECF5";

// ---- Rarity tiers ----
// Each tier controls how "precious" a badge medallion looks: how bright its
// gradient runs, whether it gets an outer glow ring, and ring thickness.
export const TIERS = ["bronze", "silver", "gold", "platinum"];

export const TIER_TOKENS = {
  bronze: {
    ringWidth: 2,
    glow: false,
    glowRadius: 0,
    highlightMix: 0.08,
    accentMix: 0,
  },
  silver: {
    ringWidth: 2.5,
    glow: false,
    glowRadius: 0,
    highlightMix: 0.22,
    accentMix: 0,
  },
  gold: {
    ringWidth: 3,
    glow: true,
    glowRadius: 10,
    highlightMix: 0.3,
    accentMix: 0.22,
    accentColor: GOLD_ACCENT,
  },
  platinum: {
    ringWidth: 3.5,
    glow: true,
    glowRadius: 16,
    highlightMix: 0.4,
    accentMix: 0.28,
    accentColor: PLATINUM_ACCENT,
  },
};

// Builds the gradient stops + ring/glow colors for a given category+tier pair.
export function getBadgeVisualTokens(category, tier) {
  const base = CATEGORY_COLORS[category] || "#6C757D";
  const tokens = TIER_TOKENS[tier] || TIER_TOKENS.bronze;

  let highlight = shade(base, tokens.highlightMix);
  let core = base;
  const deep = shade(base, -0.18);

  if (tokens.accentMix > 0 && tokens.accentColor) {
    highlight = mix(highlight, tokens.accentColor, tokens.accentMix);
    core = mix(core, tokens.accentColor, tokens.accentMix * 0.35);
  }

  return {
    gradient: [highlight, core, deep],
    ringColor: tokens.accentMix > 0 && tokens.accentColor ? tokens.accentColor : shade(base, -0.1),
    glow: tokens.glow,
    glowColor: tokens.accentColor || base,
    glowRadius: tokens.glowRadius,
    ringWidth: tokens.ringWidth,
    base,
  };
}

// ---- Badge slug -> rarity tier ----
// Rarity follows how much effort the threshold represents relative to other
// badges in the same track (first action vs. sustained/high-volume use).
export const BADGE_TIER_MAP = {
  first_scan: "bronze",
  ten_scans: "silver",
  fifty_scans: "gold",
  hundred_scans: "platinum",
  label_master: "gold",
  event_attendee: "bronze",
  event_regular: "silver",
  first_order: "bronze",
  five_orders: "silver",
  twenty_orders: "gold",
  streak_7: "silver",
  streak_30: "gold",
  streak_100: "platinum",
  first_month: "bronze",
  one_year: "gold",
};

export function getBadgeTier(slug) {
  return BADGE_TIER_MAP[slug] || "bronze";
}
