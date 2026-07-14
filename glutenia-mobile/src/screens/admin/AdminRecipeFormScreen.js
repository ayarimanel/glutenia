import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import Field from "../../components/Field";
import AppIcon from "../../components/AppIcon";
import { PrimaryButton, SecondaryButton } from "../../components/Buttons";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Colors, Radius, Spacing } from "../../theme/colors";

const CATEGORIES = ["Quick", "Tunisian", "Easy"];
const MAX_IMAGE_DATA_URL_LENGTH = 3000000;

export default function AdminRecipeFormScreen({ navigation, route }) {
  const { token } = useAuth();
  const { t } = useTranslation();
  const recipeId = route.params?.recipeId;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Quick");
  const [imageUrl, setImageUrl] = useState("");
  const [calories, setCalories] = useState("0");
  const [carbo, setCarbo] = useState("0");
  const [protein, setProtein] = useState("0");
  const [popular, setPopular] = useState(false);
  const [ingredientsText, setIngredientsText] = useState("");
  const [preparation, setPreparation] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const imageDataUrlRef = useRef("");

  useEffect(() => {
    if (!recipeId) return;
    const loadRecipe = async () => {
      try {
        const recipe = await api.recipe(recipeId);
        setName(recipe.name);
        setDescription(recipe.description || "");
        setCategory(recipe.category || "Quick");
        setImageUrl(recipe.imageUrl || "");
        setCalories(String(recipe.calories ?? 0));
        setCarbo(String(recipe.carbo ?? 0));
        setProtein(String(recipe.protein ?? 0));
        setPopular(Boolean(recipe.popular));
        setIngredientsText((recipe.ingredients || []).join("\n"));
        setPreparation(recipe.preparation || "");
      } catch (error) {
        Alert.alert(t("admin.recipeForm.loadError"), error.message);
        navigation.goBack();
      }
    };
    loadRecipe();
  }, [recipeId]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        t("admin.form.image.permissionTitle"),
        t("admin.form.image.permissionMsg")
      );
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

    imageDataUrlRef.current = dataUrl;
    setImageUrl(dataUrl);
  };

  const handleSubmit = async () => {
    const nextErrors = {};
    if (!name.trim()) nextErrors.name = t("admin.recipeForm.errors.nameRequired");

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const body = {
      name: name.trim(),
      description: description.trim(),
      category,
      imageUrl,
      calories: Number(calories) || 0,
      carbo: Number(carbo) || 0,
      protein: Number(protein) || 0,
      popular,
      ingredients: ingredientsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      preparation: preparation.trim(),
    };

    try {
      setLoading(true);
      if (recipeId) {
        await api.updateRecipe(token, recipeId, body);
      } else {
        await api.createRecipe(token, body);
      }
      Alert.alert(t("admin.recipeForm.saved"), t("admin.recipeForm.savedMsg"), [
        { text: t("admin.ok"), onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert(t("admin.recipeForm.saveFailed"), error.message);
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
              <AppIcon name="arrow-back" size={20} color={Colors.textDark} />
            </Pressable>
            <Text style={styles.headerTitle}>
              {recipeId ? t("admin.recipeForm.titleEdit") : t("admin.recipeForm.titleAdd")}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <Field
            label={t("admin.recipeForm.name")}
            value={name}
            onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: "" })); }}
            error={errors.name}
          />

          <Field
            label={t("admin.recipeForm.description")}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>{t("admin.recipeForm.category")}</Text>
            <View style={styles.row}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[styles.pill, category === cat && styles.pillActive]}
                >
                  <Text style={[styles.pillText, category === cat && styles.pillTextActive]}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>{t("admin.recipeForm.image")}</Text>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
            ) : (
              <Text style={styles.noImageText}>{t("admin.recipeForm.noImage")}</Text>
            )}
            <SecondaryButton
              title={imageUrl ? t("admin.recipeForm.replaceImage") : t("admin.recipeForm.uploadImage")}
              icon="image"
              onPress={pickImage}
            />
          </View>

          <View style={styles.row}>
            <Field
              label={t("admin.recipeForm.calories")}
              value={calories}
              onChangeText={setCalories}
              keyboardType="numeric"
              style={styles.thirdField}
            />
            <Field
              label={t("admin.recipeForm.carbo")}
              value={carbo}
              onChangeText={setCarbo}
              keyboardType="numeric"
              style={styles.thirdField}
            />
            <Field
              label={t("admin.recipeForm.protein")}
              value={protein}
              onChangeText={setProtein}
              keyboardType="numeric"
              style={styles.thirdField}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>{t("admin.recipeForm.popular")}</Text>
              <Text style={styles.switchSub}>{t("admin.recipeForm.popularSub")}</Text>
            </View>
            <Switch
              value={popular}
              onValueChange={setPopular}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.surface}
            />
          </View>

          <Field
            label={t("admin.recipeForm.ingredients")}
            value={ingredientsText}
            onChangeText={setIngredientsText}
            multiline
            inputStyle={styles.tallInput}
          />

          <Field
            label={t("admin.recipeForm.preparation")}
            value={preparation}
            onChangeText={setPreparation}
            multiline
            inputStyle={styles.tallInput}
          />

          <PrimaryButton
            title={recipeId ? t("admin.recipeForm.update") : t("admin.recipeForm.save")}
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
  thirdField: {
    flex: 1,
    minWidth: 90,
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
  imagePreview: {
    width: "100%",
    height: 160,
    borderRadius: Radius.lg,
    resizeMode: "cover",
  },
  noImageText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  switchSub: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  tallInput: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
});
