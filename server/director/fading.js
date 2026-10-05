// The guidance ladder with backward fading (BUILD-PLAN W2-C #2, #3; personalisation gap 3; steal 2 and 4).
//
// guidanceLevel(skill) ∈ { worked, faded, attempt } (shared/brain.ts GuidanceLevel) replaces the one novice boolean
// (state.js isNovice), which read a class-level prior as knowledge: a child with 0 correct answers was routed
// attempt-first in lesson 2 (personalisation audit §2.4, arm E). The level is read from EVIDENCE first (this child's
// recent outcomes on the skill), the knowledge estimate second, and an uncertain middle gets a one-turn "what would
// you do first?" probe instead of a guess.
//
//   worked  → hook · explain · worked example (the first steps, said by her) · the faded step (the child completes it)
//   faded   → hook · explain · the faded step (the earlier steps shown, the next one blank)
//   attempt → hook · practice first (expertise reversal: a worked example now would only slow them)
//   probe   → hook · first-step probe → faded (cannot start) or attempt (starts)
//
// The faded step is the kit's own `workedExample.fadedVersion` (830/830 kits carry it; it was read nowhere): the key
// is the text the blank replaces, recovered by CODE (blankOf), so a faded step is graded against a key like any item
// (never by a model's opinion) and counts as WITH HELP (the steps before it were shown). Backward fading: the latest
// step with a recoverable blank is the one left to the child (341/385 class 4-7 kits; the rest keep today's path).
//
// The equity profile (steal 4, rj-advice-menu-for-weak-learners): a low-baseline child gets the worked example first on
// every new skill and ONE next step, never a menu (state.js break). Pure; deterministic; no I/O.
import { checkFits } from "../compiler/compile.js";
import { revealsAnswer } from "./items.js";

export const FADE_PREFIX = "fade:";
export const GUIDANCE_LEVELS = Object.freeze(["worked", "faded", "attempt"]);
/** Knowledge bands (pL) when the record holds no decisive outcomes (LEARNER-MODEL §9.1 entry: < 0.35 worked step). */
export const GUIDE_PL = Object.freeze({ worked: 0.35, attempt: 0.65 });
/** Outcomes read for a decisive history: the last few on the skill; at least two to decide by them. */
export const HISTORY_WINDOW = 5;
const BLANK_MAX = 40;
/**
 * Stuck items (rung 4 reached, or left after don't-knows) on a skill that route it to the worked example: one when the
 * record holds nothing right on it, two whatever else it holds. An all-"don't know" day-1 lesson of 14 turns reaches
 * the assertion once (measured on c5-maths-ch01-t01, the Director alone), so a threshold of 2 would miss that child.
 */
export const STUCK_WORKED = 1;
export const STUCK_WORKED_ALWAYS = 2;
/** Keys too common to keep out of her speech (gapGivenAway). */
const FUNCTION_WORDS = new Set(["a", "an", "the", "for", "to", "of", "in", "on", "at", "by", "and", "or", "but", "so", "is", "am", "are", "was",
  "were", "be", "has", "have", "had", "do", "does", "did", "it", "this", "that", "with", "from", "as", "if", "not", "no", "yes",
  "hai", "ka", "ki", "ke", "se", "me", "mein", "ko", "aur", "ya", "to", "bhi", "है", "का", "की", "के", "से", "में", "को", "और", "या"]);
/** The whiteboard's text limit (ui.whiteboard value; the anchor and every board the Director writes). */
export const BOARD_MAX = 120;
const LEARNED = new Set(["learned_today", "mastered", "due"]);

const correctShare = (outcomes) => outcomes.filter((o) => o === "correct").length / outcomes.length;

/**
 * One skill's guidance from this child's record. `snap`: the Director's skill snapshot (state.js snapshotSkill), absent
 * when the skill was never seen; `history`: its recent outcomes, oldest first.
 * @returns {{ level: "worked" | "faded" | "attempt" | "probe", reason: string }}
 */
