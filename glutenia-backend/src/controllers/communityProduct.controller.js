const CommunityProduct = require("../models/CommunityProduct");
const ScanHistory = require("../models/ScanHistory");
const gamificationService = require("../services/gamificationService");

const MAX_SUBMISSIONS_PER_DAY = 20;

const DISPUTE_FLAG_THRESHOLD = 3;

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

exports.getCommunityProducts = async (req, res, next) => {
  try {
    const entries = await CommunityProduct.find()
      .populate("submittedBy", "name email")
      .populate("flaggedBy", "name email")
      .sort({ disputed: -1, flagCount: -1, createdAt: -1 });

    return res.json({ success: true, data: entries });
  } catch (error) {
    return next(error);
  }
};

exports.reviewCommunityProduct = async (req, res, next) => {
  try {
    const entry = await CommunityProduct.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: "Community product not found" });
    }

    if (typeof req.body.isGlutenFree === "boolean") {
      entry.isGlutenFree = req.body.isGlutenFree;
    }
    entry.flaggedBy = [];
    entry.flagCount = 0;
    entry.disputed = false;
    await entry.save();
    await entry.populate("submittedBy", "name email");

    return res.json({ success: true, data: entry });
  } catch (error) {
    return next(error);
  }
};

exports.deleteCommunityProduct = async (req, res, next) => {
  try {
    const entry = await CommunityProduct.findByIdAndDelete(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: "Community product not found" });
    }

    return res.json({ success: true, data: { _id: entry._id } });
  } catch (error) {
    return next(error);
  }
};
