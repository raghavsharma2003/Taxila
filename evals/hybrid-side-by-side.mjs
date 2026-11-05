// round 7 (main, 2026-11-04): the HYBRID side-by-side. One script plays the same scripted child turns through both teacher
// lanes, the Director (compile → textReply, the guard pipeline) and the Teacher agent (server/agent/agent.js, falling back to
// the Director as the route does), and writes both transcripts next to each other for a reader to judge. Claude reads them
// (CLAUDE.md: judging is done by the Claude Code session, never a Foundry judge); this script scores nothing.
//
//   node --env-file=.env.local evals/hybrid-side-by-side.mjs [--matrix] [--topic <id>] [--class 6] [--scenario steady,offtopic,stuck] [--cap 150] [--usd 2] [--out <dir>]
//   node evals/hybrid-side-by-side.mjs --dry      plumbing check: no network, stubbed model lines, nothing to judge
//
// No database: the route's own planTurn (routes/lesson.js __test) plans each turn on an in-memory learner state, as
// tests/learner-live.test.mjs does. The child is scripted (a fixed line per turn, whatever she said), so both lanes hear
// exactly the same words. Model calls per scenario: about 2 per turn per lane (the classifier when code cannot decide, and
// her reply): 3 scenarios × 10 turns ≈ 120 small calls (6 lessons). Ask main before more than about 20 lessons.
import { mkdirSync, writeFileSync } from "node:fs";
import { initLessonState, step } from "../server/director/state.js";
import { findItem } from "../server/director/items.js";
import { classify, classifyFast, targetFor } from "../server/director/classify.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { textReply, replyDeps, affirmsAnswer, NOT_RIGHT, screenContradictions, screenFacts, pointSaid } from "../server/brain/say.js";
import { saidMust, scriptOn, scriptWhyNot } from "../server/director/script.js";
import { createReactiveChild, maxTurnsFor } from "./child-sim/reactive.mjs";
import { agentTurn, eventOf, applyAgentTurn } from "../server/agent/agent.js";
import { agentBreach, noteAgentTurn, resetAgentRuns } from "../server/agent/invariants.js";
import { newLearnerState } from "../server/comprehension/fuse.js";
import { DEPLOY } from "../server/azure.js";
import { teacherDeployment } from "../server/agent/flags.js";
import { __test } from "../server/routes/lesson.js";
// round 7 S4 (main: "upgrade the harness so it runs Studio's board pick and Games' entryFor in-process and records what would be
// on screen each turn"): the pure parts of turn.js's visual path
import { whiteboardIntentOf, boardItemOf } from "../server/brain/propose.js";
import { preselect } from "../server/stagecraft/board-first.js";
import { entryFor } from "../server/play/levels.js";
import { askTruth, VISUAL_NOT_YET, VISUAL_DRAWING } from "../server/director/shapes.js";

const { planTurn } = __test;
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const DRY = process.argv.includes("--dry");

/** The scripted children: the same lines, in the same order, for both lanes. */
export const SCENARIOS = {
  // tries, half-knows, asks why and for an example
  steady: ["haan", "pata nahi", "4", "kyun?", "achha samajh gaya", "6", "ek aur example do", "theek hai", "8", "bas ho gaya"],
  // wanders off and comes back
  offtopic: ["mujhe cricket pasand hai", "kuch aur baat karte hain", "achha theek hai", "pata nahi", "game khelna hai", "3",
    "ye bahut boring hai", "haan", "2", "bye"],
  // stuck, asks for slower / Hindi / a picture, then leaves
  stuck: ["pata nahi", "samajh nahi aaya", "dhire dhire batao", "hindi mein batao", "5?", "pata nahi", "picture dikhao", "haan", "7",
    "bas aaj ke liye itna hi"],
  // steering-heavy (main, 2026-11-04): how they want to be taught, a diversion, a language switch, then leaving
  steering: ["haan", "step by step samjhao", "chhota bolo", "pehle picture dikhao", "pata nahi", "kuch aur baat karte hain", "cricket ke baare mein",
    "hindi mein batao", "mujhe khud try karne do", "bye"],
};