export function guidanceLevel(snap, history = [], { lowBaseline = false, stuck = 0 } = {}) {
  // `stuck`: items on this skill in recent lessons that reached the assertion (rung 4) or were left after don't-knows
  // (state.js noteStuck; lesson.js loadRecentStuck). A routing signal only, never KT evidence: a child who says
  // "pata nahi" to everything leaves no outcome rows, and without it they looked like a brand-new child.
  const stuckN = Math.max(0, Math.min(HISTORY_WINDOW, Number(stuck) || 0));
  const graded = (history ?? []).filter((o) => o && o !== "no_evidence");
  // stuck with nothing right to set against it (the all-"don't know" child), or stuck twice whatever else: worked
  if (stuckN >= STUCK_WORKED_ALWAYS || (stuckN >= STUCK_WORKED && !graded.slice(-HISTORY_WINDOW).includes("correct"))) return { level: "worked", reason: "history.stuck" };
  const recent = [...graded, ...Array(stuckN).fill("missed")].slice(-HISTORY_WINDOW);
  if (recent.length >= 2) {
    const share = correctShare(recent);
    if (share <= 1 / 3) return { level: "worked", reason: "history.mostly_missed" };
    if (share >= 2 / 3 && recent.at(-1) === "correct") return { level: lowBaseline ? "faded" : "attempt", reason: "history.mostly_right" };
    return { level: "faded", reason: "history.mixed" };
  }
  if (!snap) return { level: "worked", reason: "unseen" };
  // A skill learned on the record (and not contradicted by outcomes above) is attempted first.
  if (LEARNED.has(snap.status) || (snap.correctUnaided ?? 0) >= 2) return { level: lowBaseline ? "faded" : "attempt", reason: "learned" };
  if (lowBaseline) return { level: "worked", reason: "equity.low_baseline" };
  if (snap.pKnown < GUIDE_PL.worked) return { level: "worked", reason: "pl.low" };
  if (snap.pKnown >= GUIDE_PL.attempt && (snap.attempts ?? 0) > 0) return { level: "attempt", reason: "pl.high" };
  // The middle (or a prior with no attempts behind it): ask, do not guess.
  return { level: "probe", reason: "pl.uncertain" };
}

/**
 * The equity profile (steal 4): "low" when this child's record shows a low baseline on today's topic: at least three
 * graded outcomes across its skills with at most one in three right, or every seen skill (and the weakest prerequisite)
 * below the worked-step band. "standard" otherwise, and for a child with no record (the population default).
 * The tercile GATE on outcomes is W4-C; this is only the entry policy.
 */
export function equityProfile({ kit, skills = {}, history = {}, reteach = null, stuck = {} }) {
  const ids = (kit?.skills ?? []).map((sk) => sk.id);
  const outcomes = ids.flatMap((id) => [...(history[id] ?? []).filter((o) => o && o !== "no_evidence"),
    ...Array(Math.max(0, Math.min(HISTORY_WINDOW, Number(stuck?.[id]) || 0))).fill("missed")].slice(-HISTORY_WINDOW));
  if (outcomes.length >= 3 && correctShare(outcomes) <= 1 / 3) return "low";
  // stuck on the record with nothing right to set against it (the all-"don't know" child): low baseline
  const stuckN = ids.reduce((n, id) => n + (Number(stuck?.[id]) || 0), 0);
  if (stuckN >= STUCK_WORKED && !outcomes.some((o) => o === "correct")) return "low";
  const seen = ids.map((id) => skills[id]).filter(Boolean);
  const pre = Object.values(reteach?.prereqs ?? {}).flat().filter((p) => p?.seen);
  const weakPre = pre.length > 0 && Math.min(...pre.map((p) => Number(p.pL))) < GUIDE_PL.worked;
  if (seen.length && seen.every((s) => s.pKnown < GUIDE_PL.worked && (s.attempts ?? 0) > 0) && (weakPre || seen.some((s) => (s.attempts ?? 0) >= 2))) return "low";
  return "standard";
}

