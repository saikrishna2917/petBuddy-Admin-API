const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
// const helmet = require("helmet");
const logger = require("./logger");
const { sanitizeInput } = require("../middleware/inputValidation");
var morgan = require("morgan");
const cookieParser = require("cookie-parser");

const globalMiddlewares = require("../middleware");
const routes = require("../routes");

const app = express();
app.use(fileUpload());
app.use(cookieParser());

// OWASP Top 10 - A05:2021 Security Misconfiguration
// Enhanced CORS configuration
const allowedOrigins = ["*"];
const isWildcardOrigin = allowedOrigins.includes("*");

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (isWildcardOrigin || allowedOrigins.includes(origin)) {
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
  credentials: !isWildcardOrigin,
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

// Apply application routes
app.use(routes);

module.exports = app;
