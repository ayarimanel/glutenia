import { StyleSheet, Text, View } from "react-native";
import AppIcon from "./AppIcon";
import { Colors, Radius } from "../theme/colors";

export default function GlutenFreeBadge({ compact }) {
  return (
    <View style={[styles.badge, compact && styles.compact]}>
      <AppIcon name="leaf" size={compact ? 14 : 16} color={Colors.surface} />
      <Text style={[styles.text, compact && styles.compactText]}>Gluten Free</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.secondary,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  compact: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: "800",
  },
  compactText: {
    fontSize: 10,
  },
});
