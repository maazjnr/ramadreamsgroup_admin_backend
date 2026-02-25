import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signAuthToken = (adminId) =>
  jwt.sign({ sub: adminId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const verifyAuthToken = (token) => jwt.verify(token, env.jwtSecret);
