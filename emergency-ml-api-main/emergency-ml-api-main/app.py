from flask import Flask, request, jsonify
from flask_cors import CORS

import pandas as pd
import joblib
import os


# ============================================================
# FLASK APP
# ============================================================

app = Flask(__name__)
CORS(app)


# ============================================================
# MODEL FILES
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "final_lightgbm.pkl")
PREPROCESSOR_PATH = os.path.join(BASE_DIR, "preprocessor.pkl")
CLASSES_PATH = os.path.join(BASE_DIR, "classes.pkl")
FEATURES_PATH = os.path.join(BASE_DIR, "model_features.pkl")


# ============================================================
# LOAD MODEL
# ============================================================

print("Loading ML model...")

final_lightgbm = joblib.load(MODEL_PATH)
preprocessor = joblib.load(PREPROCESSOR_PATH)
classes = joblib.load(CLASSES_PATH)
model_features = joblib.load(FEATURES_PATH)

print("Model loaded successfully.")
print("Classes:", classes)
print("Number of features:", len(model_features))


# ============================================================
# HOME / HEALTH CHECK
# ============================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "status": "success",
        "message": "Emergency Triage ML API is running",
        "model": "LightGBM V3",
        "features": len(model_features),
        "classes": [str(c) for c in classes]
    })


# ============================================================
# TRIAGE PREDICTION
# ============================================================

@app.route("/predict", methods=["POST"])
def predict():

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "status": "error",
                "message": "No patient data received"
            }), 400

        # Create patient data using the exact
        # model feature order
        patient_data = {}

        for feature in model_features:
            patient_data[feature] = data.get(feature, None)

        patient_df = pd.DataFrame(
            [patient_data],
            columns=model_features
        )

        print("\nPatient received:")
        print(patient_df)

        # Preprocessing
        processed_data = preprocessor.transform(
            patient_df
        )

        # Prediction
        prediction = final_lightgbm.predict(
            processed_data
        )[0]

        # Prediction probabilities
        probabilities = final_lightgbm.predict_proba(
            processed_data
        )[0]

        probability_result = {}

        for class_name, probability in zip(
            classes,
            probabilities
        ):
            probability_result[str(class_name)] = float(
                probability
            )

        result = {
            "status": "success",
            "predicted_priority": str(prediction),
            "probabilities": probability_result
        }

        print("\nAI TRIAGE RESULT")
        print("-----------------------------")
        print("Priority:", prediction)

        for class_name, probability in probability_result.items():
            print(
                f"{class_name}: "
                f"{probability * 100:.2f}%"
            )

        return jsonify(result)

    except Exception as e:

        print("\nPrediction error:")
        print(str(e))

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    print("\n==========================================")
    print("Emergency Triage ML API")
    print("==========================================")
    print("Server: http://0.0.0.0:8000")
    print("==========================================\n")

    app.run(
        host="0.0.0.0",
        port=8000,
        debug=False
    )