// Stage 1: transparent additive rules → h1..h4 (SPEC §3.2). Pure and deterministic: no clock, no I/O, no randomness.
// Each term is ±1 and tagged by tier: E (acoustic, voice) or T (transcript / grader / item history). The rule score is kept
// split into its E and T parts so the adapter can compute the LR that VOICE adds over text alone (never re-counting the T
// evidence server/signals already weighs).
//
// Head meanings (outcome targets, never feelings; G-VS-LABEL):
//   h1  P(delayed / transfer success | correct now)            O1
//   h2  P(recognition-probe success | non-answer now)          O2
//   h3  P(the same wrong answer persists after feedback)       O3
//   h4  P(an immediate re-ask gets the same verdict | rapid)   O4
//
// Calibration: until a table is fitted on outcome-labelled child data (pilot, §6.3) `PLACEHOLDER` maps score → h with
// planning priors [U]. Everything produced with it is SHADOW ONLY (calibrated: false); the adapter enforces that.
import { applyCal, logit } from "./calibrate.js";

/** [U] planning priors and slope for the placeholder map (replaced by fitted per-band tables). */
export const PLACEHOLDER = Object.freeze({
  prior: { h1: 0.7, h2: 0.5, h3: 0.3, h4: 0.6 },
  beta: 0.6,
});
export const RULES_VER = "vs-rules/1";

/** Thresholds [U] (SPEC §3.2). */
export const T = Object.freeze({ onsetSlowZ: 1.0, onsetFastZ: -0.5, onsetRapidZ: -2.0, pauseHighZ: 1.0, finalRelDb: 2, fillerLeadMs: 300, rapidWords: 2, qMin: 0.5 });

const fin = (x) => typeof x === "number" && Number.isFinite(x);

/**
 * @param {{
 *   verdict: "correct"|"partial"|"not_yet"|"ungraded", safety?: boolean,
 *   ling?: { idk?: null|"cant_recall"|"not_known", hedge?: boolean, fillerLex?: boolean, repairDir?: string|null, thinkAloud?: boolean, tFluent?: boolean },
 *   z?: Record<string, number|null>, f?: Record<string, number>, words?: number,
 *   o3History?: boolean, qAudio?: number, det?: 0|1, raw?: 0|1, deltaFitted?: boolean, deltaZ?: number, ageBand?: "9-10"|"11-13",
 *   cal?: Record<string, any>
 * }} x
 */
export function score(x) {
  if (x.safety) return { abstain: true, ver: RULES_VER };
  const L = x.ling ?? {};
  const z = x.z ?? {};
  const f = x.f ?? {};
  const eOk = (x.qAudio ?? 0) >= T.qMin;
  // F1: content onset z (A2) when baselined, else onset z; item-adjusted only when δ is fitted.
  let onsetZ = fin(z.contentOnsetMs) ? z.contentOnsetMs : fin(z.onsetMs) ? z.onsetMs : null;
  if (onsetZ != null && x.deltaFitted && fin(x.deltaZ)) onsetZ -= x.deltaZ;
  const f1w = x.deltaFitted ? 1 : 0.5;
  const ageW = x.ageBand === "9-10" ? 0.5 : 1;
  const eW = eOk ? ageW : 0;
  const pauseZ = fin(z.pauseFrac) ? z.pauseFrac : null;
  // F3: lexical leading filler is Tier T; the acoustic detector's lead is Tier E.
  const fillerT = !!L.fillerLex;
  const fillerE = !fillerT && x.det === 1 && fin(f.fillerLeadMs) && f.fillerLeadMs >= T.fillerLeadMs;
  const filler = fillerT || (fillerE && eOk);
  const hedge = !!L.hedge;
  const words = fin(x.words) ? x.words : null;

  const terms = { h1: [], h2: [], h3: [], h4: [] };
  const add = (h, id, tier, v) => { if (v) terms[h].push({ id, tier, v }); };
  // h1 (correct answers)
  if (onsetZ != null) {
    add("h1", "F1slow", "E", onsetZ >= T.onsetSlowZ ? -1 * f1w * eW : 0);
    add("h1", "F1fast", "E", onsetZ <= T.onsetFastZ && !filler && !hedge ? 1 * f1w * eW : 0);
  }
  add("h1", "F3", fillerT ? "T" : "E", filler ? -1 * (fillerT ? 1 : eW) : 0);
  add("h1", "F4", "T", hedge ? -1 : 0);
  if (pauseZ != null) add("h1", "F5", "E", pauseZ >= T.pauseHighZ ? -1 * eW : 0);
  if (x.raw === 1 && fin(f.finalRelDb)) add("h1", "F7", "E", f.finalRelDb >= T.finalRelDb ? 1 * eW : 0);
  // h2 (non-answers)
  add("h2", "F2recall", "T", L.idk === "cant_recall" ? 1 : 0);
  if (onsetZ != null) add("h2", "F1slow", "E", onsetZ >= T.onsetSlowZ ? 1 * f1w * eW : 0);
  add("h2", "F3", fillerT ? "T" : "E", filler ? 1 * (fillerT ? 1 : eW) : 0);
  if (L.idk === "not_known") {
    // The fast-unfilled half is the voice part; the lexical "nahi aata" alone is a T term.
    if (onsetZ != null && onsetZ <= 0) add("h2", "F2fast", "E", -1 * f1w * eW);
    add("h2", "F2known", "T", -0.5);
  }
  // h3 (wrong answers)
  if (onsetZ != null) add("h3", "F1fast", "E", onsetZ <= T.onsetFastZ ? 1 * f1w * eW : 0);
  add("h3", "F3F4none", "T", !filler && !hedge ? 1 : 0);
  add("h3", "O3", "T", x.o3History ? 1 : 0);
  // h4 (rapid answers)
  if (onsetZ != null) add("h4", "F1rapid", "E", onsetZ <= T.onsetRapidZ && words != null && words <= T.rapidWords ? -1 * f1w * eW : 0);

  const cal = x.cal ?? null;
  const calibrated = !!cal;
  const h = {}, hText = {}, sE = {}, sT = {};
  for (const k of ["h1", "h2", "h3", "h4"]) {
    sE[k] = round3(terms[k].filter((t) => t.tier === "E").reduce((a, t) => a + t.v, 0));
    sT[k] = round3(terms[k].filter((t) => t.tier === "T").reduce((a, t) => a + t.v, 0));
    const toH = (s) => (cal?.[k] ? applyCal(cal[k], s) : applyCal({ kind: "identity" }, logit(PLACEHOLDER.prior[k]) + PLACEHOLDER.beta * s));
    h[k] = round3(toH(sE[k] + sT[k]));
    hText[k] = round3(toH(sT[k]));
  }
  return { abstain: false, ver: RULES_VER, calibrated, onsetZ, filler, fillerTier: fillerT ? "T" : fillerE ? "E" : null, h, hText, sE, sT, terms };
}

const round3 = (x) => Math.round(x * 1000) / 1000;
