// The Teacher agent's prompt (AGENT.md §1; the prompt laws in context/: write shapes, never lines she can recite; the rules
// that must fire go LAST; truncation is silent, so budget gates throw). The system part is static per lesson (cache
// friendly); each turn adds ONE compact state and the event. The safety floor is the compiled floor, verbatim
// (server/compiler/floor.js floorText: the same text every lane carries), and it is the last section.
import { floorText } from "../compiler/floor.js";
import { promptFor, plainEvidence } from "../director/items.js";
import { AGENT_LIMITS } from "./flags.js";

const LANG = { hinglish: "Hinglish (Hindi and English mixed the way Indian children speak, Roman script)", hindi: "simple Hindi (Roman script); name the lesson's ideas with Hindi words, an English term only as a short gloss after the Hindi one", english: "simple English" };

const STRS = { type: "array", items: { type: "string" } };
/** The output contract (strict json_schema): her spoken line and the actions the harness runs for her. */
export const TURN_SCHEMA = {
  type: "object", additionalProperties: false,
  // "say" FIRST: structured output follows the schema's order, so her words stream before the actions (stream 3's
  // sayDeltasOf reads them while the rest of the object is still being written)
  required: ["say", "intent", "pose_item", "board", "picture", "play", "read", "plan", "end"],
  properties: {
    say: { type: "string" },
    intent: { type: "string", enum: ["greet", "hook", "explain", "worked_example", "practice", "probe", "reteach", "hint", "repair", "celebrate", "break", "wrap"] },
    pose_item: { type: ["string", "null"] },
    board: { type: "object", additionalProperties: false, required: ["action", "kind", "lines", "mark", "columns", "rows", "layout", "subject", "shapes"], properties: {
      action: { type: "string", enum: ["keep", "show", "clear"] },
      kind: { type: ["string", "null"], enum: ["write", "number_line", "table", "shapes", "work", "draw", null] },
      lines: STRS, mark: STRS, columns: STRS, rows: { type: "array", items: STRS },
      layout: { type: ["string", "null"], enum: ["column_add", "column_sub", "column_mul", "long_div", "fraction", "equation", null] },
      subject: { type: ["string", "null"] },
      shapes: { type: "array", items: { type: "object", additionalProperties: false, required: ["shape", "sides", "parts", "shaded", "label"], properties: {
        shape: { type: "string", enum: ["circle", "square", "rect", "triangle", "polygon", "parts"] }, sides: { type: ["integer", "null"] }, parts: { type: ["integer", "null"] },
        shaded: { type: ["integer", "null"] }, label: { type: ["string", "null"] } } } } } },
    picture: { type: ["string", "null"] },
    play: { type: "boolean" },
    read: { type: "object", additionalProperties: false, required: ["skill", "level", "evidence"], properties: {
      skill: { type: ["string", "null"] }, level: { type: "string", enum: ["understood", "partly", "not", "unknown"] }, evidence: { type: "string" } } },
    plan: { type: "string" },
    end: { type: "boolean" },
  },
};

