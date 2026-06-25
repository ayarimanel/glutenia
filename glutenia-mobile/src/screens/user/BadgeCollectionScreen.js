import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

const CATEGORY_LABELS = {
  journey: "Journey",
  scanner: "Scanner",
  community: "Community",
  safety: "Safety",
  discovery: "Discovery",
  supporter: "Supporter",
  secret: "Secret",
};

const CATEGORY_COLORS = {
  journey: Colors.primary,
  scanner: Colors.secondary,
  community: "#9C27B0",
  safety: "#FF9800",
  discovery: "#2196F3",
  supporter: "#00BCD4",
  secret: "#607D8B",
};

export default function BadgeCollectionScreen({ navigation }) {
  const { token } = useAuth();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pinningId, setPinningId] = useState(null);

  const fetchBadges = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMyBadges(token);
      setBadges(data);
    } catch (err) {
      setError(err.message || "Could not load badges.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  const pinnedCount = useMemo(
    () => badges.filter((ub) => ub.isPinned).length,
    [badges]
  );

  const sections = useMemo(() => {
    const groups = {};
    badges.forEach((ub) => {
      const cat = ub.badgeId?.category || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(ub);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, items]) => ({
        category,
        items: [...items].sort((a, b) =>
          (a.badgeId?.name || "").localeCompare(b.badgeId?.name || "")
        ),
      }));
  }, [badges]);

  const handlePinToggle = async (userBadge) => {
    if (pinningId) return;

    const badgeObjectId = userBadge.badgeId?._id;
    if (!badgeObjectId) return;

    const nextPinned = !userBadge.isPinned;

    // Optimistic update
    setBadges((prev) =>
      prev.map((ub) =>
        ub._id === userBadge._id ? { ...ub, isPinned: nextPinned } : ub
      )
    );
    setPinningId(userBadge._id);

    try {
      await api.updateBadgePin(token, badgeObjectId, nextPinned);
    } catch (err) {
      // Revert on failure
      setBadges((prev) =>
        prev.map((ub) =>
          ub._id === userBadge._id
            ? { ...ub, isPinned: userBadge.isPinned }
            : ub
        )
      );
      Alert.alert("Could not update badge", err.message || "Please try again.");
    } finally {
      setPinningId(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.root, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchBadges}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={22} color={Colors.textDark} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Badges</Text>
        <View style={[styles.pinChip, pinnedCount >= 3 && styles.pinChipFull]}>
          <Text
            style={[styles.pinChipText, pinnedCount >= 3 && styles.pinChipTextFull]}
          >
            {pinnedCount}/3 pinned
          </Text>
        </View>
      </View>

      {badges.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No badges yet</Text>
          <Text style={styles.emptyDesc}>
            Complete actions in the app to earn your first badge.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {sections.map(({ category, items }) => (
            <View key={category}>
              <Text style={styles.categoryHeader}>
                {CATEGORY_LABELS[category] || category}
              </Text>
              <View style={styles.group}>
                {items.map((ub, idx) => {
                  const badge = ub.badgeId;
                  if (!badge) return null;
                  const color = CATEGORY_COLORS[category] || Colors.textMuted;
                  const isThisOne = pinningId === ub._id;

                  return (
                    <View
                      key={String(ub._id)}
                      style={[
                        styles.card,
                        idx > 0 && styles.cardBorder,
                        ub.isPinned && styles.cardPinned,
                      ]}
                    >
                      <View
                        style={[
                          styles.iconBox,
                          { backgroundColor: color + "22" },
                        ]}
                      >
                        <Text style={[styles.iconLetter, { color }]}>
                          {badge.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.info}>
                        <Text style={styles.badgeName}>{badge.name}</Text>
                        {badge.description ? (
                          <Text style={styles.badgeDesc} numberOfLines={2}>
                            {badge.description}
                          </Text>
                        ) : null}
                      </View>

                      <TouchableOpacity
                        style={styles.pinBtn}
                        onPress={() => handlePinToggle(ub)}
                        disabled={!!pinningId}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        {isThisOne ? (
                          <ActivityIndicator size="small" color={Colors.primary} />
                        ) : ub.isPinned ? (
                          <BookmarkCheck
                            size={22}
                            color={Colors.primary}
                            strokeWidth={2}
                          />
                        ) : (
                          <Bookmark
                            size={22}
                            color={Colors.textMuted}
                            strokeWidth={1.8}
                          />
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textDark,
    marginLeft: Spacing.sm,
  },
  pinChip: {
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pinChipFull: { backgroundColor: Colors.secondaryPale },
  pinChipText: { fontSize: 12, fontWeight: "700", color: Colors.primary },
  pinChipTextFull: { color: Colors.secondary },

  // List
  scroll: { padding: Spacing.md, paddingBottom: 40 },

  categoryHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    marginLeft: 2,
  },
  group: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: "hidden",
    ...Shadow,
  },

  // Badge card
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cardBorder: { borderTopWidth: 1, borderTopColor: Colors.divider },
  cardPinned: { backgroundColor: Colors.primaryPale },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconLetter: { fontSize: 18, fontWeight: "800" },

  info: { flex: 1 },
  badgeName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textDark,
    marginBottom: 2,
  },
  badgeDesc: { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },

  pinBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // Empty / error
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textDark,
    marginBottom: Spacing.sm,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    fontSize: 15,
    color: Colors.danger,
    textAlign: "center",
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  retryText: { color: Colors.surface, fontWeight: "700", fontSize: 14 },
});
