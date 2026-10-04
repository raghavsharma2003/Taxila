// Reliability q (SIGNALS-SPEC §2.6) and the acoustic (Tier E) cue reads (§2.2, §2.5.3, §2.5.4). Pure.
// Acoustic features are read as per-child z from turnVoice() (server/voice/features.js); this module never baselines and
// never reads an absolute acoustic norm (SL-5). A9 (f0EndSlopeStPerS) is decision-excluded (R §5.2, O-2).
import { CUE_Z, LIVE_Q_CAP, STT_FAMILY } from "./priors.js";
import { numberOf } from "./text.js";

const fin = (x) => typeof x === "number" && Number.isFinite(x);
const mean = (xs) => { const ok = xs.filter(fin); return ok.length ? ok.reduce((a, b) => a + b, 0) / ok.length : null; };

/** §2.6 live-lane proxy: 1 if all rules pass, 0.5 if exactly one fails, 0 if two or more fail. [U] until SG-M11. */
export function qAsrProxy(input, ling) {
  const f = input.voice?.f ?? {};
  const fails = [];
  const art = f.articulationWps;
  if (!(fin(art) && art >= 0.8 && art <= 5.5)) fails.push("rate");
  if (!(fin(f.voicedFrac) && f.voicedFrac >= 0.25)) fails.push("voiced");
  const item = input.item;
  const expects = !!item && (item.expectsNumber || ["number", "word", "choice_spoken"].includes(item.form));
  if (expects) {
    const kit = new Set((item.kitTerms ?? []).flatMap((t) => String(t).toLowerCase().split(/\s+/)));
    const hasExpected = ling.toks.some((t) => numberOf(t) != null || kit.has(t));
    if (!hasExpected) fails.push("expected_token");
  }
  // A16 (build addition, q only): ASR words per acoustic syllable nucleus outside a plausible band = likely mishearing.
  if (fin(f.nucleiPerSec) && f.nucleiPerSec > 0 && fin(art)) {
    const ratio = art / f.nucleiPerSec;
    if (ratio < 0.2 || ratio > 1.25) fails.push("nuclei_ratio");
  }
  return { q: fails.length === 0 ? 1 : fails.length === 1 ? 0.5 : 0, fails };
}

/**
 * q = min(qAsr, qDur, qEcho, qSpeaker, qLevel). Returns { asr, acoustic, pause, fails }.
 * Typed turns: asr = 1, acoustic = 0 (there is no audio).
 */
export function quality(input, ling) {
  if (input.typed || input.asrSource === "typed") return { asr: 1, acoustic: 0, pause: 0, fails: [] };
  let asr, fails = [];
  if (fin(input.asrConfidence)) asr = Math.max(0, Math.min(1, input.asrConfidence));
  else {
    const p = qAsrProxy(input, ling);
    fails = p.fails;
    // Until SG-M11 passes, the proxy can never vouch for more than half (every lane without a confidence).
    asr = Math.min(p.q, LIVE_Q_CAP);
  }
  const v = input.voice;
  if (!v) return { asr, acoustic: 0, pause: 0, fails };
  const f = v.f ?? {};
  const dur = fin(f.durationMs) && f.durationMs >= 300 ? 1 : 0;
  const pauseDur = fin(f.durationMs) && f.durationMs >= 1500 ? 1 : 0.5;
  const echo = f.echoRisk === 1 && (!fin(f.onsetMs) || f.onsetMs < 400) ? 0 : 1;
  const speaker = f.speakerShift === 1 ? 0 : 1;
  let level = fin(f.qLevel) ? f.qLevel : 1;
  if (!fin(f.qLevel) && ((fin(f.rmsMeanDb) && f.rmsMeanDb < -55) || (fin(f.rmsP90Db) && f.rmsP90Db > -0.5))) level = 0;
  let acoustic = Math.min(asr, dur, echo, speaker, level);
  if (!v.reliable) acoustic = Math.min(acoustic, 0.4);
  return { asr, acoustic, pause: Math.min(acoustic, pauseDur), fails };
}

/**
 * Acoustic cue reads for this turn (Tier E). Every z is the child's own; null when the feature is missing, the baseline is
 * young (z null), or q is below 0.5. Latency is difficulty-adjusted only when δ is fitted (§2.5.3); the session anchor
 * corrects knowledge reads by anchor/2 (§2.5.4).
 * @param {any} input @param {{ acoustic: number, pause: number }} q @param {Record<string, number> | null} anchor
 * @param {Set<string>} off  feature ids switched off (TAXILA_SIGNALS_OFF)
 */
export function acousticCues(input, q, anchor, off = new Set()) {
  const z = input.voice?.z ?? {};
  const ok = q.acoustic >= 0.5;
  const zz = (k, id) => (ok && !off.has(id) && fin(z[k]) ? z[k] : null);
  const anc = (k) => (anchor && fin(anchor[k]) ? anchor[k] : 0);
  let onset = zz("onsetMs", "A1");
  const contentOnset = zz("onsetContentMs", "A2");
  if (contentOnset != null) onset = contentOnset;               // A2 replaces A1 when the server baselines it (§8.2 step 13)
  const deltaOk = !!input.deltaFitted;
  let onsetAdj = null;
  if (onset != null) {
    const sd = input.voice?.baseline?.onsetMs?.sd;
    const d = deltaOk && fin(input.delta) && fin(sd) && sd > 0 ? input.delta / sd : 0;
    onsetAdj = onset - d - anc("onsetMs") / 2;
  }
  const pauseOk = q.pause >= 0.5;
  const pauseHigh = pauseOk ? mean([zz("pauseFrac", "A3"), zz("longestPauseMs", "A4")]) : null;
  const longestPause = pauseOk ? zz("longestPauseMs", "A4") : null;
  const disfl = zz("disfluencyPer100Words", "A7");
  const rateLow = mean([zz("speechRateWps", "A6"), zz("articulationWps", "A6")]);
  // Hesitation cues: onset (only when δ is fitted: a hard item is slow for everyone), pauses, disfluency, slow rate.
  const cues = [deltaOk ? onsetAdj : null, pauseHigh, disfl, rateLow == null ? null : -(rateLow - anc("articulationWps") / 2)];
  const available = cues.filter((c) => c != null).length;
  const hesitation = available >= 3 ? cues.filter((c) => c != null && c >= CUE_Z).length : 0;
  // E-fluent: enough cues, none raised, and a fast (adjusted) onset. Used only to ABSTAIN on T/E disagreement (SL-11).
  const fluent = available >= 3 && deltaOk && onsetAdj != null && onsetAdj <= -0.5 && cues.every((c) => c == null || c < 0.5);
  return { onset, onsetAdj, deltaOk, pauseHigh, longestPause, disfl, rateLow, available, hesitation, fluent };
}

export const sttFamily = (src) => STT_FAMILY[src] ?? "clean";
export { mean, fin };
