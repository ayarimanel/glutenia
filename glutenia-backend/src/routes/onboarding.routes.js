const express = require("express");
const { body } = require("express-validator");
const onboardingController = require("../controllers/onboarding.controller");
const validateRequest = require("../middleware/validateRequest");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

const ROLE_TYPES = ["warrior", "supporter"];
const EXPERIENCE_LEVELS = [
  "just_started",
  "1_to_6_months",
  "6_to_12_months",
  "1_to_3_years",
  "3_plus_years",
];
const PRIMARY_GOALS = [
  "manage_celiac",
  "manage_intolerance",
  "support_child",
  "support_partner",
  "dietary_choice",
  "exploring",
];
const EATING_FREQUENCIES = ["rarely", "few_times_month", "weekly", "multiple_week"];
const CONFIDENCE_LEVELS = ["low", "medium", "high"];

router.post(
  "/",
  verifyToken,
  [
    body("role_type")
      .isIn(ROLE_TYPES)
      .withMessage(`role_type must be one of: ${ROLE_TYPES.join(", ")}`),
    body("gluten_free_since")
      .optional({ nullable: true })
      .isISO8601()
      .withMessage("gluten_free_since must be a valid ISO 8601 date")
      .toDate(),
    body("experience_level")
      .isIn(EXPERIENCE_LEVELS)
      .withMessage(`experience_level must be one of: ${EXPERIENCE_LEVELS.join(", ")}`),
    body("primary_goal")
      .isIn(PRIMARY_GOALS)
      .withMessage(`primary_goal must be one of: ${PRIMARY_GOALS.join(", ")}`),
    body("eating_out_frequency")
      .isIn(EATING_FREQUENCIES)
      .withMessage(`eating_out_frequency must be one of: ${EATING_FREQUENCIES.join(", ")}`),
    body("confidence_identifying_gf")
      .isIn(CONFIDENCE_LEVELS)
      .withMessage(`confidence_identifying_gf must be one of: ${CONFIDENCE_LEVELS.join(", ")}`),
  ],
  validateRequest,
  onboardingController.completeOnboarding
);

router.put(
  "/profile",
  verifyToken,
  [
    body("roleType")
      .isIn(ROLE_TYPES)
      .withMessage(`roleType must be one of: ${ROLE_TYPES.join(", ")}`),
    body("glutenFreeSince")
      .optional({ nullable: true })
      .isISO8601()
      .withMessage("glutenFreeSince must be a valid ISO 8601 date")
      .toDate(),
    body("experienceLevel")
      .optional()
      .isIn(EXPERIENCE_LEVELS)
      .withMessage(`experienceLevel must be one of: ${EXPERIENCE_LEVELS.join(", ")}`),
    body("primaryGoal")
      .optional()
      .isIn(PRIMARY_GOALS)
      .withMessage(`primaryGoal must be one of: ${PRIMARY_GOALS.join(", ")}`),
    body("eatingOutFrequency")
      .optional()
      .isIn(EATING_FREQUENCIES)
      .withMessage(`eatingOutFrequency must be one of: ${EATING_FREQUENCIES.join(", ")}`),
    body("confidenceIdentifyingGf")
      .optional()
      .isIn(CONFIDENCE_LEVELS)
      .withMessage(`confidenceIdentifyingGf must be one of: ${CONFIDENCE_LEVELS.join(", ")}`),
  ],
  validateRequest,
  onboardingController.completeProfileOnboarding
);

module.exports = router;
