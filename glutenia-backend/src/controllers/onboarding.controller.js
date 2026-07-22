const User = require("../models/User");
const UserGamification = require("../models/UserGamification");
const gamificationService = require("../services/gamificationService");

const TITLE_MAP = {
  warrior: {
    just_started: "Newcomer",
    "1_to_6_months": "Explorer",
    "6_to_12_months": "Label Reader",
    "1_to_3_years": "Safe Eater",
    "3_plus_years": "Advocate",
  },
  supporter: {
    just_started: "Ally",
    "1_to_6_months": "Caregiver",
    "6_to_12_months": "Protector",
    "1_to_3_years": "Champion",
    "3_plus_years": "Lifeline",
  },
};

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

    const currentTitle = (TITLE_MAP[roleType] || {})[experienceLevel] || "Newcomer";

    // The 50 XP onboarding bonus is a one-time reward — only grant it the first
    // time this user completes the journey survey, not on every later edit.
    if (isFirstCompletion) {
      await gamificationService.awardXP(user._id, 50, "onboarding_complete");
    }

    const gamification = await UserGamification.findOneAndUpdate(
      { userId: user._id },
      { currentTitle },
      { new: true, upsert: true }
    );

    return res.json({ success: true, data: { user, gamification } });
  } catch (error) {
    return next(error);
  }
};
