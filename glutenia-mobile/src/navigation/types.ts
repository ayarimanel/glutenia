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
  coverImageUrl?: string | null;
  isReal?: boolean;
  verified?: boolean;
  phone?: string;
  hours?: string;
}

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

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootParamList {}
  }
}

export type AppNavigation = NativeStackNavigationProp<RootParamList>;
