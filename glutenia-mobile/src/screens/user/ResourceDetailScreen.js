import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Screen from "../../components/Screen";
import AppIcon from "../../components/AppIcon";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

export default function ResourceDetailScreen({ route, navigation }) {
  const { resource } = route.params;

  return (
    <Screen>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <AppIcon name="arrow-back" size={22} color={Colors.textDark} />
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={2}>{resource.title}</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Icon header */}
        <View style={[styles.iconCircle, { backgroundColor: resource.bg }]}>
          <AppIcon name={resource.icon} size={38} color={resource.color} />
        </View>

        {/* Title + read time */}
        <Text style={styles.title}>{resource.title}</Text>
        <View style={styles.readTimeRow}>
          <AppIcon name="clock" size={14} color={Colors.textMuted} />
          <Text style={styles.readTimeText}>{resource.readTime} read</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Body text */}
        <Text style={styles.body}>{resource.body}</Text>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <AppIcon name="info" size={15} color={Colors.secondary} />
          <Text style={styles.disclaimerText}>
            This content is for informational purposes only and does not replace professional
            medical advice. Always consult a healthcare provider.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textDark,
    lineHeight: 21,
  },
  navSpacer: { width: 40 },

  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },

  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.textDark,
    lineHeight: 30,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },

  readTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginBottom: Spacing.md,
  },
  readTimeText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginBottom: Spacing.lg,
  },

  body: {
    fontSize: 15,
    color: Colors.textDark,
    lineHeight: 25,
    marginBottom: Spacing.xl,
  },

  disclaimer: {
    backgroundColor: Colors.secondaryPale,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.secondary,
    lineHeight: 18,
  },
});