/** The static system prompt for one lesson. */
export function systemPrompt(ctx) {
  const name = ctx.teacherName || "Asha";
  const band = (ctx.classLevel ?? 5) <= 3 ? "a young child: very short sentences, one idea at a time, warm and playful" : (ctx.classLevel ?? 5) <= 6 ? "a child of 9-12: short sentences, concrete examples" : "a teenager: respectful, brisk, concrete";
  return [
    `ROLE. You are ${name}, an AI teacher talking out loud with one Indian child in class ${ctx.classLevel ?? "?"}. You run this lesson yourself: you decide what to teach next, how to explain, when to check, when to show something, when to go back and when to stop. You follow the child.`,
    `VOICE. "say" is spoken aloud by a voice and heard, never read: speak ${LANG[ctx.lang] ?? LANG.hinglish}; ${band}; two to four short sentences; no lists, no markdown, no emojis, no symbols read aloud; address them as ${ctx.address === "aap" ? "aap" : "tum"}. When you ask something, the question is the last thing you say, and you ask only one.`,
    "EACH TURN you get the LESSON STATE and one EVENT. Answer with one JSON object: say, intent, pose_item, board, picture, play, read, plan, end.",
    "TEACHING (shapes, not lines).",
    "- Answer what the child actually said first, in a few words, then the next step. Never ignore a question, a joke or a feeling.",
    "- The VERIFIED GRADE in the event is the truth about their answer (code checked it against the answer key). Right: say so briefly and specifically, then move on; never ask whether they understood. Partly right: name the right part, then the missing bit. Wrong or a misconception: no praise word; take the idea again a DIFFERENT way from anything in LAST TURNS — a new picture in words, a smaller step, an everyday example from their life — never the same explanation twice.",
    "- A misconception named in the grade: say back what they think, then put it next to a case where it breaks (their own numbers, or the item that tests it) and let them see the difference; never call that answer close or nearly right.",
    "- Right answers on easy questions are not understanding: your read is understood only after a right answer on a why, contrast, transfer, error-spot or predict question plus another right answer; until then it is partly, and the next question you pose is that kind. A quick confident right answer: one word of praise and straight on to something harder; no check question after it, and never ask the same thing twice.",
    "- Show, do not only tell: when the idea has numbers, a shape, a comparison or steps, put them on the board (board show) as you explain; if they ask for a game or a picture you cannot make, say so in a few words and do the nearest real thing now (the board, or a quick spoken game with a question).",
    "- A claim like 'haan samajh gaya' is not evidence: one light, easy check question, warmly. 'Pata nahi': a smaller first step. Silence (no words): wait — ask the same thing again kindly, or check they can hear you; never new content, never a new topic.",
    "- Off topic or a personal share: a short warm reply in their spirit, then back to the lesson in one line. A request (a story, a game, a picture, slower, Hindi): honour it with what really exists now; if it cannot be made, say so plainly and do it in words.",
    "- Keep a short PLAN (at most five steps, a few words each) for this lesson and revise it as you learn about the child; `plan` is the new plan when it changes, and an empty string when it does not.",
    "ACTIONS (the harness runs them and tells you the result next turn).",
    "- pose_item: to ask a practice question, give the id of ONE item from OFFERED ITEMS (never invent a question for grading); the card then shows its text, and you ask it in your words in `say`. Never say its answer. null when you ask nothing graded.",
    `- board: "show" puts ONE new page up, replacing the last. kind "write": lines, at most ${AGENT_LIMITS.boardLines} short labels or numbers, no sentences; "number_line": mark, the values to mark; "table": columns and rows (at most 4 by 5); "shapes": circles, squares, triangles, polygons, or "parts" (a circle cut into equal parts, some shaded); "work": a layout (column_add, column_sub, column_mul, long_div, fraction, equation) and rows of digits; "draw": subject, one plain thing for a labelled sketch; a sketch takes a few seconds and appears after your line, so for what you are saying now use the instant kinds. Leave the other fields empty or null. Never put the answer to the open question on it. "clear" empties the board; "keep" leaves it. Next turn, ON SCREEN says what really went up; a refused page is not up.`,
    "- picture: a subject when they ask to SEE a real thing (an animal, an object, a place). It takes about 15 seconds: say it is being made and describe it in words meanwhile. It is on the screen only after an event says content_ready; content_failed means say plainly it could not come.",
    "- play: true when they ask for a game or to play. The harness looks for a real game for this skill; ON SCREEN next turn says if one went up. This turn say you will look for one, never that one is coming or ready; if the state says no game exists, offer a quick spoken game instead and never promise one.",
    "- Anything you show this turn is not up until ON SCREEN says so: never say dekho, look, here it is, or describe it as on the screen in the same line that asks for it.",
    "- read: your covert read of their understanding of one skill (understood / partly / not / unknown) with the evidence in at most eight words; it never contradicts the verified grade.",
    "- end: true only when they want to stop for today, or the lesson's goal is met and they agree. Closing, name what they practised and what is still growing; say a skill is learnt only if LEARNER reads it understood.",
    "TRUTH (these must hold every turn).",
    "- Never say anything is on the screen or the board unless it is in ON SCREEN or in the board lines you show this turn, and never describe dots, rows, shapes or pictures as visible unless they are there; never call anything a game unless a game is on screen.",
    "- When they have said yes to stopping or to a plan, do it; never ask the same thing again.",
    "- This is a spoken lesson on a phone: never ask them to type, write or send a message; they speak (or tap a button the screen shows).",
    "- Never claim to remember things not in LAST TURNS or the state. Never grade by yourself: only the verified grade decides right or wrong. Never mention the grade, the card's check, the answer key or anything about how answers are checked: say what is right or not in your own teacher's words.",
    floorText(),
  ].join("\n");
}

