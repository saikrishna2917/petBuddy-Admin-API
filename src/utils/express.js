const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
// const helmet = require("helmet");
const logger = require("./logger");
const { sanitizeInput } = require("../middleware/inputValidation");
var morgan = require("morgan");
const cookieParser = require("cookie-parser");

const globalMiddlewares = require("../middleware");

const app = express();

// Disable ETag to prevent 304 Not Modified responses which can cause CORS headers to be stripped by Vercel
app.disable("etag");

app.use(fileUpload());
app.use(cookieParser());
app.use("/public", express.static(path.join(__dirname, "../../public")));

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Read allowed origins from environment variable (comma-separated), fallback to localhost
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
      : [
          "http://localhost:5173",
          "http://localhost:5174",
          "http://localhost:5175",
        ];

    // Allow requests with no origin (e.g., Postman, curl, mobile apps)
    if (!origin) {
      return callback(null, true);
    }

    // Check if the request's origin is in the allowed list or if wildcard is explicitly set
    if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      return callback(null, true);
    }

    logger.warn(`[CORS] Blocked request from origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-Request-ID",
  ],
  credentials: true, // IMPORTANT: true is required for cookies (HTTP-only auth)
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

app.use(bodyParser.json({ limit: "100mb" }));
app.set("secret", process.env.JWT_SECRET);
app.set("refreshTokenSecret", process.env.JWT_REFRESH_SECRET);

app.use(
  bodyParser.urlencoded({
    limit: "100mb",
    parameterLimit: 5000000,
    extended: true,
  }),
);

// Apply Global Middlewares
app.use(globalMiddlewares);

app.use(morgan("combined", { stream: logger.stream }));

module.exports = app;
