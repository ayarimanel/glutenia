const Badge = require("../models/Badge");
const UserBadge = require("../models/UserBadge");
const gamificationService = require("../services/gamificationService");

exports.getHomeGamification = async (req, res, next) => {
  try {
    const data = await gamificationService.getHomeGamificationData(req.user.id);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Gamification record not found. Complete onboarding first.",
      });
    }
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

exports.updateBadgePin = async (req, res, next) => {
  try {
    const { isPinned } = req.body;
    const { badgeId } = req.params;

    if (isPinned) {
      const pinnedCount = await UserBadge.countDocuments({
        userId: req.user.id,
        isPinned: true,
        badgeId: { $ne: badgeId },
      });
      if (pinnedCount >= 3) {
        return res.status(400).json({
          success: false,
          message: "Unpin one badge first",
        });
      }
    }

    const userBadge = await UserBadge.findOneAndUpdate(
      { userId: req.user.id, badgeId },
      { isPinned },
      { new: true }
    );

    if (!userBadge) {
      return res.status(404).json({
        success: false,
        message: "Badge not found or not yet earned",
      });
    }

    return res.json({ success: true, data: { isPinned: userBadge.isPinned } });
  } catch (error) {
    return next(error);
  }
};

exports.getProfileGamification = async (req, res, next) => {
  try {
    const result = await gamificationService.getProfileGamificationData(req.user.id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Gamification profile not found. Complete onboarding first.",
      });
    }
    return res.json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

exports.getBadgeCatalog = async (req, res, next) => {
  try {
    const badges = await Badge.find().sort({ category: 1, targetValue: 1 });
    return res.json({ success: true, data: badges });
  } catch (error) {
    return next(error);
  }
};
