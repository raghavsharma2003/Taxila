import fs from "node:fs"; import path from "node:path";
const root = "/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/simrec";
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".json") && d.endsWith("records") ? [path.join(d, e.name)] : []));
const STOP = new Set("the and with this that from have what kya hai hain aur mein main kaise kitne kitna dekho dekhiye socho batao bataiye ab phir ek do teen yeh woh iska uska drawing written rect arrow line circle text label".split(" "));
const stem = (w) => w.toLowerCase().normalize("NFKC").slice(0, 5);
const words = (s) => new Set((String(s).replace(/(\d),(?=\d{2,3}\b)/g, "$1").match(/[\p{L}\p{N}]+/gu) ?? []).filter((w) => (/^\d+$/.test(w) ? true : w.length >= 4) && !STOP.has(w.toLowerCase())).map(stem));
let pages = 0, matched = 0, mism = 0; const by = {}; const ex = [];
for (const f of walk(root)) {
  const r = JSON.parse(fs.readFileSync(f, "utf8"));
  const turns = new Map((r.turns ?? []).map((t) => [t.n, t]));
  for (const p of r.boardPages ?? []) {
    const n = Number(String(p.intentId ?? "").split(":wb:")[1]);
    const t = turns.get(n); if (!t?.teacher) continue;
    pages++;
    const bw = words((String(p.board ?? "").match(/"([^"]*)"/g) ?? []).join(" "));
    if (!bw.size) continue;            // a board of shapes only: nothing to compare
    matched++;
    const tw = words(t.teacher);
    const shares = [...bw].some((w) => tw.has(w));
    const kind = typeof t.move === "string" ? t.move : t.move?.kind; const req = t.move?.request ?? null;
    const k = path.basename(path.dirname(path.dirname(f)));
    by[k] ??= [0, 0]; by[k][0]++;
    if (!shares) { mism++; by[k][1]++; if (false) ex.push({ f: path.basename(f).slice(0, 30), n, k, board: String(p.board).slice(0, 90), line: t.teacher.slice(0, 110) }); }
  }
}
console.log(JSON.stringify({ pages, withWords: matched, shareNothing: mism }));
console.log(JSON.stringify(Object.fromEntries(Object.entries(by).sort((a, b) => b[1][0] - a[1][0]))));
for (const e of ex) console.log(JSON.stringify(e));
