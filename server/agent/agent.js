// The Teacher agent (round 5, docs/design/round5/AGENT.md §1; decision dc-r5-llm-orchestrated-teacher). One strong Azure
// Direct model runs the lesson: each event (the child spoke, tapped, stayed silent, the lesson started) is one turn; it
// answers with what she says plus actions, which THIS harness runs and checks. The harness invariants are code:
//   - scanSafety ran on the child's words before this is called (brain/turn.js skips the agent on any incident or distress;
//     the Director's safeguard takes the turn), and the floor filter runs on her line after it (turn.js);
//   - grading is code: the verified grade of the card's question (classify.js against the kit key) is handed to the agent
//     as a fact of the event, never asked of it; a posed item must be one the harness offered (verified, key withheld);
//   - screen truth: the board is drawn by code from her lines and reported back; a line that points at the screen is
//     checked against what is mounted (director/say.js screenClaimProblem) and unpointed when it claims what is not there;
//   - channel truth: on a spoken lane her words never ask the child to type or write (brain/say.js speakNotWrite);
//   - silence never brings new content: on a silent event no new item, no new board, no picture;
//   - budgets: per-turn time and per-lesson tokens and cost; over a budget the turn throws and the Director lane takes it.
import { chat, usdOf, normUsage } from "../azure.js";
import { screenClaimProblem, stripScreenRefs, pointsAtScreen } from "../director/say.js";
import { speakNotWrite } from "../brain/say.js";
import { promptFor } from "../director/items.js";
import { comprehensionRead } from "../director/read.js";
import { systemPrompt, stateMessage, offeredItems, TURN_SCHEMA } from "./prompt.js";
import { boardScript, boardSlot } from "./board.js";
import { teacherDeployment, AGENT_LIMITS } from "./flags.js";

export class AgentBudgetError extends Error { constructor(m) { super(m); this.code = "agent_budget"; } }

const MOVE_OF = { greet: "greet", hook: "hook", explain: "explain", worked_example: "worked_example", practice: "practice", probe: "probe", reteach: "reteach",
  hint: "hint", repair: "repair", celebrate: "celebrate", break: "break", wrap: "wrap" };
// her last sentence already asks (an imperative ask: "teen cheezein batao"): the card question is not appended again
const ASKS = /\b(?:batao|bataiye|bataao|bolo|boliye|socho|suno\s+aur|gino|dhoondo|tell me|say|name|find|count|which|what|how many|kaun|kya|kitn[aei])\b|बताओ|बोलो|सोचो|कौन|क्या|कितन/iu;
const clip = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);

/** The verified grade of the card's question, as the agent is told it (never asked of it). */
export function gradeOf(cls, item, kit) {
  if (!cls || !item) return null;
  const o = cls.outcome;
  const mis = cls.misconceptionId ? (kit.misconceptions ?? []).find((m) => m.id === cls.misconceptionId) : null;
  if (o === "correct") return cls.reasonMisconceptionId ? "right answer, but the reason shows a misconception" : "correct";
  if (o === "partial") return "partly right";
  if (o === "misconception" || o === "incorrect") return mis ? `wrong — it shows the misconception ${mis.id} (${clip(mis.belief, 100)})` : "wrong";
  return null;
}

/** The event line for the child's turn (or the lesson start). */
export function eventOf({ kind, childText, asrConfidence, chipId, chipLabel, typed, cls, card, kit, lang }) {
  if (kind === "start") return "lesson_start: greet them warmly by name, say in one line what today is about (tie it to their interest if it fits), then one easy question about them or one hook question; plan the lesson.";
  if (kind === "silence") return "silence: the microphone heard no words this turn (they may be thinking, away, or the sound was not them). Do not move on.";
  const parts = [];
  if (chipId) parts.push(`the child tapped a button: "${clip(chipLabel ?? chipId, 60)}"`);
  if (childText) parts.push(`the child ${typed ? "typed" : `said (speech recognition confidence ${typeof asrConfidence === "number" ? asrConfidence.toFixed(2) : "?"})`}: "${clip(childText, 400)}"`);
  if (card) {
    const g = gradeOf(cls, card, kit);
    if (g) parts.push(`VERIFIED GRADE of their answer to the card question ${card.id} ("${clip(promptFor(card, lang), 120)}"): ${g}`);
    else parts.push(`their words did not answer the card question ${card.id} (no grade)`);
  }
  const rd = comprehensionRead(cls, { childText: childText ?? "", target: card ? { mode: "item" } : { mode: "none" } });
  if (rd.read) parts.push(`harness read: ${rd.read} (${rd.basis})`);
  return parts.join(". ") || "the child did something with no words";
}

/**
 * One agent turn. → { say, intent, item, board: { script, shown } | null, cleared, picture, read, plan, end, usage, ms, notes[] }
 * Throws on a model error, a timeout, a bad output or a budget: the caller (brain/turn.js) then lets the Director lane take
 * the turn.
 */
