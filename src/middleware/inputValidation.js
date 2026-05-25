const sanitizeInput = (req, res, next) => {
  // Global input sanitization logic can be added here.
  // For example, you might use 'express-mongo-sanitize' or 'xss' here.
  next();
};

module.exports = {
  sanitizeInput,
};
