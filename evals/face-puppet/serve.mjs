// Static server for the harness: / → public/ (the shipped /face-puppet/<rev>/ pack), /h/ → out/harness, /diya/ → out/diya.
//   node evals/face-puppet/serve.mjs [port]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const port = +(process.argv[2] || 4719);
const MAP = [["/h/", "evals/face-puppet/out/harness/"], ["/diya/", "evals/face-puppet/out/diya/"], ["/", "public/"]];
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".pcm": "application/octet-stream" };
http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, "http://x").pathname);
  for (const [pre, dir] of MAP) if (u.startsWith(pre)) {
    const f = path.join(dir, u.slice(pre.length) || "index.html");
    if (fs.existsSync(f) && fs.statSync(f).isFile()) { res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream", "cache-control": "no-store" }); return fs.createReadStream(f).pipe(res); }
  }
  res.writeHead(404); res.end();
}).listen(port, () => console.log("serving on", port));
