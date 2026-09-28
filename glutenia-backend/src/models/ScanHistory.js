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
  // Set once a label scan has been used to submit a community product, so
  // one analysis can't vouch for several products.
  usedForSubmission: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ScanHistory", scanHistorySchema);
