import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

export default function OnboardingGoalScreen({ navigation, route }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);

  const OPTIONS = [
    { label: t("profileOnboarding.goal.manage_celiac"), value: "manage_celiac" },
    { label: t("profileOnboarding.goal.manage_intolerance"), value: "manage_intolerance" },
    { label: t("profileOnboarding.goal.support_child"), value: "support_child" },
    { label: t("profileOnboarding.goal.support_partner"), value: "support_partner" },
    { label: t("profileOnboarding.goal.dietary_choice"), value: "dietary_choice" },
    { label: t("profileOnboarding.goal.exploring"), value: "exploring" },
  ];

  const handleContinue = () => {
    navigation.navigate("OnboardingConfidence", {
      ...route.params,
      primaryGoal: selected,
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
          <ArrowLeft size={22} color={Colors.textDark} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.stepLabel}>{t("profileOnboarding.goal.step")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: "75%" }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.question}>
          {t("profileOnboarding.goal.question")}
        </Text>

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
          <Text style={styles.btnText}>{t("profileOnboarding.goal.continue")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

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
    color: Colors.textMuted,
  },

  progressTrack: {
    height: 4,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.md,
    borderRadius: 2,
    marginBottom: Spacing.xl,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: Colors.primary, borderRadius: 2 },

  body: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg },

  question: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.textDark,
    marginBottom: Spacing.xl,
    lineHeight: 34,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow,
  },
  cardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryPale },
  cardBody: { flex: 1 },
  cardLabel: { fontSize: 15, fontWeight: "700", color: Colors.textDark },
  cardLabelActive: { color: Colors.primary },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },

  footer: { padding: Spacing.md, paddingBottom: Spacing.lg },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: Colors.surface, fontSize: 16, fontWeight: "700" },
});
