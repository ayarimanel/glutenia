const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Listing = require("../models/Listing");
const { notify } = require("../services/notificationService");
const gamificationService = require("../services/gamificationService");

const DELIVERY_FEE = 7;

const STATUS_NOTIFICATIONS = {
  pending: "Your order is pending.",
  confirmed: "Your order has been confirmed.",
  shipped: "Your order is on its way!",
  delivered: "Your order has been delivered.",
};

exports.getSellerOrders = async (req, res, next) => {
  try {
    const listingIds = await Listing.find({ professional: req.user.id }).distinct("_id");
    const ownedIds = new Set(listingIds.map((id) => id.toString()));

    const orders = await Order.find({ "items.listing": { $in: listingIds } })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    const sellerOrders = orders.map((order) => {
      const plain = order.toObject();
      plain.items = plain.items.filter((item) => ownedIds.has(item.listing.toString()));
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

      const [createdOrder] = await Order.create(
        [
          {
            user: req.user.id,
            items: orderItems,
            total,
            deliveryFee: DELIVERY_FEE,
            address: req.body.address,
            status: "confirmed",
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
      data: { ...order.toObject(), gamification },
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

    return res.json({
      success: true,
      data: orders,
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

    return res.json({
      success: true,
      data: orders,
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

    return res.json({
      success: true,
      data: order,
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

    if (req.user.role !== "admin") {
      const listingIds = await Listing.find({ professional: req.user.id }).distinct("_id");
      const ownedIds = new Set(listingIds.map((id) => id.toString()));
      const ownsItem = order.items.some((item) => ownedIds.has(item.listing.toString()));

      if (!ownsItem) {
        return res.status(403).json({
          success: false,
          message: "You can only update orders containing your own products",
        });
      }
    }

    order.status = req.body.status;
    await order.save();

    await notify(order.user, {
      type: "order_status",
      title: "Order update",
      body: STATUS_NOTIFICATIONS[order.status] || `Your order status changed to ${order.status}.`,
      referenceId: order._id.toString(),
    });

    return res.json({
      success: true,
      data: order,
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

    // An order that never left the seller still holds reserved stock -
    // hand it back so deleting the order doesn't silently shrink inventory.
    // Shipped/delivered goods are already gone, so nothing to restore.
    if (order.status === "pending" || order.status === "confirmed") {
      await Promise.all(
        order.items.map((item) =>
          Listing.updateOne({ _id: item.listing }, { $inc: { stock: item.qty } })
        )
      );
    }

    await order.deleteOne();

    return res.json({
      success: true,
      data: { _id: order._id },
    });
  } catch (error) {
    return next(error);
  }
};
