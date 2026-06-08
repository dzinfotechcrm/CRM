const { validationResult } = require('express-validator');

/**
 * Express-validator error handler middleware.
 * Returns 400 with formatted errors if validation fails.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }

  next();
}

module.exports = handleValidationErrors;
