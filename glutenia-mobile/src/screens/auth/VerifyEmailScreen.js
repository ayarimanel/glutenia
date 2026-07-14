import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import AppIcon from "../../components/AppIcon";
import Field from "../../components/Field";
import { PrimaryButton, SecondaryButton } from "../../components/Buttons";
import { useAuth } from "../../context/AuthContext";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { verifyEmail, resendVerificationCode } = useAuth();
  const { email } = route.params || {};

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError(t("verifyEmail.errors.codeRequired"));
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await verifyEmail({ email, code });
      if (data?.pending) {
        navigation.replace("ProfessionalPending", {
          approvalCode: data.approvalCode,
          email,
        });
      }
    } catch (err) {
      if (err.data?.expired) {
        setError(t("verifyEmail.errors.codeExpired"));
      } else {
        setError(err.message || t("verifyEmail.errors.codeInvalid"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResendLoading(true);
      setError("");
      await resendVerificationCode(email);
      setCode("");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      if (err.data?.secondsRemaining) {
        setCooldown(err.data.secondsRemaining);
      } else {
        setError(err.message || t("verifyEmail.errors.resendFailed"));
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <AppIcon name="checkmark-circle" size={34} color={Colors.secondary} strokeWidth={2.2} />
        </View>
        <Text style={styles.title}>{t("verifyEmail.title")}</Text>
        <Text style={styles.subtitle}>{t("verifyEmail.subtitle", { email })}</Text>

        <View style={styles.codeCard}>
          <Field
            label={t("verifyEmail.codeLabel")}
            value={code}
            error={error}
            onChangeText={(value) => {
              setCode(value.replace(/[^0-9]/g, "").slice(0, 6));
              setError("");
            }}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.fieldWrap}
            inputStyle={styles.codeInput}
          />
        </View>

        <PrimaryButton
          title={t("verifyEmail.submit")}
          icon="checkmark"
          loading={loading}
          onPress={handleVerify}
        />

        <SecondaryButton
          title={
            cooldown > 0
              ? t("verifyEmail.resendCooldown", { seconds: cooldown })
              : t("verifyEmail.resend")
          }
          icon="refresh"
          disabled={cooldown > 0 || resendLoading}
          onPress={handleResend}
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
    ...Shadow,
  },
  fieldWrap: {
    alignItems: "center",
  },
  codeInput: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 8,
    textAlign: "center",
  },
});
