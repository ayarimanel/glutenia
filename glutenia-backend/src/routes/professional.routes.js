const express = require("express");
const { param, query } = require("express-validator");
const professionalController = require("../controllers/professional.controller");
const isAdmin = require("../middleware/isAdmin");
const validateRequest = require("../middleware/validateRequest");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

const idValidator = [param("id").isMongoId().withMessage("Invalid request id")];

router.get(
  "/requests",
  verifyToken,
  isAdmin,
  [query("status").optional().isIn(["pending", "approved", "rejected", "all"])],
  validateRequest,
  professionalController.getRequests
);
router.post(
  "/requests/:id/approve",
  verifyToken,
  isAdmin,
  idValidator,
  validateRequest,
  professionalController.approveRequest
);
router.post(
  "/requests/:id/reject",
  verifyToken,
  isAdmin,
  idValidator,
  validateRequest,
  professionalController.rejectRequest
);

module.exports = router;
