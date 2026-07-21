const express = require("express");
const { param, body } = require("express-validator");
const gamificationController = require("../controllers/gamification.controller");
const validateRequest = require("../middleware/validateRequest");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

// Profile summary
router.get("/profile", verifyToken, gamificationController.getProfileGamification);

// Lightweight payload for surfaces that load on every app open (Home strip)
router.get("/home", verifyToken, gamificationController.getHomeGamification);

// Full badge catalog
router.get("/badges", verifyToken, gamificationController.getBadgeCatalog);

// Badge pin with explicit boolean + 3-pin cap
router.put(
  "/badges/:badgeId/pin",
  verifyToken,
  [
    param("badgeId").isMongoId().withMessage("Invalid badge id"),
    body("isPinned").isBoolean().withMessage("isPinned must be a boolean"),
  ],
  validateRequest,
  gamificationController.updateBadgePin
);

module.exports = router;
