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
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";
import { useTranslation } from "react-i18next";

const EVENTS_META = [
  { id: "1", key: "e1", color: "#E8F5E9", emoji: "👨‍🍳", categoryKey: "workshops", going: 24 },
  { id: "2", key: "e2", color: "#FFF8E1", emoji: "🧺",  categoryKey: "meetups",   going: 56 },
  { id: "3", key: "e3", color: "#FCE4EC", emoji: "🧁",  categoryKey: "classes",   going: 18 },
];

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();

  const EVENTS_PREVIEW = EVENTS_META.map((e) => ({
    ...e,
    title: t(`homeEvents.${e.key}.title`),
    date: t(`homeEvents.${e.key}.date`),
    location: t(`homeEvents.${e.key}.location`),
    description: t(`homeEvents.${e.key}.description`),
    category: t(`events.${e.categoryKey}`),
  }));
  const { user } = useAuth();
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.products({})
      .then((data) => setProducts(data.slice(0, 8)))
      .catch(() => {});
  }, []);

  return (
    <Screen>
      <AppHeader
        userName={user?.name ?? ""}
        onCartPress={() => navigation.navigate("CartPage")}
      />
      <ScrollView showsVerticalScrollIndicator={false}>

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

        {/* ── Quick Access ── */}
        <Text style={styles.sectionLabel}>{t("home.quickAccess")}</Text>
        <View style={styles.quickGrid}>
          <Pressable
            style={styles.quickCard}
            onPress={() => navigation.navigate("Recipes")}
          >
            <View style={styles.quickIcon}>
              <AppIcon name="utensils" size={26} color={Colors.secondary} />
            </View>
            <Text style={styles.quickLabel}>{t("home.recipes")}</Text>
          </Pressable>
          <Pressable
            style={styles.quickCard}
            onPress={() => navigation.navigate("Events")}
          >
            <View style={styles.quickIcon}>
              <AppIcon name="people" size={26} color={Colors.secondary} />
            </View>
            <Text style={styles.quickLabel}>{t("home.community")}</Text>
          </Pressable>
          <Pressable
            style={styles.quickCard}
            onPress={() => navigation.navigate("PatientResources")}
          >
            <View style={styles.quickIcon}>
              <AppIcon name="heart" size={26} color={Colors.secondary} />
            </View>
            <Text style={styles.quickLabel}>{t("home.patientResources")}</Text>
          </Pressable>
          <Pressable
            style={styles.quickCard}
            onPress={() => navigation.navigate("Map")}
          >
            <View style={styles.quickIcon}>
              <AppIcon name="location" size={26} color={Colors.secondary} />
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
            <AppIcon name="chevron-right" size={15} color={Colors.secondary} />
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
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>{t("home.checkEvents")}</Text>
          <Pressable
            style={styles.seeAll}
            onPress={() => navigation.navigate("Events")}
          >
            <Text style={styles.seeAllText}>{t("home.seeAll")}</Text>
            <AppIcon name="chevron-right" size={15} color={Colors.secondary} />
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hList}
        >
          {EVENTS_PREVIEW.map((event) => (
            <Pressable
              key={event.id}
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
                  <AppIcon name="location" size={12} color={Colors.textMuted} />
                  <Text style={styles.eventMetaText} numberOfLines={1}>
                    {event.location}
                  </Text>
                </View>
                <View style={styles.eventMeta}>
                  <AppIcon name="calendar" size={12} color={Colors.textMuted} />
                  <Text style={styles.eventMetaText}>{event.date}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <View style={{ height: 100 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // ── Hero ──
  hero: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.primary,
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

  // ── Section labels & rows ──
  sectionLabel: {
    fontSize: 20,
    fontWeight: "900",
    color: Colors.textDark,
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
    color: Colors.secondary,
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
    backgroundColor: Colors.surface,
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
    backgroundColor: Colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textDark,
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

  // ── Event cards ──
  eventCard: {
    width: 200,
    backgroundColor: Colors.surface,
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
    backgroundColor: Colors.secondary,
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
    color: Colors.textDark,
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
    color: Colors.textMuted,
    flex: 1,
  },
});
