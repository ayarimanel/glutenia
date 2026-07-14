const express = require("express");
const { body, param } = require("express-validator");
const recipeController = require("../controllers/recipe.controller");
const isAdmin = require("../middleware/isAdmin");
const validateRequest = require("../middleware/validateRequest");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

const CATEGORIES = ["Quick", "Tunisian", "Easy"];

const idValidator = [param("id").isMongoId().withMessage("Invalid recipe id")];

const createValidators = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("description").optional({ checkFalsy: true }).trim().isString(),
  body("category")
    .optional()
    .isIn(CATEGORIES)
    .withMessage(`Category must be one of: ${CATEGORIES.join(", ")}`),
  body("imageUrl").optional({ checkFalsy: true }).trim().isString(),
  body("calories").optional().isFloat({ min: 0 }).withMessage("Calories must be >= 0").toFloat(),
  body("carbo").optional().isFloat({ min: 0 }).withMessage("Carbs must be >= 0").toFloat(),
  body("protein").optional().isFloat({ min: 0 }).withMessage("Protein must be >= 0").toFloat(),
  body("popular").optional().isBoolean().withMessage("Popular must be true or false").toBoolean(),
  body("ingredients").optional().isArray().withMessage("Ingredients must be a list"),
  body("preparation").optional({ checkFalsy: true }).trim().isString(),
];

const updateValidators = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("description").optional({ checkFalsy: true }).trim().isString(),
  body("category")
    .optional()
    .isIn(CATEGORIES)
    .withMessage(`Category must be one of: ${CATEGORIES.join(", ")}`),
  body("imageUrl").optional({ checkFalsy: true }).trim().isString(),
  body("calories").optional().isFloat({ min: 0 }).withMessage("Calories must be >= 0").toFloat(),
  body("carbo").optional().isFloat({ min: 0 }).withMessage("Carbs must be >= 0").toFloat(),
  body("protein").optional().isFloat({ min: 0 }).withMessage("Protein must be >= 0").toFloat(),
  body("popular").optional().isBoolean().withMessage("Popular must be true or false").toBoolean(),
  body("ingredients").optional().isArray().withMessage("Ingredients must be a list"),
  body("preparation").optional({ checkFalsy: true }).trim().isString(),
];

router.get("/", recipeController.getRecipes);
router.get("/:id", idValidator, validateRequest, recipeController.getRecipeById);
router.post("/", verifyToken, isAdmin, createValidators, validateRequest, recipeController.createRecipe);
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  idValidator,
  updateValidators,
  validateRequest,
  recipeController.updateRecipe
);
router.delete("/:id", verifyToken, isAdmin, idValidator, validateRequest, recipeController.deleteRecipe);

module.exports = router;
