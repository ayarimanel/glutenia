const mongoose = require("mongoose");

const scanHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  scanType: {
    type: String,
    enum: ["barcode", "label"],
    required: true,
  },
  verdict: {
    type: String,
    default: null,
  },
  summary: {
    type: String,
    trim: true,
    default: "",
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ScanHistory", scanHistorySchema);
