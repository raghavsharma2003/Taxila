// Local API server on :8790 (vite proxies /api here). Loads .env.local.
import http from "http";
import { readFileSync } from "fs";
const ROOT = new URL("..", import.meta.url).pathname;
for (const line of readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const { handle } = await import("../server/index.js");
http.createServer(handle).listen(8790, () => console.log("api on :8790"));
