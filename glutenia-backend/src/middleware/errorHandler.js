const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || res.statusCode;
  let message = err.message || "Server error";

  if (!statusCode || statusCode < 400) {
    statusCode = 500;
  }

  if (err.name === "CastError") {
    statusCode = 404;
    message = "Resource not found";
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((error) => error.message)
      .join("; ");
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `${field} already exists`;
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    message = "Image is too large. Choose a smaller image.";
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
