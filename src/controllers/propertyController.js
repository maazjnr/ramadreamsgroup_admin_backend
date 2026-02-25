import { isValidObjectId } from "mongoose";
import Property from "../models/Property.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import { createPropertySlug } from "../utils/slug.js";
import {
  deleteMediaByPublicId,
  deleteMediaRecords,
  uploadFilesToCloudinary,
} from "../services/mediaService.js";
import {
  normalizePropertyInput,
  normalizeRemovedMedia,
} from "../validators/propertyValidator.js";
import { PROPERTY_STATUSES } from "../constants/property.js";

const buildListMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

const parsePagination = (query) => {
  const page = Math.max(Number.parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit || "10", 10), 1), 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const parseSort = (query) => {
  const allowedSortBy = new Set(["createdAt", "updatedAt", "price", "title", "status"]);
  const sortBy = allowedSortBy.has(query.sortBy) ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;
  return { [sortBy]: sortOrder };
};

const parseAdminFilter = (query) => {
  const filter = {};
  const search = String(query.search || "").trim();
  const status = String(query.status || "").trim().toLowerCase();

  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ title: regex }, { location: regex }, { description: regex }];
  }

  if (status && status !== "all") {
    if (!PROPERTY_STATUSES.includes(status)) {
      throw new AppError(400, `status must be one of: all, ${PROPERTY_STATUSES.join(", ")}.`);
    }
    filter.status = status;
  }

  return filter;
};

const findPropertyByIdentifier = async (identifier, publishedOnly = false) => {
  const filter = publishedOnly ? { status: "published" } : {};

  if (isValidObjectId(identifier)) {
    return Property.findOne({ ...filter, _id: identifier });
  }

  return Property.findOne({ ...filter, slug: identifier });
};

const getMediaIdentifier = (media) => media.publicId || media.filename;
const getUploadedPublicIds = (media = []) => media.map((item) => item.publicId);

export const listPublicProperties = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const search = String(req.query.search || "").trim();

  const filter = { status: "published" };
  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ title: regex }, { location: regex }, { description: regex }];
  }

  const [items, total] = await Promise.all([
    Property.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Property.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    meta: buildListMeta(page, limit, total),
  });
});

export const getPublicProperty = asyncHandler(async (req, res) => {
  const property = await findPropertyByIdentifier(req.params.idOrSlug, true);
  if (!property) {
    throw new AppError(404, "Property not found.");
  }

  res.status(200).json({
    success: true,
    data: property,
  });
});

export const listAdminProperties = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = parseAdminFilter(req.query);
  const sort = parseSort(req.query);

  const [items, total] = await Promise.all([
    Property.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Property.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    meta: buildListMeta(page, limit, total),
  });
});

export const getAdminProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id).lean();
  if (!property) {
    throw new AppError(404, "Property not found.");
  }

  res.status(200).json({
    success: true,
    data: property,
  });
});

export const createProperty = asyncHandler(async (req, res) => {
  let uploadedMedia = [];

  try {
    const payload = normalizePropertyInput(req.body, { partial: false });
    uploadedMedia = await uploadFilesToCloudinary(req.files || []);

    if (uploadedMedia.length === 0) {
      throw new AppError(400, "Upload at least one image or video.");
    }

    const property = await Property.create({
      ...payload,
      slug: createPropertySlug(payload.title),
      media: uploadedMedia,
      createdBy: req.admin.id,
    });

    res.status(201).json({
      success: true,
      data: property,
    });
  } catch (error) {
    await deleteMediaByPublicId(getUploadedPublicIds(uploadedMedia));
    throw error;
  }
});

export const updateProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    throw new AppError(404, "Property not found.");
  }

  let uploadedMedia = [];

  try {
    uploadedMedia = await uploadFilesToCloudinary(req.files || []);
    const payload = normalizePropertyInput(req.body, { partial: true });
    const removedMedia = normalizeRemovedMedia(req.body.removedMedia);
    const removeSet = new Set(removedMedia);

    const removedFromProperty = property.media
      .filter((item) => removeSet.has(getMediaIdentifier(item)))
      .map((item) => item.publicId)
      .filter(Boolean);

    const remainingMedia = property.media.filter(
      (item) => !removeSet.has(getMediaIdentifier(item))
    );
    const nextMedia = [...remainingMedia, ...uploadedMedia];

    if (nextMedia.length === 0) {
      throw new AppError(400, "A property must include at least one media item.");
    }

    Object.assign(property, payload);
    if (payload.title) {
      property.slug = createPropertySlug(payload.title);
    }
    property.media = nextMedia;
    property.createdBy = req.admin.id;

    await property.save();

    try {
      await deleteMediaByPublicId(removedFromProperty);
    } catch (cleanupError) {
      console.error("Failed to remove old media files", cleanupError);
    }

    res.status(200).json({
      success: true,
      data: property,
    });
  } catch (error) {
    await deleteMediaByPublicId(getUploadedPublicIds(uploadedMedia));
    throw error;
  }
});

export const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    throw new AppError(404, "Property not found.");
  }

  await Property.deleteOne({ _id: property.id });

  try {
    await deleteMediaRecords(property.media);
  } catch (cleanupError) {
    console.error("Failed to remove property media files", cleanupError);
  }

  res.status(204).send();
});
