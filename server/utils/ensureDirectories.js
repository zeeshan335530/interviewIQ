import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Ensure required directories exist on server startup
 */
export const ensureDirectories = () => {
  const publicDir = path.join(__dirname, "..", "public");
  
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log("✅ Created public directory");
  }
};
