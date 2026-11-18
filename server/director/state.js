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
import { heldBoard as studioHeldBoard } from "../stagecraft/board-first.js";
import { unitBoardOf, firstUnitOf } from "../brain/propose.js";
import { stopKind, signalsOf } from "../relational/signals.js";
import * as SH from "./shapes.js";
import { readFileSync } from "fs";
import { responseShape } from "./requestTable.js";
import { buildPracticeQueue, findItem, isomorphicFor, probeFor, promptFor, optionsSpoken, selectNext, anchorOf, whyKey, PROBE_WEIGHT, revealsAnswer, choicesFor, stripRungLabel } from "./items.js";
import { registerNote } from "./register.js";
import { askText } from "./say.js";
import { getTopic, findTopic, topicSequence } from "../content/curriculum.js";
import { planModule, topicGameFor } from "./modules.js";
import { frustrationLoop, initialAffect, nextAffect, wheelSpinning } from "../learner/affect.js";
import {
  newProbeSession, openSession, recordTurn, nextProbe, markAsked, fits, bandOf, shapeById, testWeight,
  reteachTrigger, reteachPlan, armsFromKit, newPersonaState, personaStep, personaKnobs, turnSignals,
  reteachSessionInputs, noteReteach, directorReteachDecision, bookDirectorReteach, reteachLogOn, directorMayReteach,
} from "../comprehension/index.js";
import { skillSess } from "../comprehension/budget.js";
import { equityProfile, lessonGuidance, teachPlanFor, fadeItem, fadedContent, workedLeadContent, fadeBoard, startedFirstStep, FADE_PREFIX, clip } from "./fading.js";
import { renderWorked, chainOf as chainOfStep, stepLine as stepLineOf } from "./worked.js";
import { INTERESTS as PERSONA_INTERESTS } from "../persona/signals.js";
import { knowsBeats, knowsCompressAnswer, knowsHookSlot, knowsGreetSlot, knowsRemedy, knowsSayFirst, knowsMark, knowsPick } from "./knows-walk.js";
import { pickHelp, addSaid, TEACHBACK_PART, helpJoint } from "./help.js";
import { scriptFor, scriptOn, skillScriptOf, scriptIdOf, walkBeats, scriptCheckItem, scriptThenItem, scriptWorkedLines, scriptAskItem, scriptWorkedLinesV2, scriptWorkedStepLine, scriptWorkedStepSmaller, scriptQuickItem, scriptStepAskItem, isQuickId, saidIn as saidIn0, saidMust, fillFriend, WHY_MAX_WORDS, joinable, jointOf } from "./script.js";
import { allocateFormat, POINT_ID as FORMAT_POINT } from "../learner/formats.js";
/** round 7 S2: worked examples rendered in code (TAXILA_R7_WORKED_CODE=off: the model words them, as before). */
/** round 7 S3: one live item (TAXILA_R7_ONE_LIVE=off: the 3-turn card cap as before). */
export const oneLiveOn = (env = process.env) => !/^(off|0|false)$/i.test(String(env.TAXILA_R7_ONE_LIVE ?? ""));
/**
 * round 7 (Learning patch 008): the explain format of a skill, chosen ONCE per skill per lesson by the population allocator
 * (learner/formats.js: seeded Thompson sampling, 0.2 floor) over the kit's eligible formats, with the population posteriors
 * the start read (ctx.formatPosteriors); the kit primary when the start gave no eligible list. The choice is logged once as a
 * decision_record (brain/trace.js formatDecisionOf, s.formatDecision on the turn it was made).
 */
function formatFor(s, kit, skillId) {
  const had = s.formatOf?.[skillId];
  if (had) return had.format;
  const eligible = s.ctx.formatsEligible;
  const pick = Array.isArray(eligible) && eligible.length
    ? allocateFormat(eligible, s.ctx.formatPosteriors ?? {}, { seed: `${s.ctx.sessionId ?? s.seed}:${skillId}` }) : null;
  const chosen = pick?.format ?? kit.formats.primary;
  s.formatOf = { ...(s.formatOf ?? {}), [skillId]: { format: chosen } };
  if (pick) s.formatDecision = { pointId: FORMAT_POINT, turn: s.turn, skillId, format: chosen, propensity: pick.propensity, explored: !!pick.explored,
    eligible: [...eligible], topicType: kit.topicType ?? null, band: s.ctx.formatBand ?? null };
  return chosen;
}
/** A stuck turn (S3's stall split): a don't-know, a stuck read, or a silence while working; never a distraction or an aside. */
// v6.1 R9 (main, director9: 52 of 136 turns ended in a check-in; a "samajh nahi aaya" reply was ignored every time; skill 1 took
// 66 turns): a check-in ("Yahan tak theek hai?") is asked at most once per beat, and only on a turn of new teaching; an answer
// to it that is not a yes is acted on (the same teaching, smaller), never passed over
const CHECKIN_NO = /^\s*(?:nahi|nahin|nai|na|no|nope|nahi\s+samjh?[ae]?|samajh\s+nahi|not\s+really|thoda\s+nahi)\b/i;
const CHECKIN_YES = /^\s*(?:haan|ha|han|hmm+|ji|yes|yeah|ok|okay|theek|thik|samajh\s+(?:aaya|aa\s+gaya|gaya|gayi)|clear|got\s+it)\b/i;
/** A reply to a check-in that is not a yes (a no, "nahi samjha"), as code reads it. */
export const notYes = (t) => { const x = String(t ?? "").trim(); return !!x && CHECKIN_NO.test(x) && !CHECKIN_YES.test(x); };
/** May this teaching move end on a check-in? Once per beat (a worked example's steps are one beat); records it. */
function checkinFor(s, move) {
  const id = move?.scriptBeat?.beatId ? `${move.skillId ?? move.scriptBeat.skillId ?? ""}:${String(move.scriptBeat.beatId).replace(/:step\d+$|:problem$/, "")}` : null;
  if (!id || (s.checkins ?? []).includes(id)) return false;
  s.checkins = [...(s.checkins ?? []), id].slice(-24);
  return true;
}
const stuckTurn = (cls) => !!cls && !cls.flags?.offTopic && !["back", "park", "detour", "change_topic", "side_chat", "uptake"].includes(cls.request?.type)
  && (!!cls.flags?.dontKnow || verdict(cls) === "stuck" || cls.request?.type === "thinking");
/** An okay right after she taught on THIS card (a hint, a re-teach, an example): engaged with the card, never a distraction. */
const ackToTeaching = (s, input, item) => s.lastMove?.itemId === item.id && ["hint", "reteach", "worked_example", "repair"].includes(s.lastMove?.kind)
  && /^(?:(?:achha|acha|accha|theek|thik|hai|haan|han|ha|ok|okay|ji|hmm+|samajh\s+gay[ai]|got\s+it|right|sure|chalo)[\s,.!]*)+$/i.test(String(input.text ?? "").trim());
/** The why of a card's answer, language-free: a faded step's own calculation from the worked example, else null. */
function whyOf(kit, item, lang = "hinglish") {
  const we = kit?.workedExample;
  if (we && item?.fade) {
    const i = Number(String(item.id).slice(FADE_PREFIX.length));
    const c = stepLineOf(we.steps?.[i], lang);
    if (c) return c;
  }
  // (director3: "Woh wala: jawab before." had no why) else the item's last hint, as a calculation or a step fact, never its words
  for (const h of [...(item?.hints ?? [])].reverse()) { const c = stepLineOf(h, lang); if (c && /=|<|>/.test(c)) return c; }
  return null;
}
/**
 * v5 B5 ("a close says the answer and its why"); v6 (main, director8 hand judges: "kyunki toh 8 bada…", "wapas A par": the
 * last sentence of a point or a remediation said as a card's why contradicted the card): a scripted card's why is ONLY its own
 * authored why: the worked example's `why` for its own step, else the card's authored `why` (KeyedAsk.why /
 * CheckQuestionV2.why). No authored why → null, and the close says the answer alone. Short enough to ride after "kyunki".
 */
export function scriptWhyOf(kit, item, lang = "hinglish") {
  const sk = item?.skillId ? skillScriptOf(kit, item.skillId) : null;
  if (!sk) return null;
  const src = item.scriptAsk?.beatId === "worked" ? sk.workedExample?.why
    : (item.scriptAsk ?? item.scriptCheck ?? item.scriptThen)?.why ?? null;
  const t = src ? saidIn(src, lang) : null;
  const one = t ? String(t).replace(/\s+/g, " ").trim().replace(/^(?:kyunki|because)\s+/i, "").replace(/[.!?\u0964]+$/, "") : null;
  return one && one.split(/\s+/).length <= WHY_MAX_WORDS ? one : null; // (2.3's validator refuses a longer one)
}
/** dc-r8-director27 Brain 043 R1: a card's `whyShort` (its why cut to the core, 10 words or fewer) in the lesson language, as scriptWhyOf
 *  gives the why — or null (no short form, the worked example's own card, no why). */
export const WHY_SHORT_MAX = 10;
export function scriptWhyShortOf(kit, item, lang = "hinglish") {
  if (!item?.skillId || item.scriptAsk?.beatId === "worked") return null;
  const c = item.scriptAsk ?? item.scriptCheck ?? item.scriptThen;
  if (!c?.why || !c.whyShort) return null;
  const t = saidIn(c.whyShort, lang);
  const one = t ? String(t).replace(/\s+/g, " ").trim().replace(/^(?:kyunki|because)\s+/i, "").replace(/[.!?\u0964]+$/, "") : null;
  return one && one.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length <= WHY_SHORT_MAX ? one : null;
}
/**
 * A card's key in the lesson language, from its AUTHORED forms only (director7: "jawab 0 tha" for the key "between 0 and 1"
 * took the first number out of a range key). A key that IS a number or fraction (with a unit) is said as it is; any other key
 * (a range, a place, a phrase) is said in its authored Hindi accept form, preferring one that carries every number of the key
 * ("0 aur 1 ke beech"), else the key's word in Hindi (WORD_HI), else the key itself. Never a number pulled out of a phrase.
 */
export function keyInLang(item, lang) {
  const a = String(item?.answer ?? "").trim();
  if (SPOKEN_NUMERIC_KEY.test(a)) return a.replace(/\s*\/\s*/, "/");
  if (lang === "english") return a;
  const numsOf = (t) => String(t).match(/\d+(?:\/\d+)?/g) ?? [];
  const need = numsOf(a);
  const hindi = (item?.acceptable ?? []).map(String).filter((x) => HINDI_FORM.test(x));
  // (a number the key does not carry is never said: "5/6 wala" for the key "Gopi"; a name key keeps its name)
  const same = (x) => numsOf(x).every((n) => need.includes(n));
  const full = need.length ? hindi.find((x) => same(x) && need.every((n) => numsOf(x).includes(n))) : null;
  const word = !need.length ? hindi.find((x) => same(x) && a.split(/\s+/).some((w) => w.length > 2 && new RegExp(`(?<![\\p{L}])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}])`, "iu").test(x))) : null;
  const plain = /^\p{Lu}/u.test(a) ? null : hindi.find((x) => !numsOf(x).length);
  return full ?? word ?? WORD_HI[a.toLowerCase()] ?? plain ?? a;
}
const SPOKEN_NUMERIC_KEY = /^\d+(?:\.\d+)?(?:\s*\/\s*\d+)?(?:\s*(?:cm|m|km|kg|g|l|ml|°|sq cm|square cm))?$/i;
const HINDI_FORM = /(?<![\p{L}])(?:aur|ke|ki|ka|beech|se|pehle|baad|par|mein|isi|usi|wala|wali|wale|doosra|doosre|pehla|teesra|ek|do|teen|chaar|paanch|aadha|chauthai|chauthaai|tihai|bata|haan|nahi|zyada|kam|barabar|theek|sava|dedh|hop|gap)(?![\p{L}])/iu;
const WORD_HI = { before: "pehle", after: "baad mein", more: "zyada", greater: "zyada", bigger: "bada", less: "kam", smaller: "chhota", equal: "barabar", same: "barabar", half: "aadha", middle: "beech", yes: "haan", no: "nahi", neither: "dono mein se koi nahi" };
export const workedCodeOn = (env = process.env) => !/^(off|0|false)$/i.test(String(env.TAXILA_R7_WORKED_CODE ?? ""));
const rendered = (we, o, s) => { if (!workedCodeOn()) return {}; const r = renderWorked(we, { ...o, lang: s.ctx.lang }); return r ? { rendered: r } : {}; };
import { newTalk, noteChildTurn } from "./talk.js";
import { explicitPace } from "../persona/pace.js";
import { directorProposal } from "./proposal.js";
import { p5Flag } from "../conversation/flags.js";
import { unsafeChildPhrase } from "../conversation/screen.js";
import { laterUi, momentOf, tappedEntry } from "./later.js";
import { readMethod, keepMethod, METHOD_NOTE } from "../conversation/methods.js";
import { freeSubjectOf, genericSubject } from "./requests.js";
import { claimsToUnderstand } from "./read.js";
import { parkEntry, pushLater, recentParked, dueParked, serveLater } from "../conversation/policy.js";
import { isSadAside } from "../brain/asideReplies.js";
import { alsoReading, alsoQuestion, questionShaped, bareAck, readIntent } from "../conversation/lexicon.js";
import { intakeStart, intakeStep } from "./session/beat.js";
import { newSession, openSegment } from "./session/segments.js";
import { priorNotes } from "./session/prior.js";
import { kitFromFile } from "../content/kits.js";
import { clearlyFine, asksToCarryOn, bareOk, bareUnsure, bareNotOk, mildLow, safeAndTells, helpInPlace } from "../safety/fine.js";
/** The distress kinds a MODEL read sets (classify.js "model", the content filter, an understanding note): their episodes
 *  step back on a clearly-fine reply; every other kind (the predicate's families, the relational floor) keeps the hold. */
export const MODEL_EPISODE_KINDS = Object.freeze(new Set(["model", "content_filter", "model_note"]));
/**
 * 14.4 (main safety review, the owner's directive after lesson e6392332: the helpline script on a misheard line, twice in a
 * row, "only when it is sure"): ONE model read of a low mood or another fright (the words-only read's `about`, or the two
 * reads disagreeing) opens a warm check-in, never the helpline script at once. Every sure signal keeps the full script at
 * once: the predicate's families (self-harm incl. passive ideation, abuse, fear), the relational floor, the content filter
 * (except a block whose words-alone probe could not run: filterUnsure, a check-in), any layer that marks itself sure
 * (flags.sureBy: the relational floor, a filter block the child's words trip) over the classifier's own read,
 * an understanding note, a read naming self-harm / a person hurting them / fear of a person or home / danger now, or a
 * read that could not name a kind.
 */
const CHECK_ABOUT = Object.freeze(new Set(["sad_or_lonely", "other_fright", "hurt_by_accident_or_animal", "none"]));
/** The classification with a check-kind distress read set aside (a check-in that released, or its cooldown): the lesson
 *  reads the rest of it as usual. Never used on a sure read. */
const quiet = (cls) => (cls?.flags?.distress && checkTier(cls.flags) ? { ...cls, flags: { ...cls.flags, distress: false, distressSetAside: cls.flags.distressAbout ?? "check" } } : cls);
/** The step that set a check-kind read aside marks its move (brain/turn.js writes no incident for it). */
const setAside = (s) => { s.setAside = s.turn; };
export const checkTier = (flags = {}) => !!flags.distress && !flags.sureBy
  && ((flags.distressKind === "model" && CHECK_ABOUT.has(flags.distressAbout ?? "")) || (flags.distressKind === "content_filter" && flags.filterUnsure === true)
    // 14.4 (QA TEST bfb56c4f t6): the predicate's self_harm on the lesson's own hyperbole (classify.js lessonHyperbole)
    || (flags.distressKind === "self_harm" && flags.idiom === "lesson_hyperbole")
    // 14.4 (QA TEST 8a4ce363 X2c, 9e0d6167 XS1: a right answer, and "…Ab theek hai… accha ho gaya", after a check-in got
    // the full script on the understanding note alone): the note sets distress only when classify's own reads (the labels
    // and the words read) said none (conversation/policy.js applyNote), so a note-only read is reads that DISAGREE: a check-in
    || flags.distressKind === "model_note");

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
export function initLessonState({ topicId, kit, skills = {}, history = {}, stuck = {}, warmupItems = [], activeMisconceptionIds = [], ctx: ctx0, seed, now = Date.now(), openers = [], comp, level = null, knows = null }) {
  const ctx = protegeNotChild(ctx0);
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
  // round 7 (Learning patch 007, homework): the method first, then always a worked look-alike from the kit (S2: code-rendered)
  if (asking && ctx.homework && kit.workedExample) teachPlan = ["answer_question", "worked_example", ...teachPlan.filter((x) => !["hook", "answer_question", "worked_example"].includes(x))];
  const novice = guide.level !== "attempt";
  // The probe session (COMPREHENSION-ENGINE.md §3.4): test-load budget, spacing, novelty and the mandatory triggers;
  // openers (delayed checks due at session open) are its first pending triggers.
  const probeSess = openSession(newProbeSession({ sessionId: ctx.sessionId ?? String(seed >>> 0), band, lessonSeed: seed >>> 0,
    targets: kit.skills.map((sk) => sk.id), surface: { visual: true } }), openers);
  return {
    v: 1, phase: practiceSet ? "practice" : asking ? "teach" : "warmup", topicId, turn: 0, ...(knows && !practiceSet && !asking ? { knows, knowsApplied: [] } : {}), minutes: 0, startedAt: now, seed: seed >>> 0, ctx,
    hintLevel: 0, itemsDone: [], skipped: ctx.homework && ctx.avoidItemId ? [String(ctx.avoidItemId)] : [], activeItemId: undefined, pendingWhy: undefined, lastMove: undefined, lastContent: [],
    warmup: practiceSet || asking ? [] : warmupItems.slice(0, LIMITS.warmupMax), warmupIdx: 0,
    novice, teachPlan: practiceSet ? [] : teachPlan, teachIdx: 0, workedPart: 0,
    // The guidance ladder's state (fading.js): the entry level and why, the planned faded step (an item, resolved by
    // items.js findItem as `fade:<i>`), and the first-step probe's outcome once asked.
    guidance: { level: guide.level, reason: guide.reason, skillId: guide.skillId }, equity, fadeItem: fade ?? undefined, firstStep: undefined,
    purpose: practiceSet ? "practice" : asking ? "doubt" : "lesson",
    practiceSet: practiceSet ? { ids: practiceSet, of: Math.min(practiceSet.length, ctx.practice?.count ?? practiceSet.length), posed: [], firstTry: 0 } : undefined,
    talk: newTalk(),
    // round 7 (F Learning's learner view, patch to-brain/001; PIPELINE §A Brain item 4): items at this child's level, θ on the
    // GE scale (null until 2 scored answers → the class default) and the weak flag; absent → today's on-track default
    queue: practiceSet ?? buildPracticeQueue(kit, { activeMisconceptionIds, ...(level ? { classLevel: ctx.classLevel, theta: level.theta ?? undefined, weak: !!level.weak } : {}) }),
    // the family's minutes left at the start (D5 mid-lesson limit: the wrap after deadlineAt), or null when limits are off
    ...(level?.minutesLeft?.today != null ? { minutesLeft: level.minutesLeft } : {}),
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
    // round 4 (session-first, TAXILA_SESSION_FIRST; director/session/*): the session and its INTAKE beat when the route
    // started a session with no topic chosen by the child (ctx.session); absent on every other start
    ...(ctx.session && !practiceSet && !asking ? sessionFields(ctx, classLevel, now) : {}),
  };
}

/**
 * round 4 (owner-2 judge, local and production 2026-10-10): the young band's teach-back protégé is "Golu", and a child named
 * Golu heard "at the end tum Golu ko sikhaoge" (J.confused: "implying Golu will teach himself"). A protégé never shares the
 * child's first name: the next name of a short list that is not the child's. PURE.
 */
const PROTEGE_NAMES = ["Golu", "Bittu", "Chintu", "Pinku", "Munna"];
export function protegeNotChild(ctx) {
  const p = ctx?.protege, me = String(ctx?.firstName ?? "").trim().toLowerCase();
  if (!p?.name || !me || String(p.name).trim().toLowerCase() !== me) return ctx;
  const name = PROTEGE_NAMES.find((n) => n.toLowerCase() !== me);
  return { ...ctx, protege: { ...p, name } };
}

/**
 * round 4 (owner-2 with the model judge, production c439bd7 and local, 2026-10-10; lever 5, the main session's decision): the
 * top cause of J.confused (12 of 30 judged turns) is a teaching question answered only with "haan" / "ok" / "hmm", after which
 * the next teach step opens a NEW example as if nothing had been asked. A must-note asking the reply to close the question
 * moved nothing (J 40 -> 40 of 270; rejected, context inbox), because the step itself is the new example. With
 * TAXILA_ACK_CLOSE (default on since round 7; "off" restores the old flow) the step is HELD for one turn: she closes her own question (its answer, plainly, and one
 * line linking it to the idea), and the next turn advances. Once per teach step: a second bare okay on the same step moves on,
 * so the lesson never stalls on acknowledgements.
 */
// round 7 A6 (PIPELINE §A Brain item 3): on by default; TAXILA_ACK_CLOSE=off restores the old flow
export const ackCloseOn = (env = process.env) => String(env.TAXILA_ACK_CLOSE ?? "on").trim().toLowerCase() !== "off";
function ackHold(s, input) {
  if (!ackCloseOn() || input.event !== "turn" || input.cls?.outcome !== "no_evidence" || input.cls?.request || input.cls?.help) return null;
  if (!bareAck(input.text ?? "") || !TEACH_KINDS.has(s.lastMove?.kind) || s.lastMove?.itemId || s.ackHeldAt === s.teachIdx) return null;
  // (v6.8 B1‴, main on director16 c4 row 4 ×4: "haan" after the scripted hook held the walk for her to close the hook's rhetorical
  // question, and the beatless fallback said e1's simpler before e1 was taught: an authored beat's question is answered by the walk)
  if (scriptOn() && scriptIdOf(input.kit) && s.lastMove?.scriptBeat && !scriptFor(input.kit)?.script?.recordedRun) return null;
  const last = (s.recent ?? []).findLast((t) => t.who === "teacher")?.text ?? "";
  const asked = (String(last).match(/[^.!?।]*[?？]/g) ?? []).at(-1)?.trim();
  if (!asked || asked.length < 8) return null;
  s.ackHeldAt = s.teachIdx;
  return plan("reteach", SH.ackCloseMove({ asked }), { skillId: currentSkillId(s, input.kit, null), content: s.lastContent ?? [], ackClose: true });
}

/** Round 4 (session-first): the session object and the intake beat's state for a session start (ctx.session). */
function sessionFields(ctx, classLevel, now) {
  const sc = ctx.session ?? {};
  const intake = intakeStart({ now, classLevel, ctx: { subjects: sc.subjects ?? [], pointer: sc.pointer ?? {} } });
  return { session: newSession({ id: ctx.sessionId, now, classLevel, prior: sc.prior ?? null }), intake: intake.state, intakeOpen: intake.move };
}

/**
 * Round 4 (session-first): open a new segment on `topicId` inside this lesson (the state is re-pointed at its verified kit,
 * in place). false when the topic has no kit file (the switch offer stays as before).
 */
function sessionSwitchTo(s, topicId, purpose, now) {
  const kit = segmentKit(topicId);
  if (!kit) return false;
  const next = reinitForSegment(s, kit, now, { purpose, mode: "teach" });
  for (const k of Object.keys(s)) delete s[k];
  Object.assign(s, next);
  s.session = openSegment(s.session, { purpose, topicId, mode: "teach", why: [{ code: "switch", ref: topicId }] }, { kitHash: kit.hash, now });
  s.sessionNotes = priorNotes(s.session.prior, s.session.segments.at(-1));
  return true;
}

/** The kit a session segment pins (the verified file kit; a topic with none keeps the lesson's kit). */
const segmentKit = (topicId) => { const t = getTopic(topicId); return t ? kitFromFile(t) : null; };

/**
 * Round 4 (session-first): the lesson state re-pointed at a new segment's kit, in the SAME lesson. Everything the route or
 * the conversation added (brief, mode, the relationship, the Later list, prefs, affect, persona, talk, the turn counters)
 * is kept; the teaching state is fresh for the new kit (initLessonState). The per-turn kit loader (brain/rows.js kitFor)
 * reads state.topicId + state.kitHash from here on.
 */
export function reinitForSegment(s, kit, now, decision) {
  const t = getTopic(kit.topicId);
  const fresh = initLessonState({ topicId: kit.topicId, kit, ctx: { ...s.ctx, session: undefined, topicTitle: t?.title ?? s.ctx.topicTitle }, seed: s.seed, now, comp: null });
  const out = { ...fresh };
  for (const k of Object.keys(s)) if (!(k in fresh)) out[k] = s[k];
  for (const k of ["turn", "seq", "recent", "affect", "persona", "talk", "later", "prefs", "safeguard", "startedAt", "minutes", "lastBreakTurn", "vibe", "turnsSinceError", "probeSess"]) if (k in s) out[k] = s[k];
  out.session = s.session; out.intake = s.intake; delete out.intakeOpen;
  out.kitHash = kit.hash; out.kitVerified = kit.verified;
  out.purpose = "lesson";
  // the child's school position on the decided topic: a transfer start skips the hook (never a repeat of what they know)
  if (decision?.mode === "transfer") { out.teachPlan = []; out.phase = "practice"; out.introduced = kit.skills.map((sk) => sk.id); }
  if (decision?.mode === "revise") { out.teachPlan = out.teachPlan.filter((x) => x !== "hook"); }
  return out;
}

/**
 * Round 4 (session-first): the intake beat's move for this step, or null when the intake is over (the Director decides as
 * always). At most 3 child turns and 90 s (beat.js); the safety predicate pre-empts it (the classifier's distress flag goes
 * to decide()'s safeguard, unchanged). When the intake decides, the session opens its first segment: on another topic the
 * state is re-pointed at that topic's verified kit (reinitForSegment); the move is the one-line agenda, no item, no stage.
 */
/** Is this turn silence: no words, no chip, no answer, no activity (the duplex backstop commits "" with asrConfidence 0)? */
export const isSilentTurn = (input) => input?.event === "turn" && !input.branch && typeof input.text === "string" && !input.text.trim()
  && (input.cls?.source === "empty" || input.silent === true) && !input.chipId
  && (input.answer == null || input.answer === "") && !input.cls?.flags?.distress && !input.cls?.request && !input.cls?.help;

/**
 * Is this turn the child's speech the ear could not read (D5's duplex.unheard: an empty text, cls source "asr", see
 * brain/turn.js)? Not silence: she asks again. On an open safeguard check-in it counts as "no answer yet", as a silence does.
 */
export const isUnheardTurn = (input) => input?.event === "turn" && !input.branch && typeof input.text === "string" && !input.text.trim()
  && input.cls?.source === "asr" && !input.chipId && (input.answer == null || input.answer === "")
  && !input.cls?.flags?.distress && !input.cls?.request && !input.cls?.help;

/** The silence hold (round 5): the same step again, gently; never new content, never a new topic. */
function silentTurn(s, input, item) {
  // speech the ear could not read (D5 unheard) gets the same gentle ask-again, but is not a silence: it never counts toward
  // the "are you still there?" check
  const unheard = isUnheardTurn(input);
  if (!p5Flag("R4CONV") || !(isSilentTurn(input) || unheard) || s.phase === "done" || s.safeguard || ["wrap", "safeguard"].includes(s.lastMove?.kind)) return null;
  if (!unheard) s.quiet = (s.quiet ?? 0) + 1;
  const labels = chipLabels(s.ctx?.lang);
  if (!unheard && s.quiet >= 3) {
    s.quiet = 0;
    return { ...plan("break", SH.silenceCheck(), { chips: [{ id: "stop:continue", label: labels.go }, { id: "break:rest", label: labels.rest }, { id: "stop:end", label: labels.stop }] }), silent: true };
  }
  const again = unheard ? SH.unheardAgain() : SH.silenceAgain();
  // (v6.10, Learning D13: the unheard ask-again is the script's authored askAgain line — brain/say.js renders request "unheard")
  if (item) return { ...plan(moveKindFor(item), SH.pose({ item, prefix: again }), { item, probe: probeFor(item), chips: optionChips(item), ...(unheard && scriptOn() ? { request: "unheard" } : {}) }), silent: true };
  const last = s.lastMove;
  if (!last?.kind) return null;
  // the intake, a teaching step, a break: what she said last, again and simpler (never the next step)
  return { ...plan(last.kind, join(again, SH.sameStepAgain()), { ...(last.skillId ? { skillId: last.skillId } : {}), content: s.lastContent ?? [],
    ...(last.intake ? { intake: true } : {}), ...(s.lastUi?.chips?.length ? { chips: s.lastUi.chips } : {}) }), silent: true };
}

function sessionIntake(s, input, now) {
  if (!s.intake || s.intake.stage === "done" || input.branch || input.event === "module") return null;
  // a start that checks in first (decide(): `carried`) has no intake: the check-in, then the lesson
  if (input.event === "start" && input.carried) { s.intake = { ...s.intake, stage: "done" }; return null; }
  if (input.event === "start") return plan("intake", s.intakeOpen?.shape ?? "", { chips: s.intakeOpen?.chips, intake: true });
  if (input.cls?.flags?.distress || s.safeguard) { s.intake = { ...s.intake, stage: "done" }; return null; }
  const prior = s.session?.prior ?? {};
  const statusOf = (id) => { const t = getTopic(id); if (!t) return "unseen"; const own = Object.values(s.skills ?? {}).filter((x) => String(x.skillId ?? "").startsWith(`${id}-`)); return own.length ? (own.every((x) => x.status === "mastered") ? "mastered" : own.some((x) => x.attempts >= 3 && x.pKnown < 0.4) ? "weak" : "in_progress") : "unseen"; };
  let r = intakeStep(s.intake, { text: input.text ?? input.answer ?? "", chipId: input.chipId, now, kitFor: input.kitFor ?? segmentKit, statusOf, prior, explore: !!input.explore });
  // a confirm reply code cannot grade: the classifier's label when the lesson's own kit is the candidate's, else no evidence
  // (the grade only moves the segment's mode, never its topic)
  if (r.needsGrade) r = intakeStep(r.state, { graded: input.kit?.topicId === r.state.pick?.topicId ? (input.cls?.outcome ?? "no_evidence") : "no_evidence", now, kitFor: input.kitFor ?? segmentKit, statusOf, prior });
  s.intake = r.state;
  if (!r.done) {
    const ask = r.move?.item ? promptFor(r.move.item, s.ctx.lang) : null;
    return plan(r.move.kind, r.move.shape, { intake: true, ...(ask ? { ask } : {}) });
  }
  const d = r.decision;
  if (d.purpose === "safeguard") return null; // decide() owns the safeguard (the predicate already fired in the words)
  let next = s;
  const kit = d.topicId ? segmentKit(d.mode === "foundation_first" && d.foundation ? d.foundation : d.topicId) : null;
  if (kit && kit.topicId !== s.topicId) {
    next = reinitForSegment(s, kit, now, d);
    for (const k of Object.keys(s)) delete s[k];
    Object.assign(s, next);
  } else if (kit) { s.kitHash = s.kitHash ?? kit.hash; }
  s.session = openSegment(s.session, d, { kitHash: kit?.hash ?? s.kitHash ?? null, now });
  s.sessionNotes = priorNotes(s.session.prior, s.session.segments.at(-1));
  return plan("intake_agenda", r.move.shape, { intake: true, segment: { n: s.session.segments.length, topicId: s.topicId, purpose: d.purpose, mode: d.mode } });
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
// r5 QA pass 12 (14.3): the chips are the CHILD's words, so they are in the child's language (a Hindi or class-4 Hinglish child
// was offered "Carry on" / "Stop for today" on the check-in). The stop label keeps "bas" / "aaj ke liye" so the stop reading
// and the harnesses that find the stop chip by its words still hold; the ids are what the Director reads.
const CHIP_LABELS = Object.freeze({
  english: { easier: "An easier one", rest: "Short break", go: "Keep going", cont: "Carry on", stop: "Stop for today", back: "Back to the lesson",
    visual: "Show me a picture", story: "Tell it as a story", game: "Play a game" },
  hinglish: { easier: "Thoda aasaan wala", rest: "Chhota break", go: "Aage chalte hain", cont: "Aage padhte hain", stop: "Aaj ke liye bas", back: "Lesson par wapas",
    visual: "Picture dikhao", story: "Kahani mein batao", game: "Game khelte hain" },
  hindi: { easier: "थोड़ा आसान वाला", rest: "छोटा ब्रेक", go: "आगे चलते हैं", cont: "आगे पढ़ते हैं", stop: "आज के लिए बस", back: "पाठ पर वापस",
    visual: "तस्वीर दिखाओ", story: "कहानी में बताओ", game: "गेम खेलते हैं" },
});
export function chipLabels(lang) {
  return CHIP_LABELS[lang] ?? CHIP_LABELS.english;
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

// ───────────── round 7 A4: the per-skill arc (PIPELINE §A Brain item 2; kill switch TAXILA_R7_SKILL_ARC=off) ─────────────
export const skillArcOn = (env = process.env) => !/^(off|0|false)$/i.test(String(env.TAXILA_R7_SKILL_ARC ?? ""));
/** Items of one skill posed in a row before the next skill is taught (its block), unless the skill settles sooner. */
export const ARC_BLOCK = 3;
/**
 * A skill's worked example from the kit's OWN verified items (its anchor numbers, never invented ones): the easiest
 * practice item of that skill other than `exceptId`, solved with its hint steps and its key. null when the skill has none
 * with at least two statement steps (the explain alone then leads into its check).
 */
export function skillWorkedExample(s, kit, skillId, exceptId) {
  const used = new Set([...(s.itemsDone ?? []), ...(s.skipped ?? []), ...(s.shownIds ?? []), exceptId, ...(s.queue ?? []).slice(0, 1)]);
  const cands = kit.items.filter((i) => i.skillId === skillId && !used.has(i.id) && ["practice", "near_transfer"].includes(i.kind) && !i.diagnostic && i.answer)
    .map((i) => ({ i, steps: (i.hints ?? []).map((h) => String(h).replace(/\s+/g, " ").trim()).filter((h) => h && !/[?？]\s*$/.test(h)).slice(0, 4) }))
    .filter((x) => x.steps.length >= 2)
    .sort((a, b) => (a.i.difficulty ?? 0) - (b.i.difficulty ?? 0));
  const c = cands[0];
  return c ? { itemId: c.i.id, problem: c.i.prompt_en || c.i.prompt_hi, steps: c.steps, answer: String(c.i.answer) } : null;
}
// ───────────── round 7 T2 (dc-r7-teaching-scripts): the Director walks the lesson script ─────────────
// A skill with a validated script (director/script.js) is taught beat by beat: the move IS the next beat (hook, each explain
// beat with its board, the full worked example, each keyed check as the card), then the script's ladder of the kit's own
// items; a wrong check gets that misconception's remediation and its keyed follow-up. The reply model only renders the beat.
// A skill without one keeps the kit path. Kill switch TAXILA_R7_SCRIPT=off.
/** Start walking a skill's script (once per skill per lesson). false: no walkable script. */
function walkStart(s, kit, skillId, { hook = false } = {}) {
  if (!scriptOn() || (s.walked ?? []).includes(skillId)) return false;
  const sk = skillScriptOf(kit, skillId);
  if (!sk) return false;
  const prev = s.walked?.length ? skillScriptOf(kit, s.walked.at(-1)) : null;
  s.walked = [...(s.walked ?? []), skillId];
  const kb = knowsBeats(s, kit, sk, { hook }); // round 8 K1/K2/K3: the plan's beats, check order and ladder (null: no plan)
  s.walk = { skillId, beats: kb?.beats ?? walkBeats(sk, { hook }), i: 0, ladder: kb?.ladder ?? (sk.ladder ?? []).map((r) => r.itemId), ...(kb?.compress ? { compress: kb.compress } : {}), ...(prev?.bridgeToNext ? { bridge: prev.bridgeToNext, ...(prev.bridgeBoard ? { bridgeBoard: prev.bridgeBoard } : {}) } : {}) };
  // (the S3 card bridge would say it again on its first check)
  if (oneLiveOn()) s.lastCardSkill = skillId;
  return true;
}
/** The walk's next beat as a plan; null when its beats are done (the ladder then poses). */
function walkNext(s, input, prefix) {
  const { kit } = input;
  const w = s.walk;
  const sk = w ? skillScriptOf(kit, w.skillId) : null;
  if (!sk) { s.walk = undefined; return null; }
  if (sk.explain?.[0]?.ask) return walkNextV2(s, input, prefix, sk);
  const skillId = w.skillId;
  // (Studio, director6 #1: a check drawing its OWN board says so — ownBoard — so every number it authors is drawn; a check that
  // borrows its explain beat's board frees only its mark labels, since that board can teach the check's key)
  const ref = (kind, beatId, board, item = null) => ({ scriptBeat: { scriptId: scriptIdOf(kit), skillId, beatId, kind, ...(board ? { board } : {}), ...(kind === "check" && board ? { ownBoard: true } : {}), ...answersOf(item) } });
  while (w.i < w.beats.length) {
    const [kind, id] = w.beats[w.i].split(":");
    w.i += 1;
    if (!s.introduced.includes(skillId)) s.introduced.push(skillId);
    if (skillArcOn()) s.arcSkill = skillId;
    const bridge = w.bridge && kind !== "check" ? w.bridge : null;
    if (bridge) delete w.bridge;
    const bridgeLine = bridge ? [`bridge from what they just did: ${bridge}`] : [];
    if (kind === "hook") {
      const interest = interestFor(kit, s.ctx.interests, 0);
      return plan("hook", join(prefix, SH.scriptHook({ bridge: !!bridge })), { format: "F4", content: [...bridgeLine, `hook: ${sk.hook.convey}`,
        `their world: ${sk.hook.slotUse}; e.g. ${interest ?? sk.hook.interestSlots[0]}`], ...ref("hook", "hook") });
    }
    if (kind === "explain") {
      const b = sk.explain.find((x) => x.id === id);
      if (!b) continue;
      return plan("explain", join(prefix, SH.scriptExplain({ bridge: !!bridge, board: !!b.board })), { skillId, format: formatFor(s, kit, skillId),
        content: [...bridgeLine, `the idea: ${b.convey}`, ...(b.point ? [`on the board, point at: ${b.point}`] : []),
          ...(b.terms?.length ? [`words: ${b.terms.join(", ")}`] : [])], ...ref("explain", b.id, b.board) });
    }
    if (kind === "worked") {
      const we = sk.workedExample;
      const lines = workedCodeOn() ? scriptWorkedLines(we, s.ctx.lang) : null;
      return plan("worked_example", join(prefix, SH.scriptWorked()), { skillId, format: "F2", stuck: true,
        content: [...bridgeLine, `worked example: ${we.problem}`, `find: ${we.find}`, `steps: ${we.steps.map((x) => `${x.do} → ${x.result}`).join("; ")}`,
          `answer: ${we.answer}`, `why it is right: ${we.why}`],
        whiteboard: { kind: "math", value: clip(we.problem) }, ...(lines ? { rendered: lines } : {}), ...ref("worked", "worked", we.board) });
    }
    if (kind === "check") {
      const c = sk.checks.find((x) => x.id === id);
      if (!c) continue;
      const item = scriptCheckItem(skillId, c);
      if (s.itemsDone.includes(item.id) || s.skipped.includes(item.id)) continue;
      s.scriptCard = item; s.phase = "practice";
      activate(s, item);
      return plan("practice", SH.pose({ item, prefix }), { item, probe: probeFor(item), ...ref("check", c.id, c.board, item) });
    }
  }
  return null;
}
// v2.1 {friend}: a card character is a friend's name, never the child's (script.js fillFriend). The walk's spoken fields and
// cards go through these (a module-level child name, set per step: the walk is synchronous)
let friendOf = "";
const saidIn = (x, lang) => { const t = saidIn0(x, lang); return t == null ? t : fillFriend(t, friendOf); };
const friendly = (item) => {
  if (!item) return item;
  const f = (x) => fillFriend(x, friendOf);
  // (Learning, c5-t02: the friend can be a card's key or its listed wrong pick, so graded fields are filled with the same name)
  const meta = (m) => (m && m.wrongIfMis ? { ...m, wrongIfMis: f(m.wrongIfMis) } : m);
  return { ...item, prompt_en: f(item.prompt_en), prompt_hi: f(item.prompt_hi), answer: f(item.answer), acceptable: (item.acceptable ?? []).map(f),
    ...(item.scriptAsk ? { scriptAsk: meta(item.scriptAsk) } : {}), ...(item.scriptCheck ? { scriptCheck: meta(item.scriptCheck) } : {}), ...(item.scriptThen ? { scriptThen: meta(item.scriptThen) } : {}) };
};
// ───────────── dc-r7-script-walk-v2: a beat is DONE, not shown (R1-R3) ─────────────
// v2 beats teach and ask: each explain beat poses its keyed micro-question as the card, and the walk moves on only when that
// card is answered right (or its remediation's follow-up is through). A diversion never uses a beat up: the card stays and is
// re-posed (R2). "pata nahi", or a line that left out the beat's must-say words, re-teaches the SAME beat smaller, once (R1).
// While a skill is walked no kit item, kit re-teach or kit worked example speaks (R3; afterMiss / practice / helpMove).
/** The hook's world: the child's interest when a slot uses it, else the first slot (F4: the greet promises only these). */
export function hookSlot(sk, interests = []) {
  const slots = sk?.hook?.interestSlots ?? [];
  const mine = new Set((interests ?? []).map((x) => String(x).toLowerCase()));
  return slots.find((x) => mine.has(String(x?.interest).toLowerCase())) ?? slots[0] ?? null;
}
function walkNextV2(s, input, prefix, sk) {
  const { kit } = input;
  friendOf = s.ctx.firstName ?? "";
  // v6.4 K1: a card a remediation took over comes back once its follow-up card is closed (answered or let go); a miss on it
  // then gives up with its key and why (afterMiss), so every posed card ends with its key said
  {
    const done = (id) => s.itemsDone.includes(id) || s.skipped.includes(id);
    const rp = (s.reposeQ ?? []).find((r) => done(r.after) && s.activeItemId !== r.after);
    if (rp) {
      s.reposeQ = (s.reposeQ ?? []).filter((r) => r !== rp);
      s.skipped = s.skipped.filter((x) => x !== rp.id);
      s.reposed = [...(s.reposed ?? []), rp.id];
      s.scriptCard = rp.item; s.phase = "practice";
      activate(s, rp.item);
      const beat = cardBeatRef(s, kit, rp.item);
      return plan(moveKindFor(rp.item), SH.pose({ item: rp.item, prefix: SH.reposeAfterRemedy() }), { item: rp.item, probe: probeFor(rp.item), chips: optionChips(rp.item), reposed: true,
        ...(beat ? { scriptBeat: beat } : {}) });
    }
  }
  const w = s.walk;
  const skillId = w.skillId;
  const lang = s.ctx.lang ?? "hinglish";
  // (Studio, director6 #1: a check drawing its OWN board says so — ownBoard — so every number it authors is drawn; a check that
  // borrows its explain beat's board frees only its mark labels, since that board can teach the check's key)
  const ref = (kind, beatId, board, item = null) => ({ scriptBeat: { scriptId: scriptIdOf(kit), skillId, beatId, kind, ...(board ? { board } : {}), ...(kind === "check" && board ? { ownBoard: true } : {}), ...answersOf(item) } });
  const gone = (id) => s.itemsDone.includes(id) || s.skipped.includes(id);
  // the worked example's answer and why, said in code on the move after their step (once)
  const gaveWorked = () => {
    if (w.sayWorked === false || w.sayWorked == null) return {};
    const fresh = w.sayWorked === s.turn || w.sayWorked === true;
    w.sayWorked = false;
    if (!fresh) return {};
    const we = sk.workedExample;
    const answer = saidIn(we.answer, lang), why = saidIn(we.why, lang);
    return answer ? { workedDone: { answer, why: why ?? "" } } : {};
  };
  let hookLead = null;
  while (w.i < w.beats.length) {
    const [kind, id] = w.beats[w.i].split(":");
    if (!s.introduced.includes(skillId)) s.introduced.push(skillId);
    if (skillArcOn()) s.arcSkill = skillId;
    // v5 B4 (director7: 0 bridges spoken): the authored bridge is said by code at the skill change (sayFirst), whatever beat
    // the new skill opens on; the hook's interest line likewise
    const bridge = w.bridge ? saidIn(w.bridge, lang) ?? null : null;
    // v6: a bridge Learning gave its own board (SkillScriptV2.bridgeBoard) is its own segment on that board (brain/propose.js)
    // v6.3 P1 (main, director11 c6 steering T48: a lone bridge said over the last card's board): a bridge with no board of its own
    // is drawn on the board of the beat it leads into (the new skill's hook, explain beat or worked example)
    const intoBoard = kind === "hook" ? sk.hook?.board ?? sk.explain?.[0]?.board ?? null : kind === "explain" ? sk.explain?.find((x) => x.id === id)?.board ?? null
      : kind === "worked" ? sk.workedExample?.board ?? null : null;
    const bridgeBoard = w.bridgeBoard ?? intoBoard;
    // (Brain 044 T8: scriptBoard — the board is the script's own bridgeBoard, not the board of the unit the bridge leads into)
    const bridgeBeat = bridge && bridgeBoard ? { bridgeBeat: { scriptId: scriptIdOf(kit), skillId, beatId: "bridge", kind: "bridge", board: bridgeBoard, ...(w.bridgeBoard ? { scriptBoard: true } : {}) } } : {};
    if (bridge) { delete w.bridge; delete w.bridgeBoard; }
    const bridgeLine = bridge ? [`bridge from what they just did: ${bridge}`] : [];
    const sayFirst = bridge ? { sayFirst: [bridge], bridgeSaid: bridge, ...bridgeBeat } : {};
    if (kind === "hook") {
      w.i += 1;
      const ks = knowsHookSlot(s, sk); // round 8 K6: the plan's slot (undefined: no plan)
      const slot = ks !== undefined ? ks : hookSlot(sk, s.ctx.interests);
      const use = saidIn(slot?.use, lang);
      // (dc-r8-director26 C1, main's ruling change 1: the hook never ends on a comprehension check-in. The hook and the first point share a
      // turn when the two fit in 75 words — with the script's greetSimpler when it is due, and her check-in or the point's card at the end;
      // the explain branch below says the hook first. When they do not fit the hook ends on its check-in as before: no script gives the
      // first point a lead-in the child could answer. A request at the greeting is answered by greetSimpler and the hook, on the hook's own
      // turn, as before — the request's answer stays on its part)
      const [k1, id1] = String(w.beats[w.i] ?? "").split(":");
      const b1 = k1 === "explain" ? sk.explain.find((x) => x.id === id1) : null;
      const it1 = b1 ? friendly(scriptAskItem(skillId, b1.id, b1.ask)) : null;
      const p1 = b1 ? saidIn(b1.point, lang) : null;
      // (dc-r8-director27 P6.1: after a request at the greeting the hook is said with the first point as on the ordinary path — greetSimpler
      // first, its words counted — c4 row 2 in all four lessons; c5-t01 stuck 2, steering 2; c6 stuck 2, steering 2: the hook alone)
      const gsDue = greetSimplerDue(s.lastMove, input) ? saidIn(scriptFor(kit)?.script?.greetSimpler, lang) : null;
      // (dc-r8-director27 Brain 042: where the first point's card would not fit with the hook and the point, the turn ends on the point's quick
      // question in the check-in's place — it fits in 75 words with them, or the hook is said on its own turn and the point comes with its card;
      // never the hook and the point ending on a check-in before the waiting card)
      const q1 = b1?.quick?.prompt ? saidIn(b1.quick.prompt, lang) : null;
      const it1w = it1 ? wordsIn(saidIn(b1.ask?.prompt, lang) ?? "") : 0;
      const lead1 = (gsDue ? wordsIn(gsDue) : 0) + walkLeadWords(input, lang, s.lastMove);
      const endW = q1 && wordsIn(use, p1) + it1w + lead1 > L2_CAP ? wordsIn(q1) : 4;
      // (dc-r8-director28 Brain 044 T1: after a request at the greeting, the greeting's simpler wording is its own turn and ends on its check-in;
      // the hook waits for the next turn)
      if (gsDue && String(gsDue).trim() && !scriptFor(kit)?.script?.recordedRun) {
        w.i -= 1;
        // (it ends on the greeting's own question, asked again — the last question of her greeting)
        const greetQ = String([...(s.recent ?? [])].find((t) => t.who === "teacher")?.text ?? "").split(/(?<=[.!?\u0964])\s+/).filter((x) => /[?？]\s*$/.test(x)).at(-1) ?? null;
        return plan("hook", join(prefix, SH.scriptHook({ bridge: false })), { format: "F4", content: [`today: ${gsDue}`], sayFirst: [String(gsDue).trim()], greetHelp: true, ...(greetQ ? { greetAsk: greetQ } : { stayCheckin: true, checkinOk: true }), ...ref("hook", "hook") });
      }
      // (Brain 044 T1: the hook never ends a turn — the hook, the first point and its card are one turn; where they do not fit, the point's quick
      // question or its check-in ends it, counted as not fitting)
      if (!bridge && use && p1 && it1 && !gone(it1.id) && w.smaller !== b1.id && !scriptFor(kit)?.script?.recordedRun) { hookLead = [use]; continue; }
      return plan("hook", join(prefix, SH.scriptHook({ bridge: !!bridge })), { format: "F4", content: [...bridgeLine, `hook: ${sk.hook.convey}`, ...(use ? [`their world: ${use}`] : [])], ...ref("hook", "hook"),
        ...([bridge, use].some(Boolean) ? { sayFirst: [bridge, use].filter(Boolean) } : {}), ...(bridge ? { bridgeSaid: bridge, ...bridgeBeat } : {}) });
    }
    if (kind === "explain") {
      const b = sk.explain.find((x) => x.id === id);
      const item = b ? friendly(scriptAskItem(skillId, b.id, b.ask)) : null;
      if (!item || gone(item.id)) { w.i += 1; continue; }
      const smaller = w.smaller === b.id;
      const must = (b.mustSay ?? []).map((m) => saidIn(m, lang)).filter(Boolean);
      const point = saidIn(b.point, lang);
      s.scriptCard = item; s.phase = "practice";
      activate(s, item);
      return plan("explain", join(prefix, SH.scriptExplainV2({ bridge: !!bridge, board: !!b.board, smaller })), { item, probe: probeFor(item), skillId, format: formatFor(s, kit, skillId),
        content: [...bridgeLine, `the idea: ${b.convey}`, ...(must.length ? [`say these words as they are: ${must.join(", ")}`] : []), ...(point ? [`on the board, point at: ${point}`] : [])],
        mustSay: must, ...(point ? { point } : {}), ...(smaller && s.lastMove?.scriptBeat?.beatId === b.id ? { smaller: true, ...(saidIn(b.simpler, lang) ? { simpler: saidIn(b.simpler, lang) } : {}) } : {}), ...ref("explain", b.id, b.board, item), ...gaveWorked(), ...sayFirst,
        ...(hookLead ? { sayFirst: hookLead, hookSaid: true } : {}) });
    }
    if (kind === "worked") {
      const we = sk.workedExample;
      const item = friendly(scriptAskItem(skillId, "worked", we.yourStep));
      // (v3 K2: the worked answer and why are said on the move right after their step, and only when they missed it)
      // (v4 W2: after their step, right or not, the worked answer and its why are said: "Toh poora jawab: …")
      if (gone(item.id)) { w.i += 1; w.sayWorked = s.turn; continue; }
      // (dc-r8-director27 Brain 042 Q2: a worked example with an asked step is done with the child — workedSegment)
      { const seg = workedSegment(s, input, { we, item, skillId, lang, ref, sayFirst, bridgeLine, prefix }); if (seg) return seg; }
      // v3 V1: the worked example across turns: the problem (what is given, what to find) first, then its steps and their step
      if (!w.workedPosed) {
        w.workedPosed = true;
        // (v6.7 R4, main on director15: "Diya hai … Dhoondhna hai …" after the problem was the main monologue in every topic — the
        // problem is stated once; a recorded run keeps what it walked)
        const recital = !!scriptFor(kit)?.script?.recordedRun;
        const problem = [saidIn(we.problem, lang), recital && (we.givens ?? []).length ? `${lang === "english" ? "Given" : "Diya hai"}: ${(we.givens ?? []).map((g) => saidIn(g, lang)).filter(Boolean).join(", ")}` : null,
          recital && saidIn(we.find, lang) ? `${lang === "english" ? "We find" : "Dhoondhna hai"}: ${saidIn(we.find, lang)}` : null].filter(Boolean).map((x) => (/[.!?।]$/.test(x.trim()) ? x.trim() : `${x.trim()}.`));
        // (dc-r8-director26 C1, main's ruling change 4: the problem and the first told step share a turn when the two fit in 75 words with
        // her check-in; a verdict and the beforeWorked joint before them stay when all of it fits, else breakL2 ends them on their own turn.
        // A worked example of one told step: that step is also the last, so the problem, the step and the child's own step share the turn
        // when they fit — else the problem alone, and the step with the child's step next)
        const steps0 = recital ? [] : (we.steps ?? []).map((st) => scriptWorkedStepLine(st, lang)).filter(Boolean);
        const card0 = saidIn(we.yourStep?.prompt, lang);
        // (help's go-on line said before this turn counts: input.helpLeadWords)
        const lead0 = walkLeadWords(input, lang, s.lastMove);
        // (a problem written as a question keeps the child's own step for another turn: one question a turn — askAndCard)
        if (steps0.length === 1 && card0 && !/[?？]\s*$/.test(problem.at(-1) ?? "") && wordsIn(problem, steps0[0], card0) + lead0 + 3 <= L2_CAP) {
          w.workedStep = 1;
          s.scriptCard = item; s.phase = "practice";
          activate(s, item);
          return plan("worked_example", join(prefix, SH.scriptWorkedV2()), { item, probe: probeFor(item), skillId, format: "F2",
            content: [...bridgeLine, `worked example: ${saidIn(we.problem, lang) ?? ""}`, `what we find: ${saidIn(we.find, lang) ?? ""}`],
            whiteboard: { kind: "math", value: clip(saidIn(we.problem, lang) ?? "") }, rendered: [...problem, steps0[0]], problemLines: problem.length, stepFrom: 1, ...ref("worked", "worked", we.board), ...sayFirst });
        }
        if (steps0.length > 1 && wordsIn(problem, steps0[0]) + lead0 + 4 <= L2_CAP) {
          w.workedStep = 1;
          return plan("worked_example", join(prefix, SH.scriptWorkedProblem()), { skillId, format: "F2", stuck: true,
            content: [...bridgeLine, `worked example: ${saidIn(we.problem, lang) ?? ""}`, `step 1 of ${steps0.length}`], whiteboard: { kind: "math", value: clip(saidIn(we.problem, lang) ?? "") },
            rendered: [...problem, steps0[0]], problemLines: problem.length, stepFrom: 1, ...ref("worked", "worked:step1", we.board), ...sayFirst });
        }
        return plan("worked_example", join(prefix, SH.scriptWorkedProblem()), { skillId, format: "F2", stuck: true,
          content: [...bridgeLine, `worked example: ${saidIn(we.problem, lang) ?? ""}`], whiteboard: { kind: "math", value: clip(saidIn(we.problem, lang) ?? "") },
          rendered: problem, ...ref("worked", "worked:problem", we.board), ...sayFirst });
      }
      // v6 R3: "pata nahi" / "samajh nahi aaya" to a step just shown is that step again, smaller, once (never the next one)
      const ws = w.workedStep ?? 0;
      if (ws > 0 && ws !== Number.MAX_SAFE_INTEGER && s.lastMove?.scriptBeat?.beatId === `worked:step${ws}` && w.smallerStep !== ws - 1
        && (stuckTurn(input?.cls) || readIntent(String(input?.text ?? ""))?.type === "confused" || (s.lastMove?.checkinOk && notYes(input?.text)))) { w.workedStep = ws - 1; w.smallerStep = ws - 1; }
      // v4 W2 (director6: steps glued into one block, the givens re-read): each step is its own turn, do → result → why
      const steps = (we.steps ?? []).map((st) => scriptWorkedStepLine(st, lang)).filter(Boolean);
      if ((w.workedStep ?? 0) < steps.length) {
        const k = w.workedStep ?? 0;
        w.workedStep = k + 1;
        // v6 R3: a step they did not follow is said again smaller (its reason first, then the step), once
        const small = w.smallerStep === k ? scriptWorkedStepSmaller(we.steps[k], lang) : null;
        // (dc-r8-director26 C1 item 1: two told steps a turn where the two fit in 75 words with her step frame and the check-in — one
        // check-in at the end of the turn, not one per step. A step said again smaller is said alone; a recorded run walks as it walked)
        const wc = (t) => String(t ?? "").split(/\s+/).filter(Boolean).length;
        const recorded = !!scriptFor(kit)?.script?.recordedRun;
        let two = !small && k + 1 < steps.length && w.smallerStep !== k + 1 && !recorded && wc(steps[k]) + wc(steps[k + 1]) + 3 + 3 + 4 + walkLeadWords(input, lang, s.lastMove) <= L2_CAP;
        // (dc-r8-director26 C1, main's ruling change 4: the turn that holds the last told step holds the child's own step too, so it ends on a
        // real question, not a check-in — when the step or two left and that card fit in 75 words (her line adds no frame: the steps' own
        // words open it). When two steps and the card do not fit, the step before the last is said alone and the last comes with the card.
        // A step said again smaller is help: said alone, as before)
        const card1 = saidIn(we.yourStep?.prompt, lang);
        const lead1 = walkLeadWords(input, lang, s.lastMove);
        const rest = steps.length - k;
        const fitsCard = (n) => !small && !recorded && !!card1 && wc(steps.slice(k, k + n).join(" ")) + wc(card1) + lead1 + 2 <= L2_CAP;
        const n = rest <= 2 && fitsCard(rest) ? rest : 0;
        if (!n && two && rest === 2 && !!card1 && wc(steps[k + 1]) + wc(card1) + lead1 + 2 <= L2_CAP) two = false;
        if (n) {
          w.workedStep = k + n;
          s.scriptCard = item; s.phase = "practice";
          activate(s, item);
          return plan("worked_example", join(prefix, SH.scriptWorkedV2()), { item, probe: probeFor(item), skillId, format: "F2",
            content: [...bridgeLine, `worked example: ${saidIn(we.problem, lang) ?? ""}`, n > 1 ? `steps ${k + 1} to ${k + n} of ${steps.length}` : `step ${k + 1} of ${steps.length}`, `what we find: ${saidIn(we.find, lang) ?? ""}`],
            whiteboard: { kind: "math", value: clip(saidIn(we.problem, lang) ?? "") }, rendered: steps.slice(k, k + n), stepFrom: k + 1, ...ref("worked", "worked", we.board) });
        }
        if (two) w.workedStep = k + 2;
        return plan("worked_example", join(prefix, SH.scriptWorkedV2()), { skillId, format: "F2", stuck: true,
          content: [...bridgeLine, `worked example: ${saidIn(we.problem, lang) ?? ""}`, two ? `steps ${k + 1} and ${k + 2} of ${steps.length}` : `step ${k + 1} of ${steps.length}`],
          whiteboard: { kind: "math", value: clip(saidIn(we.problem, lang) ?? "") }, rendered: two ? [steps[k], steps[k + 1]] : [small ?? steps[k]], ...(small ? { smaller: true } : {}),
          ...(two ? { stepFrom: k + 1 } : {}), ...ref("worked", `worked:step${two ? k + 2 : k + 1}`, we.board) });
      }
      s.scriptCard = item; s.phase = "practice";
      activate(s, item);
      return plan("worked_example", join(prefix, SH.scriptWorkedV2()), { item, probe: probeFor(item), skillId, format: "F2",
        content: [...bridgeLine, `worked example: ${saidIn(we.problem, lang) ?? ""}`, `what we find: ${saidIn(we.find, lang) ?? ""}`],
        whiteboard: { kind: "math", value: clip(saidIn(we.problem, lang) ?? "") }, ...ref("worked", "worked", we.board) });
    }
    if (kind === "check") {
      const c = sk.checks.find((x) => x.id === id);
      if (!c) { w.i += 1; continue; }
      const item = knowsMark(s, friendly(scriptCheckItem(skillId, c))); // round 8: the ledger's recheck / probeFor marks
      if (gone(item.id)) { w.i += 1; continue; }
      s.scriptCard = item; s.phase = "practice";
      activate(s, item);
      const ks = knowsSayFirst(s, lang); // round 8 allKnown: she says she is skipping what they know (once)
      return plan("practice", SH.pose({ item, prefix }), { item, probe: probeFor(item), ...ref("check", c.id, c.board, item), ...gaveWorked(), ...sayFirst, ...(ks.length ? { sayFirst: [...(sayFirst.sayFirst ?? []), ...ks] } : {}) });
    }
    w.i += 1;
  }
  return null;
}
// ───────────── dc-r8-director27, Brain 042 Q2: a worked example done with the child ─────────────
// A worked example whose script asks at least one step (`steps[].ask`) is a run of segments, each ending on a question: an asked step's
// `ask.prompt`, or the child's own step. Told steps without an `ask` are said with what follows them; the problem is said with what follows
// it up to the first question. An asked step answered right gets `ask.right`, then on; anything else gets the step told as today (its do,
// result and why), then on; help said on it (a clarify: the step's simpler) is its telling. No hint ladder on an asked step, and no turn of
// the worked example ends on a step check-in. A worked example with no asked step walks as before.
/** Whether a worked example asks any step. */
const asksSteps = (we) => (we?.steps ?? []).some((st) => st?.ask?.prompt && st.ask.key != null && String(st.ask.key).trim());
/** The next segment of an asked worked example, as a plan; null when this worked example has no asked step (the old walk). */
function workedSegment(s, input, { we, item, skillId, lang, ref, sayFirst, bridgeLine, prefix = "" }) {
  const { kit } = input;
  const w = s.walk;
  if (!asksSteps(we) || scriptFor(kit)?.script?.recordedRun) return null;
  const steps = we.steps ?? [];
  const lead = [];
  let problemLines = 0, stepFrom = (w.workedStep ?? 0) + 1, stepReply = null, stepMissSaid = null;
  if (!w.workedPosed) {
    w.workedPosed = true; w.workedStep = 0;
    const problem = [saidIn(we.problem, lang)].filter(Boolean).map((x) => (/[.!?।]$/.test(x.trim()) ? x.trim() : `${x.trim()}.`));
    lead.push(...problem); problemLines = problem.length; stepFrom = 1;
  } else if (w.stepAsk) {
    // (the child's line on the asked step: read by the card's reader against its key — step() kept the reading, s.stepRead)
    const k = w.stepAsk.step;
    w.stepAsk = undefined;
    const read = s.stepRead && s.stepRead.step === k && s.stepRead.skillId === skillId ? s.stepRead : null;
    s.stepRead = undefined;
    const helped = !!s.lastMove?.help?.rung && String(s.lastMove.help.part ?? "") === `${skillId}:worked:step${k + 1}`;
    const right = !helped && read?.outcome === "correct";
    const st = steps[k];
    const line = helped ? null : right ? saidIn(st.ask.right, lang) : scriptWorkedStepLine(st, lang);
    // (dc-r8-director28 Brain 044 T7: a wrong answer to the asked step hears a stepMiss form — the script's, else code's — before the step is told)
    const wrong = !helped && !right && ["incorrect", "partial", "misconception"].includes(String(read?.outcome ?? ""));
    const miss = wrong && line && !scriptFor(kit)?.script?.recordedRun ? helpJoint(scriptFor(kit)?.script, "stepMiss", { lang, lessonKey: s.ctx?.lessonKey ?? s.ctx?.sessionId ?? s.lessonId ?? null, n: s.helpJointN?.stepMiss ?? 0 }) : null;
    if (miss?.text) { s.helpJointN = { ...(s.helpJointN ?? {}), stepMiss: (s.helpJointN?.stepMiss ?? 0) + 1 }; stepMissSaid = miss.text; }
    if (line) lead.push(fillFriend(`${miss?.text ? `${miss.text} ` : ""}${String(line).replace(/\s+/g, " ").trim()}`, friendOf));
    w.workedStep = k + 1; stepFrom = k + 1;
    stepReply = { skillId, step: k, right, told: !right && !helped, ...(helped ? { helped: true } : {}), ...(stepMissSaid ? { miss: stepMissSaid } : {}), ...(right && line ? { line: fillFriend(String(line).replace(/\s+/g, " ").trim(), friendOf) } : {}) };
    s.beatEvidence = [...(s.beatEvidence ?? []), { kind: "stepAsk", skillId, beatId: `worked:step${k + 1}`, said: read?.said ?? null, right, read: read?.outcome ?? null, turn: s.turn }].slice(-60);
    if (helped) stepFrom = k + 2;
  }
  // the told steps up to the next question
  let j = w.workedStep ?? 0;
  const told = [];
  while (j < steps.length && !(steps[j]?.ask?.prompt && steps[j].ask.key != null)) { const l = scriptWorkedStepLine(steps[j], lang); if (l) told.push(l); j++; }
  const rendered = [...lead, ...told];
  const base = { skillId, format: "F2", content: [...bridgeLine, `worked example: ${saidIn(we.problem, lang) ?? ""}`, `what we find: ${saidIn(we.find, lang) ?? ""}`],
    whiteboard: { kind: "math", value: clip(saidIn(we.problem, lang) ?? "") }, ...(rendered.length ? { rendered, stepFrom } : {}), ...(problemLines ? { problemLines } : {}),
    ...(stepReply ? { stepReply } : {}), ...sayFirst };
  if (j < steps.length) {
    const a = steps[j].ask;
    const prompt = fillFriend(String(saidIn(a.prompt, lang) ?? "").replace(/\s+/g, " ").trim(), friendOf);
    w.workedStep = j; w.stepAsk = { step: j };
    const qi = friendly(scriptStepAskItem(skillId, j, a));
    s.quickItem = qi; s.activeItemId = qi.id;
    return plan("worked_example", join(prefix, SH.scriptWorkedV2()), { ...base, stuck: true, stepAsk: { skillId, step: j, prompt }, ...ref("worked", `worked:step${j + 1}`, we.board) });
  }
  // the child's own step
  w.workedStep = steps.length;
  s.scriptCard = item; s.phase = "practice";
  activate(s, item);
  return plan("worked_example", join(prefix, SH.scriptWorkedV2()), { ...base, item, probe: probeFor(item), ...ref("worked", "worked", we.board) });
}
/** Whether a move is a segment of an asked worked example (its told lines and its question: an asked step, or the child's own step). */
const segmentMove = (move, ui, kit) => !!move?.stepAsk || (move?.kind === "worked_example" && !!move.rendered?.length && /:ask:worked$/.test(String(ui?.ask?.itemId ?? ""))
  && asksSteps(skillScriptOf(kit, move.skillId)?.workedExample));
/** A segment's turn: said whole with its question. Where what leads it — a verdict and its why, a bridge, a held part, her reply to an aside or
 *  her park line, the lead-in before the problem — makes the turn run over 75 words, the break falls before the segment and that turn ends on
 *  its check-in (counted); the segment is said whole on the next turn. null: not a segment. */
function segmentTurn(out, input, closeWords = 0) {
  const { move, ui } = out;
  if (!segmentMove(move, ui, input.kit) || move.splitClose) return null;
  const p0 = partsOfTurn(out, closeWords, input?.helpLeadWords ?? 0);
  const b = p0.findIndex((x) => x.k === "body");
  const qW = move.stepAsk ? wordsIn(move.stepAsk.prompt) : 0;
  // (her park line on an aside said this turn; the lead-in before a worked problem after her reply to an aside — partsOfTurn counts the reply)
  // (dc-r8-director28 Brain 044 T6: her reply to an aside, her park line and the joint after them are not counted in the turn's 75 and are never
  // said alone — the segment comes with them, in the same turn: c5-t01 stuck 42, steering 34, 38; c5-t02 stuck 42, steady 56; c6 stuck 44)
  if (p0.reduce((a, x) => a + x.n, 0) + qW <= L2_CAP || b < 0) return out;
  if (b > 0) { const br = breakL2(out, input, closeWords, b); if (br) return br; }
  return out;
}
/** dc-r8-director27 Brain 043 R2: a right verdict that stands alone because a worked problem follows (an asked example's first segment, or
 *  the problem said with its steps) — or her reply to an aside said alone before it — ends on an invitation to do the problem together (joints.workedInvite; code's forms when the script has
 *  none), not on a check-in. The held segment opens at the problem: no beforeWorked lead-in after an invitation (brain/seams.js). The
 *  child's line to it is read as at a check-in today (heldTurn): a yes, or anything that is not a request, gets the segment. */
function inviteBefore(br, out, input) {
  // (dc-r8-director28 Brain 044 T3: no invitation — the verdict's turn runs into the worked example where they fit 75; where they do not, it ends
  // on its check-in and the row says so (noFit "worked", counted); joints.workedInvite is not read)
  if (!scriptFor(input?.kit)?.script?.recordedRun) {
    const held = br.state?.splitHold?.move;
    if (held && br.move?.splitClose && (Number(held.problemLines) > 0 || held.scriptBeat?.beatId === "worked:problem" || held.stepAsk)) {
      br.move = { ...br.move, noFit: "worked" }; br.state.lastMove = br.move;
    }
    return br;
  }
  const { move } = out;
  const held = br.state?.splitHold?.move;
  if (!held || !br.move?.splitClose || br.move.workedInvite || !(Number(held.problemLines) > 0 || held.scriptBeat?.beatId === "worked:problem")) return br;
  // (only where the problem is what comes next: an aside's return due on this turn, a bridge or a held part said first is not — c4 steady
  // 44, the close broken off for the return, "Agla sawaal …?" and then the return's question)
  if (move.returned?.topic || held.returned?.topic || held.bridgeSaid || held.sayFirst?.length || held.heldSaid?.length) return br;
  const right = input?.cls?.outcome === "correct" && !!move.closeBeat && !move.gave && !move.workedDone && !move.closed && !!br.move.closeBeat;
  const reply = !!br.move.leadAlone;
  if (!right && !reply) return br;
  br.move = { ...br.move, workedInvite: true };
  br.state.lastMove = br.move;
  br.state.splitHold = { ...br.state.splitHold, move: { ...held, afterInvite: true } };
  br.proposal = directorProposal(br.move, { ui: br.ui, guidance: br.state.guidance, purpose: br.state.purpose });
  return br;
}
/** The walk's current beat as a scriptBeat ref (with its board), or null. */
function currentBeatRef(s, kit) {
  const w = s.walk;
  const sk = w ? skillScriptOf(kit, w.skillId) : null;
  if (!sk) return null;
  const [kind, id] = String(w.beats[Math.min(w.i, w.beats.length - 1)] ?? "").split(":");
  const board = kind === "explain" ? sk.explain.find((b) => b.id === id)?.board : kind === "worked" ? sk.workedExample?.board
    : kind === "check" ? sk.checks.find((c) => c.id === id)?.board : null;
  // a check with no board of its own shows the last explain beat's
  const fallback = [...(sk.explain ?? [])].reverse().find((b) => b.board)?.board ?? null;
  return { scriptId: scriptIdOf(kit), skillId: w.skillId, beatId: id ?? kind, kind: kind || "explain", board: board ?? fallback };
}
// v4 W6 (director6: 0 of 6 cricket / Virat asides parked): an aside about a world of theirs (an interest, a sport, a star) is
// kept on the Later list in script mode, so it is promised now and returned to before the wrap
const ASIDE_WORDS = /\b(cricket|virat|kohli|dhoni|rohit|football|messi|ronaldo|ipl|match|sixer|six|game|games|cartoon|movie|film|song|gaana|dance|kabaddi|chess|badminton|cycle|dog|kutta|billi|cat)\b/i;
export function asideTopic(text, interests = []) {
  const t = String(text ?? "");
  const own = (interests ?? []).find((i) => i && new RegExp(`\\b${String(i).replace(/[^\p{L}\s]/gu, "")}`, "iu").test(t));
  if (own) return String(own);
  const m = ASIDE_WORDS.exec(t);
  return m ? m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase() : null;
}
/**
 * v6.3 H2′ (main, director11: asides 1 of 24; "ek over mein chhe ball" and "cover drive" were canned facts, not what they said):
 * the return line is built from THEIR words, said back to them (first person turned to second): a share is taken up ("kal tumne
 * cricket khela, sixer maara: yeh sunke bahut achha laga."), a question of theirs is named as theirs. No digits, no lesson words.
 * null when there is nothing usable.
 */
const YOU_FOR = [[/\bmaine\b/gi, "tumne"], [/\bmujhe\b/gi, "tumhe"], [/\bmera\b/gi, "tumhara"], [/\bmeri\b/gi, "tumhari"], [/\bmere\b/gi, "tumhare"], [/\bmain\b/gi, "tum"], [/\bhum\b/gi, "tum"], [/\bhumne\b/gi, "tumne"]];
export function asideReturnLine(said, topic, lang = "hinglish") {
  const t = String(said ?? "").replace(/\s+/g, " ").trim().replace(/[.!?\u0964]+$/, "");
  if (!t || /\d/.test(t) || unsafeChildPhrase(t)) return null;
  const T = String(topic ?? "").trim();
  const en = lang === "english";
  if (/\?\s*$/.test(String(said)) || /^(?:aap|aapko|aapka|aapki|kya|tum(?:he|ko|hara|hari)?|do you|are you|what|who|why)\b/i.test(t)) {
    if (!T) return null;
    return en ? `you asked me about ${T}; tell me more about ${T} after the lesson.` : `tumne mujhse ${T} ke baare mein poocha tha; lesson ke baad mujhe ${T} ke baare mein aur batana.`;
  }
  if (en) return `you told me "${t}", and I loved hearing it.`;
  const you = YOU_FOR.reduce((x, [re, w]) => x.replace(re, w), t);
  return `${you}: yeh sunke bahut achha laga.`;
}
// v6.6 A2: the child asking her own taste ("aapko Virat pasand hai?") is answered on that turn (brain/say.js's honest line), never
// parked for a later return
const ASKS_HER_TASTE = /(?:aapko|tumhe|aap|tum)\b.*\bpasand|do you like|your favou?rite|aapka favourite/i;
/**
 * v6.7 A3 (main, director15: the taste question was PARKED in every topic — the classifier reads "aapko virat pasand hai?" as an
 * uptake, which parks through its own path, never parkAside): every park in a scripted lesson goes through here. A question about
 * her own taste is answered on its turn (s.tasteAsked), never parked; an aside already on the list is acknowledged in one line
 * (s.asideAgain), never parked twice. Returns the new list.
 */
function parkGate(s, kit, input, e) {
  if (!scriptOn() || !scriptIdOf(kit) || scriptFor(kit)?.script?.recordedRun) return pushLater(s.later ?? [], e);
  // (v6.11 J2: their answer to her return question is not a new aside — nor, asking her back, a taste question: R1 rule 4, a plain
  // reply form, then the lesson)
  if (s.returnAnswer) return s.later ?? [];
  if (ASKS_HER_TASTE.test(String(input?.text ?? ""))) { s.tasteAsked = { topic: String(e.topic), turn: s.turn, n: (s.tasteAsked?.n ?? 0) + 1 }; return s.later ?? []; }
  // (dc-r8-director20 R1 rule 3: a sad aside is not parked for a return that assumes liking or fun — brain/say.js says one sad line
  // now, and the lesson goes on)
  if (isSadAside(input?.text)) { s.sadAside = { turn: s.turn }; return s.later ?? []; }
  const k = String(e.topic ?? "").toLowerCase();
  const had = (s.later ?? []).find((x) => String(x.topic ?? "").toLowerCase() === k || (k && String(x.topic ?? "").toLowerCase().includes(k)));
  // (v6.9 T1, main on director17 c4 offtopic 30, c5-t01 offtopic 32: "likh li hai" and then silence lost two asides): an aside said
  // again before it was returned is returned NOW, once — her one line on what they said; one already returned gets the short line
  // (P1, dc-r8-director20 c4 offtopic 37: an aside said again AFTER its return got a second return with no park before it — it gets the
  // short line instead; only one said again before its return is returned now)
  if (had && had.id != null && !had.servedAt && responseShape("aside_again", "*") === "return_once") {
    // (said again after it was returned: one more return, on what they said now — then the short line from here on)
    s.servedNow = { topic: String(had.topic), share: !!had.share, said: String(input?.text ?? "") || had.said || null };
    return (s.later ?? []).map((x) => (x.id === had.id ? { ...x, servedAt: s.turn, ...(had.servedAt ? { again: true } : {}) } : x));
  }
  if (had) { s.asideAgain = { topic: String(had.topic), turn: s.turn, ...(had.servedAt != null ? { returned: true } : {}) }; return s.later ?? []; }
  return pushLater(s.later ?? [], e);
}
function parkAside(s, kit, input, item) {
  if (!scriptOn() || !scriptIdOf(kit)) return;
  const topic = input.cls?.request?.topic ?? asideTopic(input.text, s.ctx.interests);
  if (!topic || unsafeChildPhrase(topic)) return;
  if (scriptFor(kit)?.script?.recordedRun && (s.later ?? []).some((e) => !e.servedAt && String(e.topic).toLowerCase() === String(topic).toLowerCase())) return;
  s.later = parkGate(s, kit, input, { ...parkEntry({ topic, learning: false, turn: s.turn, itemOnTable: !!item }), share: true });
}
/**
 * v5 B3 (director7: "Virat wali baat mujhe yaad hai" ×8, a stub): a parked aside comes back with one line of REAL content,
 * tied to the lesson: the script's own interest line for that interest (a hook's interestSlots use, "Cricket pitch 22 m lambi
 * aur 3 m chaudi …") when the aside is about it. null when no authored line fits (her own words then, never a stub).
 */
export function returnLineOf(kit, topic, lang) {
  const f = scriptFor(kit);
  if (!f || !topic) return null;
  const t = String(topic).toLowerCase();
  for (const sk of f.script.skills ?? []) for (const sl of sk.hook?.interestSlots ?? []) {
    const words = [sl.interest, ...(INTEREST_WORDS[sl.interest] ?? []), ...(PERSONA_INTERESTS[sl.interest] ?? [])];
    if (!words.some((w) => new RegExp(`(?<![\\p{L}])${String(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "iu").test(t))) continue;
    // (it is said over whatever board is up: a sentence with no number of its own, so it never reads as the board's)
    const ss = (String(saidIn(sl.use, lang) ?? "").match(/[^.!?\u0964]+[.!?\u0964]*/g) ?? []).map((x) => x.trim()).filter((x) => x && !/\d/.test(x));
    const best = ss.sort((a, b) => b.length - a.length)[0];
    if (best) return best;
  }
  return null;
}
/** A helper line, compared without case, spacing or end punctuation (v6.3 H1′: never said twice on one card). */
const normLine = (x) => String(x ?? "").toLowerCase().replace(/[^\p{L}\p{N}/]+/gu, " ").trim();
/** A script card's key from its id (script:<skill>:ask:<beat> | :then:<targets> | :<checkId>), read from the script, or null. */
export function scriptKeyOf(kit, id) {
  const m = /^script:(.+?):(?:(ask):(.+)|(then):(.+)|([^:]+))$/.exec(String(id ?? ""));
  if (!m) return null;
  const sk = skillScriptOf(kit, m[1]);
  if (!sk) return null;
  if (m[2]) { const a = m[3] === "worked" ? sk.workedExample?.yourStep : sk.explain?.find((b) => b.id === m[3])?.ask; return a?.key ?? null; }
  if (m[4]) { const r = sk.remediation?.find((x) => x.targets === m[5]); return r?.then && typeof r.then === "object" ? r.then.key ?? null : r?.thenKey ?? null; }
  return sk.checks?.find((c) => c.id === m[6])?.key ?? null;
}
/** v6.3 T1′: `text` when none of its sentences states the numeric key of a script card already closed (not `live`), else null. */
function withoutClosedKeys(text, s, kit, live) {
  if (!text) return text ?? null;
  const keys = [...new Set([...(s.itemsDone ?? []), ...(s.skipped ?? [])].filter((id) => String(id).startsWith("script:") && id !== live?.id)
    .map((id) => scriptKeyOf(kit, id)).filter((a) => a != null && /\d/.test(String(a))).map((a) => String(a).trim()))];
  if (!keys.length) return text;
  const esc = (k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const hit = (x) => keys.some((k) => new RegExp(`(?<![\\d/])${esc(k)}(?![\\d/])`).test(x));
  const ss = String(text).match(/[^.!?\u0964]+[.!?\u0964]*/g)?.map((x) => x.trim()).filter(Boolean) ?? [];
  // (main's order 1, G3: an authored line is said whole or not at all — never cut to the sentences without a closed key)
  return ss.some(hit) ? null : text;
}
/** v4 W1: a live script card's authored reminder line in the lesson's language, or null. */
function cardPointOf(s, kit, item) {
  if (!item || !(item.scriptAsk || item.scriptCheck || item.scriptThen)) return null;
  const sk = skillScriptOf(kit, item.skillId);
  if (!sk) return null;
  const lang = s.ctx?.lang ?? "hinglish";
  friendOf = s.ctx?.firstName ?? "";
  // (director7: a recap is said only over the board it describes; a card that shows its OWN board — a then-card's then.board, a
  // check's board — gets no recap of another board's line: "Yaad karo: 1/2, 1/4, 1/8" over the 1/3 card was a contradiction)
  const shown = cardBeatRef(s, kit, item)?.board ?? null;
  const same = (b) => JSON.stringify(b ?? null) === JSON.stringify(shown);
  if (item.scriptAsk && item.scriptAsk.beatId !== "worked") return saidIn(sk.explain?.find((b) => b.id === item.scriptAsk.beatId)?.point, lang) || null;
  if (item.scriptThen) { const r = sk.remediation?.find((x) => x.targets === item.scriptThen.targets); return r && same(r.board) ? saidIn(r.say, lang) || null : null; }
  if (item.scriptCheck) { const b = [...(sk.explain ?? [])].reverse().find((x) => x.point); return b && same(b.board) ? saidIn(b.point, lang) || null : null; }
  return null;
}
/** v5 (Studio S1): a scripted card's answers on its beat ref, so its board withholds only these values. */
const answersOf = (item) => (item?.answer != null && String(item.answer).trim() ? { answers: [String(item.answer), ...(item.acceptable ?? []).map(String)] } : {});
/** SC2: a live script card's own beat ref, with its board (an ask: its explain beat's; a check: its own, else the last explain
 *  beat's, as currentBeatRef; a follow-up: its then.board) or none. */
/** v2.3: a script card's authored answer-state board (KeyedAsk / CheckQuestionV2 answerBoard), or null. */
const answerBoardOf = (item) => (item?.scriptAsk ?? item?.scriptCheck ?? item?.scriptThen)?.answerBoard ?? null;
function cardBeatRef(s, kit, item) {
  const sk = skillScriptOf(kit, item.skillId);
  if (!sk) return null;
  const base = { scriptId: scriptIdOf(kit), skillId: item.skillId };
  if (item.scriptAsk) {
    const worked = item.scriptAsk.beatId === "worked";
    const b = sk.explain?.find((x) => x.id === item.scriptAsk.beatId);
    // (main, 2026-11-08, for Studio's second views: an ask with its OWN figure — ask.board / yourStep.board, unmarked — is drawn
    // as the card's board while it is live, ownBoard like a check's; and its answers ride along, so a second view of a live card
    // knows the key it must not draw (Studio e101bdc1 reads scriptBeat.answers[0]))
    const own = (worked ? sk.workedExample?.yourStep?.board : b?.ask?.board) ?? null;
    const board = own ?? (worked ? sk.workedExample?.board : b?.board);
    return { ...base, beatId: item.scriptAsk.beatId, kind: worked ? "worked" : "explain", ...(board ? { board } : {}), ...(own ? { ownBoard: true } : {}), ...answersOf(item) };
  }
  if (item.scriptCheck) {
    const own = sk.checks?.find((c) => c.id === item.scriptCheck.checkId)?.board ?? null;
    const board = own ?? [...(sk.explain ?? [])].reverse().find((b) => b.board)?.board ?? null;
    return { ...base, beatId: item.scriptCheck.checkId, kind: "check", ...(board ? { board } : {}), ...(own ? { ownBoard: true } : {}), ...answersOf(item) };
  }
  const r = sk.remediation?.find((x) => x.targets === item.scriptThen.targets);
  const board = r?.then && typeof r.then === "object" ? r.then.board ?? null : null;
  return { ...base, beatId: `then:${item.scriptThen.targets}`, kind: "check", ...(board ? { board, ownBoard: true } : {}), ...answersOf(item) };
}
/** R1: their reply to a v2 beat's question. "pata nahi", or a beat whose must-say words her line left out, gets the SAME beat
 *  again, smaller, once; a right answer goes on; a wrong one gets its remediation (walkRemedy) or the hint ladder. */
function walkBeatTurn(s, input, item) {
  const w = s.walk;
  const beatId = item.scriptAsk?.beatId;
  if (!w || !beatId || beatId === "worked") return null;
  const v = verdict(input.cls);
  if (v === "right" || v === "wrong") return null;
  const herLast = [...(s.recent ?? [])].reverse().find((t) => t.who === "teacher")?.text ?? "";
  const delivered = !s.lastMove?.mustSay?.length || saidMust(herLast, s.lastMove.mustSay, s.ctx.lang);
  if ((v === "stuck" || !delivered) && w.smaller !== beatId) {
    w.smaller = beatId;
    s.activeItemId = undefined;
    return walkNext(s, input, v === "stuck" ? SH.SMALLER_AFTER_STUCK : null);
  }
  return null;
}
/** The script's ladder: its next kit item not yet done; the walk ends when the ladder is spent. */
function walkLadder(s, kit) {
  const w = s.walk;
  if (!w) return null;
  const gone = new Set([...s.itemsDone, ...s.skipped]);
  for (const id of w.ladder) { if (gone.has(id)) continue; const it = findItem(s, kit, id); if (it) return it; }
  s.walk = undefined;
  return null;
}
/** A remediation's key in the said-once record (state.remedied): its skill and its mix-up (dc-r8-director26 R1). */
export const remKeyOf = (skillId, targets) => `${skillId}|${targets}`;
/** A wrong answer to a scripted check: that misconception's remediation (once per remediation), then its keyed follow-up. */
function walkRemedy(s, input, item) {
  const { kit } = input;
  // round 8 K3: the mix-up the classifier named on this answer when the skill remediates it, else the card's authored target
  // (O3, main on director21 c5-t02 stuck 16: "4/1", read incorrect, got a remediation — a remediation follows only the answer that shows
  // its misconception; a plain miss gets the wrong-answer cell, the card's simpler)
  const targets = verdict(input.cls) === "wrong" && input.cls?.outcome === "misconception" ? knowsRemedy(s, item, input.cls, skillScriptOf(kit, item.skillId)) : null;
  // (dc-r8-director26 R1: "said once" is counted for each remediation — its skill and its mix-up — not for each mix-up id. c5-t02 steady 117
  // to 148: the same mix-up four times in the third skill, and that skill's own remediation never said, because the first skill's had been)
  if (!targets || (s.remedied ?? []).includes(remKeyOf(item.skillId, targets))) return null;
  const r = skillScriptOf(kit, item.skillId)?.remediation?.find((x) => x.targets === targets);
  if (!r) return null;
  s.remedied = [...(s.remedied ?? []), remKeyOf(item.skillId, targets)];
  s.skipped.push(item.id);
  // v6.4 K1 (main, director12: misconception routes left the card without its key — c4 ×7, c6 steady never heard 30 cm / 20 cm):
  // the card the remediation took over is posed again, once, after its follow-up card is closed
  // (a replay of a recorded run walks what that run walked — tests/fixtures/replay.mjs runScriptOf marks it recordedRun)
  if (!scriptFor(kit)?.script?.recordedRun) s.reposeQ = [...(s.reposeQ ?? []).filter((r) => r.id !== item.id), { id: item.id, after: `script:${item.skillId}:then:${targets}`, item }];
  s.activeItemId = undefined; s.hintLevel = 0;
  friendOf = s.ctx.firstName ?? "";
  const then = friendly(scriptThenItem(item.skillId, r));
  s.scriptCard = then;
  // v3 V1: a v2 remediation's authored explanation is spoken by code, and its follow-up card is posed on the same move
  const sayLine = r.say ? saidIn(r.say, s.ctx.lang ?? "hinglish") : null;
  if (sayLine) s.remSaid = [...(s.remSaid ?? []), normLine(sayLine)];
  if (sayLine) {
    activate(s, then);
    // (v4 W4 closed the missed card with its answer once the follow-up was done. v6.3 T1′, main's director11 judges, 16 of 19
    // two-close turns: "Haan, sahi hai, kyunki … Aur pehle wale sawaal ka jawab X tha, kyunki …" — a close is only ever of the
    // card answered in the child's last turn; the missed card's close is dropped, never carried)
    const mis0 = kit.misconceptions.find((m) => m.id === targets);
    logReteach(s, "kit", item.skillId, mis0 ?? null);
    return plan("reteach", SH.scriptRemedyV2(), { item: then, probe: probeFor(then), skillId: item.skillId,
      content: [`their question: ${s.ctx.lang === "english" ? item.prompt_en : item.prompt_hi}`, `its answer: ${item.answer}`],
      rendered: [/[.!?।]$/.test(sayLine.trim()) ? sayLine.trim() : `${sayLine.trim()}.`],
      scriptBeat: { scriptId: scriptIdOf(kit), skillId: item.skillId, beatId: `rem:${targets}`, kind: "remediation", ...(r.board ? { board: r.board } : {}) } });
  }
  s.nextItemId = then.id;
  const mis = kit.misconceptions.find((m) => m.id === targets);
  logReteach(s, "kit", item.skillId, mis ?? null);
  const lang = s.ctx.lang ?? "hinglish";
  const say = saidIn(r.say, lang);
  return plan("reteach", SH.scriptRemedy(), { skillId: item.skillId,
    content: [`their question: ${lang === "english" ? item.prompt_en : item.prompt_hi}`, `its answer: ${item.answer}`, ...(mis?.belief ? [`the wrong idea: ${mis.belief}`] : []),
      `the new way: ${r.move}`, ...(say ? [`say this explanation in your words: ${say}`] : []), `follow-up question: ${lang === "english" ? then.prompt_en : then.prompt_hi}`],
    scriptBeat: { scriptId: scriptIdOf(kit), skillId: item.skillId, beatId: `rem:${targets}`, kind: "remediation", ...(r.board ? { board: r.board } : {}) } });
}
// ───────────── round 7 A6: teaching-question evidence (PIPELINE §A Brain item 3; kill switch TAXILA_R7_STEP_CHECK=off) ─────────────
export const stepCheckOn = (env = process.env) => !/^(off|0|false)$/i.test(String(env.TAXILA_R7_STEP_CHECK ?? ""));
// the LAST "= N" with a known unit (or none), then punctuation, a clause break or the end ("= 13, so…", "= ₹300", "= 120°");
// never algebra ("= 50C"), a power ("= 3⁶") or a Roman numeral
const STEP_KEY = /=\s*₹?\s*([-−]?\d[\d,]*(?:\.\d+)?)\s*(?:°|%|₹|rs\.?|rupees?|paise|mm|cm|km|m|kg|g|mg|ml|l|litres?|liters?|minutes?|mins?|hours?|hrs?|seconds?|secs?|days?|weeks?|months?|years?|cm²|m²|km²|units?|degrees?|metres?|meters?)?(?=\s*(?:[,;:.!।)]|$|\s(?:so|and|which|the|is|hai|toh)\b))/giu;
/**
 * The question that ends a worked part, as a code-chosen keyed micro-item: the NEXT kit step, its result the key (the number
 * after its last "="). Its prompt is the kit's faded line for that step when there is one, else the step with its result
 * blanked. null when the step has no result in code (then she asks in her own words, unkeyed, as before).
 */
/** round 7 A8 part 2: frustration on a card changes the approach (TAXILA_R7_FRUSTRATION=off: a hint on the same question). */
export const frustrationNewWayOn = (env = process.env) => !/^(off|0|false)$/i.test(String(env.TAXILA_R7_FRUSTRATION ?? ""));
/** round 7 (main's hybrid-pilot judgement #3): a goodbye gets the stop check-in first (TAXILA_R7_BYE_CHECKIN=off: ends at once). */
export const byeCheckInOn = (env = process.env) => !/^(off|0|false)$/i.test(String(env.TAXILA_R7_BYE_CHECKIN ?? ""));
/** round 7 (main's hybrid-pilot judgement #2): change_topic parks and comes back (TAXILA_R7_PARK_TOPIC=off: the ways-in offer). */
/** round 7 T3: the wrap waits until every parked promise is returned (TAXILA_R7_WRAP_BLOCK=off: one folded into the wrap). */
export const wrapBlockOn = (env = process.env) => !/^(off|0|false)$/i.test(String(env.TAXILA_R7_WRAP_BLOCK ?? ""));
export const parkTopicOn = (env = process.env) => !/^(off|0|false)$/i.test(String(env.TAXILA_R7_PARK_TOPIC ?? ""));

export function stepCheckItem(kit, skillId, we, i) {
  const step = String(we?.steps?.[i] ?? "").trim();
  const m = [...step.matchAll(STEP_KEY)].at(-1);
  if (!m) return null;
  const key = m[1].replace(/,/g, "").replace("−", "-");
  const faded = we.fadedVersion?.[i];
  const prompt = faded && /_{2,}/.test(faded) ? faded : `${step.slice(0, m.index)}= ___`.replace(/\s{2,}/g, " ");
  return { id: `check:${skillId}:${i}`, skillId, kind: "practice", difficulty: 1, prompt_en: prompt, prompt_hi: prompt, answer: key, acceptable: [], hints: [], stepCheck: true };
}

/** The hook's kind for this lesson: the kit's worked problem as a puzzle (classes 4-9, alternate lessons) or the prediction. */
export function hookKindFor(s, kit) {
  if (!kit?.workedExample?.problem) return "predict";
  const cl = Number(s.ctx?.classLevel);
  if (Number.isFinite(cl) && cl <= 3) return "predict";
  return (s.seed >>> 0) % 2 === 0 ? "puzzle" : "predict";
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
    // F4 (dc-r7-script-walk-v2): with a v2 script, the greet promises only an interest its hook's slots use
    const sk0 = scriptOn() ? skillScriptOf(input.kit, input.kit.skills[0]?.id) : null;
    const gs = knowsGreetSlot(s, sk0); // round 8 K6: the greet promises the plan's slot
    const slotInterest = sk0?.explain?.[0]?.ask ? (gs !== undefined ? gs : hookSlot(sk0, s.ctx.interests))?.interest ?? null : undefined;
    // Learning patch 004b: a question kept in the jar last time is the first thing she comes back to (a promise kept)
    const jar = (s.later ?? []).find((p) => p.jarId && p.servedAt == null);
    if (jar) s.later = serveLater(s.later, jar.id, s.turn);
    const greet = SH.greet({ ...s.ctx, warmup: !!first, interest: slotInterest !== undefined ? slotInterest ?? undefined : interestFor(input.kit, s.ctx.interests, 0) });
    return plan("greet", jar ? join(greet, SH.returnJar({ topic: jar.topic, share: !!jar.share })) : greet, first ? { item: first, probe: "P10" } : {});
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
  // round 7 A6: the reply to her keyed step question (stepCheckItem) is graded like any card (the classifier, its key); a right
  // one is confirmed and counted, a wrong or stuck one is shown with its result in the next worked part
  let stepMissed = false;
  if (s.stepCheck && input.event === "turn" && s.activeItemId === s.stepCheck.id) {
    const v = verdict(input.cls), sc = s.stepCheck;
    s.stepCheck = undefined; s.activeItemId = undefined; s.hintLevel = 0;
    if (v === "right") { s.itemsDone.push(sc.id); prefix = join(prefix, SH.stepCheckRight()); }
    else if (v === "wrong" || v === "stuck") { stepMissed = true; if (v === "wrong") prefix = join(prefix, SH.stepCheckMissed()); }
  }
  // QA 14.4.1 (65fae3d0, 3e2fcb15): a child who could not follow the teaching ("pata nahi", or off somewhere else) is SHOWN
  // the worked steps, never asked to compute the next one (SH.worked stuck)
  // round 7 T2: the first skill's teaching is its script when it has one (the Ask/homework and first-step paths keep theirs)
  if (scriptOn() && !s.walk && !(s.walked ?? []).length) {
    const rest = s.teachPlan.slice(s.teachIdx);
    if (rest.length && rest.every((x) => ["hook", "explain", "worked_example", "fade"].includes(x)) && walkStart(s, kit, kit.skills[0].id, { hook: rest.includes("hook") })) {
      s.teachIdx = s.teachPlan.length; s.fadeItem = undefined;
    }
  }
  if (s.walk) { const w = walkNext(s, input, prefix); if (w) return w; s.phase = "practice"; return poseNext(s, input, prefix); }
  const replied = input.event === "turn" && ["hook", "explain", "worked_example"].includes(s.lastMove?.kind) ? verdict(input.cls) : null;
  const shown = () => stepMissed || replied === "stuck" || replied === "off" || ["fade.not_landed", "first_step.stuck"].includes(s.guidance?.reason);
  while (s.teachIdx < s.teachPlan.length) {
    const stepName = s.teachPlan[s.teachIdx];
    if (stepName === "answer_question") {
      // Ask (a doubt): her first turn answers THEIR question, in one idea; then the guidance path as usual.
      s.teachIdx += 1;
      const sk = kit.skills[0];
      if (!s.introduced.includes(sk.id)) s.introduced.push(sk.id);
      return plan("explain", join(prefix, s.ctx.homework ? SH.homeworkMethod() : SH.answerQuestion()), { skillId: sk.id, format: formatFor(s, kit, sk.id),
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
      const item = s.fadeItem ? findItem(s, kit, s.fadeItem.id) : null;
      const we = kit.workedExample;
      // census 14.5 (F8, 3437b744 t9-13: the a₃₀ gap posed when the worked steps never landed): a don't-know or an off-topic
      // reply to the worked steps is no ground for a gap; the whole worked example is shown instead, then practice
      const v = input.event === "turn" && s.lastMove?.kind === "worked_example" ? verdict(input.cls) : null;
      if (item && we && (v === "stuck" || v === "off")) {
        s.teachPlan = [...s.teachPlan.slice(0, s.teachIdx), "worked_example", ...s.teachPlan.slice(s.teachIdx + 1)];
        s.fadeItem = undefined;
        s.guidance = { ...s.guidance, level: "worked", reason: "fade.not_landed" };
        continue;
      }
      s.teachIdx += 1;
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
      // round 7 A4: a hook kind per lesson (hookKindFor), never one interest template every time
      if (skillArcOn() && hookKindFor(s, kit) === "puzzle") {
        return plan("hook", join(prefix, SH.hookPuzzle({ protege: s.ctx.protege })), { format: "F4", content: [`the puzzle (the kit's worked problem): ${kit.workedExample.problem}`] });
      }
      return plan("hook", join(prefix, SH.hook({ interest: interestFor(kit, s.ctx.interests, 0), contexts: kit.interestContexts, protege: s.ctx.protege })), { format: "F4" });
    }
    if (stepName === "explain") {
      s.teachIdx += 1;
      const sk = kit.skills[0];
      if (!s.introduced.includes(sk.id)) s.introduced.push(sk.id);
      if (skillArcOn() && !s.arcSkill) s.arcSkill = sk.id; // round 7 A4: skill 1's practice block starts at its explain
      // No whiteboard: the skill title is syllabus objective text, never something to put in front of a child
      // (G-OBJ-1; audit #6, the "Read and write 5- and 6-digit numbers…" ledge chip).
      return plan("explain", SH.explain({ skillTitle: sk.title, prefix, interest: interestFor(kit, s.ctx.interests, 1) }), { skillId: sk.id, format: formatFor(s, kit, sk.id) });
    }
    // worked_example — spread over at most LIMITS.workedParts turns, one step handed to the child each time. With a
    // faded step planned next, ONE part: the first steps before the gap (the faded step is the second part), so the gap's
    // key is never said before it is posed.
    const we = kit.workedExample;
    if (!we) { s.teachIdx += 1; continue; }
    if (s.teachPlan[s.teachIdx + 1] === "fade" && s.fadeItem) {
      s.teachIdx += 1;
      const i = Number(s.fadeItem.id.slice(FADE_PREFIX.length));
      const stuck = shown();
      return plan("worked_example", join(prefix, SH.worked({ part: 1, parts: 2, stuck })), { ...(stuck ? { stuck } : {}),
        skillId: kit.skills[0].id, format: "F2", content: workedLeadContent(we, i), whiteboard: { kind: "math", value: clip(we.problem) },
        // (the steps before the gap only, as workedLeadContent: the gap's key is never said before it is posed)
        ...rendered(we, { part: 1, parts: 1, upTo: i > 0 ? Math.min(i, Math.max(1, Math.ceil(i / 2))) : 0 }, s),
      });
    }
    const parts = Math.min(LIMITS.workedParts, we.steps.length);
    s.workedPart += 1;
    if (s.workedPart >= parts) s.teachIdx += 1;
    const stuck = shown();
    // round 7 A6: a part that hands the next step to them asks it as a keyed micro-item (the card), never a free question
    const per = Math.ceil(we.steps.length / parts);
    // (the first step from the next part on that has a result in code)
    let check = null;
    for (let i = s.workedPart * per; stepCheckOn() && !stuck && s.workedPart < parts && !check && i < we.steps.length; i++) check = stepCheckItem(kit, kit.skills[0].id, we, i);
    if (check) {
      s.stepCheck = check; activate(s, check);
      return plan("worked_example", join(prefix, SH.worked({ part: s.workedPart, parts, stuck })), {
        item: check, probe: "P15", skillId: kit.skills[0].id, format: "F2", content: workedContent(we, s.workedPart, parts), whiteboard: { kind: "math", value: clip(we.problem) },
        ...rendered(we, { part: s.workedPart, parts }, s),
      });
    }
    return plan("worked_example", join(prefix, SH.worked({ part: s.workedPart, parts, stuck })), { ...(stuck ? { stuck } : {}),
      skillId: kit.skills[0].id, format: "F2", content: workedContent(we, s.workedPart, parts), whiteboard: { kind: "math", value: clip(we.problem) },
      ...rendered(we, { part: s.workedPart, parts }, s),
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
  // v3 (director5/6: skill 1's cards and ladder spent practiceMax, so skills 2-3 were never taught): in script mode item counts
  // never end practice before every scripted skill has been walked; the clock and the brief still do
  const unwalked = scriptIdOf(kit) && kit.skills.some((sk) => skillScriptOf(kit, sk.id) && !s.introduced.includes(sk.id));
  if (unwalked) return s.minutes >= LIMITS.minutes[s.ctx.ageBand] || pastBrief(s, "wrapAt");
  return s.practiced >= LIMITS.practiceMax || (s.practiced >= LIMITS.practiceMin && allUnaided) || (s.practiced >= 2 && allSettled) || s.minutes >= LIMITS.minutes[s.ctx.ageBand]
    || pastBrief(s, "wrapAt"); // round 7 (Learning patch 006): the slot's target length reached → the next natural stop
}

/** Learning patch 006: has the lesson clock passed the Conductor brief's wrapAt / hardStopAt (ISO time, on ctx.lessonBrief)? */
function pastBrief(s, key) {
  const at = Date.parse(s.ctx?.lessonBrief?.[key] ?? "");
  return Number.isFinite(at) && s.startedAt + Math.round((s.minutes ?? 0) * 60_000) >= at;
}

function poseNext(s, input, prefix, preferred) {
  const { kit } = input;
  // CONVERSATION-V2 §5: a question parked "after this question" comes back now that the item on the table resolved
  // round 3 (conversation; tests/prod/round3-conversation C): after a right answer the why-probe path reaches here with no
  // active item, so "right after this question" was kept only at the wrap; the question that just resolved is the last move's
  // (v6.9 T1, main on director17 c5-t01 steady 42: "woh wala ho gaya, aage chalo" with an aside pending got the aside return and no
  // next card — asked to go on, the walk moves on first; the aside waits for the next boundary)
  if (p5Flag("STEER") && s.later?.length && (s.activeItemId || (p5Flag("R3CONV") && s.lastMove?.itemId)) && !(GO_ON.test(String(input?.text ?? "")) && responseShape("move_on", "aside_pending") === "move_on")) {
    // round 4 (round3-conversation C on prod: a cousin's wedding shared mid-teaching was promised "before the lesson ends"
    // and never came back): an open share is also brought back at an item boundary four or more turns after it was told
    // (v6.3 H2′: in a scripted lesson an aside share is returned by step's own rule, at the promised point, never here)
    const scriptedShares = scriptOn() && !!scriptIdOf(kit);
    const open = scriptedShares ? (s.later ?? []).filter((p) => !p.share) : s.later;
    const due = dueParked(open, "item_resolved")
      ?? (p5Flag("R4CONV") && !scriptedShares ? (s.later ?? []).find((p) => !p.servedAt && p.share && s.turn - (p.at ?? s.turn) >= 4) ?? null : null);
    if (due) { s.later = serveLater(s.later, due.id, s.turn); prefix = join(prefix, SH.returnParked({ topic: due.topic, share: !!due.share })); s.servedNow = { topic: due.topic, share: !!due.share }; }
  }
  s.activeItemId = undefined; s.hintLevel = 0; s.pendingWhy = undefined;
  // round 7 A4 (PIPELINE §A Brain item 2, per-skill arc): a skill just explained gets ITS worked example next (its own
  // verified item, solved with that item's steps), then its keyed check (the item queued at the explain)
  if (s.skillArc?.we) {
    const { skillId, we } = s.skillArc;
    s.skillArc = undefined;
    return plan("worked_example", join(prefix, SH.worked({ part: 1, parts: 1, stuck: true })), { skillId, format: "F2", stuck: true,
      content: [`worked example: ${we.problem}`, `steps: ${we.steps.join(" → ")}`, `its answer: ${we.answer}`], whiteboard: { kind: "math", value: clip(we.problem) } });
  }
  // round 7 T2: the script's next beat (a check card), then its ladder (a queued follow-up goes first)
  let ladder = null;
  if (s.walk && !s.nextItemId) {
    const w = walkNext(s, input, prefix);
    if (w) return w;
    // v4 W5 (director6: steady went skill 1 → kit ladder → skill 3, skill 2 never taught): the next scripted skill, in the
    // kit's order, is walked next, with its bridge; the kit ladder only runs once every scripted skill has been walked
    const nextSk = kit.skills.find((k) => !(s.walked ?? []).includes(k.id) && skillScriptOf(kit, k.id));
    if (nextSk && walkStart(s, kit, nextSk.id)) {
      const w2 = walkNext(s, input, prefix);
      if (w2) return w2;
    }
    ladder = walkLadder(s, kit);
  }
  if (leavePractice(s, kit)) return s.practiceSet ? practiceDone(s, prefix) : enterTeachback(s, prefix, kit);
  if (ladder && !preferred) preferred = ladder;
  const skipped = new Set(s.skipped);
  const queued = s.nextItemId && !skipped.has(s.nextItemId) ? findItem(s, kit, s.nextItemId) : null;
  const verifying = s.verify && !skipped.has(`diag:${s.verify}`) ? findItem(s, kit, `diag:${s.verify}`) : null;
  // (v6.10: a script card answered right this lesson is never posed again in it)
  const rightNow = (it) => !!it && String(it.id).startsWith("script:") && (s.rightCards ?? []).includes(it.id) ? null : it;
  const item = knowsPick(s, kit, rightNow(preferred) ?? verifying ?? rightNow(queued) ?? selectNext(s, kit, { easier: s.easier }), { preferred, verifying, queued, easier: s.easier }); // round 8: the kit-practice pick, logged and explained
  if (verifying && queued) s.queue = [queued.id, ...s.queue.filter((id) => id !== queued.id)];
  s.nextItemId = undefined; s.easier = false; s.verify = undefined;
  if (!item) return s.practiceSet ? practiceDone(s, prefix) : enterTeachback(s, prefix, kit);
  // A skill nobody has explained yet gets one short explain turn first (novices; experienced attempt first).
  if (!s.introduced.includes(item.skillId) && walkStart(s, kit, item.skillId)) {
    const w = walkNext(s, input, prefix);
    if (w) return w;
  }
  if (!s.introduced.includes(item.skillId)) {
    s.introduced.push(item.skillId); s.nextItemId = item.id;
    const sk = kit.skills.find((x) => x.id === item.skillId);
    // round 7 A4: the skill being taught now (selectNext keeps its practice block together), and its worked example next
    if (skillArcOn()) {
      s.arcSkill = item.skillId;
      const we = skillWorkedExample(s, kit, item.skillId, item.id);
      if (we) { s.skillArc = { skillId: item.skillId, we }; s.shownIds = [...(s.shownIds ?? []), we.itemId]; }
    }
    return plan("explain", SH.explain({ skillTitle: sk?.title ?? "", prefix, interest: interestFor(kit, s.ctx.interests, 1) }), { skillId: item.skillId, format: kit.formats.primary });
  }
  activate(s, item);
  if (item.skillId) s.arcCount = { ...(s.arcCount ?? {}), [item.skillId]: ((s.arcCount ?? {})[item.skillId] ?? 0) + 1 };
  // (the first skill is taught in teach(), not here: its block starts at its first posed item)
  if (skillArcOn() && !s.arcSkill && item.skillId && !String(item.id).startsWith("diag:")) s.arcSkill = item.skillId;
  // round 7 A8: "khud try karne do" (try_first) asks for the attempt-first format whatever the guidance says
  const attemptFirst = (!s.novice && s.practiced === 0) || !!s.methods?.includes("try_first");
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
  // dc-r8-director25 H4: a give-up or a clarify on a card whose ladder has nothing unsaid — help's decision (state.js helpBefore), never a
  // count here — lets the card go with its key and why, before a beat's "pata nahi" re-teach
  if (input.helpClose && input.helpClose === item.id && verdict(cls) !== "wrong") return leaveItem(s, input, item, SH.reposeMissed());
  // dc-r7-script-walk-v2 R1: a v2 beat's question met with "pata nahi" (or a beat not said) is taught again, smaller
  const beatTurn = scriptOn() && item.scriptAsk ? walkBeatTurn(s, input, item) : null;
  if (beatTurn) return beatTurn;
  const v = verdict(cls);
  // R3: a script's card is never re-taught by the engine's kit arms
  const engine = String(item.id).startsWith("script:") ? null : engineReteach(s, input, item, v);
  if (engine) return engine;
  if (v === "right") return afterCorrect(s, input, item);
  if (v === "wrong" || v === "stuck") return afterMiss(s, input, item);
  return unclear(s, input, item, v);
}

/** Correct answer, wrong reason — the correct-answer trap (rule 3): a misconception flag, not a success. */
function trap(s, kit, item, misconceptionId) {
  const m = kit.misconceptions.find((x) => x.id === misconceptionId);
  if (m) s.flagged[m.id] = (s.flagged[m.id] ?? 0) + 1;
  if (!m || s.retaught.includes(m.id) || !directorMayReteach(s, "kit", item.skillId, m)) return null;
  s.retaught.push(m.id); s.activeItemId = undefined;
  logReteach(s, "kit", item.skillId, m);
  return plan("reteach", SH.reteach({ ...m.remediation, again: false }), { skillId: item.skillId, representation: m.remediation.representation });
}

/**
 * round3 truth (prod w1c-reteach 7/13, reteach_attempts 0 rows): a re-teach the Director takes on its own path (the kit's
 * remediation for a misconception the answer showed; the P21 change of approach) is a logged decision exactly like
 * engineReteach's: a reteach_attempts row (brain/turn.js, via lastReteach), resolved at the next start, its arm never
 * chosen again this lesson, a re-check cooldown after it (comprehension/reteach.js bookDirectorReteach). And the rules the
 * engine's own arms obey hold for these too (directorMayReteach): never the same arm twice in a lesson, and the change of
 * approach never inside a running re-check. TAXILA_RETEACH_LOG=off restores HEAD.
 */
function logReteach(s, kind, skillId, mis) {
  if (!reteachLogOn()) return;
  bookDirectorReteach(s, directorReteachDecision({ kind, skillId, mis, chosenBy: kind === "change_approach" ? CHANGE_APPROACH.chosenBy : null }), RETEACH_COOLDOWN);
}
/** The change of approach is the Director's own fixed rule (reteach_attempts.chosen_by 'rule': migration 023 allows it). */
const CHANGE_APPROACH = Object.freeze({ chosenBy: "rule" });

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
  if (scriptOn()) knowsCompressAnswer(s, kit, skillScriptOf(kit, item.skillId), item, "right"); // round 8 K1: a known skill's check, right
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
  // v6.6 K3 (main, director14 c5-t02 stuck 66: a then-card answered right got a why-probe, the parent card it stood in for was never
  // re-posed): a then-card whose parent waits to be re-posed gets no probe — the parent comes next
  const parentWaits = scriptOn() && !scriptFor(kit)?.script?.recordedRun && (s.reposeQ ?? []).some((r) => r.after === item.id);
  // (S1 and P1, dc-r8-director20: in a scripted lesson a why-probe has no authored line, so all 42 probe turns of director20 ended on
  // the close with nothing for the child — and an aside on the next turn got a park with no lesson after it. A script card answered
  // right goes on to the next part, its close first)
  // (main, 16:10: probes return only as authored questions — a script card gets a probe turn only when it carries an authored probe
  // field; none does yet, and the say path for one is to be built with it)
  const scriptedCard = scriptOn() && !!scriptIdOf(kit) && String(item.id ?? "").startsWith("script:") && !scriptFor(kit)?.script?.recordedRun;
  const authoredProbe = item.scriptAsk?.probe ?? item.scriptCheck?.probe ?? item.scriptThen?.probe ?? null;
  const probePlan = unaided && !parentWaits && (!scriptedCard || !!authoredProbe) ? probePlanFor(s, item, kit, input.voice) : null;
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
  // v6 R3 (director8 c4: 5 of 7 probe answers ignored): the next beat opens with one line that takes up what they said
  const next = poseNext(s, input, verdict(cls) === "right" ? SH.CONFIRM.whyGood : SH.CONFIRM.whyMissed);
  return next ? { ...next, probeAck: true } : next;
}

/** v6.5 K2: "let's go on" said to a probe or a break offer (never an answer). */
// v6.10 T2: the child says they already answered ("woh maine bata diya", "woh wala ho gaya")
const ALREADY_SAID = /(?<![\p{L}])(?:(?:maine|main|mai)\s+(?:toh\s+)?(?:bata|bol|de|likh|kar)\s*(?:diya|di|chuka|chuki|dia)|(?:woh|wo|yeh|ye)\s+(?:wala\s+|waala\s+)?(?:toh\s+)?(?:ho|kar)\s+(?:gaya|liya|diya)|(?:i\s+)?already\s+(?:told|answered|said|did))(?![\p{L}])/iu;
export const GO_ON = /(?<![\p{L}])(?:aage\s+(?:chalo|badho|badhein|chalte\s+hain)|next|move\s+on|go\s+on|agla\s+(?:sawaal|wala))(?![\p{L}])/iu;
const YES_REPLY = /^(?:haan|han|ha|haa|ji|ji haan|yes|yeah|ok|okay|theek hai|thik hai|samajh gaya|samajh gayi|samajh aa gaya|hmm+|achha|acha)[\s,.!]*$/i;
export const STOP_WORD = /\b(?:ruk|ruko|rukna|band|stop|bas\s+karo|khatam|thak|break|baad\s+mein|chhutti)\b/i;
const MOVE_ON = /(?<![\p{L}])(?:aage\s+(?:chalo|badho|badhein|chalte\s+hain)|next|(?:woh|wo|yeh)?\s*(?:wala\s+)?ho\s+gaya|bata\s+(?:diya|chuki|chuka)|move\s+on|go\s+on|let'?s\s+go)(?![\p{L}])/iu;
function afterMiss(s, input, item) {
  // round 7 S3: misses per card (the card stays live until two misses plus help)
  if (verdict(input.cls) === "wrong") s.misses = { ...(s.misses ?? {}), [item.id]: (s.misses?.[item.id] ?? 0) + 1 };
  // round 8 K1: a known skill's opening check missed → its full unit (recorded), never its remediation
  if (scriptOn() && knowsCompressAnswer(s, input.kit, skillScriptOf(input.kit, item.skillId), item, verdict(input.cls))) { s.skipped.push(item.id); return poseNext(s, input, null); }
  const { kit, cls } = input;
  // (dc-r8-director25 H4: when a missed card is let go with its key is help's decision — its ladder has nothing unsaid — never a count of
  // misses here: v6.4 K1, v6.5 K2 and v6.6 K3's second-miss keys are gone; the remediation for the mix-up still comes first)
  // round 7 T2: a scripted check answered wrong gets its misconception's scripted remediation and keyed follow-up
  const remedy = scriptOn() ? walkRemedy(s, input, item) : null;
  if (remedy) return remedy;
  if (input.helpClose && input.helpClose === item.id) return leaveItem(s, input, item, SH.reposeMissed());
  notePace(s, item, false);
  // R3 (dc-r7-script-walk-v2): a script's card gets only the script's help (its remediation above, then the hint ladder)
  const scripted = String(item.id).startsWith("script:");
  // a parked skill (V1.4: wheel-spinning ahead) stops here: the item is left, the engine's re-teach takes it next lesson
  if (!scripted && s.pace?.parkedSkills?.includes(item.skillId) && !item.fade && s.hintLevel < 4) {
    // round2 truth: the pace park hands the skill to the engine's re-teach ladder when an arm is in flight on it
    const handed = ladderHandover(s, input, item);
    if (handed) return handed;
    s.skipped.push(item.id); return poseNext(s, input, "let's leave this one for now and come back to it with a different way next time");
  }
  const m = cls?.outcome === "misconception" ? (item.misconceptions ?? kit.misconceptions).find((x) => x.id === cls.misconceptionId) : null;
  if (m) s.flagged[m.id] = (s.flagged[m.id] ?? 0) + 1;
  // P21: no 3-in-a-row in ~10 opportunities — a different approach, not more of the same.
  if (!scripted && wheelSpinning(s.history[item.skillId]) && !s.changedApproach.includes(item.skillId) && directorMayReteach(s, "change_approach", item.skillId)) {
    s.changedApproach.push(item.skillId);
    s.hintLevel = Math.min(3, s.hintLevel + 1);
    const we = kit.workedExample;
    logReteach(s, "change_approach", item.skillId, null);
    return plan("reteach", SH.changeApproach(), { item, content: we ? workedContent(we, 1, 1) : [] });
  }
  if (!scripted && m?.remediation && !s.retaught.includes(m.id) && directorMayReteach(s, "kit", item.skillId, m)) {
    s.retaught.push(m.id);
    logReteach(s, "kit", item.skillId, m);
    // round2 truth: an options item is never re-asked after its re-teach (elimination; see engineReteach): retired, and
    // the re-check is a fresh item on the skill
    if ((item.options?.length ?? 0) >= 2) {
      if (!s.itemsDone.includes(item.id)) s.itemsDone.push(item.id);
      s.activeItemId = undefined; s.hintLevel = 0;
      const iso = isomorphicFor(s, kit, item);
      if (iso) s.nextItemId = iso.id;
      return plan("reteach", SH.reteach({ ...m.remediation, again: false }), { skillId: item.skillId, representation: m.remediation.representation });
    }
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
  // round2 truth (prod w1c-reteach 10/13): an options item (a diagnostic, a tap question) cannot be its own re-check: a second
  // try on the same 2-3 options is elimination, and the learner fold grades only the first try (live.js answerEvents), so
  // the attempt had no later answer to resolve from. The item is retired with no further verdict and the re-check is a
  // fresh item on the skill (isomorphicFor), posed next, exactly as a re-teach after a right answer moves on.
  if ((item.options?.length ?? 0) >= 2) {
    if (!s.itemsDone.includes(item.id)) s.itemsDone.push(item.id);
    s.activeItemId = undefined; s.hintLevel = 0;
    const iso = isomorphicFor(s, kit, item);
    if (iso) s.nextItemId = iso.id;
    return plan("reteach", SH.reteach({ representation, moveShape, again: false }), { skillId: k, representation });
  }
  s.hintLevel = Math.min(3, s.hintLevel + 1);
  return plan("reteach", SH.reteach({ representation, moveShape, again: true }), { item, skillId: k, representation });
}

/**
 * round2 truth (prod w1c-reteach 10/13, 2026-10-06): V1.4's pace park (PACE.parkTries tries without a run of 3) and W1-C's
 * re-teach ladder (a different arm, then 2 failed arms → prerequisite descent, 3 → park) both act on a struggling skill, and
 * the pace park won by default: it left the item while the ladder's re-check (RETEACH_COOLDOWN graded items on the skill)
 * was still pending, and a pace-parked skill gets no more items, so the ladder never reached its next decision and the arm
 * in flight never got a later answer to resolve from. Now a miss that the pace park would leave, on a skill with an arm in
 * flight, IS the re-check's verdict: the cooldown is cleared and the ladder decides at once (engineReteach: the arm in
 * flight counts as failed): another arm, the prerequisite descent, or the engine's park (s.parked, the Conductor's spaced
 * re-teach). Bounded: each decision moves the ladder one rung, and the third failure parks, so at most two more tries on
 * the skill (7 + 2 < V1.4's 10-try wheel-spin line). null when no arm is in flight: the plain pace park stands.
 */
function ladderHandover(s, input, item) {
  const k = item.skillId, last = s.lastArmBySkill?.[k];
  if (!last || (s.parked ?? []).includes(k) || !s.comp?.[k]?.belief) return null;
  s.reteachCool = { ...s.reteachCool, [k]: 0 };
  return engineReteach(s, input, item, verdict(input.cls) === "stuck" ? "stuck" : "wrong");
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
  // 14.4.2 (d; sim lab 1b3bb12c p66: a right answer the code could not verify, "Maine toh bola tha na", posed again and
  // again): the model read the reply as right and corroboration could not check it against the verified forms
  // (unsupported_credit). The second time on one item it is not posed a third time: one warm, verdict-neutral line and the
  // next question. No verdict, no evidence, never marked stuck: the item stays due for another day.
  if (String(input.cls?.corroboration ?? "").startsWith("unsupported_credit")) {
    s.unverified = { ...(s.unverified ?? {}), [item.id]: (s.unverified?.[item.id] ?? 0) + 1 };
    if (s.unverified[item.id] >= 2) {
      if (!s.skipped.includes(item.id)) s.skipped.push(item.id);
      s.unclear = 0;
      return s.phase === "warmup" ? nextWarmup(s, input, SH.unverifiedMoveOn()) : poseNext(s, input, SH.unverifiedMoveOn());
    }
  }
  // round 7 (main's hybrid-pilot judgement #7: hint, then "ek aur example do", then "theek hai" left the triangle question for a
  // new probe): an okay right after she taught on THIS card (a hint, a re-teach, an example) is "go on", not a failed try:
  // the card again, plainly, once per card. The stall guard below still leaves an item that gets nothing but non-answers.
  const said = String(input.text ?? "").toLowerCase().replace(/[^\p{L} ]+/gu, " ").replace(/\s+/g, " ").trim();
  const ack = !!said && /^(?:(?:achha|acha|accha|theek|thik|hai|haan|han|ha|ok|okay|ji|hmm+|samajh\s+gay[ai]|samjh\s+gay[ai]|got\s+it|right|sure|chalo)\s*)+$/.test(said);
  if (ack && s.lastMove?.itemId === item.id && ["hint", "reteach", "worked_example", "repair"].includes(s.lastMove?.kind) && !(s.ackReposed ?? []).includes(item.id)) {
    s.ackReposed = [...(s.ackReposed ?? []), item.id];
    return plan(moveKindFor(item), SH.pose({ item, prefix: "they said okay: now this same question again, plainly, for them to try" }), { item, probe: probeFor(item), chips: optionChips(item) });
  }
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
    if (help === "skip") return toWrap(s, { kit: input.kit });
    return plan("teachback", join(SH.SLOWER, SH.teachback({ protege: scriptIdOf(input.kit) ? null : s.ctx.protege })), { probe: "P1", format: "F7" });
  }
  // dc-r7-script-walk-v2 R3: "another way / an example / slower" during a v2 walk is answered on its OWN current beat (its board
  // and numbers, smaller), never the kit's worked example; the beat's question stays the card (R2: nothing is used up)
  // (v6.4 K1, director12 offtopic c4 row 36: "samajh nahi aaya" on a remediation's follow-up card re-taught the walk's NEXT beat and
  // left the card without its key: a follow-up card or a check takes the path below, on its own idea)
  if (scriptOn() && s.walk && !(item && (item.scriptThen || item.scriptCheck)) && ["another", "example", "story", "slower", "deeper"].includes(help) && skillScriptOf(kit, s.walk.skillId)?.explain?.[0]?.ask) {
    const [kind, id] = String(s.walk.beats[s.walk.i] ?? "").split(":");
    if (kind === "explain" || kind === "worked") {
      if (kind === "explain") s.walk.smaller = id;
      // v6 R3 (director8 offtopic c4 T45: "samajh nahi aaya" on a worked step got the NEXT step): the step just shown is said
      // again, smaller, once; never the next one
      if (kind === "worked" && s.walk.workedPosed && (s.walk.workedStep ?? 0) > 0 && !s.activeItemId && s.walk.workedStep !== Number.MAX_SAFE_INTEGER
        && s.walk.smallerStep !== s.walk.workedStep - 1) { s.walk.workedStep -= 1; s.walk.smallerStep = s.walk.workedStep; }
      s.activeItemId = undefined;
      const note = help === "slower" ? SH.SLOWER : help === "story" ? SH.STORY_ASKED : help === "example" ? SH.EXAMPLE_ON_BEAT : SH.ANOTHER_ASKED;
      const p = walkNext(s, input, note);
      if (p) return { ...p, request: help };
    }
  }
  // v5 B2 (director7: "samajh nahi aaya" on a check got a verbatim repeat or the next step): on a scripted check or follow-up
  // card, the idea again SMALLER and on another view: the authored rule its misconception's remediation teaches (on that
  // remediation's board), else the last explain point (on its board), said by code; then the SAME card, no verdict, nothing used up
  if (scriptOn() && item && (item.scriptCheck || item.scriptThen) && ["another", "example", "slower"].includes(help)) {
    const sk = skillScriptOf(kit, item.skillId);
    const targets = item.scriptCheck?.targets ?? item.scriptThen?.targets ?? null;
    // (a follow-up card was just given its remediation's words: the other view is the explain point, never the same words again)
    const r = targets && item.scriptCheck ? sk?.remediation?.find((x) => x.targets === targets) : null;
    const b = [...(sk?.explain ?? [])].reverse().find((x) => x.point);
    const lang = s.ctx.lang ?? "hinglish";
    friendOf = s.ctx.firstName ?? "";
    // (O3, main on director21: a remediation is never help — "another" on a check gets the check's own simpler, else the last point)
    void r;
    const own = (item.scriptCheck?.simpler ?? item.scriptThen?.simpler) ? saidIn(item.scriptCheck?.simpler ?? item.scriptThen?.simpler, lang) : null;
    const line = own ?? (b?.point ? saidIn(b.point, lang) : null);
    const board = own ? null : b?.board ?? null;
    if (line) {
      return plan("reteach", SH.ANOTHER_ASKED, { item, probe: probeFor(item), skillId: item.skillId, request: help,
        rendered: [/[.!?।]$/.test(line.trim()) ? line.trim() : `${line.trim()}.`],
        scriptBeat: own ? { ...(cardBeatRef(s, kit, item) ?? {}), scriptId: scriptIdOf(kit), skillId: item.skillId } : { scriptId: scriptIdOf(kit), skillId: item.skillId, beatId: `explain:${b.id}`, kind: "explain", ...(board ? { board } : {}) } });
    }
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
    // 14.4.3 (QA on ac4e8e88, 905a3e50 / b28d919f: "ek example se samjhao" got a park of her own, 6 m by 4 m, then "Total
    // kitna?"): an example asked for before the teaching starts is answered like one asked during it (teachAgainPlan: the
    // kit's worked example when there is one), never the hook with "your own numbers"
    if (p5Flag("STEER") && !input.cls?.help && help === "example" && kit.workedExample && s.phase === "warmup") { s.phase = "teach"; return teachAgainPlan(s, kit, help); }
    if (p5Flag("STEER") && !input.cls?.help && ["another", "example", "story", "slower", "deeper"].includes(help)
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
  if (s.phase === "teachback") return plan("teachback", join(prefix, SH.teachback({ protege: scriptIdOf(input.kit) ? null : s.ctx.protege })), { probe: "P1", format: "F7" });
  return toWrap(s, { kit: input.kit });
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
      if (p5Flag("STEER")) {
        // release 13 (A): never offer a picture that cannot be made: with a subject outside the kit named, the ways in are
        // words only (no "Show me a picture" chip; turn 21 offered "aloo par picture" and nothing could draw it)
        const off = offTopicNow(s, kit);
        // census 14.5 (F1, 3437b744 / e6392332: the same ask three times, the same offer of ways into TODAY's idea): asked
        // again within a few turns, they mean another topic, so real topics of their class are offered as buttons
        const again = (s.topicAsks ?? []).some((t) => s.turn - t <= TOPIC_ASK_WINDOW);
        s.topicAsks = [...(s.topicAsks ?? []), s.turn].slice(-4);
        // (a subject they named outside the kit keeps release 13's own path below: words-only ways in about it)
        // (an explicit ask for another TOPIC, "koi aur topic padhna hai", gets the topics at once: 14.4.2, QA 3a1d1e60)
        // round 7 (main's hybrid-pilot judgement #2, OWNER-RESET #6/#8): a plain "kuch aur baat karte hain" (spoken, or the
        // steer:else chip) is noticed, parked with a promise and come back to; a push again engages briefly (detour). Only an
        // explicit ask for another study TOPIC gets the topic buttons. TAXILA_R7_PARK_TOPIC=off: the ways-in offer as before.
        if (parkTopicOn()) {
          const back = (lead) => (item ? plan(moveKindFor(item), SH.leadThenPose({ item, lead }), { item, probe: probeFor(item), chips: optionChips(item), request: "park" })
            : { ...resume(s, input, item, lead), request: "park" });
          const pushed = again ? recentParked(s.later ?? [], s.turn, null) : null;
          if (pushed && !pushed.share && !req.topic) { s.later = serveLater(s.later, pushed.id, s.turn); return { ...back(SH.detourTo({ topic: pushed.topic })), request: "detour" }; }
          const named = !req.topic ? off : null;
          if (named && !unsafeChildPhrase(named)) {
            const e = parkEntry({ topic: named, learning: false, turn: s.turn, itemOnTable: !!item });
            s.later = parkGate(s, input.kit, input, e);
            if (!(s.later ?? []).includes(e)) return back(null);
            return back(SH.parkIt({ topic: e.topic, promise: e.promise }));
          }
          if (!req.topic) {
            s.sidebar = { asked: s.turn, park: true };
            // (steering, never a break: OWNER-RESET #7)
            return plan("repair", SH.changeTopic(), { chips: [{ id: "stop:continue", label: labels.back }], request: "change_topic" });
          }
        }
        const choices = (again || req.topic) && !(p5Flag("R4CONV") && off) ? nextTopics(s, 2) : [];
        if (choices.length) return plan("break", SH.topicChoices({ titles: choices.map((t) => t.title), first: !again }), {
          chips: [...choices.map((t) => ({ id: `switch:${t.id}`, label: `${t.title}`.slice(0, 40) })), { id: "stop:continue", label: labels.back }], request: "change_topic" });
        const can = waysCan(s, input);
        if (p5Flag("R4CONV") && off) return plan("repair", SH.offerWaysOff({ subject: off }), { chips: waysOffer(labels, { ...can, picture: false }).chips, request: "change_topic" });
        const w = waysOffer(labels, can);
        return plan("repair", SH.offerWays({ ways: w.words }), { chips: w.chips, request: "change_topic" });
      }
      s.sidebar = { asked: s.turn };
      return plan("break", SH.changeTopic(), { chips: [{ id: "stop:continue", label: labels.back }, { id: "break:rest", label: labels.rest }, { id: "stop:end", label: labels.stop }], request: "change_topic" });
    // round 3 fix (experience B8): a named subject to study INSTEAD: that topic of their class is offered (a button starts
    // it: switch:<topicId>), else an honest "not here" with the choices. Never the stop check-in, never a lesson question.
    case "switch": {
      // census 14.5 (F1, 310b8c82 / 3437b744): a chapter of their book by number is that chapter's first topic
      const subject = req.chapter ? `chapter ${req.chapter}` : String(req.subject ?? "").replace(/[^\p{L}\p{N} ]/gu, "").trim().slice(0, 30);
      if (!subject) return null;
      if (unsafeChildPhrase(subject)) return item ? plan(moveKindFor(item), SH.leadThenPose({ item, lead: SH.declineOob() }), { item, probe: probeFor(item), chips: optionChips(item), request: "decline" })
        : plan("repair", SH.declineOob(), { request: "decline" });
      const hit = req.chapter ? chapterTopic(s, req.chapter) : findTopic(subject, s.ctx?.classLevel);
      if (hit && req.chapter && chapterKey(hit.id) === chapterKey(s.topicId)) return resume(s, input, item, "they asked for the chapter you are already on: say so warmly in a few words, then carry on");
      if (hit && hit.id === s.topicId) return resume(s, input, item, "they asked for the topic you are already on: say so warmly in a few words, then carry on");
      // round 4 (session-first, (d)): inside a session the topic they asked for opens a new SEGMENT in this same lesson (its
      // own verified kit), never a new lesson; this turn is one short no-stage line, the next one teaches it
      if (hit && s.session && sessionSwitchTo(s, hit.id, "child_request", input.now ?? Date.now()))
        return plan("intake_agenda", SH.switchGo({ title: hit.title }), { intake: true, segment: { n: s.session.segments.length, topicId: s.topicId, purpose: "child_request", mode: "teach" }, request: "switch" });
      if (hit) {
        const button = `Start ${hit.title}`.slice(0, 40);
        return plan("break", SH.switchOffer({ title: hit.title, chapter: req.chapter, asked: req.chapter ? null : subject, button }), { chips: [{ id: `switch:${hit.id}`, label: button }, { id: "stop:continue", label: labels.back }], request: "switch" });
      }
      // (no topic found for their words: never "not in your class"; real topics of their class on the buttons, as for a repeated ask)
      const near = nextTopics(s, 2);
      return plan("break", SH.switchElsewhere({ subject, titles: near.map((t) => t.title) }), { chips: [...near.map((t) => ({ id: `switch:${t.id}`, label: `${t.title}`.slice(0, 40) })), { id: "stop:continue", label: labels.back }], request: "switch" });
    }
    case "topic": {
      const subject = String(req.subject ?? "").replace(/[^\p{L}\p{N} ]/gu, "").trim().slice(0, 30);
      if (!subject) return null;
      // round 2 safety floor: the subject is the child's words; one that fails the code screen is declined, never taught
      if (unsafeChildPhrase(subject)) return item ? plan(moveKindFor(item), SH.leadThenPose({ item, lead: SH.declineOob() }), { item, probe: probeFor(item), chips: optionChips(item), request: "decline" })
        : plan("repair", SH.declineOob(), { request: "decline" });
      if (item) return plan(moveKindFor(item), SH.pose({ item, prefix: SH.topicAsked({ subject }) }), { item, probe: probeFor(item), chips: optionChips(item), request: "topic" });
      return plan("reteach", SH.topicAsked({ subject, teaching: true }), { skillId: currentSkillId(s, kit, item), request: "topic" });
    }
    case "language": {
      // the lesson's language from now on (compile.js reads ctx.lang every turn; langPinned keeps it when they reply in another)
      // v5 B3 (director7: "Ab se simple Hindi" held for one turn): the language AND "simple/aasan" are a mode for the lesson,
      // held until they ask otherwise (compile.js languageRule reads both every turn; brain/say.js keeps such turns shorter)
      s.ctx = { ...s.ctx, lang: req.lang, langPinned: true, plainWords: /\b(?:simple|aasan|asaan|easy|saral|seedhi|sidhi)\b/i.test(String(input.text ?? "")) || (s.ctx.plainWords && req.lang === s.ctx.lang) };
      // (v6.8 B1‴, main on director16 c6 steady 38, c5-t01 steady 38: a card answered right, its why-probe pending, was re-posed with its
      // simpler on a Hindi request): a closed card is never reopened — the walk goes on, in their language
      if (item && s.pendingWhy === item.id && scriptOn() && isScriptCard(item) && !scriptFor(kit)?.script?.recordedRun) return { ...afterWhy(s, { ...input, cls: { outcome: "no_evidence", confidence: 1, source: "help", flags: {} } }, item), request: "language" };
      // (dc-r8-director25 H4: a Hindi request never gets a key — help's decision, state.js helpBefore)
      if (item) return plan(moveKindFor(item), p5Flag("STEER") ? SH.languageAskedP5({ lang: req.lang }) : SH.pose({ item, prefix: SH.languageAsked({ lang: req.lang }) }), { item, probe: probeFor(item), chips: optionChips(item), request: "language" });
      // (dc-r8-director25 H4: Hindi asked at a key's check-in is help on the card just keyed, decided before the walk)
      return plan("reteach", SH.languageAsked({ lang: req.lang, teaching: true }), { skillId: currentSkillId(s, kit, item), request: "language" });
    }
    case "another": case "example": case "story": case "slower": {
      const p = helpMove(s, input, item, req.type);
      return p && { ...p, request: req.type };
    }
    // round 4 (session-first (f)): "aur batao / go deeper". With a practice question on the table: the harder question on the
    // same skill (the one on the table is left, no verdict); otherwise the same idea one layer further (no new step).
    // census 14.5 (F1, 310b8c82: "theory first, in order"): the idea before any question. A card on the table waits (posed
    // next, no verdict); a planned first-step probe or gap becomes plain teaching.
    case "explain_first": {
      if (s.phase === "warmup") s.phase = "teach";
      if (s.phase === "teach") {
        // (a gap after a planned worked example goes; with none planned it becomes one)
        const ahead = s.teachPlan.slice(s.teachIdx);
        const rest = ahead.map((x) => (x === "first_step" ? "explain" : x)).filter((x) => x !== "fade" || !ahead.includes("worked_example"))
          .map((x) => (x === "fade" ? "worked_example" : x));
        if (rest.join() !== ahead.join()) { s.teachPlan = [...s.teachPlan.slice(0, s.teachIdx), ...rest]; s.fadeItem = undefined; }
        return { ...teach(s, input, SH.explainFirstAsked()), request: "explain_first" };
      }
      if (item && s.phase === "practice") { s.nextItemId = item.id; s.activeItemId = undefined; s.hintLevel = 0; }
      const skillId = currentSkillId(s, kit, item);
      if (!s.introduced.includes(skillId)) s.introduced.push(skillId);
      const sk = kit.skills.find((k) => k.id === skillId) ?? kit.skills[0];
      return plan("explain", SH.explain({ skillTitle: sk.title, prefix: SH.explainFirstAsked(), interest: interestFor(kit, s.ctx.interests, 1) }), { skillId: sk.id, format: kit.formats.primary, request: "explain_first" });
    }
    case "deeper": {
      if (item && s.phase === "practice") {
        s.skipped.push(item.id);
        const h = hardestFor(s, kit, item.skillId);
        if (h) s.nextItemId = h.id;
        return { ...poseNext(s, input, SH.levelDeeper()), request: "deeper" };
      }
      if (item) return plan(moveKindFor(item), SH.pose({ item, prefix: SH.levelDeeper() }), { item, probe: probeFor(item), chips: optionChips(item), request: "deeper" });
      return teachAgainPlan(s, kit, "deeper");
    }
    case "visual": {
      // release 13 (A): a picture of something no piece can show (a subject outside the kit): she says plainly she cannot
      // show it now and gives it in words; no board is asked for, nothing is said to be on the screen (fix 2 makes the claim
      // impossible either way). The image rung (r12/rca/IMAGE-RUNG.md) will lift this for subjects it can draw.
      const off = p5Flag("R4CONV") ? offSubject(req.subject, kit) ?? offTopicNow(s, kit) : null;
      // round 5 (stream 2, the board): WHAT they asked to see rides on the move (move.see -> the whiteboard ask's request), so
      // the board draws it. A thing outside the kit that a simple labelled sketch can show ("aloo dikhao") is sketched on
      // the board, honestly: never claimed as a photo, never pointed at before it is there (drawableSubject: code, before any
      // model). Anything else keeps release 13 (A): she says plainly she cannot show it and gives it in words.
      const see = req.see ? { ...req.see, ...(off ? { subject: off, off: true } : {}) } : off ? { show: "show", subject: off, off: true } : null;
      if (off && see && drawableSubject(off)) {
        // 38aad918: a kept subject is spent once a board is asked for it; a later picture ask that names nothing is not
        // asked for it again (t7, t9-t11 all asked for t6's subject)
        if (s.offTopic && offSubject(s.offTopic.subject, kit) === off) s.offTopic = { ...s.offTopic, spent: s.offTopic.spent ?? s.turn };
        return plan("reteach", SH.drawAsked({ subject: off, show: see.show }), { skillId: currentSkillId(s, kit, item), representation: "diagram", visual: "diagram", request: "visual", see });
      }
      if (off && !unsafeChildPhrase(off)) return plan("reteach", SH.visualUnavailable({ subject: off }), { skillId: currentSkillId(s, kit, item), request: "visual_unavailable" });
      // A picture on the stage (item 5): a re-teach move with the diagram representation, so planModule mounts the item's
      // engine as a show or the explainer@1 board (SHOW_MOVES), and the brain asks Studio for the whiteboard on any lane
      // (brain/propose.js whiteboardAskOf `requested`). A picture of the question on the table is help: it spends a rung.
      // (d29 final, with Learning 017's scripts — steering c5-t02 14, steering c6 14: a picture asked after help on a card just keyed, its why's
      // other wording said over its answer board, is a picture of THAT card — never the earlier card the lesson returns to next, which waits
      // for its back-to line)
      const kh = s.lastMove?.help?.keyed && s.lastMove.help.board && !s.lastUi?.ask?.itemId && scriptOn() && !scriptFor(kit)?.script?.recordedRun ? s.lastMove : null;
      if (kh && item && String(kh.help.part ?? "") && !String(kh.help.part).endsWith(String(item.id).split(":ask:").at(-1) ?? "")) {
        s.stayOn = { beat: { ...(kh.simplerBeat ?? {}), board: kh.help.board }, turn: s.turn };
        return plan("reteach", SH.showVisual({ kind: req.kind }), { skillId: currentSkillId(s, kit, item), representation: "diagram", visual: req.kind ?? "diagram", request: "visual", keyedPicture: true, ...(see ? { see } : {}) });
      }
      if (item && s.pendingWhy !== item.id) s.hintLevel = Math.min(3, s.hintLevel + 1);
      return plan("reteach", SH.showVisual({ kind: req.kind }), { ...(item ? { item } : { skillId: currentSkillId(s, kit, item) }), representation: "diagram", visual: req.kind ?? "diagram", request: "visual", ...(see ? { see } : {}) });
    }
    default: return p5Flag("STEER") ? p5RequestMove(s, input, item, req, labels) : null;
  }
}

/** Is this subject something the kit itself teaches (a skill title, an expectation or an item mentions it)? */
const kitMentions = (kit, subject) => {
  const w = String(subject ?? "").toLowerCase().normalize("NFKC").trim();
  if (!w) return true;
  const text = [...(kit?.skills ?? []).map((k) => k.title), ...(kit?.expectations ?? []), kit?.title ?? "",
    ...(kit?.items ?? []).slice(0, 60).flatMap((i) => [i.prompt_en, i.prompt_hi])].join(" ").toLowerCase().normalize("NFKC");
  return text.includes(w);
};
/**
 * round 5 (stream 2): may a thing the child named outside the kit be sketched on the board? Code, before any model: a short
 * noun phrase (at most 4 words, no digits), nothing the child-safety predicates flag, no person, body, brand or weapon
 * word (r12/rca/IMAGE-RUNG.md §3's subject shape, for a board sketch). Doubt is no.
 */
const NOT_DRAWABLE = /\b(?:me|mujhe|meri|mera|mere|apni|apna|apne|my|myself|i|you|aap|tum|tumhari|tumhara|teri|tera|uski|uska|unki|ladki|ladka|girl|boy|man|woman|aadmi|aurat|person|people|log|face|chehra|body|sharir|nanga|nangi|kapde|bra|underwear|gun|bandook|knife|chaku|chaaku|blood|khoon|bomb|weapon|hathiyar|dead|maut|kill|maar|sex|kiss|logo|brand|selfie|ghar\s+ka\s+pata|address|phone|number)\b/iu;
export const drawableSubject = (subject) => {
  const w = String(subject ?? "").trim();
  return !!w && w.split(/\s+/).length <= 4 && !/\d/.test(w) && !NOT_DRAWABLE.test(w) && !unsafeChildPhrase(w);
};
/** A "something else" asked again within this many turns is a request for another topic (census 14.5, F1). */
const TOPIC_ASK_WINDOW = 6;
/** "c9-maths-ch08-t02" → "c9-maths-ch08". */
const chapterKey = (id) => String(id ?? "").replace(/-t\d+$/, "");
/** The first topic of chapter n of today's class and subject (their book's order), or null. */
function chapterTopic(s, n) {
  const cur = getTopic(s.topicId);
  if (!cur) return null;
  const tag = `-ch${String(n).padStart(2, "0")}-`;
  const id = topicSequence(cur.classLevel, cur.subject).find((t) => t.includes(tag));
  return id ? getTopic(id) : null;
}
/** Up to n other topics of the child's class and this subject, the ones after today's first (curriculum order). */
function nextTopics(s, n) {
  const cur = getTopic(s.topicId);
  if (!cur) return [];
  const seq = topicSequence(cur.classLevel, cur.subject);
  const at = seq.indexOf(cur.id);
  const order = at < 0 ? seq : [...seq.slice(at + 1), ...seq.slice(0, at).reverse()];
  return order.map((id) => getTopic(id)).filter(Boolean).slice(0, n);
}
/** A request's subject when the kit does not teach it, else null. */
const offSubject = (subject, kit) => (subject && !kitMentions(kit, subject) ? String(subject) : null);
/** The off-kit subject the child named in the last few turns (state.offTopic), else null. */
const offTopicNow = (s, kit) => (s.offTopic && s.turn - s.offTopic.turn <= 4 && !(s.offTopic.spent != null && s.turn > s.offTopic.spent) ? offSubject(s.offTopic.subject, kit) : null);

const TEACH_KINDS = new Set(["hook", "explain", "worked_example", "reteach"]);
/** The ways-in chips (the child's words, in her language; r5 QA D41): a picture, a story, a game, or back to the lesson.
 * The Director reads the ids; a label spoken aloud reads as the same request (director/requests.js). */
/** census F4 (main: "the words and the chips from the same list in code"): each way in, its chip and how her shape names
 * it. The chips a turn offers and the words of its shape are both read from this one list (waysOffer). */
const WAYS = [{ id: "req:visual", label: "visual", words: "a picture", needs: "picture" }, { id: "req:story", label: "story", words: "a story" },
  { id: "req:game", label: "game", words: "a game", needs: "game" }];
const waysOffer = (labels, can = { picture: true, game: true }) => {
  const ways = WAYS.filter((w) => !w.needs || can[w.needs]);
  return { words: ways.map((w) => w.words), chips: [...ways.map((w) => ({ id: w.id, label: labels[w.label] })), { id: "stop:continue", label: labels.back }] };
};
/** census F4 (a95d2ff1, 6c45a7ea, c85501ec: a picture / game offered that no path could build): the ways in that can be
 * answered now. Studio's read (input.ways, brain/turn.js) for a picture and a play piece; a game also when the topic's own
 * engine can mount one. No read (tests, old callers): every way, as before. */
function waysCan(s, input) {
  const w = input.ways;
  if (!w) return { picture: true, game: true };
  return { picture: w.picture !== false, game: !!w.game || topicGameFor(s, input.kit, s.ctx?.lang, s.probeSess?.band) };
}
/** The request types p5-interaction adds (conversation/lexicon.js readings and the UNDERSTAND note, via policy.js). */
export const P5_REQUESTS = new Set(["clarify", "repeat", "back", "skip", "know", "harder", "easier", "boredom", "frustration", "thinking", "identity",
  "uptake", "decline", "answer_q", "adapt", "adopt", "adult", "park", "detour", "stop", "hold_checkin", "ask_invite", "unclear", "play_act", "selftry"]);

/** A teach-phase re-explanation of the idea being taught now (the teach step does not advance). */
function teachAgainPlan(s, kit, how) {
  const skillId = currentSkillId(s, kit, null);
  // 14.4.3: an example asked for is the kit's worked example (its verified numbers), whole and SHOWN (move.stuck: the reply
  // guard holds her to showing, and to the example's own numbers)
  if (how === "example" && kit.workedExample) return plan("reteach", SH.teachAgain({ how, kitExample: true }), { skillId, content: workedContent(kit.workedExample, 1, 1), request: how, stuck: true });
  const content = (s.lastContent ?? []).filter((l) => typeof l === "string").length ? s.lastContent
    : [`the idea being taught: ${kit.skills.find((k) => k.id === skillId)?.title ?? kit.skills[0]?.title ?? ""}`];
  return plan("reteach", SH.teachAgain({ how }), { skillId, content, request: how });
}

/** The hardest not-yet-done practice item of a skill (difficulty, then the queue's order), or null. */
/** The easiest unasked practice item of a skill (a light check), or null. */
function easiestFor(s, kit, skillId) {
  const done = new Set([...s.itemsDone, ...s.skipped, s.activeItemId]);
  const KINDS = new Set(["practice", "near_transfer", "retrieval"]);
  return kit.items.filter((i) => i.skillId === skillId && !done.has(i.id) && KINDS.has(i.kind))
    .sort((a, b) => (a.difficulty ?? 0) - (b.difficulty ?? 0))[0] ?? null;
}

/**
 * round 5 (owner 2026-10-14: "the understood-or-not concept"): "haan haan samajh gaya" right after an explanation is a claim,
 * not evidence (director/read.js reads it `partly`). Once per skill it gets a LIGHT check — the easiest question of that
 * skill, posed warmly, never "did you really understand?" — instead of more teaching on trust. A right answer counts and the
 * lesson moves on; a wrong one takes the usual path (hints, a different way).
 */
function bluffCheck(s, input) {
  if (!p5Flag("R4CONV") || input.event !== "turn" || !claimsToUnderstand(input.text) || !["explain", "worked_example", "reteach"].includes(s.lastMove?.kind) || s.lastMove?.itemId) return null;
  const sk = s.lastMove.skillId;
  if (!sk || (s.bluffChecked ?? []).includes(sk)) return null;
  const easy = easiestFor(s, input.kit, sk);
  if (!easy) return null;
  s.bluffChecked = [...(s.bluffChecked ?? []), sk];
  if (!s.introduced.includes(sk)) s.introduced.push(sk);
  s.teachIdx = s.teachPlan.length; s.phase = "practice";
  return { ...poseNext(s, input, SH.lightCheck(), easy), request: "light_check" };
}

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
      // (dc-r8-director25 H4: a clarify on a card with nothing unsaid gets its key by help's decision, state.js helpBefore — not here)
      if (item) return plan("repair", SH.clarifyQuestion(), { item, chips: optionChips(item), request: "clarify", lead: "they asked what the question means" });
      return teachAgainPlan(s, kit, "another");
    // v5 B2 (director7: "pehle main try karun" got the answer anyway): they try the step themselves. In the worked example
    // the shown steps stop and their own step is the card now (the full answer and why come after it, as always); with a card
    // live it is posed again, no verdict, nothing new said; never the answer this turn
    case "selftry": {
      const w = s.walk;
      if (w && scriptOn() && String(w.beats?.[w.i] ?? "") === "worked" && w.workedPosed && !s.activeItemId) {
        w.workedStep = Number.MAX_SAFE_INTEGER;
        const p = walkNext(s, input, SH.selfTry());
        if (p) return { ...p, request: "selftry" };
      }
      if (item) return plan(moveKindFor(item), SH.pose({ item, prefix: SH.selfTry() }), { item, probe: probeFor(item), chips: optionChips(item), request: "selftry" });
      return withLead(SH.selfTry());
    }
    case "repeat": {
      if (item) return plan(moveKindFor(item), SH.pose({ item, prefix: SH.repeatShort() }), { item, probe: probeFor(item), chips: optionChips(item), request: "repeat" });
      const kind = ["hook", "explain", "worked_example", "reteach"].includes(s.lastMove?.kind) ? s.lastMove.kind : "reteach";
      return plan(kind, join(SH.repeatShort(), s.lastMove?.shape), { skillId: currentSkillId(s, kit, item), content: s.lastContent ?? [], request: "repeat" });
    }
    // r12 RCA failure 4: the board comes down this turn (brain/turn.js retires the Studio board on move.clear), then the step
    // they were on, in words
    case "clear_board": { const p = withLead(SH.boardCleared()); return p && { ...p, clear: "board" }; }
    case "back": return item && p5Flag("R4CONV") && s.pinItem === item.id && (s.pinRun ?? 0) >= 2 ? backOnHeldCard(s, input, item) : withLead(SH.welcomeBack());
    case "skip": return item ? { ...leaveItem(s, input, item, SH.SKIP_ITEM), request: "skip" } : helpMove(s, input, item, "skip");
    case "know": {
      // round 4 (conversation; battery skip_ahead 1/7): "ye mujhe aata hai, aage chalo" got the SAME question back, or one
      // more line of teaching. Taken at their word: the skill counts as introduced (no explain turn first), and a question on
      // the table is left (no verdict) for the hardest one of its skill, the quick check that proves it
      if (p5Flag("R4CONV")) {
        const sk = currentSkillId(s, kit, item);
        if (sk && !s.introduced.includes(sk)) s.introduced.push(sk);
        if (item && s.phase === "practice") {
          s.skipped.push(item.id);
          const h = hardestFor(s, kit, item.skillId);
          if (h) s.nextItemId = h.id;
          return { ...poseNext(s, input, SH.KNOWS_IT), request: "know" };
        }
        if (item && s.phase === "warmup") { s.skipped.push(item.id); return { ...nextWarmup(s, input, SH.KNOWS_IT), request: "know" }; }
      }
      return { ...helpMove(s, input, item, "know"), request: "know" };
    }
    case "harder": case "easier": {
      if (!item || s.phase !== "practice") return req.type === "harder" ? { ...helpMove(s, input, item, "know"), request: "harder" } : teachAgainPlan(s, kit, "another");
      s.skipped.push(item.id);                                   // left, no verdict: it was never their answer
      if (req.type === "easier") s.easier = true;
      else { const h = hardestFor(s, kit, item.skillId); if (h) s.nextItemId = h.id; }
      return { ...poseNext(s, input, req.type === "harder" ? SH.levelHarder() : SH.levelEasier()), request: req.type };
    }
    case "boredom": { const w = waysOffer(labels, waysCan(s, input)); return plan("repair", SH.boredOffer({ ways: w.words }), { chips: w.chips, request: "boredom" }); }
    case "frustration": {
      // round 3: no question on the table: the re-explanation still opens with the empathy line (it had none)
      if (!item) { const t = teachAgainPlan(s, kit, "another"); return p5Flag("R3CONV") ? { ...t, shape: join(SH.frustrationTeach(), t.shape), request: "frustration" } : t; }
      // round 7 A8 part 2 (PIPELINE §A Brain item 7, product policy: frustration changes the approach, never re-poses): the
      // card is left for later (no verdict; the card cap's "leave"), and the idea is taught again another way, with the
      // empathy line first. TAXILA_R7_FRUSTRATION=off: a hint rung on the same question, as before.
      if (frustrationNewWayOn()) {
        if (!s.skipped.includes(item.id)) s.skipped.push(item.id);
        s.activeItemId = undefined; s.hintLevel = 0; s.unclear = 0;
        const t = teachAgainPlan(s, kit, "another");
        return { ...t, shape: join(SH.frustrationTeach(), t.shape), request: "frustration" };
      }
      const p = decideAs(s, input, item, "stuck");
      return { ...p, shape: join(SH.frustrationFirst(), p.shape), request: "frustration" };
    }
    // a mid-thought: no question pinned this turn (no re-ask), the item stays the active one
    case "thinking": return plan("repair", SH.waitThinking(), { request: "thinking" });
    // v6.10 T2: the card stays live; one short line asks for their answer once more (brain/say.js ASK_AGAIN, or the script's joints)
    case "ask_again": if (item) { s.askedAgain = item.id; return plan("repair", SH.waitThinking(), { item, request: "ask_again" }); } return null;
    // ship5 fixer (experience B4): the duplex floor's hold offer (the child said "ruko / ek second" and then stayed quiet):
    // one warm check-in, no verdict, the item stays the active one (V5.2)
    case "hold_checkin": return plan("repair", SH.holdCheckin(), { request: "hold_checkin" });
    case "ask_invite": return plan("repair", SH.inviteQuestion(), { request: "ask_invite" });
    // round 3 fix (adversarial B2): a game command while the play piece is up is the game's act: no verdict on the folded
    // card, no rung spent, nothing pinned, the item stays the active one (like a mid-thought)
    case "play_act": return plan("repair", SH.playActWait(), { request: "play_act" });
    case "identity": parkAside(s, kit, input, item); return withLead(SH.disclose());
    case "uptake": {
      // round 3 (conversation): a share from their life is noticed now AND kept: a real later slot (s.later), so the promise
      // to come back to it is kept (served when the question resolves, or before the wrap). The topic is the child's words
      // as the note lifted them: screened in code like any parked topic (round 2 safety floor B3).
      // round 3 fix (adversarial N3): never a SAD share ("mera dog kal mar gaya" was promised back and returned after the next
      // right answer): it gets the one gentle line now (the relational overlay share_uptake_gentle) and is not brought back
      const sad = [input.text, req.topic].some((t) => t && signalsOf(String(t), { harm: false }).some((x) => x.kind === "share_sad"));
      // (v4 W6, director6: "kal maine cricket khela" came with no topic and was never parked: in script mode an aside's topic
      // is found in code, from the child's own words, when the note gave none)
      const topic0 = req.topic ?? (scriptOn() && scriptIdOf(kit) ? asideTopic(input.text, s.ctx.interests) : null);
      if (p5Flag("R3CONV") && (req.kind === "personal_share" || (!req.topic && topic0)) && topic0 && !unsafeChildPhrase(topic0) && !sad) {
        const e = { ...parkEntry({ topic: topic0, learning: false, turn: s.turn, itemOnTable: !!item }), share: true };
        const before = (s.later ?? []).length;
        s.later = parkGate(s, input.kit, input, e);
        if (s.later.length > before) return withLead(SH.uptakeShare({ topic: e.topic, promise: e.promise }));
        // (v6.7 A3: a taste question or a repeated aside parks nothing: brain/say.js answers it; the card goes on)
        if (s.tasteAsked?.turn === s.turn || s.asideAgain?.turn === s.turn) return withLead(null);
      }
      return withLead(SH.uptake({ kind: req.kind }));
    }
    case "decline": return withLead(SH.declineOob());
    case "answer_q": parkAside(s, kit, input, item); return withLead(SH.answerTheirQuestion());
    case "adapt": case "adopt":
      // round 2 safety floor (adversarial B1): the method is the child's words as a model lifted them; it is written into
      // her instructions (this move, and s.prefs on EVERY later move) only when it passes the code screen. A failing one
      // is declined like an out-of-bounds ask, and never stored.
      if (req.methodId) return withLead(SH.adaptTo({ method: METHOD_NOTE[req.methodId] }));
      if (req.method && unsafeChildPhrase(req.method)) return withLead(SH.declineOob());
      if (req.method) s.prefs = [...new Set([...(s.prefs ?? []), String(req.method).slice(0, 40)])].slice(-4);
      return withLead(SH.adaptTo({ method: req.method }));
    case "adult": return withLead(SH.adultVoice());
    // round 2 (conversation): a broken-off or garbled turn: no verdict, a no-blame ask to say it again or finish it
    // Typed input never gets "say it again" (they typed it; audit G4, unclear() above): no move of its own, so the phase
    // decides (a typed non-answer on an item gets the typed nudge). Round 2 integration: the note read a typed bare "7" as
    // noise and the lesson answered "aapne 7 kaha, poori baat dobara kahiye" (w1a-battery: repair moves on typed input 1+1).
    case "unclear": {
      if (input.typed) return null;
      // round 7 (judgement #4): a heard word or number on a question is off-format, never "say it again" (no hearing claim)
      const heard = String(input.text ?? "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
      if (item && heard && heard.split(" ").length <= 6) return { ...withLead(SH.offFormat({ said: heard })), request: "off_format" };
      return item ? withLead(SH.unclearAgain()) : plan("repair", SH.unclearAgain(), { request: "unclear" });
    }
    // round 7 A7: a tap on a Later entry (chipId later:<id>) is "talk about it now": served here, the lesson carries on
    case "later": {
      const e = tappedEntry(s.later, req.id);
      if (!e) return null;
      s.later = serveLater(s.later, e.id, s.turn);
      s.servedNow = { topic: e.topic, share: !!e.share };
      return withLead(SH.returnParked({ topic: e.topic, share: !!e.share }));
    }
    case "park": {
      // round 2 safety floor (adversarial B3): a parked topic is promised back later ("we'll come back to X"): screened too
      if (unsafeChildPhrase(req.topic)) return withLead(SH.declineOob());
      // round 3 (conversation; smoke on the round-3 tree): a push again on what was JUST parked ("nahi pehle batao na
      // please", which the note read as diversion again) got a second "after this question" — the flat second refusal the
      // insistence rubric fails. The same topic parked within DETOUR_WITHIN turns is a push: a short real engagement now.
      const again = p5Flag("R3CONV") ? recentParked(s.later ?? [], s.turn, req.topic) : null;
      if (again && !again.share) { s.later = serveLater(s.later, again.id, s.turn); return withLead(SH.detourTo({ topic: again.topic })); }
      const e = parkEntry({ topic: req.topic, learning: req.learning, turn: s.turn, itemOnTable: !!item });
      s.later = parkGate(s, input.kit, input, e);
      if (!(s.later ?? []).includes(e)) return withLead(null);
      return withLead(SH.parkIt({ topic: e.topic, promise: e.promise }));
    }
    case "detour": {
      // round 2 safety floor (adversarial B3): "engage for real" only on a topic that passes the code screen
      if (unsafeChildPhrase(req.topic)) return withLead(SH.declineOob());
      const p = recentParked(s.later ?? [], s.turn, req.topic);
      // round 2 (conversation): a push again with nothing parked (the first ask got an uptake, or was parked more than
      // DETOUR_WITHIN turns ago) is still a second ask: a short real engagement now, never a second "later" (battery
      // insistence: "refuses" 4/10 on the local base run 2026-10-06)
      if (!p) return withLead(SH.detourTo({ topic: req.topic }));
      s.later = serveLater(s.later, p.id, s.turn);
      return withLead(SH.detourTo({ topic: p.topic }));
    }
    case "stop": {
      // a stop or a leaving read by the UNDERSTAND note alone: ONE check-in (OWNER-RESET #7); a second within two turns ends it
      if (s.stopAsked != null && s.turn - s.stopAsked <= 2) return toWrap(s, { stopping: true, kit: input.kit });
      s.stopAsked = s.turn;
      return plan("break", SH.stopCheck(), { chips: [{ id: "stop:continue", label: labels.go }, { id: "break:rest", label: labels.rest }, { id: "stop:end", label: labels.stop }], request: "stop", checkin: "stop" });
    }
    default: return null;
  }
}

/**
 * round 4 (patch 14; owner-2 prod-like R5.loop at seeds 7 and 1010, s5-zoya c5-evs): back from a pause ("mummy bula rahi
 * thi, haan", "ek min... haan bolo") to a card already held two turns re-posed the SAME card, word for word, a 3rd and 4th
 * time. A child who has not answered it twice needs a smaller step, not the same one: the choices on screen (no rung spent,
 * as the unclear ladder does), else one hint rung. Still no evidence. The card cap resolves the question on the next turn
 * if it is still not answered.
 */
function backOnHeldCard(s, input, item) {
  const lead = SH.welcomeBack();
  const shown = !!(s.lastUi?.chips?.length && s.lastMove?.itemId === item.id);
  const chips = shown ? undefined : offerChoices(s, input.kit, item);
  if (chips) return plan(input.typed ? "hint" : "repair", join(lead, SH.offerChoices()), { item, chips, lead, request: "back" });
  const p = decideAs(s, input, item, "stuck");
  return { ...p, shape: join(lead, p.shape), lead, request: "back" };
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

function enterTeachback(s, prefix, kit) {
  // CONVERSATION-V2 §5: every open parked question is offered before the wrap
  if (p5Flag("STEER") && s.later?.length) {
    const due = dueParked(s.later, "before_wrap");
    if (due) { s.later = serveLater(s.later, due.id, s.turn); prefix = join(prefix, SH.returnParked({ topic: due.topic, share: !!due.share })); s.servedNow = { topic: due.topic, share: !!due.share, said: due.said ?? null }; }
  }
  s.phase = "teachback"; s.teachbackAsked = true; s.activeItemId = undefined; s.hintLevel = 0;
  // The lesson's teach-back IS shape C01 (announced protégé teach-back): its answer is a probe turn in the budget.
  s.pendingProbe = { skillId: s.introduced[0] ?? null, shapeId: "C01", facet: "U", mandatory: true, reason: "lesson_teachback", testWeight: testWeight(shapeById("C01")), family: "A", cls: "probe.teachback", longForm: true };
  // (2.4: a script's own teach-back — Learning writes the question, its key and why, and its board; the model writes none of it.
  // An authored board goes as a normal board ref, drawn fresh; with none, the board is cleared)
  const tb = authoredEnd(kit)?.teachback;
  if (tb?.prompt) {
    const q = saidIn(tb.prompt, s.ctx.lang ?? "hinglish");
    if (q && String(q).trim()) {
      s.teachbackScript = true;
      // (dc-r8-director22 T2, main's 031: one of Learning's teachback.leadIn forms before the question, the form picked by a rotation
      // seeded by the lesson, as the joints are)
      const leads = (Array.isArray(tb.leadIn) ? tb.leadIn : []).map((f) => saidIn(f, s.ctx.lang ?? "hinglish")).filter((x) => x && String(x).trim());
      const seedK = [...String(kit?.topicId ?? "")].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
      const lead = leads.length ? leads[(Math.imul(((s.seed ?? 0) >>> 0) ^ seedK, 2654435761) >>> 0) % leads.length] : null;
      return plan("teachback", join(prefix, SH.teachback({ protege: null })), { probe: "P1", format: "F7", rendered: [...(lead ? [endLine(lead)] : []), endLine(q)], renderedKinds: [...(lead ? ["leadIn"] : []), "closingQuestion"], authoredEnd: "teachback",
        ...(tb.board ? { scriptBeat: { scriptId: scriptIdOf(kit), skillId: "end", beatId: "teachback", kind: "teachback", board: tb.board, mode: "fresh" } } : {}) });
    }
  }
  return plan("teachback", join(prefix, SH.teachback({ protege: kit && scriptIdOf(kit) ? null : s.ctx.protege })), { probe: "P1", format: "F7" });
}
/** 2.4: the script whose ending (teachback, wrap) is authored — null for a recorded run, no script, or scripts off. */
function authoredEnd(kit) {
  if (!kit || !scriptOn() || !scriptIdOf(kit)) return null;
  const sc = scriptFor(kit)?.script;
  return sc && !sc.recordedRun ? sc : null;
}
const endLine = (x) => (/[.!?\u0964]$/.test(String(x).trim()) ? String(x).trim() : `${String(x).trim()}.`);
/** dc-r8-director22 R: the reader's reading of a line while the script's teach-back is open — correct when it is the key or a form
 *  Learning accepts, incorrect when it states a number or fraction that is not, else no reading (a non-answer); null when no script
 *  teach-back is open. */
export function teachbackReading(s, kit, text) {
  if (s?.phase !== "teachback" || !s.teachbackScript || s.teachbackKeyed) return null;
  const tb = authoredEnd(kit)?.teachback;
  if (!tb?.key) return null;
  return teachbackHit(tb, text) ? "correct" : /\d/.test(String(text ?? "")) ? "incorrect" : "no_evidence";
}
/** Her teach-back answer against the authored key and its accepted forms (a key, never a model's grade). */
function teachbackHit(tb, text) {
  const norm = (x) => ` ${String(x ?? "").toLowerCase().replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim()} `;
  const said = norm(text);
  return [tb.key, ...(tb.accept ?? [])].filter((k) => k != null && String(k).trim()).some((k) => said.includes(norm(k)));
}

function teachback(s, input) {
  const { cls, kit } = input;
  const tb = s.teachbackScript ? authoredEnd(kit)?.teachback : null;
  if (tb) {
    // (dc-r8-director22 T3: the verdict is a turn of its own — her reply to it, whatever it is, gets the wrap)
    // (026: the wrap is said over the teach-back's answer board and holds it)
    // (dc-r8-director23 T2: when the child says something after the key's check-in, the wrap opens with one short authored acknowledgement)
    if (s.teachbackKeyed) { s.teachbackKeyed = undefined; return { ...toWrap(s, { kit, afterKey: String(input.text ?? "").trim().length > 0 }), ...(tb.answerBoard ? { holdBoard: true } : {}) }; }
    // (2.4: a right answer — the key or a form Learning accepts — is told so; anything else gets the key and its why, once)
    s.teachbackTries += 1;
    const lang = s.ctx.lang ?? "hinglish";
    const hit = teachbackHit(tb, input.text);
    // (main's 031: a right answer gets no check-in — the verdict leads the wrap in the same turn, over the answer board from its first word)
    // (dc-r8-director26 W1: the closing verdict says its why — c4 steady 128, c5-t01 steady 130 said "Haan, sahi hai." and went on)
    if (hit) {
      s.teachbackPassed = true;
      const s0 = structuredClone(s);
      const w = { ...toWrap(s, { kit, keyFirst: { line: null, board: tb.answerBoard ?? null } }), endVerdict: "correct", ...(tb.why ? { endWhy: tb.why } : {}) };
      // (the verdict, its why, what was covered and the closing question over 75 words: the verdict and its why are a turn of their own, as a
      // miss's key is — then the wrap. Learning shortens the covered sentences; until then the turn is not a monologue)
      const wc = (x) => String(x ?? "").split(/\s+/).filter(Boolean).length;
      const why0 = tb.why ? saidIn(tb.why, s.ctx.lang ?? "hinglish") : "";
      if (l2On() && w.authoredEnd === "wrapCovered" && 4 + wc(why0) + wc((w.rendered ?? []).join(" ")) + wc(w.wrapAsk) > L2_CAP) {
        for (const k of Object.keys(s)) if (!(k in s0)) delete s[k];
        Object.assign(s, s0);
        s.teachbackPassed = true; s.teachbackKeyed = true;
        const board = tb.answerBoard ?? null;
        return plan("teachback", SH.teachback({ protege: null }), { probe: "P1", format: "F7", rendered: [], authoredEnd: "teachbackKey", ...(board ? {} : { clear: "board" }), endVerdict: "correct", ...(tb.why ? { endWhy: tb.why } : {}),
          ...(board ? { scriptBeat: { scriptId: scriptIdOf(kit), skillId: "end", beatId: "teachback:answer", kind: "teachback", board, mode: "fresh" } } : {}) });
      }
      return w;
    }
    // (dc-r8-director27 P4, c5-t02 steady 126, c6 steady 108: a miss on the closing question got the key at once with teachback.simpler
    // unsaid. It goes through the picker: a wording left — the miss verdict, the hint, the question again; none left — the key)
    const tbD = pickHelp({ script: authoredEnd(kit), part: TEACHBACK_PART, request: "hint", said: saidNowOf(s), lang: lang === "english" ? "english" : "hinglish" });
    if (tbD?.rung?.text) {
      const q = saidIn(tb.prompt, lang);
      if (q && String(q).trim()) {
        return plan("teachback", SH.teachback({ protege: null }), { probe: "P1", format: "F7", rendered: [endLine(tbD.rung.text), endLine(q)], renderedKinds: ["help", "closingQuestion"], authoredEnd: "teachback", endVerdict: "not_yet",
          ...(tb.board ? { scriptBeat: { scriptId: scriptIdOf(kit), skillId: "end", beatId: "teachback", kind: "teachback", board: tb.board, mode: "fresh" } } : {}) });
      }
    }
    const why = tb.why ? saidIn(tb.why, lang) : null;
    const en = lang === "english";
    const keyLine = hit ? null : `${en ? "The answer is" : "Iska jawab hai"} ${tb.key}${why && String(why).trim() ? `, ${en ? "because" : "kyunki"} ${joinable(String(why).trim().replace(/[.!?\u0964]+$/, ""), { lower: true })}` : ""}.`;
    s.teachbackKeyed = true;
    // (main's 026, director22 T1: the key turn shows the teach-back's answerBoard from its first word, else a cleared board — never
    // its question board; the wrap that follows holds it)
    const board = tb.answerBoard ?? null;
    return plan("teachback", SH.teachback({ protege: null }), { probe: "P1", format: "F7", rendered: keyLine ? [keyLine] : [], authoredEnd: "teachbackKey", ...(board ? {} : { clear: "board" }),
      // (dc-r8-director23 T2, c6 steady 114: a miss on the closing question gets a miss verdict before the key)
      endVerdict: hit ? "correct" : "not_yet",
      ...(board ? { scriptBeat: { scriptId: scriptIdOf(kit), skillId: "end", beatId: "teachback:answer", kind: "teachback", board, mode: "fresh" } } : {}) });
  }
  s.teachbackTries += 1;
  if (cls?.outcome === "correct") { s.teachbackPassed = true; return toWrap(s, { prefix: SH.CONFIRM.teachbackPass, kit }); }
  if (s.teachbackTries >= LIMITS.teachbackTries) return toWrap(s, { kit });
  const m = cls?.outcome === "misconception" ? kit.misconceptions.find((x) => x.id === cls.misconceptionId) : null;
  if (m) s.flagged[m.id] = (s.flagged[m.id] ?? 0) + 1;
  const missing = m ? `whether "${m.belief}" is true` : cls?.missing?.[0] ?? "the main idea, in simple words";
  return plan("teachback", SH.teachbackFollowup({ protege: scriptIdOf(kit) ? null : s.ctx.protege, missing }), { probe: "P1", format: "F7" });
}

/** main's R7: the wrap's closing question when a script has no `wrap.ask` (the compile report lists the hole). */
export const WRAP_ASK_FALLBACK = Object.freeze({ hi: "Aaj ka paath kaisa laga?", en: "How did today's lesson feel?" });
/** One of a list, rotated by the lesson (its seed and key) and a salt, so two lists do not move in step. */
function lessonPick(s, list, salt = "") {
  if (!list?.length) return null;
  const h = [...`${String(s.ctx?.lessonKey ?? s.ctx?.sessionId ?? "")}|${salt}`].reduce((a, c) => Math.imul(a ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
  return list[(Math.imul(((s.seed ?? 0) >>> 0) ^ h, 2654435761) >>> 0) % list.length];
}
function toWrap(s, { prefix, stopping = false, kit = null, keyFirst = null, afterKey = false, second = null }) {
  if (stopping && !["wrap", "done"].includes(s.phase)) s.stoppedEarly = true;   // child.js countsAsDone (owner-truth item 3)
  const phase0 = s.phase;
  // round 4: a wrap the lesson reaches by itself (time, the plan) keeps the promise to come back to what they shared or asked;
  // never on a child's stop or goodbye (letting them go is quick: NEVER MANIPULATE)
  if (!stopping && !second && p5Flag("R4CONV") && s.later?.length) {
    const due = dueParked(s.later, "before_wrap");
    if (due) {
      s.later = serveLater(s.later, due.id, s.turn); s.servedNow = { topic: due.topic, share: !!due.share, said: due.said ?? null };
      // round 7 T3 (listening contract): a parked promise is RETURNED before the wrap, on a turn of its own; the wrap waits (the
      // next turn wraps, or returns the next open one). TAXILA_R7_WRAP_BLOCK=off: folded into the wrap as before
      if (wrapBlockOn()) {
        s.wrapAfter = { prefix: prefix ?? null };
        s.activeItemId = undefined; s.pendingWhy = undefined; s.hintLevel = 0;
        return plan("repair", join(SH.returnParked({ topic: due.topic, share: !!due.share }), SH.returnedTurn({ share: !!due.share })), { request: "returned" });
      }
      prefix = join(prefix, SH.returnParked({ topic: due.topic, share: !!due.share }));
    }
  }
  s.wrapAfter = undefined;
  s.stopAsked = undefined; s.sidebar = undefined;
  s.phase = "done"; s.activeItemId = undefined; s.pendingWhy = undefined; s.hintLevel = 0;
  // (2.4: the script's wrap — what was covered, in two sentences, and the goodbye — is said as written; on her stop, the goodbye alone)
  const w = authoredEnd(kit)?.wrap;
  const lang = s.ctx.lang ?? "hinglish";
  // (dc-r8-director22 T5, main's 031: the covered sentence of each skill the lesson reached, in order; wrap.covered only for a script with
  // no per-skill sentences)
  const sc = authoredEnd(kit);
  const reached = new Set(s.introduced ?? []);
  const bySkill = (sc?.skills ?? []).filter((k) => reached.has(k.skillId) && k.covered).map((k) => saidIn(k.covered, lang)).filter((x) => x && String(x).trim());
  const hasPerSkill = (sc?.skills ?? []).some((k) => k.covered);
  const covered = stopping ? null : hasPerSkill ? (bySkill.length ? bySkill.join(" ") : null) : w?.covered ? saidIn(w.covered, lang) : null;
  const bye = w?.goodbye ? saidIn(w.goodbye, lang) : null;
  if (bye && String(bye).trim()) {
    // (Learning's `wrap.ack` forms: one, rotated by the lesson's seed, when the child spoke after the closing key's check-in)
    const acks = afterKey && !stopping ? (Array.isArray(w?.ack) ? w.ack : []).map((f) => saidIn(f, lang)).filter((x) => x && String(x).trim()) : [];
    const ack = acks.length ? acks[(Math.imul(((s.seed ?? 0) >>> 0) ^ [...String(s.ctx?.lessonKey ?? s.ctx?.sessionId ?? "")].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261), 2654435761) >>> 0) % acks.length] : null;
    // (dc-r8-director25 L2 item 2: the wrap is two turns while the child is still there. Turn one: what was covered, ending on a check-in
    // (brain/say.js), the lesson not yet over. Turn two, after her reply: the acknowledgement — only when she spoke after the closing key's
    // check-in — the sentence to her and the goodbye. On her stop, the goodbye alone, as before)
    // (main's R7 on the merged tree: turn one ends on the wrap's closing question — `wrap.ask`, rotated by the lesson — not a comprehension
    // check-in: "samajh nahi aaya" to "Yahan tak theek hai?" got "Achha, theek hai." and the goodbye, a brush-off. Her answer to it is not
    // graded, not help and no reason to re-teach: turn two always follows, opening on a `wrap.ack` form whenever she replied)
    if (second) {
      const ack2 = second.replied && !second.ack ? lessonPick(s, (Array.isArray(w?.ack) ? w.ack : []).map((f) => saidIn(f, lang)).filter((x) => x && String(x).trim()), "wrapAck") : null;
      const ackS = second.ack ?? ack2;
      const lines2 = [ackS, bye].filter((x) => x && String(x).trim()).map(endLine);
      return plan("wrap", SH.wrap({ prefix, nextTitle: s.ctx.nextTitle, stopping }), { rendered: lines2, authoredEnd: "wrap", wrapPart: 2, ...(ackS ? { wrapAck: endLine(ackS) } : {}),
        ...(second.board ? { scriptBeat: { scriptId: scriptIdOf(kit), skillId: "end", beatId: "teachback:answer", kind: "teachback", board: second.board, mode: "fresh" } } : {}) });
    }
    if (l2On() && !stopping && covered && String(covered).trim()) {
      s.phase = phase0 === "done" ? "teachback" : phase0;
      // (the ack waits for her answer to the closing question: turn two opens on it whenever she replied)
      s.wrapTwo = { ack: null, board: keyFirst?.board ?? null };
      const asks = (Array.isArray(w?.ask) && w.ask.length ? w.ask : [WRAP_ASK_FALLBACK]).map((f) => saidIn(f, lang)).filter((x) => x && String(x).trim());
      const wrapAsk = lessonPick(s, asks, "wrapAsk") ?? saidIn(WRAP_ASK_FALLBACK, lang);
      // (dc-r8-director26 W1: what the child said after the closing key's check-in is answered by the acknowledgement first — c5-t02 steady
      // 157 "mujhe laga aisa hi hoga", c6 steady 113 "shayad gin ke" were dropped)
      return plan("wrap", SH.wrap({ prefix, nextTitle: s.ctx.nextTitle, stopping }), { rendered: [...(ack ? [endLine(ack)] : []), endLine(covered)], authoredEnd: "wrapCovered", wrapPart: 1, wrapAsk: String(wrapAsk).trim(),
        ...(ack ? { wrapAck: endLine(ack) } : {}),
        ...(keyFirst?.line ? { endKey: keyFirst.line } : {}),
        ...(keyFirst?.board ? { scriptBeat: { scriptId: scriptIdOf(kit), skillId: "end", beatId: "teachback:answer", kind: "teachback", board: keyFirst.board, mode: "fresh" } } : {}) });
    }
    const lines = [ack, covered, bye].filter((x) => x && String(x).trim()).map(endLine);
    return plan("wrap", SH.wrap({ prefix, nextTitle: s.ctx.nextTitle, stopping }), { ...(stopping ? { stopping: true } : {}), rendered: lines, authoredEnd: "wrap",
      ...(keyFirst?.line ? { endKey: keyFirst.line } : {}),
      ...(keyFirst?.board ? { scriptBeat: { scriptId: scriptIdOf(kit), skillId: "end", beatId: "teachback:answer", kind: "teachback", board: keyFirst.board, mode: "fresh" } } : {}) });
  }
  return plan("wrap", SH.wrap({ prefix, nextTitle: s.ctx.nextTitle, stopping }), stopping ? { stopping: true } : {});
}

const ORDINAL = [/^(?:1|ek|one|pehla|pehli|pahla|first)[\s.!?]*$/i, /^(?:2|do|two|doosra|doosri|dusra|dusri|second)[\s.!?]*$/i, /^(?:3|teen|three|teesra|teesri|tisra|third)[\s.!?]*$/i];

// ───────────────────────────── step ─────────────────────────────

function decide(s, input, item) {
  const { cls, chipId } = input;
  // round 7 (judgement #3): was a safeguarding episode (any tier) open when this turn began? A goodbye then is let go at once
  const prevSafe = !!s.safeguard;
  const flags = cls?.flags ?? {};
  const labels = chipLabels(s.ctx?.lang);
  // 1. Safety before anything else — the predicate or the classifier, either one.
  // `kind`: what raised it (the predicate's family, or model / content_filter / relational_floor) — only the wording of a
  // fallback line reads it (brain/say.js fallbackReply, F10); the hold itself is the same for every trigger.
  // 14.3 (main safety review; sim lab rel143 p66 r3: "I am okay … it just hurts thoda" re-read as distress by the
  // understanding note restarted the full opening script twice and the child left the lesson): inside an episode a MODEL
  // read opened, a further MODEL-only distress read is the same episode, never a new opening. It holds on the stay turn
  // (no lesson, the helplines on the board, a gentle are-you-okay) and never releases or offers the resume: a pending
  // offer is withdrawn, and the next turns climb back as after an opening. The predicate's families, the relational
  // floor and a carried check-in always restart the full script.
  // 14.4.3 (main safety review; sim lab 6da8f599 p08 r3 #12-14): once help is in place in an episode the predicate or a sure
  // layer opened (`helpedAt`, below; fine.js helpInPlace), a MODEL-only read with no sure layer is the same story too: the
  // helped hold, never the full opening again (that would clear the help and re-say the numbers). Before help is in place
  // such a read still restarts the full script there: its active hand-off to a grown-up is what got p08's child to a neighbour.
  const helpedEp = () => s.safeguard.helpedAt != null || (s.safeguard.tier !== "check" && helpInPlace(input.text ?? input.answer ?? ""));
  const sameEpisode = !!(flags.distress && s.safeguard && !s.safeguard.carried && MODEL_EPISODE_KINDS.has(flags.distressKind ?? "")
    && (MODEL_EPISODE_KINDS.has(s.safeguard.kind) || (!flags.sureBy && helpedEp())));
  // 14.4: an open CHECK-IN is decided by the next turn. It escalates to the full script (the vetted opening, the helplines
  // on the board, an incident: escalated) only on what would be sure on its own: a sure signal (the predicate, a sure kind,
  // the relational floor, a block the words trip, an unnamed read), a low mood read AGAIN after she asked, or a second
  // silence or "pata nahi" (the first one waits). Everything else goes back to the lesson with one warm line: a restated
  // fright ("bas bhaunka… main dar gayi thi"), "okay, bas tired", an answer (graded and served as it stands), a request; a
  // stop ends it.
  // (Sim lab r5-rel144-b8285b2-tiered-36card p68 / p30, 14.4 first cut: escalating every reply that was not clearly fine
  // turned the check-in's own question into its escalation: the child answered "what happened?" and got the script.)
  if (s.safeguard?.tier === "check") {
    const answered = !!cls && ["correct", "partial", "incorrect", "misconception"].includes(cls.outcome);
    // the child's clear words win over a MODEL re-read of them (QA TEST 3560088c: "haan theek hoon" re-read as distress by
    // the understanding note escalated a check-in); the predicate's families and every sure layer still escalate
    const words = input.text ?? input.answer ?? "";
    const fineWords = clearlyFine(words) || bareOk(words);
    const modelOnly = !!flags.distress && !flags.sureBy && ["model", "model_note"].includes(flags.distressKind ?? "");
    // silence (the duplex backstop's empty commit, a phantom turn: census 4B) is no answer yet, and so is a bare "pata
    // nahi" / "I don't know" / "hmm": the reads see her question, so a MODEL read of those words (the words read, the
    // understanding note) is her last turn's mood, not theirs (QA TEST 47f4bb3f / 8df85690 U2b: "pata nahi" got the full
    // script, by the words read and then by the note). The check-in waits once, gently; a second silence or "pata nahi" in a
    // row is the full script; the predicate or a sure layer escalates at once. A bare "nahi" / "theek nahi hoon" answers her
    // "are you okay?": they are not, and that is the full script whatever a model read (QA TEST 7555e558 W2e)
    const silent = isSilentTurn(input);
    const unsure = !silent && bareUnsure(words);
    const notOk = !silent && bareNotOk(words);
    // a lesson answer is the child back at the lesson: a model read of it is never sure on its own (the predicate, a sure
    // layer and a low mood said again still are: QA TEST 8a4ce363 X2c)
    const sure = notOk || (!!flags.distress && !checkTier(flags) && !((fineWords || unsure || answered) && modelOnly));
    // 14.4.2 (main safety review; sim lab be9b766a p30 #8 "haan okay… par thodi udaas" got the full script): a low mood they
    // size as small (fine.js mildLow: "thodi udaas", "thoda bura laga", nothing bigger) is care, never the script; it is
    // released below with the warm line. The predicate and every sure layer still escalate it.
    // ... and "safe hoon, par ghar pe bata sakti hoon?" (fine.js safeAndTells: they say they are safe and want to tell family,
    // nothing low or heavy) is no low mood said again: a model re-read of it as low is her question's mood, not theirs
    // (14.4.2 release replay of p30 on c5a55681: the helplines). A contrast ("theek hoon, par kuch accha nahi lagta") still is.
    const tellsFine = safeAndTells(words);
    const lowAgain = !!flags.distress && flags.distressAbout === "sad_or_lonely" && !fineWords && !unsure && !mildLow(words) && !tellsFine;
    // QA TEST d359423b / a9c3136d t7 (9ad86661): "main mar jaunga itna padh ke" answering "are you okay?" is the predicate's
    // lesson hyperbole (check-tier): it was released into the lesson, a practice item with "tell mummy" glued on. It is no
    // answer of okay: the check-in stays (care, no lesson) once; a second one in a row, like a second silence, escalates
    const heavy = !!flags.distress && flags.distressKind === "self_harm" && flags.idiom === "lesson_hyperbole" && !fineWords;
    // the stop chip always ends it at once
    if (!flags.distress && chipId === "safe:stop") { s.safeguard = null; return toWrap(s, { stopping: true, kit: input.kit }); }
    // speech the ear could not read (D5 unheard, census 4B): her mishearing is never the child's answer — it neither releases
    // the check-in nor uses up its one silence. She says she could not make it out and asks again, with the carry-on and stop
    // chips on the move (a tap is the child's own answer: a child she cannot hear is never left with voice as the only way
    // out). EVERY unheard turn keeps the check-in, however many in a row (main 2026-10-21, dc-r144-unheard-never-escalates):
    // unheard is the ear failing, no evidence of distress — the child spoke, so they are responsive — and the helplines come
    // only when sure; measured, 3 in a row would fire on 1.8-4.8 % of phone-echo lessons, mostly a bad microphone. Silence
    // keeps its own rule, and the predicate and every sure layer still escalate at once whatever the ear did. An unheard turn
    // has no words: none of the reads below fire on it.
    if (isUnheardTurn(input)) {
      const labels = chipLabels(s.ctx?.lang);
      s.safeguard = { ...s.safeguard, unheard: (s.safeguard.unheard ?? 0) + 1 };
      return plan("safeguard", SH.distressCheckAgain({ unheard: true }), { tier: "check", chips: [{ id: "safe:continue", label: labels.cont }, { id: "safe:stop", label: labels.stop }] });
    }
    // 14.4.1 (sim lab r5-rel144-cdac90c-p66p68-long p66 r1: "…Ab theek hai… accha ho gaya" labelled wantsToStop ended the
    // lesson in 6 turns, with no offer): a stop READ in their words is not the stop chip. The check-in is released into the
    // lesson's own stop handling: a true goodbye still ends at once, anything else gets the one carry-on / break / stop offer.
    // A stop read in a bare "nahi" is their answer to "are you okay?" (notOk below), never a goodbye.
    if (!flags.distress && flags.wantsToStop && !notOk) {
      s.safeguard = null;
      s.checkReleased = s.turn;
      s.careLine = s.turn;
      return decide(s, input, item);
    }
    if ((silent || unsure || heavy) && !sure && !s.safeguard.quiet) {
      s.safeguard = { ...s.safeguard, quiet: 1 };
      return plan("safeguard", SH.distressCheckAgain({ unsure, heavy }), { tier: "check" });
    }
    if (sure || lowAgain || silent || unsure || heavy) {
      s.safeguard = { calm: 0, asked: false, kind: flags.distress ? (flags.distressKind ?? s.safeguard.kind ?? null) : (s.safeguard.kind ?? null) };
      s.safeguardedAt ??= s.turn;
      return plan("safeguard", SH.safeguard(), { whiteboard: HELPLINES, escalated: true });
    }
    s.safeguard = null;
    s.checkReleased = s.turn;
    if (flags.distress) setAside(s);
    // an answer to the lesson or a request ("…you misheard, let's study something else": the owner's lesson e6392332) is
    // taken as it stands, graded and served, never re-posed over (census F13 / F1: a right answer during an episode earned
    // nothing and "study something else" was ignored twice); the move's words open with one warm line (SH.afterCareCheck)
    if (answered || (cls?.request && cls.request.type !== "goodbye")) {
      s.careLine = s.turn;
      // the read set aside above is cleared whatever its kind (quiet() clears only a check-kind read: a sure-kind MODEL read
      // of a lesson answer re-entered decide() still flagged and opened the full script)
      return decide(s, { ...input, cls: flags.distress ? { ...cls, flags: { ...cls.flags, distress: false, distressSetAside: cls.flags.distressAbout ?? cls.flags.distressKind ?? "check" } } : cls }, item);
    }
    if (item) return plan(moveKindFor(item), SH.pose({ item, prefix: `gently back to the lesson; ${SH.afterCareCheck()}` }), { item, probe: probeFor(item) });
    s.careLine = s.turn;
    return decide(s, { ...input, cls: null }, item);
  }
  // ... never on a late answer (the page-hide beacon closed the lesson): no next turn would follow a check-in up. For four
  // turns after a check-in released, another check-kind read of a fright opens no second check-in (the child is still
  // telling the same story: sim lab p65 asked "are you safe now?" again after the child had said so); a low mood read
  // again is the full script, and a sure read always is.
  // ... and in those four turns a lesson answer is the child back at the lesson (the check-in's own rule): a MODEL read of it
  // is never sure on its own (model-only replay of QA TEST 9ad86661, 1 of 6: her release line said "marne ki baat", the next
  // read took it for the child's, and a right answer got the full script). A low mood said again, the predicate and every
  // sure layer still are.
  if (flags.distress && !s.safeguard && !flags.sureBy && s.checkReleased != null && s.turn - s.checkReleased <= 4
    && ["model", "model_note"].includes(flags.distressKind ?? "") && flags.distressAbout !== "sad_or_lonely"
    && ["correct", "partial", "incorrect", "misconception"].includes(cls?.outcome)) {
    setAside(s);
    return decide(s, { ...input, cls: { ...cls, flags: { ...flags, distress: false, distressSetAside: flags.distressAbout ?? flags.distressKind } } }, item);
  }
  if (flags.distress && !sameEpisode && !s.safeguard && checkTier(flags) && !input.late) {
    const recent = s.checkReleased != null && s.turn - s.checkReleased <= 4;
    // (a low mood sized as small, fine.js mildLow, is care in this window too: set aside below, with the release's warm line)
    if (recent && flags.distressAbout === "sad_or_lonely" && !mildLow(input.text ?? input.answer ?? "")) {
      s.safeguard = { calm: 0, asked: false, kind: flags.distressKind ?? null }; s.safeguardedAt ??= s.turn;
      return plan("safeguard", SH.safeguard(), { whiteboard: HELPLINES, escalated: true });
    }
    // ... but the predicate's lesson hyperbole is new words of their own, not the same story re-read: its check-in opens
    if (recent && !(flags.distressKind === "self_harm" && flags.idiom === "lesson_hyperbole")) { setAside(s); return decide(s, { ...input, cls: quiet(cls) }, item); }
    s.safeguard = { calm: 0, asked: false, kind: flags.distressKind ?? null, tier: "check" };
    return plan("safeguard", SH.distressCheck(), { tier: "check" });
  }
  // 14.4.3 (main safety review; sim lab 6da8f599 p19 r3 #7 "thik hai... jaata hoon"): a MODEL read that restarts an episode the
  // predicate, a sure layer or an unknown trigger opened never weakens it: the episode keeps the stronger kind (a "model" kind
  // let a later "I'm fine" release a predicate episode early). A stronger read still takes the episode over.
  if (flags.distress && !sameEpisode) {
    const keep = !!s.safeguard && !s.safeguard.carried && s.safeguard.tier !== "check" && !MODEL_EPISODE_KINDS.has(s.safeguard.kind) && MODEL_EPISODE_KINDS.has(flags.distressKind ?? "");
    s.safeguard = { calm: 0, asked: false, kind: keep ? s.safeguard.kind : flags.distressKind ?? null }; s.safeguardedAt ??= s.turn;
    // ... and it is the same story told on, never a new opening: the same hand-off without "are you safe?" again (SH.safeguard)
    // (a sure layer's read is never the same story: the full opening, its safety question and both numbers)
    return keep && !flags.sureBy ? plan("safeguard", SH.safeguard({ sameStory: true }), { whiteboard: HELPLINES, sameStory: true })
      : plan("safeguard", SH.safeguard(), { whiteboard: HELPLINES });
  }
  // round 5 (14.2, main safety review; QA pass 11, n=3: after a self-harm disclosure the next lesson opened straight into
  // teaching): a start within hours of a safeguarding incident (the route passes `carried`) opens on a calm check-in, the
  // helplines on the board, a carry-on and a stop chip. The episode is already asked, so the child's next ordinary words
  // go gently back to the lesson, and distress in them is the full safeguard, as on every turn. Discreet by design: it
  // names nothing that was said, nor that anything was (whoever is in the room may be who it was about).
  if (input.event === "start" && input.carried) {
    s.safeguard = { calm: 1, asked: true, kind: input.carried.kind ?? null, carried: true };
    return plan("safeguard", SH.carriedCheckIn(), { whiteboard: HELPLINES, chips: [{ id: "safe:continue", label: labels.cont }, { id: "safe:stop", label: labels.stop }] });
  }
  if (s.safeguard) {
    // RELATIONAL-OS I-7 / AT-B6 (AT-B1 first run: 9/10 goodbyes right after a disclosure ended at once): a goodbye during
    // the safeguard gets ONE check-in before release when the relational policy asks for it; the stop chip always ends it
    if (flags.wantsToStop && chipId !== "safe:stop" && s.rel?.overlay?.kind === "CHECK_IN" && s.stopAsked == null) {
      s.stopAsked = s.turn;
      return plan("safeguard", SH.relCheckIn(), { whiteboard: HELPLINES, chips: [{ id: "safe:continue", label: labels.cont }, { id: "safe:stop", label: labels.stop }] });
    }
    if (flags.wantsToStop || chipId === "safe:stop") { s.safeguard = null; return toWrap(s, { stopping: true, kit: input.kit }); }
    // 14.4.3 (main safety review; sim lab 6da8f599 p08 r3 #12-14, p19 r3 #8: "aunty ne call kar diya", "maine aunty ko bata
    // diya" still got both helplines and "are you safe?" every turn): once help is IN PLACE (fine.js helpInPlace: a trusted
    // grown-up told, calling or with them, a helpline called; nothing low, heavy, new or vetoed) the episode is HELPED. It
    // keeps the hold (no lesson, the helplines on the board, the same climb to the resume offer) and her turns stop re-saying
    // the numbers and re-asking if they are safe: tier "helped", which the floor does not hold to Childline's number. Read on
    // a turn with no distress, or a MODEL re-read of the same story; the predicate's reads and every sure layer restarted the
    // full script above, and a restart clears it. Never on the carried check-in, nor once the resume is offered.
    const helpNow = s.safeguard.helpedAt == null && !s.safeguard.carried && (sameEpisode || (!flags.distress && !s.safeguard.asked))
      && helpInPlace(input.text ?? input.answer ?? "");
    if (helpNow) s.safeguard.helpedAt = s.turn;
    const helped = s.safeguard.helpedAt != null;
    const hold = () => plan("safeguard", SH.safeguardHelped(), { whiteboard: HELPLINES, tier: "helped" });
    // calm 1, not 0: the fixed fallback for this turn is the stay line, never the opening's again (say.js fallbackReply). In an
    // episode the predicate or a sure layer opened (helped: the only way a model re-read is the same episode there) calm goes
    // back to 0, the climb the restart it replaces had: the hold lasts as long as shipped, only her words change.
    if (sameEpisode) {
      s.safeguard.calm = MODEL_EPISODE_KINDS.has(s.safeguard.kind) ? 1 : 0; s.safeguard.asked = false;
      return helped ? hold() : plan("safeguard", SH.safeguardAgain(), { whiteboard: HELPLINES });
    }
    // the turn help is in place is answered as such (they did the right thing); the climb is the shipped one, so on the turn
    // the resume offer is due it comes with that line, never a held turn more (p19: a class-1 child asked for a game)
    if (helpNow) {
      s.safeguard.calm += 1;
      if (s.safeguard.calm < 2) return hold();
      s.safeguard.asked = true;
      return plan("repair", SH.resumeAfterHelp(), { chips: [{ id: "safe:continue", label: labels.cont }, { id: "safe:stop", label: labels.stop }] });
    }
    // 14.3 (main safety review; sim lab 14.2 pet cards p66 "I am okay … It's just a scratch", p67 "ab safe hoon… wo bhag
    // gaya tha" held the helpline 2-3 more turns): an episode a MODEL read opened (the classifier or labeller, the content
    // filter, an understanding note; never the predicate's families, never the relational floor) steps back on a reply
    // that clearly says the child is fine (server/safety/fine.js): to the gentle resume, or straight back when the same
    // words ask to carry on (the continue chip, said). Predicate episodes keep the full hold: children minimise after real
    // disclosures. Distress in the reply was already the full safeguard above.
    const fineNow = !s.safeguard.asked && !s.safeguard.carried && MODEL_EPISODE_KINDS.has(s.safeguard.kind) && clearlyFine(input.text ?? input.answer ?? "");
    if (s.safeguard.asked || chipId === "safe:continue" || (fineNow && asksToCarryOn(input.text ?? input.answer ?? ""))) {
      s.safeguard = null;
      return item ? plan(moveKindFor(item), SH.pose({ item, prefix: "gently back to where you were" }), { item, probe: probeFor(item) }) : decide(s, { ...input, cls: null }, item);
    }
    if (fineNow) {
      s.safeguard.asked = true;
      return plan("repair", SH.resumeAfterFine(), { chips: [{ id: "safe:continue", label: labels.cont }, { id: "safe:stop", label: labels.stop }] });
    }
    s.safeguard.calm += 1;
    if (s.safeguard.calm < 2) return helped ? hold() : plan("safeguard", SH.safeguardStay(), { whiteboard: HELPLINES });
    s.safeguard.asked = true;
    return plan("repair", SH.resumeAfterSafeguard(), { chips: [{ id: "safe:continue", label: labels.cont }, { id: "safe:stop", label: labels.stop }] });
  }
  if (s.phase === "done") return toWrap(s, { stopping: true, kit: input.kit });
  // (dc-r8-director25 L2 item 2: the wrap's second turn, whatever her reply to what was covered — a stop or a goodbye of hers included:
  // the acknowledgement, the sentence to her, the goodbye)
  if (s.wrapTwo) { const w2 = { ...s.wrapTwo, replied: String(input.text ?? input.answer ?? "").trim().length > 0 }; s.wrapTwo = undefined; return { ...toWrap(s, { kit: input.kit, second: w2 }), ...(w2.board ? { holdBoard: true } : {}) }; }
  // round 7 (Learning patch 006): the Conductor's lesson slot ends at its window (≤ bedtime − 60): never past hardStopAt
  if (pastBrief(s, "hardStopAt")) return toWrap(s, { kit: input.kit });
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
  if (chipId === "stop:end") return toWrap(s, { stopping: true, kit: input.kit });
  // round 3 fix (experience B8): "Start <topic>" from a switch offer: this lesson closes warmly, the client starts that one
  if (typeof chipId === "string" && chipId.startsWith("switch:")) {
    const t = getTopic(chipId.slice("switch:".length));
    if (t && t.classLevel === Number(s.ctx?.classLevel ?? t.classLevel)) { s.switchTo = t.id; const w = toWrap(s, { stopping: true, kit: input.kit }); return { ...w, shape: SH.switchGo({ title: t.title }), switchTo: t.id }; }
  }
  // census 14.5 (F1, 6c45a7ea t12): a topic ask the classifier ALSO read as a stop ("kuch aur padhte hain") is the topic
  // ask: it is acted on in 2a, never met with the stop check-in (a goodbye or "I am leaving" still ends here)
  const topicAsk = ["switch", "topic", "change_topic"].includes(cls?.request?.type) && stopKind(input.text) !== "leaving";
  // v6.7 V1′ (main, director15 c4 offtopic 62, carried two runs: a wrong answer on a scripted card met with a "break" whose words
  // were hers): an answer to a live scripted card is graded and goes the scripted way (a hint, a remediation, the give-up) — the
  // relational check-in waits; a stop they asked for still stops
  const liveIt = s.activeItemId ? findItem(s, input.kit, s.activeItemId) : null;
  const answeredCard = scriptOn() && !scriptFor(input.kit)?.script?.recordedRun && !!liveIt && isScriptCard(liveIt)
    && ["incorrect", "misconception", "partial", "correct"].includes(String(cls?.outcome ?? ""));
  if ((flags.wantsToStop && !topicAsk) || (s.rel?.overlay?.kind === "CHECK_IN" && !(answeredCard && !flags.wantsToStop))) {
    const checkIn = s.rel?.overlay?.kind === "CHECK_IN";
    // round 7 (main's hybrid-pilot judgement #3, dc-r7-stop-limits): "bye" and every other goodbye or leaving phrase gets the ONE
    // stop check-in first, like "bas ho gaya"; a second stop within two turns, "stop for today" (the stop chip) or Pause → End
    // ends it. TAXILA_R7_BYE_CHECKIN=off: a goodbye ends at once, as before.
    // (never inside or after a safeguarding episode: there a goodbye is let go at once, the frozen safety behaviour)
    const goodbyeNow = (!byeCheckInOn() || !!s.safeguard || s.safeguardedAt != null || (s.checkReleased != null && s.turn - s.checkReleased <= 3) || !!prevSafe) && (cls?.relRelease || cls?.source === "relational" || stopKind(input.text) === "leaving" || cls?.request?.type === "goodbye")
      // (dc-r8-director24 A3, main's 035, c5-t02 offtopic 70, c4 stuck 66, c6 stuck 66: after "bye" a goodbye, never the stop menu — a
      // goodbye or leaving in so many words is let go at once; "bas" and the other stop phrases keep the one check-in)
      || (scriptOn() && (stopKind(input.text) === "leaving" || /(?<![\p{L}])(?:bye|bye-bye|alvida|tata|goodbye)(?![\p{L}])/iu.test(String(input.text ?? ""))));
    if (!checkIn && (goodbyeNow || (s.stopAsked != null && s.turn - s.stopAsked <= 2))) return toWrap(s, { stopping: true, kit: input.kit });
    if (s.stopAsked != null && checkIn) return toWrap(s, { stopping: true, kit: input.kit });      // the check-in was given: let them go
    s.stopAsked = s.turn;
    return plan("break", checkIn ? SH.relCheckIn() : SH.stopCheck(), { chips: [{ id: "stop:continue", label: labels.go }, { id: "break:rest", label: labels.rest }, { id: "stop:end", label: labels.stop }], checkin: checkIn ? "rel" : "stop" });
  }
  // 2a. owner-truth patch 07 (F8, items 4-5), reconciled with W2-I's stop gate above: the child's own request in words
  // (director/requests.js) is acted on THIS turn, never evidence; "keep going" in words is the stop:continue chip.
  // p5-interaction: a ways-in chip (offerWays / boredOffer) is the request it names
  // round 7 (director2 c6 offtopic: "Picture, Kahani, ya Game?" → "2" became a fill-in-the-blank): a bare 1-3 or "pehla /
  // doosra / teesra" said to the ways in she just offered is the chip in that place
  const waysUp = (s.lastUi?.chips ?? []).filter((c) => /^req:(visual|story|game)$/.test(c.id));
  const nth = waysUp.length && !(cls && ["correct", "incorrect", "partial", "misconception"].includes(cls.outcome))
    ? ORDINAL.findIndex((re) => re.test(String(input.text ?? "").trim())) : -1;
  const picked = typeof chipId === "string" ? chipId : nth >= 0 && waysUp[nth] ? waysUp[nth].id : null;
  const chipReq = p5Flag("STEER") && typeof picked === "string" && /^req:(visual|story|game)$/.test(picked)
    ? (picked === "req:story" ? { type: "story", whole: true } : { type: "visual", kind: picked === "req:game" ? "game" : "diagram", whole: true }) : null;
  const req = chipReq ?? cls?.request ?? null;
  // round 7 (judgement #10): a yes to the choices she just offered (the ways-in chips on the screen) asks which one; naming one is
  // its request (requests.js), the chip is its request (chipReq above)
  const offered = (s.lastUi?.chips ?? []).filter((c) => /^req:(visual|story|game)$/.test(c.id));
  if (!req && offered.length && !chipId && /^(?:(?:haan|han|ha|haa|ok|okay|theek\s+hai|thik\s+hai|achha|acha|yes|yeah|sure|chalo|ji)[\s,.!]*)+$/i.test(String(input.text ?? "").trim())
    && !(cls && ["correct", "incorrect", "partial", "misconception"].includes(cls.outcome))) {
    return plan("repair", SH.whichOne({ choices: offered.map((c) => c.label) }), { chips: s.lastUi.chips, request: "which_one" });
  }
  // release 13 (A): the subject the child named ("aloo"), kept a few turns so a later "Show me a picture" chip is answered
  // honestly about IT (owner lesson a95d2ff1 turns 18-24)
  if (p5Flag("R4CONV") && req && !req.chapter && ["topic", "switch", "change_topic", "visual"].includes(req.type)) {
    const subject = req.subject ?? freeSubjectOf(input.text ?? "");
    if (subject && !genericSubject(subject)) s.offTopic = { subject: String(subject).slice(0, 30), turn: s.turn };
  }
  // p5-interaction: what the UNDERSTAND note read alongside a graded answer (a parked question, a hedge, a check)
  if (p5Flag("STEER") && cls?.alsoPark) s.later = pushLater(s.later ?? [], parkEntry({ ...cls.alsoPark, turn: s.turn, itemOnTable: true }));
  // v6.5 K2 (main, director13 c5-t02 steady 54–56: "woh wala ho gaya, aage chalo" to a why-probe got a stop menu, then her own
  // question again): "aage chalo", "ho gaya", "bata diya" — not an answer — moves on: a pending probe is closed, a break offer resumed
  if (scriptOn() && !scriptFor(input.kit)?.script?.recordedRun && MOVE_ON.test(String(input.text ?? "")) && req?.type !== "ask_again" && !(cls && ["correct", "incorrect", "partial", "misconception"].includes(cls.outcome))) {
    if (item && s.pendingWhy === item.id) return { ...afterWhy(s, { ...input, cls: { outcome: "no_evidence", confidence: 1, source: "help", flags: {} } }, item), request: "move_on" };
    if (s.lastMove?.kind === "break") { s.stopAsked = undefined; s.sidebar = undefined; return { ...resume(s, input, item, "they said to go on: straight back in, no fuss"), request: "move_on" }; }
    // v6.6 K3 (main, director14 c5-t02 steady 58, c5-t01 steady 16: "aage chalo" on a re-posed card got the stop menu): on a live
    // scripted card it gives the card's key and why and moves on — never the stop menu
    if (item && isScriptCard(item) && s.activeItemId === item.id) return { ...leaveItem(s, input, item, SH.reposeMissed()), request: "move_on" };
  }
  if (chipId === "stop:continue" || req?.type === "continue") {
    s.stopAsked = undefined; s.sidebar = undefined;
    return resume(s, input, item, "they chose to keep going: straight back in, warmly, no fuss");
  }
  if (req && s.phase === "teachback" && req.type !== "break" && !(p5Flag("STEER") && P5_REQUESTS.has(req.type))) {
    // teaching the protégé: a language switch holds from now on; any other request re-asks the teach-back more simply
    if (req.type === "language") s.ctx = { ...s.ctx, lang: req.lang, langPinned: true, plainWords: /\b(?:simple|aasan|asaan|easy|saral|seedhi|sidhi)\b/i.test(String(input.text ?? "")) || (s.ctx.plainWords && req.lang === s.ctx.lang) };
    const p = helpMove(s, input, item, req.type === "language" ? "slower" : "another");
    return { ...p, request: req.type };
  }
  if (req && ["warmup", "teach", "practice", "teachback"].includes(s.phase)) {
    const p = requestMove(s, input, item, req, labels);
    if (p) return p;
  }
  // a side chat the child asked for (change_topic → what they want to talk about): one real turn on it, then the lesson
  if (s.sidebar && s.turn - s.sidebar.asked === 1 && !cls?.help && !(cls && ["correct", "incorrect", "partial", "misconception"].includes(cls.outcome))) {
    const parkIt = s.sidebar.park;
    s.sidebar = undefined;
    // round 7 (main's hybrid-pilot judgement #2): what they want to talk about is parked with a promise, and the lesson goes
    // on; a filler ("achha theek hai") parks nothing and goes back warmly. Screened in code like every parked topic.
    if (parkIt) {
      const said = String(input.text ?? "").replace(/\s+/g, " ").trim();
      const filler = !said || cls?.flags?.minimal || /^(?:(?:achha|acha|accha|theek|thik|hai|haan|han|ok|okay|hmm+|ji|chalo|sahi|nahi|kuch\s+nahi|pata\s+nahi)[\s,.!?]*)+$/i.test(said);
      if (!filler && !unsafeChildPhrase(said)) {
        const e = parkEntry({ topic: said, learning: false, turn: s.turn, itemOnTable: !!item });
        s.later = parkGate(s, input.kit, input, e);
        const lead = (s.later ?? []).includes(e) ? SH.parkIt({ topic: e.topic, promise: e.promise }) : null;
        return item ? plan(moveKindFor(item), SH.leadThenPose({ item, lead }), { item, probe: probeFor(item), chips: optionChips(item), request: "park" })
          : { ...resume(s, input, item, lead), request: "park" };
      }
      if (unsafeChildPhrase(said)) return item ? plan(moveKindFor(item), SH.leadThenPose({ item, lead: SH.declineOob() }), { item, probe: probeFor(item), chips: optionChips(item), request: "decline" })
        : plan("repair", SH.declineOob(), { request: "decline" });
      return { ...resume(s, input, item, "they did not name anything else: back to the work warmly in a few words"), request: "back" };
    }
    return plan("break", SH.sideChat(), { chips: [{ id: "stop:continue", label: labels.back }, { id: "stop:end", label: labels.stop }], request: "side_chat" });
  }
  s.sidebar = undefined;
  // 2b. A help request (a client action): acts on the question on the table; never evidence, never a stop.
  if (cls?.help && ["warmup", "teach", "practice", "teachback"].includes(s.phase)) return helpMove(s, input, item, cls.help);
  // 3. Choices offered by a break.
  // round 7 (E App): a short break is acknowledged in a few words; the next turn picks up where they were (below)
  if (chipId === "break:rest") { s.resting = s.turn; return plan("break", SH.restAck(), { request: "break" }); }
  if (s.resting != null) {
    s.resting = undefined;
    if (!(cls && ["correct", "incorrect", "partial", "misconception"].includes(cls.outcome)) && !chipId?.startsWith("break:")) return resume(s, input, item, SH.backFromRest);
  }
  if (chipId === "break:easier" && s.phase === "practice") {
    if (s.activeItemId) { noteStuck(s, item); s.skipped.push(s.activeItemId); }
    s.easier = true;
    return poseNext(s, input, "an easier one now");
  }
  // 4. A frustration loop (P20) gets a break with choices, not another question.
  // (v6.7 V1′: an answer to a live scripted card goes the scripted way — the frustration break waits for a turn that answered nothing)
  // (v6.9 T1, main on director17 c4 stuck 54: "haan" to her own check-in during a worked step got the break menu — a yes to her
  // question is an answer, never disengagement: the walk goes on to the next step)
  const yesToCheckin = responseShape("yes", "worked_checkin") === "next_step" && YES_REPLY.test(String(input.text ?? "").trim()) && (s.lastMove?.checkinOk || s.lastMove?.kind === "worked_example" || /[?？]\s*$/.test(String([...(s.recent ?? [])].reverse().find((t) => t.who === "teacher")?.text ?? "")));
  if (frustrationLoop(s.affect) && ["warmup", "practice"].includes(s.phase) && s.turn - s.lastBreakTurn >= LIMITS.breakGapTurns && !answeredCard && !yesToCheckin) {
    s.lastBreakTurn = s.turn;
    s.affect = { ...s.affect, dontKnowStreak: 0, minimalStreak: 0 };
    // Equity profile (steal 4, rj-advice-menu-for-weak-learners): a low-baseline child gets ONE next step, never a menu.
    if (s.equity === "low" && s.phase === "practice") return plan("break", SH.takeBreakOneStep(), { chips: [{ id: "break:easier", label: labels.easier }] });
    return plan("break", SH.takeBreak(), { chips: [{ id: "break:easier", label: labels.easier }, { id: "break:rest", label: labels.rest }, { id: "break:continue", label: labels.go }] });
  }
  // round 7 T3: a wrap held for a parked promise goes on now (or returns the next open one)
  if (s.wrapAfter) { const w = s.wrapAfter; s.wrapAfter = undefined; return toWrap(s, { prefix: w.prefix ?? undefined, kit: input.kit }); }
  switch (s.phase) {
    case "warmup": return warmup(s, input, item);
    case "teach": return ackHold(s, input) ?? bluffCheck(s, input) ?? teach(s, input);
    case "practice": return practice(s, input, item);
    case "teachback": return teachback(s, input);
    default: return toWrap(s, { kit: input.kit });
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
const RE_PRESENT = new Set(["repeat", "slower", "another", "clarify", "example", "story", "language"]);
function capPlan(s, input, p) {
  // ship5 fixer (experience B1): the child's own ask to SEE it is honoured, never capped away (the cap turned "picture
  // dikhao" into the next practice question, 2/2 in the request probe); their next answer turn caps as before
  // round 3 (conversation; battery repeat-03, explain_differently-04, clarify-07: "can you repeat the question?" was capped into
  // "leave it for later; then the next question", the request unanswered): an ask to have THIS question again, in another
  // form, is honoured the same way; their next answer turn caps as before
  // round 4 (patch 14; owner-2 R5.loop): the exemption is for the child's OWN words read in code; the UNDERSTAND note's guess
  // ("ek min... haan bolo" read as "slower") never holds a card past the cap
  const noteGuess = p5Flag("R4CONV") && input.cls?.request?.src === "note";
  if (s.safeguard || !p.item || p.capped || p.request === "visual" || (p5Flag("R3CONV") && RE_PRESENT.has(p.request) && !noteGuess)) return p;
  // v6.1 R8 (main, director9: c6 steering T21 "pehle main try karun?" → "Pichhle sawaal ka jawab 30 cm tha"; c4 the third "kis
  // cheez" 4/4): a dodge — a try-first, a "which question?", a "didn't understand" — is never the turn a card is let go with its
  // answer; the card stays live (the request is served)
  const kit = input.kit;
  const item = findItem(s, kit, p.item.id) ?? p.item;
  // (scripted cards only, where letting go says the key; never on the model's guessed request, a note)
  { const rq = input.cls?.request?.type ?? readIntent(String(input?.text ?? ""))?.type ?? null;
    if (scriptOn() && scriptCardOf(item) && !noteGuess && ["selftry", "repeat", "clarify", "confused"].includes(rq)) return p; }
  // (dc-r8-director25 H4 items 4 and 7: a wrong answer on a card whose help ladder still has an unsaid rung keeps the card — help said
  // that rung; the count of misses never lets it go with its key: c5-t02 stuck 22, offtopic 28 gave e2's key with its point's simpler unsaid)
  if (input.helpKeep && input.helpKeep === item.id && scriptCardOf(item)) return p;
  const pins = s.pendingWhy !== item.id && !["safeguard", "wrap", "break", "teachback"].includes(p.kind);
  // round 7 S3 (main, the stall split): a stuck turn on this card ("pata nahi", "nahi aata", working in silence) is counted;
  // only stuck turns hold a card past the cap (up to twice it): a distracted, away or off-topic turn never does
  if (oneLiveOn() && input.event === "turn" && item.id === s.activeItemId && (stuckTurn(input.cls) || ackToTeaching(s, input, item))) s.stuckTurns = { ...(s.stuckTurns ?? {}), [item.id]: (s.stuckTurns?.[item.id] ?? 0) + 1 };
  if (!pins || item.id !== s.activeItemId || s.pinItem !== item.id || (s.pinRun ?? 0) < LIMITS.cardMax) return p;
  // round 7 S3 (main's director2 decision: "one live item at a time"): a posed card stays live until it is answered, until two
  // misses plus help (then its answer and why), or a skip; turns alone never take it away (the 3-turn cap left a card after ONE
  // miss). A card that gets nothing but non-answers for twice the cap is still let go (the stall guard).
  const misses = s.misses?.[item.id] ?? 0;
  const held = LIMITS.cardMax + Math.min(LIMITS.cardMax, s.stuckTurns?.[item.id] ?? 0);
  if (oneLiveOn() && !(misses >= 2 && s.hintLevel >= 1) && (s.pinRun ?? 0) < held) return p;
  const assert = oneLiveOn() ? s.hintLevel >= 1 && misses >= 1 : s.hintLevel >= 2;
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
  return { ...next, content: [...(assert ? [`the answer to the question being left: ${item.answer}`] : []), ...(next.content ?? [])], capped: assert ? "assert" : "leave",
    // (S3: the answer and its why are said in code, brain/say.js: director2 shipped "assert" turns that never said it)
    ...(assert && oneLiveOn() ? { gave: { answer: keyInLang(item, s.ctx.lang), why: (scriptCardOf(item) ? scriptWhyOf(kit, item, s.ctx.lang) : whyOf(kit, item, s.ctx.lang)) ?? "" } } : {}),
    // v3 K2: a script card that is let go is never left unanswered: its key is said in code (c4 director5: "2/3" never said)
    ...(!assert && scriptCardOf(item) && scriptOn() ? { gave: { answer: keyInLang(item, s.ctx.lang), why: scriptWhyOf(kit, item, s.ctx.lang) ?? "" } } : {}) };
}
const scriptCardOf = (item) => !!(item?.scriptAsk || item?.scriptCheck || item?.scriptThen);
const isScriptCard = scriptCardOf;

/**
 * One director step.
 * @param {any} prev  lesson state (not mutated)
 * @param {{ event: "start"|"turn"|"module", kit: any, cls?: any, chipId?: string, answer?: string,
 *   moduleEvents?: import("../../shared/contracts").ModuleEvent[], now?: number }} input
 *   answer: the child's normalized words (affect counters tell a held belief from option cycling).
 *   "module": a module-only turn; `cls` is set only for a machine-truth module answer on the active item.
 * @returns the step; `hold: true` when a module-only turn changed nothing (the last move and UI stand).
 */
/** Her last line said a key and posed no card (a give-up's or a close's check-in): what she said, not which path built it. */
function keySaidNoCard(prev) {
  const lastT = String([...(prev?.recent ?? [])].reverse().find((t) => t.who === "teacher")?.text ?? "").replace(/\s+/g, " ");
  const card = String(prev?.lastUi?.ask?.text ?? "").replace(/\s+/g, " ").slice(0, 30);
  return /(?:sahi jawab|jawab hai|jawab:|poora jawab|the answer (?:is|was))/i.test(lastT) && !(card && lastT.includes(card));
}
/** The part a move is about: its live card and its beat. */
const partOf = (st, mv) => { const b = mv?.scriptBeat; return `${st?.activeItemId ?? st?.splitHold?.activeItemId ?? ""}|${b ? `${b.skillId}:${b.beatId}` : ""}`; };
/** A give-up: not knowing the answer, or asking for it (dc-r8-director20 G3; "hindi mein batao na" is a request, not one). */
/** Brain 044 (dry steady c5-t01, after T5 moved the lesson onto the closing verdict's check-in): "pata nahi kaise, bas laga" is the child's
 *  reason for an answer she gave (she does not know how, it felt so), not a give-up. */
const SAYS_A_REASON = /(?<![\p{L}])(?:bas\s+laga|mujhe\s+laga|guess\s+kiya|aise\s+hi\s+laga)(?![\p{L}])/iu;
const GIVE_UP_WORDS = /(?<![\p{L}])(?:pata\s+nahi|nahi\s+pata|aap\s+(?:hi\s+)?batao|tum\s+batao|i\s+(?:don'?t|do\s+not)\s+know|give\s+up|chhodo|nahi\s+aata)(?![\p{L}])/iu;
/** dc-r8-director20 L3: "samajh nahi aaya" or "pata nahi" to the greeting — the script's greetSimpler is said before the hook. */
const greetSimplerDue = (lastMove, input) => lastMove?.kind === "greet"
  && (SAYS_CLARIFY.test(String(input?.text ?? "")) || GIVE_UP_WORDS.test(String(input?.text ?? "")) || ["clarify", "another", "confused"].includes(input?.cls?.request?.type));
/** "Samajh nahi aaya" and its kin: a clarify, whatever request the reader named. */
const SAYS_CLARIFY = /(?<![\p{L}])(?:samajh\s+nahi|samjha\s+nahi|samjhi\s+nahi|didn'?t\s+understand|don'?t\s+understand|kya\s+matlab)(?![\p{L}])/iu;
/** Main on director21 (c4 offtopic 38, c5-t02 stuck 46, 48: her aside reply said again on the turn after; a held part said twice): a move
 *  re-said from the last one keeps its teaching, never what belonged to that turn alone — the reply to the child's aside, the return,
 *  the honest line, a held part said first, a close. */
const ONE_TURN = ["quick", "quickReply", "whyShort", "workedInvite", "afterInvite", "quickAgain", "stepAsk", "stepReply", "help", "helpJoint", "whyAltSaid", "hindiSame", "returnReply", "returned", "tasteAsked", "sadAside", "asideAgain", "heldSaid", "heldBeat", "sayFirst", "splitClose", "gaveCheck", "keyTwice", "gave", "closed", "workedDone", "closeBeat", "closedBeat", "bridgeSaid", "probeAck", "stepFrom", "problemLines", "hookSaid", "keyedPicture"];
/** dc-r8-director23 H2: the worked answer of the card a key closed — its key and its why as one statement (a yes-or-no key: the why alone,
 *  K2), on its answer board. null when the card is not found. */
function workedAnswerOf(prev, kit) {
  const cb = prev?.lastMove?.scriptBeat ?? prev?.lastMove?.closeBeat;
  const sk = cb?.skillId ? skillScriptOf(kit, cb.skillId) : null;
  if (!sk) return null;
  const b = String(cb.beatId ?? "");
  const card = b === "worked" || b.startsWith("worked:") ? sk.workedExample?.yourStep ?? null
    : b.startsWith("then:") ? sk.remediation?.find((r) => r.targets === b.slice(5))?.then : sk.checks?.find((c) => c.id === b) ?? sk.explain?.find((e) => e.id === b)?.ask ?? null;
  if (!card?.key) return null;
  const lang = prev?.ctx?.lang ?? "hinglish", en = lang === "english";
  const why = card.why ? String(saidIn(card.why, lang) ?? "").trim().replace(/[.!?\u0964]+$/, "") : "";
  const yn = /^(?:haan|ha|nahi|nahin|yes|no)$/i.test(String(card.key).trim());
  const text = yn ? (why ? `${why.charAt(0).toUpperCase()}${why.slice(1)}.` : null)
    : `${en ? "The answer is" : "Iska jawab hai"} ${card.key}${why ? `, ${en ? "because" : "kyunki"} ${joinable(why, { lower: true })}` : ""}.`;
  return text ? { text, board: card.answerBoard ?? null, key: card.key, why } : null;
}
const carried = (lm, keep = []) => Object.fromEntries(Object.entries(lm ?? {}).filter(([k]) => keep.includes(k) || !ONE_TURN.includes(k)));
/**
 * C1 step 2 (main, 2026-11-11: "the walk's own cell address on every teacher row"): the (part, column, help) a turn read — the part her
 * last turn was on (in compile.js's part ids), the column the child's reply asks for, and the help state of that part as the walk keeps
 * it. Pure; null when the reply asks for no column (a plain "haan") or the walk is not on a script part.
 */
/** The column a child's line asks for, by the walk's reading (null: none — a plain "haan"). */
function columnName(input, prev = null) {
  const text = String(input?.text ?? ""), cls = input?.cls ?? {}, rq = cls.request?.type ?? null;
  // (a line with no request that names an aside of theirs is read as an aside — step0's own reading, asideTopic)
  if (!rq && cls.outcome === "no_evidence" && !cls.asideReply && !SAYS_CLARIFY.test(text) && !GIVE_UP_WORDS.test(text) && asideTopic(text, prev?.ctx?.interests)) return "aside";
  return SAYS_CLARIFY.test(text) || ["clarify", "another", "confused"].includes(rq) ? "clarify" : rq === "language" ? "hindi"
    : ["repeat", "which"].includes(rq) ? "repeat" : rq === "visual" ? "picture" : ["selftry", "thinking"].includes(rq) ? "try_first"
      : rq === "uptake" ? "aside" : rq === "move_on" ? "move_on" : GIVE_UP_WORDS.test(text) && !SAYS_A_REASON.test(text) ? "give_up"
        : cls.outcome === "correct" ? "right" : cls.outcome === "misconception" ? "misconception" : ["incorrect", "partial"].includes(cls.outcome) ? "wrong" : null;
}
const columnOf = (input, prev) => { const column = columnName(input, prev); return column ? { part: null, column, help: null } : null; };
export function cellAddressOf(prev, input) {
  if (!prev || input?.event !== "turn") return null;
  const kit = input.kit, lm = prev.lastMove ?? {}, sb = lm.scriptBeat;
  const column = columnName(input, prev);
  if (!column) return null;
  const script = scriptFor(kit)?.script ?? null;
  if (lm.kind === "greet") return script?.greetSimpler ? { part: `${script.topicId ?? "lesson"}:greet`, column } : null;
  const cardId = prev.lastUi?.ask?.itemId ?? null;
  const live = cardId ?? (lm.gave?.answer ? prev.activeItemId ?? lm.itemId ?? null : null);
  let part = null;
  const m = /^script:(.+?):(?:ask:(.+)|then:(.+)|([^:]+))$/.exec(String(live ?? ""));
  if (m) {
    const S = m[1], sk = skillScriptOf(kit, S);
    if (m[2]) part = m[2] === "worked" ? `${S}:worked:yourStep` : `${S}:${m[2]}:card`;
    else if (m[3]) { const i = (sk?.remediation ?? []).findIndex((r) => r.targets === m[3]); part = i >= 0 ? `${S}:rem:${i}:then` : null; }
    else part = `${S}:check:${m[4]}`;
  } else if (lm.quick?.skillId && lm.quick.beatId) {
    // (Brain 042: the child answers the point's quick question — recorded as its own part; help's part for it is the point, helpPartOf)
    part = `${lm.quick.skillId}:${lm.quick.beatId}:quick`;
  } else if (lm.stepAsk?.skillId && Number.isInteger(lm.stepAsk.step)) {
    // (Brain 042: the child answers an asked step — its own part; help's part for it is the step, helpPartOf)
    part = `${lm.stepAsk.skillId}:worked:step${lm.stepAsk.step + 1}:ask`;
  } else if ((sb?.kind === "bridge" || (lm.bridgeSaid && lm.bridgeBeat?.skillId) || lm.simplerBeat?.beatId === "bridge") && !(lm.point && !lm.simpler && sb?.kind === "explain")) {
    // (Brain 044 T1: a bridge said with the next point — the address is the point, the last part taught)
    // (dc-r8-director27 P3, fd-bridge-address-is-previous-card: after a bridge the address is the bridge — a request at its check-in gets the
    // bridge's own second wording, never the card before it's; c5-t01 steady 80, 82; c6 stuck 58, offtopic 54. A key and the bridge in one
    // turn: the bridge, said last; the bridge's own help turn stays on it)
    part = lm.simplerBeat?.beatId === "bridge" && lm.simplerBeat.skillId ? `${lm.simplerBeat.skillId}:bridge` : bridgePartOf(kit, sb?.kind === "bridge" ? sb.skillId : lm.bridgeBeat?.skillId);
  } else if (lm.simplerBeat?.kind === "remediation" || sb?.kind === "remediation") {
    const rb = lm.simplerBeat?.kind === "remediation" ? lm.simplerBeat : sb;
    const i = (skillScriptOf(kit, rb.skillId)?.remediation ?? []).findIndex((r) => `rem:${r.targets}` === String(rb.beatId));
    part = i >= 0 ? `${rb.skillId}:rem:${i}` : null;
  } else if (sb?.skillId) {
    const S = sb.skillId, b = String(sb.beatId ?? "");
    if (sb.kind === "explain") part = lm.checkinOk || lm.splitTeach ? `${S}:${b}:checkin` : `${S}:${b}:point`;
    else if (/^worked:(?:problem|step\d+)$/.test(b)) part = `${S}:${b}`;
    // (main's R6 on the merged tree, c6 stuck 20: a picture of the worked problem is said over the worked example's own beat, "worked";
    // a give-up at its check-in had no part recorded, so help was not picked and the walk went on to step 1 unhelped. With no card live
    // and nothing closed on that turn, the part is the worked problem)
    else if (b === "worked" && !lm.closed && !lm.gave && !lm.workedDone && !lm.verdict && !lm.splitClose) part = `${S}:worked:problem`;
    else if (sb.kind === "remediation") { const i = (skillScriptOf(kit, S)?.remediation ?? []).findIndex((r) => `rem:${r.targets}` === b); part = i >= 0 ? `${S}:rem:${i}` : null; }
    else if (sb.kind === "hook") part = `${S}:hook`;
  }
  if (!part) return null;
  // (dc-r8-director25 H4: no help state — the fresh / heard / spent counter decided which wording a help request got; the count of requests
  // decides nothing now, and the record is the part and the column)
  return { part, column };
}
/** The compile part of a bridge, from the skill it leads into (a bridge is said at the skill change; compile.js names it by the skill it
 *  leaves: skills[n].bridgeToNext). */
function bridgePartOf(kit, intoSkill) {
  const sks = scriptFor(kit)?.script?.skills ?? [];
  const n = sks.findIndex((x) => x.skillId === intoSkill);
  if (n > 0 && sks[n - 1]?.bridgeToNext) return `${sks[n - 1].skillId}:bridge`;
  return sks[n]?.bridgeToNext ? `${intoSkill}:bridge` : null;
}
// ───────────── dc-r8-director25 H4: help is one function (server/director/help.js pickHelp) ─────────────
// Every request for help — a clarify, a give-up, a request for Hindi, a hint after a wrong answer — reaches pickHelp here, once a turn,
// and nothing else in the walk picks help: it decides the wording, the board that wording is said over and what happens to the card,
// from the part she is on and the said set (state.said: every sentence she has said in this lesson, with its row, built as turns are
// said). The count of requests decides nothing. This section only carries the decision out as a move.
/** The said set with her last turn added (the turn the child is answering now): what she said, as the lesson's own record. */
function saidNowOf(prev) {
  let said = prev?.said ?? [];
  for (const t of prev?.recent ?? []) if (t.who === "teacher" && t.text) said = addSaid(said, t.text, prev?.turn ?? 0);
  return said.length > 1200 ? said.slice(-1200) : said;
}
/** A walk item id ("script:<skill>:ask:e1", "…:then:<mix-up>", "…:c2") or a closed card's beat as a compile part id. */
function cardPartOf(kit, { itemId = null, beat = null } = {}) {
  const m = /^script:(.+?):(?:ask:(.+)|then:(.+)|([^:]+))$/.exec(String(itemId ?? ""));
  const S = m?.[1] ?? beat?.skillId ?? null;
  if (!S) return null;
  const b = m ? (m[2] ? (m[2] === "worked" ? "worked" : m[2]) : m[3] ? `then:${m[3]}` : m[4]) : String(beat?.beatId ?? "").replace(/^explain:/, "");
  if (b === "worked" || /^worked:/.test(b)) return `${S}:worked:yourStep`;
  const t = /^then:(.+)$/.exec(b);
  if (t) { const i = (skillScriptOf(kit, S)?.remediation ?? []).findIndex((r) => r.targets === t[1]); return i >= 0 ? `${S}:rem:${i}:then` : null; }
  if (/^e\d+$/.test(b) && (m?.[2] || beat?.kind === "explain")) return `${S}:${b}:card`;
  return b ? `${S}:check:${b}` : null;
}
/** The request a turn makes of help, by the walk's reading of the child's line: clarify, give_up, hindi (a hint is read after the walk
 *  graded the answer). null: no help asked. A safety read, a stop or a goodbye is never help (the safety paths are frozen). */
function helpRequestOf(prev, input) {
  // (a replay of a recorded run walks what that run walked, as heldOf pages it: help is not picked there — its said set is the run's text,
  // not what the replay says, and every turn help moved would part the replay from the run; a test of help walks the run's script live)
  if (input?.event !== "turn" || input.branch || !scriptOn() || recordedWalk(input) || !prev) return null;
  const c = input.cls ?? {};
  if (c.flags?.distress || c.flags?.wantsToStop || prev.safeguard || ["stop", "end", "break", "goodbye"].includes(c.request?.type)) return null;
  // (dc-r8-director26 N1, c5-t01 steady 128: the last card's close and its why, with its check-in, is said while the phase is already the
  // teach-back's — "pata nahi, aap batao" there went straight to the closing question. A request at that check-in is help on the card
  // just keyed: the why's other wording, or the go-on line, then the teach-back)
  const keyCheckin = String(prev.phase ?? "") === "teachback" && !!prev.keyedPart && !prev.lastUi?.ask?.itemId && !["wrap", "teachback", "safeguard", "break"].includes(String(prev.lastMove?.kind ?? ""));
  if ((["teachback", "wrap", "done"].includes(String(prev.phase ?? "")) && !keyCheckin) || ["wrap", "teachback", "safeguard", "break"].includes(String(prev.lastMove?.kind ?? ""))) return null;
  // (v6.8 B1‴ stands: a card answered right, its why-probe pending, is closed — a request there is no help on it; the walk goes on)
  if (prev.pendingWhy && prev.pendingWhy === (prev.lastUi?.ask?.itemId ?? prev.activeItemId)) return null;
  const col = columnName(input, prev);
  // (Brain 042: a give-up on a quick question or an asked step is an answer that is not right — quick.say then the card, or the step told —
  // never help: no hint ladder there)
  if (col === "give_up" && (prev.lastMove?.quick || prev.lastMove?.stepAsk)) return null;
  // (after her reply said alone before a worked segment there is no part to help: the segment comes — heldTurn. Brain 044 T6: her reply never
  // stands alone now — it goes on into the live part in the same turn — so no turn reaches this)
  if (prev.lastMove?.leadAlone && prev.splitHold) return null;
  return col === "clarify" || col === "give_up" || col === "hindi" ? col : null;
}
/** The part she is on for help: the card just keyed while no card has been posed since (the child speaks after a key's check-in),
 *  else the walk's record (cellAddressOf). → { part, keyed } | null — with no part recorded, help is not picked. */
function helpPartOf(prev, input) {
  const lmB = prev?.lastMove ?? {};
  if (!prev?.lastUi?.ask?.itemId && (lmB.scriptBeat?.kind === "bridge" || lmB.bridgeSaid || lmB.simplerBeat?.beatId === "bridge") && !(lmB.point && !lmB.simpler && lmB.scriptBeat?.kind === "explain")) {
    const a = (() => { try { return cellAddressOf(prev, input); } catch { return null; } })();
    if (a?.part && /:bridge$/.test(a.part)) return { part: a.part, keyed: false };
  }
  if (prev?.keyedPart && !prev.lastUi?.ask?.itemId) return { part: prev.keyedPart, keyed: true };
  // (dc-r8-director27 P3: a card answered right, its verdict and why said, no card posed since — a request there is help on that card, its
  // why's other wording first, but no key was said as help: it is not keyed, and nothing left is helpSpent, never the go-on line)
  if (prev?.closedPart && !prev.lastUi?.ask?.itemId) return { part: prev.closedPart, keyed: false, closed: true };
  const a = (() => { try { return cellAddressOf(prev, input); } catch { return null; } })();
  // (dc-r8-director26 N1: with no part recorded, the part is the last she said — a card her last turn closed, with no card posed since,
  // is the card just keyed)
  if (!a?.part) {
    const lm = prev?.lastMove ?? {};
    const cb = lm.closedBeat ?? lm.closeBeat ?? null;
    const k = cb && !prev.lastUi?.ask?.itemId ? cardPartOf(input.kit, { beat: cb }) : null;
    return k ? { part: k, keyed: true } : null;
  }
  // (Brain 042: a request on a quick question is help on its point — the picker's part is the point's check-in; on an asked step, the step)
  const p0 = a?.part ? String(a.part).replace(/:quick$/, ":checkin").replace(/(:worked:step\d+):ask$/, "$1") : null;
  return p0 && !/:(?:greet|hook)$/.test(p0) ? { part: p0, keyed: false } : null;
}
/** pickHelp for this turn. → the decision with its request and part, or null. */
function helpDecision(prev, input, request, said) {
  const where = helpPartOf(prev, input);
  if (!where) return null;
  const script = scriptFor(input.kit)?.script;
  const d = pickHelp({ script, part: where.part, keyed: where.keyed, closed: !!where.closed, request, said, lang: prev.ctx?.lang === "english" ? "english" : "hinglish",
    lessonKey: prev.ctx?.lessonKey ?? prev.ctx?.sessionId ?? prev.lessonId ?? null, jointN: prev.helpJointN ?? {} });
  return d ? { ...d, friend: friendOf } : null;
}
/** The beat a wording belongs to (its part's), with the board the decision gives it: the move's simplerBeat. */
function helpBeat(kit, d, board) {
  const S = String(d.part).split(":")[0];
  const sk = skillScriptOf(kit, S);
  const rest = String(d.part).slice(S.length + 1);
  const base = { scriptId: scriptIdOf(kit), skillId: S };
  let beat;
  if (/^e\d+:(?:point|checkin|card)$/.test(rest)) beat = { beatId: rest.split(":")[0], kind: "explain" };
  else if (/^check:/.test(rest)) beat = { beatId: rest.slice(6), kind: "check" };
  else if (/^rem:\d+:then$/.test(rest)) beat = { beatId: `then:${sk?.remediation?.[Number(rest.split(":")[1])]?.targets ?? ""}`, kind: "check" };
  else if (/^rem:\d+$/.test(rest)) beat = { beatId: `rem:${sk?.remediation?.[Number(rest.split(":")[1])]?.targets ?? ""}`, kind: "remediation" };
  else if (rest === "worked:yourStep") beat = { beatId: "worked", kind: "worked" };
  else if (/^worked:/.test(rest)) beat = { beatId: rest, kind: "worked" };
  else beat = { beatId: rest, kind: "explain" };
  return { ...base, ...beat, ...(board ? { board } : {}) };
}
/** The words of a decision, said first: the wording, else the key, else the joint (friend slots filled). */
const helpWords = (d) => fillFriend([d.rung?.text ?? d.key?.text ?? d.joint?.text ?? "", d.rung || d.key ? "" : d.then?.text ?? ""].filter(Boolean).join(" "), d.friend ?? "").trim();
/** What a move says as help is removed from it (its point, its rendered lines, its simpler) before the decision's words are put in. */
const HELP_STRIP = ["quick", "quickReply", "stepAsk", "stepReply", "request", "point", "rendered", "simpler", "simplerBeat", "cardPoint", "resumed", "mustSay", "lead", "helpNone", "hindiNew", "altBoard", "noLangAck", "secondClarify", "clarifyN",
  "workedSimpler", "helpJoint", "helpNew", "smaller", "workedAnswerSaid", "whyAltSaid", "hindiSame", "stepFrom", "problemLines", "hookSaid",
  // (main's R4 on the merged H4 + L2 tree, steering c4, c5-t02, c6 16: a give-up after a picture turn said the picture's caption again —
  // the help move was built from the picture move and kept its picture marks, so brain/say.js read a picture asked and said the caption
  // over the help. A picture is that turn's; help says its own wording)
  "visual", "representation", "altLine", "altView", "see"];
const stripHelp = (m) => { const o = { ...m }; for (const k of HELP_STRIP) delete o[k]; if (o.sayFirst && !o.heldSaid) delete o.sayFirst; return o; };
/** Count a help joint said (forms rotate by it), and record the decision on the state. */
function noteHelp(s, d) {
  if (d.joint) s.helpJointN = { ...(s.helpJointN ?? {}), [d.joint.kind]: (s.helpJointN?.[d.joint.kind] ?? 0) + 1 };
  if (d.then) s.helpJointN = { ...(s.helpJointN ?? {}), [d.then.kind]: (s.helpJointN?.[d.then.kind] ?? 0) + 1 };
  s.keyedPart = d.card === "close" ? d.part : d.keyed && d.card === "wait" ? d.part : undefined;
  // (a closed card's help that moves the lesson on — its card asked, the lesson going on, a key — leaves it)
  if (d.card !== "wait" && d.card !== "keep") s.closedPart = undefined;
}
/** The move fields that carry a decision's words: the wording (or the key, or the joint) as the turn's simpler, over its board. */
/** dc-r8-director26 B1: the board a decision's words are said over — the one pickHelp returned (a key's answer board), or null: the board
 *  that is up stays. It rides on the move's help mark, and the page builder (brain/propose.js heldOf) takes it from there and nowhere else. */
const helpBoardOf = (d) => (d.key ? d.key.board ?? d.board : d.board) ?? null;
const helpMark = (d) => ({ part: d.part, request: d.request, rung: d.rung?.field ?? null, card: d.card, ...(d.keyed ? { keyed: true } : {}), ...(d.closed ? { closed: true } : {}), ...(d.joint ? { joint: d.joint.kind } : {}), ...(d.then ? { then: d.then.kind } : {}),
  board: helpBoardOf(d) });
function helpFields(kit, d) {
  const words = helpWords(d);
  const board = helpBoardOf(d);
  return { simpler: words.charAt(0).toUpperCase() + words.slice(1), smaller: true, helpNew: true, help: helpMark(d),
    simplerBeat: helpBeat(kit, d, board), ...(d.joint ? { helpJoint: { kind: d.joint.kind, form: d.joint.text, by: d.joint.by } } : {}) };
}
/**
 * A help turn that stays on the part (the card stays live, or no card is asked yet, or the card is closed with its key): built from the
 * last state, as the part was left — the walk does not move. The wording is said over its part's board; a key over the answer board,
 * from its first word; a Hindi request's language is the lesson's from now on, as the walk's language request sets it.
 */
function helpStay(prev, input, d) {
  const s = structuredClone(prev);
  s.turn += 1;
  s.cardUnsaid = undefined; s.asideReplyDue = undefined; s.returnAsked = undefined; s.returnAnswer = undefined; s.priorItemId = prev.lastMove ? prev.lastMove.itemId ?? null : undefined;
  const req = input.cls?.request;
  if (d.request === "hindi" && req?.type === "language") {
    s.ctx = { ...s.ctx, lang: req.lang ?? "hindi", langPinned: true, plainWords: /\b(?:simple|aasan|asaan|easy|saral|seedhi|sidhi)\b/i.test(String(input.text ?? "")) || (s.ctx.plainWords && req.lang === s.ctx.lang) };
    if (!d.joint) s.langN = (s.langN ?? 0) + 1;
  }
  const base = stripHelp(carried(prev.lastMove));
  const f = helpFields(input.kit, d);
  const liveId = prev.lastUi?.ask?.itemId ?? null;
  let move, ui;
  if (d.card === "keep" && liveId) {
    // (the move is about the card kept: its own beat and board, whatever the last move taught)
    const it = findItem(prev, input.kit, liveId);
    const cb = (it ? cardBeatRef(prev, input.kit, it) : null) ?? base.cardBeat ?? base.scriptBeat;
    move = { ...base, kind: "hint", itemId: liveId, ...(cb ? { scriptBeat: cb, cardBeat: cb } : {}), ...f };
    ui = prev.lastUi;
    s.activeItemId = liveId;
  } else {
    // (wait: no card is asked — a point's or a remediation's clarify, a worked step, a key's check-in; she ends on the check-in, and a
    // card held for the turn after stays held)
    const { itemId: _i, ...rest } = base;
    move = { ...rest, kind: "reteach", ...f, stayCheckin: true, checkinOk: true };
    ui = { status: "your_turn", ...(prev.lastUi?.whiteboard ? { whiteboard: prev.lastUi.whiteboard } : {}) };
    if (d.keyed) s.activeItemId = undefined;
  }
  if (d.request === "hindi") move = { ...move, request: "language", ...(d.joint ? { noLangAck: true } : {}) };
  else if (d.request === "clarify") move = { ...move, request: "clarify" };
  noteHelp(s, d);
  s.lastMove = move; s.moveVoiced = false; s.lastUi = ui;
  return { state: s, move, moduleCommands: [], ui, end: false, proposal: directorProposal(move, { ui, guidance: s.guidance, purpose: s.purpose }), ...describe(s, input.kit) };
}
/** The input a help decision hands the walk: a close lets the card go its own way (helpClose: the walk's key, its closing split); a
 *  turn that goes on reaches the walk as a yes at the check-in; a card asked as the card's question again. */
function helpInput(input, d, liveId) {
  const { request: _rq, ...rest } = input.cls ?? {};
  const flags = { ...(rest.flags ?? {}), dontKnow: false, confused: false };
  if (d.card === "close") return { ...input, helpClose: liveId, cls: { ...rest, ...(d.request === "hint" ? {} : { outcome: "no_evidence" }), ...(d.request === "hint" ? { request: input.cls?.request } : { flags: { ...flags, dontKnow: true } }) } };
  // (the walk goes on from a check-in on a plain yes: that is what it is given — the record keeps the child's own words)
  // (dc-r8-director26: the joint said before the walk's turn counts toward its words — the turn breaks with it counted)
  if (d.card === "goOn") return { ...input, text: "haan", helpGoOn: true, helpLeadWords: [d.joint?.text, d.then?.text].filter(Boolean).join(" ").split(/\s+/).filter(Boolean).length, cls: { ...rest, outcome: "no_evidence", flags, asideReply: false } };
  if (d.card === "ask") return { ...input, cls: { ...rest, outcome: "no_evidence", flags, request: { type: "repeat", src: "help_card" } } };
  // (a hint that keeps the card: the walk grades the miss, and capPlan does not let the card go on a count of misses)
  if (d.card === "keep" && d.request === "hint" && liveId && !recordedWalk(input)) return { ...input, helpKeep: liveId };
  return input;
}
/** Brain 044 T5: whether the strict reading of help's precondition is on (tests, and the dry harness's TAXILA_STRICT_REQUEST). */
const STRICT_REQUEST = () => !!process.env.NODE_TEST_CONTEXT || process.env.TAXILA_STRICT_REQUEST === "1";
/** Brain 044 T5: what a request's turn may answer it with — an unsaid wording (a help rung), a key (a card closed as help, a give-up's key),
 *  the "nothing easier" line; or the reading of an answer the walk asked for (a quick question's say, an asked step told). → null when the
 *  turn answers the request, else why not. */
export function requestUnhelped(prev, input, out) {
  const request = helpRequestOf(prev, input);
  if (!request) return null;
  // (help is a script's: a kit lesson with no script, or a turn with no part recorded to help on, has no help to give — the earlier rules
  // answer it as they did)
  if (!scriptFor(input.kit)?.script) return null;
  if (!(() => { try { return helpPartOf(prev, input); } catch { return null; } })()) return null;
  // (a request to speak English is a language for the lesson, not a request for easier words)
  if (request === "hindi" && input?.cls?.request?.lang && !/^(?:hindi|hinglish)$/i.test(String(input.cls.request.lang))) return null;
  const lm = out?.state?.lastMove ?? {};
  if (["safeguard", "break", "wrap"].includes(String(lm.kind ?? "")) || out?.end) return null;
  const h = lm.help ?? null;
  if (h && (h.rung || h.card === "close" || h.joint === "helpSpent")) return null;
  if (lm.gave?.answer || lm.quickReply || lm.stepReply) return null;
  // (the greeting's own simpler wording answers a request at the greeting; after it, the hook, the first point and its card are the next turn
  // whatever the child says — the greeting has no other wording)
  if (String(prev?.lastMove?.kind ?? "") === "greet" || prev?.lastMove?.greetHelp) return null;
  return `a ${request} answered with ${h ? `help ${JSON.stringify({ card: h.card, joint: h.joint ?? null })}` : lm.kind ?? "nothing"} (${lm.scriptBeat?.beatId ?? "?"})`;
}
function requestHelpedOrThrow(prev, input, out) {
  const why = requestUnhelped(prev, input, out);
  if (why) throw new Error(`T5: a request's turn with no help: ${why} | the child: ${String(input?.text ?? "").slice(0, 60)} | turn ${prev?.turn} after ${prev?.lastMove?.kind} [${Object.keys(prev?.lastMove ?? {}).join(",")}]${prev?.lastMove?.hookSaid ? " (hook)" : ""}${prev?.lastMove?.splitClose ? " (splitClose)" : ""}${prev?.lastMove?.checkin ? " (checkin)" : ""}`);
}
/** A replay of a recorded run walks what that run walked (tests/fixtures/replay.mjs marks it): help is not picked in it (helpRequestOf). */
const recordedWalk = (input) => !!scriptFor(input?.kit)?.script?.recordedRun;
/** Brain 044 Small: the wrong answers to one question — its card's (by its live item) and the quick question of the same beat, which asks it
 *  first ("<skill>:<beat>:card" ↔ the beat's quick evidence). */
function missesOn(prev, cardPart, liveId) {
  const m = prev?.misses ?? {};
  const q = /^(.+):([^:]+):card$/.exec(String(cardPart ?? ""));
  // (a quick question's answer is beat evidence, never a card's miss: read from there)
  const quickMiss = q ? (prev?.beatEvidence ?? []).filter((e) => e.kind === "quick" && e.skillId === q[1] && e.beatId === q[2] && !e.right && ["incorrect", "partial", "misconception"].includes(String(e.read ?? ""))).length : 0;
  return (m[liveId] ?? 0) + quickMiss;
}
/**
 * The help turn, before the walk. A request that stays on its part is answered here (helpStay). Anything that moves the walk — a card
 * closed with its key, a card asked, the lesson going on — is carried out by the walk on the input helpInput gives it, and helpAfter
 * puts the decision's words on the walk's turn. A wrong answer on a live card (a hint) is decided here too and graded by the walk.
 * → { stay | held, decision } | { decision, input } | null (no help asked, or no part recorded).
 */
function helpBefore(prev, input, said) {
  const request = helpRequestOf(prev, input);
  if (!request) {
    // the hint: a wrong answer (or a mix-up) on a live script card — the walk grades it and gives its remediation first, if it has one
    const liveId = prev?.lastUi?.ask?.itemId ?? null;
    if (!liveId || input?.event !== "turn" || !scriptOn() || recordedWalk(input) || input.cls?.flags?.distress || prev.safeguard || !String(liveId).startsWith("script:")) return null;
    if (!["wrong", "misconception"].includes(columnName(input, prev))) return null;
    const part = cardPartOf(input.kit, { itemId: liveId });
    if (!part) return null;
    // (Brain 044 Small: the wrong answers to this question so far — its card's and its quick question's — and this one)
    const misses = missesOn(prev, part, liveId) + 1;
    const d0 = pickHelp({ script: scriptFor(input.kit)?.script, part, request: "hint", said, lang: prev.ctx?.lang === "english" ? "english" : "hinglish",
      lessonKey: prev.ctx?.lessonKey ?? prev.ctx?.sessionId ?? prev.lessonId ?? null, jointN: prev.helpJointN ?? {}, misses });
    if (!d0) return null;
    const d = { ...d0, friend: friendOf, liveId };
    return { decision: d, input: helpInput(input, d, liveId), hint: true };
  }
  const d0 = helpDecision(prev, input, request, said);
  if (!d0) return null;
  const liveId = prev.lastUi?.ask?.itemId ?? null;
  const d = { ...d0, liveId };
  // (dc-r8-director28 Brain 044 T5: a request at a quick question gets help on the point, then the card — never a check-in with the card
  // waiting: c5-t01 steady 8; c6 steady 8)
  if (prev.lastMove?.quick && prev.splitHold?.activeItemId && prev.splitHold.ui?.ask && (d.rung || d.joint) && ["wait", "keep"].includes(d.card)) return { decision: { ...d, card: "ask" }, held: true };
  if (d.card === "keep" && !liveId) return { decision: { ...d, card: "wait" }, stay: true };
  if (d.card === "keep" || d.card === "wait") return { decision: d, stay: true };
  // (dc-r8-director28 Brain 044 T2: help on a remediation and its follow-up card are one turn only within 60 words, as the remediation and its
  // card are; over it the wording ends on its check-in and the card comes next — c6 steady 52, stuck 22, 66, steering 8; c4 steering 12 ran 55
  // to 75 words)
  if (d.card === "ask" && d.kind === "remediation" && prev.splitHold?.ui?.ask?.text && !recordedWalk(input)
    && wordsIn(helpWords(d), prev.splitHold.ui.ask.text) + (d.request === "hindi" ? 8 : 0) > REM_CARD_CAP) return { decision: { ...d, card: "wait" }, stay: true };
  // (the part's card: held by the point's split, it comes now; not yet on the table, the walk poses it — never its point again)
  if (d.card === "ask" && prev.splitHold?.activeItemId && prev.splitHold.ui?.ask) return { decision: d, held: true };
  return { decision: d, input: helpInput(input, d, liveId) };
}
/** A held card asked now, after the decision's words (a point's or a remediation's give-up or Hindi request): the split's held half. */
function helpHeld(prev, input, d) {
  const h = prev.splitHold;
  const s = structuredClone(prev);
  s.turn += 1;
  s.splitHold = undefined; s.cardUnsaid = undefined; s.priorItemId = prev.lastMove ? prev.lastMove.itemId ?? null : undefined;
  const req = input.cls?.request;
  if (d.request === "hindi" && req?.type === "language") { s.ctx = { ...s.ctx, lang: req.lang ?? "hindi", langPinned: true }; if (!d.joint) s.langN = (s.langN ?? 0) + 1; }
  const f = d.rung || d.joint ? helpFields(input.kit, d) : {};
  let move = { ...stripHelp(h.move), ...f, ...(d.request === "hindi" ? { request: "language", ...(d.joint ? { noLangAck: true } : {}) } : {}) };
  noteHelp(s, d);
  s.lastMove = move; s.moveVoiced = false; s.lastUi = h.ui; s.lastContent = h.lastContent; s.activeItemId = h.activeItemId;
  return { state: s, move, moduleCommands: h.moduleCommands ?? [], ui: h.ui, end: false, proposal: directorProposal(move, { ui: h.ui, guidance: s.guidance, purpose: s.purpose }), ...describe(s, input.kit) };
}
/**
 * After the walk: the decision's words on the walk's turn. A hint the walk answered with its remediation is the remediation's (no help);
 * a kept card gets the wording before its question; a close is the walk's own (its key on the answer board, its closing split), marked
 * as help's; a card asked gets the wording first; a turn that goes on gets its joint first — never nothing.
 */
function helpAfter(prev, input, out, pre) {
  const d = pre?.decision ?? null;
  if (!d || !out?.state?.lastMove || input?.event !== "turn") return out;
  const lm = out.state.lastMove;
  const mark = helpMark(d);
  if (pre.hint) {
    // (the walk answered a mix-up with its remediation, or let the card go some other way: that turn stands)
    if (["safeguard", "wrap", "break", "teachback"].includes(String(lm.kind ?? "")) || lm.scriptBeat?.kind === "remediation") return out;
    if (d.card === "close") {
      if (!lm.gave) return out;
      out.state.lastMove = { ...lm, help: mark };
    } else {
      if (out.ui?.ask?.itemId !== d.liveId) return out;
      out.state.lastMove = { ...stripHelp(lm), kind: "hint", itemId: d.liveId, ...helpFields(input.kit, d) };
    }
    noteHelp(out.state, d);
    if (out.move) out.move = { ...out.state.lastMove };
    return out;
  }
  const req = input.cls?.request;
  if (d.request === "hindi" && req?.type === "language" && out.state.ctx?.lang !== (req.lang ?? "hindi")) out.state.ctx = { ...out.state.ctx, lang: req.lang ?? "hindi", langPinned: true };
  if (d.card === "close") out.state.lastMove = { ...lm, help: mark };
  else if (d.card === "ask") out.state.lastMove = { ...stripHelp(lm), ...(d.rung || d.joint ? helpFields(input.kit, d) : { help: mark }), ...(d.request === "hindi" ? { request: "language", ...(d.joint ? { noLangAck: true } : {}) } : {}) };
  else if (d.joint) {
    const j = fillFriend(d.joint.text, friendOf);
    // (Brain 044 T5: after a key, the "nothing easier" line first, then the go-on line — the seam pass turns it into the after-key return before
    // an earlier card, or drops it before the aside's return; the help joint it records is the go-on line)
    const j2 = d.then?.text ? fillFriend(d.then.text, friendOf) : null;
    out.state.lastMove = { ...lm, sayFirst: [j, ...(j2 ? [j2] : []), ...(lm.sayFirst ?? [])], helpJoint: j2 ? { kind: d.then.kind, form: j2, by: d.then.by, spent: { form: j, by: d.joint.by } } : { kind: d.joint.kind, form: j, by: d.joint.by }, help: mark };
  } else out.state.lastMove = { ...lm, help: mark };
  noteHelp(out.state, d);
  if (out.move) out.move = { ...out.state.lastMove };
  return out;
}
/** Brain 042: the part her last turn was on (its beat), for a reply said alone before a worked segment (breakL2's forceAt 0). Set per step:
 *  the walk is synchronous. */
let leadBeatOf = null;
/** Brain 044: whether this step replays a recorded run (tests/fixtures/replay.mjs runScriptOf) — it walks what that run walked, with the counts
 *  it ran under (her aside reply and park line counted). Set per step: the walk is synchronous. */
let recordedNow = false;
/** dc-r8-director28 Brain 044 T7: "let me try" at an asked step means that step — she says the try-first line and the step's question again,
 *  the step still asked (c4 stuck 28: steps 1 and 2 never said, recorded told; c6 offtopic 38; c5-t02 steady 32, offtopic 38). null otherwise. */
function stepTryAgain(prev, input) {
  const sa = prev?.lastMove?.stepAsk;
  if (!sa?.prompt || input?.event !== "turn" || input.branch || !scriptOn() || recordedWalk(input) || prev.lastMove?.splitClose || columnName(input, prev) !== "try_first") return null;
  const we = skillScriptOf(input.kit, sa.skillId)?.workedExample;
  const a = we?.steps?.[sa.step]?.ask;
  if (!a) return null;
  const s = structuredClone(prev);
  s.turn += 1;
  friendOf = s.ctx?.firstName ?? "";
  // (the asked step is on the table again: its reading stays the step's)
  const qi = friendly(scriptStepAskItem(sa.skillId, sa.step, a));
  s.quickItem = qi; s.activeItemId = qi.id;
  const lm = prev.lastMove;
  const m = { kind: "worked_example", shape: lm.shape, request: "selftry", stepAgain: true, stepAsk: { ...sa }, skillId: sa.skillId, format: lm.format,
    ...(lm.scriptBeat ? { scriptBeat: lm.scriptBeat } : {}), ...(lm.methods ? { methods: lm.methods } : {}), ...(lm.prefs ? { prefs: lm.prefs } : {}) };
  s.lastMove = m; s.moveVoiced = false;
  const ui = { status: "your_turn", ...(prev.lastUi?.later ? { later: prev.lastUi.later } : {}) };
  s.lastUi = ui;
  return { state: s, move: m, moduleCommands: [], ui, end: false, proposal: directorProposal(m, { ui, guidance: s.guidance, purpose: s.purpose }), ...describe(s, input.kit) };
}
export function step(prev, input) {
  recordedNow = recordedWalk(input);
  // (dc-r8-director28 Brain 044 T1: after the greeting's simpler wording, the next turn is the hook, the first point and its card — a second
  // request there is answered by the teaching it asks for; the greeting has no other wording)
  const input0 = input;
  const greetAgain = !recordedWalk(input) && !!prev?.lastMove?.greetHelp && input?.event === "turn" && !input.branch && ["clarify", "give_up", "hindi"].includes(columnName(input, prev)) && !input.cls?.flags?.distress && !input.cls?.flags?.wantsToStop;
  if (greetAgain)
    input = { ...input, text: "haan", cls: { ...(input.cls ?? {}), outcome: "no_evidence", request: undefined, flags: { ...(input.cls?.flags ?? {}), dontKnow: false, confused: false } } };
  const tryAgain = stepTryAgain(prev, input);
  leadBeatOf = prev?.lastMove?.closeBeat ?? prev?.lastMove?.scriptBeat ?? null;
  // (Brain 042: a quick question or an asked step was what the child's line was read against — no card: it leaves the table before anything
  // else reads it; the walk acts on the reading — heldTurn's quickAnswer, the worked example's stepAsk)
  if (isQuickId(prev?.activeItemId)) {
    const m = /^stepask:(.+):(\d+)$/.exec(String(prev.activeItemId));
    prev = { ...prev, activeItemId: undefined, quickItem: undefined, ...(isQuickId(prev.cardUnsaid) ? { cardUnsaid: undefined } : {}),
      ...(m && input?.event === "turn" ? { stepRead: { skillId: m[1], step: Number(m[2]), outcome: input.cls?.outcome ?? null, said: String(input.text ?? "").replace(/\s+/g, " ").trim().slice(0, 80) } } : {}) };
  }
  // (dc-r8-director25 H4: the said set, and the one help decision of this turn — before the walk for a request that stays on its part,
  // after it for a hint, a card asked or a turn that goes on)
  const said = input?.event === "turn" ? saidNowOf(prev) : prev?.said;
  const pre = helpBefore(prev, input, said);
  let out = tryAgain ?? (pre?.stay ? helpStay(prev, input, pre.decision) : pre?.held ? helpHeld(prev, input, pre.decision) : stepCells(prev, pre?.input ?? input));
  if (!tryAgain && !pre?.stay && !pre?.held) out = helpAfter(prev, input, out, pre);
  // (Brain 044: a picture asked for at an asked step is the step's picture — its caption, then the step's question again, the step still asked;
  // never a check-in inside the worked example: dry steady c6 18 once T1 moved the lesson there)
  if (input?.event === "turn" && scriptOn() && !recordedNow && prev?.lastMove?.stepAsk?.prompt && !prev.lastMove.splitClose && columnName(input0, prev) === "picture"
    && out?.state?.lastMove && !out.state.lastMove.stepAsk && !out.ui?.ask?.itemId && !["safeguard", "wrap", "break"].includes(String(out.state.lastMove.kind ?? ""))) {
    const sa = prev.lastMove.stepAsk;
    const a = skillScriptOf(input.kit, sa.skillId)?.workedExample?.steps?.[sa.step]?.ask;
    if (a) {
      const qi = friendly(scriptStepAskItem(sa.skillId, sa.step, a));
      out.state.quickItem = qi; out.state.activeItemId = qi.id;
      const { stayCheckin: _s, checkinOk: _c, ...lmP } = out.state.lastMove;
      out.state.lastMove = { ...lmP, stepAsk: { ...sa } };
      if (out.move) out.move = { ...out.state.lastMove };
    }
  }
  // (Brain 044 T1/T5: a second request after the greeting's simpler wording — there is no easier wording of the greeting: the "nothing easier"
  // line, then the lesson starts with the hook, the first point and its card)
  if (greetAgain && out?.state?.lastMove && !["safeguard", "wrap", "break"].includes(String(out.state.lastMove.kind ?? ""))) {
    const j = helpJoint(scriptFor(input.kit)?.script, "helpSpent", { lang: prev.ctx?.lang === "english" ? "english" : "hinglish", lessonKey: prev.ctx?.lessonKey ?? prev.ctx?.sessionId ?? prev.lessonId ?? null, n: prev.helpJointN?.helpSpent ?? 0 });
    if (j?.text) {
      out.state.helpJointN = { ...(out.state.helpJointN ?? {}), helpSpent: (prev.helpJointN?.helpSpent ?? 0) + 1 };
      out.state.lastMove = { ...out.state.lastMove, sayFirst: [j.text, ...(out.state.lastMove.sayFirst ?? [])], helpJoint: { kind: "helpSpent", form: j.text, by: j.by }, help: { part: "greet", request: columnName(input0, prev), rung: null, card: "goOn", joint: "helpSpent", board: null } };
      if (out.move) out.move = { ...out.state.lastMove };
    }
  }
  // (help's wording is said on its own turn: a walk move built from the last one never carries it into a turn help did not decide)
  if (input?.event === "turn" && out?.state?.lastMove && !out.state.lastMove.help && prev?.lastMove?.help && out.state.lastMove.simpler && out.state.lastMove.simpler === prev.lastMove.simpler) {
    const { simpler: _s, simplerBeat: _b, smaller: _m, helpNew: _n, ...lm } = out.state.lastMove;
    out.state.lastMove = lm;
    if (out.move) out.move = { ...lm };
  }
  // (dc-r8-director26 N1 item 2: a clarify or a give-up at the opening's check-in — the hook, which help does not cover — is answered through
  // the authored path: one authored line to the child, the first point, its check-in (or its card). brain/say.js says it with no model
  // call: c5-t02 steering 4 got a turn the model drafted from the first point, cut by the length guard and ending on no question; c6 row
  // 4 in all four lessons got the first point with no word to her)
  if (input?.event === "turn" && scriptOn() && !recordedWalk(input) && !pre && out?.state?.lastMove?.point && !out.state.lastMove.help && ["clarify", "give_up"].includes(columnName(input, prev))) {
    const a = (() => { try { return cellAddressOf(prev, input); } catch { return null; } })();
    if (/:hook$/.test(String(a?.part ?? ""))) {
      out.state.lastMove = { ...out.state.lastMove, hookHelp: columnName(input, prev) };
      if (out.move) out.move = { ...out.move, hookHelp: out.state.lastMove.hookHelp };
      // (her word is a Hindi-switch form: its rotation counts it, as a language request's does)
      out.state.langN = (out.state.langN ?? 0) + 1;
    }
  }
  const helped = out?.state?.lastMove?.help ?? null;
  // (dc-r8-director28 Brain 044 T5: help is a hard precondition — a turn that answers a request says an unsaid wording of the last part taught,
  // its key, or the "nothing easier" line before anything that moves the lesson. Thrown under tests and the dry harness)
  if (STRICT_REQUEST() && input?.event === "turn") requestHelpedOrThrow(prev, input, out);
  // (dc-r8-director22 R: her aside question is answered by the next line and only the next line — every path clears it, including the
  // ones that return a copy of the last state before step0's own clearing)
  if (input?.event === "turn" && out?.state && out.state.asideReplyDue) out.state.asideReplyDue = undefined;
  // (O1/O2, director21 dry steering c5-t02 34→36: a return held point e3 back while its card was held for a split; the held half came
  // through heldTurn, which never read bodyUnsaid — the point was dropped. Every path says what a return held, first)
  const lm0 = out?.state?.lastMove;
  if (prev?.bodyUnsaid?.length && lm0 && !lm0.heldSaid && !["safeguard", "wrap", "break"].includes(lm0.kind) && input?.event === "turn") {
    const held = prev.bodyUnsaid.map(String);
    const add = { sayFirst: [...held, ...(lm0.sayFirst ?? [])], heldSaid: held, ...(prev.lastMove?.scriptBeat?.board ? { heldBeat: { ...prev.lastMove.scriptBeat } } : {}) };
    out.state.lastMove = { ...lm0, ...add };
    if (out.move) out.move = { ...out.move, ...add };
  }
  // (dc-r8-director24 L: one new thing a turn — the held part said first after her reply, and the card with it, over 60 words: the held
  // part ends on its check-in and the card comes on the next turn, as a split's teaching half holds it)
  // (dc-r8-director25: and a split's held half said now — a point and its card after an aside or a return's reply — is held to it too)
  if (input?.event === "turn" && scriptOn() && !scriptFor(input.kit)?.script?.recordedRun && (out?.state?.lastMove?.heldSaid?.length || (prev?.splitHold && !prev.splitHold.teach && out?.state?.lastMove?.point)) && out.ui?.ask?.text && out.state.lastMove.itemId && !out.state.splitHold) {
    const lm = out.state.lastMove;
    // (Brain 044 T6: her reply to the aside that leads it is not counted; T1: a point and its card share a turn to 75, with no 60-word cap)
    const w = String([...(lm.sayFirst ?? []), lm.point ?? "", out.ui.ask.text].join(" ")).split(/\s+/).filter(Boolean).length;
    // (a park whose return is due waits for no card: the held part ends its turn and the return comes at the boundary after it, as before —
    // r8-main-034's offtopic lesson, where the card would have kept the return off for twenty turns)
    const parkDue = (out.state.later ?? []).some((e) => !e.servedAt && e.share && e.parkSaid && e.onItem && Number.isFinite(e.at) && out.state.turn > e.at && e.onItem !== out.state.lastMove?.itemId);
    if (w > L2_CAP || parkDue) {
      const hadPoint = lm.point != null;
      const sp = splitTeach({ ...out, move: { ...lm, ...(hadPoint ? {} : { point: lm.sayFirst.join(" ") }) } }, input, 0, 0);
      if (sp !== out && sp?.state?.splitHold) {
        if (!hadPoint) { delete sp.state.lastMove.point; delete sp.move.point; }
        // (the card's own sentences belong to the card, said whole on the next turn — never one of them left in the held part)
        const cardKs = String(out.ui.ask.text).split(/(?<=[.!?\u0964])\s+/).map((x) => normLine(x)).filter((x) => x.length > 8);
        const strip = (t) => String(t).split(/(?<=[.!?\u0964])\s+/).filter((x) => !cardKs.includes(normLine(x))).join(" ").trim();
        const sf = (sp.state.lastMove.sayFirst ?? []).map(strip).filter(Boolean);
        const rd = (sp.state.lastMove.rendered ?? []).map(strip).filter(Boolean);
        sp.state.lastMove = { ...sp.state.lastMove, sayFirst: sf, heldSaid: (sp.state.lastMove.heldSaid ?? []).map(strip).filter(Boolean), ...(sp.state.lastMove.rendered ? { rendered: rd } : {}),
          ...(sp.state.lastMove.cardPoint ? { cardPoint: strip(sp.state.lastMove.cardPoint) || undefined } : {}) };
        sp.move = { ...sp.state.lastMove };
        // (the card is held, not posed: its posing this turn is undone — the next turn poses it fresh, never "Phir se dekho:")
        const id = sp.state.splitHold?.move?.itemId ?? lm.itemId;
        if (id && sp.state.posedAt?.[id] === sp.state.turn) { const { [id]: _p, ...rest } = sp.state.posedAt; sp.state.posedAt = rest; }
        if (id && sp.state.cardSaidN?.[id]) sp.state.cardSaidN = { ...sp.state.cardSaidN, [id]: sp.state.cardSaidN[id] - 1 };
        out = sp;
      }
    }
  }
  // (dc-r8-director24 P, c5-t02 steering 38: a held part said once is said — the second half of a split turn returns early with the held
  // parts still on the state, and the turn after said them again)
  if (input?.event === "turn" && prev?.bodyUnsaid?.length && out?.state?.lastMove?.heldSaid?.length && out.state.bodyUnsaid === prev.bodyUnsaid) out.state.bodyUnsaid = undefined;
  if (input?.event === "turn" && prev?.bodyUnsaid?.length && out?.state?.bodyUnsaid && JSON.stringify(out.state.bodyUnsaid) === JSON.stringify(prev.bodyUnsaid) && (out.state.lastMove?.heldSaid?.length || out.state.lastMove?.sayFirst?.some((x) => prev.bodyUnsaid.map(String).includes(String(x))))) out.state.bodyUnsaid = undefined;
  // (the cell address the turn read rides on the move and the state's lastMove: the harness writes it on each teacher row)
  // (dc-r8-director23 R2: the column is what the walk read on THIS turn — a move built from the last one (K's second wording) never keeps
  // that turn's cell; a column with no part the walk is on is still recorded, with no part)
  const cell0 = (() => { try { return cellAddressOf(prev, input0) ?? (input0?.event === "turn" ? columnOf(input0, prev) : null); } catch { return null; } })();
  // (dc-r8-director23 T2: each card she got right, with the misses it took — the wrap's sentence about her names the hardest)
  if (input?.event === "turn" && out?.state && prev?.activeItemId && input.cls?.outcome === "correct" && prev.phase !== "teachback")
    out.state.rightLog = [...(prev.rightLog ?? []), { id: prev.activeItemId, misses: (prev.misses?.[prev.activeItemId] ?? 0) + (prev.cardHelp?.id === prev.activeItemId ? prev.cardHelp.misses ?? 0 : 0), turn: prev.turn ?? 0 }].slice(-40);
  // (dc-r8-director23 R2, c4 offtopic 46: "samajh nahi aaya" after her reply turn got "Theek hai." and the after-aside joint — the move,
  // a copy of the last one, kept its asideAck. An aside is acknowledged on the turn that answers one, and only then)
  // (dc-r8-director23 A2, c5-t01 offtopic 18, c6 steering 30: asked her taste on a worked step through the main path, the AI line ends on
  // its question and the step is held for the turn after the reply — as heldTurn holds it)
  if (input?.event === "turn" && out?.state?.lastMove?.tasteAsked && out.state.lastMove.kind === "worked_example" && !out.state.splitHold && scriptOn()) {
    const held = { ...out.state.lastMove }; delete held.tasteAsked;
    out.state.splitHold = { move: held, ui: out.ui ?? { status: "your_turn" }, activeItemId: out.state.activeItemId ?? null, lastContent: out.state.lastContent ?? [], moduleCommands: out.moduleCommands ?? [], teach: true };
    const ret = { kind: "repair", shape: SH.uptake({ kind: "personal_share" }), tasteAsked: out.state.lastMove.tasteAsked, ...(prev?.lastMove?.scriptBeat ? { scriptBeat: prev.lastMove.scriptBeat } : {}) };
    out.state.lastMove = ret; out.state.activeItemId = undefined; out.state.lastUi = { status: "your_turn" };
    out.move = ret; out.ui = { status: "your_turn" };
  }
  // (dc-r8-director23 A2: a reply to her question that comes through heldTurn is acknowledged as the main path acknowledges one)
  if (input?.event === "turn" && input.cls?.asideReply && out?.state?.lastMove && !out.state.lastMove.asideAck && prev?.splitHold) {
    out.state.lastMove = { ...out.state.lastMove, asideAck: true };
    if (out.move) out.move = { ...out.move, asideAck: true };
  }
  // (the second half of a split turn — heldTurn — returns early with the reply turn's returnAnswer still on the state)
  const isReply = !!input?.cls?.asideReply || (!!out?.state?.returnAnswer && !!prev?.returnAsked);
  if (input?.event === "turn" && out?.state && !isReply) {
    if (out.state.returnAnswer) out.state.returnAnswer = undefined;
    if (out.state.lastMove?.asideAck || out.state.lastMove?.returnReply) { const { asideAck: _a0, returnReply: _r0, ...lmA } = out.state.lastMove; out.state.lastMove = lmA; }
    if (out.move?.asideAck || out.move?.returnReply) { const { asideAck: _a1, returnReply: _r1, ...mA } = out.move; out.move = mA; }
  }
  // (what the walk did decides the column where its action says more than the reading: a park or an aside acknowledged is "aside", a
  // break or a stop is "stop", her reply's answer is "aside_reply")
  const lmNow = out?.state?.lastMove ?? {};
  const acted = input?.event !== "turn" ? null
    : (out?.state?.later?.length ?? 0) > (prev?.later?.length ?? 0) || lmNow.asideAck && !input.cls?.asideReply ? "aside"
      : lmNow.kind === "break" || lmNow.stopping || out?.move?.stopping || (["wrap", "done"].includes(String(lmNow.kind ?? out?.move?.kind ?? "")) && out?.state?.stoppedEarly && !prev?.stoppedEarly) ? "stop"
        : input.cls?.asideReply ? "aside_reply" : null;
  // (Brain 044 T8: a line on a quick question is addressed as the quick question, whatever help said — c5-t01 steady 8, offtopic 32; c6 steady 8)
  const cell0h = helped && cell0 && !/:quick$/.test(String(cell0.part ?? "")) ? { part: helped.part, column: cell0.column, ...(helped.keyed ? { keyed: true } : {}), ...(helped.closed ? { closed: true } : {}) } : cell0;
  const cell = acted ? { part: cell0h?.part ?? null, column: acted } : cell0h;
  if (input?.event === "turn" && out?.state) {
    // (the wording help says this turn is said on it: in the set now, whatever the reply around it — the next turn adds her whole line)
    out.state.said = helped && out.state.lastMove?.simpler ? addSaid(said, out.state.lastMove.simpler, out.state.turn ?? 0) : said;
    // (the card just keyed: a give-up or a clarify after its check-in is help on it — the record help reads; a help turn sets it itself)
    if (!helped) {
      const lmK = out.state.lastMove ?? {};
      // (dc-r8-director27 P3: keyed means a key was said as help — a right answer's verdict does not set it, and a bridge said after the
      // close moves the address to the bridge: c5-t01 steady 80, 82; c6 stuck 58, offtopic 54, steering 30)
      const keyedNow = !out.ui?.ask?.itemId && !!lmK.closeBeat && !!(lmK.gave?.answer || lmK.closed?.answer || lmK.splitClose || lmK.gaveCheck)
        && columnName(input, prev) !== "right" && !lmK.bridgeSaid && lmK.scriptBeat?.kind !== "bridge";
      if (keyedNow) out.state.keyedPart = cardPartOf(input.kit, { itemId: prev?.activeItemId ?? lmK.itemId ?? null, beat: lmK.closedBeat ?? lmK.closeBeat }) ?? undefined;
      else if (out.ui?.ask?.itemId || lmK.point || lmK.rendered?.length || lmK.bridgeSaid || lmK.kind === "worked_example") out.state.keyedPart = undefined;
      // (dc-r8-director27 P3: a card closed by a right answer, with nothing posed or taught after it — help's part, not keyed)
      const closedRight = !out.ui?.ask?.itemId && !!lmK.closeBeat && columnName(input, prev) === "right" && !lmK.bridgeSaid && lmK.scriptBeat?.kind !== "bridge" && !lmK.point && !lmK.rendered?.length;
      out.state.closedPart = closedRight ? cardPartOf(input.kit, { itemId: prev?.activeItemId ?? lmK.itemId ?? null, beat: lmK.closedBeat ?? lmK.closeBeat }) ?? undefined : undefined;
    }
  }
  if (out?.state?.lastMove && input?.event === "turn") {
    const { cell: _c0, ...lm1 } = out.state.lastMove;
    out.state.lastMove = cell ? { ...lm1, cell } : lm1;
    if (out.move) { const { cell: _c1, ...m1 } = out.move; out.move = cell ? { ...m1, cell } : m1; }
  }
  return out;
}
function stepCells(prev, input) {
  // (main on C1 ruling 5, the stuck child's "samajh nahi aaya" after a key's check-in: read as "another", it moved to the next point
  // and posed its card — clarifyCard. The child's words say clarify: so does the request)
  if (input?.event === "turn" && input.cls?.request?.type === "another" && SAYS_CLARIFY.test(String(input.text ?? "")) && !input.cls.flags?.distress
    && keySaidNoCard(prev))
    input = { ...input, cls: { ...input.cls, request: { ...input.cls.request, type: "clarify", src: "says_clarify" } } };
  // (dc-r8-director25 H4: a give-up at a worked step's check-in, a second clarify, a clarify after a picture on a closed card, a clarify or a
  // give-up on a worked problem or step — each had its own path here, picking its wording from a counter; they are help, and help is
  // decided once, before the walk: step()'s helpBefore)
  const out = step0(prev, input);
  // (dc-r8-second-clarify-shows-not-rewords, main's reversal clause: the judges count second-clarify rows. A clarify on the same live
  // part as the clarify before it is the n-th, recorded on the move, on every path (a held half included); any other turn ends the run)
  if (out?.state && input?.event === "turn") {
    // (the same part: the one her last re-explanation was about is the one they still do not get)
    const partKey = partOf(prev, prev?.lastMove);
    const clar = out.move?.request === "clarify" || input.cls?.request?.type === "clarify" || SAYS_CLARIFY.test(String(input.text ?? ""));
    if (clar) {
      const n = prev?.clarifyRun?.key === partKey ? prev.clarifyRun.n + 1 : 1;
      // (C1: a clarify answered by moving on to another part leaves that part fresh — its first clarify is a first, never a second)
      const nowKey = partOf(out.state, out.state.lastMove);
      const moved = !!partKey && !!nowKey && nowKey !== partKey;
      out.state.clarifyRun = { key: nowKey, n: moved ? 0 : n };
      if (out.state.lastMove) out.state.lastMove = { ...out.state.lastMove, clarifyN: moved ? undefined : n };
    } else out.state.clarifyRun = undefined;
  }
  // (v6.11 G2, main on director19: "Phir se dekho:" on cards never asked — a card is posed when the turn that goes out carries it,
  // whatever path built that turn (a split's held half included); a pose her line did not say, A4's cardUnsaid, is no posing)
  const askF = out?.ui?.ask?.itemId;
  if (askF && out.state && (out.state.posedAt?.[askF] == null || prev?.cardUnsaid === askF)) out.state.posedAt = { ...(out.state.posedAt ?? {}), [askF]: out.state.turn };
  // (dc-r8-director20 G3, fault 5: how many turns have said each card — a give-up on a card said twice has had its help)
  if (askF && out.state && out.state.cardUnsaid !== askF) out.state.cardSaidN = { ...(out.state.cardSaidN ?? {}), [askF]: (out.state.cardSaidN?.[askF] ?? 0) + 1 };
  return out;
}
function step0(prev, input) {
  // v6.1 R10 (main, director9: 0 parks across four topics; "kal maine cricket khela, sixer maara" came with no request and got
  // a cricket-fractions analogy): in a scripted lesson a turn that answers nothing and names an aside topic of theirs is a share,
  // parked and returned to (never the card's answer: a graded turn, a request or a stuck turn is left as it is)
  if (input.event === "turn" && scriptOn() && scriptIdOf(input.kit) && input.cls && input.cls.outcome === "no_evidence" && !input.cls.request
    && !input.cls.flags?.dontKnow && !input.cls.flags?.distress && !input.cls.flags?.wantsToStop) {
    const topic = asideTopic(input.text ?? "", prev.ctx?.interests);
    if (topic && !unsafeChildPhrase(topic)) input = { ...input, cls: { ...input.cls, request: { type: "uptake", kind: "personal_share", topic, src: "code" } } };
  }
  // v6.8 R5 (main on director16 c5-t02 steady 64, stuck 62: "woh wala ho gaya, aage chalo" got the stop menu — the model read a stop):
  // "go on" with no stop word in it is never a stop
  if (input.event === "turn" && scriptOn() && input.cls && !prev?.safeguard && !input.cls.flags?.distress && GO_ON.test(String(input.text ?? "")) && !STOP_WORD.test(String(input.text ?? ""))
    && (input.cls.flags?.wantsToStop || ["stop", "end", "break", "goodbye"].includes(input.cls.request?.type))) {
    const { request: _r, ...rest } = input.cls;
    input = { ...input, cls: { ...rest, flags: { ...rest.flags, wantsToStop: false } } };
  }
  // v6.10 T2 (main on director18 c5-t01 offtopic 38: "ruko, main khud karti hoon" with no card open got "khud karke dekho" and nothing to
  // try): a try-first is a self-try — with no card open, she poses the card
  const liveRun = !scriptFor(input.kit)?.script?.recordedRun;
  if (input.event === "turn" && scriptOn() && liveRun && input.cls?.request?.type === "thinking" && /(?<![\p{L}])(?:khud|myself|try\s+kar|main\s+kar(?:ti|ta|ungi|unga))(?![\p{L}])/iu.test(String(input.text ?? ""))) {
    input = { ...input, cls: { ...input.cls, request: { type: "selftry", src: "try_first" } } };
  }
  // v6.10 T2 (main on director18 c5-t01 offtopic 24, steady 50, stuck 60: the child had answered before the card was posed, she posed it,
  // they said "woh maine bata diya" — and got the key): she asks for it once more, in one short line; never the key for that
  if (input.event === "turn" && scriptOn() && liveRun && input.cls && !input.cls.flags?.distress && prev?.activeItemId && prev.lastUi?.ask?.text
    && ALREADY_SAID.test(String(input.text ?? "")) && !/\d/.test(String(input.text ?? "")) && prev.askedAgain !== prev.activeItemId && prev.pendingWhy !== prev.activeItemId && !STOP_WORD.test(String(input.text ?? ""))) {
    const { request: _ra, ...restA } = input.cls;
    input = { ...input, cls: { ...restA, outcome: "no_evidence", flags: { ...(restA.flags ?? {}), wantsToStop: false, dontKnow: false }, request: { type: "ask_again" } } };
  }
  // (dc-r8-director25 H4: "pata nahi" / "samajh nahi aaya" at a point's check-in is help on the point, decided in step()'s helpBefore —
  // v6.9 T1's re-route to the card by the request table is gone)
  // (dc-r8-director27 Brain 042 Q2: the child's line on an asked step — an answer, a give-up, anything that is no request — is read by the
  // walk from step()'s record of it (s.stepRead): it reaches the walk as a plain go-on, never as a card's answer, a give-up's help or a
  // frustration break)
  if (input.event === "turn" && prev?.lastMove?.stepAsk && scriptOn()) {
    const c = input.cls ?? {};
    const col = columnName(input, prev);
    const req = !!(c.request || c.help || c.asideReply) || ["clarify", "hindi", "picture", "repeat", "aside", "try_first", "move_on"].includes(col);
    if (!c.flags?.distress && !c.flags?.wantsToStop && (!req || col === "give_up")) input = { ...input, stepAnswer: true, cls: { ...c, outcome: "no_evidence", request: undefined, flags: { ...(c.flags ?? {}), dontKnow: false, minimal: false, confused: false } } };
    // ("phir se bolo", "sawaal kya hai?" on an asked step: its question again, with code's frame — the step stays asked)
    else if (!c.flags?.distress && !c.flags?.wantsToStop && col === "repeat" && !prev.splitHold) {
      const sa = prev.lastMove.stepAsk;
      const a = skillScriptOf(input.kit, sa.skillId)?.workedExample?.steps?.[sa.step]?.ask;
      if (a) {
        const s = structuredClone(prev);
        s.turn += 1; s.stepRead = undefined;
        friendOf = s.ctx?.firstName ?? "";
        const qi = friendly(scriptStepAskItem(sa.skillId, sa.step, a));
        s.quickItem = qi; s.activeItemId = qi.id;
        const m = { kind: "worked_example", shape: prev.lastMove.shape, skillId: prev.lastMove.skillId, format: prev.lastMove.format, stuck: true, request: "repeat", stepAsk: { ...sa },
          ...(prev.lastMove.scriptBeat ? { scriptBeat: prev.lastMove.scriptBeat } : {}) };
        const ui0 = { status: "your_turn" };
        s.lastMove = m; s.moveVoiced = false; s.lastUi = ui0;
        return { state: s, move: m, moduleCommands: [], ui: ui0, end: false, proposal: directorProposal(m, { ui: ui0, guidance: s.guidance, purpose: s.purpose }), ...describe(s, input.kit) };
      }
    }
  }
  // v6 R5: the second half of a split turn (splitLong) comes first
  const heldOut = prev?.splitHold ? heldTurn(prev, input) : null;
  if (heldOut) return heldOut;
  const s = structuredClone(prev);
  s.cardUnsaid = undefined;
  s.bodyUnsaid = undefined;
  s.asideReplyDue = undefined;
  // (v6.11 J2: her last turn ended on an aside's return question and this reply is about it: their answer is the aside's own reply —
  // never parked as a new aside, never returned again; brain/say.js answers it with one sentence of hers, else a neutral joint)
  s.returnAnswer = prev.returnAsked && input.cls?.asideReply ? { topic: prev.returnAsked.topic, said: String(input.text ?? "").replace(/\s+/g, " ").trim().slice(0, 80) } : undefined;
  s.returnAsked = undefined;
  // (a safety read or a stop over a split turn: the held half is let go; the card comes back through the walk)
  // (dc-r8-director20, c5-t02 offtopic 24-32: "drawing karke samjhao" at a key's check-in let the held worked problem go, and the worked
  // example began at step 1 — the picture is answered as a picture (P6), and a held worked problem stays held for the next turn)
  // (O4, main on director21 c4 stuck 18, offtopic 26, c5-t02 offtopic 28: a picture asked at a key's check-in let the held next part go
  // and showed ITS board — a picture, a Hindi or a repeat request stays on the card just closed; the next part stays held)
  const stayRq = ["visual", "language", "repeat", "which"].includes(input.cls?.request?.type);
  const keepWorked = !!s.splitHold && !s.splitHold.teach && prev.lastMove?.splitClose && stayRq && !input.cls?.flags?.distress;
  if (keepWorked && prev.lastMove?.closeBeat) s.stayOn = { beat: { ...prev.lastMove.closeBeat }, turn: s.turn + 1 };
  // (dc-r8-director25 H4: after help's own key — the walk did not move on — a picture or a repeat stays on the card just closed too)
  // (dc-r8-director26, the record — c5-t01 steering 14: "drawing karke samjhao" after the walk's own key on a then-card redrew the question's
  // board and its caption; any key said, by help or by the walk, keeps a picture on the answered board)
  else if (!keepWorked && stayRq && (prev.lastMove?.help?.card === "close" || prev.lastMove?.gave?.answer) && !prev.lastUi?.ask?.itemId && prev.lastMove?.closeBeat?.board && !input.cls?.flags?.distress) s.stayOn = { beat: { ...prev.lastMove.closeBeat }, turn: s.turn + 1 };
  if (s.splitHold && !keepWorked) { if (s.splitHold.activeItemId && !s.activeItemId) s.activeItemId = s.splitHold.activeItemId; s.splitHold = undefined; }
  // QA 14.4.1 (brain/say.js selfPosedVerdict): was a kit item on the table when the child spoke? null: her own words were
  // (a worked step, an explain), so a sum she asked there is checked in code even when this move poses the next card
  if (input.event === "turn") s.priorItemId = prev.lastMove ? prev.lastMove.itemId ?? null : undefined;
  // round 4 (conversation): a question tacked onto a graded answer ("yes, also why is the sky blue") is parked like the note's
  // alongside reading (code-first; the note runs only on non-answer turns). Screened in code like every parked topic.
  if (input.event === "turn" && p5Flag("R4CONV") && input.cls && !input.cls.alsoPark && ["correct", "incorrect", "partial", "misconception"].includes(input.cls.outcome)) {
    const q = alsoQuestion(input.text ?? "");
    if (q && !unsafeChildPhrase(q)) input = { ...input, cls: { ...input.cls, alsoPark: { topic: q, learning: true } } };
  }
  // round 4 round B (battery question_on_topic: "kya 1/3 hamesha 1/4 se bada hota hai?" said over an explanation got the next
  // teaching step): with NO question on the table, a turn shaped as a question about the idea is their question, answered
  // first (answer_q); never with an item on the table (there it may be an answer), never over a request or the floor
  if (input.event === "turn" && p5Flag("R4CONV") && input.cls && !input.cls.request && !input.cls.help && !input.cls.flags?.distress
    && input.cls.outcome === "no_evidence" && !s.activeItemId && ["teach", "warmup"].includes(s.phase) && questionShaped(input.text ?? "")) {
    input = { ...input, cls: { ...input.cls, request: { type: "answer_q", whole: true, src: "r4" } } };
  }
  // round 7 A8 (brain-steering-persistence): how they asked to be taught, read in code, is kept for the lesson (s.methods:
  // rendered last on every compile, mapped to knobs); a turn that is only that ask is the adopt request
  if (input.event === "turn" && input.cls && !input.cls.flags?.distress && !["correct", "incorrect", "partial", "misconception"].includes(input.cls.outcome)) {
    const m = readMethod(input.text ?? "");
    if (m) {
      s.methods = keepMethod(s.methods, m);
      if (!input.cls.request) input = { ...input, cls: { ...input.cls, request: { type: "adopt", methodId: m, whole: true, src: "method" } } };
    }
  }
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
  // round 5 (owner 2026-10-14: an empty backstop turn made her jump to "grams aur kilograms"): a turn with no words, no
  // chip and no answer is silence. It never advances anything — not the intake, not the teaching, not the item: she waits
  // and gently asks again, the same thing, and after three quiet turns checks they can hear her. Any words reset it.
  let p = silentTurn(s, input, active);
  if (!p) p = sessionIntake(s, input, now);
  if (!p) p = reacting ? moduleReaction(s, input, active) : decide(s, input, active);
  if (!p?.silent) s.quiet = 0;
  if (p && !input.branch && p5Flag("CARDCAP")) p = capPlan(s, input, p);
  if (!p) {
    return { state: s, move: s.lastMove, moduleCommands: [], ui: s.lastUi ?? { status: "your_turn" }, end: s.phase === "done", hold: true, ...describe(s, input.kit) };
  }

  // The item as this child is asked it (findItem: the address register), whichever path chose it.
  const item = p.item ? (findItem(s, input.kit, p.item.id) ?? p.item) : null;
  // Notes on the real move only: a voice branch (branchesFor, input.branch) is rendered into the appended-last
  // section, whose budget the kit load gate measured without them (compile.js checkFits).
  // round 3 (conversation): the move right after a stop check-in that the child did not answer with a stop (s.lastMove is
  // still the check-in here) carries on as normal; a chosen "keep going" already says so (resume's prefix)
  const goOn = p5Flag("R3CONV") && !input.branch && s.lastMove?.checkin === "stop" && !p.checkin && !["wrap", "break", "safeguard"].includes(p.kind)
    && !/keep going/.test(String(p.shape ?? ""));
  // round 3 (conversation): the second need of a two-needs turn, honoured in the same move's words (lexicon.js alsoReading)
  const also = p5Flag("R3CONV") && !input.branch && input.event === "turn" && !NO_VERDICT_MOVES.has(p.kind)
    && !["correct", "incorrect", "partial", "misconception"].includes(input.cls?.outcome)
    ? alsoReading(input.text ?? "", input.cls?.request?.type ?? p.request ?? null) : null;
  const notes = input.branch ? [] : [gradedItem && !NO_VERDICT_MOVES.has(p.kind) ? SH.VERDICT_NOTE[verdictKey(input.cls)] : null, registerNote(s.ctx.address),
    // p5-interaction: the UNDERSTAND note's alongside readings on a graded answer (hedge, check, insist; a parked question)
    ...(p5Flag("STEER") && !NO_VERDICT_MOVES.has(p.kind) ? [...(input.cls?.mods ?? []).map((m) => SH.MOD_NOTE[m]), input.cls?.alsoPark ? SH.parkAlso({ topic: input.cls.alsoPark.topic }) : null] : [])];
  // round 3: the extra notes (after a check-in, a second need) ride only while the shape keeps room under the MOVE section's
  // cap (compile.js SECTION_CAPS.move 260 tokens ≈ 910 characters with its two header lines): the shape is not droppable, and
  // an over-cap MOVE section is a BudgetError → a 500 on a live turn (ship5 integration, w2c-personalisation). Optional
  // notes are dropped first, never the move.
  // round 3 fix (experience B7): the composed shape itself is fitted first, by dropping the clauses shapes.js marks optional
  let shape = fitShape(join(p.shape, ...notes));
  // 14.4: the move that answers the child straight out of a check-in opens with one warm line (it rides first, while room)
  const careLine = !input.branch && s.careLine === s.turn && !["wrap", "safeguard"].includes(p.kind);
  if (!input.branch) delete s.careLine;
  if (careLine && join(SH.afterCareCheck(), shape).length <= SHAPE_ROOM) shape = join(SH.afterCareCheck(), shape);
  for (const extra of input.branch ? [] : [goOn ? SH.afterCheckin() : null, ...(also ?? []).map((x) => SH.ALSO_NOTE[x])]) {
    if (extra && join(shape, extra).length <= SHAPE_ROOM) shape = join(shape, extra);
  }
  const move = { kind: p.kind, shape };
  // round 4 (conversation): the request's must-do (and a second need's) as a last-section note (compile.js lastParts)
  let backLead = null;
  if (!input.branch && p5Flag("R4CONV") && input.event === "turn" && !["safeguard", "wrap"].includes(p.kind)) {
    const key = p.request === "uptake" ? input.cls?.request?.kind ?? null : p.request === "visual" ? `visual_${p.visual ?? "diagram"}` : p.request;
    // a parked question or share served this turn comes back FIRST (it lost to the move in the middle of the shape)
    const back = s.servedNow ? SH.returnParked({ topic: s.servedNow.topic, share: s.servedNow.share }).replace(/^before the next thing: /, "first, ") : null;
    backLead = back;
    const parked = input.cls?.alsoPark?.topic ? SH.parkAlso({ topic: input.cls.alsoPark.topic }) : null;
    // a share kept for later this turn: the note carries the promise (never only "react warmly")
    const kept = key === "personal_share" ? (s.later ?? []).find((e) => e.share && e.at === s.turn && !e.servedAt) : null;
    const must = [back, kept ? SH.mustShareKept({ promise: kept.promise }) : SH.MUST_NOTE[key], parked, ...(also ?? []).filter((x) => x !== key).map((x) => SH.ALSO_NOTE[x])].filter(Boolean);
    // (TEACHER-11, owner's audit: joined then cut at 300 characters — "a game, in simpler words" is 332 and lost the end of its second
    // note. Budget gates throw, they do not cut: the notes are joined whole; compile's "last" section sheds the note whole, and its
    // token budget throws, never a cut mid-note)
    if (must.length) move.must = must.join("; ");
  }
  // round 2 (conversation): how the child asked to be taught ("step by step", "picture first") rides on every later move
  // (compile.js renders it, droppable): before this, s.prefs was written and never read, so a method request lasted one turn
  if (p5Flag("STEER") && s.prefs?.length && !["safeguard", "wrap"].includes(p.kind)) move.prefs = s.prefs.slice(-2);
  // round 7 A8: the kept methods ride on every later move (compile.js renders them in the last section, never shed)
  if (s.methods?.length && !["safeguard", "wrap"].includes(p.kind)) move.methods = [...s.methods];
  if (item) Object.assign(move, { itemId: item.id, skillId: item.skillId, hintLevel: s.hintLevel });
  // round 7 S3 (director2: "15 pencils" came after the fraction cards with no word between): a card of a new kit skill gets a
  // bridge first, so the arc reads in the kit's order
  if (oneLiveOn() && item && !["safeguard", "wrap", "break"].includes(move.kind)) {
    if (s.lastCardSkill && item.skillId && item.skillId !== s.lastCardSkill && s.lastCardId !== item.id) {
      move.shape = join("a new kind of question after the last one: first one short line on how it builds on what they just did", move.shape);
      move.bridge = true;
    }
    s.lastCardSkill = item.skillId ?? s.lastCardSkill; s.lastCardId = item.id;
  }
  if (p.skillId) move.skillId = p.skillId;
  if (p.probe) move.probe = p.probe;
  if (p.format) move.format = p.format;
  // round 7 A8: "khud try karne do" (try_first): a question they have had no help on yet is posed attempt-first
  if (item && s.methods?.includes("try_first") && ["practice", "probe", "retrieval"].includes(move.kind) && !s.hintLevel) move.format = "F8";
  // 14.4.3 (release replay r2 t3): a worked part SHOWN to a stuck child; the reply guard holds her to showing (brain/say.js)
  if (p.stuck) move.stuck = true;
  // round 7 S2: the worked part rendered in code (worked.js); brain/say.js speaks these lines after one framing sentence
  if (p.rendered?.length) move.rendered = [...p.rendered];
  // (dc-r8-director26 C1: two told steps on one turn — the first's number; the beat is the second's)
  if (p.stepFrom) move.stepFrom = p.stepFrom;
  // (dc-r8-director26 C1, main's ruling: the worked problem said with its first step — its lines lead the rendered ones; the hook said
  // before the first point, on that point's turn)
  if (p.problemLines) move.problemLines = p.problemLines;
  // (dc-r8-director27 Brain 042 Q2: the asked step this segment ends on, and the child's answer to the one before it)
  if (p.stepAsk) move.stepAsk = { ...p.stepAsk };
  if (p.stepReply) move.stepReply = { ...p.stepReply };
  if (p.hookSaid) move.hookSaid = true;
  if (p.authoredEnd) move.authoredEnd = p.authoredEnd;
  if (p.endVerdict) move.endVerdict = p.endVerdict;
  // (dc-r8-director27 P4, P7: what each authored ending line is — the closing question's lead-in, its hint, the question — for the record)
  if (p.renderedKinds?.length) move.renderedKinds = [...p.renderedKinds];
  if (p.endKey) move.endKey = p.endKey;
  if (p.endWhy) move.endWhy = p.endWhy;
  // (dc-r8-director25 L2 item 2: which turn of the wrap this is, and its acknowledgement, for brain/say.js and the seam record)
  if (p.wrapPart) move.wrapPart = p.wrapPart;
  if (p.wrapAck) move.wrapAck = p.wrapAck;
  if (p.wrapAsk) move.wrapAsk = p.wrapAsk;
  // round 7 S3: the answer of a card let go after two misses plus help, said in code (brain/say.js)
  if (p.gave?.answer) move.gave = { ...p.gave };
  // v6.3 T1′ (main, director11 c5-t02 steady T17: "Toh poora jawab: Sana …" after the why-probe was answered): a worked close is
  // said only on the turn after their answer to the worked card itself, never on a probe answer (the verdict closed it already)
  // (and director11 c5-t01 stuck T24: the worked close said on the ribbon card's third miss: only after the worked card itself)
  if (p.workedDone?.answer && /:ask:worked$/.test(String(prev.activeItemId ?? "")) && !(prev.pendingWhy && prev.pendingWhy === prev.activeItemId)) move.workedDone = { ...p.workedDone };
  // round 7 T2: the script beat this move renders (brain/propose.js puts its board on Studio's ask as intent.boardRef)
  if (p.scriptBeat) move.scriptBeat = { ...p.scriptBeat };
  // dc-r7-script-walk-v2 R4: a picture asked for during a walk re-shows the current beat's board (never a board of another idea)
  if (p.keyedPicture) move.keyedPicture = true;
  if (p.request === "visual" && p.visual !== "game" && scriptOn()) {
    // (SC2, Studio: while a script card is live the picture is THAT card's board, never the beat a reteach routes to; a card
    // with no board sends none, and Studio picks for the live item)
    const live = s.activeItemId ? findItem(s, input.kit, s.activeItemId) ?? s.scriptCard ?? null : null;
    const card = live && (live.scriptAsk || live.scriptCheck || live.scriptThen) ? cardBeatRef(s, input.kit, live) : null;
    // (dc-r8-director27, Brain 042 E3 — director27 c5-t01 steering 14, c6 steering 14, c5-t02 steady 18: a picture asked for after a key drew
    // the answer board with a code-written caption; the card's own second view is drawn — its posing board's — and its authored viewCaption
    // is said)
    if (s.stayOn?.turn === s.turn && s.stayOn.beat?.board) { const { posingBoard: pb, answerBoard: _ab, ...b0 } = s.stayOn.beat; move.scriptBeat = pb ? { ...b0, board: pb } : { ...s.stayOn.beat }; }
    else if (card) move.scriptBeat = card;
    else if (!move.scriptBeat && s.walk) { const cur = currentBeatRef(s, input.kit); if (cur?.board) move.scriptBeat = cur; }
  }
  // v4: a move that re-poses a live script card with no beat of its own (a hint, a repair) shows that card's own board (a
  // follow-up's then.board, a check's board), never the beat the walk last drew
  if (!move.scriptBeat && scriptOn() && s.activeItemId && p.item && p.item.id === s.activeItemId && isScriptCard(p.item)) {
    const own = cardBeatRef(s, input.kit, findItem(s, input.kit, s.activeItemId) ?? p.item);
    if (own?.board) move.scriptBeat = own;
  }
  // dc-r7-script-walk-v2 R1: the words this beat must say (brain/say.js holds her line to them; the next turn checks them)
  if (p.mustSay?.length) move.mustSay = [...p.mustSay];
  if (p.point) move.point = String(p.point);
  // v6 R3: the same beat or step again, smaller (brain/say.js never says it in the same words)
  if (p.smaller) move.smaller = true;
  // v6.1 R7/R8: the beat's or card's AUTHORED simpler (format 2.3), said instead of anything model-written
  if (p.simpler) move.simpler = String(p.simpler);
  if (p.stayCheckin) { move.checkinOk = true; move.stayCheckin = true; }
  // (Brain 044 T1: the greeting's simpler wording said on its own turn; the hook comes next)
  if (p.greetHelp) move.greetHelp = true;
  if (p.greetAsk) move.greetAsk = String(p.greetAsk);
  // v6.1 R9: a worked step's own turn (new teaching, no card) may end on a check-in, once per beat
  if (scriptOn() && move.kind === "worked_example" && move.rendered?.length && !item && /^worked:step\d+$/.test(String(move.scriptBeat?.beatId ?? "")) && checkinFor(s, move)) move.checkinOk = true;
  // v6.1 R8 (main, director9: "samajh nahi aaya" / "pata nahi" got a real smaller re-explanation 16 times in 58): on a live
  // scripted card, a don't-know or a "didn't understand" gets the card's AUTHORED simpler (a one-step hint, never its key)
  // v6.3 H1′ (main, director11: escalate, never repeat): a miss on a live scripted card climbs one rung per miss — miss 1 the card's
  // authored simpler, miss 2 its remediation's say (then that say's simpler), and the card's own answer with its why at the give-up
  // (miss 3, code's gave) — and no helper line is said twice on one card. Only the LIVE card's simpler, and only once it has been
  // posed: a card posed on this very turn gets none (director11 c5-t02 stuck T49, c6 stuck T42: the next card's simpler said
  // before that card was even asked).
  // v6.5 B1 (main, director13 c5-t02 offtopic 4 and 34: a free reteach between cards gave away the worked step's key and asked a
  // question no card had): in a scripted lesson, a move with no card and no beat is the walk's own beat — its authored simpler, on its
  // board (a language or clarify request says it again, in their language: brain/say.js)
  if (scriptOn() && scriptIdOf(input.kit) && !move.scriptBeat && !s.activeItemId && ["reteach", "explain", "hint", "repair", "practice"].includes(move.kind)
    && Array.isArray(s.walk?.beats) && Number.isInteger(s.walk.i)) {
    const sk = skillScriptOf(input.kit, s.walk.skillId);
    const lang = s.ctx?.lang ?? "hinglish";
    // (v6.8 B1‴: only a beat already taught — before the walk's place, or the beat her last turns said — never one not yet reached)
    const recentT = (prev.recent ?? []).filter((t) => t.who === "teacher").map((t) => normLine(t.text ?? "")).join(" ");
    for (let k = Math.min(s.walk.i, s.walk.beats.length - 1); k >= 0 && sk; k--) {
      const m = /^explain:(.+)$/.exec(String(s.walk.beats[k] ?? ""));
      const b = m ? sk.explain?.find((x) => x.id === m[1]) : null;
      const pt0 = b ? saidIn0(b.point, lang) : null;
      if (b && k >= s.walk.i && !scriptFor(input.kit)?.script?.recordedRun && prev.lastMove?.scriptBeat?.beatId !== b.id && !(pt0 && recentT.includes(normLine(pt0).slice(0, 40)))) continue;
      const said = b ? saidIn0(b.simpler, lang) ?? saidIn0(b.point, lang) : null;
      if (!said) continue;
      move.simpler = String(said).trim();
      move.scriptBeat = { scriptId: scriptIdOf(input.kit), skillId: s.walk.skillId, beatId: b.id, kind: "explain", ...(b.board ? { board: b.board } : {}) };
      move.beatless = true;
      break;
    }
  }
  // (dc-r8-director25 H4: which help a live card gets — its ladder's first unsaid wording, or its key — is help's decision (state.js
  // helpBefore/helpAfter); v6.3 H1′'s rung ladder by miss count and the said-helper replacement after it are gone. What stays here is
  // the count of misses on the card, which the wrap's sentence about the child reads (rightLog))
  if (scriptOn() && item && isScriptCard(item) && item.id === prev.activeItemId) {
    const gaveUp = GIVE_UP_WORDS.test(String(input.text ?? "")) && !SAYS_CLARIFY.test(String(input.text ?? ""));
    if (verdict(input.cls) === "wrong" || (gaveUp && prev?.lastUi?.ask?.itemId === item.id && prev?.cardUnsaid !== item.id)) {
      const help = s.cardHelp?.id === item.id ? s.cardHelp : { id: item.id, misses: 0 };
      s.cardHelp = { ...help, misses: (help.misses ?? 0) + 1 };
    }
  }
  if (p.probeAck) move.probeAck = true;
  if (p.sayFirst?.length) move.sayFirst = p.sayFirst.map(String);
  // (dc-r8-director20 L3: "samajh nahi aaya" or "pata nahi" to the greeting — the script's greetSimpler says what today is about in
  // plainer words, then the hook)
  if (scriptOn() && !scriptFor(input.kit)?.script?.recordedRun && (move.kind === "hook" || move.hookSaid) && !move.greetHelp && greetSimplerDue(prev?.lastMove, input)) {
    const g = scriptFor(input.kit)?.script?.greetSimpler;
    const gs = g ? saidIn(g, s.ctx?.lang ?? "hinglish") : null;
    if (gs && String(gs).trim()) move.sayFirst = [String(gs).trim(), ...(move.sayFirst ?? [])];
  }
  // (dc-r8-director25 H4: a Hindi request's wording, and a give-up's at a point's check-in, are help's decision — the L4 and L1 blocks here
  // are gone)
  // P1 (dc-r8-director20): the authored parts a return's turn held back (brain/say.js guard.bodyHeld) are said first now
  if (prev?.bodyUnsaid?.length && !["safeguard", "wrap", "break"].includes(move.kind)) { move.sayFirst = [...prev.bodyUnsaid.map(String), ...(move.sayFirst ?? [])]; move.heldSaid = prev.bodyUnsaid.map(String);
    // (O1/O2, main on director21: the held part is said on its own board — the beat of the turn that held it — never on the next part's)
    if (prev.lastMove?.scriptBeat?.board) move.heldBeat = { ...prev.lastMove.scriptBeat }; }
  // v6.10 T2 (main on director18 c5-t02 stuck 50, offtopic 10, c6 offtopic 10: after the aside reply the card was posed bare and its
  // point was never said): after an aside reply the walk resumes at the unit's next unsaid part — the card's point when no recent turn
  // of hers said it, then the card
  if (scriptOn() && !scriptFor(input.kit)?.script?.recordedRun && (input.cls?.cardUnsaid || input.cls?.asideReply) && s.activeItemId && !move.point && !move.rendered?.length) {
    const it = findItem(s, input.kit, s.activeItemId);
    const bid = it?.scriptAsk?.beatId;
    const b = bid && bid !== "worked" ? skillScriptOf(input.kit, it.skillId)?.explain?.find((x) => x.id === bid) : null;
    const pt = b ? saidIn(b.point, s.ctx?.lang ?? "hinglish") : null;
    const recentT = (s.recent ?? []).filter((t) => t.who === "teacher").slice(-6).map((t) => normLine(t.text ?? ""));
    // (dc-r8-director23 R2: her reply to the child's answer goes on from where the lesson stood — a card posed earlier in the lesson had
    // its point said then, however long ago; it is not said again because of the aside)
    const posedEarlier = s.posedAt?.[s.activeItemId] != null && s.posedAt[s.activeItemId] < (s.turn ?? 0);
    if (pt && !posedEarlier && !recentT.some((y) => y.includes(normLine(pt).slice(0, 50))) && !(move.sayFirst ?? []).some((y) => normLine(y).includes(normLine(pt).slice(0, 50)))) { move.sayFirst = [...(move.sayFirst ?? []), String(pt).trim()]; move.resumed = bid; }
  }
  // v6: which of them is the skill's bridge (its own segment; brain/propose.js)
  if (p.bridgeSaid) move.bridgeSaid = String(p.bridgeSaid);
  if (p.bridgeBeat?.board) move.bridgeBeat = { ...p.bridgeBeat };
  // v4 W1: the live script card's own authored line (its explain beat's point; a follow-up's remediation say), which code says
  // when a guard would otherwise leave her turn as the bare card
  {
    const live = s.activeItemId ? findItem(s, input.kit, s.activeItemId) : null;
    const cp = live ? withoutClosedKeys(cardPointOf(s, input.kit, live), s, input.kit, live) : null;
    if (cp) move.cardPoint = cp;
    // v6.3 T1′ (main, director11 c5-t02 stuck T15, offtopic T11: "Yaad karo: … 1/8 zero ke paas hai, aur 1/4 usse aage. Toh 1/8 <
    // 1/4." on e3's card, e2's answer said again): a reminder or a simpler said on a card never restates a closed card's answer
    // (v6.4 P2: a remediation's words are said whole — never cut to a fragment; a sentence that would restate a closed card's key
    // only leaves a recap or a beat's simpler, whole sentences at a time)
    // (main's order 1, dc-r8-director20 G3: an authored part is said whole — a simpler is the card's own help, written by Learning for
    // this card, and is never cut to its sentences without a closed key: c5-t01 e3's simpler lost "8 gaps hue toh pehla mark 1/8 ekdum
    // 0 ke paas aa gaya." to e2's key 1/8 and was said half)
    // director7 cause 2 (main: option a): a turn whose board is not the live card's own board (a remediation's say on its board,
    // then its then-card on then.board) switches to the card's board where the card starts (brain/propose.js: intent.cardBoard,
    // the clause index; Studio stages the change there)
    const own = live && (live.scriptAsk || live.scriptCheck || live.scriptThen) ? cardBeatRef(s, input.kit, live) : null;
    if (own?.board) move.cardBeat = own;
  }
  // v4 / K2 (giving up says the answer): a live script card this step left (skipped: the unclear or don't-know cap, a park)
  // has its key said by code, whichever path left it, unless the move already says one
  {
    const was = prev.activeItemId && String(prev.activeItemId).startsWith("script:") ? prev.activeItemId : null;
    // (v6.4 T1″, director12 c4 steering 28, c6 offtopic 36: a card graded right whose why-probe was answered was closed by its
    // verdict already — the probe reply never says "Pichhle sawaal ka jawab" for it again)
    const closedByVerdict = !!prev.pendingWhy && prev.pendingWhy === was;
    if (was && !closedByVerdict && !move.gave && move.kind !== "safeguard" && move.scriptBeat?.kind !== "remediation" && s.skipped.includes(was) && !(prev.skipped ?? []).includes(was)) {
      const left = findItem(prev, input.kit, was);
      if (left) move.gave = { answer: keyInLang(left, s.ctx.lang), why: scriptWhyOf(input.kit, left, s.ctx.lang) ?? "" };
    }
  }
  // v4 W6: a parked topic served this turn rides on the move, so the reply keeps (or says) its return
  // v6 R4 (main: "'turant baad' means the next turn"): in a scripted lesson an aside parked on the last turn is returned to on
  // this one, whatever the move (never on a safeguard, a wrap or a break)
  // v6.2 H2 (main, director10: c5-t02 5 of 6 returns early, mid-card): the promise is "after this part": an aside parked while a
  // card was live is returned to once that card is resolved (answered, let go, or another card up), never while it is still live
  // v6.3 H2′ (main, director11: 1 of 24): the promise is "after this question". The promised card is the one on the table when they
  // spoke, else the one posed on that turn, else the next one posed (the aside read runs before this turn's card is activated, so
  // v6.2 recorded none and returned on the very next turn). It is returned to only once a park was said, only after that card is
  // closed, and only at a boundary: never while a card is still live from before (a hint, a retry), never over a remediation's
  // follow-up (another id, but the same card not yet closed), never inside a worked example, never on a request turn (a language
  // switch, a picture: that turn answers the request). An unreturned one waits for the wrap.
  if (scriptOn() && scriptIdOf(input.kit)) {
    for (const e of s.later ?? []) {
      if (!e.share || e.servedAt != null) continue;
      if (e.at === s.turn && e.onItem === undefined) {
        e.onItem = prev.activeItemId ?? s.activeItemId ?? null;
        e.parkSaid = move.kind !== "safeguard";
        e.said ??= String(input.text ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
      } else if (e.onItem === undefined && e.at < s.turn) {
        // (P1, dc-r8-director20: c5-t02 stuck 34 / offtopic 28 — a park on a turn whose path skips this block, a worked example's
        // split, was never stamped and so never came due: it is stamped on the next turn that reaches here)
        e.onItem = s.activeItemId ?? null; e.parkSaid = true;
      } else if (e.onItem === null && e.at < s.turn && s.activeItemId) e.onItem = s.activeItemId;
    }
  }
  // (v6.5 A1, main on director13 c5-t01 stuck 34 → never, c6 steady 36 → 82: an aside not yet returned comes back at a break or a
  // stop at the latest — the child leaving or resting is the last boundary there is)
  if (scriptOn() && scriptIdOf(input.kit) && !s.servedNow && !["safeguard", "wrap"].includes(move.kind)) {
    const live = s.activeItemId ?? null;
    const boundary = move.kind === "break" || !(live && live === prev.activeItemId) && !String(live ?? "").includes(":then:") && !s.splitHold
      // (v6.4 H2″, director12 c5-t02 steering 23→40: the worked example's opening is a boundary, its steps and card are not)
      // (dc-r8-director26 C1: the problem said with its first step is the opening too)
      && (!/^worked(?::step|$)/.test(move.scriptBeat?.beatId ?? "") || !!move.problemLines) && move.scriptBeat?.kind !== "remediation" && !move.request && !input.cls?.request?.type
      // (v6.5 F1, main on director13 c6 offtopic 40: no aside return beside a wrong verdict — it waits for the next boundary)
      // (dc-r8-director27, dry c5-t02 offtopic 24: an overdue park comes due at a key that closes the card after a wrong answer — the key ends
      // its turn and the return is said alone on the next, returnApart; one card's long help kept the boundary away for 13 turns)
      && !(prev.activeItemId && ["incorrect", "misconception"].includes(String(input.cls?.outcome ?? "")))
      // (v6.9 T1, director17 c5-t01 steady 42: asked to go on, the walk moves on first; the aside waits for the next boundary)
      && !(GO_ON.test(String(input.text ?? "")) && responseShape("move_on", "aside_pending") === "move_on");
    const due = boundary ? (s.later ?? []).find((e) => !e.servedAt && e.share && e.parkSaid && e.onItem && Number.isFinite(e.at) && s.turn > e.at
      && (live !== e.onItem || move.kind === "break" || parkOverdue(s, e))) : null;
    if (due) { s.later = serveLater(s.later, due.id, s.turn); s.servedNow = { topic: due.topic, share: !!due.share, said: due.said ?? null }; }
  }
  // v6.6 A2: the child asked her taste this turn: brain/say.js answers it now (the n-th time this lesson: a short form after the first)
  if (s.tasteAsked?.turn === s.turn && move.kind !== "safeguard") move.tasteAsked = { topic: s.tasteAsked.topic, n: s.tasteAsked.n };
  if (s.sadAside?.turn === s.turn && move.kind !== "safeguard" && !move.tasteAsked) move.sadAside = true;
  if (s.asideAgain?.turn === s.turn && move.kind !== "safeguard" && !move.tasteAsked) move.asideAgain = { topic: s.asideAgain.topic, ...(s.asideAgain.returned ? { returned: true } : {}) };
  if (s.servedNow?.topic) {
    const lang = s.ctx.lang ?? "hinglish";
    const said = s.servedNow.said ?? (s.later ?? []).find((e) => e.servedAt === s.turn && e.topic === s.servedNow.topic)?.said ?? null;
    // v6.4 H2″ (main, director12: "…yeh sunke bahut achha laga" on every return; "aapko Virat pasand hai?" never answered): the return
    // is HER one line answering what they said, held to a predicate in brain/say.js (returnLineOk); code carries their words only
    move.returned = { topic: s.servedNow.topic, share: !!s.servedNow.share, ...(said ? { said: String(said) } : {}) };
  }
  // (v6, director9: a request turn — "samajh nahi aaya", "picture dikhao" — answers the request; a missed card's close waits for
  // the next turn instead of making that turn too long)
  if (s.pendingClose && s.activeItemId !== s.pendingClose.thenId && move.kind !== "safeguard" && !(p.request && scriptOn())) {
    move.closed = { answer: s.pendingClose.answer, ...(s.pendingClose.why ? { why: s.pendingClose.why } : {}) };
    if (s.pendingClose.beat?.board) move.closedBeat = s.pendingClose.beat;
    s.pendingClose = undefined;
  }
  // v5 B1: a closure (a give-up reveal, "Toh poora jawab", a missed card's close) is spoken over the board it closes: the board
  // the last turn ended on (its card's own board, else its beat's), before the switch to this turn's boards
  // v6 R1: and a verdict on the answer they just gave (with its reason) is said over the same board, so it rides on every
  // scripted move (brain/propose.js uses it only for a line that has such a part: brain/say.js guard.parts.prev)
  if (scriptOn()) {
    const end = prev?.lastMove?.cardBeat ?? prev?.lastMove?.scriptBeat ?? null;
    if (end?.board) move.closeBeat = end;
    // v2.3 (director9 item 4): the card just answered right, or let go, shows its authored answer-state board over its close
    const was = prev?.activeItemId ? findItem(prev, input.kit, prev.activeItemId) ?? null : null;
    const ab = answerBoardOf(was);
    if (ab && (move.gave || input.cls?.outcome === "correct")) { const cb0 = end ?? cardBeatRef(prev, input.kit, was) ?? {}; move.closeBeat = { ...cb0, board: ab, answerBoard: true, ...(cb0.board && JSON.stringify(cb0.board) !== JSON.stringify(ab) ? { posingBoard: cb0.board } : {}) }; }
  }
  s.lastMove = move;
  s.moveVoiced = false;
  if (s.persona) {
    s.vibe = personaKnobs(s.persona, { reteach: move.kind === "reteach", strained: frustrationLoop(s.affect),
      transferProbe: s.pendingProbe?.facet === "T", turnsSinceError: s.turnsSinceError });
  }
  // A reaction keeps the step's content (e.g. the worked example the teacher is in the middle of) and the
  // activity on screen.
  if (!reacting || p.content) s.lastContent = p.content ?? [];
  // stream 2 R2 root cause: planModule reads move.visual (modules.js interactiveDefault), so it is set BEFORE planModule
  if (p.visual) move.visual = p.visual;
  const moduleCommands = reacting ? [] : planModule(s, { kit: input.kit, item, move, lang: s.ctx.lang, band: s.probeSess?.band ?? bandOf(s.ctx.classLevel), representation: p.representation });
  // (dc-r8-director25 H4: v6.6 B1′'s re-say of the live beat on a language or clarify request is help's decision now — gone from here)
  // The child's request this move answers (requests.js): the brain reads it (a visual request asks Studio on any lane).
  if (p.request) move.request = p.request;
  // (v6.11 G2: how many times each joint kind has been said this lesson — brain/say.js rotates the authored forms by it)
  if (p.request === "language") s.langN = (s.langN ?? 0) + 1;
  if (["ask_again", "unheard"].includes(p.request)) s.askAgainN = (s.askAgainN ?? 0) + 1;
  // (v6.9 A5: the acknowledgement only for a reply about the aside her last turn asked — turn.js planTurn reads it)
  if (input.cls?.asideReply) move.asideAck = true;
  if (input.cls?.asideReply && s.returnAnswer) move.returnReply = s.returnAnswer;
  // r12 RCA failure 4: the board the child asked to clear (brain/turn.js retires the Studio board and unmounts a rung)
  if (p.clear) move.clear = p.clear;
  // (O5, main on director21 c6 steady 114–120, c4 128–132, c5-t01 140–144, c5-t02 138–142: the teach-back and the wrap were said over
  // the last unit's board — a turn with no unit clears it; Studio's clearBoard runs in brain/turn.js on move.clear)
  if (scriptOn() && scriptIdOf(input.kit) && ["teachback", "wrap"].includes(move.kind) && !move.scriptBeat?.board && !p.holdBoard) move.clear = "board";
  // round 2 safety floor: a stop check-in ("stop") or the relational goodbye check-in ("rel") — brain/say.js guards its
  // words as an offer to stop, never as a teaching turn that "goes on" (adversarial B2)
  if (p.checkin) move.checkin = p.checkin;
  // 14.4 (main safety review): the tiered safeguard. A check-in (no helplines, no Help sheet, no incident) and the escalation
  // out of one (brain/turn.js writes its incident; brain/say.js, compile.js and the client read the tier)
  if (p.tier) move.tier = p.tier;
  if (p.escalated) move.escalated = true;
  // 14.4.3: a model re-read restarted a predicate / sure episode (compile.js ends it on its one new question)
  if (p.sameStory) move.sameStory = true;
  if (!input.branch && s.setAside === s.turn && p.kind !== "safeguard") move.setAside = true;
  if (!input.branch) delete s.setAside;
  // round 4 (session-first): the intake's move (no stage build) and, for the confirm probe, the kit question it poses
  delete s.servedNow;
  if (p.intake) { move.intake = true; if (p.ask) move.ask = String(p.ask).slice(0, 300); if (p.segment) move.segment = p.segment; }
  // round 2 (conversation): the request's own note, for the lead slot's last instruction (brain/say.js)
  if (p.lead && p5Flag("STEER")) move.lead = String(p.lead).slice(0, 400);
  // ... and a served return rides on the lead too: a first pose is written by the LEAD SLOT (brain/say.js leadSlotNote), whose
  // last note carries move.lead, not the compile's last section (merged-tree round3-conversation C: the share was served with
  // its must-note on a first pose, and the bridge went straight to the new question)
  if (backLead && p5Flag("STEER")) move.lead = [backLead, move.lead].filter(Boolean).join("; ").slice(0, 400);
  if (p.visual) {
    move.visual = p.visual;
    // round 5 (stream 2): what they asked to see (brain/propose.js whiteboardIntentOf puts it on the board's ask)
    if (p.see) move.see = p.see;
    // what is on the stage decides the words: point at it, or (nothing mounted) show it with things they know — never a
    // text drawing, never "I can't draw", never "you draw it" (F16, the owner's session). round 5 (stream 2): a thing they
    // NAMED (a subject, a number line, a photo) is drawn for this ask, so the piece mounted before it is not "it": her words
    // say what it shows and never send their eyes to the screen ahead of it (open-r13-bare-pointing-on-request-turns)
    const named = !!(p.see && (p.see.subject || p.see.show === "number_line" || p.see.show === "picture"));
    move.shape = join(move.shape, named ? SH.visualDrawing(p.see) : s.module?.id ? SH.VISUAL_ON_STAGE : SH.VISUAL_NOT_YET);
    s.lastMove = move;
  }
  const ui = uiFor(s, p, move, item, input.kit);
  // round 7 A7: the Later list on the screen and the turn's conversational moment (director/later.js)
  const laterRows = laterUi(s.later, { turn: s.turn, wrapping: move.kind === "wrap", itemOnTable: !!ui.ask });
  if (laterRows) ui.later = laterRows;
  const moment = input.event === "turn" ? momentOf(prev.later, s.later, move, { turn: s.turn }) : null;
  if (moment) ui.moment = moment;
  // (v6.10, main's ruling with Learning's script-card evidence: a script card answered right in this lesson — with help or without — is
  // never posed again in this lesson, whatever her belief; verifying an assisted right answer is a later lesson's delayed check)
  if (input?.event === "turn" && input.cls?.outcome === "correct" && prev?.activeItemId && String(prev.activeItemId).startsWith("script:")) s.rightCards = [...new Set([...(s.rightCards ?? []), prev.activeItemId])];
  if (ui?.ask?.itemId && (s.rightCards ?? []).includes(ui.ask.itemId) && s.posedAt?.[ui.ask.itemId] != null && s.posedAt[ui.ask.itemId] < s.turn && !s.lastMove?.request) s.rightRepose = (s.rightRepose ?? 0) + 1;
  // (v6.10: the turn each card was first posed on — a later pose of the same card is a re-pose, framed as one, whatever the history says)
  s.lastUi = ui; // what a hold re-sends (chips are momentary on the client: absent would clear them)
  // the card pins (capPlan): how many teacher turns in a row (turns with no question on the card do not break the run)
  // have pinned this question
  // round 7 (main's hybrid-pilot judgement #7): a turn spent on the child's OWN ask to have it again another way ("ek aur example
  // do", read in code) is not a try on the card: it never brings the card cap closer, so they get a fresh try after it
  const ownAsk = RE_PRESENT.has(move.request) && input.cls?.request?.src !== "note";
  if (!input.branch && ui.ask?.itemId && !(ownAsk && s.pinItem === ui.ask.itemId)) {
    if (s.pinItem === ui.ask.itemId) s.pinRun = (s.pinRun ?? 0) + 1;
    else { s.pinItem = ui.ask.itemId; s.pinRun = 1; }
  }
  // The move as a kernel proposal (proposal.js, W2-C #8): returned beside the move, never stored in the state.
  const proposal = directorProposal(move, { stopping: p.stopping, ui, guidance: s.guidance, purpose: s.purpose });
  let outF = splitLong({ state: s, move, moduleCommands, ui, end: s.phase === "done", proposal, ...describe(s, input.kit) }, input);
  // v6.11 G2 (main on director19 c4 steering 6, stuck 22, c5-t01 steering 6, 12, stuck 48, offtopic 36, c5-t02 stuck 24): "samajh nahi
  // aaya" at a check-in is answered by the re-said teaching, ending on its check-in — the card waits for the next turn
  // (only when the turn re-says something: with nothing left to re-say, the card itself comes)
  if (input.cls?.request?.src === "checkin_point" && outF.ui?.ask && !outF.move?.splitTeach && !outF.end && (outF.move?.simpler || outF.move?.point || outF.move?.rendered?.length) && !prev?.lastMove?.smaller) outF = holdCardForCheckin(outF);
  return outF;
}

/**
 * v6 R5 (main, director8: 22 c6 turns over 60 words, up to 112; "the cap is enforced by splitting into turns, not by
 * truncation"): a scripted move that closes the last card (a verdict's give-up, a missed card's close, the worked answer, a
 * bridge, a return) AND opens new teaching, too long for one turn by its authored words, is said as two turns: the closures
 * now, ending on a short "shall we go on?", with no card live (nothing they say to it is graded); the new beat and its card,
 * whole and unchanged, on the next turn (step: s.splitHold). TAXILA_R7_SPLIT=off: one turn, as before.
 */
export const splitOn = (env = process.env) => !/^(off|0|false)$/i.test(String(env.TAXILA_R7_SPLIT ?? ""));
const wordsIn = (...xs) => xs.flat().filter(Boolean).map(String).join(" ").split(/\s+/).filter(Boolean).length;
/** v6.11 G2: a clarify at a check-in — the turn is the re-said teaching and a check-in; its card is held for the next turn. */
function holdCardForCheckin(out) {
  const { state: s, move, ui } = out;
  const teach = { ...move, splitTeach: true, checkinOk: true };
  const held = { kind: "practice", shape: SH.splitCard(), itemId: move.itemId, skillId: move.skillId, hintLevel: move.hintLevel,
    ...(move.cardBeat ?? move.scriptBeat ? { scriptBeat: move.cardBeat ?? move.scriptBeat } : {}), ...(move.cardBeat ? { cardBeat: move.cardBeat } : {}),
    ...(move.probe ? { probe: move.probe } : {}), ...(move.format ? { format: move.format } : {}) };
  s.splitHold = { move: held, ui, activeItemId: s.activeItemId ?? null, lastContent: s.lastContent ?? [], moduleCommands: [], teach: true };
  s.activeItemId = undefined;
  s.lastMove = teach;
  const teachUi = { status: "your_turn", ...(ui?.later ? { later: ui.later } : {}), ...(ui?.moment ? { moment: ui.moment } : {}) };
  s.lastUi = teachUi;
  return { ...out, state: s, move: teach, ui: teachUi, proposal: directorProposal(teach, { ui: teachUi, guidance: s.guidance, purpose: s.purpose }) };
}
// ───────────── dc-r8-director27, Brain 042 Q1: a quick question where a card waits ─────────────
// Where a point is said and its card does not fit in the turn, the turn ends on the point's quick question (`explain[].quick.prompt`), not
// on a check-in. It is said over the point's board and never moves it. The child's answer is read against `quick.key` and `accept` by the
// card's reader (the item is pinned as the state's quickItem); a right answer gets a short yes from the verdict forms and the card, anything
// else that is an answer or a give-up gets `quick.say` and the card — no hint, no remediation, no second try, no miss verdict. A request on
// it is handled as on its point (helpPartOf), and the walk then goes to the card. It is not a card: no verdict, no card evidence.
/** The quick question of the explain beat a scriptBeat names, or null. */
function quickOfBeat(kit, sb) {
  if (sb?.kind !== "explain" || !sb.skillId) return null;
  const b = skillScriptOf(kit, sb.skillId)?.explain?.find((x) => x.id === sb.beatId);
  const q = b?.quick;
  return q && q.prompt && q.key != null && String(q.key).trim() ? { beat: b, quick: q } : null;
}
/** The teaching half of a point split from its card, with the point's quick question where it has one and it fits (else as it was). */
function quickTeach(out, input, teach, closeWords = 0) {
  const { state: s, move } = out;
  if (!scriptOn() || scriptFor(input.kit)?.script?.recordedRun || input?.event !== "turn") return teach;
  // (an explain beat's point, or its point held by her AI line or a return and said first now, with the card held after it)
  if (!(move.kind === "explain" || (move.heldSaid?.length && move.scriptBeat?.kind === "explain")) || move.smaller || move.simpler || move.help || move.splitClose || !move.point) return teach;
  const sb = move.scriptBeat;
  const qb = quickOfBeat(input.kit, sb);
  if (!qb || String(move.itemId ?? "") !== `script:${sb.skillId}:ask:${sb.beatId}`) return teach;
  const lang = s.ctx?.lang ?? "hinglish";
  // (only after the beat's own point — said now, or held by her AI line and said first now: a part said in its place is not what the quick
  // question asks about)
  const bp = normLine(saidIn(qb.beat.point, lang));
  if (!bp || !normLine(move.point).includes(bp)) return teach;
  const prompt = String(saidIn(qb.quick.prompt, lang) ?? "").replace(/\s+/g, " ").trim();
  if (!prompt) return teach;
  // (the turn's parts before the card, and the quick question in the check-in's place: within 75 words, else the check-in as before)
  const p0 = partsOfTurn(out, closeWords, input?.helpLeadWords ?? 0).filter((p) => p.k !== "card");
  // (a point held and said first now stands in the body too — counted once)
  const twice = (move.sayFirst ?? []).length && normLine((move.sayFirst ?? []).join(" ")) === normLine(move.point) ? p0.find((p) => p.k === "body")?.n ?? 0 : 0;
  const before = p0.reduce((a, p) => a + p.n, 0) - twice;
  if (before + wordsIn(prompt) > L2_CAP) return { ...teach, quickNoRoom: true };
  const item = friendly(scriptQuickItem(sb.skillId, sb.beatId, qb.quick));
  const { checkinOk: _c, ...rest } = teach;
  return { ...rest, quick: { skillId: sb.skillId, beatId: sb.beatId, prompt: fillFriend(prompt, friendOf), item } };
}
/** The child's line on a quick question: the short yes (right) or `quick.say`, then the held card, in one turn. null: a request or an aside
 *  (help on the point, or the walk, answers it — and the card comes after). */
function quickAnswer(prev, input, h) {
  const q = prev.lastMove?.quick;
  if (!q || !h?.teach || !scriptOn()) return null;
  const c = input.cls ?? {};
  const text = String(input.text ?? "");
  const answered = ["correct", "incorrect", "partial", "misconception"].includes(c.outcome);
  const col = columnName(input, prev);
  // (Brain 043 R3: a second repeat — the quick question was said again once — gets `say`, then the card)
  const again = col === "repeat" && !answered && !!prev.lastMove?.quickAgain;
  if (!answered && col !== "give_up" && !again && (c.request || c.help || c.asideReply || ["clarify", "hindi", "picture", "repeat", "aside", "try_first", "move_on"].includes(col))) return null;
  const right = !again && c.outcome === "correct";
  const lang = prev.ctx?.lang ?? "hinglish";
  const qb = quickOfBeat(input.kit, { kind: "explain", skillId: q.skillId, beatId: q.beatId });
  const say = right ? null : fillFriend(String(saidIn(qb?.quick?.say, lang) ?? "").replace(/\s+/g, " ").trim(), friendOf);
  const s = structuredClone(prev);
  s.turn += 1;
  s.splitHold = undefined;
  const m = { ...h.move, quickReply: { skillId: q.skillId, beatId: q.beatId, right, ...(say ? { say } : {}) } };
  // (the answer is recorded on the beat as its own kind of evidence — never a card's verdict, never the learner model's card evidence)
  s.beatEvidence = [...(s.beatEvidence ?? []), { kind: "quick", skillId: q.skillId, beatId: q.beatId, said: text.replace(/\s+/g, " ").trim().slice(0, 80), right, read: c.outcome ?? null, turn: s.turn }].slice(-60);
  s.lastMove = m; s.moveVoiced = false; s.lastUi = h.ui; s.lastContent = h.lastContent; s.activeItemId = h.activeItemId ?? undefined; s.quickItem = undefined;
  return { state: s, move: m, moduleCommands: h.moduleCommands ?? [], ui: h.ui, end: false, proposal: directorProposal(m, { ui: h.ui, guidance: s.guidance, purpose: s.purpose }), ...describe(s, input.kit) };
}
/** dc-r8-director27 Brain 043 R3 (c4 steady 38 to 40: "phir se bolo" to the quick question got the card, nothing said to the child): a repeat
 *  at a quick question gets the quick prompt again, once, over the point's board — the card stays held and the child's next line is read
 *  against the quick question's key as before; a second repeat gets `say` and then the card (quickAnswer). null otherwise. */
function quickAgain(prev, input, h) {
  const q = prev.lastMove?.quick;
  if (!q?.prompt || !h?.teach || !scriptOn() || prev.lastMove?.quickAgain) return null;
  const c = input.cls ?? {};
  if (["correct", "incorrect", "partial", "misconception"].includes(c.outcome) || columnName(input, prev) !== "repeat") return null;
  const qb = quickOfBeat(input.kit, { kind: "explain", skillId: q.skillId, beatId: q.beatId });
  if (!qb) return null;
  const s = structuredClone(prev);
  s.turn += 1;
  // (the quick question is on the table again: step() let it go before reading this line)
  friendOf = s.ctx?.firstName ?? "";
  const qi = friendly(scriptQuickItem(q.skillId, q.beatId, qb.quick));
  s.quickItem = qi; s.activeItemId = qi.id;
  const lm = prev.lastMove;
  const m = { kind: "explain", shape: lm.shape, splitTeach: true, quickAgain: true, request: "repeat", quick: { ...q }, skillId: lm.skillId,
    ...(lm.scriptBeat ? { scriptBeat: lm.scriptBeat } : {}), ...(lm.methods ? { methods: lm.methods } : {}), ...(lm.prefs ? { prefs: lm.prefs } : {}) };
  s.lastMove = m; s.moveVoiced = false;
  const ui = { status: "your_turn", ...(prev.lastUi?.later ? { later: prev.lastUi.later } : {}) };
  s.lastUi = ui;
  return { state: s, move: m, moduleCommands: [], ui, end: false, proposal: directorProposal(m, { ui, guidance: s.guidance, purpose: s.purpose }), ...describe(s, input.kit) };
}
/** v6.11 G2: can Studio draw a switch from one board to another inside one turn (its own heldBoard, on a line long enough to hold both)? */
function switchFits(from, to) {
  try {
    if (!from?.template || !to?.template || JSON.stringify(from) === JSON.stringify(to)) return true;
    const text = `${"a ".repeat(60)}${"b ".repeat(60)}`;
    const r = studioHeldBoard({ intent: { kind: "whiteboard", held: { board: from, unit: "from", switchTo: { board: to, unit: "to", atChar: 120 } }, style: { band: "B3", lang: "hinglish" } }, line: { text } }, {});
    return !r || (r.screens?.length ?? 1) >= 2;
  } catch { return true; }
}
/** Brain 044 T1: can Studio draw these boards one after another in one turn (its own heldBoard: the first up, each next a switch)? */
function switchesFit(boards) {
  try {
    const bs = boards.filter((b) => b?.template).filter((b, k, a) => k === 0 || JSON.stringify(b) !== JSON.stringify(a[k - 1]));
    if (bs.length < 3) return bs.length < 2 || switchFits(bs[0], bs[1]);
    const text = bs.map((_, k) => `${"abcdefgh"[k]} `.repeat(50)).join("");
    const sws = bs.slice(1).map((b, k) => ({ board: b, unit: `u${k + 1}`, atChar: (k + 1) * 100 }));
    const r = studioHeldBoard({ intent: { kind: "whiteboard", held: { board: bs[0], unit: "u0", switchTo: sws.at(-1), switches: sws }, style: { band: "B3", lang: "hinglish" } }, line: { text } }, {});
    return !r || (r.screens?.length ?? 1) >= bs.length;
  } catch { return true; }
}
// ───────────── dc-r8-director27 Brain 043 R1: a right answer goes on ─────────────
// A right verdict's why and what the walk adds next that do not fit in one turn, where the verdict with the card's `whyShort` and the same
// do: the short form is said in the why's place (the move carries whyShort; brain/turn.js puts it in lastGraded.why, which brain/say.js
// says after the verdict as it says a why). Where both fit, or neither, the turn is as before. Never after a key, a miss or a give-up.
/** The card a close closes (an explain card, a check, a remediation's follow-up card) — never the worked example's own card. */
function closeCardOf(kit, cb) {
  const sk = cb?.skillId ? skillScriptOf(kit, cb.skillId) : null;
  const b = String(cb?.beatId ?? "");
  if (!sk || !b || b === "worked" || b.startsWith("worked:") || b.startsWith("teachback")) return null;
  return b.startsWith("then:") ? sk.remediation?.find((r) => r.targets === b.slice(5))?.then ?? null : sk.checks?.find((c) => c.id === b) ?? sk.explain?.find((e) => e.id === b)?.ask ?? null;
}
/** The short why a right verdict on this turn may say, or null (not a right verdict on a card with a why and a shorter whyShort). */
function shortWhyFor(out, input) {
  const { state: s, move } = out;
  if (!scriptOn() || !l2On() || scriptFor(input.kit)?.script?.recordedRun || input?.event !== "turn" || input.branch) return null;
  if (input.cls?.outcome !== "correct" || !move?.closeBeat || move.gave || move.workedDone || move.closed) return null;
  const card = closeCardOf(input.kit, move.closeBeat);
  if (!card?.why || !card.whyShort || typeof card.whyShort !== "object") return null;
  const lang = s.ctx?.lang ?? "hinglish";
  const clean = (x) => String(saidIn(x, lang) ?? "").replace(/\s+/g, " ").trim().replace(/^(?:kyunki|because)\s+/i, "").replace(/[.!?\u0964]+$/, "");
  const short = clean(card.whyShort), long = clean(card.why);
  const wc = (t) => t.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  return short && wordsIn(short) < wordsIn(long) && wc(short) <= WHY_SHORT_MAX ? short : null;
}
const cloneOut = (out) => { try { return structuredClone(out); } catch { return null; } };
export function splitLong(out, input) {
  const short = shortWhyFor(out, input);
  const a0 = short ? cloneOut(out) : null, b0 = a0 ? cloneOut(out) : null;
  if (!a0 || !b0) return inviteBefore(splitLongOnce(out, input), out, input);
  const a = splitLongOnce(a0, input);
  // (the why and what comes next fit: as now)
  if (!a.state?.splitHold) return a;
  const b = splitLongOnce(b0, input, { shortWhy: short });
  // (the short form takes what comes next with the verdict: the whole turn, or the point ending on its quick question with the card next —
  // never a turn that would now end on a check-in somewhere else: c4 steady 82 on the first try, a verdict, the worked problem and its
  // step ending on "Yeh kadam samajh aaya?")
  if (b.state?.splitHold && !(a.move?.splitClose && !b.move?.splitClose && b.move?.quick)) return inviteBefore(a, out, input);
  b.move = { ...b.move, whyShort: true };
  b.state.lastMove = b.move;
  b.proposal = directorProposal(b.move, { ui: b.ui, guidance: b.state.guidance, purpose: b.state.purpose });
  return b;
}
function splitLongOnce(out, input, opt = {}) {
  const { state: s, move, ui } = out;
  if (!splitOn() || !scriptOn() || input.branch || input.event !== "turn" || out.end || out.hold) return out;
  // (director9: a repair after a right answer carried closures and a bridge, 128 words; only the split's own halves are exempt)
  // (v6.11 G2, main on director19 c4 offtopic 22, 32, c6 stuck 46, 50, c5-t02 stuck 50: "aage chalo" or a Hindi request that gives the key
  // stacked key, new point and new card — a give-up's turn ends on its key whatever request led to it)
  const gaveReq = !!move.gave?.answer && ["move_on", "language", "clarify", "skip"].includes(move.request);
  // (dc-r8-director25 L2: a request answered by moving on to the next point — "samajh nahi aaya" to a hook's check-in — brings new
  // teaching and its card like any turn: it breaks as any turn does)
  const freshReq = l2On() && !!move.request && !gaveReq && !!move.point && !move.simpler && !move.smaller && !!ui?.ask?.text && ["clarify", "another"].includes(move.request);
  if (freshReq && !scriptFor(input.kit)?.script?.recordedRun) return splitTeach(out, input, pointCardCap(s, input.kit), 0);
  if (["safeguard", "wrap", "break"].includes(move.kind) || move.splitClose || move.splitTeach || (move.request && !gaveReq) || move.checkin) return out;
  const closing = [move.gave?.answer, move.gave?.why, move.closed?.answer, move.closed?.why, move.workedDone?.answer, move.workedDone?.why, move.bridgeSaid, move.returned?.line];
  const teaching = [move.point, ...(move.rendered ?? []), ui?.ask?.text];
  if (!teaching.some(Boolean)) return out;
  // (dc-r8-director25, main's R1 on the merged tree: two limits. L2's 75 is for a turn of parts — breakL2; a new point and its card are
  // never said in one turn over 60 words (45 where plainWords is set) — dc-r8-director24 L, longPointCard — whatever else the turn holds)
  const cap = pointCardCap(s, input.kit);
  // v6.1 (main's split policy B, on director9: 45 split turns slowed skill 1 to 66 turns): closures never cause a split on
  // their own; they stay in the beat's turn (brain/say.js trims her own words first). Only authored teaching plus its card
  // that still do not fit is split. TAXILA_R7_SPLIT_CLOSE=on brings back the closing split.
  // v6.2 T3 (main, director10: c6's bridge turns ran 121-132 words): a turn ends after a bridge; the new skill's first point and
  // its card come on the next turn (the closing split, whatever the split policy)
  const bridgeTurn = !!move.bridgeSaid;
  // v6.10 R7 (main on director18 c5-t01 stuck 60, c5-t02 steady 48, c6 steering 22: key, new point and new card stacked in one turn of
  // 80-100 words): after a give-up the turn is the key and its why, then a check-in; the next point comes on the next turn
  // (a replay of a recorded run walks what that run walked: tests/fixtures/replay.mjs runScriptOf marks it recordedRun)
  // (dc-r8-director20, main's item 7: a key is followed by a check-in, never by the next card — after a miss or a give-up too, and when
  // the next card comes without a point of its own)
  const gaveTurn = !!move.gave?.answer && !!(move.point || move.rendered?.length || (ui?.ask?.text && String(ui.ask.itemId ?? "").startsWith("script:"))) && !scriptFor(input.kit)?.script?.recordedRun;
  // v6.11 G2 (main on director19 c4 steady 62, 76: a planned board change not drawn — the next unit's point said over the closed card's
  // board): a close and the next unit's teaching go in one turn only when Studio can draw the switch between their boards (its own
  // heldBoard, asked here); when it cannot, the close ends the turn on a check-in and the next unit comes on the next turn
  // (a bridge's board is the next skill's first unit's — the bridge belongs to that unit, v6.9 N2)
  const bridgeU = bridgeTurn && move.bridgeBeat?.skillId ? firstUnitOf(input.kit, move.bridgeBeat.skillId) : null;
  const bridgeB = bridgeU ? unitBoardOf(input.kit, bridgeU) : null;
  const closeB = move.closeBeat?.board ?? null, nextB = (bridgeTurn ? bridgeB ?? move.bridgeBeat?.board : null) ?? (move.cardBeat ?? move.scriptBeat)?.board ?? null;
  const hasClose = closing.some(Boolean) || (!!move.closeBeat && (!!move.verdict || ["correct", "incorrect", "partial", "misconception"].includes(input.cls?.outcome)));
  const unfit = hasClose && !!closeB && !!nextB && !scriptFor(input.kit)?.script?.recordedRun && !switchFits(closeB, nextB);
  // (dc-r8-director24 L, main's 035: one new thing a turn — a verdict, its why, the next point and its card in one breath of 60 to 80 words.
  // The close's words count: over the cap, the turn ends on the point's check-in and the card comes next turn)
  const closedCardWhy = (() => { try { const cb = move.closeBeat; return cb ? workedAnswerOf({ ...s, lastMove: { scriptBeat: cb } }, input.kit)?.why ?? null : null; } catch { return null; } })();
  const recorded = !!scriptFor(input.kit)?.script?.recordedRun;
  // (dc-r8-director26 C1 item 2: the words she will say — a verdict frame and its "Dekho," with a joint's margin (6), each why once (the card's graded why and the
  // worked example's why are one sentence on a worked close: c4 steady 86 counted 44 words for a close of 31, and broke a turn of 56), and
  // "Toh poora jawab:" before a worked answer (3). It was 6 + every why + 4)
  // (Brain 043 R4: the why counted is the card's this turn closes — s.lastGraded is the card graded on the turn before, and counted another
  // card's why wherever two cards were answered one after the other; R1: the short why in its place when the walk tries it)
  const whyTexts = [...new Set([move.workedDone?.why ? null : opt.shortWhy ?? closedCardWhy ?? s.lastGraded?.why, move.closed?.why, move.workedDone?.why].filter(Boolean)
    .map((x) => String(typeof x === "string" ? x : saidIn(x, s.ctx?.lang ?? "hinglish") ?? "").replace(/\s+/g, " ").trim()).filter(Boolean))];
  // (Brain 043 R4, c5-t02 steady 70: the frame and its joint to the why are at most four words — "Haan, bilkul theek, kyunki", "Haan, sahi
  // hai. Dekho," — brain/say.js FRAMES.right; six counted a verdict of 17 words as 20, and broke a turn of 75)
  const closeWords = hasClose && !recorded ? VERDICT_FRAME_WORDS + whyTexts.join(" ").split(/\s+/).filter(Boolean).length + (move.workedDone?.answer ? 3 : 0) : 0;
  // (dc-r8-director26 C1, main's ruling change 4: the problem and its first step share a turn after a verdict, the beforeWorked joint, a
  // bridge or a held part only when all of it fits in 75 words with her check-in; when it does not, the verdict, the joint and the problem
  // are said as they were before the ruling — one turn, its own break rules — and the first step goes back to the walk)
  // (dc-r8-director27 Brain 042 Q2: a segment of an asked worked example is said whole with its question — the problem never alone; where a
  // verdict, its why, a bridge or a held part before it make the turn run over 75 words, the break falls after them and that turn ends on
  // its check-in)
  if (l2On() && !recorded && segmentMove(move, ui, input.kit) && move.returned?.topic && hasClose) return returnApart(out, input);
  if (l2On() && !recorded) { const sg = segmentTurn(out, input, closeWords); if (sg) return sg; }
  if (l2On() && !recorded && move.problemLines && !ui?.ask?.itemId) {
    const p0 = partsOfTurn(out, closeWords, input?.helpLeadWords ?? 0);
    if (p0.some((x) => ["close", "bridge", "held"].includes(x.k)) && p0.reduce((a, x) => a + x.n, 0) + 4 > L2_CAP) return splitLongOnce(withoutFirstStep(out), input, opt);
  }
  // (dc-r8-director25 L2 item 1: the aside's return question is a turn of its own — the close of the card just answered ends its turn
  // on a check-in; the return comes on the next turn, alone, and the lesson after her reply to it)
  if (l2On() && !recorded && move.returned?.topic && hasClose) return returnApart(out, input);
  // (dc-r8-director25 L2: a turn of more than one part over 75 words breaks at the last seam before 75 — breakL2 below)
  // (TAXILA_R7_SPLIT_CLOSE=on, the opt-in closing split of v6.1 policy B, decides a turn with closures by itself, as it did before L2)
  const splitCloseOptIn = closing.some(Boolean) && process.env.TAXILA_R7_SPLIT_CLOSE === "on";
  if (l2On() && !recorded && !gaveTurn && !unfit && !splitCloseOptIn) { const b = breakL2(out, input, closeWords); if (b) return b; }
  if (!bridgeTurn && !gaveTurn && !unfit && (!closing.some(Boolean) || process.env.TAXILA_R7_SPLIT_CLOSE !== "on")) return splitTeach(out, input, cap, closeWords);
  // (L: a bridge said with the next unit's first point and card counts its words too)
  if (bridgeTurn && !gaveTurn && !unfit && !recorded && process.env.TAXILA_R7_SPLIT_CLOSE !== "on") { const bw = String(move.bridgeSaid ?? "").split(/\s+/).filter(Boolean).length + closeWords; const sp = splitTeach(out, input, cap, bw); if (sp !== out) return sp; }
  // (her verdict and the joins are about a dozen words beside the authored ones)
  if (!bridgeTurn && !gaveTurn && !unfit && wordsIn(closing, teaching) + 12 <= cap) return out;
  // (a bridge whose board cannot follow the close's in one turn waits with the next unit)
  // (dc-r8-director25 L2: a key and a bridge that run over 75 words together: the bridge waits with the next unit)
  const l2Over = l2On() && !recorded && bridgeTurn && (() => { const p = partsOfTurn(out, closeWords); const c = p.find((x) => x.k === "close")?.n ?? 0, b = p.find((x) => x.k === "bridge")?.n ?? 0; return c > 0 && c + b > L2_CAP; })();
  const bridgeWaits = bridgeTurn && (unfit || l2Over);
  const close = { kind: "repair", shape: SH.splitClose(), splitClose: true, ...(move.verdict ? { verdict: move.verdict } : {}), ...((gaveTurn && !bridgeTurn) || unfit ? { gaveCheck: true } : {}),
    ...Object.fromEntries(["gave", "closed", "workedDone", "closeBeat", "closedBeat", "returned", "sayFirst", ...(bridgeWaits ? [] : ["bridgeSaid", "bridgeBeat"]), "methods", "prefs", ...(l2On() ? NOW_LINES : [])].filter((k) => move[k] != null).map((k) => [k, move[k]])),
    // (v6.4 P2, main on director12 c6 stuck 54: a lone bridge drew the answered card's board, stale from the preselect: a turn that
    // closes nothing but says the bridge is on the bridge's board)
    ...((move.gave || move.closed || move.workedDone || move.verdict || !move.bridgeBeat || bridgeWaits) && move.closeBeat ? { scriptBeat: move.closeBeat } : move.bridgeBeat ? { scriptBeat: move.bridgeBeat } : {}) };
  const held = { ...move };
  for (const k of ["gave", "closed", "workedDone", "closeBeat", "closedBeat", "returned", "sayFirst", ...(bridgeWaits ? [] : ["bridgeSaid", "bridgeBeat"]), "probeAck", ...(l2On() ? NOW_LINES : [])]) delete held[k];
  // (the bridge rides in sayFirst too: when it waits, it leaves the close and leads the held turn)
  if (bridgeWaits && move.bridgeSaid) {
    const isBridge = (x) => String(x).trim() === String(move.bridgeSaid).trim();
    if (close.sayFirst) { close.sayFirst = close.sayFirst.filter((x) => !isBridge(x)); if (!close.sayFirst.length) delete close.sayFirst; }
    held.sayFirst = [String(move.bridgeSaid)];
  }
  s.splitHold = { move: held, ui, activeItemId: s.activeItemId ?? null, lastContent: s.lastContent ?? [], moduleCommands: out.moduleCommands ?? [] };
  s.activeItemId = undefined;
  s.lastMove = close;
  const closeUi = { status: "your_turn", ...(ui?.later ? { later: ui.later } : {}), ...(ui?.moment ? { moment: ui.moment } : {}) };
  s.lastUi = closeUi;
  return { ...out, state: s, move: close, moduleCommands: [], ui: closeUi, proposal: directorProposal(close, { ui: closeUi, guidance: s.guidance, purpose: s.purpose }) };
}
// ───────────── dc-r8-director25 L2: a turn of more than one part breaks at 75 words ─────────────
// (main's director25 judgement, clause 6: turn shape had the most rows — turns of 70 to 113 words, a verdict, its why, a bridge and a
// point in one breath. The rule as decided: a turn that holds more than one part and would run over 75 words (the decision said 45; main
// measured it, below) breaks at the last seam before 75 words where a point, a bridge, a worked step or the card begins; the break ends on a check-in (brain/say.js ends every
// turn that has nothing to answer on one); never inside an authored part. A verdict and the next part that fit stay together.
// TAXILA_L2=off: the 60-word rules of dc-r8-director24 L.)
// (main, 2026-11-17, on the dry matrix before any paid run: at 45 words every steady lesson ran 185 to 203 rows with 54 to 58 check-ins,
// past the decision's own 170-row limit; at 75 words 131 to 165 rows and 27 to 33 check-ins, and the turns the director25 judges called
// monologue, 76 words and over, still break. dc-r8-l2-break-at-75.)
export const L2_CAP = 75;
/** Brain 043 R4: the most words a right verdict's frame and its joint to the why take (brain/say.js FRAMES.right, three words, and
 *  ", kyunki" or ". Dekho,"). */
export const VERDICT_FRAME_WORDS = 4;
/** dc-r8-director27 P2: a remediation and its follow-up card share a turn only within 60 words (a point and its own card keep L2_CAP). */
export const REM_CARD_CAP = 60;
/** Her lines that answer what the child said on this turn (an aside said again, a taste question, a sad aside): a split turn says them on
 *  its first half. */
const NOW_LINES = ["asideAgain", "tasteAsked", "sadAside"];
/** dc-r8-director24 L, kept by main's R1 on the merged tree: the most words a turn holding a new point and its card may run to (45 where
 *  the child's words are plain). splitTeach's limit; L2_CAP is breakL2's. */
// (dc-r8-director28 Brain 044 T1: the 60-word cap on a point after a verdict goes — a point and its card share a turn to 75 whatever comes
// before them (c6: a quick question was asked in 12 of 14 places where the point and its card fit 75); 45 where the child's words are plain)
export const pointCardCap = (s, kit = null) => (s?.ctx?.plainWords ? 45 : scriptFor(kit)?.script?.recordedRun || !l2On() ? 60 : L2_CAP);
// (a replay of a recorded run walks what that run walked: the 60-word cap it ran under; TAXILA_L2=off is dc-r8-director24 L's 60-word rules)
export const l2On = (env = process.env) => !/^(off|0|false)$/i.test(String(env.TAXILA_L2 ?? ""));
/** The parts of a turn in the order she says them, with their words: close (a verdict and its why, a key, a missed card's close),
 *  bridge, held (parts a return held), body (the point, a remediation's say, worked lines), card. Joints and her reply to an aside ride
 *  on the part they lead into. */
export function partsOfTurn(out, closeWords = 0, lead0 = 0) {
  const { state: s, move, ui } = out;
  const lang = s.ctx?.lang ?? "hinglish";
  const txt = (x) => (typeof x === "string" ? x : x ? saidIn(x, lang) ?? "" : "");
  const closeT = [move.gave?.answer, move.gave?.why, move.closed?.answer, move.workedDone?.answer].map(txt).filter(Boolean);
  const C = closeWords + (closeT.length ? wordsIn(closeT) + (closeWords ? 0 : 6) : 0);
  const bridge = move.bridgeSaid ? String(move.bridgeSaid) : null;
  const held = (move.sayFirst ?? []).map(String).filter((x) => !bridge || x.trim() !== bridge.trim());
  const body = move.smaller && move.simpler ? [move.simpler, ...(move.rendered ?? [])] : [move.point, ...(move.rendered ?? [])];
  // (her line on an aside, and the joint back to the lesson, lead the first part: about a dozen words)
  // (dc-r8-director26: help's joint said before a turn the walk goes on to — the go-on line — leads it too: input.helpLeadWords)
  // (Brain 044 T6: her reply to an aside and its joint back are not counted in the turn's 75 — help's go-on line is)
  const lead = lead0;
  // (dc-r8-director26 C1, main's ruling change 4: the problem said with its first step after a verdict takes the beforeWorked joint, about
  // ten words, before it: they count)
  const joint = move.problemLines && C > 0 ? 10 : 0;
  const parts = [{ k: "close", n: C }, { k: "bridge", n: bridge ? wordsIn(bridge) : 0 }, { k: "held", n: wordsIn(held) }, { k: "body", n: wordsIn(body.filter(Boolean)) + joint },
    // (a card asked before comes back with its joint or frame: about seven words)
    { k: "card", n: ui?.ask?.text ? wordsIn(ui.ask.text) + (s.posedAt?.[ui.ask.itemId] != null && s.posedAt[ui.ask.itemId] < s.turn ? 7 : 0) : 0 }].filter((p) => p.n > 0);
  if (parts.length && lead) parts[0] = { ...parts[0], n: parts[0].n + lead };
  // (a miss verdict and the remediation it leads into are one answer — the order law: the remediation comes straight after the answer
  // it remedies; no seam between them)
  if (move.scriptBeat?.kind === "remediation" && parts[0]?.k === "close" && parts[1]?.k === "body") parts.splice(0, 2, { k: "body", n: parts[0].n + parts[1].n, close: true });
  return parts;
}
/** Where a turn of these parts breaks: the index of the first part held for the next turn, or -1 (it fits, or it is one part). */
export function breakAt(parts, cap = L2_CAP) {
  if (parts.length < 2 || parts.reduce((a, p) => a + p.n, 0) <= cap) return -1;
  let cum = 0, at = -1;
  for (let i = 0; i < parts.length - 1; i++) { cum += parts[i].n; if (cum <= cap) at = i + 1; }
  // (the first part alone is over the cap: it is said whole and ends the turn — Learning's to shorten, compile-report lists it)
  return at < 0 ? 1 : at;
}
/** main's R5 on the merged H4 + L2 tree (dry offtopic c5-t02 24): a park is kept within ten of her turns. A park waits for the card it was
 *  said on to be done — but a card can stay open a long time now that turns are shorter: a remediation and its then-card, help, a
 *  picture and a try-first held c5-t02's e3 for fifteen turns, and the return came at 54, fifteen turns after its park. Six of the
 *  child's turns after the park, the return comes at the next boundary even while that card is still the one on the table: a card
 *  re-posed after a detour (a held half, a then-card's close) is such a boundary; a card being worked on turn after turn is not. */
export const PARK_OVERDUE_TURNS = 6;
const parkOverdue = (s, e) => Number.isFinite(e?.at) && (s?.turn ?? 0) - e.at >= PARK_OVERDUE_TURNS;
/** L2 item 1: a close and a return due on one turn — the close now, ending on its check-in; the rest (the return first) held. heldTurn
 *  says the held move: brain/say.js says the return alone there and holds the lesson's parts for the turn after her reply. */
function returnApart(out, input = null) {
  const { state: s, move, ui } = out;
  // (the child said the aside again on this very turn — the return was due because of it — so the close's half carries her one line on
  // it, "Haan, cricket — woh mujhe yaad hai."; the return question comes next turn, alone. Without it her line went unheard for a turn:
  // r7-brain-v67, c5-t02 offtopic 28 'mujhe cricket pasand hai', on the merged H4 + L2 tree)
  const saidNow = input?.text && move.returned?.said && String(move.returned.said).trim() === String(input.text).trim();
  // (the aside is not served on this turn: it stays due, and the next boundary — the held half, heldTurn — returns it on a turn of its
  // own; a request answered first keeps it due, never lost)
  const t0 = String(move.returned.topic);
  s.later = (s.later ?? []).map((e) => (e.servedAt === s.turn && String(e.topic) === t0 ? { ...e, servedAt: undefined } : e));
  // (her one line to an aside the child said again — asideAgain, a taste question, a sad aside — answers what the child said on this
  // turn: it rides on the half said now, never on the held one: r7-brain-v67, c5-t02 offtopic 28 'mujhe cricket pasand hai')
  const closeKeys = ["gave", "closed", "workedDone", "closeBeat", "closedBeat", "methods", "prefs", ...NOW_LINES];
  const close = { kind: "repair", shape: SH.splitClose(), splitClose: true, gaveCheck: true, l2Break: true, ...(move.verdict ? { verdict: move.verdict } : {}),
    ...Object.fromEntries(closeKeys.filter((k) => move[k] != null).map((k) => [k, move[k]])), ...(move.closeBeat ? { scriptBeat: move.closeBeat } : {}),
    ...(saidNow && !move.asideAgain && !move.tasteAsked ? { asideAgain: { topic: String(move.returned.topic) } } : {}) };
  const held = { ...move };
  for (const k of [...closeKeys, "probeAck", "verdict", "returned"]) delete held[k];
  s.splitHold = { move: held, ui, activeItemId: s.activeItemId ?? null, lastContent: s.lastContent ?? [], moduleCommands: out.moduleCommands ?? [] };
  s.activeItemId = undefined;
  s.lastMove = close;
  const closeUi = { status: "your_turn", ...(ui?.later ? { later: ui.later } : {}), ...(ui?.moment ? { moment: ui.moment } : {}) };
  s.lastUi = closeUi;
  return { ...out, state: s, move: close, moduleCommands: [], ui: closeUi, proposal: directorProposal(close, { ui: closeUi, guidance: s.guidance, purpose: s.purpose }) };
}
/** L2 on a turn with a close, a bridge or a held part: the parts before the break now, ending on a check-in; the rest held for the
 *  next turn (heldTurn says it, broken again if it still runs over). null: not this function's turn (no close, bridge or held part —
 *  splitTeach breaks a point from its card). */
function breakL2(out, input, closeWords = 0, forceAt = -1) {
  const { state: s, move, ui } = out;
  // (help — a hint after a miss, a simpler — is one answer with its card's question: Brain 039 Part A's, never broken here)
  if (move.simpler || move.kind === "hint") return null;
  const parts = partsOfTurn(out, closeWords, input?.helpLeadWords ?? 0);
  // (forceAt 0, Brain 042: what leads a worked segment — her reply to an aside, her park line — is said alone, the segment held)
  if (!parts.some((p) => ["close", "bridge", "held"].includes(p.k)) && forceAt !== 0) return null;
  // (dc-r8-director26: a turn with no card ends on her check-in — four words the parts do not hold: dry c5-t01 steady 50 ran 79 words)
  let at = forceAt >= 0 ? forceAt : breakAt(parts, L2_CAP - (parts.some((p) => p.k === "card") ? 0 : 4));
  // (dc-r8-director28 Brain 044 T1: the hook never ends a turn — it is said with the first point; where the two and the card do not fit, the
  // point ends the turn on its quick question or its check-in, counted as not fitting)
  // (and a turn whose card is held ends on the check-in in its place)
  if (forceAt < 0 && at > 1 && parts.slice(0, at).reduce((a, p) => a + p.n, 0) + 4 > L2_CAP) at -= 1;
  if (move.hookSaid && !recordedNow && forceAt < 0 && at >= 0 && parts.findIndex((p) => p.k === "body") >= at) return splitTeach(out, input, -1, closeWords);
  // (the parts fit in 75 words: the point and its card still never go in one turn over 60 — the point's own split, its close counted)
  if (at < 0) return splitTeach(out, input, pointCardCap(s, input.kit), closeWords);
  const now = new Set(parts.slice(0, at).map((p) => p.k));
  // (the card alone is held, after a point: the point's own split — its check-in, then the card)
  if (!now.has("card") && parts[at].k === "card" && now.has("body")) return splitTeach(out, input, -1, closeWords);
  const bridgeNow = now.has("bridge"), heldNow = now.has("held"), bodyNow = now.has("body");
  const bridge = move.bridgeSaid ? String(move.bridgeSaid).trim() : null;
  const isBridge = (x) => !!bridge && String(x).trim() === bridge;
  const sayNow = (move.sayFirst ?? []).filter((x) => (isBridge(x) ? bridgeNow : heldNow));
  const sayLater = (move.sayFirst ?? []).filter((x) => !sayNow.includes(x));
  // (a close with the body said now and the card held is the point's split with its close: splitTeach's own shape)
  if (bodyNow) return splitTeach(out, input, -1, closeWords);
  const closeKeys = ["gave", "closed", "workedDone", "closeBeat", "closedBeat", "returned", "methods", "prefs", ...NOW_LINES, ...(bridgeNow ? ["bridgeSaid", "bridgeBeat"] : [])];
  const close = { kind: "repair", shape: SH.splitClose(), splitClose: true, gaveCheck: true, l2Break: true, ...(move.verdict ? { verdict: move.verdict } : {}),
    ...Object.fromEntries(closeKeys.filter((k) => move[k] != null).map((k) => [k, move[k]])),
    ...(sayNow.length ? { sayFirst: sayNow } : {}), ...(heldNow && move.heldSaid ? { heldSaid: move.heldSaid } : {}), ...(heldNow && move.heldBeat ? { heldBeat: move.heldBeat } : {}),
    ...(move.asideAck ? { asideAck: true } : {}), ...(move.returnReply ? { returnReply: move.returnReply } : {}),
    // (said over the board of what it closes; a turn that closes nothing and says the bridge is on the bridge's board)
    ...((move.gave || move.closed || move.workedDone || move.verdict || !bridgeNow) && move.closeBeat ? { scriptBeat: move.closeBeat } : bridgeNow && move.bridgeBeat ? { scriptBeat: move.bridgeBeat } : move.closeBeat ? { scriptBeat: move.closeBeat }
      // (Brain 042: her reply or park line said alone before a worked segment — leadAlone — is said on the part she was on, the board up
      // staying; whatever the child says next, the segment comes, whole: helpRequestOf)
      : forceAt === 0 && leadBeatOf ? { scriptBeat: leadBeatOf } : {}), ...(forceAt === 0 ? { leadAlone: true } : {}) };
  const held = { ...move };
  for (const k of [...closeKeys, "sayFirst", "heldSaid", "heldBeat", "probeAck", "asideAck", "returnReply", "verdict"]) delete held[k];
  if (sayLater.length) held.sayFirst = sayLater;
  if (!heldNow && move.heldSaid?.length) { held.heldSaid = move.heldSaid; if (move.heldBeat) held.heldBeat = move.heldBeat; }
  if (!bridgeNow && move.bridgeSaid) { held.bridgeSaid = move.bridgeSaid; if (move.bridgeBeat) held.bridgeBeat = move.bridgeBeat; }
  s.splitHold = { move: held, ui, activeItemId: s.activeItemId ?? null, lastContent: s.lastContent ?? [], moduleCommands: out.moduleCommands ?? [] };
  s.activeItemId = undefined;
  s.lastMove = close;
  const closeUi = { status: "your_turn", ...(ui?.later ? { later: ui.later } : {}), ...(ui?.moment ? { moment: ui.moment } : {}) };
  s.lastUi = closeUi;
  return { ...out, state: s, move: close, moduleCommands: [], ui: closeUi, proposal: directorProposal(close, { ui: closeUi, guidance: s.guidance, purpose: s.purpose }) };
}
/**
 * v6 R5, the other split: authored teaching (a remediation's say, a worked part, a beat's point) and the card it ends on, too
 * long for one turn: the teaching now, ending on "is that clear so far?", no card live; the card alone on the next turn (its
 * board, no point said again). A "pata nahi" / "samajh nahi aaya" to the check-in lets the card go: the walk then re-teaches
 * the same beat smaller with the card live, as it would have.
 */
/** dc-r8-director26 C1 (main's ruling, changes 2-4): a turn whose teaching and card are one unit, said together up to L2_CAP (75) words —
 *  { margin }: the words she says beside the authored ones — or null (the turn keeps the cap splitTeach was given).
 *  - a told worked step (or the problem and its one step) with the child's own step: the card is the step's question;
 *  - a remediation with its follow-up card: the remediation answers her mistake and the card is its question (its verdict and the
 *    beforeRemediation joint, about a dozen words, ride before it);
 *  - a bare point with its own card: nothing else in the turn before them — no verdict, why, key, bridge, held part, hook or reply to an
 *    aside, no help, and the child's words are not plain (plainWords keeps 45). A point after a close or a bridge keeps 60
 *    (dc-r8-director24 L; longPointCard). */
/** The words help's go-on line leads a walk's turn with: the decision's joint when it named one (input.helpLeadWords), else the longest
 *  afterKeyGoOn form the seam pass may say (12 when the script has none). 0 on a turn help did not lead. */
export function goOnLeadWords(input, lang = "hinglish") {
  if (input?.helpLeadWords) return input.helpLeadWords;
  if (!input?.helpGoOn) return 0;
  return Math.max(0, ...(jointOf(input?.kit, "afterKeyGoOn", lang) ?? []).map((x) => wordsIn(x))) || 12;
}
/** What leads a walk's turn before its authored parts: help's go-on line, and her reply to an aside — or to her question after the AI line
 *  or a return (brain/say.js answers it in the child's words) — with the joint back, about sixteen words. The walk counts it when it puts
 *  parts together (dc-r8-director26 C1). lastMove: her last turn's move. */
// (dc-r8-director27, dry c5-t01 stuck 36 on Learning 016's steps: a park of the child's aside leads the turn too — "Cricket ki baat bhi hogi, bas
// yeh … khatam ho jaaye." — and two told steps with the child's own step ran to 86 words beside it)
// (Brain 044 T6: her reply to an aside, her park line and their joint are not counted in the turn's 75 — 15 words at most, never said alone)
const walkLeadWords = (input, lang, lastMove = null) => goOnLeadWords(input, lang);
export function unitTurn(out, input = null, extra = 0, first = 0) {
  const { state: s, move, ui } = out;
  // (help's go-on line before the turn, when the decision did not count it)
  // (and her reply to an aside with the joint back to the lesson before it: about sixteen words)
  const goOn = input?.helpLeadWords ? 0 : goOnLeadWords(input, s?.ctx?.lang ?? "hinglish");
  if (move.help || move.request || move.simpler || move.smaller) return null;
  const askId = String(ui?.ask?.itemId ?? "");
  if (move.kind === "worked_example" && move.rendered?.length && /:ask:worked$/.test(askId)) return { margin: 3 + extra + first + goOn };
  // (her miss verdict, "<answer> sahi nahi hai." or "Nahi, yeh theek nahi hai.", five words or fewer, and the longest beforeRemediation form)
  // (an aside parked on another card is due at the follow-up card's held half — the aside's return turn stays where it was: the remediation
  // keeps its own turn then)
  const parkDue = (s?.later ?? []).some((e) => !e.servedAt && e.share && e.parkSaid && e.onItem && e.onItem !== askId && Number.isFinite(e.at) && e.at < (s?.turn ?? 0));
  if (move.kind === "reteach" && move.scriptBeat?.kind === "remediation" && move.rendered?.length && /:then:/.test(askId) && !parkDue) {
    const j = Math.max(0, ...(jointOf(input?.kit, "beforeRemediation", s?.ctx?.lang ?? "hinglish") ?? []).map((x) => wordsIn(x)));
    // (a close said before the miss verdict — a worked answer, a key — counts as its words)
    // (dc-r8-director27 P2: two judges found a remediation and its follow-up card too much in one breath at 68 to 74 words — the card joins
    // the remediation's turn only within 60; else the remediation ends on its check-in and the card comes next turn. A point with its own
    // card keeps 75)
    return { margin: 5 + (j || 8) + first + goOn + (move.workedDone || move.gave || move.closed ? extra : 0), cap: REM_CARD_CAP };
  }
  // (a point said in answer to a request — a give-up or a clarify at the hook, help's go-on line — is help's turn: it keeps its cap)
  const asked = !!input?.cls?.request?.type || !!input?.helpGoOn || GIVE_UP_WORDS.test(String(input?.text ?? "")) || SAYS_CLARIFY.test(String(input?.text ?? ""));
  const preceded = asked || extra > 0 || first > 0 || move.asideAck || move.returnReply || move.heldSaid?.length || move.bridgeSaid || move.verdict || move.gave || move.closed || move.workedDone || move.hookSaid;
  if (move.kind === "explain" && move.point && !move.rendered?.length && !preceded && !s?.ctx?.plainWords) return { margin: 8 };
  return null;
}
function splitTeach(out, input, cap, extra = 0) {
  const { state: s, move, ui } = out;
  const card = ui?.ask?.text;
  // (v6.5 K2, main on director13 c4 steady 8, offtopic 26, steering 30: a smaller re-teach speaks the beat's short simpler, not its
  // point — measured by what is said, it re-poses the card in the same turn, never "Ab isi par ek sawaal" and a wait)
  const body = move.smaller && move.simpler && !scriptFor(input.kit)?.script?.recordedRun ? [move.simpler, ...(move.rendered ?? [])] : [move.point, ...(move.rendered ?? [])];
  // (L: what the turn says first — a bridge, a held part — counts toward the turn's words)
  // (d28: her park line on an aside said on this turn — "Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye." — leads the turn too: dry c6
  // steady 36, a park, a point and its card in 61 words)
  // (Brain 044 T6: the park line is not counted in the turn's 75)
  const parkLead = 0;
  // (d29 final, main's ruling on 044: a help joint said first — the "nothing easier" line before the hook — is a lead, not counted)
  const jointForm = move.helpJoint?.form ? String(move.helpJoint.form).replace(/\s+/g, " ").trim() : null;
  const first = scriptFor(input.kit)?.script?.recordedRun ? 0 : (move.sayFirst ?? []).map(String).filter((x) => !jointForm || x.replace(/\s+/g, " ").trim() !== jointForm).join(" ").split(/\s+/).filter(Boolean).length + (input?.helpLeadWords ?? 0) + parkLead;
  if (!card || !body.some(Boolean) || !move.itemId) return out;
  // (dc-r8-director26 C1, main's ruling changes 2-4: three turns share their card up to 75 words — a worked step with the child's own step,
  // a remediation with its follow-up card, a bare point with its own card. Every other turn keeps the cap it was given)
  const u = cap < 0 || scriptFor(input.kit)?.script?.recordedRun ? null : unitTurn(out, input, extra, first);
  // (Brain 044 T1: a point and its card that fit in words share the turn only where Studio can draw every board change in it — the board up,
  // the point's, the card's; dry steady c4 94: a bridge, the point and its card on three boards drew one page)
  const drawable = () => scriptFor(input.kit)?.script?.recordedRun || move.scriptBeat?.kind !== "explain" || !move.point || move.smaller || move.simpler || move.help || switchesFit([s.heldUp?.board ?? null, move.scriptBeat?.board ?? null, (move.cardBeat ?? null)?.board ?? null]);
  // (d29 final, Learning 017 A.2: a later point and its card are 61 words, and the turn holds them with the verdict form and the short reason —
  // 75 in all, counted as said; A.1: the hook, the first point and its card, 75. The 8 words of slack kept for her framing are not added)
  const slack = move.point && move.scriptBeat?.kind === "explain" && !move.smaller && !move.simpler && (extra > 0 || move.hookSaid) && !scriptFor(input.kit)?.script?.recordedRun ? 0 : 8;
  if ((u ? wordsIn(body, card) + u.margin <= (u.cap ?? L2_CAP) : wordsIn(body, card) + slack + extra + first <= cap) && drawable()) return out;
  let teach = quickTeach(out, input, { ...move, splitTeach: true, ...(checkinFor(s, move) ? { checkinOk: true } : {}) }, extra);
  // (dc-r8-director28 Brain 044 T1: a point split from its card with no quick question in its place — the two do not fit and the script keeps no
  // quick question that fits — ends on its check-in, and the row says so: counted, 0 on the pilots once Learning 017's cuts are in)
  const noFitNow = () => !teach.quick && move.point && move.scriptBeat?.kind === "explain" && !move.smaller && !move.simpler && !move.help && !move.request;
  // (Brain 042 Q1: a verdict, its why and a new point leave no room for the point's quick question in 75 words — the break falls after the
  // why, as Q2 says for a worked problem: the close ends its turn on its check-in, and the point comes next with its card or its quick
  // question; never a check-in before the waiting card)
  if (teach.quickNoRoom) {
    const parts = partsOfTurn(out, extra, input?.helpLeadWords ?? 0);
    const b = parts.findIndex((p) => p.k === "body");
    if (b > 0 && l2On() && parts.slice(0, b).some((p) => p.k === "close")) { const br = breakL2(out, input, extra, b); if (br) return br; }
    delete teach.quickNoRoom;
  }
  if (noFitNow()) teach = { ...teach, noFit: "point" };
  // (dc-r8-director26 C1: told steps that could not keep the child's own step are a step's turn again — the last step said is its beat, so
  // a "pata nahi" to its check-in is that step's help, as before)
  const lastStep = move.kind === "worked_example" && move.stepFrom && move.rendered?.length ? move.stepFrom + move.rendered.length - (move.problemLines ?? 0) - 1 : 0;
  if (lastStep > 0 && move.scriptBeat?.beatId === "worked") teach.scriptBeat = { ...move.scriptBeat, beatId: `worked:step${lastStep}` };
  const held = { kind: "practice", shape: SH.splitCard(), itemId: move.itemId, skillId: move.skillId, hintLevel: move.hintLevel,
    ...(move.cardBeat ?? move.scriptBeat ? { scriptBeat: move.cardBeat ?? move.scriptBeat } : {}), ...(move.cardBeat ? { cardBeat: move.cardBeat } : {}),
    ...(move.probe ? { probe: move.probe } : {}), ...(move.format ? { format: move.format } : {}), ...(move.methods ? { methods: move.methods } : {}), ...(move.prefs ? { prefs: move.prefs } : {}) };
  s.splitHold = { move: held, ui, activeItemId: s.activeItemId ?? null, lastContent: s.lastContent ?? [], moduleCommands: [], teach: true };
  s.activeItemId = undefined;
  // (Brain 042 Q1: the quick question is what the child's next line is read against — by the card's reader, against its own key)
  if (teach.quick) { s.quickItem = teach.quick.item; s.activeItemId = teach.quick.item.id; if (isQuickId(s.cardUnsaid)) s.cardUnsaid = undefined; teach.quick = { ...teach.quick, item: undefined }; delete teach.quick.item; }
  s.lastMove = teach;
  const teachUi = { status: "your_turn", ...(ui?.later ? { later: ui.later } : {}), ...(ui?.moment ? { moment: ui.moment } : {}) };
  s.lastUi = teachUi;
  return { ...out, state: s, move: teach, ui: teachUi, proposal: directorProposal(teach, { ui: teachUi, guidance: s.guidance, purpose: s.purpose }) };
}
/**
 * v6.6 A2 (main, director14: five asides never returned — the return was due, her line had none, and the queue counted it served):
 * an aside whose return was not said this turn goes back on the queue, to come back at the next boundary (the wrap waits for it).
 * Called by the turn (brain/turn.js, the harness) with the reply's guard. Returns the state.
 */
/** v6.8 A4: the live card was left unsaid (an aside question ended her last turn): the reply is not an answer to it. */
export const cardUnsaidNow = (s) => !!s?.cardUnsaid && s.cardUnsaid === s.activeItemId;
export function requeueMissedReturn(s, guard) {
  const r = s?.lastMove?.returned;
  if (!r?.topic || !(guard?.returnMissed || guard?.returnHeld) || guard?.returnSaid) return s;
  const e = (s.later ?? []).find((x) => x.servedAt === s.turn && String(x.topic) === String(r.topic));
  if (!e) return s;
  return { ...s, later: s.later.map((x) => (x === e ? { ...x, servedAt: null, requeued: (x.requeued ?? 0) + 1 } : x)) };
}
/** v6.1 R9: the authored simpler (format 2.3) of the explain beat a move teaches, in the lesson language, or null. */
function simplerOfBeat(s, kit, move) {
  const sb = move?.scriptBeat;
  if (!sb?.beatId || sb.kind !== "explain") return null;
  const sk = skillScriptOf(kit, sb.skillId ?? move.skillId);
  const b = sk?.explain?.find((x) => x.id === sb.beatId);
  const t = b?.simpler ? saidIn(b.simpler, s.ctx?.lang ?? "hinglish") : null;
  return t && String(t).trim() ? String(t).trim() : null;
}
/** dc-r8-director26 C1: told steps held whole with the child's own step (her AI line or a return took the turn they were planned on) come
 *  after her reply to the child: they keep the card only while they still fit in 75 words with that reply (unitTurn counts it). */
/** The card of such a turn, held again by the split, was never said: its posing is undone, so the next turn poses it fresh (never "Phir se
 *  dekho:"). */
function heldCardFresh(before, after) {
  const id = before.ui?.ask?.itemId;
  if (after === before || !id || after.state?.posedAt?.[id] == null) return after;
  const { [id]: _p, ...rest } = after.state.posedAt;
  after.state.posedAt = rest;
  return after;
}
const workedWithCard = (out, input) => !!l2On() && !scriptFor(input.kit)?.script?.recordedRun && out.move?.kind === "worked_example" && !!out.move?.stepFrom && /:ask:worked$/.test(String(out.ui?.ask?.itemId ?? ""));
/** dc-r8-director26 C1 (main's ruling change 4): the worked problem and its first step were held behind a verdict, and now come after
 *  help's go-on line or her reply to an aside: when they no longer fit in 75 words with it, the problem is said alone and the first step
 *  goes back to the walk (said next, as before the ruling). */
function problemAlone(out, input) {
  const { state: s, move } = out;
  const pL = Number(move?.problemLines) || 0;
  if (!pL || out.ui?.ask?.itemId || !move.rendered?.length || move.stepAsk) return out;
  const lead = goOnLeadWords(input, s.ctx?.lang ?? "hinglish") + wordsIn(move.sayFirst ?? []);
  if (wordsIn(move.rendered) + lead + 4 <= L2_CAP) return out;
  return withoutFirstStep(out);
}
/** The worked problem said with its first step, said without it: the problem alone (its own beat, as before the ruling); the first step goes
 *  back to the walk, said next. */
function withoutFirstStep(out) {
  const { state: s, move } = out;
  const pL = Number(move?.problemLines) || 0;
  const m = { ...move, rendered: move.rendered.slice(0, pL), ...(move.scriptBeat ? { scriptBeat: { ...move.scriptBeat, beatId: "worked:problem" } } : {}) };
  delete m.problemLines; delete m.stepFrom;
  if (s.walk && s.walk.skillId === move.skillId && s.walk.workedStep === 1) s.walk.workedStep = 0;
  s.lastMove = m;
  return { ...out, move: m, state: s, proposal: directorProposal(m, { ui: out.ui, guidance: s.guidance, purpose: s.purpose }) };
}
/** The held half of a split turn, said now (any reply to "shall we go on?" but a safety read or a stop). null otherwise. */
function heldTurn(prev, input) {
  const h = prev.splitHold;
  if (!h || input.event !== "turn" || input.branch) return null;
  const c = input.cls;
  // (Brain 042: a request for Hindi after her reply said alone before a worked segment — the language from now on, and the segment)
  if (prev.lastMove?.leadAlone && c?.request?.type === "language" && !c.flags?.distress && scriptOn()) {
    const s = structuredClone(prev);
    s.turn += 1;
    s.ctx = { ...s.ctx, lang: c.request.lang ?? "hindi", langPinned: true };
    s.splitHold = undefined;
    s.lastMove = h.move; s.moveVoiced = false; s.lastUi = h.ui; s.lastContent = h.lastContent;
    if (h.activeItemId) s.activeItemId = h.activeItemId;
    return { state: s, move: h.move, moduleCommands: h.moduleCommands ?? [], ui: h.ui, end: false, proposal: directorProposal(h.move, { ui: h.ui, guidance: s.guidance, purpose: s.purpose }), ...describe(s, input.kit) };
  }
  if (c?.flags?.distress || c?.flags?.wantsToStop || ["stop", "end", "break", "goodbye", "language"].includes(c?.request?.type)) return null;
  // (Brain 043 R3: "phir se bolo" at a quick question — the quick question again, once, over the point's board)
  { const qa = quickAgain(prev, input, h); if (qa) return qa; }
  // (Brain 042 Q1: the child's line on the point's quick question)
  { const qa = quickAnswer(prev, input, h); if (qa) return qa; }
  // (any request of theirs — a picture, "samajh nahi aaya", a repeat — is answered by the walk with the card live, never by
  // the held half: director9 c5-t02, a picture asked after "aage badhein?" got the next beat; and on the teaching half not
  // following it is such a request too)
  // (Learning, director10 item 1; steering c5-t01 T13: "samajh nahi aaya" after a remediation's say, split from its card, let the
  // card go and the walk moved on to the next beat): still lost after a remediation's say, the held follow-up card comes now,
  // with the remediation's own simpler (else the card's) said first
  // (dc-r8-director20 L1: "pata nahi, aap batao" is a give-up whatever the reader flagged — the child's words decide)
  const giveUp = scriptOn() && GIVE_UP_WORDS.test(String(input.text ?? "")) && !SAYS_CLARIFY.test(String(input.text ?? ""));
  const lost = c?.flags?.dontKnow || giveUp || ["confused", "another", "clarify"].includes(c?.request?.type) || readIntent(String(input.text ?? ""))?.type === "confused";
  const remId = String(prev.lastMove?.scriptBeat?.beatId ?? "");
  // (dc-r8-director25 H4: still lost after a remediation's say, its follow-up card held — help on the remediation, decided before the walk)
  // v6.11 G2 (main on director19 c6 stuck 38: an aside after a split's first half dropped the held half — the worked problem was never
  // said and the walk resumed at step 1): an aside is answered (or parked) and the held half still comes, on this turn
  // (and "samajh nahi aaya" to a closing split's check-in — after a key — is answered by the held teaching, never by skipping it: c5-t01)
  // (dc-r8-director25 H4: a clarify or a give-up after a key's check-in — the why's other wording, else "we'll meet this again" and the
  // lesson goes on — is help on the card just keyed, decided before the walk; the L2/C1 and H2 branches that said it here are gone)
  const retAns = prev.returnAsked && c?.asideReply && !c?.help;
  if (((c?.request?.type === "uptake" && !c.help) || (!h.teach && lost) || retAns) && scriptOn() && !scriptFor(input.kit)?.script?.recordedRun) {
    const s = structuredClone(prev);
    s.turn += 1;
    // (dc-r8-director25 L2 item 1: lost after a close whose return was due — the held half is a boundary: the return comes now, on a turn
    // of its own, and the held half after her reply, as the due path below)
    if (l2On() && !retAns && !h.teach && lost && !scriptFor(input.kit)?.script?.recordedRun && (!/^worked:step/.test(String(h.move?.scriptBeat?.beatId ?? "")) || !!h.move?.problemLines)) {
      const due = (s.later ?? []).find((e) => !e.servedAt && e.share && e.parkSaid && e.onItem && Number.isFinite(e.at) && s.turn > e.at && (h.activeItemId !== e.onItem || parkOverdue(s, e)));
      if (due) {
        s.later = serveLater(s.later, due.id, s.turn);
        const ret = { kind: "repair", shape: SH.uptake({ kind: "personal_share" }), returned: { topic: due.topic, share: !!due.share, ...(due.said ? { said: String(due.said) } : {}) } };
        if (prev.lastMove?.scriptBeat) ret.scriptBeat = prev.lastMove.scriptBeat;
        const ui0 = { status: "your_turn" };
        s.lastMove = ret; s.moveVoiced = false; s.lastUi = ui0; s.activeItemId = undefined;
        return { state: s, move: ret, moduleCommands: [], ui: ui0, end: false, proposal: directorProposal(ret, { ui: ui0, guidance: s.guidance, purpose: s.purpose }), ...describe(s, input.kit) };
      }
    }
    // (dc-r8-director27 Brain 042 E1, dry offtopic c5-t02 24 on 041: the child's AI question took the turn a parked aside's return was due
    // on, and this path never looked again — the return came never. Her reply to the child's answer is said now, alone; the return comes on
    // the next turn, on its own (the due path below), and the held half after her reply to it)
    if (l2On() && retAns && (!/^worked:step/.test(String(h.move?.scriptBeat?.beatId ?? "")) || !!h.move?.problemLines)) {
      const due = (s.later ?? []).find((e) => !e.servedAt && e.share && e.parkSaid && e.onItem && Number.isFinite(e.at) && s.turn > e.at && (h.activeItemId !== e.onItem || parkOverdue(s, e)));
      if (due) {
        const ans = { topic: prev.returnAsked.topic, said: String(input.text ?? "").replace(/\s+/g, " ").trim().slice(0, 80) };
        s.returnAnswer = ans; s.returnAsked = undefined;
        const close = { kind: "repair", shape: SH.splitClose(), splitClose: true, gaveCheck: true, leadAlone: true, returnReply: ans, asideAck: true, ...(prev.lastMove?.scriptBeat ? { scriptBeat: prev.lastMove.scriptBeat } : {}) };
        const ui0 = { status: "your_turn" };
        s.lastMove = close; s.moveVoiced = false; s.lastUi = ui0; s.activeItemId = undefined;
        return { state: s, move: close, moduleCommands: [], ui: ui0, end: false, proposal: directorProposal(close, { ui: ui0, guidance: s.guidance, purpose: s.purpose }), ...describe(s, input.kit) };
      }
    }
    s.splitHold = undefined;
    const text = String(input.text ?? "");
    const m = { ...h.move };
    // (Brain 043 R2: the problem opens without its lead-in only straight after her invitation — after a detour, a picture or help, the
    // lead-in is said again: dry c6 steady 18 to 20)
    if (m.afterInvite && !prev.lastMove?.workedInvite) delete m.afterInvite;
    // (v6.11 J2: the answer to her return question is the aside's own reply: no park, no second return; the held half comes now)
    s.returnAnswer = retAns ? { topic: prev.returnAsked.topic, said: text.replace(/\s+/g, " ").trim().slice(0, 80) } : undefined;
    s.returnAsked = undefined;
    if (s.returnAnswer) { m.returnReply = s.returnAnswer; m.asideAck = true; }
    const topic0 = asideTopic(text, s.ctx?.interests);
    if (ASKS_HER_TASTE.test(text)) { s.tasteAsked = { topic: String(topic0 ?? "woh"), turn: s.turn, n: (s.tasteAsked?.n ?? 0) + 1 }; m.tasteAsked = { topic: s.tasteAsked.topic, n: s.tasteAsked.n };
      // (dc-r8-director23 A2, c6 stuck 38, steering 30: the AI line always ends with her question back — on a worked step the step is held
      // for the turn after her reply, as a return holds its half; never two steps in one turn)
      if (h.move?.kind === "worked_example") {
        s.splitHold = h;
        const ret = { kind: "repair", shape: SH.uptake({ kind: "personal_share" }), tasteAsked: m.tasteAsked, ...(prev.lastMove?.scriptBeat ? { scriptBeat: prev.lastMove.scriptBeat } : {}) };
        const ui0 = { status: "your_turn" };
        s.lastMove = ret; s.moveVoiced = false; s.lastUi = ui0; s.activeItemId = undefined;
        return { state: s, move: ret, moduleCommands: [], ui: ui0, end: false, proposal: directorProposal(ret, { ui: ui0, guidance: s.guidance, purpose: s.purpose }), ...describe(s, input.kit) };
      } }
    else if (topic0 && !unsafeChildPhrase(topic0)) {
      s.later = parkGate(s, input.kit, input, { ...parkEntry({ topic: topic0, learning: false, turn: s.turn, itemOnTable: !!h.activeItemId }), share: true });
      // (dc-r8-director25 L2: a park said on a held half promises the card that half poses — step's stamping never runs on this path, and
      // an aside parked here was never due: c5-t02 steady, 24 turns)
      // (Brain 042: a park said on a held worked segment promises the worked example's own card — an asked step is no card)
      const onIt = /^stepask:(.+):\d+$/.exec(String(h.activeItemId ?? ""))?.[1];
      if (l2On() && h.activeItemId) s.later = (s.later ?? []).map((e) => (e.at === s.turn && e.share && e.servedAt == null && e.onItem === undefined ? { ...e, onItem: onIt ? `script:${onIt}:ask:worked` : h.activeItemId, parkSaid: true, said: e.said ?? text.replace(/\s+/g, " ").trim().slice(0, 80) } : e));
      // (an aside said again is returned now, once — v6.9 T1.10 — and that return ends her turn: the held half waits for the next one)
      if (s.servedNow) {
        const r = s.servedNow; s.servedNow = undefined;
        s.splitHold = h;
        const ret = { kind: "repair", shape: SH.uptake({ kind: "personal_share" }), returned: { topic: r.topic, share: !!r.share, ...(r.said ? { said: String(r.said) } : {}) } };
        if (h.move?.scriptBeat) ret.scriptBeat = prev.lastMove?.scriptBeat ?? h.move.scriptBeat;
        const ui0 = { status: "your_turn" };
        s.lastMove = ret; s.moveVoiced = false; s.lastUi = ui0; s.activeItemId = undefined;
        return { state: s, move: ret, moduleCommands: [], ui: ui0, end: false, proposal: directorProposal(ret, { ui: ui0, guidance: s.guidance, purpose: s.purpose }), ...describe(s, input.kit) };
      }
      if (s.sadAside?.turn === s.turn) m.sadAside = true;
      if (s.asideAgain?.turn === s.turn) m.asideAgain = { topic: s.asideAgain.topic, ...(s.asideAgain.returned ? { returned: true } : {}) };
    }
    s.lastMove = m; s.moveVoiced = false; s.lastUi = h.ui; s.lastContent = h.lastContent; s.activeItemId = h.activeItemId;
    const outR = problemAlone({ state: s, move: m, moduleCommands: h.moduleCommands ?? [], ui: h.ui, end: false, proposal: directorProposal(m, { ui: h.ui, guidance: s.guidance, purpose: s.purpose }), ...describe(s, input.kit) }, input);
    // (dc-r8-director25 L2: the held half said after an aside — her reply, the joint back, the part — breaks as any turn does)
    if (l2On() && !scriptFor(input.kit)?.script?.recordedRun) { const sg = segmentTurn(outR, input, 0); if (sg) return sg; }
    if (l2On() && !h.teach && !scriptFor(input.kit)?.script?.recordedRun) { const b = breakL2(outR, input, 0); if (b) return b; return splitTeach(outR, input, pointCardCap(s, input.kit)); }
    if (h.teach && workedWithCard(outR, input)) return heldCardFresh(outR, splitTeach(outR, input, pointCardCap(s, input.kit)));
    return outR;
  }
  if (c?.help || c?.request || (h.teach && (c?.flags?.dontKnow || readIntent(String(input.text ?? ""))?.type === "confused"))) return null;
  // v6.1 R9: "nahi" to the teaching half's check-in is acted on: the same teaching again, smaller (the beat's authored simpler,
  // else one sentence of its point), the card still held for the next turn; asked once, so no second check-in follows
  if (h.teach && prev.lastMove?.checkinOk && notYes(input.text) && !prev.lastMove?.smaller) {
    const s = structuredClone(prev);
    s.turn += 1;
    const simpler = simplerOfBeat(s, input.kit, prev.lastMove);
    const again = { ...carried(prev.lastMove), smaller: true, checkinOk: false, ...(simpler ? { simpler } : {}) };
    s.lastMove = again; s.moveVoiced = false;
    const ui0 = { status: "your_turn", ...(prev.lastUi?.later ? { later: prev.lastUi.later } : {}) };
    s.lastUi = ui0;
    return { state: s, move: again, moduleCommands: [], ui: ui0, end: false, proposal: directorProposal(again, { ui: ui0, guidance: s.guidance, purpose: s.purpose }), ...describe(s, input.kit) };
  }
  const s = structuredClone(prev);
  s.turn += 1;
  // P1 (dc-r8-director20, c4 offtopic: a park on a card that ended in a key was never returned while the key's split held the next
  // part): the held half is a boundary too — an aside due now is returned on a turn of its own, and the held half waits for the next
  // (dc-r8-director26 C1: the worked problem held with its first step is the problem — a return due comes before it, as before it)
  if (scriptOn() && scriptIdOf(input.kit) && !scriptFor(input.kit)?.script?.recordedRun && (!/^worked:step/.test(String(h.move?.scriptBeat?.beatId ?? "")) || !!h.move?.problemLines)) {
    const due = (s.later ?? []).find((e) => !e.servedAt && e.share && e.parkSaid && e.onItem && Number.isFinite(e.at) && s.turn > e.at && (h.activeItemId !== e.onItem || parkOverdue(s, e)));
    if (due) {
      s.later = serveLater(s.later, due.id, s.turn);
      const ret = { kind: "repair", shape: SH.uptake({ kind: "personal_share" }), returned: { topic: due.topic, share: !!due.share, ...(due.said ? { said: String(due.said) } : {}) } };
      if (prev.lastMove?.scriptBeat) ret.scriptBeat = prev.lastMove.scriptBeat;
      const ui0 = { status: "your_turn" };
      s.lastMove = ret; s.moveVoiced = false; s.lastUi = ui0; s.activeItemId = undefined;
      return { state: s, move: ret, moduleCommands: [], ui: ui0, end: false, proposal: directorProposal(ret, { ui: ui0, guidance: s.guidance, purpose: s.purpose }), ...describe(s, input.kit) };
    }
  }
  s.splitHold = undefined;
  s.lastMove = h.move; s.moveVoiced = false; s.lastUi = h.ui; s.lastContent = h.lastContent;
  if (h.activeItemId) s.activeItemId = h.activeItemId;
  const out = problemAlone({ state: s, move: h.move, moduleCommands: h.moduleCommands ?? [], ui: h.ui, end: false,
    proposal: directorProposal(h.move, { ui: h.ui, guidance: s.guidance, purpose: s.purpose }), ...describe(s, input.kit) }, input);
  // (the beat a closing half held may itself be too long: its teaching, then its card)
  if (h.teach) return workedWithCard(out, input) ? heldCardFresh(out, splitTeach(out, input, pointCardCap(s, input.kit))) : out;
  // (dc-r8-director25 L2: the held half breaks as any turn does)
  // (a held move that says a return: brain/say.js says the return alone and holds the rest for the turn after her reply)
  if (l2On() && !scriptFor(input.kit)?.script?.recordedRun && h.move?.returned?.topic) return out;
  if (l2On() && !scriptFor(input.kit)?.script?.recordedRun) { const sg = segmentTurn(out, input, 0); if (sg) return sg; }
  if (l2On() && !scriptFor(input.kit)?.script?.recordedRun) { const b = breakL2(out, input, 0); if (b) return b; return splitTeach(out, input, pointCardCap(s, input.kit)); }
  return splitTeach(out, input, s.ctx?.plainWords ? 45 : 60);
}

/** Round 3: the most characters a move shape may grow to by OPTIONAL notes (the MOVE section cap is 260 tokens at 3.5
 *  characters per token, less its two header lines and a margin for the address-register note on a voice lane). */
const SHAPE_ROOM = 760;
// round 3 fix (experience B6 / non-blocking 1): the child's interest frames an example only where the KIT says the idea
// really lives (kit.interestContexts, authored per topic). Every opener was forced through it: "Photosynthesis… jaise
// cricket mein bat sunlight se energy leta hai", "cricket cake", "football ke equal portions". A broad interest maps to
// the words a context uses for it; no match = the kit's own contexts frame it (the hook already lists them).
const INTEREST_WORDS = {
  cricket: ["cricket", "sport", "sports", "match", "team", "ground", "bat", "ball"], football: ["football", "sport", "sports", "match", "team", "ground", "goal"],
  cooking: ["cooking", "kitchen", "recipe", "recipes", "roti", "food", "sweets"], kitchen: ["kitchen", "cooking", "recipe", "food"],
  drawing: ["drawing", "art", "colour", "colours", "rangoli", "painting"], painting: ["painting", "art", "colour", "colours", "rangoli", "drawing"], art: ["art", "drawing", "painting", "rangoli", "colour"],
  animals: ["animal", "animals", "pets", "zoo", "farm", "birds"], pets: ["pet", "pets", "animal", "animals"], music: ["music", "song", "songs", "drum", "instrument"],
  games: ["game", "games"], gaming: ["game", "games"], dance: ["dance", "music"], gardening: ["garden", "plants", "farming"], plants: ["garden", "plants", "farming"],
  space: ["space", "planet", "planets", "stars", "rocket", "missions"], cars: ["car", "cars", "road", "travel"], trains: ["train", "trains", "railway", "travel"],
};
export function interestFor(kit, interests, i = 0) {
  const list = (interests ?? []).filter(Boolean);
  const pick = list[i] ?? list[0];
  const contexts = (kit?.interestContexts ?? []).map((c) => String(c).toLowerCase());
  if (!pick) return undefined;
  if (!contexts.length) return pick;                       // a kit with no authored contexts: as before
  const fits = (x) => {
    const w = String(x).toLowerCase().trim();
    const words = INTEREST_WORDS[w] ?? [w];
    return contexts.some((c) => words.some((k) => new RegExp(`(?<![\\p{L}])${k.replace(/[^\p{L}\p{N} ]/gu, "")}`, "u").test(c)));
  };
  return fits(pick) ? pick : list.find(fits);
}
/** round 3 fix (experience B7): drop shapes.js OPTIONAL_CLAUSES, least important first, until the shape fits SHAPE_ROOM. */
export function fitShape(shape, room = SHAPE_ROOM) {
  let out = String(shape ?? "");
  for (const re of SH.OPTIONAL_CLAUSES) { if (out.length <= room) break; out = out.replace(re, ""); }
  return out;
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
// r4 K-P11 (stream K, for 4A's intake): the subject words the intake card's trail prints (chrome is English, G-EN-1)
const INTAKE_SUBJECT = { maths: "Maths", science: "Science", evs: "EVS", english: "English", hindi: "Hindi", sst: "Social Science", social: "Social Science" };

/**
 * PURE. r4 K-P11: what the child's screen may show of the session-first intake (BUILD-SPEC §3.2), from the intake beat's own
 * state and the syllabus graph ONLY: never a model's words, no database read, nothing added to the prompt.
 *   phase   "ask" (her opening / a follow-up) · "which" (one of two chapters) · "mapped" (the confirm probe on the picked topic)
 *           · "plan" (the decided segment: the one-line agenda)
 *   mapped  the topic the intake mapped the child's words to: its title, and the trail class · subject · chapter (getTopic)
 *   plan    the segments the session opened, purpose only (no titles: TUTOR-MODEL "3 dots"); a foundation segment carries the
 *           asked topic as its `then`
 * Exported for tests; null when the move is not an intake move.
 * @returns {{ phase: "ask"|"which"|"mapped"|"plan", mapped?: { topicId: string, title: string, trail: string[] }, plan?: { segments: { purpose: string }[] } } | null}
 */
export function intakeUi(s, p, move) {
  if (!p?.intake || !move) return null;
  const st = s.intake ?? {};
  const phase = move.kind === "intake_agenda" ? "plan" : move.kind === "intake_confirm" ? "mapped" : st.stage === "which" ? "which" : "ask";
  const out = { phase };
  const seg = phase === "plan" ? s.session?.segments?.at(-1) ?? null : null;
  const topicId = phase === "plan" ? (seg?.then?.topicId ?? seg?.topicId ?? p.segment?.topicId ?? null) : phase === "mapped" ? (st.pick?.topicId ?? null) : null;
  const t = topicId ? getTopic(topicId) : null;
  if (t) out.mapped = { topicId: t.id, title: t.title, trail: [`Class ${t.classLevel}`, INTAKE_SUBJECT[t.subject] ?? t.subject, t.chapter.title] };
  if (seg) out.plan = { segments: [{ purpose: seg.purpose }, ...(seg.then?.purpose ? [{ purpose: seg.then.purpose }] : [])] };
  return out;
}

function uiFor(s, p, move, item, kit) {
  const ui = { status: "your_turn" };
  const intake = intakeUi(s, p, move);
  if (intake) ui.intake = intake;
  const topic = getTopic(s.topicId);
  const board = p.whiteboard ?? (item ? anchorOf(item, s.ctx.lang) : null);
  if (board && !isObjective(board.value, kit, topic)) ui.whiteboard = board;
  if (p.chips?.length) ui.chips = p.chips;
  ui.phase = move.kind === "wrap" || s.phase === "done" ? "wrap" : s.phase;
  ui.handover = move.kind === "wrap" ? "finish" : ui.chips ? "choice" : "answer";
  const asking = item && s.pendingWhy !== item.id && !["safeguard", "wrap", "break", "teachback"].includes(move.kind);
  if (asking) {
    // (v4: a script card's authored prompt is shown and read whole, never cut to its last sentence: director6 c5-t01 cut
    // 10/10 then-cards and the child never heard their setup; v2.2 caps them at 120 characters at the source)
    const full = String(promptFor(item, s.ctx.lang) ?? "").replace(/\s+/g, " ").trim();
    const text0 = isScriptCard(item) ? full : askText(full);
    // (dc-r8-director20 W1 and G3, retiring v6.1 R10: a scripted card is an authored sentence and is shown and said as written, in the
    // Hindi mode too — code swapped "line" for "rekha" inside the card, which the authoredWhole predicate flagged on 65 dry turns. The
    // one-term-per-idea rule is met in the script's data, not by code)
    const text = text0;
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
  // (Brain 042: a quick question's or an asked step's answer is no card evidence — the walk records it on the beat, state.beatEvidence)
  if (item.quick) return [];
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
