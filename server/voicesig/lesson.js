// The voicesig seam for the live lesson (ship5 p3-voicesig). Everything the hot files need is here, so each of them gains
// only a call:
//   routes/lesson.js start → startRows()   the child's baseline: persisted rows under the parent's "remember answering
//                                          pace" choice (consent purpose voice_pace_memory), else an empty session one
//   brain/turn.js         → turn()         EVERY committed spoken turn: kv (device numbers) + the transcript + the grader
//                                          verdict → the knowledge state, the gate decision, the consumer hints, the
//                                          trace codes and the updated session baseline
//   routes/lesson.js end   → endSave()     write the baseline back (V2 only), off the reply path
//   routes/account.js      → withdraw()    the parent turned "remember answering pace" off: delete now
//   GET /api/voicesig/config|status        the client kill switch and the status page's per-state table
//
// Rules this file enforces (tests/p3-voicesig-*.test.mjs):
//   - Safety first: a turn the predicate, the classifier or the duplex floor marks as a disclosure gets NOTHING from
//     voicesig (no state, no hint, no trace code, no baseline update). Re-checked here with scanSafety, so a caller that
//     forgets the flag still fails closed.
//   - A state acts only through the gate (gate.js: mode on + measured on children at precision >= 0.80 + ladder >= L1).
//     Below that it is SHADOW: computed and logged as brain_trace codes, and `hints` is empty, so the Director,
//     comprehension and pace consumers receive exactly what they received before this stream.
//   - Restriction 12: knowledge-state names only; every outgoing code passes lint.js cleanCodes().
//   - Never a visible failure: every entry point catches and returns the no-voicesig value.
//   - Nothing from here reaches a prompt, the child or a parent payload: hints are booleans in the existing tie-breaker
//     vocabulary (followUpProbe / gentlerHint / slowerPace), and the read goes to the trace only.
import { toSignalInput, updateBaseline, validateKv } from "./adapter.js";
import { VsBaseline, loadBaseline, saveBaseline, withdraw as withdrawRows } from "./baseline.js";
import { EVIDENCE, COMPONENTS, GATE_VER, gateReason, statusTable } from "./gate.js";
import { cleanCodes } from "./lint.js";
import { LADDER } from "./ladder.js";
import { readText } from "../signals/linguistic.js";
import { fillerLexOf } from "./rules.js";
import { scanSafety } from "../director/safety.js";
import { bandsFor } from "../learner/bands.js";

export const SEAM_VER = "vs-seam/1";
/** The parent's opt-in: "Remember {child}'s usual answering pace" (off by default; DPDP s.9(3) caution). */
export const PACE_PURPOSE = "voice_pace_memory";
/** Consent text version for the pace choice (shown in Controls; KEEP IN STEP with src/voicesig/consentCopy.ts). */
export const PACE_CONSENT_VER = "2026-10-05.vs1";
/** Session baseline rows kept in lesson.state (each ~60 bytes); the least-used rows go first past this. */
export const MAX_SESSION_ROWS = 120;

/**
 * TAXILA_VOICESIG = off | shadow | on. Unset → shadow: the pipeline ships ON (owner: ship it) and every state is gated
 * to shadow until measured on children; `off` is the kill switch (no kv read, no trace, the client keeps its old tap).
 */
export function seamMode(env = process.env) {
  const m = String(env?.TAXILA_VOICESIG ?? "shadow").trim().toLowerCase();
  return m === "off" || m === "on" ? m : "shadow";
}

/** class → the adapter's age band (younger children's acoustic cues are halved, SPEC §4.2). */
export function ageBandOf(classLevel) {
  try { return bandsFor(classLevel).typicalAge[0] <= 9 ? "9-10" : "11-13"; } catch { return "9-10"; }
}
const bandOf = (classLevel) => { try { return bandsFor(classLevel).b4; } catch { return "B2"; } };

/** The grader verdict the adapter reads (never a model's opinion of the voice). */
export function verdictOf(cls) {
  const o = cls?.outcome;
  if (o === "correct") return "correct";
  if (o === "partial") return "partial";
  if (o === "incorrect" || o === "misconception") return "not_yet";
  return "ungraded";
}

