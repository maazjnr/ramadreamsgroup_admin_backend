export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
];

export const ALLOWED_MIME_TYPES = [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES];

export const MEDIA_TYPES = {
  IMAGE: "image",
  VIDEO: "video",
};
