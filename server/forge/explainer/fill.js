// The explainer's MODEL fill (W2-B #2/#3: "a G1 template fill: the model fills data, code animates"). One strict-
// schema taxila-fast call (effort none) picks a diagram template and fills its slots with short labels taken FROM THE
// KIT; code then expands, lays out and lints it (templates.js). Truth rule: every content word of every label must
// occur in the kit's own text (expectations, items, worked example, misconceptions and their representations), so a
// label can be a shortening of the book's words, never a new claim. A label that fails is a failed fill: the ladder
// steps down (library → code pick → the engine show / the board), never a placeholder.
//
// Called off the turn path only: at lesson start (seam prefetch), on the move BEFORE explain (the hook: her preamble
// covers the ~3 s), and by the offline library build (evals/forge-explainer.mjs --build). Background quota lane.
import { chat, DEPLOY } from "../../azure.js";
import { SKETCHES, BOARD } from "./templates.js";
import { checkCall } from "./truth.js";
export { checkCall, kitVocabulary, unknownWords, labelsOf, stem } from "./truth.js";

export const FILL_VERSION = "explainer-fill@1";
export const FILL_TIMEOUT_MS = 6000;
let chatFn = chat;
/** Test seam (tests swap the model; never set by production code). */
export const _setChat = (fn) => { chatFn = fn ?? chat; };

const LABEL = { type: "string", maxLength: 24 };
const nullable = (s) => ({ anyOf: [s, { type: "null" }] });
const SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["template", "steps", "stages", "centre", "left", "right", "whole", "parts", "sketch", "labels"],
  properties: {
    template: { type: "string", enum: ["flow@1", "cycle@1", "compare@1", "parts@1", "label@1", "none"] },
    steps: nullable({ type: "array", items: LABEL, minItems: 2, maxItems: 6 }),
    stages: nullable({ type: "array", items: LABEL, minItems: 3, maxItems: 6 }),
    centre: nullable(LABEL),
    left: nullable({ type: "object", additionalProperties: false, required: ["title", "items"], properties: { title: LABEL, items: { type: "array", items: LABEL, minItems: 1, maxItems: 4 } } }),
    right: nullable({ type: "object", additionalProperties: false, required: ["title", "items"], properties: { title: LABEL, items: { type: "array", items: LABEL, minItems: 1, maxItems: 4 } } }),
    whole: nullable(LABEL),
    parts: nullable({ type: "array", items: LABEL, minItems: 2, maxItems: 6 }),
    sketch: nullable({ type: "string", enum: SKETCHES }),
    labels: nullable({ type: "array", minItems: 2, maxItems: 6, items: { type: "object", additionalProperties: false, required: ["anchor", "text"],
      properties: { anchor: { type: "string", enum: ["flower", "leaf", "stem", "root", "soil", "fruit", "petal", "centre", "stamen", "pistil", "sepal", "blade", "midrib", "vein", "stalk", "tip", "margin", "head", "thorax", "abdomen", "antenna", "eye", "leg"] }, text: LABEL } } }),
  },
};

/** The call the model returned, reduced to the chosen template's own slots. */
function callOf(j) {
  const t = j?.template;
  switch (t) {
    case "flow@1": return { template: t, steps: j.steps };
    case "cycle@1": return { template: t, stages: j.stages, ...(j.centre ? { centre: j.centre } : {}) };
    case "compare@1": return { template: t, left: j.left, right: j.right };
    case "parts@1": return { template: t, whole: j.whole, parts: j.parts };
    case "label@1": return { template: t, sketch: j.sketch, labels: j.labels };
    default: return null;
  }
}

/**
 * Fill a diagram template from a kit (one model call). Never throws.
 * @param {{ kit: any, topicTitle?: string, band?: string, timeoutMs?: number, trace?: any[] }} a
 * @returns {Promise<{ ok: boolean, call?: any, why?: string, ms: number, usage?: any }>}
 */
export async function modelFill({ kit, topicTitle, band = "B3", timeoutMs = FILL_TIMEOUT_MS, trace }) {
  const t0 = performance.now();
  const done = (r) => ({ ...r, ms: Math.round(performance.now() - t0) });
  if (process.env.FORGE_EXPLAINER_MODEL === "off") return done({ ok: false, why: "model_off" });
  // Fields, not sentences: what the model reads; nothing here is text a child or a voice will see.
  const sys = [
    "task: choose ONE board diagram that best shows the topic's core idea to a child, and fill it. JSON only.",
    "templates: flow = an ordered chain of 2-6 steps or causes; cycle = 3-6 stages that loop back; compare = two things side by side, 1-4 short points each;",
    "parts = a whole and its 2-6 parts or kinds; label = a sketch (plant, flower, leaf, insect) with 2-6 of its parts named; none = no diagram fits.",
    "labels: 1-3 words each, at most 20 characters, taken from the kit's own words (shorten, never add facts); English terms as the book uses them.",
    "fill only the chosen template's fields; every other field null.",
  ].join("\n");
  const user = JSON.stringify({
    topic: topicTitle ?? kit?.topicId, class: kit?.topicId?.match(/^c(\d)/)?.[1] ?? null,
    key_ideas: (kit?.expectations ?? []).slice(0, 6),
    pictures_the_book_suggests: (kit?.misconceptions ?? []).map((m) => m.remediation?.representation).filter(Boolean).slice(0, 4),
    worked_example: kit?.workedExample ? { problem: kit.workedExample.problem, steps: (kit.workedExample.steps ?? []).slice(0, 6) } : null,
  });
  try {
    const r = await chatFn(DEPLOY.fast, [{ role: "system", content: sys }, { role: "user", content: user }],
      { schema: SCHEMA, schemaName: "explainer_fill", effort: "none", maxTokens: 500, timeoutMs, retries: 0, trace, quotaLane: "background" });
    const call = callOf(r.json);
    if (!call) return done({ ok: false, why: "none", usage: r.usage });
    const c = checkCall(call, kit, { band });
    return c.ok ? done({ ok: true, call, usage: r.usage }) : done({ ok: false, why: c.why, call, usage: r.usage });
  } catch (e) {
    return done({ ok: false, why: String(e?.code || e?.message || e).slice(0, 80) });
  }
}

export { BOARD };
