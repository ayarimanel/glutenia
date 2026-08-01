import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootParamList } from "./types";

export const navigationRef = createNavigationContainerRef<RootParamList>();

export function navigate<RouteName extends keyof RootParamList>(
  name: RouteName,
  params?: RootParamList[RouteName]
) {
  if (!navigationRef.isReady()) return;
  try {
    // React Navigation's own TypeScript guide recommends spreading a
    // `never`-cast tuple here - a generic wrapper around the overloaded
    // `.navigate()` can't satisfy its overload set structurally (the
    // distributive conditional type behind it can't resolve over an
    // unresolved generic RouteName) even though every concrete call is
    // valid. This isn't a shortcut around real type errors.
    navigationRef.navigate(...([name, params] as never));
  } catch (error) {
    // Route not available in the currently active navigator (e.g. an admin
    // account received a customer-facing notification) — fail silently.
  }
}
