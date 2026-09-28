import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import AppIcon from "../../components/AppIcon";
import { PrimaryButton, SecondaryButton } from "../../components/Buttons";
import OrderStatusBadge from "../../components/OrderStatusBadge";
import { useAuthenticated } from "../../context/AuthContext";
import { api, type ApiError } from "../../api/client";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme, type ThemeColors } from "../../context/ThemeContext";
import type { RouteProp } from "@react-navigation/native";
import type { AppNavigation, RootParamList } from "../../navigation/types";
import type { OrderStatus, OrderWithBuyer } from "../../types/models";

interface AdminOrderDetailScreenProps {
  navigation: AppNavigation;
  route: RouteProp<RootParamList, "AdminOrderDetail">;
}

export default function AdminOrderDetailScreen({ navigation, route }: AdminOrderDetailScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { token } = useAuthenticated();
  const styles = getStyles(colors);
  // Kept in state so a status change shows immediately on this screen.
  const [order, setOrder] = useState<OrderWithBuyer | undefined>(route.params?.order);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  if (!order) {
    return (
      <Screen>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <AppIcon name="arrow-back" size={22} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("admin.orders.detailTitle")}</Text>
          <View style={styles.headerSpacer} />
        </View>
      </Screen>
    );
  }

  const subtotal = order.items.reduce(
    (sum, item) => sum + item.qty * item.price,
    0
  );
  const deliveryFee = order.deliveryFee ?? order.total - subtotal;
  const orderRef = `#${order._id.slice(-6).toUpperCase()}`;

  // Admin moves the whole order one step forward; the next step comes from
  // the backend's allowedActions for this order.
  const moveOrder = (status: OrderStatus) => {
    Alert.alert(
      t("orderStatus.confirmTitle"),
      t("orderStatus.confirmMsg", { id: orderRef, status: t(`orderStatus.${status}`) }),
      [
        { text: t("orderStatus.cancel"), style: "cancel" },
        {
          text: t("orderStatus.ok"),
          onPress: async () => {
            try {
              setUpdating(true);
              const updated = await api.updateOrderStatus(token, order._id, status);
              // The update response has the raw user id; keep the buyer summary.
              setOrder({ ...updated, user: order.user });
            } catch (err) {
              Alert.alert(t("orderStatus.updateFailed"), (err as ApiError).message);
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const deleteOrder = () => {
    Alert.alert(t("admin.orders.deleteTitle"), t("admin.orders.deleteMsg", { id: orderRef }), [
      { text: t("admin.orders.deleteCancel"), style: "cancel" },
      {
        text: t("admin.orders.deleteConfirm"),
        style: "destructive",
        onPress: async () => {
          try {
            setDeleting(true);
            await api.deleteOrder(token, order._id);
            navigation.goBack();
          } catch (err) {
            Alert.alert(t("admin.orders.deleteFailed"), (err as ApiError).message);
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <AppIcon name="arrow-back" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("admin.orders.detailTitle")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Text style={styles.id}>{orderRef}</Text>
          <OrderStatusBadge status={order.status} />
        </View>
        <Text style={styles.placedOn}>
          {t("admin.orders.placedOn")} {new Date(order.createdAt).toLocaleString()}
        </Text>

        <Text style={styles.sectionLabel}>{t("admin.orders.account")}</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <AppIcon name="person" size={16} color={colors.secondary} />
            <Text style={styles.infoText}>
              {order.user?.name || t("admin.orders.customer")}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <AppIcon name="info" size={16} color={colors.secondary} />
            <Text style={styles.infoText}>
              {order.user?.email || t("admin.orders.noEmail")}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t("admin.orders.deliveryAddress")}</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <AppIcon name="person" size={16} color={colors.secondary} />
            <Text style={styles.infoText}>{order.address.fullName}</Text>
          </View>
          <View style={styles.infoRow}>
            <AppIcon name="location" size={16} color={colors.secondary} />
            <Text style={styles.infoText}>
              {order.address.addressLine}, {order.address.city}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <AppIcon name="phone" size={16} color={colors.secondary} />
            <Text style={styles.infoText}>{order.address.phone}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t("admin.orders.orderItems")}</Text>
        <View style={styles.card}>
          {order.items.map((item, idx) => (
            <View
              key={`${item.product}-${idx}`}
              style={[styles.itemRow, idx > 0 && styles.itemBorder]}
            >
              <Text style={styles.itemName} numberOfLines={1}>
                {item.qty} x {item.name}
              </Text>
              <Text style={styles.itemPrice}>
                {(item.qty * item.price).toFixed(2)} TND
              </Text>
            </View>
          ))}
          <View style={[styles.itemRow, styles.itemBorder]}>
            <Text style={styles.totalsLabel}>{t("admin.orders.subtotal")}</Text>
            <Text style={styles.totalsValue}>{subtotal.toFixed(2)} TND</Text>
          </View>
          <View style={styles.itemRow}>
            <Text style={styles.totalsLabel}>{t("admin.orders.deliveryFee")}</Text>
            <Text style={styles.totalsValue}>{deliveryFee.toFixed(2)} TND</Text>
          </View>
          <View style={[styles.itemRow, styles.itemBorder]}>
            <Text style={styles.grandLabel}>{t("admin.orders.total")}</Text>
            <Text style={styles.grandValue}>{order.total.toFixed(2)} TND</Text>
          </View>
        </View>

        {order.statusHistory?.length ? (
          <>
            <Text style={styles.sectionLabel}>{t("orderStatus.historyTitle")}</Text>
            <View style={styles.card}>
              {order.statusHistory.map((entry, idx) => (
                <View key={`${entry.status}-${idx}`} style={[styles.historyRow, idx > 0 && styles.itemBorder]}>
                  <OrderStatusBadge status={entry.status} />
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyWho}>{t(`orderStatus.by.${entry.role}`)}</Text>
                    <Text style={styles.historyDate}>{new Date(entry.date).toLocaleString()}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {order.allowedActions?.map((status) => (
          <PrimaryButton
            key={status}
            title={t(`orderStatus.action.${status}`)}
            icon="checkmark-circle"
            loading={updating}
            disabled={deleting}
            onPress={() => moveOrder(status)}
          />
        ))}

        <SecondaryButton
          title={t("admin.orders.deleteOrder")}
          icon="trash"
          disabled={deleting || updating}
          onPress={deleteOrder}
        />
      </ScrollView>
    </Screen>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  backBtn: { width: 30, padding: 4 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: colors.textDark,
  },
  headerSpacer: { width: 30 },
  scroll: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: 48,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  id: {
    color: colors.textDark,
    fontSize: 22,
    fontWeight: "900",
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  historyInfo: {
    flex: 1,
    alignItems: "flex-end",
  },
  historyWho: {
    color: colors.textDark,
    fontSize: 13,
    fontWeight: "700",
  },
  historyDate: {
    color: colors.textMuted,
    fontSize: 12,
  },
  placedOn: {
    color: colors.textMuted,
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: Spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 12,
    ...Shadow,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoText: {
    flex: 1,
    color: colors.textDark,
    fontSize: 14,
    fontWeight: "600",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8,
  },
  itemBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  itemName: {
    flex: 1,
    color: colors.textMuted,
    fontWeight: "700",
  },
  itemPrice: {
    color: colors.textDark,
    fontWeight: "900",
  },
  totalsLabel: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  totalsValue: {
    color: colors.textDark,
    fontWeight: "800",
  },
  grandLabel: {
    color: colors.textDark,
    fontWeight: "900",
    fontSize: 16,
  },
  grandValue: {
    color: colors.primary,
    fontWeight: "900",
    fontSize: 18,
  },
});
