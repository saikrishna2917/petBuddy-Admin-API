const express = require("express");
const router = express.Router();
const supportController = require("../controllers/support.controller");

/**
 * @swagger
 * tags:
 *   name: Supports
 *   description: API endpoints for managing support tickets
 */

/**
 * @swagger
 * /api/supports/raiseTicket:
 *   post:
 *     summary: Raise a new support ticket
 *     tags: [Supports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - raisedBy
 *               - raisedByType
 *               - subject
 *               - category
 *             properties:
 *               raisedBy:
 *                 type: string
 *                 description: ID of the user raising the ticket
 *               raisedByType:
 *                 type: string
 *                 enum: [PET_OWNER, PET_SITTER]
 *               bookingID:
 *                 type: string
 *                 description: Optional ID of the related booking
 *               subject:
 *                 type: string
 *                 description: Short title of the issue
 *               description:
 *                 type: string
 *                 description: Detailed explanation of the issue
 *               category:
 *                 type: string
 *                 enum: [BOOKING, PAYMENT, REFUND, PET_SITTER, PET_OWNER, TECHNICAL, ACCOUNT, OTHER]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *                 default: LOW
 *     responses:
 *       201:
 *         description: Support ticket raised successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Failed to raise support ticket
 */
router.post("/raiseTicket", supportController.raiseTicket);

/**
 * @swagger
 * /api/supports/support-tickets:
 *   get:
 *     summary: Get a list of support tickets
 *     tags: [Supports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by ticket status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter by ticket priority
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by ticket category
 *       - in: query
 *         name: raisedByType
 *         schema:
 *           type: string
 *         description: Filter by user role (e.g. PET_OWNER, PET_SITTER, ADMIN)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest]
 *         description: Sort order by created date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for ticketID or subject
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
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: A paginated list of tickets
 *       500:
 *         description: Failed to fetch support tickets
 */
router.get("/support-tickets", supportController.getTickets);

/**
 * @swagger
 * /api/supports/support-tickets/{id}:
 *   get:
 *     summary: Get details of a specific support ticket
 *     tags: [Supports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the support ticket
 *     responses:
 *       200:
 *         description: Ticket details retrieved successfully
 *       404:
 *         description: Support ticket not found
 *       500:
 *         description: Failed to fetch ticket details
 */
router.get("/support-tickets/:id", supportController.getTicketDetails);

/**
 * @swagger
 * /api/supports/support-tickets/{id}/status:
 *   patch:
 *     summary: Update the status of a specific support ticket
 *     tags: [Supports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the support ticket
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
 *                 enum: [OPEN, IN_PROGRESS, WAITING_FOR_USER, RESOLVED, CLOSED]
 *     responses:
 *       200:
 *         description: Ticket status updated successfully
 *       400:
 *         description: Status is required
 *       404:
 *         description: Support ticket not found
 *       500:
 *         description: Failed to update ticket status
 */
router.patch(
  "/support-tickets/:id/status",
  supportController.updateTicketStatus,
);

module.exports = router;
