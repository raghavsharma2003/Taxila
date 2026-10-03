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
// Module-only turns (the child acted in an activity and said nothing): an answer on the active item is
// machine truth and runs the normal answer path; goal_met / stuck get a reaction (celebrate / nudge) that
// leaves the plan where it was — they were once graded as an unclear reply and walked the teach phase.
//
// step() is PURE: (state, input) → { state, move, moduleCommands, ui, end, item, content }.
// The route classifies, updates the learner model, then calls step with the updated skill snapshot.
// branchesFor() runs step() on a synthetic right and wrong reply: the voice lane's "if right / if not"
// lines are the director's own next moves, never a second guess at them.
import * as SH from "./shapes.js";
import { readFileSync } from "fs";
import { buildPracticeQueue, findItem, isomorphicFor, probeFor, promptFor, optionsSpoken, selectNext, anchorOf, whyKey, PROBE_WEIGHT } from "./items.js";
import { registerNote } from "./register.js";
import { askText } from "./say.js";
import { getTopic } from "../content/curriculum.js";
import { planModule } from "./modules.js";
import { frustrationLoop, initialAffect, nextAffect, wheelSpinning } from "../learner/affect.js";
import {
  newProbeSession, openSession, recordTurn, nextProbe, markAsked, fits, bandOf, shapeById, testWeight,
  reteachTrigger, reteachPlan, armsFromKit, newPersonaState, personaStep, personaKnobs, turnSignals,
} from "../comprehension/index.js";
import { skillSess } from "../comprehension/budget.js";

/**
 * Probe shapes the live lane can pose AND grade today: the why-class shapes (probe.why, R-EXP against the kit's key
 * ideas: classify's why mode for the move, the blind closed-label grader for the facet). The scheduler picks among
 * these only (schedule.js `allow`); errorspot / transfer / predict / mcq shapes need graders the live lane does not
 * run yet (decision integration-live-probe-subset).
 */
export const LIVE_PROBE_SHAPES = new Set(["C03", "C06", "C09", "C10", "C12", "C14"]);
/** Graded items on a skill after an engine re-teach before its trigger may fire again (the re-check, spec §5.4). */
export const RETEACH_COOLDOWN = 2;

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
const LEARNED = new Set(["learned_today", "mastered", "due"]);
const join = (...parts) => parts.filter(Boolean).join("; ");
const round2 = (x) => Math.round(x * 100) / 100;
/** On the whiteboard while safeguarding holds: on screen whatever the voice manages to say. */
const HELPLINES = { kind: "text", value: "Childline 1098 · Tele-MANAS 14416" };

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
export function initLessonState({ topicId, kit, skills = {}, history = {}, warmupItems = [], activeMisconceptionIds = [], ctx, seed, now = Date.now(), openers = [], comp }) {
  const novice = isNovice(kit, skills);
  const classLevel = ctx.classLevel ?? (ctx.ageBand === "6-9" ? 3 : 6);
  const band = bandOf(classLevel);
  // The probe session (COMPREHENSION-ENGINE.md §3.4): test-load budget, spacing, novelty and the mandatory triggers;
  // openers (delayed checks due at session open) are its first pending triggers.
  const probeSess = openSession(newProbeSession({ sessionId: ctx.sessionId ?? String(seed >>> 0), band, lessonSeed: seed >>> 0,
    targets: kit.skills.map((sk) => sk.id), surface: { visual: true } }), openers);
  return {
    v: 1, phase: "warmup", topicId, turn: 0, minutes: 0, startedAt: now, seed: seed >>> 0, ctx,
    hintLevel: 0, itemsDone: [], skipped: [], activeItemId: undefined, pendingWhy: undefined, lastMove: undefined, lastContent: [],
    warmup: warmupItems.slice(0, LIMITS.warmupMax), warmupIdx: 0,
    novice, teachPlan: novice ? ["hook", "explain", "worked_example"] : ["hook"], teachIdx: 0, workedPart: 0,
    queue: buildPracticeQueue(kit, { activeMisconceptionIds }),
    // Experienced learners attempt before any explanation, so their skills count as introduced.
    introduced: novice ? [] : kit.skills.map((sk) => sk.id),
    retaught: [], changedApproach: [], flagged: {}, misCorrect: {},
    nextItemId: undefined, verify: undefined, tries: 0, unclear: 0, practiced: 0, easier: false,
    skills: Object.fromEntries(Object.entries(skills).map(([id, st]) => [id, snapshotSkill(st)])), history,
    affect: initialAffect(), lastBreakTurn: -99, safeguard: null,
    teachbackAsked: false, teachbackTries: 0, teachbackPassed: false,
    module: null, recent: [], seq: 0,
    // Voice lane: the client reported the teacher turn that voiced lastMove (routes/lesson.js); cleared when
    // step() plans a new move. compile() then frames the move as already said.
    moveVoiced: false,
    // Items whose key a teacher turn stated before they were posed: their answers are not evidence.
    spoiled: [],
    // Comprehension engine (session-only): the probe session, the probe being answered, the beliefs the scheduler
    // reads (compact; set by the route from the ledger before each step), engine re-teach bookkeeping, and the
    // vibe persona whose knobs compile into the VIBE row. Voice/vibe never enter a belief (CE8).
    probeSess, pendingProbe: undefined, comp: comp ?? null, reteachCool: {}, armsUsed: [], failsPostRung3: {}, lastReteach: null, parked: [],
    persona: newPersonaState({ band, classLevel, medium: ctx.schoolMedium ?? "english" }), vibe: null, turnsSinceError: 99,
  };
}

