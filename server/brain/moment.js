// The turn's Moment (TEACHER-BRAIN TB6, §4.1; BUILD-PLAN W2-E #3): ONE object per turn that drives both how she sounds
// (HUMAN-VOICE momentPlan, through server/voice/expressive/seam.js planDelivery) and what her face does (the avatar),
// so her words, her voice and her face cannot disagree. Pure.
//
// Laws it carries (each one is a test in tests/brain-moment.test.mjs):
//   - teacherAffect has exactly ONE producer: RELATIONAL-OS appraise(), reaching the turn as the RelationalDirective's
//     `affect`. Without a directive the Moment says neutral_warm (cause "none"): an absence, never a second producer.
//     It is never keyed to the verdict (TA1/TA7): flipping correct ↔ not_yet changes `verdict` and nothing else.
//   - Safety suppresses affect (TA8): a safeguarding turn is calm_steady, whatever the directive said.
//   - engagement comes from task evidence and the child's own words (learner/affect.js engagementOf), never tone.
//   - the uptake prelude (§5.4 L3) is the child's own key token, verdict-neutral; never on a safety turn, never in the
//     realtime lane, never a stock filler; OFF unless TAXILA_UPTAKE_PRELUDE=1 (it waits for the HV-16 blind test).
import { BANDS } from "../learner/bands.js";

const NEUTRAL = (turn) => ({ display: "neutral_warm", intensity: 1, cause: "none", turn });
const SAFETY_CALM = (turn) => ({ display: "calm_steady", intensity: 1, cause: "safety", turn });
const VERDICT = { correct: "correct", partial: "partial", not_yet: "not_yet" };
const LANG = { hinglish: "hinglish", english: "en", hindi: "hi" };
const DISPLAYS = new Set(["delight", "warm_pride", "enthusiasm", "gentle_concern", "playful", "calm_curious", "sheepish_own", "neutral_warm", "calm_steady"]);

/** The bond stage for the Moment: the lesson's pinned snapshot stage (RELATIONAL-OS), else first meeting vs not. */
export function bondStageOf(ctx) {
  const s = ctx?.bondStage;
  if (s === "meeting" || s === "first_sessions" || s === "regular" || s === "long_haul") return s;
  return ctx?.firstMeeting ? "meeting" : "first_sessions";
}

const STOP = new Set(["hai", "hain", "toh", "to", "the", "and", "aur", "main", "mera", "meri", "mujhe", "nahi", "kya", "yeh", "woh", "isme", "ismein",
  "because", "kyunki", "matlab", "ki", "ka", "ke", "ko", "se", "me", "mein", "teacher", "didi", "sir", "maam", "bhaiya", "pata"]);
/**
 * The child's own key token (§5.4 L3): the last number they said, else their longest content word. Their words only,
 * never the key, never a verdict word. Null when there is nothing to echo.
 */
export function keyTokenOf(childText) {
  const t = String(childText ?? "").trim();
  if (!t || t.startsWith("[")) return null;
  const nums = t.match(/\d+(?:[./]\d+)?/g);
  if (nums?.length) return nums.at(-1);
  const words = t.toLowerCase().split(/[^\p{L}\p{M}]+/u).filter((w) => w.length >= 4 && !STOP.has(w));
  if (!words.length) return null;
  return words.reduce((a, b) => (b.length > a.length ? b : a)).slice(0, 24);
}

/**
 * @param {{ move: { kind: string }, verdict?: string, engagement: import("../../shared/brain").EngagementState,
 *   relational?: import("../../shared/relational").RelationalDirective | null, ctx: any, turn: number, safety: boolean,
 *   childLaughed?: boolean, studio?: "announcing" | "revealing" | "narrating", lane: "voice" | "cascade" | "text",
 *   childText?: string, typed?: boolean }} x
 * @returns {import("../../shared/brain").Moment}
 */
export function momentOf(x) {
  const turn = x.turn ?? 0;
  const fromRel = x.relational?.affect;
  const affect = x.safety ? SAFETY_CALM(turn)
    : fromRel && DISPLAYS.has(fromRel.display) ? { display: fromRel.display, intensity: fromRel.intensity === 2 ? 2 : 1, cause: fromRel.cause ?? "none",
      ...(fromRel.causeFragment ? { causeFragment: String(fromRel.causeFragment).slice(0, 40) } : {}), turn }
      : NEUTRAL(turn);
  const band = BANDS[x.ctx?.classLevel]?.b4 ?? "B3";
  const token = !x.safety && x.lane === "cascade" && !x.typed && process.env.TAXILA_UPTAKE_PRELUDE === "1" ? keyTokenOf(x.childText) : null;
  return {
    move: x.move?.kind ?? "repair",
    verdict: VERDICT[x.verdict] ?? "ungraded",
    engagement: x.engagement,
    teacherAffect: affect,
    bondStage: bondStageOf(x.ctx),
    safety: !!x.safety,
    childLaughed: !!x.childLaughed,
    // she thinks aloud while working an example (a licence for a breath/pause, HUMAN-VOICE), never on a correction
    thinkAloud: x.move?.kind === "worked_example",
    ...(x.studio ? { studio: x.studio } : {}),
    band,
    lang: LANG[x.ctx?.lang] ?? "hinglish",
    ...(token ? { uptakePrelude: { text: token } } : {}),
  };
}
