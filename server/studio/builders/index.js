// Studio builder adapters (LIVE-STUDIO S3): one streamed generation of a single-file artifact on one routed arm, with
// the stream guard applied AT TOKEN TIME (the veil and the gate only ever see guarded text) and the deterministic
// fixers after the stream. Chat completions for most arms, the Responses API for the codex family (taxila-codex is
// Responses-only on Foundry). Every call is on the BACKGROUND quota lane and child-free (the prompt is the plan's).
//
// runBuilder(arm, { system, user }, opts) → { ok, html, raw, fixes, hints, scriptError, ttftMs, firstPaintMs, ms, usage, usd, error? }
import { chatStream } from "../../azure.js";
import { createStreamGuard } from "../stream-guard.js";
import { fixFragment } from "../fixers.js";

/** Deployments served only by the Responses API. */
export const RESPONSES_ONLY = new Set(["taxila-codex"]);
let streamFn = chatStream;
/** Test seam: replace the streaming client (tests feed scripted streams; production never sets it). */
export const _setStream = (fn) => { streamFn = fn ?? chatStream; };

/** A partial is worth painting once it holds a style block and some markup (the veil's first wash). */
const paintable = (t) => /<\/style>/i.test(t) && /<(svg|div|section|main|button|h\d|p)\b/i.test(t.slice(t.search(/<\/style>/i)));

/**
 * @param {{ dep: string, effort?: string, api?: "chat" | "responses", maxTokens?: number }} arm
 * @param {{ system: string, user: string }} prompt
 * @param {{ keys?: string[], seam?: string[], signal?: AbortSignal, onPartial?: (html: string) => void, timeoutMs?: number, stallMs?: number, trace?: object[] }} [o]
 */
export async function runBuilder(arm, prompt, { keys = null, seam = [], signal, onPartial, timeoutMs = 120_000, stallMs = 20_000, trace } = {}) {
  const guard = createStreamGuard({ keys });
  const t0 = performance.now();
  let firstPaintMs = null, lastPartial = 0;
  const onDelta = (d) => {
    const committed = guard.push(d);
    if (!committed && firstPaintMs !== null) return;
    if (firstPaintMs === null && paintable(guard.text)) firstPaintMs = Math.round(performance.now() - t0);
    // partials at most every 250 ms, markup only (W2-H's frame holds scripts until the gate passes)
    const now = performance.now();
    if (onPartial && firstPaintMs !== null && now - lastPartial > 250) {
      lastPartial = now;
      try { onPartial(guard.text.replace(/<script\b[\s\S]*$/i, "")); } catch { /* the veil is decoration */ }
    }
  };
  const api = arm.api ?? (RESPONSES_ONLY.has(arm.dep) ? "responses" : "chat");
  try {
    const r = await streamFn(arm.dep, [{ role: "system", content: prompt.system }, { role: "user", content: prompt.user }],
      { api, effort: arm.effort, maxTokens: arm.maxTokens ?? 16_000, timeoutMs, stallMs, signal, onDelta, quotaLane: "background", trace, kind: "studio_build" });
    guard.end();
    const fx = fixFragment(guard.text, { seam });
    return { ok: !fx.scriptError && r.finishReason !== "length", html: fx.html, raw: guard.text, fixes: fx.fixes, hints: guard.hints, scriptError: fx.scriptError,
      ttftMs: r.ttftMs, firstPaintMs, ms: r.ms, usage: r.usage, usd: r.usd, finishReason: r.finishReason, ...(r.finishReason === "length" ? { error: "length" } : {}) };
  } catch (e) {
    guard.end();
    const p = e?.partial ?? {};
    return { ok: false, html: "", raw: guard.text, fixes: [], hints: guard.hints, scriptError: null, ttftMs: p.ttftMs ?? null, firstPaintMs, ms: p.ms ?? Math.round(performance.now() - t0),
      usage: p.usage ?? null, usd: p.usd ?? 0, error: String(e?.code || e?.message || e).slice(0, 120), status: e?.status ?? 0 };
  }
}
