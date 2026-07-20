const Order = require("../models/Order");
const User = require("../models/User");

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    return next(error);
  }
};

const TREND_DAYS = 14;

const tally = (map, key) => {
  map[key] = (map[key] || 0) + 1;
};

exports.getUserAnalytics = async (req, res, next) => {
  try {
    const users = await User.find().select(
      "role role_type experience_level primary_goal confidence_identifying_gf createdAt"
    );

    const byRole = {};
    const byRoleType = {};
    const byExperienceLevel = {};
    const byPrimaryGoal = {};
    const byConfidence = {};
    const signupsByDay = {};

    for (const user of users) {
      tally(byRole, user.role);

      if (user.role === "customer") {
        tally(byRoleType, user.role_type || "unset");
        tally(byExperienceLevel, user.experience_level || "unset");
        tally(byPrimaryGoal, user.primary_goal || "unset");
        tally(byConfidence, user.confidence_identifying_gf || "unset");
      }

      const day = user.createdAt.toISOString().slice(0, 10);
      tally(signupsByDay, day);
    }

    const signupTrend = [];
    for (let i = TREND_DAYS - 1; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      signupTrend.push({ date: key, count: signupsByDay[key] || 0 });
    }

    return res.json({
      success: true,
      data: {
        totalUsers: users.length,
        byRole,
        byRoleType,
        byExperienceLevel,
        byPrimaryGoal,
        byConfidence,
        signupTrend,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.getUserOrders = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const orders = await Order.find({ user: req.params.id }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    return next(error);
  }
};
