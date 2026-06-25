const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  role: {
    type: String,
    enum: ["customer", "admin"],
    default: "customer",
  },
  role_type: {
    type: String,
    enum: ["warrior", "supporter"],
    default: null,
  },
  gluten_free_since: {
    type: Date,
    default: null,
  },
  experience_level: {
    type: String,
    enum: [
      "just_started",
      "1_to_6_months",
      "6_to_12_months",
      "1_to_3_years",
      "3_plus_years",
    ],
    default: null,
  },
  primary_goal: {
    type: String,
    enum: [
      "manage_celiac",
      "manage_intolerance",
      "support_child",
      "support_partner",
      "dietary_choice",
      "exploring",
    ],
    default: null,
  },
  eating_out_frequency: {
    type: String,
    enum: ["rarely", "few_times_month", "weekly", "multiple_week"],
    default: null,
  },
  confidence_identifying_gf: {
    type: String,
    enum: ["low", "medium", "high"],
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.set("toJSON", {
  transform(doc, ret) {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
