import dotenv from "dotenv";

dotenv.config();

const required = [
  "MONGO_URI",
  "JWT_SECRET",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const parseList = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const parsePort = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 5000;
  }
  return parsed;
};

const parseUploadLimit = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 25 * 1024 * 1024;
  }
  return parsed * 1024 * 1024;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parsePort(process.env.PORT || "5000"),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientOrigins: parseList(
    process.env.CLIENT_ORIGINS || "http://localhost:5174,http://localhost:3000"
  ),
  clientOriginPatterns: parseList(process.env.CLIENT_ORIGIN_PATTERNS || ""),
  adminName: process.env.ADMIN_NAME || "Ramadreams Admin",
  adminEmail: process.env.ADMIN_EMAIL.toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD,
  maxUploadBytes: parseUploadLimit(process.env.MAX_UPLOAD_MB || "25"),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER || "ramadreamsgroup/properties",
};
