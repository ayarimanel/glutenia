import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import AppIcon from "../../components/AppIcon";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

export default function AdminDashboardScreen({ navigation }) {
  const { token, logout, user } = useAuth();
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

  const getInitials = (name) => {
    if (!name) return "AD";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={load} 
            colors={[Colors.primary]} 
            tintColor={Colors.primary} 
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Personalized Greeting Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
            </View>
            <View style={styles.greetingTextContainer}>
              <Text style={styles.eyebrow}>{t("admin.dashboard.eyebrow")}</Text>
              <Text style={styles.adminName} numberOfLines={1}>
                {user?.name || t("admin.dashboard.title")}
              </Text>
            </View>
          </View>
          <Pressable 
            style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]} 
            onPress={logout}
          >
            <AppIcon name="log-out" size={20} color={Colors.danger} />
          </Pressable>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          {/* Revenue Hero Card */}
          <View style={styles.revenueHeroCard}>
            <View style={styles.revenueInfo}>
              <Text style={styles.revenueLabel}>{t("admin.dashboard.revenue")}</Text>
              <Text style={styles.revenueValue} numberOfLines={1}>
                {revenue.toFixed(2)}
              </Text>
            </View>
            <View style={styles.revenueIconContainer}>
              <AppIcon name="cash" size={24} color={Colors.primary} />
            </View>
          </View>

          {/* Secondary Metric Cards Row */}
          <View style={styles.statsRow}>
            {/* Products Card */}
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <View style={[styles.statIconContainer, { backgroundColor: Colors.primaryPale }]}>
                  <AppIcon name="cube" size={18} color={Colors.primary} />
                </View>
                <Text style={styles.statValue}>{products.length}</Text>
              </View>
              <Text style={styles.statLabel} numberOfLines={1}>
                {t("admin.dashboard.products")}
              </Text>
            </View>

            {/* Orders Card */}
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <View style={[styles.statIconContainer, { backgroundColor: Colors.secondaryPale }]}>
                  <AppIcon name="receipt" size={18} color={Colors.secondary} />
                </View>
                <Text style={styles.statValue}>{orders.length}</Text>
              </View>
              <Text style={styles.statLabel} numberOfLines={1}>
                {t("admin.dashboard.orders")}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Menu Sections */}
        <View style={styles.menuContainer}>
          {/* Products Category */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{t("admin.dashboard.products")}</Text>
            <View style={styles.sectionCards}>
              <ActionItem
                title={t("admin.dashboard.addProduct")}
                icon="add-circle"
                onPress={() => navigation.navigate("AdminProductForm")}
                themeColor="primary"
              />
              <ActionItem
                title={t("admin.dashboard.manageProducts")}
                icon="list"
                onPress={() => navigation.navigate("Products")}
                themeColor="primary"
              />
            </View>
          </View>

          {/* Events Category */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{t("events.title")}</Text>
            <View style={styles.sectionCards}>
              <ActionItem
                title={t("admin.dashboard.addEvent")}
                icon="calendar"
                onPress={() => navigation.navigate("CreateEvent")}
                themeColor="secondary"
              />
              <ActionItem
                title={t("admin.dashboard.manageEvents")}
                icon="list"
                onPress={() => navigation.navigate("AdminEvents")}
                themeColor="secondary"
              />
            </View>
          </View>

          {/* Operations Category */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{t("admin.dashboard.orders")}</Text>
            <View style={styles.sectionCards}>
              <ActionItem
                title={t("admin.dashboard.viewOrders")}
                icon="receipt"
                onPress={() => navigation.navigate("Orders")}
                themeColor="primary"
              />
              <ActionItem
                title={t("admin.dashboard.professionalRequests")}
                icon="shield-check"
                onPress={() => navigation.navigate("AdminProfessionalRequests")}
                themeColor="secondary"
              />
              <ActionItem
                title={t("admin.dashboard.userInsights")}
                icon="activity"
                onPress={() => navigation.navigate("AdminAnalytics")}
                themeColor="primary"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function ActionItem({ title, icon, onPress, themeColor }) {
  const isPrimary = themeColor === "primary";
  const iconColor = isPrimary ? Colors.primary : Colors.secondary;
  const iconBg = isPrimary ? Colors.primaryPale : Colors.secondaryPale;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionCard,
        pressed && styles.actionCardPressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.actionIconWrapper, { backgroundColor: iconBg }]}>
        <AppIcon name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.actionCardText} numberOfLines={1}>
        {title}
      </Text>
      <AppIcon name="chevron-right" size={18} color={Colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.background,
  },
  container: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.sm,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "900",
  },
  greetingTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  eyebrow: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: "750",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  adminName: {
    color: Colors.textDark,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 26,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.divider,
    ...Shadow,
  },
  statsContainer: {
    gap: Spacing.md,
  },
  revenueHeroCard: {
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...Shadow,
  },
  revenueInfo: {
    flex: 1,
  },
  revenueLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  revenueValue: {
    color: Colors.textDark,
    fontSize: 32,
    fontWeight: "900",
    marginTop: 4,
  },
  revenueIconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    ...Shadow,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    padding: Spacing.md,
    justifyContent: "space-between",
    minHeight: 104,
    ...Shadow,
  },
  statCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    color: Colors.textDark,
    fontSize: 24,
    fontWeight: "900",
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: "750",
    marginTop: Spacing.sm,
  },
  menuContainer: {
    gap: Spacing.lg,
  },
  menuSection: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.textDark,
    fontSize: 16,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  sectionCards: {
    gap: Spacing.sm,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    padding: Spacing.md,
    ...Shadow,
  },
  actionIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  actionCardText: {
    flex: 1,
    color: Colors.textDark,
    fontSize: 15,
    fontWeight: "800",
    marginLeft: Spacing.md,
  },
  actionCardPressed: {
    opacity: 0.8,
    backgroundColor: Colors.background,
  },
  pressed: {
    opacity: 0.7,
  },
});
