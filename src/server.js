// require("dotenv").config();
// const app = require("./utils/express");
// const connectDB = require("./config/db");
// const logger = require("./utils/logger");
// const routes = require("./routes");
// const swaggerUi = require("swagger-ui-express");
// const swaggerSpec = require("./config/swagger");
// const { authorization } = require("./middleware/authMiddleware");

// // Start the server
// async function run() {
//   try {
//     await connectDB();
//     app.use(authorization);
//     app.use(
//       "/api-docs",
//       swaggerUi.serve,
//       swaggerUi.setup(swaggerSpec, {
//         explorer: true,
//         customCssUrl:
//           "https://cdn.jsdelivr.net/npm/swagger-ui-themes@3.0.0/themes/3.x/theme-material.css",
//         customSiteTitle: "PetBuddy API Documentation",
//       }),
//     );
//     app.get("/swagger.json", (req, res) => {
//       res.setHeader("Content-Type", "application/json");
//       res.send(swaggerSpec);
//     });
//     app.use(routes);

//     app.get("/", (req, res) => {
//       res.status(200).json({
//         success: true,
//         message: "PetBuddy API Running Successfully",
//       });
//     });
//     if (process.env.NODE_ENV.toLocaleLowerCase() !== "production") {
//       app.listen(process.env.PORT, process.env.HOST, function (err) {
//         if (err) {
//           logger.error(`Failed to start server: ${err}`);
//         } else {
//           logger.info(
//             `PetBuddy admin portal is running on http://${process.env.HOST}:${process.env.PORT}`,
//           );
//         }
//       });
//     }
//   } catch (err) {
//     logger.error(`Server Error: ${err}`);
//     throw new Error(err);
//   }
// }

// module.exports = app;

// if (require.main === module) {
//   run();
// }

require("dotenv").config();

const app = require("./utils/express");
const connectDB = require("./config/db");
const logger = require("./utils/logger");
const routes = require("./routes");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const { authorization } = require("./middleware/authMiddleware");

// Forceful CORS Middleware to ensure headers are NEVER dropped by Vercel
app.use((req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : ["http://localhost:5173", "http://localhost:5174"];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (!origin) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else {
    // If it's a wildcard allowed scenario
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
  );

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});

// Ensure MongoDB is connected before handling any requests (Serverless Best Practice)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    logger.error(`Database Connection Error: ${error.message}`);
    return res
      .status(500)
      .json({ success: false, message: "Database connection failed" });
  }
});

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

// Start the server using Express app directly (Vercel compatible)
if (process.env.NODE_ENV !== "production") {
  app.listen(process.env.PORT || 5000, () => {
    logger.info(`Server running on port ${process.env.PORT || 5000}`);
  });
}

module.exports = app;
