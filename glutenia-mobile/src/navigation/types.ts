import type { NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type {
  EatingOutFrequency,
  Event,
  ExperienceLevel,
  GamificationDelta,
  Order,
  OrderWithBuyer,
  PatientResource,
  PrimaryGoal,
  Recipe,
  RoleType,
} from "../types/models";
import type { IconName } from "../components/AppIcon";

export type CreatedOrder = Order & { gamification: GamificationDelta | null };

// RecipesScreen maps every Recipe through `{ ...r, id: r._id, image: r.imageUrl }`
// before handing it to RecipeDetailScreen (which reads `recipe.id`/`recipe.image`,
// not `_id`/`imageUrl`) - so the real navigated shape is Recipe plus these two
// extra fields, not Recipe itself.
export type RecipeWithImage = Recipe & { id: string; image: string };

// PatientResourcesScreen's resolveVisuals() adds these fields client-side
// (derived from category, same mapping the category chips use) before
// handing a resource to ResourceDetailScreen, which reads resource.icon/
// bg/color/readTime alongside the normal PatientResource fields.
export type ResolvedPatientResource = PatientResource & {
  icon: IconName;
  bg: string;
  color: string;
  readTime: string;
};

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
  ProductDetail: { productId: string };
  Checkout: undefined;
  OrderSuccess: { order: CreatedOrder };
  Orders: undefined;
  EventDetail: { event: Event };
  Notifications: undefined;
  BadgeCollection: undefined;
  MapDetail: { spot: MapSpot };
  FavoritePlaces: undefined;
  ShopScreen: undefined;
  PatientResources: undefined;
  VideoPlayer: { youtubeId: string; title: string };
  ResourceDetail: { resource: ResolvedPatientResource };
  Recipes: undefined;
  RecipeDetail: { recipe: RecipeWithImage };
  Settings: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  LabelScan: undefined;
  SubmitProduct: { barcode: string };
  SellerProducts: undefined;
  SellerProductForm: { productId?: string } | undefined;
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
  AdminProductForm: { productId?: string } | undefined;
  AdminEvents: undefined;
  AdminProfessionalRequests: undefined;
  AdminOrderDetail: { order: OrderWithBuyer };
  AdminAnalytics: undefined;
  AdminRecipes: undefined;
  AdminRecipeForm: { recipeId?: string } | undefined;
  AdminPatientResources: undefined;
  AdminPatientResourceForm: { resourceId?: string } | undefined;
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
