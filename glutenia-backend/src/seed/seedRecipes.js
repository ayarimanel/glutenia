const Recipe = require("../models/Recipe");

const DEFAULT_RECIPES = [
  {
    name: "Gluten-Free Pizza",
    description: "Homemade GF crust topped with fresh mozzarella and basil.",
    category: "Quick",
    imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600",
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
    name: "Tunisian Brik",
    description: "Crispy gluten-free pastry filled with egg, tuna, and parsley.",
    category: "Tunisian",
    imageUrl: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=600",
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
    name: "Mechouia Salad",
    description: "Grilled Tunisian pepper and tomato salad with tuna and olives.",
    category: "Tunisian",
    imageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600",
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
    name: "GF Couscous",
    description: "Traditional millet couscous with slow-cooked vegetables and chickpeas.",
    category: "Tunisian",
    imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600",
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
    name: "Quinoa Salad",
    description: "Refreshing salad with quinoa, cucumber, tomatoes, and lemon dressing.",
    category: "Easy",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600",
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
    name: "Rice & Veggie Bowl",
    description: "Nourishing brown rice bowl with roasted vegetables and tahini drizzle.",
    category: "Easy",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600",
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
    name: "Lentil Harira",
    description: "Hearty Tunisian lentil soup spiced with cumin, coriander, and fresh lemon.",
    category: "Quick",
    imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600",
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
    name: "GF Egg Muffins",
    description: "Quick protein-packed egg muffins with spinach, feta, and sun-dried tomatoes.",
    category: "Quick",
    imageUrl: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600",
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

// Runs on every boot but only inserts if the collection is empty, so it
// never overwrites recipes an admin has since edited, added, or deleted.
const seedRecipesIfEmpty = async () => {
  const count = await Recipe.countDocuments();
  if (count > 0) {
    return;
  }

  await Recipe.insertMany(DEFAULT_RECIPES);
  console.log(`Seeded ${DEFAULT_RECIPES.length} default recipes`);
};

module.exports = seedRecipesIfEmpty;
