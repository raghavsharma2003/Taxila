// Round 8 (dc-r8-one-reader-with-because, docs/design/round8/PLAN.md Decision 2): the ONE reader that turns what is known
// about a child into a scripted lesson's choices, and says why. PURE: no I/O, no model call, no clock (the caller passes
// `now`). Every choice that departs from the script's default carries a `because` record naming the learner fact; a choice
// with no fact behind it is the script's default and has no record. A child with no history gets exactly the default and an
// empty `because`.
//
// ── Input shape (what the lesson start passes; fixtures in tests/fixtures/knows/ until the learner session lands it) ──
//   script     the topic's lesson script (data/lesson-scripts/<topicId>.json): { topicId, skills: [{ skillId, hook, explain,
//              workedExample, checks, remediation, ladder, bridgeToNext }] }
//   kit        the topic's kit: { topicId, skills: [{ id, title }], items: [{ id, skillId, kind, difficulty, answer,
//              diagnostic }], misconceptions: [{ id, belief }] }
//   skills     { [skillId]: { status, delayedPassed, attempts?, correctUnaided? } }
//              status: the ledger display ("unseen" | "introduced" | "practising" | "learned_today" | "mastered" | "durable")
//              or "due" (learner/live.js legacyStatus). delayedPassed: the ledger's sk.flags.delayed (a correct delayed check
//              >= 2 learning days after the anchor, new form, no hints). NOT in today's snapshotFromKt: the learner session adds it.
//   history    { [skillId]: itemId[] } items she has answered (lesson.js `history`)
//   mixups     her open mix-ups, learner/kt/misconception.js misconceptionView rows: [{ id, p, needsVerify, hits }]
//   brief      conductor/slot.js lessonBriefOf, cut at lesson start with or without a day plan: { opener, successFirst,
//              newSkillBudget, prereqCheck?: { skillId, forTopicId, prereqTopicId }, adaptTrace: ["R1", "R15", …] }
//   interests  her interests (registry ids or labels), already empty when the memory consent is off
//   memory     { likes: boolean (the "remember what she likes" consent), lastActiveDay: "YYYY-MM-DD" | null }
//   now        ms or ISO; used only to measure the gap since lastActiveDay
//
// ── Output (planFor) ──
//   { allKnown, opener, hookSlot, compress, firstCard, checkOrder, ladderOrder, prereqCheck, because }
//   because: [{ choice, on, fact, source }]  choice ∈ CHOICES; on: the skill / card / topic it applies to; fact: a small
//   object (kind + ids) that knows-words.js turns into the parent's words; source: where the fact came from.
//
// Choices, in build order (PLAN.md K1-K8): K1 compress · K2 success first · K3 her open mix-up's check first, and the
// remediation by the mix-up the classifier named · K4 prerequisite check ·
// K5 revision topic · K6 hook by interest · K7 opener after a gap · K8 scripted topic first. K5 and K8 are topic choice,
// made before a lesson exists (topicFor); K3's classifier tier is per turn (remedyNow).

import { interestOf } from "../../shared/interests.js";

export const CHOICES = Object.freeze(["compress", "compress_fallback", "allKnown", "firstCard", "ladderOrder", "checkOrder", "remedy", "prereqCheck", "revision", "hookSlot", "opener", "topic"]);

/** Ledger displays that count as learned (ledger.js DISPLAY rank >= learned_today), plus legacyStatus's "due". */
const LEARNED = new Set(["learned_today", "mastered", "durable", "due"]);
/** conductor/config.js PLAN.reanchorGapDays (copied, not imported: knows.js reads no conductor module). */
export const REANCHOR_GAP_DAYS = 7;
/** learner/kt/misconception.js VERIFY_P: a mix-up this likely is open enough to steer a remediation. */
export const OPEN_MIXUP_P = 0.7;
/** Kit item kinds a warm-up card can be (a single keyed answer; never a teach-back). */
const CARD_KINDS = new Set(["practice", "retrieval", "near_transfer"]);

// ───────────── card ids (the same strings as director/script.js scriptAskItem / scriptCheckItem; a test pins them) ─────────────
export const checkCardId = (skillId, checkId) => `script:${skillId}:${checkId}`;
export const askCardId = (skillId, beatId) => `script:${skillId}:ask:${beatId}`;

