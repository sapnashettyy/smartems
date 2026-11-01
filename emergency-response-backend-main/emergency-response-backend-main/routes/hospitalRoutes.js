const express = require("express");

const {
  getHospitals,
  getAvailableHospitals,
} = require("../controllers/hospitalController");

const router = express.Router();

router.get("/", getHospitals);

router.get("/available", getAvailableHospitals);

module.exports = router;