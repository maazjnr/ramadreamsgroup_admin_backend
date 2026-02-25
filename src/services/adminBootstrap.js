import { env } from "../config/env.js";
import AdminUser from "../models/AdminUser.js";

export const ensureDefaultAdmin = async () => {
  const existingAdmin = await AdminUser.findOne({ email: env.adminEmail }).lean();
  if (existingAdmin) {
    return existingAdmin;
  }

  const createdAdmin = await AdminUser.create({
    name: env.adminName,
    email: env.adminEmail,
    password: env.adminPassword,
  });

  console.log(`Default admin created for ${env.adminEmail}`);
  return createdAdmin;
};
