require("dotenv").config();
const app = require("./utils/express");
const connectDB = require("./config/db");
const logger = require("./utils/logger");
const routes = require("./routes");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const { authorization } = require("./middleware/authMiddleware");

// Start the server
async function run() {
  try {
    await connectDB();
    app.use(authorization);
    app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCssUrl:
          "https://cdn.jsdelivr.net/npm/swagger-ui-themes@3.0.0/themes/3.x/theme-material.css",
        customSiteTitle: "PetBuddy API Documentation",
      }),
    );
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
    if (process.env.NODE_ENV.toLocaleLowerCase() !== "production") {
      app.listen(process.env.PORT, process.env.HOST, function (err) {
        if (err) {
          logger.error(`Failed to start server: ${err}`);
        } else {
          logger.info(
            `PetBuddy admin portal is running on http://${process.env.HOST}:${process.env.PORT}`,
          );
        }
      });
    }
  } catch (err) {
    logger.error(`Server Error: ${err}`);
    throw new Error(err);
  }
}

module.exports = app;

if (require.main === module) {
  run();
}
