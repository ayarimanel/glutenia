const mongoose = require("mongoose");

const missingBarcodeSchema = new mongoose.Schema(
  {
    barcode: { type: String, required: true, trim: true, unique: true },
    scanCount: { type: Number, default: 0 },
    scannedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    lastScannedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MissingBarcode", missingBarcodeSchema);
