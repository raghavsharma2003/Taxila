// Seams sweep 8: browser storage keys. Every literal key passed to localStorage/sessionStorage setItem / getItem /
// removeItem (directly or through a const in the same file), with the files that write and read it. Reports keys
// written and never read, and read and never written. Run: node docs/design/round7/audit/seams-scripts/storage-keys.mjs
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
const ROOT = new URL("../../../../../", import.meta.url).pathname;
const walk = (d, out = []) => { for (const f of readdirSync(d)) { if (f === "node_modules") continue; const p = join(d, f); const s = statSync(p); if (s.isDirectory()) walk(p, out); else if (/\.(tsx?|m?js)$/.test(f) && !/\.test\./.test(f)) out.push(p); } return out; };
const keys = new Map();
const add = (k, kind, at) => { if (!keys.has(k)) keys.set(k, { w: new Set(), r: new Set() }); keys.get(k)[kind].add(at); };
for (const f of walk(join(ROOT, "src"))) {
  if (/\/dev\//.test(f)) continue;
  const t = readFileSync(f, "utf8"); const rel = relative(ROOT, f);
  const consts = Object.fromEntries([...t.matchAll(/(?:const|let)\s+(\w+)\s*=\s*["'`]([^"'`$]+)["'`]/g)].map((m) => [m[1], m[2]]));
  for (const m of t.matchAll(/(?:localStorage|sessionStorage|storage|ls|store)\??\.(setItem|getItem|removeItem)\(\s*(?:["'`]([^"'`$]+)["'`]|(\w+))/g)) {
    const k = m[2] ?? consts[m[3]]; if (!k) continue;
    add(k, m[1] === "getItem" ? "r" : "w", rel);
  }
}
for (const [k, v] of [...keys].sort()) {
  if (!v.r.size) console.log(`written, never read: ${k}  <- ${[...v.w].join(" ")}`);
  else if (!v.w.size) console.log(`read, never written: ${k}  <- ${[...v.r].join(" ")}`);
}
console.error(`${keys.size} literal keys`);
