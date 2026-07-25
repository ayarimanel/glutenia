// Domain model types mirroring glutenia-backend's Mongoose schemas and the
// exact shapes each controller actually sends. These are derived from
// reading src/models/*.js and src/controllers/*.js in glutenia-backend, not
// guessed — see the notes above fields whose shape depends on which
// endpoint returned them (populate varies per-endpoint, not per-model).

export type UserRole = "customer" | "admin" | "professional";
export type ProfessionalStatus = "pending" | "approved" | "rejected";
export type RoleType = "warrior" | "supporter";
export type ThemePreference = "light" | "dark";
export type Language = "en" | "fr" | "ar";
export type ExperienceLevel = "just_started" | "1_to_6_months" | "6_to_12_months" | "1_to_3_years" | "3_plus_years";
export type PrimaryGoal =
  | "manage_celiac"
  | "manage_intolerance"
  | "support_child"
  | "support_partner"
  | "dietary_choice"
  | "exploring";
export type EatingOutFrequency = "rarely" | "few_times_month" | "weekly" | "multiple_week";
export type ConfidenceLevel = "low" | "medium" | "high";

export type ProductCategory = "Bread" | "Pasta" | "Snacks" | "Flour" | "Sweets" | "Other";
export type EventCategory = "Meetups" | "Classes" | "Markets" | "Workshops";
export type RecipeCategory = "Quick" | "Tunisian" | "Easy";
export type PatientResourceCategory = "celiac" | "diet" | "safe" | "lifestyle";
export type EstablishmentCategory = "Supermarket" | "Restaurant" | "Health Store" | "Bakery" | "Pharmacy" | "Other";
export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered";
export type BadgeCategory = "scanner" | "safety" | "community" | "shopper" | "streak" | "journey";
export type BadgeTrack = "warrior" | "supporter" | "both";
export type ScanType = "barcode" | "label";
export type ScanVerdict = "safe" | "caution" | "unsafe" | "error";

// The User document as it comes back from the API. The backend's toJSON
// transform always strips `password` before serializing, so it's never part
// of this type.
export interface User {
  _id: string;
  name: string;
  avatar: string | null;
  phone: string;
  pushTokens: string[];
  pushNotificationsEnabled: boolean;
  notifyOrders: boolean;
  notifyEvents: boolean;
  theme_preference: ThemePreference | null;
  language: Language | null;
  email: string;
  role: UserRole;
  professionalStatus: ProfessionalStatus | null;
  approvalCode: string | null;
  role_type: RoleType | null;
  gluten_free_since: string | null;
  experience_level: ExperienceLevel | null;
  primary_goal: PrimaryGoal | null;
  eating_out_frequency: EatingOutFrequency | null;
  favoriteSpots: unknown[];
  confidence_identifying_gf: ConfidenceLevel | null;
  createdAt: string;
}

export interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: ProductCategory;
  imageUrl?: string;
  stock: number;
  isGlutenFree: boolean;
  createdBy: string | null;
  createdAt: string;
  // Sparse/unique on the backend — absent entirely on docs that never set it,
  // not just an empty string.
  barcode?: string;
}