const rec = (choice, on, fact, source) => ({ choice, on, fact, source });
const scriptSkills = (script, kit) => {
  const by = new Map((script?.skills ?? []).map((s) => [s.skillId, s]));
  const order = (kit?.skills ?? []).map((s) => s.id).filter((id) => by.has(id));
  for (const id of by.keys()) if (!order.includes(id)) order.push(id);
  return order.map((id) => by.get(id));
};
const dayMs = 86_400_000;
const dayNum = (d) => { const t = Date.parse(String(d ?? "").slice(0, 10)); return Number.isFinite(t) ? Math.floor(t / dayMs) : null; };
const istDay = (now) => { const t = typeof now === "number" ? now : Date.parse(String(now ?? "")); return Number.isFinite(t) ? Math.floor((t + 5.5 * 3_600_000) / dayMs) : null; };

/** The walk's default beats for a skill (director/script.js walkBeats). */
export const defaultBeats = (sk, { hook = false } = {}) =>
  [...(hook ? ["hook"] : []), ...(sk?.explain ?? []).map((b) => `explain:${b.id}`), "worked", ...(sk?.checks ?? []).map((c) => `check:${c.id}`)];
/** Every keyed card of a skill's script with its authored target: [{ cardId, targets }]. */
export function cardsOf(sk) {
  const out = [];
  for (const b of sk?.explain ?? []) if (b.ask) out.push({ cardId: askCardId(sk.skillId, b.id), targets: b.ask.targets ?? null });
  if (sk?.workedExample?.yourStep) out.push({ cardId: askCardId(sk.skillId, "worked"), targets: sk.workedExample.yourStep.targets ?? null });
  for (const c of sk?.checks ?? []) out.push({ cardId: checkCardId(sk.skillId, c.id), targets: c.targets ?? null });
  return out;
}

// ───────────── K1: compress a known skill ─────────────
/** Skills she holds as learned with a passed delayed check, and that have a check card to open on. */
export function compressOf({ script, kit, skills = {}, checkOrder = {} }) {
  const compress = [], because = [];
  for (const sk of scriptSkills(script, kit)) {
    const st = skills[sk.skillId];
    if (!st || !LEARNED.has(st.status) || st.delayedPassed !== true || !sk.checks?.length) continue;
    compress.push(sk.skillId);
    because.push(rec("compress", sk.skillId, { kind: "learned_delayed_check", skillId: sk.skillId, status: st.status, firstCheck: checksOf({ checkOrder }, sk)[0].id },
      "kt_skill_state.display + flags.delayed"));
  }
  return { compress, because };
}
/** A skill's checks in the order the plan asks them (K3's probe can put one first), else as authored. */
export function checksOf(plan, sk) {
  const order = plan?.checkOrder?.[sk.skillId];
  const checks = sk?.checks ?? [];
  if (!order) return checks;
  return [...order.map((id) => checks.find((c) => c.id === id)).filter(Boolean), ...checks.filter((c) => !order.includes(c.id))];
}
const planBeats = (plan, sk, { hook = false } = {}) =>
  [...(hook ? ["hook"] : []), ...(sk?.explain ?? []).map((b) => `explain:${b.id}`), "worked", ...checksOf(plan, sk).map((c) => `check:${c.id}`)];
/** The beats a skill is walked with under a plan: a compressed skill opens at its first check card (no hook). */
export function beatsFor(plan, sk, { hook = false } = {}) {
  if (plan?.compress?.includes(sk.skillId) && sk.checks?.length) return [`check:${checksOf(plan, sk)[0].id}`];
  return planBeats(plan, sk, { hook });
}
/**
 * After a compressed skill's opening check. Right: the skill is done (its other checks and its ladder are not walked).
 * Anything else: the full unit (explain beats, the worked example, the other checks; the missed check is not re-posed) and
 * the fallback is itself a because record.
 * @returns {{ done: boolean, beats: string[], because: object|null }}
 */
export function afterCompressCheck(plan, sk, verdict) {
  if (!plan?.compress?.includes(sk.skillId) || !sk.checks?.length) return { done: false, beats: [], because: null };
  if (verdict === "right") return { done: true, beats: [], because: null };
  const c0 = checksOf(plan, sk)[0];
  const first = `check:${c0.id}`;
  // (the miss is an ordinary miss in the evidence: no special weight; the record only explains the walk)
  return { done: false, beats: planBeats(plan, sk).filter((b) => b !== first),
    because: rec("compress_fallback", sk.skillId, { kind: "missed_compress_check", skillId: sk.skillId, cardId: checkCardId(sk.skillId, c0.id), verdict: verdict ?? "unclear" }, "this lesson's answer") };
}

