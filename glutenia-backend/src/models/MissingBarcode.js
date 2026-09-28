const mongoose = require("mongoose");

// A barcode someone scanned that Glutenia had no answer for: not in the
// catalog and not reported by the community. Lets the admin see which
// products users look for, to add them to the catalog next.
const missingBarcodeSchema = new mongoose.Schema(
  {
    barcode: { type: String, required: true, trim: true, unique: true },
    scanCount: { type: Number, default: 0 },
    // Distinct users, so one person scanning repeatedly doesn't look like demand.
    scannedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    lastScannedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MissingBarcode", missingBarcodeSchema);
