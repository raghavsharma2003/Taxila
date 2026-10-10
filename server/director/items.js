// Item bookkeeping for the director: probe mapping, the practice queue, isomorphic items, the spoken
// diagnostic (P7) built from a kit misconception, and the code-level answer-leak predicate.
import { toAap } from "./register.js";
import { p4pl, A_GE, C_OPEN, S_SLIP } from "../learner/kt/ability.js";

/** Item kind → probe id from the catalogue (learning-science §7). Plain practice is P15, hint-ladder consumption. */
export const PROBE_FOR_KIND = {
  practice: "P15", near_transfer: "P3", far_transfer: "P4", predict: "P5", contrast: "P8", why: "P2",
  teachback: "P1", retrieval: "P10", error_spot: "P6", translate_rep: "P14",
};
/** Likelihood weights per probe (catalogue reliability bands; design starting points, not fitted). */
export const PROBE_WEIGHT = { P1: 1.2, P2: 1.0, P3: 1.2, P4: 1.2, P5: 0.8, P6: 1.0, P7: 0.7, P8: 1.0, P10: 1.5, P14: 1.0, P15: 1.0 };

const KIND_ORDER = { practice: 0, predict: 1, contrast: 2, translate_rep: 3, near_transfer: 4, why: 5, error_spot: 6, far_transfer: 7, retrieval: 8 };
export const QUEUE_MAX = 12;
/** Error-spotting only after basic mastery (rule 6: never for novices). */
const ERROR_SPOT_P = 0.7;

const DIAG_PREFIX = "diag:";
export const probeFor = (item) => (item.diagnostic ? "P7" : PROBE_FOR_KIND[item.kind] ?? "P15");

/** The prompt to pose, in the child's language (Hinglish/Hindi kits carry prompt_hi). */
export const promptFor = (item, lang) => (lang === "english" ? item.prompt_en : item.prompt_hi) || item.prompt_en;

/** Deterministic [0,1) stream from a seed (mulberry32), so option order is replayable from the lesson seed. */
function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hashStr = (s) => [...String(s)].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);

/**
 * A misconception's diagnostic as a pseudo-item, so it runs through the same ladder and evidence path.
 * The prompt is the bare stem: the options are content of their own (read out naturally, shown as chips)
 * and are NOT appended to the pinned question — appended, they overflowed the appended-last budget and
 * were read out as "1/2 slash 1/3". Kits list the correct option first in most diagnostics, so the order
 * is shuffled per lesson (seed) and per misconception; chips and the read-out share that order.
 * @returns {import("../../shared/contracts").KitItem & { diagnostic: true, options: any[] } | null}
 */
export function diagnosticItem(kit, m, seed = 0) {
  const d = m?.diagnostic;
  const correct = d?.options.find((o) => o.correct);
  if (!correct) return null;
  const rnd = prng(seed ^ hashStr(m.id));
  const options = d.options.map((o) => ({ o, k: rnd() })).sort((a, b) => a.k - b.k).map(({ o }) => o);
  const anchor = kit.items.find((i) => i.targetsMisconception === m.id) ?? kit.items[0];
  return {
    id: DIAG_PREFIX + m.id, skillId: anchor.skillId, kind: "contrast", difficulty: 2,
    prompt_en: d.prompt_en, prompt_hi: d.prompt_hi,
    answer: correct.text, acceptable: [],
    // Two ladders (audit flows G5: "pump: ask them to picture both choices as real things" reached the child's card).
    // `rungShapes` are the teacher's notes, server-side only (state.js hands them to SH.hint). `hints` are the
    // child-facing lines the Question card may show under the ask: plain, no rung label, no teacher shape words,
    // never the answer. Rung 4 has none: the assertion is never a card line (state.js hintFor).
    rungShapes: [
      "pump: ask them to picture both choices as real things",
      `hint: use ${m.remediation.representation}`,
      "prompt: a fill-in-the-blank that compares the two choices",
      "assertion: say which option is right, with a one-line reason",
    ],
    hints: DIAG_CHILD_HINTS,
    targetsMisconception: m.id, diagnostic: true, options,
  };
}

/** The card lines for a diagnostic's rungs 1-3 (English chrome: the Question card's hint line is UI text). */
export const DIAG_CHILD_HINTS = Object.freeze([
  "Picture each choice as real things.",
  "Look at each choice one part at a time.",
  "Which choice fits what the question asks?",
]);

/**
 * Rung labels a kit hint or a teacher shape may start with ("Prompt: …", "Assert: …", "pump: …"). Only these words:
 * a kit hint like "Rule: ___" or "Cars: 4. Dolls?" is content and keeps its label.
 */
export const RUNG_LABEL = /^\s*(?:pump|hint|prompt|assert(?:ion)?|point|ask|nudge|clue)\s*[:\-–]\s*/i;
export const stripRungLabel = (t) => String(t ?? "").replace(RUNG_LABEL, "");

const NUMERIC = /^[-−]?\d[\d,]*$/;
const FRACTION = /^(\d+)\s*\/\s*(\d+)$/;
/**
 * "Show me choices" for an item with no diagnostic options (flows G3: the button sent "Choices dikhao" as an answer
 * and she then read out another item's choices): 3 tiles, the key and two distractors, in a per-lesson seeded
 * order. Numbers: near neighbours (±1, ±10, ×10); a fraction: its flip and a neighbour; words: other answers of the
 * same kit, same skill first. Never a distractor that is itself an accepted form of the key. null when fewer than
 * one distractor exists (the caller gives a hint instead).
 * @returns {string[] | null} the tile labels, the key among them
 */
