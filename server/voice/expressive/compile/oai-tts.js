// The gpt-4o-mini-tts compiler (HUMAN-VOICE §5.9, the fallback engine): the input text is NEVER altered (no filler, no
// markup: the engine reads markup aloud); delivery goes only in `instructions` as bands, appended to the teacher's STYLE
// note. Measured: these engines ignore requests for non-verbal sounds (0/18 audible), so none is ever asked for.
import { withoutFiller } from "../align.js";

const level = (x) => (x >= 0.6 ? "high" : x >= 0.4 ? "medium" : "low");

/**
 * @param {Array<import("../../../../shared/contracts").DeliveryClause>} clauses one part
 * @param {string} baseInstructions the teacher's STYLE note (speech.js speechStyle)
 * @param {{ register?: "normal"|"safety" }} [o]
 * @returns {{ text: string, instructions: string }}
 */
export function compileOai(clauses, baseInstructions, { register = "normal" } = {}) {
  const text = clauses.map(withoutFiller).join(" ").trim();
  const c0 = clauses[0] ?? { emotion: "neutral", intensity: 0.3, pace: "normal" };
  const feel = register === "safety" ? "Feeling: calm, low. Pace: slow." : `Feeling: ${c0.emotion}, ${level(c0.intensity)}. Pace: ${c0.pace}.`;
  return { text, instructions: [baseInstructions, feel].filter(Boolean).join("\n") };
}
