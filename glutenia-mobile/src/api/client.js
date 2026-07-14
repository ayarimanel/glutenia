import Constants from "expo-constants";
import { Platform } from "react-native";

const trimTrailingSlash = (value) => value.replace(/\/+$/, "");
const DEFAULT_TIMEOUT_MS = 20000;

const getHostFromExpo = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest?.debuggerHost ||
    Constants.manifest2?.extra?.expoClient?.hostUri;

  if (!hostUri) {
    return null;
  }

  return hostUri.split(":")[0];
};

export const getApiBaseUrl = () => {
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

const request = async (path, options = {}) => {
  const { token, body, timeoutMs = DEFAULT_TIMEOUT_MS, ...rest } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const isFormData =
    body &&
    typeof body.append === "function" &&
    typeof body.getParts === "function";
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(rest.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...rest,
      headers,
      signal: controller.signal,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
  } catch (error) {
    const requestError = new Error(
      error.name === "AbortError"
        ? "Server is taking too long to respond. Try again in a moment."
        : "Could not reach the server. Check your connection and try again."
    );
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
    const error = new Error(payload.message || "Request failed");
    error.status = response.status;
    error.data = payload.data;
    throw error;
  }

  return payload.data;
};

export const api = {
  login: (body) => request("/auth/login", { method: "POST", body }),
  register: (body) => request("/auth/register", { method: "POST", body }),
  me: (token, options = {}) => request("/auth/me", { token, ...options }),
  updateProfile: (token, body) =>
    request("/auth/me", { method: "PUT", token, body, timeoutMs: 30000 }),
  changePassword: (token, body) =>
    request("/auth/change-password", { method: "PUT", token, body }),
  products: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value)
    ).toString();
    return request(`/products${query ? `?${query}` : ""}`);
  },
  product: (id) => request(`/products/${id}`),
  createProduct: (token, body) =>
    request("/products", { method: "POST", token, body }),
  updateProduct: (token, id, body) =>
    request(`/products/${id}`, { method: "PUT", token, body }),
  uploadProductImage: (token, id, image) => {
    const formData = new FormData();
    formData.append("image", {
      uri: image.uri,
      name: image.name || `product-${id}.jpg`,
      type: image.type || "image/jpeg",
    });

    return request(`/products/${id}/image`, {
      method: "PUT",
      token,
      body: formData,
      timeoutMs: 45000,
    });
  },
  deleteProduct: (token, id) =>
    request(`/products/${id}`, { method: "DELETE", token }),
  myProducts: (token) => request("/products/mine", { token }),
  recipes: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value)
    ).toString();
    return request(`/recipes${query ? `?${query}` : ""}`);
  },
  recipe: (id) => request(`/recipes/${id}`),
  createRecipe: (token, body) =>
    request("/recipes", { method: "POST", token, body, timeoutMs: 30000 }),
  updateRecipe: (token, id, body) =>
    request(`/recipes/${id}`, { method: "PUT", token, body, timeoutMs: 30000 }),
  deleteRecipe: (token, id) =>
    request(`/recipes/${id}`, { method: "DELETE", token }),
  productByBarcode: (barcode, token) =>
    request(`/products/barcode/${encodeURIComponent(barcode)}`, { token }),
  createOrder: (token, body) =>
    request("/orders", { method: "POST", token, body }),
  myOrders: (token) => request("/orders/my", { token }),
  allOrders: (token) => request("/orders", { token }),
  sellerOrders: (token) => request("/orders/seller", { token }),
  updateOrderStatus: (token, id, status) =>
    request(`/orders/${id}/status`, { method: "PUT", token, body: { status } }),
  saveOnboardingProfile: (token, data) =>
    request("/onboarding/profile", { method: "PUT", token, body: data }),
  getGamificationProfile: (token) =>
    request("/gamification/profile", { token }),
  getMyBadges: (token) =>
    request("/gamification/me/badges", { token }),
  updateBadgePin: (token, badgeId, isPinned) =>
    request(`/gamification/badges/${badgeId}/pin`, {
      method: "PUT",
      token,
      body: { isPinned },
    }),
  scanLabel: (imageBase64, token) =>
    request("/scan/label", {
      method: "POST",
      token,
      body: { imageBase64, mimeType: "image/jpeg" },
      timeoutMs: 30000,
    }),
  events: (token) => request("/events", { token }),
  event: (id, token) => request(`/events/${id}`, { token }),
  createEvent: (token, body) => request("/events", { method: "POST", token, body }),
  updateEvent: (token, id, body) => request(`/events/${id}`, { method: "PUT", token, body }),
  deleteEvent: (token, id) => request(`/events/${id}`, { method: "DELETE", token }),
  rsvpEvent: (token, id) => request(`/events/${id}/rsvp`, { method: "POST", token }),
  professionalRequests: (token, status = "pending") =>
    request(`/professionals/requests?status=${status}`, { token }),
  approveProfessional: (token, id) =>
    request(`/professionals/requests/${id}/approve`, { method: "POST", token }),
  rejectProfessional: (token, id) =>
    request(`/professionals/requests/${id}/reject`, { method: "POST", token }),
  establishments: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value)
    ).toString();
    return request(`/establishments${query ? `?${query}` : ""}`);
  },
  establishment: (id) => request(`/establishments/${id}`),
  myEstablishment: (token) => request("/establishments/mine", { token }),
  upsertMyEstablishment: (token, body) =>
    request("/establishments/mine", { method: "PUT", token, body }),
  notifications: (token) => request("/notifications", { token }),
  markNotificationRead: (token, id) =>
    request(`/notifications/${id}/read`, { method: "PUT", token }),
  markAllNotificationsRead: (token) =>
    request("/notifications/read-all", { method: "PUT", token }),
  uploadEstablishmentImage: (token, image) => {
    const formData = new FormData();
    formData.append("image", {
      uri: image.uri,
      name: image.name || "establishment.jpg",
      type: image.type || "image/jpeg",
    });

    return request("/establishments/mine/image", {
      method: "PUT",
      token,
      body: formData,
      timeoutMs: 45000,
    });
  },
};
