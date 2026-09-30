import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme, type ThemeColors } from "../context/ThemeContext";
import type { OrderStatus } from "../types/models";

const statusColors = (colors: ThemeColors, isDark: boolean): Record<OrderStatus, { bg: string; text: string }> => ({
  pending: { bg: colors.warning + "22", text: isDark ? colors.warning : "#A86A00" },
  confirmed: { bg: colors.secondaryPale, text: colors.secondary },
  shipped: isDark ? { bg: "#1B2C3B", text: "#82B6E3" } : { bg: "#E1EDF7", text: "#2A6394" },
  delivered: { bg: colors.primaryPale, text: isDark ? colors.primary : "#5E8F2A" },
});

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const palette = statusColors(colors, isDark)[status] ?? { bg: colors.divider, text: colors.textMuted };

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.text }]}>{t(`orderStatus.${status}`, status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "800",
  },
});