// ───────────── K2 and K7: the first card (success first; the opener after a gap) ─────────────
/** Why success-first fires, from the brief's rule trace (R1: the last lesson closed badly; R15: the first week). */
function successFirstFact(brief) {
  if (!brief?.successFirst) return null;
  const tr = brief.adaptTrace ?? [];
  const kind = tr.includes("R1") ? "closed_badly" : tr.includes("R15") ? "first_week" : "success_first";
  return { kind, source: kind === "closed_badly" ? "brief.successFirst (R1: adapt.closes)" : kind === "first_week" ? "brief.successFirst (R15: learner.firstWeek)" : "brief.successFirst" };
}
/** The gap that makes the opener a light re-anchor: the brief's opener, else the days since memory.lastActiveDay. */
function gapFact(brief, memory, now) {
  if (brief?.opener === "reanchor_light") return { kind: "gap", days: null, source: "brief.opener (R8: counters.lastActiveDay)" };
  if (brief?.opener && brief.opener !== "reanchor_light") return null;
  const last = dayNum(memory?.lastActiveDay), today = istDay(now);
  if (last == null || today == null) return null;
  const days = today - last;
  return days >= REANCHOR_GAP_DAYS ? { kind: "gap", days, source: "memory.lastActiveDay" } : null;
}
/**
 * The easiest kit item she has not answered, of a skill in this lesson she has met (status not unseen): by difficulty, then
 * items outside every script ladder (so the ladder keeps its cards), skill order and id. null when she met nothing.
 */
export function easiestUnseen({ script, kit, skills = {}, history = {} }) {
  const order = (kit?.skills ?? []).map((s) => s.id);
  const met = new Set(order.filter((id) => skills[id] && skills[id].status && skills[id].status !== "unseen"));
  if (!met.size) return null;
  const seen = new Set(Object.values(history ?? {}).flat());
  const ladder = new Set((script?.skills ?? []).flatMap((s) => (s.ladder ?? []).map((r) => r.itemId)));
  const c = (kit?.items ?? []).filter((i) => met.has(i.skillId) && CARD_KINDS.has(i.kind) && !i.diagnostic && i.answer != null && String(i.answer).trim() && !seen.has(i.id))
    .sort((a, b) => (a.difficulty ?? 9) - (b.difficulty ?? 9) || ladder.has(a.id) - ladder.has(b.id) || order.indexOf(a.skillId) - order.indexOf(b.skillId) || (a.id < b.id ? -1 : 1));
  return c[0] ?? null;
}
/**
 * K2 success first and K7 opener after a gap. Both put one easy card she can do at the head of the warm-up (after any due
 * delayed check: rj-truth-retention-order-starves-check). K2 also orders the walked ladders easiest first.
 */
export function firstCardOf({ script, kit, skills = {}, history = {}, brief = null, memory = null, now }) {
  const sf = successFirstFact(brief), gap = gapFact(brief, memory, now);
  const out = { opener: gap ? "reanchor_light" : "standard_retrieval", firstCard: null, ladderOrder: {}, because: [] };
  if (!sf && !gap) return out;
  const item = easiestUnseen({ script, kit, skills, history });
  if (item) {
    out.firstCard = item.id;
    if (sf) out.because.push(rec("firstCard", item.id, { kind: sf.kind, itemId: item.id, skillId: item.skillId, difficulty: item.difficulty ?? null }, sf.source));
    if (gap) out.because.push(rec("opener", item.id, { kind: "gap", days: gap.days, itemId: item.id, skillId: item.skillId }, gap.source));
  }
  if (sf) {
    const diff = new Map((kit?.items ?? []).map((i) => [i.id, i.difficulty ?? 9]));
    for (const sk of scriptSkills(script, kit)) {
      const authored = (sk.ladder ?? []).map((r) => r.itemId);
      const sorted = authored.map((id, k) => ({ id, k })).sort((a, b) => (diff.get(a.id) ?? 9) - (diff.get(b.id) ?? 9) || a.k - b.k).map((x) => x.id);
      if (sorted.some((id, k) => id !== authored[k])) {
        out.ladderOrder[sk.skillId] = sorted;
        out.because.push(rec("ladderOrder", sk.skillId, { kind: sf.kind, skillId: sk.skillId, order: sorted }, sf.source));
      }
    }
  }
  return out;
}
/** The ladder a skill is walked with under a plan (the authored ladder unless K2 reordered it). */
export const ladderFor = (plan, sk) => plan?.ladderOrder?.[sk.skillId] ?? (sk.ladder ?? []).map((r) => r.itemId);
/**
 * allKnown (main's ruling 2026-11-10): the lesson does not end early or change topic; after every skill's check is right it
 * walks the last skill's ladder from its hardest rung down (kit difficulty, authored order among equals).
 */