export interface CommunityProduct {
  _id: string;
  barcode: string;
  name: string;
  imageUrl: string;
  isGlutenFree: boolean;
  brand: string | null;
  category: ProductCategory | null;
  submittedBy: string;
  flagCount: number;
  flaggedBy: string[];
  disputed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Recipe {
  _id: string;
  name: string;
  description: string;
  category: RecipeCategory;
  imageUrl: string;
  calories: number;
  carbo: number;
  protein: number;
  popular: boolean;
  ingredients: string[];
  preparation: string;
  createdBy: string | null;
  createdAt: string;
}

export interface PatientResource {
  _id: string;
  title: string;
  description: string;
  body: string;
  category: PatientResourceCategory;
  readTimeMinutes: number;
  featured: boolean;
  createdBy: string | null;
  createdAt: string;
}

export interface EstablishmentOwnerSummary {
  _id: string;
  name: string;
  email: string;
}

export interface Establishment {
  _id: string;
  // Populated to a summary object on getEstablishments/getEstablishmentById;
  // a raw id string everywhere else (getMyEstablishment, upsert, image upload).
  owner: string | EstablishmentOwnerSummary;
  name: string;
  category: EstablishmentCategory;
  description?: string;
  coverImageUrl?: string;
  address?: string;
  phone?: string;
  hours?: string;
  coordinates: { latitude: number | null; longitude: number | null };
  verified: boolean;
  createdAt: string;
}

// The raw Event schema has an `attendees` field, but every controller
// response runs through a `serialize()` helper that explicitly deletes it
// (replaced with `attendeeCount`/`isGoing`) before the JSON ever reaches the
// client — so `attendees` is intentionally absent from this type.
export interface Event {
  _id: string;
  title: string;
  description?: string;
  date: string;
  location: string;
  category: EventCategory;
  price: number;
  emoji: string;
  color: string;
  imageUrl: string;
  createdBy: string | null;
  createdAt: string;
  attendeeCount: number;
  isGoing: boolean;
}

export interface Notification {
  _id: string;
  user: string;
  // Free-form on the backend (no schema enum) — observed values include
  // "order_status", "event_join", "event_leave", "event_new",
  // "professional_approved", "professional_rejected".
  type: string;
  title: string;
  body: string;
  referenceId: string | null;
  read: boolean;
  createdAt: string;
}

export interface OrderItem {
  product: string;
  name: string;
  qty: number;
  price: number;
}

export interface OrderAddress {
  fullName: string;
  addressLine: string;
  city: string;
  phone: string;
}

export interface Order {
  _id: string;
  // A raw id string on createOrder/getMyOrders/updateOrderStatus - see
  // OrderWithBuyer below for the populated variant (getSellerOrders/
  // getAllOrders).
  user: string;
  items: OrderItem[];
  total: number;
  deliveryFee: number;
  address: OrderAddress;
  status: OrderStatus;
  createdAt: string;
}

// getSellerOrders/getAllOrders populate `user` to a summary object instead
// of leaving it as a raw id - a distinct type rather than a union on Order
// itself, since call sites always know which shape they have based on
// which endpoint they called.
export type OrderWithBuyer = Omit<Order, "user"> & { user: EstablishmentOwnerSummary };

export interface Badge {
  _id: string;
  slug: string;
  name: string;
  description: string;
  iconUrl: string | null;
  category: BadgeCategory;
  track: BadgeTrack;
  targetMetric: string;
  targetValue: number;
  targetField: string | null;
  targetEquals?: string[];
  xpReward: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserBadge {
  _id: string;
  userId: string;
  // Always populated to a full Badge doc on the one endpoint that returns
  // UserBadge records (getProfileGamification).
  badgeId: Badge;
  earnedAt: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LockedBadgeEntry {
  badge: Pick<Badge, "slug" | "name" | "description" | "category" | "targetMetric" | "targetValue" | "xpReward">;
  currentProgress: number;
  ratio: number;
}

export interface ProfileGamificationSummary {
  _id: string;
  userId: string;
  totalXp: number;
  currentTitle: string;
  currentStreak: number;
  longestStreak: number;
  streakShields: number;
  lastActivityDate: string | null;
  scanCount: number;
  ingredientCheckCount: number;
  eventAttendanceCount: number;
  orderCount: number;
  productContributionCount: number;
  createdAt: string;
  updatedAt: string;
  // These five are computed fresh on every response and overwrite/augment
  // whatever's stored on the raw UserGamification doc above.
  currentLevel: number;
  currentLevelMinXp: number;
  nextLevelXp: number;
  xpToNextLevel: number;
  progressRatio: number;
  engagementTitle: string;
}

export interface ProfileGamificationData {
  gamification: ProfileGamificationSummary;
  earnedBadges: UserBadge[];
  pinnedBadges: UserBadge[];
  inProgressBadges: LockedBadgeEntry[];
  lockedBadges: LockedBadgeEntry[];
}

export interface HomeGamificationSummary {
  currentLevel: number;
  totalXp: number;
  nextLevelXp: number;
  xpToNextLevel: number;
  progressRatio: number;
  currentStreak: number;
  engagementTitle: string;
}

export interface BadgeSummary {
  slug: string;
  name: string;
  description: string;
  category: BadgeCategory;
  xpReward: number;
}

// Embedded in the response of every action that can award XP (order
// creation, event RSVP-join, community product submission, barcode/label
// scan). The whole object can be `null` (the backend's own try/catch
// swallows gamification-service errors), and in at least one endpoint
// (submitCommunityProduct) individual fields can be `undefined` rather than
// the object itself being null — so every field here is optional, not just
// the object as a whole.
export interface GamificationDelta {
  xpGained?: number;
  leveledUp?: boolean;
  newLevel?: number;
  newTotalXp?: number;
  currentStreak?: number;
  badgesUnlocked?: BadgeSummary[];
}

export interface ScanHistoryEntry {
  _id: string;
  userId: string;
  scanType: ScanType;
  verdict: string | null;
  summary: string;
  // Populated to a name/image summary when the scan resolved to a real
  // Product; null for label scans and for barcode scans that only matched a
  // CommunityProduct entry.
  product: { _id: string; name: string; imageUrl: string } | null;
  createdAt: string;
}

export interface LabelScanResult {
  verdict: ScanVerdict;
  flagged: Array<{ ingredient: string; reason: string }>;
  safe_highlights: string[];
  raw_text: string;
  confidence: "high" | "medium" | "low";
  confidence_note: string | null;
  error: string | null;
  gamification: GamificationDelta | null;
}

export interface UserAnalytics {
  totalUsers: number;
  byRole: Record<string, number>;
  byRoleType: Record<string, number>;
  byExperienceLevel: Record<string, number>;
  byPrimaryGoal: Record<string, number>;
  byEatingOutFrequency: Record<string, number>;
  byConfidence: Record<string, number>;
  signupTrend: Array<{ date: string; count: number }>;
}
