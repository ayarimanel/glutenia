import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import Field from "../../components/Field";
import AppIcon from "../../components/AppIcon";
import { PrimaryButton } from "../../components/Buttons";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Radius, Spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

const CATEGORIES = ["celiac", "diet", "safe", "lifestyle"];

export default function AdminPatientResourceFormScreen({ navigation, route }) {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const resourceId = route.params?.resourceId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("celiac");
  const [readTimeMinutes, setReadTimeMinutes] = useState("5");
  const [featured, setFeatured] = useState(false);
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!resourceId) return;
    const loadResource = async () => {
      try {
        const resource = await api.patientResource(resourceId);
        setTitle(resource.title);
        setDescription(resource.description || "");
        setCategory(resource.category || "celiac");
        setReadTimeMinutes(String(resource.readTimeMinutes ?? 0));
        setFeatured(Boolean(resource.featured));
        setBody(resource.body || "");
      } catch (error) {
        Alert.alert(t("admin.patientResourceForm.loadError"), error.message);
        navigation.goBack();
      }
    };
    loadResource();
  }, [resourceId]);

  const handleSubmit = async () => {
    const nextErrors = {};
    if (!title.trim()) nextErrors.title = t("admin.patientResourceForm.errors.titleRequired");

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      readTimeMinutes: Number(readTimeMinutes) || 0,
      featured,
      body: body.trim(),
    };

    try {
      setLoading(true);
      if (resourceId) {
        await api.updatePatientResource(token, resourceId, payload);
      } else {
        await api.createPatientResource(token, payload);
      }
      Alert.alert(t("admin.patientResourceForm.saved"), t("admin.patientResourceForm.savedMsg"), [
        { text: t("admin.ok"), onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert(t("admin.patientResourceForm.saveFailed"), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
              <AppIcon name="arrow-back" size={20} color={colors.textDark} />
            </Pressable>
            <Text style={styles.headerTitle}>
              {resourceId
                ? t("admin.patientResourceForm.titleEdit")
                : t("admin.patientResourceForm.titleAdd")}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <Field
            label={t("admin.patientResourceForm.title")}
            value={title}
            onChangeText={(v) => { setTitle(v); setErrors((e) => ({ ...e, title: "" })); }}
            error={errors.title}
          />

          <Field
            label={t("admin.patientResourceForm.description")}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>{t("admin.patientResourceForm.category")}</Text>
            <View style={styles.row}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[styles.pill, category === cat && styles.pillActive]}
                >
                  <Text style={[styles.pillText, category === cat && styles.pillTextActive]}>
                    {t(`patientResources.categoryLabels.${cat}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Field
            label={t("admin.patientResourceForm.readTimeMinutes")}
            value={readTimeMinutes}
            onChangeText={setReadTimeMinutes}
            keyboardType="numeric"
          />

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>{t("admin.patientResourceForm.featured")}</Text>
              <Text style={styles.switchSub}>{t("admin.patientResourceForm.featuredSub")}</Text>
            </View>
            <Switch
              value={featured}
              onValueChange={setFeatured}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>

          <Field
            label={t("admin.patientResourceForm.body")}
            value={body}
            onChangeText={setBody}
            multiline
            inputStyle={styles.tallInput}
          />

          <PrimaryButton
            title={resourceId ? t("admin.patientResourceForm.update") : t("admin.patientResourceForm.save")}
            icon="checkmark-circle"
            loading={loading}
            onPress={handleSubmit}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.textDark,
  },
  fieldWrap: {
    gap: 8,
  },
  fieldLabel: {
    color: colors.textDark,
    fontSize: 13,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textMuted,
  },
  pillTextActive: {
    color: "#fff",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  switchSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  tallInput: {
    minHeight: 160,
    textAlignVertical: "top",
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
});
