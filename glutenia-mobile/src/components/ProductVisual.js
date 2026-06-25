import { Image, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import AppIcon from "./AppIcon";
import { Colors, Radius } from "../theme/colors";

const iconByCategory = {
  Bread: "bread-slice",
  Pasta: "noodles",
  Snacks: "food-variant",
  Flour: "sack",
  Sweets: "cupcake",
  Other: "leaf",
};

export default function ProductVisual({ product, size = "card" }) {
  const isLarge = size === "large";
  const [failed, setFailed] = useState(false);
  const imageUrl = product?.imageUrl;

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  if (imageUrl && !failed) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, isLarge && styles.large]}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View style={[styles.placeholder, isLarge && styles.large]}>
      <AppIcon
        name={iconByCategory[product?.category] || "leaf"}
        size={isLarge ? 62 : 34}
        color={Colors.primary}
      />
      {isLarge ? <Text style={styles.category}>{product?.category || "GF"}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    aspectRatio: 1.18,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryPale,
  },
  large: {
    aspectRatio: 1.35,
    borderRadius: Radius.lg,
  },
  placeholder: {
    width: "100%",
    aspectRatio: 1.18,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  category: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
});
