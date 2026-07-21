import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
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
import { api } from "../../api/client";
import { Radius, Shadow, Spacing } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

const FILTERS = ["Tunisian", "Easy", "Quick"];

export default function RecipesScreen({ navigation }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [activeFilter, setActiveFilter] = useState("Tunisian");
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          setLoading(true);
          const data = await api.recipes();
          if (!cancelled) {
            setRecipes(
              data.map((r) => ({ ...r, id: r._id, image: r.imageUrl }))
            );
          }
        } catch (error) {
          // Keep whatever was previously loaded; recipes are non-critical content.
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const featured = recipes.filter((r) => r.category === activeFilter).slice(0, 2);
  const popular = recipes.filter(
    (r) => r.popular && r.category === activeFilter
  );

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

        {loading && recipes.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={styles.loading} />
        ) : null}

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

const getStyles = (colors) => StyleSheet.create({
  scroll: {
    paddingHorizontal: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textDark,
    marginTop: Spacing.md,
  },
  subtitle: {
    fontSize: 15,
    color: colors.secondary,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  filterRow: {
    marginBottom: Spacing.md,
  },
  loading: {
    marginVertical: Spacing.lg,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textDark,
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
    backgroundColor: colors.surface,
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
    color: colors.secondary,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  sectionRow: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  sectionBlack: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textDark,
  },
  sectionGreen: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
  },
  popularCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
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
    color: colors.secondary,
    marginBottom: 5,
  },
  popularDesc: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
