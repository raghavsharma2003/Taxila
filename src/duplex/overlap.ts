/**
 * The overlap classifier, stage A (ARCHITECTURE.md v2 §3.2-§3.3). While her audio plays and something voices at the mic,
 * the first 150-250 ms of ACOUSTICS decide YIELD or KEEP_TALKING; the words, when they land (D4: ~1.7 s after onset),
 * confirm or revise (a revision toward barge_in yields at once; toward continuer, a resumable yield resumes from heardUpTo).
 *
 * Evidence (all floor-timing; no affect): duration so far and whether the child is still voicing, onset position against
 * her clause boundaries (continuers live in her backchannel slots), onset pitch in the child's own range (a raised onset
 * is a competitive cue), a rising contour on a short burst (a repair request "kya?"), her yes/no question (then "haan" /
 * "nahi" is an ANSWER, P7), echo likelihood (her own voice), target-speaker score (TV, a sibling; null until enrolment).
 * Weights are [E]; DX-5 fits them on TaxilaFDB F7/F8/F9/F12 (and stage B's overlap head replaces this rule score).
 * Erasable TypeScript, pure.
 */
import type { EngineContext, KeepTalkingReason, OverlapClass, OverlapFeatures, Prob, ReasonCode, YieldReason } from "./engine.ts";
import { OVERLAP } from "./config.ts";

export interface OverlapRead {
  cls: OverlapClass | null;
  p: Partial<Record<OverlapClass, Prob>>;
  /** Enough evidence to act (YIELD or a confident KEEP_TALKING); false = stay ducked and keep listening. */
  decided: boolean;
  /** Words are behind this read (a lexical confirmation or revision). */
  lexical: boolean;
  yieldReason: YieldReason | null;
  keepReason: KeepTalkingReason | null;
  codes: ReasonCode[];
}

const sig = (z: number): number => 1 / (1 + Math.exp(-z));

/**
 * @param f overlap features (host-built every tick while the overlap lasts)
 * @param s the child's state now: still voicing, and the f0 slope at the end of the burst (st/s)
 * @param ctx the engine context (a number question turns a value over her into a fold-in answer)
 */
export function classifyOverlap(f: OverlapFeatures, s: { voicing: boolean; f0SlopeStPerS: number | null }, ctx: EngineContext): OverlapRead {
  const codes: ReasonCode[] = [];
  const out = (cls: OverlapClass | null, pBarge: number, decided: boolean, lexical: boolean, yieldReason: YieldReason | null, keepReason: KeepTalkingReason | null): OverlapRead => ({
    cls, decided, lexical, yieldReason, keepReason, codes,
    p: cls === "echo" || cls === "background_speech" || cls === "noise" || cls === "side_talk"
      ? { [cls]: 0.9, barge_in: pBarge * 0.1 }
      : { barge_in: pBarge, continuer: 1 - pBarge },
  });

  // 1. her own voice (three echo layers fused into echoLikelihood): never a reason to stop
  if (f.echoLikelihood >= 0.7) { codes.push("echo_match"); return out("echo", 0.05, true, false, null, "echo"); }
  // 2. not the enrolled child (X3): background speech
  if (f.targetSpeaker !== null && f.targetSpeaker < 0.3) { codes.push("not_target_speaker"); return out("background_speech", 0.05, true, false, null, "background_speech"); }

  // 3. words: the lexical kind confirms or revises (overlapKind, 16/16 on M-C1 [T]); fold-in on a number question
  if (f.lexicalKind) {
    const numberAsk = ctx.exchange === "closed_answer" && !!ctx.expected && ["integer", "decimal", "fraction", "number_unit"].includes(ctx.expected.form);
    const hasValue = /\d/.test(f.words) || /(?:^|\s)(?:एक|दो|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ|दस|ग्यारह|बारह|बीस|तीस|चालीस|पचास|साठ|सत्तर|अस्सी|नब्बे|सौ|छप्पन|बटा)(?:\s|$)/u.test(f.words);
    if (numberAsk && hasValue && (f.lexicalKind === "turn" || f.lexicalKind === "continuer")) { codes.push("value_present"); return out("barge_in", 0.95, true, true, "fold_in", null); }
    switch (f.lexicalKind) {
      case "continuer": codes.push("short_burst"); return out("continuer", 0.08, true, true, null, "continuer");
      case "repair": codes.push("repeat_request"); return out("barge_in", 0.95, true, true, "repair_request", null);
      case "stop": codes.push("stop_request"); return out("barge_in", 0.97, true, true, "stop_request", null);
      case "answer": return out("barge_in", 0.95, true, true, f.herAskedYesNo ? "answer_to_her_question" : "fold_in", null);
      default: return out("barge_in", 0.92, true, true, "barge_in", null);
    }
  }

  // 4. acoustics only (the first 150-250 ms)
  if (f.durMs < OVERLAP.decideMs && s.voicing) { codes.push("short_burst"); return out(null, 0.5, false, false, null, "too_short"); }
  const rising = s.f0SlopeStPerS !== null && s.f0SlopeStPerS >= 6;
  const raised = f.onsetF0Rel !== null && f.onsetF0Rel >= 0.7;
  const ended = !s.voicing;
  let z = -0.5;
  if (s.voicing && f.durMs >= OVERLAP.sustainedMs) { z += 2.5; codes.push("sustained_voice"); }
  else if (s.voicing && f.durMs >= 250) z += 1.0;
  if (f.atHerBoundary) { z -= 0.8; codes.push("onset_at_her_boundary"); } else { z += 0.6; codes.push("onset_mid_clause"); }
  if (raised) { z += 1.2; codes.push("onset_pitch_raised"); }
  if (rising && ended && f.durMs <= 600) { z += 2.2; codes.push("x_rising_burst"); }
  if (f.herAskedYesNo) { z += 2.0; codes.push("her_question_yesno"); }
  if (ended && f.durMs <= 400 && !rising && !f.herAskedYesNo) { z -= 1.6; codes.push("short_burst"); }
  if (f.levelOverEchoDb !== null && f.levelOverEchoDb < 3) z -= 1.0;
  const pB = sig(z);
  if (pB >= OVERLAP.yieldP) {
    const why: YieldReason = f.herAskedYesNo ? "answer_to_her_question" : rising && ended ? "repair_request" : "barge_in";
    return out("barge_in", pB, true, false, why, null);
  }
  if (ended && 1 - pB >= OVERLAP.continuerP) return out("continuer", pB, true, false, null, "continuer");
  return out(null, pB, false, false, null, "too_short");
}
