import type { PrimaryGoal, User } from "../types/models";

export type { PrimaryGoal };

export type QuickAccessId = "products" | "events" | "favorites" | "map";

export type PersonalizationUser = Pick<
  User,
  "confidence_identifying_gf" | "experience_level" | "eating_out_frequency" | "primary_goal"
>;

const QUICK_ACCESS_DEFAULT_ORDER: QuickAccessId[] = ["products", "events", "favorites", "map"];

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