/** Rule 3 schedule: always on a skill with no generative pass yet; sampled once it is consolidating. */
export function shouldAskWhy(s, item, skill) {
  if (["why", "teachback", "retrieval"].includes(item.kind)) return false;
  if (!skill?.generativePass) return true;
  return rand(s.seed, s.turn) < LIMITS.whyConsolidating;
}

/**
 * The probe for the answer just given right (INTEGRATION.md §2: shouldAskWhy → nextProbe). Scoped to THIS item's
 * skill and its pending triggers (the why is about the question just answered). A kit with no key ideas, or a state
 * the route gave no beliefs, falls back to the rule-3 sampling (LIMITS.whyConsolidating), which a voice
 * followUpProbe may move to "ask now" when the budget allows (CE8 (a)).
 * @returns {null | { skillId: string, shapeId: string|null, facet: string, mandatory: boolean, reason: string, testWeight: number, family?: string, cls?: string, longForm?: boolean }}
 */
export function probePlanFor(s, item, kit, voice) {
  if (["why", "teachback", "retrieval"].includes(item.kind)) return null;
  const ideas = item.expectations ?? kit.expectations ?? [];
  const sk = s.comp?.[item.skillId];
  const sess = s.probeSess;
  if (!sk || !ideas.length || !sess) {
    const ask = shouldAskWhy(s, item, s.skills[item.skillId]) || (!!voice?.followUpProbe && (!sess || fits(sess, 1)));
    return ask ? { skillId: item.skillId, shapeId: null, facet: "U", mandatory: false, reason: "fallback", testWeight: 1, cls: "probe.why" } : null;
  }
  const scoped = { ...sess, pending: sess.pending.filter((t) => t.skillId === item.skillId) };
  return nextProbe({ [item.skillId]: sk }, scoped, { currentSkill: item.skillId, voice, skin: s.vibe?.probeSkin ?? null, allow: LIVE_PROBE_SHAPES });
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

/** Chip labels are UI chrome: English in every lesson language (owner directive; PRODUCT-DESIGN-V2 §0.10, §5.3). */
function chipLabels() {
  return { easier: "An easier one", rest: "Short break", go: "Keep going", cont: "Carry on", stop: "Stop for today" };
}
const optionChips = (item) => (item?.diagnostic && item.options.length <= 4
  ? item.options.map((o, i) => ({ id: `opt:${i}`, label: o.text.slice(0, 40) })) : undefined);

function activate(s, item) {
  s.activeItemId = item.id; s.hintLevel = 0; s.tries = 0; s.unclear = 0; s.pendingWhy = undefined;
  // A warm-up item on an opener skill IS that skill's delayed check (C31, callback in passing): it clears the trigger.
  if (item.kind === "retrieval" && s.probeSess?.pending.some((t) => t.skillId === item.skillId && t.reason === "delayed_check")) {
    const plan = { skillId: item.skillId, shapeId: "C31", facet: "D", mandatory: true, reason: "delayed_check", testWeight: testWeight(shapeById("C31")), family: "H", cls: "item.open" };
    s.probeSess = markAsked(s.probeSess, plan, s.comp?.[item.skillId]?.belief ?? null);
    s.pendingProbe = plan;
  }
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
    return plan("greet", SH.greet({ ...s.ctx, warmup: !!first, interest: s.ctx.interests?.[0] }), first ? { item: first, probe: "P10" } : {});
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
      return plan("hook", join(prefix, SH.hook({ interest: s.ctx.interests?.[0], contexts: kit.interestContexts, protege: s.ctx.protege })), { format: "F4" });
    }
    if (stepName === "explain") {
      s.teachIdx += 1;
      const sk = kit.skills[0];
      if (!s.introduced.includes(sk.id)) s.introduced.push(sk.id);
      // No whiteboard: the skill title is syllabus objective text, never something to put in front of a child
      // (G-OBJ-1; audit #6, the "Read and write 5- and 6-digit numbers…" ledge chip).
      return plan("explain", SH.explain({ skillTitle: sk.title, prefix, interest: s.ctx.interests?.[1] ?? s.ctx.interests?.[0] }), { skillId: sk.id, format: kit.formats.primary });
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
  const skipped = new Set(s.skipped);
  const queued = s.nextItemId && !skipped.has(s.nextItemId) ? findItem(s, kit, s.nextItemId) : null;
  const verifying = s.verify && !skipped.has(`diag:${s.verify}`) ? findItem(s, kit, `diag:${s.verify}`) : null;
  const item = preferred ?? verifying ?? queued ?? selectNext(s, kit, { easier: s.easier });
  if (verifying && queued) s.queue = [queued.id, ...s.queue.filter((id) => id !== queued.id)];
  s.nextItemId = undefined; s.easier = false; s.verify = undefined;
  if (!item) return enterTeachback(s, prefix);
  // A skill nobody has explained yet gets one short explain turn first (novices; experienced attempt first).
  if (!s.introduced.includes(item.skillId)) {
    s.introduced.push(item.skillId); s.nextItemId = item.id;
    const sk = kit.skills.find((x) => x.id === item.skillId);
    return plan("explain", SH.explain({ skillTitle: sk?.title ?? "", prefix, interest: s.ctx.interests?.[1] ?? s.ctx.interests?.[0] }), { skillId: item.skillId, format: kit.formats.primary });
  }
  activate(s, item);
  const attemptFirst = !s.novice && s.practiced === 0;
  return plan(moveKindFor(item), SH.pose({ item, prefix, verify: !preferred && item === verifying }), {
    item, probe: probeFor(item), format: attemptFirst ? "F8" : undefined, chips: optionChips(item),
  });
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
  const engine = engineReteach(s, input, item, v);
  if (engine) return engine;
  if (v === "right") return afterCorrect(s, input, item);
  if (v === "wrong" || v === "stuck") return afterMiss(s, input, item);
  return unclear(s, input, item, v, () => afterMiss(s, input, item));
}

/** Correct answer, wrong reason — the correct-answer trap (rule 3): a misconception flag, not a success. */
function trap(s, kit, item, misconceptionId) {
  const m = kit.misconceptions.find((x) => x.id === misconceptionId);
  if (m) s.flagged[m.id] = (s.flagged[m.id] ?? 0) + 1;
  if (!m || s.retaught.includes(m.id)) return null;
  s.retaught.push(m.id); s.activeItemId = undefined;
  return plan("reteach", SH.reteach({ ...m.remediation, again: false }), { skillId: item.skillId, representation: m.remediation.representation });
}

function afterCorrect(s, input, item) {
  const { kit, cls } = input;
  const unaided = s.hintLevel === 0;
  s.itemsDone.push(item.id); s.practiced += 1;
  // A reason volunteered with the answer already is the "why" — asking again would be robotic.
  if (unaided && cls?.reason === "misconception") {
    const p = trap(s, kit, item, cls.reasonMisconceptionId);
    if (p) return p;
  }
  if (unaided && cls?.reason === "right") return poseNext(s, input, SH.CONFIRM.whyGood);
  const probePlan = unaided ? probePlanFor(s, item, kit, input.voice) : null;
  if (probePlan) {
    s.pendingWhy = item.id;
    s.pendingProbe = probePlan;
    if (probePlan.reason !== "fallback") s.probeSess = markAsked(s.probeSess, probePlan, s.comp?.[item.skillId]?.belief ?? null);
    // Only a belief this item can actually surface is offered as the wrong reason; an unrelated one
    // pulled the teacher into a different question (measured in evals/director-sim.mjs).
    const mis = (item.misconceptions ?? kit.misconceptions).find((m) => m.id === item.targetsMisconception);
    const shape = probePlan.shapeId ? shapeById(probePlan.shapeId) : null;
    return plan("probe", shape ? SH.probe({ shape, ageBand: s.ctx.ageBand, contrast: !!mis, skin: s.vibe?.probeSkin, protege: s.ctx.protege })
      : SH.why({ ageBand: s.ctx.ageBand, contrast: !!mis }), {
      item, probe: "P2",
      content: [`key idea (right reason): ${whyKey(kit, item.skillId) ?? item.answer}`, ...(mis ? [`wrong belief to listen for: ${mis.belief}`] : [])],
    });
  }
  return poseNext(s, input, SH.CONFIRM.correct);
}

function afterWhy(s, input, item) {
  const { kit, cls } = input;
  s.pendingWhy = undefined;
  if (cls?.outcome === "misconception") {
    const p = trap(s, kit, item, cls.misconceptionId);
    if (p) return p;
  }
  return poseNext(s, input, verdict(cls) === "right" ? SH.CONFIRM.whyGood : SH.CONFIRM.whyMissed);
}

function afterMiss(s, input, item) {
  const { kit, cls } = input;
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
  if (s.hintLevel >= 3) s.failsPostRung3 = { ...s.failsPostRung3, [item.skillId]: (s.failsPostRung3?.[item.skillId] ?? 0) + 1 };
  s.hintLevel = Math.min(4, s.hintLevel + 1);
  // Voice gentlerHint (CE8 / features.js: ≥ 3 hesitation cues on a wrong answer): the rung's CONTENT is one gentler
  // (pump instead of hint) — the hint count, the key gate and the C-outcome are unchanged. Never at the assertion.
  const gentle = !!input.voice?.gentlerHint && s.hintLevel >= 2 && s.hintLevel < 4;
  const shown = gentle ? s.hintLevel - 1 : s.hintLevel;
  return plan("hint", SH.hint({ level: shown, rungShape: item.hints[shown - 1], askedForAnswer: cls?.flags?.asksForAnswer }), { item });
}

const GENERIC_REP = { manipulative: "objects they can hold or imagine moving", diagram: "a simple drawing on the whiteboard",
  worked_steps: "a worked example, one step at a time", story: "a short everyday story", same_in_hindi: "the same idea in simple Hindi" };

/**
 * The comprehension engine's re-teach (INTEGRATION.md §2; COMPREHENSION-ENGINE.md §5): on a graded answer, the
 * belief's trigger (a confirmed misconception, delayed fail, two fails past rung 3, wheel-spin, U low after
 * practice) picks an arm with selectReteach, deterministic from the state. A cooldown of RETEACH_COOLDOWN graded
 * items on the skill follows every engine re-teach (the re-check), so a trigger that still holds cannot fire again
 * at once (rejected: reteach-without-cooldown, 21-32 re-teaches per child). Voice may only order a two-way pick.
 * The kit's own once-per-misconception re-teach (afterMiss / trap) is unchanged.
 */
function engineReteach(s, input, item, v) {
  if (!["right", "wrong", "stuck"].includes(v) || s.hintLevel >= 4) return null;
  const k = item.skillId;
  if ((s.reteachCool?.[k] ?? 0) > 0) { s.reteachCool = { ...s.reteachCool, [k]: s.reteachCool[k] - 1 }; return null; }
  const sk = s.comp?.[k];
  if (!sk?.belief) return null;
  const trig = reteachTrigger(sk.belief, { uProbes: skillSess(s.probeSess, k).uFamilies.length, wheelSpin: sk.wheelSpin, failsPostRung3: s.failsPostRung3?.[k] ?? 0 });
  if (!trig || (trig === "wheel_spin" && s.changedApproach.includes(k))) return null;
  const { kit } = input;
  const mis = sk.belief.misconception?.mId ? kit.misconceptions.find((m) => m.id === sk.belief.misconception.mId) : null;
  const kitArms = armsFromKit(mis);
  const d = reteachPlan({ trigger: trig, skillId: k, misId: mis?.id ?? null, kitArms, band: s.probeSess?.band, seed: String(s.seed), pL: sk.belief.pL,
    lessonArmsUsed: s.armsUsed ?? [], failedArmsThisSession: [], hindiObserved: s.ctx.lang !== "english", safetyFired: !!s.safeguard,
    voiceTie: !!(input.voice?.gentlerHint || input.voice?.slowerPace), now: new Date(input.now ?? 0).toISOString() });
  if (!d || d.move === "none") return null;
  s.reteachCool = { ...s.reteachCool, [k]: RETEACH_COOLDOWN };
  s.lastReteach = { ...d, turn: s.turn };
  if (d.armId) s.armsUsed = [...(s.armsUsed ?? []), d.armId];
  if (d.move === "park") {
    // Seam: the Conductor schedules a spaced re-teach (CONDUCTOR.md); the lesson moves on without a verdict.
    s.parked = [...(s.parked ?? []), k];
    s.skipped.push(item.id);
    return poseNext(s, input, "leave this one for another day; no verdict on it");
  }
  if (d.move === "prereq_descent") {
    s.changedApproach.push(k);
    s.hintLevel = Math.min(3, s.hintLevel + 1);
    const we = kit.workedExample;
    return plan("reteach", SH.changeApproach(), { item, skillId: k, content: we ? workedContent(we, 1, 1) : [] });
  }
  const arm = kitArms.find((a) => a.id === d.armId);
  const representation = arm?.representationId && arm.primary ? arm.representationId : GENERIC_REP[d.representation] ?? d.representation ?? "a different picture of the same idea";
  const moveShape = arm?.shape ?? (d.move === "recap" ? "recap the way that worked before, in short" : "show it, then let them try one step");
  if (v === "right") {
    s.itemsDone.push(item.id); s.practiced += 1; s.activeItemId = undefined;
    return plan("reteach", SH.reteach({ representation, moveShape, again: false }), { skillId: k, representation });
  }
  s.hintLevel = Math.min(3, s.hintLevel + 1);
  return plan("reteach", SH.reteach({ representation, moveShape, again: true }), { item, skillId: k, representation });
}

/** Unclear transcript or off-topic: re-ask (no evidence either way); after a few, `giveUp`. */
function unclear(s, input, item, v, giveUp) {
  if (v === "off") return plan("repair", SH.repairOffTopic(), { item });
  s.unclear += 1;
  if (s.unclear > LIMITS.unclearTries) { s.unclear = 0; return giveUp(); }
  const chips = optionChips(item);
  return plan("repair", SH.repairUnclear({ chips: !!chips }), { item, chips });
}

function enterTeachback(s, prefix) {
  s.phase = "teachback"; s.teachbackAsked = true; s.activeItemId = undefined; s.hintLevel = 0;
  // The lesson's teach-back IS shape C01 (announced protégé teach-back): its answer is a probe turn in the budget.
  s.pendingProbe = { skillId: s.introduced[0] ?? null, shapeId: "C01", facet: "U", mandatory: true, reason: "lesson_teachback", testWeight: testWeight(shapeById("C01")), family: "A", cls: "probe.teachback", longForm: true };
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
  const labels = chipLabels();
  // 1. Safety before anything else — the predicate or the classifier, either one.
  if (flags.distress) { s.safeguard = { calm: 0, asked: false }; return plan("safeguard", SH.safeguard(), { whiteboard: HELPLINES }); }
  if (s.safeguard) {
    if (flags.wantsToStop || chipId === "safe:stop") { s.safeguard = null; return toWrap(s, { stopping: true }); }
    if (s.safeguard.asked || chipId === "safe:continue") {
      s.safeguard = null;
      return item ? plan(moveKindFor(item), SH.pose({ item, prefix: "gently back to where you were" }), { item, probe: probeFor(item) }) : decide(s, { ...input, cls: null }, item);
    }
    s.safeguard.calm += 1;
    if (s.safeguard.calm < 2) return plan("safeguard", SH.safeguardStay(), { whiteboard: HELPLINES });
    s.safeguard.asked = true;
    return plan("repair", SH.resumeAfterSafeguard(), { chips: [{ id: "safe:continue", label: labels.cont }, { id: "safe:stop", label: labels.stop }] });
  }
  if (s.phase === "done") return toWrap(s, { stopping: true });
  // A wrong belief voiced outside a keyed item is a hypothesis: flag it, and verify it with its spoken
  // diagnostic next (fusion rule 2: a detector triggers a verifying probe, it never decides alone).
  if (cls?.voiced) {
    s.flagged[cls.voiced] = (s.flagged[cls.voiced] ?? 0) + 1;
    if (!s.itemsDone.includes(`diag:${cls.voiced}`)) s.verify = cls.voiced;
  }
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
 * A module-only turn with no answer on the active item: goal_met → celebrate, stuck → a nudge, both on the
 * step in progress (no teach step consumed, no unclear-reply count or hint rung spent). null = hold: nothing
 * to react to, or safeguarding / a finished lesson, where an activity is never celebrated.
 */
function moduleReaction(s, input, item) {
  if (s.safeguard || s.phase === "done") return null;
  const last = (input.moduleEvents ?? []).filter((e) => e?.type === "goal_met" || e?.type === "stuck").at(-1);
  if (!last) return null;
  const chips = optionChips(item);
  if (last.type === "stuck") return plan("hint", SH.moduleStuck(), { item, chips });
  // The goal name comes from the client: interpolated into instructions only as a short plain label.
  const goal = String(last.name ?? "").replace(/[^\p{L}\p{N} /.,-]/gu, "").trim().slice(0, 40);
  return plan("celebrate", SH.moduleGoal({ goal }), { item, chips });
}

/**
 * One director step.
 * @param {any} prev  lesson state (not mutated)
 * @param {{ event: "start"|"turn"|"module", kit: any, cls?: any, chipId?: string, answer?: string,
 *   moduleEvents?: import("../../shared/contracts").ModuleEvent[], now?: number }} input
 *   answer: the child's normalized words (affect counters tell a held belief from option cycling).
 *   "module": a module-only turn; `cls` is set only for a machine-truth module answer on the active item.
 * @returns the step; `hold: true` when a module-only turn changed nothing (the last move and UI stand).
 */
export function step(prev, input) {
  const s = structuredClone(prev);
  const now = input.now ?? Date.now();
  if (input.event !== "start") s.turn += 1; // every call bumps the turn: the route's optimistic state check keys on it
  s.minutes = Math.round((now - s.startedAt) / 6000) / 10;
  if (input.event === "turn") {
    s.affect = nextAffect(s.affect, { read: input.cls?.flags ?? {}, outcome: input.cls?.outcome, itemId: s.activeItemId, answer: input.answer });
  }
  if (input.comp) s.comp = input.comp;
  const active = findItem(s, input.kit, s.activeItemId);
  const reacting = input.event === "module" && !input.cls;
  const childTurn = input.event === "turn" || (input.event === "module" && !!input.cls);
  // The answer just given was graded against a kit item's key (not a covert why / teach-back, not past the
  // assertion): its verdict is noted on the move so the teacher's words cannot contradict it (G-PRAISE-1).
  const gradedItem = childTurn && !!active && s.pendingWhy !== active.id && s.hintLevel < 4 && !(s.phase === "teachback" && s.teachbackAsked);
  const asked = s.pendingProbe;
  if (childTurn && s.probeSess) {
    // Every child turn spends its test weight (budget.js): the answer to a probe at the probe's weight, a plain
    // item at 1 (0.25 once the window is near its cap: the covert C21 role-play form), teaching talk at 0.
    s.probeSess = asked
      ? recordTurn(s.probeSess, { kind: "probe", weight: asked.testWeight, shapeId: asked.shapeId ?? undefined, skillId: asked.skillId ?? undefined,
        facet: asked.facet, family: asked.family, cls: asked.cls, longForm: asked.longForm, mandatory: asked.mandatory })
      : active ? recordTurn(s.probeSess, { kind: "item", weight: fits(s.probeSess, 1) ? 1 : 0.25, skillId: active.skillId })
        : recordTurn(s.probeSess, { kind: "teach", weight: 0 });
    s.probeSess = { ...s.probeSess, engagement: frustrationLoop(s.affect) ? "strained" : "ok", safetyFired: !!(s.safeguard || input.cls?.flags?.distress) };
    s.pendingProbe = undefined;
  }
  if (input.event === "turn" && s.persona) {
    const v = verdict(input.cls);
    s.turnsSinceError = v === "wrong" ? 0 : (s.turnsSinceError ?? 99) + 1;
    // Vibe signals (persona/signals.js): what the child said and did, plus the voice PACE signals only (slowerPace,
    // onset z on a think question). Pace knobs, never a belief (CE8).
    s.persona = personaStep(s.persona, turnSignals({ text: input.text ?? input.answer ?? "", bargeIn: !!input.bargeIn,
      afterError: s.lastMove?.kind === "hint", retried: v !== "unclear", onsetZ: input.voiceZ?.onsetMs ?? null,
      slowerPace: !!input.voice?.slowerPace, thinkQuestion: !!s.pendingWhy }), { minute: s.minutes });
  }
  // A scheduler trigger to verify a misconception (noteOutcome) uses the kit's spoken diagnostic for it, through
  // the same verify path a voiced belief takes (poseNext / upcomingItem read s.verify).
  if (s.phase === "practice" && !s.verify && s.probeSess) {
    const t = s.probeSess.pending.find((x) => x.reason === "verify_misconception" && x.kitRefs?.[0]
      && !s.itemsDone.includes(`diag:${x.kitRefs[0]}`) && !s.skipped.includes(`diag:${x.kitRefs[0]}`) && findItem(s, input.kit, `diag:${x.kitRefs[0]}`));
    if (t) {
      s.verify = t.kitRefs[0];
      s.probeSess = markAsked(s.probeSess, { skillId: t.skillId, shapeId: null, facet: "M", mandatory: true, reason: t.reason }, s.comp?.[t.skillId]?.belief ?? null);
    }
  }
  const p = reacting ? moduleReaction(s, input, active) : decide(s, input, active);
  if (!p) {
    return { state: s, move: s.lastMove, moduleCommands: [], ui: s.lastUi ?? { status: "your_turn" }, end: s.phase === "done", hold: true, ...describe(s, input.kit) };
  }

  // The item as this child is asked it (findItem: the address register), whichever path chose it.
  const item = p.item ? (findItem(s, input.kit, p.item.id) ?? p.item) : null;
  // Notes on the real move only: a voice branch (branchesFor, input.branch) is rendered into the appended-last
  // section, whose budget the kit load gate measured without them (compile.js checkFits).
  const notes = input.branch ? [] : [gradedItem && !NO_VERDICT_MOVES.has(p.kind) ? SH.VERDICT_NOTE[verdictKey(input.cls)] : null, registerNote(s.ctx.address)];
  const move = { kind: p.kind, shape: join(p.shape, ...notes) };
  if (item) Object.assign(move, { itemId: item.id, skillId: item.skillId, hintLevel: s.hintLevel });
  if (p.skillId) move.skillId = p.skillId;
  if (p.probe) move.probe = p.probe;
  if (p.format) move.format = p.format;
  s.lastMove = move;
  s.moveVoiced = false;
  if (s.persona) {
    s.vibe = personaKnobs(s.persona, { reteach: move.kind === "reteach", strained: frustrationLoop(s.affect),
      transferProbe: s.pendingProbe?.facet === "T", turnsSinceError: s.turnsSinceError });
  }
  // A reaction keeps the step's content (e.g. the worked example the teacher is in the middle of) and the
  // activity on screen.
  if (!reacting || p.content) s.lastContent = p.content ?? [];
  const moduleCommands = reacting ? [] : planModule(s, { move, item, kit: input.kit, lang: s.ctx.lang, representation: p.representation });
  const ui = uiFor(s, p, move, item, input.kit);
  s.lastUi = ui; // what a hold re-sends (chips are momentary on the client: absent would clear them)
  return { state: s, move, moduleCommands, ui, end: s.phase === "done", ...describe(s, input.kit) };
}

/** Moves that carry no verdict note: care, goodbye and a break are never about the answer. */
const NO_VERDICT_MOVES = new Set(["safeguard", "wrap", "break"]);
/** classification → VERDICT_NOTE key (null: correct, which the confirm shapes already state). */
const verdictKey = (cls) => (cls?.outcome === "correct" ? null : cls?.outcome === "partial" ? "partial"
  : cls?.outcome === "incorrect" || cls?.outcome === "misconception" ? "not_yet" : "unverified");

const normText = (t) => String(t ?? "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
/** G-OBJ-1: a syllabus objective (a kit skill title or the topic's outcomes) is never put on screen for a child. */
export function isObjective(text, kit, topic) {
  const t = normText(text);
  if (!t) return false;
  return (kit?.skills ?? []).some((sk) => normText(sk.title) === t) || (topic?.outcomes ?? []).some((o) => normText(o) === t);
}

/** Authored short titles for every curriculum topic title longer than 24 characters (short-titles.json). */
const SHORT_TITLES = JSON.parse(readFileSync(new URL("./short-titles.json", import.meta.url), "utf8"));
const JOINER = /^(and|or|yet|but|of|the|in|on|to|a|an|for|with|from|by|as|at|into|its|their|is|are|vs|aur|ya|ka|ki|ke|se|mein|par|ko|&|:|-|–|—)$/i;

/**
 * ≤ 24 characters and meaningful, never a CSS cut (V2 §4.10 shortTitle): the authored short title when the title
 * has one; else the title's lead clause (before ":", " — ", "(" or ",") when it fits; else whole words up to the
 * first preposition or joiner that fits. null when nothing meaningful fits (the screen shows no title, not a stub).
 */
export function shortTitleOf(title, max = 24) {
  const t = String(title ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const authored = SHORT_TITLES[t];
  if (typeof authored === "string" && authored.length <= max) return authored;
  const lead = t.split(/\s*(?::|\s[—–-]\s|—|\(|,)\s*/)[0].trim();
  if (lead.length <= max && lead.split(" ").length >= 2) return lead;
  const ws = lead.split(" ");
  // the longest prefix that fits and ends before a joiner word (so the phrase never dangles)
  for (let n = ws.length - 1; n >= 1; n--) {
    const cut = ws.slice(0, n);
    if (cut.join(" ").length > max) continue;
    if (JOINER.test(cut.at(-1))) continue;
    if (n < ws.length && !JOINER.test(ws[n])) continue;
    return cut.join(" ");
  }
  return lead.length <= max ? lead : null;
}

const NUMERIC_KEY = /^[-−]?[\d,]+(?:[./]\d+)?$/;
/**
 * The turn's UiDirectives (V2 §4.10), derived from the same move that wrote the shape, so screen and voice agree:
 * the board anchor and chips as before, plus who holds the floor next (handover), the pinned question (ask, for a
 * kit item; a text-lane turn with no item gets it from the words actually said, routes/lesson.js), how the child
 * is expected to answer, what the tray holds, the phase and a ≤ 24-character title.
 */
function uiFor(s, p, move, item, kit) {
  const ui = { status: "your_turn" };
  const topic = getTopic(s.topicId);
  const board = p.whiteboard ?? (item ? anchorOf(item, s.ctx.lang) : null);
  if (board && !isObjective(board.value, kit, topic)) ui.whiteboard = board;
  if (p.chips?.length) ui.chips = p.chips;
  ui.phase = move.kind === "wrap" || s.phase === "done" ? "wrap" : s.phase;
  ui.handover = move.kind === "wrap" ? "finish" : ui.chips ? "choice" : "answer";
  const asking = item && s.pendingWhy !== item.id && !["safeguard", "wrap", "break", "teachback"].includes(move.kind);
  if (asking) {
    const text = askText(promptFor(item, s.ctx.lang));
    if (!isObjective(text, kit, topic)) ui.ask = { text, itemId: item.id };
  }
  ui.answerForm = ui.chips ? "choice"
    : asking && s.module?.awaitingReveal && s.module.itemId === item.id ? "tap_in_tray"
      : asking && NUMERIC_KEY.test(String(item.answer).trim()) ? "number" : "words";
  ui.tray = s.module ? "module" : ui.chips ? "tiles" : "none";
  const short = shortTitleOf(s.ctx.topicTitle);
  if (short && !isObjective(short, kit, topic)) ui.shortTitle = short;
  return ui;
}

/**
 * What the compiler needs about the current move, derived from state alone (the realtime-token route
 * recompiles from a stored state, so this must not depend on anything step() saw transiently).
 */
export function describe(s, kit) {
  const item = s.lastMove?.itemId ? findItem(s, kit, s.lastMove.itemId) : null;
  return { item, content: s.lastContent ?? [] };
}

/**
 * The item the next posing move will put to the child (poseNext's order: a verifying diagnostic, the item
 * an explain turn queued, then the queue head), or null. An explain, worked-example or re-teach turn that
 * states THIS item's key spoils it: the child then repeats what they just heard (evals/director-sim.mjs).
 */
export function upcomingItem(s, kit) {
  const skipped = new Set(s.skipped);
  const verifying = s.verify && !skipped.has(`diag:${s.verify}`) ? findItem(s, kit, `diag:${s.verify}`) : null;
  const queued = s.nextItemId && !skipped.has(s.nextItemId) ? findItem(s, kit, s.nextItemId) : null;
  return verifying ?? queued ?? selectNext(s, kit);
}

/**
 * Fold evidence rows into the state's skill SNAPSHOT counters and outcome history, for the voice branches'
 * synthetic replies (pure). The knowledge estimate is the ledger's (server/learner/live.js) and is never
 * re-derived here: only the counters step() reads move (attempts, unaided correct, a generative pass).
 */
const GENERATIVE = new Set(["P1", "P2", "P3", "P4", "P13", "P14"]);
export function foldEvidence(s, evidence) {
  for (const ev of evidence) {
    const snap = s.skills[ev.skillId] ?? { pKnown: 0.1, status: "introduced", attempts: 0, correctUnaided: 0, generativePass: false };
    const unaided = ev.outcome === "correct" && ev.hintsUsed === 0;
    s.skills[ev.skillId] = { ...snap, status: snap.status === "unseen" || snap.status === "introduced" ? "practising" : snap.status, attempts: snap.attempts + 1,
      correctUnaided: snap.correctUnaided + (unaided ? 1 : 0), generativePass: snap.generativePass || (unaided && GENERATIVE.has(ev.probe)) };
    s.history[ev.skillId] = [...(s.history[ev.skillId] ?? []), ev.outcome].slice(-10);
  }
}

const NO_FLAGS = { dontKnow: false, asksForAnswer: false, minimal: false, offTopic: false, distress: false, distressKind: null, wantsToStop: false };
const POSING = new Set(["practice", "probe", "retrieval", "greet"]);
/** Gap the branches assume before the child's reply (it only moves the lesson clock). */
const REPLY_MS = 20_000;

/**
 * The voice lane's branches for the reply now being answered: step() on a synthetic RIGHT and a synthetic
 * WRONG reply to the current state, after the same evidence fold the route does — so why-sampling, the
 * verify queue, teach-back entry, re-teach and the warm-up try limit are the director's own decisions.
 * Measured before this (200 seeds, consolidating skill): a hand-written "if right" branch said "then this
 * next question" while step() asked why in 77/200.
 * @returns {{ cond: string|null, right: Branch, wrong: Branch|null, listenFor?: string[] } | null}
 *   with Branch = { kind: string, text: string, ask: string|null, content: string[] }; `wrong` is null when
 *   any reply leads to the same move.
 */
export function branchesFor(s, kit) {
  if (!s.lastMove || s.phase === "done" || s.lastMove.kind === "safeguard" || s.safeguard) return null;
  const now = s.startedAt + Math.round(s.minutes * 60_000) + REPLY_MS;
  const lang = s.ctx.lang;
  const item = findItem(s, kit, s.activeItemId);
  const teachingBack = s.phase === "teachback" && s.teachbackAsked;
  const sim = (outcome) => {
    const pre = structuredClone(s);
    const right = outcome === "correct";
    const cls = { outcome, confidence: 1, source: "branch", flags: NO_FLAGS,
      ...(teachingBack ? { covered: right ? kit.expectations : [], missing: right ? [] : kit.expectations } : {}) };
    foldEvidence(pre, evidenceFrom(pre, cls, kit));
    return step(pre, { event: "turn", kit, cls, now, branch: true });
  };
  const render = (r) => {
    const asks = !!r.item && POSING.has(r.move.kind) && r.state.pendingWhy !== r.item.id;
    return {
      kind: r.move.kind.replace(/_/g, " "), text: r.move.shape,
      ask: asks ? promptFor(r.item, lang) : null,
      content: [...r.content, ...(asks && r.item.diagnostic ? [`choices for that question: ${optionsSpoken(r.item, lang)}`] : [])],
    };
  };
  const right = render(sim("correct"));
  const wrong = render(sim("incorrect"));
  const cond = teachingBack ? "their explanation covers most of the key ideas"
    : item && s.pendingWhy === item.id ? "their reason matches the key idea"
      : item ? "it matches the key" : null;
  const same = right.text === wrong.text && right.ask === wrong.ask;
  return { cond, right, wrong: same || !cond ? null : wrong, ...(teachingBack ? { listenFor: kit.expectations } : {}) };
}

/**
 * A question whose pinned text cannot be compiled (BudgetError) is skipped and the lesson moves on: the
 * item is marked skipped and the director steps once with no reply, which poses the next question.
 * @returns {ReturnType<typeof step> | null} null when the current move does not hang on that item
 */
export function skipItem(prev, kit, itemId, now) {
  if (prev.lastMove?.itemId !== itemId) return null;
  const s = structuredClone(prev);
  if (!s.skipped.includes(itemId)) s.skipped.push(itemId);
  if (s.activeItemId === itemId) { s.activeItemId = undefined; s.pendingWhy = undefined; s.hintLevel = 0; }
  if (s.nextItemId === itemId) s.nextItemId = undefined;
  if (s.verify && `diag:${s.verify}` === itemId) s.verify = undefined;
  return step(s, { event: "skip", kit, now });
}

/**
 * Evidence rows for the child's reply, judged against the state BEFORE this step.
 * @param {any} s  lesson state before step()
 * @param {any} cls classification
 * @param {any} kit
 * @param {{ leaked?: boolean, discount?: number }} [o]  leaked: the teacher said the key aloud before rung 4;
 *   an item in `s.spoiled` counts as leaked too
 * @returns {import("../../shared/contracts").Evidence[]}
 */
export function evidenceFrom(s, cls, kit, { leaked = false, discount = 1 } = {}) {
  if (!cls || cls.outcome === "no_evidence" || s.safeguard) return [];
  const mis = cls.misconceptionId ? { misconceptionId: cls.misconceptionId } : {};
  if (s.phase === "teachback" && s.teachbackAsked) {
    // One explanation is ONE observation: the skills it speaks for share its likelihood weight, so a single
    // utterance cannot move every skill of the topic as if it were that many independent probes.
    const taught = kit.skills.filter((sk) => s.introduced.includes(sk.id));
    const skills = taught.length ? taught : kit.skills;
    const w = round2(PROBE_WEIGHT.P1 * (kit.verified ? 1 : 0.5) * discount / skills.length);
    return skills.map((sk) => ({ skillId: sk.id, probe: "P1", outcome: cls.outcome, ...mis, hintsUsed: 0, weight: w }));
  }
  const item = findItem(s, kit, s.activeItemId);
  if (!item || s.hintLevel >= 4) return [];
  const why = s.pendingWhy === item.id;
  const probe = why ? "P2" : probeFor(item);
  const kitFactor = (item.kitVerified ?? kit.verified) ? 1 : 0.5;
  let w = PROBE_WEIGHT[probe] * kitFactor * discount;
  // Young children often cannot verbalise what they do understand: a missed "why" is weak evidence.
  if (why && cls.outcome !== "correct" && cls.outcome !== "misconception") w *= 0.5;
  // A key heard before the child answered (this turn, or before the item was posed) makes the answer worth nothing.
  const hintsUsed = leaked || s.spoiled?.includes(item.id) ? 4 : s.hintLevel;
  const rows = [{ skillId: item.skillId, itemId: item.id, probe, outcome: cls.outcome, ...mis, hintsUsed, weight: round2(w) }];
  // A reason volunteered with an unaided correct answer is a why-probe (P2) the child ran on themself.
  if (probe !== "P2" && cls.outcome === "correct" && hintsUsed === 0 && cls.reason) {
    rows.push({
      skillId: item.skillId, itemId: item.id, probe: "P2", outcome: cls.reason === "right" ? "correct" : "misconception",
      ...(cls.reasonMisconceptionId ? { misconceptionId: cls.reasonMisconceptionId } : {}), hintsUsed: 0, weight: round2(PROBE_WEIGHT.P2 * kitFactor * discount),
    });
  }
  return rows;
}
