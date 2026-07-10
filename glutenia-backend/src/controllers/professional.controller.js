const User = require("../models/User");

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

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};
