import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import Field from "../../components/Field";
import { PrimaryButton, SecondaryButton } from "../../components/Buttons";
import { useAuth } from "../../context/AuthContext";
import { isValidPhone } from "../../utils/validation";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("customer");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const trimmedEmail = email.trim();
    const nextErrors = {};

    if (!name.trim()) {
      nextErrors.name = t("auth.errors.nameRequired");
    }

    if (!trimmedEmail) {
      nextErrors.email = t("auth.errors.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = t("auth.errors.emailInvalid");
    }

    if (password.length < 6) {
      nextErrors.password = t("auth.errors.passwordLength");
    }

    if (!isValidPhone(phone)) {
      nextErrors.phone = t("auth.errors.phoneInvalid");
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    try {
      setLoading(true);
      const result = await register({
        name: name.trim(),
        email: trimmedEmail,
        password,
        role,
        phone: phone.trim(),
      });
      if (result?.pending) {
        navigation.replace("ProfessionalPending", {
          approvalCode: result.approvalCode,
          email: trimmedEmail,
        });
      }
    } catch (error) {
      Alert.alert(t("auth.errors.registerFailed"), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t("register.title")}</Text>
            <Text style={styles.subtitle}>{t("register.subtitle")}</Text>
          </View>

          <View style={styles.card}>
            <Field
              label={t("auth.name")}
              value={name}
              error={errors.name}
              onChangeText={(value) => {
                setName(value);
                setErrors((current) => ({ ...current, name: "" }));
              }}
            />
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
            <Field
              label={t("auth.phoneOptional")}
              value={phone}
              error={errors.phone}
              onChangeText={(value) => {
                setPhone(value);
                setErrors((current) => ({ ...current, phone: "" }));
              }}
              keyboardType="phone-pad"
            />
            <View style={styles.roleWrap}>
              <Text style={styles.roleLabel}>{t("register.role")}</Text>
              <View style={styles.segment}>
                {["customer", "professional"].map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => setRole(option)}
                    style={[styles.segmentButton, role === option && styles.segmentActive]}
                  >
                    <Text
                      style={[styles.segmentText, role === option && styles.segmentTextActive]}
                    >
                      {t(`register.role${option.charAt(0).toUpperCase() + option.slice(1)}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <PrimaryButton
              title={t("register.button")}
              icon="checkmark-circle"
              loading={loading}
              onPress={handleRegister}
            />
            <SecondaryButton
              title={t("register.backToLogin")}
              icon="arrow-back"
              onPress={() => navigation.goBack()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const getStyles = (colors) => StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: Spacing.md,
    gap: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    gap: 8,
  },
  title: {
    color: colors.textDark,
    fontSize: 34,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    borderRadius: Radius.xl,
    backgroundColor: colors.surface,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow,
  },
  roleWrap: {
    gap: 8,
  },
  roleLabel: {
    color: colors.textDark,
    fontSize: 13,
    fontWeight: "700",
  },
  segment: {
    flexDirection: "row",
    padding: 4,
    borderRadius: Radius.md,
    backgroundColor: colors.primaryPale,
  },
  segmentButton: {
    flex: 1,
    height: 42,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    color: colors.textMuted,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  segmentTextActive: {
    color: colors.surface,
  },
});
