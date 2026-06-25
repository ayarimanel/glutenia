const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");

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
    const total = orderItems.reduce(
      (sum, item) => sum + item.qty * item.price,
      0
    );

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      total,
      address: req.body.address,
      status: "confirmed",
    });

    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [], updatedAt: new Date() }
    );

    return res.status(201).json({
      success: true,
      data: order,
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
