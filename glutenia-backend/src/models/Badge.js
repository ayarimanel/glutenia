const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    iconUrl: { type: String, default: null },
    category: {
      type: String,
      enum: ["journey", "scanner", "community", "safety", "discovery", "supporter", "secret"],
      required: true,
    },
    track: {
      type: String,
      enum: ["warrior", "supporter", "both"],
      default: "both",
    },
    isSecret: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Badge", badgeSchema);
