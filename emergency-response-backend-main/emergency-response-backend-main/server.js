const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const ambulanceRoutes = require("./routes/ambulanceRoutes");
const dispatchRoutes = require("./routes/dispatchRoutes");
const hospitalRoutes = require("./routes/hospitalRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Home
app.get("/", (req, res) => {
  res.json({
    message: "MedDispatch Backend is running",
    status: "success",
  });
});

// APIs
app.use("/api/auth", authRoutes);
app.use("/api/emergencies", emergencyRoutes);
app.use("/api/ambulances", ambulanceRoutes);
app.use("/api/dispatch", dispatchRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/ai", aiRoutes);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MedDispatch Backend running on port ${PORT}`);
});
