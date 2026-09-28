import { ActivityIndicator, Alert, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import AppIcon from "../../components/AppIcon";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import EmptyState from "../../components/EmptyState";
import ProductVisual from "../../components/ProductVisual";
import { useAuth } from "../../context/AuthContext";
import { api, isApiError, type ApiError } from "../../api/client";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme, type ThemeColors } from "../../context/ThemeContext";
import type { AppNavigation } from "../../navigation/types";
import type { AdminCommunityProduct, MissingBarcode, Product } from "../../types/models";

type Tab = "catalog" | "community" | "missing";

const TAB_LABEL_KEYS: Record<Tab, string> = {
  catalog: "admin.community.tabCatalog",
  community: "admin.community.tabCommunity",
  missing: "admin.missing.tab",
};

// Admin-only: manages the master product catalog (canonical name/category/
// image/gluten-free flag/barcode). A Professional's own sellable offers are
// a separate concept (Listing) managed on SellerListingsScreen instead.
// The second tab reviews community reports: barcodes users added after a
// label scan. They are never part of the shop, only shown after a scan.
// The third lists barcodes users scanned that Glutenia had no answer for.
export default function AdminProductsScreen({ navigation }: { navigation: AppNavigation }) {
  const { token, logout } = useAuth();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [tab, setTab] = useState<Tab>("catalog");
  const [products, setProducts] = useState<Product[]>([]);
  const [reports, setReports] = useState<AdminCommunityProduct[]>([]);
  const [missing, setMissing] = useState<MissingBarcode[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  // Distinct from `loading` (which also drives pull-to-refresh): tracks
  // whether we've completed the very first fetch yet, so the empty state
  // doesn't flash "no products" while the initial request is still in
  // flight.
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const loadProducts = async () => {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      const [catalog, community, notFound] = await Promise.all([
        api.products(),
        api.communityProducts(token),
        api.missingBarcodes(token),
      ]);
      setProducts(catalog);
      setReports(community);
      setMissing(notFound);
    } catch (err) {
      if (isApiError(err) && err.status === 401) {
        Alert.alert(t("admin.sessionExpired"), t("admin.sessionMsg"), [
          { text: t("admin.ok"), onPress: logout },
        ]);
      } else {
        Alert.alert(t("admin.products.errorTitle"), err instanceof Error ? err.message : String(err));
      }
    } finally {
      setLoading(false);
      setInitialLoadDone(true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [token])
  );

  const deleteProduct = (product: Product) => {
    Alert.alert(t("admin.products.deleteTitle"), t("admin.products.deleteMsg", { name: product.name }), [
      { text: t("admin.products.cancel"), style: "cancel" },
      {
        text: t("admin.products.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            if (!token) {
              Alert.alert(t("admin.sessionExpired"), t("admin.sessionMsgShort"));
              return;
            }
            await api.deleteProduct(token, product._id);
            await loadProducts();
          } catch (err) {
            Alert.alert(t("admin.products.deleteFailed"), (err as ApiError).message);
          }
        },
      },
    ]);
  };

  const reviewReport = async (report: AdminCommunityProduct, isGlutenFree?: boolean) => {
    if (!token) {
      Alert.alert(t("admin.sessionExpired"), t("admin.sessionMsgShort"));
      return;
    }
    try {
      const updated = await api.reviewCommunityProduct(
        token,
        report._id,
        isGlutenFree === undefined ? {} : { isGlutenFree }
      );
      setReports((current) => current.map((r) => (r._id === updated._id ? updated : r)));
    } catch (err) {
      Alert.alert(t("admin.community.reviewFailed"), (err as ApiError).message);
    }
  };

  const switchReportStatus = (report: AdminCommunityProduct) => {
    const next = !report.isGlutenFree;
    Alert.alert(
      t("admin.community.switchTitle"),
      t(next ? "admin.community.switchToFreeMsg" : "admin.community.switchToGlutenMsg", { name: report.name }),
      [
        { text: t("admin.products.cancel"), style: "cancel" },
        { text: t("admin.community.switch"), onPress: () => reviewReport(report, next) },
      ]
    );
  };

  const deleteReport = (report: AdminCommunityProduct) => {
    Alert.alert(t("admin.community.deleteTitle"), t("admin.community.deleteMsg", { name: report.name }), [
      { text: t("admin.products.cancel"), style: "cancel" },
      {
        text: t("admin.products.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            if (!token) {
              Alert.alert(t("admin.sessionExpired"), t("admin.sessionMsgShort"));
              return;
            }
            await api.deleteCommunityProduct(token, report._id);
            setReports((current) => current.filter((r) => r._id !== report._id));
          } catch (err) {
            Alert.alert(t("admin.products.deleteFailed"), (err as ApiError).message);
          }
        },
      },
    ]);
  };

  const dismissMissing = (entry: MissingBarcode) => {
    Alert.alert(t("admin.missing.dismissTitle"), t("admin.missing.dismissMsg", { barcode: entry.barcode }), [
      { text: t("admin.products.cancel"), style: "cancel" },
      {
        text: t("admin.missing.dismiss"),
        style: "destructive",
        onPress: async () => {
          try {
            if (!token) {
              Alert.alert(t("admin.sessionExpired"), t("admin.sessionMsgShort"));
              return;
            }
            await api.deleteMissingBarcode(token, entry._id);
            setMissing((current) => current.filter((m) => m._id !== entry._id));
          } catch (err) {
            Alert.alert(t("admin.products.deleteFailed"), (err as ApiError).message);
          }
        },
      },
    ]);
  };

  const query = search.trim().toLowerCase();
  const visibleProducts = query
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          (p.barcode || "").includes(query)
      )
    : products;
  const visibleReports = query
    ? reports.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          (r.brand || "").toLowerCase().includes(query) ||
          r.barcode.includes(query)
      )
    : reports;
  const visibleMissing = query ? missing.filter((m) => m.barcode.includes(query)) : missing;
  const flaggedCount = reports.filter((r) => r.flagCount > 0).length;

  const renderMissing = ({ item }: { item: MissingBarcode }) => (
    <View style={styles.reportCard}>
      <View style={styles.missingTop}>
        <View style={styles.missingIcon}>
          <AppIcon name="scan" size={22} color={colors.primary} />
        </View>
        <View style={styles.productBody}>
          <Text style={styles.missingBarcode}>{item.barcode}</Text>
          <Text style={styles.meta}>
            {t("admin.missing.scans", { scans: item.scanCount, users: item.userCount })}
          </Text>
          <Text style={styles.submitted}>
            {t("admin.missing.lastScanned", { date: new Date(item.lastScannedAt).toLocaleDateString() })}
          </Text>
        </View>
      </View>
      <View style={styles.reportActions}>
        <Pressable
          style={styles.actionButton}
          onPress={() => navigation.navigate("AdminProductForm", { barcode: item.barcode })}
        >
          <AppIcon name="add" size={16} color={colors.primary} />
          <Text style={styles.actionText}>{t("admin.missing.addToCatalog")}</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => dismissMissing(item)}>
          <AppIcon name="trash" size={16} color={colors.danger} />
          <Text style={[styles.actionText, styles.deleteText]}>{t("admin.missing.dismiss")}</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderReport = ({ item }: { item: AdminCommunityProduct }) => (
    <View style={[styles.reportCard, item.disputed && styles.reportCardDisputed]}>
      <View style={styles.reportTop}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.reportImage} />
        ) : (
          <View style={[styles.reportImage, styles.reportImageEmpty]}>
            <AppIcon name="cube" size={22} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.productBody}>
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
          {!!item.brand && <Text style={styles.meta}>{item.brand}</Text>}
          <Text style={styles.barcode}>{item.barcode}</Text>
          <View style={styles.tagRow}>
            <View style={[styles.tag, item.isGlutenFree ? styles.tagFree : styles.tagGluten]}>
              <Text style={[styles.tagText, item.isGlutenFree ? styles.tagFreeText : styles.tagGlutenText]}>
                {item.isGlutenFree ? t("scan.glutenFree") : t("scan.containsGluten")}
              </Text>
            </View>
            {item.disputed ? (
              <View style={[styles.tag, styles.tagDisputed]}>
                <Text style={[styles.tagText, styles.tagDisputedText]}>{t("admin.community.disputed")}</Text>
              </View>
            ) : item.flagCount > 0 ? (
              <View style={[styles.tag, styles.tagFlagged]}>
                <Text style={[styles.tagText, styles.tagFlaggedText]}>
                  {t("admin.community.flags", { count: item.flagCount })}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
      <Text style={styles.submitted}>
        {t("admin.community.submittedBy", {
          name: item.submittedBy?.name ?? t("admin.community.deletedUser"),
          date: new Date(item.createdAt).toLocaleDateString(),
        })}
      </Text>
      {item.flaggedBy.length > 0 && (
        <View style={styles.flaggers}>
          <Text style={styles.flaggersTitle}>{t("admin.community.flaggedByTitle")}</Text>
          {item.flaggedBy.map((user) => (
            <View key={user._id} style={styles.flagger}>
              <AppIcon name="person" size={14} color={colors.textMuted} />
              <Text style={styles.flaggerText} numberOfLines={1}>
                {user.name} · {user.email}
              </Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.reportActions}>
        {item.flagCount > 0 && (
          <Pressable style={styles.actionButton} onPress={() => reviewReport(item)}>
            <AppIcon name="checkmark" size={16} color={colors.primary} />
            <Text style={styles.actionText}>{t("admin.community.confirm")}</Text>
          </Pressable>
        )}
        <Pressable style={styles.actionButton} onPress={() => switchReportStatus(item)}>
          <AppIcon name="pencil" size={16} color={colors.primary} />
          <Text style={styles.actionText}>{t("admin.community.switch")}</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => deleteReport(item)}>
          <AppIcon name="trash" size={16} color={colors.danger} />
          <Text style={[styles.actionText, styles.deleteText]}>{t("admin.products.delete")}</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <Screen>
      <View style={styles.container}>
        <SectionHeader
          eyebrow={t("admin.products.eyebrow")}
          title={t("admin.products.title")}
          right={
            tab === "catalog" ? (
              <Pressable
                style={styles.addButton}
                onPress={() => navigation.navigate("AdminProductForm")}
              >
                <AppIcon name="add" size={24} color={colors.surface} />
              </Pressable>
            ) : undefined
          }
        />
        <View style={styles.tabs}>
          {(Object.keys(TAB_LABEL_KEYS) as Tab[]).map((key) => (
            <Pressable
              key={key}
              style={[styles.tab, tab === key && styles.tabActive]}
              onPress={() => setTab(key)}
            >
              <Text style={[styles.tabText, tab === key && styles.tabTextActive]} numberOfLines={1}>
                {t(TAB_LABEL_KEYS[key])}
              </Text>
              {key === "community" && flaggedCount > 0 && (
                <View style={styles.tabCount}>
                  <Text style={styles.tabCountText}>{flaggedCount}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
        <View style={styles.searchBox}>
          <AppIcon name="search" size={19} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={
              tab === "catalog"
                ? t("admin.products.searchPlaceholder")
                : tab === "community"
                  ? t("admin.community.searchPlaceholder")
                  : t("admin.missing.searchPlaceholder")
            }
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
        </View>
        {!initialLoadDone ? (
          <ActivityIndicator color={colors.primary} style={styles.loading} />
        ) : tab === "missing" ? (
        <FlatList
          data={visibleMissing}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadProducts} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={<Text style={styles.intro}>{t("admin.missing.intro")}</Text>}
          ListEmptyComponent={<EmptyState icon="scan" title={t("admin.missing.empty")} body={t("admin.missing.emptyBody")} />}
          renderItem={renderMissing}
        />
        ) : tab === "community" ? (
        <FlatList
          data={visibleReports}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadProducts} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={<Text style={styles.intro}>{t("admin.community.intro")}</Text>}
          ListEmptyComponent={<EmptyState icon="scan" title={t("admin.community.empty")} body={t("admin.community.emptyBody")} />}
          renderItem={renderReport}
        />
        ) : (
        <FlatList
          data={visibleProducts}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadProducts} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState icon="cube" title={t("admin.products.empty")} body={t("admin.products.emptyBody")} />}
          renderItem={({ item }) => (
            <View style={styles.productRow}>
              <View style={styles.visual}>
                <ProductVisual product={item} />
              </View>
              <View style={styles.productBody}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.meta}>{item.category}</Text>
              </View>
              <View style={styles.actions}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() =>
                    navigation.navigate("AdminProductForm", { productId: item._id })
                  }
                >
                  <AppIcon name="pencil" size={18} color={colors.primary} />
                  <Text style={styles.actionText}>{t("admin.products.edit")}</Text>
                </Pressable>
                <Pressable style={styles.actionButton} onPress={() => deleteProduct(item)}>
                  <AppIcon name="trash" size={18} color={colors.danger} />
                  <Text style={[styles.actionText, styles.deleteText]}>{t("admin.products.delete")}</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
        )}
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    flexDirection: "row",
    borderRadius: Radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
  },
  tabTextActive: {
    color: colors.surface,
  },
  tabCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: colors.warning,
    alignItems: "center",
    justifyContent: "center",
  },
  tabCountText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
  },
  searchBox: {
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.textDark,
    fontSize: 15,
  },
  loading: {
    marginVertical: Spacing.xl,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  intro: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    backgroundColor: colors.surface,
    padding: 10,
    gap: 12,
    ...Shadow,
  },
  visual: {
    width: 82,
  },
  productBody: {
    flex: 1,
    gap: 5,
  },
  name: {
    color: colors.textDark,
    fontSize: 16,
    fontWeight: "900",
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  actions: {
    gap: 8,
  },
  actionButton: {
    minWidth: 74,
    minHeight: 38,
    borderRadius: Radius.pill,
    backgroundColor: colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
  },
  actionText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  deleteText: {
    color: colors.danger,
  },
  reportCard: {
    borderRadius: Radius.lg,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "transparent",
    ...Shadow,
  },
  reportCardDisputed: {
    borderColor: colors.warning,
  },
  reportTop: {
    flexDirection: "row",
    gap: 12,
  },
  reportImage: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    backgroundColor: colors.divider,
  },
  reportImageEmpty: {
    alignItems: "center",
    justifyContent: "center",
  },
  barcode: {
    color: colors.textDark,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    fontVariant: ["tabular-nums"],
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    borderRadius: Radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "900",
  },
  tagFree: {
    backgroundColor: colors.primaryPale,
  },
  tagFreeText: {
    color: colors.primary,
  },
  tagGluten: {
    backgroundColor: colors.secondaryPale,
  },
  tagGlutenText: {
    color: colors.danger,
  },
  tagFlagged: {
    backgroundColor: colors.divider,
  },
  tagFlaggedText: {
    color: colors.textDark,
  },
  tagDisputed: {
    backgroundColor: colors.warning,
  },
  tagDisputedText: {
    color: "#fff",
  },
  submitted: {
    color: colors.textMuted,
    fontSize: 12,
  },
  flaggers: {
    borderRadius: Radius.md,
    backgroundColor: colors.background,
    padding: 10,
    gap: 6,
  },
  flaggersTitle: {
    color: colors.textDark,
    fontSize: 12,
    fontWeight: "900",
  },
  flagger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  flaggerText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
  },
  missingTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  missingIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
  },
  missingBarcode: {
    color: colors.textDark,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1,
    fontVariant: ["tabular-nums"],
  },
  reportActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