/** The answer form the baseline is keyed by (SPEC §3.1). */
export function formOf(item, context) {
  if (context === "read_aloud") return "read_aloud";
  if (!item) return "word";
  if (["why", "teachback"].includes(item.kind)) return "explain";
  if (Array.isArray(item.options) && item.options.length) return "choice_spoken";
  return /^\s*-?\d+(?:[.,/]\d+)?\s*$/.test(String(item.answer ?? "")) ? "number" : "word";
}

/** Consumer hints from a LIVE read, in the tie-breaker vocabulary the Director / comprehension / pace already read. */
export function hintsOf(read) {
  if (!read?.live || !read.state) return {};
  const L = read.licence;
  switch (read.state) {
    case "fragileCorrect": return L === "why_probe" || L === "why_probe_or_consolidate" ? { followUpProbe: true } : {};
    case "effortfulGuess": return L === "scaffold" ? { gentlerHint: true } : {};
    case "searching": return L === "recall_cue" || L === "fsrs_lapse_route" ? { gentlerHint: true } : {};
    case "workingAloud": return L === "wait" ? { slowerPace: true } : {};
    default: return {};
  }
}

const NONE = Object.freeze({ read: null, hints: {}, reasons: [], vsb: undefined, trace: null });

/** Keep the session baseline small: most-used rows first. */
function trimRows(rows) {
  const ks = Object.keys(rows);
  if (ks.length <= MAX_SESSION_ROWS) return rows;
  return Object.fromEntries(ks.sort((a, b) => (rows[b].n ?? 0) - (rows[a].n ?? 0)).slice(0, MAX_SESSION_ROWS).map((k) => [k, rows[k]]));
}

/**
 * One committed child turn. Pure apart from reading `env` (passed in).
 * @param {{
 *   kv: any, typed?: boolean, bargeIn?: boolean, safety?: boolean, childText?: string, cls?: any, item?: any,
 *   context?: "answer"|"read_aloud", vsb?: { rows?: Record<string, any>, persisted?: boolean, lastWrong?: any },
 *   classLevel?: number, env?: Record<string, string|undefined>, ladder?: any, evidence?: any, cal?: any,
 * }} t
 * @returns {{ read: null | { state: string|null, proposed: string|null, licence: string|null, live: boolean, why: string|null, tAgree: boolean, baselineN: number },
 *   hints: Record<string, true>, reasons: string[], vsb: any, trace: any }}
 */
