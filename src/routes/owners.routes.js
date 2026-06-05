const express = require("express");
const router = express.Router();
const ownersController = require("../controllers/owners.controller");

/**
 * @swagger
 * tags:
 *   name: Owners
 *   description: Pet Owners Management
 */

/**
 * @swagger
 * /api/dashboard/owners:
 *   get:
 *     summary: Get list of pet owners with pagination, search, and filters
 *     tags: [Owners]
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
 *           enum: [ACTIVE, BLOCKED, INACTIVE]
 *         description: Filter owners by status
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
 *         description: List of pet owners retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/owners", ownersController.getOwnersList);

/**
 * @swagger
 * /api/dashboard/owners/{id}:
 *   get:
 *     summary: Get full details of a pet owner by ID
 *     tags: [Owners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The pet owner's MongoDB ID
 *     responses:
 *       200:
 *         description: Pet owner details retrieved successfully
 *       404:
 *         description: Pet Owner not found
 *       500:
 *         description: Server error
 */
router.get("/owners/:id", ownersController.getOwnerDetails);

/**
 * @swagger
 * /api/dashboard/owners/{id}/status:
 *   put:
 *     summary: Update a pet owner's status (e.g., Block, Active)
 *     tags: [Owners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The pet owner's MongoDB ID
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
 *                 enum: [ACTIVE, BLOCKED, INACTIVE]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Pet Owner not found
 *       500:
 *         description: Server error
 */
router.put("/owners/:id/status", ownersController.updateOwnerStatus);

/**
 * @swagger
 * /api/dashboard/owners/{id}:
 *   delete:
 *     summary: Delete a pet owner (soft delete)
 *     tags: [Owners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The pet owner's MongoDB ID
 *     responses:
 *       200:
 *         description: Pet owner deleted successfully
 *       404:
 *         description: Pet Owner not found
 *       500:
 *         description: Server error
 */
router.delete("/owners/:id", ownersController.deleteOwner);

module.exports = router;
