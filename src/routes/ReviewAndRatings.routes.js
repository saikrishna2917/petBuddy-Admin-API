const app = (module.exports = require("express")());
const {
  reviewAndRatingServices,
} = require("../services/reviewAndRatingServices");
const httpStatusCodes = require("../utils/httpStatusCodes");
const sendResponse = require("../utils/sendResponse");

/**
 * @swagger
 * tags:
 *   name: Review and Ratings
 *   description: API endpoints for managing review and ratings
 */

/**
 * @swagger
 * /api/reviews/reviewAndRatings:
 *   get:
 *     summary: Get all review and ratings
 *     tags: [Review and Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for reviewID or bookingID
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest]
 *         description: Sort order by created date
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *         description: Filter by rating
 *       - in: query
 *         name: reviewID
 *         schema:
 *           type: string
 *         description: Filter by review ID
 *     responses:
 *       200:
 *         description: Successfully retrieved all review and ratings
 */
app.get("/reviewAndRatings", async (req, res) => {
  try {
    let result = await reviewAndRatingServices.fcnGetReviewAndRatings(
      req.query,
    );
    res.status(httpStatusCodes.ACCEPTED).send(result);
  } catch (err) {
    await sendResponse(err, res);
  }
});

/**
 * @swagger
 * /api/reviews/reviewById/:reviewID:
 *   get:
 *     summary: Get review by ID
 *     tags: [Review and Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewID
 *         required: true
 *         description: Review ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved review by ID
 */
app.get("/reviewById/:reviewID", async (req, res) => {
  try {
    let result = await reviewAndRatingServices.fcnGetReviewById(
      req.params.reviewID,
    );
    res.status(httpStatusCodes.ACCEPTED).send(result);
  } catch (err) {
    await sendResponse(err, res);
  }
});
