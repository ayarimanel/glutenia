import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import AppIcon from "./AppIcon";
import { Radius } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";

export default function GlutenFreeBadge({ compact }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={[styles.badge, compact && styles.compact]}>
      <AppIcon name="leaf" size={compact ? 14 : 16} color={colors.surface} />
      <Text style={[styles.text, compact && styles.compactText]}>{t("glutenFreeBadge")}</Text>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.secondary,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  compact: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "800",
  },
  compactText: {
    fontSize: 10,
  },
});
