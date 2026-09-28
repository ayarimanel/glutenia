const mongoose = require("mongoose");

// The four order statuses, in lifecycle order. The allowed transitions
// between them live in services/orderStatusService.js.
const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered"];

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    // Snapshot of the listing's seller at checkout. Missing on orders placed
    // before per-seller statuses existed; orderStatusService fills it in.
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    qty: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    addressLine: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

// One entry per professional whose items are in the order: each seller moves
// only their own part forward, and the order's overall status is the least
// advanced of these.
const sellerStatusSchema = new mongoose.Schema(
  {
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      required: true,
    },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ORDER_STATUSES,
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    role: {
      type: String,
      enum: ["customer", "professional", "admin"],
      required: true,
    },
    // Set when a professional moved only their own part of the order.
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator(items) {
        return items.length > 0;
      },
      message: "Order must contain at least one item",
    },
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  deliveryFee: {
    type: Number,
    required: true,
    min: 0,
    default: 7,
  },
  address: {
    type: addressSchema,
    required: true,
  },
  status: {
    type: String,
    enum: ORDER_STATUSES,
    default: "pending",
  },
  sellerStatuses: {
    type: [sellerStatusSchema],
    default: [],
  },
  statusHistory: {
    type: [statusHistorySchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// getMyOrders and getUserOrders (order.controller.js) both filter on this
// field directly; it had no index before.
orderSchema.index({ user: 1 });

// Two sellers updating their parts of the same order at once must not
// silently overwrite each other's sellerStatuses: the second save fails with
// a VersionError instead (reported as a 409 by updateOrderStatus).
orderSchema.set("optimisticConcurrency", true);

module.exports = mongoose.model("Order", orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