/**
 * The lesson's entry guidance: the guidance of the skill the kit's worked example teaches (its first skill, the one
 * taught first today). A later skill the child has never met still gets its own short explain turn before its first
 * item (state.js poseNext), so an experienced child is never handed an unseen skill cold.
 */
export function lessonGuidance({ kit, skills = {}, history = {}, lowBaseline = false, stuck = {} }) {
  const sk = kit?.skills?.[0];
  if (!sk) return { skillId: null, level: "attempt", reason: "no_skills" };
  return { skillId: sk.id, ...guidanceLevel(skills[sk.id], history[sk.id], { lowBaseline, stuck: stuck?.[sk.id] ?? 0 }) };
}

/** The teach plan for a guidance level (state.js teach() walks it). */
export function teachPlanFor(level) {
  if (level === "worked") return ["hook", "explain", "worked_example", "fade"];
  if (level === "faded") return ["hook", "explain", "fade"];
  if (level === "probe") return ["hook", "first_step"];
  return ["hook"];
}

/**
 * The text a faded line's single blank replaces (`steps[i]` vs `fadedVersion[i]`), or null when it is not recoverable
 * by code (several blanks, a rewritten line, an empty or over-long blank).
 */
export function blankOf(step, faded) {
  const parts = String(faded ?? "").split(/_{2,}/);
  if (parts.length !== 2) return null;
  const [a, b] = parts;
  const s = String(step ?? "");
  if (!s.startsWith(a) || !s.endsWith(b) || s.length <= a.length + b.length) return null;
  const blank = s.slice(a.length, s.length - b.length).trim().replace(/[.,;:!।]+$/u, "").trim();
  return blank && blank.length <= BLANK_MAX ? blank : null;
}

/**
 * Would text in view give the gap away? The problem, the steps shown before it (fadedContent; workedLeadContent shows a
 * prefix of them) and the gap line itself, checked with the leak guard's own predicate (items.js revealsAnswer) against
 * the bare key (no prompt to excuse a mention): a gap whose key is already on screen is a copy job, not evidence, and
 * the leak guard would then strip her worked example or spoil the step (review 2026-10-05: 92 + 80 + 64 of 341 kits).
 */
export function gapGivenAway(we, i) {
  const answer = blankOf(we?.steps?.[i], we?.fadedVersion?.[i]);
  if (!answer) return true;
  // a function-word key ("for", "has", "ka") is in almost anything she says, so the leak guard would spoil it on her
  // first sentence: not a gap we can grade
  if (FUNCTION_WORDS.has(answer.toLowerCase())) return true;
  const bare = { answer, acceptable: [we.steps[i]], prompt_en: "", prompt_hi: "" };
  const inView = [we.problem, ...we.steps.slice(0, i), String(we.fadedVersion[i]).replace(/_{2,}/g, " ")].filter(Boolean);
  return inView.some((t) => revealsAnswer(String(t), bare));
}

/**
 * The step backward fading leaves to the child: the LATEST step with a recoverable blank whose key nothing in view
 * gives away (gapGivenAway), or null — that kit keeps the full worked example.
 */
export function fadeStepIndex(we) {
  if (!we?.steps?.length || !we.fadedVersion?.length) return null;
  for (let i = we.steps.length - 1; i >= 0; i--) if (blankOf(we.steps[i], we.fadedVersion[i]) && !gapGivenAway(we, i)) return i;
  return null;
}

/**
 * The faded step as an item (resolved by items.js findItem for `fade:<i>`): posed like any item, graded against the
 * blank by the same classifier, its evidence WITH HELP (state.js evidenceFrom). B1 (classes 1-2) are asked about the
 * process ("what do we do next?"); the full step is an accepted answer, so saying the step counts.
 * Null when the kit has no recoverable blank or the item would not fit the prompt budget (compile.js checkFits).
 */
