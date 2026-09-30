const mongoose = require("mongoose");

const communityProductSchema = new mongoose.Schema(
  {
    barcode: { type: String, required: true, trim: true, unique: true },
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String, trim: true, required: true },
    isGlutenFree: { type: Boolean, required: true },
    brand: { type: String, trim: true, default: null },
    category: {
      type: String,
      enum: ["Bread", "Pasta", "Snacks", "Flour", "Sweets", "Other", null],
      default: null,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    flagCount: { type: Number, default: 0 },
    flaggedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    disputed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CommunityProduct", communityProductSchema);
