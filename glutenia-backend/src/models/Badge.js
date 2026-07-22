const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    iconUrl: { type: String, default: null },
    category: {
      type: String,
      enum: ["scanner", "safety", "community", "shopper", "streak", "journey"],
      required: true,
    },
    track: {
      type: String,
      enum: ["warrior", "supporter", "both"],
      default: "both",
    },
    targetMetric: { type: String, required: true },
    targetValue: { type: Number, required: true },
    // Only set on "profile fact" badges (e.g. self-reported experience
    // level or confidence) rather than activity-counter badges — an
    // equality check against a User field, evaluated by
    // gamificationService.checkProfileFactBadges instead of the normal
    // targetMetric/targetValue threshold check. Left unset (null/undefined)
    // on every counter-based badge.
    targetField: { type: String, default: null },
    targetEquals: { type: [String], default: undefined },
    xpReward: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Badge", badgeSchema);
