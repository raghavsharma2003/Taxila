// Production rung builders (STAGECRAFT.md §5.2-§5.5; shared/stagecraft.ts RungBuilders). Every builder is injected into
// host.js; the conductor never imports this file (it stays pure and .ts-free). Child-free by construction: every
// prompt is built in code from closed vocabulary (archetype, kit slice, misconception id, band, lang); no child words,
// no child id, no name ever reaches a model (B9). Grading stays with gradeAnswer on the host (B3).
//
//   instant.engineDefault  validateSpec(archetype, kit-seeded default) — synchronous, ≈ 0 ms, always correct
//   instant.boardTwin      the code-built board version of the same idea with the same values (L7)
//   instant.rebind         late binding of the child's committed values, then validateSpec again (SC-4)
//   generatedSpec          a small structured call → validateSpec (a fallback to the reviewed default is a FAILED
//                          personal spec: the engine default already serves) → Q8 on every child-visible string
//   image                  text-free art on the image lane (flare low, then gpt-image-2 low): art only, never a fact (B5);
//                          ready only after an OCR no-text presence check and Content Safety (both injected; absent = fail)
//   liveCodegen            router.decide must say "live" → planBuild → buildRace → revealable({ gate })
//   library                the promoted library variant (server/studio/library.js lookup), keyed by structure
import { z } from "zod";
import { ENGINE_SPECS, validateSpec, specJsonSchema } from "../../shared/studio-spec.ts";
import { ENGINE_SPECS_EXT, validateAny } from "../../shared/studio-spec-ext/index.ts";
import { authoredSpec, kitTopicAny, unknownKitIds, titleOf, stringsOfSpec } from "./catalogue.js";
import { keyTerms } from "../forge/explainer/terms.js";

/** topicId → kit topic (data/kits/c4-c7, every subject since ship5 p4-content: the catalogue covers all six), read once. */
export function kitTopic(topicId) { return kitTopicAny(topicId); }
/** The closed-vocabulary kit slice a spec prompt may carry (ids, item prompts and answers; never a child's words). */
export function kitSlice(topicId, misconceptionId = null) {
  const t = kitTopic(topicId);
  if (!t) return { topicId };
  const mis = (t.misconceptions ?? []).filter((m) => !misconceptionId || m.id === misconceptionId).map((m) => ({ id: m.id, belief: m.belief }));
  return { topicId, misconceptions: mis.length ? mis : (t.misconceptions ?? []).map((m) => ({ id: m.id, belief: m.belief })),
    items: (t.items ?? []).slice(0, 8).map((i) => ({ prompt: i.prompt_en, answer: i.answer, kind: i.kind, targets: i.targetsMisconception ?? null })) };
}

/** The generated-spec prompt: system rules first, the archetype's notes and the request LAST (position is mechanism). */
export function specPrompt(c, key) {
  const a = c.archetype, d = ENGINE_SPECS[a] ?? ENGINE_SPECS_EXT[a];
  const schema = JSON.stringify(ENGINE_SPECS[a] ? specJsonSchema(a) : schemaOfExt(a));
  // ship5 p4-content: the example is THIS topic's checked authored spec when the catalogue has one (the shape is right and
  // the content is on-topic), else the archetype's reviewed default (a different lesson)
  const ex = JSON.stringify(authoredSpec(key.topicId, a) ?? d.defaultSpec).slice(0, 5000);
  const slice = JSON.stringify(kitSlice(key.topicId, c.premise?.misconceptionId ?? null)).slice(0, 3500);
  const aim = c.need === "contrast_misconception" ? `aimed at the misconception ${c.premise?.misconceptionId ?? "listed"}`
    : c.need === "re_represent" ? "a different representation of the same idea" : c.need === "practice" ? "practice after an untimed success" : `need ${c.need}`;
  return [
    { role: "system", content: "You plan Studio pieces for Indian students aged 9-15 (NCERT classes 4-7). Output ONE JSON object: a spec for the named engine. The engine owns physics, truth and feel; you choose items, order, pacing and short labels. Every number must come from the kit slice or be exactly computable. Labels: short, plain, no markup, no emoji, not sentences to be read aloud." },
    { role: "user", content: `ENGINE ${a} (${d.title}, ${d.kind}).\nJSON SCHEMA:\n${schema}\nONE VALID EXAMPLE (a different lesson; do not copy its items):\n${ex}\nKIT SLICE:\n${slice}\nBAND ${key.band}; LANG ${key.lang === "hi" ? "hi" : key.lang === "en" ? "en" : "hinglish"}.\nPlan a fresh spec for topic ${key.topicId}, ${aim}. Use skills [${JSON.stringify(key.topicId)}]. Return only the JSON.` },
  ];
}

