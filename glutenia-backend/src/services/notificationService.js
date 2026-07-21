const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendExpoPush } = require("./pushService");

// Which per-category preference on the User model gates push delivery for
// each notification type. Types not listed here are always sent (subject
// only to the master pushNotificationsEnabled toggle).
const CATEGORY_FIELD_BY_TYPE = {
  order_status: "notifyOrders",
  event_join: "notifyEvents",
  event_leave: "notifyEvents",
  event_new: "notifyEvents",
};

const notify = async (userId, { type, title, body = "", referenceId = null }) => {
  if (!userId) return null;

  try {
    const record = await Notification.create({ user: userId, type, title, body, referenceId });

    const categoryField = CATEGORY_FIELD_BY_TYPE[type];
    const user = await User.findById(userId).select(
      `pushTokens pushNotificationsEnabled ${categoryField || ""}`.trim()
    );
    const categoryEnabled = !categoryField || user?.[categoryField] !== false;
    if (user?.pushNotificationsEnabled && categoryEnabled && user.pushTokens?.length) {
      sendExpoPush(user.pushTokens, { title, body, data: { type } });
    }

    return record;
  } catch (error) {
    // Never let a notification failure break the action that triggered it (RSVP, order update, ...).
    return null;
  }
};

// Fan-out variant for broadcasts (e.g. a new event posted to every customer).
const notifyBroadcast = async (userIds, { type, title, body = "", referenceId = null }) => {
  if (!userIds?.length) return;

  try {
    await Notification.insertMany(
      userIds.map((user) => ({ user, type, title, body, referenceId })),
      { ordered: false }
    );
  } catch (error) {
    // ignore partial insert failures
  }

  try {
    const categoryField = CATEGORY_FIELD_BY_TYPE[type];
    const query = {
      _id: { $in: userIds },
      pushNotificationsEnabled: true,
      "pushTokens.0": { $exists: true },
    };
    if (categoryField) {
      query[categoryField] = { $ne: false };
    }
    const recipients = await User.find(query).select("pushTokens");

    const tokens = recipients.flatMap((user) => user.pushTokens);
    if (tokens.length) {
      sendExpoPush(tokens, { title, body, data: { type } });
    }
  } catch (error) {
    // ignore
  }
};

module.exports = { notify, notifyBroadcast };