export function turn(t) {
  try {
    const mode = seamMode(t.env);
    if (mode === "off" || t.typed || !t.kv) return { ...NONE, vsb: t.vsb };
    const childText = String(t.childText ?? "");
    // Safety first (SL-1): the caller's flag OR the shared predicate on these words. Nothing comes back, not even a code,
    // and the baseline is not touched (a disclosure turn's timing is never part of the child's "usual pace").
    if (t.safety || scanSafety(childText).distress) return { ...NONE, vsb: t.vsb, reasons: [] };
    const kv = validateKv(t.kv);
    if (!kv) return { ...NONE, vsb: t.vsb, reasons: ["vs.no_kv"] };
    const L = readText({ childText, cls: t.cls, item: t.item ? { key: t.item.answer, kitTerms: t.item.kitTerms ?? [] } : undefined });
    const verdict = verdictOf(t.cls);
    const context = t.context === "read_aloud" ? "read_aloud" : "answer";
    const form = formOf(t.item, context);
    const rows = t.vsb?.rows ?? {};
    const baseline = new VsBaseline(rows);
    const answerNorm = String(t.cls?.answer ?? childText).trim().toLowerCase();
    const lw = t.vsb?.lastWrong;
    const o3History = verdict === "not_yet" && !!t.item?.id && lw?.itemId === t.item.id && lw?.answer === answerNorm;
    const ctx = {
      verdict, safety: false, words: L.words, o3History, context, form, langMode: L.langMode, ageBand: ageBandOf(t.classLevel),
      ling: { idk: L.idk?.v ?? null, hedge: !!L.hedge, fillerLex: fillerLexOf(L.toks) === true, toks: L.toks, repairDir: L.repairDir ?? null, thinkAloud: !!L.thinkAloudLex, tFluent: false },
      baseline, mode, ladder: t.ladder ?? LADDER,
      // a fitted per-head calibration (none ships: SPEC §6.3 fits it on the pilot); without one the adapter keeps every
      // state shadow by its own rule, whatever the gate says
      ...(t.cal ? { cal: t.cal } : {}),
    };
    const vs = toSignalInput(kv, ctx);
    // The session baseline learns from this turn AFTER it was scored (a turn never z-scores against itself).
    const nextRows = { ...rows };
    const b2 = new VsBaseline(nextRows);
    updateBaseline(b2, kv, { ...ctx, bargeIn: !!t.bargeIn });
    const vsb = {
      rows: trimRows(b2.rows), persisted: !!t.vsb?.persisted,
      lastWrong: verdict === "not_yet" && t.item?.id ? { itemId: t.item.id, answer: answerNorm } : verdict === "correct" ? null : lw ?? null,
      // the number of committed turns that carried kv (status / acceptance read it; never shown to anyone)
      turns: (t.vsb?.turns ?? 0) + 1,
    };
    if (!vs || vs.abstain) return { ...NONE, vsb, reasons: [] };
    const gate = vs.state ? gateReason(vs.state, { mode, evidence: t.evidence ?? EVIDENCE, ladder: t.ladder ?? LADDER }) : "no_state";
    // Live needs BOTH the adapter's own rule (mode on, level >= 1, a fitted calibration) AND the precision gate.
    const live = !!vs.state && !vs.shadow && gate === null;
    const read = { state: vs.state, proposed: vs.proposed ?? null, licence: vs.licence, live, why: live ? null : gate === null ? "adapter_shadow" : gate, tAgree: !!vs.tAgree, baselineN: vs.baselineN };
    const hints = hintsOf(read);
    const codes = [
      vs.state ? `vs.${vs.state}` : vs.disagree ? "vs.disagree" : "vs.none",
      ...(vs.state ? [live ? "vs_gate.live" : `vs_gate.${read.why}`] : []),
      ...Object.keys(hints).map((h) => `vs_act.${h}`),
    ];
    const { kept } = cleanCodes(codes);
    return {
      read, hints, reasons: kept, vsb,
      trace: { ver: SEAM_VER, gate: GATE_VER, state: vs.state, licence: vs.licence, live, h: vs.h, g: vs.g, lrV: vs.lrV, n: vs.baselineN, computeMs: kv.computeMs, stage: kv.stage, det: kv.q.det },
    };
  } catch (e) {
    return { ...NONE, vsb: t.vsb, reasons: ["component_error.voicesig"], error: String(e?.message ?? e) };
  }
}

/**
 * The child's baseline at lesson start. Persisted rows only when the parent chose "remember answering pace" AND the
 * subject key is configured; otherwise an empty session baseline (band priors until n >= 8). Never throws.
 * @param {{ q: Function, hasConsent: Function, guardianId: string, childId: string, env?: any }} d
 */
export async function startRows(d) {
  const env = d.env ?? process.env;
  if (seamMode(env) === "off") return undefined;
  try {
    const key = env.VOICESIG_SUBJECT_KEY;
    const v2 = !!key && await d.hasConsent(d.guardianId, d.childId, PACE_PURPOSE);
    if (!v2) return { rows: {}, persisted: false, turns: 0 };
    const { baseline } = await loadBaseline(d.q, { childId: d.childId, key, v2: true });
    return { rows: trimRows(baseline.rows), persisted: true, turns: 0 };
  } catch (e) {
    console.warn("[voicesig] baseline load failed; session-only:", e?.message ?? e);
    return { rows: {}, persisted: false, turns: 0 };
  }
}

/**
 * Lesson end: write the session's rows back (V2 only). Re-checks consent now (a parent may have withdrawn mid-lesson).
 * Every row is written as dirty: n_total is the optimistic lock, so a concurrent lesson that advanced it wins.
 * @returns {Promise<number>} rows written (0 when not persisted). Never throws.
 */
