const Notification = require("../models/Notification");

exports.getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    return next(error);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    return next(error);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );

    return res.json({
      success: true,
      data: { message: "All notifications marked as read" },
    });
  } catch (error) {
    return next(error);
  }
};
