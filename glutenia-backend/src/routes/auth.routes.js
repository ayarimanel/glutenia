const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/auth.controller");
const validateRequest = require("../middleware/validateRequest");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

// Only lowercase/trim the address — the default normalizeEmail() rules also
// strip Gmail dots and "+tag" subaddressing, which silently collapses
// visually distinct addresses onto the same account and caused false
// "email already taken" conflicts.
const NORMALIZE_EMAIL_OPTIONS = {
  gmail_remove_dots: false,
  gmail_remove_subaddress: false,
  outlookdotcom_remove_subaddress: false,
  yahoo_remove_subaddress: false,
  icloud_remove_subaddress: false,
};

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email")
      .isEmail()
      .withMessage("A valid email is required")
      .normalizeEmail(NORMALIZE_EMAIL_OPTIONS),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .optional()
      .isIn(["customer", "professional"])
      .withMessage("Role must be customer or professional"),
  ],
  validateRequest,
  authController.register
);

router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("A valid email is required")
      .normalizeEmail(NORMALIZE_EMAIL_OPTIONS),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  authController.login
);

router.get("/me", verifyToken, authController.getMe);

router.put(
  "/me",
  verifyToken,
  [
    body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
    body("avatar").optional({ checkFalsy: true }).isString(),
  ],
  validateRequest,
  authController.updateProfile
);

router.put(
  "/change-password",
  verifyToken,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  validateRequest,
  authController.changePassword
);

module.exports = router;
