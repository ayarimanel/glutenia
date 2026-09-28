const express = require("express");
const { body, param } = require("express-validator");
const communityProductController = require("../controllers/communityProduct.controller");
const requireRole = require("../middleware/requireRole");
const validateRequest = require("../middleware/validateRequest");
const verifyToken = require("../middleware/verifyToken");
const { isValidBarcodeChecksum } = require("../utils/barcode");

const router = express.Router();

const categories = ["Bread", "Pasta", "Snacks", "Flour", "Sweets", "Other"];

const submitValidators = [
  body("barcode")
    .trim()
    .notEmpty()
    .withMessage("Barcode is required")
    .custom((value) => isValidBarcodeChecksum(value))
    .withMessage("Barcode is not a valid product barcode"),
  body("name").trim().notEmpty().withMessage("Product name is required"),
  // Photo is mandatory, not optional — a typed name alone is trivial to
  // fake; a photo of the actual product/barcode raises the bar meaningfully
  // (same approach Open Food Facts uses for crowdsourced submissions).
  body("imageUrl")
    .trim()
    .notEmpty()
    .withMessage("A photo of the product is required")
    .isString(),
  // No isGlutenFree here on purpose: the gluten status is taken from this
  // label scan's verdict server-side, never from the client.
  body("labelScanId")
    .isMongoId()
    .withMessage("A label analysis is required to add a product"),
  body("brand").optional({ checkFalsy: true }).trim().isString(),
  body("category")
    .optional({ checkFalsy: true })
    .isIn(categories)
    .withMessage(`Category must be one of: ${categories.join(", ")}`),
];

const idValidator = [param("id").isMongoId().withMessage("Invalid community product id")];

const reviewValidators = [
  body("isGlutenFree").optional().isBoolean({ strict: true }).withMessage("isGlutenFree must be true or false"),
];

router.get("/", verifyToken, requireRole("admin"), communityProductController.getCommunityProducts);
router.post("/", verifyToken, submitValidators, validateRequest, communityProductController.submitCommunityProduct);
router.patch(
  "/:id",
  verifyToken,
  requireRole("admin"),
  idValidator,
  reviewValidators,
  validateRequest,
  communityProductController.reviewCommunityProduct
);
router.delete(
  "/:id",
  verifyToken,
  requireRole("admin"),
  idValidator,
  validateRequest,
  communityProductController.deleteCommunityProduct
);
router.post(
  "/:id/flag",
  verifyToken,
  idValidator,
  validateRequest,
  communityProductController.flagCommunityProduct
);

module.exports = router;
