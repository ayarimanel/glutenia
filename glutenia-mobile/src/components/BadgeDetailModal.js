import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { Radius, Spacing } from "../theme/colors";
import { getBadgeVisualTokens, getBadgeTier } from "../theme/badgeTheme";
import BadgeIcon from "./BadgeIcon";

// Category -> where the badge's underlying action lives in the app. Only
// categories with one obvious, single action get a CTA (streak/journey are
// time-based, not a single tappable action, so they intentionally get none).
const CTA_ROUTES = {
  scanner: { labelKey: "badges.detail.ctaScan", nav: (navigation) => navigation.navigate("UserTabs", { screen: "Scan" }) },
  safety: { labelKey: "badges.detail.ctaLabelScan", nav: (navigation) => navigation.navigate("LabelScan") },
  community: { labelKey: "badges.detail.ctaEvents", nav: (navigation) => navigation.navigate("UserTabs", { screen: "Events" }) },
  shopper: { labelKey: "badges.detail.ctaShop", nav: (navigation) => navigation.navigate("ShopScreen") },
};

export default function BadgeDetailModal({ visible, onClose, entry, navigation }) {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const [active, setActive] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (!visible) return;
    setActive(true);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.92);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: true, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 240, useNativeDriver: true, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
    ]).start();
  }, [visible]);

  if (!active || !entry) return null;

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setActive(false);
      onClose();
    });
  };

  const { badge, locked, earnedAt, currentProgress, ratio } = entry;
  const tier = getBadgeTier(badge.slug);
  const tokens = getBadgeVisualTokens(badge.category, tier);
  const name = t(`badges.catalog.${badge.slug}.name`, { defaultValue: badge.name });
  const description = t(`badges.catalog.${badge.slug}.description`, { defaultValue: badge.description });
  const requirement = t(`badges.catalog.${badge.slug}.requirement`, { defaultValue: badge.description });

  const showProgress = locked && typeof ratio === "number" && badge.targetValue > 0;
  const cta = locked ? CTA_ROUTES[badge.category] : null;
  const locale = i18n.language === "ar" ? "ar-TN" : i18n.language === "fr" ? "fr-FR" : "en-US";

  return (
    <Modal transparent visible={active} animationType="none" statusBarTranslucent onRequestClose={dismiss}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)" }]}
        onPress={dismiss}
      >
        <Pressable onPress={() => {}}>
          <Animated.View
            style={[
              styles.card,
              { backgroundColor: colors.surface, opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            <View style={styles.badgeWrap}>
              <BadgeIcon badge={badge} size={112} locked={locked} progressRatio={showProgress ? ratio : null} />
            </View>

            <View
              style={[
                styles.tierPill,
                { backgroundColor: locked ? colors.divider : `${tokens.base}22` },
              ]}
            >
              <Text style={[styles.tierPillText, { color: locked ? colors.textMuted : tokens.base }]}>
                {t(`badges.tierNames.${tier}`)} · {t(`badges.categories.${badge.category}`)}
              </Text>
            </View>

            <Text style={[styles.name, { color: colors.textDark }]}>{name}</Text>
            <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                {t("badges.detail.howToUnlock")}
              </Text>
              <Text style={[styles.requirement, { color: colors.textDark }]}>{requirement}</Text>
            </View>

            {showProgress && (
              <View style={styles.section}>
                <View style={styles.progressRow}>
                  <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                    {t("badges.detail.progress")}
                  </Text>
                  <Text style={[styles.progressCount, { color: colors.textDark }]}>
                    {currentProgress} / {badge.targetValue}
                  </Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: colors.divider }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.round(Math.min(1, ratio) * 100)}%`, backgroundColor: tokens.base },
                    ]}
                  />
                </View>
              </View>
            )}

            {!locked && earnedAt && (
              <View style={[styles.earnedPill, { backgroundColor: `${tokens.base}18` }]}>
                <Text style={[styles.earnedPillText, { color: tokens.base }]}>
                  {t("badges.detail.dateEarned", { date: new Date(earnedAt).toLocaleDateString(locale) })}
                </Text>
              </View>
            )}

            {cta && navigation && (
              <Pressable
                style={[styles.ctaBtn, { backgroundColor: tokens.base }]}
                onPress={() => {
                  dismiss();
                  cta.nav(navigation);
                }}
              >
                <Text style={styles.ctaBtnText}>{t(cta.labelKey)}</Text>
                <ChevronRight size={18} color="#fff" strokeWidth={2.5} />
              </Pressable>
            )}

            <Pressable style={styles.closeBtn} onPress={dismiss}>
              <Text style={[styles.closeBtnText, { color: colors.textMuted }]}>
                {t("gamification.awesome")}
              </Text>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  badgeWrap: { marginBottom: 14, marginTop: 4 },
  tierPill: {
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 10,
  },
  tierPillText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  name: { fontSize: 20, fontWeight: "800", textAlign: "center", marginBottom: 6 },
  description: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 16 },
  divider: { height: 1, width: "100%", marginBottom: 14 },
  section: { width: "100%", marginBottom: 14 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  requirement: { fontSize: 15, fontWeight: "600" },
  progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressCount: { fontSize: 13, fontWeight: "700" },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden", marginTop: 8 },
  progressFill: { height: "100%", borderRadius: 4 },
  earnedPill: {
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 14,
  },
  earnedPillText: { fontSize: 13, fontWeight: "700" },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: "100%",
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
  },
  ctaBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  closeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  closeBtnText: { fontSize: 14, fontWeight: "600" },
});
