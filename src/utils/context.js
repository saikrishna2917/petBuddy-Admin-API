const { AsyncLocalStorage } = require('async_hooks');

const asyncLocalStorage = new AsyncLocalStorage();

const setRequestContext = (req, res, next) => {
  const context = {
    requestId: req.id || null, // Assuming req.id is set earlier
    ip: req.ip || (req.socket ? req.socket.remoteAddress : null),
    userId: req.user ? req.user.id : null, // Set if authentication is added later
  };

  // Run the rest of the request within this async context
  asyncLocalStorage.run(context, () => {
    next();
  });
};

const getRequestContext = () => {
  return asyncLocalStorage.getStore() || {};
};

const deleteRequestContext = () => {
  // AsyncLocalStorage automatically cleans up the context when the execution scope ends.
  // Provided here to satisfy the logger.js API expectation.
};

module.exports = {
  setRequestContext,
  getRequestContext,
  deleteRequestContext,
};
