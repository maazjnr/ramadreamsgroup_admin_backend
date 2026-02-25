import { IMAGE_MIME_TYPES, MEDIA_TYPES } from "../constants/media.js";
import cloudinary from "../config/cloudinary.js";
import { env } from "../config/env.js";
import AppError from "../utils/AppError.js";

const getMediaType = (mimetype) =>
  IMAGE_MIME_TYPES.includes(mimetype) ? MEDIA_TYPES.IMAGE : MEDIA_TYPES.VIDEO;

const getCloudinaryResourceType = (mimetype) =>
  getMediaType(mimetype) === MEDIA_TYPES.IMAGE ? "image" : "video";

const uploadOneFile = (file) =>
  new Promise((resolve, reject) => {
    const resourceType = getCloudinaryResourceType(file.mimetype);
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: env.cloudinaryFolder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );

    stream.end(file.buffer);
  });

export const uploadFilesToCloudinary = async (files = []) => {
  const uploadedMedia = [];

  try {
    for (const file of files) {
      const result = await uploadOneFile(file);
      uploadedMedia.push({
        kind: getMediaType(file.mimetype),
        url: result.secure_url,
        publicId: result.public_id,
        filename: file.originalname || "",
        mimeType: file.mimetype,
        size: file.size,
      });
    }

    return uploadedMedia;
  } catch (error) {
    const uploadedPublicIds = uploadedMedia.map((item) => item.publicId);
    await deleteMediaByPublicId(uploadedPublicIds);
    const reason = error?.message ? ` ${error.message}` : "";
    throw new AppError(502, `Media upload failed.${reason}`.trim());
  }
};

const isSafePublicId = (value) => /^[a-zA-Z0-9/_.-]+$/.test(value || "");

const deleteOneFromCloudinary = async (publicId) => {
  if (!publicId || !isSafePublicId(publicId)) {
    return;
  }

  await cloudinary.uploader.destroy(publicId, {
    invalidate: true,
    resource_type: "image",
  });

  await cloudinary.uploader.destroy(publicId, {
    invalidate: true,
    resource_type: "video",
  });
};

export const deleteMediaByPublicId = async (publicIds = []) => {
  await Promise.all(publicIds.map((publicId) => deleteOneFromCloudinary(publicId)));
};

export const deleteMediaRecords = async (media = []) => {
  const publicIds = media.map((item) => item.publicId).filter(Boolean);
  await deleteMediaByPublicId(publicIds);
};
