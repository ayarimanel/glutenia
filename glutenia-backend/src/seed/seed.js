require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Product = require("../models/Product");
const User = require("../models/User");
const Badge = require("../models/Badge");
const Achievement = require("../models/Achievement");

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
    await Badge.deleteMany({});
    await Achievement.deleteMany({});

    await Badge.insertMany([
      // Journey
      { slug: "first_week", name: "First Week", description: "Active for 7 days", category: "journey", track: "both" },
      { slug: "one_month", name: "One Month", description: "Active for 30 days", category: "journey", track: "both" },
      { slug: "three_months", name: "Three Months", description: "Active for 90 days", category: "journey", track: "both" },
      { slug: "six_months", name: "Six Months", description: "Active for 180 days", category: "journey", track: "both" },
      { slug: "one_year", name: "One Year", description: "Active for 365 days", category: "journey", track: "both" },
      { slug: "two_years", name: "Two Years", description: "Active for 730 days", category: "journey", track: "both" },
      { slug: "three_years", name: "Three Years", description: "Active for 1095 days", category: "journey", track: "both" },
      // Scanner
      { slug: "first_scan", name: "First Scan", description: "Scanned your first product", category: "scanner", track: "both" },
      { slug: "ten_scans", name: "10 Scans", description: "Scanned 10 products", category: "scanner", track: "both" },
      { slug: "fifty_scans", name: "50 Scans", description: "Scanned 50 products", category: "scanner", track: "both" },
      { slug: "hundred_scans", name: "100 Scans", description: "Scanned 100 products", category: "scanner", track: "both" },
      { slug: "product_pioneer", name: "Product Pioneer", description: "First to scan a new product", category: "scanner", track: "both" },
      // Community
      { slug: "first_post", name: "First Post", description: "Made your first community post", category: "community", track: "both" },
      { slug: "helpful_voice", name: "Helpful Voice", description: "Received 10 helpful votes", category: "community", track: "both" },
      { slug: "community_pillar", name: "Community Pillar", description: "Received 50 helpful votes", category: "community", track: "both" },
      { slug: "event_attendee", name: "Event Attendee", description: "Attended your first event", category: "community", track: "both" },
      { slug: "event_regular", name: "Event Regular", description: "Attended 5 events", category: "community", track: "both" },
      // Safety
      { slug: "reaction_reporter", name: "Reaction Reporter", description: "Logged your first reaction", category: "safety", track: "warrior" },
      { slug: "safe_streak_30", name: "Safe Streak", description: "30 days of safe eating logged", category: "safety", track: "warrior" },
      { slug: "label_master", name: "Label Master", description: "Checked ingredients 50 times", category: "safety", track: "both" },
      // Discovery
      { slug: "first_checkin", name: "First Check-in", description: "Checked into a GF restaurant", category: "discovery", track: "both" },
      { slug: "explorer_5", name: "Explorer", description: "Checked into 5 GF places", category: "discovery", track: "both" },
      { slug: "city_scout_3", name: "City Scout", description: "Checked into places in 3 different cities", category: "discovery", track: "both" },
      // Secret
      { slug: "midnight_scanner", name: "Midnight Scanner", description: "Scanned a product between 11pm and 1am", category: "secret", isSecret: true, track: "both" },
      { slug: "weekend_warrior", name: "Weekend Warrior", description: "Maintained a streak every Saturday for a month", category: "secret", isSecret: true, track: "both" },
      { slug: "early_bird", name: "Early Bird", description: "Scanned a product before 8am", category: "secret", isSecret: true, track: "both" },
    ]);

    await Achievement.insertMany([
      { slug: "scan_10", name: "10 Scans", description: "Scan 10 products", targetMetric: "scanCount", targetValue: 10, xpReward: 50 },
      { slug: "scan_50", name: "50 Scans", description: "Scan 50 products", targetMetric: "scanCount", targetValue: 50, xpReward: 150 },
      { slug: "scan_100", name: "100 Scans", description: "Scan 100 products", targetMetric: "scanCount", targetValue: 100, xpReward: 300 },
      { slug: "ingredient_10", name: "Label Reader", description: "Check ingredients 10 times", targetMetric: "ingredientCheckCount", targetValue: 10, xpReward: 40 },
      { slug: "ingredient_50", name: "Label Master", description: "Check ingredients 50 times", targetMetric: "ingredientCheckCount", targetValue: 50, xpReward: 120 },
      { slug: "post_5", name: "Voice in the Community", description: "Make 5 community posts", targetMetric: "communityPostCount", targetValue: 5, xpReward: 60 },
      { slug: "post_20", name: "Community Regular", description: "Make 20 community posts", targetMetric: "communityPostCount", targetValue: 20, xpReward: 150 },
      { slug: "votes_10", name: "Helpful Voice", description: "Receive 10 helpful votes", targetMetric: "helpfulVotesReceived", targetValue: 10, xpReward: 80 },
      { slug: "votes_50", name: "Community Pillar", description: "Receive 50 helpful votes", targetMetric: "helpfulVotesReceived", targetValue: 50, xpReward: 200 },
      { slug: "streak_7", name: "Week Warrior", description: "Maintain a 7-day streak", targetMetric: "currentStreak", targetValue: 7, xpReward: 30 },
      { slug: "streak_30", name: "Monthly Dedication", description: "Maintain a 30-day streak", targetMetric: "currentStreak", targetValue: 30, xpReward: 100 },
      { slug: "streak_100", name: "Century Streak", description: "Maintain a 100-day streak", targetMetric: "currentStreak", targetValue: 100, xpReward: 300 },
    ]);

    console.log("Seed completed successfully");
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seed();