/** The full run's topics (dc-r7-hybrid-brain: 12 lessons a lane = 4 scenarios × 3 topics; the class-4 topic is the class-4 child). */
export const MATRIX_TOPICS = [["c6-maths-ch06-t01", 6], ["c5-maths-ch02-t01", 5], ["c4-maths-ch05-t01", 4]];

const CHILD = (cls) => ({ id: "00000000-0000-0000-0000-00000000aaaa", legal_mode: "M1", class_level: cls });
const LESSON = { id: "11111111-1111-1111-1111-11111111aaaa", started_at: new Date(0).toISOString() };

if (DRY) {
  // stubbed lines: the agent's call fails (it falls back, as on a live error) and her line is a fixed sentence
  // the dry meter counts the calls a live run would make (her line, and the classifier when code cannot decide), to size caps
  replyDeps.chat = async () => { dryCall("reply"); return { text: "Achha, chalo isko saath mein dekhte hain. Ek baar phir se batao?" }; };
  replyDeps.chatStream = async () => { dryCall("reply"); return { text: "Achha, chalo isko saath mein dekhte hain. Ek baar phir se batao?" }; };
} else if (!process.env.AZURE_OPENAI_ENDPOINT) {
  console.error("no AZURE_OPENAI_ENDPOINT: run with node --env-file=.env.local, or --dry for the plumbing check");
  process.exit(2);
}

// main's pilot limits (2026-11-04): a hard cap on model calls and on estimated spend, and a stop at the first auth refusal
// (the keys may have been rotated: never retried around). Every Azure call goes through fetch, so the guard sits there.
// Spend is an estimate: input ≈ request characters / 4 tokens, output ≈ 300 tokens a call, at the price book's rates.
const OUT = arg("out", `evals/hybrid-side-by-side/results/${new Date().toISOString().slice(0, 10)}${DRY ? "-dry" : ""}`);
const CAP = Number(arg("cap", "150"));
const USD_CAP = Number(arg("usd", "2"));
export const meter = { calls: 0, usd: 0, byDeployment: {} };
function dryCall(kind) { meter.calls++; meter.byDeployment[kind] = (meter.byDeployment[kind] ?? 0) + 1; }
if (!DRY) {
  const { usdOf } = await import("../server/azure.js");
  const real = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url);
    if (!/openai|azure|cognitiveservices|models\.ai/i.test(u)) return real(url, init);
    let dep = "?";
    try { dep = JSON.parse(String(init.body ?? "{}")).model ?? (u.match(/deployments\/([^/]+)/)?.[1] ?? "?"); } catch { /* not JSON */ }
    if (meter.calls >= CAP || meter.usd >= USD_CAP) { console.error(`STOP: cap reached (${meter.calls} calls, ~$${meter.usd.toFixed(3)})`); stopWith(4, "cap"); }
    meter.calls++;
    meter.byDeployment[dep] = (meter.byDeployment[dep] ?? 0) + 1;
    meter.usd += usdOf(dep, { in: Math.round(String(init.body ?? "").length / 4), cached: 0, out: 300, reasoning: 0 });
    const res = await real(url, init);
    if (res.status === 401 || res.status === 403) { console.error(`STOP: HTTP ${res.status} from ${dep} (auth): not retried`); stopWith(3, `auth ${res.status}`); }
    return res;
  };
}
/** A stop (cap or auth) still leaves the meter next to the finished scenarios; an unfinished scenario is not written. */
function stopWith(code, why) {
  try { mkdirSync(OUT, { recursive: true }); writeFileSync(`${OUT}/meter.json`, JSON.stringify({ stopped: why, calls: meter.calls, usdEstimate: +meter.usd.toFixed(3), byDeployment: meter.byDeployment, cap: CAP, usdCap: USD_CAP }, null, 1) + "\n"); } catch { /* the exit matters more */ }
  process.exit(code);
}
const timed = async (fn) => { const t0 = performance.now(); const v = await fn(); return [v, Math.round(performance.now() - t0)]; };

