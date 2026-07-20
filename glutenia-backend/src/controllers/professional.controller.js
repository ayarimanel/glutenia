const User = require("../models/User");
const { notify } = require("../services/notificationService");

exports.getRequests = async (req, res, next) => {
  try {
    const { status = "pending" } = req.query;
    const filter = { role: "professional" };

    if (status !== "all") {
      filter.professionalStatus = status;
    }

    const requests = await User.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    return next(error);
  }
};

exports.approveRequest = async (req, res, next) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      role: "professional",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Professional request not found",
      });
    }

    user.professionalStatus = "approved";
    await user.save();

    await notify(user._id, {
      type: "professional_approved",
      title: "You're approved!",
      body: "Your professional account has been approved. Log in to get started.",
    });

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

exports.rejectRequest = async (req, res, next) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      role: "professional",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Professional request not found",
      });
    }

    user.professionalStatus = "rejected";
    await user.save();

    await notify(user._id, {
      type: "professional_rejected",
      title: "Account request update",
      body: "Your professional account request was not approved.",
    });

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};
