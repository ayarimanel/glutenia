const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/auth.controller");
const validateRequest = require("../middleware/validateRequest");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email")
      .isEmail()
      .withMessage("A valid email is required")
      .normalizeEmail(),
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
      .normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  authController.login
);

router.post(
  "/verify-email",
  [
    body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
    body("code")
      .isLength({ min: 6, max: 6 })
      .withMessage("Code must be 6 digits")
      .isNumeric()
      .withMessage("Code must be numeric"),
  ],
  validateRequest,
  authController.verifyEmail
);

router.post(
  "/resend-code",
  [body("email").isEmail().withMessage("A valid email is required").normalizeEmail()],
  validateRequest,
  authController.resendVerificationCode
);

router.get("/me", verifyToken, authController.getMe);

module.exports = router;