export function hardestFirst(sk, kit) {
  const diff = new Map((kit?.items ?? []).map((i) => [i.id, i.difficulty ?? 0]));
  return (sk?.ladder ?? []).map((r, k) => ({ id: r.itemId, k })).sort((a, b) => (diff.get(b.id) ?? 0) - (diff.get(a.id) ?? 0) || a.k - b.k).map((x) => x.id);
}

// ───────────── K3: remediation by her real mix-up; her open mix-up is asked about first ─────────────
const openIds = (mixups) => (mixups ?? []).filter((m) => m && (m.needsVerify || (m.p ?? 0) >= OPEN_MIXUP_P)).sort((a, b) => (b.p ?? 0) - (a.p ?? 0) || (a.id < b.id ? -1 : 1)).map((m) => m.id);
/**
 * The ledger changes what is ASKED, never what is remediated (main's ruling 2026-11-10: a ledger mix-up remediated on a wrong
 * answer that did not show it answers the wrong thing). For each skill, the first check whose authored target is her most
 * likely open mix-up (needsVerify or p >= 0.7) is posed first among the skill's checks. A skill whose first check already
 * targets it is unchanged.
 */
export function checkOrderOf({ script, kit, mixups = [] }) {
  const open = openIds(mixups), checkOrder = {}, because = [];
  if (!open.length) return { checkOrder, because };
  const p = new Map((mixups ?? []).map((m) => [m.id, m.p ?? null]));
  for (const sk of scriptSkills(script, kit)) {
    const checks = sk.checks ?? [];
    for (const id of open) {
      const c = checks.find((x) => x.targets === id);
      if (!c) continue;
      if (c !== checks[0]) {
        checkOrder[sk.skillId] = [c.id, ...checks.filter((x) => x !== c).map((x) => x.id)];
        because.push(rec("checkOrder", sk.skillId, { kind: "open_mixup", misconceptionId: id, p: p.get(id), cardId: checkCardId(sk.skillId, c.id), skillId: sk.skillId, order: checkOrder[sk.skillId] }, "ledger"));
      }
      break;
    }
  }
  return { checkOrder, because };
}
/**
 * The remediation for a wrong answer on a scripted card, at the turn: the mix-up the classifier just named (when this skill
 * has a remediation for it), else the card's authored target (the default: no record).
 * @param {object} plan  planFor's result (or null; unused today, kept so the call site does not change)
 * @param {{ id: string, skillId: string, scriptCheck?: { targets }, scriptAsk?: { targets } }} card
 * @param {{ misconceptionId?: string } | null} cls
 * @param {object} sk  the card's skill script
 * @returns {{ targets: string|null, because: object|null }}
 */
export function remedyNow(plan, card, cls, sk) {
  const authored = card?.scriptCheck?.targets ?? card?.scriptAsk?.targets ?? null;
  const has = new Set((sk?.remediation ?? []).map((r) => r.targets));
  const named = cls?.misconceptionId ?? null;
  if (named && named !== authored && has.has(named)) {
    return { targets: named, because: rec("remedy", card.id, { kind: "classified_mixup", misconceptionId: named, authored }, "cls.misconceptionId") };
  }
  return { targets: authored, because: null };
}

