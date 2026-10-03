// Blind closed-label grading OFF the reply path (INTEGRATION.md §8; COMPREHENSION-ENGINE.md §4.2, CE5, E6). A why or
// a teach-back answer moves the Director at once on the classifier's label (the move is not delayed), but its
// EVIDENCE event is held: the blind grader (DeepSeek-V4-Pro → taxila-brain, Azure Direct) runs in the background
// after the turn commits, and the event — with the grader's outcome and the code span check — is folded at the
// start of the NEXT turn. No serial model call is added to any turn.
//
// When the verdict is not in by then (still running, a different replica, a restart), the event lands with the
// classifier's outcome and spanOk:false: it carries K evidence but no U/T (E6 fails closed). The pending map is
// in-process; the held events themselves live in the lesson state, so nothing is lost across replicas.
import { gradeClosed, GRADER_VERSION } from "./grade/closed.js";
import { whyOutcome, teachbackOutcome } from "./grade/ops.js";

const PENDING = new Map();
const TTL_MS = 30 * 60_000;
const MAX_TARGETS = 4;
function sweep(now = Date.now()) {
  if (PENDING.size < 500) return;
  for (const [k, v] of PENDING) if (now - v.at > TTL_MS) PENDING.delete(k);
}

/**
 * Start grading a held event in the background (never awaited by the turn). One R-EXP call per kit target
 * (a why: its key ideas, ≤ 4; a teach-back: each expectation), in parallel.
 * @param {any} ev the held EvidenceEvent (probe.why | probe.teachback)
 * @param {{ childText: string, targets: { id: string, textEn: string }[], echo?: string[], lang?: string }} r
 * @param {{ grade?: typeof gradeClosed }} [o]
 */
export function gradeLater(ev, { childText, targets, echo = [], lang = "en" }, { grade = gradeClosed } = {}) {
  sweep();
  const text = String(childText ?? "").trim();
  const ts = (targets ?? []).filter((t) => t?.id && t?.textEn).slice(0, MAX_TARGETS);
  if (!text || !ts.length) return null;
  const entry = { at: Date.now(), settled: false, results: null };
  entry.promise = Promise.all(ts.map((target) => grade({ op: "R-EXP", childSpan: text, target, lang }, { echo })
    .catch(() => ({ label: "NA", spanOk: false, op: "R-EXP", targetId: target.id, graderVersion: GRADER_VERSION, model: null, ms: 0, span: null }))))
    .then((results) => { entry.results = results; entry.settled = true; return results; });
  PENDING.set(ev.id, entry);
  return entry.promise;
}

/** The verdicts for a held event if they are in (non-blocking), else undefined. */
export function settledGrade(evId) {
  const e = PENDING.get(evId);
  return e?.settled ? e.results : undefined;
}
/** Wait at most `ms` for a held event's verdicts (lesson end only). */
export async function awaitGrade(evId, ms) {
  const e = PENDING.get(evId);
  if (!e) return undefined;
  if (e.settled) return e.results;
  return Promise.race([e.promise, new Promise((r) => setTimeout(() => r(undefined), ms))]);
}
export const forgetGrade = (evId) => PENDING.delete(evId);

const RANK = { present: 4, partial: 3, contradicted: 2, absent: 1, NA: 0 };

/**
 * The event as it is folded: the blind grader's outcome when it answered, else the classifier's with spanOk:false.
 * A why takes its best-supported idea (present > partial > contradicted > absent); a teach-back the coverage rule
 * (ops.teachbackOutcome). spanOk is true only when every positive label's span was checked in code.
 * @returns {{ event: any, results: any[] }}
 */
export function finalEvent(ev, results) {
  const fallback = { event: { ...ev, spanOk: false }, results: results ?? [] };
  if (!results?.length) return fallback;
  const real = results.filter((r) => r.label && r.label !== "NA");
  if (!real.length) return fallback;
  const base = { ...ev, grader: "llm", graderVersion: GRADER_VERSION };
  if (ev.cls === "probe.why") {
    const best = [...real].sort((a, b) => RANK[b.label] - RANK[a.label] || (a.targetId < b.targetId ? -1 : 1))[0];
    const outcome = whyOutcome(best.label);
    const mis = best.label === "contradicted" && ev.misconceptionId ? { misconceptionId: ev.misconceptionId } : {};
    const { misconceptionId: _m, ...rest } = base;
    return { event: { ...rest, ...mis, outcome, spanOk: best.label === "present" || best.label === "partial" ? best.spanOk === true : false }, results };
  }
  if (ev.cls === "probe.teachback") {
    const outcome = teachbackOutcome(real.map((r) => r.label));
    if (outcome == null) return fallback;
    const positives = real.filter((r) => r.label === "present" || r.label === "partial");
    const { misconceptionId: _m, ...rest } = base;
    return { event: { ...rest, outcome, spanOk: positives.length > 0 && positives.every((r) => r.spanOk === true) }, results };
  }
  return fallback;
}
