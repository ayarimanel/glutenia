const express = require("express");
const { param, body } = require("express-validator");
const gamificationController = require("../controllers/gamification.controller");
const validateRequest = require("../middleware/validateRequest");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.get("/profile", verifyToken, gamificationController.getProfileGamification);

router.get("/home", verifyToken, gamificationController.getHomeGamification);

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
