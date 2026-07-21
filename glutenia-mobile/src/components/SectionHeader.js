import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function SectionHeader({ eyebrow, title, right }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.row}>
      <View style={styles.textWrap}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
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
