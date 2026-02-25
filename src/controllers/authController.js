import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import AdminUser from "../models/AdminUser.js";
import { signAuthToken } from "../utils/jwt.js";

const formatAdmin = (admin) => ({
  id: admin.id,
  name: admin.name,
  email: admin.email,
});

export const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    throw new AppError(400, "Email and password are required.");
  }

  const admin = await AdminUser.findOne({ email }).select("+password");
  if (!admin) {
    throw new AppError(401, "Invalid email or password.");
  }

  const validPassword = await admin.matchesPassword(password);
  if (!validPassword) {
    throw new AppError(401, "Invalid email or password.");
  }

  const token = signAuthToken(admin.id);
  res.status(200).json({
    success: true,
    data: {
      token,
      admin: formatAdmin(admin),
    },
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: formatAdmin(req.admin),
  });
});
