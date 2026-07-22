import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import Field from "../../components/Field";
import AppIcon from "../../components/AppIcon";
import { PrimaryButton } from "../../components/Buttons";
import { useAuth } from "../../context/AuthContext";
import { notifyGamification } from "../../context/GamificationContext";
import { api } from "../../api/client";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

const MAX_IMAGE_DATA_URL_LENGTH = 3000000;
const CATEGORIES = ["Bread", "Pasta", "Snacks", "Flour", "Sweets", "Other"];

export default function SubmitProductScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { token } = useAuth();
  const barcode = route.params?.barcode ?? "";

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [image, setImage] = useState(null);
  const [imageError, setImageError] = useState("");
  const [isGlutenFree, setIsGlutenFree] = useState(true);
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState(null);
  const [saving, setSaving] = useState(false);

  const categoryLabels = {
    Bread: t("shop.bread"),
    Pasta: t("shop.pasta"),
    Snacks: t("shop.snacks"),
    Flour: t("shop.flour"),
    Sweets: t("shop.sweets"),
    Other: t("admin.form.other"),
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        t("settings.editProfileScreen.permissionTitle"),
        t("settings.editProfileScreen.permissionMsg")
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
      mediaTypes: ["images"],
      quality: 0.4,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.base64) return;

    const mimeType = asset.mimeType || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${asset.base64}`;

    if (dataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
      Alert.alert(
        t("settings.editProfileScreen.imageErrorTitle"),
        t("settings.editProfileScreen.imageTooLarge")
      );
      return;
    }

    setImage(dataUrl);
    setImageError("");
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    let hasError = false;

    if (!trimmedName) {
      setNameError(t("submitProduct.nameRequired"));
      hasError = true;
    } else {
      setNameError("");
    }

    // A photo of the actual product/barcode is required, same as the
    // backend enforces — a typed name alone is too easy to fake.
    if (!image) {
      setImageError(t("submitProduct.photoRequired"));
      hasError = true;
    } else {
      setImageError("");
    }

    if (hasError) return;

    try {
      setSaving(true);
      const result = await api.submitCommunityProduct(token, {
        barcode,
        name: trimmedName,
        imageUrl: image,
        isGlutenFree,
        brand: brand.trim() || undefined,
        category: category || undefined,
      });
      notifyGamification(result.gamification);
      Alert.alert(
        t("submitProduct.success"),
        t("submitProduct.successMsg"),
        [{ text: t("settings.ok"), onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(t("submitProduct.failed"), error.message);
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
        <Text style={styles.headerTitle}>{t("submitProduct.title")}</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.intro}>{t("submitProduct.intro")}</Text>

          <View style={styles.imageSection}>
            <Pressable onPress={pickImage} style={styles.imageWrap}>
              {image ? (
                <Image source={{ uri: image }} style={styles.image} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <AppIcon name="image" size={32} color={colors.primary} />
                </View>
              )}
            </Pressable>
            <Pressable onPress={pickImage}>
              <Text style={styles.addPhotoText}>{t("submitProduct.addPhoto")}</Text>
            </Pressable>
            {!!imageError && <Text style={styles.photoError}>{imageError}</Text>}
          </View>

          <View style={styles.card}>
            <Field
              label={t("submitProduct.barcodeLabel")}
              value={barcode}
              editable={false}
              style={styles.disabledField}
              inputStyle={styles.disabledInput}
            />
            <Field
              label={t("submitProduct.nameLabel")}
              value={name}
              onChangeText={(value) => {
                setName(value);
                setNameError("");
              }}
              placeholder={t("submitProduct.namePlaceholder")}
              error={nameError}
            />
            <Field
              label={t("submitProduct.brandLabel")}
              value={brand}
              onChangeText={setBrand}
              placeholder={t("submitProduct.brandPlaceholder")}
            />

            <View>
              <Text style={styles.fieldLabel}>{t("submitProduct.categoryLabel")}</Text>
              <View style={styles.categoryRow}>
                {CATEGORIES.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setCategory(category === item ? null : item)}
                    style={[styles.categoryChip, category === item && styles.categoryChipActive]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        category === item && styles.categoryChipTextActive,
                      ]}
                    >
                      {categoryLabels[item] || item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>{t("submitProduct.glutenFreeLabel")}</Text>
                <Text style={styles.toggleHint}>{t("submitProduct.glutenFreeHint")}</Text>
              </View>
              <Switch
                value={isGlutenFree}
                onValueChange={setIsGlutenFree}
                trackColor={{ false: colors.divider, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
          </View>

          <PrimaryButton
            title={t("submitProduct.submit")}
            icon="checkmark-circle"
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
  intro: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    textAlign: "center",
  },
  imageSection: { alignItems: "center", paddingVertical: Spacing.sm, gap: 10 },
  imageWrap: { width: 96, height: 96 },
  image: { width: 96, height: 96, borderRadius: Radius.lg },
  imagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: Radius.lg,
    backgroundColor: colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoText: { color: colors.primary, fontWeight: "700", fontSize: 14 },
  photoError: { color: colors.danger, fontSize: 12, fontWeight: "700" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadow,
  },
  disabledField: { opacity: 0.6 },
  disabledInput: { backgroundColor: colors.background },
  fieldLabel: { color: colors.textDark, fontSize: 13, fontWeight: "700", marginBottom: 8 },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryChipText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  categoryChipTextActive: { color: "#fff" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  toggleLabel: { fontSize: 15, fontWeight: "700", color: colors.textDark },
  toggleHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  submitButton: { marginTop: Spacing.sm },
});
