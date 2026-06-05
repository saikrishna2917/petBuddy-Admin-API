const petBuddyUsersModel = require("../models/petBuddyUsersModel");
const OTP = require("../models/OTP");
const { sendPasswordResetOTP, sendSignupOTP } = require("../utils/email");
const Joi = require("joi");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const logger = require("../utils/logger");
const generateToken = require("../utils/generateToken");

// Joi Validation Schemas
const signupSchema = Joi.object({
  password: Joi.string()
    .min(8)
    .pattern(new RegExp("(?=.*[a-z])"))
    .pattern(new RegExp("(?=.*[A-Z])"))
    .pattern(new RegExp("(?=.*[0-9])"))
    .pattern(new RegExp("(?=.*[!@#\\$%\\^&\\*])"))
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters long.",
      "string.pattern.base":
        "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
    }),
  confirmPassword: Joi.any().equal(Joi.ref("password")).required().messages({
    "any.only": "Confirm Password does not match Password.",
  }),
  otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.length": "OTP must be exactly 6 digits.",
      "string.pattern.base": "OTP must contain only numbers.",
    }),
});

const sendSignupOTPSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.length": "OTP must be exactly 6 digits.",
      "string.pattern.base": "OTP must contain only numbers.",
    }),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp("(?=.*[a-z])"))
    .pattern(new RegExp("(?=.*[A-Z])"))
    .pattern(new RegExp("(?=.*[0-9])"))
    .pattern(new RegExp("(?=.*[!@#\\$%\\^&\\*])"))
    .required(),
  confirmPassword: Joi.any().equal(Joi.ref("password")).required().messages({
    "any.only": "Confirm Password does not match Password.",
  }),
});

const updateAdminSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  phoneNumber: Joi.string().optional().allow(""),
  profilePicture: Joi.string().optional().allow(""),
});

/**
 * @function checkRegistration
 * @description Checks if any admin account exists in the database. Used to determine whether to show the signup or login page.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<Object>} JSON response containing a boolean `registered` flag and a message.
 */
exports.checkRegistration = async (req, res) => {
  try {
    logger.info("Checking admin registration status");
    const adminCount = await petBuddyUsersModel.countDocuments({
      role: "SUPER_ADMIN",
    });
    if (adminCount === 0) {
      logger.info("Super-Admin registration check: no admin registered yet");
      return res.status(200).json({
        success: false,
        // message: "No admin account exists. Please sign up.",
      });
    }
    logger.info("Super-Admin registration check: admin account already exists");
    return res.status(200).json({
      success: true,
      // message: "Super-Admin account already exists.",
    });
  } catch (error) {
    logger.error(`Error checking admin registration status: ${error.message}`);
    return res.status(500).json({
      error: "Server error",
      message: error.message,
      stack: error.stack,
    });
  }
};

/**
 * @function sendSignupOTP
 * @description Sends a 6-digit OTP to verify email before admin signup.
 * @param {Object} req - Express request object containing `email`.
 * @param {Object} res - Express response object.
 * @returns {Promise<Object>} JSON response indicating success or error.
 */
exports.sendSignupOTP = async (req, res) => {
  try {
    logger.info("Request received to send admin signup OTP");
    const { error, value } = sendSignupOTPSchema.validate(req.body);
    if (error) {
      logger.warn(
        `Signup OTP request validation failed: ${error.details[0].message}`,
      );
      return res.status(400).json({ error: error.details[0].message });
    }

    const email = value.email.toLowerCase();
    logger.info(`Sending signup OTP to email: ${email}`);

    const adminCount = await petBuddyUsersModel.countDocuments({
      role: "SUPER_ADMIN",
    });
    if (adminCount > 0) {
      logger.warn(
        `Signup OTP request denied for ${email}. Super-Admin already exists.`,
      );
      return res
        .status(403)
        .json({ error: "An Super-Admin account already exists." });
    }

    // Generate 6-digit OTP
    const rawOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = crypto.createHash("sha256").update(rawOTP).digest("hex");

    // Remove any existing OTP for this email
    await OTP.deleteMany({ email });

    await OTP.create({
      email,
      otp: hashedOTP,
      firstName: value.firstName,
      lastName: value.lastName,
    });

    await sendSignupOTP(email, rawOTP);
    logger.info(`Verification OTP sent successfully to ${email}`);

    return res
      .status(200)
      .json({ message: "Verification OTP sent successfully." });
  } catch (error) {
    logger.error(`Error sending signup OTP: ${error.message}`);
    return res.status(500).json({
      error: "Server error",
      message: error.message,
      stack: error.stack,
    });
  }
};

/**
 * @function signup
 * @description Registers the first and only admin account for the PetBuddy system. Validates input schema including strict password complexity.
 * @param {Object} req - Express request object containing `firstName`, `lastName`, `email`, `password`, and `confirmPassword`.
 * @param {Object} res - Express response object.
 * @returns {Promise<Object>} JSON response indicating success or error.
 */
