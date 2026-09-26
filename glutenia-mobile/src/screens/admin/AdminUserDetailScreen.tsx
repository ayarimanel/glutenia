import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import type { RouteProp } from "@react-navigation/native";
import Screen from "../../components/Screen";
import AppIcon, { type IconName } from "../../components/AppIcon";
import Field from "../../components/Field";
import { PrimaryButton, SecondaryButton } from "../../components/Buttons";
import { useAuthenticated } from "../../context/AuthContext";
import { api, type ApiError } from "../../api/client";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme, type ThemeColors } from "../../context/ThemeContext";
import { isValidPhone } from "../../utils/validation";
import type { AppNavigation, RootParamList } from "../../navigation/types";
import type { AdminUserDetail } from "../../types/models";

interface AdminUserDetailScreenProps {
  navigation: AppNavigation;
  route: RouteProp<RootParamList, "AdminUserDetail">;
}

// Admin view of one account: the same identity/progress information the
// user sees on their own profile, with editable name/email/phone and a
// delete action.
export default function AdminUserDetailScreen({ navigation, route }: AdminUserDetailScreenProps) {
  const { userId } = route.params;
  const { token, user: me } = useAuthenticated();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .user(token, userId)
      .then((data) => {
        setDetail(data);
        setName(data.user.name);
        setEmail(data.user.email);
        setPhone(data.user.phone || "");
      })
      .catch((err: ApiError) => {
        Alert.alert(t("admin.users.errorTitle"), err.message, [
          { text: t("admin.ok"), onPress: () => navigation.goBack() },
        ]);
      });
  }, [token, userId]);

  const isSelf = userId === me._id;

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError(t("admin.users.nameRequired"));
      return;
    }
    if (!isValidPhone(phone)) {
      setPhoneError(t("settings.editProfileScreen.phoneInvalid"));
      return;
    }

    try {
      setSaving(true);
      const updated = await api.updateUser(token, userId, {
        name: trimmedName,
        email: email.trim(),
        phone: phone.trim(),
      });
      setDetail((prev) => (prev ? { ...prev, user: updated } : prev));
      setEmail(updated.email);
      Alert.alert(t("admin.users.saved"), t("admin.users.savedMsg"));
    } catch (err) {
      Alert.alert(t("admin.users.saveFailed"), (err as ApiError).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!detail) return;
    Alert.alert(
      t("admin.users.deleteTitle"),
      t("admin.users.deleteMsg", { name: detail.user.name }),
      [
        { text: t("admin.users.cancel"), style: "cancel" },
        {
          text: t("admin.users.deleteConfirm"),
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await api.deleteUser(token, userId);
              navigation.goBack();
            } catch (err) {
              Alert.alert(t("admin.users.deleteFailed"), (err as ApiError).message);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const header = (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
        <AppIcon name="arrow-back" size={22} color={colors.textDark} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{t("admin.users.detailTitle")}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (!detail) {
    return (
      <Screen>
        {header}
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      </Screen>
    );
  }

  const { user, gamification, orderCount, establishment } = detail;
  const isCustomer = user.role === "customer";
  const isProfessional = user.role === "professional";
  const notSet = t("admin.users.notSet");

  const roleLabel =
    user.role === "admin"
      ? t("admin.users.roleAdmin")
      : isProfessional
        ? t("admin.users.roleProfessional")
        : t("admin.users.roleCustomer");

  // Same enum → label mapping AdminAnalyticsScreen uses, so onboarding
  // answers read identically across the admin area.
  const roleTypeLabels: Record<string, string> = {
    warrior: t("profileOnboarding.role.warrior"),
    supporter: t("profileOnboarding.role.supporter"),
  };
  const experienceLabels: Record<string, string> = {
    just_started: t("profileOnboarding.journey.justStarted"),
    "1_to_6_months": t("profileOnboarding.journey.lessThan6Months"),
    "6_to_12_months": t("profileOnboarding.journey.sixTo12Months"),
    "1_to_3_years": t("profileOnboarding.journey.oneToThreeYears"),
    "3_plus_years": t("profileOnboarding.journey.moreThanThreeYears"),
  };
  const goalLabels: Record<string, string> = {
    manage_celiac: t("profileOnboarding.goal.manage_celiac"),
    manage_intolerance: t("profileOnboarding.goal.manage_intolerance"),
    support_child: t("profileOnboarding.goal.support_child"),
    support_partner: t("profileOnboarding.goal.support_partner"),
    dietary_choice: t("profileOnboarding.goal.dietary_choice"),
    exploring: t("profileOnboarding.goal.exploring"),
  };
  const confidenceLabels: Record<string, string> = {
    low: t("profileOnboarding.confidence.still_learning"),
    medium: t("profileOnboarding.confidence.getting_there"),
    high: t("profileOnboarding.confidence.confident"),
  };

  const InfoRow = ({ icon, label, value }: { icon: IconName; label: string; value: string }) => (
    <View style={styles.infoRow}>
      <AppIcon name={icon} size={16} color={colors.secondary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
    </View>
  );

  return (
    <Screen>
      {header}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.avatarSection}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <AppIcon name="person" size={36} color={colors.primary} />
              </View>
            )}
            <Text style={styles.userName}>{user.name}</Text>
            <View style={[styles.rolePill, !isCustomer && styles.rolePillStaff]}>
              <Text style={styles.rolePillText}>{roleLabel}</Text>
            </View>
            <Text style={styles.joined}>
              {t("admin.users.joinedOn", { date: new Date(user.createdAt).toLocaleDateString() })}
            </Text>
          </View>

          <Text style={styles.sectionLabel}>{t("admin.users.info")}</Text>
          <View style={styles.card}>
            <Field
              label={t("admin.users.name")}
              value={name}
              onChangeText={(value) => {
                setName(value);
                setNameError("");
              }}
              error={nameError}
            />
            <Field
              label={t("admin.users.email")}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Field
              label={t("admin.users.phone")}
              value={phone}
              onChangeText={(value) => {
                setPhone(value);
                setPhoneError("");
              }}
              keyboardType="phone-pad"
              error={phoneError}
            />
            {isProfessional ? (
              <InfoRow
                icon="shield-check"
                label={t("admin.users.status")}
                value={user.professionalStatus || notSet}
              />
            ) : null}
          </View>

          <Text style={styles.sectionLabel}>{t("admin.users.activity")}</Text>
          <View style={styles.card}>
            {isCustomer ? (
              <>
                <InfoRow
                  icon="star"
                  label={t("admin.users.level")}
                  value={String(gamification?.currentLevel ?? 1)}
                />
                <InfoRow icon="activity" label={t("admin.users.xp")} value={String(gamification?.totalXp ?? 0)} />
                <InfoRow
                  icon="clock"
                  label={t("admin.users.streak")}
                  value={String(gamification?.currentStreak ?? 0)}
                />
              </>
            ) : null}
            <InfoRow icon="receipt" label={t("admin.users.orders")} value={String(orderCount)} />
            {isProfessional ? (
              <InfoRow
                icon="basket"
                label={t("admin.users.establishment")}
                value={
                  establishment
                    ? `${establishment.name} · ${
                        establishment.verified ? t("admin.users.verified") : t("admin.users.notVerified")
                      }`
                    : notSet
                }
              />
            ) : null}
          </View>

          {isCustomer ? (
            <>
              <Text style={styles.sectionLabel}>{t("admin.users.onboarding")}</Text>
              <View style={styles.card}>
                <InfoRow
                  icon="person"
                  label={t("admin.users.roleType")}
                  value={roleTypeLabels[user.role_type ?? ""] || notSet}
                />
                <InfoRow
                  icon="calendar"
                  label={t("admin.users.experience")}
                  value={experienceLabels[user.experience_level ?? ""] || notSet}
                />
                <InfoRow
                  icon="compass"
                  label={t("admin.users.goal")}
                  value={goalLabels[user.primary_goal ?? ""] || notSet}
                />
                <InfoRow
                  icon="shield"
                  label={t("admin.users.confidence")}
                  value={confidenceLabels[user.confidence_identifying_gf ?? ""] || notSet}
                />
              </View>
            </>
          ) : null}

          <PrimaryButton
            title={t("admin.users.save")}
            icon="checkmark-circle"
            loading={saving}
            disabled={deleting}
            onPress={handleSave}
          />
          {!isSelf ? (
            <SecondaryButton
              title={t("admin.users.delete")}
              icon="trash"
              disabled={saving || deleting}
              onPress={handleDelete}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  backBtn: { width: 30, padding: 4 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: colors.textDark,
  },
  headerSpacer: { width: 30 },
  loading: { marginVertical: Spacing.xl },
  scroll: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: 48,
  },
  avatarSection: { alignItems: "center", gap: 6 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textDark,
    textAlign: "center",
  },
  rolePill: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  rolePillStaff: { backgroundColor: colors.secondary },
  rolePillText: { color: colors.surface, fontSize: 12, fontWeight: "700" },
  joined: { fontSize: 13, color: colors.textMuted },
  sectionLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: Spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 12,
    ...Shadow,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  infoValue: {
    flex: 1,
    textAlign: "right",
    color: colors.textDark,
    fontSize: 14,
    fontWeight: "600",
  },
});
