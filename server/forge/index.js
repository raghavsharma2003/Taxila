// Forge G1 — the live, in-lesson personalised fill (FACTORY.md §1.1 G1, §2.3a, §5.1 G1 column; decision
// forge-live-is-g1-fill). One entry point for the Director: requestFill(). Data only, never code:
//   plan (code) → cache (memory → Neon) → flavour pick (taxila-fast, enums only, ≤ 3.5 s, optional) →
//   build (code: engine params or a scene@1 template) → G1 gate (code) → cache write (background) → mount command.
// Library cores (L0 / tgk@1 games) do not exist yet; until G2 lands, G1 serves T1 engine fills and T2a scene fills
// personalised with this child's skin, language, band, recent wrong items (prefetch order) and misconceptions.
import { getKit } from "../content/index.js";
import { kitHash } from "../content/kits.js";
import { plan, liveRenderers, moveKind } from "./planner.js";
import { diagnosticItems } from "./derive.js";
import { flavourPick, codePick, PROMPT_VERSION } from "./generator.js";
import { buildScene } from "./templates.js";
import { gateFill, childNameClash, GATE_VERSION } from "./gate.js";
import { getFill, putFill, recordGap, dbConfigured } from "./cache.js";
import { bindingFor } from "./grade.js";
import { buildPracticeQueue } from "../director/items.js";
import { learnerView } from "./learner-view.js";
import { HOOK_BY_ID } from "./strings.js";
import { sha256 } from "./blob.js";
import { DEPLOY } from "../azure.js";

// g1@2: grade.binding (gradeEvent) joined the stored body, and the child-name check left the cached verdict.
export const FORGE_G1_VERSION = "g1@2";
export const DEFAULT_NEED_BY_MS = 10_000;
/** What the turn path passes (call site 2): the teacher's preamble covers ~2 s. */
export const TURN_NEED_BY_MS = 2000;
const LEARNER_TIMEOUT_MS = 1500;
const EMPTY_LEARNER = Object.freeze({ child: null, recentWrong: [], activeMisconceptions: [], pKnown: {} });

