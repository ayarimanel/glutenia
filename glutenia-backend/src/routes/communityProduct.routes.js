const express = require("express");
const { body, param } = require("express-validator");
const communityProductController = require("../controllers/communityProduct.controller");
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
  body("isGlutenFree")
    .isBoolean()
    .withMessage("isGlutenFree must be true or false")
    .toBoolean(),
  body("brand").optional({ checkFalsy: true }).trim().isString(),
  body("category")
    .optional({ checkFalsy: true })
    .isIn(categories)
    .withMessage(`Category must be one of: ${categories.join(", ")}`),
];

const idValidator = [param("id").isMongoId().withMessage("Invalid community product id")];

router.get("/barcode/:code", verifyToken, communityProductController.getCommunityProductByBarcode);
router.post("/", verifyToken, submitValidators, validateRequest, communityProductController.submitCommunityProduct);
router.post(
  "/:id/flag",
  verifyToken,
  idValidator,
  validateRequest,
  communityProductController.flagCommunityProduct
);

module.exports = router;
