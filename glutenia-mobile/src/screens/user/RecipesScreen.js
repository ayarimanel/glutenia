import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import Screen from "../../components/Screen";
import AppHeader from "../../components/AppHeader";
import AppIcon from "../../components/AppIcon";
import { useAuth } from "../../context/AuthContext";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

const RECIPES_META = [
  { id: "1", key: "r1", category: "Quick",    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600", calories: 370, carbo: 35, protein: 14, popular: false },
  { id: "2", key: "r2", category: "Tunisian", image: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=600", calories: 280, carbo: 22, protein: 18, popular: false },
  { id: "3", key: "r3", category: "Tunisian", image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600", calories: 180, carbo: 14, protein: 12, popular: false },
  { id: "4", key: "r4", category: "Tunisian", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600", calories: 410, carbo: 62, protein: 12, popular: true  },
  { id: "5", key: "r5", category: "Easy",     image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600", calories: 220, carbo: 28, protein: 9,  popular: true  },
  { id: "6", key: "r6", category: "Easy",     image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600", calories: 350, carbo: 55, protein: 8,  popular: false },
  { id: "7", key: "r7", category: "Quick",    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600", calories: 190, carbo: 30, protein: 11, popular: true  },
  { id: "8", key: "r8", category: "Quick",    image: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600", calories: 140, carbo: 4,  protein: 12, popular: false },
];

const FILTERS = ["Tunisian", "Easy", "Quick"];

export default function RecipesScreen({ navigation }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState("Tunisian");

  const RECIPES = RECIPES_META.map((r) => ({
    ...r,
    name: t(`recipes.items.${r.key}.name`),
    description: t(`recipes.items.${r.key}.description`),
    ingredients: t(`recipes.items.${r.key}.ingredients`).split("\n"),
    preparation: t(`recipes.items.${r.key}.preparation`),
  }));

  const featured = RECIPES.filter((r) => r.category === activeFilter).slice(0, 2);
  const popular = RECIPES.filter((r) => r.popular);

  return (
    <Screen>
      <AppHeader
        userName={user?.name ?? ""}
        onCartPress={() => navigation.navigate("CartPage")}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.title}>{t("recipes.title")}</Text>
        <Text style={styles.subtitle}>{t("recipes.subtitle")}</Text>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, activeFilter === f && styles.chipActive]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.8}
            >
              {activeFilter === f && (
                <AppIcon name="utensils" size={13} color="#fff" />
              )}
              <Text style={[styles.chipText, activeFilter === f && styles.chipTextActive]}>
                {t(`recipes.${f.toLowerCase()}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 2-column featured grid */}
        <View style={styles.grid}>
          {featured.map((recipe) => (
            <TouchableOpacity
              key={recipe.id}
              style={styles.card}
              onPress={() => navigation.navigate("RecipeDetail", { recipe })}
              activeOpacity={0.9}
            >
              <Image source={{ uri: recipe.image }} style={styles.cardImage} />
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{recipe.name}</Text>
                <Text style={styles.cardDesc} numberOfLines={3}>
                  {recipe.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Popular section */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionBlack}>{t("recipes.popular")} </Text>
          <Text style={styles.sectionGreen}>{t("recipes.popularHighlight")}</Text>
        </View>

        {popular.map((recipe) => (
          <TouchableOpacity
            key={recipe.id}
            style={styles.popularCard}
            onPress={() => navigation.navigate("RecipeDetail", { recipe })}
            activeOpacity={0.9}
          >
            <Image source={{ uri: recipe.image }} style={styles.popularImage} />
            <View style={styles.popularBody}>
              <Text style={styles.popularName}>{recipe.name}</Text>
              <Text style={styles.popularDesc} numberOfLines={3}>
                {recipe.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.textDark,
    marginTop: Spacing.md,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.secondary,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  filterRow: {
    marginBottom: Spacing.md,
  },
  filterContent: {
    gap: 10,
    paddingRight: Spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textDark,
  },
  chipTextActive: {
    color: "#fff",
  },
  grid: {
    flexDirection: "row",
    gap: 14,
    marginBottom: Spacing.lg,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: "hidden",
    ...Shadow,
  },
  cardImage: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  cardBody: {
    padding: 12,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.secondary,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
  },
  sectionRow: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  sectionBlack: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textDark,
  },
  sectionGreen: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.primary,
  },
  popularCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: 14,
    overflow: "hidden",
    ...Shadow,
  },
  popularImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    margin: 14,
    resizeMode: "cover",
  },
  popularBody: {
    flex: 1,
    paddingRight: 14,
    paddingVertical: 14,
  },
  popularName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.secondary,
    marginBottom: 5,
  },
  popularDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});
