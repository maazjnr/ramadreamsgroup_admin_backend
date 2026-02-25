import { PROPERTY_STATUSES, PROPERTY_TYPES } from "../constants/property.js";
import AppError from "../utils/AppError.js";

const numberFields = ["price", "bedrooms", "bathrooms", "toilets", "kitchens", "areaSqm"];
const requiredNumberFields = new Set(["price"]);

const trimString = (value) => (typeof value === "string" ? value.trim() : "");

const toNumber = (value, field) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new AppError(400, `${field} must be a non-negative number.`);
  }

  return parsed;
};

const toStringArray = (value, field) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      return raw.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }

  throw new AppError(400, `${field} must be an array or comma-separated string.`);
};

export const normalizePropertyInput = (rawInput, options = {}) => {
  const { partial = false } = options;
  const payload = {};

  const title = trimString(rawInput.title);
  if (!partial || rawInput.title !== undefined) {
    if (!title) {
      throw new AppError(400, "title is required.");
    }
    payload.title = title;
  }

  const location = trimString(rawInput.location);
  if (!partial || rawInput.location !== undefined) {
    if (!location) {
      throw new AppError(400, "location is required.");
    }
    payload.location = location;
  }

  const description = trimString(rawInput.description);
  if (!partial || rawInput.description !== undefined) {
    if (!description) {
      throw new AppError(400, "description is required.");
    }
    payload.description = description;
  }

  for (const field of numberFields) {
    const parsed = toNumber(rawInput[field], field);
    const hasValue = rawInput[field] !== undefined;

    if (!partial && requiredNumberFields.has(field) && parsed === undefined) {
      throw new AppError(400, `${field} is required.`);
    }

    if (hasValue) {
      if (parsed === undefined) {
        throw new AppError(400, `${field} must be a non-negative number.`);
      }
      payload[field] = parsed;
    }
  }

  if (rawInput.propertyType !== undefined || !partial) {
    const propertyType = trimString(rawInput.propertyType || "other").toLowerCase();
    if (!PROPERTY_TYPES.includes(propertyType)) {
      throw new AppError(
        400,
        `propertyType must be one of: ${PROPERTY_TYPES.join(", ")}.`
      );
    }
    payload.propertyType = propertyType;
  }

  if (rawInput.status !== undefined || !partial) {
    const status = trimString(rawInput.status || "draft").toLowerCase();
    if (!PROPERTY_STATUSES.includes(status)) {
      throw new AppError(
        400,
        `status must be one of: ${PROPERTY_STATUSES.join(", ")}.`
      );
    }
    payload.status = status;
  }

  if (rawInput.features !== undefined) {
    payload.features = toStringArray(rawInput.features, "features");
  }

  return payload;
};

export const normalizeRemovedMedia = (rawInput) =>
  toStringArray(rawInput, "removedMedia") || [];
