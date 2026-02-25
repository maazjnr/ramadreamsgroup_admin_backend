import mongoose from "mongoose";

const getStatusCode = (error) => {
  if (error.statusCode) {
    return error.statusCode;
  }

  if (error.name === "MulterError") {
    return 400;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return 400;
  }

  if (error.code === 11000) {
    return 409;
  }

  if (error instanceof mongoose.Error.CastError) {
    return 400;
  }

  return 500;
};

const getMessage = (error) => {
  if (error.name === "MulterError") {
    return error.message;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return Object.values(error.errors)
      .map((item) => item.message)
      .join("; ");
  }

  if (error.code === 11000) {
    return "Duplicate value detected.";
  }

  if (error instanceof mongoose.Error.CastError) {
    return "Invalid resource identifier.";
  }

  return error.message || "Unexpected server error.";
};

const errorHandler = (error, _req, res, _next) => {
  const statusCode = getStatusCode(error);
  const message = getMessage(error);

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export default errorHandler;
