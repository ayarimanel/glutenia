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
export type EstablishmentCategory = "Supermarket" | "Restaurant" | "Health Store" | "Bakery" | "Pharmacy" | "Other";
export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered";
export type BadgeCategory = "scanner" | "safety" | "community" | "shopper" | "streak" | "journey";
export type BadgeTrack = "warrior" | "supporter" | "both";
export type ScanType = "barcode" | "label";
export type ScanVerdict = "safe" | "caution" | "unsafe" | "error";

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
  category: ProductCategory;
  imageUrl?: string;
  isGlutenFree: boolean;
  createdBy: string | null;
  createdAt: string;
  barcode?: string;
}

export interface Listing {
  _id: string;
  product: string;
  professional: string;
  price: number;
  stock: number;
  isAvailable: boolean;
  createdAt: string;
  name: string;
  description?: string;
  category: ProductCategory;
  imageUrl?: string;
  isGlutenFree: boolean;
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

export interface CommunityProductUser {
  _id: string;
  name: string;
  email: string;
}

export interface AdminCommunityProduct extends Omit<CommunityProduct, "submittedBy" | "flaggedBy"> {
  submittedBy: CommunityProductUser | null;
  flaggedBy: CommunityProductUser[];
}

export interface MissingBarcode {
  _id: string;
  barcode: string;
  scanCount: number;
  userCount: number;
  lastScannedAt: string;
  createdAt: string;
}

export interface EstablishmentOwnerSummary {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface Establishment {
  _id: string;
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
  type: string;
  title: string;
  body: string;
  referenceId: string | null;
  read: boolean;
  createdAt: string;
}

export interface OrderItem {
  product: string;
  listing: string;
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

export interface OrderSellerStatus {
  professional: string | null;
  status: OrderStatus;
}

export interface OrderStatusChange {
  status: OrderStatus;
  changedBy: string | null;
  role: "customer" | "professional" | "admin";
  seller: string | null;
  date: string;
}

export interface Order {
  _id: string;
  user: string;
  items: OrderItem[];
  total: number;
  deliveryFee: number;
  address: OrderAddress;
  status: OrderStatus;
  sellerStatuses: OrderSellerStatus[];
  statusHistory: OrderStatusChange[];
  allowedActions: OrderStatus[];
  createdAt: string;
}

export type OrderWithBuyer = Omit<Order, "user"> & { user: EstablishmentOwnerSummary };

export type SellerOrder = OrderWithBuyer & { sellerStatus: OrderStatus };

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
  product: { _id: string; name: string; imageUrl: string } | null;
  createdAt: string;
}

export interface LabelScanResult {
  verdict: ScanVerdict;
  flagged: { ingredient: string; reason: string }[];
  safe_highlights: string[];
  raw_text: string;
  confidence: "high" | "medium" | "low";
  confidence_note: string | null;
  error: string | null;
  scanId: string | null;
  gamification: GamificationDelta | null;
}

export interface AdminUserDetail {
  user: User;
  gamification: {
    totalXp: number;
    currentLevel: number;
    currentStreak: number;
    longestStreak: number;
  } | null;
  orderCount: number;
  establishment: Pick<Establishment, "_id" | "name" | "category" | "verified"> | null;
}

export interface UserAnalytics {
  totalUsers: number;
  byRole: Record<string, number>;
  byRoleType: Record<string, number>;
  byExperienceLevel: Record<string, number>;
  byPrimaryGoal: Record<string, number>;
  byEatingOutFrequency: Record<string, number>;
  byConfidence: Record<string, number>;
  signupTrend: { date: string; count: number }[];
}
