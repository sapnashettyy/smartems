const ambulances = require("../data/ambulances");

function getAmbulances(req, res) {
  res.json({
    success: true,
    count: ambulances.length,
    ambulances,
  });
}

function getAvailableAmbulances(req, res) {
  const available = ambulances.filter(
    (ambulance) => ambulance.status === "Available"
  );

  res.json({
    success: true,
    count: available.length,
    ambulances: available,
  });
}

module.exports = {
  getAmbulances,
  getAvailableAmbulances,
};