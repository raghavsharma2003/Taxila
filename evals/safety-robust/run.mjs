// Safety-robust eval (2026-10-05): distress recall of the predicate (server/director/safety.js scanSafety) under the critic's
// realistic STT perturbation, and its false-positive rate on lesson talk. $0, CPU only, deterministic.
//
//   node evals/safety-robust/run.mjs [--seeds 20] [--dev] [--label name] [--baseline] [--quiet]
//
//   --seeds N   perturbation draws per distress item (seed 0 = the critic's own draw; report seeds 0..N-1)
//   --dev       use the DEV seeds (1000..1000+N-1) instead: what tuning looked at, so the report seeds stay unseen
//   --baseline  score pass 1 only (the shipped families on the bytes): today's predicate
//
// Distress sets: TaxilaFDB 84 (21 F10 scenarios x 2 test voices x 2 conditions, rebuilt from the render manifest), ES-3 80
// (category a), a held-out paraphrase set (negatives.data.mjs HELDOUT_DISTRESS, never tuned on) and the conversation-v2 offline
// distress items. Each turn's segments end with the transcriber's punctuation (danda / period), as live finals do.
// A perturbed turn whose distress segment was HALLUCINATED in another script has no distress words left to read: it is
// scored three ways — caught (the predicate still fired), ask-again (readability() flags the turn unreadable: the patched
// classify / duplex path re-asks and runs the model distress read on the rest), or missed.
// False-positive sets: ES-1 (8,357 synthetic lesson turns), ES-3 categories b-h (220), the owner-truth and conversation-v2
// child turns (real prod transcripts), TaxilaFDB lesson segments (clean and sttReal), and the hand-written hard negatives.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { scanSafetyDetail, readability } from "../../server/director/safety.js";
import * as C from "./corpora.mjs";
import { HARD_NEGATIVES, HELDOUT_DISTRESS } from "./negatives.data.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1]; };
const flag = (k) => process.argv.includes(`--${k}`);
const SEEDS = Number(arg("seeds", 20));
const DEV = flag("dev");
const BASE = flag("baseline");
const LABEL = arg("label", BASE ? "baseline" : DEV ? "dev" : "report");
const QUIET = flag("quiet");
const DATE = "2026-10-05";

const scan = (text) => {
  const d = scanSafetyDetail(text);
  if (BASE && d.pass !== 1) return { distress: false, kind: null, pass: null, via: null };
  return d;
};
const seedK = (k) => (DEV ? 1000 + k : k);

function distressSet(name, items) {
  const clean = items.map((it) => ({ it, d: scan(C.cleanText(it)) }));
  const cleanNoPunct = items.filter((it) => scan(C.cleanText(it, { punct: false })).distress).length;
  const perSeed = [];
  const misses = new Map();
  let caught = 0, ask = 0, missed = 0, hallTotal = 0, viaPass2 = 0;
  for (let k = 0; k < SEEDS; k++) {
    let c = 0, a = 0, m = 0;
    for (const it of items) {
      const p = C.perturbedText(it, C.seedOf(it.id, seedK(k)));
      const lost = it.distressSeg != null ? p.hallucinated.includes(it.distressSeg) : p.hallucinated.length > 0;
      if (lost) hallTotal++;
      const d = scan(p.text);
      if (d.distress) { c++; if (d.pass === 2) viaPass2++; }
      else if (readability(p.text).unreadable) a++;
      else { m++; misses.set(p.text, (misses.get(p.text) ?? 0) + 1); }
    }
    perSeed.push({ caught: c, ask: a, missed: m });
    caught += c; ask += a; missed += m;
  }
  const n = items.length;
  const rec = perSeed.map((s) => s.caught / n), eff = perSeed.map((s) => (s.caught + s.ask) / n);
  const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  return {
    name, n,
    clean: { caught: clean.filter((x) => x.d.distress).length, n, recall: clean.filter((x) => x.d.distress).length / n, viaPass2: clean.filter((x) => x.d.pass === 2).length,
      missed: clean.filter((x) => !x.d.distress).map((x) => C.cleanText(x.it)), cleanNoPunct },
    perturbed: { seeds: SEEDS, seedSet: DEV ? "dev(1000+)" : "report(0..)", draws: n * SEEDS, caught, askAgain: ask, missed, distressSegHallucinated: hallTotal, viaPass2,
      recallMean: mean(rec), recallMin: Math.min(...rec), effectiveMean: mean(eff), effectiveMin: Math.min(...eff),
      perSeed, topMisses: [...misses.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25) },
  };
}

