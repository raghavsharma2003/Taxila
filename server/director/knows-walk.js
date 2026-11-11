// Round 8 part D: knows.js's plan applied to the live script walk (director/state.js) and the lesson start (routes/lesson.js).
// Each function is one call site's whole logic, so state.js keeps one short line per choice. With no plan on the state
// (s.knows undefined: a lesson started before round 8, an Ask, a practice set) every function gives the walk's own default.
// Every choice that departs from the script's default records its because once, with the turn it fired on, in
// s.knowsApplied; the turn route writes the new ones as decision_record rows (knowsDecisionsOf).
import { buildPracticeQueue } from "./items.js";
import { planFor, practicePlanOf, beatsFor, afterCompressCheck, ladderFor, hardestFirst, remedyNow, openCheckOf, checkCardId } from "./knows.js";

/** Record a because the walk acted on (once per choice and target). */
export function noteBecause(s, rec) {
  if (!rec) return;
  const list = s.knowsApplied ?? (s.knowsApplied = []);
  if (list.some((x) => x.choice === rec.choice && x.on === rec.on)) return;
  list.push({ ...rec, turn: s.turn ?? 0 });
}
const planned = (s, choice, on) => (s.knows?.because ?? []).find((b) => b.choice === choice && b.on === on) ?? null;

/** walkStart: the skill's beats and ladder under the plan. Returns null with no plan (the caller keeps walkBeats). */
export function knowsBeats(s, kit, sk, { hook = false } = {}) {
  const plan = s.knows;
  if (!plan) return null;
  const compressed = plan.compress?.includes(sk.skillId) && sk.checks?.length;
  const beats = beatsFor(plan, sk, { hook });
  if (compressed) noteBecause(s, planned(s, "compress", sk.skillId));
  if (plan.checkOrder?.[sk.skillId]) noteBecause(s, planned(s, "checkOrder", sk.skillId));
  const ladder = compressed ? [] : ladderFor(plan, sk);
  if (!compressed && plan.ladderOrder?.[sk.skillId]) noteBecause(s, planned(s, "ladderOrder", sk.skillId));
  return { beats, ladder, ...(compressed ? { compress: { cardId: checkCardId(sk.skillId, openCheckOf(plan, sk).id), done: false } } : {}) };
}

/**
 * A compressed skill's opening check, answered. Right: the skill is done (with allKnown on the last skill, its ladder from
 * the hardest rung). Wrong or stuck: the full unit is appended to the walk and the fallback recorded. Returns true when the
 * miss was taken (the caller then walks on instead of remediating).
 */
export function knowsCompressAnswer(s, kit, sk, item, verdict) {
  const w = s.walk;
  if (!s.knows || !w?.compress || w.compress.done || item?.id !== w.compress.cardId) return false;
  if (verdict === "right") {
    w.compress.done = true;
    const last = s.knows.compress?.at(-1) === sk.skillId; // allKnown: every scripted skill is compressed, in kit order
    if (s.knows.allKnown && last) { w.ladder = hardestFirst(sk, kit); noteBecause(s, planned(s, "allKnown", s.knows.topicId)); }
    return false;
  }
  if (verdict !== "wrong" && verdict !== "stuck") return false;
  const r = afterCompressCheck(s.knows, sk, verdict);
  w.compress.done = true;
  w.beats = [...w.beats, ...r.beats];
  w.ladder = ladderFor(s.knows, sk);
  noteBecause(s, r.because);
  return true;
}

/** The hook's slot under the plan: the planned slot (recorded), or the script's slot 0. undefined with no plan. */
export function knowsHookSlot(s, sk) {
  const plan = s.knows;
  if (!plan) return undefined;
  const slots = sk?.hook?.interestSlots ?? [];
  if (plan.hookSlot?.skillId === sk.skillId && slots[plan.hookSlot.index]) { noteBecause(s, planned(s, "hookSlot", sk.skillId)); return slots[plan.hookSlot.index]; }
  return slots[0] ?? null;
}
/** The greet's interest promise: the slot the hook will use, without recording (the hook records when it is walked). */
export function knowsGreetSlot(s, sk) {
  const plan = s.knows;
  if (!plan) return undefined;
  if (plan.compress?.includes(sk?.skillId)) return null; // a compressed first skill has no hook
  const slots = sk?.hook?.interestSlots ?? [];
  return plan.hookSlot?.skillId === sk?.skillId ? slots[plan.hookSlot.index] ?? null : slots[0] ?? null;
}

