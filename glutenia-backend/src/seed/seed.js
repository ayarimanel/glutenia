require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Product = require("../models/Product");
const User = require("../models/User");
const Badge = require("../models/Badge");

const products = [
  {
    name: "Pain sans gluten",
    description: "Pain moelleux pour le petit dejeuner.",
    price: 4.5,
    category: "Bread",
    stock: 25,
    barcode: "3017620422003",
  },
  {
    name: "Pâtes de riz",
    description: "Pates de riz legeres pour plats rapides.",
    price: 3.2,
    category: "Pasta",
    stock: 30,
    barcode: "8076809513456",
  },
  {
    name: "Biscuits au quinoa",
    description: "Biscuits croquants au quinoa.",
    price: 5.8,
    category: "Snacks",
    stock: 18,
    barcode: "3175681851752",
  },
  {
    name: "Farine de maïs",
    description: "Farine de mais sans gluten.",
    price: 2.9,
    category: "Flour",
    stock: 40,
    barcode: "3564700314551",
  },
  {
    name: "Gâteau au chocolat GF",
    description: "Gateau chocolat sans gluten.",
    price: 7.5,
    category: "Sweets",
    stock: 12,
    barcode: "3229820129488",
  },
  {
    name: "Crackers de sarrasin",
    description: "Crackers sales au sarrasin.",
    price: 4.1,
    category: "Snacks",
    stock: 22,
    barcode: "3270190207924",
  },
];

const seed = async () => {
  try {
    await connectDB();

    await User.deleteMany({});
    await Product.deleteMany({});

    const hashedPassword = await bcrypt.hash("admin123", 12);
    const admin = await User.create({
      name: "Admin",
      email: "admin@glutenia.tn",
      password: hashedPassword,
      role: "admin",
    });

    await Product.insertMany(
      products.map((product) => ({
        ...product,
        isGlutenFree: true,
        createdBy: admin._id,
      }))
    );

    // --- Gamification seed ---
    // Upsert-per-badge, not delete-all-then-recreate: earned UserBadge
    // records reference a Badge by its _id, and wiping/recreating the
    // collection would give every badge a new _id, orphaning every user's
    // already-earned badges. Upserting by slug updates existing badges in
    // place (same _id preserved) and only creates genuinely new ones.
    const badgeCatalog = [
      // Scanner
      { slug: "first_scan", name: "First Scan", description: "Scanned your first product", category: "scanner", targetMetric: "scanCount", targetValue: 1, xpReward: 20 },
      { slug: "ten_scans", name: "10 Scans", description: "Scanned 10 products", category: "scanner", targetMetric: "scanCount", targetValue: 10, xpReward: 40 },
      { slug: "fifty_scans", name: "50 Scans", description: "Scanned 50 products", category: "scanner", targetMetric: "scanCount", targetValue: 50, xpReward: 100 },
      { slug: "hundred_scans", name: "100 Scans", description: "Scanned 100 products", category: "scanner", targetMetric: "scanCount", targetValue: 100, xpReward: 200 },
      // Safety
      { slug: "label_master", name: "Label Master", description: "Checked ingredients 50 times", category: "safety", targetMetric: "ingredientCheckCount", targetValue: 50, xpReward: 150 },
      // Community
      { slug: "event_attendee", name: "Event Attendee", description: "Attended your first event", category: "community", targetMetric: "eventAttendanceCount", targetValue: 1, xpReward: 30 },
      { slug: "event_regular", name: "Event Regular", description: "Attended 5 events", category: "community", targetMetric: "eventAttendanceCount", targetValue: 5, xpReward: 80 },
      // Shopper
      { slug: "first_order", name: "First Order", description: "Placed your first order", category: "shopper", targetMetric: "orderCount", targetValue: 1, xpReward: 30 },
      { slug: "five_orders", name: "5 Orders", description: "Placed 5 orders", category: "shopper", targetMetric: "orderCount", targetValue: 5, xpReward: 100 },
      { slug: "twenty_orders", name: "20 Orders", description: "Placed 20 orders", category: "shopper", targetMetric: "orderCount", targetValue: 20, xpReward: 250 },
      // Streak
      { slug: "streak_7", name: "Week Streak", description: "Maintained a 7-day streak", category: "streak", targetMetric: "currentStreak", targetValue: 7, xpReward: 50 },
      { slug: "streak_30", name: "Monthly Streak", description: "Maintained a 30-day streak", category: "streak", targetMetric: "currentStreak", targetValue: 30, xpReward: 150 },
      { slug: "streak_100", name: "Century Streak", description: "Maintained a 100-day streak", category: "streak", targetMetric: "currentStreak", targetValue: 100, xpReward: 400 },
      // Journey (account age — checked lazily, not via recordAction)
      { slug: "first_month", name: "First Month", description: "One month on Glutenia", category: "journey", targetMetric: "accountAgeDays", targetValue: 30, xpReward: 20 },
      { slug: "one_year", name: "One Year", description: "One year on Glutenia", category: "journey", targetMetric: "accountAgeDays", targetValue: 365, xpReward: 100 },
      // Supporter-specific — the only role-restricted badge in the catalog;
      // everything else above applies equally to warriors and supporters.
      { slug: "community_contributor", name: "Community Contributor", description: "Reported a missing product to help the whole community stay safe", category: "community", track: "supporter", targetMetric: "productContributionCount", targetValue: 1, xpReward: 30 },
      // Profile-fact badges — gated by a declared onboarding answer, not an
      // activity counter (see Badge.targetField/targetEquals and
      // gamificationService.checkProfileFactBadges). targetMetric/targetValue
      // are unused placeholders here, kept only so every existing read path
      // that assumes a positive numeric targetValue keeps working untouched.
      { slug: "seasoned_veteran", name: "Seasoned Veteran", description: "Living gluten-free for 3+ years — a true expert", category: "journey", track: "both", targetMetric: "profile_fact", targetValue: 1, targetField: "experience_level", targetEquals: ["3_plus_years"], xpReward: 20 },
      { slug: "confident_reader", name: "Confident Reader", description: "Told us you're highly confident spotting gluten-free products", category: "journey", track: "both", targetMetric: "profile_fact", targetValue: 1, targetField: "confidence_identifying_gf", targetEquals: ["high"], xpReward: 20 },
      { slug: "dedicated_caregiver", name: "Dedicated Caregiver", description: "On Glutenia to support a loved one through their journey", category: "journey", track: "supporter", targetMetric: "profile_fact", targetValue: 1, targetField: "primary_goal", targetEquals: ["support_child", "support_partner"], xpReward: 20 },
    ];

    for (const badge of badgeCatalog) {
      await Badge.findOneAndUpdate({ slug: badge.slug }, badge, {
        upsert: true,
        setDefaultsOnInsert: true,
      });
    }

    console.log("Seed completed successfully");
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seed();
