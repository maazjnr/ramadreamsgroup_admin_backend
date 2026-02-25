import app from "../src/app.js";
import { connectDatabase } from "../src/config/db.js";
import { ensureDefaultAdmin } from "../src/services/adminBootstrap.js";
import { ensureLegacyPropertySeed } from "../src/services/propertySeed.js";

let isInitialized = false;

const initialize = async () => {
  if (isInitialized) {
    return;
  }

  await connectDatabase();
  const admin = await ensureDefaultAdmin();
  await ensureLegacyPropertySeed(admin._id || admin.id);
  isInitialized = true;
};

export default async function handler(req, res) {
  try {
    await initialize();
    return app(req, res);
  } catch (error) {
    console.error("Vercel function initialization failed", error);
    return res.status(500).json({
      success: false,
      message: "Server failed to initialize.",
    });
  }
}