export async function agentTurn({ state, kit, event, silent = false, lessonId, lane = "voice", trace, chatFn = chat, now = Date.now() }) {
  const a = state.agent ?? {};
  const usage = a.usage ?? { usd: 0, tokens: 0 };
  if (usage.usd >= AGENT_LIMITS.lessonUsd || usage.tokens >= AGENT_LIMITS.lessonTokens) throw new AgentBudgetError(`lesson budget spent (${usage.usd.toFixed(3)} USD, ${usage.tokens} tokens)`);
  const onScreen = a.screen?.board ?? [];
  const offered = offeredItems(state, kit);
  const ctx = { ...state.ctx, classLevel: state.ctx?.classLevel };
  const messages = [{ role: "system", content: systemPrompt(ctx) }, { role: "user", content: stateMessage({ state, kit, event, onScreen, lane }) }];
  const dep = teacherDeployment();
  const t0 = Date.now();
  const res = await chatFn(dep, messages, { schema: TURN_SCHEMA, schemaName: "teacher_turn", effort: "low", maxTokens: AGENT_LIMITS.maxOutTokens,
    timeoutMs: AGENT_LIMITS.turnTimeoutMs, retries: 0, quotaLane: "hot", trace });
  const ms = Date.now() - t0;
  const out = res?.json;
  if (!out || typeof out.say !== "string" || !out.say.trim()) throw new Error("agent: no line");
  const u = normUsage(res.usage) ?? { in: 0, out: 0 };
  const turnUsd = (() => { try { return usdOf(dep, u) ?? 0; } catch { return 0; } })();
  const notes = [];
  // ── actions, checked ──
  let item = null;
  if (out.pose_item) {
    item = offered.find((i) => i.id === out.pose_item) ?? (out.pose_item === state.activeItemId ? (kit.items ?? []).find((i) => i.id === state.activeItemId) : null);
    if (!item) notes.push(`refused pose_item ${clip(out.pose_item, 60)}: not an offered item`);
  }
  let board = null, cleared = false;
  if (silent) {
    // silence never brings new content: the same question at most, no new board, no picture
    if (item && item.id !== state.activeItemId) { notes.push("silence: new item dropped"); item = null; }
    if (out.board?.action === "show") notes.push("silence: board kept");
  } else if (out.board?.action === "show") {
    const b = boardScript(out.board.lines, { lessonId, seq: (a.boards ?? 0) + 1, max: AGENT_LIMITS.boardLines });
    if (b.ok) board = { script: b.script, shown: b.shown };
    if (b.refused.length) notes.push(`board refused: ${b.refused.slice(0, 3).map((x) => clip(x, 30)).join(" / ")}`);
  } else if (out.board?.action === "clear") cleared = true;
  const picture = !silent && out.picture ? clip(out.picture, 40) : null;
  // ── her line, checked ──
  let say = clip(out.say, AGENT_LIMITS.sayMaxChars);
  if (lane !== "text") { const spoken = speakNotWrite(say); if (spoken !== say) { say = spoken; notes.push("type/write rewritten to say"); } }
  const stageNow = board ? board.shown : cleared ? [] : onScreen;
  const ui = stageNow.length ? { studioSlot: { artifact: { kind: "whiteboard", script: { ops: stageNow.map((t) => ({ op: "text", text: t })) } } } } : {};
  if (stageNow.length ? screenClaimProblem(say, ui, null) : pointsAtScreen(say)) {
    const fixed = stripScreenRefs(say);
    notes.push("screen claim unpointed");
    say = fixed || say.replace(/\b(?:screen|board)\s+(?:par|pe|mein)\s+/gi, "");
  }
  const lastSentence = (say.match(/[^.!?।]+[.!?।]*\s*$/) ?? [say])[0];
  if (item && !/[?？]/.test(say) && !ASKS.test(lastSentence)) {
    // the card question is asked aloud in her words; if her line ended elsewhere, the card's question closes it
    say = `${say} ${promptFor(item, state.ctx?.lang)}`.trim();
    notes.push("card question appended");
  }
  return {
    say, intent: MOVE_OF[out.intent] ?? "explain", item, board, cleared, picture,
    read: out.read?.skill && out.read.level !== "unknown" ? { skill: clip(out.read.skill, 80), level: out.read.level, evidence: clip(out.read.evidence, 160) } : null,
    plan: clip(out.plan, 700), end: !!out.end && !silent, usage: { usd: turnUsd, tokens: (u.in ?? 0) + (u.out ?? 0) }, ms, notes, deployment: dep, at: now,
  };
}

