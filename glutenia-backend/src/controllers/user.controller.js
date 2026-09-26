const Cart = require("../models/Cart");
const Establishment = require("../models/Establishment");
const Event = require("../models/Event");
const Listing = require("../models/Listing");
const Notification = require("../models/Notification");
const Order = require("../models/Order");
const User = require("../models/User");
const UserBadge = require("../models/UserBadge");
const UserGamification = require("../models/UserGamification");
const XpLedger = require("../models/XpLedger");

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
      "role role_type experience_level primary_goal eating_out_frequency confidence_identifying_gf createdAt"
    );

    const byRole = {};
    const byRoleType = {};
    const byExperienceLevel = {};
    const byPrimaryGoal = {};
    const byEatingOutFrequency = {};
    const byConfidence = {};
    const signupsByDay = {};

    for (const user of users) {
      tally(byRole, user.role);

      if (user.role === "customer") {
        tally(byRoleType, user.role_type || "unset");
        tally(byExperienceLevel, user.experience_level || "unset");
        tally(byPrimaryGoal, user.primary_goal || "unset");
        tally(byEatingOutFrequency, user.eating_out_frequency || "unset");
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
        byEatingOutFrequency,
        byConfidence,
        signupTrend,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("favoriteSpots");
    return res.json({ success: true, data: user?.favoriteSpots || [] });
  } catch (error) {
    return next(error);
  }
};

exports.updateFavorites = async (req, res, next) => {
  try {
    const { favorites } = req.body;
    if (!Array.isArray(favorites)) {
      return res.status(400).json({ success: false, message: "favorites must be an array" });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { favoriteSpots: favorites },
      { new: true }
    ).select("favoriteSpots");
    return res.json({ success: true, data: user.favoriteSpots });
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

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const [gamification, orderCount, establishment] = await Promise.all([
      UserGamification.findOne({ userId: user._id }).select(
        "totalXp currentLevel currentStreak longestStreak"
      ),
      Order.countDocuments({ user: user._id }),
      Establishment.findOne({ owner: user._id }).select("name category verified"),
    ]);

    return res.json({
      success: true,
      data: {
        user,
        gamification,
        orderCount,
        establishment,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (email !== undefined && email !== user.email) {
      const taken = await User.exists({ email, _id: { $ne: user._id } });
      if (taken) {
        return res.status(409).json({
          success: false,
          message: "Email is already registered",
        });
      }
      user.email = email;
    }
    if (name !== undefined) {
      user.name = name;
    }
    if (phone !== undefined) {
      user.phone = phone;
    }
    await user.save();

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own admin account here",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userId = user._id;

    // Same cleanup as self-service account deletion (auth.controller
    // deleteAccount), plus the professional-owned establishment/listings so
    // they don't stay visible on the map/shop with no owner. Order records
    // are intentionally kept for accounting/history purposes.
    await Promise.all([
      Cart.deleteOne({ user: userId }),
      Notification.deleteMany({ user: userId }),
      UserGamification.deleteOne({ userId }),
      UserBadge.deleteMany({ userId }),
      XpLedger.deleteMany({ userId }),
      Event.updateMany({ attendees: userId }, { $pull: { attendees: userId } }),
      Establishment.deleteOne({ owner: userId }),
      Listing.deleteMany({ professional: userId }),
    ]);

    await User.findByIdAndDelete(userId);

    return res.json({
      success: true,
      data: { _id: userId },
    });
  } catch (error) {
    return next(error);
  }
};
