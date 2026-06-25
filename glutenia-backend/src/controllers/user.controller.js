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