/** The image prompt: a fixed template + one kit term; text-free by instruction AND by the OCR check after. */
export function imagePrompt(c, key) {
  const t = kitTopic(key.topicId);
  const term = String(t?.skills?.[0]?.title ?? t?.topicId ?? "a classroom idea").replace(/[^\p{L}\p{N} ,'-]/gu, "").slice(0, 60);
  return `Children's picture-book watercolour scene evoking ${term}, set in an Indian home or school, warm palette, plain background, absolutely no text, letters, numbers or symbols.`;
}

const ok = (o = {}) => ({ truth: true, stageContract: true, onTopic: true, contentSafe: true, ...o });
const facts = (c, extra = {}) => ({ kind: c.kind, archetype: c.archetype, onScreen: { title: titleOf(c.archetype), ...extra } });
const clip = (t, n) => { const x = String(t ?? "").replace(/[<>{}\n]/g, " ").replace(/\s+/g, " ").trim(); return x.length > n ? `${x.slice(0, n - 1).trimEnd()}…` : x; };
/**
 * What a spec puts on screen, as VALUES for her facts row (ship5 p4-content): the piece's own title, the labels its first
 * scenes show, its rounds, and the question it asks — never an answer key (keys are the host's; the catalogue's blind
 * check and the authoring rule keep answers out of prompts). Her line may name only these (AT-7).
 */
export function factsOfSpec(archetype, spec) {
  const on = {};
  if (!spec || typeof spec !== "object") return on;
  if (typeof spec.title === "string") on.title = clip(spec.title, 40);
  if (Array.isArray(spec.scenes)) {
    const labels = [];
    for (const sc of spec.scenes) for (const e of sc?.els ?? []) if (["title", "label", "node", "quote"].includes(e?.type) && typeof e.text === "string" && e.type !== "myth") labels.push(clip(e.text, 24));
    const uniq = [...new Set(labels)].filter((l) => l && l !== on.title).slice(0, 4);
    if (uniq.length) on.shows = uniq.join(" · ");
    on.scenes = spec.scenes.length;
  }
  if (Array.isArray(spec.rounds)) {
    on.rounds = spec.rounds.length;
    const first = spec.rounds.find((r) => typeof r?.title === "string");
    if (first) on.first = clip([first.title, first.sub].filter((x) => typeof x === "string").join(": "), 60);
  }
  if (spec.task && typeof spec.task.prompt === "string") on.asks = clip(spec.task.prompt, 90);
  return on;
}
const schemaOfExt = (a) => { try { return z.toJSONSchema(ENGINE_SPECS_EXT[a].schema, { unrepresentable: "any" }); } catch { return {}; } };
const langOf = (key, d) => (key?.lang === "hi" ? "hi" : key?.lang === "en" ? "en" : d.defaultSpec.lang);

/**
 * The code-built board twin (L7): the same idea as the candidate, drawn by the Studio v2 board renderer (title + up to
 * four short lines, no figure), from the topic's KIT only: the piece's own title and the kit's key terms. Its values are
 * the candidate's facts (title), so her line stays true when a mount fails and the twin shows instead.
 */
export function boardTwinFor(c, topicId) {
  const title = String(titleOf(c.archetype) ?? c.need ?? "board").slice(0, 40);
  const kit = topicId ? kitTopicAny(topicId) : null;
  let lines = [];
  try { lines = kit ? keyTerms(kit, 4).map((t) => String(t).slice(0, 64)) : []; } catch { lines = []; }
  return { scriptRef: `board:${c.family}`, values: { title, need: c.need ?? "explain" }, board: { title, lines, figure: { kind: "none" } } };
}

/**
 * @param {{
 *   chat?: Function, imageCall?: (dep: string, prompt: string, signal: AbortSignal) => Promise<{ url?: string, b64?: string, usd?: number }>,
 *   ocrNoText?: (img: object) => Promise<boolean>, contentSafety?: (img: object) => Promise<boolean>, q8?: (strings: Record<string,string>) => Promise<{ ok: boolean }>,
 *   decide?: Function, planBuild?: Function, buildRace?: Function, revealable?: Function, libraryLookup?: (c: object) => Promise<object|null>,
 *   usdOf?: Function, normUsage?: Function, child?: object, lessonInfo?: () => object,
 * }} deps
 */
export function createBuilders(deps = {}) {
  const instant = {
    // ship5 p4-content: the instant rung serves THIS topic's checked authored spec (data/studio-catalogue, re-validated by
    // catalogue.js) when there is one; else, for a base RS-4 archetype whose reviewed outcomes list the topic, the reviewed
    // default. An extension archetype has no topic-free default: without an authored spec it is not on-topic (never shown).
    engineDefault(c, key) {
      const base = ENGINE_SPECS[c.archetype], ext = ENGINE_SPECS_EXT[c.archetype];
      const d = base ?? ext;
      if (!d) return { payload: null, checks: ok({ truth: false }), facts: facts(c) };
      const authored = key?.topicId ? authoredSpec(key.topicId, c.archetype) : null;
      if (authored) {
        const v = validateAny(c.archetype, structuredClone(authored));
        const idsOk = !unknownKitIds(kitTopicAny(key.topicId), v.spec).length;
        return { payload: { rung: "engine_default", archetype: c.archetype, spec: v.spec, lateBind: [], source: "catalogue" },
          checks: ok({ spec: { ok: !v.fellBack, repairs: v.repairs.length, fellBack: v.fellBack }, onTopic: !v.fellBack, truth: idsOk }), facts: facts(c, factsOfSpec(c.archetype, v.spec)) };
      }
      if (!base) return { payload: null, checks: ok({ onTopic: false }), facts: facts(c) };
      const v = validateSpec(c.archetype, { ...structuredClone(base.defaultSpec), lang: langOf(key, base) });
      const onTopic = !!key?.topicId && base.outcomes.topics.includes(key.topicId);
      return { payload: { rung: "engine_default", archetype: c.archetype, spec: v.spec, lateBind: [], source: "reviewed_default" }, checks: ok({ spec: { ok: true, repairs: v.repairs.length, fellBack: v.fellBack }, onTopic }), facts: facts(c) };
    },
    boardTwin(c) { return boardTwinFor(c, c.premise?.topicId ?? null); },
    rebind(c, committed) {
      const slots = c.payload?.lateBind ?? [];
      if (!slots.length) return { ok: true };
      const spec = structuredClone(c.payload.spec);
      for (const s of slots) setPath(spec, s.path, committed?.[s.from] ?? s.fallback);
      const v = validateSpec(c.archetype, spec);
      return v.fellBack ? { ok: false } : { ok: true, values: Object.fromEntries(slots.map((s) => [s.path, committed?.[s.from] ?? s.fallback])), spec: v.spec };
    },
  };

  async function generatedSpec(c, dep, signal, key) {
    if (!deps.chat) throw Object.assign(new Error("no chat dependency"), { code: "unwired" });
    const res = await deps.chat(dep, specPrompt(c, key), { json: true, maxTokens: 6000, effort: "low", schemaName: "spec", signal, quotaLane: "background", timeoutMs: 20_000, retries: 0 });   // signal: patch P8 (azure.js does not forward it yet)
    const usd = deps.usdOf && deps.normUsage ? deps.usdOf(dep, deps.normUsage(res.usage)) : 0;
    const v = validateAny(c.archetype, res.json);
    if (v.fellBack) return { ok: false, usd, why: "fell_back" };
    // the code-checked kit-id validator: a cited id that is not this topic's kit makes the spec unusable (never trusted)
    if (unknownKitIds(kitTopicAny(key.topicId), v.spec).length) return { ok: false, usd, why: "unknown_kit_id" };
    // "A model never grades" (ship5 review B2): every graded key of a model-written spec must be a key a CHECKED spec of
    // this topic already carries (the authored catalogue spec, verified against the kit when it was built, or the reviewed
    // default), unless the engine computes the key from numbers on screen (pure maths: the engine owns that truth). A key
    // the model authored (a tap answer, a date, a bin, an order, a rhyme) is never graded against: the spec is refused and
    // the checked engine default serves.
    if (!keysVerified(c.archetype, v.spec, key.topicId)) return { ok: false, usd, why: "unverified_key" };
    // Q8 on every child-visible string the model WROTE: strings already in this topic's checked authored spec (or the
    // reviewed default) were checked when that spec was; the new ones go through Content Safety (+ the brain classifier
    // for Hindi / Hinglish) — fail closed (ship5 p4-content: this keeps Content Safety to the strings that need it)
    let contentSafe = true;
    if (deps.q8) {
      const known = new Set(Object.values(stringsOfSpec(authoredSpec(key.topicId, c.archetype) ?? (ENGINE_SPECS[c.archetype] ?? ENGINE_SPECS_EXT[c.archetype])?.defaultSpec ?? {})));
      const fresh = Object.fromEntries(Object.entries(stringsOfSpec(v.spec)).filter(([, t]) => !known.has(t)).slice(0, 60));
      if (Object.keys(fresh).length) { try { contentSafe = !!(await deps.q8(fresh, key.lang))?.ok; } catch { contentSafe = false; } }
    }
    const onTopic = !!ENGINE_SPECS[c.archetype]?.outcomes.topics.includes(key.topicId) || !!authoredSpec(key.topicId, c.archetype);
    return { ok: true, usd, payload: { rung: "generated_spec", archetype: c.archetype, spec: v.spec, lateBind: [] }, checks: ok({ spec: { ok: true, repairs: v.repairs.length, fellBack: false }, contentSafe, onTopic }), facts: facts(c, factsOfSpec(c.archetype, v.spec)) };
  }

  async function image(c, dep, signal, key) {
    if (!deps.imageCall) throw Object.assign(new Error("no image dependency"), { code: "unwired" });
    const img = await deps.imageCall(dep, imagePrompt(c, key), signal);
    const noText = deps.ocrNoText ? await deps.ocrNoText(img).catch(() => false) : false;      // absent checker = not ready (B5)
    const safe = deps.contentSafety ? await deps.contentSafety(img).catch(() => false) : false;
    return { ok: noText && safe, usd: img.usd ?? 0.0066, payload: { rung: "image", prompt: { template: "img@1", hash: String(img.hash ?? "") }, blobUrl: img.url, overlays: [] }, checks: ok({ contentSafe: noText && safe }), facts: { kind: "image", archetype: "image", onScreen: {} } };
  }

  async function liveCodegen(c, signal, key) {
    if (!deps.decide || !deps.planBuild || !deps.buildRace) throw Object.assign(new Error("no race dependency"), { code: "unwired" });
    const intent = { intentId: c.id, lessonId: key.lessonId, kind: c.kind, skillId: key.skillId, need: c.need === "re_represent" || c.need === "verify" || c.need === "switch_modality" ? "practice" : c.need,
      ...(c.premise?.misconceptionId ? { misconceptionId: c.premise.misconceptionId } : {}), beat: key.beat, neededAtMs: c.deadlineAt, priority: "on_cue",
      style: { band: key.band, lang: key.lang, motion: key.band === "B1" ? "calm" : "lively" } };
    const d = deps.decide({ intent, archetypeId: c.archetype, admissible: true, child: deps.child ?? {}, lesson: deps.lessonInfo?.() ?? {} });
    if (d.action !== "live") return { ok: false, usd: 0, why: `router_${d.action}` };
    const plan = await deps.planBuild({ ...intent, kind: c.kind }, { kit: kitTopic(key.topicId) ?? undefined });
    if (!plan?.ok) return { ok: false, usd: 0, why: "plan_failed" };
    const r = await deps.buildRace(plan.plan ?? plan, { signal, band: key.band, lang: key.lang });
    const gatePassed = !!(r.ok && (deps.revealable ? deps.revealable({ gate: r.winner?.gate }) : r.winner?.gate?.pass));
    return { ok: gatePassed, usd: r.usd ?? 0, payload: { rung: "live_codegen", intentId: c.id, buildSha: r.winner?.sha256 }, checks: ok({ gatePassed }), facts: { kind: c.kind, archetype: c.archetype, onScreen: {} } };
  }

  async function library(c) {
    const row = deps.libraryLookup ? await deps.libraryLookup(c).catch(() => null) : null;
    if (!row) return { ok: false, usd: 0, why: "miss" };
    return { ok: true, usd: 0, payload: { rung: "library", buildSha: row.buildSha, identity: row.identity, params: row.params ?? {} }, checks: ok(), facts: facts(c) };
  }

  return { instant, generatedSpec, image, liveCodegen, library };
}

export { stringsOfSpec } from "./catalogue.js";

/** Extension engines whose keys are computed by the engine from the numbers the spec puts on screen (no authored fact). */
export const COMPUTED_KEY_ARCHETYPES = new Set(["dukaan@1", "fraction-ops@1", "geo-forge@1", "mirror-paint@1", "pattern-lab@1",
  "pictograph@1", "rule-machine@1", "sieve-storm@1", "solid-view@1", "zero-pair@1"]);
const norm = (x) => String(x ?? "").normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
const keysOf = (archetype, spec) => { try { return ENGINE_SPECS_EXT[archetype]?.keys?.(spec) ?? []; } catch { return null; } };
/**
 * Are all of a generated spec's graded keys verified? Base RS-4 engines grade from the engine's own physics over the
 * spec's numbers (no authored key). An extension engine's keys are verified when the engine computes them, or when each
 * (prompt, key) pair — or (kit src, key) for a key that cites a kit item — is one a checked spec of this topic carries.
 */
export function keysVerified(archetype, spec, topicId) {
  if (!ENGINE_SPECS_EXT[archetype]) return true;
  if (COMPUTED_KEY_ARCHETYPES.has(archetype)) return true;
  const mine = keysOf(archetype, spec);
  if (!mine) return false;
  if (!mine.length) return true;
  const checked = [authoredSpec(topicId, archetype), ENGINE_SPECS_EXT[archetype].defaultSpec].filter(Boolean);
  const pairs = new Set(), bySrc = new Map();
  for (const cs of checked) for (const k of keysOf(archetype, cs) ?? []) {
    pairs.add(`${norm(k.prompt)}\u0000${norm(k.key)}`);
    if (k.src) bySrc.set(k.src, [...(bySrc.get(k.src) ?? []), norm(k.key)]);
  }
  return mine.every((k) => (k.src && bySrc.has(k.src) ? bySrc.get(k.src).includes(norm(k.key)) && !!k.src
    : pairs.has(`${norm(k.prompt)}\u0000${norm(k.key)}`)));
}

function setPath(obj, path, value) {
  const parts = String(path).split(".");
  let o = obj;
  for (let i = 0; i < parts.length - 1; i++) { if (o == null) return; o = o[/^\d+$/.test(parts[i]) ? +parts[i] : parts[i]]; }
  if (o != null) o[parts.at(-1)] = value;
}

/** The catalog (catalog.js buildCatalog input) from the shipped engine registry. */
export const engineSpecsForCatalog = () => ENGINE_SPECS;
