import Constants from "expo-constants";
import { Platform } from "react-native";
import type {
  Badge,
  CommunityProduct,
  Establishment,
  EstablishmentCategory,
  Event,
  EventCategory,
  GamificationDelta,
  HomeGamificationSummary,
  Language,
  Notification,
  Order,
  OrderWithBuyer,
  PatientResource,
  PatientResourceCategory,
  PrimaryGoal,
  Product,
  ProductCategory,
  ProfileGamificationData,
  Recipe,
  RecipeCategory,
  ScanHistoryEntry,
  ThemePreference,
  User,
  UserAnalytics,
  UserRole,
  ConfidenceLevel,
  EatingOutFrequency,
  ExperienceLevel,
  RoleType,
  LabelScanResult,
  ProfessionalStatus,
} from "../types/models";

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");
const DEFAULT_TIMEOUT_MS = 20000;

const getHostFromExpo = (): string | null => {
  const hostUri: string | undefined =
    Constants.expoConfig?.hostUri ||
    (Constants.manifest as { debuggerHost?: string } | null)?.debuggerHost ||
    (Constants.manifest2 as { extra?: { expoClient?: { hostUri?: string } } } | null)?.extra?.expoClient?.hostUri;

  if (!hostUri) {
    return null;
  }

  return hostUri.split(":")[0];
};

export const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return trimTrailingSlash(process.env.EXPO_PUBLIC_API_URL);
  }

  const configuredUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  if (configuredUrl) {
    return trimTrailingSlash(configuredUrl);
  }

  const host = getHostFromExpo();
  if (host) {
    return `http://${host}:5000/api`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:5000/api";
  }

  return "http://localhost:5000/api";
};

export interface ApiError extends Error {
  status: number;
  data?: unknown;
}

interface RequestOptions extends Omit<RequestInit, "body" | "signal"> {
  token?: string;
  body?: unknown;
  timeoutMs?: number;
}

interface FormDataLike {
  append?: unknown;
  getParts?: unknown;
}

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { token, body, timeoutMs = DEFAULT_TIMEOUT_MS, ...rest } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const isFormData =
    !!body &&
    typeof body === "object" &&
    typeof (body as FormDataLike).append === "function" &&
    typeof (body as FormDataLike).getParts === "function";
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...((rest.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...rest,
      headers,
      signal: controller.signal,
      body: body ? (isFormData ? (body as BodyInit) : JSON.stringify(body)) : undefined,
    });
  } catch (error) {
    const requestError = new Error(
      (error as { name?: string }).name === "AbortError"
        ? "Server is taking too long to respond. Try again in a moment."
        : "Could not reach the server. Check your connection and try again."
    ) as ApiError;
    requestError.status = 0;
    throw requestError;
  } finally {
    clearTimeout(timeout);
  }

  const payload = await response.json().catch(() => ({
    success: false,
    message: "Invalid server response",
  }));

  if (!response.ok || payload.success === false) {
    const error = new Error(payload.message || "Request failed") as ApiError;
    error.status = response.status;
    error.data = payload.data;
    throw error;
  }

  return payload.data as T;
};

export interface AuthSession {
  token: string;
  user: User;
  pending?: false;
}

export interface RegisterPendingResult {
  pending: true;
  approvalCode: string;
  message: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}

export type UpdateProfileBody = Partial<{
  name: string;
  avatar: string | null;
  phone: string;
  pushNotificationsEnabled: boolean;
  notifyOrders: boolean;
  notifyEvents: boolean;
  theme_preference: ThemePreference;
  language: Language;
}>;

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export type ProductInput = Partial<{
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  imageUrl: string;
  stock: number;
  isGlutenFree: boolean;
  barcode: string;
}>;

export interface ImageUploadInput {
  uri: string;
  name?: string;
  type?: string;
}

export type RecipeInput = Partial<{
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
}>;

export type PatientResourceInput = Partial<{
  title: string;
  description: string;
  body: string;
  category: PatientResourceCategory;
  readTimeMinutes: number;
  featured: boolean;
}>;

export interface SubmitCommunityProductBody {
  barcode: string;
  name: string;
  imageUrl: string;
  isGlutenFree: boolean;
  brand?: string;
  category?: ProductCategory;
}

export type ProductScanResult =
  | (Product & { isCommunityReport?: false; gamification: GamificationDelta | null })
  | (CommunityProduct & { isCommunityReport: true; gamification: GamificationDelta | null });

export interface CreateOrderBody {
  items: Array<{ product: string; name: string; qty: number; price: number }>;
  total: number;
  deliveryFee: number;
  address: { fullName: string; addressLine: string; city: string; phone: string };
}

export interface RsvpResult {
  isGoing: boolean;
  attendeeCount: number;
  gamification: GamificationDelta | null;
}

