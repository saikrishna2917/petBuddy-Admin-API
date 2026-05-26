const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin Management (Protected)
 */

/**
 * @swagger
 * /api/admin/profile:
 *   put:
 *     summary: Update admin profile details (Protected)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
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
 *               phoneNumber:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *                 description: Base64 encoded image string (e.g. data:image/png;base64,...) or a URL
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized
 */
router.put("/profile", adminController.updateAdmin);

module.exports = router;
