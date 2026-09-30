const express = require("express");
const { body, param } = require("express-validator");
const multer = require("multer");
const productController = require("../controllers/product.controller");
const requireRole = require("../middleware/requireRole");
const validateRequest = require("../middleware/validateRequest");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const categories = ["Bread", "Pasta", "Snacks", "Flour", "Sweets", "Other"];

const productValidators = [
  body("name").trim().notEmpty().withMessage("Product name is required"),
  body("description").optional({ checkFalsy: true }).trim().isString(),
  body("category")
    .optional()
    .isIn(categories)
    .withMessage(`Category must be one of: ${categories.join(", ")}`),
  body("imageUrl").optional({ checkFalsy: true }).trim().isString(),
  body("isGlutenFree")
    .optional()
    .isBoolean()
    .withMessage("isGlutenFree must be true or false")
    .toBoolean(),
  body("barcode").optional({ checkFalsy: true }).trim().isString(),
];

const productUpdateValidators = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Product name cannot be empty"),
  body("description").optional({ checkFalsy: true }).trim().isString(),
  body("category")
    .optional()
    .isIn(categories)
    .withMessage(`Category must be one of: ${categories.join(", ")}`),
  body("imageUrl").optional({ checkFalsy: true }).trim().isString(),
  body("isGlutenFree")
    .optional()
    .isBoolean()
    .withMessage("isGlutenFree must be true or false")
    .toBoolean(),
  body("barcode").optional({ checkFalsy: true }).trim().isString(),
];

const idValidator = [
  param("id").isMongoId().withMessage("Invalid product id"),
];

router.get("/", productController.getProducts);
router.get("/barcode/:code", verifyToken, productController.getProductByBarcode);
router.get("/missing-barcodes", verifyToken, requireRole("admin"), productController.getMissingBarcodes);
router.delete(
  "/missing-barcodes/:id",
  verifyToken,
  requireRole("admin"),
  idValidator,
  validateRequest,
  productController.deleteMissingBarcode
);
router.get("/:id", idValidator, validateRequest, productController.getProductById);
router.post(
  "/",
  verifyToken,
  requireRole("admin"),
  productValidators,
  validateRequest,
  productController.createProduct
);
router.put(
  "/:id/image",
  verifyToken,
  requireRole("admin"),
  idValidator,
  validateRequest,
  upload.single("image"),
  productController.uploadProductImage
);
router.put(
  "/:id",
  verifyToken,
  requireRole("admin"),
  idValidator,
  productUpdateValidators,
  validateRequest,
  productController.updateProduct
);
router.delete(
  "/:id",
  verifyToken,
  requireRole("admin"),
  idValidator,
  validateRequest,
  productController.deleteProduct
);

module.exports = router;
