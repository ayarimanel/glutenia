import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useState } from "react";
import Screen from "../../components/Screen";
import AppIcon from "../../components/AppIcon";
import AppHeader from "../../components/AppHeader";
import { useAuth } from "../../context/AuthContext";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

const CATEGORIES = ["All", "Meetups", "Classes", "Markets", "Workshops"];

const EVENTS = [
  {
    id: "1",
    title: "Gluten-Free Cooking Workshop",
    category: "Workshops",
    date: "Sat, Jun 15 • 2:00 PM",
    location: "Culinary Arts Center, Tunis",
    going: 24,
    price: 25,
    color: "#E8F5E9",
    emoji: "👨‍🍳",
    description:
      "Join us for a hands-on gluten-free cooking workshop where you'll learn to make delicious bread, pasta, and desserts — all 100% gluten-free.",
  },
  {
    id: "2",
    title: "GF Community Picnic",
    category: "Meetups",
    date: "Sun, Jun 23 • 11:00 AM",
    location: "Parc du Belvédère, Tunis",
    going: 56,
    price: 0,
    color: "#FFF8E1",
    emoji: "🧺",
    description:
      "A relaxed outdoor picnic for the gluten-free community. Bring a dish to share and meet others living the GF lifestyle.",
  },
  {
    id: "3",
    title: "Gluten-Free Baking Class",
    category: "Classes",
    date: "Fri, Jun 28 • 4:00 PM",
    location: "Maison de la Culture, Tunis",
    going: 18,
    price: 15,
    color: "#FCE4EC",
    emoji: "🧁",
    description:
      "Learn the secrets of perfect gluten-free baking. From sourdough to croissants — all adapted for a gluten-free diet.",
  },
  {
    id: "4",
    title: "Organic & GF Market",
    category: "Markets",
    date: "Sat, Jul 5 • 9:00 AM",
    location: "Avenue Habib Bourguiba, Tunis",
    going: 102,
    price: 5,
    color: "#E3F2FD",
    emoji: "🛍️",
    description:
      "Browse stalls from local producers selling certified gluten-free and organic products. Perfect for stocking up!",
  },
  {
    id: "5",
    title: "GF Nutrition Talk",
    category: "Classes",
    date: "Wed, Jul 9 • 6:00 PM",
    location: "Clinique Pasteur, Tunis",
    going: 31,
    price: 0,
    color: "#F3E5F5",
    emoji: "🥗",
    description:
      "A free talk by certified nutritionists on living well with celiac disease and gluten intolerance.",
  },
];

export default function EventsScreen({ navigation }) {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered =
    activeCategory === "All"
      ? EVENTS
      : EVENTS.filter((e) => e.category === activeCategory);

  return (
    <Screen>
      <AppHeader
        userName={user?.name ?? ""}
        onCartPress={() => navigation.navigate("CartPage")}
      />
      <View style={styles.container}>
        {/* Screen header: title + create event */}
        <View style={styles.header}>
          <Text style={styles.title}>Events</Text>
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
          {CATEGORIES.map((cat) => (
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
                {cat}
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
                    <Text style={styles.goingText}>{item.going} going</Text>
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