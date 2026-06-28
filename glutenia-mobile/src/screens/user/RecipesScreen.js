import { useState } from "react";
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

const RECIPES = [
  {
    id: "1",
    name: "Gluten-Free Pizza",
    description: "Homemade GF crust topped with fresh mozzarella and basil.",
    category: "Quick",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600",
    calories: 370,
    carbo: 35,
    protein: 14,
    popular: false,
    ingredients: [
      "Gluten-free pizza flour blend",
      "Yeast and warm water",
      "Tomato sauce",
      "Fresh mozzarella cheese",
      "Fresh basil leaves",
      "Olive oil",
    ],
    preparation:
      "Mix flour, yeast, and water to form the dough. Let the dough rise for 30 minutes. Spread tomato sauce over the crust. Top with mozzarella and basil. Bake at 220°C for 15 minutes until golden and crispy.",
  },
  {
    id: "2",
    name: "Tunisian Brik",
    description: "Crispy gluten-free pastry filled with egg, tuna, and parsley.",
    category: "Tunisian",
    image: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=600",
    calories: 280,
    carbo: 22,
    protein: 18,
    popular: false,
    ingredients: [
      "Rice paper sheets",
      "Canned tuna",
      "Fresh parsley",
      "Egg",
      "Capers",
      "Harissa paste",
      "Lemon juice",
    ],
    preparation:
      "Place a rice paper sheet on a hot oiled pan. Add tuna, parsley, and capers. Crack an egg in the center. Fold the sheet into a triangle and fry until crispy and golden on both sides. Serve hot with lemon wedges.",
  },
  {
    id: "3",
    name: "Mechouia Salad",
    description: "Grilled Tunisian pepper and tomato salad with tuna and olives.",
    category: "Tunisian",
    image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600",
    calories: 180,
    carbo: 14,
    protein: 12,
    popular: false,
    ingredients: [
      "Green peppers",
      "Ripe tomatoes",
      "Garlic cloves",
      "Canned tuna",
      "Black olives",
      "Olive oil",
      "Lemon juice and cumin",
    ],
    preparation:
      "Grill peppers and tomatoes directly over flame until charred. Peel and chop coarsely. Mix with garlic, olive oil, lemon juice, and cumin. Top with tuna and olives. Serve at room temperature.",
  },
  {
    id: "4",
    name: "GF Couscous",
    description: "Traditional millet couscous with slow-cooked vegetables and chickpeas.",
    category: "Tunisian",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600",
    calories: 410,
    carbo: 62,
    protein: 12,
    popular: true,
    ingredients: [
      "Millet or corn couscous",
      "Chickpeas",
      "Carrots and zucchini",
      "Turnip",
      "Harissa paste",
      "Olive oil",
      "Cumin and coriander",
    ],
    preparation:
      "Steam GF couscous until fluffy and set aside. Sauté onion with harissa and spices in olive oil. Add vegetables and chickpeas, then cover with broth and simmer 25 minutes. Pour stew over couscous and serve immediately.",
  },
  {
    id: "5",
    name: "Quinoa Salad",
    description: "Refreshing salad with quinoa, cucumber, tomatoes, and lemon dressing.",
    category: "Easy",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600",
    calories: 220,
    carbo: 28,
    protein: 9,
    popular: true,
    ingredients: [
      "Quinoa",
      "Cherry tomatoes",
      "Cucumber",
      "Red onion",
      "Fresh mint",
      "Lemon juice",
      "Olive oil",
    ],
    preparation:
      "Cook quinoa in salted water for 15 minutes and let cool. Dice cucumber, halve cherry tomatoes, and finely slice red onion. Combine all vegetables with quinoa. Drizzle with lemon juice and olive oil. Toss, season to taste, and refrigerate 10 minutes before serving.",
  },
  {
    id: "6",
    name: "Rice & Veggie Bowl",
    description: "Nourishing brown rice bowl with roasted vegetables and tahini drizzle.",
    category: "Easy",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600",
    calories: 350,
    carbo: 55,
    protein: 8,
    popular: false,
    ingredients: [
      "Brown rice",
      "Sweet potato",
      "Broccoli",
      "Chickpeas",
      "Tahini",
      "Lemon juice and garlic",
      "Paprika",
    ],
    preparation:
      "Cook brown rice as directed. Roast sweet potato, broccoli, and chickpeas with olive oil and paprika at 200°C for 25 minutes. Make tahini sauce with tahini, lemon, garlic, and water. Assemble bowl and drizzle sauce on top.",
  },
  {
    id: "7",
    name: "Lentil Harira",
    description: "Hearty Tunisian lentil soup spiced with cumin, coriander, and fresh lemon.",
    category: "Quick",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600",
    calories: 190,
    carbo: 30,
    protein: 11,
    popular: true,
    ingredients: [
      "Red lentils",
      "Chopped tomatoes",
      "Onion and garlic",
      "Cumin and coriander",
      "Lemon juice",
      "Fresh cilantro",
      "Olive oil",
    ],
    preparation:
      "Sauté onion and garlic in olive oil for 3 minutes. Add lentils, tomatoes, and spices. Pour in 1L of water and bring to a boil. Simmer 20 minutes until lentils are soft. Finish with lemon juice and fresh cilantro.",
  },
  {
    id: "8",
    name: "GF Egg Muffins",
    description: "Quick protein-packed egg muffins with spinach, feta, and sun-dried tomatoes.",
    category: "Quick",
    image: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600",
    calories: 140,
    carbo: 4,
    protein: 12,
    popular: false,
    ingredients: [
      "Eggs (6)",
      "Baby spinach",
      "Feta cheese",
      "Sun-dried tomatoes",
      "Milk",
      "Salt and pepper",
      "Olive oil spray",
    ],
    preparation:
      "Preheat oven to 180°C. Whisk eggs with milk, salt, and pepper. Fold in spinach, feta, and tomatoes. Pour into a greased muffin tin. Bake for 18 minutes until set and lightly golden on top.",
  },
];

const FILTERS = ["Tunisian", "Easy", "Quick"];

export default function RecipesScreen({ navigation }) {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState("Tunisian");

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
        <Text style={styles.title}>Gluten-Free Recipes</Text>
        <Text style={styles.subtitle}>Healthy and nutritious food recipes</Text>

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
                {f}
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
          <Text style={styles.sectionBlack}>Popular </Text>
          <Text style={styles.sectionGreen}>recipes</Text>
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
