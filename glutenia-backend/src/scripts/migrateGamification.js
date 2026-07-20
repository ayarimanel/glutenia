// One-time migration for the gamification rewrite. Unlike src/seed/seed.js,
// this script does NOT touch Users, Products, or Orders — it only replaces
// the badge catalog and cleans up data that referenced the deleted
// Achievement/UserAchievement system or the retired badge slugs.
//
// NOT run automatically — review and run manually with:
//   node src/scripts/migrateGamification.js
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Badge = require("../models/Badge");
const UserBadge = require("../models/UserBadge");
const UserGamification = require("../models/UserGamification");

const NEW_BADGES = [
  { slug: "first_scan", name: "First Scan", description: "Scanned your first product", category: "scanner", targetMetric: "scanCount", targetValue: 1, xpReward: 20 },
  { slug: "ten_scans", name: "10 Scans", description: "Scanned 10 products", category: "scanner", targetMetric: "scanCount", targetValue: 10, xpReward: 40 },
  { slug: "fifty_scans", name: "50 Scans", description: "Scanned 50 products", category: "scanner", targetMetric: "scanCount", targetValue: 50, xpReward: 100 },
  { slug: "hundred_scans", name: "100 Scans", description: "Scanned 100 products", category: "scanner", targetMetric: "scanCount", targetValue: 100, xpReward: 200 },
  { slug: "label_master", name: "Label Master", description: "Checked ingredients 50 times", category: "safety", targetMetric: "ingredientCheckCount", targetValue: 50, xpReward: 150 },
  { slug: "event_attendee", name: "Event Attendee", description: "Attended your first event", category: "community", targetMetric: "eventAttendanceCount", targetValue: 1, xpReward: 30 },
  { slug: "event_regular", name: "Event Regular", description: "Attended 5 events", category: "community", targetMetric: "eventAttendanceCount", targetValue: 5, xpReward: 80 },
  { slug: "first_order", name: "First Order", description: "Placed your first order", category: "shopper", targetMetric: "orderCount", targetValue: 1, xpReward: 30 },
  { slug: "five_orders", name: "5 Orders", description: "Placed 5 orders", category: "shopper", targetMetric: "orderCount", targetValue: 5, xpReward: 100 },
  { slug: "twenty_orders", name: "20 Orders", description: "Placed 20 orders", category: "shopper", targetMetric: "orderCount", targetValue: 20, xpReward: 250 },
  { slug: "streak_7", name: "Week Streak", description: "Maintained a 7-day streak", category: "streak", targetMetric: "currentStreak", targetValue: 7, xpReward: 50 },
  { slug: "streak_30", name: "Monthly Streak", description: "Maintained a 30-day streak", category: "streak", targetMetric: "currentStreak", targetValue: 30, xpReward: 150 },
  { slug: "streak_100", name: "Century Streak", description: "Maintained a 100-day streak", category: "streak", targetMetric: "currentStreak", targetValue: 100, xpReward: 400 },
  { slug: "first_month", name: "First Month", description: "One month on Glutenia", category: "journey", targetMetric: "accountAgeDays", targetValue: 30, xpReward: 20 },
  { slug: "one_year", name: "One Year", description: "One year on Glutenia", category: "journey", targetMetric: "accountAgeDays", targetValue: 365, xpReward: 100 },
];

const migrate = async () => {
  try {
    await connectDB();
    const db = mongoose.connection.db;

    // 1. Replace the badge catalog.
    await Badge.deleteMany({});
    const inserted = await Badge.insertMany(NEW_BADGES);
    console.log(`Inserted ${inserted.length} badges.`);

    // 2. Prune UserBadge docs earned under the old catalog — their badgeId
    // no longer resolves to anything, so they'd render as broken entries.
    const validBadgeIds = inserted.map((b) => b._id);
    const pruneResult = await UserBadge.deleteMany({ badgeId: { $nin: validBadgeIds } });
    console.log(`Removed ${pruneResult.deletedCount} orphaned UserBadge records.`);

    // 3. Drop the now-unused Achievement/UserAchievement collections, if present.
    const collections = await db.listCollections().toArray();
    const names = new Set(collections.map((c) => c.name));
    for (const name of ["achievements", "userachievements"]) {
      if (names.has(name)) {
        await db.collection(name).drop();
        console.log(`Dropped collection: ${name}`);
      }
    }

    // 4. Strip the retired counters and backfill orderCount on existing
    // UserGamification documents.
    const unsetResult = await UserGamification.updateMany(
      {},
      {
        $unset: { communityPostCount: "", helpfulVotesReceived: "", restaurantCheckinCount: "" },
        $set: { orderCount: 0 },
      }
    );
    console.log(`Updated ${unsetResult.modifiedCount} UserGamification records.`);

    console.log("Migration completed successfully.");
  } catch (error) {
    console.error(`Migration failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

migrate();