export function choicesFor(item, kit, seed = 0) {
  const key = String(item?.answer ?? "").trim();
  if (!key || key.length > 40) return null;
  const accepted = new Set([key, ...(item.acceptable ?? [])].map((x) => norm(x)));
  const ok = (x) => !!x && String(x).length <= 40 && !accepted.has(norm(x));
  let pool = [];
  const flat = key.replace(/,/g, "");
  const f = key.match(FRACTION);
  if (NUMERIC.test(key)) {
    const n = Number(flat.replace("−", "-"));
    const comma = key.includes(",");
    const fmt = (v) => (comma ? v.toLocaleString("en-IN") : String(v));
    pool = [n + 1, n - 1, n + 10, n - 10, n * 10, n + 2].filter((v) => v >= 0 && v !== n).map(fmt);
  } else if (f) {
    const [a, b] = [Number(f[1]), Number(f[2])];
    pool = [`${b}/${a}`, `${a + 1}/${b}`, `${a}/${b + 1}`, `${Math.max(1, a - 1)}/${b}`];
  } else {
    const others = (kit?.items ?? []).filter((i) => i.id !== item.id && i.kind !== "teachback" && i.kind !== "why")
      .sort((a, b) => (b.skillId === item.skillId) - (a.skillId === item.skillId));
    pool = others.map((i) => String(i.answer ?? "").trim()).filter((x) => x && x.length <= 40 && x.split(/\s+/).length <= 5);
  }
  const distractors = [...new Set(pool.filter(ok))].slice(0, 2);
  if (!distractors.length) return null;
  const rnd = prng((seed >>> 0) ^ hashStr(item.id));
  return [key, ...distractors].map((o) => ({ o, k: rnd() })).sort((a, b) => a.k - b.k).map(({ o }) => o);
}

/** A diagnostic's options as they are said aloud: "1/2 ya 1/3" (Hinglish/Hindi) or "1/2 or 1/3". */
export const optionsSpoken = (item, lang) => item.options.map((o) => o.text).join(lang === "english" ? " or " : " ya ");

/**
 * The item as THIS child is asked it: an "aap" child (state.ctx.address, director/register.js) gets the Hinglish /
 * Hindi question in aap forms. Only the question changes (prompt_hi); keys, acceptable answers, hints and option
 * texts are the kit's. Every reader of the posed question (compile, the reply guards, the classifier, the Question
 * card) gets its item from findItem, so what is said, shown, guarded and graded is one text.
 */
const AAP = new WeakMap();
export function addressed(item, address) {
  if (!item || address !== "aap" || !item.prompt_hi) return item;
  if (AAP.has(item)) return AAP.get(item);
  const out = { ...item, prompt_hi: toAap(item.prompt_hi) };
  AAP.set(item, out);
  return out;
}

/** Resolve an item id against the kit, its diagnostics, and the warm-up snapshot in the lesson state. */
export function findItem(s, kit, id) {
  if (!id) return null;
  const address = s?.ctx?.address;
  if (id.startsWith(DIAG_PREFIX)) return addressed(diagnosticItem(kit, kit.misconceptions.find((m) => m.id === id.slice(DIAG_PREFIX.length)), s.seed), address);
  // The faded worked-example step (director/fading.js fadeItem), pinned in the state when it is posed.
  if (id.startsWith("fade:")) return addressed(s?.fadeItem?.id === id ? s.fadeItem : null, address);
  return addressed(kit.items.find((i) => i.id === id) ?? s.warmup?.find((w) => w.id === id) ?? null, address);
}

// ── content F0 (CONTENT-LEVEL §3 F0, RS-6; owner reset R2 "wrong level") ──
// Before F0 the queue served each topic's easiest rung first (kit difficulty is relative to the topic, and every topic
// was written with a difficulty-1 entry rung), spliced the diagnostic in second on the same motif, and cut the HARD end
// at QUEUE_MAX: a class-4 child opened lesson 1 with "how many faces does a dice have" and then a dice picture.
/** Flag `content.f0`: on unless TAXILA_CONTENT_F0=off (read per call so a test or an incident can switch it). */
export const contentF0 = () => process.env.TAXILA_CONTENT_F0 !== "off";
/** OD5 targets for the first two items: P(correct) 0.85, then 0.75. */
export const OPEN_TARGETS = Object.freeze([0.85, 0.75]);
/** Items 1-2 need ge >= C-1 + this (start of class C) when the kit has two such items and the child is not weak. */
export const OPEN_FLOOR_OFFSET = 0.25;   // Day 0 (2026-10-05): +0.25 measured with v1's judge: items 1-2 graded <= C-2 117->100 and 87->80 of 385 (crosscheck-v1)
/** P(correct) of an on-grade child AT an item's ge (the rater/generator anchor; server/placement/cat.js uses the same). */
const ANCHOR_P = 0.7;
const classOfKit = (kit) => Number(/^c(\d+)-/.exec(String(kit?.topicId ?? ""))?.[1]) || null;
/**
 * An item's grade-equivalent on ability.js's scale (class C runs from GE C-1 to C): the kit's measured `ge` (re-levelled
 * and rater-calibrated, data/kits-relevel), else the interim proxy C - 1 + (difficulty - 3) * 0.5 (CONTENT-LEVEL F0.1).
 */
