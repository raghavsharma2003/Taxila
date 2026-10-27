import fs from "node:fs"; import path from "node:path";
import { syncedWithLine } from "/home/user/Taxila/server/studio/request.js";
import { canonKey } from "/home/user/Taxila/server/safety/normalize.js";
const root = "/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/simrec";
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".json") && d.endsWith("records") ? [path.join(d, e.name)] : []));
const ck = (s) => new Set(String(s).toLowerCase().normalize("NFKC").split(/[^\p{L}\p{M}\p{N}]+/u).filter((w) => w.length >= 3 && /\p{L}/u.test(w)).map((w) => canonKey(w)).filter((k) => k && k.length >= 3));
let pages = 0, unsynced = 0, flips = []; 
for (const f of walk(root)) {
  const r = JSON.parse(fs.readFileSync(f, "utf8"));
  const turns = new Map((r.turns ?? []).map((t) => [t.n, t]));
  for (const p of r.boardPages ?? []) {
    const n = Number(String(p.intentId ?? "").split(":wb:")[1]); const t = turns.get(n); if (!t?.teacher) continue;
    const texts = (String(p.board ?? "").match(/"([^"]*)"/g) ?? []).map((x) => x.slice(1, -1)); if (!texts.length) continue;
    pages++;
    const script = { ops: texts.map((x, i) => ({ id: "t" + i, op: "text", text: x })) };
    if (syncedWithLine(script, t.teacher)) continue;
    unsynced++;
    const a = ck(texts.join(" ")), b = ck(t.teacher);
    const hit = [...a].filter((k) => b.has(k));
    if (hit.length) flips.push({ hit, texts: texts.join("|").slice(0, 60), line: t.teacher.slice(0, 100) });
  }
}
console.log(JSON.stringify({ pages, unsynced, flipToSyncedByCanon: flips.length }));
for (const x of flips) console.log(JSON.stringify(x));
