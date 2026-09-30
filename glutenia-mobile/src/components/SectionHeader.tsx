import type { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AppIcon from "./AppIcon";
import { useTheme, type ThemeColors } from "../context/ThemeContext";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  right?: ReactNode;
  back?: boolean;
}

export default function SectionHeader({ eyebrow, title, right, back }: SectionHeaderProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation();
  return (
    <View style={styles.row}>
      {back && navigation.canGoBack() ? (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <AppIcon name="arrow-back" size={22} color={colors.textDark} />
        </TouchableOpacity>
      ) : null}
      <View style={styles.textWrap}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  backBtn: {
    padding: 4,
  },
  textWrap: {
    flex: 1,
  },
  eyebrow: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    color: colors.textDark,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34,
  },
});
