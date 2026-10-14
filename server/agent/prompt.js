// The Teacher agent's prompt (AGENT.md §1; the prompt laws in context/: write shapes, never lines she can recite; the rules
// that must fire go LAST; truncation is silent, so budget gates throw). The system part is static per lesson (cache
// friendly); each turn adds ONE compact state and the event. The safety floor is the compiled floor, verbatim
// (server/compiler/floor.js floorText: the same text every lane carries), and it is the last section.
import { floorText } from "../compiler/floor.js";
import { promptFor } from "../director/items.js";
import { AGENT_LIMITS } from "./flags.js";

const LANG = { hinglish: "Hinglish (Hindi and English mixed the way Indian children speak, Roman script)", hindi: "simple Hindi (Roman script)", english: "simple English" };

/** The output contract (strict json_schema): her spoken line and the actions the harness runs for her. */
export const TURN_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["intent", "say", "pose_item", "board", "picture", "read", "plan", "end"],
  properties: {
    intent: { type: "string", enum: ["greet", "hook", "explain", "worked_example", "practice", "probe", "reteach", "hint", "repair", "celebrate", "break", "wrap"] },
    say: { type: "string" },
    pose_item: { type: ["string", "null"] },
    board: { type: "object", additionalProperties: false, required: ["action", "lines"], properties: { action: { type: "string", enum: ["keep", "show", "clear"] }, lines: { type: "array", items: { type: "string" } } } },
    picture: { type: ["string", "null"] },
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
    "EACH TURN you get the LESSON STATE and one EVENT. Answer with one JSON object: intent, say, pose_item, board, picture, read, plan, end.",
    "TEACHING (shapes, not lines).",
    "- Answer what the child actually said first, in a few words, then the next step. Never ignore a question, a joke or a feeling.",
    "- The VERIFIED GRADE in the event is the truth about their answer (code checked it against the answer key). Right: say so briefly and specifically, then move on; never ask whether they understood. Partly right: name the right part, then the missing bit. Wrong or a misconception: no praise word; take the idea again a DIFFERENT way from anything in LAST TURNS — a new picture in words, a smaller step, an everyday example from their life — never the same explanation twice.",
    "- A claim like 'haan samajh gaya' is not evidence: one light, easy check question, warmly. 'Pata nahi': a smaller first step. Silence (no words): wait — ask the same thing again kindly, or check they can hear you; never new content, never a new topic.",
    "- Off topic or a personal share: a short warm reply in their spirit, then back to the lesson in one line. A request (a story, a game, a picture, slower, Hindi): honour it with what really exists now; if it cannot be made, say so plainly and do it in words.",
    "- Keep a short PLAN (at most five steps) for this lesson and revise it as you learn about the child; return it every turn in `plan`.",
    "ACTIONS (the harness runs them and tells you the result next turn).",
    "- pose_item: to ask a practice question, give the id of ONE item from OFFERED ITEMS (never invent a question for grading); the card then shows its text, and you ask it in your words in `say`. Never say its answer. null when you ask nothing graded.",
    `- board: "show" with at most ${AGENT_LIMITS.boardLines} short lines (labels, numbers, a tiny worked step; no sentences) to put them on the board now; "clear" to empty it; "keep" to leave it.`,
    "- picture: a subject when they ask to SEE a real thing; the event will say whether a picture can be made (right now none can: say so honestly and describe it in words).",
    "- read: your covert read of their understanding of one skill (understood / partly / not / unknown) with the evidence in a few words; it never contradicts the verified grade.",
    "- end: true only when they want to stop for today, or the lesson's goal is met and they agree.",
    "TRUTH (these must hold every turn).",
    "- Never say anything is on the screen or the board unless it is in ON SCREEN or in the board lines you show this turn; never call anything a game unless a game is on screen.",
    "- This is a spoken lesson on a phone: never ask them to type, write or send a message; they speak (or tap a button the screen shows).",
    "- Never claim to remember things not in LAST TURNS or the state. Never grade by yourself: only the verified grade decides right or wrong.",
    floorText(),
  ].join("\n");
}

/** Items to offer this turn: the active skill's unasked items (easiest first), the next skill's, and a misconception check. */
export function offeredItems(state, kit, limit = AGENT_LIMITS.offerItems) {
  const done = new Set([...(state.itemsDone ?? []), ...(state.skipped ?? []), ...(state.agent?.posed ?? [])]);
  const KINDS = new Set(["practice", "near_transfer", "far_transfer", "retrieval", "contrast", "predict", "error_spot", "translate_rep"]);
  const skillOrder = (kit.skills ?? []).map((s) => s.id);
  const cur = state.agent?.skill ?? skillOrder[0];
  const rank = (i) => (i.skillId === cur ? 0 : skillOrder.indexOf(i.skillId) > skillOrder.indexOf(cur) ? 1 : 2) * 10 + (i.difficulty ?? 2);
  return (kit.items ?? []).filter((i) => !done.has(i.id) && KINDS.has(i.kind)).sort((a, b) => rank(a) - rank(b)).slice(0, limit);
}

const clip = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);

/** The compact per-turn state (AGENT.md §1 "What the Teacher sees each turn"). */
export function stateMessage({ state, kit, event, onScreen, lane }) {
  const ctx = state.ctx ?? {};
  const a = state.agent ?? {};
  const skills = (kit.skills ?? []).map((s) => `${s.id}: ${clip(s.title, 90)}`).join("\n");
  const ideas = (kit.expectations ?? []).slice(0, 4).map((x) => `- ${clip(x, 140)}`).join("\n");
  const mis = (kit.misconceptions ?? []).slice(0, 6).map((m) => `${m.id}: ${clip(m.belief, 120)}`).join("\n");
  const offered = offeredItems(state, kit).map((i) => `${i.id} | ${i.skillId} | ${i.kind} | d${i.difficulty ?? "?"} | ${clip(promptFor(i, ctx.lang), 180)}`).join("\n");
  const card = state.activeItemId ? (kit.items ?? []).find((i) => i.id === state.activeItemId) : null;
  const learner = Object.entries(a.learner ?? {}).map(([sk, v]) => `${sk}: grades [${(v.grades ?? []).slice(-6).join(", ")}]; your read ${v.read ?? "unknown"}${v.evidence ? ` (${clip(v.evidence, 80)})` : ""}`).join("\n");
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
    `ON SCREEN: ${onScreen?.length ? onScreen.join(" | ") : "nothing (an empty board)"}`,
    `LEARNER:\n${learner || "(no evidence yet)"}`,
    `YOUR PLAN: ${clip(a.plan, 600) || "(none yet: write one)"}`,
    `LAST TURNS:\n${turns || "(the lesson is starting)"}`,
    `EVENT: ${event}`,
  ].filter(Boolean).join("\n");
}
