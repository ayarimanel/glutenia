const express = require("express");
const { body, param } = require("express-validator");
const jwt = require("jsonwebtoken");
const eventController = require("../controllers/event.controller");
const isAdmin = require("../middleware/isAdmin");
const validateRequest = require("../middleware/validateRequest");
const verifyToken = require("../middleware/verifyToken");
const { getJwtSecret } = require("../config/auth");

const router = express.Router();

const CATEGORIES = ["Meetups", "Classes", "Markets", "Workshops"];

const idValidator = [param("id").isMongoId().withMessage("Invalid event id")];

const createValidators = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("description").optional({ checkFalsy: true }).trim().isString(),
  body("date").trim().notEmpty().withMessage("Date is required"),
  body("location").trim().notEmpty().withMessage("Location is required"),
  body("category").isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(", ")}`),
  body("price").optional().isFloat({ min: 0 }).withMessage("Price must be >= 0").toFloat(),
  body("emoji").optional({ checkFalsy: true }).trim().isString(),
  body("color").optional({ checkFalsy: true }).trim().isString(),
];

const updateValidators = [
  body("title").optional().trim().notEmpty().withMessage("Title cannot be empty"),
  body("description").optional({ checkFalsy: true }).trim().isString(),
  body("date").optional().trim().notEmpty().withMessage("Date cannot be empty"),
  body("location").optional().trim().notEmpty().withMessage("Location cannot be empty"),
  body("category").optional().isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(", ")}`),
  body("price").optional().isFloat({ min: 0 }).withMessage("Price must be >= 0").toFloat(),
  body("emoji").optional({ checkFalsy: true }).trim().isString(),
  body("color").optional({ checkFalsy: true }).trim().isString(),
];

// Attaches req.user if a valid Bearer token is present, but never blocks the request
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(authHeader.split(" ")[1], getJwtSecret());
    } catch {
      // ignore invalid token — request proceeds without user
    }
  }
  next();
};

router.get("/", optionalAuth, eventController.getEvents);
router.get("/:id", idValidator, validateRequest, optionalAuth, eventController.getEventById);
router.post("/", verifyToken, isAdmin, createValidators, validateRequest, eventController.createEvent);
router.put("/:id", verifyToken, isAdmin, idValidator, updateValidators, validateRequest, eventController.updateEvent);
router.delete("/:id", verifyToken, isAdmin, idValidator, validateRequest, eventController.deleteEvent);
router.post("/:id/rsvp", verifyToken, idValidator, validateRequest, eventController.rsvp);

module.exports = router;
