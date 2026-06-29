const express = require("express");
const router = express.Router();
const { scanLabel } = require("../controllers/scan.controller");
const verifyToken = require("../middleware/verifyToken");

router.post("/label", verifyToken, scanLabel);

module.exports = router;
