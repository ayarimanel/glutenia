const Event = require("../models/Event");
const User = require("../models/User");
const { notify, notifyBroadcast } = require("../services/notificationService");
const gamificationService = require("../services/gamificationService");

const ALLOWED_FIELDS = ["title", "description", "date", "location", "category", "price", "emoji", "color"];

const serialize = (event, userId) => {
  const obj = event.toObject();
  const isGoing = userId
    ? obj.attendees.some((id) => id.toString() === String(userId))
    : false;
  return {
    ...obj,
    attendeeCount: obj.attendees.length,
    isGoing,
    attendees: undefined,
  };
};

exports.getEvents = async (req, res, next) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: events.map((e) => serialize(e, req.user?.id)) });
  } catch (error) {
    return next(error);
  }
};

exports.getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    return res.json({ success: true, data: serialize(event, req.user?.id) });
  } catch (error) {
    return next(error);
  }
};

exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, date, location, category, price, emoji, color } = req.body;
    const event = await Event.create({
      title,
      description,
      date,
      location,
      category,
      price: price ?? 0,
      emoji: emoji || "🎉",
      color: color || "#E8F5E9",
      createdBy: req.user.id,
    });

    User.find({ role: "customer" })
      .select("_id")
      .then((recipients) =>
        notifyBroadcast(
          recipients.map((recipient) => recipient._id),
          {
            type: "event_new",
            title: "New event posted 🎉",
            body: `${event.title} was just added — check it out!`,
            referenceId: event._id.toString(),
          }
        )
      )
      .catch(() => {});

    return res.status(201).json({ success: true, data: serialize(event, req.user.id) });
  } catch (error) {
    return next(error);
  }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const update = ALLOWED_FIELDS.reduce((acc, key) => {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) acc[key] = req.body[key];
      return acc;
    }, {});
    const event = await Event.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    return res.json({ success: true, data: serialize(event, req.user.id) });
  } catch (error) {
    return next(error);
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    return res.json({ success: true, data: { message: "Event deleted" } });
  } catch (error) {
    return next(error);
  }
};

exports.rsvp = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    const userId = req.user.id;
    const idx = event.attendees.findIndex((id) => id.toString() === userId);
    const isJoining = idx === -1;
    if (isJoining) {
      event.attendees.push(userId);
    } else {
      event.attendees.splice(idx, 1);
    }
    await event.save();

    await notify(userId, {
      type: isJoining ? "event_join" : "event_leave",
      title: isJoining ? "You're going!" : "RSVP removed",
      body: isJoining
        ? `You're all set for ${event.title}.`
        : `You're no longer attending ${event.title}.`,
      referenceId: event._id.toString(),
    });

    const gamification = isJoining
      ? await gamificationService.recordAction(userId, "event_rsvp", { sourceId: event._id.toString() })
      : null;

    return res.json({
      success: true,
      data: { isGoing: isJoining, attendeeCount: event.attendees.length, gamification },
    });
  } catch (error) {
    return next(error);
  }
};
