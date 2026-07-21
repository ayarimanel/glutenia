import { Pressable, StyleSheet, Text, View } from "react-native";
import AppIcon from "./AppIcon";
import { Radius, Shadow } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import GlutenFreeBadge from "./GlutenFreeBadge";
import ProductVisual from "./ProductVisual";

export default function ProductCard({ product, onPress, onAdd }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      <ProductVisual product={product} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          <GlutenFreeBadge compact />
        </View>
        <Text style={styles.category}>{product.category}</Text>
        <View style={styles.bottom}>
          <Text style={styles.price}>{product.price.toFixed(2)} TND</Text>
          <Pressable style={styles.addButton} onPress={onAdd}>
            <AppIcon name="add" size={20} color={colors.surface} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const getStyles = (colors) => StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 260,
    borderRadius: Radius.lg,
    backgroundColor: colors.surface,
    padding: 10,
    gap: 10,
    ...Shadow,
  },
  pressed: {
    opacity: 0.88,
  },
  body: {
    flex: 1,
    gap: 8,
  },
  titleRow: {
    gap: 7,
  },
  name: {
    minHeight: 40,
    color: colors.textDark,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  category: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  bottom: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "900",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
