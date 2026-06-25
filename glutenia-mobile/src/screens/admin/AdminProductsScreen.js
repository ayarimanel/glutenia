import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import AppIcon from "../../components/AppIcon";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import EmptyState from "../../components/EmptyState";
import ProductVisual from "../../components/ProductVisual";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

export default function AdminProductsScreen({ navigation }) {
  const { token, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setProducts(await api.products());
    } catch (error) {
      if (error.status === 401) {
        Alert.alert("Session expired", "Please log in as admin again.", [
          { text: "OK", onPress: logout },
        ]);
      } else {
        Alert.alert("Products", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [token])
  );

  const deleteProduct = (product) => {
    Alert.alert("Delete product", `Delete ${product.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            if (!token) {
              Alert.alert("Session", "Please log in again.");
              return;
            }
            await api.deleteProduct(token, product._id);
            await loadProducts();
          } catch (error) {
            Alert.alert("Delete failed", error.message);
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.container}>
        <SectionHeader
          eyebrow="Inventory"
          title="Products"
          right={
            <Pressable
              style={styles.addButton}
              onPress={() => navigation.navigate("AdminProductForm")}
            >
              <AppIcon name="add" size={24} color={Colors.surface} />
            </Pressable>
          }
        />
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadProducts} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState icon="cube" title="No products" body="Add the first item." />}
          renderItem={({ item }) => (
            <View style={styles.productRow}>
              <View style={styles.visual}>
                <ProductVisual product={item} />
              </View>
              <View style={styles.productBody}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.meta}>
                  {item.category} - Stock {item.stock}
                </Text>
                <Text style={styles.price}>{item.price.toFixed(2)} TND</Text>
              </View>
              <View style={styles.actions}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() =>
                    navigation.navigate("AdminProductForm", { productId: item._id })
                  }
                >
                  <AppIcon name="pencil" size={18} color={Colors.primary} />
                  <Text style={styles.actionText}>Edit</Text>
                </Pressable>
                <Pressable style={styles.actionButton} onPress={() => deleteProduct(item)}>
                  <AppIcon name="trash" size={18} color={Colors.danger} />
                  <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    padding: 10,
    gap: 12,
    ...Shadow,
  },
  visual: {
    width: 82,
  },
  productBody: {
    flex: 1,
    gap: 5,
  },
  name: {
    color: Colors.textDark,
    fontSize: 16,
    fontWeight: "900",
  },
  meta: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  price: {
    color: Colors.primary,
    fontWeight: "900",
  },
  actions: {
    gap: 8,
  },
  actionButton: {
    minWidth: 74,
    minHeight: 38,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
  },
  actionText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  deleteText: {
    color: Colors.danger,
  },
});