exports.signup = async (req, res) => {
  try {
    logger.info("Attempting admin account signup");
    // 1. Check if admin already exists
    const adminCount = await petBuddyUsersModel.countDocuments({
      role: "SUPER_ADMIN",
    });
    if (adminCount > 0) {
      logger.warn("Signup denied: An Super-Admin account already exists.");
      return res
        .status(403)
        .json({ error: "An Super-Admin account already exists." });
    }

    // 2. Validate request body
    const { error, value } = signupSchema.validate(req.body);
    if (error) {
      logger.warn(`Signup validation failed: ${error.details[0].message}`);
      return res.status(400).json({ error: error.details[0].message });
    }

    // 3. Verify OTP
    const hashedOTP = crypto
      .createHash("sha256")
      .update(value.otp)
      .digest("hex");

    const otpRecord = await OTP.findOne({ otp: hashedOTP });
    if (!otpRecord) {
      logger.warn("Signup failed: Invalid or expired OTP provided");
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    // Verify email is not registered yet (in case they verified but another admin was created)
    const existingAdmin = await petBuddyUsersModel.findOne({
      email: otpRecord.email,
    });
    if (existingAdmin) {
      logger.warn(
        `Signup failed: Super-Admin with email ${otpRecord.email} already exists`,
      );
      return res.status(403).json({
        error: "An Super-Admin account with this email already exists.",
      });
    }

    // 4. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(value.password, salt);

    // 5. Create Super-Admin
    const admin = new petBuddyUsersModel({
      firstName: otpRecord.firstName,
      lastName: otpRecord.lastName,
      email: otpRecord.email,
      password: hashedPassword,
      isVerified: true,
    });
    await admin.save();
    logger.info(
      `Super-Admin account created successfully for: ${otpRecord.email}`,
    );

    // Delete OTP after successful signup
    await OTP.deleteOne({ _id: otpRecord._id });

    return res
      .status(201)
      .json({ message: "Super-Admin account created successfully." });
  } catch (error) {
    logger.error(`Error in admin signup: ${error.message}`);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email already in use." });
    }
    return res.status(500).json({
      error: "Server error",
      message: error.message,
      stack: error.stack,
    });
  }
};

/**
 * @function login
 * @description Authenticates an admin using email and password. Generates a JWT and sets an HTTP-only cookie for session management.
 * @param {Object} req - Express request object containing `email` and `password`.
 * @param {Object} res - Express response object.
 * @returns {Promise<Object>} JSON response containing the auth token and admin details.
 */
exports.login = async (req, res) => {
  try {
    logger.info("Attempting admin account login");
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      logger.warn(`Login validation failed: ${error.details[0].message}`);
      return res.status(400).json({ error: error.details[0].message });
    }

    const email = value.email.toLowerCase();
    const petBuddyUsers = await petBuddyUsersModel.findOne({
      email,
      isDeleted: { $ne: true },
    });
    if (!petBuddyUsers) {
      logger.warn(
        `Login failed: Super-Admin user not found with email: ${email}`,
      );
      return res
        .status(401)
        .json({ error: `User not found with this email, ${value.email}` });
    }

    const isMatch = await bcrypt.compare(
      value.password,
      petBuddyUsers.password,
    );
    if (!isMatch) {
      logger.warn(`Login failed: Incorrect password for admin: ${email}`);
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = await generateToken(
      petBuddyUsers._id,
      petBuddyUsers.role,
      petBuddyUsers.firstName,
      petBuddyUsers.lastName,
    );

    // Update last login
    petBuddyUsers.lastLogin = Date.now();
    await petBuddyUsers.save();
    logger.info(
      `Super-Admin login successful. Session token generated for Super-Admin ID: ${petBuddyUsers._id}`,
    );

    // Set HTTP-Only Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // Required for sameSite: 'none'
      sameSite: "none", // Required for cross-origin requests
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      admin: {
        id: petBuddyUsers._id,
        firstName: petBuddyUsers.firstName,
        lastName: petBuddyUsers.lastName,
        email: petBuddyUsers.email,
        role: petBuddyUsers.role,
      },
    });
  } catch (error) {
    logger.error(`Error in admin login: ${error.message}`);
    return res.status(500).json({
      error: "Server error",
      message: error.message,
      stack: error.stack,
    });
  }
};

/**
 * @function forgotPassword
 * @description Initiates the password reset flow. Generates a reset token, saves its hash to the DB, and sends the raw token via an Ethereal mock email.
 * @param {Object} req - Express request object containing `email`.
 * @param {Object} res - Express response object.
 * @returns {Promise<Object>} JSON response with a success message (does not reveal if email exists for security).
 */
