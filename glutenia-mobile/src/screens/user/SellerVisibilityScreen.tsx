import { useCallback, useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import AppIcon, { type IconName } from "../../components/AppIcon";
import { useAuth } from "../../context/AuthContext";
import { api, isApiError } from "../../api/client";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme, type ThemeColors } from "../../context/ThemeContext";
import type { Listing, OrderWithBuyer } from "../../types/models";

export default function SellerVisibilityScreen() {
  const { token, logout } = useAuth();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<OrderWithBuyer[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      const [myListings, myOrders] = await Promise.all([
        api.myListings(token),
        api.sellerOrders(token),
      ]);
      setListings(myListings);
      setOrders(myOrders);
    } catch (err) {
      if (isApiError(err) && err.status === 401) {
        Alert.alert(t("admin.sessionExpired"), t("admin.sessionMsg"), [
          { text: t("admin.ok"), onPress: logout },
        ]);
      } else {
        Alert.alert(t("seller.visibility.errorTitle"), err instanceof Error ? err.message : String(err));
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
  const lowStockCount = listings.filter((listing) => (listing.stock ?? 0) <= 5).length;

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
          <Metric label={t("seller.visibility.products")} value={listings.length} icon="cube" />
          <Metric label={t("seller.visibility.orders")} value={orders.length} icon="receipt" />
          <Metric label={t("seller.visibility.revenue")} value={revenue.toFixed(2)} icon="cash" />
        </View>
        <View style={styles.hintCard}>
          <AppIcon name="info" size={18} color={colors.secondary} />
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

function Metric({ label, value, icon }: { label: string; value: string | number; icon: IconName }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.metric}>
      <AppIcon name={icon} size={22} color={colors.secondary} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
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
    backgroundColor: colors.surface,
    padding: 12,
    justifyContent: "space-between",
    ...Shadow,
  },
  metricValue: {
    color: colors.textDark,
    fontSize: 24,
    fontWeight: "900",
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  hintCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.secondaryPale,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  hintText: {
    flex: 1,
    color: colors.textDark,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
});
