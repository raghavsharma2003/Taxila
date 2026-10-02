// compile(): the ONE assembler of teacher instructions for every lane (voice session.update, text-mode
// replies, the realtime token). Inherited laws, each measured on html-portfolio / Taxila:
//   - position is mechanism → the two rules that must fire go LAST, the turn-shape rule is the last line
//     (bake-off: brevity asked mid-brief 64 words/turn; appended last 25);
//   - sentence-shaped text gets recited → persona and moves are notes/shapes; only kit CONTENT (the item
//     prompt, worked-example steps) is verbatim, because it is meant to be posed;
//   - truncation is silent and eats the end → a token budget with per-section caps and drop priorities,
//     and a THROW (never a slice) when the floor or the turn shape could not fit.
//
// Order: character core → minor safety floor → child brief → lesson step + item + ladder → move shape →
// language rule → ONE MORE CHECK + TURN SHAPE (last).
import { floorText, FLOOR_HEADING } from "./floor.js";
import { briefRows, estimateTokens, BRIEF_TOKEN_CAP } from "../learner/brief.js";
import { promptFor } from "../director/items.js";

export const TOKEN_BUDGET = 2600;
export const SECTION_CAPS = { character: 450, floor: 520, brief: BRIEF_TOKEN_CAP, lesson: 800, move: 260, language: 140, last: 170 };
/** Words per teacher turn by age band (bake-off: ~25 holds for 10-15; younger children get less). */
export const TURN_WORDS = { "6-9": 18, "10-15": 25 };
export const TURN_SHAPE_PREFIX = "TURN SHAPE";

export class BudgetError extends Error {}

const RUNG = ["pump", "hint", "prompt", "assertion"];

function characterParts(c) {
  return [
    { text: `WHO YOU ARE: ${c.name} — the child calls you ${c.addressedAs}`, drop: null },
    ...c.notes.map((n) => ({ text: `- ${n}`, drop: null })),
  ];
}

/**
 * Drop priorities (lower sheds first): brief callbacks 1, wins 2, interests 3, vibe 4, relationship 5;
 * then the voice "if right" branch 6 (with the brief's misconceptions), content lines 8, the "if not" branch 9.
 */
function lessonParts({ lessonState: s, item, next, content = [], topic, language, lane }) {
  const parts = [
    { text: "LESSON NOW", drop: null },
    { text: `- topic: ${topic.title} (class ${topic.classLevel} ${topic.subject}) · phase ${s.phase} · turn ${s.turn} · minute ${s.minutes}`, drop: null },
  ];
  if (item) {
    const lvl = s.hintLevel;
    if (s.pendingWhy === item.id) {
      parts.push({ text: `- the question they just answered RIGHT: "${promptFor(item, language)}" (their answer: ${item.answer})`, drop: null });
    } else {
      parts.push({ text: `- the question (content — pose as written, in their language): "${promptFor(item, language)}"`, drop: null });
      const also = item.acceptable?.length ? `; also accept: ${item.acceptable.join(", ")}` : "";
      parts.push({ text: `- key, for checking only: ${item.answer}${also}`, drop: null });
      parts.push({
        text: lvl >= 4
          ? "- hint ladder: rung 4 of 4 reached (assertion) — the key may be said now, with a one-line reason"
          : `- hint ladder: rung ${lvl} of 4 used (${RUNG.join(" → ")}); the key may be said only at rung 4`,
        drop: null,
      });
    }
  }
  content.forEach((line) => parts.push({ text: `- ${line}`, drop: 8 }));
  // Voice lane only: the realtime teacher answers the child on the instructions it already holds (the
  // director refreshes them off the critical path), so it needs both branches in advance. The text lane
  // replies AFTER the director has classified, and there these lines measurably pulled the model ahead.
  if (lane === "voice" && next?.onRight) parts.push({ text: `- AFTER their next reply (not now) — if it matches the key: ${next.onRight}`, drop: 6 });
  if (lane === "voice" && next?.onWrong) parts.push({ text: `- AFTER their next reply (not now) — if not: ${next.onWrong}`, drop: 9 });
  return parts;
}

function moveParts(move) {
  const rung = move.hintLevel ? ` · ladder rung ${move.hintLevel} of 4` : "";
  return [
    { text: `YOUR MOVE THIS TURN: ${move.kind.replace(/_/g, " ")}${rung}`, drop: null },
    { text: `- shape (a note, not words to say): ${move.shape}`, drop: null },
  ];
}

const LANGUAGE = {
  hinglish: "mirror the child. Default natural spoken Hinglish (Hindi sentence, everyday English words), Roman script when written. If they switch to English or to Hindi, follow them.",
  hindi: "mirror the child. Default simple spoken Hindi (Roman script when written), common English words allowed. If they switch to English or Hinglish, follow them.",
  english: "mirror the child. Default simple Indian English. If they speak Hindi or Hinglish, reply in natural Hinglish.",
};
function languageRule(language, ageBand) {
  const words = ageBand === "6-9" ? " Short everyday words a 7-year-old knows." : "";
  return `LANGUAGE: ${LANGUAGE[language] ?? LANGUAGE.hinglish} Maths and science words in English, with the Hindi word beside a new one.${words} Plain speech only: no markdown, no emoji, no symbols like ÷ or =.`;
}

const SAME_ITEM_MOVES = new Set(["hint", "reteach", "repair"]);

/**
 * The two appended-last rules: the check that must fire this turn, then the turn shape as the final line.
 * The check pins WHICH question is asked: measured in evals/director-sim.mjs, a teacher told mid-prompt to
 * "pose the question as written" improvised her own questions instead, and the child's answers were then
 * judged against a question nobody asked.
 */
