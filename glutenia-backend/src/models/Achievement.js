const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    targetMetric: { type: String, required: true },
    targetValue: { type: Number, required: true },
    xpReward: { type: Number, default: 0 },
    badgeRewardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Badge",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Achievement", achievementSchema);
