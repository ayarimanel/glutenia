import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import AppIcon from "../../components/AppIcon";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import EmptyState from "../../components/EmptyState";
import ProductVisual from "../../components/ProductVisual";
import QuantityStepper from "../../components/QuantityStepper";
import { PrimaryButton } from "../../components/Buttons";
import { useCart } from "../../context/CartContext";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

export default function CartScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { items, updateQty, removeItem, clearCart, total } = useCart();
  const hasOutOfStockItem = items.some(
    (item) => typeof item.stock === "number" && item.stock <= 0
  );

  return (
    <Screen>
      <View style={styles.container}>
        <SectionHeader
          eyebrow={t("cart.basket")}
          title={t("cart.title")}
          right={
            items.length ? (
              <Pressable
                style={styles.clear}
                onPress={() =>
                  Alert.alert(t("cart.clearTitle"), t("cart.clearMsg"), [
                    { text: t("cart.cancel"), style: "cancel" },
                    { text: t("cart.clear"), style: "destructive", onPress: clearCart },
                  ])
                }
              >
                <AppIcon name="trash" size={18} color={colors.danger} />
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
              title={t("cart.empty")}
              body={t("cart.emptyBody")}
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
                {typeof item.stock === "number" && item.qty >= item.stock && (
                  <Text style={item.stock <= 0 ? styles.stockOut : styles.stockLow}>
                    {item.stock <= 0
                      ? t("cart.itemOutOfStock")
                      : t("cart.itemLowStock", { stock: item.stock })}
                  </Text>
                )}
                <View style={styles.itemActions}>
                  <QuantityStepper
                    value={item.qty}
                    onChange={(qty) => updateQty(item.productId, qty)}
                    max={item.stock}
                  />
                  <Pressable onPress={() => removeItem(item.productId)}>
                    <AppIcon name="close-circle" size={28} color={colors.danger} />
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        />
        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryLabel}>{t("cart.subtotal")}</Text>
            <Text style={styles.total}>{total.toFixed(2)} TND</Text>
          </View>
          <PrimaryButton
            title={t("cart.checkout")}
            icon="card"
            disabled={!items.length || hasOutOfStockItem}
            onPress={() => navigation.navigate("Checkout")}
            style={styles.checkout}
          />
        </View>
      </View>
    </Screen>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  clear: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surface,
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
    color: colors.textDark,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 21,
  },
  itemPrice: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900",
  },
  stockOut: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  stockLow: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: "700",
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
    backgroundColor: colors.surface,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    ...Shadow,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  total: {
    color: colors.textDark,
    fontSize: 20,
    fontWeight: "900",
  },
  checkout: {
    flex: 1,
  },
});
