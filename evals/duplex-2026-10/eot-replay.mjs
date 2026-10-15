// Round 5 EOT steps, before/after on the SAME recorded Voice Live output (arms-d5.mjs --replay): per after-her turn, the
// end of turn (first commit − the child's true end), and main's conditions:
//   cut     the child's gold words went on after the first commit (a self-correction "आठ… नहीं, छप्पन" cut, or any word)
//   changed the first commit's value differs from the gold final value (the turn would be answered on the wrong value)
//   onTop   an empty commit (the re-ask) with child gold speech starting within 600 ms after it
//   think   a commit inside a gold THINKING pause (score.mjs `cut`)
//   node evals/duplex-2026-10/eot-replay.mjs --bake <dir> --variant owner --score <score.json> --before <arm> --after <arm>
import fs from "node:fs";
import path from "node:path";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const BAKE = arg("--bake"), VAR = arg("--variant", "owner"), ARMS = [arg("--before"), arg("--after")].filter(Boolean);
// end of turn and thinking-pause cut-offs exactly as the bar scores them (score.mjs --out on the same bake dir)
const SCORE = JSON.parse(fs.readFileSync(arg("--score"), "utf8")).rows;
const THINK = new Set(["filler", "hesitation", "hold_request", "word_search", "repair_open", "mid_explanation", "drift_pause"]);
const DIG = { "०": 0, "१": 1, "२": 2, "३": 3, "४": 4, "५": 5, "६": 6, "७": 7, "८": 8, "९": 9 };
const WORDS = { शून्य: 0, एक: 1, दो: 2, तीन: 3, चार: 4, पांच: 5, पाँच: 5, छह: 6, छः: 6, सात: 7, आठ: 8, नौ: 9, दस: 10, बारह: 12, पंद्रह: 15, छप्पन: 56, चौवन: 54, अड़तालीस: 48, eight: 8, six: 6, four: 4, two: 2 };
const valueOf = (s) => {
  if (s === null || s === undefined) return null;
  const t = String(s).replace(/[०-९]/g, (d) => DIG[d]);
  const nums = [...t.matchAll(/\d+/g)].map((m) => Number(m[0]));
  if (nums.length) return nums.at(-1);
  const w = t.toLowerCase().split(/[\s,.।?!]+/).map((x) => WORDS[x]).filter((x) => x !== undefined);
  return w.length ? w.at(-1) : null;
};
const q = (a, p) => { if (!a.length) return null; const z = [...a].sort((x, y) => x - y); return z[Math.min(z.length - 1, Math.floor((z.length - 1) * p))]; };

const idx = JSON.parse(fs.readFileSync(path.join(BAKE, "index.json"), "utf8"));
const out = {};
for (const arm of ARMS) {
  const rows = [];
  for (const { id } of idx) {
    const f = path.join(BAKE, "runs", `${arm}.${VAR}.${id}.json`);
    if (!fs.existsSync(f)) continue;
    const run = JSON.parse(fs.readFileSync(f, "utf8"));
    const m = JSON.parse(fs.readFileSync(path.join(BAKE, `${id}.json`), "utf8"));
    const g = m.gold;
    if (!g?.childSegs?.length || !["F1", "F2", "F5"].includes(m.family)) continue;
    const segs = g.childSegs.filter((s) => s.start >= (g.herSpan?.end ?? 0) - 200);
    if (!segs.length) continue;
    const end = segs.at(-1).end;
    const c = run.acts.find((a) => a[1] === "commit" && a[0] >= segs[0].start);
    const at = c ? c[0] : null;
    const words = (g.childWords ?? []).filter((w) => w.start >= segs[0].start - 50);
    const goldVal = segs.map((s) => s.value).filter((v) => v !== undefined && v !== null).at(-1) ?? null;
    const val = c ? valueOf(c[2]) : null;
    const pauses = g.pauses ?? [];
    rows.push({
      id, family: m.family, sub: m.sub,
      eot: at === null ? null : at - end,
      cut: at !== null && words.some((w) => w.start > at + 50),
      changed: at !== null && goldVal !== null && val !== null && Number(goldVal) !== val,
      empty: !!c && !String(c[2] ?? "").trim(),
      onTop: !!c && !String(c[2] ?? "").trim() && words.some((w) => w.start >= at && w.start <= at + 600),
      think: at !== null && pauses.some((p) => THINK.has(p.cls) && at > p.start + 100 && at < p.end),
      text: c ? String(c[2] ?? "").slice(0, 40) : null,
    });
  }
  const sc = new Map((SCORE[`${arm}/${VAR}`] ?? []).map((r) => [r.id, r]));
  for (const r of rows) { const x = sc.get(r.id); r.eot = x?.eotMs === undefined ? undefined : x.eotMs; r.think = !!x?.cut; }
  for (let i = rows.length - 1; i >= 0; i--) if (rows[i].eot === undefined) rows.splice(i, 1);
  const eot = rows.map((r) => r.eot).filter((x) => x !== null);
  const fam = {};
  for (const r of rows) (fam[r.family] ??= []).push(r);
  out[arm] = {
    n: rows.length, eotP50: q(eot, 0.5), eotP90: q(eot, 0.9), missed: rows.filter((r) => r.eot === null).length,
    byFamily: Object.fromEntries(Object.entries(fam).map(([k, v]) => [k, { n: v.length, p50: q(v.map((r) => r.eot).filter((x) => x !== null), 0.5) }])),
    cut: rows.filter((r) => r.cut).map((r) => r.id), changed: rows.filter((r) => r.changed).map((r) => `${r.id}:${r.text}`),
    reasks: rows.filter((r) => r.empty).length, reaskOnTop: rows.filter((r) => r.onTop).map((r) => r.id),
    thinkCut: rows.filter((r) => r.think).map((r) => r.id), rows,
  };
}
if (ARMS.length === 2) {
  const [a, b] = ARMS.map((k) => new Map(out[k].rows.map((r) => [r.id, r])));
  out.diff = [...a.keys()].filter((id) => b.has(id) && a.get(id).eot !== b.get(id).eot).map((id) => `${id}: ${a.get(id).eot} → ${b.get(id).eot}`);
}
for (const k of ARMS) delete out[k].rows;
console.log(JSON.stringify(out, null, 1));
