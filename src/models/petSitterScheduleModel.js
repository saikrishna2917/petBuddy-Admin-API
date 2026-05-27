const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  petSetterID: { type: String },
  title: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  availableTimeSlots: [
    {
      startTime: String,
      endTime: String,
    },
  ],
  availableDays: [String],
  availabilityType: {
    type: String,
    enum: ["Full-Time", "Part-Time", "Weekends"],
  },
  instantBookingEnabled: { type: Boolean },
  maxPetsPerDay: { type: Number },
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date },
});

scheduleSchema.pre("save", function (next) {
  this.updatedOn = Date.now();
  next();
});

scheduleSchema.pre(["updateOne", "findOneAndUpdate", "update"], function (next) {
  this.set({ updatedOn: Date.now() });
  if (typeof next === "function") next();
});

const petSitterScheduleModel = mongoose.model(
  "PetSitterScheduleModel",
  scheduleSchema,
);

module.exports = petSitterScheduleModel;
