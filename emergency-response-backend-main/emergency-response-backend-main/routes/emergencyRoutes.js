const express = require("express");

const {
  createEmergency,
  getEmergencies,
  getEmergency,
} = require("../controllers/emergencyController");

const router = express.Router();

router.post("/", createEmergency);

router.get("/", getEmergencies);

router.get("/:id", getEmergency);

module.exports = router;