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
import fs from "node:fs";
import { ENGINE_SPECS, validateSpec, specJsonSchema } from "../../shared/studio-spec.ts";

const KITS_DIR = new URL("../../data/kits/", import.meta.url);
let kitIndex = null;
/** topicId → kit topic (data/kits/c4-c7 maths/science/evs), read once. */
export function kitTopic(topicId) {
  if (!kitIndex) {
    kitIndex = {};
    for (const f of fs.readdirSync(KITS_DIR)) if (/^c[4-7]-(maths|science|evs)\.json$/.test(f)) {
      for (const t of JSON.parse(fs.readFileSync(new URL(f, KITS_DIR), "utf8")).topics ?? []) kitIndex[t.topicId] = t;
    }
  }
  return kitIndex[topicId] ?? null;
}
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
  const a = c.archetype, d = ENGINE_SPECS[a];
  const schema = JSON.stringify(specJsonSchema(a));
  const ex = JSON.stringify(d.defaultSpec).slice(0, 5000);
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
const facts = (c, extra = {}) => ({ kind: c.kind, archetype: c.archetype, onScreen: { title: ENGINE_SPECS[c.archetype]?.title ?? c.archetype, ...extra } });

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
    engineDefault(c, key) {
      const d = ENGINE_SPECS[c.archetype];
      if (!d) return { payload: null, checks: ok({ truth: false }), facts: facts(c) };
      const v = validateSpec(c.archetype, { ...structuredClone(d.defaultSpec), lang: key?.lang === "hi" ? "hi" : key?.lang === "en" ? "en" : d.defaultSpec.lang });
      const onTopic = !!key?.topicId && d.outcomes.topics.includes(key.topicId);
      return { payload: { rung: "engine_default", archetype: c.archetype, spec: v.spec, lateBind: [] }, checks: ok({ spec: { ok: true, repairs: v.repairs.length, fellBack: v.fellBack }, onTopic }), facts: facts(c) };
    },
    boardTwin(c) {
      const title = ENGINE_SPECS[c.archetype]?.title ?? (c.need ?? "board");
      return { scriptRef: `board:${c.family}`, values: { title, need: c.need ?? "explain" }, board: { title, lines: [], figure: { kind: "none" } } };
    },
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
    const v = validateSpec(c.archetype, res.json);
    if (v.fellBack) return { ok: false, usd, why: "fell_back" };
    let contentSafe = true;
    if (deps.q8) { try { contentSafe = !!(await deps.q8(v.spec.strings ?? {}))?.ok; } catch { contentSafe = false; } }
    return { ok: true, usd, payload: { rung: "generated_spec", archetype: c.archetype, spec: v.spec, lateBind: [] }, checks: ok({ spec: { ok: true, repairs: v.repairs.length, fellBack: false }, contentSafe, onTopic: ENGINE_SPECS[c.archetype].outcomes.topics.includes(key.topicId) }), facts: facts(c) };
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

function setPath(obj, path, value) {
  const parts = String(path).split(".");
  let o = obj;
  for (let i = 0; i < parts.length - 1; i++) { if (o == null) return; o = o[/^\d+$/.test(parts[i]) ? +parts[i] : parts[i]]; }
  if (o != null) o[parts.at(-1)] = value;
}

/** The catalog (catalog.js buildCatalog input) from the shipped engine registry. */
export const engineSpecsForCatalog = () => ENGINE_SPECS;
