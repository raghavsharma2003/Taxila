// Production entry for Azure Container Apps: serves the built SPA from dist/ and the API router on one port.
// Long-lived process (no serverless time limit), so lessons, Forge status streams and WebSockets can live here.
import http from "http";
import { createReadStream, existsSync, readFileSync, statSync } from "fs";
import { brotliCompressSync, gzipSync, constants as Z } from "zlib";
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

/** Vite's content-hashed bundles (name-HASH.ext) are immutable; anything else under /assets/ (e.g. the generated-image
 *  manifest, which changes in place) revalidates. */
const HASHED = /-[A-Za-z0-9_-]{8,}\.[a-z0-9]+$/;
const assetHeaders = (path) => (HASHED.test(path) ? ASSET : { "cache-control": "public, max-age=300, must-revalidate", "access-control-allow-origin": "*" });

/** Text responses go out brotli (else gzip) encoded; the encoded bytes are cached per file and mtime. Measured:
 *  the landing's JS+CSS is 471 KB raw vs 146 KB gzipped, LCP 4.4 s -> about 2.4 s on Fast 3G + 4x CPU. */
const COMPRESSIBLE = new Set([".html", ".js", ".mjs", ".css", ".json", ".svg", ".wasm", ".map", ".txt"]);
const packed = new Map();
function encoded(file, enc, mtime) {
  const key = `${enc}:${file}`; const hit = packed.get(key);
  if (hit && hit.mtime === mtime) return hit.buf;
  const raw = readFileSync(file);
  const buf = enc === "br" ? brotliCompressSync(raw, { params: { [Z.BROTLI_PARAM_QUALITY]: 9, [Z.BROTLI_PARAM_SIZE_HINT]: raw.length } }) : gzipSync(raw, { level: 9 });
  packed.set(key, { mtime, buf });
  return buf;
}

function sendFile(res, file, headers, req) {
  const type = TYPES[extname(file)] || "application/octet-stream";
  const base = { "content-type": type, "cache-control": "no-cache", ...headers };
  const st = statSync(file);
  if (COMPRESSIBLE.has(extname(file)) && st.size > 1024) {
    const ae = String(req?.headers["accept-encoding"] || "");
    const enc = /\bbr\b/.test(ae) ? "br" : /\bgzip\b/.test(ae) ? "gzip" : null;
    if (enc) {
      const buf = encoded(file, enc, st.mtimeMs);
      res.writeHead(200, { ...base, "content-encoding": enc, "content-length": buf.length, vary: "Accept-Encoding" });
      return res.end(req.method === "HEAD" ? undefined : buf);
    }
  }
  res.writeHead(200, { ...base, "content-length": st.size, vary: "Accept-Encoding" });
  if (req?.method === "HEAD") return res.end();
  createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
  const path = decodeURIComponent((req.url || "/").split("?")[0]);
  if (path.startsWith("/api/")) return handle(req, res);
  const file = normalize(join(ROOT, path));
  const frame = join(ROOT, "modules.html");
  if (file.startsWith(ROOT) && existsSync(file) && statSync(file).isFile()) {
    // hashed build assets are immutable; html must revalidate (the default no-cache)
    return sendFile(res, file, path.startsWith("/assets/") ? assetHeaders(path) : file === frame ? FRAME : {}, req);
  }
  if (path === "/modules" || path.startsWith("/modules.")) return sendFile(res, frame, FRAME, req);
  sendFile(res, join(ROOT, "index.html"), {}, req); // SPA fallback
}).listen(PORT, () => console.log(`taxila on :${PORT}`));
