const emergencies = require("../data/emergencies");
const { predictTriage } = require("../services/mlService");
const ambulances = require("../data/ambulances");
const hospitals = require("../data/hospitals");

// Calculate straight-line distance between two GPS coordinates in kilometres.
function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const boundedA = Math.min(1, Math.max(0, a));

  return (
    earthRadiusKm * 2 * Math.atan2(Math.sqrt(boundedA), Math.sqrt(1 - boundedA))
  );
}

async function createEmergency(req, res) {
  try {
    const data = req.body || {};

    if (
      data.age === undefined ||
      data.age === null ||
      data.age === "" ||
      !data.emergency_type
    ) {
      return res.status(400).json({
        success: false,
        message: "Age and emergency type are required",
      });
    }

    // Patient data sent to the ML model.
    const patientData = {
      age: data.age,
      emergency_type: data.emergency_type,
      incident_location: data.incident_location || null,

      bleeding: data.bleeding ?? null,
      conscious: data.conscious ?? null,
      breathing: data.breathing ?? null,

      accident_level: data.accident_level ?? null,
      visible_fracture: data.visible_fracture ?? null,
      trapped: data.trapped ?? null,
      injury_type: data.injury_type ?? null,
      pain_level: data.pain_level ?? null,

      chest_pain: data.chest_pain ?? null,
      sweating: data.sweating ?? null,
      shortness_of_breath: data.shortness_of_breath ?? null,

      face_drooping: data.face_drooping ?? null,
      arm_weakness: data.arm_weakness ?? null,
      speech_difficulty: data.speech_difficulty ?? null,

      poison_type: data.poison_type ?? null,
      vomiting: data.vomiting ?? null,
      seizures: data.seizures ?? null,

      entry_exit_burn: data.entry_exit_burn ?? null,
      muscle_spasm: data.muscle_spasm ?? null,
      fall_after_shock: data.fall_after_shock ?? null,

      water_type: data.water_type ?? null,
      water_inhalation: data.water_inhalation ?? null,
      cpr_required: data.cpr_required ?? null,

      fall_height: data.fall_height ?? null,
      head_injury: data.head_injury ?? null,

      animal_type: data.animal_type ?? null,
      bite_location: data.bite_location ?? null,
      venomous: data.venomous ?? null,

      weapon_involved: data.weapon_involved ?? null,
      injury_location: data.injury_location ?? null,
      visible_injury: data.visible_injury ?? null,
    };

    // Get ML triage prediction.
    console.log("Sending patient data to ML model...");
    const mlResult = await predictTriage(patientData);
    const priority = mlResult.predicted_priority;

    console.log("ML Prediction:", priority);

    // Precautions based on predicted priority.
    let precautions = [];

    if (priority === "Non-Urgent") {
      precautions = [
        "Monitor the patient's symptoms and overall condition.",
        "Allow the patient to rest in a safe, comfortable position.",
        "Seek advice from a qualified healthcare professional if symptoms persist.",
        "Do not delay medical assessment if the condition worsens.",
        "Seek emergency help immediately if severe symptoms develop.",
      ];
    } else if (priority === "Urgent") {
      precautions = [
        "Arrange prompt medical assessment.",
        "Keep the patient safe and monitor their condition.",
        "Avoid unnecessary movement if a serious injury is suspected.",
        "Seek emergency help immediately if symptoms worsen.",
      ];
    } else if (priority === "Critical") {
      precautions = [
        "Treat this as a potential medical emergency and seek immediate assistance.",
        "Follow the emergency dispatcher's instructions.",
        "Monitor breathing and responsiveness.",
        "If the patient is unresponsive and not breathing normally, follow the dispatcher's CPR instructions.",
        "Do not give food, drink, or medication unless instructed by a qualified professional.",
      ];
    } else {
      precautions = [
        "Arrange assessment by a qualified healthcare professional.",
        "Do not rely on the model prediction alone to determine whether the patient is safe.",
        "Seek emergency help immediately if severe or rapidly worsening symptoms occur.",
      ];
    }

    // Read GPS coordinates from separate fields or "latitude, longitude".
    const locationMatch =
      typeof data.incident_location === "string"
        ? data.incident_location.match(
            /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/,
          )
        : null;

    const hasLatitude =
      data.latitude !== undefined &&
      data.latitude !== null &&
      data.latitude !== "";

    const hasLongitude =
      data.longitude !== undefined &&
      data.longitude !== null &&
      data.longitude !== "";

    const latitude = Number(hasLatitude ? data.latitude : locationMatch?.[1]);

    const longitude = Number(
      hasLongitude ? data.longitude : locationMatch?.[2],
    );

    const hasCoordinates =
      (hasLatitude || locationMatch !== null) &&
      (hasLongitude || locationMatch !== null) &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180;

    console.log("Incident GPS:", {
      hasCoordinates,
      latitude: hasCoordinates ? latitude : null,
      longitude: hasCoordinates ? longitude : null,
    });

    // Find available ambulances with valid GPS coordinates.
    const availableAmbulances = ambulances.filter((ambulance) => {
      const lat = Number(ambulance.latitude);
      const lon = Number(ambulance.longitude);

      return (
        ambulance.status === "Available" &&
        Number.isFinite(lat) &&
        Number.isFinite(lon) &&
        lat >= -90 &&
        lat <= 90 &&
        lon >= -180 &&
        lon <= 180
      );
    });

    let assignedAmbulance = null;
    let ambulanceDistanceKm = null;

    if (hasCoordinates && availableAmbulances.length > 0) {
      // Choose the nearest available ambulance.
      const nearest = availableAmbulances
        .map((ambulance) => ({
          ambulance,
          distance: calculateDistance(
            latitude,
            longitude,
            Number(ambulance.latitude),
            Number(ambulance.longitude),
          ),
        }))
        .sort((a, b) => a.distance - b.distance)[0];

      assignedAmbulance = nearest.ambulance;
      ambulanceDistanceKm = Number(nearest.distance.toFixed(2));
    } else if (!hasCoordinates) {
      // Demo fallback: assign the first available ambulance.
      // Distance remains null because the incident GPS is unknown.
      assignedAmbulance = availableAmbulances[0] || null;
    }

    // Select an available hospital.
    const assignedHospital =
      hospitals.find((hospital) => hospital.status === "Available") || null;

    // Mark the assigned ambulance busy for subsequent requests.
    if (assignedAmbulance) {
      assignedAmbulance.status = "Busy";
    }

    const dispatchStatus =
      assignedAmbulance && assignedHospital ? "Dispatched" : "Received";

    // Create emergency record.
    const emergency = {
      id: `EMG-${1001 + emergencies.length}`,

      patient_name: data.patient_name || "Emergency Patient",
      phone: data.phone || null,
      age: data.age,

      emergency_type: data.emergency_type,
      incident_location: data.incident_location || null,
      latitude: hasCoordinates ? latitude : null,
      longitude: hasCoordinates ? longitude : null,
      ambulance_distance_km: ambulanceDistanceKm,

      bleeding: data.bleeding ?? null,
      conscious: data.conscious ?? null,
      breathing: data.breathing ?? null,

      accident_level: data.accident_level ?? null,
      visible_fracture: data.visible_fracture ?? null,
      trapped: data.trapped ?? null,
      injury_type: data.injury_type ?? null,
      pain_level: data.pain_level ?? null,

      chest_pain: data.chest_pain ?? null,
      sweating: data.sweating ?? null,
      shortness_of_breath: data.shortness_of_breath ?? null,

      face_drooping: data.face_drooping ?? null,
      arm_weakness: data.arm_weakness ?? null,
      speech_difficulty: data.speech_difficulty ?? null,

      poison_type: data.poison_type ?? null,
      vomiting: data.vomiting ?? null,
      seizures: data.seizures ?? null,

      entry_exit_burn: data.entry_exit_burn ?? null,
      muscle_spasm: data.muscle_spasm ?? null,
      fall_after_shock: data.fall_after_shock ?? null,

      water_type: data.water_type ?? null,
      water_inhalation: data.water_inhalation ?? null,
      cpr_required: data.cpr_required ?? null,

      fall_height: data.fall_height ?? null,
      head_injury: data.head_injury ?? null,

      animal_type: data.animal_type ?? null,
      bite_location: data.bite_location ?? null,
      venomous: data.venomous ?? null,

      weapon_involved: data.weapon_involved ?? null,
      injury_location: data.injury_location ?? null,
      visible_injury: data.visible_injury ?? null,

      triage_priority: priority,
      triage_probabilities: mlResult.probabilities,
      precautions,

      status: dispatchStatus,
      ambulance_id: assignedAmbulance ? assignedAmbulance.id : null,
      hospital_id: assignedHospital ? assignedHospital.id : null,

      // Save snapshots so later status changes do not alter old records.
      ambulance_details: assignedAmbulance ? { ...assignedAmbulance } : null,
      hospital_details: assignedHospital ? { ...assignedHospital } : null,

      created_at: new Date().toISOString(),
    };

    emergencies.push(emergency);

    console.log("Ambulance assignment:", {
      emergencyId: emergency.id,
      ambulanceId: emergency.ambulance_id,
      distanceKm: emergency.ambulance_distance_km,
      status: emergency.status,
    });

    return res.status(201).json({
      success: true,
      message: "Emergency received and triage prediction completed",
      emergency,
      ml_prediction: {
        priority,
        probabilities: mlResult.probabilities,
        precautions,
      },
    });
  } catch (error) {
    console.error("Emergency creation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create emergency",
      error: error.message,
    });
  }
}

// Get all emergencies.
function getEmergencies(req, res) {
  return res.json({
    success: true,
    count: emergencies.length,
    emergencies,
  });
}

// Get one emergency by ID.
function getEmergency(req, res) {
  const emergency = emergencies.find((item) => item.id === req.params.id);

  if (!emergency) {
    return res.status(404).json({
      success: false,
      message: "Emergency not found",
    });
  }

  return res.json({
    success: true,
    emergency,
  });
}

module.exports = {
  createEmergency,
  getEmergencies,
  getEmergency,
};
