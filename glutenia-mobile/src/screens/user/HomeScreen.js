import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import Screen from "../../components/Screen";
import AppHeader from "../../components/AppHeader";
import AppIcon from "../../components/AppIcon";
import ProductCard from "../../components/ProductCard";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { api } from "../../api/client";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const { user, token } = useAuth();
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [events, setEvents] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [homeGamification, setHomeGamification] = useState(null);
  const isProfessional = user?.role === "professional";

  useEffect(() => {
    api.products({})
      .then((data) => setProducts(data.slice(0, 8)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.events(token)
      .then((data) => setEvents(data.slice(0, 6)))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    api.scanHistory(token)
      .then(setScanHistory)
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (isProfessional) return;
    api.getHomeGamification(token)
      .then(setHomeGamification)
      .catch(() => {});
  }, [token, isProfessional]);

  const VERDICT_META = {
    safe: { icon: "checkmark-circle", color: colors.primary },
    caution: { icon: "info", color: colors.warning },
    unsafe: { icon: "close-circle", color: colors.danger },
    error: { icon: "info", color: colors.textMuted },
  };

  return (
    <Screen>
      <AppHeader
        userName={user?.name ?? ""}
        avatarUri={user?.avatar}
        onCartPress={() => navigation.navigate("CartPage")}
      />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Gamification strip ── */}
        {homeGamification && (
          <Pressable
            style={styles.gamStrip}
            onPress={() => navigation.navigate("Profile")}
          >
            <Text style={styles.gamLevelText}>
              {t("home.level", { level: homeGamification.currentLevel })}
            </Text>
            <View style={styles.gamBarTrack}>
              <View
                style={[
                  styles.gamBarFill,
                  { width: `${Math.round(homeGamification.progressRatio * 100)}%` },
                ]}
              />
            </View>
            <View style={styles.gamStreakWrap}>
              <Text style={styles.gamStreakText}>🔥 {homeGamification.currentStreak}</Text>
            </View>
          </Pressable>
        )}

        {/* ── QR Scanner hero ── */}
        <Pressable
          style={styles.hero}
          onPress={() => navigation.navigate("Scan")}
        >
          <AppIcon name="scan" size={80} color="#fff" strokeWidth={1.5} />
          <Text style={styles.heroSub}>
            {t("home.heroSub")}
          </Text>
          <View style={styles.heroBtn}>
            <Text style={styles.heroBtnText}>{t("home.tapToScan")}</Text>
          </View>
        </Pressable>

        {/* ── Eating-out nudge (frequent restaurant-goers only) ── */}
        {(user?.eating_out_frequency === "weekly" || user?.eating_out_frequency === "multiple_week") && (
          <Pressable style={styles.eatingOutCard} onPress={() => navigation.navigate("Map")}>
            <View style={styles.eatingOutIconWrap}>
              <AppIcon name="location" size={22} color={colors.primary} />
            </View>
            <View style={styles.eatingOutTextWrap}>
              <Text style={styles.eatingOutTitle}>{t("home.eatingOutTitle")}</Text>
              <Text style={styles.eatingOutBody}>{t("home.eatingOutBody")}</Text>
            </View>
            <AppIcon name="chevron-right" size={18} color={colors.textMuted} />
          </Pressable>
        )}

        {/* ── Recently Scanned ── */}
        {scanHistory.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>{t("home.recentlyScanned")}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
            >
              {scanHistory.map((item) => {
                const meta = VERDICT_META[item.verdict] || {
                  icon: "scan",
                  color: colors.secondary,
                };
                const isBarcodeWithProduct = item.scanType === "barcode" && item.product;
                return (
                  <Pressable
                    key={item._id}
                    style={styles.scanCard}
                    disabled={!isBarcodeWithProduct}
                    onPress={() =>
                      isBarcodeWithProduct &&
                      navigation.navigate("ProductDetail", { productId: item.product._id })
                    }
                  >
                    <View style={[styles.scanIconWrap, { backgroundColor: `${meta.color}22` }]}>
                      <AppIcon name={meta.icon} size={20} color={meta.color} />
                    </View>
                    <Text style={styles.scanSummary} numberOfLines={2}>
                      {item.summary || (item.verdict ? t(`labelScan.${item.verdict}`) : "")}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* ── Quick Access ── */}
        <Text style={styles.sectionLabel}>{t("home.quickAccess")}</Text>
        <View style={styles.quickGrid}>
          <Pressable
            style={styles.quickCard}
            onPress={() => navigation.navigate("Recipes")}
          >
            <View style={styles.quickIcon}>
              <AppIcon name="utensils" size={26} color={colors.secondary} />
            </View>
            <Text style={styles.quickLabel}>{t("home.recipes")}</Text>
          </Pressable>
          <Pressable
            style={styles.quickCard}
            onPress={() => navigation.navigate("Events")}
          >
            <View style={styles.quickIcon}>
              <AppIcon name="people" size={26} color={colors.secondary} />
            </View>
            <Text style={styles.quickLabel}>{t("events.title")}</Text>
          </Pressable>
          <Pressable
            style={styles.quickCard}
            onPress={() => navigation.navigate("PatientResources")}
          >
            <View style={styles.quickIcon}>
              <AppIcon name="heart" size={26} color={colors.secondary} />
            </View>
            <Text style={styles.quickLabel}>{t("home.patientResources")}</Text>
          </Pressable>
          <Pressable
            style={styles.quickCard}
            onPress={() => navigation.navigate("Map")}
          >
            <View style={styles.quickIcon}>
              <AppIcon name="location" size={26} color={colors.secondary} />
            </View>
            <Text style={styles.quickLabel}>{t("home.map")}</Text>
          </Pressable>
        </View>

        {/* ── Products Shop ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>{t("home.productsShop")}</Text>
          <Pressable
            style={styles.seeAll}
            onPress={() => navigation.navigate("ShopScreen")}
          >
            <Text style={styles.seeAllText}>{t("home.seeAll")}</Text>
            <AppIcon name="chevron-right" size={15} color={colors.secondary} />
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hList}
        >
          {products.map((item) => (
            <View key={item._id} style={styles.productWrap}>
              <ProductCard
                product={item}
                onPress={() =>
                  navigation.navigate("ProductDetail", { productId: item._id })
                }
                onAdd={() => {
                  addItem(item, 1);
                  Alert.alert(t("home.addedTitle"), t("home.addedMsg", { name: item.name }));
                }}
              />
            </View>
          ))}
        </ScrollView>

        {/* ── Check Events ── */}
        {events.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>{t("home.checkEvents")}</Text>
              <Pressable
                style={styles.seeAll}
                onPress={() => navigation.navigate("Events")}
              >
                <Text style={styles.seeAllText}>{t("home.seeAll")}</Text>
                <AppIcon name="chevron-right" size={15} color={colors.secondary} />
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
            >
              {events.map((event) => (
                <Pressable
                  key={event._id}
                  style={styles.eventCard}
                  onPress={() => navigation.navigate("EventDetail", { event })}
                >
                  <View style={[styles.eventImg, { backgroundColor: event.color }]}>
                    <Text style={styles.eventEmoji}>{event.emoji}</Text>
                    <View style={styles.eventBadge}>
                      <Text style={styles.eventBadgeText}>{event.category}</Text>
                    </View>
                  </View>
                  <View style={styles.eventBody}>
                    <Text style={styles.eventTitle} numberOfLines={2}>
                      {event.title}
                    </Text>
                    <View style={styles.eventMeta}>
                      <AppIcon name="location" size={12} color={colors.textMuted} />
                      <Text style={styles.eventMetaText} numberOfLines={1}>
                        {event.location}
                      </Text>
                    </View>
                    <View style={styles.eventMeta}>
                      <AppIcon name="calendar" size={12} color={colors.textMuted} />
                      <Text style={styles.eventMetaText}>{event.date}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </Screen>
  );
}

const getStyles = (colors) => StyleSheet.create({
  // ── Gamification strip ──
  gamStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: Radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    ...Shadow,
  },
  gamLevelText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textDark,
  },
  gamBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.divider,
    borderRadius: 3,
    overflow: "hidden",
  },
  gamBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  gamStreakWrap: {
    flexShrink: 0,
  },
  gamStreakText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textDark,
  },

  // ── Hero ──
  hero: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    gap: Spacing.md,
  },
  heroSub: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    opacity: 0.92,
    lineHeight: 20,
  },
  heroBtn: {
    marginTop: Spacing.sm,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.38)",
  },
  heroBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },

  eatingOutCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: colors.primaryPale,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  eatingOutIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  eatingOutTextWrap: { flex: 1 },
  eatingOutTitle: { fontSize: 14, fontWeight: "800", color: colors.textDark, marginBottom: 2 },
  eatingOutBody: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },

  // ── Section labels & rows ──
  sectionLabel: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.textDark,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.secondary,
  },

  // ── Quick Access ──
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  quickCard: {
    width: "47.5%",
    backgroundColor: colors.surface,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadow,
  },
  quickIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textDark,
    textAlign: "center",
  },

  // ── Horizontal lists ──
  hList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: 12,
  },

  // ── Product cards (horizontal preview) ──
  productWrap: {
    width: 160,
  },

  // ── Recently scanned ──
  scanCard: {
    width: 130,
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    gap: 8,
    ...Shadow,
  },
  scanIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scanSummary: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textDark,
    lineHeight: 16,
  },

  // ── Event cards ──
  eventCard: {
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: Radius.xl,
    overflow: "hidden",
    ...Shadow,
  },
  eventImg: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  eventEmoji: {
    fontSize: 48,
  },
  eventBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: colors.secondary,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  eventBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
  },
  eventBody: {
    padding: Spacing.sm,
    gap: 5,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textDark,
    lineHeight: 18,
    marginBottom: 2,
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eventMetaText: {
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
  },
});
