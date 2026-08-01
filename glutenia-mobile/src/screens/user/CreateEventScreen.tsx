import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import type { RouteProp } from "@react-navigation/native";
import Screen from "../../components/Screen";
import Field from "../../components/Field";
import AppIcon from "../../components/AppIcon";
import { SecondaryButton } from "../../components/Buttons";
import { useAuthenticated } from "../../context/AuthContext";
import { api, type ApiError } from "../../api/client";
import { Radius, Spacing } from "../../theme/colors";
import { useTheme, type ThemeColors } from "../../context/ThemeContext";
import type { AppNavigation, RootParamList } from "../../navigation/types";
import type { EventCategory } from "../../types/models";

const CATEGORIES: EventCategory[] = ["Meetups", "Classes", "Markets", "Workshops"];
const MAX_IMAGE_DATA_URL_LENGTH = 3000000;

const PRESET_EMOJIS = ["🎉", "👨‍🍳", "🧺", "🧁", "🛍️", "🥗", "🌿", "🍞", "🎪", "🏃"];

const PRESET_COLORS = [
  { value: "#E8F5E9", label: "Green" },
  { value: "#FFF8E1", label: "Yellow" },
  { value: "#FCE4EC", label: "Pink" },
  { value: "#E3F2FD", label: "Blue" },
  { value: "#F3E5F5", label: "Purple" },
];

type FormErrors = {
  title?: string;
  date?: string;
  location?: string;
  category?: string;
};

type Props = {
  route: RouteProp<RootParamList, "CreateEvent">;
  navigation: AppNavigation;
};

