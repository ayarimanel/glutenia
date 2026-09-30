const Listing = require("../models/Listing");
const { ORDER_STATUSES } = require("../models/Order");

const TRANSITIONS = {
  confirmed: { from: "pending", roles: ["seller", "admin"] },
  shipped: { from: "confirmed", roles: ["seller", "admin"] },
  delivered: { from: "shipped", roles: ["customer", "admin"] },
};

const rank = (status) => ORDER_STATUSES.indexOf(status);

const idOf = (value) => (value && value._id ? value._id : value);
const sameId = (a, b) => a != null && b != null && idOf(a).toString() === idOf(b).toString();

const computeOverallStatus = (order) => {
  if (!order.sellerStatuses || order.sellerStatuses.length === 0) return order.status;
  return order.sellerStatuses.reduce(
    (least, part) => (rank(part.status) < rank(least) ? part.status : least),
    "delivered"
  );
};

const normalizeOrders = async (orders) => {
  const missing = new Set();
  for (const order of orders) {
    for (const item of order.items) {
      if (!item.professional && item.listing) missing.add(idOf(item.listing).toString());
    }
  }

  if (missing.size > 0) {
    const listings = await Listing.find({ _id: { $in: [...missing] } }).select("professional");
    const sellerByListing = new Map(listings.map((l) => [l._id.toString(), l.professional]));
    for (const order of orders) {
      for (const item of order.items) {
        if (!item.professional && item.listing) {
          item.professional = sellerByListing.get(idOf(item.listing).toString()) || null;
        }
      }
    }
  }

  for (const order of orders) {
    if (!order.sellerStatuses || order.sellerStatuses.length === 0) {
      const sellers = [];
      for (const item of order.items) {
        if (!sellers.some((seller) => String(seller) === String(item.professional))) {
          sellers.push(item.professional);
        }
      }
      order.sellerStatuses = sellers.map((professional) => ({ professional, status: order.status }));
    }
  }

  return orders;
};

const sellerPartOf = (order, userId) =>
  (order.sellerStatuses || []).find((part) => sameId(part.professional, userId));

const relationTo = (order, user) => ({
  admin: user.role === "admin",
  customer: sameId(order.user, user.id),
  seller: user.role === "professional" && Boolean(sellerPartOf(order, user.id)),
});

const pathFor = (order, user, target) => {
  const rule = TRANSITIONS[target];
  const relation = relationTo(order, user);
  if (relation.admin && rule.roles.includes("admin")) return "admin";
  if (relation.customer && rule.roles.includes("customer")) return "customer";
  if (relation.seller && rule.roles.includes("seller")) return "seller";
  return null;
};

const currentStatusFor = (order, user, path) =>
  path === "seller" ? sellerPartOf(order, user.id).status : computeOverallStatus(order);

const allowedActions = (order, user) =>
  Object.keys(TRANSITIONS).filter((target) => {
    const path = pathFor(order, user, target);
    return path !== null && currentStatusFor(order, user, path) === TRANSITIONS[target].from;
  });

class TransitionError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

const applyTransition = (order, user, targetStatus) => {
  const rule = TRANSITIONS[targetStatus];
  if (!rule) {
    throw new TransitionError(400, `An order can't be moved to "${targetStatus}"`);
  }

  const path = pathFor(order, user, targetStatus);
  if (!path) {
    const relation = relationTo(order, user);
    throw new TransitionError(
      403,
      relation.admin || relation.customer || relation.seller
        ? `You can't mark this order as ${targetStatus}`
        : "You can only update your own orders or orders containing your products"
    );
  }

  const previousOverall = computeOverallStatus(order);
  const current = currentStatusFor(order, user, path);
  if (current !== rule.from) {
    const subject = path === "seller" ? "Your part of this order" : "This order";
    throw new TransitionError(
      400,
      `${subject} is ${current}; it can only be marked ${targetStatus} when it is ${rule.from}`
    );
  }

  if (path === "seller") {
    sellerPartOf(order, user.id).status = targetStatus;
    order.statusHistory.push({
      status: targetStatus,
      changedBy: user.id,
      role: "professional",
      seller: user.id,
    });
  } else {
    for (const part of order.sellerStatuses) {
      if (part.status === rule.from) part.status = targetStatus;
    }
    order.statusHistory.push({ status: targetStatus, changedBy: user.id, role: path });
  }

  order.status = computeOverallStatus(order);
  return previousOverall;
};

const itemsStillInStock = (order) =>
  order.items.filter((item) => {
    const part = (order.sellerStatuses || []).find((p) =>
      p.professional == null ? item.professional == null : sameId(p.professional, item.professional)
    );
    const status = part ? part.status : order.status;
    return status === "pending" || status === "confirmed";
  });

module.exports = {
  TRANSITIONS,
  TransitionError,
  allowedActions,
  applyTransition,
  computeOverallStatus,
  itemsStillInStock,
  normalizeOrders,
  sellerPartOf,
};
