import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import AppIcon from "../../components/AppIcon";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";
import { useEvents } from "../../context/EventsContext";

export default function EventDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { event } = route.params;
  const { isGoing, joinEvent, leaveEvent } = useEvents();
  const going = isGoing(event.id);

  const handleRsvp = () => {
    if (going) {
      leaveEvent(event.id);
    } else {
      joinEvent(event);
    }
  };

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
                {t("eventDetail.going", { count: event.going + (going ? 1 : 0) })}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.sectionTitle}>{t("eventDetail.about")}</Text>
          <Text style={styles.description}>{event.description}</Text>

          {/* Price + RSVP row */}
          <View style={styles.rsvpRow}>
            <View style={styles.priceBox}>
              <AppIcon name="cash" size={16} color={Colors.primary} />
              <Text style={styles.priceText}>
                {event.price === 0 ? t("eventDetail.free") : `${event.price} TND`}
              </Text>
            </View>

            <Pressable
              style={[styles.rsvpBtn, going && styles.rsvpBtnActive]}
              onPress={handleRsvp}
            >
              <AppIcon
                name={going ? "checkmark-circle" : "people"}
                size={20}
                color={going ? Colors.primary : "#fff"}
              />
              <Text style={[styles.rsvpText, going && styles.rsvpTextActive]}>
                {going ? t("eventDetail.rsvpGoing") : t("eventDetail.rsvpJoin")}
              </Text>
            </Pressable>
          </View>
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
  rsvpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: Spacing.xl,
  },
  priceBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  priceText: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.primary,
  },
  rsvpBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
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
