import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

export default function OnboardingConfidenceScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { token, markProfileOnboardingComplete, updateUser } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const OPTIONS = [
    {
      label: t("profileOnboarding.confidence.still_learning"),
      subtitle: t("profileOnboarding.confidence.still_learningSub"),
      value: "low",
    },
    {
      label: t("profileOnboarding.confidence.getting_there"),
      subtitle: t("profileOnboarding.confidence.getting_thereSub"),
      value: "medium",
    },
    {
      label: t("profileOnboarding.confidence.confident"),
      subtitle: t("profileOnboarding.confidence.confidentSub"),
      value: "high",
    },
  ];

  const handleContinue = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.saveOnboardingProfile(token, {
        roleType: route.params.roleType,
        glutenFreeSince: route.params.glutenFreeSince,
        experienceLevel: route.params.experienceLevel,
        primaryGoal: route.params.primaryGoal,
        confidenceIdentifyingGf: selected,
      });
      await updateUser(result.user);
      await markProfileOnboardingComplete();
    } catch (err) {
      setError(err.message || t("profileOnboarding.confidence.error"));
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          disabled={loading}
        >
          <ArrowLeft size={22} color={colors.textDark} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.stepLabel}>{t("profileOnboarding.confidence.step")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: "100%" }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.question}>
          {t("profileOnboarding.confidence.question")}
        </Text>

        {OPTIONS.map((opt) => {
          const active = selected === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.card, active && styles.cardActive]}
              activeOpacity={0.75}
              onPress={() => !loading && setSelected(opt.value)}
            >
              <View style={styles.cardBody}>
                <Text style={[styles.cardLabel, active && styles.cardLabelActive]}>
                  {opt.label}
                </Text>
                <Text style={styles.cardSub}>{opt.subtitle}</Text>
              </View>
              <View style={[styles.radio, active && styles.radioActive]}>
                {active && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, (!selected || loading) && styles.btnDisabled]}
          disabled={!selected || loading}
          activeOpacity={0.8}
          onPress={handleContinue}
        >
          {loading ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.btnText}>{t("profileOnboarding.confidence.finish")}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: { width: 40 },
  stepLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },

  progressTrack: {
    height: 4,
    backgroundColor: colors.divider,
    marginHorizontal: Spacing.md,
    borderRadius: 2,
    marginBottom: Spacing.xl,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 2 },

  body: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg },

  question: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.textDark,
    marginBottom: Spacing.xl,
    lineHeight: 34,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow,
  },
  cardActive: { borderColor: colors.primary, backgroundColor: colors.primaryPale },
  cardBody: { flex: 1 },
  cardLabel: { fontSize: 16, fontWeight: "700", color: colors.textDark, marginBottom: 2 },
  cardLabelActive: { color: colors.primary },
  cardSub: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },

  errorText: {
    color: colors.danger,
    fontSize: 14,
    textAlign: "center",
    marginTop: Spacing.sm,
    lineHeight: 20,
  },

  footer: { padding: Spacing.md, paddingBottom: Spacing.lg },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: Radius.md,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: colors.surface, fontSize: 16, fontWeight: "700" },
});
