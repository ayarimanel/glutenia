import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import Field from "../../components/Field";
import AppIcon from "../../components/AppIcon";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Colors, Radius, Spacing } from "../../theme/colors";

const CATEGORIES = ["Meetups", "Classes", "Markets", "Workshops"];

const PRESET_EMOJIS = ["🎉", "👨‍🍳", "🧺", "🧁", "🛍️", "🥗", "🌿", "🍞", "🎪", "🏃"];

const PRESET_COLORS = [
  { value: "#E8F5E9", label: "Green" },
  { value: "#FFF8E1", label: "Yellow" },
  { value: "#FCE4EC", label: "Pink" },
  { value: "#E3F2FD", label: "Blue" },
  { value: "#F3E5F5", label: "Purple" },
];

export default function CreateEventScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const eventId = route.params?.eventId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("0");
  const [emoji, setEmoji] = useState("🎉");
  const [color, setColor] = useState("#E8F5E9");
  const [errors, setErrors] = useState({});
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
      } catch (error) {
        Alert.alert(t("createEvent.loadError"), error.message);
        navigation.goBack();
      }
    };
    loadEvent();
  }, [eventId]);

  const handleSubmit = async () => {
    const nextErrors = {};
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
      category,
      price: Number(price) || 0,
      emoji,
      color,
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
        error.message
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
              <AppIcon name="arrow-back" size={20} color={Colors.textDark} />
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

          {/* Emoji picker */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>{t("createEvent.emoji")}</Text>
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
            <AppIcon name={loading ? "hourglass" : "checkmark-circle"} size={20} color="#fff" />
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

const styles = StyleSheet.create({
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
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.textDark,
  },
  fieldWrap: {
    gap: 8,
  },
  fieldLabel: {
    color: Colors.textDark,
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
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.textMuted,
  },
  pillTextActive: {
    color: "#fff",
  },
  emojiPill: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
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
    borderColor: Colors.primary,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
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
