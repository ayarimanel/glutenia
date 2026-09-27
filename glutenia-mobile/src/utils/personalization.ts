// Shared personalization layer: every screen that wants to react to what
// onboarding learned about the user (role_type, experience_level,
// primary_goal, eating_out_frequency, confidence_identifying_gf) reads from
// here instead of hand-rolling its own lookup. Every export is a pure
// function of plain data — no React/Expo/RN imports — so behavior can be
// checked with a plain `node` script.

import type { PrimaryGoal, User } from "../types/models";

export type { PrimaryGoal };

export type QuickAccessId = "products" | "events" | "favorites" | "map";

// Derived directly from User (not hand-duplicated) so it stays structurally
// identical to what AuthContext/useAuth actually provide - including the
// `| null` (not `| undefined`) convention every one of these fields uses.
export type PersonalizationUser = Pick<
  User,
  "confidence_identifying_gf" | "experience_level" | "eating_out_frequency" | "primary_goal"
>;

const QUICK_ACCESS_DEFAULT_ORDER: QuickAccessId[] = ["products", "events", "favorites", "map"];

// Surfaces the most relevant Quick Access card first based on why the user
// said they're here. Exhaustive over every primary_goal enum value —
// "exploring" is an explicit choice (products first, a low-commitment
// way to browse without any goal-specific detour).
const QUICK_ACCESS_ORDER_BY_GOAL: Record<PrimaryGoal, QuickAccessId[]> = {
  manage_celiac: ["favorites", "products", "map", "events"],
  manage_intolerance: ["favorites", "products", "map", "events"],
  support_child: ["products", "favorites", "events", "map"],
  support_partner: ["products", "favorites", "events", "map"],
  dietary_choice: ["products", "map", "events", "favorites"],
  exploring: QUICK_ACCESS_DEFAULT_ORDER,
};

export function getHomeQuickAccessOrder(primaryGoal?: PrimaryGoal): QuickAccessId[] {
  return (primaryGoal && QUICK_ACCESS_ORDER_BY_GOAL[primaryGoal]) || QUICK_ACCESS_DEFAULT_ORDER;
}

// Reorders (never hides) ShopScreen's category chips. "All" always stays
// first. Product has no field beyond category/price/stock to personalize
// against, so this stays a light nudge — categories most relevant to the
// user's stated goal move earlier — not a "recommended for you" claim the
// data can't back up.
const CATEGORY_PRIORITY_BY_GOAL: Partial<Record<PrimaryGoal, string[]>> = {
  manage_celiac: ["Bread", "Flour"],
  manage_intolerance: ["Bread", "Flour"],
  dietary_choice: ["Snacks", "Sweets"],
};

export function getShopCategoryOrder(
  categories: string[] | null | undefined,
  user?: PersonalizationUser
): string[] | null | undefined {
  if (!Array.isArray(categories)) return categories;
  const priority = (user?.primary_goal && CATEGORY_PRIORITY_BY_GOAL[user.primary_goal]) || [];

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
