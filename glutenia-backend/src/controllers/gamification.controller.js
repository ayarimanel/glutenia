const Achievement = require("../models/Achievement");
const Badge = require("../models/Badge");
const UserAchievement = require("../models/UserAchievement");
const UserBadge = require("../models/UserBadge");
const UserGamification = require("../models/UserGamification");
const gamificationService = require("../services/gamificationService");

exports.getMyGamification = async (req, res, next) => {
  try {
    const gamification = await UserGamification.findOne({ userId: req.user.id });

    if (!gamification) {
      return res.status(404).json({
        success: false,
        message: "Gamification record not found. Complete onboarding first.",
      });
    }

    return res.json({ success: true, data: gamification });
  } catch (error) {
    return next(error);
  }
};

exports.getMyBadges = async (req, res, next) => {
  try {
    const userBadges = await UserBadge.find({ userId: req.user.id })
      .populate("badgeId")
      .sort({ isPinned: -1, earnedAt: -1 });

    return res.json({ success: true, data: userBadges });
  } catch (error) {
    return next(error);
  }
};

exports.pinBadge = async (req, res, next) => {
  try {
    const userBadge = await UserBadge.findOne({
      userId: req.user.id,
      badgeId: req.params.badgeId,
    });

    if (!userBadge) {
      return res.status(404).json({
        success: false,
        message: "Badge not found or not yet earned",
      });
    }

    userBadge.isPinned = !userBadge.isPinned;
    await userBadge.save();

    return res.json({ success: true, data: userBadge });
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

exports.getMyAchievements = async (req, res, next) => {
  try {
    const userAchievements = await UserAchievement.find({ userId: req.user.id })
      .populate("achievementId")
      .sort({ completedAt: -1, currentProgress: -1 });

    return res.json({ success: true, data: userAchievements });
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
    const badges = await Badge.find({ isSecret: false }).sort({ category: 1, name: 1 });
    return res.json({ success: true, data: badges });
  } catch (error) {
    return next(error);
  }
};

exports.getAchievementCatalog = async (req, res, next) => {
  try {
    const achievements = await Achievement.find().sort({ targetMetric: 1, targetValue: 1 });
    return res.json({ success: true, data: achievements });
  } catch (error) {
    return next(error);
  }
};
