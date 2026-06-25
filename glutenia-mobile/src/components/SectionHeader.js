import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../theme/colors";

export default function SectionHeader({ eyebrow, title, right }) {
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

const styles = StyleSheet.create({
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
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    color: Colors.textDark,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34,
  },
});
