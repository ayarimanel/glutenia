const mongoose = require("mongoose");

const patientResourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: "" },
  body: { type: String, trim: true, default: "" },
  category: {
    type: String,
    enum: ["celiac", "diet", "safe", "lifestyle"],
    default: "celiac",
  },
  readTimeMinutes: { type: Number, default: 0, min: 0 },
  featured: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PatientResource", patientResourceSchema);
