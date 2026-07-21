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
import BadgeIcon from "../components/BadgeIcon";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { useTheme } from "../context/ThemeContext";
import { Radius, Shadow, Spacing } from "../theme/colors";
import { useTranslation } from "react-i18next";

function formatTimeAgo(dateString) {
  if (!dateString) return null;
  const diffDays = Math.floor((Date.now() - new Date(dateString)) / 86400000);
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
  const months = Math.floor(diffDays / 30);
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""}`;
  const years = Math.floor(diffDays / 365);
  return `${years} year${years !== 1 ? "s" : ""}`;
}

// "How long have you been gluten-free?" onboarding answer → Your Journey step.
const EXPERIENCE_TO_STEP = {
  just_started: 0,
  "1_to_6_months": 1,
  "6_to_12_months": 2,
  "1_to_3_years": 3,
  "3_plus_years": 4,
};

function daysSince(dateString) {
  if (!dateString) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(dateString)) / 86400000));
}

const mascot = require("../../assets/mascot.png");

export default function AccountScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const JOURNEY_STEPS = [
    { key: "beginner", label: t("account.journey.beginner") },
    { key: "aware", label: t("account.journey.aware") },
    { key: "safeEater", label: t("account.journey.safeEater") },
    { key: "fighter", label: t("account.journey.fighter") },
    { key: "titan", label: t("account.journey.titan") },
  ];

  const ROLE_META = {
    warrior: {
      label: t("account.roles.warrior.label"),
      icon: "shield",
      desc: t("account.roles.warrior.desc"),
    },
    supporter: {
      label: t("account.roles.supporter.label"),
      icon: "person-add",
      desc: t("account.roles.supporter.desc"),
    },
    professional: {
      label: t("account.roles.professional.label"),
      icon: "basket",
      desc: t("account.roles.professional.desc"),
    },
    unset: {
      label: t("account.roles.unset.label"),
      icon: "info",
      desc: t("account.roles.unset.desc"),
    },
    admin: {
      label: t("account.roles.admin.label"),
      icon: "shield-check",
      desc: t("account.roles.admin.desc"),
    },
  };

  const { user, token, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(!isAdmin);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);

  const fetchProfile = useCallback(async () => {
    if (isAdmin) {
      // Admins are staff accounts, not gamified end users — nothing to fetch.
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.getGamificationProfile(token);
      setProfileData(data);
    } catch (err) {
      setError(err.message || t("account.errorLoad"));
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (isAdmin) return;
    let cancelled = false;
    api
      .events(token)
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token, isAdmin]);

  const handleLogout = () => {
    Alert.alert(t("account.logoutTitle"), t("account.logoutMsg"), [
      { text: t("account.cancel"), style: "cancel" },
      { text: t("account.logout"), style: "destructive", onPress: logout },
    ]);
  };

  const handlePrivacySecurity = () => {
    navigation.navigate("Legal", { section: "privacy" });
  };

  if (loading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen style={styles.centered}>
        <Text style={styles.errorMsg}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchProfile}>
          <Text style={styles.retryText}>{t("account.retry")}</Text>
        </TouchableOpacity>
      </Screen>
    );
  }

  const {
    gamification,
    earnedBadges = [],
    pinnedBadges = [],
    inProgressBadges = [],
  } = profileData || {};

  const attendingEvents = events.filter((ev) => ev.isGoing);

  const isProfessional = user?.role === "professional";
  const roleType = user?.role_type;
  const roleMeta = isAdmin
    ? ROLE_META.admin
    : isProfessional
      ? ROLE_META.professional
      : ROLE_META[roleType] || ROLE_META.unset;
  const accentColor = isAdmin || isProfessional ? colors.secondary : colors.primary;
  const accentPale = isAdmin || isProfessional ? colors.secondaryPale : colors.primaryPale;
  const currentTitle = gamification?.currentTitle || t("account.newcomer");
  const level = gamification?.currentLevel ?? 1;
  const totalXp = gamification?.totalXp ?? 0;
  const currentStreak = gamification?.currentStreak ?? 0;
  const longestStreak = gamification?.longestStreak ?? 0;
  const nextMin = gamification?.nextLevelXp ?? totalXp;
  const xpProgress = gamification?.progressRatio ?? 0;
  const timeAgo = formatTimeAgo(user?.gluten_free_since);
  const activeStep = EXPERIENCE_TO_STEP[user?.experience_level] ?? 0;
  const daysOnGlutenia = daysSince(user?.createdAt);
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
          <Pressable
            style={styles.avatarWrap}
            onPress={() => navigation.navigate("EditProfile")}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <AppIcon name="person" size={40} color={colors.primary} />
              </View>
            )}
            <View style={[styles.avatarBadge, { backgroundColor: accentColor }]}>
              <AppIcon name={roleMeta.icon} size={13} color="#fff" strokeWidth={2.5} />
            </View>
          </Pressable>
          <Text style={styles.userName}>{user?.name}</Text>
          <View style={[styles.titlePill, { backgroundColor: accentColor }]}>
            <Text style={styles.titlePillText}>
              {isAdmin || isProfessional ? roleMeta.label : currentTitle}
            </Text>
          </View>
          {timeAgo ? (
            <Text style={styles.timeText}>
              {roleType === "supporter" ? t("account.supportingFor") : t("account.glutenFreeFor")}{" "}
              {timeAgo} 🌿
            </Text>
          ) : null}
        </View>

        {/* ── B. XP / Level card (not applicable to professional/seller or admin accounts) ── */}
        {!isProfessional && !isAdmin && (
          <View style={styles.xpCard}>
            <View style={styles.xpRow}>
              <View>
                <Text style={styles.xpLevelNum}>{t("account.level", { level })}</Text>
                <Text style={styles.xpTitleSub}>{currentTitle}</Text>
              </View>
              <View style={styles.xpChip}>
                <Text style={styles.xpChipText}>{totalXp} {t("account.xp")}</Text>
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
              {t("account.xpHint", { current: totalXp, next: nextMin, nextLevel: level + 1 })}
            </Text>
            <Text style={styles.progressHint}>{t("account.progressHint")}</Text>
          </View>
        )}

        {/* ── C. Stats row (not applicable to professional/seller or admin accounts) ── */}
        {!isProfessional && !isAdmin && (
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>🔥 {currentStreak}</Text>
              <Text style={styles.statLabel}>{t("account.streak")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>⚡ {longestStreak}</Text>
              <Text style={styles.statLabel}>{t("account.best")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>🌱 {daysOnGlutenia}</Text>
              <Text style={styles.statLabel}>{t("account.daysOnGlutenia")}</Text>
            </View>
          </View>
        )}

        {/* ── D. Role card ───────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>{t("account.yourRole")}</Text>
        <View style={[styles.roleCard, { backgroundColor: accentPale }]}>
          <View style={styles.roleIconWrap}>
            <AppIcon name={roleMeta.icon} size={32} color={accentColor} />
          </View>
          <View style={styles.roleTextWrap}>
            <Text style={styles.roleTitle}>{roleMeta.label}</Text>
            <Text style={styles.roleDesc}>{roleMeta.desc}</Text>
          </View>
        </View>

        {/* ── E. Journey (not applicable to professional/seller or admin accounts) ──── */}
        {!isProfessional && !isAdmin && (
          <>
            <Text style={[styles.sectionLabel, styles.mt]}>{t("account.yourJourney")}</Text>
            <View style={styles.journeyCard}>
              <View style={styles.journeyTrack}>
                {JOURNEY_STEPS.flatMap((step, index) => {
                  const isDone = index <= activeStep;
                  const nodes = [];
                  if (index > 0) {
                    nodes.push(
                      <View
                        key={`line-${step.key}`}
                        style={[styles.trackLine, isDone ? styles.lineDone : styles.lineGray]}
                      />
                    );
                  }
                  nodes.push(
                    <View
                      key={`dot-${step.key}`}
                      style={[styles.stepCircle, isDone ? styles.circleDone : styles.circleGray]}
                    />
                  );
                  return nodes;
                })}
              </View>
              <View style={styles.journeyLabels}>
                {JOURNEY_STEPS.map((step, index) => (
                  <Text
                    key={step.key}
                    style={[styles.stepLbl, index === activeStep && styles.stepLblActive]}
                    numberOfLines={1}
                  >
                    {step.label}
                  </Text>
                ))}
              </View>
            </View>
          </>
        )}

        {/* ── E.2 Seller activity (professionals only) ─────────────────────── */}
        {isProfessional && (
          <>
            <Text style={[styles.sectionLabel, styles.mt]}>{t("account.activity")}</Text>
            <View style={styles.activityCard}>
              <Pressable
                style={styles.settingsRow}
                onPress={() => navigation.navigate("SellerEstablishment")}
              >
                <View style={styles.settingsLeft}>
                  <View style={[styles.iconWrap, { backgroundColor: accentPale }]}>
                    <AppIcon name="basket" size={20} color={accentColor} />
                  </View>
                  <Text style={styles.settingsLabel}>{t("account.myBusiness")}</Text>
                </View>
                <AppIcon name="chevron-right" size={20} color={colors.textMuted} />
              </Pressable>

              <View style={styles.divider} />

              <Pressable
                style={styles.settingsRow}
                onPress={() => navigation.navigate("SellerProducts")}
              >
                <View style={styles.settingsLeft}>
                  <View style={[styles.iconWrap, { backgroundColor: accentPale }]}>
                    <AppIcon name="search" size={20} color={accentColor} />
                  </View>
                  <Text style={styles.settingsLabel}>{t("account.myProducts")}</Text>
                </View>
                <AppIcon name="chevron-right" size={20} color={colors.textMuted} />
              </Pressable>

              <View style={styles.divider} />

              <Pressable
                style={styles.settingsRow}
                onPress={() => navigation.navigate("SellerVisibility")}
              >
                <View style={styles.settingsLeft}>
                  <View style={[styles.iconWrap, { backgroundColor: accentPale }]}>
                    <AppIcon name="eye" size={20} color={accentColor} />
                  </View>
                  <Text style={styles.settingsLabel}>{t("account.visibility")}</Text>
                </View>
                <AppIcon name="chevron-right" size={20} color={colors.textMuted} />
              </Pressable>

              <View style={styles.divider} />

              <Pressable
                style={styles.settingsRow}
                onPress={() => navigation.navigate("SellerOrders")}
              >
                <View style={styles.settingsLeft}>
                  <View style={[styles.iconWrap, { backgroundColor: accentPale }]}>
                    <AppIcon name="receipt" size={20} color={accentColor} />
                  </View>
                  <Text style={styles.settingsLabel}>{t("account.sellerOrders")}</Text>
                </View>
                <AppIcon name="chevron-right" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
          </>
        )}

        {/* ── F. Badges ──────────────────────────────────────────────────── */}
        {badgesToShow.length > 0 && (
          <>
            <View style={[styles.badgeSectionRow, styles.mt]}>
              <Text style={styles.sectionLabel}>
                {pinnedBadges.length > 0 ? t("account.pinnedBadges") : t("account.recentBadges")}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("BadgeCollection")}>
                <Text style={styles.viewAllLink}>{t("account.viewAll")}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.badgesWrap}>
              {badgesToShow.map((ub) => {
                const badge = ub.badgeId;
                if (!badge) return null;
                return (
                  <Pressable
                    key={String(ub._id || badge.slug)}
                    style={styles.badgeMiniWrap}
                    onPress={() => navigation.navigate("BadgeCollection")}
                  >
                    <BadgeIcon badge={badge} size={44} locked={false} />
                    <Text style={styles.badgeMiniName} numberOfLines={1}>
                      {t(`badges.catalog.${badge.slug}.name`, { defaultValue: badge.name })}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {/* ── G. Badges in progress ────────────────────────────────────────── */}
        {inProgressBadges.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, styles.mt]}>{t("account.inProgress")}</Text>
            <View style={styles.achCard}>
              {inProgressBadges.map((entry, idx) => {
                const { badge, currentProgress, ratio } = entry;
                return (
                  <Pressable
                    key={badge.slug}
                    style={[styles.achRow, idx > 0 && styles.achBorder]}
                    onPress={() => navigation.navigate("BadgeCollection")}
                  >
                    <BadgeIcon badge={badge} size={36} locked progressRatio={ratio} />
                    <View style={styles.achInfo}>
                      <Text style={styles.achName} numberOfLines={1}>
                        {t(`badges.catalog.${badge.slug}.name`, { defaultValue: badge.name })}
                      </Text>
                      <View style={styles.achTrack}>
                        <View
                          style={[
                            styles.achFill,
                            { width: `${Math.round(Math.min(1, ratio) * 100)}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.achCount}>
                        {currentProgress} / {badge.targetValue}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {/* ── H. Ecosystem card (not applicable to admin accounts) ─────────── */}
        {!isAdmin && (
          <View style={styles.ecoCard}>
            <Image source={mascot} style={styles.mascot} resizeMode="contain" />
            <Text style={styles.ecoText}>
              {t("account.ecoText")}
            </Text>
          </View>
        )}

        {/* ── I. Events attending ────────────────────────────────────────── */}
        {attendingEvents.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, styles.mt]}>{t("account.eventsAttending")}</Text>
            <View style={styles.eventsCard}>
              {attendingEvents.map((ev, idx) => (
                <View
                  key={ev._id}
                  style={[styles.eventRow, idx > 0 && styles.eventBorder]}
                >
                  <View style={[styles.eventEmoji, { backgroundColor: ev.color }]}>
                    <Text style={styles.eventEmojiText}>{ev.emoji}</Text>
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle} numberOfLines={1}>{ev.title}</Text>
                    <Text style={styles.eventDate}>{ev.date}</Text>
                  </View>
                  <Text style={styles.eventPrice}>
                    {ev.price === 0 ? t("account.free") : `${ev.price} TND`}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── J. Orders + Settings ───────────────────────────────────────── */}
        <View style={styles.settingsList}>
          {!isAdmin && (
            <>
              <Pressable style={styles.settingsRow} onPress={() => navigation.navigate("Orders")}>
                <View style={styles.settingsLeft}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.secondaryPale }]}>
                    <AppIcon name="receipt" size={20} color={colors.secondary} />
                  </View>
                  <Text style={styles.settingsLabel}>{t("account.myOrders")}</Text>
                </View>
                <AppIcon name="chevron-right" size={20} color={colors.textMuted} />
              </Pressable>

              <View style={styles.divider} />

              <Pressable
                style={styles.settingsRow}
                onPress={() => navigation.navigate("PatientResources")}
              >
                <View style={styles.settingsLeft}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.secondaryPale }]}>
                    <AppIcon name="activity" size={20} color={colors.secondary} />
                  </View>
                  <Text style={styles.settingsLabel}>{t("home.patientResources")}</Text>
                </View>
                <AppIcon name="chevron-right" size={20} color={colors.textMuted} />
              </Pressable>

              <View style={styles.divider} />
            </>
          )}

          <Pressable style={styles.settingsRow} onPress={() => navigation.navigate("Settings")}>
            <View style={styles.settingsLeft}>
              <View style={[styles.iconWrap, { backgroundColor: colors.secondaryPale }]}>
                <AppIcon name="settings" size={20} color={colors.secondary} />
              </View>
              <Text style={styles.settingsLabel}>{t("account.settings")}</Text>
            </View>
            <AppIcon name="chevron-right" size={20} color={colors.textMuted} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.settingsRow} onPress={handlePrivacySecurity}>
            <View style={styles.settingsLeft}>
              <View style={[styles.iconWrap, { backgroundColor: colors.secondaryPale }]}>
                <AppIcon name="shield-check" size={20} color={colors.secondary} />
              </View>
              <Text style={styles.settingsLabel}>{t("account.privacySecurity")}</Text>
            </View>
            <AppIcon name="chevron-right" size={20} color={colors.textMuted} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.settingsRow} onPress={handleLogout}>
            <View style={styles.settingsLeft}>
              <View style={[styles.iconWrap, { backgroundColor: colors.secondaryPale }]}>
                <AppIcon name="log-out" size={20} color={colors.secondary} />
              </View>
              <Text style={[styles.settingsLabel, styles.settingsLabelDanger]}>
                {t("account.logout")}
              </Text>
            </View>
            <AppIcon name="chevron-right" size={20} color={colors.textMuted} />
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const getStyles = (colors) => StyleSheet.create({
  centered: { alignItems: "center", justifyContent: "center" },
  errorMsg: {
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

  scroll: { paddingBottom: 48 },
  mt: { marginTop: Spacing.lg },

  // ── A. Avatar ────────────────────────────────────────────────────────────
  avatarSection: { alignItems: "center", paddingTop: 32, paddingBottom: 8 },
  avatarWrap: { position: "relative", width: 90, height: 90, marginBottom: 14 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textDark,
    textAlign: "center",
    marginBottom: 8,
  },
  titlePill: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 6,
  },
  titlePillText: { color: colors.surface, fontSize: 12, fontWeight: "700" },
  timeText: { fontSize: 13, color: colors.textMuted, marginTop: 4, textAlign: "center" },

  // ── B. XP card ───────────────────────────────────────────────────────────
  xpCard: {
    backgroundColor: colors.surface,
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
  xpLevelNum: { fontSize: 18, fontWeight: "800", color: colors.textDark },
  xpTitleSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  xpChip: {
    backgroundColor: colors.primaryPale,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  xpChipText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  xpTrack: {
    height: 8,
    backgroundColor: colors.divider,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  xpFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 4 },
  xpHint: { fontSize: 12, color: colors.textMuted, textAlign: "right" },
  progressHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 8,
    lineHeight: 15,
    fontStyle: "italic",
  },

  // ── C. Stats ─────────────────────────────────────────────────────────────
  statsCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    ...Shadow,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 16, fontWeight: "700", color: colors.textDark, marginBottom: 4 },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  statDivider: { width: 1, backgroundColor: colors.divider, marginVertical: 4 },

  // ── Section label ─────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 12,
    color: colors.textMuted,
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
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  roleTextWrap: { flex: 1 },
  roleTitle: { fontSize: 15, fontWeight: "700", color: colors.textDark, marginBottom: 4 },
  roleDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },

  // ── E.2 Seller activity ──────────────────────────────────────────────────
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.md,
    paddingHorizontal: Spacing.md,
    ...Shadow,
  },

  // ── E. Journey ────────────────────────────────────────────────────────────
  journeyCard: {
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    ...Shadow,
  },
  journeyTrack: { flexDirection: "row", alignItems: "center", width: "100%" },
  journeyLabels: { flexDirection: "row", marginTop: 6 },
  trackLine: { flex: 1, height: 2 },
  lineDone: { backgroundColor: colors.primary },
  lineGray: { backgroundColor: colors.divider },
  stepCircle: { width: 14, height: 14, borderRadius: 7 },
  circleDone: { backgroundColor: colors.primary },
  circleGray: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.divider },
  stepLbl: { flex: 1, fontSize: 10, color: colors.textMuted, textAlign: "center" },
  stepLblActive: { color: colors.primary, fontWeight: "700" },

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
    color: colors.primary,
  },
  badgesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginHorizontal: Spacing.md,
  },
  badgeMiniWrap: { alignItems: "center", width: 64 },
  badgeMiniName: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textDark,
    marginTop: 6,
    textAlign: "center",
  },

  // ── G. Badges in progress ────────────────────────────────────────────────
  achCard: {
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.md,
    overflow: "hidden",
    ...Shadow,
  },
  achRow: { flexDirection: "row", alignItems: "center", padding: Spacing.md, gap: Spacing.md },
  achBorder: { borderTopWidth: 1, borderTopColor: colors.divider },
  achInfo: { flex: 1 },
  achName: { fontSize: 14, fontWeight: "600", color: colors.textDark, marginBottom: 8 },
  achTrack: {
    height: 6,
    backgroundColor: colors.divider,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  achFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 3 },
  achCount: { fontSize: 11, color: colors.textMuted, textAlign: "right" },

  // ── H. Eco card ───────────────────────────────────────────────────────────
  ecoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryPale,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    gap: 12,
  },
  mascot: { width: 56, height: 56 },
  ecoText: { flex: 1, fontSize: 14, fontWeight: "500", color: colors.textDark, lineHeight: 20 },

  // ── I. Events ─────────────────────────────────────────────────────────────
  eventsCard: {
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.md,
    overflow: "hidden",
    ...Shadow,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: 12,
  },
  eventBorder: { borderTopWidth: 1, borderTopColor: colors.divider },
  eventEmoji: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  eventEmojiText: { fontSize: 22 },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 14, fontWeight: "700", color: colors.textDark, marginBottom: 3 },
  eventDate: { fontSize: 12, color: colors.textMuted },
  eventPrice: { fontSize: 13, fontWeight: "800", color: colors.primary },

  // ── J. Settings ───────────────────────────────────────────────────────────
  settingsList: { marginTop: 28, marginHorizontal: Spacing.md },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  settingsLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  settingsLabel: { fontSize: 15, fontWeight: "500", color: colors.textDark },
  settingsLabelDanger: { color: colors.secondary },
  divider: { height: 1, backgroundColor: "#F0F0F0" },
});
