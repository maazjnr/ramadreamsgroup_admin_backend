import multer from "multer";
import { env } from "../config/env.js";
import { ALLOWED_MIME_TYPES } from "../constants/media.js";
import AppError from "../utils/AppError.js";

const storage = multer.memoryStorage();

const fileFilter = (_req, file, callback) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    callback(new AppError(400, "Only image and video files are supported."));
    return;
  }
  callback(null, true);
};

export const uploadPropertyMedia = multer({
  storage,
  fileFilter,
  limits: {
    files: 12,
    fileSize: env.maxUploadBytes,
  },
}).array("media", 12);
