import AppError from "../utils/AppError.js";

const notFound = (req, _res, next) => {
  next(new AppError(404, `Route not found: ${req.originalUrl}`));
};

export default notFound;
