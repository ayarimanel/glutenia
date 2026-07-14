const express = require("express");
const { param } = require("express-validator");
const notificationController = require("../controllers/notification.controller");
const validateRequest = require("../middleware/validateRequest");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

const idValidator = [param("id").isMongoId().withMessage("Invalid notification id")];

router.get("/", verifyToken, notificationController.getMyNotifications);
router.put("/read-all", verifyToken, notificationController.markAllRead);
router.put(
  "/:id/read",
  verifyToken,
  idValidator,
  validateRequest,
  notificationController.markRead
);

module.exports = router;
