// Seams sweep 1b: for every client "/api/..." literal in src/, guess the HTTP method from the call around it and report
// calls whose path is registered but not under that method. Heuristic (reads the same line and the next 4): a hit is a
// lead to check by hand, not a finding. Run: DATABASE_URL= node docs/design/round7/audit/seams-scripts/route-methods.mjs
import { execFileSync } from "child_process";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
const ROOT = new URL("../../../../../", import.meta.url).pathname;
const table = JSON.parse(execFileSync("node", [join(ROOT, "docs/design/round7/audit/seams-scripts/routes.mjs"), "--keys"], { env: { ...process.env, DATABASE_URL: "" }, maxBuffer: 1 << 24 }).toString());
const byPath = new Map(); for (const k of table) { const [m, p] = k.split(" "); if (!byPath.has(p)) byPath.set(p, new Set()); byPath.get(p).add(m); }
const walk = (d, out = []) => { for (const f of readdirSync(d)) { const p = join(d, f); if (f === "node_modules") continue; const s = statSync(p); if (s.isDirectory()) walk(p, out); else if (/\.(ts|tsx|js|mjs)$/.test(f) && !/\.test\./.test(f)) out.push(p); } return out; };
for (const f of walk(join(ROOT, "src"))) {
  if (/\/dev\//.test(f)) continue;
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((ln, i) => {
    for (const m of ln.matchAll(/["'`](\/api\/[A-Za-z0-9_\-/]*)/g)) {
      const p = m[1].replace(/\/+$/, ""); const ms = byPath.get(p); if (!ms) continue;
      const win = lines.slice(Math.max(0, i - 1), i + 5).join(" ");
      let guess = null;
      const mm = win.match(/method:\s*["'](GET|POST|PATCH|PUT|DELETE)["']/); if (mm) guess = mm[1];
      else if (new RegExp(`postJson[^;]*${p.replace(/\//g, "\\/")}`).test(ln)) guess = "POST";
      else if (new RegExp(`(getJson|EventSource)[^;]*${p.replace(/\//g, "\\/")}`).test(ln)) guess = "GET";
      else if (/patchJson/.test(ln)) guess = "PATCH";
      else if (/del(ete)?Json/.test(ln)) guess = "DELETE";
      if (guess && !ms.has(guess)) console.log(`${relative(ROOT, f)}:${i + 1}  ${guess} ${p}  (registered: ${[...ms].join(",")})`);
    }
  });
}