export default function CreateEventScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { token } = useAuthenticated();
  const eventId = route.params?.eventId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<EventCategory | "">("");
  const [price, setPrice] = useState("0");
  const [emoji, setEmoji] = useState("🎉");
  const [color, setColor] = useState("#E8F5E9");
  const [imageUrl, setImageUrl] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    const loadEvent = async () => {
      try {
        const event = await api.event(eventId, token);
        setTitle(event.title);
        setDescription(event.description || "");
        setDate(event.date);
        setLocation(event.location);
        setCategory(event.category);
        setPrice(String(event.price ?? 0));
        setEmoji(event.emoji || "🎉");
        setColor(event.color || "#E8F5E9");
        setImageUrl(event.imageUrl || "");
      } catch (error) {
        Alert.alert(t("createEvent.loadError"), (error as ApiError).message);
        navigation.goBack();
      }
    };
    loadEvent();
  }, [eventId]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("admin.form.image.permissionTitle"), t("admin.form.image.permissionMsg"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      base64: true,
      mediaTypes: ["images"],
      quality: 0.4,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.base64) {
      Alert.alert(t("admin.form.image.errorTitle"), t("admin.form.image.cantReadMsg"));
      return;
    }

    const mimeType = asset.mimeType || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${asset.base64}`;

    if (dataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
      Alert.alert(t("admin.form.image.tooLargeTitle"), t("admin.form.image.tooLargeMsg"));
      return;
    }

    setImageUrl(dataUrl);
  };

  const handleSubmit = async () => {
    const nextErrors: FormErrors = {};
    if (!title.trim()) nextErrors.title = t("createEvent.errors.titleRequired");
    if (!date.trim()) nextErrors.date = t("createEvent.errors.dateRequired");
    if (!location.trim()) nextErrors.location = t("createEvent.errors.locationRequired");
    if (!category) nextErrors.category = t("createEvent.errors.categoryRequired");

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const body = {
      title: title.trim(),
      description: description.trim(),
      date: date.trim(),
      location: location.trim(),
      category: category as EventCategory,
      price: Number(price) || 0,
      emoji,
      color,
      imageUrl,
    };

    try {
      setLoading(true);
      if (eventId) {
        await api.updateEvent(token, eventId, body);
        Alert.alert(t("createEvent.updateSuccess"), t("createEvent.updateSuccessMsg", { title }), [
          { text: t("createEvent.ok"), onPress: () => navigation.goBack() },
        ]);
      } else {
        await api.createEvent(token, body);
        Alert.alert(t("createEvent.success"), t("createEvent.successMsg", { title }), [
          { text: t("createEvent.ok"), onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert(
        eventId ? t("createEvent.updateErrorTitle") : t("createEvent.errorTitle"),
        (error as ApiError).message
      );
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
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
              <AppIcon name="arrow-back" size={20} color={colors.textDark} />
            </Pressable>
            <Text style={styles.headerTitle}>
              {eventId ? t("createEvent.titleEdit") : t("createEvent.title")}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <Field
            label={t("createEvent.eventTitle")}
            placeholder={t("createEvent.titlePlaceholder")}
            value={title}
            onChangeText={(v) => { setTitle(v); setErrors((e) => ({ ...e, title: "" })); }}
            error={errors.title}
          />

          <Field
            label={t("createEvent.description")}
            placeholder={t("createEvent.descPlaceholder")}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Field
            label={t("createEvent.dateTime")}
            placeholder={t("createEvent.datePlaceholder")}
            value={date}
            onChangeText={(v) => { setDate(v); setErrors((e) => ({ ...e, date: "" })); }}
            error={errors.date}
          />

          <Field
            label={t("createEvent.location")}
            placeholder={t("createEvent.locationPlaceholder")}
            value={location}
            onChangeText={(v) => { setLocation(v); setErrors((e) => ({ ...e, location: "" })); }}
            error={errors.location}
          />

          <Field
            label={t("createEvent.price")}
            placeholder="0"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />

          {/* Category picker */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>{t("createEvent.category")}</Text>
            <View style={styles.row}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => { setCategory(cat); setErrors((e) => ({ ...e, category: "" })); }}
                  style={[styles.pill, category === cat && styles.pillActive]}
                >
                  <Text style={[styles.pillText, category === cat && styles.pillTextActive]}>
                    {t(`events.${cat.toLowerCase()}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
            {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
          </View>

          {/* Cover image */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>{t("createEvent.coverImage")}</Text>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
            ) : (
              <Text style={styles.noImageText}>{t("createEvent.noImage")}</Text>
            )}
            <SecondaryButton
              title={imageUrl ? t("createEvent.replaceImage") : t("createEvent.uploadImage")}
              icon="image"
              onPress={pickImage}
            />
          </View>

          {/* Emoji picker */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>{t("createEvent.emoji")}</Text>
            <Text style={styles.fieldHint}>{t("createEvent.emojiHint")}</Text>
            <View style={styles.row}>
              {PRESET_EMOJIS.map((e) => (
                <Pressable
                  key={e}
                  onPress={() => setEmoji(e)}
                  style={[styles.emojiPill, emoji === e && styles.pillActive]}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Color picker */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>{t("createEvent.color")}</Text>
            <View style={styles.row}>
              {PRESET_COLORS.map((c) => (
                <Pressable
                  key={c.value}
                  onPress={() => setColor(c.value)}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: c.value },
                    color === c.value && styles.colorSwatchActive,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Submit */}
          <Pressable
            style={[styles.submitBtn, loading && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <AppIcon name={loading ? "clock" : "checkmark-circle"} size={20} color="#fff" />
            <Text style={styles.submitText}>
              {loading
                ? t("createEvent.saving")
                : eventId
                ? t("createEvent.update")
                : t("createEvent.submit")}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
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
  fieldHint: {
    color: colors.textMuted,
    fontSize: 12,
  },
  imagePreview: {
    width: "100%",
    height: 160,
    borderRadius: Radius.lg,
    resizeMode: "cover",
  },
  noImageText: {
    color: colors.textMuted,
    fontSize: 13,
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
  emojiPill: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: {
    fontSize: 22,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorSwatchActive: {
    borderColor: colors.primary,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    marginTop: Spacing.sm,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
