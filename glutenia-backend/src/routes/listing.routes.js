const express = require("express");
const { body, param } = require("express-validator");
const listingController = require("../controllers/listing.controller");
const requireRole = require("../middleware/requireRole");
const validateRequest = require("../middleware/validateRequest");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

const createValidators = [
  body("productId").isMongoId().withMessage("Invalid catalog product id"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a number greater than or equal to 0")
    .toFloat(),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be an integer greater than or equal to 0")
    .toInt(),
  body("isAvailable")
    .optional()
    .isBoolean()
    .withMessage("isAvailable must be true or false")
    .toBoolean(),
];

const updateValidators = [
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a number greater than or equal to 0")
    .toFloat(),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be an integer greater than or equal to 0")
    .toInt(),
  body("isAvailable")
    .optional()
    .isBoolean()
    .withMessage("isAvailable must be true or false")
    .toBoolean(),
];

const idValidator = [param("id").isMongoId().withMessage("Invalid listing id")];

router.get("/", listingController.getListings);
router.get(
  "/mine",
  verifyToken,
  requireRole("admin", "professional"),
  listingController.getMyListings
);
router.get("/:id", idValidator, validateRequest, listingController.getListingById);
router.post(
  "/",
  verifyToken,
  requireRole("professional"),
  createValidators,
  validateRequest,
  listingController.createListing
);
router.put(
  "/:id",
  verifyToken,
  requireRole("admin", "professional"),
  idValidator,
  updateValidators,
  validateRequest,
  listingController.updateListing
);
router.delete(
  "/:id",
  verifyToken,
  requireRole("admin", "professional"),
  idValidator,
  validateRequest,
  listingController.deleteListing
);

module.exports = router;
