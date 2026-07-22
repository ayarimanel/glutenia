const express = require("express");
const { body, param } = require("express-validator");
const patientResourceController = require("../controllers/patientResource.controller");
const isAdmin = require("../middleware/isAdmin");
const validateRequest = require("../middleware/validateRequest");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

const CATEGORIES = ["celiac", "diet", "safe", "lifestyle"];

const idValidator = [param("id").isMongoId().withMessage("Invalid patient resource id")];

const createValidators = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("description").optional({ checkFalsy: true }).trim().isString(),
  body("body").optional({ checkFalsy: true }).trim().isString(),
  body("category")
    .optional()
    .isIn(CATEGORIES)
    .withMessage(`Category must be one of: ${CATEGORIES.join(", ")}`),
  body("readTimeMinutes")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Read time must be >= 0")
    .toInt(),
  body("featured").optional().isBoolean().withMessage("Featured must be true or false").toBoolean(),
];

const updateValidators = [
  body("title").optional().trim().notEmpty().withMessage("Title cannot be empty"),
  body("description").optional({ checkFalsy: true }).trim().isString(),
  body("body").optional({ checkFalsy: true }).trim().isString(),
  body("category")
    .optional()
    .isIn(CATEGORIES)
    .withMessage(`Category must be one of: ${CATEGORIES.join(", ")}`),
  body("readTimeMinutes")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Read time must be >= 0")
    .toInt(),
  body("featured").optional().isBoolean().withMessage("Featured must be true or false").toBoolean(),
];

router.get("/", patientResourceController.getPatientResources);
router.get("/:id", idValidator, validateRequest, patientResourceController.getPatientResourceById);
router.post(
  "/",
  verifyToken,
  isAdmin,
  createValidators,
  validateRequest,
  patientResourceController.createPatientResource
);
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  idValidator,
  updateValidators,
  validateRequest,
  patientResourceController.updatePatientResource
);
router.delete(
  "/:id",
  verifyToken,
  isAdmin,
  idValidator,
  validateRequest,
  patientResourceController.deletePatientResource
);

module.exports = router;
