// lexical-horizon.mjs — duplex v2, measurement M-D6 (2026-10-04): can the words alone end a child's turn with ZERO
// silence, and what does that do on REAL streaming partials?
//
// Question (ARCHITECTURE.md v2 §1.3): the continuous engine estimates pComplete from semantics given the context ("62"
// after "27+35?" is complete with no silence). But the transcript lags the audio. When the words say "complete", how far
// behind the child's real end are we, and how often does a words-only decision fire while the child still has more to say
// (a self-repair, the answer after a filler, the second half of an explanation)?
//
// Method (deterministic, offline, no network, USD 0):
//   - input: the 28 BASE runs of M-D2 (evals/duplex/results/live-validate-2026-10-04.json): synthetic child TTS clips
//     streamed in real time to the production-candidate live transcriber (taxila-live-transcribe, D4, US container ->
//     eastus2, server VAD 900 ms, no client commits). Every partial/final has its arrival time on the audio clock; the
//     child's voiced segments are known exactly (we built the audio).
//   - the lexical features are the duplex prototype's understand() (server/duplex/understand.js, which uses Study C's
//     src/duplex/turnPolicy.ts): the same code the v2 rules engine reuses.
//   - rules, evaluated every 20 ms on the transcript visible at that instant:
//       W0  words-complete            the words say the contribution is complete (context-keyed, below); no acoustic check
//       W1  W0 + child silent now     and the child is not voicing at that instant
//       W2  W0 + child silent 200 ms  and the child has been silent >= 200 ms
//       W1H W1 + lexical horizon      and the visible transcript covers ALL the child's voiced audio so far (what word
//                                     timings or a commit-probe final give a real engine; here coverage is ESTIMATED by
//                                     mapping transcript characters proportionally onto the voiced segments [E])
//       W1HF W1H + expected form      and the answer FORM from the item (fraction needs a denominator; a yes/no token
//                                     closes a yes/no item; the STT's glued "बटाचार" is split). The form comes from the
//                                     key's SHAPE, never from whether the value is right (timing must stay verdict-blind).
//                                     Written after seeing these runs: IN-SAMPLE, an upper bound for a grammar fix
//       S640 / S900                   acoustic baselines: silence >= 640 / 900 ms after any child voicing (words ignored)
//   - outcome per run: the first decision time. PREMATURE = before the true end (the child had more to say; on a hold
//     request it is a hold violation). WRONG-VALUE = on a closed numeric item, the last value visible at decision time is
//     not the final value (the verdict hazard). GAP = decision time - true end, for non-premature decisions (no playback).
//   - ear-speed counterfactual [E, a re-timing model, not a measurement]: each partial is re-timed to arrive L ms after the
//     audio it covers (coverage = cumulative transcript characters mapped proportionally onto the voiced segments), with
//     L = 254 / 452 ms (Nemotron-3.5 text-complete-after-end p50 / p90, STT-v3 [M on the GPU host, no network]) + 40 ms
//     India RTT [E]. Arrival is never made later than measured. This asks: with a fast ear, what does W1 do?
// Limits: n = 28 scripted scenarios (one author, no kappa), synthetic TTS voices (no real children, E1 pending), one pass of
// one STT from a US container; the categories are chosen, not sampled from lessons. Small n: read rates with their CI.
//   node evals/duplex/lexical-horizon.mjs
import fs from "node:fs";
import path from "node:path";
import { RESULTS, q, mean, r0, wilson } from "./lib.mjs";
import { SCENARIOS } from "./scenarios.mjs";
import { understand, valuesIn, normText } from "../../server/duplex/understand.js";

const SRC = path.join(RESULTS, "live-validate-2026-10-04.json");
const OUT = path.join(RESULTS, "lexical-horizon-2026-10-04.json");
const live = JSON.parse(fs.readFileSync(SRC, "utf8"));
const byId = new Map(SCENARIOS.map((s) => [s.id, s]));
const STEP = 20;
const EXPLAINING = new Set(["teachback", "explain", "worked_example", "contrast", "explore_question", "reflect", "probe"]);

