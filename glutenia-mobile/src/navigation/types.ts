import type { NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type {
  EatingOutFrequency,
  Establishment,
  Event,
  ExperienceLevel,
  GamificationDelta,
  Order,
  OrderWithBuyer,
  PrimaryGoal,
  RoleType,
} from "../types/models";
import type { IconName } from "../components/AppIcon";

export type CreatedOrder = Order & { gamification: GamificationDelta | null };

// FavoritePlacesScreen/MapScreen's "spot" shape — a client-side mix of
// static demo spots (getSpots() in MapScreen) and real Establishment
// records normalized into the same shape (normalizeEstablishment() in
// MapScreen). User.favoriteSpots is Mixed/heterogeneous on the backend, no
// fixed shape enforced there - this is derived from every field actually
// read across MapScreen/MapDetailScreen/FavoritePlacesScreen, not the
// backend model. `id` matches Establishment._id for real spots, or a
// small hardcoded string ("1".."10") for static demo spots.
export interface MapSpot {
  id: string;
  name: string;
  type: string;
  address: string;
  emoji: string;
  rating: number;
  reviews: number | string;
  distance: string;
  avgPrice: string;
  coordinate: { latitude: number; longitude: number } | null;
  description: string;
  tags: string[];
  color: string;
  accentEmoji: string;
  // Only present on real (normalizeEstablishment-derived) spots, never on
  // the static demo catalog.
  coverImageUrl?: string | null;
  isReal?: boolean;
  verified?: boolean;
  phone?: string;
  hours?: string;
}

// Screens registered on the two Tab.Navigators nested inside UserStack/
// AdminStack. Kept separate from RootParamList (rather than nesting
// NavigatorScreenParams<RootParamList> inside itself) purely to avoid a
// circular type - TS can't resolve a mapped type that references its own
// container type through one of its properties.
type UserTabParamList = {
  Home: undefined;
  Events: undefined;
  Scan: undefined;
  Map: undefined;
  Profile: undefined;
};

type AdminTabParamList = {
  Dashboard: undefined;
  Products: undefined;
  Scan: undefined;
  Orders: undefined;
  Account: undefined;
};

// One flat list shared by every navigator (auth/user/admin/onboarding
// stacks, plus the two tab navigators nested inside them). The app already
// behaves this way in practice - the same route name can resolve to
// different components depending on which stack is mounted (e.g. "Orders",
// "Settings"), and some screens navigate to a role-dependent route name
// chosen at runtime (e.g. AdminProductsScreen picks "AdminProductForm" or
// "SellerProductForm") - so separate per-navigator param lists wouldn't
// reflect how navigation actually works here.
export type RootParamList = {
  Login: undefined;
  Register: undefined;
  ProfessionalPending: { approvalCode: string; email: string };
  Home: undefined;
  Events: undefined;
  Scan: undefined;
  Map: undefined;
  Profile: undefined;
  UserTabs: NavigatorScreenParams<UserTabParamList> | undefined;
  CartPage: undefined;
  // `productId` is the legacy entry point from a scan-history rail (which
  // only ever stored the catalog product's id, not a specific listing) -
  // ProductDetailScreen resolves that case to the cheapest available listing
  // itself. Prefer `listingId` everywhere a listing is already known.
  ProductDetail: { listingId: string } | { productId: string };
  Checkout: undefined;
  OrderSuccess: { order: CreatedOrder };
  Orders: undefined;
  MyOrders: undefined;
  EventDetail: { event: Event };
  Notifications: undefined;
  BadgeCollection: undefined;
  MapDetail: { spot: MapSpot };
  FavoritePlaces: undefined;
  ShopScreen: undefined;
  Settings: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  // barcode is set when coming from a barcode that wasn't found: the label
  // analysis then decides whether (and as what) the product can be added.
  LabelScan: { barcode?: string } | undefined;
  SubmitProduct: { barcode: string; isGlutenFree: boolean; labelScanId: string };
  SellerProducts: undefined;
  SellerProductForm: { listingId?: string } | undefined;
  SellerVisibility: undefined;
  SellerOrders: undefined;
  SellerEstablishment: undefined;
  SellerEstablishmentForm: undefined;
  Legal: { section: "privacy" | "terms" };
  DeleteAccount: undefined;
  EditJourney: undefined;
  AdminTabs: NavigatorScreenParams<AdminTabParamList> | undefined;
  Dashboard: undefined;
  Products: undefined;
  // barcode pre-fills a new product (from a barcode users scanned but
  // Glutenia didn't know).
  AdminProductForm: { productId?: string; barcode?: string } | undefined;
  AdminEvents: undefined;
  AdminEstablishments: undefined;
  AdminEstablishmentDetail: { establishment: Establishment };
  AdminProfessionalRequests: undefined;
  AdminOrderDetail: { order: OrderWithBuyer };
  AdminAnalytics: undefined;
  AdminUsers: undefined;
  AdminUserDetail: { userId: string };
  CreateEvent: { eventId?: string } | undefined;
  Account: undefined;
  Onboarding: undefined;
  OnboardingRole: undefined;
  OnboardingJourney: { roleType: RoleType };
  OnboardingGoal: { roleType: RoleType; experienceLevel: ExperienceLevel; glutenFreeSince: string };
  OnboardingEatingOut: {
    roleType: RoleType;
    experienceLevel: ExperienceLevel;
    glutenFreeSince: string;
    primaryGoal: PrimaryGoal;
  };
  OnboardingConfidence: {
    roleType: RoleType;
    experienceLevel: ExperienceLevel;
    glutenFreeSince: string;
    primaryGoal: PrimaryGoal;
    eatingOutFrequency: EatingOutFrequency;
  };
};

// Standard React Navigation TypeScript pattern: this makes untyped
// `useNavigation()`/`navigation` prop usages resolve against RootParamList
// automatically, once screens are converted in a later phase - no generic
// type argument needed at each call site.
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootParamList {}
  }
}

// A screen's `navigation` prop, typed against the one shared RootParamList
// rather than the specific Stack/Tab navigator that happens to render it
// (see the flat-list rationale above) - reused across every screen instead
// of each one importing NativeStackNavigationProp/BottomTabNavigationProp
// and repeating the same generic argument.
export type AppNavigation = NativeStackNavigationProp<RootParamList>;
