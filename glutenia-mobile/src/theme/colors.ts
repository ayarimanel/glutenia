import type { ViewStyle } from "react-native";

export const Colors = {
  primary: "#8BC34A",
  primaryLight: "#A5D66A",
  primaryPale: "#F1F8E9",

  secondary: "#7B4626",
  secondaryMid: "#9A5C38",
  secondaryPale: "#F5EDE8",

  background: "#F8F9FA",
  surface: "#FFFFFF",

  textDark: "#2E2E2E",
  textMuted: "#6C757D",

  border: "#DEE2E6",
  divider: "#E9ECEF",

  danger: "#C8102E",
  warning: "#F59E0B",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const Shadow: ViewStyle = {
  shadowColor: Colors.primary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
};
