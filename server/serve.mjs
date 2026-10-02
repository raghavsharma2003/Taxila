// Production entry for Azure Container Apps: serves the built SPA from dist/ and the API router on one port.
// Long-lived process (no serverless time limit), so lessons, Forge status streams and WebSockets can live here.
import http from "http";
import { createReadStream, existsSync, statSync } from "fs";
import { extname, join, normalize } from "path";
import { handle } from "./index.js";

const ROOT = new URL("../dist/", import.meta.url).pathname;
const PORT = Number(process.env.PORT || 8080);
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".glb": "model/gltf-binary", ".wasm": "application/wasm",
  ".map": "application/json", ".ico": "image/x-icon", ".txt": "text/plain",
};

function sendFile(res, file, cache) {
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream", "cache-control": cache });
  createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
  const path = decodeURIComponent((req.url || "/").split("?")[0]);
  if (path.startsWith("/api/")) return handle(req, res);
  const file = normalize(join(ROOT, path));
  if (file.startsWith(ROOT) && existsSync(file) && statSync(file).isFile()) {
    // hashed build assets are immutable; html must revalidate
    return sendFile(res, file, path.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache");
  }
  if (path === "/modules" || path.startsWith("/modules.")) return sendFile(res, join(ROOT, "modules.html"), "no-cache");
  sendFile(res, join(ROOT, "index.html"), "no-cache"); // SPA fallback
}).listen(PORT, () => console.log(`taxila on :${PORT}`));