export function itemGE(item, classLevel) {
  if (typeof item?.ge === "number") return item.ge;
  return classLevel - 1 + ((item?.difficulty ?? 2) - 3) * 0.5;
}
/** Expected P(correct) for a child at θ (default: an on-track child mid-year, GE C-0.5) on the ability.js 4PL. */
export function expectedSuccess(item, theta, classLevel) {
  const c = item?.options?.length ? 1 / item.options.length : C_OPEN;
  const ge = itemGE(item, classLevel);
  const b = ge - Math.log((ANCHOR_P - c) / (1 - c - S_SLIP) / (1 - (ANCHOR_P - c) / (1 - c - S_SLIP))) / A_GE;
  return p4pl(theta, b, A_GE, c, S_SLIP);
}
/** "Too far below" for item 1 or 2: ge <= C-2 (CONTENT-LEVEL F0.1), unless the child is weak on this topic or below. */
export const tooFarBelow = (item, classLevel) => itemGE(item, classLevel) <= classLevel - 2;
/** Two prompts on the same motif (the dice, then the dice picture): content-word overlap >= 0.4 of the smaller set. */
export function sameMotif(a, b) {
  const wa = contentWords(a?.prompt_en ?? ""), wb = contentWords(b?.prompt_en ?? "");
  if (!wa.size || !wb.size) return false;
  const inter = [...wa].filter((w) => wb.has(w)).length;
  return inter / Math.min(wa.size, wb.size) >= 0.4;
}

/**
 * The delayed-check reserve (VALUES-100 V1.3: the check is a NEW form): per skill with at least two items of a check kind,
 * one is held out of practice so a later session can check the skill on an item the child has never seen. A near
 * transfer first (the new form by design), else the hardest practice / retrieval item. server/learner/checks.js reads the
 * same set. Pure and deterministic per kit. Every practice path (both queue builders, harderThan, selectNext) skips it.
 */
const RESERVE_KINDS = ["near_transfer", "practice", "retrieval"];
export function checkReserveIds(kit) {
  const out = new Set();
  // ship5 integration (V1-11r x RS-6 F0): the reserve must never take one of the two items F0 would open on. Holding out
  // the hardest item of each skill starved the opener floor: c7-english-ch04-t01 opened on a ge 5 item for class 7 (the
  // merged-kits gate), and a small kit fell back to its dice rung. So the reserve skips the on-track opener pair (computed
  // with no reserve, deterministic per kit) and takes the skill's next candidate; a skill with no other candidate keeps no
  // reserve (no check that session, V1-11's own rule for "no unseen item").
  const C = classOfKit(kit);
  const openers = C && contentF0() && kit?.items?.length
    ? new Set(buildF0Queue(kit, { activeMisconceptionIds: [], C, theta: C - 0.5, weak: false }).filter((id) => !id.startsWith(DIAG_PREFIX)).slice(0, 2))
    : new Set();
  for (const sk of kit?.skills ?? []) {
    const c = (kit.items ?? []).filter((i) => i.skillId === sk.id && RESERVE_KINDS.includes(i.kind));
    if (c.length < 2) continue;
    const pick = [...c].sort((a, b) => (b.kind === "near_transfer") - (a.kind === "near_transfer") || (b.difficulty ?? 3) - (a.difficulty ?? 3) || (a.id < b.id ? -1 : 1))
      .find((i) => !openers.has(i.id));
    if (pick) out.add(pick.id);
  }
  return out;
}

/**
 * Practice order. With `content.f0` on (default):
 * - item 1 is the item an on-track child answers right with P closest to 0.85, from the earliest skill that has one
 *   (items with a measured ge first, when the kit has two),
 *   and item 2 the one closest to 0.75 on a different motif; neither is ever ge <= C-2 unless `weak` (the child has shown
 *   weakness on this topic or its prerequisite) or the kit has nothing else;
 * - the rest round-robin across skills in kit order, easiest first within a skill, so every skill (the hardest too)
 *   enters before the cap; over QUEUE_MAX the EASIEST items go first, never a skill's last item;
 * - the spoken diagnostic goes third or later, never on item 1's motif.
 * Off (TAXILA_CONTENT_F0=off): the pre-F0 order below, unchanged.
 * @param {object} kit
 * @param {{ activeMisconceptionIds?: string[], classLevel?: number, theta?: number, weak?: boolean }} [opts]
 */
export function buildPracticeQueue(kit, { activeMisconceptionIds = [], classLevel, theta, weak = false } = {}) {
  const C = classLevel ?? classOfKit(kit);
  const reserved = checkReserveIds(kit);
  if (contentF0() && C) return buildF0Queue(kit, { activeMisconceptionIds, C, theta: theta ?? C - 0.5, weak, reserved });
  const ids = [];
  for (const sk of kit.skills) {
    ids.push(...kit.items.filter((i) => i.skillId === sk.id && i.kind !== "teachback" && !reserved.has(i.id))
      .sort((a, b) => a.difficulty - b.difficulty || KIND_ORDER[a.kind] - KIND_ORDER[b.kind]).map((i) => i.id));
  }
  const m = kit.misconceptions.find((x) => x.diagnostic && activeMisconceptionIds.includes(x.id)) ?? kit.misconceptions.find((x) => x.diagnostic);
  if (m) ids.splice(Math.min(1, ids.length), 0, DIAG_PREFIX + m.id);
  return ids.slice(0, QUEUE_MAX);
}

