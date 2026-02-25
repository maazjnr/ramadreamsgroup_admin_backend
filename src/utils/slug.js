import slugify from "slugify";

export const createPropertySlug = (title) => {
  const base = slugify(title || "", { lower: true, strict: true, trim: true });
  const suffix = Date.now().toString(36);
  return `${base}-${suffix}`;
};
