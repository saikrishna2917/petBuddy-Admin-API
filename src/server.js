require("dotenv").config();
const app = require("./utils/express");
const connectDB = require("./config/db");
const logger = require("./utils/logger");
const routes = require("./routes");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

// Start the server
// async function run() {
//   try {
const options = {
  customCssUrl:
    "https://cdn.jsdelivr.net/npm/swagger-ui-themes@3.0.0/themes/3.x/theme-material.css",
  customSiteTitle: "PetBuddy API Documentation",
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, options));
app.get("/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});
app.use(routes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "PetBuddy API Running Successfully",
  });
});

connectDB()
  .then(() => {
    logger.info("Database Connected Successfully");

    // ONLY for local development
    if (process.env.NODE_ENV !== "production") {
      app.listen(process.env.PORT || 5000, () => {
        logger.info(`Server running on port ${process.env.PORT}`);
      });
    }
  })
  .catch((error) => {
    logger.error(`Database Connection Failed: ${error}`);
  });

module.exports = app;
