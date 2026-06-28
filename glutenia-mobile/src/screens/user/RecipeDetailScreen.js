import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import AppHeader from "../../components/AppHeader";
import AppIcon from "../../components/AppIcon";
import { useAuth } from "../../context/AuthContext";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

export default function RecipeDetailScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { recipe } = route.params;

  const stats = [
    { value: recipe.calories, label: t("recipeDetail.calories") },
    { value: recipe.carbo, label: t("recipeDetail.carbo") },
    { value: recipe.protein, label: t("recipeDetail.protein") },
  ];

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
        {/* Back + title */}
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <AppIcon name="arrow-back" size={22} color={Colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={2}>
            {recipe.name}
          </Text>
        </View>

        {/* Nutritions */}
        <Text style={styles.sectionTitle}>{t("recipeDetail.nutritions")}</Text>
        <View style={styles.nutritionRow}>
          <View style={styles.statsCol}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.statPill}>
                <View style={styles.statCircle}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                </View>
                <View style={styles.statLabelBox}>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </View>
            ))}
          </View>
          <Image source={{ uri: recipe.image }} style={styles.nutritionImage} />
        </View>

        {/* Ingredients */}
        <Text style={styles.sectionTitle}>{t("recipeDetail.ingredients")}</Text>
        <View style={styles.ingredientList}>
          {recipe.ingredients.map((item, i) => (
            <View key={i} style={styles.ingredientRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.ingredientText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Preparation */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
          {t("recipeDetail.preparation")}
        </Text>
        <Text style={styles.prepText}>{recipe.preparation}</Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: Spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textDark,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textDark,
    marginBottom: Spacing.md,
  },
  nutritionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: 16,
  },
  statsCol: {
    flex: 1,
    gap: 14,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
  },
  statCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  statValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  statLabelBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: 22,
    paddingVertical: 10,
    marginLeft: -16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textDark,
    marginLeft: 8,
  },
  nutritionImage: {
    width: 140,
    height: 200,
    borderRadius: Radius.xl,
    resizeMode: "cover",
  },
  ingredientList: {
    gap: 8,
    marginBottom: Spacing.md,
  },
  ingredientRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  bullet: {
    fontSize: 18,
    color: Colors.textMuted,
    lineHeight: 26,
  },
  ingredientText: {
    fontSize: 16,
    color: Colors.textDark,
    lineHeight: 26,
    flex: 1,
  },
  prepText: {
    fontSize: 15,
    color: Colors.textMuted,
    lineHeight: 25,
  },
});
