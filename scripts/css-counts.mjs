// Round 8 step g: counts the distinct colour literals, font sizes and radii in src/**/*.css (dev pages and the engine gallery
// excluded) and the CSS files. Run from the repo root: node scripts/css-counts.mjs
import fs from "node:fs"; import path from "node:path";
const files = [];
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (!/node_modules|\/dev$|gallery/.test(p)) walk(p); } else if (p.endsWith(".css")) files.push(p); } };
walk("src");
const col = new Set(), fsz = new Set(), rad = new Set();
for (const f of files) {
  const s = fs.readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of s.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g)) col.add(m[0].toLowerCase().replace(/\s+/g, ""));
  for (const m of s.matchAll(/font-size\s*:\s*([^;}!]+)/g)) fsz.add(m[1].trim());
  for (const m of s.matchAll(/\bfont\s*:\s*[^;}]*?(\d+(?:\.\d+)?(?:px|rem|em))/g)) fsz.add(m[1]);
  for (const m of s.matchAll(/border-radius\s*:\s*([^;}!]+)/g)) rad.add(m[1].trim());
}
console.log(JSON.stringify({ cssFiles: files.length, colours: col.size, fontSizes: fsz.size, radii: rad.size }));
