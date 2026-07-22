const mongoose = require("mongoose");

// Lightweight, crowdsourced barcode reports — separate from Product on
// purpose. This isn't a sellable shop listing (no price/stock/category),
// just a community safety flag: "this barcode is/isn't gluten-free."
const communityProductSchema = new mongoose.Schema(
  {
    barcode: { type: String, required: true, trim: true, unique: true },
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String, trim: true, required: true },
    isGlutenFree: { type: Boolean, required: true },
    // Optional context — the barcode/name/photo/gluten-free flag are the
    // only things that matter functionally, these just help other users
    // recognize the product at a glance.
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
    // A submission being real/unspoofed (checksum, photo, rate limit) says
    // nothing about whether the gluten-free claim itself is true — someone
    // can honestly or dishonestly mislabel a real product. This is the only
    // mitigation for THAT specific risk: once enough independent users flag
    // an entry, it's marked disputed so it stops reading as confidently
    // verified until a human (admin) resolves it.
    flagCount: { type: Number, default: 0 },
    flaggedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    disputed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CommunityProduct", communityProductSchema);
