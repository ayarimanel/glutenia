const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getJwtExpiresIn, getJwtSecret } = require("../config/auth");
const User = require("../models/User");
const Cart = require("../models/Cart");
const Notification = require("../models/Notification");
const UserGamification = require("../models/UserGamification");
const UserBadge = require("../models/UserBadge");
const XpLedger = require("../models/XpLedger");
const Event = require("../models/Event");

const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn: getJwtExpiresIn() }
  );
};

const toSafeUser = (user) => {
  const safeUser = user.toObject ? user.toObject() : { ...user };
  delete safeUser.password;
  return safeUser;
};

const generateApprovalCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already taken",
      });
    }

    const isProfessional = role === "professional";
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || "",
      role: isProfessional ? "professional" : "customer",
      professionalStatus: isProfessional ? "pending" : null,
      approvalCode: isProfessional ? generateApprovalCode() : null,
    });

    if (isProfessional) {
      return res.status(201).json({
        success: true,
        data: {
          pending: true,
          approvalCode: user.approvalCode,
          message:
            "Your professional account request has been sent to the admin for approval.",
        },
      });
    }

    const token = createToken(user);

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: toSafeUser(user),
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.role === "professional" && user.professionalStatus !== "approved") {
      const status = user.professionalStatus || "pending";
      return res.status(403).json({
        success: false,
        message:
          status === "rejected"
            ? "Your professional account request was rejected by the admin."
            : "Your professional account is still pending admin approval.",
        data: { professionalStatus: status, approvalCode: user.approvalCode },
      });
    }

    const token = createToken(user);

    return res.json({
      success: true,
      data: {
        token,
        user: toSafeUser(user),
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      data: toSafeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const {
      name,
      avatar,
      phone,
      pushNotificationsEnabled,
      notifyOrders,
      notifyEvents,
      theme_preference,
      language,
    } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (name !== undefined) {
      user.name = name;
    }
    if (avatar !== undefined) {
      user.avatar = avatar || null;
    }
    if (phone !== undefined) {
      user.phone = phone;
    }
    if (pushNotificationsEnabled !== undefined) {
      user.pushNotificationsEnabled = !!pushNotificationsEnabled;
    }
    if (notifyOrders !== undefined) {
      user.notifyOrders = !!notifyOrders;
    }
    if (notifyEvents !== undefined) {
      user.notifyEvents = !!notifyEvents;
    }
    if (theme_preference !== undefined) {
      user.theme_preference = theme_preference;
    }
    if (language !== undefined) {
      user.language = language;
    }
    await user.save();

    return res.json({
      success: true,
      data: toSafeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

exports.registerPushToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Push token is required",
      });
    }

    await User.findByIdAndUpdate(req.user.id, { $addToSet: { pushTokens: token } });

    return res.json({ success: true, data: { registered: true } });
  } catch (error) {
    return next(error);
  }
};

exports.unregisterPushToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (token) {
      await User.findByIdAndUpdate(req.user.id, { $pull: { pushTokens: token } });
    }

    return res.json({ success: true, data: { registered: false } });
  } catch (error) {
    return next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const currentMatches = await bcrypt.compare(currentPassword, user.password);
    if (!currentMatches) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.json({
      success: true,
      data: { message: "Password updated successfully" },
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect",
      });
    }

    const userId = user._id;

    // Order records are intentionally kept for accounting/history purposes.
    await Promise.all([
      Cart.deleteOne({ user: userId }),
      Notification.deleteMany({ user: userId }),
      UserGamification.deleteOne({ userId }),
      UserBadge.deleteMany({ userId }),
      XpLedger.deleteMany({ userId }),
      Event.updateMany({ attendees: userId }, { $pull: { attendees: userId } }),
    ]);

    await User.findByIdAndDelete(userId);

    return res.json({
      success: true,
      data: { message: "Account deleted successfully" },
    });
  } catch (error) {
    return next(error);
  }
};
