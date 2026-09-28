import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import EmptyState from "../../components/EmptyState";
import OrderStatusBadge from "../../components/OrderStatusBadge";
import { useAuthenticated } from "../../context/AuthContext";
import { api, isApiError, type ApiError } from "../../api/client";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme, type ThemeColors } from "../../context/ThemeContext";
import type { OrderStatus, SellerOrder } from "../../types/models";

export default function SellerOrdersScreen() {
  const { token, logout } = useAuthenticated();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = async () => {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setOrders(await api.sellerOrders(token));
    } catch (err) {
      if (isApiError(err) && err.status === 401) {
        Alert.alert(t("admin.sessionExpired"), t("admin.sessionMsg"), [
          { text: t("admin.ok"), onPress: logout },
        ]);
      } else {
        Alert.alert(t("admin.orders.errorTitle"), err instanceof Error ? err.message : String(err));
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

  // Moves the professional's own part of the order: pending -> confirmed,
  // then confirmed -> shipped. Buttons come from the backend's allowedActions.
  const moveOrder = async (orderId: string, status: OrderStatus) => {
    try {
      setUpdatingId(orderId);
      await api.updateOrderStatus(token, orderId, status);
      await loadOrders();
    } catch (error) {
      Alert.alert(t("admin.orders.errorTitle"), (error as ApiError).message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <SectionHeader back eyebrow={t("seller.orders.eyebrow")} title={t("account.sellerOrders")} />
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
                  <View style={styles.statusCol}>
                    <Text style={styles.statusCaption}>{t("orderStatus.yourPart")}</Text>
                    <OrderStatusBadge status={item.sellerStatus} />
                  </View>
                </View>
                <Text style={styles.customer}>
                  {item.user?.name || t("admin.orders.customer")} -{" "}
                  {item.user?.email || t("admin.orders.noEmail")}
                </Text>
                <Text style={styles.meta}>
                  {item.items.length} {t("admin.orders.itemsSuffix")} {item.address.city}
                </Text>
                <Text style={styles.total}>{subtotal.toFixed(2)} TND</Text>
                {item.allowedActions?.map((status) => (
                  <Pressable
                    key={status}
                    style={[styles.shipBtn, updatingId === item._id && styles.shipBtnDisabled]}
                    disabled={updatingId === item._id}
                    onPress={() => moveOrder(item._id, status)}
                  >
                    <Text style={styles.shipBtnText}>
                      {updatingId === item._id
                        ? t("seller.orders.marking")
                        : t(`orderStatus.action.${status}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            );
          }}
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
  card: {
    borderRadius: Radius.lg,
    backgroundColor: colors.surface,
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
    color: colors.textDark,
    fontSize: 18,
    fontWeight: "900",
  },
  statusCol: {
    alignItems: "flex-end",
    gap: 3,
  },
  statusCaption: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  customer: {
    color: colors.textDark,
    fontWeight: "800",
  },
  meta: {
    color: colors.textMuted,
  },
  total: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "900",
  },
  shipBtn: {
    alignSelf: "flex-start",
    borderRadius: Radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 4,
  },
  shipBtnDisabled: {
    opacity: 0.6,
  },
  shipBtnText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "800",
  },
});
