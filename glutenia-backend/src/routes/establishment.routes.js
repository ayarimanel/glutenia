const express = require("express");
const { body, param, query } = require("express-validator");
const multer = require("multer");
const establishmentController = require("../controllers/establishment.controller");
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

const categories = ["Supermarket", "Restaurant", "Health Store", "Bakery", "Pharmacy", "Other"];

const upsertValidators = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("category")
    .optional()
    .isIn(categories)
    .withMessage(`Category must be one of: ${categories.join(", ")}`),
  body("description").optional({ checkFalsy: true }).trim().isString(),
  body("address").optional({ checkFalsy: true }).trim().isString(),
  body("phone").optional({ checkFalsy: true }).trim().isString(),
  body("hours").optional({ checkFalsy: true }).trim().isString(),
  body("coverImageUrl").optional({ checkFalsy: true }).isString(),
  body("latitude").optional().isFloat({ min: -90, max: 90 }).toFloat(),
  body("longitude").optional().isFloat({ min: -180, max: 180 }).toFloat(),
];

const idValidator = [param("id").isMongoId().withMessage("Invalid establishment id")];

router.get(
  "/",
  [query("category").optional().isIn(categories)],
  validateRequest,
  establishmentController.getEstablishments
);
router.get(
  "/mine",
  verifyToken,
  requireRole("admin", "professional"),
  establishmentController.getMyEstablishment
);
router.put(
  "/mine",
  verifyToken,
  requireRole("admin", "professional"),
  upsertValidators,
  validateRequest,
  establishmentController.upsertMyEstablishment
);
router.put(
  "/mine/image",
  verifyToken,
  requireRole("admin", "professional"),
  upload.single("image"),
  establishmentController.uploadEstablishmentImage
);
router.get("/:id", idValidator, validateRequest, establishmentController.getEstablishmentById);

module.exports = router;
