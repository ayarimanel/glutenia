import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useEffect, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import Field from "../../components/Field";
import ProductVisual from "../../components/ProductVisual";
import { IconButton, PrimaryButton, SecondaryButton } from "../../components/Buttons";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Radius, Spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

const categories = ["Bread", "Pasta", "Snacks", "Flour", "Sweets", "Other"];
const MAX_IMAGE_DATA_URL_LENGTH = 5500000;

const readUriAsDataUrl = async (uri, mimeType) => {
  const response = await fetch(uri);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read selected image."));
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (result.startsWith("data:image/")) {
        resolve(result);
        return;
      }

      const base64 = result.split(",")[1];
      resolve(base64 ? `data:${mimeType};base64,${base64}` : "");
    };
    reader.readAsDataURL(blob);
  });
};

export default function AdminProductFormScreen({ navigation, route }) {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const productId = route.params?.productId;
  const imageDataUrlRef = useRef("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Bread");
  const [imageUrl, setImageUrl] = useState("");
  const [imageStatus, setImageStatus] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [stock, setStock] = useState("");
  const [barcode, setBarcode] = useState("");
  const [isGlutenFree, setIsGlutenFree] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);

  const categoryLabels = {
    Bread: t("shop.bread"),
    Pasta: t("shop.pasta"),
    Snacks: t("shop.snacks"),
    Flour: t("shop.flour"),
    Sweets: t("shop.sweets"),
    Other: t("admin.form.other"),
  };

  useEffect(() => {
    if (!productId) {
      return;
    }

    const loadProduct = async () => {
      try {
        const product = await api.product(productId);
        setName(product.name);
        setDescription(product.description || "");
        setPrice(String(product.price));
        setCategory(product.category);
        setImageUrl(product.imageUrl || "");
        imageDataUrlRef.current = "";
        setImageStatus(product.imageUrl ? t("admin.form.currentImage") : "");
        setRemoveImage(false);
        setStock(String(product.stock ?? 0));
        setBarcode(product.barcode || "");
        setIsGlutenFree(Boolean(product.isGlutenFree));
      } catch (error) {
        Alert.alert(t("admin.form.productErrorTitle"), error.message);
        navigation.goBack();
      }
    };

    loadProduct();
  }, [productId]);

  const save = async () => {
    const trimmedPrice = price.trim();
    const trimmedStock = stock.trim();
    const numericPrice = Number(trimmedPrice);
    const numericStock = Number(trimmedStock);
    const nextErrors = {};

    if (!name.trim()) {
      nextErrors.name = t("admin.form.errors.nameRequired");
    }

    if (!trimmedPrice) {
      nextErrors.price = t("admin.form.errors.priceRequired");
    } else if (Number.isNaN(numericPrice) || numericPrice < 0) {
      nextErrors.price = t("admin.form.errors.priceInvalid");
    }

    if (!trimmedStock) {
      nextErrors.stock = t("admin.form.errors.stockRequired");
    } else if (!Number.isInteger(numericStock) || numericStock < 0) {
      nextErrors.stock = t("admin.form.errors.stockInvalid");
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    try {
      if (!token) {
        Alert.alert(t("admin.sessionExpired"), t("admin.sessionMsgShort"));
        return;
      }

      setLoading(true);
      const imageDataUrl = imageDataUrlRef.current;
      const body = {
        name: name.trim(),
        description,
        price: numericPrice,
        category,
        stock: numericStock,
        barcode: barcode.trim(),
        isGlutenFree,
      };

      if (removeImage) {
        body.imageUrl = "";
      }

      if (imageDataUrl) {
        body.imageUrl = imageDataUrl;
      }

      const savedProduct = productId
        ? await api.updateProduct(token, productId, body)
        : await api.createProduct(token, body);

      const savedProductId = savedProduct?._id || productId;
      const confirmedProduct = savedProductId
        ? await api.product(savedProductId)
        : savedProduct;
      const confirmedImageUrl = confirmedProduct?.imageUrl || "";

      if (imageDataUrl && !confirmedImageUrl.startsWith("data:image/")) {
        throw new Error(t("admin.form.imageErrorKept"));
      }

      if (removeImage && confirmedImageUrl) {
        throw new Error(t("admin.form.imageErrorRemoved"));
      }

      setImageStatus(imageDataUrl ? t("admin.form.savedImg") : t("admin.form.saved"));
      Alert.alert(
        t("admin.form.saved"),
        imageDataUrl ? t("admin.form.savedImgMsg") : t("admin.form.savedMsg"),
        [{ text: t("admin.ok"), onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(t("admin.form.saveFailed"), error.message);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    setImageStatus(t("admin.form.image.checking"));

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setImageStatus(t("admin.form.image.denied"));
      Alert.alert(t("admin.form.image.permissionTitle"), t("admin.form.image.permissionMsg"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      base64: true,
      mediaTypes: ["images"],
      quality: 0.25,
    });

    if (result.canceled) {
      setImageStatus(t("admin.form.image.cancelled"));
      return;
    }

    const asset = result.assets?.[0];
    if (!asset?.uri) {
      setImageStatus(t("admin.form.image.cantRead"));
      Alert.alert(t("admin.form.image.errorTitle"), t("admin.form.image.cantReadMsg"));
      return;
    }

    try {
      setImageProcessing(true);
      setImageStatus(t("admin.form.image.reading"));
      const mimeType = asset.mimeType || "image/jpeg";
      const dataUrl = asset.base64
        ? `data:${mimeType};base64,${asset.base64}`
        : await readUriAsDataUrl(asset.uri, mimeType);

      if (!dataUrl.startsWith("data:image/")) {
        setImageStatus(t("admin.form.image.readFailed"));
        Alert.alert(t("admin.form.image.errorTitle"), t("admin.form.image.cantReadMsg"));
        return;
      }

      if (dataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
        setImageStatus(t("admin.form.image.tooLarge", { size: Math.ceil(dataUrl.length / 1024) }));
        Alert.alert(t("admin.form.image.tooLargeTitle"), t("admin.form.image.tooLargeMsg"));
        return;
      }

      imageDataUrlRef.current = dataUrl;
      setRemoveImage(false);
      setImageUrl(asset.uri);
      setImageStatus(t("admin.form.image.ready", { size: Math.ceil(dataUrl.length / 1024) }));
      Alert.alert(t("admin.form.image.readyTitle"), t("admin.form.image.readyMsg"));
    } catch (error) {
      setImageStatus(t("admin.form.image.failed"));
      Alert.alert(t("admin.form.image.errorTitle"), t("admin.form.image.failedMsg"));
    } finally {
      setImageProcessing(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <SectionHeader
          eyebrow={t("admin.form.eyebrow")}
          title={productId ? t("admin.form.titleEdit") : t("admin.form.titleAdd")}
          right={<IconButton icon="close" onPress={() => navigation.goBack()} />}
        />
        <Field
          label={t("admin.form.name")}
          value={name}
          error={errors.name}
          onChangeText={(value) => {
            setName(value);
            setErrors((current) => ({ ...current, name: "" }));
          }}
        />
        <Field
          label={t("admin.form.description")}
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <View style={styles.split}>
          <Field
            label={t("admin.form.price")}
            value={price}
            error={errors.price}
            onChangeText={(value) => {
              setPrice(value);
              setErrors((current) => ({ ...current, price: "" }));
            }}
            keyboardType="decimal-pad"
            style={styles.flex}
          />
          <Field
            label={t("admin.form.stock")}
            value={stock}
            error={errors.stock}
            onChangeText={(value) => {
              setStock(value);
              setErrors((current) => ({ ...current, stock: "" }));
            }}
            keyboardType="number-pad"
            style={styles.flex}
          />
        </View>
        <Field
          label={t("admin.form.barcode")}
          value={barcode}
          onChangeText={setBarcode}
          keyboardType="number-pad"
        />
        <View style={styles.categoryWrap}>
          <Text style={styles.label}>{t("admin.form.category")}</Text>
          <View style={styles.categories}>
            {categories.map((item) => (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                style={[styles.category, category === item && styles.categoryActive]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === item && styles.categoryTextActive,
                  ]}
                >
                  {categoryLabels[item] || item}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.imageSection}>
          <Text style={styles.label}>{t("admin.form.image")}</Text>
          <View
            style={[
              styles.imageStatusBox,
              imageStatus ? styles.imageStatusBoxActive : null,
            ]}
          >
            <Text style={styles.imageStatus}>
              {imageStatus || t("admin.form.noImage")}
            </Text>
          </View>
          <View style={styles.imagePreview}>
            <ProductVisual product={{ imageUrl, category }} size="large" />
          </View>
          <View style={styles.imageActions}>
            <SecondaryButton
              title={
                imageProcessing
                  ? t("admin.form.preparing")
                  : imageUrl
                    ? t("admin.form.replaceImage")
                    : t("admin.form.uploadImage")
              }
              icon="image"
              disabled={imageProcessing || loading}
              onPress={pickImage}
              style={styles.imageAction}
            />
            {imageUrl ? (
              <SecondaryButton
                title={t("admin.form.remove")}
                icon="trash"
                disabled={imageProcessing || loading}
                onPress={() => {
                  setImageUrl("");
                  imageDataUrlRef.current = "";
                  setImageStatus(t("admin.form.removeStatus"));
                  setRemoveImage(true);
                }}
                style={styles.imageAction}
              />
            ) : null}
          </View>
        </View>
        <View style={styles.switchCard}>
          <View>
            <Text style={styles.switchTitle}>{t("admin.form.glutenFree")}</Text>
            <Text style={styles.switchSub}>{t("admin.form.glutenFreeSub")}</Text>
          </View>
          <Switch
            value={isGlutenFree}
            onValueChange={setIsGlutenFree}
            trackColor={{ false: colors.divider, true: colors.secondaryPale }}
            thumbColor={isGlutenFree ? colors.secondary : colors.textMuted}
          />
        </View>
        <PrimaryButton
          title={productId ? t("admin.form.update") : t("admin.form.save")}
          icon="save"
          loading={loading || imageProcessing}
          disabled={imageProcessing}
          onPress={save}
        />
      </ScrollView>
    </Screen>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  split: {
    flexDirection: "row",
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  categoryWrap: {
    gap: 8,
  },
  label: {
    color: colors.textDark,
    fontSize: 13,
    fontWeight: "700",
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  category: {
    borderRadius: Radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  categoryActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    color: colors.textMuted,
    fontWeight: "800",
  },
  categoryTextActive: {
    color: colors.surface,
  },
  imageSection: {
    gap: 8,
  },
  imagePreview: {
    overflow: "hidden",
  },
  imageActions: {
    flexDirection: "row",
    gap: 10,
  },
  imageAction: {
    flex: 1,
  },
  imageStatusBox: {
    borderRadius: Radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  imageStatusBoxActive: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondaryPale,
  },
  imageStatus: {
    color: colors.textDark,
    fontSize: 12,
    fontWeight: "800",
  },
  switchCard: {
    borderRadius: Radius.md,
    backgroundColor: colors.surface,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  switchTitle: {
    color: colors.textDark,
    fontWeight: "900",
  },
  switchSub: {
    color: colors.textMuted,
    marginTop: 4,
  },
});
