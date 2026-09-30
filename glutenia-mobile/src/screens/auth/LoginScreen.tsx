import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Screen from "../../components/Screen";
import Field from "../../components/Field";
import { PrimaryButton, SecondaryButton } from "../../components/Buttons";
import { useAuth } from "../../context/AuthContext";
import { useTheme, type ThemeColors } from "../../context/ThemeContext";
import { Radius, Spacing } from "../../theme/colors";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { isApiError } from "../../api/client";
import type { AppNavigation } from "../../navigation/types";

const MASCOT = require("../../../assets/mascot.png");

interface LoginErrors {
  email?: string;
  password?: string;
}

export default function LoginScreen({ navigation }: { navigation: AppNavigation }) {
  const { login } = useAuth();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const nextErrors: LoginErrors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      nextErrors.email = t("auth.errors.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = t("auth.errors.emailInvalid");
    }

    if (!password) {
      nextErrors.password = t("auth.errors.passwordRequired");
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    try {
      setLoading(true);
      await login({ email: trimmedEmail, password });
    } catch (err) {
      const isApiErr = isApiError(err);
      const pendingData = isApiErr
        ? (err.data as { professionalStatus?: string; approvalCode?: string } | undefined)
        : undefined;
      const status = isApiErr && err.status === 403 ? pendingData?.professionalStatus : null;
      if (status === "rejected") {
        Alert.alert(t("login.professionalRejectedTitle"), t("login.professionalRejectedMsg"));
      } else if (status === "pending") {
        Alert.alert(
          t("login.professionalPendingTitle"),
          t("login.professionalPendingMsg", { code: pendingData?.approvalCode })
        );
      } else {
        Alert.alert(t("auth.errors.loginFailed"), err instanceof Error ? err.message : String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.waveOuter} />
      <View style={styles.waveInner} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View style={styles.heroBlock}>
          <View style={styles.mascotRing}>
            <Image source={MASCOT} style={styles.mascotImage} />
          </View>
          <Text style={styles.title}>Glutenia</Text>
          <Text style={styles.subtitle}>{t("login.subtitle")}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("login.cardTitle")}</Text>

          <Field
            label={t("auth.email")}
            value={email}
            error={errors.email}
            onChangeText={(value) => {
              setEmail(value);
              setErrors((current) => ({ ...current, email: "" }));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Field
            label={t("auth.password")}
            value={password}
            error={errors.password}
            onChangeText={(value) => {
              setPassword(value);
              setErrors((current) => ({ ...current, password: "" }));
            }}
            secureTextEntry
          />

          <PrimaryButton
            title={t("login.button")}
            icon="log-in"
            loading={loading}
            onPress={handleLogin}
          />
          <SecondaryButton
            title={t("login.createAccount")}
            icon="person-add"
            onPress={() => navigation.navigate("Register")}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const WAVE_GREEN_DEEP  = "#6ea832";

const getStyles = (colors: ThemeColors) => {
const WAVE_GREEN = colors.primary;
return StyleSheet.create({
  screen: {
    backgroundColor: colors.primaryPale,
  },

  waveOuter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: WAVE_GREEN,
    borderTopLeftRadius: 64,
    borderTopRightRadius: 64,
  },
  waveInner: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "44%",
    backgroundColor: WAVE_GREEN_DEEP,
    borderTopLeftRadius: 58,
    borderTopRightRadius: 58,
    opacity: 0.35,
  },

  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl + Spacing.lg,
    paddingBottom: Spacing.xl,
  },

  heroBlock: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  mascotRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.40)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  mascotImage: {
    width: 108,
    height: 108,
    resizeMode: "contain",
  },
  title: {
    color: colors.textDark,
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 230,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 10,
  },
  cardTitle: {
    color: colors.textDark,
    fontSize: 22,
    fontWeight: "900",
  },
});
};