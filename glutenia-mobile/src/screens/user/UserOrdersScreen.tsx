import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import EmptyState from "../../components/EmptyState";
import OrderStatusBadge from "../../components/OrderStatusBadge";
import { useAuthenticated } from "../../context/AuthContext";
import { api, type ApiError } from "../../api/client";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme, type ThemeColors } from "../../context/ThemeContext";
import type { Order } from "../../types/models";

export default function UserOrdersScreen() {
  const { t } = useTranslation();
  const { token } = useAuthenticated();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setOrders(await api.myOrders(token));
    } catch (err) {
      Alert.alert(t("userOrders.errorTitle"), (err as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const markReceived = (order: Order) => {
    const id = `#${order._id.slice(-6).toUpperCase()}`;
    Alert.alert(t("orderStatus.receivedTitle"), t("orderStatus.receivedMsg", { id }), [
      { text: t("orderStatus.cancel"), style: "cancel" },
      {
        text: t("orderStatus.ok"),
        onPress: async () => {
          try {
            setUpdatingId(order._id);
            const updated = await api.updateOrderStatus(token, order._id, "delivered");
            setOrders((current) => current.map((o) => (o._id === updated._id ? updated : o)));
          } catch (err) {
            Alert.alert(t("orderStatus.updateFailed"), (err as ApiError).message);
          } finally {
            setUpdatingId(null);
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.container}>
        <SectionHeader back eyebrow={t("userOrders.history")} title={t("userOrders.title")} />
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadOrders} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="receipt"
              title={t("userOrders.empty")}
              body={t("userOrders.emptyBody")}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderTop}>
                <Text style={styles.orderId}>#{item._id.slice(-6).toUpperCase()}</Text>
                <OrderStatusBadge status={item.status} />
              </View>
              <Text style={styles.meta}>
                {item.items.length} {t("userOrders.items")} - {new Date(item.createdAt).toLocaleDateString()}
              </Text>
              <Text style={styles.total}>{item.total.toFixed(2)} TND</Text>
              {item.allowedActions?.includes("delivered") ? (
                <Pressable
                  style={[styles.actionBtn, updatingId === item._id && styles.actionBtnDisabled]}
                  disabled={updatingId === item._id}
                  onPress={() => markReceived(item)}
                >
                  <Text style={styles.actionBtnText}>{t("orderStatus.action.received")}</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        />
      </View>
    </Screen>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
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
    backgroundColor: colors.surface,
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
    color: colors.textDark,
    fontSize: 18,
    fontWeight: "900",
  },
  meta: {
    color: colors.textMuted,
  },
  total: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "900",
  },
  actionBtn: {
    alignSelf: "flex-start",
    borderRadius: Radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 4,
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  actionBtnText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "800",
  },
});
