// One-off, safe-to-run-in-production script: adds a set of demo products
// with real photos and descriptions so the Shop screen doesn't look empty.
// Upserts by name, so it never touches or duplicates anything an admin has
// since edited, added, or deleted — safe to re-run. Attributed to the first
// admin account found (or left unowned if none exists yet).
//
// Usage: node src/scripts/addDemoProducts.js
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Product = require("../models/Product");
const User = require("../models/User");

const img = (id) => `https://images.unsplash.com/photo-${id}?w=800&q=75&auto=format&fit=crop`;

const DEMO_PRODUCTS = [
  {
    name: "Multigrain Gluten-Free Bread",
    description:
      "A soft, hearty loaf made with a blend of rice, sorghum, and buckwheat flour. Sliced and ready for sandwiches or toast.",
    price: 9.5,
    category: "Bread",
    imageUrl: img("1549931319-a545dcf3bc73"),
    stock: 22,
  },
  {
    name: "Assorted Gluten-Free Bread Basket",
    description:
      "A mixed basket of dinner rolls and small loaves, baked fresh daily in a dedicated gluten-free kitchen.",
    price: 14,
    category: "Bread",
    imageUrl: img("1608198093002-ad4e005484ec"),
    stock: 10,
  },
  {
    name: "Penne alla Bolognese (Gluten-Free)",
    description:
      "Corn and rice penne pasta paired with a rich, slow-cooked tomato and beef ragù. Ready in 10 minutes.",
    price: 7.2,
    category: "Pasta",
    imageUrl: img("1621996346565-e3dbc646d9a9"),
    stock: 35,
  },
  {
    name: "Creamy Gluten-Free Fettuccine",
    description:
      "Wide corn-flour fettuccine tossed with a light cream sauce, sun-dried tomatoes, and fresh herbs.",
    price: 8.5,
    category: "Pasta",
    imageUrl: img("1551183053-bf91a1d81141"),
    stock: 28,
  },
  {
    name: "Gluten-Free Spaghetti alla Carbonara",
    description:
      "Classic carbonara made with certified gluten-free spaghetti, guanciale, egg, and pecorino.",
    price: 8.9,
    category: "Pasta",
    imageUrl: img("1612874742237-6526221588e3"),
    stock: 18,
  },
  {
    name: "Crispy Rice Crackers",
    description:
      "Light, crunchy rice crackers lightly salted — a simple, naturally gluten-free snack for any time of day.",
    price: 4.2,
    category: "Snacks",
    imageUrl: img("1599490659213-e2b9527bd087"),
    stock: 55,
  },
  {
    name: "Gluten-Free Potato Chips",
    description:
      "Kettle-cooked potato chips fried in a dedicated gluten-free line, with no cross-contact risk.",
    price: 3.5,
    category: "Snacks",
    imageUrl: img("1621447504864-d8686e12698c"),
    stock: 70,
  },
  {
    name: "Fine Rice Flour (1kg)",
    description:
      "Finely milled white rice flour, ideal as a base for gluten-free baking, thickening sauces, or coating.",
    price: 6,
    category: "Flour",
    imageUrl: img("1595475207225-428b62bda831"),
    stock: 40,
  },
  {
    name: "Strawberry Cream Crêpes (GF)",
    description:
      "Thin gluten-free crêpes filled with whipped cream and fresh strawberries — a light, ready-to-eat dessert.",
    price: 6.5,
    category: "Sweets",
    imageUrl: img("1587314168485-3236d6710814"),
    stock: 15,
  },
  {
    name: "Mint Chocolate Cupcake",
    description:
      "A rich chocolate cupcake topped with mint buttercream, baked with a certified gluten-free flour blend.",
    price: 3.9,
    category: "Sweets",
    imageUrl: img("1587668178277-295251f900ce"),
    stock: 30,
  },
  {
    name: "Handmade Gluten-Free Chocolates (Box of 12)",
    description:
      "A box of 12 assorted handmade chocolates, made in a dedicated gluten-free workshop — a safe treat or gift.",
    price: 15,
    category: "Sweets",
    imageUrl: img("1599599810769-bcde5a160d32"),
    stock: 12,
  },
  {
    name: "Toasted Oat & Nut Granola",
    description:
      "Certified gluten-free oats toasted with almonds, hazelnuts, and a touch of honey. Great with milk or yogurt.",
    price: 11,
    category: "Other",
    imageUrl: img("1614961233913-a5113a4a34ed"),
    stock: 20,
  },
];

const run = async () => {
  await connectDB();
  try {
    const admin = await User.findOne({ role: "admin" }).select("_id");
    for (const product of DEMO_PRODUCTS) {
      const result = await Product.findOneAndUpdate(
        { name: product.name },
        { ...product, isGlutenFree: true, createdBy: admin?._id },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`Product ready: ${result.name} (${result._id})`);
    }
  } catch (error) {
    console.error(`Failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
