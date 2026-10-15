// Round 5 (QA pass 13-14, main's GO 2026-10-15): the catalogue's whiteboard beats were written through a normalizer that
// cut every number-work cell to 6 characters without a word ("? × ( length + breadt )", "food p → stomac"). The live gate
// now refuses a cut cell (W16) and a shape her line names but the board does not draw (W15). This repairs what code can
// prove and re-authors the rest:
//   1. code: a cut cell whose whole word is proved by the kit or the beat's own line (the longest-matching word that
//      begins it, plurals folded) is written whole; the beat is kept only if it then passes the strict shape, the stage
//      lint, W15 and W16 against its kit and line;
//   2. model (--regen): the beats code could not repair are re-authored on Azure (taxila-fast-bg, the catalogue's own
//      author) and kept only when they pass the same checks; a beat that still fails is DROPPED (script null): the live
//      board falls to the line plan, never a half-right page.
//   NODE_USE_ENV_PROXY=1 node --env-file=.env.local evals/studio-catalogue/repair-cuts.mjs [--regen] [--dry] [--out report.json]
import fs from "node:fs";
import path from "node:path";
import { normalizeScript, lintScript, scriptTokens } from "../../shared/whiteboard.js";
import { cutCells, namedShapeMissing } from "../../server/studio/qa/whiteboard.js";

const args = process.argv.slice(2), has = (k) => args.includes(k), opt = (k, d) => (has(k) ? args[args.indexOf(k) + 1] : d);
const DIR = "data/studio-catalogue/topics", DRY = has("--dry"), REGEN = has("--regen"), OUT = opt("--out", null);
const kits = new Map();
const kitOf = (t) => { const m = /^(c\d+)-([a-z]+)-/.exec(t); if (!m) return null; const f = `data/kits/${m[1]}-${m[2]}.json`; if (!kits.has(f)) kits.set(f, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null); return kits.get(f)?.topics?.find((x) => x.topicId === t) ?? null; };
// the kit's own TEXT (string values, never its JSON keys) and the beat's line
const valuesOf = (x) => (typeof x === "string" ? [x] : Array.isArray(x) ? x.flatMap(valuesOf) : x && typeof x === "object" ? Object.values(x).flatMap(valuesOf) : []);
const wordsOf = (kit, line) => new Set((`${line} ${valuesOf(kit).join(" ")}`.toLowerCase().match(/[\p{L}\p{M}]+/gu) ?? []));
const lineOf = (rec, b) => String(rec.explainer?.spec?.text?.[b.line] ?? "");

