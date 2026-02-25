import { connectDatabase } from "../config/db.js";
import { ensureDefaultAdmin } from "../services/adminBootstrap.js";
import { ensureLegacyPropertySeed } from "../services/propertySeed.js";

const run = async () => {
  await connectDatabase();
  const admin = await ensureDefaultAdmin();
  await ensureLegacyPropertySeed(admin._id || admin.id);
  process.exit(0);
};

run().catch((error) => {
  console.error("Legacy seed failed", error);
  process.exit(1);
});
