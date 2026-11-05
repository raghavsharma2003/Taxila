// Gate speed (main, 2026-11-05): the browser suites that drive the REAL app serve the prebuilt dist/ (the gate and CI's
// browser shard run `vite build` first) from a plain static server, instead of booting a Vite dev server that transforms
// the whole client on every page load. A dist/ older than any client source falls back to the dev server, so a local
// `node --test` without a build never tests stale bytes. APP_SERVER=dev forces the dev server.
import http from "http";
import { createReadStream, existsSync, readdirSync, statSync } from "fs";
import { extname, join, normalize } from "path";

const ROOT = new URL("../..", import.meta.url).pathname;
const DIST = join(ROOT, "dist") + "/";
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".woff2": "font/woff2", ".woff": "font/woff", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav", ".glb": "model/gltf-binary", ".ico": "image/x-icon", ".txt": "text/plain" };

/** The newest mtime (ms) of any file under these roots (node_modules and dotdirs skipped). */
function newest(dirs) {
  let t = 0;
  const walk = (d) => { let es; try { es = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of es) { if (e.name.startsWith(".") || e.name === "node_modules") continue; const p = join(d, e.name);
      if (e.isDirectory()) walk(p); else { const m = statSync(p).mtimeMs; if (m > t) t = m; } } };
  for (const d of dirs) walk(join(ROOT, d));
  for (const f of ["index.html", "vite.config.ts"]) { try { t = Math.max(t, statSync(join(ROOT, f)).mtimeMs); } catch { /* none */ } }
  return t;
}
/** True when dist/ was built after the last change to the client's sources. */
export function distFresh() {
  if (process.env.APP_SERVER === "dev") return false;
  const idx = join(DIST, "index.html");
  if (!existsSync(idx)) return false;
  return statSync(idx).mtimeMs >= newest(["src", "shared", "public"]);
}

/** A static server over dist/ with the SPA fallback (any non-file path is index.html). → { url, close, kind } */
async function distServer() {
  const srv = http.createServer((req, res) => {
    const path = decodeURIComponent((req.url || "/").split("?")[0]);
    let file = normalize(join(DIST, path));
    if (!file.startsWith(DIST)) { res.writeHead(403); return res.end(); }
    let ok = false;
    try { ok = statSync(file).isFile(); } catch { /* not a file */ }
    if (!ok) {
      if (extname(path)) { res.writeHead(404); return res.end(); }
      file = join(DIST, "index.html");
    }
    const headers = { "content-type": TYPES[extname(file)] || "application/octet-stream" };
    if (path.startsWith("/assets/")) headers["access-control-allow-origin"] = "*";
    res.writeHead(200, headers);
    createReadStream(file).pipe(res);
  });
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  return { url: `http://127.0.0.1:${srv.address().port}`, close: () => new Promise((r) => srv.close(r)), kind: "dist" };
}

/** dist/ when fresh, else the Vite dev server (the suites' old path). → { url (no trailing slash), close, kind } */
export async function appServer() {
  if (distFresh()) return distServer();
  const { createServer } = await import("vite");
  const vite = await createServer({ root: ROOT, configFile: ROOT + "vite.config.ts", logLevel: "error", server: { port: 0, strictPort: false, host: "127.0.0.1", hmr: false } });
  await vite.listen();
  return { url: vite.resolvedUrls.local[0].replace(/\/$/, ""), close: () => vite.close(), kind: "dev" };
}