const YESNO_TOK = /(?:^|\s)(?:हाँ|हां|हा|haan|han|yes|नहीं|नही|nahi|nahin|no)(?:\s|$)/u;
/** Words say "complete", given the context (the v2 rules engine's lexical half; no audio, no model). */
function wordsComplete(text0, ctx, form = false) {
  const text = form ? String(text0).replace(/बटा(?=[^\s।,.])/gu, "बटा ") : text0;
  if (!text.trim()) return { ok: false, why: "empty" };
  const n = understand(text, ctx);
  if (n.safety.distress) return { ok: false, why: "safety" }; // safety is its own path (SAFETY_ATTEND), never a commit here
  if (n.holdTail) return { ok: false, why: "hold_request" };
  if (n.repairOpen) return { ok: false, why: "repair_open" };
  if (n.idk) return { ok: true, why: "idk" };
  const closed = ctx.answerForm === "number" || ctx.answerForm === "yesno" || ctx.answerForm === "choice";
  if (ctx.answerForm === "number") {
    if (form && ctx.formShape === "fraction" && n.lastValue !== null && !n.lastValue.includes("/")) return { ok: false, why: "form:fraction_pending" };
    return { ok: n.lastValue !== null && n.lex.p >= 0.8, why: `number:${n.lex.cue}` };
  }
  if (form && ctx.answerForm === "yesno" && YESNO_TOK.test(normText(text)) && n.lex.cue !== "open" && n.lex.cue !== "filler") return { ok: true, why: "form:yesno" };
  if (closed) return { ok: n.lex.p >= 0.8, why: `closed:${n.lex.cue}` };
  if (n.asks) return { ok: n.lex.p >= 0.75, why: `asks:${n.lex.cue}` };
  if (ctx.beat && EXPLAINING.has(ctx.beat)) return { ok: n.lex.p >= 0.85, why: `explain:${n.lex.cue}` };
  return { ok: n.lex.p >= 0.85, why: `open:${n.lex.cue}` };
}

/** The turn's visible text at time tau from an event list (partials are cumulative per item; a final replaces its item). */
function textAt(events, tau) {
  const items = new Map();
  const order = [];
  for (const e of events) {
    if (e.t > tau) break;
    if (e.type !== "partial" && e.type !== "final") continue;
    if (!items.has(e.itemId)) { items.set(e.itemId, { text: "", final: false }); order.push(e.itemId); }
    const it = items.get(e.itemId);
    if (it.final && e.type === "partial") continue;
    it.text = String(e.text || "").trim();
    if (e.type === "final") it.final = true;
  }
  return order.map((id) => items.get(id).text).filter(Boolean).join(" ").trim();
}

const voicingAt = (segs, tau) => segs.some((s) => tau >= s.start && tau <= s.end);
function silenceAt(segs, tau) {
  let last = null;
  for (const s of segs) { if (s.start <= tau) last = Math.min(s.end, tau); }
  if (last === null) return null; // the child has not spoken yet
  return voicingAt(segs, tau) ? 0 : tau - last;
}

/** Map a character count of the turn text onto the audio clock (proportional over the voiced segments' script lengths). */
function coverageTime(chars, finalChars, segs) {
  const lens = segs.map((s) => normText(s.text).replace(/\s/g, "").length || 1);
  const total = lens.reduce((a, b) => a + b, 0);
  let c = finalChars ? (chars / finalChars) * total : 0;
  for (let k = 0; k < segs.length; k++) {
    if (c <= lens[k]) return segs[k].start + (c / lens[k]) * (segs[k].end - segs[k].start);
    c -= lens[k];
  }
  return segs[segs.length - 1].end;
}

/** Re-time partial/final events as if the ear delivered text L ms after the audio it covers (never later than measured). */
function retime(events, segs, L) {
  const textual = events.filter((e) => e.type === "partial" || e.type === "final");
  const finalText = textAt(events, Infinity);
  const finalChars = normText(finalText).replace(/\s/g, "").length;
  const out = [];
  for (let i = 0; i < textual.length; i++) {
    // cumulative turn text INCLUDING this event and nothing after it (events that share an arrival time stay distinct)
    const cum = textAt(textual.slice(0, i + 1), Infinity);
    const cov = coverageTime(normText(cum).replace(/\s/g, "").length, finalChars, segs);
    out.push({ ...textual[i], t: Math.min(textual[i].t, Math.round(cov + L)) });
  }
  // causal content order: a later event of the turn can never arrive before an earlier one
  for (let i = 1; i < out.length; i++) out[i].t = Math.max(out[i].t, out[i - 1].t);
  return out;
}

