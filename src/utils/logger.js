// logger.js
const { createLogger, format, transports } = require("winston");
const path = require('path');
const { setRequestContext, getRequestContext, deleteRequestContext } = require('./context'); // Import context functions

// Custom log format using template literals
const myFormat = format.printf(({ timestamp, level, message, context }) => {
  return `{ timestamp: ${timestamp}, level: ${level}, service: ${context?.serviceName || null}, requestId: ${context?.requestId || null}, userId: ${context?.userId || null}, ip: ${context?.ip || null}, message: ${message} }`;
});

// Options for logging to console and files
const options = {
  console: {
    level: "debug",
    handleExceptions: true,
    json: false,
    timestamp: true,
    format: format.combine(format.timestamp(), format.colorize(), myFormat),
  },
};

const logger = createLogger({
  transports: [
    new transports.Console(options.console),
  ],
  exitOnError: false,
});

// Function to log with automatic context (requestId, userId)
const logWithContext = (level, message) => {
  const { requestId, userId, ip } = getRequestContext(); // Get requestId and userId from async context
  const context = {
    requestId: requestId || null,
    userId: userId || null,
    ip: ip || null,
    serviceName: getCallerFile(), // Automatically get the calling filename
  };

  if (level === 'debug' && process.env.NODE_ENV === 'production') {
    return; // Skip debug logs in production
  }

  logger.log({
    level: level,
    message: message,
    context: context,
  });
};

// Utility function to get the filename of the calling file without caching
function getCallerFile() {
  const originalFunc = Error.prepareStackTrace;
  try {
    Error.prepareStackTrace = (err, stack) => stack;
    const stack = new Error().stack;

    // Adjusted to capture the correct stack level directly at the call site
    return stack[3] ? path.basename(stack[3].getFileName()) : 'unknown';
  } finally {
    Error.prepareStackTrace = originalFunc;
  }
}

// Custom log methods
logger.debug = (message) => logWithContext('debug', message);
logger.error = (message) => logWithContext('error', message);
logger.warn = (message) => logWithContext('warn', message);
logger.info = (message) => logWithContext('info', message);

// Middleware-like function to set the request context for each incoming request
logger.setRequestContext = setRequestContext;

// Add a writable stream function to work with morgan
logger.stream = {
  write: function (message) {
    // Since morgan logs messages with a newline at the end, trim it
    logger.info(message.trim());
  }
};

// Export logger module with context handling
logger.deleteRequestContext = deleteRequestContext;
module.exports = logger;
