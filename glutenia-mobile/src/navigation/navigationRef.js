import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (!navigationRef.isReady()) return;
  try {
    navigationRef.navigate(name, params);
  } catch (error) {
    // Route not available in the currently active navigator (e.g. an admin
    // account received a customer-facing notification) — fail silently.
  }
}
