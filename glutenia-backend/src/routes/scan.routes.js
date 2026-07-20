const express = require("express");
const router = express.Router();
const { scanLabel, getScanHistory } = require("../controllers/scan.controller");
const verifyToken = require("../middleware/verifyToken");

router.post("/label", verifyToken, scanLabel);
router.get("/history", verifyToken, getScanHistory);

module.exports = router;
