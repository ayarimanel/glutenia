import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import AppIcon from "../../components/AppIcon";
import { SecondaryButton } from "../../components/Buttons";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

export default function ProfessionalPendingScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { approvalCode, email } = route.params || {};

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <AppIcon name="clock" size={34} color={Colors.secondary} strokeWidth={2.2} />
        </View>
        <Text style={styles.title}>{t("professionalPending.title")}</Text>
        <Text style={styles.subtitle}>{t("professionalPending.subtitle")}</Text>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>{t("professionalPending.codeLabel")}</Text>
          <Text style={styles.code}>{approvalCode}</Text>
          {email ? <Text style={styles.email}>{email}</Text> : null}
        </View>

        <Text style={styles.hint}>{t("professionalPending.hint")}</Text>

        <SecondaryButton
          title={t("professionalPending.backToLogin")}
          icon="arrow-back"
          onPress={() => navigation.replace("Login")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.secondaryPale,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  title: {
    color: Colors.textDark,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  codeCard: {
    width: "100%",
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    alignItems: "center",
    gap: 6,
    ...Shadow,
  },
  codeLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  code: {
    color: Colors.secondary,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 4,
  },
  email: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  hint: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
});
