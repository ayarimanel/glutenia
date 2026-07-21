const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
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
    const productIds = await Product.find({ createdBy: req.user.id }).distinct("_id");
    const ownedIds = new Set(productIds.map((id) => id.toString()));

    const orders = await Order.find({ "items.product": { $in: productIds } })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    const sellerOrders = orders.map((order) => {
      const plain = order.toObject();
      plain.items = plain.items.filter((item) => ownedIds.has(item.product.toString()));
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

const buildOrderItems = async (requestItems) => {
  const productIds = requestItems.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  const productsById = new Map(
    products.map((product) => [product._id.toString(), product])
  );

  return requestItems.map((item) => {
    const product = productsById.get(item.productId);

    if (!product) {
      const error = new Error(`Product not found: ${item.productId}`);
      error.statusCode = 404;
      throw error;
    }

    return {
      product: product._id,
      name: product.name,
      qty: item.qty,
      price: product.price,
    };
  });
};

exports.createOrder = async (req, res, next) => {
  try {
    const orderItems = await buildOrderItems(req.body.items);
    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.qty * item.price,
      0
    );
    const total = subtotal + DELIVERY_FEE;

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      total,
      deliveryFee: DELIVERY_FEE,
      address: req.body.address,
      status: "confirmed",
    });

    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [], updatedAt: new Date() }
    );

    const gamification = await gamificationService.recordAction(req.user.id, "order_placed", {
      sourceId: order._id.toString(),
    });

    return res.status(201).json({
      success: true,
      data: { ...order.toObject(), gamification },
    });
  } catch (error) {
    return next(error);
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
      const productIds = await Product.find({ createdBy: req.user.id }).distinct("_id");
      const ownedIds = new Set(productIds.map((id) => id.toString()));
      const ownsItem = order.items.some((item) => ownedIds.has(item.product.toString()));

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
