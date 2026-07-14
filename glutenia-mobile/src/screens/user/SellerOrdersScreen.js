import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

export default function SellerOrdersScreen() {
  const { token, logout } = useAuth();
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = async () => {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setOrders(await api.sellerOrders(token));
    } catch (error) {
      if (error.status === 401) {
        Alert.alert(t("admin.sessionExpired"), t("admin.sessionMsg"), [
          { text: t("admin.ok"), onPress: logout },
        ]);
      } else {
        Alert.alert(t("admin.orders.errorTitle"), error.message);
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

  const markAsShipped = async (orderId) => {
    try {
      setUpdatingId(orderId);
      await api.updateOrderStatus(token, orderId, "shipped");
      await loadOrders();
    } catch (error) {
      Alert.alert(t("admin.orders.errorTitle"), error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <SectionHeader eyebrow={t("seller.orders.eyebrow")} title={t("account.sellerOrders")} />
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadOrders} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="receipt"
              title={t("admin.orders.empty")}
              body={t("admin.orders.emptyBody")}
            />
          }
          renderItem={({ item }) => {
            const subtotal = item.items.reduce(
              (sum, orderItem) => sum + orderItem.qty * orderItem.price,
              0
            );
            return (
              <View style={styles.card}>
                <View style={styles.top}>
                  <Text style={styles.id}>#{item._id.slice(-6).toUpperCase()}</Text>
                  <Text style={styles.status}>{item.status}</Text>
                </View>
                <Text style={styles.customer}>
                  {item.user?.name || t("admin.orders.customer")} -{" "}
                  {item.user?.email || t("admin.orders.noEmail")}
                </Text>
                <Text style={styles.meta}>
                  {item.items.length} {t("admin.orders.itemsSuffix")} {item.address.city}
                </Text>
                <Text style={styles.total}>{subtotal.toFixed(2)} TND</Text>
                {item.status !== "shipped" && item.status !== "delivered" ? (
                  <Pressable
                    style={[styles.shipBtn, updatingId === item._id && styles.shipBtnDisabled]}
                    disabled={updatingId === item._id}
                    onPress={() => markAsShipped(item._id)}
                  >
                    <Text style={styles.shipBtnText}>
                      {updatingId === item._id
                        ? t("seller.orders.marking")
                        : t("seller.orders.markShipped")}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            );
          }}
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
  shipBtn: {
    alignSelf: "flex-start",
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 4,
  },
  shipBtnDisabled: {
    opacity: 0.6,
  },
  shipBtnText: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: "800",
  },
});
