import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import Field from "../../components/Field";
import { PrimaryButton, SecondaryButton } from "../../components/Buttons";
import { useAuth } from "../../context/AuthContext";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    try {
      setLoading(true);
      await register({ name: name.trim(), email: trimmedEmail, password, role });
    } catch (error) {
      Alert.alert(t("auth.errors.registerFailed"), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
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
          <View style={styles.roleWrap}>
            <Text style={styles.roleLabel}>{t("register.role")}</Text>
            <View style={styles.segment}>
              {["customer", "admin"].map((option) => (
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
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  header: {
    gap: 8,
  },
  title: {
    color: Colors.textDark,
    fontSize: 34,
    fontWeight: "900",
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow,
  },
  roleWrap: {
    gap: 8,
  },
  roleLabel: {
    color: Colors.textDark,
    fontSize: 13,
    fontWeight: "700",
  },
  segment: {
    flexDirection: "row",
    padding: 4,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryPale,
  },
  segmentButton: {
    flex: 1,
    height: 42,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    color: Colors.textMuted,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  segmentTextActive: {
    color: Colors.surface,
  },
});
