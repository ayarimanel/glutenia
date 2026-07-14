const Notification = require("../models/Notification");

const notify = async (userId, { type, title, body = "" }) => {
  if (!userId) return null;

  try {
    return await Notification.create({ user: userId, type, title, body });
  } catch (error) {
    // Never let a notification failure break the action that triggered it (RSVP, order update, ...).
    return null;
  }
};

module.exports = { notify };
