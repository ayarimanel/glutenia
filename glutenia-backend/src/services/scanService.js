const ScanHistory = require("../models/ScanHistory");
const gamificationService = require("./gamificationService");

const ACTION_BY_SCAN_TYPE = {
  barcode: "barcode_scan",
  label: "label_scan",
};

async function recordScanEvent(userId, scanType, metadata = {}) {
  const { verdict = null, summary = "", product = null } = metadata;

  try {
    const historyEntry = await ScanHistory.create({
      userId,
      scanType,
      verdict,
      summary,
      product,
    });

    const gamification = await gamificationService.recordAction(userId, ACTION_BY_SCAN_TYPE[scanType], {
      sourceId: historyEntry._id.toString(),
    });

    return { historyEntry, gamification };
  } catch (err) {
    console.error("[scanService] recordScanEvent error:", err);
    return { historyEntry: null, gamification: null };
  }
}

module.exports = { recordScanEvent };
