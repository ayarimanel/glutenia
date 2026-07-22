import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { useEffect, useMemo, useState } from "react";
import AppIcon from "../../components/AppIcon";
import AppHeader from "../../components/AppHeader";
import Screen from "../../components/Screen";
import ProductCard from "../../components/ProductCard";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { api } from "../../api/client";
import { Radius, Spacing } from "../../theme/colors";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { getShopCategoryOrder } from "../../utils/personalization";

const categories = ["All", "Bread", "Pasta", "Snacks", "Flour", "Sweets"];

export default function ShopScreen({ navigation }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addItemWithStockCheck } = useCart();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const orderedCategories = useMemo(
    () => getShopCategoryOrder(categories, user),
    [user?.primary_goal]
  );

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.products({
        category: category === "All" ? "" : category,
        search,
      });
      setProducts(data);
    } catch (error) {
      Alert.alert(t("shop.errorTitle"), error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handle = setTimeout(loadProducts, 250);
    return () => clearTimeout(handle);
  }, [category, search]);

  return (
    <Screen>
      <AppHeader
        userName={user?.name ?? ""}
        avatarUri={user?.avatar}
        onCartPress={() => navigation.navigate("CartPage")}
      />
      <View style={styles.container}>

        <View style={styles.searchBox}>
          <AppIcon name="search" size={19} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("shop.searchPlaceholder")}
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.categories}>
          {orderedCategories.map((item) => (
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
                {t("shop." + item.toLowerCase())}
              </Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadProducts} />}
          ListEmptyComponent={
            loading ? null : (
              <EmptyState
                icon="search"
                title={t("shop.emptyTitle")}
                body={t("shop.emptyBody")}
              />
            )
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => navigation.navigate("ProductDetail", { productId: item._id })}
              onAdd={() => addItemWithStockCheck(item, 1)}
            />
          )}
        />
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
  searchBox: {
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.textDark,
    fontSize: 15,
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  category: {
    borderRadius: Radius.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.divider,
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
  listContent: {
    paddingBottom: 24,
    gap: 12,
  },
  productRow: {
    gap: 12,
    marginBottom: 12,
  },
});
