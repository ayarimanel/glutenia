const mongoose = require("mongoose");

const establishmentSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ["Supermarket", "Restaurant", "Health Store", "Bakery", "Pharmacy", "Other"],
    default: "Other",
  },
  description: {
    type: String,
    trim: true,
  },
  coverImageUrl: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  hours: {
    type: String,
    trim: true,
  },
  coordinates: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
  },
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Establishment", establishmentSchema);
