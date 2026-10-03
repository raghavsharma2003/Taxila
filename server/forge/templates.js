// Activity + flavour → a scene@1 document (T2a). Truth (options, the correct id, traps, step order) comes from
// the derived activity; flavour (the title row and a decor sprite) comes from the strings table. The output is
// validated by the vendored scene@1 validator (schema + lint S1–S7 + solver) inside the G1 gate.
import { BANDS, DPU, STAGES, expandTemplate, LIMITS, textBox } from "./scene/dsl.mjs";
import { rng } from "./kitmath.js";

/** Kit misconception id → scene@1 Misc token (`MC.<UPPER>`), reversible through the returned map. */
export function miscToken(id) {
  const t = "MC." + String(id).toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
  return t.length <= 63 ? t : "MC.H" + [...String(id)].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261).toString(36).toUpperCase();
}
/** A kit string as an L10n (kits carry one text per option; prompt_hi is Hinglish in Roman script in most kits). */
const L10 = (en, hi) => ({ en, hi: hi || en, hi_latn: hi || en });
const fits = (s) => typeof s === "string" && s.length >= 1 && s.length <= LIMITS.str && !/[<>]/.test(s);

/** Seeded permutation that is never the identity (a sequence that starts solved is a leak). */
export function derange(ids, seed) {
  const r = rng(seed);
  for (let k = 0; k < 16; k++) {
    const a = [...ids];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    if (a.some((x, i) => x !== ids[i])) return a;
  }
  return [...ids.slice(1), ids[0]];
}

/**
 * @returns {{ ok: true, scene: object, miscMap: Record<string,string> } | { ok: false, why: string }}
 */
export function buildScene(act, item, { band, lang, hook, decor, seed, topicId }) {
  const meta = { band, lang, title: { en: hook.en, hi: hook.hi, hi_latn: hook.hi_latn }, objective_ids: [String(item.skillId || topicId).slice(0, 64)], topic_ids: [String(topicId).slice(0, 64)] };
  const miscMap = {};
  if (act.template === "choice-card@1") {
    const B = BANDS[band];
    if (act.options.length > B.choices) return { ok: false, why: `choices_over_band:${act.options.length}>${B.choices}` };
    if (!act.options.every((o) => fits(o.text))) return { ok: false, why: "option_too_long" };
    // Option order is seeded (kits list the correct option first in most diagnostics).
    const r = rng(seed); const order = act.options.map((o, i) => ({ o, i, k: r() })).sort((a, b) => a.k - b.k);
    const ids = order.map((_, j) => `o${j + 1}`);
    const opts = order.map(({ o }, j) => {
      const misc = o.misc ? miscToken(o.misc) : undefined; if (misc) miscMap[misc] = o.misc;
      return { id: ids[j], label: L10(o.text), ...(misc ? { misc } : {}) };
    });
    const right = ids[order.findIndex((x) => x.i === act.correct)];
    const ask = fits(item.prompt_en) && fits(item.prompt_hi || item.prompt_en) ? L10(item.prompt_en, item.prompt_hi) : meta.title;
    const H = STAGES["3:4"]; const t = B.tile / DPU, g = B.gap / DPU;
    const chH = act.options.length * t + (act.options.length - 1) * g;
    // Stack top-down: title (top-anchored at 20), then the question under it; the question is dropped (the teacher
    // voices it) when it would run into the choice tiles. Heights come from the validator's own text metrics.
    const tall = (l, size, w) => Math.max(...[l.en, l.hi, l.hi_latn].filter(Boolean).map((x) => textBox(x, size, band, w).h));
    const titleH = tall(meta.title, "title", 760);
    const qH = ask !== meta.title ? tall(ask, "caption", 900) : 0;
    const qTop = 20 + titleH + 30, choiceTop = H - 40 - chH;
    const showQ = qH > 0 && qTop + qH + 30 <= choiceTop;
    const nodes = [
      { kind: "text", id: "title", x: 420, y: Math.round(20 + titleH / 2), text: meta.title, size: "title", w: 760, align: "middle" },
      ...(decor ? [{ kind: "sprite", id: "decor", x: 900, y: 75, lib: decor, w: 110, h: 110, role: "context" }] : []),
      ...(showQ ? [{ kind: "text", id: "question", x: 500, y: Math.round(qTop + qH / 2), text: ask, size: "caption", w: 900, align: "middle" }] : []),
      { kind: "choice", id: "ch", x: 500, y: H - 40 - chH / 2, var: "pick", options: opts, layout: "column", commit: true },
    ];
    const scene = {
      dsl: "scene@1", meta: { ...meta, template: "choice-card@1" }, stage: { aspect: "3:4", bg: "bg" },
      vars: [{ id: "pick", type: "enum", init: "none", options: ["none", ...ids], tl: "child's pick" }], derive: [], nodes, timelines: [], goals: [],
      probe: { id: "p_pick", kind: "diagnose", ask, commit: { via: "choice", node: "ch" }, correct: `pick == '${right}'`,
        traps: opts.filter((o) => o.id !== right && o.misc).slice(0, LIMITS.traps).map((o) => ({ when: `pick == '${o.id}'`, misc: o.misc })) },
      feedback: "on_commit",
    };
    return { ok: true, scene, miscMap, correctId: right };
  }
  if (act.template === "sequence-steps@1") {
    if (!act.steps.every((s) => fits(s.label))) return { ok: false, why: "step_too_long" };
    const ids = act.key; // correct order of step ids
    const byId = Object.fromEntries(act.steps.map((s) => [s.id, s]));
    const ordered = ids.map((id) => ({ id: `s_${id}`, label: L10(byId[id].label) }));
    const start = derange(ordered.map((s) => s.id), seed);
    const ex = expandTemplate("sequence-steps@1", { title: meta.title, steps: ordered, start, traps: [] }, meta);
    if (!ex.ok) return { ok: false, why: `template:${ex.errors.map((e) => e.code).join(",")}` };
    return { ok: true, scene: ex.scene, miscMap, correctOrder: ordered.map((s) => s.id) };
  }
  return { ok: false, why: `unknown_template:${act.template}` };
}
