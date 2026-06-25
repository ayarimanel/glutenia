import { StyleSheet, Text, View } from "react-native";
import AppIcon from "./AppIcon";
import { Colors, Radius } from "../theme/colors";

export default function EmptyState({ icon = "leaf", title, body }) {
  return (
    <View style={styles.empty}>
      <View style={styles.iconWrap}>
        <AppIcon name={icon} size={28} color={Colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: Colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: Colors.textDark,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  body: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