function buildF0Queue(kit, { activeMisconceptionIds, C, theta, weak, reserved = new Set() }) {
  const skillIdx = new Map(kit.skills.map((sk, i) => [sk.id, i]));
  const pool = kit.items.filter((i) => i.kind !== "teachback" && skillIdx.has(i.skillId) && !reserved.has(i.id))
    .map((i) => ({ i, ge: itemGE(i, C), p: expectedSuccess(i, theta, C), k: skillIdx.get(i.skillId) }));
  const openable = (x) => x.i.kind !== "error_spot" && x.i.kind !== "far_transfer" && (weak || !tooFarBelow(x.i, C));
  const pick = (cands, target) => [...cands].sort((a, b) => Math.abs(a.p - target) - Math.abs(b.p - target) || a.k - b.k || a.ge - b.ge)[0] ?? null;
  let cands = pool.filter(openable);
  // A measured ge (re-levelled, rater-calibrated) beats the difficulty proxy for the two items a child meets first: the
  // proxy is exactly what put the dice first (75% of difficulty-1 entry rungs were judged too easy, CONTENT-LEVEL §0).
  const measured = cands.filter((x) => typeof x.i.ge === "number");
  if (measured.length >= 2) cands = measured;
  // Opener floor: with no evidence of weakness, the first two items need at least start-of-class-C demand (GE C-1).
  // Measured 2026-10-04 with v1's independent judge: without it, the 0.85 target picked items a class below.
  const atGrade = cands.filter((x) => x.ge >= C - 1 + OPEN_FLOOR_OFFSET);
  if (!weak && atGrade.length >= 2) cands = atGrade;
  // Leave headroom: never open on the topic's hardest level when two openable items sit below it, so "harder one" has
  // somewhere to go from item 1.
  const topGE = Math.max(...pool.map((x) => x.ge));
  const belowTop = cands.filter((x) => x.ge < topGE - 0.01);
  if (belowTop.length >= 2) cands = belowTop;
  // A kit with nothing at grade still opens: its highest-ge items, never a blank queue.
  if (!cands.length) { const top = Math.max(...pool.map((x) => x.ge)); cands = pool.filter((x) => x.ge >= top - 0.25 && x.i.kind !== "error_spot"); }
  const firstSkill = Math.min(...cands.map((x) => x.k));
  const first = pick(cands.filter((x) => x.k === firstSkill), OPEN_TARGETS[0]);
  // ship5 integration: when the narrowed cands hold no second item (e.g. the two measured items share a motif), item 2
  // must still be an OPENABLE item from the whole pool, never whatever the round-robin rest puts first: that path opened
  // c7-english-ch04-t01 on a ge 5 item for class 7 once V1-11's check reserve shortened the rest (rs6-merged-kits gate).
  const second = first && pick(cands.filter((x) => x !== first && x.k <= first.k + 1 && !sameMotif(x.i, first.i)), OPEN_TARGETS[1])
    || first && pick(cands.filter((x) => x !== first && !sameMotif(x.i, first.i)), OPEN_TARGETS[1])
    || first && pick(pool.filter((x) => x !== first && openable(x) && !sameMotif(x.i, first.i)), OPEN_TARGETS[1])
    || first && pick(pool.filter((x) => x !== first && openable(x)), OPEN_TARGETS[1]);
  const head = [first, second].filter(Boolean);
  // Round-robin the rest across skills, easiest first within each skill.
  const bySkill = kit.skills.map((_, k) => pool.filter((x) => x.k === k && !head.includes(x)).sort((a, b) => a.ge - b.ge || KIND_ORDER[a.i.kind] - KIND_ORDER[b.i.kind]));
  let rest = [];
  for (let r = 0; bySkill.some((xs) => xs.length > r); r++) for (const xs of bySkill) if (xs[r]) rest.push(xs[r]);
  const m = kit.misconceptions.find((x) => x.diagnostic && activeMisconceptionIds.includes(x.id)) ?? kit.misconceptions.find((x) => x.diagnostic);
  const room = QUEUE_MAX - head.length - (m ? 1 : 0);
  // Cap by coverage: drop the easiest item whose skill keeps another item, until it fits.
  while (rest.length > room) {
    const count = new Map(); for (const x of [...head, ...rest]) count.set(x.k, (count.get(x.k) ?? 0) + 1);
    const victim = [...rest].sort((a, b) => a.ge - b.ge).find((x) => count.get(x.k) > 1) ?? rest[0];
    rest = rest.filter((x) => x !== victim);
  }
  // Within the kept rest, keep the round-robin order (it is already prerequisite-first per round).
  const ids = [...head, ...rest].map((x) => x.i.id);
  if (m) {
    const diag = diagnosticItem(kit, m);
    let at = Math.min(2, ids.length);
    if (diag && first && sameMotif(diag, first.i)) at = Math.min(3, ids.length);
    ids.splice(at, 0, DIAG_PREFIX + m.id);
  }
  return ids.slice(0, QUEUE_MAX);
}

/**
 * The item a "harder one" asks for (the chip symmetric to "an easier one", OD12 "warm-up or spicy"): among every not-yet-
 * done kit item (not only the queue, so the harder path is reachable past the cap), the smallest step above the current
 * item's ge; null when nothing is above it.
 */
export function harderThan(s, kit, currentId = s.activeItemId ?? s.itemsDone?.[s.itemsDone.length - 1]) {
  const C = classOfKit(kit) ?? 5;
  const done = new Set([...(s.itemsDone ?? []), ...(s.skipped ?? []), currentId].filter(Boolean));
  const cur = currentId ? findItem(s, kit, currentId) : null;
  const base = cur ? itemGE(cur, C) : C - 1;
  const reserved = checkReserveIds(kit);
  const left = kit.items.filter((i) => i.kind !== "teachback" && !done.has(i.id) && !reserved.has(i.id));
  const above = left.filter((i) => itemGE(i, C) > base + 0.05).sort((a, b) => itemGE(a, C) - itemGE(b, C));
  // Nothing above: null, never a step down (the caller says so and may ask Forge for an on-grade "spicy" isomorph, F3).
  return above[0] ?? null;
}

