const express = require("express");
const { body, param } = require("express-validator");
const userController = require("../controllers/user.controller");
const isAdmin = require("../middleware/isAdmin");
const validateRequest = require("../middleware/validateRequest");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

const idValidator = [param("id").isMongoId().withMessage("Invalid user id")];

router.get("/", verifyToken, isAdmin, userController.getUsers);
router.get("/analytics", verifyToken, isAdmin, userController.getUserAnalytics);

// Current user's favorite map spots
router.get("/me/favorites", verifyToken, userController.getFavorites);
router.put("/me/favorites", verifyToken, userController.updateFavorites);

// Same email normalization as auth.routes.js so an admin edit can't create
// an address the login route would never match.
const NORMALIZE_EMAIL_OPTIONS = {
  gmail_remove_dots: false,
  gmail_remove_subaddress: false,
  outlookdotcom_remove_subaddress: false,
  yahoo_remove_subaddress: false,
  icloud_remove_subaddress: false,
};

const updateValidators = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("A valid email is required")
    .normalizeEmail(NORMALIZE_EMAIL_OPTIONS),
  body("phone")
    .optional({ checkFalsy: true })
    .matches(/^\+?[0-9][0-9\s-]{5,17}$/)
    .withMessage("Enter a valid phone number"),
];

router.get("/:id", verifyToken, isAdmin, idValidator, validateRequest, userController.getUserById);
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  idValidator,
  updateValidators,
  validateRequest,
  userController.updateUser
);
router.delete("/:id", verifyToken, isAdmin, idValidator, validateRequest, userController.deleteUser);

router.get(
  "/:id/orders",
  verifyToken,
  isAdmin,
  idValidator,
  validateRequest,
  userController.getUserOrders
);

module.exports = router;
