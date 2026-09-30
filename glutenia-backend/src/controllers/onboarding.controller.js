const User = require("../models/User");
const gamificationService = require("../services/gamificationService");

exports.completeProfileOnboarding = async (req, res, next) => {
  try {
    const {
      roleType,
      glutenFreeSince,
      experienceLevel,
      primaryGoal,
      eatingOutFrequency,
      confidenceIdentifyingGf,
    } = req.body;

    const existingUser = await User.findById(req.user.id);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const isFirstCompletion = !existingUser.role_type;

    const update = { role_type: roleType, gluten_free_since: glutenFreeSince || null };
    if (experienceLevel) update.experience_level = experienceLevel;
    if (primaryGoal) update.primary_goal = primaryGoal;
    if (eatingOutFrequency) update.eating_out_frequency = eatingOutFrequency;
    if (confidenceIdentifyingGf) update.confidence_identifying_gf = confidenceIdentifyingGf;

    const user = await User.findByIdAndUpdate(req.user.id, update, {
      new: true,
      runValidators: true,
    });

    if (isFirstCompletion) {
      await gamificationService.awardXP(user._id, 50, "onboarding_complete");
    }

    await gamificationService.checkProfileFactBadges(user._id);

    return res.json({ success: true, data: { user } });
  } catch (error) {
    return next(error);
  }
};
