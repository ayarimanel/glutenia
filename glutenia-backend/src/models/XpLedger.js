const mongoose = require("mongoose");

const xpLedgerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true },
    sourceType: { type: String, required: true },
    sourceId: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("XpLedger", xpLedgerSchema);
