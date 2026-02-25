import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { ensureDefaultAdmin } from "./services/adminBootstrap.js";
import { ensureLegacyPropertySeed } from "./services/propertySeed.js";

const startServer = async () => {
  await connectDatabase();
  const admin = await ensureDefaultAdmin();
  await ensureLegacyPropertySeed(admin._id || admin.id);

  app.listen(env.port, () => {
    console.log(`Admin backend listening on port ${env.port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start admin backend", error);
  process.exit(1);
});