function fpSet(name, items, { perturb = 0 } = {}) {
  const hits = [];
  let n = 0, p1 = 0, p2 = 0;
  const runOne = (text, id) => {
    n++;
    const d = scan(text);
    if (d.distress) { if (d.pass === 1) p1++; else p2++; hits.push({ id, text, kind: d.kind, pass: d.pass, via: d.via }); }
  };
  for (const it of items) runOne(it.text, it.id);
  const out = { name, n, hits: p1 + p2, pass1: p1, pass2: p2, rate: (p1 + p2) / n, examples: hits.slice(0, 40) };
  if (perturb) {
    let pn = 0, pp1 = 0, pp2 = 0; const ph = [];
    for (let k = 0; k < perturb; k++) for (const it of items) {
      const segs = it.segs ?? [String(it.text).split(/\s+/).filter(Boolean)];
      const p = C.perturbedText({ ...it, segs }, C.seedOf(it.id, seedK(k)), { punct: false });
      pn++;
      const d = scan(p.text);
      if (d.distress) { if (d.pass === 1) pp1++; else pp2++; if (ph.length < 30) ph.push({ id: it.id, text: p.text, kind: d.kind, via: d.via }); }
    }
    out.perturbed = { draws: pn, hits: pp1 + pp2, pass1: pp1, pass2: pp2, rate: (pp1 + pp2) / pn, examples: ph };
  }
  return out;
}

const t0 = performance.now();
const fdb = C.taxilaFdbDistress();
const es3 = C.es3Distress();
const held = HELDOUT_DISTRESS.map(([text, kind], i) => ({ id: `held${i}`, segs: [text.split(/\s+/)], text, kind }));
const cv2 = (await C.conversationV2Distress()).filter((x) => x.text).map((x) => ({ ...x, segs: [x.text.split(/\s+/)] }));
const distress = [distressSet("taxilafdb_84", fdb), distressSet("es3_80", es3), distressSet("heldout_paraphrase_40", held), distressSet("conversation_v2_offline", cv2)];

const hn = HARD_NEGATIVES;
const fp = [
  fpSet("es1_lesson_turns", C.es1Turns(), { perturb: 3 }),
  fpSet("es3_other_220", C.es3Other()),
  fpSet("transcripts_child_turns", C.transcriptChildTurns()),
  fpSet("taxilafdb_lesson_segments", C.taxilaFdbLesson(), { perturb: SEEDS }),
  fpSet("hard_negatives_plain_dev", hn.filter((x) => x.plain && x.split === "dev")),
  fpSet("hard_negatives_plain_holdout", hn.filter((x) => x.plain && x.split === "holdout")),
  fpSet("hard_negatives_ambiguous", hn.filter((x) => !x.plain)),
];

// latency: µs per scan on lesson turns (the device runs it on every partial)
const lat = C.es1Turns().slice(0, 3000).map((x) => x.text);
const l0 = performance.now();
for (const t of lat) scanSafetyDetail(t);
const usPerScan = ((performance.now() - l0) * 1000) / lat.length;

const res = { id: `safety-robust-${LABEL}`, date: DATE, label: LABEL, baselineOnly: BASE, seeds: SEEDS, seedSet: DEV ? "dev" : "report",
  method: "scanSafetyDetail on clean and sttReal-perturbed text (evals/duplex/critic/perturb.mjs, critic seed at k=0); FP on lesson corpora", usPerScan: +usPerScan.toFixed(1),
  distress, fp, wallMs: Math.round(performance.now() - t0) };
fs.mkdirSync(path.join(HERE, "results"), { recursive: true });
const file = path.join(HERE, "results", `${DATE}-${LABEL}.json`);
fs.writeFileSync(file, JSON.stringify(res, null, 1));

const pct = (x) => `${(100 * x).toFixed(2)}%`;
console.log(`safety-robust ${LABEL} (${SEEDS} seeds, ${res.seedSet}${BASE ? ", PASS 1 ONLY" : ""}) — ${res.wallMs} ms, ${res.usPerScan} µs/scan`);
for (const d of distress) {
  console.log(`  ${d.name.padEnd(26)} clean ${d.clean.caught}/${d.n} (no-punct ${d.clean.cleanNoPunct}) | sttReal recall mean ${pct(d.perturbed.recallMean)} min ${pct(d.perturbed.recallMin)} | caught+ask-again mean ${pct(d.perturbed.effectiveMean)} min ${pct(d.perturbed.effectiveMin)} | missed ${d.perturbed.missed}/${d.perturbed.draws} (seg hallucinated ${d.perturbed.distressSegHallucinated})`);
  if (!QUIET) { for (const m of d.clean.missed.slice(0, 10)) console.log(`      clean miss: ${m}`); for (const [t, c] of d.perturbed.topMisses.slice(0, 12)) console.log(`      miss x${c}: ${t}`); }
}
for (const f of fp) {
  console.log(`  ${f.name.padEnd(30)} ${f.hits}/${f.n} = ${pct(f.rate)} (pass1 ${f.pass1}, pass2 ${f.pass2})${f.perturbed ? ` | sttReal ${f.perturbed.hits}/${f.perturbed.draws} = ${pct(f.perturbed.rate)} (pass1 ${f.perturbed.pass1}, pass2 ${f.perturbed.pass2})` : ""}`);
  if (!QUIET) { for (const e of f.examples.slice(0, 14)) console.log(`      [p${e.pass} ${e.via}] ${e.text}`); for (const e of (f.perturbed?.examples ?? []).filter((e) => !String(e.via).startsWith("families")).slice(0, 8)) console.log(`      [sttReal ${e.via}] ${e.text}`); }
}
console.log(`  -> ${path.relative(process.cwd(), file)}`);
