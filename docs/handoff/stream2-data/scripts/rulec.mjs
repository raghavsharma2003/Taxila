import fs from "node:fs"; import path from "node:path";
const root = "/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/simrec";
const kits = {};
for (const f of fs.readdirSync("/home/user/Taxila/data/kits").filter((x) => x.endsWith(".json"))) for (const t of JSON.parse(fs.readFileSync("/home/user/Taxila/data/kits/" + f, "utf8")).topics ?? []) kits[t.topicId] = t;
const nums = (s) => new Set((String(s).replace(/(\d),(?=\d{2,3}\b)/g, "$1").match(/\d+(?:\.\d+)?/g) ?? []));
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".json") && d.endsWith("records") ? [path.join(d, e.name)] : []));
let cand = 0, hits = 0; const ex = [];
for (const f of walk(root)) {
  const r = JSON.parse(fs.readFileSync(f, "utf8"));
  const k = kits[r.start?.topic?.id]; if (!k) continue;
  for (const t of r.turns ?? []) {
    const kind = typeof t.move === "string" ? t.move : t.move?.kind;
    if (!t.teacher || !["probe", "practice"].includes(kind)) continue;
    const id = t.ui?.ask?.itemId; if (!id || id.startsWith("fade:")) continue;
    const it = (k.items ?? []).find((i) => i.id === id); if (!it) continue;
    const s = t.screen ?? {}; if (!(s.whiteboard || s.module || s.studio)) continue;
    const inum = nums(`${it.prompt_en} ${it.prompt_hi ?? ""} ${it.answer} ${(it.acceptable ?? []).join(" ")}`);
    if (!inum.size) continue;
    cand++;
    const rn = nums(t.teacher);
    if (rn.size && ![...rn].some((x) => inum.has(x))) { hits++; ex.push({ f: path.basename(f).slice(0, 32), n: t.n, kind, item: it.prompt_en.slice(0, 60), line: t.teacher.slice(0, 140) }); }
  }
}
console.log(JSON.stringify({ candidates: cand, fires: hits }));
for (const e of ex) console.log(JSON.stringify(e));
