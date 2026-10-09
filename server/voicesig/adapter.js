// Device kv → signal-layer evidence (SPEC §4). SHADOW ONLY in this build: every output carries `lrVApplied = 1` unless
// the mode is "on" AND the state's ladder level is ≥ 1 AND its calibration was fitted on outcome-labelled child data —
// none of which is true today (ladder.js ships every state at L0). Pure: no clock, no I/O, no env reads (the caller passes
// its env), so it runs inside server/signals' purity budget once proposal A2 lands.
//
// Order (SPEC §4.1): safety first (a safety turn suppresses every voicesig output), validate kv, z against the child's own
// voicesig baseline, stage-1 rules → h1..h4, derive the knowledge state with Tier-T agreement (SL-4 / SL-11), compute the
// LR voice adds over text alone, gate it (audio quality × baseline maturity), clip to the ladder cap.
// The LR REPLACES the onset/filler term of SIGNALS lrE (never stacks on it): see replaceTimingTerm().
import { CHEAP, LICENCE, capFor, levelOf, LADDER } from "./ladder.js";
import { score, fillerLexOf } from "./rules.js";
import { VsBaseline } from "./baseline.js";

export const ADAPTER_VER = "vs-adapter/1";

/** Range-checked allowlist for kv (proposal A3 copies these into server/voice/features.js before the client sends kv). */
export const KV_F_RANGES = Object.freeze({
  onsetMs: [0, 20_000], contentOnsetMs: [0, 40_000], fillerLeadMs: [0, 20_000], fillerRuns: [0, 200], durationMs: [0, 120_000],
  voicedFrac: [0, 1], pauseFrac: [0, 1], longestPauseMs: [0, 120_000], articulationWps: [0, 15], finalRelDb: [-60, 60],
  flatVoicedRuns: [0, 500],
  // round 3: the thinking-pause cue's counters for this turn (src/voicesig/holdCue.ts): pauses it read, pauses it called
  // a thinking pause. Numbers only; shadow telemetry (the trace's vs_hold.fired), never a knowledge-state input.
  pausesRead: [0, 200], thinkPauses: [0, 200],
});
const MIC = new Set(["builtin", "wired", "bt", "speaker_route", "unknown"]);
const LANG = new Set(["hi", "hinglish", "en", "unk"]);
/** Mic-class factor on audio quality (SPEC §4.2) [E]. */
export const MIC_FACTOR = Object.freeze({ builtin: 1, wired: 1, bt: 0.8, speaker_route: 0.5, unknown: 0.8 });
/**
 * Mic routes on which the filler detector's output is NOT used (verify pass 2026-10-04, AMI test channels, proxy chain):
 * 300-3400 Hz narrowband without AGC dropped word AUROC 0.93 → 0.71 and event recall 0.64 → 0.15 (precision 0.90 → 0.31).
 * Bluetooth HFP and speakerphone routes are narrowband / heavily processed, so their detector lead is ignored.
 */
export const NARROWBAND_MIC = Object.freeze(new Set(["bt", "speaker_route"]));
/** State thresholds on h (SPEC §1.3) [U]. */
export const TH = Object.freeze({ fluent: 0.85, fragile: 0.55, held: 0.5, rapidAgree: 0.6, searching: 0.6, absent: 0.35 });

const fin = (x) => typeof x === "number" && Number.isFinite(x);
const odds = (p) => Math.min(1e6, Math.max(1e-6, p / (1 - p)));

/** TAXILA_VOICESIG = off | shadow | on (default off). */
export function vsMode(env = {}) {
  const m = String(env.TAXILA_VOICESIG ?? "off").trim().toLowerCase();
  return m === "on" || m === "shadow" ? m : "off";
}

/** Validate a client kv. Returns a clean copy, or null (an invalid kv is dropped, never a 400: features are tie-breakers). */
export function validateKv(kv) {
  if (!kv || typeof kv !== "object" || kv.v !== 1) return null;
  if (![0, 1, 2].includes(kv.stage)) return null;
  if (typeof kv.modelVer !== "string" || kv.modelVer.length > 64) return null;
  const f = {};
  for (const [k, v] of Object.entries(kv.f ?? {})) {
    const r = KV_F_RANGES[k];
    if (!r) return null;
    if (v == null) continue;
    if (!fin(v) || v < r[0] || v > r[1]) return null;
    f[k] = v;
  }
  if (!fin(f.durationMs)) return null;
  const q = kv.q ?? {};
  if (!fin(q.audio) || q.audio < 0 || q.audio > 1) return null;
  if (!MIC.has(q.micClass) || !LANG.has(q.langMode)) return null;
  let aLogit;
  if (kv.aLogit != null) {
    if (!Array.isArray(kv.aLogit) || kv.aLogit.length !== 4 || !kv.aLogit.every((v) => fin(v) && v >= -20 && v <= 20)) return null;
    aLogit = kv.aLogit.slice();
  }
  if (!fin(kv.computeMs) || kv.computeMs < 0 || kv.computeMs > 5000) return null;
  return { v: 1, stage: kv.stage, modelVer: kv.modelVer, f, q: { audio: q.audio, raw: q.raw ? 1 : 0, enc: q.enc ? 1 : 0, det: q.det ? 1 : 0, micClass: q.micClass, langMode: q.langMode }, aLogit, computeMs: kv.computeMs };
}

