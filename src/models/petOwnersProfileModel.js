const mongoose = require("mongoose");

const petOwnerProfileSchema = new mongoose.Schema({
    firstName: { type: String, trim: true },
    lastName: {type:String, trim: true},
    email: { type: String, required: true, lowercase:true},
    countryCode: {type:String, default: "+91"},
    phoneNumber: {type:String, required: true },
    password: {type:String, required: true},
    profilePicture: { type: String, default: ""},
    gender: { type: String, enum: ["Male", "Female", "Other"]},
    dateOfBirth: {type: Date},
    address:{
        houseNo: {type:String},
        street: {type:String},
        locality: {type:String},
        city: {type: String},
        state: {type: String},
        country: {type:String, default: "India"},
        pincode: {type: String},
        location: {
            type: { type: String, enum: ["Point"], default: "Point" },
            coordinates: { type: [Number], default: [0, 0] },
        },
    },
    emergencyContact: {
        name: { type: String },
        phoneNumber: { type: String },
        relation: {type:String},
    },
    isEmailVerified: { type: Boolean, default: false},
    isPhoneNumberVerified: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    status: { type:String, enum: ["ACTIVE", "BLOCKED", "INACTIVE"], default: "ACTIVE"},
    deviceToken: { type: String },
    lastLogin: { type: Date },
    isDeleted: { type: Boolean, default: false },
},{
    timestamps: true
});

petOwnerProfileSchema.index({ email: 1 });

petOwnerProfileSchema.index({ phoneNumber: 1 });

petOwnerProfileSchema.index({
  "address.location": "2dsphere",
});

const petOwnerProfileModel = mongoose.model("petOwnerProfileModel", petOwnerProfileSchema);

module.exports = petOwnerProfileModel;