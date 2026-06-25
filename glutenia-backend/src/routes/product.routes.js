const express = require("express");
const { body, param } = require("express-validator");
const multer = require("multer");
const productController = require("../controllers/product.controller");
const isAdmin = require("../middleware/isAdmin");
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
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a number greater than or equal to 0")
    .toFloat(),
  body("category")
    .optional()
    .isIn(categories)
    .withMessage(`Category must be one of: ${categories.join(", ")}`),
  body("imageUrl").optional({ checkFalsy: true }).trim().isString(),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be an integer greater than or equal to 0")
    .toInt(),
  body("isGlutenFree")
    .optional()
    .isBoolean()
    .withMessage("isGlutenFree must be true or false")
    .toBoolean(),
];

const productUpdateValidators = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Product name cannot be empty"),
  body("description").optional({ checkFalsy: true }).trim().isString(),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a number greater than or equal to 0")
    .toFloat(),
  body("category")
    .optional()
    .isIn(categories)
    .withMessage(`Category must be one of: ${categories.join(", ")}`),
  body("imageUrl").optional({ checkFalsy: true }).trim().isString(),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be an integer greater than or equal to 0")
    .toInt(),
  body("isGlutenFree")
    .optional()
    .isBoolean()
    .withMessage("isGlutenFree must be true or false")
    .toBoolean(),
];

const idValidator = [
  param("id").isMongoId().withMessage("Invalid product id"),
];

router.get("/", productController.getProducts);
router.get("/:id", idValidator, validateRequest, productController.getProductById);
router.post(
  "/",
  verifyToken,
  isAdmin,
  productValidators,
  validateRequest,
  productController.createProduct
);
router.put(
  "/:id/image",
  verifyToken,
  isAdmin,
  idValidator,
  validateRequest,
  upload.single("image"),
  productController.uploadProductImage
);
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  idValidator,
  productUpdateValidators,
  validateRequest,
  productController.updateProduct
);
router.delete(
  "/:id",
  verifyToken,
  isAdmin,
  idValidator,
  validateRequest,
  productController.deleteProduct
);

module.exports = router;
