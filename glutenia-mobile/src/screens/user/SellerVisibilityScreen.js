import { useCallback, useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import AppIcon from "../../components/AppIcon";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

export default function SellerVisibilityScreen() {
  const { token, logout } = useAuth();
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      const [myProducts, myOrders] = await Promise.all([
        api.myProducts(token),
        api.sellerOrders(token),
      ]);
      setProducts(myProducts);
      setOrders(myOrders);
    } catch (error) {
      if (error.status === 401) {
        Alert.alert(t("admin.sessionExpired"), t("admin.sessionMsg"), [
          { text: t("admin.ok"), onPress: logout },
        ]);
      } else {
        Alert.alert(t("seller.visibility.errorTitle"), error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [token])
  );

  const revenue = orders.reduce(
    (sum, order) =>
      sum + order.items.reduce((itemSum, item) => itemSum + item.qty * item.price, 0),
    0
  );
  const lowStockCount = products.filter((product) => (product.stock ?? 0) <= 5).length;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <SectionHeader
          eyebrow={t("seller.visibility.eyebrow")}
          title={t("seller.visibility.title")}
        />
        <View style={styles.stats}>
          <Metric label={t("seller.visibility.products")} value={products.length} icon="cube" />
          <Metric label={t("seller.visibility.orders")} value={orders.length} icon="receipt" />
          <Metric label={t("seller.visibility.revenue")} value={revenue.toFixed(2)} icon="cash" />
        </View>
        <View style={styles.hintCard}>
          <AppIcon name="info" size={18} color={Colors.secondary} />
          <Text style={styles.hintText}>
            {lowStockCount > 0
              ? t("seller.visibility.lowStockHint", { count: lowStockCount })
              : t("seller.visibility.allGoodHint")}
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Metric({ label, value, icon }) {
  return (
    <View style={styles.metric}>
      <AppIcon name={icon} size={22} color={Colors.secondary} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  stats: {
    flexDirection: "row",
    gap: 10,
  },
  metric: {
    flex: 1,
    minHeight: 116,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    padding: 12,
    justifyContent: "space-between",
    ...Shadow,
  },
  metricValue: {
    color: Colors.textDark,
    fontSize: 24,
    fontWeight: "900",
  },
  metricLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  hintCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.secondaryPale,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  hintText: {
    flex: 1,
    color: Colors.textDark,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
});