/** Fast-forward (CONTENT-LEVEL F0.5) needs "fast": an unaided first-try answer under this many ms. */
export const FAST_MS = 20_000;
/**
 * Items to skip after strong early evidence (pure; the caller adds them to s.skipped). `answers`: this lesson's graded
 * first attempts in order, { itemId, correct, unaided, ms }.
 * - The first two answers both correct, unaided and fast: skip the rest of that skill's items below C-1 + 0.25
 *   (the warm-up rungs, difficulty <= 2 on the proxy).
 * - Three correct unaided answers in a row on one skill: skip the rest of that skill (move to the next skill).
 */
export function fastForwardSkips(s, kit, answers) {
  const C = classOfKit(kit) ?? 5;
  const done = new Set([...(s.itemsDone ?? []), ...(s.skipped ?? [])]);
  const items = new Map(kit.items.map((i) => [i.id, i]));
  const good = (a) => a && a.correct && a.unaided !== false;
  const out = new Set();
  const [a1, a2] = answers;
  if (good(a1) && good(a2) && (a1.ms ?? Infinity) <= FAST_MS && (a2.ms ?? Infinity) <= FAST_MS) {
    const sk = items.get(a2.itemId)?.skillId ?? items.get(a1.itemId)?.skillId;
    for (const i of kit.items) if (i.skillId === sk && !done.has(i.id) && itemGE(i, C) < C - 1 + 0.25) out.add(i.id);
  }
  const last3 = answers.slice(-3);
  if (last3.length === 3 && last3.every(good)) {
    const sks = new Set(last3.map((a) => items.get(a.itemId)?.skillId));
    if (sks.size === 1) { const [sk] = sks; for (const i of kit.items) if (i.skillId === sk && !done.has(i.id) && i.kind !== "teachback") out.add(i.id); }
  }
  for (const a of answers) out.delete(a.itemId);
  return [...out];
}
/** Topic test-out (F0.5): three on-grade items (ge >= C-0.5) right and unaided this lesson. */
export function testedOut(kit, answers) {
  const C = classOfKit(kit) ?? 5;
  const items = new Map(kit.items.map((i) => [i.id, i]));
  return answers.filter((a) => a.correct && a.unaided !== false && items.has(a.itemId) && itemGE(items.get(a.itemId), C) >= C - 0.5).length >= 3;
}

/**
 * Next item to pose, or null when the queue is spent. `easier` picks the gentlest remaining one; `harder` the next step
 * up (harderThan), reaching past the queue.
 */
export function selectNext(s, kit, { easier = false, harder = false } = {}) {
  if (harder && contentF0()) return harderThan(s, kit);
  const done = new Set([...s.itemsDone, ...s.skipped]);
  // V1.4 (evals/mastery-calibration): a settled or parked skill gets no more practice items this lesson
  const off = new Set([...(s.pace?.settled ?? []), ...(s.pace?.parkedSkills ?? [])]);
  const ok = s.queue.map((id) => findItem(s, kit, id)).filter((it) => {
    if (!it || done.has(it.id) || it.id === s.activeItemId) return false;
    if (it.skillId && off.has(it.skillId) && !String(it.id).startsWith("diag:")) return false;
    if (it.kind !== "error_spot") return true;
    const sk = s.skills[it.skillId];
    return !!sk && sk.pKnown >= ERROR_SPOT_P && sk.correctUnaided >= 1;
  });
  if (!easier) {
    // a skill the child has shown is easy for them (pace.fast): its HARDEST remaining item next, not the next easy one
    const head = ok[0];
    if (head?.skillId && s.pace?.fast?.includes(head.skillId)) {
      const C = classOfKit(kit) ?? 5, g = (i) => (contentF0() ? itemGE(i, C) : i.difficulty);
      return ok.filter((i) => i.skillId === head.skillId).sort((a, b) => g(b) - g(a))[0];
    }
    return head ?? null;
  }
  if (contentF0()) { const C = classOfKit(kit) ?? 5; return [...ok].sort((a, b) => itemGE(a, C) - itemGE(b, C))[0] ?? null; }
  return [...ok].sort((a, b) => a.difficulty - b.difficulty)[0] ?? null;
}

/** After an assertion the child must solve an isomorphic item: same skill, closest difficulty. */
export function isomorphicFor(s, kit, item) {
  const done = new Set(s.itemsDone);
  const KINDS = ["practice", "near_transfer", "contrast", "retrieval", "predict"];
  return kit.items
    .filter((i) => i.skillId === item.skillId && i.id !== item.id && !done.has(i.id) && KINDS.includes(i.kind))
    .sort((a, b) => Math.abs(a.difficulty - item.difficulty) - Math.abs(b.difficulty - item.difficulty)
      || (a.kind === item.kind ? -1 : 0) - (b.kind === item.kind ? -1 : 0))[0] ?? null;
}

/** The key idea a "why?" after a correct answer is classified against. */
export function whyKey(kit, skillId) {
  const why = kit.items.find((i) => i.kind === "why" && i.skillId === skillId) ?? kit.items.find((i) => i.kind === "why");
  return why?.answer || kit.expectations.slice(0, 2).join("; ") || null;
}

