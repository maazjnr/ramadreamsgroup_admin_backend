import mongoose from "mongoose";
import { PROPERTY_STATUSES, PROPERTY_TYPES } from "../constants/property.js";

const mediaSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      default: "",
      trim: true,
    },
    filename: {
      type: String,
      default: "",
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    propertyType: {
      type: String,
      enum: PROPERTY_TYPES,
      default: "other",
    },
    status: {
      type: String,
      enum: PROPERTY_STATUSES,
      default: "draft",
    },
    bedrooms: {
      type: Number,
      default: 0,
      min: 0,
    },
    bathrooms: {
      type: Number,
      default: 0,
      min: 0,
    },
    toilets: {
      type: Number,
      default: 0,
      min: 0,
    },
    kitchens: {
      type: Number,
      default: 0,
      min: 0,
    },
    areaSqm: {
      type: Number,
      default: 0,
      min: 0,
    },
    features: {
      type: [String],
      default: [],
    },
    media: {
      type: [mediaSchema],
      default: [],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one media file is required.",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
  },
  { timestamps: true }
);

const Property = mongoose.model("Property", propertySchema);

export default Property;
