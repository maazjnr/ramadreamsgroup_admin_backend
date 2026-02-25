import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import Property from "../models/Property.js";
import { createPropertySlug } from "../utils/slug.js";
import {
  deleteMediaByPublicId,
  deleteMediaRecords,
  uploadFilesToCloudinary,
} from "./mediaService.js";
import { legacyProperties } from "../data/legacyProperties.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..", "..");
const legacyImageRoot = path.join(projectRoot, "src", "Assets", "propertyImages");

const mimeByExtension = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".mkv": "video/x-matroska",
};

const toMimeType = (filename) => {
  const extension = path.extname(filename).toLowerCase();
  return mimeByExtension[extension] || "application/octet-stream";
};

const toUploadFile = async (filename) => {
  const absolutePath = path.join(legacyImageRoot, filename);
  const buffer = await fs.readFile(absolutePath);
  return {
    originalname: filename,
    mimetype: toMimeType(filename),
    size: buffer.byteLength,
    buffer,
  };
};

const createSeedDocument = (property, media, adminId) => ({
  title: property.title,
  slug: createPropertySlug(property.title),
  location: property.location,
  description: property.description,
  price: property.price,
  propertyType: property.propertyType,
  status: property.status,
  bedrooms: property.bedrooms,
  bathrooms: property.bathrooms,
  toilets: property.toilets,
  kitchens: property.kitchens,
  areaSqm: property.areaSqm,
  features: property.features,
  media,
  createdBy: adminId,
});

const toLegacyKey = (title, location) =>
  `${String(title || "").trim().toLowerCase()}__${String(location || "")
    .trim()
    .toLowerCase()}`;

const pickBestRecordToKeep = (records) =>
  [...records].sort((a, b) => {
    const mediaA = Array.isArray(a.media) ? a.media.length : 0;
    const mediaB = Array.isArray(b.media) ? b.media.length : 0;
    if (mediaB !== mediaA) {
      return mediaB - mediaA;
    }

    const updatedA = new Date(a.updatedAt).getTime();
    const updatedB = new Date(b.updatedAt).getTime();
    return updatedB - updatedA;
  })[0];

const cleanupLegacyDuplicates = async () => {
  const legacyTitleSet = new Set(legacyProperties.map((property) => property.title));
  const records = await Property.find({ title: { $in: [...legacyTitleSet] } })
    .select("_id title location media updatedAt")
    .lean();

  const grouped = new Map();
  for (const record of records) {
    const key = toLegacyKey(record.title, record.location);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(record);
  }

  let removedCount = 0;
  for (const entries of grouped.values()) {
    if (entries.length <= 1) {
      continue;
    }

    const keep = pickBestRecordToKeep(entries);
    const remove = entries.filter((entry) => String(entry._id) !== String(keep._id));

    for (const duplicate of remove) {
      await Property.deleteOne({ _id: duplicate._id });
      await deleteMediaRecords(duplicate.media || []);
      removedCount += 1;
    }
  }

  if (removedCount > 0) {
    console.log(`Removed ${removedCount} duplicate legacy properties`);
  }
};

const uploadSeedMedia = async (imageFiles) => {
  const media = [];

  for (const imageFile of imageFiles) {
    try {
      const uploadFile = await toUploadFile(imageFile);
      const uploaded = await uploadFilesToCloudinary([uploadFile]);
      media.push(...uploaded);
    } catch (error) {
      console.warn(`Skipping seed media "${imageFile}" due to upload failure.`);
    }
  }

  return media;
};

export const ensureLegacyPropertySeed = async (adminId) => {
  let seededCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const property of legacyProperties) {
    const existing = await Property.findOne({ title: property.title }).lean();
    if (existing) {
      skippedCount += 1;
      continue;
    }

    let uploadedMedia = [];

    try {
      uploadedMedia = await uploadSeedMedia(property.imageFiles);
      if (uploadedMedia.length === 0) {
        failedCount += 1;
        console.warn(`Skipping "${property.title}" because no media could be uploaded.`);
        continue;
      }

      await Property.create(createSeedDocument(property, uploadedMedia, adminId));
      seededCount += 1;
    } catch (error) {
      await deleteMediaByPublicId(uploadedMedia.map((item) => item.publicId));
      throw error;
    }
  }

  console.log(
    `Legacy seed complete: added ${seededCount}, skipped ${skippedCount}, failed ${failedCount}, total template ${legacyProperties.length}`
  );

  await cleanupLegacyDuplicates();
};