// ───────────── K4: prerequisite check ─────────────
/** A skill she is spinning on gets one check of its weakest prerequisite in the warm-up (the caller resolves its items). */
export function prereqCheckOf({ brief = null, kit = null }) {
  const pc = brief?.prereqCheck;
  if (!pc?.prereqTopicId || !pc.skillId) return { prereqCheck: null, because: [] };
  // the prerequisite skill itself, when this kit names it (the spinning skill is in this topic); else the caller has the topic only
  const pre = (kit?.skills ?? []).find((x) => x.id === pc.skillId)?.prereqSkillIds?.find((id) => String(id).startsWith(`${pc.prereqTopicId}-`)) ?? null;
  return { prereqCheck: { skillId: pc.skillId, topicId: pc.prereqTopicId, prereqSkillId: pre },
    because: [rec("prereqCheck", pc.prereqTopicId, { kind: "wheel_spin", skillId: pc.skillId, forTopicId: pc.forTopicId ?? null, prereqTopicId: pc.prereqTopicId }, "brief.prereqCheck (R5: kt.wheelSpin)")] };
}

// ───────────── K6: hook by interest ─────────────
/**
 * The near interests of each registry id, in order: where a hook with no slot for her interest goes instead. Every onboarding
 * tile reaches a slot in the first skill's hook of each pilot script. Moves into shared/interests.js as `near` by docs/patches/to-learning
 * (read from the registry first, this table second).
 */
export const NEAR = Object.freeze({
  cricket: ["football", "games", "drawing"], football: ["cricket", "games", "drawing"], space: ["vehicles", "nature", "drawing"],
  animals: ["nature", "drawing", "games"], drawing: ["building", "games"], music: ["dance", "games", "drawing"],
  dance: ["music", "games", "drawing"], cooking: ["nature", "drawing", "games"], trains: ["vehicles", "games", "drawing"],
  stories: ["drawing", "animals", "games"], building: ["drawing", "games"], nature: ["animals", "cricket", "drawing"],
  dinosaurs: ["animals", "nature", "games"], cartoons: ["games", "drawing"], games: ["cricket", "drawing"], vehicles: ["trains", "games", "drawing"],
});
const nearOf = (id) => interestOf(id)?.near ?? NEAR[id] ?? [];
/**
 * The hook slot for her interests: the first interest (her order) with a slot of its own, else the first whose near list
 * reaches a slot. null → the script's slot 0 (the default; no record).
 * @returns {{ slot: object, index: number, interest: string, via: "exact"|"near" } | null}
 */
export function slotFor(sk, interests = []) {
  const slots = sk?.hook?.interestSlots ?? [];
  if (!slots.length) return null;
  const ids = [...new Set((interests ?? []).map((x) => interestOf(x)?.id ?? String(x ?? "").trim().toLowerCase()).filter(Boolean))];
  const at = (want) => slots.findIndex((s) => String(s?.interest ?? "").toLowerCase() === want);
  for (const id of ids) { const i = at(id); if (i >= 0) return { slot: slots[i], index: i, interest: id, via: "exact" }; }
  for (const id of ids) for (const n of nearOf(id)) { const i = at(n); if (i >= 0) return { slot: slots[i], index: i, interest: id, via: "near" }; }
  return null;
}
export function hookOf({ script, kit, interests = [], memory = null }) {
  const sk0 = scriptSkills(script, kit)[0];
  const mine = memory && memory.likes === false ? [] : interests;
  const hit = sk0 ? slotFor(sk0, mine) : null;
  if (!hit) return { hookSlot: null, because: [] };
  return { hookSlot: { skillId: sk0.skillId, index: hit.index, interest: hit.slot.interest },
    because: [rec("hookSlot", sk0.skillId, { kind: "interest", interest: hit.interest, slotInterest: hit.slot.interest, via: hit.via, index: hit.index,
      ...(hit.via === "near" ? { path: `${hit.interest} → ${hit.slot.interest}` } : {}) }, hit.via === "near" ? "child.interests + interest registry near" : "child.interests")] };
}

// ───────────── the plan ─────────────
/**
 * One call at lesson start. See the header for the input and output shapes.
 */
