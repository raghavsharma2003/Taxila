// Round 7 (main, dc-r7-teaching-scripts): the BOARD REF vocabulary. Learning authors per-skill lesson scripts whose
// explain beats name the board to draw; Brain owns the script schema (shared/contracts.ts); Studio owns what a ref means.
// A ref is a code template id plus its parameters (the same calls the code picks build), or `{ auto: true }` (the board
// the code picks from the beat's own text), so every board a script names is one this module can render and certify
// BEFORE a child sees it: `resolveBoardRef` (author time and turn time, pure, no model) and `certifyBoardRef` (the full
// whiteboard gate against a line, author time / CI).
//
// Shapes, never prose: params are numbers, short labels (≤ 18 chars, the template's fitsLabel) and closed ids. A value the
// item asks for is never a param written as an answer: `hideResult: true` (or `"withhold": "item"`) keeps it "?".
import { expand } from "./templates.js";
import { codePick } from "./pick.js";

/** Template id → its params (type and range, as each template checks them) and one valid example. */
export const BOARD_REFS = Object.freeze({
  "fraction-line@1": { subject: "maths", params: "den 2-12, to (or wholes) 1-3, from 0; explain: marks [{ num, label? }] (labelled points; a label must equal num/den, e.g. '3/6 = 1/2') and/or hop { num } (one jump per 1/den from 0); asks: mark k (the named mark, '?') | target [a, den] (asked, not placed); show + target [a, den] = hop to a/den and name it", example: { den: 4, to: 2, marks: [{ num: 4, label: "1" }, { num: 7, label: "7/4" }], hop: { num: 7 } } },
  "fraction-parts@1": { subject: "maths", params: "parts 2-12, shade 0-parts, whole circle|bar|roti", example: { parts: 4, shade: 3, whole: "roti" } },
  "fraction-of@1": { subject: "maths", params: "a/b of c/d: a 1-b, b 2-6, c 1-d, d 2-6, hideResult?", example: { a: 2, b: 3, c: 3, d: 5 } },
  "combine-count@1": { subject: "maths", params: "a 0-10, b 0-10, op add|take_away, hideResult?", example: { a: 4, b: 3, op: "add" } },
  "number-line-hop@1": { subject: "maths", params: "start -20..100, hops [1-4 non-zero ints -20..20], hideResult?", example: { start: -2, hops: [5] } },
  "number-line-zoom@1": { subject: "maths", params: "value: a decimal with 1-2 places, 0-10", example: { value: 2.45 } },
  "column-op@1": { subject: "maths", params: "a, b 0-99999, op add|sub (b ≤ a), hideResult?", example: { a: 478, b: 356, op: "add" } },
  "place-value@1": { subject: "maths", params: "value 1-9999999", example: { value: 3456 } },
  "equal-groups@1": { subject: "maths", params: "groups 2-6, each 1-8, hideResult?", example: { groups: 3, each: 4 } },
  "shade-grid@1": { subject: "maths", params: "rows 1-6, cols 1-10, shade 0-rows*cols | block [r, c], labels?, hideResult?", example: { rows: 3, cols: 5, shade: 6, labels: true, hideResult: true } },
  "area-grid@1": { subject: "maths", params: "w, h (ints), mode area|perimeter, unit cm|m|…, hideResult?", example: { w: 5, h: 3, mode: "area", unit: "cm" } },
  "measured@1": { subject: "maths", params: "shape rect|square (w, h) | triangle (sides [3]) | circle (r); unit cm|m; name?, trace? (perimeter walk)", example: { shape: "rect", w: 6, h: 4, unit: "cm", name: true, trace: true } },
  "angle@1": { subject: "maths", params: "angles [{ deg 1-359 }] (1-2)", example: { angles: [{ deg: 60 }] } },
  "shape@1": { subject: "maths", params: "shape (circle | polygon names); optional short labels: name, side, corner, centre, radius, diameter, names []; copies 1|2", example: { shape: "circle", radius: "radius" } },
  "symmetry@1": { subject: "maths", params: "line? (label), dot? (squares from the line)", example: { dot: 3 } },
  "bar-chart@1": { subject: "maths|science|evs", params: "bars [{ label, value }] 2-6", example: { bars: [{ label: "Mon", value: 4 }, { label: "Tue", value: 6 }] } },
  "table@1": { subject: "any", params: "head [2-4 cells], rows [1-10 × same width], rule? (short)", example: { head: ["n", "2n"], rows: [["1", "2"], ["2", "4"]] } },
  "timeline@1": { subject: "sst|any", params: "events [{ year 100-2100, label }] 3-6, distinct years", example: { events: [{ year: 1857, label: "revolt" }, { year: 1919, label: "Jallianwala" }, { year: 1947, label: "freedom" }] } },
  "flow@1": { subject: "any", params: "steps [2-6 short labels] in order", example: { steps: ["Observe", "Ask", "Predict", "Test"] } },
  "cycle@1": { subject: "science|evs", params: "stages [3-6 short labels]", example: { stages: ["evaporation", "condensation", "rain"] } },
  "compare@1": { subject: "any", params: "left / right { title, items [1-4] }", example: { left: { title: "Living", items: ["grow", "breathe"] }, right: { title: "Non-living", items: ["do not grow"] } } },
  "parts@1": { subject: "any", params: "whole (label), parts [2-6 labels]", example: { whole: "Plant", parts: ["root", "stem", "leaf"] } },
  "label@1": { subject: "science|evs", params: "sketch plant|flower|leaf|insect|circuit|cellPlant|cellAnimal|atom, labels [{ anchor, text }] 2-6 (anchors per sketch, e.g. plant: flower leaf stem root soil fruit)", example: { sketch: "plant", labels: [{ anchor: "root", text: "root" }, { anchor: "stem", text: "stem" }, { anchor: "leaf", text: "leaf" }] } },
  "places@1": { subject: "sst|evs", params: "places [3-6 gazetteer names], tropic?, meridian?", example: { places: ["Delhi", "Mumbai", "Kolkata"] } },
});

