// round 7 (main's hybrid-pilot judgement, defects 8 and 9): code invariants the agent lane's line must keep. The LLM words the
// turn; code keeps the lesson at the class's level and brings it back from a diversion. A line that breaks one is not sent:
// the Director's move and line take that turn (brain/turn.js). PURE.
//
//   level     a class-6 slip became "paanch se chhe kadam aage gino" (counting on), then 5 + 2 with cricket runs for six
//             turns. From class 4 up: no counting-on / finger counting, no bare single-digit sum of her own; and no more
//             than NO_CARD_MAX agent turns in a row in practice without a kit card on the table.
//   diversion three off-topic turns, then "Maths abhi side mein rakhte hain" on "boring", never back. At most ONE engaged
//             off-lesson turn in a row; a line that sets the lesson aside is never sent.

export const NO_CARD_MAX = 2;
export const OFF_RUN_MAX = 1;

const COUNT_ON = /\b(?:kadam\s+aage\s+gin|aage\s+gino|ungli(?:yon)?\s+(?:pe|par|se)\s+gin|ungliyon\s+se|count\s+(?:on|up)\s+(?:from|by)|on\s+your\s+fingers|ek\s+ek\s+karke\s+gino|ek\s+ek\s+karke\s+jodo)\b/i;
// exactly two single digits (never a link of a longer chain like the kit's "5 + 6 + 9"), in a question of her own
const TINY_SUM = /(?<![\p{N}.])(?<!(?:\+|plus|jama|aur)\s*)[1-9]\s*(?:\+|plus|jama)\s*[1-9](?![\p{N}.])(?!\s*(?:\+|plus|jama)\s*\d)[^.?!।]*\?/iu;
const SET_ASIDE = /\b(?:maths?|ganit|lesson|padhai)\s+(?:ko\s+)?(?:abhi\s+)?(?:side\s+(?:mein|me|pe|par)|baad\s+mein|chhod(?:o|te|ke|kar)?|rehne\s+do|break\s+pe)\b|\b(?:forget|skip)\s+(?:the\s+)?(?:maths?|lesson)\b/i;
const OFF_REQ = new Set(["park", "detour", "change_topic", "uptake", "boredom", "side_chat", "decline"]);

/** Was the child's turn off the lesson (a diversion read in code or by the note)? */
export const offLesson = (cls) => !!(cls?.flags?.offTopic || OFF_REQ.has(cls?.request?.type));

/**
 * The invariant the agent's line breaks, or null.
 * @param {{ say: string, item?: object | null }} out  the agent's turn
 * @param {{ classLevel?: number, kitText?: string, phase?: string, cardOnTable?: boolean, agent?: object, cls?: object }} ctx
 */
export function agentBreach(out, { classLevel = null, kitText = "", phase = null, cardOnTable = false, agent = {}, cls = null } = {}) {
  const say = String(out?.say ?? "");
  const older = Number(classLevel) >= 4;
  if (older && COUNT_ON.test(say)) return "level_count_on";
  if (older) {
    const m = say.match(TINY_SUM);
    if (m && !String(kitText).includes(m[0].replace(/\s+/g, " ").slice(0, 5))) return "level_tiny_sum";
  }
  if (SET_ASIDE.test(say)) return "diversion_set_aside";
  if (offLesson(cls) && !out?.item && (agent.offRun ?? 0) >= OFF_RUN_MAX) return "diversion_no_return";
  if (phase === "practice" && !cardOnTable && !out?.item && (agent.noCardRun ?? 0) >= NO_CARD_MAX) return "level_no_card";
  return null;
}

/** The counters the invariants read, after an agent turn that was sent. PURE → the new agent state. */
export function noteAgentTurn(agent = {}, out, { cls = null, phase = null, cardOnTable = false } = {}) {
  return {
    ...agent,
    offRun: offLesson(cls) && !out?.item ? (agent.offRun ?? 0) + 1 : 0,
    noCardRun: phase === "practice" && !cardOnTable && !out?.item ? (agent.noCardRun ?? 0) + 1 : 0,
  };
}

/** The counters after a turn the Director took (they restart: the lesson is back on its own path). */
export const resetAgentRuns = (agent = {}) => ({ ...agent, offRun: 0, noCardRun: 0 });