/**
 * Derive the knowledge state from h, the verdict and Tier T. Returns { state, tAgree, disagree, head, source }.
 * `source` = "E" when voice terms moved the deciding head, "T" when text alone reached it (then voice adds nothing).
 */
export function deriveState(s, x) {
  const L = x.ling ?? {};
  const v = x.verdict;
  const words = fin(x.words) ? x.words : null;
  const res = (state, head, tAgree, disagree = false) => ({
    state: disagree ? null : state, head, tAgree: !!tAgree, disagree, source: s.sE[head] !== 0 ? "E" : "T", proposed: state,
  });
  // workingAloud: procedure talk with resumed pauses or a long turn; needs no verdict (timing only, no evidence).
  if (L.thinkAloud && ((fin(x.z?.pauseFrac) && x.z.pauseFrac >= 0.5) || (fin(x.z?.durationMs) && x.z.durationMs >= 0.67)) && v === "ungraded") {
    return res("workingAloud", "h1", true);
  }
  // Non-answers: searching vs absent (h2). A lexical IDK of the other kind is T disagreement → null.
  if (L.idk) {
    if (s.h.h2 >= TH.searching) return res("searching", "h2", L.idk === "cant_recall", L.idk === "not_known" && s.sE.h2 > 0);
    if (s.h.h2 <= TH.absent) return res("absent", "h2", L.idk === "not_known", L.idk === "cant_recall" && s.sE.h2 < 0);
    return { state: null, head: "h2", tAgree: false, disagree: false, source: "T", proposed: null };
  }
  if (v === "ungraded") return { state: null, head: null, tAgree: false, disagree: false, source: "T", proposed: null };
  // rapidGuess first: a very fast short answer down-weights whatever verdict it carries.
  if (s.onsetZ != null && s.onsetZ <= -2 && words != null && words <= 2 && s.h.h4 < TH.rapidAgree) return res("rapidGuess", "h4", false);
  if (v === "correct") {
    if (s.h.h1 >= TH.fluent) {
      const tCounter = !!L.hedge || L.repairDir === "right_to_wrong";
      return res("fluentRecall", "h1", !L.hedge && !L.fillerLex && L.repairDir !== "right_to_wrong", tCounter && s.sE.h1 > 0);
    }
    if (s.h.h1 <= TH.fragile) {
      const tAgree = !!L.hedge || !!L.fillerLex;
      return res("fragileCorrect", "h1", tAgree, !tAgree && !!L.tFluent && s.sE.h1 < 0);
    }
    return { state: null, head: "h1", tAgree: false, disagree: false, source: "T", proposed: null };
  }
  // not_yet / partial
  if (s.h.h3 >= TH.held) return res("heldBelief", "h3", !!x.o3History);
  if (v === "not_yet" && ((s.onsetZ != null && s.onsetZ >= 1) || s.filler || L.hedge)) return res("effortfulGuess", "h3", !!L.hedge || !!L.fillerLex);
  return { state: null, head: "h3", tAgree: false, disagree: false, source: "T", proposed: null };
}

/**
 * The adapter. `ctx.baseline` is a VsBaseline (session or loaded under V2); it is READ here and updated by the caller
 * with updateBaseline() after the turn (so a turn never z-scores against itself).
 * @param {any} kvIn
 * @param {{
 *   verdict: "correct"|"partial"|"not_yet"|"ungraded", safety: boolean, ling?: any, words?: number, o3History?: boolean,
 *   context?: "answer"|"read_aloud", form?: string, langMode?: string, ageBand?: "9-10"|"11-13",
 *   baseline?: VsBaseline, qSignals?: number, deltaFitted?: boolean, deltaZ?: number,
 *   mode?: "off"|"shadow"|"on", ladder?: any, cal?: any
 * }} ctx
 */