/** walkRemedy: the remediation's target for a wrong scripted card (the classifier's mix-up, else the authored one). */
export function knowsRemedy(s, item, cls, sk) {
  const authored = item?.scriptCheck?.targets ?? item?.scriptAsk?.targets ?? null;
  if (!s.knows) return authored;
  const r = remedyNow(s.knows, item, cls, sk);
  if (r.targets && !(s.remedied ?? []).includes(r.targets)) noteBecause(s, r.because); // (a remediation said once is not said again)
  return r.targets;
}

/** allKnown's line, said once by code on the first compressed check (the child hears that she is skipping what they know). */
export function knowsSayFirst(s, lang) {
  if (!s.knows?.allKnown || s.knowsSaid) return [];
  s.knowsSaid = true;
  return [String(lang ?? "").startsWith("en") ? "You already know this topic well, so today we go straight to questions." : "Yeh topic pehle se achhe se aata hai, isliye aaj seedhe sawaalon se chalte hain."];
}

/**
 * The lesson start: the warm-up with the plan's prerequisite check and first card. Due delayed checks stay first
 * (rj-truth-retention-order-starves-check); the prerequisite check and the first card follow, within the warm-up cap.
 * @param {object} plan  knows.js planFor
 * @param {any[]} warmupItems  the route's warm-up (due checks first)
 * @param {{ kit, prereqItem?: any, max: number }} o  prereqItem: an item of plan.prereqCheck.prereqSkillId (the route resolves it)
 * @returns {{ items: any[], because: object[] }}
 */
export function knowsWarmup(plan, warmupItems, { kit, prereqItem = null, max = 4 }) {
  const items = [...(warmupItems ?? [])], because = [];
  if (!plan) return { items, because };
  // the route's warm-up is due checks and reviews, most due first: the first keeps its place (a due delayed check leads)
  const checks = items.slice(0, 1), rest = items.slice(1);
  const add = [];
  if (prereqItem && !items.some((x) => x.id === prereqItem.id)) { add.push(prereqItem); because.push(...plan.because.filter((b) => b.choice === "prereqCheck")); }
  const fc = plan.firstCard ? kit.items.find((i) => i.id === plan.firstCard) : null;
  if (fc && !items.some((x) => x.id === fc.id)) { add.push({ ...fc, firstCard: true }); because.push(...plan.because.filter((b) => (b.choice === "firstCard" || b.choice === "opener") && b.on === fc.id)); }
  const out = [...checks, ...add, ...rest].slice(0, Math.max(max, checks.length + add.length));
  return { items: out, because: because.filter((b) => (b.choice === "prereqCheck" ? out.includes(prereqItem) : out.some((x) => x.id === b.on))) };
}

/**
 * The because records this turn acted on, as decision_record rows (point_id "knows.<choice>"; no migration). `stmt` is
 * brain/trace.js decisionRecordStmt (passed in: this file imports no database code). Records from the start (turn 0) are
 * written with the first turn.
 */
export function knowsDecisionsOf(prev, next, { lessonId, legalMode, stmt }) {
  const from = prev?.turn ?? 0;
  return (next?.knowsApplied ?? []).filter((r) => r.turn > from || (from === 0 && r.turn === 0))
    .map((r) => stmt({ lessonId, turn: r.turn, pointId: `knows.${r.choice}`, options: { on: r.on, fact: r.fact, source: r.source },
      chosen: String(r.on ?? ""), chosenBy: "learner", randomised: false, reasons: [], legalMode }));
}

/** Kill switch: TAXILA_R8_KNOWS=off starts every lesson on the script's default (no plan, no because). */
export const knowsOn = (env = process.env) => !/^(off|0|false)$/i.test(String(env.TAXILA_R8_KNOWS ?? ""));
/**
 * The lesson start's plan. `entry` is director/script.js scriptFor(kit) ({ script, ok }); only the skills that validate are
 * planned. `ledger` is the learner ledger the route already holds: learnedChecked is its skill's flags.delayed (the learner
 * session is adding it to the skill snapshot; until then it is read here). null with no script or the switch off.
 */
