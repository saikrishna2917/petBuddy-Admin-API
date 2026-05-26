const Admin = require("../models/Admin");
const OTP = require("../models/OTP");
const { sendPasswordResetOTP, sendSignupOTP } = require("../utils/email");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

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
  otp: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
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
  otp: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
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
 * @function generateToken
 * @description Generates a JSON Web Token (JWT) for the authenticated admin.
 * @param {string} adminId - The MongoDB ObjectId of the admin.
 * @returns {string} The signed JWT token valid for 1 day.
 */
const generateToken = (adminId) => {
  return jwt.sign(
    { id: adminId },
    process.env.JWT_SECRET || "secret-fallback",
    {
      expiresIn: "1d",
    },
  );
};

/**
 * @function checkRegistration
 * @description Checks if any admin account exists in the database. Used to determine whether to show the signup or login page.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<Object>} JSON response containing a boolean `registered` flag and a message.
 */
exports.checkRegistration = async (req, res) => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      return res
        .status(200)
        .json({
          registered: false,
          message: "No admin account exists. Please sign up.",
        });
    }
    return res
      .status(200)
      .json({ registered: true, message: "Admin account already exists." });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
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
    const { error, value } = sendSignupOTPSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const email = value.email.toLowerCase();

    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      return res.status(403).json({ error: "An admin account already exists." });
    }

    // Generate 6-digit OTP
    const rawOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = crypto
      .createHash("sha256")
      .update(rawOTP)
      .digest("hex");

    // Remove any existing OTP for this email
    await OTP.deleteMany({ email });

    await OTP.create({
      email,
      otp: hashedOTP,
      firstName: value.firstName,
      lastName: value.lastName,
    });

    await sendSignupOTP(email, rawOTP);

    return res.status(200).json({ message: "Verification OTP sent successfully." });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
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
    // 1. Check if admin already exists
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      return res
        .status(403)
        .json({ error: "An admin account already exists." });
    }

    // 2. Validate request body
    const { error, value } = signupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // 3. Verify OTP
    const hashedOTP = crypto
      .createHash("sha256")
      .update(value.otp)
      .digest("hex");

    const otpRecord = await OTP.findOne({ otp: hashedOTP });
    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    // Verify email is not registered yet (in case they verified but another admin was created)
    const existingAdmin = await Admin.findOne({ email: otpRecord.email });
    if (existingAdmin) {
      return res.status(403).json({ error: "An admin account with this email already exists." });
    }

    // 4. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(value.password, salt);

    // 5. Create Admin
    const admin = new Admin({
      firstName: otpRecord.firstName,
      lastName: otpRecord.lastName,
      email: otpRecord.email,
      password: hashedPassword,
      isVerified: true,
    });
    await admin.save();

    // Delete OTP after successful signup
    await OTP.deleteOne({ _id: otpRecord._id });

    return res
      .status(201)
      .json({ message: "Admin account created successfully." });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email already in use." });
    }
    return res.status(500).json({ error: "Server error" });
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
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const admin = await Admin.findOne({ email: value.email.toLowerCase() });
    if (!admin) {
      return res
        .status(401)
        .json({ error: `User not found with this email, ${value.email}` });
    }

    const isMatch = await bcrypt.compare(value.password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = generateToken(admin._id);

    // Update last login
    admin.lastLogin = Date.now();
    await admin.save();

    // Set HTTP-Only Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
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
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const admin = await Admin.findOne({ email: value.email.toLowerCase() });
    if (!admin) {
      // Return success even if not found to prevent email enumeration
      return res
        .status(200)
        .json({
          message:
            "If that email is registered, a password reset link has been sent.",
        });
    }

    // Generate 6-digit OTP
    const rawOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = crypto
      .createHash("sha256")
      .update(rawOTP)
      .digest("hex");

    // Save Token
    await OTP.create({
      email: admin.email,
      otp: hashedOTP,
    });

    // Send Email (send raw OTP, keep hashed in DB)
    await sendPasswordResetOTP(admin.email, rawOTP);

    return res
      .status(200)
      .json({
        message:
          "If that email is registered, a password reset link has been sent.",
      });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
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
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const hashedOTP = crypto
      .createHash("sha256")
      .update(value.otp)
      .digest("hex");

    const resetRecord = await OTP.findOne({ otp: hashedOTP });
    if (!resetRecord) {
      return res
        .status(400)
        .json({ error: "Invalid or expired OTP." });
    }

    const admin = await Admin.findOne({ email: resetRecord.email });
    if (!admin) {
      return res.status(400).json({ error: "Admin not found." });
    }

    // Hash New Password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(value.password, salt);
    admin.passwordChangedAt = Date.now();
    await admin.save();

    // Delete token after use
    await OTP.deleteOne({ _id: resetRecord._id });

    return res
      .status(200)
      .json({ message: "Password has been successfully reset." });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
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
  res.clearCookie("token");
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
    const { error, value } = updateAdminSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const admin = req.admin; // Provided by authMiddleware

    if (value.firstName) admin.firstName = value.firstName;
    if (value.lastName) admin.lastName = value.lastName;
    if (value.phoneNumber !== undefined) admin.phoneNumber = value.phoneNumber;
    if (value.profilePicture !== undefined) admin.profilePicture = value.profilePicture;

    await admin.save();

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
    return res.status(500).json({ error: "Server error" });
  }
};
