import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

const OPTIONS = [
  {
    emoji: "😅",
    label: "Still learning",
    subtitle: "I'm never quite sure",
    value: "low",
  },
  {
    emoji: "🤔",
    label: "Getting there",
    subtitle: "I know the basics",
    value: "medium",
  },
  {
    emoji: "💪",
    label: "Confident",
    subtitle: "I read labels well",
    value: "high",
  },
];

export default function OnboardingConfidenceScreen({ navigation, route }) {
  const { token, markProfileOnboardingComplete, updateUser } = useAuth();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      setError(err.message || "Something went wrong. Please try again.");
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
          <ArrowLeft size={22} color={Colors.textDark} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.stepLabel}>Step 4 of 4</Text>
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
          How confident are you at identifying gluten-free products?
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
              <Text style={styles.cardEmoji}>{opt.emoji}</Text>
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
            <ActivityIndicator color={Colors.surface} />
          ) : (
            <Text style={styles.btnText}>Let's go!</Text>
          )}
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
  cardEmoji: { fontSize: 28, marginRight: Spacing.md },
  cardBody: { flex: 1 },
  cardLabel: { fontSize: 16, fontWeight: "700", color: Colors.textDark, marginBottom: 2 },
  cardLabelActive: { color: Colors.primary },
  cardSub: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },

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

  errorText: {
    color: Colors.danger,
    fontSize: 14,
    textAlign: "center",
    marginTop: Spacing.sm,
    lineHeight: 20,
  },

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
