import AdminUser from "../models/AdminUser.js";
import AppError from "../utils/AppError.js";
import { verifyAuthToken } from "../utils/jwt.js";

const extractBearerToken = (authorizationHeader = "") => {
  if (!authorizationHeader.startsWith("Bearer ")) {
    return null;
  }
  return authorizationHeader.slice(7).trim();
};

const loadAdminFromToken = async (token) => {
  const decoded = verifyAuthToken(token);
  const admin = await AdminUser.findById(decoded.sub);
  if (!admin) {
    throw new AppError(401, "Invalid authentication token.");
  }
  return admin;
};

export const protect = async (req, _res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      throw new AppError(401, "Authentication required.");
    }

    req.admin = await loadAdminFromToken(token);
    return next();
  } catch (error) {
    return next(new AppError(401, "Authentication failed."));
  }
};

export const optionalAuth = async (req, _res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      return next();
    }

    req.admin = await loadAdminFromToken(token);
    return next();
  } catch {
    return next();
  }
};
