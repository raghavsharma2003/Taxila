// score-blind-test.mjs — unblind and score exports from samples/blind-test.html (2026-10-02).
//
//   node score-blind-test.mjs samples/KEY.json ratings/*.json
//
// Pre-registered before any rating existed (do not tune after looking):
//   - Listener EXCLUDED if, on EITHER degraded control, their clarity rating is >= their clarity rating of the
//     clean source clip (they were not listening), OR if BOTH hidden repeats differ from their source by > 1
//     point on >= 2 axes (random clicking). Excluded listeners are reported, never silently dropped.
//   - "can't judge" ratings are missing data, not a 3.
//   - Arms are compared on listener-level means with a percentile bootstrap over LISTENERS (2,000 resamples).
//     Two arms are called different only if the 95% interval of the paired per-listener difference excludes 0.
//     Anything else is "inconclusive", never "the same" (Gurukul bake-off protocol).
//   - Ear ratings decide; ASR and loudness columns in KEY.json are sanity flags only.
import fs from "node:fs";

const [keyPath, ...files] = process.argv.slice(2);
if (!keyPath || !files.length) { console.error("usage: node score-blind-test.mjs KEY.json export1.json [export2.json ...]"); process.exit(2); }
const KEY = JSON.parse(fs.readFileSync(keyPath, "utf8"));
const AXES = ["real_teacher", "warmth", "clarity", "hindi"];
const clips = KEY.clips;
const armOf = (c) => { const v = clips[c]; return v && v.kind === "arm" ? `${v.engine === "gpt-realtime-2.1" ? "rt" : "tts"}:${v.voice}${v.instructions === "none" ? ":no-note" : ""}` : null; };

let rng = 12345; const rand = () => ((rng = (rng * 1103515245 + 12345) % 2147483648) / 2147483648);
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
function boot(perListener, B = 2000) { // perListener: array of numbers (one per listener)
  if (perListener.length < 2) return [NaN, NaN];
  const ms = []; for (let b = 0; b < B; b++) { const s = []; for (let i = 0; i < perListener.length; i++) s.push(perListener[Math.floor(rand() * perListener.length)]); ms.push(mean(s)); }
  ms.sort((a, b) => a - b); return [ms[Math.floor(0.025 * B)], ms[Math.floor(0.975 * B)]];
}
const num = (x) => (typeof x === "number" ? x : null);

// ---- load exports ----
const L = [];
for (const f of files) {
  const e = JSON.parse(fs.readFileSync(f, "utf8"));
  if (e.schema !== "taxila-blind-test-ratings/v1") { console.warn(`skip ${f}: schema ${e.schema}`); continue; }
  const unknown = Object.keys(e.clips).filter((c) => !clips[c]);
  if (unknown.length) console.warn(`${f}: ${unknown.length} codes not in KEY (different pack?)`);
  L.push({ file: f, who: `${e.listener.initials || "anon"} (${e.listener.role || "?"}, ${e.listener.age || "?"}, ${e.listener.home_language || "?"}, ${e.listener.device || "?"})`, e });
}

// ---- catch trials ----
for (const l of L) {
  const r = (c, a) => num(l.e.clips[c]?.ratings?.[a]);
  const notes = []; let exclude = false; let repeatFails = 0;
  for (const [c, v] of Object.entries(clips)) {
    if (v.kind === "degraded-control") {
      const d = r(c, "clarity"), s = r(v.source_code, "clarity");
      if (d === null || s === null) notes.push(`degraded ${c}: not rated`);
      else if (d >= s) { exclude = true; notes.push(`degraded ${c}: clarity ${d} >= source ${s} FAIL`); }
      else notes.push(`degraded ${c}: ${d} < ${s} ok`);
    }
    if (v.kind === "hidden-repeat") {
      const diffs = AXES.map((a) => { const x = r(c, a), y = r(v.source_code, a); return x === null || y === null ? null : Math.abs(x - y); });
      const big = diffs.filter((d) => d !== null && d > 1).length;
      if (big >= 2) repeatFails++;
      notes.push(`repeat ${c}: |diff| ${diffs.map((d) => (d === null ? "-" : d)).join("/")}`);
    }
  }
  if (repeatFails >= 2) { exclude = true; notes.push("both hidden repeats inconsistent FAIL"); }
  l.exclude = exclude; l.catchNotes = notes;
}
const kept = L.filter((l) => !l.exclude);
console.log(`\nlisteners: ${L.length} loaded, ${kept.length} kept`);
for (const l of L) console.log(`  ${l.exclude ? "EXCLUDED" : "kept    "} ${l.who} — ${l.catchNotes.join("; ")}`);

