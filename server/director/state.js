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
import { stopKind } from "../relational/signals.js";
import * as SH from "./shapes.js";
import { readFileSync } from "fs";
import { buildPracticeQueue, findItem, isomorphicFor, probeFor, promptFor, optionsSpoken, selectNext, anchorOf, whyKey, PROBE_WEIGHT, revealsAnswer, choicesFor, stripRungLabel } from "./items.js";
import { registerNote } from "./register.js";
import { askText } from "./say.js";
import { getTopic } from "../content/curriculum.js";
import { planModule } from "./modules.js";
import { frustrationLoop, initialAffect, nextAffect, wheelSpinning } from "../learner/affect.js";
import {
  newProbeSession, openSession, recordTurn, nextProbe, markAsked, fits, bandOf, shapeById, testWeight,
  reteachTrigger, reteachPlan, armsFromKit, newPersonaState, personaStep, personaKnobs, turnSignals,
  reteachSessionInputs, noteReteach,
} from "../comprehension/index.js";
import { skillSess } from "../comprehension/budget.js";
import { equityProfile, lessonGuidance, teachPlanFor, fadeItem, fadedContent, workedLeadContent, fadeBoard, startedFirstStep, FADE_PREFIX, clip } from "./fading.js";
import { newTalk, noteChildTurn } from "./talk.js";
import { explicitPace } from "../persona/pace.js";
import { directorProposal } from "./proposal.js";
import { p5Flag } from "../conversation/flags.js";
import { parkEntry, pushLater, recentParked, dueParked, serveLater } from "../conversation/policy.js";

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
  // Unclear replies (no attempt, off-topic, a misheard transcript) on ONE item: the third puts the choices on screen
  // (or, with none to offer, moves on); past that the item is left with no verdict (no evidence) and the lesson moves
  // on. Measured on production before this: 12 repair/hint turns in a row on one diagnostic (comprehension G11).
  unclearTries: 3,
  // p5-interaction (owner-2 R5.loop, 17 in 90 turns): one question is pinned on the card for at most this many teacher
  // turns in a row; the next one resolves it (its answer with one line of why after real help, else left for later) and
  // moves on. With the cap on, the choices come on the SECOND unclear reply (unclearTriesCapped), so they still show.
  cardMax: 3,
  unclearTriesCapped: 2,
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

/**
 * Expertise reversal (rule 16) is now the guidance ladder (director/fading.js, W2-C #2): the entry level of the first
 * skill this child has not made solid, read from their outcomes first and the knowledge estimate second. The old
 * boolean (`!some(learned || pKnown >= 0.5)`) read a class-level prior as knowledge and sent a child with no right
 * answers attempt-first in lesson 2 (personalisation audit §2.4).
 */

/**
 * @param {{ topicId: string, kit: any, skills?: Record<string, any>, history?: Record<string, string[]>,
 *   warmupItems?: any[], activeMisconceptionIds?: string[], ctx: { firstName: string, teacherName: string,
 *   protege: { name: string, what: string }, ageBand: "6-9"|"10-15", lang: string, interests: string[],
 *   firstMeeting: boolean, hasCallback: boolean, topicTitle: string, nextTitle?: string }, seed: number, now?: number }} a
 */
