import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";
import AppIcon from "../../components/AppIcon";

const STARS_FULL = "★★★★★";
const STARS_EMPTY = "☆☆☆☆☆";

function StarRating({ rating }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <Text style={styles.stars}>
      {"★".repeat(full)}
      {half ? "½" : ""}
      {"☆".repeat(5 - full - (half ? 1 : 0))}
    </Text>
  );
}

export default function MapDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { spot } = route.params;

  const handleContact = () => {
    Alert.alert(
      t("map.contactTitle", { name: spot.name }),
      t("mapDetail.contactMsg"),
      [
        { text: t("mapDetail.call"), onPress: () => Linking.openURL("tel:+21671000000") },
        { text: t("mapDetail.whatsapp"), onPress: () => {} },
        { text: t("mapDetail.cancel"), style: "cancel" },
      ]
    );
  };

  return (
    <View style={styles.root}>
      {/* Hero header */}
      <View style={[styles.hero, { backgroundColor: spot.color + "33" }]}>
        {/* Back button */}
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 10 }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <AppIcon name="arrow-back" size={20} color={Colors.textDark} />
        </TouchableOpacity>

        {/* Hero emoji */}
        <View style={[styles.heroEmojiWrap, { backgroundColor: spot.color + "44" }]}>
          <Text style={styles.heroEmoji}>{spot.emoji}</Text>
          <Text style={styles.heroAccent}>{spot.accentEmoji}</Text>
        </View>

        {/* GF badge over hero */}
        <View style={styles.heroBadge}>
          <AppIcon name="leaf" size={12} color="#fff" />
          <Text style={styles.heroBadgeText}>{t("mapDetail.certifiedGF")}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Name + type */}
        <View style={styles.nameRow}>
          <View style={styles.nameBlock}>
            <Text style={styles.name}>{spot.name}</Text>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: spot.color + "22" },
              ]}
            >
              <Text style={[styles.typeBadgeText, { color: spot.color }]}>
                {spot.type}
              </Text>
            </View>
          </View>
        </View>

        {/* Rating row */}
        <View style={styles.ratingRow}>
          <StarRating rating={spot.rating} />
          <Text style={styles.ratingNum}>{spot.rating}</Text>
          <Text style={styles.ratingReviews}>({spot.reviews} {t("mapDetail.reviews")})</Text>
        </View>

        {/* Distance + price row */}
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <AppIcon name="location" size={14} color={Colors.primary} />
            <Text style={styles.metaChipText}>{spot.distance}</Text>
          </View>
          <View style={styles.metaChip}>
            <AppIcon name="cash" size={14} color={Colors.primary} />
            <Text style={styles.metaChipText}>{spot.avgPrice} {t("mapDetail.avg")}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Address */}
        <View style={styles.addressRow}>
          <AppIcon name="map-pin" size={15} color={Colors.textMuted} />
          <Text style={styles.addressText}>{spot.address}</Text>
        </View>

        {/* Description */}
        <Text style={styles.sectionLabel}>{t("mapDetail.about")}</Text>
        <Text style={styles.description}>{spot.description}</Text>

        {/* Tags */}
        <Text style={styles.sectionLabel}>{t("mapDetail.highlights")}</Text>
        <View style={styles.tagRow}>
          {spot.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <AppIcon name="checkmark" size={12} color={Colors.primary} />
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Opening hours (fake) */}
        <Text style={styles.sectionLabel}>{t("mapDetail.hours")}</Text>
        <View style={styles.hoursBlock}>
          {[
            { day: t("mapDetail.monFri"), time: "08:00 – 20:00" },
            { day: t("mapDetail.saturday"), time: "09:00 – 18:00" },
            { day: t("mapDetail.sunday"), time: "10:00 – 16:00" },
          ].map((h) => (
            <View key={h.day} style={styles.hoursRow}>
              <Text style={styles.hoursDay}>{h.day}</Text>
              <Text style={styles.hoursTime}>{h.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Contact CTA */}
      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + Spacing.md }]}>
        <TouchableOpacity
          style={styles.ctaBtn}
          activeOpacity={0.85}
          onPress={handleContact}
        >
          <AppIcon name="person" size={18} color="#fff" />
          <Text style={styles.ctaBtnText}>{t("mapDetail.contact")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    position: "absolute",
    left: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    ...Shadow,
    shadowColor: "#000",
    elevation: 4,
  },
  heroEmojiWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  heroEmoji: {
    fontSize: 44,
  },
  heroAccent: {
    position: "absolute",
    bottom: 8,
    right: 8,
    fontSize: 22,
  },
  heroBadge: {
    position: "absolute",
    bottom: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
  },

  // ── Content ───────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: 120,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  nameBlock: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.textDark,
    lineHeight: 28,
  },
  typeBadge: {
    alignSelf: "flex-start",
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  stars: {
    fontSize: 16,
    color: "#F59E0B",
    letterSpacing: 1,
  },
  ratingNum: {
    fontSize: 15,
    fontWeight: "900",
    color: Colors.textDark,
  },
  ratingReviews: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  metaRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: 4,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  metaChipText: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 4,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addressText: {
    fontSize: 13,
    color: Colors.textMuted,
    flex: 1,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.textDark,
    lineHeight: 22,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },
  hoursBlock: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  hoursDay: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  hoursTime: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.textDark,
  },

  // ── CTA ──────────────────────────────────────────────────────────────────
  ctaBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    height: 52,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  ctaBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
  },
});
