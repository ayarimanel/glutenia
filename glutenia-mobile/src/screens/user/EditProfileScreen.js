import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
import { api } from "../../api/client";
import { isValidPhone } from "../../utils/validation";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

const MAX_IMAGE_DATA_URL_LENGTH = 3000000;

export default function EditProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const { user, token, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [nameError, setNameError] = useState("");
  const [saving, setSaving] = useState(false);

  const [phone, setPhone] = useState(user?.phone || "");
  const [phoneError, setPhoneError] = useState("");

  const pickAvatar = async () => {
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

    if (result.canceled) {
      return;
    }

    const asset = result.assets?.[0];
    if (!asset?.base64) {
      Alert.alert(t("settings.editProfileScreen.imageErrorTitle"));
      return;
    }

    const mimeType = asset.mimeType || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${asset.base64}`;

    if (dataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
      Alert.alert(
        t("settings.editProfileScreen.imageErrorTitle"),
        t("settings.editProfileScreen.imageTooLarge")
      );
      return;
    }

    setAvatar(dataUrl);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError(t("settings.editProfileScreen.nameRequired"));
      return;
    }
    setNameError("");

    if (!isValidPhone(phone)) {
      setPhoneError(t("settings.editProfileScreen.phoneInvalid"));
      return;
    }
    setPhoneError("");

    try {
      setSaving(true);
      const body = {
        name: trimmedName,
        phone: phone.trim(),
      };
      if (avatar !== user?.avatar) {
        body.avatar = avatar || "";
      }
      const updated = await api.updateProfile(token, body);
      await updateUser(updated);
      Alert.alert(
        t("settings.editProfileScreen.saved"),
        t("settings.editProfileScreen.savedMsg"),
        [{ text: t("settings.ok"), onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(t("settings.editProfileScreen.saveFailed"), error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} activeOpacity={0.7}>
          <AppIcon name="arrow-back" size={22} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("settings.editProfileScreen.title")}</Text>
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
          <View style={styles.avatarSection}>
            <Pressable onPress={pickAvatar} style={styles.avatarWrap}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <AppIcon name="person" size={40} color={Colors.primary} />
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <AppIcon name="image" size={14} color="#fff" />
              </View>
            </Pressable>
            <Pressable onPress={pickAvatar}>
              <Text style={styles.changePhotoText}>{t("settings.editProfileScreen.changePhoto")}</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Field
              label={t("settings.editProfileScreen.nameLabel")}
              value={name}
              onChangeText={(value) => {
                setName(value);
                setNameError("");
              }}
              placeholder={t("settings.editProfileScreen.namePlaceholder")}
              error={nameError}
            />
            <Field
              label={t("settings.editProfileScreen.emailLabel")}
              value={user?.email || ""}
              editable={false}
              style={styles.disabledField}
              inputStyle={styles.disabledInput}
            />
            <Field
              label={t("settings.editProfileScreen.phoneLabel")}
              value={phone}
              onChangeText={(value) => {
                setPhone(value);
                setPhoneError("");
              }}
              placeholder={t("settings.editProfileScreen.phonePlaceholder")}
              keyboardType="phone-pad"
              error={phoneError}
            />
          </View>

          <PrimaryButton
            title={t("settings.editProfileScreen.save")}
            icon="checkmark-circle"
            loading={saving}
            onPress={handleSave}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = {
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
    color: Colors.textDark,
  },
  container: {
    padding: Spacing.md,
    paddingBottom: 48,
    gap: Spacing.md,
  },
  avatarSection: { alignItems: "center", paddingVertical: Spacing.sm, gap: 10 },
  avatarWrap: { width: 96, height: 96 },
  avatarImage: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  changePhotoText: { color: Colors.primary, fontWeight: "700", fontSize: 14 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadow,
  },
  disabledField: { opacity: 0.6 },
  disabledInput: { backgroundColor: Colors.background },
  saveButton: { marginTop: Spacing.sm },
};
