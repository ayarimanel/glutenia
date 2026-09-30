import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootParamList } from "./types";

export const navigationRef = createNavigationContainerRef<RootParamList>();

export function navigate<RouteName extends keyof RootParamList>(
  name: RouteName,
  params?: RootParamList[RouteName]
) {
  if (!navigationRef.isReady()) return;
  try {
    navigationRef.navigate(...([name, params] as never));
  } catch (error) {
  }
}
