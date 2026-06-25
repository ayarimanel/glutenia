import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import AppIcon from "../../components/AppIcon";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import EmptyState from "../../components/EmptyState";
import ProductVisual from "../../components/ProductVisual";
import QuantityStepper from "../../components/QuantityStepper";
import { PrimaryButton } from "../../components/Buttons";
import { useCart } from "../../context/CartContext";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

export default function CartScreen({ navigation }) {
  const { items, updateQty, removeItem, clearCart, total } = useCart();

  return (
    <Screen>
      <View style={styles.container}>
        <SectionHeader
          eyebrow="Basket"
          title="Your cart"
          right={
            items.length ? (
              <Pressable
                style={styles.clear}
                onPress={() =>
                  Alert.alert("Clear cart", "Remove all items?", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Clear", style: "destructive", onPress: clearCart },
                  ])
                }
              >
                <AppIcon name="trash" size={18} color={Colors.danger} />
              </Pressable>
            ) : null
          }
        />
        <FlatList
          data={items}
          keyExtractor={(item) => item.productId}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="basket"
              title="Your cart is empty"
              body="Add gluten-free favorites from the catalog."
            />
          }
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.visual}>
                <ProductVisual product={{ ...item, _id: item.productId }} />
              </View>
              <View style={styles.itemBody}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.itemPrice}>{item.price.toFixed(2)} TND</Text>
                <View style={styles.itemActions}>
                  <QuantityStepper
                    value={item.qty}
                    onChange={(qty) => updateQty(item.productId, qty)}
                  />
                  <Pressable onPress={() => removeItem(item.productId)}>
                    <AppIcon name="close-circle" size={28} color={Colors.danger} />
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        />
        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.total}>{total.toFixed(2)} TND</Text>
          </View>
          <PrimaryButton
            title="Checkout"
            icon="card"
            disabled={!items.length}
            onPress={() => navigation.navigate("Checkout")}
            style={styles.checkout}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  clear: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    gap: 12,
    paddingBottom: 130,
  },
  itemCard: {
    flexDirection: "row",
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    padding: 10,
    gap: 12,
    ...Shadow,
  },
  visual: {
    width: 94,
  },
  itemBody: {
    flex: 1,
    gap: 8,
  },
  itemName: {
    color: Colors.textDark,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 21,
  },
  itemPrice: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "900",
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  summary: {
    position: "absolute",
    left: Spacing.md,
    right: Spacing.md,
    bottom: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    ...Shadow,
  },
  summaryLabel: {
    color: Colors.textMuted,
    fontWeight: "700",
  },
  total: {
    color: Colors.textDark,
    fontSize: 20,
    fontWeight: "900",
  },
  checkout: {
    flex: 1,
  },
});
