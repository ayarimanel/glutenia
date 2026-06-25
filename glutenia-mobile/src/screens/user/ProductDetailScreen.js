import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import Screen from "../../components/Screen";
import ProductVisual from "../../components/ProductVisual";
import GlutenFreeBadge from "../../components/GlutenFreeBadge";
import QuantityStepper from "../../components/QuantityStepper";
import { IconButton, PrimaryButton } from "../../components/Buttons";
import { useCart } from "../../context/CartContext";
import { api } from "../../api/client";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

export default function ProductDetailScreen({ navigation, route }) {
  const { productId } = route.params;
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setProduct(await api.product(productId));
      } catch (error) {
        Alert.alert("Product", error.message);
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId]);

  if (!product) {
    return <Screen />;
  }

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
              <Text style={styles.name}>{product.name}</Text>
              <Text style={styles.category}>{product.category}</Text>
            </View>
            {product.isGlutenFree ? <GlutenFreeBadge /> : null}
          </View>
          <Text style={styles.description}>
            {product.description || "A gluten-free Glutenia staple ready for your pantry."}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{product.price.toFixed(2)} TND</Text>
            <QuantityStepper value={qty} onChange={setQty} />
          </View>
          <PrimaryButton
            title={loading ? "Loading" : "Add to cart"}
            icon="basket"
            onPress={() => {
              addItem(product, qty);
              Alert.alert("Added", `${qty} x ${product.name} added to cart.`);
            }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  card: {
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
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
    color: Colors.textDark,
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
  },
  category: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "900",
  },
  description: {
    color: Colors.textMuted,
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
    color: Colors.primary,
    fontSize: 26,
    fontWeight: "900",
  },
});
