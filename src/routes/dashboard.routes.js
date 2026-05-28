const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Admin Dashboard Management
 */

/**
 * @swagger
 * /api/dashboard/sitters/stats:
 *   get:
 *     summary: Fetch pet sitters statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sitter statistics fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pending:
 *                       type: integer
 *                     verified:
 *                       type: integer
 *                     rejected:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get("/sitters/stats", dashboardController.getSitterStats);

/**
 * @swagger
 * /api/dashboard/sitters:
 *   get:
 *     summary: Get list of pet sitters with pagination, search, and filters
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query for firstName, lastName, email, or phoneNumber
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, BLOCKED, INACTIVE]
 *         description: Filter sitters by registration status
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
 *         description: List of pet sitters retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phoneNumber:
 *                         type: string
 *                       status:
 *                         type: string
 *                       availability:
 *                         type: string
 *                         enum: [Available, Unavailable]
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get("/sitters", dashboardController.getSittersList);

/**
 * @swagger
 * /api/dashboard/sitters/{id}/status:
 *   put:
 *     summary: Update a pet sitter's status (Approve/Reject/Block)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The pet sitter's MongoDB ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, APPROVED, REJECTED, BLOCKED, INACTIVE]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Pet Sitter not found
 *       500:
 *         description: Server error
 */
router.put("/sitters/:id/status", dashboardController.updateSitterStatus);

/**
 * @swagger
 * /api/dashboard/sitters/{id}:
 *   get:
 *     summary: Get full details of a pet sitter by ID for profile verification
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The pet sitter's MongoDB ID
 *     responses:
 *       200:
 *         description: Pet sitter details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Pet Sitter not found
 *       500:
 *         description: Server error
 */
router.get("/sitters/:id", dashboardController.getSitterDetails);

module.exports = router;
