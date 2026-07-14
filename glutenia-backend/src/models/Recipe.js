const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
  category: {
    type: String,
    enum: ["Quick", "Tunisian", "Easy"],
    default: "Quick",
  },
  imageUrl: {
    type: String,
    trim: true,
    default: "",
  },
  calories: {
    type: Number,
    default: 0,
    min: 0,
  },
  carbo: {
    type: Number,
    default: 0,
    min: 0,
  },
  protein: {
    type: Number,
    default: 0,
    min: 0,
  },
  popular: {
    type: Boolean,
    default: false,
  },
  ingredients: {
    type: [String],
    default: [],
  },
  preparation: {
    type: String,
    trim: true,
    default: "",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Recipe", recipeSchema);