/** Fractions and plain numbers in a text, for module params and the whiteboard anchor. */
export function extractValues(text) {
  const t = String(text || "");
  const fractions = [...t.matchAll(/(\d+)\s*\/\s*(\d+)/g)].map((m) => [+m[1], +m[2]]);
  const numbers = [...t.replace(/\d+\s*\/\s*\d+/g, " ").matchAll(/\d+(?:\.\d+)?/g)].map((m) => +m[0]);
  return { fractions, numbers };
}

/** Whiteboard anchor for an item: its fractions or numbers, else the shortened prompt. */
export function anchorOf(item, lang) {
  const p = promptFor(item, lang);
  const { fractions, numbers } = extractValues(p);
  if (fractions.length) return { kind: "math", value: fractions.map(([n, d]) => `${n}/${d}`).join("  ·  ") };
  if (numbers.length && numbers.length <= 4) return { kind: "math", value: numbers.join("  ·  ") };
  return { kind: "text", value: p.length > 60 ? p.slice(0, 57) + "…" : p };
}

// Spoken fraction forms → "n/d", so "one-half", "aadha" and "ek bata do" all compare equal to 1/2.
const NUM = { one: 1, ek: 1, two: 2, do: 2, three: 3, teen: 3, four: 4, char: 4, chaar: 4, five: 5, paanch: 5, panch: 5,
  six: 6, chhe: 6, chhah: 6, seven: 7, saat: 7, eight: 8, aath: 8, nine: 9, nau: 9, ten: 10, das: 10 };
const DEN = { half: 2, halves: 2, third: 3, thirds: 3, tihai: 3, fourth: 4, fourths: 4, quarter: 4, quarters: 4, chauthai: 4,
  fifth: 5, fifths: 5, sixth: 6, sixths: 6, eighth: 8, eighths: 8, tenth: 10, tenths: 10 };
