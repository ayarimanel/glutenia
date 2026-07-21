import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import AppIcon from "../../components/AppIcon";
import Screen from "../../components/Screen";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

export default function AdminDashboardScreen({ navigation }) {
  const { token, logout, user } = useAuth();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const [nextProducts, nextOrders, nextRequests] = await Promise.all([
        api.products(),
        api.allOrders(token),
        api.professionalRequests(token, "pending").catch(() => []),
      ]);
      setProducts(Array.isArray(nextProducts) ? nextProducts : []);
      setOrders(Array.isArray(nextOrders) ? nextOrders : []);
      setPendingRequests(Array.isArray(nextRequests) ? nextRequests : []);
    } catch (error) {
      if (error.status === 401) {
        Alert.alert(
          t("admin.sessionExpired", "Session expired"),
          t("admin.sessionMsg", "Please log in as admin again."),
          [{ text: t("admin.ok", "OK"), onPress: logout }]
        );
      } else {
        Alert.alert(t("admin.dashboard.errorTitle", "Dashboard"), error.message);
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

  const revenue = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);

  const lowStockProducts = products.filter(
    (p) => typeof p.stock === "number" && p.stock <= 5
  );
  const lowStockCount = lowStockProducts.length;
  const pendingCount = pendingRequests.length;
  const hasAlerts = pendingCount > 0 || lowStockCount > 0;

  // Recent 3 orders sorted by date
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 3);

  const getInitials = (name) => {
    if (!name) return "AD";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatCurrency = (val) => `${Number(val || 0).toFixed(2)} TND`;

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "pending") {
      return { bg: colors.warning + "20", text: colors.warning, label: t("admin.orders.statusPending", "Pending") };
    }
    if (s === "confirmed" || s === "processing") {
      return { bg: colors.secondaryPale, text: colors.secondary, label: t("admin.orders.statusConfirmed", "Confirmed") };
    }
    if (s === "shipped" || s === "delivered") {
      return { bg: colors.primaryPale, text: colors.primary, label: status };
    }
    if (s === "cancelled") {
      return { bg: colors.danger + "20", text: colors.danger, label: t("admin.orders.statusCancelled", "Cancelled") };
    }
    return { bg: colors.divider, text: colors.textMuted, label: status || "Unknown" };
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            colors={[colors.primary]}
            tintColor={colors.primary}
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
              <Text style={styles.eyebrow}>{t("admin.dashboard.eyebrow", "Admin Panel")}</Text>
              <Text style={styles.adminName} numberOfLines={1}>
                {user?.name || t("admin.dashboard.title", "Dashboard")}
              </Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
            onPress={logout}
          >
            <AppIcon name="log-out" size={20} color={colors.danger} />
          </Pressable>
        </View>

        {/* Action Attention Banner Card */}
        {hasAlerts ? (
          <View style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <View style={styles.alertTitleRow}>
                <AppIcon name="bell" size={20} color={colors.warning} />
                <Text style={styles.alertTitle}>
                  {t("admin.dashboard.attentionTitle", "Action Required")}
                </Text>
              </View>
              <View style={styles.alertBadge}>
                <Text style={styles.alertBadgeText}>
                  {pendingCount + lowStockCount}
                </Text>
              </View>
            </View>

            <View style={styles.alertList}>
              {pendingCount > 0 && (
                <Pressable
                  style={({ pressed }) => [
                    styles.alertItem,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => navigation.navigate("AdminProfessionalRequests")}
                >
                  <View style={styles.alertItemIconWrapper}>
                    <AppIcon name="shield-check" size={18} color={colors.secondary} />
                  </View>
                  <View style={styles.alertItemContent}>
                    <Text style={styles.alertItemTitle}>
                      {t("admin.dashboard.pendingApprovals", "Pending Seller Requests")}
                    </Text>
                    <Text style={styles.alertItemSub}>
                      {t("admin.dashboard.pendingCountText", "{{count}} request(s) awaiting approval", {
                        count: pendingCount,
                        defaultValue: `${pendingCount} request(s) awaiting approval`,
                      })}
                    </Text>
                  </View>
                  <View style={styles.alertActionChip}>
                    <Text style={styles.alertActionChipText}>
                      {t("admin.dashboard.review", "Review")}
                    </Text>
                    <AppIcon name="chevron-right" size={14} color={colors.secondary} />
                  </View>
                </Pressable>
              )}

              {lowStockCount > 0 && (
                <Pressable
                  style={({ pressed }) => [
                    styles.alertItem,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => navigation.navigate("Products")}
                >
                  <View style={[styles.alertItemIconWrapper, { backgroundColor: colors.warning + "20" }]}>
                    <AppIcon name="cube" size={18} color={colors.warning} />
                  </View>
                  <View style={styles.alertItemContent}>
                    <Text style={styles.alertItemTitle}>
                      {t("admin.dashboard.lowStockWarning", "Low Stock Alert")}
                    </Text>
                    <Text style={styles.alertItemSub}>
                      {t("admin.dashboard.lowStockCountText", "{{count}} product(s) with ≤ 5 units left", {
                        count: lowStockCount,
                        defaultValue: `${lowStockCount} product(s) with ≤ 5 units left`,
                      })}
                    </Text>
                  </View>
                  <View style={styles.alertActionChip}>
                    <Text style={styles.alertActionChipText}>
                      {t("admin.dashboard.view", "View")}
                    </Text>
                    <AppIcon name="chevron-right" size={14} color={colors.secondary} />
                  </View>
                </Pressable>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.normalStatusCard}>
            <View style={styles.normalStatusIcon}>
              <AppIcon name="checkmark" size={18} color={colors.primary} />
            </View>
            <Text style={styles.normalStatusText}>
              {t("admin.dashboard.allClear", "All clear • No pending approvals or low-stock alerts")}
            </Text>
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          {/* Revenue Hero Card */}
          <View style={styles.revenueHeroCard}>
            <View style={styles.revenueInfo}>
              <Text style={styles.revenueLabel}>{t("admin.dashboard.revenue", "Total Revenue")}</Text>
              <Text style={styles.revenueValue} numberOfLines={1}>
                {formatCurrency(revenue)}
              </Text>
            </View>
            <View style={styles.revenueIconContainer}>
              <AppIcon name="cash" size={24} color={colors.primary} />
            </View>
          </View>

          {/* 2x2 Metric Cards Grid */}
          <View style={styles.kpiGrid}>
            {/* Pending Requests KPI */}
            <Pressable
              style={({ pressed }) => [styles.kpiCard, pressed && styles.pressed]}
              onPress={() => navigation.navigate("AdminProfessionalRequests")}
            >
              <View style={styles.kpiCardHeader}>
                <View
                  style={[
                    styles.kpiIconContainer,
                    {
                      backgroundColor:
                        pendingCount > 0 ? colors.secondaryPale : colors.primaryPale,
                    },
                  ]}
                >
                  <AppIcon
                    name="shield-check"
                    size={18}
                    color={pendingCount > 0 ? colors.secondary : colors.primary}
                  />
                </View>
                {pendingCount > 0 && (
                  <View style={styles.kpiAlertBadge}>
                    <Text style={styles.kpiAlertBadgeText}>{pendingCount}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.kpiValue}>{pendingCount}</Text>
              <Text style={styles.kpiLabel} numberOfLines={1}>
                {t("admin.dashboard.pendingApprovalsShort", "Pending Requests")}
              </Text>
            </Pressable>

            {/* Low Stock KPI */}
            <Pressable
              style={({ pressed }) => [styles.kpiCard, pressed && styles.pressed]}
              onPress={() => navigation.navigate("Products")}
            >
              <View style={styles.kpiCardHeader}>
                <View
                  style={[
                    styles.kpiIconContainer,
                    {
                      backgroundColor:
                        lowStockCount > 0 ? colors.warning + "20" : colors.primaryPale,
                    },
                  ]}
                >
                  <AppIcon
                    name="cube"
                    size={18}
                    color={lowStockCount > 0 ? colors.warning : colors.primary}
                  />
                </View>
                {lowStockCount > 0 && (
                  <View style={[styles.kpiAlertBadge, { backgroundColor: colors.warning }]}>
                    <Text style={styles.kpiAlertBadgeText}>{lowStockCount}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.kpiValue}>{lowStockCount}</Text>
              <Text style={styles.kpiLabel} numberOfLines={1}>
                {t("admin.dashboard.lowStockLabel", "Low Stock Products")}
              </Text>
            </Pressable>

            {/* Total Orders KPI */}
            <Pressable
              style={({ pressed }) => [styles.kpiCard, pressed && styles.pressed]}
              onPress={() => navigation.navigate("Orders")}
            >
              <View style={styles.kpiCardHeader}>
                <View style={[styles.kpiIconContainer, { backgroundColor: colors.secondaryPale }]}>
                  <AppIcon name="receipt" size={18} color={colors.secondary} />
                </View>
              </View>
              <Text style={styles.kpiValue}>{orders.length}</Text>
              <Text style={styles.kpiLabel} numberOfLines={1}>
                {t("admin.dashboard.orders", "Total Orders")}
              </Text>
            </Pressable>

            {/* Total Products KPI */}
            <Pressable
              style={({ pressed }) => [styles.kpiCard, pressed && styles.pressed]}
              onPress={() => navigation.navigate("Products")}
            >
              <View style={styles.kpiCardHeader}>
                <View style={[styles.kpiIconContainer, { backgroundColor: colors.primaryPale }]}>
                  <AppIcon name="list" size={18} color={colors.primary} />
                </View>
              </View>
              <Text style={styles.kpiValue}>{products.length}</Text>
              <Text style={styles.kpiLabel} numberOfLines={1}>
                {t("admin.dashboard.products", "Total Products")}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Recent Orders Preview Section */}
        <View style={styles.recentOrdersSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <AppIcon name="clock" size={18} color={colors.primary} />
              <Text style={styles.sectionHeaderTitle}>
                {t("admin.dashboard.recentOrdersTitle", "Recent Orders")}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.viewAllButton, pressed && styles.pressed]}
              onPress={() => navigation.navigate("Orders")}
            >
              <Text style={styles.viewAllText}>
                {t("admin.dashboard.viewAll", "View all")}
              </Text>
              <AppIcon name="chevron-right" size={14} color={colors.primary} />
            </Pressable>
          </View>

          {recentOrders.length > 0 ? (
            <View style={styles.recentOrdersList}>
              {recentOrders.map((order) => {
                const statusBadge = getStatusBadge(order.status);
                const orderIdStr = order._id
                  ? `#${order._id.slice(-6).toUpperCase()}`
                  : "#ORDER";
                const itemCount = order.items?.length || 0;
                const customerName =
                  order.user?.name || order.user?.email || t("admin.orders.customer", "Customer");

                return (
                  <Pressable
                    key={order._id}
                    style={({ pressed }) => [
                      styles.recentOrderCard,
                      pressed && styles.actionCardPressed,
                    ]}
                    onPress={() => navigation.navigate("AdminOrderDetail", { order })}
                  >
                    <View style={styles.recentOrderTop}>
                      <Text style={styles.recentOrderId}>{orderIdStr}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: statusBadge.text }]}>
                          {statusBadge.label}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.recentOrderBottom}>
                      <View style={styles.recentOrderCustomer}>
                        <Text style={styles.customerName} numberOfLines={1}>
                          {customerName}
                        </Text>
                        <Text style={styles.itemMeta}>
                          {t("admin.dashboard.itemsCount", "{{count}} item(s)", {
                            count: itemCount,
                            defaultValue: `${itemCount} item(s)`,
                          })}
                        </Text>
                      </View>
                      <Text style={styles.recentOrderPrice}>
                        {formatCurrency(order.total)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyOrdersCard}>
              <Text style={styles.emptyOrdersText}>
                {t("admin.dashboard.noOrdersYet", "No recent orders to show")}
              </Text>
            </View>
          )}
        </View>

        {/* Action Menu Sections */}
        <View style={styles.menuContainer}>
          {/* Products Category */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{t("admin.dashboard.products", "Products & Inventory")}</Text>
            <View style={styles.sectionCards}>
              <ActionItem
                title={t("admin.dashboard.addProduct", "Add product")}
                icon="add-circle"
                onPress={() => navigation.navigate("AdminProductForm")}
                themeColor="primary"
                colors={colors}
                styles={styles}
              />
              <ActionItem
                title={t("admin.dashboard.manageProducts", "Manage products")}
                subtitle={`${products.length} catalog items${lowStockCount > 0 ? ` • ${lowStockCount} low stock` : ""}`}
                icon="list"
                onPress={() => navigation.navigate("Products")}
                themeColor="primary"
                colors={colors}
                styles={styles}
                badgeText={lowStockCount > 0 ? `${lowStockCount} low` : null}
                badgeColor={colors.warning}
              />
            </View>
          </View>

          {/* Events Category */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{t("events.title", "Events")}</Text>
            <View style={styles.sectionCards}>
              <ActionItem
                title={t("admin.dashboard.addEvent", "Add event")}
                icon="calendar"
                onPress={() => navigation.navigate("CreateEvent")}
                themeColor="secondary"
                colors={colors}
                styles={styles}
              />
              <ActionItem
                title={t("admin.dashboard.manageEvents", "Manage events")}
                icon="list"
                onPress={() => navigation.navigate("AdminEvents")}
                themeColor="secondary"
                colors={colors}
                styles={styles}
              />
            </View>
          </View>

          {/* Operations Category */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{t("admin.dashboard.orders", "Operations & Management")}</Text>
            <View style={styles.sectionCards}>
              <ActionItem
                title={t("admin.dashboard.viewOrders", "View orders")}
                subtitle={`${orders.length} total orders`}
                icon="receipt"
                onPress={() => navigation.navigate("Orders")}
                themeColor="primary"
                colors={colors}
                styles={styles}
              />
              <ActionItem
                title={t("admin.dashboard.professionalRequests", "Professional requests")}
                icon="shield-check"
                onPress={() => navigation.navigate("AdminProfessionalRequests")}
                themeColor="secondary"
                colors={colors}
                styles={styles}
                badgeText={pendingCount > 0 ? `${pendingCount} pending` : null}
                badgeColor={colors.secondary}
              />
              <ActionItem
                title={t("admin.dashboard.userInsights", "User Insights")}
                icon="activity"
                onPress={() => navigation.navigate("AdminAnalytics")}
                themeColor="primary"
                colors={colors}
                styles={styles}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function ActionItem({
  title,
  subtitle,
  icon,
  onPress,
  themeColor,
  colors,
  styles,
  badgeText,
  badgeColor,
}) {
  const isPrimary = themeColor === "primary";
  const iconColor = isPrimary ? colors.primary : colors.secondary;
  const iconBg = isPrimary ? colors.primaryPale : colors.secondaryPale;

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
      <View style={styles.actionCardContent}>
        <Text style={styles.actionCardText} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.actionCardSubtext} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {badgeText && (
        <View
          style={[
            styles.actionBadge,
            { backgroundColor: (badgeColor || colors.secondary) + "20" },
          ]}
        >
          <Text
            style={[
              styles.actionBadgeText,
              { color: badgeColor || colors.secondary },
            ]}
          >
            {badgeText}
          </Text>
        </View>
      )}
      <AppIcon name="chevron-right" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: {
      backgroundColor: colors.background,
    },
    container: {
      padding: Spacing.md,
      paddingBottom: Spacing.xl * 1.5,
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
      backgroundColor: colors.primaryPale,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: colors.primaryLight,
    },
    avatarText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "900",
    },
    greetingTextContainer: {
      flex: 1,
      justifyContent: "center",
    },
    eyebrow: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: "750",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    adminName: {
      color: colors.textDark,
      fontSize: 22,
      fontWeight: "900",
      lineHeight: 26,
    },
    logoutButton: {
      width: 40,
      height: 40,
      borderRadius: Radius.pill,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: colors.divider,
      ...Shadow,
    },

    /* Urgent Alert Card */
    alertCard: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1.5,
      borderColor: colors.warning + "60",
      padding: Spacing.md,
      gap: Spacing.sm,
      ...Shadow,
    },
    alertHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    alertTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs + 2,
    },
    alertTitle: {
      color: colors.textDark,
      fontSize: 15,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    alertBadge: {
      backgroundColor: colors.warning,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: Radius.pill,
    },
    alertBadgeText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "900",
    },
    alertList: {
      gap: Spacing.xs,
    },
    alertItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: Radius.md,
      padding: Spacing.sm + 2,
      gap: Spacing.sm,
    },
    alertItemIconWrapper: {
      width: 32,
      height: 32,
      borderRadius: Radius.sm,
      backgroundColor: colors.secondaryPale,
      alignItems: "center",
      justifyContent: "center",
    },
    alertItemContent: {
      flex: 1,
    },
    alertItemTitle: {
      color: colors.textDark,
      fontSize: 14,
      fontWeight: "800",
    },
    alertItemSub: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: "600",
      marginTop: 1,
    },
    alertActionChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: Radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    alertActionChipText: {
      color: colors.secondary,
      fontSize: 12,
      fontWeight: "800",
    },

    /* All Clear Card */
    normalStatusCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.primaryPale,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
      gap: Spacing.sm,
    },
    normalStatusIcon: {
      width: 28,
      height: 28,
      borderRadius: Radius.pill,
      backgroundColor: colors.primaryPale,
      alignItems: "center",
      justifyContent: "center",
    },
    normalStatusText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: "700",
      flex: 1,
    },

    /* Stats Grid */
    statsContainer: {
      gap: Spacing.md,
    },
    revenueHeroCard: {
      backgroundColor: colors.primaryPale,
      borderRadius: Radius.lg,
      borderWidth: 1.5,
      borderColor: colors.primaryLight,
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
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    revenueValue: {
      color: colors.textDark,
      fontSize: 30,
      fontWeight: "900",
      marginTop: 4,
    },
    revenueIconContainer: {
      width: 46,
      height: 46,
      borderRadius: Radius.pill,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.primaryLight,
      ...Shadow,
    },
    kpiGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm + 4,
    },
    kpiCard: {
      width: "48%",
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1.5,
      borderColor: colors.divider,
      padding: Spacing.md,
      gap: Spacing.xs,
      ...Shadow,
    },
    kpiCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 2,
    },
    kpiIconContainer: {
      width: 34,
      height: 34,
      borderRadius: Radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    kpiAlertBadge: {
      backgroundColor: colors.secondary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: Radius.pill,
    },
    kpiAlertBadgeText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "900",
    },
    kpiValue: {
      color: colors.textDark,
      fontSize: 24,
      fontWeight: "900",
    },
    kpiLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: "750",
    },

    /* Recent Orders Section */
    recentOrdersSection: {
      gap: Spacing.sm,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 2,
    },
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs + 2,
    },
    sectionHeaderTitle: {
      color: colors.textDark,
      fontSize: 15,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    viewAllButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    viewAllText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: "800",
    },
    recentOrdersList: {
      gap: Spacing.sm,
    },
    recentOrderCard: {
      backgroundColor: colors.surface,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: colors.divider,
      padding: Spacing.md,
      gap: Spacing.sm,
      ...Shadow,
    },
    recentOrderTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    recentOrderId: {
      color: colors.textDark,
      fontSize: 14,
      fontWeight: "900",
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: Radius.pill,
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: "800",
      textTransform: "capitalize",
    },
    recentOrderBottom: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    recentOrderCustomer: {
      flex: 1,
      marginRight: Spacing.sm,
    },
    customerName: {
      color: colors.textDark,
      fontSize: 14,
      fontWeight: "750",
    },
    itemMeta: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: "600",
      marginTop: 2,
    },
    recentOrderPrice: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: "900",
    },
    emptyOrdersCard: {
      backgroundColor: colors.surface,
      borderRadius: Radius.md,
      padding: Spacing.md,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.divider,
    },
    emptyOrdersText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: "600",
    },

    /* Action Menu Sections */
    menuContainer: {
      gap: Spacing.lg,
    },
    menuSection: {
      gap: Spacing.sm,
    },
    sectionTitle: {
      color: colors.textDark,
      fontSize: 15,
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
      backgroundColor: colors.surface,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: colors.divider,
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
    actionCardContent: {
      flex: 1,
      marginLeft: Spacing.md,
    },
    actionCardText: {
      color: colors.textDark,
      fontSize: 15,
      fontWeight: "800",
    },
    actionCardSubtext: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: "600",
      marginTop: 2,
    },
    actionBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: Radius.pill,
      marginRight: Spacing.xs,
    },
    actionBadgeText: {
      fontSize: 11,
      fontWeight: "800",
    },
    actionCardPressed: {
      opacity: 0.8,
      backgroundColor: colors.background,
    },
    pressed: {
      opacity: 0.7,
    },
  });