const say = (r) => r?.ui?.ask?.text ?? null;
const NO_COUNTS = new Set();
const WORD_BOARDS = /^(?:compare|flow|cycle|table|timeline|label|parts)@/;

async function classOf(state, kit, text, classLevel) {
  const item = state.activeItemId ? findItem(state, kit, state.activeItemId) : null;
  const target = targetFor(state, kit, item);
  const args = { target, childText: text, lang: state.ctx?.lang, classLevel, typed: true };
  if (DRY) { const f = classifyFast(args); if (!f.result) dryCall("classify"); return f.result ?? { outcome: "no_evidence", confidence: 1, flags: {}, source: "dry" }; }
  return classify(args);
}

/** One lesson on one lane: the opening, then every scripted line. */
async function lesson(lane, kit, classLevel, lines, persona = null) {
  // H1 (director5): a reactive scripted child answers what is on the table, by persona; else the fixed lines
  const child = persona ? createReactiveChild({ persona, seed: 7, kit, name: "Riya" }) : null;
  const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a pretend baby elephant" }, ageBand: classLevel <= 3 ? "6-9" : "10-15", lang: "hinglish",
    interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: kit.title ?? kit.topicId, classLevel, sessionId: LESSON.id, teacher: lane };
  let r = step(initLessonState({ topicId: kit.topicId, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
  const brief = { firstName: "Riya", classLevel, ageBand: ctx.ageBand, languagePref: "hinglish", interests: ["cricket"], recentWins: [], activeMisconceptions: [],
    memoryCallbacks: [], vibe: { pace: "medium", verbosity: "brief", humour: "medium" }, relationshipStage: "first_meeting (0 sessions together)" };
  let s = { ...r.state, brief, mode: "text", kitVerified: kit.verified, kitHash: kit.hash };
  const rows = [];
  const agentLine = async (st, event, extra = {}) => {
    try {
      const out = await agentTurn({ state: st, kit, event, lessonId: LESSON.id, lane: "text", ...extra });
      return out;
    } catch (e) { return { error: String(e?.message ?? e).slice(0, 120) }; }
  };
  // opening
  let opening = null, openMove = r.move.kind, openFell = null;
  if (lane === "agent") {
    const out = await agentLine(s, eventOf({ kind: "start" }));
    if (out?.say) { const a = applyAgentTurn(s, out, { kit, childText: null, lessonId: LESSON.id }); opening = out.say; openMove = a.move.kind; r = { ...r, ui: a.ui }; }
    else openFell = out?.error ?? "no line";
  }
  opening ??= (await textReply({ instructions: instructionsFor(s, kit), state: s, kit, childText: "", ui: r.ui, module: null })).reply;
  rows.push({ who: "teacher", text: opening, move: openMove, card: say(r), ...(openFell ? { fellBack: openFell } : {}) });
  s.recent = [...(s.recent ?? []), { who: "teacher", text: opening }];
  let live = { state: newLearnerState({ childId: CHILD(classLevel).id, classLevel }), maxSeq: 0 };
  // (H1.1: the persona sets its own budget, Learning maxTurnsFor: steady leaves at 40, so skills 2-3 are reached)
  const MAX = child ? maxTurnsFor(persona) : lines.length;
  let lastBoardUp = false;
  for (let i = 0; i < MAX; i++) {
    let text = lines?.[i];
    let leaving = false;
    if (child) {
      const live = s.activeItemId ? findItem(s, kit, s.activeItemId) : null;
      const card = live ? { itemId: live.id, key: String(live.answer), accept: live.acceptable ?? [], misses: s.misses?.[live.id] ?? 0 } : null;
      const ask = live?.scriptAsk ? { key: String(live.answer), accept: live.acceptable ?? [], targets: live.scriptAsk.targets ?? null, wrongIfMis: live.scriptAsk.wrongIfMis ?? null }
        : live?.scriptCheck ? { key: String(live.answer), accept: live.acceptable ?? [], targets: live.scriptCheck.targets ?? null, wrongIfMis: live.scriptCheck.wrongIfMis ?? null }
        : live?.scriptThen ? { key: String(live.answer), accept: live.acceptable ?? [], targets: live.scriptThen.targets ?? null, wrongIfMis: live.scriptThen.wrongIfMis ?? null } : null;
      const sb = s.lastMove?.scriptBeat;
      const out = child.reply({ turn: i, teacher: [...(s.recent ?? [])].reverse().find((t) => t.who === "teacher")?.text ?? "",
        beat: sb ? { skillId: sb.skillId, kind: sb.kind, beatId: sb.beatId } : null, card, ask, boardUp: lastBoardUp, lang: s.ctx?.lang ?? "hinglish",
        // (H1.1: her probe or teach-back move is unkeyed: the child gives a reason; else the child reads her line)
        ...(["probe", "teachback"].includes(s.lastMove?.kind) ? { probe: true } : {}) });
      text = out.text; leaving = out.kind === "leave";
    }
    if (text == null) break;
    const now = (i + 1) * 20_000;
    s = { ...s, seq: s.seq + 1, recent: [...s.recent, { who: "child", text }] };
    const [c, classifyMs] = await timed(() => classOf(s, kit, text, classLevel));
    rows.push({ who: "child", text, read: c.outcome + (c.request?.type ? ` · ${c.request.type}` : ""), classifyMs });
    const activeItem = s.activeItemId ? findItem(s, kit, s.activeItemId) : null;
    const p = await planTurn(s, c, { kit, child: CHILD(classLevel), lesson: LESSON, activeItem, moduleOnly: false, moduleEvents: [],
      answer: text, childText: text, leaked: false, live: Promise.resolve(live), carried: [], now });
    live = { state: p.learner.after, maxSeq: live.maxSeq };
    let next = { ...p.r.state, mode: "text" };
    let move = p.r.move.kind, ui = p.r.ui, reply = null, fellBack = null, guard = null, guardAfter = null, replyMs = 0;
    // (as brain/turn.js: the stop check-in is the Director's on both lanes)
    if (lane === "agent" && !["safeguard", "wrap"].includes(move) && !p.r.end && !c.flags?.distress && !p.r.move.checkin) {
      const card = s.activeItemId ? findItem(s, kit, s.activeItemId) : null;
      const verdict = card ? (c.outcome === "correct" ? "correct" : c.outcome === "partial" ? "partly" : ["incorrect", "misconception"].includes(c.outcome) ? "wrong" : null) : null;
      const [out, ms] = await timed(() => agentLine(s, eventOf({ kind: "turn", childText: text, typed: true, cls: c, card, kit, lang: "hinglish" }), { verdict }));
      replyMs += ms;
      if (out?.say) {
        const an = structuredClone(next);
        an.activeItemId = s.activeItemId; an.hintLevel = s.hintLevel; an.phase = s.phase; an.itemsDone = s.itemsDone;
        const a = applyAgentTurn(an, out, { kit, childText: text, cls: c, card, lessonId: LESSON.id });
        // the code invariants on her line, exactly as brain/turn.js applies them (main's pilot judgement #3, #8, #9)
        const inv = { classLevel, kitText: (kit.items ?? []).map((i) => `${i.prompt_en ?? ""} ${i.prompt_hi ?? ""}`).join(" ").replace(/\s+/g, " "),
          phase: s.phase, cardOnTable: !!card, agent: s.agent ?? {}, cls: c };
        const breach = a.end && !p.r.end ? "agent_end_without_checkin" : agentBreach(out, inv);
        if (breach) { fellBack = breach; next = { ...next, agent: resetAgentRuns(next.agent ?? s.agent ?? {}) }; }
        else { an.agent = noteAgentTurn(an.agent, out, inv); next = an; move = a.move.kind; ui = a.ui; reply = out.say; }
      } else fellBack = out?.error ?? "no line";
    }
    // S4: what a picture / game request would put on the screen this turn (turn.js: the board pick, the play admission), and
    // her shape made true about it, as production does (boardTruthShape, askTruth); the screen is recorded on the row
    let screen = null, instructions = p.instructions;
    // T4 (screen contract): a scripted beat's board is drawn too (turn.js asks Studio on explain beats; intent.boardRef), and
    // what is on the screen reaches her line as production's does (ui.studioSlot: the screen guard and the facts row)
    let slot = null;
    const scriptedBoard = !!next.lastMove?.scriptBeat?.board;
    if (lane === "director" && (p.r.move?.request === "visual" || scriptedBoard)) {
      const visual = p.r.move?.request === "visual" ? String(p.r.move.visual ?? "diagram") : "diagram";
      let shape = String(next.lastMove?.shape ?? "");
      if (visual === "game") {
        const e = entryFor({ skillId: next.lastMove?.skillId ?? null, topicId: kit.topicId });
        screen = e ? { kind: "game", game: `${e.family}/${e.mode}`, goal: e.goal ?? null } : { kind: "none", why: "no game for this skill" };
        if (e) slot = { artifact: { kind: "play", game: `${e.family}/${e.mode}` } };
        shape = askTruth(shape, "game", e ? "engine" : "none");
      } else {
        const item = boardItemOf(next, kit, findItem); // (as turn.js: the move's card, else the worked example's faded step on a picture ask)
        // (preselect caches its pick by intentId = lessonId:wb:turn: one id per lesson, never the harness's shared LESSON.id)
        const ask = whiteboardIntentOf({ lessonId: `${LESSON.id}-${kit.topicId}-${lines.join("|").length}`, turn: next.turn, beat: { id: "visual", type: "explain" }, next, kit, item, line: { text: "" } });
        const pick = preselect(ask, { kit });
        if (process.env.HARNESS_DEBUG_SCREEN) console.error("[screen]", kit.topicId, JSON.stringify({ intent: ask.intent, item: item?.id ?? null, phase: next.phase, pick: pick ? pick.template ?? pick.by : null }));
        if (pick) {
          // (H1.2: every script board's record says whether it carried SC1 counts; a template that emits none is flagged once)
          const counts = pick.screen?.counts ?? pick.facts?.counts ?? pick.script?.facts?.counts ?? null;
          screen = { kind: "whiteboard", by: pick.by ?? null, template: pick.template ?? null, onScreen: pick.facts?.onScreen ?? null,
            counts, ...(ask.intent.boardRef ? { boardRef: ask.intent.boardRef } : {}) };
          // (Studio: word boards — compare, flow, cycle, table, timeline, label, parts — have nothing countable: not a miss)
          if (!counts && pick.template && !WORD_BOARDS.test(pick.template) && !NO_COUNTS.has(pick.template)) { NO_COUNTS.add(pick.template); console.error(`NO COUNTS: ${pick.template} (${kit.topicId}) drew a board with no screen.counts`); }
          slot = { artifact: { kind: "whiteboard", archetype: "whiteboard", script: { ops: pick.script?.ops ?? [], facts: pick.facts ?? null }, ...(pick.screen ? { screen: pick.screen } : {}) } };
          if (shape.includes(VISUAL_NOT_YET)) shape = shape.replace(VISUAL_NOT_YET, VISUAL_DRAWING);
          if (pick.row) next = { ...next, lastContent: [...(next.lastContent ?? []), pick.row] };
        } else screen = { kind: "none", why: "no board for this ask" };
        if (visual === "animation" || visual === "simulation") shape = askTruth(shape, visual, "none");
      }
      next = { ...next, lastMove: { ...next.lastMove, shape } };
      instructions = instructionsFor(next, kit);
    }
    if (reply == null) {
      const [t, ms] = await timed(() => textReply({ instructions, state: next, kit, childText: text, history: next.recent.slice(0, -1), ui: slot ? { ...ui, tray: "studio", studioSlot: slot } : ui, module: null }));
      replyMs += ms;
      reply = t.reply; guard = t.guard?.caught?.length ? t.guard.caught : null;
      // (main's director2 judgement: a caught problem must be told apart from a fixed one) what was left after the rewrite, and
      // whether code replaced or repaired the line
      if (guard) guardAfter = { afterRewrite: t.guard.afterRewrite ?? null, replaced: !!t.guard.replaced, repaired: !!t.guard.repaired };
    }
    // replyReadyMs: from the child's words to her whole line ready (the classifier, then her line): what first sound waits on
    // director4 (main): per turn, the script beat, the board ref shown, whether a scene was up, the check state
    const sb = next.lastMove?.scriptBeat ?? null;
    const beat = sb ? `${sb.skillId?.split("-").at(-1) ?? "?"}:${sb.kind}:${sb.beatId}` : null;
    const cardId = ui?.ask?.itemId ?? null;
    const check = cardId ? { itemId: cardId, scripted: String(cardId).startsWith("script:"), misses: next.misses?.[cardId] ?? 0, gave: !!next.lastMove?.gave } : null;
    // (a board or game on screen this turn; Studio's code-built scenes (M5a) are not simulated in-process: scene is always null)
    const boardUp = !!(screen && screen.kind !== "none");
    // director5 gate counts (dc-r7-script-walk-v2): was the beat delivered (its must-say words in her line); did a keyed answer
    // get a verdict (right: an affirmation; wrong: a not-right first sentence); how many sentences contradict the screen
    // (dc-r7-script-walk-v3 exact counts) delivered = the authored point spoken (explain beats); the verdict = the GRADED state
    // (next.lastVerdict: a keyed answer graded correct / not_yet) plus the code verdict sentence; and right answers called wrong
    const firstS = (String(reply).match(/[^.!?।]+[.!?।]*/) ?? [""])[0];
    const delivered = next.lastMove?.point ? pointSaid(reply, next.lastMove.point) : next.lastMove?.mustSay?.length ? saidMust(reply, next.lastMove.mustSay, next.ctx?.lang ?? "hinglish") : null;
    const graded = ["correct", "not_yet"].includes(next.lastVerdict) ? next.lastVerdict : null;
    const answered = graded ? (graded === "correct" ? "correct" : c.outcome) : null;
    // (H1.2: a right answer's verdict is an explicit affirmation; silence is not a verdict)
    const verdictGiven = graded ? (graded === "correct" ? affirmsAnswer(firstS) : NOT_RIGHT.test(firstS)) : null;
    const keyed = activeItem ? [activeItem.answer, ...(activeItem.acceptable ?? [])].filter(Boolean).map((k) => String(k).toLowerCase().replace(/\s+/g, " ").trim()) : [];
    // (a keyed right answer graded not_yet, or met with a not-right lead that does not affirm: "Sahi, … barabar nahi hain" to the
    // key "nahi" is an affirmation, director6's 3 false counts)
    const rightCalledWrong = !!activeItem && keyed.includes(String(text).toLowerCase().replace(/\s+/g, " ").trim())
      && (graded === "not_yet" || (NOT_RIGHT.test(firstS) && !affirmsAnswer(reply)));
    // (H1.2, a new count: a wrong answer called right: the script's listed wrong answer graded right, or a graded-wrong answer
    // met with an affirmation and no not-right)
    const meta = activeItem?.scriptAsk ?? activeItem?.scriptCheck ?? activeItem?.scriptThen ?? null;
    const saidN = String(text).toLowerCase().replace(/\s+/g, " ").trim();
    const wim = meta?.wrongIfMis ? String(meta.wrongIfMis).toLowerCase().replace(/\s+/g, " ").trim() : null;
    const wrongCalledRight = !!activeItem && ((graded === "correct" && !!wim && (saidN === wim || saidN.replace(/\s*(?:hai na|hai)$/, "") === wim))
      || (graded === "not_yet" && affirmsAnswer(firstS) && !NOT_RIGHT.test(firstS)));
    const contradictions = next.lastMove?.scriptBeat ? screenContradictions(reply, screenFacts(slot ? { studioSlot: slot } : ui, next.lastMove)).length : 0;
    rows.push({ who: "teacher", text: reply, move, card: ui?.ask?.text ?? null, replyMs, replyReadyMs: classifyMs + replyMs, beat, boardRef: screen?.boardRef ?? sb?.board ?? null, boardUp, scene: null, check,
      gate: { delivered, answered, verdictGiven, contradictions, rightCalledWrong, wrongCalledRight },
      ...(screen ? { screen } : {}), ...(guard ? { guard, guardAfter } : {}), ...(fellBack ? { fellBack } : {}) });
    s = { ...next, recent: [...(next.recent ?? []), { who: "teacher", text: reply }] };
    lastBoardUp = boardUp;
    if (child && (leaving || p.r.end)) break;
    if (p.r.end) break;
  }
  return rows;
}

const md = (name, topic, A, B) => {
  const side = (rows) => rows.map((r) => r.who === "child" ? `**child:** ${r.text}  _(${r.read})_`
    : `**Asha** [${r.move}${r.beat ? ` · beat ${r.beat}` : ""}${r.check ? ` · check ${r.check.itemId}${r.check.misses ? ` (${r.check.misses} miss)` : ""}${r.check.gave ? " gave" : ""}` : ""}${r.boardUp ? " · board up" : ""}${r.replyReadyMs != null ? ` · ready ${r.replyReadyMs} ms` : ""}${r.fellBack ? ` · fell back: ${r.fellBack}` : ""}${r.guard ? ` · guard ${r.guard.join(",")}` : ""}]: ${r.text}${r.card ? `\n  > card: ${r.card}` : ""}${r.screen ? `\n  > screen: ${r.screen.kind === "game" ? `game ${r.screen.game}` : r.screen.kind === "whiteboard" ? `board ${r.screen.template ?? r.screen.by ?? ""} ${JSON.stringify(r.screen.onScreen ?? {})}${r.screen.boardRef ? ` · ref ${JSON.stringify(r.screen.boardRef)}` : ""}` : `nothing (${r.screen.why})`}` : ""}`).join("\n\n");
  return `# ${name} · ${topic}${DRY ? " (DRY: stubbed lines, nothing to judge)" : ""}\n\n## Director\n\n${side(A)}\n\n## Agent\n\n${side(B)}\n`;
};

const MATRIX = process.argv.includes("--matrix");
// H1 (director5): --reactive plays the reactive child (evals/child-sim/reactive.mjs), persona = the scenario name
const REACTIVE = process.argv.includes("--reactive");
const runs = MATRIX
  ? (arg("topics", "") ? arg("topics", "").split(",").map((t) => [t.trim(), Number(/^c(\d+)-/.exec(t.trim())?.[1] ?? 6)]) : MATRIX_TOPICS).flatMap(([topicId, classLevel]) => ["steady", "offtopic", "stuck", "steering"].map((name) => ({ topicId, classLevel, name })))
  : arg("scenario", "steady,offtopic,stuck").split(",").filter((n) => SCENARIOS[n]).map((name) => ({ topicId: arg("topic", "c6-maths-ch06-t01"), classLevel: Number(arg("class", "6")), name }));
// (a run finished in parts: --skip leaves out lessons already written, by output name)
const SKIP = new Set(arg("skip", "").split(",").map((x) => x.trim()).filter(Boolean));
// (main, after director6's first start walked no script at all: a script run never starts on a topic with no walkable script;
// it says which topic and why, and spends nothing)
if (process.env.TAXILA_R7_SCRIPT && scriptOn()) {
  const bad = [...new Set(runs.map((r) => r.topicId))].map((t) => [t, scriptWhyNot(kitFromFile(getTopic(t)))]).filter(([, why]) => why);
  if (bad.length) { for (const [t, why] of bad) console.error(`NO SCRIPT: ${t}: ${why}`); console.error("refusing to run: TAXILA_R7_SCRIPT=on and a topic would fall back to the kit"); process.exit(5); }
}
const dir = OUT;
mkdirSync(dir, { recursive: true });
for (const { topicId, classLevel, name: scenario } of runs) {
  const kit = kitFromFile(getTopic(topicId));
  // (two topics of one class in one run, director5's c5 t01 and t02: named by topic)
  const name = MATRIX ? (arg("topics", "") ? `${scenario}-${topicId.replace(/-maths-/, "-")}` : `${scenario}-c${classLevel}`) : scenario;
  if (SKIP.has(name)) continue;
  // one lane after the other, so neither lane's latency is measured while the other is calling
  // --agent-only: the agent lane alone (main 2026-11-04: the agent half rerun with its production invariants)
  const AGENT_ONLY = process.argv.includes("--agent-only");
  const A = AGENT_ONLY ? [] : await lesson("director", kit, classLevel, SCENARIOS[scenario], REACTIVE ? scenario : null);
  // --director-only: the Director lane alone (main 2026-11-04: the Director-half rerun after block 2; the agent lane is frozen)
  const DIRECTOR_ONLY = process.argv.includes("--director-only");
  const B = DIRECTOR_ONLY ? [] : await lesson("agent", kit, classLevel, SCENARIOS[scenario], REACTIVE ? scenario : null);
  const deployments = { reply: DEPLOY.reply, classify: DEPLOY.classify, agent: teacherDeployment() };
  writeFileSync(`${dir}/${name}.json`, JSON.stringify({ topicId, classLevel, scenario, dry: DRY, deployments, director: A, agent: B }, null, 1) + "\n");
  // (a script run whose lesson walked no script beat is a broken run, never a result: it stops loudly)
  if (process.env.TAXILA_R7_SCRIPT && scriptOn() && A?.length && !A.some((r) => r.beat)) {
    console.error(`NO SCRIPT BEATS: ${name} walked no script beat (${topicId}); stopping`); stopWith(6, "no script beats");
  }
  writeFileSync(`${dir}/${name}.md`, md(name, topicId, A, B));
  const fell = B.filter((r) => r.fellBack).length;
  const p50 = (rows) => { const v = rows.filter((r) => r.replyReadyMs != null).map((r) => r.replyReadyMs).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : null; };
  console.log(`${name}: ready p50 director ${p50(A)} ms · agent ${p50(B)} ms · calls so far ${meter.calls} (~$${meter.usd.toFixed(3)})`);
  console.log(`${name}: director ${A.filter((r) => r.who === "teacher").length} turns · agent ${B.filter((r) => r.who === "teacher").length} turns (${fell} fell back) → ${dir}/${name}.md`);
}
writeFileSync(`${dir}/meter.json`, JSON.stringify({ calls: meter.calls, usdEstimate: +meter.usd.toFixed(3), byDeployment: meter.byDeployment, cap: CAP, usdCap: USD_CAP }, null, 1) + "\n");
console.log(`done: ${meter.calls} model calls, ~$${meter.usd.toFixed(3)} estimated`);
