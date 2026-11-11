// Seams sweep 4: shared/contracts.ts against its two sides. The server is plain JS, so nothing type-checks it against the
// contract: this sweep looks, per field of each exported interface, for (a) a writer in server/ (the field as an object
// key `name:` or shorthand `name,`/`name }` or an assignment `.name =`), (b) a reader in src/ (`.name`, `name:` in a
// destructure, `?.name`, `["name"]`), and (c) whether the type is imported anywhere at all.
// Field names shorter than 4 characters or in COMMON are skipped (they match everywhere and prove nothing).
// A hit is a lead: every finding drawn from it was checked by hand. Run: node docs/design/round7/audit/seams-scripts/contracts.mjs [Type …]
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
const ROOT = new URL("../../../../../", import.meta.url).pathname;
const src = readFileSync(join(ROOT, "shared/contracts.ts"), "utf8");
const walk = (d, out = []) => { for (const f of readdirSync(d)) { if (f === "node_modules" || f === "dev") continue; const p = join(d, f); const s = statSync(p); if (s.isDirectory()) walk(p, out); else if (/\.(m?js|tsx?)$/.test(f) && !/\.test\./.test(f)) out.push(p); } return out; };
const server = walk(join(ROOT, "server")).map((p) => readFileSync(p, "utf8")).join("\n");
const client = walk(join(ROOT, "src")).map((p) => readFileSync(p, "utf8")).join("\n");
const everywhere = [client, server, ...walk(join(ROOT, "shared")).filter((p) => !p.endsWith("contracts.ts")).map((p) => readFileSync(p, "utf8"))].join("\n");
const COMMON = new Set(["kind", "text", "type", "data", "name", "state", "label", "lessonId", "childId", "items", "error", "skillId", "topicId", "lang", "mode", "title", "reason", "status", "seq", "board", "move", "ui", "said", "phase"]);
// interface bodies (top-level fields only: lines with exactly two spaces of indent, or single-line interfaces)
const types = [];
for (const m of src.matchAll(/export interface (\w+)(?: extends [^{]+)?\s*\{([\s\S]*?)\n\}/g)) types.push({ name: m[1], body: m[2] });
for (const m of src.matchAll(/export interface (\w+)(?: extends [^{]+)?\s*\{([^\n]*)\}\s*$/gm)) types.push({ name: m[1], body: m[2] });
const want = process.argv.slice(2);
for (const t of types) {
  if (want.length && !want.includes(t.name)) continue;
  const used = new RegExp(`\\b${t.name}\\b`).test(everywhere);
  const fields = [...new Set([...t.body.matchAll(/(?:^|\n  |[{;]\s*)(?:readonly\s+)?(\w+)(\??):/g)].map((m) => m[1] + m[2]))];
  const rows = [];
  for (const f of fields) {
    const n = f.replace(/\?$/, ""); if (n.length < 4 || COMMON.has(n)) continue;
    const w = new RegExp(`(?:[{,\\s]${n}\\s*:|[{,]\\s*${n}\\s*[,}]|\\.${n}\\s*=[^=]|["']${n}["']\\s*:)`).test(server);
    const r = new RegExp(`(?:\\.${n}\\b|\\[["']${n}["']\\]|[{,]\\s*${n}\\s*[,}:=])`).test(client);
    if (!w || !r) rows.push(`  ${f.padEnd(28)} server-writes=${w ? "yes" : "NO "} client-reads=${r ? "yes" : "NO"}`);
  }
  if (!used || rows.length) console.log(`${t.name}${used ? "" : "   (type imported by nothing)"}\n${rows.join("\n")}`);
}
