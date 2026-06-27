import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Screen from "../components/Screen";
import AppIcon from "../components/AppIcon";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { Colors, Radius, Shadow, Spacing } from "../theme/colors";

// Thresholds: index i → minimum XP for level (i+1), levels 1–10
const LEVEL_THRESHOLDS = [0, 150, 350, 600, 800, 1200, 1800, 2200, 2700, 3500];

function getLevelProgress(level, totalXp) {
  const currentMin =
    level <= 10 ? LEVEL_THRESHOLDS[level - 1] : 3500 + (level - 10) * 800;
  const nextMin =
    level < 10 ? LEVEL_THRESHOLDS[level] : 3500 + (level - 9) * 800;
  const range = nextMin - currentMin;
  const progress = range > 0 ? Math.min(1, (totalXp - currentMin) / range) : 1;
  return { nextMin, progress };
}

function formatTimeAgo(dateString) {
  if (!dateString) return null;
  const diffDays = Math.floor((Date.now() - new Date(dateString)) / 86400000);
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
  const months = Math.floor(diffDays / 30);
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""}`;
  const years = Math.floor(diffDays / 365);
  return `${years} year${years !== 1 ? "s" : ""}`;
}

const JOURNEY_STEPS = [
  { label: "Beginner" },
  { label: "Aware" },
  { label: "Safe Eater" },
  { label: "Fighter" },
  { label: "Titan" },
];

function levelToStep(level) {
  if (level <= 1) return 0;
  if (level <= 3) return 1;
  if (level <= 5) return 2;
  if (level <= 8) return 3;
  return 4;
}

const ROLE_META = {
  warrior: {
    label: "Gluten-Free Warrior",
    icon: "shield",
    desc: "You actively manage your gluten-free lifestyle and inspire others.",
  },
  supporter: {
    label: "Supporter",
    icon: "person-add",
    desc: "You support someone on their gluten-free journey.",
  },
};

const mascot = require("../../assets/mascot.png");

export default function AccountScreen({ navigation }) {
  const { user, token, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getGamificationProfile(token);
      setProfileData(data);
    } catch (err) {
      setError(err.message || "Could not load profile data.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = () => {
    Alert.alert("Logout", "Sign out of Glutenia?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  if (loading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen style={styles.centered}>
        <Text style={styles.errorMsg}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchProfile}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </Screen>
    );
  }

  const {
    gamification,
    earnedBadges = [],
    pinnedBadges = [],
    topAchievements = [],
  } = profileData || {};

  const roleType = user?.role_type;
  const roleMeta = ROLE_META[roleType] || ROLE_META.warrior;
  const currentTitle = gamification?.currentTitle || "Newcomer";
  const level = gamification?.currentLevel ?? 1;
  const totalXp = gamification?.totalXp ?? 0;
  const currentStreak = gamification?.currentStreak ?? 0;
  const longestStreak = gamification?.longestStreak ?? 0;
  const { nextMin, progress: xpProgress } = getLevelProgress(level, totalXp);
  const timeAgo = formatTimeAgo(user?.gluten_free_since);
  const activeStep = levelToStep(level);
  const badgesToShow =
    pinnedBadges.length > 0 ? pinnedBadges : earnedBadges.slice(0, 3);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── A. Avatar ──────────────────────────────────────────────────── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <AppIcon name="person" size={40} color={Colors.primary} />
            </View>
            <View style={styles.avatarBadge}>
              <AppIcon name={roleMeta.icon} size={13} color="#fff" strokeWidth={2.5} />
            </View>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <View style={styles.titlePill}>
            <Text style={styles.titlePillText}>{currentTitle}</Text>
          </View>
          {timeAgo ? (
            <Text style={styles.timeText}>
              {roleType === "supporter" ? "Supporting for" : "Gluten-free for"}{" "}
              {timeAgo} 🌿
            </Text>
          ) : null}
        </View>

        {/* ── B. XP / Level card ─────────────────────────────────────────── */}
        <View style={styles.xpCard}>
          <View style={styles.xpRow}>
            <View>
              <Text style={styles.xpLevelNum}>Level {level}</Text>
              <Text style={styles.xpTitleSub}>{currentTitle}</Text>
            </View>
            <View style={styles.xpChip}>
              <Text style={styles.xpChipText}>{totalXp} XP</Text>
            </View>
          </View>
          <View style={styles.xpTrack}>
            <View
              style={[
                styles.xpFill,
                { width: `${Math.round(xpProgress * 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.xpHint}>
            {totalXp} / {nextMin} XP — Level {level + 1}
          </Text>
        </View>

        {/* ── C. Stats row ───────────────────────────────────────────────── */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>🔥 {currentStreak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>⚡ {longestStreak}</Text>
            <Text style={styles.statLabel}>Best</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>🏅 {earnedBadges.length}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
        </View>

        {/* ── D. Role card ───────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Your Role</Text>
        <View style={styles.roleCard}>
          <View style={styles.roleIconWrap}>
            <AppIcon name={roleMeta.icon} size={32} color={Colors.primary} />
          </View>
          <View style={styles.roleTextWrap}>
            <Text style={styles.roleTitle}>{roleMeta.label}</Text>
            <Text style={styles.roleDesc}>{roleMeta.desc}</Text>
          </View>
        </View>

        {/* ── E. Journey ─────────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, styles.mt]}>Your Journey</Text>
        <View style={styles.journeyCard}>
          <View style={styles.journeyRow}>
            {JOURNEY_STEPS.map((step, index) => {
              const isDone = index <= activeStep;
              const isCurrent = index === activeStep;
              return (
                <View key={step.label} style={styles.stepItem}>
                  <View style={styles.stepTrack}>
                    {index > 0 && (
                      <View
                        style={[
                          styles.trackLine,
                          isDone ? styles.lineDone : styles.lineGray,
                        ]}
                      />
                    )}
                    <View
                      style={[
                        styles.stepCircle,
                        isDone ? styles.circleDone : styles.circleGray,
                      ]}
                    />
                    {index < JOURNEY_STEPS.length - 1 && (
                      <View
                        style={[
                          styles.trackLine,
                          index < activeStep ? styles.lineDone : styles.lineGray,
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    style={[styles.stepLbl, isCurrent && styles.stepLblActive]}
                    numberOfLines={1}
                  >
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── F. Badges ──────────────────────────────────────────────────── */}
        {badgesToShow.length > 0 && (
          <>
            <View style={[styles.badgeSectionRow, styles.mt]}>
              <Text style={styles.sectionLabel}>
                {pinnedBadges.length > 0 ? "Pinned Badges" : "Recent Badges"}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("BadgeCollection")}>
                <Text style={styles.viewAllLink}>View all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.badgesWrap}>
              {badgesToShow.map((ub) => {
                const badge = ub.badgeId;
                if (!badge) return null;
                return (
                  <View key={String(ub._id || badge.slug)} style={styles.badgePill}>
                    <View style={styles.badgeDot} />
                    <Text style={styles.badgeName} numberOfLines={1}>
                      {badge.name}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ── G. Top achievements ────────────────────────────────────────── */}
        {topAchievements.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, styles.mt]}>In Progress</Text>
            <View style={styles.achCard}>
              {topAchievements.map((ua, idx) => {
                const ach = ua.achievementId;
                if (!ach) return null;
                const pct = Math.min(1, ua.currentProgress / ach.targetValue);
                return (
                  <View
                    key={String(ach.slug || idx)}
                    style={[styles.achRow, idx > 0 && styles.achBorder]}
                  >
                    <Text style={styles.achName} numberOfLines={1}>
                      {ach.name}
                    </Text>
                    <View style={styles.achTrack}>
                      <View
                        style={[
                          styles.achFill,
                          { width: `${Math.round(pct * 100)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.achCount}>
                      {ua.currentProgress} / {ach.targetValue}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ── H. Ecosystem card ──────────────────────────────────────────── */}
        <View style={styles.ecoCard}>
          <Image source={mascot} style={styles.mascot} resizeMode="contain" />
          <Text style={styles.ecoText}>
            Every action makes the ecosystem stronger.
          </Text>
        </View>

        {/* ── I. Orders + Settings ───────────────────────────────────────── */}
        <View style={styles.settingsList}>
          <Pressable style={styles.settingsRow} onPress={() => navigation.navigate("Orders")}>
            <View style={styles.settingsLeft}>
              <View style={[styles.iconWrap, { backgroundColor: Colors.primaryPale }]}>
                <AppIcon name="receipt" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.settingsLabel}>My Orders</Text>
            </View>
            <AppIcon name="chevron-right" size={20} color={Colors.textMuted} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.settingsRow}>
            <View style={styles.settingsLeft}>
              <View style={[styles.iconWrap, { backgroundColor: Colors.secondaryPale }]}>
                <AppIcon name="settings" size={20} color={Colors.secondary} />
              </View>
              <Text style={styles.settingsLabel}>Settings</Text>
            </View>
            <AppIcon name="chevron-right" size={20} color={Colors.textMuted} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.settingsRow}>
            <View style={styles.settingsLeft}>
              <View style={[styles.iconWrap, { backgroundColor: Colors.secondaryPale }]}>
                <AppIcon name="shield-check" size={20} color={Colors.secondary} />
              </View>
              <Text style={styles.settingsLabel}>Privacy & Security</Text>
            </View>
            <AppIcon name="chevron-right" size={20} color={Colors.textMuted} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.settingsRow} onPress={handleLogout}>
            <View style={styles.settingsLeft}>
              <View style={[styles.iconWrap, { backgroundColor: Colors.secondaryPale }]}>
                <AppIcon name="log-out" size={20} color={Colors.secondary} />
              </View>
              <Text style={[styles.settingsLabel, styles.settingsLabelDanger]}>
                Log out
              </Text>
            </View>
            <AppIcon name="chevron-right" size={20} color={Colors.textMuted} />
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: "center", justifyContent: "center" },
  errorMsg: {
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

  scroll: { paddingBottom: 48 },
  mt: { marginTop: Spacing.lg },

  // ── A. Avatar ────────────────────────────────────────────────────────────
  avatarSection: { alignItems: "center", paddingTop: 32, paddingBottom: 8 },
  avatarWrap: { position: "relative", width: 90, height: 90, marginBottom: 14 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textDark,
    textAlign: "center",
    marginBottom: 8,
  },
  titlePill: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 6,
  },
  titlePillText: { color: Colors.surface, fontSize: 12, fontWeight: "700" },
  timeText: { fontSize: 13, color: Colors.textMuted, marginTop: 4, textAlign: "center" },

  // ── B. XP card ───────────────────────────────────────────────────────────
  xpCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    ...Shadow,
  },
  xpRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  xpLevelNum: { fontSize: 18, fontWeight: "800", color: Colors.textDark },
  xpTitleSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  xpChip: {
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  xpChipText: { color: Colors.primary, fontWeight: "700", fontSize: 13 },
  xpTrack: {
    height: 8,
    backgroundColor: Colors.divider,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  xpFill: { height: "100%", backgroundColor: Colors.primary, borderRadius: 4 },
  xpHint: { fontSize: 12, color: Colors.textMuted, textAlign: "right" },

  // ── C. Stats ─────────────────────────────────────────────────────────────
  statsCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    ...Shadow,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 16, fontWeight: "700", color: Colors.textDark, marginBottom: 4 },
  statLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: "600" },
  statDivider: { width: 1, backgroundColor: Colors.divider, marginVertical: 4 },

  // ── Section label ─────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: Spacing.md,
    marginBottom: 6,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: Spacing.lg,
  },

  // ── D. Role card ──────────────────────────────────────────────────────────
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FAF0",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    gap: 12,
  },
  roleIconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  roleTextWrap: { flex: 1 },
  roleTitle: { fontSize: 15, fontWeight: "700", color: Colors.textDark, marginBottom: 4 },
  roleDesc: { fontSize: 13, color: Colors.textMuted, lineHeight: 19 },

  // ── E. Journey ────────────────────────────────────────────────────────────
  journeyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    ...Shadow,
  },
  journeyRow: { flexDirection: "row" },
  stepItem: { flex: 1, alignItems: "center" },
  stepTrack: { flexDirection: "row", alignItems: "center", width: "100%" },
  trackLine: { flex: 1, height: 2 },
  lineDone: { backgroundColor: Colors.primary },
  lineGray: { backgroundColor: Colors.divider },
  stepCircle: { width: 14, height: 14, borderRadius: 7 },
  circleDone: { backgroundColor: Colors.primary },
  circleGray: { backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.divider },
  stepLbl: { fontSize: 10, color: Colors.textMuted, marginTop: 6, textAlign: "center" },
  stepLblActive: { color: Colors.primary, fontWeight: "700" },

  // ── F. Badges ─────────────────────────────────────────────────────────────
  badgeSectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginRight: Spacing.md,
  },
  viewAllLink: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },
  badgesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginHorizontal: Spacing.md,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    ...Shadow,
  },
  badgeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  badgeName: { fontSize: 13, fontWeight: "600", color: Colors.textDark, maxWidth: 140 },

  // ── G. Achievements ───────────────────────────────────────────────────────
  achCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.md,
    overflow: "hidden",
    ...Shadow,
  },
  achRow: { padding: Spacing.md },
  achBorder: { borderTopWidth: 1, borderTopColor: Colors.divider },
  achName: { fontSize: 14, fontWeight: "600", color: Colors.textDark, marginBottom: 8 },
  achTrack: {
    height: 6,
    backgroundColor: Colors.divider,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  achFill: { height: "100%", backgroundColor: Colors.primary, borderRadius: 3 },
  achCount: { fontSize: 11, color: Colors.textMuted, textAlign: "right" },

  // ── H. Eco card ───────────────────────────────────────────────────────────
  ecoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    gap: 12,
  },
  mascot: { width: 56, height: 56 },
  ecoText: { flex: 1, fontSize: 14, fontWeight: "500", color: Colors.textDark, lineHeight: 20 },

  // ── I. Settings ───────────────────────────────────────────────────────────
  settingsList: { marginTop: 28, marginHorizontal: Spacing.md },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  settingsLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  settingsLabel: { fontSize: 15, fontWeight: "500", color: Colors.textDark },
  settingsLabelDanger: { color: Colors.secondary },
  divider: { height: 1, backgroundColor: "#F0F0F0" },
});