export function knowsPlanAtStart({ entry, kit, ledger, skills = {}, history = {}, mixups = [], brief = null, interests = [], memory = null, now, env } = {}) {
  // (a replay of a recorded run walks what that run walked: no knows choices, as v6.10's walk rules)
  if (!knowsOn(env) || !entry?.script || entry.script.recordedRun) return null;
  const script = { ...entry.script, skills: (entry.script.skills ?? []).filter((sk) => entry.ok?.has(sk.skillId)) };
  if (!script.skills.length) return null;
  const known = Object.fromEntries(Object.entries(skills).map(([id, st]) => [id, { ...st, learnedChecked: st?.learnedChecked ?? !!ledger?.skills?.[id]?.flags?.delayed }]));
  // items she has answered: the ledger's seen item ids per skill (the route's `history` is outcomes, not ids)
  const seen = history && Object.keys(history).length ? history : Object.fromEntries(Object.entries(ledger?.skills ?? {}).map(([id, sk]) => [id, sk?.items ?? []]));
  return planFor({ script, kit, skills: known, history: seen, mixups, brief, interests, memory, now });
}

/**
 * The ledger's two marks on a check card the plan chose (learner-evidence.md §9): `recheck: true` on a compressed skill's
 * opening card (a right answer re-checks the learned skill; a miss withdraws "learned" at once), and `probeFor: <mix-up>`
 * on the card her open mix-up put first (a right unaided answer discriminates that mix-up). Any other card is unchanged.
 */
export function knowsMark(s, item) {
  if (!s?.knows || !item) return item;
  const w = s.walk;
  const recheck = w?.compress && !w.compress.done && w.compress.cardId === item.id;
  const probe = (s.knows.because ?? []).find((b) => b.choice === "checkOrder" && b.fact?.cardId === item.id)?.fact?.misconceptionId ?? null;
  return recheck || probe ? { ...item, ...(recheck ? { recheck: true } : {}), ...(probe ? { probeFor: probe } : {}) } : item;
}

// ───────────── the kit-practice phase ─────────────
/**
 * The lesson start: her practice queue (state.queue, built with her level and mix-ups) against a no-history child's
 * (buildPracticeQueue with neither). Departures are recorded at turn 0; the no-history queue is kept for the predicate.
 */
export function knowsPracticeStart(s, kit, { level = null, activeMisconceptionIds = [] } = {}) {
  if (!s?.knows || !Array.isArray(s.queue) || s.practiceSet) return s;
  const defaultQueue = buildPracticeQueue(kit, {});
  const p = practicePlanOf({ kit, queue: s.queue, defaultQueue, level, activeMisconceptionIds });
  s.knowsPractice = { defaultQueue };
  for (const b of p.because) noteBecause(s, b);
  return s;
}
/**
 * poseNext's pick, after it is made: which branch chose it (ladder / verify / queued / queue), and the in-lesson reason when
 * the queue's pick is not the next item of its skill in queue order: a skill she is answering fast and unaided (pace.fast:
 * its hardest item) or the gentlest item after two misses in a row, or when she asked for an easier one. Logged in
 * s.practiceLog (the predicate's events). Returns the item unchanged.
 */
export function knowsPick(s, kit, item, { preferred = null, verifying = null, queued = null, easier = false } = {}) {
  if (!s?.knows || !item || String(item.id).startsWith("script:")) return item;
  const source = item === preferred ? "ladder" : item === verifying ? "verify" : item === queued ? "queued" : "queue";
  if (source === "queue" && !String(item.id).startsWith("diag:")) {
    const seen = new Set([...(s.itemsDone ?? []), ...(s.skipped ?? []), ...(s.shownIds ?? []), ...(s.practiceLog ?? []).map((x) => x.itemId)]);
    const order = (s.knows.because ?? []).concat(s.knowsApplied ?? []).find((b) => b.choice === "practiceOrder")?.fact?.order ?? s.knowsPractice?.defaultQueue ?? s.queue ?? [];
    const skillOf = (id) => (kit?.items ?? []).find((i) => i.id === id)?.skillId ?? null;
    const next = order.find((id) => !String(id).startsWith("diag:") && skillOf(id) === item.skillId && !seen.has(id));
    if (next && next !== item.id) {
      const k = item.skillId;
      if (easier) noteBecause(s, { choice: "practiceEasier", on: item.id, fact: { kind: (s.pace?.miss?.[k] ?? 0) >= 2 ? "two_misses" : "asked", skillId: k, insteadOf: next }, source: "this lesson's answers" });
      else if (s.pace?.fast?.includes(k)) noteBecause(s, { choice: "practiceFast", on: item.id, fact: { kind: "fast_unaided", skillId: k, insteadOf: next }, source: "this lesson's answers" });
    }
  }
  s.practiceLog = [...(s.practiceLog ?? []), { itemId: item.id, skillId: item.skillId ?? null, source, turn: s.turn ?? 0 }];
  return item;
}
