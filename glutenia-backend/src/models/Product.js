const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    enum: ["Bread", "Pasta", "Snacks", "Flour", "Sweets", "Other"],
    default: "Other",
  },
  imageUrl: {
    type: String,
    trim: true,
  },
  stock: {
    type: Number,
    default: 0,
    min: 0,
  },
  isGlutenFree: {
    type: Boolean,
    default: true,
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

module.exports = mongoose.model("Product", productSchema);
