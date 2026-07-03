const ApiError = require("../utils/ApiError");

const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  if (!(err instanceof ApiError)) {
    statusCode = err.statusCode || 500;
    message = err.message || "Internal Server Error";
  }

  res.locals.errorMessage = err.message;

  if (req.accepts('html')) {
    // Render error page if requested via browser
    res.status(statusCode).render('error', { statusCode, message });
  } else {
    // Send JSON for API requests
    const response = {
      code: statusCode,
      message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    };

    if (process.env.NODE_ENV === "development") {
      console.error(err);
    }

    res.status(statusCode).json(response);
  }
};

module.exports = errorHandler;