/**
 * The read the evidence allows (sim lab r5-agent-vs-director: 61 of 164 skill reads OVERclaimed, "understood" written from
 * one correct answer). "understood" needs correct answers on two different items, or one on a why / transfer item, and no
 * wrong answer after the last correct one; otherwise it is "partly" (with any right answer) or "not". Pure.
 */
const DEEP_KINDS = new Set(["why", "far_transfer", "near_transfer", "error_spot", "teachback", "predict"]);
export function earnedRead(level, graded) {
  if (level !== "understood") return level;
  const lastRight = graded.map((x) => x.g).lastIndexOf("correct");
  if (lastRight < 0) return graded.length ? "not" : "partly";
  if (graded.slice(lastRight + 1).some((x) => x.g !== "correct")) return "partly";
  const right = graded.filter((x) => x.g === "correct");
  const items = new Set(right.map((x) => x.item));
  return items.size >= 2 || right.some((x) => DEEP_KINDS.has(x.kind)) ? "understood" : "partly";
}

/**
 * Fold an agent turn into the lesson state the turn will store (the Director's `next`, so every bookkeeping field the turn
 * and the fallback lane read stays valid) and build the move / ui / studio slot the response carries.
 */
export function applyAgentTurn(next, out, { kit, childText = "", cls = null, card = null, lessonId }) {
  const a = next.agent ?? {};
  const turns = [...(a.turns ?? [])];
  if (childText != null) turns.push({ who: "child", text: String(childText ?? "") });
  turns.push({ who: "teacher", text: out.say });
  const learner = { ...(a.learner ?? {}) };
  if (card && cls) {
    const k = card.skillId;
    const g = cls.outcome === "correct" ? "correct" : cls.outcome === "partial" ? "partly" : ["incorrect", "misconception"].includes(cls.outcome) ? (cls.misconceptionId ? `wrong(${cls.misconceptionId})` : "wrong") : null;
    if (g) learner[k] = { ...(learner[k] ?? {}), grades: [...(learner[k]?.grades ?? []), g].slice(-10),
      graded: [...(learner[k]?.graded ?? []), { item: card.id, kind: card.kind, g }].slice(-10),
      ...(cls.misconceptionId ? { misconceptions: [...new Set([...(learner[k]?.misconceptions ?? []), cls.misconceptionId])] } : {}) };
  }
  if (out.read) {
    const k = out.read.skill;
    const level = earnedRead(out.read.level, learner[k]?.graded ?? []);
    learner[k] = { ...(learner[k] ?? {}), read: level, evidence: out.read.evidence, ...(level !== out.read.level ? { claimed: out.read.level } : {}) };
  }
  const screen = out.board ? { board: out.board.shown } : out.cleared ? { board: [] } : (a.screen ?? { board: [] });
  next.agent = {
    ...a, plan: out.plan || a.plan, turns: turns.slice(-24), learner, screen,
    posed: out.item ? [...new Set([...(a.posed ?? []), out.item.id])] : (a.posed ?? []),
    skill: out.item?.skillId ?? a.skill ?? kit.skills?.[0]?.id,
    boards: (a.boards ?? 0) + (out.board ? 1 : 0),
    usage: { usd: +((a.usage?.usd ?? 0) + out.usage.usd).toFixed(5), tokens: (a.usage?.tokens ?? 0) + out.usage.tokens },
    lastMs: out.ms, notes: out.notes,
  };
  // the card: a posed item becomes the active item (the next turn's answer is graded against its verified key)
  if (out.item) {
    next.activeItemId = out.item.id; next.hintLevel = 0; next.tries = 0; next.unclear = 0; next.pendingWhy = undefined;
    if (next.phase === "teach" || next.phase === "warmup") next.phase = "practice";
  } else if (card && cls && ["correct", "partial", "incorrect", "misconception"].includes(cls.outcome) && out.intent !== "hint" && out.intent !== "reteach") {
    // the card's question was answered and she moved on without a new one: the card clears
    next.itemsDone = [...new Set([...(next.itemsDone ?? []), card.id])];
    next.activeItemId = undefined;
  }
  if (out.end) next.phase = "done";
  const move = { kind: out.end ? "wrap" : out.intent, shape: "agent", agent: true, ...(next.activeItemId ? { itemId: next.activeItemId } : {}), ...(out.item ? { skillId: out.item.skillId } : {}) };
  const askItem = next.activeItemId ? (kit.items ?? []).find((i) => i.id === next.activeItemId) : null;
  const ui = { status: "your_turn", handover: out.end ? "finish" : "answer", answerForm: "words",
    ...(askItem ? { ask: { text: promptFor(askItem, next.ctx?.lang), itemId: askItem.id } } : {}), tray: out.board ? "studio" : out.cleared ? "none" : undefined };
  next.lastMove = move; next.lastUi = ui;
  const studioSlot = out.board ? boardSlot(out.board.script, next.agent.boards) : null;
  return { move, ui, studioSlot, end: !!out.end };
}
