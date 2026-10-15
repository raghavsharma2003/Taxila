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
import { chat, chatStream, usdOf, normUsage } from "../azure.js";
import { sayDeltasOf } from "../latency/speech-stream.js";
import { floorViolations } from "../director/safety.js";
import { screenClaimProblem, stripScreenRefs, pointsAtScreen } from "../director/say.js";
import { speakNotWrite, affirmOpenerFix } from "../brain/say.js";
import { promptFor, plainEvidence } from "../director/items.js";
import { comprehensionRead } from "../director/read.js";
import { systemPrompt, stateMessage, offeredItems, TURN_SCHEMA } from "./prompt.js";
import { screenTools, specOf } from "./tools.js";
import { teacherDeployment, AGENT_LIMITS } from "./flags.js";
// stream 2's ONE "does this page share content with her line" (studio/request.js syncedWithLine, d6f0bb51: their gate refuses
// a new page by it). Until a tree carries it the stale-page clear below is off; never a second definition (main, 14.3).
import * as studioRequest from "../studio/request.js";
import { visualAskOf } from "../director/requests.js";
import { createHash } from "node:crypto";
import { evidenceRead } from "./read.js";

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

const MASTERY = /(?:^|[^\p{L}])(?:sikh\s+(?:liya|li|gaye|gayi|gaya)|seekh\s+(?:liya|li|gaye|gayi|gaya)|samajh\s+(?:gaye|gayi|gaya|liya|li)\s+(?:ho|hain|hai|ho\s+tum|aap)|pakka\s+ho\s+gaya|master\s+kar|you(?:'ve|\s+have)?\s+(?:learn(?:ed|t)|mastered|got\s+the\s+hang)|you\s+(?:now\s+)?(?:know|understand)\s+(?:how|this|it)|ab\s+(?:tum|aap)\s+(?:jaante|jaanti|samajhte|samajhti)\s+ho|सीख\s*(?:लिया|ली|गए|गई)|समझ\s*(?:गए|गई|गया))(?![\p{L}])/iu;
/** Her line without a claim that the child has learnt it, unless the learner record holds some skill understood. PURE. */
export function withoutMastery(say, learner) {
  if (Object.values(learner ?? {}).some((v) => v.read === "understood")) return String(say ?? "");
  const parts = String(say ?? "").match(/[^.!?।]+[.!?।]*\s*/g) ?? [];
  const kept = parts.filter((p) => !(MASTERY.test(p) && !/[?？]\s*$/.test(p.trim())));
  return kept.length && kept.length !== parts.length ? kept.join("").trim() : String(say ?? "");
}

/** The child's own words in the event text, or "". PURE. */
const childWordsOf = (event) => (String(event ?? "").match(/the child (?:said|typed|tapped)[^"]*"([^"]*)"/) ?? [])[1] ?? "";
/** The child asks to play (their words in the event). */
const GAME_ASK = /(?:the child (?:said|typed|tapped)[^"]*")[^"]*(?:\bgame|\bkhel|\bplay\b|गेम|खेल)/iu;
const GAME_PROMISE = /(?:game|games|khel\w*|गेम|खेल)[^.!?।]*(?:taiyaar|tayyar|taiyar|ready|bana\s*(?:rahi|ti|ungi)|banaa\s*rahi|la\s*rahi|laa\s*rahi|aayega|aayegi|aa\s*raha|aa\s*rahi|shuru\s*kar|start|khelte\s+hain|khelenge|coming|getting)|(?:taiyaar|tayyar|ready|bana\s*rahi)[^.!?।]*(?:game|khel)/iu;
/** Her line without a promise of a game that will not come (a spoken game, "bolkar", stays). PURE. */
export function withoutGamePromise(say) {
  const parts = String(say ?? "").match(/[^.!?।]+[.!?।]*\s*/g) ?? [];
  const kept = parts.filter((p) => !(GAME_PROMISE.test(p) && !/bolkar|spoken|words\s+mein|zubani/i.test(p)));
  return kept.length && kept.length !== parts.length ? kept.join("").trim() : String(say ?? "");
}

const PICTURE_PROMISE = /(?:photo|foto|tasveer|tasvir|picture|image|sketch|chitra|drawing|फ़ोटो|फोटो|तस्वीर|चित्र)[^.!?।]*(?:banwa|banva|banaa?\s*(?:rahi|raha|ti|ungi|oongi|deti)|ban\s*(?:rahi|raha|jaay?egi|jayegi)|la\s*rahi|laa\s*rahi|mangwa|request|making|make|bring|get\s+you|aayegi|aa\s*rahi|aa\s*jaayegi|bhej)|(?:banwa|banva|mangwa|request|i(?:'ll|\s+will)\s+(?:make|draw|get|bring)|i'?m\s+making|let\s+me\s+(?:make|get))[^.!?।]*(?:photo|foto|tasveer|tasvir|picture|image|sketch|chitra|drawing|फोटो|तस्वीर)/iu;
const WAIT_ONLY = /^(?:it\s+(?:may|will|might)\s+take\s+a\s+(?:moment|minute|few\s+seconds)|(?:ismein|isme|banne\s+mein|usmein)?\s*(?:thoda|kuch)\s+(?:waqt|samay|pal|der)\s+(?:lagega|lagegi|lagenge))[.!।;]*$/iu;
const NOT_PROMISE = /(?:^|[^\p{L}])(?:nahi|nahin|nahīn|not|couldn'?t|can'?t|cannot|sorry|नहीं)(?![\p{L}])/iu;
/**
 * Her line without a promise of a picture or sketch that is not being made (sim lab 7740135 effort none: "photo banwa rahi
 * hoon" and "battery ka sketch banwati hoon" turn after turn, nothing ever came; most of those turns started no job). An
 * honest "abhi nahi aaya, sorry" stays. PURE.
 */
export function withoutPicturePromise(say) {
  const text = String(say ?? "");
  const parts = text.match(/[^.!?।;]+[.!?।;]*\s*/g) ?? [];
  let cut = false;
  const kept = parts.filter((p) => { const drop = PICTURE_PROMISE.test(p) && !NOT_PROMISE.test(p); cut ||= drop; return !drop; })
    .filter((p) => !(cut && WAIT_ONLY.test(p.trim())));
  if (!cut || !kept.length) return text;
  const out = kept.join("").replace(/(^|[.!?।;]\s*)(?:(?:tab\s+tak(?:\s+ke\s+liye)?|meanwhile)[,\s]+)?(\p{L})/giu, (m, lead, c, at) => (at === 0 || /tab|meanwhile/i.test(m) ? `${lead}${c.toUpperCase()}` : `${lead}${c}`))
    .trim().replace(/;\s*$/, ".");
  return out || text;
}

const INTERNALS = /(?:^|[^\p{L}])(?:card\s+(?:ka|ke|ki|par|pe)\s+(?:check|jaanch|jawab|answer)|card'?s\s+check|check\s+(?:isse|se)\s+match|match\s+nahi\s+hua|verified\s+grade|the\s+grade|grade\s+(?:ne|mein|says)|harness|answer\s+key|key\s+(?:se|ke\s+saath)\s+match|system\s+(?:ne|says|ke\s+hisaab)|the\s+checker|checker\s+(?:ne|says))(?![\p{L}])/iu;
/** Her line without sentences that voice the harness (the card's check, the grade, the key). PURE. */
export function withoutInternals(say) {
  const parts = String(say ?? "").match(/[^.!?।]+[.!?।]*\s*/g) ?? [];
  const kept = parts.filter((p) => !INTERNALS.test(p));
  return kept.length && kept.length !== parts.length ? kept.join("").trim() : String(say ?? "");
}

/** An async queue of the model's raw JSON deltas (pushed by chatStream's onDelta, read by sayDeltasOf). */
function deltaQueue() {
  const buf = []; let done = false, wake = null;
  return {
    push(d) { buf.push(d); wake?.(); },
    end() { done = true; wake?.(); },
    async *iter() { for (;;) { if (buf.length) { yield buf.shift(); continue; } if (done) return; await new Promise((r) => { wake = r; }); wake = null; } },
  };
}
const kitContentOf = (kit) => [kit.title, ...(kit.expectations ?? []), ...(kit.items ?? []).map((i) => i.prompt_en)].filter(Boolean).join(" ").slice(0, 4000);

/**
 * The per-clause gate for her STREAMED words (stream 3's speakStreamed calls it on every clause before TTS): the same
 * harness checks her whole line gets, applied while she is still speaking. A floor violation stops the speech (the turn
 * then takes the Director's safe line); a clause that only the harness's checks reject is dropped; a type/write ask is
 * rewritten to say. Nothing on screen is known to be new while she speaks, so a clause pointing at the screen is dropped
 * unless something is already up. PURE given its inputs.
 */
export function clauseGate({ verdict = null, learner = {}, noGame = false, screen = null, lane = "voice", content = "", answer = "", lang = "hinglish" } = {}) {
  const up = screen && screen.on && screen.on !== "nothing";
  const understood = Object.values(learner ?? {}).some((v) => v.read === "understood");
  let first = true;
  return (clause, spoken = []) => {
    const said = [...spoken, clause].join(" ");
    if (floorViolations(said, { content }).length) return { ok: false, why: "floor" };
    let c = String(clause ?? "");
    if (first) {
      first = false;
      if (verdict && verdict !== "correct") c = c.replace(OPEN_YES, "");
      // 14.4 (open-r143-affirm-on-no-answer, case b): a right answer that said No is never met with a bare Yes; the caption
      // gets the same rewrite in brain/turn.js, this is the streamed audio's first clause
      else if (verdict === "correct") c = affirmOpenerFix(c, { verdict: "correct", answer, lang }).text;
    }
    if (lane !== "text") c = speakNotWrite(c);
    const q = /[?？]\s*$/.test(c.trim());
    if (verdict && verdict !== "correct" && PRAISE.test(c) && !q) return { ok: true, skip: true };
    if (INTERNALS.test(c)) return { ok: true, skip: true };
    if (!understood && MASTERY.test(c) && !q) return { ok: true, skip: true };
    if (noGame && GAME_PROMISE.test(c) && !/bolkar|spoken|zubani/i.test(c)) return { ok: true, skip: true };
    // she speaks before her actions run: whether a picture job starts is not known yet, so no clause promises one
    if (PICTURE_PROMISE.test(c) && !NOT_PROMISE.test(c) && !q) return { ok: true, skip: true };
    if (!up && (pointsAtScreen(c) || SHOW_CLAIM.test(c)) && !q) return { ok: true, skip: true };
    if (!c.trim()) return { ok: true, skip: true };
    return { ok: true, clause: c };
  };
}

/**
 * Her model call's inputs, built ONE way for a real turn and for a speculation (stream 3): the messages, the deployment,
 * the options and `key`, a digest of all three, so a turn can prove a speculated call saw exactly what it would have sent.
 * `news` are the event lines code puts before the child's (content_ready / content_failed, the GAME line). PURE.
 */
export function agentCallOf({ state, kit, event, lane = "voice", onScreen = "nothing is on the screen", news = [] }) {
  const ctx = { ...state.ctx, classLevel: state.ctx?.classLevel };
  const ev = news.length ? `${news.join(". ")}. ${event}` : event;
  const messages = [{ role: "system", content: systemPrompt(ctx) }, { role: "user", content: stateMessage({ state, kit, event: ev, onScreen, lane }) }];
  const dep = teacherDeployment();
  // effort none by default (sim lab 7740135, n=64 per arm: judges tie none vs low 29:30 / 31:29, rubric within noise, dead ends 4 vs 13, about 1 s faster at p50, fallbacks 14 vs 43)
  const opts = { schema: TURN_SCHEMA, schemaName: "teacher_turn", effort: process.env.TAXILA_TEACHER_EFFORT || "none", maxTokens: AGENT_LIMITS.maxOutTokens, timeoutMs: AGENT_LIMITS.turnTimeoutMs, retries: 0, quotaLane: "hot" };
  const key = createHash("sha256").update(JSON.stringify({ dep, effort: opts.effort, maxTokens: opts.maxTokens, messages })).digest("hex").slice(0, 24);
  return { messages, dep, opts, key };
}

/**
 * Start her model call on a PREFETCHED turn (stream 3's perception cache: the transcript is stable, its classify has settled,
 * the distress read was clean) so the real turn can adopt it: agentTurn({ spec }) uses it only when its own agentCallOf key
 * is the same, else aborts it. NO tool runs here and nothing is drained: the screen is read, the content news is PEEKED; a
 * turn whose words ask for a game is not speculated (its lookup is an action). The call's raw deltas are held, unspoken,
 * until the turn replays them. → { key, done: Promise<{ text, usage }>, replay(): AsyncIterable<string>, abort(why), aborted,
 * startedAt } | null (not speculable). Never throws; a failed call rejects `done` and the turn falls back to its own call.
 */
/**
 * A speculation the turn did not use, added to the lesson's waste record (stream 3: kept apart from the lesson budget, shown
 * next to the hit rate): { dropped, cut, tokens, usd } — a call that had finished brings its exact usage, one cut mid-way
 * counts as cut. PURE.
 */
export function specWasteOf(prev, spec) {
  const w = { dropped: 0, cut: 0, tokens: 0, usd: 0, ...(prev ?? {}) };
  if (!spec) return w;
  w.dropped += 1;
  if (spec.usage) { w.tokens += (spec.usage.in ?? 0) + (spec.usage.out ?? 0); w.usd = +(w.usd + ((() => { try { return usdOf(spec.dep, spec.usage) ?? 0; } catch { return 0; } })())).toFixed(5); }
  else w.cut += 1;
  return w;
}

export function agentSpeculate({ state, kit, event, silent = false, lessonId, lane = "voice", tools = screenTools, streamFn = chatStream, now = Date.now }) {
  const a = state.agent ?? {};
  const usage = a.usage ?? { usd: 0, tokens: 0 };
  if (silent || usage.usd >= AGENT_LIMITS.lessonUsd || usage.tokens >= AGENT_LIMITS.lessonTokens) return null;
  if (!a.noGame && tools.game && GAME_ASK.test(String(event ?? ""))) return null;
  let before, news;
  try { before = tools.now(lessonId) ?? { on: "nothing", words: "nothing is on the screen" }; news = tools.peek?.(lessonId) ?? []; } catch { return null; }
  const { messages, dep, opts, key } = agentCallOf({ state, kit, event, lane, onScreen: before.words, news });
  const ctl = new AbortController();
  const buf = []; let ended = false; const waiters = new Set();
  const wake = () => { for (const w of waiters) w(); waiters.clear(); };
  const done = streamFn(dep, messages, { ...opts, signal: ctl.signal, onDelta: (d) => { buf.push(d); wake(); } })
    .then((r) => { spec.usage = normUsage(r?.usage) ?? null; spec.dep = dep; return r; })
    .finally(() => { ended = true; wake(); });
  done.catch(() => {});
  const spec = {
    key, done, startedAt: now(), aborted: false,
    abort(why = "aborted") { if (spec.aborted) return; spec.aborted = why; ctl.abort(); },
    // every delta from the first, then the live ones, to the end of the call (one reader: the adopting turn)
    async *replay() { let i = 0; for (;;) { if (i < buf.length) { yield buf[i++]; continue; } if (ended) return; await new Promise((r) => waiters.add(r)); } },
  };
  return spec;
}

/**
 * One agent turn. → { say, intent, item, board: ScreenTruth | null (a page that went up), cleared, picture: ScreenTruth | null,
 *   screen: ScreenTruth (after her actions), slot, read, plan, end, usage, ms, notes[] }
 * Throws on a model error, a timeout, a bad output or a budget: the caller (brain/turn.js) then lets the Director lane take
 * the turn.
 */
export async function agentTurn({ state, kit, event, silent = false, verdict = null, lessonId, lane = "voice", child = null, trace, chatFn = chat, streamFn = chatStream, onSay = null, tools = screenTools, synced = studioRequest.syncedWithLine ?? null, spec = null, now = Date.now() }) {
  const a = state.agent ?? {};
  const usage = a.usage ?? { usd: 0, tokens: 0 };
  if (usage.usd >= AGENT_LIMITS.lessonUsd || usage.tokens >= AGENT_LIMITS.lessonTokens) throw new AgentBudgetError(`lesson budget spent (${usage.usd.toFixed(3)} USD, ${usage.tokens} tokens)`);
  const before = (() => { try { return tools.now(lessonId); } catch { return null; } })() ?? { on: "nothing", words: "nothing is on the screen", texts: [] };
  const news = (() => { try { return tools.news?.(lessonId) ?? []; } catch { return []; } })();
  const offered = offeredItems(state, kit);
  // the child asks to play: the game is looked for BEFORE she speaks (code, ~0.3 s), so her line can say what is true this
  // turn — a game is up, or none exists and she offers a spoken one (sim lab cc4b3d2: 14 no-game lessons, 2 spoken offers)
  let pre = null;
  if (!silent && !a.noGame && tools.game && GAME_ASK.test(String(event ?? ""))) {
    pre = await Promise.resolve().then(() => tools.game(lessonId, { skillId: a.skill ?? kit.skills?.[0]?.id ?? "", topicId: kit.topicId ?? "", child }))
      .catch((e) => ({ ok: false, refused: { why: String(e?.message ?? e).slice(0, 60) } }));
  }
  const gameNews = pre ? (pre.ok ? `GAME: a game for this skill is now on the screen (${clip(pre.words, 120)}); tell them to play it`
    : "GAME: no game exists for this topic (the harness looked); say so in a few words and play a quick spoken game with them now") : null;
  const { messages, dep, opts: callOpts, key } = agentCallOf({ state, kit, event, lane, onScreen: before.words, news: [...news, ...(gameNews ? [gameNews] : [])] });
  const opts = { ...callOpts, trace };
  const t0 = Date.now();
  // a speculation (stream 3: her call started on the PREFETCHED turn) is adopted only when it saw exactly these inputs
  const adopted = spec && spec.key === key && !spec.aborted ? spec : null;
  if (spec && !adopted) spec.abort?.("inputs differ");
  let res, firstSayMs = null;
  if (typeof onSay === "function") {
    // streamed (AGENT.md §1 Latency; stream 3's speech-stream.js): her words go to the caller as they are written (say is the
    // first field), each clause through clauseGate; the actions are run when the whole object has come
    const q = adopted ? null : deltaQueue();
    const sayIter = sayDeltasOf(adopted ? adopted.replay() : q.iter());
    const tap = (async function* () { for await (const d of sayIter) { if (firstSayMs == null) firstSayMs = Date.now() - t0; yield d; } })();
    try { onSay(tap, clauseGate({ verdict, learner: a.learner ?? {}, noGame: !!a.noGame, screen: before, lane, content: kitContentOf(kit), answer: childWordsOf(event), lang: state.ctx?.lang ?? "hinglish" })); } catch { /* the caller's speech path is its own */ }
    try {
      const r = adopted ? await adopted.done : await streamFn(dep, messages, { ...opts, onDelta: (d) => q.push(d) });
      q?.end();
      res = { json: (() => { try { return JSON.parse(r.text); } catch { return null; } })(), usage: r.usage };
    } catch (e) { q?.end(); throw e; }
  } else if (adopted) {
    const r = await adopted.done;
    res = { json: (() => { try { return JSON.parse(r.text); } catch { return null; } })(), usage: r.usage };
  } else res = await chatFn(dep, messages, opts);
  const ms = Date.now() - t0;
  const out = res?.json;
  if (!out || typeof out.say !== "string" || !out.say.trim()) throw new Error("agent: no line");
  const u = normUsage(res.usage) ?? { in: 0, out: 0 };
  const turnUsd = (() => { try { return usdOf(dep, u) ?? 0; } catch { return 0; } })();
  const notes = [];
  if (adopted) notes.push(`speculation adopted (${Math.max(0, t0 - adopted.startedAt)} ms ahead)`);
  else if (spec) notes.push(`speculation dropped: ${spec.aborted || "inputs differ"}`);
  // ── actions, checked ──
  let item = null;
  if (out.pose_item) {
    item = offered.find((i) => i.id === out.pose_item) ?? (out.pose_item === state.activeItemId ? (kit.items ?? []).find((i) => i.id === state.activeItemId) : null);
    if (!item) notes.push(`refused pose_item ${clip(out.pose_item, 60)}: not an offered item`);
  }
  let say = clip(out.say, AGENT_LIMITS.sayMaxChars);
  let board = null, cleared = false, picture = null, game = null, screen = before, unconfirmed = false, gameRefused = false;
  // a lesson whose topic has no game: she was told so, and any promise of one is removed (not only on a play turn)
  if (a.noGame) { const held = withoutGamePromise(say); if (held !== say) { say = held; notes.push("game promise removed"); } }
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
  if (pre) {
    if (pre.ok) { game = pre; screen = pre; notes.push(`game up ${clip(pre.game?.family, 30)}`); }
    else { gameRefused = true; notes.push(`game refused: ${clip(pre.refused?.why, 60)}`); const held = withoutGamePromise(say); if (held !== say) { say = held; notes.push("game promise removed"); } }
  } else if (!silent && out.play && tools.game) {
    const g = await Promise.resolve().then(() => tools.game(lessonId, { skillId: item?.skillId ?? a.skill ?? "", topicId: kit.topicId ?? "", child }))
      .catch((e) => ({ ok: false, refused: { why: String(e?.message ?? e).slice(0, 60) } }));
    if (g?.ok) { game = g; screen = g; notes.push(`game up ${clip(g.game?.family, 30)}`); }
    else {
      unconfirmed = true; gameRefused = true; notes.push(`game refused: ${clip(g?.refused?.why, 60)}`);
      // sim lab 1a346d9 (p29, p33: "game taiyaar kar rahi hoon" turn after turn, no game ever came): no promise of a game
      const held = withoutGamePromise(say); if (held !== say) { say = held; notes.push("game promise removed"); }
    }
  }
  if (out.picture && !silent) unconfirmed = true;
  if (!silent && out.picture) {
    const t = (() => { try { return tools.picture(lessonId, clip(out.picture, 40)); } catch (e) { return { ok: false, refused: { why: String(e?.message ?? e).slice(0, 60) } }; } })();
    picture = t;
    notes.push(t?.ok && t.job ? `picture job ${clip(out.picture, 40)}` : `picture refused: ${clip(t?.refused?.why, 60)}`);
  }
  if (!(picture?.ok && picture.job) && !(out.board?.action === "show" && out.board.kind === "draw" && unconfirmed && !silent)) {
    const held = withoutPicturePromise(say); if (held !== say) { say = held; notes.push("picture promise removed"); }
  }
  // a new question with no page of its own: a page up from earlier that shares nothing with her line and the question (stream
  // 2's syncedWithLine, the test their gate refuses a new page by) is cleared, so the
  // screen never shows one thing while she asks about another (sim lab 7740135: a stale page under a new question, 20+ /64)
  if (!silent && item && item.id !== state.activeItemId && (!out.board || out.board.action === "keep") && !game && screen?.on === "board" && synced
    && !(screen.pageId && screen.pageId === a.askedPageId) && !visualAskOf(childWordsOf(event))
    && !synced({ ops: (screen.texts ?? []).map((text) => ({ op: "text", text })) }, `${say} ${promptFor(item, state.ctx?.lang ?? "hinglish") ?? item.prompt_en ?? ""}`)) {
    try { screen = tools.clear(lessonId); cleared = true; notes.push("stale page cleared"); } catch { /* the page stays */ }
  }
  // ── her line, held to the verified grade: no praise or "sahi" on an answer the key says is wrong or only partly right
  // (sim lab d6f93e7: misread_wrong_as_right 19/64, "Haan, 60,000 sahi chuna" while the misconception was live) ──
  if (verdict && verdict !== "correct") { const held = withoutPraise(say); if (held !== say) { say = held; notes.push(`praise removed (${verdict})`); } }
  // ── no mastery claim the record does not hold (sim lab 35c0b7c: "Tumne … sikh liya" for skills held at partly; the judge
  // reads her words, the parent reads her summary) ──
  { const held = withoutMastery(say, a.learner ?? {}); if (held !== say) { say = held; notes.push("mastery claim removed"); } }
  // ── never the machinery: the card's check, the grade, the key, the harness are the harness's words, not hers (sim lab
  // 3cf7cdc p08 #1: "Card ka check isse match nahi hua") ──
  { const held = withoutInternals(say); if (held !== say) { say = held; notes.push("internals removed"); } }
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
  let appended = null;
  if (item && !/[?？]/.test(say) && !ASKS.test(lastSentence)) {
    // the card question is asked aloud in her words; if her line ended elsewhere, the card's question closes it (streamed:
    // the caller speaks it after her streamed words, as `tail`)
    appended = promptFor(item, state.ctx?.lang);
    say = `${say} ${appended}`.trim();
    notes.push("card question appended");
  }
  const slot = game?.slot ?? (board?.pageId ? (() => { try { return tools.slot?.(lessonId, board.pageId) ?? null; } catch { return null; } })() : null);
  return {
    ...(typeof onSay === "function" ? { streamed: true, firstSayMs, tail: appended } : {}),
    say, intent: MOVE_OF[out.intent] ?? "explain", item, board, cleared, picture, game, gameRefused, screen, slot, speculation: adopted ? "adopted" : spec ? "dropped" : null, ...(spec && !adopted ? { droppedSpec: spec } : {}),
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
/** A graded answer that is deep evidence: a deep kind, and not an item the deep-kind audit marked plain (deep: false). */
const deepEntry = (x) => DEEP_KINDS.has(x.kind) && !x.plain;
export function earnedRead(level, graded, { deepAvailable = true } = {}) {
  if (level !== "understood") return level;
  const right = graded.map((x, i) => ({ ...x, i })).filter((x) => x.g === "correct");
  if (!right.length) return !graded.length || graded.some((x) => x.g.startsWith("partly")) ? "partly" : "not";
  // a miss this lesson is recovered only by three right answers after it, one of them deep (main's cohort condition 1,
  // overclaims; sim lab gates cc4b3d2, 7740135, 71a6b11, e26d16e: this drops 21 unearned "understood" reads for 7 true ones)
  const lastMiss = graded.map((x) => x.g !== "correct").lastIndexOf(true);
  if (lastMiss >= 0) {
    const after = graded.slice(lastMiss + 1);
    if (after.length < 3 || (deepAvailable && !after.some(deepEntry))) return "partly";
  }
  // a skill whose kit has no deep item (about 1 in 10): two different items right and nothing missed after
  if (!deepAvailable) return new Set(right.map((x) => x.item)).size >= 2 && !graded.slice(right.at(-1).i + 1).some((x) => x.g !== "correct") ? "understood" : "partly";
  const deep = right.filter(deepEntry);
  if (!deep.length) return "partly";
  const lastDeep = deep.at(-1).i;
  if (graded.slice(lastDeep + 1).some((x) => x.g !== "correct")) return "partly";
  const others = right.filter((x) => x.item !== deep.at(-1).item);
  return others.length ? "understood" : "partly";
}

const READ_BAR = 0.8;
/** A learner entry with its read set from its graded answers (and "untested" when only plain items were right). PURE. */
function withEvidenceRead(e) {
  const g = e?.graded ?? [];
  const level = evidenceRead(g, { bar: READ_BAR });
  if (!level) return e;
  const untested = level === "partly" && g.some((x) => x.g === "correct") && !g.some(deepEntry);
  const { depth: _d, ...rest } = e;
  return { ...rest, read: level, ...(untested ? { depth: "untested" } : {}) };
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
      graded: [...(learner[k]?.graded ?? []), { item: card.id, kind: card.kind, g, ...(plainEvidence(card) ? { plain: true } : {}) }].slice(-10),
      ...(cls.misconceptionId ? { misconceptions: [...new Set([...(learner[k]?.misconceptions ?? []), cls.misconceptionId])] } : {}) };
    // the read follows the graded answers on EVERY graded turn, not only when the model names one (sim lab e46a281c decided
    // truth, 164 skill reads: the stored model-turn read agreed 44% / over 10%; the evidence read on every grade 53% / 9%)
    if (g) learner[k] = withEvidenceRead(learner[k]);
  }
  if (out.read) {
    const k = out.read.skill;
    const deepAvailable = (kit.items ?? []).some((i) => i.skillId === k && DEEP_KINDS.has(i.kind) && i.kind !== "teachback" && !plainEvidence(i));
    const graded = learner[k]?.graded ?? [];
    // graded answers decide the read; with none, the model's claim is held to the old evidence rule (never understood)
    const level = graded.length ? evidenceRead(graded, { bar: READ_BAR }) : earnedRead(out.read.level, graded, { deepAvailable });
    // honest at the end of a lesson (sim lab 71a6b11): "partly" from right easy answers with no deep question asked yet is
    // not the "partly" of a child who got the deep one wrong
    const g = learner[k]?.graded ?? [];
    const untested = level === "partly" && g.some((x) => x.g === "correct") && !g.some(deepEntry);
    const { depth: _d, ...rest } = learner[k] ?? {};
    learner[k] = { ...rest, read: level, evidence: out.read.evidence, ...(level !== out.read.level ? { claimed: out.read.level } : {}), ...(untested ? { depth: "untested" } : {}) };
  }
  const screen = out.screen ? { on: out.screen.on, words: clip(out.screen.words, 300), texts: (out.screen.texts ?? []).slice(0, 12) } : (a.screen ?? { on: "nothing", words: "nothing is on the screen", texts: [] });
  next.agent = {
    ...a, plan: out.plan || a.plan, turns: turns.slice(-24), learner, screen,
    posed: out.item ? [...new Set([...(a.posed ?? []), out.item.id])] : (a.posed ?? []),
    skill: out.item?.skillId ?? a.skill ?? kit.skills?.[0]?.id,
    boards: (a.boards ?? 0) + (out.board ? 1 : 0), pictures: (a.pictures ?? 0) + (out.picture?.job ? 1 : 0),
    ...(out.gameRefused || a.noGame ? { noGame: true } : {}),
    ...(out.droppedSpec ? { specWaste: specWasteOf(a.specWaste, out.droppedSpec) } : {}),
    // a page that went up when the child asked to SEE something is theirs: the stale-page clear never takes it (stream 2)
    ...(out.board?.pageId && childText && visualAskOf(childText) ? { askedPageId: out.board.pageId } : {}),
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