function firstDecision(rule, events, segs, ctx, durMs, finalChars) {
  for (let tau = 0; tau <= durMs + 3000; tau += STEP) {
    const sil = silenceAt(segs, tau);
    if (rule === "S640" || rule === "S900") {
      if (sil !== null && sil >= (rule === "S640" ? 640 : 900)) return { t: tau, text: textAt(events, tau), why: rule };
      continue;
    }
    const text = textAt(events, tau);
    const w = wordsComplete(text, ctx, rule === "W1HF");
    if (!w.ok) continue;
    if ((rule === "W1" || rule === "W1H" || rule === "W1HF") && (sil === null || sil === 0)) continue;
    if (rule === "W1H" || rule === "W1HF") {
      const lastVoicedEnd = Math.max(...segs.filter((x) => x.start <= tau).map((x) => Math.min(x.end, tau)));
      const cov = coverageTime(normText(text).replace(/\s/g, "").length, finalChars, segs);
      if (cov < lastVoicedEnd - 60) continue; // the words do not yet cover the child's latest speech: stale prefix
    }
    if (rule === "W2" && (sil === null || sil < 200)) continue;
    return { t: tau, text, why: w.why };
  }
  return null;
}

const RULES = ["W0", "W1", "W2", "W1H", "W1HF", "S640", "S900"];
const EARS = [
  { id: "D4-measured", L: null },
  { id: "fast-ear-p50 (254+40 ms) [E]", L: 294 },
  { id: "fast-ear-p90 (452+40 ms) [E]", L: 492 },
];

const runs = live.runs.filter((r) => r.arm === "BASE");
const rows = [];
for (const ear of EARS) {
  for (const r of runs) {
    const sc = byId.get(r.id);
    const ctx = { answerForm: sc.ctx.answerForm, beat: sc.ctx.beat, misconceptionValues: sc.ctx.misconceptionValues,
      formShape: String(sc.ctx.key ?? "").includes("/") ? "fraction" : "integer" };
    const segs = r.segs.map((s) => ({ ...s }));
    const events = ear.L === null ? r.events : retime(r.events, segs, ear.L);
    const finalText = textAt(r.events, Infinity);
    const finalChars = normText(finalText).replace(/\s/g, "").length;
    const finalVals = valuesIn(finalText.replace(/बटा(?=[^\s।,.])/gu, "बटा "));
    const finalValue = finalVals.length ? finalVals[finalVals.length - 1].v : null;
    const distressSeg = sc.truth.distressSeg;
    for (const rule of RULES) {
      const d = firstDecision(rule, events, segs, ctx, r.durMs, finalChars);
      const row = { ear: ear.id, id: r.id, cat: r.cat, expect: r.expect, rule, trueEnd: r.trueEnd, decidedAt: d?.t ?? null, why: d?.why ?? null, text: d?.text ?? null };
      if (d) {
        row.premature = d.t < r.trueEnd - STEP;
        row.gap = row.premature ? null : d.t - r.trueEnd;
        if (ctx.answerForm === "number" && rule !== "S640" && rule !== "S900") {
          const v = valuesIn(String(d.text || "").replace(/बटा(?=[^\s।,.])/gu, "बटा "));
          row.valueAtDecision = v.length ? v[v.length - 1].v : null;
          row.wrongValue = finalValue !== null && row.valueAtDecision !== finalValue;
        }
        if (distressSeg !== undefined) row.beforeDisclosureEnd = d.t < segs[distressSeg].end;
      } else row.missed = true;
      rows.push(row);
    }
  }
}

// the BASE arm's own turn gap: last final arrival - true end (today's server VAD 900 ms + D4 final)
const baseGap = runs.map((r) => {
  const finals = r.events.filter((e) => e.type === "final");
  return finals.length ? finals[finals.length - 1].t - r.trueEnd : null;
}).filter((x) => x !== null);

