const mongoose = require("mongoose");

const petSitterSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String },
  phoneNumber: { type: String },
  countryCode: { type: String, default: "+91" },
  password: { type: String },
  profilePicture: { type: String },
  gender: { type: String, enum: ["Male", "Female", "Others"] },
  dateOfBirth: { type: Date },
  address: {
    houseNo: { type: String },
    street: { type: String },
    locality: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String, default: "India" },
    pincode: { type: String },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
  },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneNumberVierified: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED", "BLOCKED", "INACTIVE"],
    default: "PENDING",
  },
  isDeleted: { type: Boolean, default: false },
  lastLogin: { type: Date },
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date },
});

petSitterSchema.pre("save", function (next) {
  this.updatedOn = Date.now();
  next();
});

petSitterSchema.pre(
  ["updateOne", "findOneAndUpdate", "update"],
  function (next) {
    this.set({ updatedOn: Date.now() });
    if (typeof next === "function") next();
  },
);

const petSitterModel = mongoose.model("PetSitterModel", petSitterSchema);

module.exports = petSitterModel;
