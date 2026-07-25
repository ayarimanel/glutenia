import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import AppIcon from "../../components/AppIcon";
import BarChartView from "../../components/charts/BarChartView";
import CurveChartView from "../../components/charts/CurveChartView";
import { useAuthenticated } from "../../context/AuthContext";
import { api, type ApiError } from "../../api/client";
import { useTheme, type ThemeColors } from "../../context/ThemeContext";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import type { AppNavigation } from "../../navigation/types";
import type { UserAnalytics } from "../../types/models";

export default function AdminAnalyticsScreen({ navigation }: { navigation: AppNavigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { token, logout } = useAuthenticated();
  const [data, setData] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await api.userAnalytics(token));
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 401) {
        logout();
      } else {
        setError(err.message || t("admin.analytics.errorTitle"));
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const roleLabels = {
    customer: t("admin.analytics.roleCustomer"),
    professional: t("admin.analytics.roleProfessional"),
    admin: t("admin.analytics.roleAdmin"),
  };
  const roleTypeLabels = {
    warrior: t("profileOnboarding.role.warrior"),
    supporter: t("profileOnboarding.role.supporter"),
    unset: t("admin.analytics.unset"),
  };
  const experienceLabels = {
    just_started: t("profileOnboarding.journey.justStarted"),
    "1_to_6_months": t("profileOnboarding.journey.lessThan6Months"),
    "6_to_12_months": t("profileOnboarding.journey.sixTo12Months"),
    "1_to_3_years": t("profileOnboarding.journey.oneToThreeYears"),
    "3_plus_years": t("profileOnboarding.journey.moreThanThreeYears"),
    unset: t("admin.analytics.unset"),
  };
  const goalLabels = {
    manage_celiac: t("profileOnboarding.goal.manage_celiac"),
    manage_intolerance: t("profileOnboarding.goal.manage_intolerance"),
    support_child: t("profileOnboarding.goal.support_child"),
    support_partner: t("profileOnboarding.goal.support_partner"),
    dietary_choice: t("profileOnboarding.goal.dietary_choice"),
    exploring: t("profileOnboarding.goal.exploring"),
    unset: t("admin.analytics.unset"),
  };
  const confidenceLabels = {
    low: t("profileOnboarding.confidence.still_learning"),
    medium: t("profileOnboarding.confidence.getting_there"),
    high: t("profileOnboarding.confidence.confident"),
    unset: t("admin.analytics.unset"),
  };
  const eatingOutLabels = {
    rarely: t("profileOnboarding.eatingOut.rarely"),
    few_times_month: t("profileOnboarding.eatingOut.fewTimesMonth"),
    weekly: t("profileOnboarding.eatingOut.weekly"),
    multiple_week: t("profileOnboarding.eatingOut.multipleWeek"),
    unset: t("admin.analytics.unset"),
  };

  // Order is derived from each labels object's own key order (not a second,
  // hand-maintained array) so the two can never drift out of sync - the same
  // technique as AppIcon's IconName being `keyof typeof icons` instead of a
  // separately hand-typed union.
  const toChartData = <L extends Record<string, string>>(
    counts: Record<string, number> | undefined,
    labels: L
  ) =>
    (Object.keys(labels) as (keyof L & string)[])
      .map((key) => ({ label: labels[key], value: counts?.[key] || 0 }))
      .filter((item) => item.value > 0);

  const toTrendData = (trend: UserAnalytics["signupTrend"] | undefined) =>
    (trend || []).map((point) => ({
      label: point.date.slice(5),
      value: point.count,
    }));

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <AppIcon name="arrow-back" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("admin.analytics.title")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading && !data ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>{t("admin.retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : !data ? null : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={load}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.heroCard}>
            <View style={styles.heroInfo}>
              <Text style={styles.heroLabel}>{t("admin.analytics.totalUsers")}</Text>
              <Text style={styles.heroValue}>{data.totalUsers}</Text>
            </View>
            <View style={styles.heroIconContainer}>
              <AppIcon name="people" size={24} color={colors.primary} />
            </View>
          </View>

          <View style={styles.sectionGroup}>
            <Text style={styles.sectionLabel}>{t("admin.analytics.signupTrend")}</Text>
            <View style={styles.card}>
              <CurveChartView data={toTrendData(data.signupTrend)} />
            </View>
          </View>

          <View style={styles.sectionGroup}>
            <Text style={styles.sectionLabel}>{t("admin.analytics.byRole")}</Text>
            <View style={styles.card}>
              <BarChartView
                data={toChartData(data.byRole, roleLabels)}
                color={colors.primary}
              />
            </View>
          </View>

          <View style={styles.sectionGroup}>
            <Text style={styles.sectionLabel}>{t("admin.analytics.byRoleType")}</Text>
            <View style={styles.card}>
              <BarChartView
                data={toChartData(data.byRoleType, roleTypeLabels)}
                color={colors.secondary}
              />
            </View>
          </View>

          <View style={styles.sectionGroup}>
            <Text style={styles.sectionLabel}>{t("admin.analytics.byExperience")}</Text>
            <View style={styles.card}>
              <BarChartView
                data={toChartData(data.byExperienceLevel, experienceLabels)}
                color={colors.primary}
              />
            </View>
          </View>

          <View style={styles.sectionGroup}>
            <Text style={styles.sectionLabel}>{t("admin.analytics.byGoal")}</Text>
            <View style={styles.card}>
              <BarChartView
                data={toChartData(data.byPrimaryGoal, goalLabels)}
                color={colors.secondary}
              />
            </View>
          </View>

          <View style={styles.sectionGroup}>
            <Text style={styles.sectionLabel}>{t("admin.analytics.byEatingOut")}</Text>
            <View style={styles.card}>
              <BarChartView
                data={toChartData(data.byEatingOutFrequency, eatingOutLabels)}
                color={colors.secondary}
              />
            </View>
          </View>

          <View style={styles.sectionGroup}>
            <Text style={styles.sectionLabel}>{t("admin.analytics.byConfidence")}</Text>
            <View style={styles.card}>
              <BarChartView
                data={toChartData(data.byConfidence, confidenceLabels)}
                color={colors.primary}
              />
            </View>
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
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
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.md },
  errorText: {
    fontSize: 15,
    color: colors.danger,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  retryText: { color: colors.surface, fontWeight: "700", fontSize: 14 },
  scroll: {
    padding: Spacing.md,
    gap: Spacing.lg,
    paddingBottom: 48,
  },
  heroCard: {
    backgroundColor: colors.primaryPale,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...Shadow,
  },
  heroInfo: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroValue: {
    fontSize: 32,
    fontWeight: "900",
    color: colors.textDark,
    marginTop: 4,
  },
  heroIconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primaryLight,
    ...Shadow,
  },
  sectionGroup: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: colors.divider,
    padding: Spacing.md,
    ...Shadow,
  },
});