/**
 * A script beat's board ref → the template call to build, or why not. `{ auto: true }` asks for the code's own pick on
 * the beat's text (the kit item or worked example when none), the same pick a live turn makes. Pure; never throws.
 * @param {object} ref @param {{ kit?: object, item?: object|null, text?: string }} [ctx]
 * @returns {{ ok: true, call: object } | { ok: false, why: string }}
 */
export function resolveBoardRef(ref, ctx = {}) {
  try {
    if (!ref || typeof ref !== "object") return { ok: false, why: "no_ref" };
    if (ref.auto) {
      const call = codePick({ kit: ctx.kit ?? null, item: ctx.item ?? null, ...(ctx.text ? { text: ctx.text } : {}) });
      return call ? { ok: true, call } : { ok: false, why: "no_code_pick" };
    }
    const { template, withhold, ...params } = ref;
    if (!Object.hasOwn(BOARD_REFS, template)) return { ok: false, why: `unknown_template:${template}` };
    const call = { template, ...params, ...(withhold === "item" ? { hideResult: true } : {}) };
    const x = expand(call);
    return x.ok ? { ok: true, call } : { ok: false, why: (x.errors ?? []).join(",") || "expand_failed" };
  } catch (e) { return { ok: false, why: `error:${String(e?.message ?? e).slice(0, 60)}` }; }
}

/**
 * Author time / CI: the ref renders AND passes the full whiteboard gate against a line that says what the beat says
 * (the script's own stand-in line), with the item's answers withheld. → { ok, call?, failed?: string[] }
 */
export async function certifyBoardRef(ref, { kit = null, item = null, line, withhold = null } = {}) {
  const r = resolveBoardRef(ref, { kit, item });
  if (!r.ok) return { ok: false, failed: [r.why] };
  const [{ gateWhiteboard, withheldValues }, { retimeToLine }] = await Promise.all([import("../../studio/qa/whiteboard.js"), import("../../stagecraft/board-sync.js")]);
  const x = expand(r.call);
  const text = String(line ?? "");
  const speechMs = Math.max(1500, text.split(/\s+/).length * 400);
  const w = withhold ?? (item && kit ? withheldValues(kit, { itemId: item.id, line: text }) : { values: [] });
  const g = gateWhiteboard(retimeToLine(x.script, text), { reply: text, speechMs, withhold: w });
  return g.pass ? { ok: true, call: r.call } : { ok: false, call: r.call, failed: g.checks.filter((c) => !c.pass).map((c) => c.id) };
}
