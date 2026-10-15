// Round 5 truth bar (main 2026-10-15): the self-repair scenarios with the child's repair pause (the silence between the
// wrong value and "नहीं / sorry") stretched or shrunk to a target length, the mic audio edited in that silence (room noise
// looped from the pause itself), every later gold time shifted. Writes a new bake dir (index.json + the files arms-d5 reads).
//   node evals/duplex-2026-10/stretch-repair.mjs --bake <dir> --out <dir> --variant owner --pauses 1500,2000,2500,3000
import fs from "node:fs";
import path from "node:path";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const BAKE = arg("--bake"), OUT = arg("--out"), VAR = arg("--variant", "owner"), PAUSES = arg("--pauses", "1500,2000,2500,3000").split(",").map(Number);
const SR = 16000;
fs.mkdirSync(OUT, { recursive: true });
const idx = JSON.parse(fs.readFileSync(path.join(BAKE, "index.json"), "utf8"));
const out = [];
const shiftT = (t, at, d) => (typeof t === "number" && t >= at ? t + d : t);
for (const r of idx) {
  const m = JSON.parse(fs.readFileSync(path.join(BAKE, `${r.id}.json`), "utf8"));
  if (m.sub !== "self_repair") continue;
  const p = m.gold.pauses.find((x) => x.cls === "repair");
  if (!p) continue;
  const mic = fs.readFileSync(path.join(BAKE, `${r.id}.${VAR}.s16`));
  for (const P of PAUSES) {
    const d = P - (p.end - p.start);
    const mid = Math.round((p.start + p.end) / 2);
    const cut = Math.round((mid * SR) / 1000) * 2;
    let x;
    if (d >= 0) {
      // room noise looped from the pause's own middle 200 ms
      const a = Math.round(((mid - 100) * SR) / 1000) * 2, b = Math.round(((mid + 100) * SR) / 1000) * 2;
      const bed = mic.subarray(a, b), n = Math.round((d * SR) / 1000) * 2, fill = Buffer.alloc(n);
      for (let i = 0; i < n; i++) fill[i] = bed[i % bed.length];
      x = Buffer.concat([mic.subarray(0, cut), fill, mic.subarray(cut)]);
    } else {
      const n = Math.round((-d * SR) / 1000) * 2;
      x = Buffer.concat([mic.subarray(0, cut - Math.floor(n / 2)), mic.subarray(cut + Math.ceil(n / 2))]);
    }
    const id = `${r.id}-p${P}`;
    const g = structuredClone(m.gold);
    for (const s of g.childSegs) { s.start = shiftT(s.start, mid, d); s.end = shiftT(s.end, mid, d); }
    for (const w of g.childWords) { w.start = shiftT(w.start, mid, d); w.end = shiftT(w.end, mid, d); }
    for (const q of g.pauses) { q.start = shiftT(q.start, mid, d); q.end = shiftT(q.end, mid, d); if (q.cls === "repair") q.ms = P; }
    for (const k of ["trueEnd"]) g[k] = shiftT(g[k], mid, d);
    const mm = { ...m, id, gold: g, endMs: m.endMs + d };
    delete mm.frames;
    fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify(mm));
    fs.writeFileSync(path.join(OUT, `${id}.${VAR}.s16`), x);
    fs.copyFileSync(path.join(BAKE, `${r.id}.her.s16`), path.join(OUT, `${id}.her.s16`));
    out.push({ id, family: r.family, sub: r.sub, endMs: (r.endMs ?? m.endMs) + d });
  }
}
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(out));
console.log(`${out.length} stretched scenarios → ${OUT}`);