exports.forgotPassword = async (req, res) => {
  try {
    logger.info(
      "Request received for admin forgot password / password reset OTP",
    );
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      logger.warn(
        `Forgot password request validation failed: ${error.details[0].message}`,
      );
      return res.status(400).json({ error: error.details[0].message });
    }

    const email = value.email.toLowerCase();
    const admin = await petBuddyUsersModel.findOne({ email });
    if (!admin) {
      logger.info(`Forgot password request for unregistered email: ${email}`);
      // Return success even if not found to prevent email enumeration
      return res.status(200).json({
        message:
          "If that email is registered, a password reset link has been sent.",
      });
    }

    // Generate 6-digit OTP
    const rawOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = crypto.createHash("sha256").update(rawOTP).digest("hex");

    // Save Token
    await OTP.create({
      email: admin.email,
      otp: hashedOTP,
    });

    // Send Email (send raw OTP, keep hashed in DB)
    await sendPasswordResetOTP(admin.email, rawOTP);
    logger.info(
      `Password reset OTP generated and sent successfully to ${email}`,
    );

    return res.status(200).json({
      message:
        "If that email is registered, a password reset link has been sent.",
    });
  } catch (error) {
    logger.error(`Error in admin forgotPassword: ${error.message}`);
    return res.status(500).json({
      error: "Server error",
      message: error.message,
      stack: error.stack,
    });
  }
};

/**
 * @function resetPassword
 * @description Resets the admin's password using a valid reset token. Updates the password in the database and invalidates the token.
 * @param {Object} req - Express request object containing `token`, `password`, and `confirmPassword`.
 * @param {Object} res - Express response object.
 * @returns {Promise<Object>} JSON response indicating success or failure.
 */
exports.resetPassword = async (req, res) => {
  try {
    logger.info("Attempting admin password reset with OTP verification");
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      logger.warn(
        `Password reset validation failed: ${error.details[0].message}`,
      );
      return res.status(400).json({ error: error.details[0].message });
    }

    const hashedOTP = crypto
      .createHash("sha256")
      .update(value.otp)
      .digest("hex");

    const resetRecord = await OTP.findOne({ otp: hashedOTP });
    if (!resetRecord) {
      logger.warn("Password reset failed: Invalid or expired OTP provided");
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    const admin = await petBuddyUsersModel.findOne({
      email: resetRecord.email,
    });
    if (!admin) {
      logger.warn(
        `Password reset failed: Super-Admin not found for email ${resetRecord.email}`,
      );
      return res.status(400).json({ error: "Super-Admin not found." });
    }

    // Hash New Password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(value.password, salt);
    admin.passwordChangedAt = Date.now();
    await admin.save();
    logger.info(
      `Password has been successfully reset for admin email: ${resetRecord.email}`,
    );

    // Delete token after use
    await OTP.deleteOne({ _id: resetRecord._id });

    return res
      .status(200)
      .json({ message: "Password has been successfully reset." });
  } catch (error) {
    logger.error(`Error in admin resetPassword: ${error.message}`);
    return res.status(500).json({
      error: "Server error",
      message: error.message,
      stack: error.stack,
    });
  }
};

/**
 * @function logout
 * @description Terminates the current admin session by clearing the HTTP-only JWT cookie.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response indicating logout was successful.
 */
exports.logout = (req, res) => {
  logger.info("Super-Admin logging out. Clearing token cookie.");
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  return res.status(200).json({ message: "Logout successful." });
};

/**
 * @function updateAdmin
 * @description Updates the authenticated admin's profile details.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<Object>} JSON response with updated admin details.
 */
exports.updateAdmin = async (req, res) => {
  try {
    logger.info("Attempting to update admin profile");
    const { error, value } = updateAdminSchema.validate(req.body);
    if (error) {
      logger.warn(
        `Update admin validation failed: ${error.details[0].message}`,
      );
      return res.status(400).json({ error: error.details[0].message });
    }

    const admin = req.admin; // Provided by authMiddleware
    logger.info(`Updating admin details for Admin ID: ${admin._id}`);

    if (value.firstName) admin.firstName = value.firstName;
    if (value.lastName) admin.lastName = value.lastName;
    if (value.phoneNumber !== undefined) admin.phoneNumber = value.phoneNumber;
    if (value.profilePicture !== undefined)
      admin.profilePicture = value.profilePicture;

    await admin.save();
    logger.info(
      `Admin profile updated successfully for Admin ID: ${admin._id}`,
    );

    return res.status(200).json({
      message: "Profile updated successfully.",
      admin: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        phoneNumber: admin.phoneNumber,
        profilePicture: admin.profilePicture,
        role: admin.role,
      },
    });
  } catch (error) {
    logger.error(`Error updating admin details: ${error.message}`);
    return res.status(500).json({
      error: "Server error",
      message: error.message,
      stack: error.stack,
    });
  }
};
