import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import AppIcon from "../../components/AppIcon";
import BarChartView from "../../components/charts/BarChartView";
import CurveChartView from "../../components/charts/CurveChartView";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

const ROLE_ORDER = ["customer", "professional", "admin"];
const ROLE_TYPE_ORDER = ["warrior", "supporter", "unset"];
const EXPERIENCE_ORDER = [
  "just_started",
  "1_to_6_months",
  "6_to_12_months",
  "1_to_3_years",
  "3_plus_years",
  "unset",
];
const GOAL_ORDER = [
  "manage_celiac",
  "manage_intolerance",
  "support_child",
  "support_partner",
  "dietary_choice",
  "exploring",
  "unset",
];
const CONFIDENCE_ORDER = ["low", "medium", "high", "unset"];

export default function AdminAnalyticsScreen({ navigation }) {
  const { t } = useTranslation();
  const { token, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await api.userAnalytics(token));
    } catch (err) {
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

  const toChartData = (order, counts, labels) =>
    order
      .map((key) => ({ label: labels[key], value: counts?.[key] || 0 }))
      .filter((item) => item.value > 0);

  const toTrendData = (trend) =>
    (trend || []).map((point) => ({
      label: point.date.slice(5),
      value: point.count,
    }));

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <AppIcon name="arrow-back" size={22} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("admin.analytics.title")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading && !data ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>{t("admin.retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={load}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          <View style={styles.heroCard}>
            <View style={styles.heroInfo}>
              <Text style={styles.heroLabel}>{t("admin.analytics.totalUsers")}</Text>
              <Text style={styles.heroValue}>{data.totalUsers}</Text>
            </View>
            <View style={styles.heroIconContainer}>
              <AppIcon name="people" size={24} color={Colors.primary} />
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
                data={toChartData(ROLE_ORDER, data.byRole, roleLabels)}
                color={Colors.primary}
              />
            </View>
          </View>

          <View style={styles.sectionGroup}>
            <Text style={styles.sectionLabel}>{t("admin.analytics.byRoleType")}</Text>
            <View style={styles.card}>
              <BarChartView
                data={toChartData(ROLE_TYPE_ORDER, data.byRoleType, roleTypeLabels)}
                color={Colors.secondary}
              />
            </View>
          </View>

          <View style={styles.sectionGroup}>
            <Text style={styles.sectionLabel}>{t("admin.analytics.byExperience")}</Text>
            <View style={styles.card}>
              <BarChartView
                data={toChartData(EXPERIENCE_ORDER, data.byExperienceLevel, experienceLabels)}
                color={Colors.primary}
              />
            </View>
          </View>

          <View style={styles.sectionGroup}>
            <Text style={styles.sectionLabel}>{t("admin.analytics.byGoal")}</Text>
            <View style={styles.card}>
              <BarChartView
                data={toChartData(GOAL_ORDER, data.byPrimaryGoal, goalLabels)}
                color={Colors.secondary}
              />
            </View>
          </View>

          <View style={styles.sectionGroup}>
            <Text style={styles.sectionLabel}>{t("admin.analytics.byConfidence")}</Text>
            <View style={styles.card}>
              <BarChartView
                data={toChartData(CONFIDENCE_ORDER, data.byConfidence, confidenceLabels)}
                color={Colors.primary}
              />
            </View>
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    color: Colors.textDark,
  },
  headerSpacer: { width: 30 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.md },
  errorText: {
    fontSize: 15,
    color: Colors.danger,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  retryText: { color: Colors.surface, fontWeight: "700", fontSize: 14 },
  scroll: {
    padding: Spacing.md,
    gap: Spacing.lg,
    paddingBottom: 48,
  },
  heroCard: {
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
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
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroValue: {
    fontSize: 32,
    fontWeight: "900",
    color: Colors.textDark,
    marginTop: 4,
  },
  heroIconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    ...Shadow,
  },
  sectionGroup: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    padding: Spacing.md,
    ...Shadow,
  },
});
