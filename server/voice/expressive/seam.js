// The expressive-voice seam into the turn (BUILD-PLAN §4, W2 seam commit). OWNED BY W2-G; call site owned by W2-E
// (server/brain/turn.js after the guard and before prewarm; server/routes/lesson.js for the opening).
// HUMAN-VOICE B5: the layer reads ONLY the Brain's Moment (never the verdict for affect: HV-17) and the guarded reply,
// and returns a DeliveryPlan the TTS path speaks. Contract, binding on the owner:
//   - pure and synchronous (code only, ≤ 3 ms; TEACHER-BRAIN §5.1 stage 7), never throws into the turn;
//   - aligner identity: the plan's clause texts minus inserted fillers equal the reply byte for byte (HV-2); on any
//     mismatch return null and the plain reply is spoken (fail closed);
//   - safety turns (moment.safety) bypass the layer: calm, no fillers, no clips, plain digits (HV-3);
//   - owner 2026-10-04 (voice-clips-off-and-numbers-normalised): no spliced breath/hum clips; numbers are normalised to
//     spoken words before TTS; the voice choice stays config-driven (server/voice/voices.js), never hard-coded here.
//
// The plan is ENGINE-FREE: the governor (per lesson) and the engine compiler run where the lesson and the voice are
// known (server/voice/prewarm.js, render.js). TAXILA_VOICE_EXPRESSIVE=0 turns the layer off (null: plain speech).
import { align } from "./align.js";
import { safetyRegister } from "./safety.js";
import { count } from "./telemetry.js";
import { cachedAnnotation, withAnnotation } from "./annotate.js";

/** What the governor needs from the Moment that the DeliveryPlan contract does not carry (verdict as licence only). */
const info = new WeakMap();
/** @param {object} plan @returns {{ verdict?: string, band?: string } | undefined} */
export const planInfo = (plan) => (plan && typeof plan === "object" ? info.get(plan) : undefined);

export const expressiveSeam = {
  /**
   * @param {import("../../../shared/brain").Moment | null} moment
   * @param {string} reply the guarded reply text (exactly what will be spoken)
   * @returns {import("../../../shared/contracts").DeliveryPlan | null}
   */
  planDelivery(moment, reply) {
    if (!moment || !reply || !String(reply).trim()) return null;
    if (String(process.env.TAXILA_VOICE_EXPRESSIVE ?? "").toLowerCase() === "0") return null;
    try {
      // the safety predicate runs on the moment AND the words: a helpline number in the reply is a safety turn
      const m = safetyRegister(moment, reply) ? { ...moment, safety: true, childLaughed: false, uptakePrelude: undefined } : moment;
      const aligned = align(reply, m);
      if (!aligned) { count("plain_fallback"); return null; }
      // a line the background annotator already planned (B7: kit narration, openings): its clause delivery, from memory
      const ann = m.safety ? null : cachedAnnotation(reply, m);
      const plan = ann ? withAnnotation(aligned, ann) : aligned;
      info.set(plan, { verdict: moment.verdict, band: moment.band });
      return plan;
    } catch (e) {
      count("plain_fallback");
      console.warn("[voice] expressive plan failed (plain speech):", e?.message);
      return null;
    }
  },
};
