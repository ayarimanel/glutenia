const express = require("express");
const { param, body } = require("express-validator");
const gamificationController = require("../controllers/gamification.controller");
const validateRequest = require("../middleware/validateRequest");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

const badgeIdValidator = [
  param("badgeId").isMongoId().withMessage("Invalid badge id"),
];

// Profile summary (before /me/* to avoid shadowing)
router.get("/profile", verifyToken, gamificationController.getProfileGamification);

// Catalogs (must come before /me to avoid route shadowing)
router.get("/badges", verifyToken, gamificationController.getBadgeCatalog);
router.get("/achievements", verifyToken, gamificationController.getAchievementCatalog);

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

// Current user's gamification data
router.get("/me", verifyToken, gamificationController.getMyGamification);
router.get("/me/badges", verifyToken, gamificationController.getMyBadges);
router.patch(
  "/me/badges/:badgeId/pin",
  verifyToken,
  badgeIdValidator,
  validateRequest,
  gamificationController.pinBadge
);
router.get("/me/achievements", verifyToken, gamificationController.getMyAchievements);

module.exports = router;
