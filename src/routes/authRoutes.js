import { Router } from "express";
import { getMe, login } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const authRoutes = Router();

authRoutes.post("/login", login);
authRoutes.get("/me", protect, getMe);

export default authRoutes;
