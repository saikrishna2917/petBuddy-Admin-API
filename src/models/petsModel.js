const mongoose = require("mongoose");

const petsSchema = new mongoose.Schema(
  {
    petOwnerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "petOwnerProfileModel",
      required: true,
    },
    petName: { type: String, require: true },
    petType: { type: String },
    breed: { type: String },
    gender: { type: String, enum: ["Male", "Female", "Others"] },
    age: { type: Number },
    weight: { type: String },
    color: { type: String },
    dateOfBirth: { type: Date },
    profilePicture: { type: String },
    vaccinationStatus: { type: Boolean, default: false },
    vaccinatedOn: { type: Date },
    medicalConditions: [String],
    allergies: [String],
    medications: [String],
    behaviorTraits: [String],
    foodPreferences: [String],
    emergencyNotes: { type: String },
    isNeutered: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

petsSchema.index({ petOwnerID: 1 });

const petsModel = mongoose.model("petsModel", petsSchema);

module.exports = petsModel;
