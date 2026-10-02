// The lesson state machine (learning-science rule 14: structure lives in code, not in the prompt).
//
//   warmup   greet (+ memory callback) → 2-3 retrieval items from due skills (P10)
//   teach    hook (with teach-back expectancy) → short explain → worked example (novices) | attempt-first (experienced)
//   practice items mixing kinds; why-after-correct (100% on new skills, ~40% consolidating);
//            hint ladder pump → hint → prompt → assertion, key withheld until rung 4, then an isomorphic item;
//            misconception → re-teach once with the kit's alternate representation; wheel-spinning → change approach
//   teachback the child teaches the protégé (P1), classified against the kit's expectations
//   wrap     specific summary + plain preview → done
// Cross-cutting: distress → safeguard (before anything else); "I want to stop" → wrap now;
// frustration loops → break with choices.
//
// step() is PURE: (state, input) → { state, move, moduleCommands, ui, end, item, next, content }.
// The route classifies, updates the learner model, then calls step with the updated skill snapshot.
import * as SH from "./shapes.js";
import { buildPracticeQueue, findItem, isomorphicFor, probeFor, promptFor, selectNext, anchorOf, whyKey, PROBE_WEIGHT } from "./items.js";
import { planModule } from "./modules.js";
import { frustrationLoop, initialAffect, nextAffect, wheelSpinning } from "../learner/affect.js";

export const LIMITS = {
  warmupMax: 3,            // rule 18: 2-4 retrieval items open each session
  warmupTries: 2,          // a warm-up item is left for later (unrevealed) after this many misses
  workedParts: 2,          // worked example spread over at most this many short turns
  practiceMin: 5,
  practiceMax: 9,
  teachbackTries: 2,
  minutes: { "6-9": 25, "10-15": 35 },
  whyConsolidating: 0.4,   // fusion rule 5: a why on ~30-50% of correct answers once a skill is consolidating
  breakGapTurns: 6,
  unclearTries: 2,
};
const RUNG = ["pump", "hint", "prompt", "assertion"];
const LEARNED = new Set(["learned_today", "mastered", "due"]);
const join = (...parts) => parts.filter(Boolean).join("; ");
const round2 = (x) => Math.round(x * 100) / 100;