export function planFor({ script, kit, skills = {}, history = {}, mixups = [], brief = null, interests = [], memory = null, now } = {}) {
  const k3 = checkOrderOf({ script, kit, mixups });
  const k1 = compressOf({ script, kit, skills, checkOrder: k3.checkOrder });
  const k27 = firstCardOf({ script, kit, skills, history, brief, memory, now });
  // a compressed skill's ladder is not walked: K2's reorder of it is no choice at all
  for (const id of k1.compress) delete k27.ladderOrder[id];
  const k27because = k27.because.filter((b) => !(b.choice === "ladderOrder" && k1.compress.includes(b.on)));
  const k4 = prereqCheckOf({ brief, kit });
  const k6 = hookOf({ script, kit, interests, memory });
  // every scripted skill compresses: a lesson of a handful of turns. Exposed; the caller decides (the ladder's hardest
  // rungs, or the next topic)
  const sks = scriptSkills(script, kit);
  const allKnown = sks.length > 0 && sks.every((sk) => k1.compress.includes(sk.skillId));
  const k0 = allKnown ? [rec("allKnown", script?.topicId ?? kit?.topicId ?? null, { kind: "all_learned_delayed_check", skillIds: k1.compress }, "kt_skill_state.display + flags.delayed")] : [];
  return {
    topicId: script?.topicId ?? kit?.topicId ?? null,
    allKnown,
    opener: k27.opener,
    hookSlot: k6.hookSlot,
    compress: k1.compress,
    firstCard: k27.firstCard,
    checkOrder: k3.checkOrder,
    ladderOrder: k27.ladderOrder,
    prereqCheck: k4.prereqCheck,
    because: [...k1.because, ...k0, ...k27because, ...k3.because, ...k4.because, ...k6.because],
  };
}

// ───────────── K5 and K8: the topic (before a lesson exists) ─────────────
/**
 * K5: no new skill before a test or in the first week (brief.newSkillBudget 0) → a topic she has met, if there is one.
 * K8: among the equally ranked candidates, a topic with a lesson script first.
 * @param {{ candidates: { topicId: string, status: string, rank: number }[], brief?: object, scripted?: Iterable<string> }} a
 *   candidates in the caller's order (content/next-topic.js); rank: lower is more due; status: topicStatus
 * @returns {{ topicId: string|null, mode: "teach"|"review", because: object[] }}
 */
export function topicFor({ candidates = [], brief = null, scripted = [] } = {}) {
  const has = new Set(scripted);
  const def = candidates[0] ?? null;
  if (!def) return { topicId: null, mode: "teach", because: [] };
  const because = [];
  let pool = candidates, mode = "teach";
  if (brief?.newSkillBudget === 0) {
    const met = candidates.filter((c) => c.status && c.status !== "unseen");
    if (met.length) {
      pool = met; mode = "review";
      if (def.status === "unseen" || !def.status) {
        const tr = brief.adaptTrace ?? [];
        because.push(rec("revision", met[0].topicId, { kind: tr.includes("R15") ? "first_week" : "test_soon", insteadOf: def.topicId }, "brief.newSkillBudget"));
      }
    }
  }
  const best = Math.min(...pool.map((c) => c.rank ?? 0));
  const tied = pool.filter((c) => (c.rank ?? 0) === best);
  let pick = tied[0];
  const s = tied.find((c) => has.has(c.topicId));
  if (s && s !== pick) {
    because.push(rec("topic", s.topicId, { kind: "scripted", insteadOf: pick.topicId }, "data/lesson-scripts"));
    pick = s;
  }
  if (because[0]?.choice === "revision" && because[0].on !== pick.topicId) because[0] = { ...because[0], on: pick.topicId };
  return { topicId: pick.topicId, mode, because };
}

// ───────────── B: the predicate (tests): a walk never departs from the script without a because ─────────────
/**
 * The script's default walk as card/beat keys, mirroring director/state.js poseNext at round 8's start: each scripted skill
 * in kit order (the first with its hook), its explain beats, worked example and checks; then the LAST skill's ladder (the
 * walk reaches the kit ladder only once every scripted skill has been walked).
 */
