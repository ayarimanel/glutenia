import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import Field from "../../components/Field";
import AppIcon from "../../components/AppIcon";
import { PrimaryButton } from "../../components/Buttons";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

export default function ChangePasswordScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { token } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const nextErrors = {};

    if (!currentPassword) {
      nextErrors.currentPassword = t("settings.changePasswordScreen.currentRequired");
    }
    if (newPassword.length < 6) {
      nextErrors.newPassword = t("settings.changePasswordScreen.lengthError");
    }
    if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = t("settings.changePasswordScreen.mismatchError");
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    try {
      setSaving(true);
      await api.changePassword(token, { currentPassword, newPassword });
      Alert.alert(
        t("settings.changePasswordScreen.success"),
        t("settings.changePasswordScreen.successMsg"),
        [{ text: t("settings.ok"), onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(t("settings.changePasswordScreen.failed"), error.message);
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
        <Text style={styles.headerTitle}>{t("settings.changePasswordScreen.title")}</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Field
            label={t("settings.changePasswordScreen.currentLabel")}
            value={currentPassword}
            onChangeText={(value) => {
              setCurrentPassword(value);
              setErrors((current) => ({ ...current, currentPassword: "" }));
            }}
            error={errors.currentPassword}
            secureTextEntry
          />
          <Field
            label={t("settings.changePasswordScreen.newLabel")}
            value={newPassword}
            onChangeText={(value) => {
              setNewPassword(value);
              setErrors((current) => ({ ...current, newPassword: "" }));
            }}
            error={errors.newPassword}
            secureTextEntry
          />
          <Field
            label={t("settings.changePasswordScreen.confirmLabel")}
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              setErrors((current) => ({ ...current, confirmPassword: "" }));
            }}
            error={errors.confirmPassword}
            secureTextEntry
          />

          <PrimaryButton
            title={t("settings.changePasswordScreen.submit")}
            icon="shield-check"
            loading={saving}
            onPress={handleSubmit}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const getStyles = (colors) => ({
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
    paddingBottom: 48,
    gap: Spacing.md,
  },
  submitButton: { marginTop: Spacing.sm },
});
