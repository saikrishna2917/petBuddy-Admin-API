const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Admin Authentication
 */

/**
 * @swagger
 * /api/auth/check:
 *   get:
 *     summary: Check if an admin is registered
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Status of admin registration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 registered:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.get("/check", adminController.checkRegistration);

/**
 * @swagger
 * /api/auth/send-otp:
 *   post:
 *     summary: Send OTP for email verification during signup
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification OTP sent successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Admin already exists
 */
router.post("/send-otp", adminController.sendSignupOTP);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Register the first admin
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *               - password
 *               - confirmPassword
 *             properties:
 *               otp:
 *                 type: string
 *                 description: 6-digit OTP sent to email
 *               password:
 *                 type: string
 *                 format: password
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Admin created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Admin already exists
 */
router.post("/verify-otp", adminController.signup);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Admin Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", adminController.login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset email sent
 */
router.post("/forgot-password", adminController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *               - password
 *               - confirmPassword
 *             properties:
 *               otp:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid OTP or validation error
 */
router.post("/reset-password", adminController.resetPassword);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout admin (Clears HTTP Cookie)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post("/logout", adminController.logout);

module.exports = router;
