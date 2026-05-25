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
  // customfavIcon: "./image.png",
};

// Swagger UI documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, options));
app.use(routes);
await connectDB(); // Wait for database connection before starting the server
// app.listen(process.env.PORT, process.env.HOST, function (err) {
//   if (err) {
//     logger.error(`Failed to start the server: ${err}`);
//   } else {
//     logger.info(
//       `PetBuddy-API Module is running on http://${process.env.HOST}:${process.env.PORT}`,
//     );
//   }
// });
//   } catch (error) {
//     logger.error(`Failed to start the server: ${error}`);
//     process.exit(1);
//   }
// }

module.exports = app;
if (require.main === module) {
  run();
}