const NUM_RE = `(\\d+|${Object.keys(NUM).join("|")})`;
const toN = (w) => (/^\d+$/.test(w) ? w : String(NUM[w]));
/** Canonicalize spoken fractions in already-lowercased text. */
export function canonicalFractions(t) {
  return t
    .replace(new RegExp(`\\b${NUM_RE}\\s*(?:by|bata|upon|out of)\\s*${NUM_RE}\\b`, "g"), (_, a, b) => `${toN(a)}/${toN(b)}`)
    // "char mein se teen" = three out of four
    .replace(new RegExp(`\\b${NUM_RE}\\s*(?:mein|me|main)\\s*se\\s*${NUM_RE}\\b`, "g"), (_, a, b) => `${toN(b)}/${toN(a)}`)
    .replace(new RegExp(`\\b${NUM_RE}[\\s-]+(${Object.keys(DEN).join("|")})\\b`, "g"), (_, a, d) => `${toN(a)}/${DEN[d]}`)
    .replace(/\b(half|aadha|aadhi|adha|adhi)\b/g, "1/2")
    .replace(/\btihai\b/g, "1/3")
    .replace(/\b(quarter|chauthai|paav|pav)\b/g, "1/4")
    .replace(/\bpaune\b/g, "3/4");
}
export const norm = (s) => canonicalFractions(String(s || "").toLowerCase().replace(/[“”"'’`]/g, "").replace(/[^\p{L}\p{N}/.\s-]/gu, " ").replace(/\s+/g, " ").trim());
const VERDICT = new Set(["bada", "badi", "bade", "zyada", "jyada", "bigger", "larger", "greater", "more", "chhota", "chhoti", "smaller",
  "less", "kam", "sahi", "correct", "right", "answer", "jawab", "uttar", "hota", "hoti", "equals", "is"]);
function containsTerm(text, term) {
  const esc = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}/])${esc}($|[^\\p{L}\\p{N}/])`, "u").test(text);
}

const FILLER = new Set(["the", "and", "what", "which", "how", "this", "that", "with", "kya", "hai", "hain", "mein", "aur", "kaun", "kaunsa", "kitna", "kitne", "ek", "ko", "ka", "ki", "ke", "se", "ya", "is", "are", "you", "your", "tum", "tumhe"]);
const contentWords = (t) => new Set(norm(t).split(" ").filter((w) => (w.length >= 3 || /\d/.test(w)) && !FILLER.has(w)));

/**
 * Did a teacher turn actually pose this item? At least half of the question's content words must be in it
 * (the turn may add a short lead-in). Guards text-mode fidelity: the director's evidence is only valid for
 * the question the child was really asked.
 */
export function posesItem(text, item, lang) {
  const want = contentWords(promptFor(item, lang));
  if (!want.size) return true;
  const got = contentWords(text);
  return [...want].filter((w) => got.has(w)).length / want.size >= 0.5;
}

/**
 * Does a turn hand the floor back (turn-shape rule)? A question, a blank to fill, or a try-this verb.
 * A turn that only states things leaves a child — especially a shy one — with nothing to do but "haan".
 */
export const handsBack = (text) => /[?？]|_{2,}|\b(batao|bataao|bolo|socho|try|karke dekho|dikhao|tell me|show me|your turn)\b/i.test(String(text))
  // the same try-this in aap forms (director/register.js): "bataiye", "sochiye", "karke dekhiye" — "chahiye" (need) is not one
  || /\b(?!chahiye\b)[a-z]{2,}iye\b|इए(?![\p{L}\p{M}])/iu.test(String(text));

/** Does a why-probe turn actually ask for the reason (how / why, in Hindi or English)? */
// round 3 (conversation; local battery base-head-1): "Tumne kaunsa rule use karke decide kiya?" asks for the method but has
// none of the words, so the turn was rewritten (nowhy) and the rewrite dropped the confirmation. The method / rule / "what
// did you think" forms count too.
export const asksWhy = (text) => /\b(kaise|kaisay|kyun|kyon|kyu|kyoon|why|how|reason|wajah|vajah)\b|कैसे|क्यों/i.test(String(text))
  || /\b(?:kaun\s*sa|kaunsa|kis)\s+(?:rule|niyam|tarika|tareeka|tarah|tareeke|step|clue|cheez|baat)\b|\bkya\s+socha\b|\bsoch\s+kya\b|\bwhat\s+(?:made|told|helped)\s+you\b|\bwhich\s+(?:rule|clue|step)\b|\byour\s+thinking\b|\bexplain\b|\bsamjha(?:o|iye|ao|aiye)\b/i.test(String(text));

// ── answer-leak predicate ──
const CUT = "\u0000";
/** Normalized words; a full stop is a word boundary unless it is a decimal point. */
const wordsOf = (t) => norm(t).replace(/(?<!\d)\.|\.(?!\d)/g, " ").split(" ").filter(Boolean);
/** The head of a diagnostic option ("1/2, because …" → "1/2"; "Yes. She takes …" → "yes"). */
const headOf = (t) => norm(String(t).split(/[,;.]\s|\s(?:because|kyunki|kyonki)\s/i)[0]);
/** Index of `form` (a word array) inside `ws`, or -1. */
function indexOfRun(ws, form) {
  for (let i = 0; i + form.length <= ws.length; i++) if (form.every((w, k) => ws[i + k] === w)) return i;
  return -1;
}
/** QUOTE_RUN or more consecutive words copied from the item's own prompt are the question, not a verdict. */
const QUOTE_RUN = 4;
function cutQuoted(ws, sources) {
  const out = [];
  for (let i = 0; i < ws.length;) {
    let best = 0;
    for (const src of sources) {
      const need = Math.min(QUOTE_RUN, src.length);
      for (let j = 0; j < src.length; j++) {
        let n = 0;
        while (i + n < ws.length && j + n < src.length && ws[i + n] === src[j + n]) n++;
        if (n >= need && n > best) best = n;
      }
    }
    if (best) { out.push(CUT); i += best; } else out.push(ws[i++]);
  }
  return out;
}
/** Options read out as a sequence ("1/2 ya 1/3", "option A is 1/2, option B is 1/3") are the question too. */
const OPTION_GAP = 4;
function cutOptionSpan(ws, item) {
  const forms = item.options.flatMap((o, opt) => [...new Set([norm(o.text), headOf(o.text)])].map((f) => ({ opt, f: f.split(" ").filter(Boolean) })));
  const occ = [];
  for (const { opt, f } of forms) {
    if (!f.length) continue;
    for (let i = 0; i + f.length <= ws.length; i++) if (f.every((w, k) => ws[i + k] === w)) occ.push({ opt, start: i, end: i + f.length });
  }
  occ.sort((a, b) => a.start - b.start || b.end - a.end);
  for (let i = 0; i < occ.length; i++) {
    let end = occ[i].end;
    const opts = new Set([occ[i].opt]);
    for (const o of occ.slice(i + 1)) {
      if (o.start < end) continue;
      if (o.start - end > OPTION_GAP) break;
      if (!opts.has(o.opt)) { opts.add(o.opt); end = o.end; }
    }
    if (opts.size >= 2) return [...ws.slice(0, occ[i].start), CUT, ...cutOptionSpan(ws.slice(end), item)];
  }
  return ws;
}

/**
 * Comparison words: what turns "2 tukdon wala tukda ... bada" into the answer said in other words. Only
 * comparisons — "sahi, 3 groups mein…" affirms a reply and was a false leak (evals/director-sim.mjs) — and
 * not as a size of something else ("ek chhoti galti", "chhoti si baat").
 */
const COMPARE = new Set(["bada", "badi", "bade", "zyada", "jyada", "bigger", "biggest", "larger", "greater", "more", "chhota", "chhoti", "chhote",
  "smaller", "smallest", "less", "kam", "lamba", "lambi", "lambe", "longer"]);
const NOT_COMPARING = new Set(["galti", "gadbad", "si", "sa", "se", "baat", "mistake", "deal", "time", "baar"]);
const compares = (ws) => ws.some((w, i) => COMPARE.has(w) && !NOT_COMPARING.has(ws[i + 1]));
// Number words for the paraphrase check. "do" (2) is left out: it is also "give" ("bata do").
const SPOKEN_NUM = { ...NUM, do: undefined };
const numbersIn = (w) => (/^\d+\/\d+$/.test(w) ? w.split("/") : /^\d+$/.test(w) ? [w] : SPOKEN_NUM[w] ? [String(SPOKEN_NUM[w])] : []);
/**
 * For an item that asks the child to choose between named values (a diagnostic, or "which is bigger: 1/2 or
 * 1/3?"), each choice's numbers that no other choice has: 2 for 1/2 and 3 for 1/3. [] for other items.
 */
function distinguishingNumbers(item) {
  const valuesOf = (t) => {
    const { fractions, numbers } = extractValues(norm(t));
    return fractions.length ? fractions.map(([n, d]) => `${n}/${d}`) : numbers.map(String);
  };
  let choices;
  if (item.diagnostic) choices = item.options.map((o) => valuesOf(headOf(o.text)));
  else {
    const named = [...new Set(valuesOf(item.prompt_en))];
    if (named.length < 2 || !named.includes(norm(item.answer))) return [];
    choices = named.map((v) => [v]);
  }
  const nums = choices.map((vs) => new Set(vs.flatMap(numbersIn)));
  return nums.flatMap((own, i) => [...own].filter((n) => nums.every((other, j) => j === i || !other.has(n))));
}

/**
 * Code-level answer-leak check (rule 15: guard leakage on the bytes, not only by instruction).
 * First the question itself is cut out of the text — runs quoted from the item's own prompt (both
 * languages), and for a diagnostic the options read out as a sequence — because posing an item whose
 * statement names the answer ("Billi almari ke upar baithi hai…", an error-spot claim) is not a leak.
 * Then: a key form the question does not name is a leak wherever it appears; a form the question names
 * (one of two fractions compared, a diagnostic's correct option) is a leak only in a statement — not a
 * question — that puts a verdict word next to it. For a choice between named values, a statement that
 * pairs a comparison verdict with a number only one choice has ("2 tukdon wali bar ka har tukda bada hai")
 * says the answer in other words, and is a leak too (measured in evals/director-sim.mjs at hint rung 2).
 */
export function revealsAnswer(text, item) {
  if (!item) return false;
  const forms = (item.diagnostic ? [headOf(item.answer)] : [item.answer, ...(item.acceptable || [])].map(norm))
    .filter(Boolean).map((f) => f.split(" ")).filter((f) => f.length);
  const sources = [item.prompt_en, item.prompt_hi].filter(Boolean).map(wordsOf);
  const named = norm([item.prompt_en, item.prompt_hi, ...(item.diagnostic ? item.options.map((o) => o.text) : [])].join(" "));
  const strip = (t) => {
    const ws = cutQuoted(wordsOf(t), sources);
    return item.diagnostic ? cutOptionSpan(ws, item) : ws;
  };
  const all = strip(text);
  const rawSentences = String(text).split(/(?<=[.!?।])\s+/).filter((x) => !/[?？]\s*$/.test(x));
  const sentences = rawSentences.map(strip);
  for (const form of forms) {
    if (indexOfRun(all, form) < 0) continue;
    if (!containsTerm(named, form.join(" "))) return true;
    for (const ws of sentences) {
      const at = indexOfRun(ws, form);
      if (at >= 0 && ws.slice(Math.max(0, at - 3), at + form.length + 4).some((w) => VERDICT.has(w))) return true;
    }
  }
  // round 4 (r4-latency's blind rewrite review, 2026-10-10): two give-aways this missed. (a) A key that names its counted
  // parts ("5 faces: 1 square and 4 triangles"): "pyramid mein chaar triangles aur ek square hota hai … kitne faces?" states
  // every part's count before asking for the total. (b) A key the question itself names as an option ("face, edge ya
  // corner?"): "tumne corner kaha, cube ka woh point jahan teen edges milti hain" pairs the key with the question's own
  // description, which is the answer said as a definition (only a verdict word next to it counted before).
  const parts = keyParts(item);
  if (parts.length >= 2 && sentences.some((ws) => parts.every((p) => statesCount(ws, p)))) return true;
  const describing = describingWords(item, forms);
  if (describing.size >= 3) {
    // a key of a letter or a filler word ("A", "is") is never matched as a definition
    for (const form of forms.filter((f) => f.join(" ").length >= 3 && !(f.length === 1 && FILLER.has(f[0])))) for (const [k, ws] of sentences.entries()) {
      // a sentence with a blank to fill is a prompt, not a statement ("Salt weighs ___ g; compare that with …")
      if (indexOfRun(ws, form) < 0 || /_{2,}/.test(rawSentences[k])) continue;
      if (new Set(ws.filter((w) => describing.has(w))).size >= 3) return true;
    }
  }
  const marks = new Set(distinguishingNumbers(item));
  return marks.size > 0 && sentences.some((ws) => compares(ws) && ws.some((w) => numbersIn(w).some((n) => marks.has(n))));
}

/** The counted parts a key names after its total ("5 faces: 1 square and 4 triangles" → 1 square, 4 triangles). */
function keyParts(item) {
  const a = norm(String(item.answer ?? ""));
  const tail = a.includes(":") ? a.slice(a.indexOf(":") + 1) : String(item.answer ?? "").includes(":") ? norm(String(item.answer).split(":").slice(1).join(":")) : "";
  // only a key whose head is itself a count ("5 faces: …"); "A rectangle: it is 2 long and 1 wide" names facts, not parts
  const head = String(item.answer ?? "").split(":")[0];
  if (!tail || !/\d/.test(head)) return [];
  return [...tail.matchAll(/(?:^|\s)(\d+)\s+([a-z]{3,})/g)].map((m) => ({ n: m[1], stem: m[2].slice(0, Math.min(5, m[2].length)) }));
}
/** Does a sentence state this part's count (the number within three words before the part's noun)? */
function statesCount(ws, p) {
  for (let i = 0; i < ws.length; i++) {
    if (!ws[i].startsWith(p.stem)) continue;
    for (let j = Math.max(0, i - 3); j < i; j++) if (numbersIn(ws[j]).includes(p.n) || (ws[j] === "do" && p.n === "2")) return true;
  }
  return false;
}
/** The question's own describing words (4+ letters, not the key, not filler), in both prompts. */
function describingWords(item, forms) {
  const key = new Set(forms.flat());
  const opts = new Set((item.options ?? []).flatMap((o) => wordsOf(o.text)));
  return new Set([item.prompt_en, item.prompt_hi].filter(Boolean).flatMap(wordsOf)
    .filter((w) => w.length >= 4 && !FILLER.has(w) && !key.has(w) && !opts.has(w) && !/\d/.test(w)));
}
