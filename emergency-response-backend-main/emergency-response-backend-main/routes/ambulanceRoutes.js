const express = require("express");

const {
  getAmbulances,
  getAvailableAmbulances,
} = require("../controllers/ambulanceController");

const router = express.Router();

router.get("/", getAmbulances);

router.get("/available", getAvailableAmbulances);

module.exports = router;