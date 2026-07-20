const mongoose = require("mongoose");

const userGamificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    totalXp: { type: Number, default: 0 },
    currentLevel: { type: Number, default: 1 },
    currentTitle: { type: String, default: "Newcomer" },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    streakShields: { type: Number, default: 0, max: 2 },
    lastActivityDate: { type: Date, default: null },
    scanCount: { type: Number, default: 0 },
    ingredientCheckCount: { type: Number, default: 0 },
    eventAttendanceCount: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserGamification", userGamificationSchema);