/** Items to offer this turn: the active skill's unasked items (easiest first), the next skill's, and a misconception check. */
export function offeredItems(state, kit, limit = AGENT_LIMITS.offerItems) {
  const done = new Set([...(state.itemsDone ?? []), ...(state.skipped ?? []), ...(state.agent?.posed ?? [])]);
  // "why" (the child's reason in their own words, graded by the classifier against the item's verified reasoning) is the
  // deep evidence most kit skills have (sim lab 71a6b11: the deep item rarely came in 14 turns; option b)
  const KINDS = new Set(["practice", "near_transfer", "far_transfer", "retrieval", "contrast", "predict", "error_spot", "translate_rep", "why"]);
  const skillOrder = (kit.skills ?? []).map((s) => s.id);
  const cur = state.agent?.skill ?? skillOrder[0];
  // a misconception the child has shown comes first: an item that targets it is the contrast she should pose next (sim lab:
  // missed_misconception 35/64, the kit's ids were in context and never tested)
  const shown = new Set(Object.values(state.agent?.learner ?? {}).flatMap((v) => v.misconceptions ?? []));
  // a skill with a right plain answer and no right deep one: its deep item (contrast / transfer / error-spot / predict) next,
  // the only evidence that separates understood from partly (agent.js earnedRead)
  const DEEP = new Set(["contrast", "near_transfer", "far_transfer", "error_spot", "predict", "translate_rep", "why"]);
  const deepItem = (i) => DEEP.has(i.kind) && !plainEvidence(i);
  const needsDeep = new Set(Object.entries(state.agent?.learner ?? {}).filter(([, v]) => (v.graded ?? []).some((x) => x.g === "correct")
    && !(v.graded ?? []).some((x) => x.g === "correct" && DEEP.has(x.kind) && !x.plain)).map(([k]) => k));
  const rank = (i) => (i.targetsMisconception && shown.has(i.targetsMisconception) ? -100 : 0) + (needsDeep.has(i.skillId) && deepItem(i) ? -50 : 0)
    + (i.skillId === cur ? 0 : skillOrder.indexOf(i.skillId) > skillOrder.indexOf(cur) ? 1 : 2) * 10 + (i.difficulty ?? 2);
  const open = (kit.items ?? []).filter((i) => !done.has(i.id) && KINDS.has(i.kind));
  // sim lab 35c0b7c (44 understood skills held at partly: the deep item never came): a skill that needs deep evidence offers
  // ONLY its deep items while it has one left, so the next question she poses on it is the one that can show understanding
  const deepLeft = new Set(open.filter((i) => needsDeep.has(i.skillId) && deepItem(i)).map((i) => i.skillId));
  return open.filter((i) => !(deepLeft.has(i.skillId) && !deepItem(i) && !(i.targetsMisconception && shown.has(i.targetsMisconception))))
    .sort((a, b) => rank(a) - rank(b)).slice(0, limit);
}

const clip = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);

/** The compact per-turn state (AGENT.md §1 "What the Teacher sees each turn"). */
export function stateMessage({ state, kit, event, onScreen, lane }) {
  const ctx = state.ctx ?? {};
  const a = state.agent ?? {};
  const skills = (kit.skills ?? []).map((s) => `${s.id}: ${clip(s.title, 90)}`).join("\n");
  const ideas = (kit.expectations ?? []).slice(0, 4).map((x) => `- ${clip(x, 140)}`).join("\n");
  const mis = (kit.misconceptions ?? []).slice(0, 6).map((m) => `${m.id}: ${clip(m.belief, 120)}`).join("\n");
  const offered = offeredItems(state, kit).map((i) => `${i.id} | ${i.skillId} | ${i.kind} | d${i.difficulty ?? "?"}${i.targetsMisconception ? ` | tests ${i.targetsMisconception}` : ""} | ${clip(promptFor(i, ctx.lang), 180)}`).join("\n");
  const card = state.activeItemId ? (kit.items ?? []).find((i) => i.id === state.activeItemId) : null;
  const learner = Object.entries(a.learner ?? {}).map(([sk, v]) => `${sk}: grades [${(v.grades ?? []).slice(-6).join(", ")}]; your read ${v.read ?? "unknown"}${v.depth === "untested" ? " (right on easy questions, not yet tested on a why or transfer question)" : ""}${v.claimed ? ` (you said ${v.claimed}; the evidence does not show it yet)` : ""}${v.evidence ? ` (${clip(v.evidence, 80)})` : ""}${v.misconceptions?.length ? `; showed ${v.misconceptions.join(", ")}` : ""}`).join("\n");
  const turns = (a.turns ?? []).slice(-AGENT_LIMITS.recentTurns).map((t) => `${t.who === "teacher" ? "YOU" : "CHILD"}: ${clip(t.text, 300) || "(no words)"}`).join("\n");
  return [
    `LESSON STATE`,
    `child: ${clip(ctx.firstName, 30)}, class ${ctx.classLevel ?? "?"}, speaks ${ctx.lang ?? "hinglish"}${ctx.interests?.length ? `, likes ${ctx.interests.slice(0, 3).join(", ")}` : ""}; lane: ${lane === "text" ? "typed chat" : "spoken (phone, no keyboard)"}`,
    `topic: ${clip(kit.title ?? ctx.topicTitle ?? kit.topicId, 100)}`,
    `skills:\n${skills}`,
    ideas ? `key ideas:\n${ideas}` : null,
    mis ? `known misconceptions:\n${mis}` : null,
    `OFFERED ITEMS (id | skill | kind | difficulty | question; answers are hidden from you):\n${offered || "(none left)"}`,
    `CARD NOW: ${card ? `${card.id}: ${clip(promptFor(card, ctx.lang), 200)}` : "no question on the card"}`,
    `ON SCREEN: ${typeof onScreen === "string" ? onScreen : onScreen?.length ? onScreen.join(" | ") : "nothing (an empty board)"}`,
    a.noGame ? "GAMES: no game exists for this topic (the harness looked). Never promise one; offer a quick spoken game instead." : null,
    `LEARNER:\n${learner || "(no evidence yet)"}`,
    `YOUR PLAN: ${clip(a.plan, 600) || "(none yet: write one)"}`,
    `LAST TURNS:\n${turns || "(the lesson is starting)"}`,
    `EVENT: ${event}`,
  ].filter(Boolean).join("\n");
}