export type EventInput = Partial<{
  title: string;
  description: string;
  date: string;
  location: string;
  category: EventCategory;
  price: number;
  emoji: string;
  color: string;
  imageUrl: string;
}>;

export type EstablishmentInput = Partial<{
  name: string;
  category: EstablishmentCategory;
  description: string;
  address: string;
  phone: string;
  hours: string;
  coverImageUrl: string;
  latitude: number;
  longitude: number;
}>;

export interface OnboardingProfileBody {
  roleType?: RoleType;
  glutenFreeSince?: string | null;
  experienceLevel?: ExperienceLevel;
  primaryGoal?: PrimaryGoal;
  eatingOutFrequency?: EatingOutFrequency;
  confidenceIdentifyingGf?: ConfidenceLevel;
}

interface ListParams {
  [key: string]: string | number | boolean | undefined;
}

const toQueryString = (params: ListParams = {}): string => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value) as [string, string][]
  ).toString();
  return query ? `?${query}` : "";
};

export const api = {
  login: (body: LoginBody) => request<AuthSession>("/auth/login", { method: "POST", body }),
  register: (body: RegisterBody) =>
    request<AuthSession | RegisterPendingResult>("/auth/register", { method: "POST", body }),
  me: (token: string, options: { timeoutMs?: number } = {}) =>
    request<User>("/auth/me", { token, ...options }),
  updateProfile: (token: string, body: UpdateProfileBody) =>
    request<User>("/auth/me", { method: "PUT", token, body, timeoutMs: 30000 }),
  registerPushToken: (token: string, expoPushToken: string) =>
    request<{ registered: boolean }>("/auth/push-token", { method: "POST", token, body: { token: expoPushToken } }),
  unregisterPushToken: (token: string, expoPushToken: string) =>
    request<{ registered: boolean }>("/auth/push-token", { method: "DELETE", token, body: { token: expoPushToken } }),
  changePassword: (token: string, body: ChangePasswordBody) =>
    request<{ message: string }>("/auth/change-password", { method: "PUT", token, body }),
  deleteAccount: (token: string, password: string) =>
    request<{ message: string }>("/auth/me", { method: "DELETE", token, body: { password } }),
  products: (params: ListParams = {}) => request<Product[]>(`/products${toQueryString(params)}`),
  product: (id: string) => request<Product>(`/products/${id}`),
  createProduct: (token: string, body: ProductInput) =>
    request<Product>("/products", { method: "POST", token, body }),
  updateProduct: (token: string, id: string, body: ProductInput) =>
    request<Product>(`/products/${id}`, { method: "PUT", token, body }),
  uploadProductImage: (token: string, id: string, image: ImageUploadInput) => {
    const formData = new FormData();
    formData.append("image", {
      uri: image.uri,
      name: image.name || `product-${id}.jpg`,
      type: image.type || "image/jpeg",
    } as unknown as Blob);

    return request<Product>(`/products/${id}/image`, {
      method: "PUT",
      token,
      body: formData,
      timeoutMs: 45000,
    });
  },
  deleteProduct: (token: string, id: string) => request<Product>(`/products/${id}`, { method: "DELETE", token }),
  myProducts: (token: string) => request<Product[]>("/products/mine", { token }),
  recipes: (params: ListParams = {}) => request<Recipe[]>(`/recipes${toQueryString(params)}`),
  recipe: (id: string) => request<Recipe>(`/recipes/${id}`),
  createRecipe: (token: string, body: RecipeInput) =>
    request<Recipe>("/recipes", { method: "POST", token, body, timeoutMs: 30000 }),
  updateRecipe: (token: string, id: string, body: RecipeInput) =>
    request<Recipe>(`/recipes/${id}`, { method: "PUT", token, body, timeoutMs: 30000 }),
  deleteRecipe: (token: string, id: string) =>
    request<{ message: string }>(`/recipes/${id}`, { method: "DELETE", token }),
  patientResources: (params: ListParams = {}) =>
    request<PatientResource[]>(`/patient-resources${toQueryString(params)}`),
  patientResource: (id: string) => request<PatientResource>(`/patient-resources/${id}`),
  createPatientResource: (token: string, body: PatientResourceInput) =>
    request<PatientResource>("/patient-resources", { method: "POST", token, body }),
  updatePatientResource: (token: string, id: string, body: PatientResourceInput) =>
    request<PatientResource>(`/patient-resources/${id}`, { method: "PUT", token, body }),
  deletePatientResource: (token: string, id: string) =>
    request<{ message: string }>(`/patient-resources/${id}`, { method: "DELETE", token }),
  productByBarcode: (barcode: string, token?: string) =>
    request<ProductScanResult>(`/products/barcode/${encodeURIComponent(barcode)}`, { token }),
  submitCommunityProduct: (token: string, body: SubmitCommunityProductBody) =>
    request<{ entry: CommunityProduct; gamification: GamificationDelta | null }>("/community-products", {
      method: "POST",
      token,
      body,
    }),
  flagCommunityProduct: (token: string, id: string) =>
    request<CommunityProduct>(`/community-products/${id}/flag`, { method: "POST", token }),
  createOrder: (token: string, body: CreateOrderBody) =>
    request<Order & { gamification: GamificationDelta | null }>("/orders", { method: "POST", token, body }),
  myOrders: (token: string) => request<Order[]>("/orders/my", { token }),
  allOrders: (token: string) => request<OrderWithBuyer[]>("/orders", { token }),
  sellerOrders: (token: string) => request<OrderWithBuyer[]>("/orders/seller", { token }),
  updateOrderStatus: (token: string, id: string, status: Order["status"]) =>
    request<Order>(`/orders/${id}/status`, { method: "PUT", token, body: { status } }),
  saveOnboardingProfile: (token: string, data: OnboardingProfileBody) =>
    request<{ user: User }>("/onboarding/profile", { method: "PUT", token, body: data }),
  getGamificationProfile: (token: string) => request<ProfileGamificationData>("/gamification/profile", { token }),
  getHomeGamification: (token: string) => request<HomeGamificationSummary>("/gamification/home", { token }),
  updateBadgePin: (token: string, badgeId: string, isPinned: boolean) =>
    request<{ isPinned: boolean }>(`/gamification/badges/${badgeId}/pin`, {
      method: "PUT",
      token,
      body: { isPinned },
    }),
  scanLabel: (imageBase64: string, token: string) =>
    request<LabelScanResult>("/scan/label", {
      method: "POST",
      token,
      body: { imageBase64, mimeType: "image/jpeg" },
      timeoutMs: 30000,
    }),
  scanHistory: (token: string) => request<ScanHistoryEntry[]>("/scan/history", { token }),
  events: (token: string) => request<Event[]>("/events", { token }),
  event: (id: string, token: string) => request<Event>(`/events/${id}`, { token }),
  createEvent: (token: string, body: EventInput) => request<Event>("/events", { method: "POST", token, body }),
  updateEvent: (token: string, id: string, body: EventInput) =>
    request<Event>(`/events/${id}`, { method: "PUT", token, body }),
  deleteEvent: (token: string, id: string) =>
    request<{ message: string }>(`/events/${id}`, { method: "DELETE", token }),
  rsvpEvent: (token: string, id: string) => request<RsvpResult>(`/events/${id}/rsvp`, { method: "POST", token }),
  userAnalytics: (token: string) => request<UserAnalytics>("/users/analytics", { token }),
  professionalRequests: (token: string, status: ProfessionalStatus | "all" = "pending") =>
    request<User[]>(`/professionals/requests?status=${status}`, { token }),
  approveProfessional: (token: string, id: string) =>
    request<User>(`/professionals/requests/${id}/approve`, { method: "POST", token }),
  rejectProfessional: (token: string, id: string) =>
    request<User>(`/professionals/requests/${id}/reject`, { method: "POST", token }),
  establishments: (params: ListParams = {}) => request<Establishment[]>(`/establishments${toQueryString(params)}`),
  establishment: (id: string) => request<Establishment>(`/establishments/${id}`),
  getFavoriteSpots: (token: string) => request<unknown[]>("/users/me/favorites", { token }),
  updateFavoriteSpots: (token: string, favorites: unknown[]) =>
    request<unknown[]>("/users/me/favorites", { method: "PUT", token, body: { favorites } }),
  myEstablishment: (token: string) => request<Establishment | null>("/establishments/mine", { token }),
  upsertMyEstablishment: (token: string, body: EstablishmentInput) =>
    request<Establishment>("/establishments/mine", { method: "PUT", token, body }),
  notifications: (token: string) => request<Notification[]>("/notifications", { token }),
  markNotificationRead: (token: string, id: string) =>
    request<Notification>(`/notifications/${id}/read`, { method: "PUT", token }),
  markAllNotificationsRead: (token: string) =>
    request<{ message: string }>("/notifications/read-all", { method: "PUT", token }),
  uploadEstablishmentImage: (token: string, image: ImageUploadInput) => {
    const formData = new FormData();
    formData.append("image", {
      uri: image.uri,
      name: image.name || "establishment.jpg",
      type: image.type || "image/jpeg",
    } as unknown as Blob);

    return request<Establishment>("/establishments/mine/image", {
      method: "PUT",
      token,
      body: formData,
      timeoutMs: 45000,
    });
  },
};