const CATS = ["closed_fluent", "closed_hesitant", "self_correction", "explain_pauses", "fillers_wordsearch", "question", "idk", "hold_request", "distress"];
function summarise(sel) {
  const decided = sel.filter((x) => x.decidedAt !== null);
  const commitLike = sel.filter((x) => x.expect === "commit" || x.expect === "hold");
  const prem = commitLike.filter((x) => x.premature);
  const gaps = sel.filter((x) => x.gap !== null && x.gap !== undefined && (x.expect === "commit")).map((x) => x.gap);
  const num = sel.filter((x) => x.wrongValue !== undefined);
  const wrong = num.filter((x) => x.wrongValue);
  const dis = sel.filter((x) => x.beforeDisclosureEnd !== undefined);
  return {
    n: sel.length, decided: decided.length, missed: sel.length - decided.length,
    premature: { k: prem.length, n: commitLike.length, rate: commitLike.length ? +(prem.length / commitLike.length).toFixed(3) : null, ci80: wilson(prem.length, commitLike.length) },
    wrongValueAtDecision: { k: wrong.length, n: num.length, ci80: wilson(wrong.length, num.length) },
    gapAfterTrueEndMs: { n: gaps.length, p10: r0(q(gaps, 0.1)), p50: r0(q(gaps, 0.5)), p90: r0(q(gaps, 0.9)), mean: r0(mean(gaps)) },
    decidedBeforeDisclosureEnd: { k: dis.filter((x) => x.beforeDisclosureEnd).length, n: dis.length },
  };
}

const summary = {};
for (const ear of EARS) {
  summary[ear.id] = {};
  for (const rule of RULES) {
    const sel = rows.filter((x) => x.ear === ear.id && x.rule === rule);
    const byCat = {};
    for (const c of CATS) {
      const s = sel.filter((x) => x.cat === c);
      if (s.length) byCat[c] = { n: s.length, premature: s.filter((x) => x.premature).length, wrongValue: s.filter((x) => x.wrongValue).length,
        gapP50: r0(q(s.filter((x) => x.gap !== null && x.gap !== undefined).map((x) => x.gap), 0.5)) };
    }
    summary[ear.id][rule] = { ...summarise(sel), byCat };
  }
}

const out = {
  id: "M-D6", date: "2026-10-04", source: path.relative(process.cwd(), SRC), n: runs.length,
  method: "replay of M-D2 BASE runs (real D4 streaming partials, synthetic child TTS) through words-only completeness rules (understand.js + turnPolicy.ts) every 20 ms; acoustic baselines S640/S900 from the known voiced segments; fast-ear rows re-time partials to coverage + L [E]",
  baseArmTurnGapMs: { n: baseGap.length, p50: r0(q(baseGap, 0.5)), p90: r0(q(baseGap, 0.9)) },
  summary, rows,
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
for (const ear of EARS) {
  console.log(`\n== ${ear.id}`);
  for (const rule of RULES) {
    const s = summary[ear.id][rule];
    console.log(`${rule.padEnd(5)} premature ${s.premature.k}/${s.premature.n} ${JSON.stringify(s.premature.ci80)}  wrongValue ${s.wrongValueAtDecision.k}/${s.wrongValueAtDecision.n}  gap p50/p90 ${s.gapAfterTrueEndMs.p50}/${s.gapAfterTrueEndMs.p90} (n=${s.gapAfterTrueEndMs.n})  missed ${s.missed}  beforeDisclosure ${s.decidedBeforeDisclosureEnd.k}/${s.decidedBeforeDisclosureEnd.n}`);
    console.log("      " + Object.entries(s.byCat).map(([c, v]) => `${c}:${v.premature}/${v.n}${v.wrongValue ? ` wv${v.wrongValue}` : ""} g${v.gapP50}`).join("  "));
  }
}
console.log(`\nBASE arm turn gap (last final - true end): p50 ${out.baseArmTurnGapMs.p50} p90 ${out.baseArmTurnGapMs.p90} n=${out.baseArmTurnGapMs.n}`);
console.log(`wrote ${path.relative(process.cwd(), OUT)}`);
