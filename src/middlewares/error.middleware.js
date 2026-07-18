const ApiError = require("../utils/ApiError");

const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  if (!(err instanceof ApiError)) {
    statusCode = err.statusCode || 500;
    message = err.message || "Internal Server Error";
  }

  res.locals.errorMessage = err.message;

  // Redirect browser on auth/role errors instead of showing error page
  if ((statusCode === 401 || statusCode === 403) && req.accepts('html')) {
    const redirectUrl = statusCode === 401
      ? `/auth/login?error=${encodeURIComponent(message)}`
      : '/';
    return res.redirect(redirectUrl);
  }

  if (req.accepts('html')) {
    res.status(statusCode).render('error', { statusCode, message });
  } else {
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
