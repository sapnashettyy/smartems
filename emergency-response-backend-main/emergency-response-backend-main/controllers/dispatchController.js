const {
  dispatchEmergency,
} = require("../services/dispatchService");

function dispatch(req, res) {
  try {
    const {
      latitude,
      longitude,
      triage_priority,
    } = req.body;

    const result = dispatchEmergency({
      latitude: Number(latitude),
      longitude: Number(longitude),
      triagePriority: triage_priority || "Urgent",
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error("Dispatch error:", error);

    res.status(500).json({
      success: false,
      message: "Dispatch failed",
    });
  }
}

module.exports = {
  dispatch,
};