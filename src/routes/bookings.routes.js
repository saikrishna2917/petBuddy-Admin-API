const express = require("express");
const router = express.Router();
const bookingsController = require("../controllers/bookings.controller");

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking Management API
 */

/**
 * @swagger
 * /api/bookings/bookings:
 *   get:
 *     summary: Get all bookings with filtering, search, and pagination
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for Booking ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, BOOKED, RE_SCHEDULED, IN_PROGRESS, CANCELLED, COMPLETED]
 *         description: Filter by booking status
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
 *         description: List of bookings successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get("/bookings", bookingsController.getAllBookings);

/**
 * @swagger
 * /api/bookings/bookings/{id}:
 *   get:
 *     summary: Get a single booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking retrieved successfully
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.get("/bookings/:id", bookingsController.getBookingById);

module.exports = router;
