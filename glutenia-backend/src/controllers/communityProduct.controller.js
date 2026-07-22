const CommunityProduct = require("../models/CommunityProduct");
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

exports.getCommunityProductByBarcode = async (req, res, next) => {
  try {
    const entry = await CommunityProduct.findOne({ barcode: req.params.code });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Community product not found",
      });
    }

    return res.json({ success: true, data: entry });
  } catch (error) {
    return next(error);
  }
};

exports.submitCommunityProduct = async (req, res, next) => {
  try {
    const { barcode, name, imageUrl, isGlutenFree, brand, category } = req.body;

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

    const entry = await CommunityProduct.create({
      barcode,
      name,
      imageUrl,
      isGlutenFree,
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
