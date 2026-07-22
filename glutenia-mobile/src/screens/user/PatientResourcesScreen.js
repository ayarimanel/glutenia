import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import Screen from "../../components/Screen";
import AppIcon from "../../components/AppIcon";
import EmptyState from "../../components/EmptyState";
import { api } from "../../api/client";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

// ─────────────────────────────────────────────────────────────────────────────
//  STATIC CONTENT (category chips only — articles are now admin-managed and
//  fetched from the API; see the useFocusEffect fetch below)
// ─────────────────────────────────────────────────────────────────────────────

const getCategories = (colors) => [
  { key: "celiac",    icon: "activity",     bg: colors.secondaryPale, color: colors.secondary },
  { key: "diet",      icon: "utensils",     bg: colors.primaryPale,   color: colors.primary   },
  { key: "safe",      icon: "shield-check", bg: colors.primaryPale,   color: colors.primary   },
  { key: "lifestyle", icon: "star",         bg: "#FFF9E6",            color: colors.warning   },
];

const VIDEOS = [
  {
    id: "1",
    videoKey: "v1",
    title: "Living with Celiac Disease",
    author: "Dr. Amira Ben Ali",
    duration: "12 min",
    youtubeId: "z-kyx4wgz2c",
  },
  {
    id: "2",
    videoKey: "v2",
    title: "Gluten-Free Meal Prep",
    author: "Nutritionist Panel",
    duration: "18 min",
    youtubeId: "fTi4-3VwMUE",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export default function PatientResourcesScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const CATEGORIES = useMemo(() => getCategories(colors), [colors]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          setLoading(true);
          const data = await api.patientResources();
          if (!cancelled) setResources(data);
        } catch (error) {
          // Keep whatever was previously loaded; resources are non-critical content.
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  // Icon/bg/color are derived from category client-side (same mapping the
  // chips use) rather than stored per-resource, so admin-added resources
  // automatically pick up the right visuals with no extra field to fill in.
  const resolveVisuals = (resource) => {
    const meta = CATEGORIES.find((c) => c.key === resource.category) || CATEGORIES[0];
    return {
      ...resource,
      icon: meta.icon,
      bg: meta.bg,
      color: meta.color,
      // ResourceDetailScreen expects a formatted `readTime` string (unchanged
      // from before this screen was DB-driven) — computed once here so that
      // screen needs no changes.
      readTime: t("patientResources.minutesShort", { count: resource.readTimeMinutes }),
    };
  };

  const resolvedResources = resources.map(resolveVisuals);
  const featured = resolvedResources.find((r) => r.featured);
  const visibleResources = (activeCategory
    ? resolvedResources.filter((item) => item.category === activeCategory)
    : resolvedResources
  ).filter((item) => item !== featured);

  const openVideo = (video) => {
    navigation.navigate("VideoPlayer", {
      youtubeId: video.youtubeId,
      title: video.title,
    });
  };
  return (
    <Screen>
      {/* ── Navigation bar ── */}
      <View style={styles.navBar}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <AppIcon name="arrow-back" size={22} color={colors.textDark} />
        </Pressable>
        <Text style={styles.navTitle}>{t("patientResources.title")}</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Categories ── */}
        <Text style={styles.sectionMeta}>{t("patientResources.categories")}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
        >
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.key;
            return (
              <Pressable
                key={cat.key}
                style={styles.catCard}
                onPress={() =>
                  setActiveCategory((current) => (current === cat.key ? null : cat.key))
                }
              >
                <View
                  style={[
                    styles.catIconWrap,
                    { backgroundColor: cat.bg },
                    active && { borderWidth: 2, borderColor: cat.color },
                  ]}
                >
                  <AppIcon name={cat.icon} size={22} color={cat.color} />
                </View>
                <Text style={[styles.catLabel, active && { color: cat.color }]}>
                  {t(`patientResources.categoryLabels.${cat.key}`)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Featured ── */}
        {featured && (
          <>
            <Text style={styles.sectionMeta}>{t("patientResources.featured")}</Text>
            <View style={styles.featuredCard}>
              <View style={[styles.featuredIconCircle, { backgroundColor: featured.bg }]}>
                <AppIcon name={featured.icon} size={34} color={featured.color} />
              </View>
              <Text style={styles.featuredTitle}>{featured.title}</Text>
              <Text style={styles.featuredDesc}>{featured.description}</Text>
              <View style={styles.featuredFooter}>
                <View style={styles.readTimeRow}>
                  <AppIcon name="clock" size={13} color={colors.textMuted} />
                  <Text style={styles.readTimeText}>
                    {t("patientResources.readTime", { time: featured.readTime })}
                  </Text>
                </View>
                <Pressable
                  style={styles.readMoreBtn}
                  onPress={() => navigation.navigate("ResourceDetail", { resource: featured })}
                >
                  <Text style={styles.readMoreText}>{t("patientResources.readMore")}</Text>
                  <AppIcon name="chevron-right" size={14} color={colors.primary} />
                </Pressable>
              </View>
            </View>
          </>
        )}

        {/* ── All resources ── */}
        <Text style={styles.sectionMeta}>{t("patientResources.allResources")}</Text>
        {loading && resources.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={styles.loading} />
        ) : visibleResources.length === 0 ? (
          <EmptyState
            icon="heart"
            title={t("patientResources.emptyTitle")}
            body={t("patientResources.emptyBody")}
          />
        ) : (
          <View style={styles.resourceList}>
            {visibleResources.map((item) => (
              <Pressable
                key={item._id}
                style={styles.resourceCard}
                onPress={() => navigation.navigate("ResourceDetail", { resource: item })}
              >
                <View style={[styles.resourceIconWrap, { backgroundColor: item.bg }]}>
                  <AppIcon name={item.icon} size={22} color={item.color} />
                </View>
                <View style={styles.resourceBody}>
                  <Text style={styles.resourceTitle}>{item.title}</Text>
                  <Text style={styles.resourceDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <View style={styles.resourceFooter}>
                    <AppIcon name="clock" size={12} color={colors.textMuted} />
                    <Text style={styles.resourceTime}>{item.readTime}</Text>
                    <Text style={styles.resourceReadMore}>  {t("patientResources.readMore")} →</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* ── Videos & Sessions ── */}
        <View style={styles.videosSectionRow}>
          <Text style={styles.videosSectionTitle}>{t("patientResources.videosSection")}</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.videosRow}
        >
          {VIDEOS.map((video) => (
            <Pressable key={video.id} style={styles.videoCard} onPress={() => openVideo(video)}>
              <View style={styles.videoThumb}>
                <AppIcon name="play-circle" size={44} color={colors.secondary} />
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{video.duration}</Text>
                </View>
              </View>
              <Text style={styles.videoTitle} numberOfLines={2}>
                {t(`patientResources.videos.${video.videoKey}.title`)}
              </Text>
              <Text style={styles.videoAuthor}>{t(`patientResources.videos.${video.videoKey}.author`)}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Disclaimer ── */}
        <View style={styles.disclaimer}>
          <AppIcon name="info" size={16} color={colors.secondary} />
          <Text style={styles.disclaimerText}>{t("patientResources.disclaimer")}</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────────────────────────────────────

const getStyles = (colors) => StyleSheet.create({
  // Nav bar
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
    fontSize: 17,
    fontWeight: "800",
    color: colors.textDark,
  },
  navSpacer: { width: 40 },

  // Section meta labels (Categories / Featured / All resources)
  sectionMeta: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  loading: {
    marginVertical: Spacing.lg,
  },

  // Categories
  catRow: {
    paddingHorizontal: Spacing.md,
    gap: 10,
    paddingBottom: 4,
  },
  catCard: {
    width: 80,
    alignItems: "center",
    gap: 8,
  },
  catIconWrap: {
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  catLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textDark,
    textAlign: "center",
    lineHeight: 15,
  },

  // Featured card
  featuredCard: {
    marginHorizontal: Spacing.md,
    backgroundColor: colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow,
  },
  featuredIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.secondaryPale,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: Spacing.sm,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.textDark,
    lineHeight: 24,
  },
  featuredDesc: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  featuredFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  readTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  readTimeText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
  },
  readMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },

  // Resource list
  resourceList: {
    marginHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  resourceCard: {
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    ...Shadow,
  },
  resourceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  resourceBody: {
    flex: 1,
    gap: 4,
  },
  resourceTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textDark,
    lineHeight: 20,
  },
  resourceDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  resourceFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  resourceTime: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 4,
  },
  resourceReadMore: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    marginLeft: 6,
  },

  // Videos section header row
  videosSectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  videosSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.secondary,
  },

  // Video cards
  videosRow: {
    paddingHorizontal: Spacing.md,
    gap: 12,
    paddingBottom: 4,
  },
  videoCard: {
    width: 180,
    gap: 8,
  },
  videoThumb: {
    width: 180,
    height: 115,
    borderRadius: Radius.lg,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondaryPale,
  },
  durationBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.58)",
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  videoTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textDark,
    lineHeight: 18,
  },
  videoAuthor: {
    fontSize: 11,
    color: colors.textMuted,
  },

  // Disclaimer
  disclaimer: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    backgroundColor: colors.secondaryPale,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "flex-start",
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: colors.secondary,
    lineHeight: 18,
  },
});
