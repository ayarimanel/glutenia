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
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Radius, Spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

export default function DeleteAccountScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { token, logout } = useAuth();

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    if (!password) {
      setError(t("settings.deleteAccountScreen.passwordRequired"));
      return;
    }

    Alert.alert(
      t("settings.deleteAccountScreen.confirmTitle"),
      t("settings.deleteAccountScreen.confirmMsg"),
      [
        { text: t("settings.cancel"), style: "cancel" },
        {
          text: t("settings.deleteAccountScreen.confirmButton"),
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await api.deleteAccount(token, password);
              await logout();
            } catch (err) {
              setDeleting(false);
              setError(err.message || t("settings.deleteAccountScreen.failed"));
            }
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} activeOpacity={0.7}>
          <AppIcon name="arrow-back" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("settings.deleteAccountScreen.title")}</Text>
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
          <View style={styles.warningCard}>
            <AppIcon name="close-circle" size={20} color={colors.danger} />
            <Text style={styles.warningText}>
              {t("settings.deleteAccountScreen.warning")}
            </Text>
          </View>

          <Field
            label={t("settings.deleteAccountScreen.passwordLabel")}
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError("");
            }}
            error={error}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
            onPress={handleDelete}
            disabled={deleting}
            activeOpacity={0.85}
          >
            <Text style={styles.deleteButtonText}>
              {deleting
                ? t("settings.deleteAccountScreen.deleting")
                : t("settings.deleteAccountScreen.submit")}
            </Text>
          </TouchableOpacity>
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
  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: "#FDECEC",
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: colors.danger,
    lineHeight: 19,
  },
  deleteButton: {
    backgroundColor: colors.danger,
    borderRadius: Radius.md,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
  },
  deleteButtonDisabled: { opacity: 0.6 },
  deleteButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
