// Loads the gitignored .env.local into process.env without printing anything. Import first.
import fs from "node:fs";
const root = new URL("../../../", import.meta.url).pathname;
for (const l of fs.readFileSync(root + ".env.local", "utf8").split("\n")) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
export const ROOT = root;