function lastParts({ lessonState: s, move, item, ageBand, language, protegeName }) {
  const n = TURN_WORDS[ageBand] ?? TURN_WORDS["10-15"];
  let check, shape;
  if (move.kind === "safeguard") {
    check = "care first: no lesson content this turn; a trusted adult and Childline 1098 if not said yet.";
    shape = "at most 35 words, short calm sentences. End by asking if they are okay right now, then stop.";
  } else if (move.kind === "wrap") {
    check = "no new question, no new idea, nothing left hanging.";
    shape = `at most ${n + 8} words. End with a warm goodbye, then stop.`;
  } else {
    const lvl = s.hintLevel;
    const open = item && ["why", "teachback"].includes(item.kind);
    const keyRule = open
      ? `the key idea stays unsaid (ladder rung ${lvl} of 4) — do not explain it for them; if they ask for it, nudge instead.`
      : `the key stays unsaid (ladder rung ${lvl} of 4) — no answer, no giveaway; if they ask for it, nudge instead.`;
    if (item && s.pendingWhy === item.id) {
      check = "the only question this turn: how they knew, or why it works — do not give the reason yourself; no new problem.";
    } else if (item && lvl >= 4) {
      check = "rung 4 now: say the key plainly with a one-line reason, then ask them to say it back in their own words — no new problem yet.";
    } else if (item && SAME_ITEM_MOVES.has(move.kind)) {
      check = `the only question this turn is the same one again ("${promptFor(item, language)}"), nudged as the move says — no new question; ${keyRule}`;
    } else if (item) {
      check = `the only question this turn, in their language: "${promptFor(item, language)}" — no other question; ${keyRule}`;
    } else if (move.kind === "teachback") {
      check = `the only ask this turn: that they teach ${protegeName} — no quiz question of your own.`;
    } else {
      check = "no practice question of your own; at most one small check about the idea just shown; never ask 'samjha?' or 'understood?'.";
    }
    shape = `at most ${n} words. One idea. End by handing the floor back — one question or a try-this — then stop.`;
  }
  return [
    { text: `ONE MORE CHECK: ${check}`, drop: null },
    { text: `${TURN_SHAPE_PREFIX} (last and most important): ${shape}`, drop: null },
  ];
}

/**
 * @param {{ character: any, brief: import("../../shared/contracts").ChildBrief, lessonState: any,
 *   move: import("../../shared/contracts").Move, item?: any, next?: { onRight?: string, onWrong?: string } | null,
 *   content?: string[], topic: { title: string, classLevel: number, subject: string }, language: string,
 *   lane?: "voice" | "text" }} input
 * @param {{ budget?: number, caps?: Partial<typeof SECTION_CAPS> }} [opts]
 * @returns {{ text: string, tokens: number, sections: { id: string, tokens: number }[], dropped: string[] }}
 */
export function compileWithReport(input, { budget = TOKEN_BUDGET, caps = {} } = {}) {
  const cap = { ...SECTION_CAPS, ...caps };
  const ageBand = input.brief.ageBand;
  const sections = [
    { id: "character", parts: characterParts(input.character) },
    { id: "floor", parts: [{ text: floorText(), drop: null }] },
    { id: "brief", parts: [{ text: "CHILD", drop: null }, ...briefRows(input.brief)] },
    { id: "lesson", parts: lessonParts({ lane: "voice", ...input }) },
    { id: "move", parts: moveParts(input.move) },
    { id: "language", parts: [{ text: languageRule(input.language, ageBand), drop: null }] },
    { id: "last", parts: lastParts({ ...input, ageBand, protegeName: input.character.protege.name }) },
  ];
  const dropped = [];
  const tokensOf = (sec) => estimateTokens(sec.parts.map((p) => p.text).join("\n"));
  const total = () => sections.reduce((n, sec) => n + tokensOf(sec), 0);
  const shed = (pool, over) => {
    const candidates = pool.flatMap((sec) => sec.parts.filter((p) => p.drop !== null).map((p) => ({ sec, p })))
      .sort((a, b) => a.p.drop - b.p.drop);
    for (const { sec, p } of candidates) {
      if (!over()) return;
      sec.parts = sec.parts.filter((x) => x !== p);
      dropped.push(`${sec.id}:${p.id ?? p.text.slice(2, 30)}`);
    }
  };
  for (const sec of sections) {
    shed([sec], () => tokensOf(sec) > cap[sec.id]);
    if (tokensOf(sec) > cap[sec.id]) {
      throw new BudgetError(`compile: section "${sec.id}" needs ${tokensOf(sec)} tokens (cap ${cap[sec.id]}) after every droppable part was shed; refusing to truncate`);
    }
  }
  shed(sections, () => total() > budget);
  if (total() > budget) throw new BudgetError(`compile: ${total()} tokens over the ${budget} budget after shedding; refusing to truncate`);

  const text = sections.map((sec) => sec.parts.map((p) => p.text).join("\n")).join("\n\n");
  if (!text.includes(FLOOR_HEADING)) throw new BudgetError("compile: the safety floor is missing");
  if (!text.split("\n").at(-1).startsWith(TURN_SHAPE_PREFIX)) throw new BudgetError("compile: the turn-shape rule is not the last line");
  return { text, tokens: estimateTokens(text), sections: sections.map((sec) => ({ id: sec.id, tokens: tokensOf(sec) })), dropped };
}

/** The instructions string. Throws BudgetError rather than ever returning a truncated prompt. */
export const compile = (input, opts) => compileWithReport(input, opts).text;
