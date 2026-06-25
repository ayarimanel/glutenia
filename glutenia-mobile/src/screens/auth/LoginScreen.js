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
import { Colors, Radius, Spacing } from "../../theme/colors";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const MASCOT = require("../../../assets/mascot.png");
export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("admin@glutenia.tn");
  const [password, setPassword] = useState("admin123");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const nextErrors = {};
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
    } catch (error) {
      Alert.alert(t("auth.errors.loginFailed"), error.message);
    } finally {
      setLoading(false);
    }
  };
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <Screen style={styles.screen}>
      {/* ── Green wave layers (positioned absolute behind everything) ───────── */}
      <View style={styles.waveOuter} />
      <View style={styles.waveInner} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        {/* ── Hero: mascot + brand copy ─────────────────────────────────────── */}
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

// ─── Styles ────────────────────────────────────────────────────────────────────
const WAVE_GREEN       = Colors.primary;        // #8BC34A  — outer wave
const WAVE_GREEN_DEEP  = "#6ea832";             // deeper shade — inner wave accent

const styles = StyleSheet.create({
  // Root background matches the wave so there's no colour seam on tall devices
  screen: {
    backgroundColor: Colors.primaryPale,
  },

  // ── Wave ──────────────────────────────────────────────────────────────────
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

  // ── Layout ────────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl + Spacing.lg,   // generous top breathing room
    paddingBottom: Spacing.xl,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
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
    color: Colors.textDark,
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 230,
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,          // 24 — matches your existing Radius token
    padding: Spacing.lg,
    gap: Spacing.md,
    // Lifted shadow using primary green tint (same as your Shadow token logic)
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 10,
  },
  cardTitle: {
    color: Colors.textDark,
    fontSize: 22,
    fontWeight: "900",
  },
});