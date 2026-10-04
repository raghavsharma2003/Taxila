// Production entry for Azure Container Apps: serves the built SPA from dist/ and the API router on one port.
// Long-lived process (no serverless time limit), so lessons, Forge status streams and WebSockets can live here.
import http from "http";
import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from "fs";
import { brotliCompress, brotliCompressSync, gzipSync, constants as Z } from "zlib";
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

/**
 * Pre-compressed brotli (BUILD-PLAN W2-A #8): at boot every compressible build file is brotli-encoded at quality 11 in
 * the background (async, one at a time), so no visitor pays a request-time compression and the bytes are the smallest
 * brotli makes. A request that arrives before its file is done still gets the q9 on-demand encode (then cached).
 */
async function prewarmBrotli(root = ROOT) {
  const files = [];
  const walk = (d) => { for (const n of readdirSync(d, { withFileTypes: true })) { const f = join(d, n.name); if (n.isDirectory()) walk(f); else if (COMPRESSIBLE.has(extname(f))) files.push(f); } };
  try { walk(root); } catch { return 0; }
  let n = 0;
  for (const file of files) {
    try {
      const st = statSync(file);
      if (st.size <= 1024 || packed.get(`br:${file}`)?.mtime === st.mtimeMs) continue;
      const raw = readFileSync(file);
      const buf = await new Promise((ok, no) => brotliCompress(raw, { params: { [Z.BROTLI_PARAM_QUALITY]: 11, [Z.BROTLI_PARAM_SIZE_HINT]: raw.length } }, (e, b) => (e ? no(e) : ok(b))));
      packed.set(`br:${file}`, { mtime: st.mtimeMs, buf });
      n++;
    } catch { /* a file that vanished mid-walk: the request path encodes it on demand */ }
  }
  return n;
}

/**
 * index.html for "/" with the landing hero preloaded straight from the art manifest (W2-A #8; smooth G6): the LCP image
 * no longer waits for the bundle and the manifest fetch. The phone crop under 600 px, the wide scene above, 1x/2x —
 * the same choice src/app/landing/Site.tsx HeroArt makes. Cached per index.html + manifest mtime.
 */
let landingHtml = null;
export function heroPreloadTags(manifest) {
  const rows = Array.isArray(manifest?.entries) ? manifest.entries : Array.isArray(manifest?.assets) ? manifest.assets : Object.values(manifest ?? {}).find(Array.isArray) ?? [];
  const e = rows.find((x) => x?.id === "bg/landing-hero" && x.url);
  if (!e) return "";
  const set = (a, b) => [a && `${a} 1x`, b && `${b} 2x`].filter(Boolean).join(", ");
  const tag = (u, u2, media) => `<link rel="preload" as="image" href="${u}" imagesrcset="${set(u, u2)}" media="${media}" fetchpriority="high" />`;
  return e.phone?.url ? tag(e.phone.url, e.phone.url2x, "(max-width: 600px)") + tag(e.url, e.url2x, "(min-width: 601px)") : tag(e.url, e.url2x, "all");
}
function landingIndex() {
  const index = join(ROOT, "index.html"), man = join(ROOT, "assets/gen/manifest.json");
  try {
    const key = `${statSync(index).mtimeMs}:${existsSync(man) ? statSync(man).mtimeMs : 0}`;
    if (landingHtml?.key === key) return landingHtml.buf;
    const tags = existsSync(man) ? heroPreloadTags(JSON.parse(readFileSync(man, "utf8"))) : "";
    const html = readFileSync(index, "utf8").replace("</head>", `${tags}</head>`);
    landingHtml = { key, buf: Buffer.from(html), br: brotliCompressSync(Buffer.from(html)), gz: gzipSync(Buffer.from(html)) };
    return landingHtml.buf;
  } catch { return null; }
}
function sendLanding(res, req) {
  if (!landingIndex()) return sendFile(res, join(ROOT, "index.html"), {}, req);
  const ae = String(req?.headers["accept-encoding"] || "");
  const enc = /\bbr\b/.test(ae) ? "br" : /\bgzip\b/.test(ae) ? "gzip" : null;
  const buf = enc === "br" ? landingHtml.br : enc === "gzip" ? landingHtml.gz : landingHtml.buf;
  res.writeHead(200, { "content-type": TYPES[".html"], "cache-control": "no-cache", vary: "Accept-Encoding", ...(enc ? { "content-encoding": enc } : {}), "content-length": buf.length });
  res.end(req.method === "HEAD" ? undefined : buf);
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
  if (path === "/" || path === "/index.html") return sendLanding(res, req);
  const file = normalize(join(ROOT, path));
  const frame = join(ROOT, "modules.html");
  if (file.startsWith(ROOT) && existsSync(file) && statSync(file).isFile()) {
    // hashed build assets are immutable; html must revalidate (the default no-cache)
    return sendFile(res, file, path.startsWith("/assets/") ? assetHeaders(path) : file === frame ? FRAME : {}, req);
  }
  if (path === "/modules" || path.startsWith("/modules.")) return sendFile(res, frame, FRAME, req);
  // A missing static asset is a 404, never the app shell: removed files (the bake-off identities, old unversioned
  // look URLs) must not answer 200, and a stale hashed chunk must fail as a chunk, not parse index.html as JS.
  if (path.startsWith("/assets/")) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
    return res.end("not found");
  }
  sendFile(res, join(ROOT, "index.html"), {}, req); // SPA fallback
}).listen(PORT, () => {
  console.log(`taxila on :${PORT}`);
  if (process.env.TAXILA_PREWARM_BR !== "0") setTimeout(() => void prewarmBrotli().then((n) => n && console.log(`[serve] brotli q11 ready for ${n} files`)), 50);
});