export function defaultWalk(script, kit) {
  const sks = scriptSkills(script, kit);
  const keys = sks.flatMap((sk, k) => defaultBeats(sk, { hook: k === 0 }).map((b) => `${sk.skillId}|${b}`));
  const last = sks.at(-1);
  if (last) keys.push(...(last.ladder ?? []).map((r) => `${last.skillId}|ladder:${r.itemId}`));
  return keys;
}
/** The walk the because list explains: the default with each record applied (compress, its fallback, ladder order). */
export function expectedWalk(script, kit, because = []) {
  const sks = scriptSkills(script, kit);
  const has = (choice, on) => because.some((b) => b.choice === choice && b.on === on);
  const plan = { compress: sks.filter((sk) => has("compress", sk.skillId)).map((sk) => sk.skillId),
    ladderOrder: Object.fromEntries(because.filter((b) => b.choice === "ladderOrder").map((b) => [b.on, b.fact?.order ?? []])),
    checkOrder: Object.fromEntries(because.filter((b) => b.choice === "checkOrder").map((b) => [b.on, b.fact?.order ?? []])) };
  const keys = [];
  sks.forEach((sk, k) => {
    let beats = beatsFor(plan, sk, { hook: k === 0 });
    if (plan.compress.includes(sk.skillId) && has("compress_fallback", sk.skillId)) beats = [...beats, ...afterCompressCheck(plan, sk, "wrong").beats];
    keys.push(...beats.map((b) => `${sk.skillId}|${b}`));
  });
  const last = sks.at(-1);
  const lastDone = last && plan.compress.includes(last.skillId) && !has("compress_fallback", last.skillId);
  if (last && !lastDone) keys.push(...ladderFor(plan, last).map((id) => `${last.skillId}|ladder:${id}`));
  else if (last && because.some((b) => b.choice === "allKnown")) keys.push(...hardestFirst(last, kit).map((id) => `${last.skillId}|ladder:${id}`));
  return keys;
}
/**
 * Throws when a walk departs from the script's default order or default pick with no matching because record.
 * @param {{ script, kit, because: object[], events: object[] }} a
 *   events, in order: { kind: "beat", skillId, beat } (beat: "hook" | "explain:<id>" | "worked" | "check:<id>" | "ladder:<itemId>"),
 *   { kind: "hook", skillId, index } (the hook slot used), { kind: "first", itemId } (a card put first in the warm-up),
 *   { kind: "prereq", topicId }, { kind: "remedy", cardId, targets, authored }. Other kinds (warm-up, reposes, asides) are
 *   not script choices and are ignored. The walk may stop early (the clock, the wrap): a prefix of the expected walk passes.
 *   Once the expected walk is spent, later cards are the kit's own practice (director/items.js selectNext) and are not checked.
 * @returns {true}
 */
export function assertWalkExplained({ script, kit, because = [], events = [] }) {
  const fail = (n, why) => { throw new Error(`walk departs from the script with no because record at event ${n}: ${why}`); };
  const has = (choice, on) => because.some((b) => b.choice === choice && (on === undefined || b.on === on));
  const expected = expectedWalk(script, kit, because);
  const seenItems = new Set();
  const seenKeys = new Set();
  let at = 0;
  events.forEach((e, n) => {
    if (e.kind === "first") { if (!has("firstCard", e.itemId) && !has("opener", e.itemId)) fail(n, `card ${e.itemId} put first`); seenItems.add(e.itemId); return; }
    if (e.kind === "prereq") { if (!has("prereqCheck", e.topicId)) fail(n, `prerequisite check of ${e.topicId}`); return; }
    if (e.kind === "remedy") { if (e.targets !== e.authored && !has("remedy", e.cardId)) fail(n, `remediation ${e.targets} for ${e.cardId} (authored ${e.authored})`); return; }
    if (e.kind === "hook") { if ((e.index ?? 0) !== 0 && !has("hookSlot", e.skillId)) fail(n, `hook slot ${e.index} for ${e.skillId}`); return; }
    if (e.kind !== "beat") return;
    const key = `${e.skillId}|${e.beat}`;
    if (seenKeys.has(key)) return; // a re-posed card
    if (at >= expected.length) return; // the script's walk is spent: what follows is the kit's own practice, not a script choice
    // an expected card already posed in another role (the warm-up's first card) is not skipped
    while (at < expected.length && expected[at] !== key && seenItems.has(String(expected[at].split("|ladder:")[1] ?? ""))) at += 1;
    if (expected[at] !== key) fail(n, `got ${key}, the script's walk${because.length ? " (with its because records)" : ""} expects ${expected[at] ?? "nothing more"}`);
    seenKeys.add(key);
    if (e.beat.startsWith("ladder:")) seenItems.add(e.beat.slice(7));
    at += 1;
  });
  return true;
}
