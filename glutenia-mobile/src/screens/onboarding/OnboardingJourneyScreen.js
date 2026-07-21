import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * MS_PER_DAY).toISOString();

const OPTIONS_META = [
  { key: "justStarted",       value: "just_started",   glutenFreeSince: daysAgo(0)    },
  { key: "lessThan6Months",   value: "1_to_6_months",  glutenFreeSince: daysAgo(90)   },
  { key: "sixTo12Months",     value: "6_to_12_months", glutenFreeSince: daysAgo(270)  },
  { key: "oneToThreeYears",   value: "1_to_3_years",   glutenFreeSince: daysAgo(730)  },
  { key: "moreThanThreeYears",value: "3_plus_years",   glutenFreeSince: daysAgo(1095) },
];

export default function OnboardingJourneyScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { roleType } = route.params;
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [selected, setSelected] = useState(null);

  const OPTIONS = OPTIONS_META.map((o) => ({
    ...o,
    label: t(`profileOnboarding.journey.${o.key}`),
  }));

  const question =
    roleType === "warrior"
      ? t("profileOnboarding.journey.questionWarrior")
      : t("profileOnboarding.journey.questionSupporter");

  const handleContinue = () => {
    const opt = OPTIONS.find((o) => o.value === selected);
    navigation.navigate("OnboardingGoal", {
      roleType,
      experienceLevel: opt.value,
      glutenFreeSince: opt.glutenFreeSince,
    });
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={22} color={colors.textDark} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.stepLabel}>{t("profileOnboarding.journey.step")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: "50%" }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.question}>{question}</Text>

        {OPTIONS.map((opt) => {
          const active = selected === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.card, active && styles.cardActive]}
              activeOpacity={0.75}
              onPress={() => setSelected(opt.value)}
            >
              <View style={styles.cardBody}>
                <Text style={[styles.cardLabel, active && styles.cardLabelActive]}>
                  {opt.label}
                </Text>
              </View>
              <View style={[styles.radio, active && styles.radioActive]}>
                {active && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, !selected && styles.btnDisabled]}
          disabled={!selected}
          activeOpacity={0.8}
          onPress={handleContinue}
        >
          <Text style={styles.btnText}>{t("profileOnboarding.role.continue")}</Text>
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
  cardLabel: { fontSize: 16, fontWeight: "700", color: colors.textDark },
  cardLabelActive: { color: colors.primary },

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
