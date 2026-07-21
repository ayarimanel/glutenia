import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import AppIcon from "../../components/AppIcon";
import Field from "../../components/Field";
import { PrimaryButton, SecondaryButton } from "../../components/Buttons";
import { useAuth } from "../../context/AuthContext";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

export default function ProfessionalPendingScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { approvalCode, email } = route.params || {};

  const [password, setPassword] = useState("");
  const [checking, setChecking] = useState(false);

  const handleCheckStatus = async () => {
    if (!password) {
      Alert.alert(t("professionalPending.passwordRequired"));
      return;
    }
    try {
      setChecking(true);
      await login({ email, password });
      // AuthContext now holds a valid session — RootNavigator will switch
      // out of the auth stack automatically.
    } catch (error) {
      const status = error.status === 403 ? error.data?.professionalStatus : null;
      if (status === "rejected") {
        Alert.alert(t("login.professionalRejectedTitle"), t("login.professionalRejectedMsg"));
      } else if (status === "pending") {
        Alert.alert(t("professionalPending.stillPendingTitle"), t("professionalPending.stillPendingMsg"));
      } else {
        Alert.alert(t("auth.errors.loginFailed"), error.message);
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <AppIcon name="clock" size={34} color={colors.secondary} strokeWidth={2.2} />
        </View>
        <Text style={styles.title}>{t("professionalPending.title")}</Text>
        <Text style={styles.subtitle}>{t("professionalPending.subtitle")}</Text>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>{t("professionalPending.codeLabel")}</Text>
          <Text style={styles.code}>{approvalCode}</Text>
          {email ? <Text style={styles.email}>{email}</Text> : null}
        </View>

        <Text style={styles.hint}>{t("professionalPending.hint")}</Text>

        <View style={{ width: "100%" }}>
          <Field
            label={t("auth.password")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <PrimaryButton
          title={t("professionalPending.checkStatus")}
          icon="refresh"
          loading={checking}
          onPress={handleCheckStatus}
          style={{ width: "100%" }}
        />

        <SecondaryButton
          title={t("professionalPending.backToLogin")}
          icon="arrow-back"
          onPress={() => navigation.replace("Login")}
        />
      </View>
    </Screen>
  );
}

const getStyles = (colors) => StyleSheet.create({
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
    backgroundColor: colors.secondaryPale,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  title: {
    color: colors.textDark,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  codeCard: {
    width: "100%",
    borderRadius: Radius.xl,
    backgroundColor: colors.surface,
    padding: Spacing.lg,
    alignItems: "center",
    gap: 6,
    ...Shadow,
  },
  codeLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  code: {
    color: colors.secondary,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 4,
  },
  email: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
});
