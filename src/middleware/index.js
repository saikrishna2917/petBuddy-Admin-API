const crypto = require("crypto");
const logger = require("../utils/logger");

// Middleware to assign a unique ID to each request
const assignRequestId = (req, res, next) => {
  req.id = crypto.randomUUID(); // Generate a unique request ID
  next();
};

// Middleware to log the incoming request using the context
const logRequest = (req, res, next) => {
  logger.info(`Incoming Request: ${req.method} ${req.originalUrl}`);
  next();
};

// Define global middlewares
const globalMiddlewares = [
  assignRequestId, // 1. Assign ID
  logger.setRequestContext, // 2. Setup AsyncLocalStorage context
  logRequest, // 3. Log the request (now with context!)
];

module.exports = globalMiddlewares;
