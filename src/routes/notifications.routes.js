const express = require("express");
const router = express.Router();
const notificationsController = require("../controllers/notifications.controller");

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: API endpoints for managing user notifications
 */

/**
 * @swagger
 * /api/notifications/notifications:
 *   get:
 *     summary: Get notifications for a user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userID
 *         schema:
 *           type: string
 *         description: ID of the user
 *       - in: query
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [PET_OWNER, PET_SITTER, ADMIN]
 *         description: Type of the user
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of notifications
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Internal server error
 */
router.get("/notifications", notificationsController.getNotifications);

/**
 * @swagger
 * /api/notifications/mark-read:
 *   patch:
 *     summary: Mark multiple notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notificationIDs
 *               - userID
 *             properties:
 *               notificationIDs:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["60d21b4667d0d8992e610c85", "60d21b4967d0d8992e610c86"]
 *               userID:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c84"
 *     responses:
 *       200:
 *         description: Notifications marked as read
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.patch("/mark-read", notificationsController.markNotificationsRead);

module.exports = router;