export function toSignalInput(kvIn, ctx) {
  const mode = ctx.mode ?? "off";
  // SL-1: a safety turn suppresses everything voicesig would say, before any other work.
  // shadow:true and licence:null so no consumer check of the form `!vs.shadow` or `vs.licence` can read an abstain as live.
  if (ctx.safety) return { ver: ADAPTER_VER, abstain: true, shadow: true, state: null, licence: null, lrV: 1, lrVApplied: 1, reasons: [] };
  if (mode === "off") return null;
  const kv = validateKv(kvIn);
  if (!kv) return null;
  // Register-aware lexical filler: with the turn's tokens, "haan ji" / "ok" / "achha" never count as hesitation.
  if (Array.isArray(ctx.ling?.toks)) ctx = { ...ctx, ling: { ...ctx.ling, fillerLex: fillerLexOf(ctx.ling.toks) === true } };
  const context = ctx.context ?? "answer";
  const langMode = kv.q.langMode !== "unk" ? kv.q.langMode : (ctx.langMode ?? "unk");
  const form = ctx.form ?? "number";
  const base = ctx.baseline ?? new VsBaseline();
  const zf = { ...kv.f };
  const { z, n } = base.z(context, langMode, form, zf);
  const s = score({
    verdict: ctx.verdict, safety: false, ling: ctx.ling, z, f: kv.f, words: ctx.words, o3History: ctx.o3History,
    qAudio: Math.min(kv.q.audio, fin(ctx.qSignals) ? ctx.qSignals : 1), det: kv.q.det && !NARROWBAND_MIC.has(kv.q.micClass) ? 1 : 0, raw: kv.q.raw,
    deltaFitted: ctx.deltaFitted, deltaZ: ctx.deltaZ, ageBand: ctx.ageBand, cal: ctx.cal,
  });
  const d = deriveState(s, { ...ctx, z });
  const ladder = ctx.ladder ?? LADDER;
  const level = d.state ? levelOf(d.state, ladder) : 0;
  const cap = d.state ? capFor(d.state, level) : [1, 1];
  // LR voice adds over text alone, for the states that carry one.
  let lrRaw = 1;
  if (d.state === "fluentRecall" || d.state === "fragileCorrect") lrRaw = odds(s.h.h1) / odds(s.hText.h1);
  else if (d.state === "heldBelief") lrRaw = odds(1 - s.h.h3) / odds(1 - s.hText.h3);
  // Gating g = qA · m (SPEC §4.2). The age-band factor is applied once, inside the rules (E terms halved for 9-10).
  const qA = Math.min(kv.q.audio, fin(ctx.qSignals) ? ctx.qSignals : 1, MIC_FACTOR[kv.q.micClass] ?? 0.8);
  const m = VsBaseline.maturity(n);
  const g = qA < 0.5 ? 0 : qA * m;
  let lrV = 1 + (lrRaw - 1) * g;
  lrV = Math.max(cap[0], Math.min(cap[1], lrV));
  const licenceRow = d.state ? LICENCE[d.state] : null;
  let licence = licenceRow ? (d.tAgree ? licenceRow.withT : licenceRow.voiceOnly) : null;
  if (licence && !d.tAgree && !CHEAP.has(licence)) licence = "none";
  // Voice alone may buy even a cheap move only when its evidence is usable: audio quality ok AND a mature child baseline
  // (g > 0). Before 8 baselined turns a slow / shy child's ordinary pace is unknown (verify pass 2026-10-04).
  if (licence && !d.tAgree && g === 0) licence = "none";
  const live = mode === "on" && level >= 1 && s.calibrated;
  const head = d.head;
  const why = head ? s.terms[head].map((t) => `${t.id}:${t.tier}`) : [];
  const reasons = d.state ? why.map((w) => `vs:${d.state}:${w.split(":")[0]}`) : d.disagree ? [`vs:disagree:${d.proposed}`] : [];
  return {
    ver: ADAPTER_VER, abstain: false, stage: kv.stage, shadow: !live, mode,
    state: d.state, proposed: d.proposed, tAgree: d.tAgree, disagree: d.disagree, source: d.source, licence,
    h: s.h, hText: s.hText, sE: s.sE, sT: s.sT, onsetZ: s.onsetZ, calibrated: s.calibrated, level, cap,
    lrRaw: round3(lrRaw), g: round3(g), lrV: round3(lrV), lrVApplied: live ? round3(lrV) : 1,
    baselineN: n, z, why, reasons,
  };
}

/**
 * Proposal A2's arithmetic, exported so signals cannot re-implement it differently: when kv is present at stage ≥ 1, the
 * SIGNALS A1/L4 onset term is SKIPPED and lrV takes its place: lrE = clip(lrE_nonTiming × lrV, cap). Never multiplied
 * with the onset term (that would count the same evidence twice: G-VS-NODOUBLE).
 */
export function replaceTimingTerm(lrENonTiming, lrV, cap) {
  return Math.max(cap[0], Math.min(cap[1], lrENonTiming * lrV));
}

/** After the turn: fold this turn's measurements into the baseline (reliable answer turns only). */
export function updateBaseline(baseline, kvIn, ctx) {
  const kv = validateKv(kvIn);
  if (!kv || ctx.safety || kv.q.audio < 0.5 || ctx.bargeIn) return false;
  const context = ctx.context ?? "answer";
  const langMode = kv.q.langMode !== "unk" ? kv.q.langMode : (ctx.langMode ?? "unk");
  baseline.update(context, langMode, ctx.form ?? "number", kv.f);
  return true;
}

const round3 = (x) => Math.round(x * 1000) / 1000;
