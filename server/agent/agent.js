// The Teacher agent (round 5, docs/design/round5/AGENT.md §1; decision dc-r5-llm-orchestrated-teacher). One strong Azure
// Direct model runs the lesson: each event (the child spoke, tapped, stayed silent, the lesson started) is one turn; it
// answers with what she says plus actions, which THIS harness runs and checks. The harness invariants are code:
//   - scanSafety ran on the child's words before this is called (brain/turn.js skips the agent on any incident or distress;
//     the Director's safeguard takes the turn), and the floor filter runs on her line after it (turn.js);
//   - grading is code: the verified grade of the card's question (classify.js against the kit key) is handed to the agent
//     as a fact of the event, never asked of it; a posed item must be one the harness offered (verified, key withheld);
//   - screen truth: board and picture go through stream 2's tools (studio/tools.js, the one whiteboard / tray gate), which
//     return what ACTUALLY mounted; a line that points at the screen is checked against that (director/say.js
//     screenClaimProblem / pointsAtScreen) and unpointed when it claims what is not there;
//   - channel truth: on a spoken lane her words never ask the child to type or write (brain/say.js speakNotWrite);
//   - silence never brings new content: on a silent event no new item, no new board, no picture;
//   - budgets: per-turn time and per-lesson tokens and cost; over a budget the turn throws and the Director lane takes it.
import { chat, usdOf, normUsage } from "../azure.js";
import { screenClaimProblem, stripScreenRefs, pointsAtScreen } from "../director/say.js";
import { speakNotWrite } from "../brain/say.js";
import { promptFor } from "../director/items.js";
import { comprehensionRead } from "../director/read.js";
import { systemPrompt, stateMessage, offeredItems, TURN_SCHEMA } from "./prompt.js";
import { screenTools, specOf } from "./tools.js";
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
 * Her line without praise of the child's answer: a sentence that opens on praise or calls the answer right is dropped, a
 * leading "haan," is dropped. Used only when the verified grade is not "correct". PURE.
 */
