import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import AppIcon from "../../components/AppIcon";
import { PrimaryButton } from "../../components/Buttons";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * MS_PER_DAY).toISOString();

const EXPERIENCE_META = [
  { value: "just_started", days: 0 },
  { value: "1_to_6_months", days: 90 },
  { value: "6_to_12_months", days: 270 },
  { value: "1_to_3_years", days: 730 },
  { value: "3_plus_years", days: 1095 },
];

function OptionGroup({ options, selected, onSelect, styles }) {
  return (
    <View style={{ gap: 10 }}>
      {options.map((opt) => {
        const active = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.card, active && styles.cardActive]}
            activeOpacity={0.75}
            onPress={() => onSelect(opt.value)}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardLabel, active && styles.cardLabelActive]}>
                {opt.label}
              </Text>
              {opt.subtitle ? <Text style={styles.cardSub}>{opt.subtitle}</Text> : null}
            </View>
            <View style={[styles.radio, active && styles.radioActive]}>
              {active && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function EditJourneyScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user, token, updateUser } = useAuth();

  const [roleType, setRoleType] = useState(user?.role_type || "warrior");
  const [experienceLevel, setExperienceLevel] = useState(user?.experience_level || "just_started");
  const [primaryGoal, setPrimaryGoal] = useState(user?.primary_goal || "exploring");
  const [eatingOutFrequency, setEatingOutFrequency] = useState(user?.eating_out_frequency || "rarely");
  const [confidence, setConfidence] = useState(user?.confidence_identifying_gf || "medium");
  const [saving, setSaving] = useState(false);

  const roleOptions = [
    { value: "warrior", label: t("profileOnboarding.role.warrior"), subtitle: t("profileOnboarding.role.warriorSub") },
    { value: "supporter", label: t("profileOnboarding.role.supporter"), subtitle: t("profileOnboarding.role.supporterSub") },
  ];

  const experienceOptions = [
    { value: "just_started", label: t("profileOnboarding.journey.justStarted") },
    { value: "1_to_6_months", label: t("profileOnboarding.journey.lessThan6Months") },
    { value: "6_to_12_months", label: t("profileOnboarding.journey.sixTo12Months") },
    { value: "1_to_3_years", label: t("profileOnboarding.journey.oneToThreeYears") },
    { value: "3_plus_years", label: t("profileOnboarding.journey.moreThanThreeYears") },
  ];

  const goalOptions = [
    { value: "manage_celiac", label: t("profileOnboarding.goal.manage_celiac") },
    { value: "manage_intolerance", label: t("profileOnboarding.goal.manage_intolerance") },
    { value: "support_child", label: t("profileOnboarding.goal.support_child") },
    { value: "support_partner", label: t("profileOnboarding.goal.support_partner") },
    { value: "dietary_choice", label: t("profileOnboarding.goal.dietary_choice") },
    { value: "exploring", label: t("profileOnboarding.goal.exploring") },
  ];

  const eatingOutOptions = [
    { value: "rarely", label: t("profileOnboarding.eatingOut.rarely") },
    { value: "few_times_month", label: t("profileOnboarding.eatingOut.fewTimesMonth") },
    { value: "weekly", label: t("profileOnboarding.eatingOut.weekly") },
    { value: "multiple_week", label: t("profileOnboarding.eatingOut.multipleWeek") },
  ];

  const confidenceOptions = [
    { value: "low", label: t("profileOnboarding.confidence.still_learning"), subtitle: t("profileOnboarding.confidence.still_learningSub") },
    { value: "medium", label: t("profileOnboarding.confidence.getting_there"), subtitle: t("profileOnboarding.confidence.getting_thereSub") },
    { value: "high", label: t("profileOnboarding.confidence.confident"), subtitle: t("profileOnboarding.confidence.confidentSub") },
  ];

  const handleSave = async () => {
    try {
      setSaving(true);
      // Preserve the user's real start date — only fall back to an
      // approximation from the experience bracket if no real date exists
      // yet. Re-deriving it from the bracket on every edit would silently
      // reset the "gluten-free for X" stat shown on the profile.
      const experienceMeta = EXPERIENCE_META.find((o) => o.value === experienceLevel);
      const glutenFreeSince =
        user?.gluten_free_since || (experienceMeta ? daysAgo(experienceMeta.days) : null);
      const result = await api.saveOnboardingProfile(token, {
        roleType,
        glutenFreeSince,
        experienceLevel,
        primaryGoal,
        eatingOutFrequency,
        confidenceIdentifyingGf: confidence,
      });
      await updateUser(result.user);
      Alert.alert(
        t("editJourney.success"),
        t("editJourney.successMsg"),
        [{ text: t("settings.ok"), onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(t("editJourney.failed"), error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} activeOpacity={0.7}>
          <AppIcon name="arrow-back" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("editJourney.title")}</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>{t("profileOnboarding.role.question")}</Text>
        <OptionGroup options={roleOptions} selected={roleType} onSelect={setRoleType} styles={styles} />

        <Text style={styles.sectionTitle}>
          {roleType === "warrior"
            ? t("profileOnboarding.journey.questionWarrior")
            : t("profileOnboarding.journey.questionSupporter")}
        </Text>
        <OptionGroup options={experienceOptions} selected={experienceLevel} onSelect={setExperienceLevel} styles={styles} />

        <Text style={styles.sectionTitle}>{t("profileOnboarding.goal.question")}</Text>
        <OptionGroup options={goalOptions} selected={primaryGoal} onSelect={setPrimaryGoal} styles={styles} />

        <Text style={styles.sectionTitle}>{t("profileOnboarding.eatingOut.question")}</Text>
        <OptionGroup options={eatingOutOptions} selected={eatingOutFrequency} onSelect={setEatingOutFrequency} styles={styles} />

        <Text style={styles.sectionTitle}>{t("profileOnboarding.confidence.question")}</Text>
        <OptionGroup options={confidenceOptions} selected={confidence} onSelect={setConfidence} styles={styles} />

        <PrimaryButton
          title={t("editJourney.save")}
          icon="checkmark-circle"
          loading={saving}
          onPress={handleSave}
          style={{ marginTop: Spacing.lg }}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  );
}

const getStyles = (colors) => StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  headerBtn: { width: 30, padding: 4 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: colors.textDark,
  },
  container: {
    padding: Spacing.md,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textDark,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: Spacing.md,
    ...Shadow,
  },
  cardActive: { borderColor: colors.primary, backgroundColor: colors.primaryPale },
  cardLabel: { fontSize: 15, fontWeight: "700", color: colors.textDark },
  cardLabelActive: { color: colors.primary },
  cardSub: { fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
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
});
