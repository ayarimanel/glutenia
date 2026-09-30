require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Badge = require("../models/Badge");

const run = async () => {
  await connectDB();
  try {
    const result = await Badge.findOneAndUpdate(
      { slug: "community_contributor" },
      {
        slug: "community_contributor",
        name: "Community Contributor",
        description: "Reported a missing product to help the whole community stay safe",
        category: "community",
        track: "supporter",
        targetMetric: "productContributionCount",
        targetValue: 1,
        xpReward: 30,
      },
      { upsert: true, new: true }
    );
    console.log(`Badge ready: ${result.slug} (${result._id})`);
  } catch (error) {
    console.error(`Failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
