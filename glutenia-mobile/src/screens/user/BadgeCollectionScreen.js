import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Bookmark, BookmarkCheck } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { useTheme } from "../../context/ThemeContext";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import BadgeIcon from "../../components/BadgeIcon";
import BadgeDetailModal from "../../components/BadgeDetailModal";

const COLUMNS = 3;
const GRID_GAP = 12;

export default function BadgeCollectionScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { token } = useAuth();

  const [earnedBadges, setEarnedBadges] = useState([]);
  const [lockedBadges, setLockedBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pinningId, setPinningId] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const fetchBadges = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getGamificationProfile(token);
      setEarnedBadges(data.earnedBadges || []);
      setLockedBadges(data.lockedBadges || []);
    } catch (err) {
      setError(err.message || t("badges.error"));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  const pinnedCount = useMemo(
    () => earnedBadges.filter((ub) => ub.isPinned).length,
    [earnedBadges]
  );

  const totalCount = earnedBadges.length + lockedBadges.length;

  const handlePinToggle = async (userBadge) => {
    if (pinningId) return;
    const badgeObjectId = userBadge.badgeId?._id;
    if (!badgeObjectId) return;
    const nextPinned = !userBadge.isPinned;

    setEarnedBadges((prev) =>
      prev.map((ub) => (ub._id === userBadge._id ? { ...ub, isPinned: nextPinned } : ub))
    );
    setPinningId(userBadge._id);

    try {
      await api.updateBadgePin(token, badgeObjectId, nextPinned);
    } catch (err) {
      setEarnedBadges((prev) =>
        prev.map((ub) => (ub._id === userBadge._id ? { ...ub, isPinned: userBadge.isPinned } : ub))
      );
      Alert.alert(t("badges.pinError"), err.message || t("badges.tryAgain"));
    } finally {
      setPinningId(null);
    }
  };

  const windowWidth = Dimensions.get("window").width;
  const tileSize = (windowWidth - Spacing.md * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS;

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.root, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchBadges}>
          <Text style={styles.retryText}>{t("badges.retry")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={22} color={colors.textDark} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("badges.title")}</Text>
        <View style={[styles.pinChip, pinnedCount >= 3 && styles.pinChipFull]}>
          <Text style={[styles.pinChipText, pinnedCount >= 3 && styles.pinChipTextFull]}>
            {t("badges.pinned", { count: pinnedCount })}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            {t("badges.summary", { earned: earnedBadges.length, total: totalCount })}
          </Text>
          <View style={styles.summaryTrack}>
            <View
              style={[
                styles.summaryFill,
                { width: totalCount > 0 ? `${Math.round((earnedBadges.length / totalCount) * 100)}%` : "0%" },
              ]}
            />
          </View>
        </View>

        {earnedBadges.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>{t("badges.earnedSection")}</Text>
            <View style={styles.grid}>
              {earnedBadges.map((ub) => {
                const badge = ub.badgeId;
                if (!badge) return null;
                return (
                  <TouchableOpacity
                    key={String(ub._id)}
                    style={[styles.tile, { width: tileSize }]}
                    activeOpacity={0.8}
                    onPress={() =>
                      setSelectedEntry({ badge, locked: false, earnedAt: ub.earnedAt })
                    }
                  >
                    <TouchableOpacity
                      style={styles.pinToggle}
                      onPress={() => handlePinToggle(ub)}
                      disabled={pinningId === ub._id}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      {pinningId === ub._id ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : ub.isPinned ? (
                        <BookmarkCheck size={16} color={colors.primary} strokeWidth={2.4} />
                      ) : (
                        <Bookmark size={16} color={colors.textMuted} strokeWidth={1.8} />
                      )}
                    </TouchableOpacity>
                    <View style={styles.tileBadgeWrap}>
                      <BadgeIcon badge={badge} size={tileSize * 0.72} locked={false} />
                    </View>
                    <Text style={styles.tileName} numberOfLines={2}>
                      {t(`badges.catalog.${badge.slug}.name`, { defaultValue: badge.name })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {lockedBadges.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, styles.mt]}>{t("badges.lockedSection")}</Text>
            <View style={styles.grid}>
              {lockedBadges.map(({ badge, currentProgress, ratio }) => (
                <TouchableOpacity
                  key={badge.slug}
                  style={[styles.tile, { width: tileSize }]}
                  activeOpacity={0.8}
                  onPress={() =>
                    setSelectedEntry({ badge, locked: true, currentProgress, ratio })
                  }
                >
                  <View style={styles.tileBadgeWrap}>
                    <BadgeIcon badge={badge} size={tileSize * 0.72} locked progressRatio={ratio} />
                  </View>
                  <Text style={[styles.tileName, styles.tileNameLocked]} numberOfLines={2}>
                    {t(`badges.catalog.${badge.slug}.name`, { defaultValue: badge.name })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <BadgeDetailModal
        visible={!!selectedEntry}
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: colors.textDark,
    marginLeft: Spacing.sm,
  },
  pinChip: {
    backgroundColor: colors.primaryPale,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pinChipFull: { backgroundColor: colors.secondaryPale },
  pinChipText: { fontSize: 12, fontWeight: "700", color: colors.primary },
  pinChipTextFull: { color: colors.secondary },

  scroll: { padding: Spacing.md, paddingBottom: 48 },
  mt: { marginTop: Spacing.lg },

  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow,
  },
  summaryText: { fontSize: 15, fontWeight: "700", color: colors.textDark, marginBottom: 10 },
  summaryTrack: { height: 8, backgroundColor: colors.divider, borderRadius: 4, overflow: "hidden" },
  summaryFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 4 },

  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: Spacing.sm,
    marginLeft: 2,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    position: "relative",
    ...Shadow,
  },
  tileBadgeWrap: { marginBottom: 8 },
  tileName: {
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.textDark,
    textAlign: "center",
    lineHeight: 15,
  },
  tileNameLocked: { color: colors.textMuted, fontWeight: "600" },
  pinToggle: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },

  errorText: {
    fontSize: 15,
    color: colors.danger,
    textAlign: "center",
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  retryText: { color: colors.surface, fontWeight: "700", fontSize: 14 },
});
