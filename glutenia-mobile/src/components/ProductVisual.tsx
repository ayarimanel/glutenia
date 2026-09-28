import { Image, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppIcon, { type IconName } from "./AppIcon";
import { Radius } from "../theme/colors";
import { useTheme, type ThemeColors } from "../context/ThemeContext";
import type { Product } from "../types/models";

const iconByCategory: Record<string, IconName> = {
  Bread: "bread-slice",
  Pasta: "noodles",
  Snacks: "food-variant",
  Flour: "sack",
  Sweets: "cupcake",
  Other: "leaf",
};

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=75&auto=format&fit=crop`;

// Shown when a product has no photo of its own (or it fails to load), so the
// shop shows real food instead of an icon. Several per category, picked by
// product name, so neighbouring products rarely share a photo.
const stockPhotosByCategory: Record<string, string[]> = {
  Bread: [unsplash("1549931319-a545dcf3bc73"), unsplash("1608198093002-ad4e005484ec")],
  Pasta: [
    unsplash("1621996346565-e3dbc646d9a9"),
    unsplash("1551183053-bf91a1d81141"),
    unsplash("1612874742237-6526221588e3"),
  ],
  Snacks: [unsplash("1599490659213-e2b9527bd087"), unsplash("1621447504864-d8686e12698c")],
  Flour: [unsplash("1595475207225-428b62bda831")],
  Sweets: [
    unsplash("1587314168485-3236d6710814"),
    unsplash("1587668178277-295251f900ce"),
    unsplash("1599599810769-bcde5a160d32"),
  ],
  Other: [unsplash("1614961233913-a5113a4a34ed")],
};

const stockPhotoFor = (category?: string | null, name?: string) => {
  const photos = stockPhotosByCategory[category ?? ""] || stockPhotosByCategory.Other;
  let hash = 0;
  for (const char of name ?? "") hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return photos[hash % photos.length];
};

interface ProductVisualProps {
  product?: (Pick<Product, "imageUrl" | "category"> & { name?: string }) | null;
  size?: "card" | "large";
  // Off where a stock photo would be mistaken for the product's own image
  // (the admin product form's preview).
  stockFallback?: boolean;
}

export default function ProductVisual({ product, size = "card", stockFallback = true }: ProductVisualProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const isLarge = size === "large";
  const ownImage = product?.imageUrl;
  const sources = [ownImage, stockFallback ? stockPhotoFor(product?.category, product?.name) : undefined].filter(
    (uri): uri is string => Boolean(uri)
  );
  // Index into `sources`; each load error moves on to the next, then the icon.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setAttempt(0);
  }, [ownImage, product?.category, product?.name]);

  const uri = sources[attempt];
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, isLarge && styles.large]}
        resizeMode="cover"
        onError={() => setAttempt((current) => current + 1)}
      />
    );
  }

  return (
    <View style={[styles.placeholder, isLarge && styles.large]}>
      <AppIcon
        name={iconByCategory[product?.category ?? ""] || "leaf"}
        size={isLarge ? 62 : 34}
        color={colors.primary}
      />
      {isLarge ? <Text style={styles.category}>{product?.category || t("productVisual.gfFallback")}</Text> : null}
    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  image: {
    width: "100%",
    aspectRatio: 1.18,
    borderRadius: Radius.md,
    backgroundColor: colors.primaryPale,
  },
  large: {
    aspectRatio: 1.35,
    borderRadius: Radius.lg,
  },
  placeholder: {
    width: "100%",
    aspectRatio: 1.18,
    borderRadius: Radius.md,
    backgroundColor: colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  category: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
});