// ---- per-arm, per-axis: listener-level means ----
const arms = [...new Set(Object.keys(clips).map(armOf).filter(Boolean))].sort();
function listenerMean(l, arm, axis, passageFilter = () => true) {
  const xs = Object.entries(clips).filter(([c, v]) => armOf(c) === arm && passageFilter(v.passage)).map(([c]) => num(l.e.clips[c]?.ratings?.[axis])).filter((x) => x !== null);
  return xs.length ? mean(xs) : null;
}
const table = (title, pf) => {
  console.log(`\n${title}\narm                    ${AXES.map((a) => a.padEnd(22)).join("")}`);
  const rows = [];
  for (const arm of arms) {
    const cells = AXES.map((axis) => { const per = kept.map((l) => listenerMean(l, arm, axis, pf)).filter((x) => x !== null); const [lo, hi] = boot(per); return { m: mean(per), lo, hi, n: per.length }; });
    if (cells.every((c) => !c.n)) continue;
    rows.push({ arm, cells });
  }
  rows.sort((a, b) => (b.cells[0].m || 0) - (a.cells[0].m || 0));
  for (const r of rows) console.log(r.arm.padEnd(23) + r.cells.map((c) => (c.n ? `${c.m.toFixed(2)} [${isNaN(c.lo) ? "-" : c.lo.toFixed(2)},${isNaN(c.hi) ? "-" : c.hi.toFixed(2)}] n${c.n}` : "-").padEnd(22)).join(""));
  return rows;
};
table("ALL PASSAGES (mean [95% bootstrap over listeners] n=listeners)", () => true);
table("PASSAGE C ONLY (pure Hindi)", (p) => p === "P3");

// ---- paired contrasts ----
function paired(label, armA, armB, pf, axis) {
  const d = kept.map((l) => { const a = listenerMean(l, armA, axis, pf), b = listenerMean(l, armB, axis, pf); return a === null || b === null ? null : a - b; }).filter((x) => x !== null);
  const [lo, hi] = boot(d);
  const verdict = d.length < 2 ? "too few listeners" : lo > 0 ? `${armA} higher` : hi < 0 ? `${armB} higher` : "inconclusive";
  console.log(`  ${label.padEnd(44)} ${axis.padEnd(13)} diff ${isNaN(mean(d)) ? "-" : mean(d).toFixed(2)} [${isNaN(lo) ? "-" : lo.toFixed(2)},${isNaN(hi) ? "-" : hi.toFixed(2)}] n${d.length} → ${verdict}`);
}
console.log("\nPAIRED CONTRASTS (per-listener difference A − B)");
for (const v of ["marin", "coral", "shimmer", "cedar"]) for (const axis of ["real_teacher", "hindi"]) paired(`rt:${v} vs tts:${v}`, `rt:${v}`, `tts:${v}`, (p) => ["P1", "P2", "P3"].includes(p), axis);
// Script variant: same voice, Roman vs mixed script input (mini-tts only).
for (const v of ["marin", "coral", "shimmer", "sage"]) for (const axis of ["real_teacher", "hindi"]) {
  const d = kept.map((l) => {
    const pick = (pass) => { const xs = Object.entries(clips).filter(([c, x]) => x.kind === "arm" && x.engine === "gpt-4o-mini-tts" && x.voice === v && x.instructions === "voice-note" && pass.includes(x.passage)).map(([c]) => num(l.e.clips[c]?.ratings?.[axis])).filter((x) => x !== null); return xs.length ? mean(xs) : null; };
    const m = pick(["P1m", "P2m"]), r = pick(["P1", "P2"]); return m === null || r === null ? null : m - r;
  }).filter((x) => x !== null);
  const [lo, hi] = boot(d);
  console.log(`  ${`tts:${v} mixed-script vs roman`.padEnd(44)} ${axis.padEnd(13)} diff ${isNaN(mean(d)) ? "-" : mean(d).toFixed(2)} [${isNaN(lo) ? "-" : lo.toFixed(2)},${isNaN(hi) ? "-" : hi.toFixed(2)}] n${d.length} → ${d.length < 2 ? "too few listeners" : lo > 0 ? "mixed higher" : hi < 0 ? "roman higher" : "inconclusive"}`);
}
for (const v of ["marin", "coral"]) for (const axis of ["real_teacher", "hindi"]) paired(`tts:${v} voice-note vs no-note (P2)`, `tts:${v}`, `tts:${v}:no-note`, (p) => p === "P2", axis);

// ---- notes, unblinded ----
console.log("\nLISTENER NOTES (unblinded)");
for (const l of kept) for (const [c, x] of Object.entries(l.e.clips)) if (x.note && x.note.trim()) console.log(`  ${(armOf(c) || clips[c]?.kind || c).padEnd(20)} ${clips[c]?.passage || ""}  ${l.e.listener.initials || "anon"}: ${x.note.trim()}`);
console.log("\nReminder: n listeners < 20 is a direction, not a verdict. Ship gate: 95% lower bound of paired preference > 50% (Gurukul).");
