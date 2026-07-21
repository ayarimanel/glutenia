import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import AppIcon from "../../components/AppIcon";
import AppHeader from "../../components/AppHeader";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

const CATEGORY_KEYS = ["all", "meetups", "classes", "markets", "workshops"];

export default function EventsScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user, token } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          setLoading(true);
          const data = await api.events(token);
          setEvents(data);
        } catch {
          // leave previous data visible on error
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [token])
  );

  const filtered =
    activeCategory === "all"
      ? events
      : events.filter((e) => e.category.toLowerCase() === activeCategory);

  return (
    <Screen>
      <AppHeader
        userName={user?.name ?? ""}
        onCartPress={() => navigation.navigate("CartPage")}
      />
      <View style={styles.container}>
        {/* Screen header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t("events.title")}</Text>
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

        {/* Loading */}
        {loading && events.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState
                icon="calendar"
                title={t("events.empty")}
                body={t("events.emptyBody")}
              />
            }
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
                    <AppIcon name="calendar" size={13} color={colors.textMuted} />
                    <Text style={styles.cardMetaText}>{item.date}</Text>
                  </View>
                  <View style={styles.cardFooter}>
                    <View style={styles.cardMeta}>
                      <AppIcon name="location" size={13} color={colors.textMuted} />
                      <Text style={styles.cardMetaText} numberOfLines={1}>
                        {item.location}
                      </Text>
                    </View>
                    <View style={styles.goingBadge}>
                      <AppIcon name="people" size={13} color={colors.primary} />
                      <Text style={styles.goingText}>
                        {t("events.going", { count: item.attendeeCount })}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
    </Screen>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  header: {
    paddingHorizontal: Spacing.md,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: colors.textDark,
  },
  loadingWrap: {
    flex: 1,
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
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textMuted,
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
    backgroundColor: colors.surface,
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
    backgroundColor: colors.secondary,
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
    color: colors.textDark,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  cardMetaText: {
    fontSize: 13,
    color: colors.textMuted,
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
    color: colors.primary,
  },
});
