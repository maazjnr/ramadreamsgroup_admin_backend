import { Router } from "express";
import {
  createProperty,
  deleteProperty,
  getAdminProperty,
  getPublicProperty,
  listAdminProperties,
  listPublicProperties,
  updateProperty,
} from "../controllers/propertyController.js";
import { protect } from "../middleware/auth.js";
import { uploadPropertyMedia } from "../middleware/upload.js";

const propertyRoutes = Router();

propertyRoutes.get("/public", listPublicProperties);
propertyRoutes.get("/public/:idOrSlug", getPublicProperty);

propertyRoutes.use(protect);
propertyRoutes.get("/", listAdminProperties);
propertyRoutes.get("/:id", getAdminProperty);
propertyRoutes.post("/", uploadPropertyMedia, createProperty);
propertyRoutes.patch("/:id", uploadPropertyMedia, updateProperty);
propertyRoutes.delete("/:id", deleteProperty);

export default propertyRoutes;