export function initLessonState({ topicId, kit, skills = {}, history = {}, stuck = {}, warmupItems = [], activeMisconceptionIds = [], ctx, seed, now = Date.now(), openers = [], comp }) {
  const classLevel = ctx.classLevel ?? (ctx.ageBand === "6-9" ? 3 : 6);
  const band = bandOf(classLevel);
  const snaps = Object.fromEntries(Object.entries(skills).map(([id, st]) => [id, snapshotSkill(st)]));
  // W2-C #3 (steal 4): a low-baseline child gets the worked example first and one next step, never a menu.
  const equity = equityProfile({ kit, skills: snaps, history, reteach: ctx.reteach, stuck });
  // W2-C #2: the guidance ladder (worked · faded · attempt, or a first-step probe when the record cannot tell).
  const guide = lessonGuidance({ kit, skills: snaps, history, lowBaseline: equity === "low", stuck });
  const fade = fadeItem(kit, { band });
  // W2-C #7: the practice purpose (a review set, ctx.practice from server/lesson/purpose.js) and the Ask purpose
  // (ctx.purpose "doubt"): no greeting and no hook.
  const practiceIds = (ctx.practice?.itemIds ?? []).filter((id) => kit.items.some((i) => i.id === id && i.kind !== "teachback"));
  const practiceSet = practiceIds.length ? practiceIds : null;
  const asking = ctx.purpose === "doubt";
  let teachPlan = teachPlanFor(guide.level).filter((x) => x !== "fade" || !!fade);
  // A faded entry whose kit has no recoverable blank keeps a worked example (never an explain with nothing to try).
  if (guide.level === "faded" && !fade) teachPlan = ["hook", "explain", "worked_example"];
  if (asking) teachPlan = ["answer_question", ...teachPlan.filter((x) => x !== "hook")];
  const novice = guide.level !== "attempt";
  // The probe session (COMPREHENSION-ENGINE.md §3.4): test-load budget, spacing, novelty and the mandatory triggers;
  // openers (delayed checks due at session open) are its first pending triggers.
  const probeSess = openSession(newProbeSession({ sessionId: ctx.sessionId ?? String(seed >>> 0), band, lessonSeed: seed >>> 0,
    targets: kit.skills.map((sk) => sk.id), surface: { visual: true } }), openers);
  return {
    v: 1, phase: practiceSet ? "practice" : asking ? "teach" : "warmup", topicId, turn: 0, minutes: 0, startedAt: now, seed: seed >>> 0, ctx,
    hintLevel: 0, itemsDone: [], skipped: [], activeItemId: undefined, pendingWhy: undefined, lastMove: undefined, lastContent: [],
    warmup: practiceSet || asking ? [] : warmupItems.slice(0, LIMITS.warmupMax), warmupIdx: 0,
    novice, teachPlan: practiceSet ? [] : teachPlan, teachIdx: 0, workedPart: 0,
    // The guidance ladder's state (fading.js): the entry level and why, the planned faded step (an item, resolved by
    // items.js findItem as `fade:<i>`), and the first-step probe's outcome once asked.
    guidance: { level: guide.level, reason: guide.reason, skillId: guide.skillId }, equity, fadeItem: fade ?? undefined, firstStep: undefined,
    purpose: practiceSet ? "practice" : asking ? "doubt" : "lesson",
    practiceSet: practiceSet ? { ids: practiceSet, of: Math.min(practiceSet.length, ctx.practice?.count ?? practiceSet.length), posed: [], firstTry: 0 } : undefined,
    talk: newTalk(),
    queue: practiceSet ?? buildPracticeQueue(kit, { activeMisconceptionIds }),
    // Experienced learners attempt before any explanation, so their skills count as introduced.
    // Attempt-first learners have the skills they have met introduced; a skill they have never met still gets one short
    // explain turn before its first item (poseNext). A practice set is retrieval: every skill counts as introduced.
    introduced: practiceSet ? kit.skills.map((sk) => sk.id) : novice ? [] : kit.skills.map((sk) => sk.id).filter((id) => snaps[id]),
    retaught: [], changedApproach: [], flagged: {}, misCorrect: {},
    nextItemId: undefined, verify: undefined, tries: 0, unclear: 0, practiced: 0, easier: false,
    skills: snaps, history,
    // Items this lesson that reached the assertion or were left after don't-knows, per skill (noteStuck): a routing
    // signal the NEXT lesson's guidance reads (lesson.js loadRecentStuck), never KT evidence.
    stuck: {}, stuckIds: [],
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
    // V1.4 moving on (evals/mastery-calibration): per skill this lesson, the unaided first-try run, answers, best run;
    // `fast` skills jump to their hardest item, `settled` skills are done for the lesson (shown they can do it),
    // `parkedSkills` stop before wheel-spinning (10 tries without 3 right) and go to the engine's re-teach next lesson.
    pace: { run: {}, tries: {}, best: {}, miss: {}, fast: [], settled: [], parkedSkills: [] },
    persona: newPersonaState({ band, classLevel, medium: ctx.schoolMedium ?? "english" }), vibe: null, turnsSinceError: 99,
    // p5-interaction: the Later list (CONVERSATION-V2 §5: parked questions, returned at a boundary) and the card pins
    later: [], pinItem: undefined, pinRun: 0,
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
/** The teacher's note for a hint rung: an item's server-side rung shapes (a diagnostic) else its kit hint. */
const rungShapeOf = (item, rung) => (item.rungShapes ?? item.hints ?? [])[rung - 1];
const moveKindFor = (item) => (item.kind === "practice" ? "practice" : item.kind === "retrieval" ? "retrieval" : "probe");

/** Chip labels are UI chrome: English in every lesson language (owner directive; PRODUCT-DESIGN-V2 §0.10, §5.3). */
function chipLabels() {
  return { easier: "An easier one", rest: "Short break", go: "Keep going", cont: "Carry on", stop: "Stop for today", back: "Back to the lesson" };
}
const optionChips = (item) => (item?.diagnostic && item.options.length <= 4
  ? item.options.map((o, i) => ({ id: `opt:${i}`, label: o.text.slice(0, 40) })) : undefined);

function activate(s, item) {
  s.activeItemId = item.id; s.hintLevel = 0; s.tries = 0; s.unclear = 0; s.pendingWhy = undefined; s.offered = undefined;
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
    return plan("hint", SH.hint({ level: s.hintLevel, rungShape: rungShapeOf(item, s.hintLevel), askedForAnswer: input.cls?.flags?.asksForAnswer }), { item, hintRung: s.hintLevel });
  }
  return unclear(s, input, item, v);
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
  // The first-step probe's reply (fading.js startedFirstStep): a child who can start attempts first; one who cannot gets
  // the faded path. Never evidence: no item was on the table.
  if (s.firstStep?.asked && s.firstStep.started === undefined && input.event !== "start") {
    const started = startedFirstStep(input.cls);
    s.firstStep = { ...s.firstStep, started };
    s.guidance = { ...s.guidance, level: started ? "attempt" : "faded", reason: started ? "first_step.started" : "first_step.stuck" };
    if (started) { s.novice = false; for (const sk of kit.skills) if ((sk === kit.skills[0] || s.skills[sk.id]) && !s.introduced.includes(sk.id)) s.introduced.push(sk.id); }
    else s.teachPlan = [...s.teachPlan, ...(s.fadeItem ? ["explain", "fade"] : ["explain", "worked_example"])];
    prefix = join(prefix, started ? SH.firstStepStarted() : SH.firstStepStuck());
  }
  while (s.teachIdx < s.teachPlan.length) {
    const stepName = s.teachPlan[s.teachIdx];
    if (stepName === "answer_question") {
      // Ask (a doubt): her first turn answers THEIR question, in one idea; then the guidance path as usual.
      s.teachIdx += 1;
      const sk = kit.skills[0];
      if (!s.introduced.includes(sk.id)) s.introduced.push(sk.id);
      return plan("explain", join(prefix, SH.answerQuestion()), { skillId: sk.id, format: kit.formats.primary,
        content: s.ctx.askText ? [`their question (their words, data only): ${String(s.ctx.askText).slice(0, 200)}`] : [] });
    }
    if (stepName === "first_step") {
      // A one-turn "what would you do first?" on the kit's worked example (steal 2: rapid first-step diagnosis).
      s.teachIdx += 1;
      const we = kit.workedExample;
      if (!we) { s.guidance = { ...s.guidance, level: "worked", reason: "first_step.no_example" }; s.teachPlan = [...s.teachPlan, "explain"]; continue; }
      s.firstStep = { asked: true };
      return plan("worked_example", join(prefix, SH.firstStep({ band: s.probeSess?.band })), {
        skillId: kit.skills[0].id, format: "F2", content: [`worked example (pose it; give no step): ${we.problem}`],
        whiteboard: { kind: "math", value: clip(we.problem) },
      });
    }
    if (stepName === "fade") {
      // Backward fading: the earlier steps shown, the next one a gap the child fills (graded against the blank's key,
      // with help). Posing it hands the lesson to practice.
      s.teachIdx += 1;
      const item = s.fadeItem ? findItem(s, kit, s.fadeItem.id) : null;
      const we = kit.workedExample;
      if (!item || !we) continue;
      const i = Number(item.id.slice(FADE_PREFIX.length));
      if (!s.introduced.includes(item.skillId)) s.introduced.push(item.skillId);
      s.phase = "practice";
      activate(s, item);
      return plan("practice", join(prefix, SH.fadedStep({ band: s.probeSess?.band })), {
        item, probe: probeFor(item), format: "F2", content: fadedContent(we, i), whiteboard: fadeBoard(we, i),
      });
    }
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
    // worked_example — spread over at most LIMITS.workedParts turns, one step handed to the child each time. With a
    // faded step planned next, ONE part: the first steps before the gap (the faded step is the second part), so the gap's
    // key is never said before it is posed.
    const we = kit.workedExample;
    if (!we) { s.teachIdx += 1; continue; }
    if (s.teachPlan[s.teachIdx + 1] === "fade" && s.fadeItem) {
      s.teachIdx += 1;
      const i = Number(s.fadeItem.id.slice(FADE_PREFIX.length));
      return plan("worked_example", join(prefix, SH.worked({ part: 1, parts: 2 })), {
        skillId: kit.skills[0].id, format: "F2", content: workedLeadContent(we, i), whiteboard: { kind: "math", value: clip(we.problem) },
      });
    }
    const parts = Math.min(LIMITS.workedParts, we.steps.length);
    s.workedPart += 1;
    if (s.workedPart >= parts) s.teachIdx += 1;
    return plan("worked_example", join(prefix, SH.worked({ part: s.workedPart, parts })), {
      skillId: kit.skills[0].id, format: "F2", content: workedContent(we, s.workedPart, parts), whiteboard: { kind: "math", value: clip(we.problem) },
    });
  }
  s.phase = "practice";
  return poseNext(s, input, prefix);
}

/**
 * Note an item the child got stuck on (W2-C review: the all-"don't know" child left no outcome rows, so day 2 read them
 * as brand new): the assertion (rung 4) reached, or the item left after don't-knows. Once per item. Monitor-only: read
 * by the next lesson's guidance ladder and equity profile (fading.js), never by KT, beliefs or the parent report.
 */
function noteStuck(s, item) {
  if (!item?.skillId || !s.stuck) return;
  if (s.stuckIds.includes(item.id)) return;
  s.stuckIds = [...s.stuckIds, item.id].slice(-20);
  s.stuck = { ...s.stuck, [item.skillId]: (s.stuck[item.skillId] ?? 0) + 1 };
}

function leavePractice(s, kit) {
  // A practice set (W2-C #7) ends when its items have all been posed (or nothing is left to pose).
  if (s.practiceSet) return s.practiceSet.posed.length >= s.practiceSet.of;
  const allUnaided = kit.skills.every((sk) => (s.skills[sk.id]?.correctUnaided ?? 0) >= 1);
  // V1.4: every skill shown (settled) or parked → practice is done, however few items that took (a strong child moves on)
  const P = s.pace;
  const allSettled = !!P && kit.skills.every((sk) => P.settled.includes(sk.id) || P.parkedSkills.includes(sk.id));
  return s.practiced >= LIMITS.practiceMax || (s.practiced >= LIMITS.practiceMin && allUnaided) || (s.practiced >= 2 && allSettled) || s.minutes >= LIMITS.minutes[s.ctx.ageBand];
}

function poseNext(s, input, prefix, preferred) {
  const { kit } = input;
  // CONVERSATION-V2 §5: a question parked "after this question" comes back now that the item on the table resolved
  if (p5Flag("STEER") && s.later?.length && s.activeItemId) {
    const due = dueParked(s.later, "item_resolved");
    if (due) { s.later = serveLater(s.later, due.id, s.turn); prefix = join(prefix, SH.returnParked({ topic: due.topic })); }
  }
  s.activeItemId = undefined; s.hintLevel = 0; s.pendingWhy = undefined;
  if (leavePractice(s, kit)) return s.practiceSet ? practiceDone(s, prefix) : enterTeachback(s, prefix);
  const skipped = new Set(s.skipped);
  const queued = s.nextItemId && !skipped.has(s.nextItemId) ? findItem(s, kit, s.nextItemId) : null;
  const verifying = s.verify && !skipped.has(`diag:${s.verify}`) ? findItem(s, kit, `diag:${s.verify}`) : null;
  const item = preferred ?? verifying ?? queued ?? selectNext(s, kit, { easier: s.easier });
  if (verifying && queued) s.queue = [queued.id, ...s.queue.filter((id) => id !== queued.id)];
  s.nextItemId = undefined; s.easier = false; s.verify = undefined;
  if (!item) return s.practiceSet ? practiceDone(s, prefix) : enterTeachback(s, prefix);
  // A skill nobody has explained yet gets one short explain turn first (novices; experienced attempt first).
  if (!s.introduced.includes(item.skillId)) {
    s.introduced.push(item.skillId); s.nextItemId = item.id;
    const sk = kit.skills.find((x) => x.id === item.skillId);
    return plan("explain", SH.explain({ skillTitle: sk?.title ?? "", prefix, interest: s.ctx.interests?.[1] ?? s.ctx.interests?.[0] }), { skillId: item.skillId, format: kit.formats.primary });
  }
  activate(s, item);
  const attemptFirst = !s.novice && s.practiced === 0;
  if (s.practiceSet && !s.practiceSet.posed.includes(item.id) && s.practiceSet.posed.length < s.practiceSet.of) {
    s.practiceSet = { ...s.practiceSet, posed: [...s.practiceSet.posed, item.id] };
    // the first item of a practice set opens the lesson: no greeting, no hook (W2-C #7)
    if (input.event === "start") prefix = join(prefix, SH.practiceOpen({ of: s.practiceSet.of }));
  }
  return plan(moveKindFor(item), SH.pose({ item, prefix, verify: !preferred && item === verifying }), {
    item, probe: probeFor(item), format: attemptFirst ? "F8" : undefined, chips: optionChips(item),
  });
}

function practice(s, input, item) {
  const { kit, cls } = input;
  if (!item) return poseNext(s, input);
  // After an assertion nothing they say about THIS item is evidence; an isomorphic item proves it (rule 15). Checked
  // before the after-break re-pose: an item whose answer she already gave is never posed again "fresh" (review
  // 2026-10-05: rung 4 → break → the same faded step posed again).
  if (s.hintLevel >= 4) {
    s.itemsDone.push(item.id);
    return poseNext(s, input, "now a similar one for them", isomorphicFor(s, kit, item));
  }
  // after a break (or a stop check-in) the question comes back fresh — unless the child simply answered it, which is graded
  // (owner-truth patch 07)
  if (s.lastMove?.kind === "break" && !["right", "wrong"].includes(verdict(cls))) return plan(moveKindFor(item), SH.pose({ item, prefix: "back to the question, fresh" }), { item, probe: probeFor(item), chips: optionChips(item) });
  if (s.pendingWhy === item.id) return afterWhy(s, input, item);
  const v = verdict(cls);
  const engine = engineReteach(s, input, item, v);
  if (engine) return engine;
  if (v === "right") return afterCorrect(s, input, item);
  if (v === "wrong" || v === "stuck") return afterMiss(s, input, item);
  return unclear(s, input, item, v);
}

/** Correct answer, wrong reason — the correct-answer trap (rule 3): a misconception flag, not a success. */
function trap(s, kit, item, misconceptionId) {
  const m = kit.misconceptions.find((x) => x.id === misconceptionId);
  if (m) s.flagged[m.id] = (s.flagged[m.id] ?? 0) + 1;
  if (!m || s.retaught.includes(m.id)) return null;
  s.retaught.push(m.id); s.activeItemId = undefined;
  return plan("reteach", SH.reteach({ ...m.remediation, again: false }), { skillId: item.skillId, representation: m.remediation.representation });
}

/** V1.4 pace bookkeeping for one graded answer on a practice item (never a warm-up check, a faded step or a diagnostic). */
export const PACE = Object.freeze({ fastP: 0.85, settleP: 0.9, settleRun: 2, parkTries: 7 });
function notePace(s, item, right) {
  if (!item?.skillId || item.fade || s.phase !== "practice" || String(item.id).startsWith("diag:")) return;
  const P = (s.pace ??= { run: {}, tries: {}, best: {}, miss: {}, fast: [], settled: [], parkedSkills: [] });
  const k = item.skillId, firstTry = s.hintLevel === 0;
  P.tries[k] = (P.tries[k] ?? 0) + 1;
  P.run[k] = right && firstTry ? (P.run[k] ?? 0) + 1 : right ? P.run[k] ?? 0 : 0;
  P.best[k] = Math.max(P.best[k] ?? 0, P.run[k]);
  P.miss[k] = right ? 0 : (P.miss[k] ?? 0) + 1;
  const pK = s.skills[k]?.pKnown ?? 0;
  if (right && firstTry && pK >= PACE.fastP && !P.fast.includes(k)) P.fast = [...P.fast, k];
  if (P.run[k] >= PACE.settleRun && pK >= PACE.settleP && !P.settled.includes(k)) P.settled = [...P.settled, k];
  if (!right && P.miss[k] >= 2) s.easier = true;                         // two misses in a row: the gentlest item next
  if (P.tries[k] >= PACE.parkTries && P.best[k] < 3 && !P.parkedSkills.includes(k)) P.parkedSkills = [...P.parkedSkills, k];
}

function afterCorrect(s, input, item) {
  const { kit, cls } = input;
  notePace(s, item, true);
  const unaided = s.hintLevel === 0;
  s.itemsDone.push(item.id); s.practiced += 1;
  if (s.practiceSet && unaided && s.practiceSet.posed.includes(item.id)) s.practiceSet = { ...s.practiceSet, firstTry: s.practiceSet.firstTry + 1 };
  // A faded step was completed WITH the worked steps in view: no why on it; practice proper starts.
  if (item.fade) return poseNext(s, input, SH.CONFIRM.correct);
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
  notePace(s, item, false);
  // a parked skill (V1.4: wheel-spinning ahead) stops here: the item is left, the engine's re-teach takes it next lesson
  if (s.pace?.parkedSkills?.includes(item.skillId) && !item.fade && s.hintLevel < 4) { s.skipped.push(item.id); return poseNext(s, input, "let's leave this one for now and come back to it with a different way next time"); }
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
  // p5-interaction (conversation-v2 battery dont_know 1/6 "helps"): a child who says they do not know gets a real hint, never
  // a pump (rung 1 asks them to think again about what they just said they cannot think about)
  const idk = p5Flag("STEER") && !!cls?.flags?.dontKnow && cls?.source !== "help" && s.hintLevel === 0;   // a Hint chip is one rung
  s.hintLevel = Math.min(4, s.hintLevel + (idk ? 2 : 1));
  if (s.hintLevel >= 4) noteStuck(s, item);
  // Voice gentlerHint (CE8 / features.js: ≥ 3 hesitation cues on a wrong answer): the rung's CONTENT is one gentler
  // (pump instead of hint) — the hint count, the key gate and the C-outcome are unchanged. Never at the assertion.
  const gentle = !!input.voice?.gentlerHint && s.hintLevel >= 2 && s.hintLevel < 4;
  const shown = gentle ? s.hintLevel - 1 : s.hintLevel;
  return plan("hint", SH.hint({ level: shown, rungShape: rungShapeOf(item, shown), askedForAnswer: cls?.flags?.asksForAnswer }), { item, hintRung: shown });
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
  // P21 wheel spinning on this child's record (no 3-in-a-row in ~10 tries, outcomes carried across lessons) is a
  // re-teach trigger HERE, so it is chosen from the child's history (selectReteach: the arm that repaired them first)
  // instead of the generic "change approach" in afterMiss (review 2026-10-05: on day 2 that generic path pre-empted
  // the arm that had repaired the child on day 1). afterMiss keeps it as the fallback when there is no belief.
  // (skillsMapFor always sets wheelSpin: "none" or "warn" when the ledger view has not confirmed a spin; the record's
  // outcomes confirming it here is the same P21 rule afterMiss applies, so it confirms the trigger)
  const historySpin = v !== "right" && wheelSpinning(s.history[k]) && !s.changedApproach.includes(k);
  const spinning = sk.wheelSpin === "confirm" || historySpin ? "confirm" : sk.wheelSpin;
  const trig = reteachTrigger(sk.belief, { uProbes: skillSess(s.probeSess, k).uFamilies.length, wheelSpin: spinning, failsPostRung3: s.failsPostRung3?.[k] ?? 0 });
  if (!trig || (trig === "wheel_spin" && s.changedApproach.includes(k))) return null;
  const { kit } = input;
  const mis = sk.belief.misconception?.mId ? kit.misconceptions.find((m) => m.id === sk.belief.misconception.mId) : null;
  const kitArms = armsFromKit(mis);
  // ctx.reteach: the child's record (attempts, rep fluency, arm posteriors), pinned at start by the
  // comprehension/session.js seam (W1-C); absent → selectReteach's empty defaults, as before.
  const rec = s.ctx.reteach ?? {};
  // W1-C: this lesson's failed arms on k (the trigger still holds after the last arm's re-check) and k's prerequisites,
  // so prerequisite descent (2 failed arms) and park (3) can fire (comprehension/reteach.js reteachSessionInputs).
  const sess = reteachSessionInputs(s, k, kit);
  const d = reteachPlan({ trigger: trig, skillId: k, misId: mis?.id ?? null, kitArms, band: s.probeSess?.band, seed: String(s.seed), pL: sk.belief.pL,
    attempts: rec.attempts, repFluency: rec.repFluency, posteriors: rec.posteriors, prereqs: sess.prereqs,
    lessonArmsUsed: s.armsUsed ?? [], failedArmsThisSession: sess.failedArmsThisSession, hindiObserved: s.ctx.lang !== "english", safetyFired: !!s.safeguard,
    voiceTie: !!(input.voice?.gentlerHint || input.voice?.slowerPace), now: new Date(input.now ?? 0).toISOString() });
  noteReteach(s, k, d, sess);
  if (!d || d.move === "none") return null;
  // the wheel-spin change of approach happens once per skill per lesson, whichever path takes it
  if (trig === "wheel_spin" && !s.changedApproach.includes(k)) s.changedApproach.push(k);
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

/**
 * "Show me choices" tiles for the item on the table: a diagnostic's own options (opt:i, graded by the option's tag),
 * else the key and two distractors (items.js choicesFor; pick:i, graded in code against the key). The generated
 * labels are kept in the state so the tap is graded against exactly what was shown. undefined: nothing to offer.
 */
function offerChoices(s, kit, item) {
  const own = optionChips(item);
  if (own) return own;
  const labels = choicesFor(item, kit, s.seed);
  if (!labels) return undefined;
  s.offered = { itemId: item.id, options: labels };
  return labels.map((label, i) => ({ id: `pick:${i}`, label: label.slice(0, 40) }));
}

/** Leave the item with no verdict (no evidence) and pose the next one: the unclear cap, or "Skip for now". */
function leaveItem(s, input, item, prefix) {
  if (s.hintLevel >= 2 || (s.affect?.dontKnowStreak ?? 0) > 0) noteStuck(s, item);
  if (!s.skipped.includes(item.id)) s.skipped.push(item.id);
  s.unclear = 0;
  if (s.phase === "warmup") return nextWarmup(s, input, prefix);
  return poseNext(s, input, prefix);
}

/**
 * An unclear reply: a misheard transcript, no attempt, or off-topic. No evidence either way. Spoken: re-ask (repair).
 * Typed: never "say it again" — they typed it — a small nudge on the same question (audit flows G4: typed "100", "1"
 * and "yes" all got "I didn't catch that clearly"). The third unclear reply on one item puts the choices on screen (or,
 * with none, leaves the item); past that the item is left with no verdict and the lesson moves on (comprehension G11).
 */
function unclear(s, input, item, v) {
  s.unclear += 1;
  const typed = !!input.typed;
  const shown = !!(s.lastUi?.chips?.length && s.lastMove?.itemId === item.id);
  const tries = p5Flag("CARDCAP") ? LIMITS.unclearTriesCapped : LIMITS.unclearTries;
  if (s.unclear >= tries) {
    const chips = s.unclear === tries && !shown ? offerChoices(s, input.kit, item) : undefined;
    if (!chips) return leaveItem(s, input, item, SH.MOVE_ON_UNCLEAR);
    return plan(typed ? "hint" : "repair", SH.offerChoices(), { item, chips });
  }
  const chips = optionChips(item);
  if (v === "off") return plan(typed ? "hint" : "repair", SH.repairOffTopic(), { item, chips });
  if (typed) return plan("hint", SH.typedNoAnswer(), { item, chips });
  return plan("repair", SH.repairUnclear({ chips: !!chips }), { item, chips });
}

/**
 * The child's help request (classify.js HELP_REQUESTS; a client action from the Hint sheet or the Young Help menu,
 * never their words and never evidence). With a question on the table it acts on THAT question: a hint rung, its
 * choices on screen, skip it (no verdict), show it another way, slower, or "I know this" (let them show it). With no
 * question on the table (a hook, an explanation), it re-says the teaching more simply, or skips ahead to a question.
 */
function helpMove(s, input, item, help) {
  const kit = input.kit;
  if (s.phase === "teachback") {
    if (help === "skip") return toWrap(s, {});
    return plan("teachback", join(SH.SLOWER, SH.teachback({ protege: s.ctx.protege })), { probe: "P1", format: "F7" });
  }
  if (!item) {
    if (help === "skip" || help === "know") {
      if (s.phase === "teach") { s.teachIdx = s.teachPlan.length; return teach(s, input, help === "know" ? SH.KNOWS_IT : "move on"); }
      if (s.phase === "warmup") { s.phase = "teach"; return teach(s, input); }
      return poseNext(s, input);
    }
    // p5-interaction (owner-4: "story ki tarah batao", "example do", "slowly please" said during a worked example got the
    // NEXT teach step with the request as a prefix, 5/16 not acted on): a request for the idea another way is answered on
    // THE idea being taught, and the teach step does not advance. Help menu chips (cls.help) keep moving on (below).
    // (also in practice before its first item: an explain turn poseNext gave a skill nobody had explained yet)
    if (p5Flag("STEER") && !input.cls?.help && ["another", "example", "story", "slower"].includes(help)
      && (s.phase === "teach" || (s.phase === "practice" && TEACH_KINDS.has(s.lastMove?.kind)))) return teachAgainPlan(s, kit, help);
    // Any other help on a teaching turn moves the teaching on, more simply: a Young child in the text lane can answer a
    // teaching turn only through the Help menu, and a help that re-said the same step would hold them there for good.
    const prefix = help === "slower" ? SH.SLOWER : help === "story" ? SH.STORY_ASKED : help === "example" ? SH.EXAMPLE_ASKED
      : help === "another" ? SH.ANOTHER_ASKED : "they asked for help: simpler words, one concrete example";
    if (s.phase === "warmup") { s.phase = "teach"; return teach(s, input, prefix); }
    if (s.phase === "teach") return teach(s, input, prefix);
    return poseNext(s, input, prefix);
  }
  // A help request on a "why?" (the reason is the child's to give): they cannot give it now. No evidence; she gives the
  // reason in one line and the lesson moves on (a Young text-lane child can answer a why only through the Help menu,
  // and re-teaching the answered item there looped: 6 re-teach turns in a row, measured on the W1-A Young battery).
  if (s.pendingWhy === item.id) return afterWhy(s, { ...input, cls: { outcome: "no_evidence", confidence: 1, source: "help", flags: {} } }, item);
  const pose = (prefix, extra = {}) => plan(moveKindFor(item), SH.pose({ item, prefix }), { item, probe: probeFor(item), chips: optionChips(item), ...extra });
  switch (help) {
    case "skip": return leaveItem(s, input, item, SH.SKIP_ITEM);
    case "know": return pose(SH.KNOWS_IT);
    case "slower": return p5Flag("STEER") ? plan(moveKindFor(item), SH.slowerPose(), { item, probe: probeFor(item), chips: optionChips(item) }) : pose(SH.SLOWER);
    case "choices": {
      const chips = offerChoices(s, kit, item);
      if (chips) return plan(moveKindFor(item), SH.showChoices(), { item, probe: probeFor(item), chips });
      return decideAs(s, input, item, "stuck"); // nothing to offer: a hint rung instead
    }
    case "why": case "another": case "how": case "example": case "story": {
      s.hintLevel = Math.min(3, s.hintLevel + 1); // help spends a rung (the answer then counts "with help"), never the assertion
      const we = help === "how" ? kit.workedExample : null;
      return plan("reteach", (p5Flag("STEER") ? SH.helpExplainP5 : SH.helpExplain)({ how: help === "how", example: help === "example", story: help === "story" }), { item, content: we ? workedContent(we, 1, 1) : [] });
    }
    default: return decideAs(s, input, item, "stuck"); // "hint"
  }
}

/**
 * Back to where the lesson was, after a check-in, a break or a side chat: the question on the table again, else the next
 * teaching step or question. Never evidence, never a hint rung. (owner-truth patch 07)
 */
function resume(s, input, item, prefix) {
  if (item) return plan(moveKindFor(item), SH.pose({ item, prefix }), { item, probe: probeFor(item), chips: optionChips(item) });
  if (s.phase === "warmup") { s.phase = "teach"; return teach(s, input, prefix); }
  if (s.phase === "teach") return teach(s, input, prefix);
  if (s.phase === "practice") return poseNext(s, input, prefix);
  if (s.phase === "teachback") return plan("teachback", join(prefix, SH.teachback({ protege: s.ctx.protege })), { probe: "P1", format: "F7" });
  return toWrap(s, {});
}

/** The skill the lesson is on now (for a teaching move with no item on the table). */
const currentSkillId = (s, kit, item) => item?.skillId ?? s.lastMove?.skillId ?? s.introduced?.at(-1) ?? kit.skills[0]?.id;

/**
 * The child's request in words → this turn's move (OWNER TEST items 4-5; director/requests.js). null = no move of its own
 * (the phase decides). Stop and goodbye never reach here: W2-I's stop gate in decide() owns them.
 */
function requestMove(s, input, item, req, labels) {
  const kit = input.kit;
  switch (req.type) {
    case "break": return plan("break", p5Flag("STEER") ? SH.breakYes() : SH.stretch(), { request: "break" });
    case "change_topic":
      // owner rule (2026-10-05; w2i-release, OWNER-RESET #7): "can we talk about something else" is STEERING, never a break
      // or a wrap: a warm yes and a different way into today's idea (CONVERSATION-V2 §3.2 offer_choice)
      if (p5Flag("STEER")) return plan("repair", SH.offerWays(), { chips: waysChips(labels), request: "change_topic" });
      s.sidebar = { asked: s.turn };
      return plan("break", SH.changeTopic(), { chips: [{ id: "stop:continue", label: labels.back }, { id: "break:rest", label: labels.rest }, { id: "stop:end", label: labels.stop }], request: "change_topic" });
    case "topic": {
      const subject = String(req.subject ?? "").replace(/[^\p{L}\p{N} ]/gu, "").trim().slice(0, 30);
      if (!subject) return null;
      if (item) return plan(moveKindFor(item), SH.pose({ item, prefix: SH.topicAsked({ subject }) }), { item, probe: probeFor(item), chips: optionChips(item), request: "topic" });
      return plan("reteach", SH.topicAsked({ subject, teaching: true }), { skillId: currentSkillId(s, kit, item), request: "topic" });
    }
    case "language": {
      // the lesson's language from now on (compile.js reads ctx.lang every turn; langPinned keeps it when they reply in another)
      s.ctx = { ...s.ctx, lang: req.lang, langPinned: true };
      if (item) return plan(moveKindFor(item), p5Flag("STEER") ? SH.languageAskedP5({ lang: req.lang }) : SH.pose({ item, prefix: SH.languageAsked({ lang: req.lang }) }), { item, probe: probeFor(item), chips: optionChips(item), request: "language" });
      return plan("reteach", SH.languageAsked({ lang: req.lang, teaching: true }), { skillId: currentSkillId(s, kit, item), request: "language" });
    }
    case "another": case "example": case "story": case "slower": {
      const p = helpMove(s, input, item, req.type);
      return p && { ...p, request: req.type };
    }
    case "visual": {
      // A picture on the stage (item 5): a re-teach move with the diagram representation, so planModule mounts the item's
      // engine as a show or the explainer@1 board (SHOW_MOVES), and the brain asks Studio for the whiteboard on any lane
      // (brain/propose.js whiteboardAskOf `requested`). A picture of the question on the table is help: it spends a rung.
      if (item && s.pendingWhy !== item.id) s.hintLevel = Math.min(3, s.hintLevel + 1);
      return plan("reteach", SH.showVisual({ kind: req.kind }), { ...(item ? { item } : { skillId: currentSkillId(s, kit, item) }), representation: "diagram", visual: req.kind ?? "diagram", request: "visual" });
    }
    default: return p5Flag("STEER") ? p5RequestMove(s, input, item, req, labels) : null;
  }
}

const TEACH_KINDS = new Set(["hook", "explain", "worked_example", "reteach"]);
/** The ways-in chips (UI chrome, English): a picture, a story, a game, or back to the lesson. */
const waysChips = (labels) => [{ id: "req:visual", label: "Show me a picture" }, { id: "req:story", label: "Tell it as a story" },
  { id: "req:game", label: "Play a game" }, { id: "stop:continue", label: labels.back }];
/** The request types p5-interaction adds (conversation/lexicon.js readings and the UNDERSTAND note, via policy.js). */
export const P5_REQUESTS = new Set(["clarify", "repeat", "back", "skip", "know", "harder", "easier", "boredom", "frustration", "thinking", "identity",
  "uptake", "decline", "answer_q", "adapt", "adopt", "adult", "park", "detour", "stop"]);

/** A teach-phase re-explanation of the idea being taught now (the teach step does not advance). */
function teachAgainPlan(s, kit, how) {
  const skillId = currentSkillId(s, kit, null);
  const content = (s.lastContent ?? []).filter((l) => typeof l === "string").length ? s.lastContent
    : [`the idea being taught: ${kit.skills.find((k) => k.id === skillId)?.title ?? kit.skills[0]?.title ?? ""}`];
  return plan("reteach", SH.teachAgain({ how }), { skillId, content, request: how });
}

/** The hardest not-yet-done practice item of a skill (difficulty, then the queue's order), or null. */
function hardestFor(s, kit, skillId) {
  const done = new Set([...s.itemsDone, ...s.skipped, s.activeItemId]);
  const KINDS = new Set(["practice", "near_transfer", "far_transfer", "contrast", "predict", "translate_rep"]);
  return kit.items.filter((i) => i.skillId === skillId && !done.has(i.id) && KINDS.has(i.kind))
    .sort((a, b) => (b.difficulty ?? 0) - (a.difficulty ?? 0))[0] ?? null;
}

/**
 * p5-interaction: the child's words acted on (CONVERSATION-V2 §3.2), for the request types director/requests.js does not
 * read. Every move is session state only and never evidence; none ends a lesson (a stop read by a model alone gets ONE
 * check-in, like a stop phrase). `lead` rides on the plan so the card cap (capPlan) keeps the uptake when it resolves.
 */
function p5RequestMove(s, input, item, req, labels) {
  const kit = input.kit;
  // with a question on the table the request is the FIRST part of a two-part shape (leadThenPose); with none, the teaching
  // goes on with it as the prefix
  const withLead = (lead) => {
    if (item) return plan(moveKindFor(item), SH.leadThenPose({ item, lead }), { item, probe: probeFor(item), chips: optionChips(item), lead, request: req.type });
    const p = resume(s, input, item, lead);
    return p && { ...p, lead, request: req.type };
  };
  switch (req.type) {
    case "clarify":
      if (item) return plan("repair", SH.clarifyQuestion(), { item, chips: optionChips(item), request: "clarify", lead: "they asked what the question means" });
      return teachAgainPlan(s, kit, "another");
    case "repeat": {
      if (item) return plan(moveKindFor(item), SH.pose({ item, prefix: SH.repeatShort() }), { item, probe: probeFor(item), chips: optionChips(item), request: "repeat" });
      const kind = ["hook", "explain", "worked_example", "reteach"].includes(s.lastMove?.kind) ? s.lastMove.kind : "reteach";
      return plan(kind, join(SH.repeatShort(), s.lastMove?.shape), { skillId: currentSkillId(s, kit, item), content: s.lastContent ?? [], request: "repeat" });
    }
    case "back": return withLead(SH.welcomeBack());
    case "skip": return item ? { ...leaveItem(s, input, item, SH.SKIP_ITEM), request: "skip" } : helpMove(s, input, item, "skip");
    case "know": return { ...helpMove(s, input, item, "know"), request: "know" };
    case "harder": case "easier": {
      if (!item || s.phase !== "practice") return req.type === "harder" ? { ...helpMove(s, input, item, "know"), request: "harder" } : teachAgainPlan(s, kit, "another");
      s.skipped.push(item.id);                                   // left, no verdict: it was never their answer
      if (req.type === "easier") s.easier = true;
      else { const h = hardestFor(s, kit, item.skillId); if (h) s.nextItemId = h.id; }
      return { ...poseNext(s, input, req.type === "harder" ? SH.levelHarder() : SH.levelEasier()), request: req.type };
    }
    case "boredom": return plan("repair", SH.boredOffer(), { chips: waysChips(labels), request: "boredom" });
    case "frustration": {
      if (!item) return teachAgainPlan(s, kit, "another");
      const p = decideAs(s, input, item, "stuck");
      return { ...p, shape: join(SH.frustrationFirst(), p.shape), request: "frustration" };
    }
    // a mid-thought: no question pinned this turn (no re-ask), the item stays the active one
    case "thinking": return plan("repair", SH.waitThinking(), { request: "thinking" });
    case "identity": return withLead(SH.disclose());
    case "uptake": return withLead(SH.uptake({ kind: req.kind }));
    case "decline": return withLead(SH.declineOob());
    case "answer_q": return withLead(SH.answerTheirQuestion());
    case "adapt": case "adopt":
      if (req.method) s.prefs = [...new Set([...(s.prefs ?? []), String(req.method).slice(0, 40)])].slice(-4);
      return withLead(SH.adaptTo({ method: req.method }));
    case "adult": return withLead(SH.adultVoice());
    case "park": {
      const e = parkEntry({ topic: req.topic, learning: req.learning, turn: s.turn, itemOnTable: !!item });
      s.later = pushLater(s.later ?? [], e);
      return withLead(SH.parkIt({ topic: e.topic, promise: e.promise }));
    }
    case "detour": {
      const p = recentParked(s.later ?? [], s.turn, req.topic);
      if (!p) {
        const e = parkEntry({ topic: req.topic, learning: false, turn: s.turn, itemOnTable: !!item });
        s.later = pushLater(s.later ?? [], e);
        return withLead(SH.parkIt({ topic: e.topic, promise: e.promise }));
      }
      s.later = serveLater(s.later, p.id, s.turn);
      return withLead(SH.detourTo({ topic: p.topic }));
    }
    case "stop": {
      // a stop or a leaving read by the UNDERSTAND note alone: ONE check-in (OWNER-RESET #7); a second within two turns ends it
      if (s.stopAsked != null && s.turn - s.stopAsked <= 2) return toWrap(s, { stopping: true });
      s.stopAsked = s.turn;
      return plan("break", SH.stopCheck(), { chips: [{ id: "stop:continue", label: labels.go }, { id: "break:rest", label: labels.rest }, { id: "stop:end", label: labels.stop }], request: "stop" });
    }
    default: return null;
  }
}

/** Run the phase's own path as if the child had said they were stuck (a hint request): a rung, never evidence. */
function decideAs(s, input, item, _v) {
  const cls = { outcome: "no_evidence", confidence: 1, source: "help", flags: { dontKnow: true, asksForAnswer: false, minimal: false, offTopic: false, distress: false, distressKind: null, wantsToStop: false } };
  const next = { ...input, cls };
  return s.phase === "warmup" ? warmup(s, next, item) : practice(s, next, item);
}

/** The end of a practice set: no teach-back; the practice summary (code counts) and goodbye (W2-C #7, "That's the set"). */
function practiceDone(s, prefix) {
  const ps = s.practiceSet;
  s.phase = "done"; s.activeItemId = undefined; s.pendingWhy = undefined; s.hintLevel = 0;
  return plan("wrap", join(prefix, SH.practiceSummary()), {
    content: [`practice set: ${ps.posed.length} questions; right first time: ${ps.firstTry}`], practiceDone: true,
  });
}

function enterTeachback(s, prefix) {
  // CONVERSATION-V2 §5: every open parked question is offered before the wrap
  if (p5Flag("STEER") && s.later?.length) {
    const due = dueParked(s.later, "before_wrap");
    if (due) { s.later = serveLater(s.later, due.id, s.turn); prefix = join(prefix, SH.returnParked({ topic: due.topic })); }
  }
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
  if (stopping && !["wrap", "done"].includes(s.phase)) s.stoppedEarly = true;   // child.js countsAsDone (owner-truth item 3)
  s.stopAsked = undefined; s.sidebar = undefined;
  s.phase = "done"; s.activeItemId = undefined; s.pendingWhy = undefined; s.hintLevel = 0;
  return plan("wrap", SH.wrap({ prefix, nextTitle: s.ctx.nextTitle, stopping }), stopping ? { stopping: true } : {});
}

// ───────────────────────────── step ─────────────────────────────

function decide(s, input, item) {
  const { cls, chipId } = input;
  const flags = cls?.flags ?? {};
  const labels = chipLabels();
  // 1. Safety before anything else — the predicate or the classifier, either one.
  // `kind`: what raised it (the predicate's family, or model / content_filter / relational_floor) — only the wording of a
  // fallback line reads it (brain/say.js fallbackReply, F10); the hold itself is the same for every trigger.
  if (flags.distress) { s.safeguard = { calm: 0, asked: false, kind: flags.distressKind ?? null }; return plan("safeguard", SH.safeguard(), { whiteboard: HELPLINES }); }
  if (s.safeguard) {
    // RELATIONAL-OS I-7 / AT-B6 (AT-B1 first run: 9/10 goodbyes right after a disclosure ended at once): a goodbye during
    // the safeguard gets ONE check-in before release when the relational policy asks for it; the stop chip always ends it
    if (flags.wantsToStop && chipId !== "safe:stop" && s.rel?.overlay?.kind === "CHECK_IN" && s.stopAsked == null) {
      s.stopAsked = s.turn;
      return plan("safeguard", SH.relCheckIn(), { whiteboard: HELPLINES, chips: [{ id: "safe:continue", label: labels.cont }, { id: "safe:stop", label: labels.stop }] });
    }
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
  // 2. The child wants to stop: whatever was mid-way is over (NEVER MANIPULATE — no holding at goodbye). Only their own
  // stop words (or Pause → End, which never reaches here) end the lesson: "Skip for now" is a help request below.
  // OWNER RESET 2026-10-04 #7 (CONVERSATION-V2 §3.5; owner-truth item3, rebased by W2-I): a stop PHRASE ("end the
  // lesson", "bas", "I'm done", or a topic change the classifier read as a stop) no longer closes the lesson on the spot.
  // ONE warm check-in with three choices (keep going / a short break / stop for today). The lesson ends on "stop for
  // today", on a second stop within two turns, or at once on the relational RELEASE (cls.relRelease: a TRUE goodbye —
  // "bye", "mummy bula rahi hai" — or that second stop, decided in server/relational/policy.js). A relational CHECK_IN
  // (I-7: a goodbye right after distress) is the same one check-in, never a hold. NEVER MANIPULATE holds: one check-in,
  // never a second, no guilt, and the stop chip ends it at once. Pause → End and the parent's controls never reach here.
  if (chipId === "stop:end") return toWrap(s, { stopping: true });
  if (flags.wantsToStop || s.rel?.overlay?.kind === "CHECK_IN") {
    const checkIn = s.rel?.overlay?.kind === "CHECK_IN";
    if (!checkIn && (cls?.relRelease || cls?.source === "relational" || stopKind(input.text) === "leaving" || cls?.request?.type === "goodbye" || (s.stopAsked != null && s.turn - s.stopAsked <= 2))) return toWrap(s, { stopping: true });
    if (s.stopAsked != null && checkIn) return toWrap(s, { stopping: true });      // the check-in was given: let them go
    s.stopAsked = s.turn;
    return plan("break", checkIn ? SH.relCheckIn() : SH.stopCheck(), { chips: [{ id: "stop:continue", label: labels.go }, { id: "break:rest", label: labels.rest }, { id: "stop:end", label: labels.stop }] });
  }
  // 2a. owner-truth patch 07 (F8, items 4-5), reconciled with W2-I's stop gate above: the child's own request in words
  // (director/requests.js) is acted on THIS turn, never evidence; "keep going" in words is the stop:continue chip.
  // p5-interaction: a ways-in chip (offerWays / boredOffer) is the request it names
  const chipReq = p5Flag("STEER") && typeof chipId === "string" && /^req:(visual|story|game)$/.test(chipId)
    ? (chipId === "req:story" ? { type: "story", whole: true } : { type: "visual", kind: chipId === "req:game" ? "game" : "diagram", whole: true }) : null;
  const req = chipReq ?? cls?.request ?? null;
  // p5-interaction: what the UNDERSTAND note read alongside a graded answer (a parked question, a hedge, a check)
  if (p5Flag("STEER") && cls?.alsoPark) s.later = pushLater(s.later ?? [], parkEntry({ ...cls.alsoPark, turn: s.turn, itemOnTable: true }));
  if (chipId === "stop:continue" || req?.type === "continue") {
    s.stopAsked = undefined; s.sidebar = undefined;
    return resume(s, input, item, "they chose to keep going: straight back in, warmly, no fuss");
  }
  if (req && s.phase === "teachback" && req.type !== "break" && !(p5Flag("STEER") && P5_REQUESTS.has(req.type))) {
    // teaching the protégé: a language switch holds from now on; any other request re-asks the teach-back more simply
    if (req.type === "language") s.ctx = { ...s.ctx, lang: req.lang, langPinned: true };
    const p = helpMove(s, input, item, req.type === "language" ? "slower" : "another");
    return { ...p, request: req.type };
  }
  if (req && ["warmup", "teach", "practice", "teachback"].includes(s.phase)) {
    const p = requestMove(s, input, item, req, labels);
    if (p) return p;
  }
  // a side chat the child asked for (change_topic → what they want to talk about): one real turn on it, then the lesson
  if (s.sidebar && s.turn - s.sidebar.asked === 1 && !cls?.help && !(cls && ["correct", "incorrect", "partial", "misconception"].includes(cls.outcome))) {
    s.sidebar = undefined;
    return plan("break", SH.sideChat(), { chips: [{ id: "stop:continue", label: labels.back }, { id: "stop:end", label: labels.stop }], request: "side_chat" });
  }
  s.sidebar = undefined;
  // 2b. A help request (a client action): acts on the question on the table; never evidence, never a stop.
  if (cls?.help && ["warmup", "teach", "practice", "teachback"].includes(s.phase)) return helpMove(s, input, item, cls.help);
  // 3. Choices offered by a break.
  if (chipId === "break:rest") return plan("break", SH.stretch());
  if (chipId === "break:easier" && s.phase === "practice") {
    if (s.activeItemId) { noteStuck(s, item); s.skipped.push(s.activeItemId); }
    s.easier = true;
    return poseNext(s, input, "an easier one now");
  }
  // 4. A frustration loop (P20) gets a break with choices, not another question.
  if (frustrationLoop(s.affect) && ["warmup", "practice"].includes(s.phase) && s.turn - s.lastBreakTurn >= LIMITS.breakGapTurns) {
    s.lastBreakTurn = s.turn;
    s.affect = { ...s.affect, dontKnowStreak: 0, minimalStreak: 0 };
    // Equity profile (steal 4, rj-advice-menu-for-weak-learners): a low-baseline child gets ONE next step, never a menu.
    if (s.equity === "low" && s.phase === "practice") return plan("break", SH.takeBreakOneStep(), { chips: [{ id: "break:easier", label: labels.easier }] });
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
  // V1-01r (owner-1: 8/9 forged claims accepted): an answer the server could not re-check is never graded by the frame's
  // claim, and never silently dropped either: the child is asked for it in words (graded against the key next turn).
  if (input.unverified && item && p5Flag("RECHECK")) return plan("repair", SH.moduleUnverified(), { item, chips: optionChips(item), request: "module_unverified" });
  const last = (input.moduleEvents ?? []).filter((e) => e?.type === "goal_met" || e?.type === "stuck").at(-1);
  if (!last) return null;
  const chips = optionChips(item);
  if (last.type === "stuck") return plan("hint", SH.moduleStuck(), { item, chips });
  // The goal name comes from the client: interpolated into instructions only as a short plain label.
  const goal = String(last.name ?? "").replace(/[^\p{L}\p{N} /.,-]/gu, "").trim().slice(0, 40);
  return plan("celebrate", SH.moduleGoal({ goal }), { item, chips });
}

/**
 * The card cap (p5-interaction; owner-2 R5.loop 17 / 90 turns, w1c-three-day: a why item held 7 turns): when the plan
 * would pin the SAME question on the card for the (cardMax + 1)th turn in a row, the question is resolved instead — after
 * real help (rung ≥ 2) its answer is given plainly with one line of why and a similar question follows (rule 15, as the
 * assertion does); otherwise it is left for later with no verdict and no answer — and the lesson moves on. Never on a
 * safeguarding hold. The plan's `lead` (an uptake of what the child just said) is kept. Evidence is unchanged: this turn's
 * answer was graded before step(); the item left gets none after it.
 */
function capPlan(s, input, p) {
  if (s.safeguard || !p.item || p.capped) return p;
  const kit = input.kit;
  const item = findItem(s, kit, p.item.id) ?? p.item;
  const pins = s.pendingWhy !== item.id && !["safeguard", "wrap", "break", "teachback"].includes(p.kind);
  if (!pins || item.id !== s.activeItemId || s.pinItem !== item.id || (s.pinRun ?? 0) < LIMITS.cardMax) return p;
  const assert = s.hintLevel >= 2;
  if (assert) {
    if (!s.itemsDone.includes(item.id)) s.itemsDone.push(item.id); noteStuck(s, item);
    // ship5 integration (p5 card cap x W1-C re-teach): under the cap the help ladder ends at rung 2-3, so the post-rung-3
    // fails the re-teach trigger counts (two_fails_post_rung3) never happened and a child who kept getting it wrong was
    // never re-taught (tests/prod/w1c-reteach: 0 re-teach moves). An asserted cap after real help IS the ladder's end on
    // the skill: it counts as one such fail (unless decide() already counted this fail at rung >= 3, hintLevel now 4), so
    // two of them on a skill let engineReteach fire on its next answer.
    if (s.hintLevel <= 3) s.failsPostRung3 = { ...s.failsPostRung3, [item.skillId]: (s.failsPostRung3?.[item.skillId] ?? 0) + 1 };
  } else if (!s.skipped.includes(item.id)) s.skipped.push(item.id);
  s.unclear = 0;
  const prefix = join(p.lead, assert ? SH.assertAndMove() : SH.leaveForLater());
  const next = s.phase === "warmup" ? nextWarmup(s, input, prefix) : poseNext(s, input, prefix, assert ? isomorphicFor(s, kit, item) ?? undefined : undefined);
  s.capped = { turn: s.turn, how: assert ? "assert" : "leave" };
  return { ...next, content: [...(assert ? [`the answer to the question being left: ${item.answer}`] : []), ...(next.content ?? [])], capped: assert ? "assert" : "leave" };
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
  // A help request (cls.help) is a client action: nothing was graded, and it spends no test budget.
  const helpTurn = !!input.cls?.help;
  const gradedItem = childTurn && !helpTurn && !!active && s.pendingWhy !== active.id && s.hintLevel < 4 && !(s.phase === "teachback" && s.teachbackAsked);
  const asked = s.pendingProbe;
  if (childTurn && !helpTurn && s.probeSess) {
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
  if (input.event === "turn" && !input.branch) {
    // Conversation mix and child talk share (talk.js, W2-C #5): a monitor on the child's turn, never evidence.
    s.talk = noteChildTurn(s.talk, { cls: input.cls, text: input.text ?? input.answer ?? "",
      explaining: !!(active && s.pendingWhy === active.id) || (s.phase === "teachback" && s.teachbackAsked) });
  }
  if (input.event === "turn" && s.persona) {
    const v = verdict(input.cls);
    s.turnsSinceError = v === "wrong" ? 0 : (s.turnsSinceError ?? 99) + 1;
    // Vibe signals (persona/signals.js): what the child said and did, plus the voice PACE signals only (slowerPace,
    // onset z on a think question). Pace knobs, never a belief (CE8). An explicit pace request ("dheere", the Slower
    // help) applies the same turn (persona/pace.js, W2-C #6).
    const childWords = input.text ?? input.answer ?? "";
    const pace = explicitPace(childWords);
    if (input.cls?.help === "slower") pace.explicitSlower = true;
    s.persona = personaStep(s.persona, { ...turnSignals({ text: childWords, bargeIn: !!input.bargeIn,
      afterError: s.lastMove?.kind === "hint", retried: v !== "unclear", onsetZ: input.voiceZ?.onsetMs ?? null,
      slowerPace: !!input.voice?.slowerPace, thinkQuestion: !!s.pendingWhy }), ...pace }, { minute: s.minutes });
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
  let p = reacting ? moduleReaction(s, input, active) : decide(s, input, active);
  if (p && !input.branch && p5Flag("CARDCAP")) p = capPlan(s, input, p);
  if (!p) {
    return { state: s, move: s.lastMove, moduleCommands: [], ui: s.lastUi ?? { status: "your_turn" }, end: s.phase === "done", hold: true, ...describe(s, input.kit) };
  }

  // The item as this child is asked it (findItem: the address register), whichever path chose it.
  const item = p.item ? (findItem(s, input.kit, p.item.id) ?? p.item) : null;
  // Notes on the real move only: a voice branch (branchesFor, input.branch) is rendered into the appended-last
  // section, whose budget the kit load gate measured without them (compile.js checkFits).
  const notes = input.branch ? [] : [gradedItem && !NO_VERDICT_MOVES.has(p.kind) ? SH.VERDICT_NOTE[verdictKey(input.cls)] : null, registerNote(s.ctx.address),
    // p5-interaction: the UNDERSTAND note's alongside readings on a graded answer (hedge, check, insist; a parked question)
    ...(p5Flag("STEER") && !NO_VERDICT_MOVES.has(p.kind) ? [...(input.cls?.mods ?? []).map((m) => SH.MOD_NOTE[m]), input.cls?.alsoPark ? SH.parkAlso({ topic: input.cls.alsoPark.topic }) : null] : [])];
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
  const moduleCommands = reacting ? [] : planModule(s, { kit: input.kit, item, move, lang: s.ctx.lang, band: s.probeSess?.band ?? bandOf(s.ctx.classLevel), representation: p.representation });
  // The child's request this move answers (requests.js): the brain reads it (a visual request asks Studio on any lane).
  if (p.request) move.request = p.request;
  if (p.visual) {
    move.visual = p.visual;
    // what is on the stage decides the words: point at it, or (nothing mounted) show it with things they know — never a
    // text drawing, never "I can't draw", never "you draw it" (F16, the owner's session)
    move.shape = join(move.shape, s.module?.id ? SH.VISUAL_ON_STAGE : SH.VISUAL_NOT_YET);
    s.lastMove = move;
  }
  const ui = uiFor(s, p, move, item, input.kit);
  s.lastUi = ui; // what a hold re-sends (chips are momentary on the client: absent would clear them)
  // the card pins (capPlan): how many teacher turns in a row (turns with no question on the card do not break the run)
  // have pinned this question
  if (!input.branch && ui.ask?.itemId) {
    if (s.pinItem === ui.ask.itemId) s.pinRun = (s.pinRun ?? 0) + 1;
    else { s.pinItem = ui.ask.itemId; s.pinRun = 1; }
  }
  // The move as a kernel proposal (proposal.js, W2-C #8): returned beside the move, never stored in the state.
  const proposal = directorProposal(move, { stopping: p.stopping, ui, guidance: s.guidance, purpose: s.purpose });
  return { state: s, move, moduleCommands, ui, end: s.phase === "done", proposal, ...describe(s, input.kit) };
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
  // Choices on screen always take the tray: a choice item is never left with its options only in speech behind an
  // activity (audit flows G2: tray "module" + answerForm "tap_in_tray" on a diagnostic, with no Type and no tiles).
  // "tap_in_tray" and tray "module" only with a mount the Director holds (s.module, cleared on a module failure).
  ui.answerForm = ui.chips ? "choice"
    : asking && s.module?.id && s.module.awaitingReveal && s.module.itemId === item.id ? "tap_in_tray"
      : asking && NUMERIC_KEY.test(String(item.answer).trim()) ? "number" : "words";
  // a key written with commas (Indian grouping) needs a "," on the pad, or the child can never type what is checked
  if (ui.answerForm === "number" && String(item?.answer ?? "").includes(",")) ui.padComma = true;
  ui.tray = ui.chips ? "tiles" : s.module?.id ? "module" : "none";
  const hint = hintFor(move, item, p.hintRung);
  if (hint) ui.hint = hint;
  const short = shortTitleOf(s.ctx.topicTitle);
  if (short && !isObjective(short, kit, topic)) ui.shortTitle = short;
  // Quick practice's counter (W2-C #7 → W2-A's "Practice · n of 5" / "That's the set"): n = the set items posed so far.
  if (s.practiceSet) {
    const n = Math.max(1, s.practiceSet.posed.length);
    ui.practice = { n: Math.min(n, s.practiceSet.of), of: s.practiceSet.of, ...(p.practiceDone || s.phase === "done" ? { done: true } : {}) };
  }
  return ui;
}

/**
 * The Question card's hint line (V2 §4.3, §4.6 "Hint"): sent on a hint move at rungs 1-3, with the kit's rung text for
 * the line under the ask. Rung 4 is the assertion (the key itself), which is never a hint line; a rung whose text
 * would state the key before rung 4 is not sent (the card must never give away what her words withhold). Exported for tests.
 * @returns {{ level: 1 | 2 | 3, text: string } | null}
 */
export function hintFor(move, item, rung) {
  if (move?.kind !== "hint" || !item || !Number.isInteger(rung) || rung < 1 || rung > 3) return null;
  // The card line is child-facing: the rung label goes ("Prompt: …", "pump: …"), and a line that still reads as a note
  // to the teacher (audit flows G5: "pump: ask them to picture both choices as real things") is never shown.
  const text = stripRungLabel(String(item.hints?.[rung - 1] ?? "")).replace(/\s+/g, " ").trim();
  if (!text || revealsAnswer(text, item) || hintShapeWords(text)) return null;
  return { level: /** @type {1 | 2 | 3} */ (rung), text: text.length > 120 ? `${text.slice(0, 119).replace(/\s+\S*$/, "")}…` : text };
}

/**
 * Words that mark a hint line as a note to the teacher, not something to show a child (G-HINT lint over ui.hint.text):
 * "ask them…", "say which…", "pump", "tell them", "the child", "their answer", a rung name as a label. Exported for tests.
 */
const SHAPE_WORDS = /^\s*ask\s+(?:what|why|how|which|whether|if|about)\b|\b(?:ask\s+them|tell\s+them|say\s+which|have\s+them|get\s+them|remind\s+them|pump|assertion|the\s+key|their\s+answer|rung\s+\d)\b|^\s*(?:pump|hint|prompt|assert(?:ion)?)\s*[:\-–]/i;
export const hintShapeWords = (text) => SHAPE_WORDS.test(String(text ?? ""));

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
  // A worked example's first part is followed by its faded step: that gap's key must not be said before it is posed.
  if (s.phase === "teach" && s.teachPlan?.[s.teachIdx] === "fade" && s.fadeItem) return findItem(s, kit, s.fadeItem.id);
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

/** The longest next question a voice branch line poses itself (characters); a longer one waits for the next turn's instructions. */
export const BRANCH_ASK_MAX = 240;
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
    // p5-interaction (kit-budget gate on the V1 series: V1-12's fast pace makes a long reading passage the next question, and
    // its full text in the voice branch put the appended-last section 2 tokens over its cap): a next question longer than
    // BRANCH_ASK_MAX characters is not posed from a branch line; it is posed as written on the next turn's instructions
    const full = asks ? promptFor(r.item, lang) : null;
    const long = !!full && full.length > BRANCH_ASK_MAX;
    return {
      kind: r.move.kind.replace(/_/g, " "), text: long ? `${r.move.shape.split("; pose the question as written")[0]}; the next question comes on the next turn, as written` : r.move.shape,
      ask: long ? null : full,
      content: [...r.content, ...(asks && r.item.diagnostic ? [`choices for that question: ${optionsSpoken(r.item, lang)}`] : [])],
    };
  };
  // The first-step probe (fading.js): no item is on the table; the branch is whether they can say how to start.
  if (s.firstStep?.asked && s.firstStep.started === undefined && s.phase === "teach") {
    const step1 = (flags) => {
      const pre = structuredClone(s);
      return step(pre, { event: "turn", kit, cls: { outcome: "no_evidence", confidence: 1, source: "branch", flags: { ...NO_FLAGS, ...flags } }, now, branch: true });
    };
    // compact branch notes: the appended-last section has no room for two full move shapes (measured: 9 kit × language
    // cells 2-14 tokens over the `last` cap with them)
    const can = render(step1({})), cannot = render(step1({ dontKnow: true }));
    return { cond: "they say how they would start it", right: { ...can, text: SH.firstStepStarted() },
      wrong: { ...cannot, text: SH.firstStepStuck(), ask: null } };
  }
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
  // A faded worked-example step is answered with the earlier steps in view: never unaided (fading.js).
  const hintsUsed = leaked || s.spoiled?.includes(item.id) ? 4 : item.fade ? Math.max(1, s.hintLevel) : s.hintLevel;
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
