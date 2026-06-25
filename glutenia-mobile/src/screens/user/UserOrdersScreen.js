import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

export default function UserOrdersScreen() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setOrders(await api.myOrders(token));
    } catch (error) {
      Alert.alert("Orders", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <Screen>
      <View style={styles.container}>
        <SectionHeader eyebrow="History" title="My orders" />
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadOrders} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="receipt"
              title="No orders yet"
              body="Your confirmed orders will appear here."
            />
          }
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderTop}>
                <Text style={styles.orderId}>#{item._id.slice(-6).toUpperCase()}</Text>
                <Text style={styles.status}>{item.status}</Text>
              </View>
              <Text style={styles.meta}>
                {item.items.length} items - {new Date(item.createdAt).toLocaleDateString()}
              </Text>
              <Text style={styles.total}>{item.total.toFixed(2)} TND</Text>
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
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  orderCard: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    gap: 8,
    ...Shadow,
  },
  orderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: {
    color: Colors.textDark,
    fontSize: 18,
    fontWeight: "900",
  },
  status: {
    color: Colors.secondary,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  meta: {
    color: Colors.textMuted,
  },
  total: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: "900",
  },
});
