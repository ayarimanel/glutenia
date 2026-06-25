import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

const OPTIONS = [
  {
    emoji: "🛡️",
    label: "Gluten-Free Warrior",
    subtitle: "I'm living gluten-free myself",
    value: "warrior",
  },
  {
    emoji: "🤝",
    label: "Supporter",
    subtitle: "I'm helping someone who is gluten-free",
    value: "supporter",
  },
];

export default function OnboardingRoleScreen({ navigation }) {
  const [selected, setSelected] = useState(null);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.headerRow}>
        <View style={styles.headerSpacer} />
        <Text style={styles.stepLabel}>Step 1 of 4</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: "25%" }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.question}>Which best describes you?</Text>

        {OPTIONS.map((opt) => {
          const active = selected === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.card, active && styles.cardActive]}
              activeOpacity={0.75}
              onPress={() => setSelected(opt.value)}
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
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, !selected && styles.btnDisabled]}
          disabled={!selected}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("OnboardingJourney", { roleType: selected })}
        >
          <Text style={styles.btnText}>Continue</Text>
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
