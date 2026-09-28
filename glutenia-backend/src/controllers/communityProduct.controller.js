const CommunityProduct = require("../models/CommunityProduct");
const ScanHistory = require("../models/ScanHistory");
const gamificationService = require("../services/gamificationService");

// Blunts bulk-submission fraud/spam without blocking genuine occasional
// contributors. Not a defense on its own — pairs with checksum validation
// and the mandatory-photo requirement enforced at the route level.
const MAX_SUBMISSIONS_PER_DAY = 20;

// None of the above (checksum/photo/rate-limit) catches a genuine, real
// barcode honestly or dishonestly mislabeled as gluten-free — that's a claim
// problem, not a spoofing problem. This is the corroboration mechanism for
// that specific gap: enough independent flags marks an entry disputed.
const DISPUTE_FLAG_THRESHOLD = 3;

// A product can only be added from a clear label analysis (safe/unsafe) by
// the same user, recently, and each analysis can back one product only.
const LABEL_SCAN_MAX_AGE_MS = 30 * 60 * 1000;
const usableLabelScanFilter = (labelScanId, userId) => ({
  _id: labelScanId,
  userId,
  scanType: "label",
  verdict: { $in: ["safe", "unsafe"] },
  createdAt: { $gte: new Date(Date.now() - LABEL_SCAN_MAX_AGE_MS) },
  usedForSubmission: { $ne: true },
});
const LABEL_SCAN_REQUIRED_MESSAGE =
  "A recent, clear label analysis of this product is required to add it";

exports.submitCommunityProduct = async (req, res, next) => {
  try {
    const { barcode, name, imageUrl, labelScanId, brand, category } = req.body;

    const labelScan = await ScanHistory.findOne(usableLabelScanFilter(labelScanId, req.user.id));
    if (!labelScan) {
      return res.status(400).json({ success: false, message: LABEL_SCAN_REQUIRED_MESSAGE });
    }

    const existing = await CommunityProduct.findOne({ barcode });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This barcode has already been reported by the community",
      });
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await CommunityProduct.countDocuments({
      submittedBy: req.user.id,
      createdAt: { $gte: since },
    });
    if (recentCount >= MAX_SUBMISSIONS_PER_DAY) {
      return res.status(429).json({
        success: false,
        message: "You've reached the daily limit for product submissions. Please try again tomorrow.",
      });
    }

    // Claim the scan atomically, so two simultaneous submissions can't both
    // use it.
    const claimed = await ScanHistory.findOneAndUpdate(
      usableLabelScanFilter(labelScanId, req.user.id),
      { $set: { usedForSubmission: true } }
    );
    if (!claimed) {
      return res.status(400).json({ success: false, message: LABEL_SCAN_REQUIRED_MESSAGE });
    }

    const entry = await CommunityProduct.create({
      barcode,
      name,
      imageUrl,
      isGlutenFree: claimed.verdict === "safe",
      brand: brand || null,
      category: category || null,
      submittedBy: req.user.id,
    });

    const { badgesUnlocked, xpGained, leveledUp, newLevel, newTotalXp, currentStreak } =
      (await gamificationService.recordAction(req.user.id, "product_contribution", {
        sourceId: entry._id,
      })) || {};

    return res.status(201).json({
      success: true,
      data: {
        entry,
        gamification: { badgesUnlocked, xpGained, leveledUp, newLevel, newTotalXp, currentStreak },
      },
    });
  } catch (error) {
    return next(error);
  }
};

// Lets any user dispute a community entry's gluten-free claim — the only
// mitigation for a real, unspoofed barcode being honestly or dishonestly
// mislabeled (checksum/photo/rate-limit can't catch that, since nothing
// about the submission itself is fake). Once enough independent users flag
// it, it's marked disputed so it stops reading as confidently verified.
exports.flagCommunityProduct = async (req, res, next) => {
  try {
    const entry = await CommunityProduct.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: "Community product not found" });
    }

    const alreadyFlagged = entry.flaggedBy.some((id) => id.toString() === req.user.id);
    if (alreadyFlagged) {
      return res.status(409).json({ success: false, message: "You already flagged this entry" });
    }

    entry.flaggedBy.push(req.user.id);
    entry.flagCount = entry.flaggedBy.length;
    if (entry.flagCount >= DISPUTE_FLAG_THRESHOLD) {
      entry.disputed = true;
    }
    await entry.save();

    return res.json({ success: true, data: entry });
  } catch (error) {
    return next(error);
  }
};
