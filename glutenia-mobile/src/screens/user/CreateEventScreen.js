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
import { useState } from "react";
import Screen from "../../components/Screen";
import Field from "../../components/Field";
import AppIcon from "../../components/AppIcon";
import { Colors, Radius, Spacing } from "../../theme/colors";

const CATEGORIES = ["Meetups", "Classes", "Markets", "Workshops"];

export default function CreateEventScreen({ navigation }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    const nextErrors = {};
    if (!title.trim()) nextErrors.title = "Title is required.";
    if (!date.trim()) nextErrors.date = "Date is required.";
    if (!location.trim()) nextErrors.location = "Location is required.";
    if (!category) nextErrors.category = "Please select a category.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    Alert.alert("Event Created!", `"${title}" has been added.`, [
      { text: "OK", onPress: () => navigation.goBack() },
    ]);
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
            <Text style={styles.headerTitle}>Create Event</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Form */}
          <Field
            label="Event Title"
            placeholder="e.g. GF Cooking Class"
            value={title}
            onChangeText={(v) => { setTitle(v); setErrors((e) => ({ ...e, title: "" })); }}
            error={errors.title}
          />

          <Field
            label="Description"
            placeholder="What is this event about?"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Field
            label="Date & Time"
            placeholder="e.g. Sat, Jun 15 • 2:00 PM"
            value={date}
            onChangeText={(v) => { setDate(v); setErrors((e) => ({ ...e, date: "" })); }}
            error={errors.date}
          />

          <Field
            label="Location"
            placeholder="e.g. Culinary Arts Center, Tunis"
            value={location}
            onChangeText={(v) => { setLocation(v); setErrors((e) => ({ ...e, location: "" })); }}
            error={errors.location}
          />

          {/* Category picker */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => { setCategory(cat); setErrors((e) => ({ ...e, category: "" })); }}
                  style={[
                    styles.catPill,
                    category === cat && styles.catPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.catText,
                      category === cat && styles.catTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>
            {errors.category ? (
              <Text style={styles.errorText}>{errors.category}</Text>
            ) : null}
          </View>

          {/* Submit */}
          <Pressable style={styles.submitBtn} onPress={handleSubmit}>
            <AppIcon name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.submitText}>Create Event</Text>
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
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  catPill: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  catPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catText: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.textMuted,
  },
  catTextActive: {
    color: "#fff",
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
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
