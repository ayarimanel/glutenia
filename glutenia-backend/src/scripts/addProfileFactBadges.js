// One-off, safe-to-run-in-production script: adds 3 new "profile fact"
// badges (gated by a declared onboarding answer, not an activity counter —
// see Badge.targetField/targetEquals and gamificationService.
// checkProfileFactBadges) without touching any existing Badge or UserBadge
// document. Never run src/seed/seed.js against production instead — its
// Badge handling is upsert-safe, but it also unconditionally wipes every
// User and Product document as part of a full local/dev reseed.
//
// Usage: node src/scripts/addProfileFactBadges.js
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Badge = require("../models/Badge");

const NEW_BADGES = [
  {
    slug: "seasoned_veteran",
    name: "Seasoned Veteran",
    description: "Living gluten-free for 3+ years — a true expert",
    category: "journey",
    track: "both",
    targetMetric: "profile_fact",
    targetValue: 1,
    targetField: "experience_level",
    targetEquals: ["3_plus_years"],
    xpReward: 20,
  },
  {
    slug: "confident_reader",
    name: "Confident Reader",
    description: "Told us you're highly confident spotting gluten-free products",
    category: "journey",
    track: "both",
    targetMetric: "profile_fact",
    targetValue: 1,
    targetField: "confidence_identifying_gf",
    targetEquals: ["high"],
    xpReward: 20,
  },
  {
    slug: "dedicated_caregiver",
    name: "Dedicated Caregiver",
    description: "On Glutenia to support a loved one through their journey",
    category: "journey",
    track: "supporter",
    targetMetric: "profile_fact",
    targetValue: 1,
    targetField: "primary_goal",
    targetEquals: ["support_child", "support_partner"],
    xpReward: 20,
  },
];

const run = async () => {
  await connectDB();
  try {
    for (const badge of NEW_BADGES) {
      const result = await Badge.findOneAndUpdate(
        { slug: badge.slug },
        badge,
        { upsert: true, new: true }
      );
      console.log(`Badge ready: ${result.slug} (${result._id})`);
    }
  } catch (error) {
    console.error(`Failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