export async function endSave(d) {
  const env = d.env ?? process.env;
  try {
    const vsb = d.vsb;
    const key = env.VOICESIG_SUBJECT_KEY;
    if (seamMode(env) === "off" || !vsb?.persisted || !key || !vsb.rows || !Object.keys(vsb.rows).length) return 0;
    if (!(await d.hasConsent(d.guardianId, d.childId, PACE_PURPOSE))) return 0;
    const b = new VsBaseline(vsb.rows);
    for (const k of Object.keys(vsb.rows)) b.dirty.add(k);
    return await saveBaseline(d.q, { childId: d.childId, key, v2: true, band: bandOf(d.classLevel), consentVer: PACE_CONSENT_VER }, b);
  } catch (e) {
    console.warn("[voicesig] baseline save failed (kept session-only):", e?.message ?? e);
    return 0;
  }
}

/** The parent withdrew "remember answering pace": delete the child's rows now (cascade). Never throws; returns ok. */
export async function withdraw(d) {
  const key = (d.env ?? process.env).VOICESIG_SUBJECT_KEY;
  if (!key) return true; // nothing can have been stored without the key
  try { await withdrawRows(d.q, { childId: d.childId, key }); return true; } catch (e) {
    console.warn("[voicesig] withdrawal delete failed (nightly backstop will retry):", e?.message ?? e);
    return false;
  }
}

/**
 * The backstop for withdrawal (and for a grant that lapsed any other way): delete every stored subject whose child's
 * LATEST voice_pace_memory consent row (child-specific or guardian-wide, as auth.js hasConsent reads it) is not a grant.
 * Cascades to baseline + calibration. Needs no subject key (voicesig.subject keeps child_id for exactly this and for
 * erasure). Run by the worker's ticker leader (patch 11) and by `node scripts/voicesig/sweep.mjs`. Never throws.
 * @param {(sql: string, params?: unknown[]) => Promise<any[]>} q
 * @returns {Promise<number>} subjects deleted, or -1 when the sweep could not run (missing schema, database down)
 */
export const SWEEP_SQL =
  "delete from voicesig.subject s using child ch where ch.id = s.child_id and coalesce((select c.granted from consent c " +
  "where c.guardian_id = ch.guardian_id and (c.child_id = s.child_id or c.child_id is null) and c.purpose = $1 " +
  "order by c.created_at desc limit 1), false) = false returning s.child_id";
export async function sweep(q) {
  try {
    return (await q(SWEEP_SQL, [PACE_PURPOSE])).length;
  } catch (e) {
    console.warn("[voicesig] consent sweep failed (retried on the next run):", e?.message ?? e);
    return -1;
  }
}

/** GET /api/voicesig/config: what the client may run. No child data; short cache so a kill reaches new loads quickly. */
export function config(env = process.env) {
  const mode = seamMode(env);
  return { mode, frontend: mode !== "off" && env.TAXILA_VOICESIG_FRONTEND !== "0", detector: mode !== "off" && env.TAXILA_VOICESIG_DETECTOR !== "0", ver: SEAM_VER };
}

/** GET /api/voicesig/status: the per-state table for the status page (VALUES-100 V2 item 3). */
export function status(env = process.env) {
  const mode = seamMode(env);
  const states = statusTable({ mode });
  return {
    ver: SEAM_VER, mode, liveStates: states.filter((s) => s.live).map((s) => s.state), states, components: COMPONENTS,
    persistence: env.VOICESIG_SUBJECT_KEY ? "per_child_under_pace_consent" : "session_only_no_subject_key",
    honesty: states.some((s) => s.population === "children")
      ? "Some states are measured on children; the rest show simulated or adult-speech numbers, labelled, and run in shadow."
      : "No state is measured on children yet: every number here is simulated or adult speech, and every state runs in shadow.",
  };
}

export const voicesigSeam = { turn, startRows, endSave, withdraw, sweep, config, status, mode: seamMode };