/** Deterministic [0,1) from (seed, n) so the director stays a pure, replayable function. */
export function rand(seed, n) {
  let t = (seed + Math.imul(n + 1, 0x6d2b79f5)) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** The slice of a SkillState the director reasons with. */
export const snapshotSkill = (st) => ({
  pKnown: st.pKnown, status: st.status, attempts: st.attempts, correctUnaided: st.correctUnaided, generativePass: st.generativePass,
});

/** Expertise reversal (rule 16): novices get a worked example; anyone with a learned skill attempts first. */
function isNovice(kit, skills) {
  return !kit.skills.map((sk) => skills[sk.id]).filter(Boolean).some((st) => LEARNED.has(st.status) || st.pKnown >= 0.5);
}

/**
 * @param {{ topicId: string, kit: any, skills?: Record<string, any>, history?: Record<string, string[]>,
 *   warmupItems?: any[], activeMisconceptionIds?: string[], ctx: { firstName: string, teacherName: string,
 *   protege: { name: string, what: string }, ageBand: "6-9"|"10-15", lang: string, interests: string[],
 *   firstMeeting: boolean, hasCallback: boolean, topicTitle: string, nextTitle?: string }, seed: number, now?: number }} a
 */
export function initLessonState({ topicId, kit, skills = {}, history = {}, warmupItems = [], activeMisconceptionIds = [], ctx, seed, now = Date.now() }) {
  const novice = isNovice(kit, skills);
  return {
    v: 1, phase: "warmup", topicId, turn: 0, minutes: 0, startedAt: now, seed: seed >>> 0, ctx,
    hintLevel: 0, itemsDone: [], skipped: [], activeItemId: undefined, pendingWhy: undefined, lastMove: undefined, lastContent: [],
    warmup: warmupItems.slice(0, LIMITS.warmupMax), warmupIdx: 0,
    novice, teachPlan: novice ? ["hook", "explain", "worked_example"] : ["hook"], teachIdx: 0, workedPart: 0,
    queue: buildPracticeQueue(kit, { activeMisconceptionIds }),
    // Experienced learners attempt before any explanation, so their skills count as introduced.
    introduced: novice ? [] : kit.skills.map((sk) => sk.id),
    retaught: [], changedApproach: [], flagged: {}, asserted: [],
    nextItemId: undefined, tries: 0, unclear: 0, practiced: 0, easier: false,
    skills: Object.fromEntries(Object.entries(skills).map(([id, st]) => [id, snapshotSkill(st)])), history,
    affect: initialAffect(), lastBreakTurn: -99, safeguard: null,
    teachbackAsked: false, teachbackTries: 0, teachbackPassed: false,
    module: null, recent: [], seq: 0,
  };
}

/** Rule 3 schedule: always on a skill with no generative pass yet; sampled once it is consolidating. */
export function shouldAskWhy(s, item, skill) {
  if (["why", "teachback", "retrieval"].includes(item.kind)) return false;
  if (!skill?.generativePass) return true;
  return rand(s.seed, s.turn) < LIMITS.whyConsolidating;
}

/** "right" | "wrong" | "stuck" (don't know / just tell me) | "off" | "unclear". */
function verdict(cls) {
  if (!cls) return "unclear";
  if (cls.outcome === "correct") return "right";
  if (["incorrect", "partial", "misconception"].includes(cls.outcome)) return "wrong";
  if (cls.flags?.dontKnow || cls.flags?.asksForAnswer) return "stuck";
  if (cls.flags?.offTopic) return "off";
  return "unclear";
}

const plan = (kind, shape, extra = {}) => ({ kind, shape, ...extra });
const moveKindFor = (item) => (item.kind === "practice" ? "practice" : item.kind === "retrieval" ? "retrieval" : "probe");

function chipLabels(lang) {
  return lang === "english"
    ? { easier: "An easier one", rest: "Short break", go: "Keep going", cont: "Carry on", stop: "Stop for today" }
    : { easier: "Ek aasaan wala", rest: "Thoda break", go: "Chalo, karte hain", cont: "Aage chalein", stop: "Aaj ke liye bas" };
}
const optionChips = (item) => (item?.diagnostic && item.options.length <= 4
  ? item.options.map((o, i) => ({ id: `opt:${i}`, label: o.text.slice(0, 40) })) : undefined);

function activate(s, item) {
  s.activeItemId = item.id; s.hintLevel = 0; s.tries = 0; s.unclear = 0; s.pendingWhy = undefined;
}

/** Content lines for one part of the worked example (content is posed; it is not persona). */
function workedContent(we, part, parts) {
  const per = Math.ceil(we.steps.length / parts);
  return [`worked example: ${we.problem}`, `steps for this part: ${we.steps.slice((part - 1) * per, part * per).join(" → ")}`];
}

// ───────────────────────────── phases ─────────────────────────────

function warmup(s, input, item) {
  if (input.event === "start") {
    const first = s.warmup[0];
    if (first) activate(s, first);
    return plan("greet", SH.greet({ ...s.ctx, warmup: !!first }), first ? { item: first, probe: "P10" } : {});
  }
  if (!item) { s.phase = "teach"; return teach(s, input); }
  const v = verdict(input.cls);
  if (v === "right") { s.itemsDone.push(item.id); return nextWarmup(s, input, SH.retrievalNext()); }
  const leave = () => { s.skipped.push(item.id); return nextWarmup(s, input, SH.warmupMoveOn()); };
  if (v === "wrong" || v === "stuck") {
    s.tries += 1;
    if (s.tries >= LIMITS.warmupTries) return leave();
    s.hintLevel = Math.min(2, s.hintLevel + 1);
    return plan("hint", SH.hint({ level: s.hintLevel, rungShape: item.hints[s.hintLevel - 1], askedForAnswer: input.cls?.flags?.asksForAnswer }), { item });
  }
  return unclear(s, input, item, v, leave);
}

function nextWarmup(s, input, prefix) {
  s.warmupIdx += 1;
  const next = s.warmup[s.warmupIdx];
  if (next) { activate(s, next); return plan("retrieval", SH.pose({ item: next, prefix }), { item: next, probe: "P10" }); }
  s.activeItemId = undefined; s.hintLevel = 0;
  s.phase = "teach";
  return teach(s, input, prefix);
}

function teach(s, input, prefix) {
  const { kit } = input;
  while (s.teachIdx < s.teachPlan.length) {
    const stepName = s.teachPlan[s.teachIdx];
    if (stepName === "hook") {
      s.teachIdx += 1;
      return plan("hook", join(prefix, SH.hook({ interest: s.ctx.interests[0], contexts: kit.interestContexts, protege: s.ctx.protege })), { format: "F4" });
    }
    if (stepName === "explain") {
      s.teachIdx += 1;
      const sk = kit.skills[0];
      if (!s.introduced.includes(sk.id)) s.introduced.push(sk.id);
      return plan("explain", SH.explain({ skillTitle: sk.title, prefix }), { skillId: sk.id, format: kit.formats.primary, whiteboard: { kind: "text", value: sk.title } });
    }
    // worked_example — spread over at most LIMITS.workedParts turns, one step handed to the child each time
    const we = kit.workedExample;
    if (!we) { s.teachIdx += 1; continue; }
    const parts = Math.min(LIMITS.workedParts, we.steps.length);
    s.workedPart += 1;
    if (s.workedPart >= parts) s.teachIdx += 1;
    return plan("worked_example", join(prefix, SH.worked({ part: s.workedPart, parts })), {
      skillId: kit.skills[0].id, format: "F2", content: workedContent(we, s.workedPart, parts), whiteboard: { kind: "math", value: we.problem.slice(0, 80) },
    });
  }
  s.phase = "practice";
  return poseNext(s, input, prefix);
}

function leavePractice(s, kit) {
  const allUnaided = kit.skills.every((sk) => (s.skills[sk.id]?.correctUnaided ?? 0) >= 1);
  return s.practiced >= LIMITS.practiceMax || (s.practiced >= LIMITS.practiceMin && allUnaided) || s.minutes >= LIMITS.minutes[s.ctx.ageBand];
}

function poseNext(s, input, prefix, preferred) {
  const { kit } = input;
  s.activeItemId = undefined; s.hintLevel = 0; s.pendingWhy = undefined;
  if (leavePractice(s, kit)) return enterTeachback(s, prefix);
  const queued = s.nextItemId ? findItem(s, kit, s.nextItemId) : null;
  const item = preferred ?? queued ?? selectNext(s, kit, { easier: s.easier });
  s.nextItemId = undefined; s.easier = false;
  if (!item) return enterTeachback(s, prefix);
  // A skill nobody has explained yet gets one short explain turn first (novices; experienced attempt first).
  if (!s.introduced.includes(item.skillId)) {
    s.introduced.push(item.skillId); s.nextItemId = item.id;
    const sk = kit.skills.find((x) => x.id === item.skillId);
    return plan("explain", SH.explain({ skillTitle: sk?.title ?? "", prefix }), { skillId: item.skillId, format: kit.formats.primary });
  }
  activate(s, item);
  const attemptFirst = !s.novice && s.practiced === 0;
  return plan(moveKindFor(item), SH.pose({ item, prefix }), { item, probe: probeFor(item), format: attemptFirst ? "F8" : undefined, chips: optionChips(item) });
}

function practice(s, input, item) {
  const { kit, cls } = input;
  if (!item) return poseNext(s, input);
  if (s.lastMove?.kind === "break") return plan(moveKindFor(item), SH.pose({ item, prefix: "back to the question, fresh" }), { item, probe: probeFor(item), chips: optionChips(item) });
  // After an assertion nothing they say about THIS item is evidence; an isomorphic item proves it (rule 15).
  if (s.hintLevel >= 4) {
    s.itemsDone.push(item.id);
    return poseNext(s, input, "now a similar one for them", isomorphicFor(s, kit, item));
  }
  if (s.pendingWhy === item.id) return afterWhy(s, input, item);
  const v = verdict(cls);
  if (v === "right") return afterCorrect(s, input, item);
  if (v === "wrong" || v === "stuck") return afterMiss(s, input, item);
  return unclear(s, input, item, v, () => afterMiss(s, input, item));
}

function afterCorrect(s, input, item) {
  const { kit } = input;
  const unaided = s.hintLevel === 0;
  s.itemsDone.push(item.id); s.practiced += 1;
  if (unaided && shouldAskWhy(s, item, s.skills[item.skillId])) {
    s.pendingWhy = item.id;
    const mis = kit.misconceptions.find((m) => m.id === item.targetsMisconception) ?? kit.misconceptions[0];
    return plan("probe", SH.why({ ageBand: s.ctx.ageBand, prefix: SH.CONFIRM.correct }), {
      item, probe: "P2",
      content: [`key idea (right reason): ${whyKey(kit, item.skillId) ?? item.answer}`, ...(mis ? [`wrong belief to listen for: ${mis.belief}`] : [])],
    });
  }
  return poseNext(s, input, SH.CONFIRM.correct);
}

function afterWhy(s, input, item) {
  const { kit, cls } = input;
  s.pendingWhy = undefined;
  // Correct answer, wrong reason: the correct-answer trap (rule 3) — a misconception, not a success.
  const m = cls?.outcome === "misconception" ? kit.misconceptions.find((x) => x.id === cls.misconceptionId) : null;
  if (m) {
    s.flagged[m.id] = (s.flagged[m.id] ?? 0) + 1;
    if (!s.retaught.includes(m.id)) {
      s.retaught.push(m.id); s.activeItemId = undefined;
      return plan("reteach", SH.reteach({ ...m.remediation, again: false }), { skillId: item.skillId, representation: m.remediation.representation });
    }
  }
  return poseNext(s, input, verdict(cls) === "right" ? SH.CONFIRM.whyGood : SH.CONFIRM.whyMissed);
}

function afterMiss(s, input, item) {
  const { kit, cls } = input;
  s.tries += 1;
  const m = cls?.outcome === "misconception" ? (item.misconceptions ?? kit.misconceptions).find((x) => x.id === cls.misconceptionId) : null;
  if (m) s.flagged[m.id] = (s.flagged[m.id] ?? 0) + 1;
  // P21: no 3-in-a-row in ~10 opportunities — a different approach, not more of the same.
  if (wheelSpinning(s.history[item.skillId]) && !s.changedApproach.includes(item.skillId)) {
    s.changedApproach.push(item.skillId);
    s.hintLevel = Math.min(3, s.hintLevel + 1);
    const we = kit.workedExample;
    return plan("reteach", SH.changeApproach(), { item, content: we ? workedContent(we, 1, 1) : [] });
  }
  if (m?.remediation && !s.retaught.includes(m.id)) {
    s.retaught.push(m.id);
    s.hintLevel = Math.min(3, s.hintLevel + 1);   // a re-teach spends a rung but never reaches the assertion
    return plan("reteach", SH.reteach({ ...m.remediation, again: true }), { item, representation: m.remediation.representation });
  }
  s.hintLevel = Math.min(4, s.hintLevel + 1);
  if (s.hintLevel === 4) s.asserted.push(item.id);
  return plan("hint", SH.hint({ level: s.hintLevel, rungShape: item.hints[s.hintLevel - 1], askedForAnswer: cls?.flags?.asksForAnswer }), { item });
}

/** Unclear transcript or off-topic: re-ask (no evidence either way); after a few, `giveUp`. */
function unclear(s, input, item, v, giveUp) {
  if (v === "off") return plan("repair", SH.repairOffTopic(), { item });
  s.unclear += 1;
  if (s.unclear > LIMITS.unclearTries) { s.unclear = 0; return giveUp(); }
  return plan("repair", SH.repairUnclear(), { item, chips: optionChips(item) });
}

function enterTeachback(s, prefix) {
  s.phase = "teachback"; s.teachbackAsked = true; s.activeItemId = undefined; s.hintLevel = 0;
  return plan("teachback", join(prefix, SH.teachback({ protege: s.ctx.protege })), { probe: "P1", format: "F7" });
}

function teachback(s, input) {
  const { cls, kit } = input;
  s.teachbackTries += 1;
  if (cls?.outcome === "correct") { s.teachbackPassed = true; return toWrap(s, { prefix: SH.CONFIRM.teachbackPass }); }
  if (s.teachbackTries >= LIMITS.teachbackTries) return toWrap(s, {});
  const m = cls?.outcome === "misconception" ? kit.misconceptions.find((x) => x.id === cls.misconceptionId) : null;
  if (m) s.flagged[m.id] = (s.flagged[m.id] ?? 0) + 1;
  const missing = m ? `whether "${m.belief}" is true` : cls?.missing?.[0] ?? "the main idea, in simple words";
  return plan("teachback", SH.teachbackFollowup({ protege: s.ctx.protege, missing }), { probe: "P1", format: "F7" });
}

function toWrap(s, { prefix, stopping = false }) {
  s.phase = "done"; s.activeItemId = undefined; s.pendingWhy = undefined; s.hintLevel = 0;
  return plan("wrap", SH.wrap({ prefix, nextTitle: s.ctx.nextTitle, stopping }));
}

// ───────────────────────────── step ─────────────────────────────

function decide(s, input, item) {
  const { cls, chipId } = input;
  const flags = cls?.flags ?? {};
  const labels = chipLabels(s.ctx.lang);
  // 1. Safety before anything else — the predicate or the classifier, either one.
  if (flags.distress) { s.safeguard = { calm: 0, asked: false }; return plan("safeguard", SH.safeguard()); }
  if (s.safeguard) {
    if (flags.wantsToStop || chipId === "safe:stop") { s.safeguard = null; return toWrap(s, { stopping: true }); }
    if (s.safeguard.asked || chipId === "safe:continue") {
      s.safeguard = null;
      return item ? plan(moveKindFor(item), SH.pose({ item, prefix: "gently back to where you were" }), { item, probe: probeFor(item) }) : decide(s, { ...input, cls: null }, item);
    }
    s.safeguard.calm += 1;
    if (s.safeguard.calm < 2) return plan("safeguard", SH.safeguardStay());
    s.safeguard.asked = true;
    return plan("repair", SH.resumeAfterSafeguard(), { chips: [{ id: "safe:continue", label: labels.cont }, { id: "safe:stop", label: labels.stop }] });
  }
  if (s.phase === "done") return toWrap(s, { stopping: true });
  // 2. The child wants to stop: whatever was mid-way is over (NEVER MANIPULATE — no holding at goodbye).
  if (flags.wantsToStop) return toWrap(s, { stopping: true });
  // 3. Choices offered by a break.
  if (chipId === "break:rest") return plan("break", SH.stretch());
  if (chipId === "break:easier" && s.phase === "practice") {
    if (s.activeItemId) s.skipped.push(s.activeItemId);
    s.easier = true;
    return poseNext(s, input, "an easier one now");
  }
  // 4. A frustration loop (P20) gets a break with choices, not another question.
  if (frustrationLoop(s.affect) && ["warmup", "practice"].includes(s.phase) && s.turn - s.lastBreakTurn >= LIMITS.breakGapTurns) {
    s.lastBreakTurn = s.turn;
    s.affect = { ...s.affect, dontKnowStreak: 0, minimalStreak: 0 };
    return plan("break", SH.takeBreak(), { chips: [{ id: "break:easier", label: labels.easier }, { id: "break:rest", label: labels.rest }, { id: "break:continue", label: labels.go }] });
  }
  switch (s.phase) {
    case "warmup": return warmup(s, input, item);
    case "teach": return teach(s, input);
    case "practice": return practice(s, input, item);
    case "teachback": return teachback(s, input);
    default: return toWrap(s, {});
  }
}

/**
 * One director step.
 * @param {any} prev  lesson state (not mutated)
 * @param {{ event: "start"|"turn", kit: any, cls?: any, chipId?: string, now?: number }} input
 */
export function step(prev, input) {
  const s = structuredClone(prev);
  const now = input.now ?? Date.now();
  if (input.event !== "start") s.turn += 1;
  s.minutes = Math.round((now - s.startedAt) / 6000) / 10;
  if (input.event === "turn") {
    s.affect = nextAffect(s.affect, { read: input.cls?.flags ?? {}, outcome: input.cls?.outcome, itemId: s.activeItemId, at: now });
  }
  const p = decide(s, input, findItem(s, input.kit, s.activeItemId));

  const item = p.item ?? null;
  const move = { kind: p.kind, shape: p.shape };
  if (item) Object.assign(move, { itemId: item.id, skillId: item.skillId, hintLevel: s.hintLevel });
  if (p.skillId) move.skillId = p.skillId;
  if (p.probe) move.probe = p.probe;
  if (p.format) move.format = p.format;
  s.lastMove = move;
  s.lastContent = p.content ?? [];
  const moduleCommands = planModule(s, { move, item, kit: input.kit, lang: s.ctx.lang, representation: p.representation });
  const ui = { status: "your_turn" };
  const board = p.whiteboard ?? (item ? anchorOf(item, s.ctx.lang) : null);
  if (board) ui.whiteboard = board;
  if (p.chips?.length) ui.chips = p.chips;
  return { state: s, move, moduleCommands, ui, end: s.phase === "done", ...describe(s, input.kit) };
}

/**
 * What the compiler needs about the current move, derived from state alone (the realtime-token route
 * recompiles from a stored state, so this must not depend on anything step() saw transiently).
 */
export function describe(s, kit) {
  const item = s.lastMove?.itemId ? findItem(s, kit, s.lastMove.itemId) : null;
  return { item, content: s.lastContent ?? [], next: contingency(s, kit, item) };
}

/**
 * What to do AFTER the child's next reply. The voice lane answers on the instructions it already has
 * (the director refreshes them between turns, off the critical path), so they carry both branches.
 */
export function contingency(s, kit, item) {
  if (!item || s.phase === "done") return null;
  if (s.pendingWhy === item.id) return { onRight: SH.CONFIRM.whyGood, onWrong: SH.CONFIRM.whyMissed };
  const lvl = s.hintLevel;
  if (lvl >= 4) return { onRight: "a similar question for them comes next", onWrong: "a similar question for them comes next" };
  const why = !["why", "teachback", "retrieval"].includes(item.kind) && !s.skills[item.skillId]?.generativePass;
  const peek = s.phase === "practice" ? selectNext({ ...s, itemsDone: [...s.itemsDone, item.id] }, kit) : null;
  const then = why ? "then ask how they knew"
    : peek && s.introduced.includes(peek.skillId) ? `then this next question: ${promptFor(peek, s.ctx.lang)}` : "then the next step";
  return {
    onRight: join(SH.CONFIRM.correct, then),
    onWrong: `rung ${lvl + 1} of 4 (${RUNG[lvl]}): ${SH.rungText(item.hints[lvl])}${lvl === 3 ? " — only now may the key be said" : ""}`,
  };
}

/**
 * Evidence rows for the child's reply, judged against the state BEFORE this step.
 * @param {any} s  lesson state before step()
 * @param {any} cls classification
 * @param {any} kit
 * @param {{ leaked?: boolean, discount?: number }} [o]  leaked: the teacher said the key aloud before rung 4
 * @returns {import("../../shared/contracts").Evidence[]}
 */
export function evidenceFrom(s, cls, kit, { leaked = false, discount = 1 } = {}) {
  if (!cls || cls.outcome === "no_evidence" || s.safeguard) return [];
  const mis = cls.misconceptionId ? { misconceptionId: cls.misconceptionId } : {};
  if (s.phase === "teachback" && s.teachbackAsked) {
    const taught = kit.skills.filter((sk) => s.introduced.includes(sk.id));
    const w = round2(PROBE_WEIGHT.P1 * (kit.verified ? 1 : 0.5) * discount);
    return (taught.length ? taught : kit.skills).map((sk) => ({ skillId: sk.id, probe: "P1", outcome: cls.outcome, ...mis, hintsUsed: 0, weight: w }));
  }
  const item = findItem(s, kit, s.activeItemId);
  if (!item || s.hintLevel >= 4) return [];
  const why = s.pendingWhy === item.id;
  const probe = why ? "P2" : probeFor(item);
  let w = PROBE_WEIGHT[probe] * ((item.kitVerified ?? kit.verified) ? 1 : 0.5) * discount;
  // Young children often cannot verbalise what they do understand: a missed "why" is weak evidence.
  if (why && cls.outcome !== "correct" && cls.outcome !== "misconception") w *= 0.5;
  return [{ skillId: item.skillId, itemId: item.id, probe, outcome: cls.outcome, ...mis, hintsUsed: leaked ? 4 : s.hintLevel, weight: round2(w) }];
}
