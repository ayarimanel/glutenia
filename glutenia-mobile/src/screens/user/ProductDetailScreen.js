import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import ProductVisual from "../../components/ProductVisual";
import GlutenFreeBadge from "../../components/GlutenFreeBadge";
import QuantityStepper from "../../components/QuantityStepper";
import { IconButton, PrimaryButton } from "../../components/Buttons";
import { useCart } from "../../context/CartContext";
import { api } from "../../api/client";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

export default function ProductDetailScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { productId } = route.params;
  const { addItemWithStockCheck } = useCart();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setProduct(await api.product(productId));
        setQty(1);
      } catch (error) {
        Alert.alert(t("productDetail.errorTitle"), error.message);
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId]);

  if (loading || !product) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  const stock = product.stock ?? 0;
  const outOfStock = stock <= 0;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topRow}>
          <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
          <IconButton icon="basket" onPress={() => navigation.navigate("Cart")} />
        </View>
        <ProductVisual product={product} size="large" />
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <Text style={styles.name} numberOfLines={3}>{product.name}</Text>
              <Text style={styles.category}>{product.category}</Text>
            </View>
            {product.isGlutenFree ? <GlutenFreeBadge /> : null}
          </View>
          <Text style={styles.description}>
            {product.description || t("productDetail.fallbackDesc")}
          </Text>
          <Text style={outOfStock ? styles.stockOut : stock <= 5 ? styles.stockLow : styles.stockOk}>
            {outOfStock
              ? t("productDetail.outOfStock")
              : stock <= 5
                ? t("productDetail.lowStock", { stock })
                : t("productDetail.inStock")}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{product.price.toFixed(2)} TND</Text>
            {!outOfStock && <QuantityStepper value={qty} onChange={setQty} max={stock} />}
          </View>
          <PrimaryButton
            title={outOfStock ? t("productDetail.outOfStock") : t("productDetail.addToCart")}
            icon="basket"
            disabled={outOfStock}
            onPress={() => addItemWithStockCheck(product, qty)}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const getStyles = (colors) => StyleSheet.create({
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  stockOk: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  stockLow: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: "700",
  },
  stockOut: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "700",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  card: {
    borderRadius: Radius.xl,
    backgroundColor: colors.surface,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow,
  },
  header: {
    gap: 12,
  },
  titleWrap: {
    gap: 6,
  },
  name: {
    color: colors.textDark,
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
  },
  category: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900",
  },
  description: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 23,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  price: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: "900",
  },
});
