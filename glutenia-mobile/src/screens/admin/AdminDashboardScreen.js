import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import AppIcon from "../../components/AppIcon";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

export default function AdminDashboardScreen({ navigation }) {
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
      const [nextProducts, nextOrders] = await Promise.all([
        api.products(),
        api.allOrders(token),
      ]);
      setProducts(nextProducts);
      setOrders(nextOrders);
    } catch (error) {
      if (error.status === 401) {
        Alert.alert(t("admin.sessionExpired"), t("admin.sessionMsg"), [
          { text: t("admin.ok"), onPress: logout },
        ]);
      } else {
        Alert.alert(t("admin.dashboard.errorTitle"), error.message);
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

  const revenue = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <SectionHeader eyebrow={t("admin.dashboard.eyebrow")} title={t("admin.dashboard.title")} />
        <View style={styles.stats}>
          <Metric label={t("admin.dashboard.products")} value={products.length} icon="cube" />
          <Metric label={t("admin.dashboard.orders")} value={orders.length} icon="receipt" />
          <Metric label={t("admin.dashboard.revenue")} value={revenue.toFixed(2)} icon="cash" />
        </View>
        <View style={styles.actions}>
          <Action
            title={t("admin.dashboard.addProduct")}
            icon="add-circle"
            onPress={() => navigation.navigate("AdminProductForm")}
          />
          <Action
            title={t("admin.dashboard.manageProducts")}
            icon="list"
            onPress={() => navigation.navigate("Products")}
          />
          <Action
            title={t("admin.dashboard.viewOrders")}
            icon="receipt"
            onPress={() => navigation.navigate("Orders")}
          />
          <Action
            title={t("admin.dashboard.addEvent")}
            icon="calendar"
            onPress={() => navigation.navigate("CreateEvent")}
          />
          <Action
            title={t("admin.dashboard.manageEvents")}
            icon="list"
            onPress={() => navigation.navigate("AdminEvents")}
          />
          <Action
            title={t("admin.dashboard.professionalRequests")}
            icon="shield-check"
            onPress={() => navigation.navigate("AdminProfessionalRequests")}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function Metric({ label, value, icon }) {
  return (
    <View style={styles.metric}>
      <AppIcon name={icon} size={22} color={Colors.primary} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function Action({ title, icon, onPress }) {
  return (
    <Pressable style={({ pressed }) => [styles.action, pressed && styles.pressed]} onPress={onPress}>
      <AppIcon name={icon} size={24} color={Colors.surface} />
      <Text style={styles.actionText}>{title}</Text>
    </Pressable>
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
  actions: {
    gap: 12,
  },
  action: {
    minHeight: 68,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionText: {
    color: Colors.surface,
    fontSize: 17,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.86,
  },
});
