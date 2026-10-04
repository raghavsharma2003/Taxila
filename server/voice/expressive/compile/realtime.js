// Lane A compiler (HUMAN-VOICE §5.9 `realtime.js`, B6; BUILD-PLAN W2-D #3): ONE delivery note for the realtime model,
// built from the Teacher Brain's Moment only (TB6: one object for voice and face). Pure and dependency-free, so the
// browser (src/lesson/voiceLink.ts) appends it to the session instructions it already applies, as the LAST line
// (position is mechanism: the line that must shape this reply goes last).
//
// Rules (each from a measurement or a standing decision):
//   - shapes only, never a line she could say (`voice-prompt-labels-and-brackets`, the recitation law): the note is a
//     row of bands joined by "·" under one row label the P1 run measured as never spoken (0/43 tag words spoken);
//   - never a sound word (HV-13): gpt-realtime renders no requested laugh/chuckle/breath (0/10, 0/8) and the word
//     leaks, so a laugh, breath, sigh or hum is never requested on lane A; `lintDeliveryLine` is the assert;
//   - safety turns get no note (HV-3: the safety register is fixed and its instructions stay last);
//   - the verdict picks a LICENCE row only (the correction row is slow and calm), never an emotion; affect comes from
//     Moment.teacherAffect (RELATIONAL-OS appraise(), the only affect producer);
//   - off by default: RELATIONAL-OS P1 measured that a tail affect row did not move gpt-realtime-2.1's delivery at
//     n=43 (and nudged word choice), so the line ships behind `voice.laneA.delivery` until HV-13 / a blind check
//     shows it does something (src/lesson/voiceFlags.ts).

/** Words that must never reach a lane-A instruction (a sound the model cannot render, or a label it would read out). */
export const SOUND_WORDS = /\b(laugh\w*|chuckl\w*|giggl\w*|haha\w*|hehe\w*|breath\w*|inhal\w*|exhal\w*|sigh\w*|hum|humm\w*|hmm+|mm+|gasp\w*|cough\w*|whisper\w*)\b|\[|\]/i;

/** The row label (measured silent in RELATIONAL-OS P1's tail-row shape). */
export const DELIVERY_LABEL = "- voice (how it sounds, never said aloud):";

/** Display (RELATIONAL-OS §7.2) → the HUMAN-VOICE §5.1 row: arc by clause position, pace band, the pause that matters. */
const BY_DISPLAY = {
  delight: { arc: "curious → bright on the method's name → warm", pace: "normal", pause: "a beat before naming the method" },
  warm_pride: { arc: "warm → proud, steady", pace: "a little slower on what they kept doing", pause: "short" },
  enthusiasm: { arc: "wonder, low → lifting on the last clause", pace: "slow → normal", pause: "a long beat before the reveal" },
  gentle_concern: { arc: "calm, soft, lower", pace: "slow", pause: "longer between sentences" },
  playful: { arc: "amused → playful → calm on the fact", pace: "brisk → normal", pause: "a beat before the fact" },
  calm_curious: { arc: "even, unhurried", pace: "normal", pause: "a beat before the one small step" },
  sheepish_own: { arc: "plain, warm", pace: "normal", pause: "short" },
};

/** Move family → row, when the display is the default (neutral_warm). */
function byMove(move, verdict) {
  if (verdict === "not_yet" || verdict === "partial") {
    return { arc: "calm → reassuring → curious", pace: "slow", pause: "a beat before the look-again" };
  }
  switch (move) {
    case "greet": return { arc: "warm → curious", pace: "normal", pause: "short" };
    case "hook": return { arc: "wonder, low → lifting on the last clause", pace: "slow → normal", pause: "a long beat before the reveal" };
    case "explain":
    case "reteach": return { arc: "calm → warm, weight on the new term", pace: "slow on the term", pause: "a beat before the term" };
    case "worked_example": return { arc: "thinking aloud, step by step; proud on the result", pace: "slow steps, brisk result", pause: "varied between steps" };
    case "probe":
    case "practice":
    case "teachback":
    case "retrieval": return { arc: "curious", pace: "normal", pause: "a beat before the ask" };
    case "hint": return { arc: "calm → curious", pace: "slow", pause: "a beat before the hint" };
    case "celebrate":
    case "wrap": return { arc: "warm → proud", pace: "normal", pause: "normal" };
    case "repair": return { arc: "plain, warm", pace: "normal", pause: "short" };
    default: return null;
  }
}

/** Intensity cap words by Band4 (HUMAN-VOICE §5.1 intensityCap: B1 0.8 … B4 0.5): older children get less animation. */
const BAND_WORD = { B1: "lively", B2: "lively", B3: "moderate", B4: "understated" };

/**
 * The lane-A delivery note for one Moment, or null (no moment, a safety turn, nothing to say). Never throws.
 * @param {import("../../../../shared/brain").Moment | null | undefined} moment
 * @returns {string | null}
 */
export function realtimeDeliveryLine(moment) {
  try {
    if (!moment || typeof moment !== "object" || moment.safety || moment.move === "safeguard") return null;
    const display = moment.teacherAffect?.display;
    const strained = moment.engagement === "strained";
    const row = strained ? BY_DISPLAY.gentle_concern
      : display && display !== "neutral_warm" && display !== "calm_steady" && BY_DISPLAY[display] ? BY_DISPLAY[display]
        : byMove(moment.move, moment.verdict);
    if (!row) return null;
    const energy = BAND_WORD[moment.band] ?? "moderate";
    const line = `${DELIVERY_LABEL} ${row.arc} · pace ${row.pace} · pause ${row.pause} · energy ${energy}`;
    return lintDeliveryLine(line) ? line : null;
  } catch {
    return null;
  }
}

/** HV-13 lint: true when the note is safe to send (no sound word, no bracket, one line, bounded). */
export function lintDeliveryLine(line) {
  return typeof line === "string" && line.length > 0 && line.length <= 240 && !line.includes("\n")
    && !SOUND_WORDS.test(line.slice(DELIVERY_LABEL.length));
}
