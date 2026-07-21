import { StyleSheet, Text, View } from "react-native";
import AppIcon from "./AppIcon";
import { Radius } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";

export default function EmptyState({ icon = "leaf", title, body }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.empty}>
      <View style={styles.iconWrap}>
        <AppIcon name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  empty: {
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 10,
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: Radius.lg,
    backgroundColor: colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.textDark,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  body: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
