import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import AppIcon from "../../components/AppIcon";
import AppHeader from "../../components/AppHeader";
import { useAuth } from "../../context/AuthContext";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

const CATEGORY_KEYS = ["all", "meetups", "classes", "markets", "workshops"];

const EVENTS_META = [
  { id: "1", key: "e1", categoryKey: "workshops", price: 25,  color: "#E8F5E9", emoji: "👨‍🍳", going: 24  },
  { id: "2", key: "e2", categoryKey: "meetups",   price: 0,   color: "#FFF8E1", emoji: "🧺",  going: 56  },
  { id: "3", key: "e3", categoryKey: "classes",   price: 15,  color: "#FCE4EC", emoji: "🧁",  going: 18  },
  { id: "4", key: "e4", categoryKey: "markets",   price: 5,   color: "#E3F2FD", emoji: "🛍️", going: 102 },
  { id: "5", key: "e5", categoryKey: "classes",   price: 0,   color: "#F3E5F5", emoji: "🥗",  going: 31  },
];

export default function EventsScreen({ navigation }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("all");

  const EVENTS = EVENTS_META.map((e) => ({
    ...e,
    title: t(`eventsData.${e.key}.title`),
    date: t(`eventsData.${e.key}.date`),
    location: t(`eventsData.${e.key}.location`),
    description: t(`eventsData.${e.key}.description`),
    category: t(`events.${e.categoryKey}`),
  }));

  const filtered =
    activeCategory === "all"
      ? EVENTS
      : EVENTS.filter((e) => e.categoryKey === activeCategory);

  return (
    <Screen>
      <AppHeader
        userName={user?.name ?? ""}
        onCartPress={() => navigation.navigate("CartPage")}
      />
      <View style={styles.container}>
        {/* Screen header: title + create event */}
        <View style={styles.header}>
          <Text style={styles.title}>{t("events.title")}</Text>
          <Pressable
            style={styles.addBtn}
            onPress={() => navigation.navigate("CreateEvent")}
          >
            <AppIcon name="add" size={22} color={Colors.primary} />
          </Pressable>
        </View>

        {/* Category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
        >
          {CATEGORY_KEYS.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.filterPill,
                activeCategory === cat && styles.filterPillActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  activeCategory === cat && styles.filterTextActive,
                ]}
              >
                {t(`events.${cat}`)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Events list */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate("EventDetail", { event: item })}
            >
              <View style={[styles.cardImage, { backgroundColor: item.color }]}>
                <Text style={styles.cardEmoji}>{item.emoji}</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{item.category}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={styles.cardMeta}>
                  <AppIcon name="calendar" size={13} color={Colors.textMuted} />
                  <Text style={styles.cardMetaText}>{item.date}</Text>
                </View>
                <View style={styles.cardFooter}>
                  <View style={styles.cardMeta}>
                    <AppIcon name="location" size={13} color={Colors.textMuted} />
                    <Text style={styles.cardMetaText} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </View>
                  <View style={styles.goingBadge}>
                    <AppIcon name="people" size={13} color={Colors.primary} />
                    <Text style={styles.goingText}>{t("events.going", { count: item.going })}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          )}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: Colors.textDark,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
  },
  filterScroll: {
    flexGrow: 0,
    height: 44,
  },
  filterRow: {
    paddingHorizontal: Spacing.md,
    gap: 8,
    alignItems: "center",
  },
  filterPill: {
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.textMuted,
  },
  filterTextActive: {
    color: "#fff",
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    overflow: "hidden",
    ...Shadow,
  },
  cardImage: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  cardEmoji: {
    fontSize: 72,
  },
  categoryBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: Colors.secondary,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  categoryBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
  },
  cardBody: {
    padding: Spacing.md,
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: Colors.textDark,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  cardMetaText: {
    fontSize: 13,
    color: Colors.textMuted,
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  goingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  goingText: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.primary,
  },
});