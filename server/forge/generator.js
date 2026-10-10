// The G1 flavour pick: ONE strict-schema taxila-fast call (effort "none") that chooses, inside closed enums, the
// skin, the title row and a decor sprite that fit this item for this child (FACTORY.md §1.1 G1: "an optional ≤ 3 s
// taxila-fast flavour pick inside enums"; content-live-tiers t1-effort-none: fast/none 1.88 s p50, 10/10 valid,
// genui-bench n = 10). It writes no free text and no truth: every value it can return is a pre-cleared table row,
// so a wrong pick costs taste, never correctness. On timeout, refusal or error the code pick is used.
import { chat, DEPLOY } from "../azure.js";
import { HOOKS, DECOR } from "./strings.js";

export const PROMPT_VERSION = "g1-flavour@1";
/** Test seam: `npm test` runs every test file in ONE process (tests/index.js), so a file cannot own globalThis.fetch;
 *  tests swap the chat function instead. Never set by production code. */
let chatFn = chat;
export const _setChat = (fn) => { chatFn = fn ?? chat; };
export const FLAVOUR_TIMEOUT_MS = 3500;

/** Deterministic pick: the first skin, its first hook, its first decor (stable for caching and tests). */
export function codePick(skins) {
  const skin = skins[0] ?? "generic";
  return { skin, hook: HOOKS[skin][0].id, decor: DECOR[skin][0], by: "code" };
}

function schemaFor(skins) {
  const hooks = skins.flatMap((s) => HOOKS[s].map((h) => h.id));
  const decor = [...new Set(skins.flatMap((s) => DECOR[s]))];
  return {
    type: "object", additionalProperties: false, required: ["skin", "hook", "decor"],
    properties: { skin: { type: "string", enum: skins }, hook: { type: "string", enum: hooks }, decor: { type: "string", enum: decor } },
  };
}

/**
 * @param {{ item: any, topicTitle?: string, skins: string[], timeoutMs?: number, trace?: any[] }} a
 * @returns {Promise<{ skin: string, hook: string, decor: string, by: "model"|"code", ms: number, error?: string, usage?: any }>}
 */
export async function flavourPick({ item, topicTitle, skins, timeoutMs = FLAVOUR_TIMEOUT_MS, trace }) {
  const t0 = performance.now();
  const fallback = (error) => ({ ...codePick(skins), ms: Math.round(performance.now() - t0), ...(error ? { error } : {}) });
  if (process.env.FORGE_FLAVOUR === "off") return fallback("flavour_off");
  // Not enough of the caller's budget left for a call (the turn path at needByMs 2000 always lands here): the code
  // pick ships now and index.js may upgrade the cached fill to a model pick in the background ("no_time").
  // ≤, not <: the turn path passes 2000 − 1500 − elapsed, exactly 500 when the clock has not advanced (a virtual or
  // coarse performance.now), and a 500 ms call against a 1.88 s p50 is a billed timeout, not a pick.
  if (timeoutMs <= 500) return fallback("no_time");
  // Structure, not sentences: labelled fields the model reads; nothing here is text a child or voice will see.
  const sys = [
    "task: pick skin, hook and decor for a short practice activity. JSON only.",
    "skin: the child's interest that sits most naturally with the activity's subject matter.",
    "hook: a title row id of that skin. decor: a small picture id of that skin; it decorates, it never shows the answer.",
  ].join("\n");
  const user = JSON.stringify({ subject_matter: String(item.prompt_en).slice(0, 240), topic: topicTitle ?? null,
    skins: Object.fromEntries(skins.map((s) => [s, { hooks: HOOKS[s].map((h) => `${h.id}: ${h.en}`), decor: DECOR[s] }])) });
  try {
    const r = await chatFn(DEPLOY.fast, [{ role: "system", content: sys }, { role: "user", content: user }],
      { schema: schemaFor(skins), schemaName: "g1_flavour", effort: "none", maxTokens: 120, timeoutMs, retries: 0, trace });
    const j = r.json;
    // The schema is strict, but a pick is accepted only if it is consistent across fields (hook of that skin).
    if (!skins.includes(j.skin) || !HOOKS[j.skin].some((h) => h.id === j.hook) || !DECOR[j.skin].includes(j.decor)) {
      return { ...fallback("inconsistent_pick"), usage: r.usage };
    }
    return { skin: j.skin, hook: j.hook, decor: j.decor, by: "model", ms: Math.round(performance.now() - t0), usage: r.usage };
  } catch (e) {
    return fallback(String(e.code || e.message || e).slice(0, 80));
  }
}
