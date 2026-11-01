const express = require("express");

const {
  dispatch,
} = require("../controllers/dispatchController");

const router = express.Router();

router.post("/", dispatch);

module.exports = router;