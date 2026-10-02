// Production entry for Azure Container Apps: serves the built SPA from dist/ and the API router on one port.
// Long-lived process (no serverless time limit), so lessons, Forge status streams and WebSockets can live here.
import http from "http";
import { createReadStream, existsSync, statSync } from "fs";
import { extname, join, normalize, resolve } from "path";
import { handle } from "./index.js";

// TAXILA_DIST serves another build (the production e2e builds with dev routes into a temp dir).
const ROOT = process.env.TAXILA_DIST ? resolve(process.env.TAXILA_DIST) + "/" : new URL("../dist/", import.meta.url).pathname;
const PORT = Number(process.env.PORT || 8080);
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".glb": "model/gltf-binary", ".wasm": "application/wasm",
  ".map": "application/json", ".ico": "image/x-icon", ".txt": "text/plain",
};

/**
 * The module frame, at the HTTP level too: sandboxed even if opened top-level, and framed only by the app
 * (its no-network policy is the <meta> CSP vite.config.ts injects into the page).
 */
const FRAME = { "content-security-policy": "sandbox allow-scripts; frame-ancestors 'self'" };
/**
 * The sandboxed module frame has an opaque origin, so it fetches its module scripts and stylesheets with
 * `Origin: null` (CORS mode): without this every frame rendered nothing and hit the ready timeout. The
 * bundles are public, hashed and immutable, so any origin may read them.
 */
const ASSET = { "cache-control": "public, max-age=31536000, immutable", "access-control-allow-origin": "*" };

function sendFile(res, file, headers) {
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream", "cache-control": "no-cache", ...headers });
  createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
  const path = decodeURIComponent((req.url || "/").split("?")[0]);
  if (path.startsWith("/api/")) return handle(req, res);
  const file = normalize(join(ROOT, path));
  const frame = join(ROOT, "modules.html");
  if (file.startsWith(ROOT) && existsSync(file) && statSync(file).isFile()) {
    // hashed build assets are immutable; html must revalidate (the default no-cache)
    return sendFile(res, file, path.startsWith("/assets/") ? ASSET : file === frame ? FRAME : {});
  }
  if (path === "/modules" || path.startsWith("/modules.")) return sendFile(res, frame, FRAME);
  sendFile(res, join(ROOT, "index.html"), {}); // SPA fallback
}).listen(PORT, () => console.log(`taxila on :${PORT}`));
