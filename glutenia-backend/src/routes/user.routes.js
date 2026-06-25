const express = require("express");
const { param } = require("express-validator");
const userController = require("../controllers/user.controller");
const isAdmin = require("../middleware/isAdmin");
const validateRequest = require("../middleware/validateRequest");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

const idValidator = [param("id").isMongoId().withMessage("Invalid user id")];

router.get("/", verifyToken, isAdmin, userController.getUsers);
router.get(
  "/:id/orders",
  verifyToken,
  isAdmin,
  idValidator,
  validateRequest,
  userController.getUserOrders
);

module.exports = router;
