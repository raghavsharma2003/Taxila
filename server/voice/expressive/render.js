// From a written reply (+ its DeliveryPlan, when the seam made one) to the TTS parts the speech pipeline streams.
// Where the lesson and the voice are known (prewarm / tts-stream / turn-audio / the text lane's "Hear"):
//   1. the governor applies the per-lesson rates to the plan (governor.js);
//   2. clauses are grouped by TTS part (align.js keeps them aligned to splitSentences);
//   3. each part is compiled for the voice's engine (dhd SSML, or gpt-4o-mini-tts text + instructions);
//   4. every DragonHD document is linted (lint.js): a forbidden tag or an unproven marker → that part is compiled PLAIN
//      (fail closed, voice.expr.lint_fail). Digits or "..." left in the spoken text are counted (the owner's rule).
// Without a plan (layer off, plan refused, a turn this process did not plan) the parts are the plain sentences at the
// voice's base rate: exactly today's pipeline, plus DragonHD when it is the configured engine.
import { splitSentences } from "../sentences.js";
import { governor as defaultGovernor } from "./governor.js";
import { planInfo } from "./seam.js";
import { compileDhd, plainSsml } from "./compile/dhd.js";
import { compileOai } from "./compile/oai-tts.js";
import { lintSsml } from "./lint.js";
import { withEcho } from "./align.js";
import { count, logPlan } from "./telemetry.js";
import { expressiveOn } from "../voices.js";

/**
 * @typedef {{ engine: "dhd", ssml: string, store?: "memory" | "db" } | { engine: "oai", text?: string, instructions?: string, store?: "memory" | "db" }} Render
 * @typedef {{ written: string, render?: Render, pauseBeforeMs?: number, clause?: number }} Part
 */

/** The dhd document for a part, linted; plain on a lint failure. */
function dhdDoc(clauses, written, style, plan) {
  const ssml = compileDhd(clauses, style.dhd, { register: plan.register, pitch: plan.pitch ?? 0, spoken: style.spoken });
  const bad = lintSsml(ssml, "dhd");
  if (bad.some((b) => b === "paralinguistic_tag" || b.startsWith("unknown_marker"))) {
    count("lint_fail");
    console.warn(`[voice] expressive lint failed (${bad.join(",")}): part spoken plain`);
    return plainSsml(written, style.dhd, style.spoken);
  }
  if (bad.includes("digits")) count("digits_left");
  if (bad.includes("ellipsis")) count("ellipsis_left");
  return ssml;
}

/** Plain parts (no plan): today's sentences; DragonHD documents when that is the engine. */
export function plainParts(text, style) {
  return splitSentences(text).map((p) => (style?.engine === "dhd"
    ? { written: p, render: { engine: "dhd", ssml: plainSsml(p, style.dhd, style.spoken) } }
    : { written: p }));
}

/** Group a governed plan's clauses by TTS part and compile each part for the voice's engine. */
function compileParts(plan, style, engine) {
  const groups = [];
  plan.clauses.forEach((c, i) => {
    const g = groups[c.part] ?? (groups[c.part] = { clauses: [], first: i });
    g.clauses.push(c);
  });
  return groups.filter(Boolean).map((g, gi) => {
    const written = g.clauses.map((c) => c.text).join(" ");
    /** @type {Render} */
    const render = engine === "dhd" ? { engine, ssml: dhdDoc(g.clauses, written, style, plan) }
      : { engine, ...compileOai(g.clauses, style.instructions, { register: plan.register }) };
    return { written, render, pauseBeforeMs: gi === 0 ? 0 : g.clauses[0].pauseBeforeMs || 0, clause: g.first };
  });
}

/**
 * @param {{ lessonId: string, seq?: number, text: string, style: any, delivery?: any, gov?: { apply: Function }, log?: boolean, prelude?: boolean }} x
 *   prelude: false = this path never plays the uptake prelude (tts-stream without a prewarm): the echo stays in the reply
 * @returns {{ parts: Part[], prelude: Part | null, plan: any | null, full0: Part | null }}
 *   full0: part 0 WITH the uptake echo, for streamParts to speak when the prelude wrote no audio (fixer 2026-10-05,
 *   w2g-echo-only-when-prelude-plays: the echo is stripped only when the prelude is guaranteed to have played)
 */
export function renderParts({ lessonId, seq, text, style, delivery, gov = defaultGovernor, log = true, prelude: withPrelude = true }) {
  const engine = style?.engine === "dhd" ? "dhd" : "oai";
  if (!delivery?.clauses?.length || !expressiveOn(engine)) return { parts: plainParts(text, style), prelude: null, plan: null, full0: null };
  const plan = gov.apply(lessonId, delivery, planInfo(delivery) ?? {});
  if (log) logPlan({ lessonId, seq, engine, plan });
  const preludeR = withPrelude && plan.prelude?.text ? preludeRender(plan.prelude.text, style) : null;
  const stripped = !!plan.clauses[0]?.stripped;
  if (!preludeR) return { parts: compileParts(withEcho(plan), style, engine), prelude: null, plan, full0: null };
  const parts = compileParts(plan, style, engine);
  const full0 = stripped ? compileParts(withEcho(plan), style, engine)[0] ?? null : null;
  return { parts, prelude: { written: plan.prelude.text, render: preludeR }, plan, full0 };
}

/**
 * The uptake prelude's render (TEACHER-BRAIN §5.4 L3): the child's own token, calm, neutral pitch, base rate, no filler,
 * no marker but [calm]. Memory-only cache: a child's words are never written to asset_cache. The turn-audio route warms
 * the same render at receipt, so the prewarm's job is a memory hit.
 * @param {string} token @param {any} style
 * @returns {Render | null}
 */
export function preludeRender(token, style) {
  const t = String(token ?? "").trim();
  if (!t) return null;
  if (style?.engine === "dhd") {
    const c = { text: t, emotion: "calm", intensity: 0.3, pace: "normal", pauseBeforeMs: 0, nonverbalBefore: "none", sentenceStart: true };
    return { engine: "dhd", ssml: compileDhd([c], { ...style.dhd, baseRate: style.dhd.baseRate }, { register: "normal", pitch: 0, spoken: style.spoken }).replace(/ pitch="-6%"/g, ""), store: "memory" };
  }
  return { engine: "oai", text: t, instructions: style?.instructions ?? "", store: "memory" };
}
