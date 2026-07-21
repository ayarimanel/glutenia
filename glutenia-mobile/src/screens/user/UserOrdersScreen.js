import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

export default function UserOrdersScreen() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setOrders(await api.myOrders(token));
    } catch (error) {
      Alert.alert(t("userOrders.errorTitle"), error.message);
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
        <SectionHeader eyebrow={t("userOrders.history")} title={t("userOrders.title")} />
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
                <Text style={styles.status}>{item.status}</Text>
              </View>
              <Text style={styles.meta}>
                {item.items.length} {t("userOrders.items")} - {new Date(item.createdAt).toLocaleDateString()}
              </Text>
              <Text style={styles.total}>{item.total.toFixed(2)} TND</Text>
            </View>
          )}
        />
      </View>
    </Screen>
  );
}

const getStyles = (colors) => StyleSheet.create({
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
  status: {
    color: colors.secondary,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  meta: {
    color: colors.textMuted,
  },
  total: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "900",
  },
});
