import fs from "node:fs"; import path from "node:path";
const root = "/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/simrec";
const kits = {};
for (const f of fs.readdirSync("/home/user/Taxila/data/kits").filter((x) => x.endsWith(".json"))) for (const t of JSON.parse(fs.readFileSync("/home/user/Taxila/data/kits/" + f, "utf8")).topics ?? []) kits[t.topicId] = t;
const nums = (s) => new Set((String(s).replace(/(\d),(?=\d{2,3}\b)/g, "$1").match(/\d+(?:\.\d+)?/g) ?? []).filter((x) => Number(x) >= 3));
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".json") && d.endsWith("records") ? [path.join(d, e.name)] : []));
const WE_MOVES = new Set(["worked_example", "first_step"]);
let lines = 0, cand = 0, hits = 0; const byMove = {}; const ex = [];
for (const f of walk(root)) {
  const r = JSON.parse(fs.readFileSync(f, "utf8"));
  const k = kits[r.start?.topic?.id]; if (!k?.workedExample) continue;
  const we = k.workedExample; const wn = nums([we.problem, ...(we.steps ?? [])].join(" "));
  if (wn.size < 2) continue;
  const itemNums = new Map((k.items ?? []).map((i) => [i.id, nums(`${i.prompt_en} ${i.prompt_hi ?? ""} ${i.answer} ${(i.acceptable ?? []).join(" ")}`)]));
  let open = null;
  for (const t of r.turns ?? []) {
    if (t.ui?.ask?.itemId) open = t.ui.ask.itemId;
    if (!t.teacher) continue; lines++;
    const kind = typeof t.move === "string" ? t.move : t.move?.kind;
    if (WE_MOVES.has(kind) || String(open ?? "").startsWith("fade:")) continue; cand++;
    const tn = nums(t.teacher);
    const inItem = itemNums.get(open) ?? new Set();
    const only = [...tn].filter((x) => wn.has(x) && !inItem.has(x) && Number(x) >= 11 && Number(x) % 10 !== 0);
    if (only.length >= 2) { hits++; byMove[kind] = (byMove[kind] ?? 0) + 1; ex.push({ f: path.basename(f).slice(0, 34), n: t.n, kind, only, line: t.teacher.slice(0, 110) }); }
  }
}
console.log(JSON.stringify({ lines, nonWorkedLines: cand, workedNumbersNotItem: hits, byMove }));
for (const e of ex.slice(0, 25)) console.log(JSON.stringify(e));
