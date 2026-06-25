import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

export default function AdminOrdersScreen() {
  const { token, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadOrders = async () => {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setOrders(await api.allOrders(token));
    } catch (error) {
      if (error.status === 401) {
        Alert.alert("Session expired", "Please log in as admin again.", [
          { text: "OK", onPress: logout },
        ]);
      } else {
        Alert.alert("Orders", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [token])
  );

  return (
    <Screen>
      <View style={styles.container}>
        <SectionHeader eyebrow="Admin" title="Orders" />
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadOrders} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState icon="receipt" title="No orders" body="Orders arrive here after checkout." />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.top}>
                <Text style={styles.id}>#{item._id.slice(-6).toUpperCase()}</Text>
                <Text style={styles.status}>{item.status}</Text>
              </View>
              <Text style={styles.customer}>
                {item.user?.name || "Customer"} - {item.user?.email || "no email"}
              </Text>
              <Text style={styles.meta}>
                {item.items.length} items to {item.address.city}
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
  card: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    gap: 8,
    ...Shadow,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  id: {
    color: Colors.textDark,
    fontSize: 18,
    fontWeight: "900",
  },
  status: {
    color: Colors.secondary,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  customer: {
    color: Colors.textDark,
    fontWeight: "800",
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
