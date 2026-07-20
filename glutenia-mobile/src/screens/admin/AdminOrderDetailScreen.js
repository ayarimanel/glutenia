import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import AppIcon from "../../components/AppIcon";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

export default function AdminOrderDetailScreen({ navigation, route }) {
  const { t } = useTranslation();
  const order = route.params?.order;

  if (!order) {
    return (
      <Screen>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <AppIcon name="arrow-back" size={22} color={Colors.textDark} />
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

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <AppIcon name="arrow-back" size={22} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("admin.orders.detailTitle")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Text style={styles.id}>#{order._id.slice(-6).toUpperCase()}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{order.status}</Text>
          </View>
        </View>
        <Text style={styles.placedOn}>
          {t("admin.orders.placedOn")} {new Date(order.createdAt).toLocaleString()}
        </Text>

        <Text style={styles.sectionLabel}>{t("admin.orders.account")}</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <AppIcon name="person" size={16} color={Colors.secondary} />
            <Text style={styles.infoText}>
              {order.user?.name || t("admin.orders.customer")}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <AppIcon name="info" size={16} color={Colors.secondary} />
            <Text style={styles.infoText}>
              {order.user?.email || t("admin.orders.noEmail")}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t("admin.orders.deliveryAddress")}</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <AppIcon name="person" size={16} color={Colors.secondary} />
            <Text style={styles.infoText}>{order.address.fullName}</Text>
          </View>
          <View style={styles.infoRow}>
            <AppIcon name="location" size={16} color={Colors.secondary} />
            <Text style={styles.infoText}>
              {order.address.addressLine}, {order.address.city}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <AppIcon name="phone" size={16} color={Colors.secondary} />
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
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    color: Colors.textDark,
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
    color: Colors.textDark,
    fontSize: 22,
    fontWeight: "900",
  },
  statusPill: {
    backgroundColor: Colors.secondaryPale,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusText: {
    color: Colors.secondary,
    fontWeight: "900",
    fontSize: 12,
    textTransform: "uppercase",
  },
  placedOn: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
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
    color: Colors.textDark,
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
    borderTopColor: Colors.divider,
  },
  itemName: {
    flex: 1,
    color: Colors.textMuted,
    fontWeight: "700",
  },
  itemPrice: {
    color: Colors.textDark,
    fontWeight: "900",
  },
  totalsLabel: {
    color: Colors.textMuted,
    fontWeight: "700",
  },
  totalsValue: {
    color: Colors.textDark,
    fontWeight: "800",
  },
  grandLabel: {
    color: Colors.textDark,
    fontWeight: "900",
    fontSize: 16,
  },
  grandValue: {
    color: Colors.primary,
    fontWeight: "900",
    fontSize: 18,
  },
});
