// Wraps an async controller so rejected promises reach the error middleware
// instead of requiring a try/catch in every controller function.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
