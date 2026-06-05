const petBuddyUsersModel = require("../models/petBuddyUsersModel");
const OTP = require("../models/OTP");
const { sendSignupOTP } = require("../utils/email");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const crypto = require("crypto");
const logger = require("../utils/logger");

const sendOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  confirmRestore: Joi.boolean().optional()
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
    "string.length": "OTP must be exactly 6 digits.",
    "string.pattern.base": "OTP must contain only numbers.",
  }),
});

const createUserSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().optional().allow(""),
  role: Joi.string().required(),
  city: Joi.string().optional().allow(""),
  state: Joi.string().optional().allow(""),
});

const updateUserSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  city: Joi.string().optional().allow(""),
  state: Joi.string().optional().allow(""),
  status: Joi.string().valid("Active", "Blocked").optional(),
  email: Joi.any().forbidden().messages({ "any.unknown": "Updating email is not allowed." }),
  phone: Joi.any().forbidden().messages({ "any.unknown": "Updating phone number is not allowed." }),
  role: Joi.any().forbidden().messages({ "any.unknown": "Updating role is not allowed." })
});

exports.sendOTP = async (req, res) => {
  try {
    const { error, value } = sendOtpSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const email = value.email.toLowerCase();
    const existingUser = await petBuddyUsersModel.findOne({ email });
    if (existingUser) {
      if (!existingUser.isDeleted) {
        return res.status(400).json({ error: `User is already registered with this email as ${existingUser.role.replace(/_/g, ' ')}.` });
      }

      // If user is deleted but confirmRestore is not true, ask for confirmation
      if (existingUser.isDeleted && !value.confirmRestore) {
        return res.status(409).json({
          error: "This user was previously deleted. Do you want to restore their account?",
          confirmRestoreRequired: true
        });
      }
    }

    // Generate 6-digit OTP (matching frontend expectation)
    const rawOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = crypto
      .createHash("sha256")
      .update(rawOTP)
      .digest("hex");

    await OTP.deleteMany({ email });
    await OTP.create({
      email,
      otp: hashedOTP,
      firstName: value.firstName,
      lastName: value.lastName,
    });

    await sendSignupOTP(email, rawOTP);
    logger.info(`Verification OTP sent successfully to ${email}`);

    return res.status(200).json({ message: "OTP sent successfully." });
  } catch (error) {
    logger.error(`Error in sendOTP: ${error.message}`);
    return res.status(500).json({ error: "Server error", message: error.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { error, value } = verifyOtpSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const email = value.email.toLowerCase();
    const hashedOTP = crypto.createHash("sha256").update(value.otp).digest("hex");
    const otpRecord = await OTP.findOne({ otp: hashedOTP, email });
    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    // Mark as verified
    otpRecord.isVerified = true;
    await otpRecord.save();

    // Check if user exists but is deleted, and send details to frontend so they can be bound to the form
    const existingUser = await petBuddyUsersModel.findOne({ email });
    let userData = null;
    if (existingUser && existingUser.isDeleted) {
      userData = {
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        phone: existingUser.phoneNumber,
        role: existingUser.role,
        city: existingUser.city,
        state: existingUser.state
      };
    }

    logger.info(`OTP verified successfully for ${email}`);
    return res.status(200).json({ 
      message: "OTP verified successfully.",
      user: userData
    });
  } catch (error) {
    logger.error(`Error in verifyOTP: ${error.message}`);
    return res.status(500).json({ error: "Server error", message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const email = value.email.toLowerCase();
    const existingUser = await petBuddyUsersModel.findOne({ email });
    if (existingUser && !existingUser.isDeleted) {
      return res.status(400).json({ error: `User is already registered with this email as ${existingUser.role.replace(/_/g, ' ')}.` });
    }

    // Check for a verified OTP record
    const verifiedOtp = await OTP.findOne({ email, isVerified: true });
    if (!verifiedOtp) {
      return res.status(400).json({ error: "Email not verified. Please verify the OTP before creating the user." });
    }

    // Generate random password for newly created admin users
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    let userToSave;

    if (existingUser && existingUser.isDeleted) {
      // Restore the soft-deleted user
      existingUser.firstName = value.firstName;
      existingUser.lastName = value.lastName;
      existingUser.phoneNumber = value.phone;
      existingUser.role = value.role;
      existingUser.city = value.city;
      existingUser.state = value.state;
      existingUser.password = hashedPassword;
      existingUser.isDeleted = false;
      existingUser.isActive = true;
      existingUser.isVerified = true;
      userToSave = existingUser;
    } else {
      userToSave = new petBuddyUsersModel({
        firstName: value.firstName,
        lastName: value.lastName,
        email: value.email,
        phoneNumber: value.phone,
        role: value.role,
        city: value.city,
        state: value.state,
        password: hashedPassword,
        isVerified: true,
        isActive: true,
      });
    }

    await userToSave.save();

    // Delete verified OTP after successful user creation
    await OTP.deleteOne({ _id: verifiedOtp._id });

    // Convert to response format expected by frontend
    const userRes = {
      id: userToSave._id,
      fullName: `${userToSave.firstName} ${userToSave.lastName}`,
      email: userToSave.email,
      phone: userToSave.phoneNumber,
      role: userToSave.role,
      status: userToSave.isActive ? "Active" : "Blocked",
      city: userToSave.city || "Unknown",
      state: userToSave.state || "NA",
      date: userToSave.createdAt ? userToSave.createdAt.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    };

    logger.info(`User created/restored: ${userToSave.email}`);
    return res.status(201).json({ message: "User created successfully", user: userRes });
  } catch (error) {
    logger.error(`Error in createUser: ${error.message}`);
    return res.status(500).json({ error: "Server error", message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    let query = { isDeleted: { $ne: true } };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ]
    };

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const total = await petBuddyUsersModel.countDocuments(query);
    const users = await petBuddyUsersModel.find(query)
      .sort({ firstName: 1, lastName: 1 })
      .skip(skip)
      .limit(limitNumber);

    const formattedUsers = users.map(user => ({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phoneNumber,
      role: user.role,
      status: user.isActive ? "Active" : "Blocked",
      city: user.city || "Unknown",
      state: user.state || "NA",
      date: user.createdAt ? user.createdAt.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    }));

    return res.status(200).json({
      data: formattedUsers,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    logger.error(`Error in getAllUsers: ${error.message}`);
    return res.status(500).json({ error: "Server error", message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await petBuddyUsersModel.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userRes = {
      id: user._id,
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phoneNumber,
      role: user.role,
      status: user.isActive ? "Active" : "Blocked",
      city: user.city || "Unknown",
      state: user.state || "NA",
      date: user.createdAt ? user.createdAt.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    };

    return res.status(200).json(userRes);
  } catch (error) {
    logger.error(`Error in getUserById: ${error.message}`);
    return res.status(500).json({ error: "Server error", message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await petBuddyUsersModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (value.firstName) user.firstName = value.firstName;
    if (value.lastName) user.lastName = value.lastName;
    if (value.city !== undefined) user.city = value.city;
    if (value.state !== undefined) user.state = value.state;
    if (value.status) user.isActive = value.status === "Active";

    await user.save();

    const userRes = {
      id: user._id,
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phoneNumber,
      role: user.role,
      status: user.isActive ? "Active" : "Blocked",
      city: user.city || "Unknown",
      state: user.state || "NA",
      date: user.createdAt ? user.createdAt.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    };

    return res.status(200).json({ message: "User updated successfully", user: userRes });
  } catch (error) {
    logger.error(`Error in updateUser: ${error.message}`);
    return res.status(500).json({ error: "Server error", message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await petBuddyUsersModel.findByIdAndUpdate(req.params.id, { isDeleted: true, isActive: false }, { new: true });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    logger.info(`User soft-deleted: ${user.email}`);
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    logger.error(`Error in deleteUser: ${error.message}`);
    return res.status(500).json({ error: "Server error", message: error.message });
  }
};
