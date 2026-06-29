const mongoose = require("mongoose");

const CATEGORIES = ["Meetups", "Classes", "Markets", "Workshops"];

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  date: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  category: { type: String, enum: CATEGORIES, required: true },
  price: { type: Number, default: 0, min: 0 },
  emoji: { type: String, default: "🎉" },
  color: { type: String, default: "#E8F5E9" },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Event", eventSchema);
