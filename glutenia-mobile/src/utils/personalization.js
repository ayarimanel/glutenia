// Shared personalization layer: every screen that wants to react to what
// onboarding learned about the user (role_type, experience_level,
// primary_goal, eating_out_frequency, confidence_identifying_gf) reads from
// here instead of hand-rolling its own lookup. Every export is a pure
// function of plain data — no React/Expo/RN imports — so behavior can be
// checked with a plain `node` script.

const QUICK_ACCESS_DEFAULT_ORDER = ["recipes", "events", "patientResources", "map"];

// Surfaces the most relevant Quick Access card first based on why the user
// said they're here. Exhaustive over every primary_goal enum value —
// "exploring" used to fall through to the default order silently by
// omission; it's now an explicit choice (recipes first, a low-commitment
// way to browse without any goal-specific detour).
const QUICK_ACCESS_ORDER_BY_GOAL = {
  manage_celiac: ["patientResources", "recipes", "map", "events"],
  manage_intolerance: ["patientResources", "recipes", "map", "events"],
  support_child: ["recipes", "patientResources", "events", "map"],
  support_partner: ["recipes", "patientResources", "events", "map"],
  dietary_choice: ["recipes", "map", "events", "patientResources"],
  exploring: QUICK_ACCESS_DEFAULT_ORDER,
};

export function getHomeQuickAccessOrder(primaryGoal) {
  return QUICK_ACCESS_ORDER_BY_GOAL[primaryGoal] || QUICK_ACCESS_DEFAULT_ORDER;
}

// RecipesScreen's default active category filter. "Easy" is the better
// starting point for anyone likely to want simple recipes right now — just
// getting started, not confident identifying gluten yet, or eating out
// often enough that quick/simple home cooking is the more useful default.
// Everyone else keeps today's "Tunisian" default.
export function getRecipeDefaultFilter(user) {
  const isBeginner =
    user?.confidence_identifying_gf === "low" ||
    user?.experience_level === "just_started";
  const eatsOutOften =
    user?.eating_out_frequency === "weekly" || user?.eating_out_frequency === "multiple_week";

  if (isBeginner || eatsOutOften) return "Easy";
  return "Tunisian";
}

// Stable re-sort of the full recipe list so already-popular items surface
// slightly earlier — doesn't add, remove, or duplicate anything; screens
// still apply their own category filter afterward exactly as before.
export function rankRecipes(recipes, user) {
  if (!Array.isArray(recipes)) return recipes;
  return recipes
    .map((recipe, index) => ({ recipe, index }))
    .sort((a, b) => {
      const aScore = a.recipe?.popular ? 1 : 0;
      const bScore = b.recipe?.popular ? 1 : 0;
      if (aScore !== bScore) return bScore - aScore;
      return a.index - b.index;
    })
    .map(({ recipe }) => recipe);
}

// Reorders (never hides) ShopScreen's category chips. "All" always stays
// first. Product has no field beyond category/price/stock to personalize
// against, so this stays a light nudge — categories most relevant to the
// user's stated goal move earlier — not a "recommended for you" claim the
// data can't back up.
const CATEGORY_PRIORITY_BY_GOAL = {
  manage_celiac: ["Bread", "Flour"],
  manage_intolerance: ["Bread", "Flour"],
  dietary_choice: ["Snacks", "Sweets"],
};

export function getShopCategoryOrder(categories, user) {
  if (!Array.isArray(categories)) return categories;
  const priority = CATEGORY_PRIORITY_BY_GOAL[user?.primary_goal] || [];

  return [...categories].sort((a, b) => {
    if (a === "All") return -1;
    if (b === "All") return 1;
    const aIndex = priority.indexOf(a);
    const bIndex = priority.indexOf(b);
    const aRank = aIndex === -1 ? priority.length : aIndex;
    const bRank = bIndex === -1 ? priority.length : bIndex;
    return aRank - bRank;
  });
}
