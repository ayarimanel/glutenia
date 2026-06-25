import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useState } from "react";
import Screen from "../../components/Screen";
import AppIcon from "../../components/AppIcon";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

export default function EventDetailScreen({ route, navigation }) {
  const { event } = route.params;
  const [going, setGoing] = useState(false);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: event.color }]}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <AppIcon name="arrow-back" size={20} color={Colors.textDark} />
          </Pressable>
          <Text style={styles.heroEmoji}>{event.emoji}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{event.category}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{event.title}</Text>

          {/* Meta info */}
          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <View style={styles.metaIcon}>
                <AppIcon name="calendar" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.metaText}>{event.date}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.metaRow}>
              <View style={styles.metaIcon}>
                <AppIcon name="location" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.metaText}>{event.location}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.metaRow}>
              <View style={styles.metaIcon}>
                <AppIcon name="people" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.metaText}>
                {event.going + (going ? 1 : 0)} people going
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.sectionTitle}>About this event</Text>
          <Text style={styles.description}>{event.description}</Text>

          {/* RSVP button */}
          <Pressable
            style={[styles.rsvpBtn, going && styles.rsvpBtnActive]}
            onPress={() => setGoing((g) => !g)}
          >
            <AppIcon
              name={going ? "checkmark-circle" : "people"}
              size={20}
              color={going ? Colors.primary : "#fff"}
            />
            <Text style={[styles.rsvpText, going && styles.rsvpTextActive]}>
              {going ? "You're going!" : "I'm going"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroEmoji: {
    fontSize: 90,
  },
  categoryBadge: {
    position: "absolute",
    bottom: 16,
    left: 16,
    backgroundColor: Colors.secondary,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  categoryBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },
  body: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: Colors.textDark,
    lineHeight: 30,
  },
  metaCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  metaIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
  },
  metaText: {
    fontSize: 14,
    color: Colors.textDark,
    fontWeight: "600",
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: Colors.textDark,
  },
  description: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  rsvpBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    marginBottom: Spacing.xl,
  },
  rsvpBtnActive: {
    backgroundColor: Colors.primaryPale,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  rsvpText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  rsvpTextActive: {
    color: Colors.primary,
  },
});