/** JCS-style canonical JSON (sorted keys), for identity hashes. */
export function canonical(v) {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(",")}}`;
  return JSON.stringify(v);
}
/** Child-free identity of a fill: no child id, no name, no lesson — so one fill serves every child with that profile. */
export function fillKey({ item, kit, activity, skins, lang, band }) {
  const id = { v: FORGE_G1_VERSION, gate: GATE_VERSION, prompt: PROMPT_VERSION, model: DEPLOY.fast, kit: kit.hash || kitHash(kit),
    topic: kit.topicId, item: item.id, renderer: activity.renderer, template: activity.template ?? null, skins, lang, band };
  return `g1:${sha256(canonical(id)).slice(0, 32)}`;
}
const seedOf = (key) => parseInt(key.slice(-8), 16) >>> 0;

/** Resolve an item id against the kit and its diagnostics (the director's `diag:<misconceptionId>` ids). */
export function findKitItem(kit, itemId) {
  return kit.items.find((i) => i.id === itemId) ?? diagnosticItems(kit).find((d) => d.id === itemId) ?? null;
}
/** Fill keys whose activity the gate rejected (flavour-independent): skipped without a model call. Bounded; a
 *  gate/kit/prompt version change is a new key, so nothing here outlives the code that rejected it. */
const deadKeys = new Map();
function rememberDead(key, failures) { deadKeys.set(key, failures); if (deadKeys.size > 5000) deadKeys.delete(deadKeys.keys().next().value); }
const withTimeout = (p, ms, label) => { let t; return Promise.race([p, new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`${label} timeout`)), ms); })]).finally(() => clearTimeout(t)); };

/**
 * Per-lesson learner snapshot (memory, keyed child × topic, 15 min). The learner view is 4 Neon reads; the turn path
 * must not pay them per module turn, so the lesson start (prefetchLessonFills) loads it once and every requestFill
 * of that lesson reads the memo. Personalisation needs only what is stable inside a lesson (class, language,
 * interests, name); recent-wrong order matters only to the prefetch, which reads it fresh.
 */
const LEARNER_TTL_MS = 15 * 60_000;
const learnerMemo = new Map();
export const _learnerMemoClear = () => learnerMemo.clear();
/** Seed the memo with a view the caller already holds (lesson.js loads the child row at start). */
export function primeLearner(childId, topicId, view) {
  learnerMemo.set(`${childId}:${topicId}`, { at: Date.now(), p: Promise.resolve(view) });
  if (learnerMemo.size > 5000) learnerMemo.delete(learnerMemo.keys().next().value);
}
export async function learnerFor(childId, topicId, { timeoutMs = LEARNER_TIMEOUT_MS, fresh = false } = {}) {
  if (!childId) return EMPTY_LEARNER;
  const k = `${childId}:${topicId}`;
  const m = learnerMemo.get(k);
  let p = !fresh && m && Date.now() - m.at < LEARNER_TTL_MS ? m.p : null;
  if (!p && !dbConfigured()) return EMPTY_LEARNER;
  if (!p) {
    p = learnerView(childId, topicId);
    learnerMemo.set(k, { at: Date.now(), p });
    if (learnerMemo.size > 5000) learnerMemo.delete(learnerMemo.keys().next().value);
    p.catch(() => { if (learnerMemo.get(k)?.p === p) learnerMemo.delete(k); });   // never memoise a failure
  }
  return withTimeout(p, Math.max(50, timeoutMs), "learner view").catch((e) => (console.warn("[forge]", e.message), EMPTY_LEARNER));
}

/** Background model-pick upgrades of code-pick fills (one attempt per key per process; bounded). */
const upgradeTried = new Set();
const UPGRADEABLE = (fl) => fl?.by === "code" && !fl.modelRejected && fl.error !== "flavour_off" && fl.error !== "inconsistent_pick";

/** Build + gate one activity with one flavour. → { fill, gate } */
function buildAndGate(activity, item, kit, plan_, flavour, key) {
  const hook = HOOK_BY_ID[flavour.hook];
  const base = { tier: activity.tier, renderer: activity.renderer, template: activity.template, skin: flavour.skin, hook, decor: activity.renderer === "scene@1" ? flavour.decor : undefined, grade: activity.grade };
  let fill;
  if (activity.renderer === "fraction-bars@1") {
    fill = { ...base, params: { ...activity.params, ...(plan_.show ? { showLabels: true } : {}) } };
  } else {
    const sc = buildScene(activity, item, { band: plan_.band, lang: plan_.lang, hook, decor: flavour.decor, seed: seedOf(key), topicId: kit.topicId });
    if (!sc.ok) return { fill: null, gate: { ok: false, failures: [`build.${sc.why}`], checks: {}, ms: 0 } };
    fill = { ...base, scene: sc.scene, miscMap: sc.miscMap };
  }
  const gate = gateFill(fill, { item, kit, activity });   // child-free verdict: safe to cache and to memoise as dead
  return { fill, gate };
}

/** What the Director mounts. Params are exactly the renderer's params; the item binding rides in `goal`. */
const moduleIdOf = (key) => `g1-${key.slice(-8)}`;
function mountCommand(body, item, key) {
  const moduleId = moduleIdOf(key);
  return body.renderer === "scene@1"
    ? { op: "mount", moduleId, engine: "scene@1", params: { scene: body.payload.scene }, goal: `g1:${item.id}` }
    : { op: "mount", moduleId, engine: body.renderer, params: body.payload, goal: `g1:${item.id}` };
}
const captionOf = (hook, lang) => (!hook ? undefined : lang === "en" ? hook.en : lang === "hi" ? hook.hi : hook.hi_latn);

/**
 * THE call the Director makes (one per item that wants an activity). Never throws for content reasons: a gap is a
 * normal answer ({ status: "gap" }) and the Director keeps board + voice.
 *
 * Turn path (call site 2): `requestFill({ lessonId, childId, kit, item, move, needByMs: TURN_NEED_BY_MS })`. The
 * learner comes from the per-lesson memo (prefetchLessonFills / primeLearner), so a warmed item costs a memory hit.
 * At 2 s there is no time for the flavour model: a cold fill ships the CODE pick and is upgraded to a model pick in
 * the background for the next child (cache: a model pick replaces a code pick, nothing else overwrites).
 *
 * @param {import("../../shared/forge").G1FillRequest} req
 * @returns {Promise<import("../../shared/forge").G1FillResult>}
 */
export async function requestFill(req) {
  const t0 = performance.now();
  const timings = {};
  const lap = (name, since) => { timings[name] = Math.round(performance.now() - since); };
  const needBy = Math.max(1000, Math.min(req.needByMs ?? DEFAULT_NEED_BY_MS, 30_000));
  const left = () => needBy - (performance.now() - t0);
  const total = () => Math.round(performance.now() - t0);

  let tk = performance.now();
  const kit = req.kit ?? (req.topicId ? await getKit(req.topicId, { generate: false }) : null);
  if (!kit) return { status: "gap", reasons: ["no_kit"], timings: { total: total() } };
  const item = req.item ?? (req.itemId ? findKitItem(kit, req.itemId) : null);
  lap("kit", tk);

  tk = performance.now();
  const learner = req.learner ?? (req.childId ? await learnerFor(req.childId, kit.topicId, { timeoutMs: Math.min(LEARNER_TIMEOUT_MS, left() - 400) }) : EMPTY_LEARNER);
  lap("learner", tk);
  const firstName = learner.child?.firstName;

  tk = performance.now();
  const p = plan({ item, kit, move: req.move, child: learner.child ?? undefined, renderers: req.renderers ?? liveRenderers() });
  lap("plan", tk);
  const planOut = { primary: p.primary ? `${p.primary.renderer}${p.primary.template ? "/" + p.primary.template : ""}` : null,
    fallbacks: p.fallbacks.map((a) => `${a.renderer}${a.template ? "/" + a.template : ""}`), reasons: p.reasons };
  if (!p.primary) {
    if (item && !req.noGapRow) recordGap({ topicId: kit.topicId, itemId: item.id, reason: p.reasons.find((r) => r.startsWith("renderer_not_shipped")) || p.reasons[0] || "no_activity", engineHints: kit.formats.engineHints, childId: req.childId });
    return { status: "gap", plan: planOut, rejects: p.rejects, timings: { ...timings, total: total() } };
  }

  const tried = [];
  let childOnly = true;     // every rejection so far was the child-name clash (not a catalogue gap)
  for (const activity of [p.primary, ...p.fallbacks]) {
    const key = fillKey({ item, kit, activity, skins: p.skins, lang: p.lang, band: p.band });
    const label = `${activity.renderer}/${activity.template ?? ""}`;
    tk = performance.now();
    const hit = await getFill(key, { timeoutMs: Math.min(1500, Math.max(200, left() - 500)) });
    timings.cache = (timings.cache ?? 0) + Math.round(performance.now() - tk);
    if (hit.hit) {
      if (childNameClash(hit.body, item, kit, firstName)) { tried.push({ activity: label, failures: ["safety.child_name"] }); continue; }
      if (UPGRADEABLE(hit.body.flavour)) upgradeLater(key, activity, item, kit, p);
      return result(hit.body, key, hit.hit, tried);
    }
    if (deadKeys.has(key)) { tried.push({ activity: label, failures: deadKeys.get(key) }); childOnly = false; continue; }
    // Pre-gate on the code pick (ms): truth, leak, solver and layout do not depend on the flavour, so an activity the
    // gate rejects here is dead for every flavour and every child, and costs no model call. Then the model picks (when
    // the budget allows), and the fill is re-gated with that pick; a pick that fails ships the code pick.
    tk = performance.now();
    const cp = { ...codePick(p.skins), ms: 0 };
    const pre = buildAndGate(activity, item, kit, p, cp, key);
    timings.gate = (timings.gate ?? 0) + Math.round(performance.now() - tk);
    if (!pre.gate.ok) { rememberDead(key, pre.gate.failures); tried.push({ activity: label, failures: pre.gate.failures }); childOnly = false; continue; }
    tk = performance.now();
    const flavour = await flavourPick({ item, topicTitle: kit.skills?.[0]?.title, skins: p.skins, timeoutMs: Math.min(3500, left() - 1500), trace: req.trace });
    timings.model = (timings.model ?? 0) + flavour.ms;
    let { fill, gate } = pre;
    let usedFlavour = cp;
    if (flavour.by === "model") {
      tk = performance.now();
      const withModel = buildAndGate(activity, item, kit, p, flavour, key);
      timings.gate += Math.round(performance.now() - tk);
      if (withModel.gate.ok) { fill = withModel.fill; gate = withModel.gate; usedFlavour = flavour; }
      else { tried.push({ activity: label, failures: withModel.gate.failures, flavour: "model" }); usedFlavour = { ...cp, modelRejected: true }; }
    }
    const body = bodyOf(fill, gate, key, item, kit, usedFlavour, flavour);
    putFill(key, body);
    if (UPGRADEABLE(body.flavour)) upgradeLater(key, activity, item, kit, p);
    if (childNameClash(body, item, kit, firstName)) { tried.push({ activity: label, failures: ["safety.child_name"] }); continue; }
    return result(body, key, null, tried);
  }
  // A child-name clash is about this child, not the catalogue: no demand row, no dead key.
  if (!childOnly && !req.noGapRow) recordGap({ topicId: kit.topicId, itemId: item.id, reason: "gate_failed", engineHints: kit.formats.engineHints, childId: req.childId });
  return { status: "gap", plan: planOut, gateFailures: tried, timings: { ...timings, total: total() } };

  function result(body, key, cached, triedList = []) {
    // Clones: the cached body is shared by every child; the Director may keep and mutate what it is handed.
    return {
      status: "ready", tier: body.tier, renderer: body.renderer, template: body.template, fillKey: key, cached,
      command: structuredClone(mountCommand(body, item, key)), grade: structuredClone(body.grade),
      ui: { caption: captionOf(body.hook, p.lang) },
      plan: planOut, gate: { ...body.gate }, flavour: { ...body.flavour }, rejectedBeforeShip: triedList,
      timings: { ...timings, total: total() }, renderable: true, blobUrl: body.blobUrl ?? null,
    };
  }
}

/** The stored (cached) body of a gated fill. Child-free. */
function bodyOf(fill, gate, key, item, kit, usedFlavour, flavour) {
  return {
    v: FORGE_G1_VERSION, fillKey: key, topicId: kit.topicId, itemId: item.id, kitHash: kit.hash || kitHash(kit),
    tier: fill.tier, renderer: fill.renderer, template: fill.template ?? null,
    payload: fill.renderer === "scene@1" ? { scene: fill.scene } : fill.params,
    grade: { ...fill.grade, ...(fill.miscMap ? { miscMap: fill.miscMap } : {}), binding: bindingFor(fill, moduleIdOf(key), `g1:${item.id}`) },
    hook: fill.hook, skin: fill.skin, decor: fill.decor ?? null,
    flavour: { by: usedFlavour.by, ms: flavour.ms, ...(flavour.error ? { error: flavour.error } : {}), ...(usedFlavour.modelRejected ? { modelRejected: true } : {}) },
    gate: { ok: true, version: gate.gateVersion, ms: gate.ms, bytes: gate.bytes }, createdAt: new Date().toISOString(),
  };
}

/** After the response: one full-budget flavour pick for a key that shipped a code pick; a passing model pick replaces
 *  the cached code pick (same truth, same gate, different title row / decor) for the NEXT request. Never awaited. */
const pendingUpgrades = new Set();
export const flushUpgrades = () => Promise.allSettled([...pendingUpgrades]);
function upgradeLater(key, activity, item, kit, p) {   // no trace: it runs after the caller's turn ended
  if (upgradeTried.has(key) || process.env.FORGE_FLAVOUR === "off") return;
  upgradeTried.add(key); if (upgradeTried.size > 20_000) upgradeTried.delete(upgradeTried.values().next().value);
  const job = (async () => {
    await new Promise((r) => setImmediate(r));   // start after the caller's response, never inside it
    const flavour = await flavourPick({ item, topicTitle: kit.skills?.[0]?.title, skins: p.skins });
    if (flavour.by !== "model") return;
    const built = buildAndGate(activity, item, kit, p, flavour, key);
    if (!built.gate.ok) return;
    putFill(key, bodyOf(built.fill, built.gate, key, item, kit, flavour, flavour));
  })().catch((e) => console.warn("[forge] upgrade failed:", String(e.message).slice(0, 120)));
  pendingUpgrades.add(job); job.finally(() => pendingUpgrades.delete(job));
}

/**
 * Lesson-start prefetch (FACTORY.md §6.4 H2). Loads the per-lesson learner snapshot once (the turn path then reads
 * it from memory), then fills, in the order the lesson will reach them: this child's recent wrong items
 * (errorReplays), diagnostics of their active misconceptions, then the Director's own practice queue
 * (server/director/items.js buildPracticeQueue). Every candidate is PLANNED first (pure, ms): only items that can
 * become a mountable activity count toward `max`, so slots are not spent on gaps (and prefetch writes no gap rows:
 * demand is counted when a lesson actually reaches an item). Never awaited by the lesson start.
 * @returns {Promise<{ itemId: string, role: string, status: string, tier: string|null, ms: number }[]>}
 */
export async function prefetchLessonFills({ lessonId, childId, topicId, kit: kitIn, learner: learnerIn, max = 6, concurrency = 3, renderers, needByMs }) {
  const kit = kitIn ?? await getKit(topicId, { generate: false });
  if (!kit) return [];
  const learner = learnerIn ?? (childId ? await learnerFor(childId, kit.topicId, { fresh: true }) : EMPTY_LEARNER);
  if (childId && learnerIn) primeLearner(childId, kit.topicId, learnerIn);
  const live = renderers ?? liveRenderers();
  const picks = [];
  const seen = new Set();
  const push = (item, role) => {
    if (!item || seen.has(item.id) || picks.length >= max) return;
    seen.add(item.id);
    if (!plan({ item, kit, move: "practice", child: learner.child ?? undefined, renderers: live }).primary) return;
    picks.push({ item, role });
  };
  for (const id of learner.recentWrong) push(findKitItem(kit, id), "error_replay");
  for (const m of learner.activeMisconceptions) push(findKitItem(kit, `diag:${m}`), "trigger");
  for (const id of practiceOrder(kit, learner)) push(findKitItem(kit, id), "practice");
  const out = [];
  for (let i = 0; i < picks.length; i += concurrency) {
    out.push(...await Promise.all(picks.slice(i, i + concurrency).map(async ({ item, role }) => {
      const r = await requestFill({ lessonId, childId, kit, item, move: "practice", learner, renderers: live, needByMs, noGapRow: true });
      return { itemId: item.id, role, status: r.status, tier: r.tier ?? null, ms: r.timings?.total ?? 0 };
    })));
  }
  return out;
}

/** The Director's practice queue, then every other non-teach-back item in kit order (the queue holds ≤ 12). */
export function practiceOrder(kit, learner = EMPTY_LEARNER) {
  const q = buildPracticeQueue(kit, { activeMisconceptionIds: learner.activeMisconceptions || [] });
  return [...new Set([...q, ...kit.items.filter((i) => i.kind !== "teachback").map((i) => i.id)])];
}

export { moveKind };
