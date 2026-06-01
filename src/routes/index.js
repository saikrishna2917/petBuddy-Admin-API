const router = (module.exports = require("express")());

// Mount Auth routes (public)
router.use("/api/auth", require("./auth.routes"));

// Mount Admin routes (protected)
router.use("/api/admin", require("./admin.routes"));
router.use("/api/dashboard", require("./dashboard.routes"));
router.use("/api/dashboard", require("./owners.routes"));
router.use("/api/bookings", require("./bookings.routes"));
router.use("/api/user-management", require("./userManagement.routes"));
router.use("/api/supports", require("./support.routes"));
router.use("/api/notifications", require("./notifications.routes"));
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