const PRAISE = /(?:^|[^\p{L}])(?:bilkul\s+sahi|ekdum\s+sahi|sahi\s+(?:hai|jawab|chuna|chuni|kaha|kahi|bataya|batayi|socha|pakda|pakdi|laga|lagaya)|bahut\s+(?:accha|achha|achchha|badhiya)|shabaa?sh|well\s+done|great\s+(?:job|work)|very\s+good|good\s+job|perfect|excellent|correct|that'?s\s+right|(?:you\s+|tum(?:ne)?\s+)?got\s+it|sahi|wah|बिल्कुल\s*सही|सही|शाबाश)(?![\p{L}])/iu;
const OPEN_YES = /^\s*(?:haan|haa|han|ha|yes|ji\s+haan|हाँ|हां)\s*[,!.]?\s*/iu;
export function withoutPraise(say) {
  const parts = String(say ?? "").match(/[^.!?।]+[.!?।]*\s*/g) ?? [];
  const kept = parts.filter((p, i) => !(PRAISE.test(p) && !/[?？]/.test(p) && (i === 0 || p.split(/\s+/).length <= 10)));
  let out = (kept.length ? kept : parts).join("").trim();
  if (kept.length) out = out.replace(OPEN_YES, "");
  return out ? out[0].toUpperCase() + out.slice(1) : String(say ?? "");
}

/** Her line without pointing at the screen or promising a show that is not up (a refused or pending page, a picture job). */
const SHOW_CLAIM = /(?:^|[^\p{L}])(?:dekho|dekhiye|dekhna|look|see\s+(?:the|this|here)|here\s+(?:it\s+is|is)|yeh\s+raha|ye\s+raha|dikhati\s+hoon|dikhaati\s+hoon|dikha\s+rahi|dikhaungi|dikhaoongi|bana\s+rahi|banati\s+hoon|draw\s+kar\s*(?:ti|rahi)|let\s+me\s+(?:show|draw)|i(?:'ll|\s+will)\s+(?:show|draw))(?![\p{L}])|screen|board|स्क्रीन|बोर्ड|देखो/iu;
export function withoutShowClaims(say) {
  const parts = String(say ?? "").match(/[^.!?।]+[.!?।]*\s*/g) ?? [];
  const kept = parts.filter((p) => !(SHOW_CLAIM.test(p) && !/[?？]\s*$/.test(p.trim())));
  const out = kept.join("").trim();
  return out || stripScreenRefs(say) || String(say ?? "");
}

/**
 * One agent turn. → { say, intent, item, board: ScreenTruth | null (a page that went up), cleared, picture: ScreenTruth | null,
 *   screen: ScreenTruth (after her actions), slot, read, plan, end, usage, ms, notes[] }
 * Throws on a model error, a timeout, a bad output or a budget: the caller (brain/turn.js) then lets the Director lane take
 * the turn.
 */
export async function agentTurn({ state, kit, event, silent = false, verdict = null, lessonId, lane = "voice", child = null, trace, chatFn = chat, tools = screenTools, now = Date.now() }) {
  const a = state.agent ?? {};
  const usage = a.usage ?? { usd: 0, tokens: 0 };
  if (usage.usd >= AGENT_LIMITS.lessonUsd || usage.tokens >= AGENT_LIMITS.lessonTokens) throw new AgentBudgetError(`lesson budget spent (${usage.usd.toFixed(3)} USD, ${usage.tokens} tokens)`);
  const before = (() => { try { return tools.now(lessonId); } catch { return null; } })() ?? { on: "nothing", words: "nothing is on the screen", texts: [] };
  const news = (() => { try { return tools.news?.(lessonId) ?? []; } catch { return []; } })();
  const offered = offeredItems(state, kit);
  const ctx = { ...state.ctx, classLevel: state.ctx?.classLevel };
  const ev = news.length ? `${news.join(". ")}. ${event}` : event;
  const messages = [{ role: "system", content: systemPrompt(ctx) }, { role: "user", content: stateMessage({ state, kit, event: ev, onScreen: before.words, lane }) }];
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
  let say = clip(out.say, AGENT_LIMITS.sayMaxChars);
  let board = null, cleared = false, picture = null, game = null, screen = before, unconfirmed = false;
  if (silent) {
    // silence never brings new content: the same question at most, no new board, no picture
    if (item && item.id !== state.activeItemId) { notes.push("silence: new item dropped"); item = null; }
    if (out.board?.action === "show") notes.push("silence: board kept");
  } else if (out.board?.action === "show") {
    const spec = specOf(out.board);
    if (!spec) notes.push(`board: nothing to draw for ${clip(out.board.kind, 20)}`);
    else {
      const t = await Promise.resolve().then(() => tools.show(lessonId, spec, { say, skillId: item?.skillId ?? a.skill ?? "", topicId: kit.topicId ?? "", lang: state.ctx?.lang ?? "hinglish" }))
        .catch((e) => ({ ok: false, refused: { why: String(e?.message ?? e).slice(0, 80), checks: ["error"] } }));
      if (t?.ok && !t.refused && t.on !== "nothing") { board = t; screen = t; } else { unconfirmed = true; notes.push(`board ${t?.pending ? "pending" : "refused"}: ${clip(t?.refused?.why, 80)}`); }
    }
  } else if (out.board?.action === "clear") { try { screen = tools.clear(lessonId); cleared = true; } catch { /* the board stays */ } }
  if (!silent && out.play && tools.game) {
    const g = await Promise.resolve().then(() => tools.game(lessonId, { skillId: item?.skillId ?? a.skill ?? "", topicId: kit.topicId ?? "", child }))
      .catch((e) => ({ ok: false, refused: { why: String(e?.message ?? e).slice(0, 60) } }));
    if (g?.ok) { game = g; screen = g; notes.push(`game up ${clip(g.game?.family, 30)}`); } else { unconfirmed = true; notes.push(`game refused: ${clip(g?.refused?.why, 60)}`); }
  }
  if (out.picture && !silent) unconfirmed = true;
  if (!silent && out.picture) {
    const t = (() => { try { return tools.picture(lessonId, clip(out.picture, 40)); } catch (e) { return { ok: false, refused: { why: String(e?.message ?? e).slice(0, 60) } }; } })();
    picture = t;
    notes.push(t?.ok && t.job ? `picture job ${clip(out.picture, 40)}` : `picture refused: ${clip(t?.refused?.why, 60)}`);
  }
  // ── her line, held to the verified grade: no praise or "sahi" on an answer the key says is wrong or only partly right
  // (sim lab d6f93e7: misread_wrong_as_right 19/64, "Haan, 60,000 sahi chuna" while the misconception was live) ──
  if (verdict && verdict !== "correct") { const held = withoutPraise(say); if (held !== say) { say = held; notes.push(`praise removed (${verdict})`); } }
  // ── her line, checked against what is really up ──
  if (lane !== "text") { const spoken = speakNotWrite(say); if (spoken !== say) { say = spoken; notes.push("type/write rewritten to say"); } }
  const texts = screen?.on === "board" ? (screen.texts ?? []) : [];
  const ui = texts.length ? { studioSlot: { artifact: { kind: "whiteboard", script: { ops: texts.map((t) => ({ op: "text", text: t })) } } } } : {};
  // something she asked to show this turn that did not go up (refused, still being drawn, a picture job): her line may not
  // point at the screen or promise it is there (sim lab 748ddff: points_empty_screen 23/64, "dono andaaze dikhati hoon")
  if (unconfirmed && !board && !game) { const held = withoutShowClaims(say); if (held !== say) { say = held; notes.push("unconfirmed show unpointed"); } }
  if (!screen || screen.on === "nothing" ? pointsAtScreen(say) : screen.on === "board" && screenClaimProblem(say, ui, null)) {
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
  const slot = game?.slot ?? (board?.pageId ? (() => { try { return tools.slot?.(lessonId, board.pageId) ?? null; } catch { return null; } })() : null);
  return {
    say, intent: MOVE_OF[out.intent] ?? "explain", item, board, cleared, picture, game, screen, slot,
    read: out.read?.skill && out.read.level !== "unknown" ? { skill: clip(out.read.skill, 80), level: out.read.level, evidence: clip(out.read.evidence, 160) } : null,
    plan: clip(out.plan, 700), end: !!out.end && !silent, usage: { usd: turnUsd, tokens: (u.in ?? 0) + (u.out ?? 0) }, ms, notes, deployment: dep, at: now,
  };
}

/**
 * The read the evidence allows (sim lab: r5-agent-vs-director 571b301 had 61/164 overclaims; the two-item rule of b185d50 let
 * a "partly" child through about a quarter of the time, two plain items right in a row, and capped real understanders who
 * missed one early). The kinds separate the states: a partly child gets the plain version right about half the time and
 * cannot do the contrast / transfer / error-spot / predict / why kinds. So "understood" needs a right answer on one of those
 * DEEP kinds plus another right answer (a plain item, or a second deep item), and no wrong or partly answer after the last
 * deep right one; an early miss does not cap it. Anything right short of that is "partly". PURE.
 */
export const DEEP_KINDS = new Set(["contrast", "near_transfer", "far_transfer", "error_spot", "predict", "why", "teachback", "translate_rep"]);
export function earnedRead(level, graded, { deepAvailable = true } = {}) {
  if (level !== "understood") return level;
  const right = graded.map((x, i) => ({ ...x, i })).filter((x) => x.g === "correct");
  if (!right.length) return !graded.length || graded.some((x) => x.g.startsWith("partly")) ? "partly" : "not";
  // a skill whose kit has no deep item (about 1 in 10): two different items right and nothing missed after
  if (!deepAvailable) return new Set(right.map((x) => x.item)).size >= 2 && !graded.slice(right.at(-1).i + 1).some((x) => x.g !== "correct") ? "understood" : "partly";
  const deep = right.filter((x) => DEEP_KINDS.has(x.kind));
  if (!deep.length) return "partly";
  const lastDeep = deep.at(-1).i;
  if (graded.slice(lastDeep + 1).some((x) => x.g !== "correct")) return "partly";
  const others = right.filter((x) => x.item !== deep.at(-1).item);
  return others.length ? "understood" : "partly";
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
    const g = cls.outcome === "correct" ? (cls.reasonMisconceptionId ? `partly(${cls.reasonMisconceptionId})` : "correct") : cls.outcome === "partial" ? "partly" : ["incorrect", "misconception"].includes(cls.outcome) ? (cls.misconceptionId ? `wrong(${cls.misconceptionId})` : "wrong") : null;
    if (g) learner[k] = { ...(learner[k] ?? {}), grades: [...(learner[k]?.grades ?? []), g].slice(-10),
      graded: [...(learner[k]?.graded ?? []), { item: card.id, kind: card.kind, g }].slice(-10),
      ...(cls.misconceptionId ? { misconceptions: [...new Set([...(learner[k]?.misconceptions ?? []), cls.misconceptionId])] } : {}) };
  }
  if (out.read) {
    const k = out.read.skill;
    const deepAvailable = (kit.items ?? []).some((i) => i.skillId === k && DEEP_KINDS.has(i.kind) && i.kind !== "why" && i.kind !== "teachback");
    const level = earnedRead(out.read.level, learner[k]?.graded ?? [], { deepAvailable });
    learner[k] = { ...(learner[k] ?? {}), read: level, evidence: out.read.evidence, ...(level !== out.read.level ? { claimed: out.read.level } : {}) };
  }
  const screen = out.screen ? { on: out.screen.on, words: clip(out.screen.words, 300), texts: (out.screen.texts ?? []).slice(0, 12) } : (a.screen ?? { on: "nothing", words: "nothing is on the screen", texts: [] });
  next.agent = {
    ...a, plan: out.plan || a.plan, turns: turns.slice(-24), learner, screen,
    posed: out.item ? [...new Set([...(a.posed ?? []), out.item.id])] : (a.posed ?? []),
    skill: out.item?.skillId ?? a.skill ?? kit.skills?.[0]?.id,
    boards: (a.boards ?? 0) + (out.board ? 1 : 0), pictures: (a.pictures ?? 0) + (out.picture?.job ? 1 : 0),
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
  const studioSlot = out.slot ?? null;
  return { move, ui, studioSlot, end: !!out.end };
}