/** The failures the live gate now finds on a loadable beat (W15, W16); null when the beat is not loadable at all. */
export function beatFailures(script, kit, line) {
  const n = normalizeScript(script, { strict: true });
  if (!n.ok || !n.script || lintScript(n.script).length) return { loadable: false, why: [...(n.errors ?? []), ...(n.script ? lintScript(n.script).map((i) => `${i.id}:${i.check}`) : [])].slice(0, 4) };
  const why = [];
  const cuts = cutCells(n.script.ops, { kit, reply: line });
  if (cuts.length) why.push(...cuts.map((c) => `W16 ${c}`));
  // (the catalogue only, stricter than the live W16: a 6-character cell is how the old cap cut, so one whose last word is
  // not a whole kit / line word of 4+ letters is a suspect cut: "1000 m" was "1000 ml", "half a" was "half a litre")
  const words = wordsOf(kit, line);
  for (const o of n.script.ops) if (o.op === "numwork") for (const c of o.rows.flat()) {
    const cell = String(c ?? ""); if (cell.length !== 6) continue;
    if (/\s$/u.test(cell)) { why.push(`cut? ${o.id}: "${cell}"`); continue; }      // "money " was "money spent"
    if (!/[\p{L}\p{M}]$/u.test(cell)) continue;
    const last = (cell.toLowerCase().match(/[\p{L}\p{M}]+$/u) ?? [""])[0];
    const whole = words.has(last) || words.has(`${last}s`) || words.has(`${last}es`);
    if (!(last.length >= 4 && whole) && !(last.length === cell.length && whole)) why.push(`cut? ${o.id}: "${cell}"`);
  }
  const shapes = namedShapeMissing(line, n.script.ops);
  if (shapes.length) why.push(...shapes.map((s) => `W15 ${s}`));
  return { loadable: true, why };
}
/** Code repair: each cut cell written whole from the shortest proved word (plurals folded). */
export function repairCuts(script, kit, line) {
  const words = [...wordsOf(kit, line)];
  const ops = script.ops.map((o) => {
    if (o.op !== "numwork") return o;
    const rows = o.rows.map((r) => r.map((c) => {
      const cell = String(c ?? "");
      if (cell.length !== 6 || !/[\p{L}\p{M}]$/u.test(cell)) return c;
      const last = (cell.toLowerCase().match(/[\p{L}\p{M}]+$/u) ?? [""])[0];
      // a word cut to 3 letters or fewer is not proved by its start ("one te" was "one tenth", not "one ten"): the model re-authors it
      if (last.length < 4 || words.includes(last)) return c;
      const full = words.filter((w) => w.length > last.length && w.startsWith(last) && !/^(?:s|es)$/.test(w.slice(last.length))).sort((a, b) => a.length - b.length)[0];
      if (!full) return c;
      const head = cell.slice(0, cell.length - last.length);
      const orig = cell.slice(cell.length - last.length);
      return head + (orig[0] === orig[0].toUpperCase() && orig[0] !== orig[0].toLowerCase() ? full[0].toUpperCase() + full.slice(1) : full);
    }));
    return { ...o, rows };
  });
  return { ...script, ops };
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).sort();
const report = { at: new Date().toISOString(), refused: 0, codeRepaired: 0, regenerated: 0, dropped: 0, samples: [], beats: [] };
const toRegen = [];
for (const f of files) {
  const file = path.join(DIR, f);
  const rec = JSON.parse(fs.readFileSync(file, "utf8"));
  const kit = kitOf(rec.topicId);
  let changed = false;
  for (const b of rec.whiteboard?.beats ?? []) {
    if (!b?.script) continue;
    const line = lineOf(rec, b);
    const f0 = beatFailures(b.script, kit, line);
    if (!f0.loadable || !f0.why.length) continue;
    report.refused++;
    const fixed = f0.why.every((w) => w.startsWith("W16") || w.startsWith("cut?")) ? repairCuts(b.script, kit, line) : null;
    const f1 = fixed ? beatFailures(fixed, kit, line) : null;
    if (fixed && f1.loadable && !f1.why.length) {
      report.codeRepaired++;
      if (report.samples.length < 20) report.samples.push({ topicId: rec.topicId, line: b.line, said: line.slice(0, 120), before: cellsOf(b.script), after: cellsOf(fixed) });
      report.beats.push({ topicId: rec.topicId, line: b.line, outcome: "code", was: f0.why.slice(0, 3) });
      b.script = fixed; b.repaired = "cut-words (code, from the kit)"; changed = true;
    } else {
      toRegen.push({ file, topicId: rec.topicId, line: b.line, why: (f1?.why ?? f0.why).slice(0, 3) });
    }
  }
  if (changed && !DRY) fs.writeFileSync(file, JSON.stringify(rec, null, 1));
}
function cellsOf(s) { return (s.ops ?? []).filter((o) => o.op === "numwork").map((o) => o.rows.map((r) => r.join(" ")).join(" / ")).join(" | "); }

if (REGEN && toRegen.length) {
  const { regenBeats } = await import("./regen-wb.mjs");
  const out = await regenBeats(toRegen, { kitOf, lineOf, beatFailures, dry: DRY });
  for (const r of out) {
    report.beats.push(r);
    if (r.outcome === "model") report.regenerated++; else report.dropped++;
  }
} else {
  for (const r of toRegen) report.beats.push({ ...r, file: undefined, outcome: REGEN ? "dropped" : "pending" });
}
report.left = toRegen.length - report.regenerated - (REGEN ? report.dropped : 0);
console.log(JSON.stringify({ refused: report.refused, codeRepaired: report.codeRepaired, toRegen: toRegen.length, regenerated: report.regenerated, dropped: report.dropped }));
if (OUT) fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