export function fadeItem(kit, { band = "B3", index } = {}) {
  // only a verified kit's worked example is trusted to yield a key (a mini-kit's steps are unreviewed model text)
  if (!kit?.verified) return null;
  const we = kit?.workedExample;
  const i = Number.isInteger(index) ? index : fadeStepIndex(we);
  if (i == null || i < 0) return null;
  const answer = blankOf(we.steps[i], we.fadedVersion[i]);
  if (!answer) return null;
  const line = we.fadedVersion[i];
  const process = band === "B1";
  const skillId = kit.skills?.[0]?.id;
  if (!skillId) return null;
  const item = {
    id: `${FADE_PREFIX}${i}`, kind: "practice", skillId, fade: true, difficulty: 1,
    prompt_en: process ? `What do we do next? ${line}` : `Fill the gap: ${line}`,
    prompt_hi: process ? `Ab aage kya karenge? ${line}` : `Khaali jagah bharo: ${line}`,
    answer, acceptable: [we.steps[i]],
    hints: [
      "pump: look at the step just before; what does it give us",
      `hint: the same move as the step before, on this part`,
      `prompt: ${line}`,
    ],
  };
  return checkFits(item) ? item : null;
}

/** Content lines (posed, not persona) for the faded step: the problem, the steps shown, the line with the gap. */
export function fadedContent(we, i) {
  const shown = we.steps.slice(0, i);
  return [`worked example: ${we.problem}`, ...(shown.length ? [`steps already done (say briefly): ${shown.join(" → ")}`] : []),
    `their step (a gap, never fill it for them): ${we.fadedVersion[i]}`];
}

/** Content for the first part of a worked example before its faded step: the first half of the steps before `i`. */
export function workedLeadContent(we, i) {
  // never the gap's own step: with the gap at step 0 the first part only sets the problem up (it used to show
  // steps[0], the faded step itself, so the leak guard spoiled it: review 2026-10-05)
  const upto = Math.min(i, Math.max(1, Math.ceil(i / 2)));
  return [`worked example: ${we.problem}`, upto > 0 ? `steps for this part: ${we.steps.slice(0, upto).join(" → ")}`
    : "this part: read the problem with them and say what it asks; give no step (their first step comes next)"];
}

/** Text cut to `max` characters at a word edge where one is near, with an ellipsis (never a silent hard cut). */
export function clip(text, max = BOARD_MAX) {
  const t = String(text ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const sp = cut.lastIndexOf(" ");
  return `${(sp >= max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:·-]+$/u, "")}…`;
}

/** A gap line cut around its gap so `___` always stays on the board (the line alone is over `max`). */
function aroundGap(line, max) {
  const at = line.search(/_{2,}/);
  if (line.length <= max) return line;
  const half = Math.floor((max - 2) / 2);
  let a = Math.max(0, at - half);
  const b = Math.min(line.length, a + max - 2);
  a = Math.max(0, b - (max - 2));
  return `${a > 0 ? "…" : ""}${line.slice(a, b)}${b < line.length ? "…" : ""}`;
}

/**
 * The whiteboard for a faded step: the problem and the line with the gap. The gap line is never cut (the child must
 * see the step they fill); the problem is shortened to make room, and a gap line over the limit on its own is cut
 * around its gap.
 */
export function fadeBoard(we, i) {
  const line = String(we.fadedVersion[i]).replace(/\s+/g, " ").trim();
  if (line.length + 4 >= BOARD_MAX) return { kind: "math", value: aroundGap(line, BOARD_MAX) };
  const room = BOARD_MAX - line.length - 3;
  const problem = room >= 12 ? clip(we.problem, room) : "";
  return { kind: "math", value: problem ? `${problem} · ${line}` : line };
}

/** Did the child start on a first-step probe? Words that attempt something (not a don't-know, a request, or silence). */
export function startedFirstStep(cls) {
  if (!cls) return false;
  if (["correct", "partial", "incorrect", "misconception"].includes(cls.outcome)) return true;
  const f = cls.flags ?? {};
  if (f.dontKnow || f.asksForAnswer || f.minimal || f.offTopic || f.distress || f.wantsToStop) return false;
  return cls.source !== "empty" && cls.source !== "help";
}
