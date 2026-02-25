import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import errorHandler from "./middleware/errorHandler.js";
import notFound from "./middleware/notFound.js";
import authRoutes from "./routes/authRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import AppError from "./utils/AppError.js";

const app = express();

const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

const corsOptions = {
  origin(origin, callback) {
    if (!origin || env.clientOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new AppError(403, "CORS origin not allowed."));
  },
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(apiLimiter);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Ramadreams admin backend is running.",
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Admin backend is healthy.",
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/properties", propertyRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
