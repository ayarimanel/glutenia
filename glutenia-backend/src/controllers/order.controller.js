const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Listing = require("../models/Listing");
const { notify } = require("../services/notificationService");
const gamificationService = require("../services/gamificationService");
const orderStatus = require("../services/orderStatusService");

const DELIVERY_FEE = 7;

const STATUS_NOTIFICATIONS = {
  pending: "Your order is pending.",
  confirmed: "Your order has been confirmed.",
  shipped: "Your order is on its way!",
  delivered: "Your order has been delivered.",
};

// Every order sent to the app carries the actions the requesting user may
// take on it, computed from the same transition map the backend enforces,
// so the screens only ever offer buttons that will be accepted.
const withActions = (order, user) => ({
  ...order.toObject(),
  allowedActions: orderStatus.allowedActions(order, user),
});

exports.getSellerOrders = async (req, res, next) => {
  try {
    const listingIds = await Listing.find({ professional: req.user.id }).distinct("_id");
    const ownedIds = new Set(listingIds.map((id) => id.toString()));

    const orders = await Order.find({ "items.listing": { $in: listingIds } })
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    await orderStatus.normalizeOrders(orders);

    const sellerOrders = orders.map((order) => {
      const plain = withActions(order, req.user);
      plain.items = plain.items.filter((item) => ownedIds.has(item.listing.toString()));
      // The professional's own part, which is what their screen shows.
      plain.sellerStatus = orderStatus.sellerPartOf(order, req.user.id)?.status ?? order.status;
      return plain;
    });

    return res.json({
      success: true,
      data: sellerOrders,
    });
  } catch (error) {
    return next(error);
  }
};

// Atomically reserves stock for a single line item: the $gte guard means the
// update only applies (and only then does stock actually decrement) if
// enough stock is still available at the moment this runs, so concurrent
// checkouts for the same product can never both succeed for more than what's
// really in stock. Combined with the transaction in createOrder, a failure
// on any one item rolls back every decrement already made for earlier items
// in the same order — an order is all-or-nothing, never partially reserved.
const reserveStock = async (item, session) => {
  const qty = item.qty;
  const updated = await Listing.findOneAndUpdate(
    { _id: item.listingId, stock: { $gte: qty } },
    { $inc: { stock: -qty } },
    { new: true, session }
  ).populate("product");

  if (updated) {
    return {
      product: updated.product._id,
      listing: updated._id,
      professional: updated.professional,
      name: updated.product.name,
      qty,
      price: updated.price,
    };
  }

  // The guarded update matched nothing — figure out whether that's because
  // the listing doesn't exist at all, or it exists but doesn't have enough
  // stock left, so the error message actually tells the user what happened.
  const listing = await Listing.findById(item.listingId).session(session).populate("product");
  if (!listing) {
    const error = new Error(`Listing not found: ${item.listingId}`);
    error.statusCode = 404;
    throw error;
  }

  const error = new Error(
    listing.stock > 0
      ? `Only ${listing.stock} of "${listing.product.name}" left in stock (you requested ${qty}).`
      : `"${listing.product.name}" is out of stock.`
  );
  error.statusCode = 409;
  throw error;
};

exports.createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    let order;

    await session.withTransaction(async () => {
      const orderItems = [];
      for (const item of req.body.items) {
        orderItems.push(await reserveStock(item, session));
      }

      const subtotal = orderItems.reduce(
        (sum, item) => sum + item.qty * item.price,
        0
      );
      const total = subtotal + DELIVERY_FEE;

      // Every seller in the order starts with their own pending part.
      const sellerStatuses = [];
      for (const item of orderItems) {
        if (!sellerStatuses.some((part) => String(part.professional) === String(item.professional))) {
          sellerStatuses.push({ professional: item.professional, status: "pending" });
        }
      }

      const [createdOrder] = await Order.create(
        [
          {
            user: req.user.id,
            items: orderItems,
            total,
            deliveryFee: DELIVERY_FEE,
            address: req.body.address,
            status: "pending",
            sellerStatuses,
            statusHistory: [{ status: "pending", changedBy: req.user.id, role: "customer" }],
          },
        ],
        { session }
      );
      order = createdOrder;

      await Cart.findOneAndUpdate(
        { user: req.user.id },
        { items: [], updatedAt: new Date() },
        { session }
      );
    });

    // Gamification is a side effect of a successfully committed order, not
    // part of its correctness — it already swallows its own errors, so it
    // runs after the transaction instead of inside it.
    const gamification = await gamificationService.recordAction(req.user.id, "order_placed", {
      sourceId: order._id.toString(),
    });

    return res.status(201).json({
      success: true,
      data: { ...withActions(order, req.user), gamification },
    });
  } catch (error) {
    return next(error);
  } finally {
    await session.endSession();
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    await orderStatus.normalizeOrders(orders);

    return res.json({
      success: true,
      data: orders.map((order) => withActions(order, req.user)),
    });
  } catch (error) {
    return next(error);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    await orderStatus.normalizeOrders(orders);

    return res.json({
      success: true,
      data: orders.map((order) => withActions(order, req.user)),
    });
  } catch (error) {
    return next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const orderUserId =
      typeof order.user === "object" && order.user._id
        ? order.user._id.toString()
        : order.user.toString();

    if (req.user.role !== "admin" && orderUserId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only access your own orders",
      });
    }

    await orderStatus.normalizeOrders([order]);

    return res.json({
      success: true,
      data: withActions(order, req.user),
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    await orderStatus.normalizeOrders([order]);

    let previousStatus;
    try {
      previousStatus = orderStatus.applyTransition(order, req.user, req.body.status);
    } catch (error) {
      if (error instanceof orderStatus.TransitionError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      throw error;
    }

    try {
      await order.save();
    } catch (error) {
      if (error instanceof mongoose.Error.VersionError) {
        return res.status(409).json({
          success: false,
          message: "This order was just updated by someone else. Refresh and try again.",
        });
      }
      throw error;
    }

    // The customer hears about changes to the order as a whole; one seller
    // confirming their part of a multi-seller order doesn't change it yet.
    if (order.status !== previousStatus) {
      await notify(order.user, {
        type: "order_status",
        title: "Order update",
        body: STATUS_NOTIFICATIONS[order.status] || `Your order status changed to ${order.status}.`,
        referenceId: order._id.toString(),
      });
    }

    return res.json({
      success: true,
      data: withActions(order, req.user),
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Parts of the order that never left their seller still hold reserved
    // stock - hand it back so deleting the order doesn't silently shrink
    // inventory. Shipped/delivered goods are already gone.
    await orderStatus.normalizeOrders([order]);
    await Promise.all(
      orderStatus.itemsStillInStock(order).map((item) =>
        Listing.updateOne({ _id: item.listing }, { $inc: { stock: item.qty } })
      )
    );

    await order.deleteOne();

    return res.json({
      success: true,
      data: { _id: order._id },
    });
  } catch (error) {
    return next(error);
  }
};
