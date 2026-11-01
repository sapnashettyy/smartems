const hospitals = require("../data/hospitals");

function getHospitals(req, res) {
  res.json({
    success: true,
    count: hospitals.length,
    hospitals,
  });
}

function getAvailableHospitals(req, res) {
  const available = hospitals.filter(
    (hospital) => hospital.status === "Available"
  );

  res.json({
    success: true,
    count: available.length,
    hospitals: available,
  });
}

module.exports = {
  getHospitals,
  getAvailableHospitals,
};