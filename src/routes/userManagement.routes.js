const express = require("express");
const router = express.Router();
const userManagementController = require("../controllers/userManagement.controller");
/**
 * @swagger
 * tags:
 *   name: UserManagement
 *   description: User Management
 */

/**
 * @swagger
 * /api/user-management/send-otp:
 *   post:
 *     summary: Send OTP for verifying a new admin/staff email
 *     tags: [UserManagement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Validation error or user already exists
 *       500:
 *         description: Server error
 */
router.post("/send-otp", userManagementController.sendOTP);

/**
 * @swagger
 * /api/user-management/verify-otp:
 *   post:
 *     summary: Verify the OTP sent to an email before creating a user
 *     tags: [UserManagement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *                 description: 6-digit OTP received via email
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       500:
 *         description: Server error
 */
router.post("/verify-otp", userManagementController.verifyOTP);

/**
 * @swagger
 * /api/user-management:
 *   post:
 *     summary: Create a new admin/staff user (requires prior email OTP verification)
 *     tags: [UserManagement]
 *     security:
 *       - bearerAuth: []
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
 *               - role
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 description: Must be pre-verified via /verify-otp
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error or user already exists
 *       500:
 *         description: Server error
 */
router.post("/", userManagementController.createUser);

/**
 * @swagger
 * /api/user-management:
 *   get:
 *     summary: Get all admin/staff users (with optional search)
 *     tags: [UserManagement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query for firstName, lastName, email, or phoneNumber
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/", userManagementController.getAllUsers);

/**
 * @swagger
 * /api/user-management/{id}:
 *   get:
 *     summary: Get a specific admin/staff user by ID
 *     tags: [UserManagement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's MongoDB ID
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/:id", userManagementController.getUserById);

/**
 * @swagger
 * /api/user-management/{id}:
 *   put:
 *     summary: Update an admin/staff user
 *     tags: [UserManagement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's MongoDB ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Active, Blocked]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put("/:id", userManagementController.updateUser);

/**
 * @swagger
 * /api/user-management/{id}:
 *   delete:
 *     summary: Delete an admin/staff user
 *     tags: [UserManagement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's MongoDB ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", userManagementController.deleteUser);

module.exports = router;
