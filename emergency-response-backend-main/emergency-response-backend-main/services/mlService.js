const ML_API_URL = "http://127.0.0.1:8000/predict";
const ML_ROOT_URL = "http://127.0.0.1:8000/";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function predictTriage(patientData) {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`ML prediction attempt ${attempt}/3`);

      // Wake the free Render ML service if it is sleeping
      try {
        await fetch(ML_ROOT_URL);
      } catch (wakeError) {
        console.log("ML wake request:", wakeError.message);
      }

      const response = await fetch(ML_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patientData),
      });

      const text = await response.text();

      console.log("ML API Status:", response.status);
      console.log("ML API Response:", text.substring(0, 300));

      let result;

      try {
        result = JSON.parse(text);
      } catch (parseError) {
        throw new Error("ML API returned non-JSON response");
      }

      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "ML prediction failed");
      }

      console.log("ML Prediction:", result.predicted_priority);

      return result;
    } catch (error) {
      lastError = error;

      console.error(`ML attempt ${attempt} failed:`, error.message);

      if (attempt < 3) {
        console.log("Retrying ML API...");
        await sleep(3000);
      }
    }
  }

  console.error("ML API failed after 3 attempts:", lastError);

  throw lastError;
}

module.exports = {
  predictTriage,
};
