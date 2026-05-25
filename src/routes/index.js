const router = (module.exports = require("express")());

// Mount Auth routes
router.use("/api/auth", require("./admin.routes"));

/**
 * @swagger
 * /welcome:
 *   get:
 *     summary: Get Welcome message
 *     description: Returns a welcome message.
 *     responses:
 *       200:
 *         description: A JSON object with a welcome message.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Welcome to the PetBuddy API!
 */
router.get("/welcome", (req, res) => {
  res.json({ message: "Welcome to the PetBuddy API!" });
});

module.exports = router;
