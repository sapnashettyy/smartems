const ambulances = require("../data/ambulances");
const hospitals = require("../data/hospitals");

// Calculate distance between two GPS coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Find nearest available ambulance
function findNearestAmbulance(latitude, longitude) {
  const availableAmbulances = ambulances.filter(
    (ambulance) => ambulance.status === "Available"
  );

  if (availableAmbulances.length === 0) {
    return null;
  }

  let nearestAmbulance = null;
  let shortestDistance = Infinity;

  for (const ambulance of availableAmbulances) {
    const distance = calculateDistance(
      latitude,
      longitude,
      ambulance.latitude,
      ambulance.longitude
    );

    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestAmbulance = ambulance;
    }
  }

  return {
    ambulance: nearestAmbulance,
    distance_km: Number(shortestDistance.toFixed(2)),
  };
}

// Find suitable hospital
function findSuitableHospital(triagePriority) {
  const availableHospitals = hospitals.filter(
    (hospital) => hospital.status === "Available"
  );

  if (availableHospitals.length === 0) {
    return null;
  }

  if (triagePriority === "Critical") {
    const icuHospital = availableHospitals.find(
      (hospital) =>
        hospital.emergency &&
        hospital.emergency
          .toLowerCase()
          .includes("icu")
    );

    if (icuHospital) {
      return icuHospital;
    }
  }

  return availableHospitals.find(
    (hospital) =>
      hospital.emergency &&
      hospital.emergency
        .toLowerCase()
        .includes("emergency")
  ) || availableHospitals[0];
}

// Complete dispatch
function dispatchEmergency({
  latitude,
  longitude,
  triagePriority,
}) {
  if (
    latitude === undefined ||
    longitude === undefined
  ) {
    return {
      success: false,
      message:
        "Patient latitude and longitude are required",
    };
  }

  const nearestAmbulance =
    findNearestAmbulance(
      latitude,
      longitude
    );

  if (!nearestAmbulance) {
    return {
      success: false,
      message: "No available ambulance",
    };
  }

  const hospital =
    findSuitableHospital(triagePriority);

  if (!hospital) {
    return {
      success: false,
      message: "No available hospital",
    };
  }

  // Change ambulance status
  nearestAmbulance.ambulance.status = "Busy";

  return {
    success: true,

    ambulance: {
      id: nearestAmbulance.ambulance.id,
      driver: nearestAmbulance.ambulance.driver,
      phone: nearestAmbulance.ambulance.phone,
      distance_km:
        nearestAmbulance.distance_km,
      status:
        nearestAmbulance.ambulance.status,
    },

    hospital: {
      id: hospital.id,
      name: hospital.name,
      location: hospital.location,
      emergency: hospital.emergency,
      status: hospital.status,
    },

    triage_priority: triagePriority,

    dispatch_status: "Dispatched",
  };
}

module.exports = {
  calculateDistance,
  findNearestAmbulance,
  findSuitableHospital,
  dispatchEmergency,
};