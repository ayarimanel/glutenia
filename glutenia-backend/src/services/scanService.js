const ScanHistory = require("../models/ScanHistory");
const gamificationService = require("./gamificationService");

const ACTION_BY_SCAN_TYPE = {
  barcode: "barcode_scan",
  label: "label_scan",
};

// Single writer for both the ScanHistory row and the gamification counter,
// so the two can never drift apart the way they could when each controller
// wrote to ScanHistory independently.
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
    // A scan/label lookup has already succeeded by the time this runs —
    // never let a history/gamification write fail the underlying request.
    console.error("[scanService] recordScanEvent error:", err);
    return { historyEntry: null, gamification: null };
  }
}

module.exports = { recordScanEvent };
