const express = require("express");
const { body, param } = require("express-validator");
const orderController = require("../controllers/order.controller");
const isAdmin = require("../middleware/isAdmin");
const validateRequest = require("../middleware/validateRequest");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

const createOrderValidators = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("Order must contain at least one item"),
  body("items.*.productId").isMongoId().withMessage("Invalid product id"),
  body("items.*.name").optional().trim().isString(),
  body("items.*.qty")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1")
    .toInt(),
  body("items.*.price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be greater than or equal to 0")
    .toFloat(),
  body("address.fullName")
    .trim()
    .notEmpty()
    .withMessage("Address full name is required"),
  body("address.addressLine")
    .trim()
    .notEmpty()
    .withMessage("Address line is required"),
  body("address.city").trim().notEmpty().withMessage("City is required"),
  body("address.phone").trim().notEmpty().withMessage("Phone is required"),
];

const idValidator = [param("id").isMongoId().withMessage("Invalid order id")];

router.post(
  "/",
  verifyToken,
  createOrderValidators,
  validateRequest,
  orderController.createOrder
);
router.get("/my", verifyToken, orderController.getMyOrders);
router.get("/", verifyToken, isAdmin, orderController.getAllOrders);
router.get(
  "/:id",
  verifyToken,
  idValidator,
  validateRequest,
  orderController.getOrderById
);

module.exports = router;
