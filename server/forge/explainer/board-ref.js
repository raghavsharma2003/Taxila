// Round 7 (main, dc-r7-teaching-scripts): the BOARD REF vocabulary. Learning authors per-skill lesson scripts whose
// explain beats name the board to draw; Brain owns the script schema (shared/contracts.ts); Studio owns what a ref means.
// A ref is a code template id plus its parameters (the same calls the code picks build), or `{ auto: true }` (the board
// the code picks from the beat's own text), so every board a script names is one this module can render and certify
// BEFORE a child sees it: `resolveBoardRef` (author time and turn time, pure, no model) and `certifyBoardRef` (the full
// whiteboard gate against a line, author time / CI).
//
// Shapes, never prose: params are numbers, short labels (≤ 18 chars, the template's fitsLabel) and closed ids. A value the
// item asks for is never a param written as an answer: `hideResult: true` (or `"withhold": "item"`) keeps it "?".
import { expand, BOARD_WORDS } from "./templates.js";
import { codePick } from "./pick.js";

/** Template id → its params (type and range, as each template checks them) and one valid example. */
export const BOARD_REFS = Object.freeze({
  "fraction-line@1": { subject: "maths", params: "den 2-12, to (or wholes) 1-3, from 0; mixup? (≤ 32 chars: the easy-to-mix-up, a dashed marker under the first whole's gaps with these words; never states the card's key); explain: marks [{ num, label? }] (labelled points; a label must equal num/den, e.g. '3/6 = 1/2') and/or hop { num } (one jump per 1/den from 0); asks: mark k (the named mark, '?') | target [a, den] (asked, not placed); show + target [a, den] = hop to a/den and name it; two denominators: dens [d1, d2] (2-12 each, to 1-2), marks [[a, d], ...] labelled points (d1 above, d2 below), target [[a, d], ...] the pair to compare, nothing placed", example: { den: 4, to: 2, marks: [{ num: 4, label: "1" }, { num: 7, label: "7/4" }], hop: { num: 7 } } },
  // director9 (Learning: c5-t02 worked bars, c4 unequal pizza): a picture's second views, also authorable
  "fraction-bars@1": { subject: "maths", params: "bars [{ parts 1-12, shade 0-parts, label? (the bar's fraction shade/parts, drawn stacked; \"?\" = asked, drawn as the answer slot: a dashed box; or \"\" = unnamed: no name drawn) }] (1-3, equal wholes stacked); shaded parts are the focus; mixup? (≤ 32 chars, a dashed marker under the bars with these words, never the card's key); relation? { lhs, op \"×\"|\"+\"|\"=\"|\"<\"|\">\", rhs } (the bars' own fractions, written under them: × / + as \"lhs = ? op rhs\", the ? the asked count or part; = < > with lhs or rhs \"?\"; must be true); legend? (false: none; true: always; default when 2+ roles)", example: { bars: [{ parts: 6, shade: 1, label: "1/6" }, { parts: 3, shade: 1, label: "1/3" }] } },
  "wholes@1": { subject: "maths", params: "wholes [{ parts 2-12, equal? (false: one half + the rest in the other half; 2 parts: two thirds + one third), shade?, title? }] (1-2 circles side by side; as \"bar\": strips, one under the other)", example: { wholes: [{ parts: 3, equal: false, title: "Pizza A" }, { parts: 3, equal: true, title: "Pizza B" }] } },
  // director10 G4: measured@1's second view (the boundary laid straight on a ruler: "seedha karke scale par napo")
  "unrolled@1": { subject: "maths", params: "sides [2-8 lengths, in order], unit cm|m, total? (the sum, or \"?\" = asked; default \"?\"), hide? [side indices drawn \"?\"], figure? { shape rect (w, h) | triangle (sides [3]) | polygon (n 3-8) } (the shape, small, beside the strip)", example: { sides: [7, 9, 12], unit: "m", total: "?", figure: { shape: "triangle", sides: [7, 9, 12] } } },
  "fraction-parts@1": { subject: "maths", params: "parts 2-12, shade 0-parts, whole circle|bar|roti, hideResult?; the shaded parts are the focus, a bar's shaded group named by a brace with its stacked fraction; mixup? (≤ 32 chars: \"4 quarters make the whole\", a dashed marker under the whole, never the card's key); relation? { lhs, op \"×\"|\"+\"|\"=\"|\"<\"|\">\", rhs } (from the board's parts: 1/parts, shade/parts, 1; \"1/2 = ? × 1/4\" is { lhs: \"1/2\", op: \"×\", rhs: \"1/4\" }; must be true); legend? (false | true; default when 2+ roles)", example: { parts: 4, shade: 3, whole: "roti" } },
  "fraction-of@1": { subject: "maths", params: "a/b of c/d: a 1-b, b 2-6, c 1-d, d 2-6, hideResult?", example: { a: 2, b: 3, c: 3, d: 5 } },
  "combine-count@1": { subject: "maths", params: "a 0-10, b 0-10, op add|take_away, hideResult?", example: { a: 4, b: 3, op: "add" } },
  "number-line-hop@1": { subject: "maths", params: "start -20..100, hops [1-4 ints, -20..20, not 0: all forward or all back, or two where the second goes back at most half the first; every landing within 30 of the others; with 2+ hops each at least 2 and at least 1/8 of that spread (1/5 with a 3-character number)], hideResult?; mark? (ANSWER boards only, never with hideResult) { land: true } (the final landing ringed, its value written under the line) | { hop: i } (hop i thickened, its landing ringed and its value written)", example: { start: -2, hops: [5] } },
  "number-line-scale@1": { subject: "maths", params: "from 0-99999, to ≤ 100000, step (2-10 intervals; ≤ 5 for 5-digit labels), marks [{ value, label? (\"?\" = asked) }] (≤ 3)", example: { from: 0, to: 10000, step: 1000, marks: [{ value: 4815 }] } },
  "number-line-zoom@1": { subject: "maths", params: "value: a decimal with 1-2 places, 0-10", example: { value: 2.45 } },
  "column-op@1": { subject: "maths", params: "a, b 0-99999, op add|sub (b ≤ a), hideResult?", example: { a: 478, b: 356, op: "add" } },
  "place-value@1": { subject: "maths", params: "value 1-9999999; mark? (ANSWER boards only) { place ones|tens|hundreds|thousands|ten-thousands|lakhs|ten-lakhs, value? true (the digit's value written over the boxes: \"8 → 800\") } (that place's digit ringed)", example: { value: 3456 } },
  "equal-groups@1": { subject: "maths", params: "groups 2-6, each 1-8, hideResult? | sizes [2-6 groups of 1-10] (groups NOT all equal, each group's count under it, no equation), equalTo? {groups 2-6, each 1-8} (the same total shared equally, drawn beside them: groups × each = the sizes' sum); title? (short, over the board: \"8 ka 1/2 = 4\")", example: { groups: 3, each: 4 } },
  "shade-grid@1": { subject: "maths", params: "rows 1-6, cols 1-10, shade 0-rows*cols | block [r, c], labels?, hideResult?", example: { rows: 3, cols: 5, shade: 6, labels: true, hideResult: true } },
  "area-grid@1": { subject: "maths", params: "w, h (ints), mode area|perimeter, unit cm|m|…, hideResult?", example: { w: 5, h: 3, mode: "area", unit: "cm" } },
  "measured@1": { subject: "maths", params: "shape rect|square (w, h) | triangle (sides [3]) | circle (r) | pentagon|hexagon|octagon|quadrilateral|polygon (sides [3-8], names? one per corner; labelled, not to scale); unit cm|m; name?, trace? (perimeter walk); mixup? (≤ 32 chars, a dashed marker under the boundary with these words, never the card's key)", example: { shape: "rect", w: 6, h: 4, unit: "cm", name: true, trace: true } },
  "angle@1": { subject: "maths", params: "angles [{ deg 10-350, name?, len? \"short\"|\"long\" (arm length; the same angle either way), inside? }] (1-3); deg 181-350 is a REFLEX / outside angle: the arms open at 360-deg, its arc drawn the long way round outside them, its degrees (or name) written beyond that arc (\"the 300° outside a 60° corner\" is deg 300); inside? (reflex only) true (the corner's own arc too, small, with its degrees: 60°) | a short label (\"?\", \"x\"); arm/vertex names only on angles up to 180; mark? (ANSWER boards only) { index i, show? \"deg\" (angle i's arc, larger, and its degrees written; a reflex angle's OUTSIDE arc) | \"bigger\" (default: angle i's arc thickened, its name ringed) }; a mark index the board does not draw is refused (mark_target_missing)", example: { angles: [{ deg: 60 }] } },
  // round 7 (c7 staged: vertically opposite angles, parallel lines)
  "lines@1": { subject: "maths", params: "kind cross { deg 20-160, ends [A,B,C,D], point O, angles [{ at 1-4, value deg | \"?\" | name }] } | kind parallel { names [\"AB\",\"CD\"], gap label, transversal { deg 30-150, name \"PQ\" }, angles [{ at 1-8 }] }; at 1/3 = deg, 2/4 = 180-deg (5-8 the lower crossing): 1 and 3 vertically opposite (saamne wala), 1 and 2 adjacent (bagal wala); mark? (ANSWER boards only) { at k (one of the board's angles), show? \"deg\" (default: angle k's arc thickened and its degrees written as its label, a \"?\" becomes the angle) | \"ring\" (its label ringed) }; a mark on an angle the board does not label is refused (mark_target_missing)",
    example: { kind: "cross", deg: 60, ends: ["A", "B", "C", "D"], point: "O", angles: [{ at: 1, value: 60 }, { at: 3, value: "?" }] } },
  "shape@1": { subject: "maths", params: "shape (circle | polygon names); optional short labels: name, side, corner, centre, names []; a circle also radius, diameter (drawn as arrows from / through the centre), chord (a line clear of the centre), arc (along the rim), each a short label (e.g. 'diameter 14 cm'); copies 1|2", example: { shape: "circle", radius: "radius" } },
  "symmetry@1": { subject: "maths", params: "line? (label), dot? (squares from the line)", example: { dot: 3 } },
  "bar-chart@1": { subject: "maths|science|evs", params: "bars [{ label, value }] 2-6", example: { bars: [{ label: "Mon", value: 4 }, { label: "Tue", value: 6 }] } },
  "table@1": { subject: "any", params: "head [2-4 cells], rows [1-10 × same width], rule? (short)", example: { head: ["n", "2n"], rows: [["1", "2"], ["2", "4"]] } },
  "timeline@1": { subject: "sst|any", params: "events [{ year 100-2100, label }] 3-6, distinct years", example: { events: [{ year: 1857, label: "revolt" }, { year: 1919, label: "Jallianwala" }, { year: 1947, label: "freedom" }] } },
  "flow@1": { subject: "any", params: "steps [2-6 short labels] in order", example: { steps: ["Observe", "Ask", "Predict", "Test"] } },
  "cycle@1": { subject: "science|evs", params: "stages [3-6 short labels]", example: { stages: ["evaporation", "condensation", "rain"] } },
  "compare@1": { subject: "any", params: "left / right { title, items [1-4] }; mark? (ANSWER boards only) { side left|right, item? i (ring that item; else the column's title), add? (≤ 24 chars, not \"?\": one value appended to that column, e.g. \"₹85\") }", example: { left: { title: "Living", items: ["grow", "breathe"] }, right: { title: "Non-living", items: ["do not grow"] } } },
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
    // (both shapes Brain's BoardRef allows: flat { template, ...params } and { template, params: {...} })
    const { template, withhold, params: nested, ...flat } = ref;
    const params = { ...flat, ...(nested && typeof nested === "object" ? nested : {}) };
    if (!Object.hasOwn(BOARD_REFS, template)) return { ok: false, why: `unknown_template:${template}` };
    const call = { template, ...params, ...(withhold === "item" ? { hideResult: true } : {}) };
    const x = expand(call);
    return x.ok ? { ok: true, call } : { ok: false, why: (x.errors ?? []).join(",") || "expand_failed" };
  } catch (e) { return { ok: false, why: `error:${String(e?.message ?? e).slice(0, 60)}` }; }
}

/** The numbers a call authors as values to show (labels, sides, dims, marks), never ids, counts of parts or flags. */
export function refNumbersOf(call) {
  const out = new Set();
  const add = (v) => { if (typeof v === "number" && Number.isFinite(v)) out.add(String(v)); else if (typeof v === "string") for (const m of v.match(/\d+(?:\.\d+)?(?:\/\d+)?/g) ?? []) out.add(m); };
  for (const k of ["sides", "w", "h", "r", "value"]) { const v = call[k]; (Array.isArray(v) ? v : [v]).forEach(add); }
  for (const m of call.marks ?? []) if (m && typeof m === "object" && !Array.isArray(m)) add(m.label ?? `${m.num}/${call.den}`);
  if (call.template === "lines@1") for (const a of call.angles ?? []) if (typeof a?.value === "number") add(a.value);
  // (a reflex angle's corner written by inside: true — "60°" inside the 300° — is drawn, so authored)
  if (call.template === "angle@1") for (const a of call.angles ?? []) if (a?.inside === true && Number.isInteger(a.deg) && a.deg > 180) add(360 - a.deg);
  for (const k of ["items", "steps", "stages", "parts"]) for (const v of [call[k], call.left?.[k], call.right?.[k]].flat()) if (typeof v === "string") add(v);
  // round 8 (Learning's to-studio 006, numbers-shown note): an answer board's `mark` draws its value: it counts as authored,
  // so a mark the template cannot draw fails the ref
  const m = call.mark;
  if (m && typeof m === "object") {
    if (call.template === "compare@1" && typeof m.add === "string") add(m.add);
    if (call.template === "angle@1" && m.show === "deg") add(call.angles?.[m.index]?.deg);
    if (call.template === "lines@1" && (m.show ?? "deg") === "deg" && (call.angles ?? []).some((a) => a?.at === m.at)) { const d = call.kind === "cross" ? call.deg : call.transversal?.deg; if (Number.isInteger(d) && Number.isInteger(m.at)) add((m.at - 1) % 2 === 0 ? d : 180 - d); }
    if (call.template === "number-line-hop@1" && Array.isArray(call.hops)) { const k = m.land === true ? call.hops.length - 1 : m.hop; if (Number.isInteger(k) && k >= 0 && k < call.hops.length) add(call.hops.slice(0, k + 1).reduce((a, b) => a + b, call.start)); }
    if (call.template === "place-value@1" && m.value === true) { const P = ["ones", "tens", "hundreds", "thousands", "ten-thousands", "lakhs", "ten-lakhs"].indexOf(m.place), ds = String(call.value ?? ""); if (P >= 0 && P < ds.length) add(Number(ds[ds.length - 1 - P]) * 10 ** P); }
  }
  return [...out];
}
/**
 * Author time / CI: the ref renders AND passes the full whiteboard gate against a line that says what the beat says
 * (the script's own stand-in line), with the item's answers withheld. → { ok, call?, failed?: string[] }
 */
export async function certifyBoardRef(ref, { kit = null, item = null, line, withhold = null } = {}) {
  const r = resolveBoardRef(ref, { kit, item });
  if (!r.ok) return { ok: false, failed: [r.why] };
  const [{ gateWhiteboard, withheldValues }, { retimeToLine, regate, refWholes }, { speechMsOf }] = await Promise.all([import("../../studio/qa/whiteboard.js"), import("../../stagecraft/board-sync.js"), import("../../studio/plan.js")]);
  const text = String(line ?? "");
  // (director10: the live gate's own estimate of her line — board-sync gateCtxFor — not a stricter 400 ms a word: a two-bar
  // compare that draws live over its 20-word card failed certification on W6 alone)
  const speechMs = Math.max(1500, speechMsOf(text));
  const w = withhold ?? (item && kit ? withheldValues(kit, { itemId: item.id, line: text }) : { values: [] });
  // (round 8: the template's own words — a mix-up marker — are built knowing the keys they must never state)
  const x = expand(r.call, { keys: (Array.isArray(w) ? w : w?.values ?? []).map(String) });
  if (!x.ok) return { ok: false, call: r.call, failed: x.errors };
  // (an authored ref is certified as the live gate takes a card's own board — board-sync gateCtxFor authoredRef: its cuts
  // are the template's exact radii, not a model's circle cut by lines; Learning's c4 watermelon then-card, 2026-11-08)
  // (Learning's D7, main 2026-11-09: … and its separate wholes are wholes — two ribbons posed as "12 barabar tukdon mein se 5"
  // and "6 … mein se 5", a reveal whose why says 3/5, 6/10 and 4/10 — as the live gate counts them: never her "2")
  // (each bar is a whole her line names — its parts said, as a count or a denominator: a third bar she never mentions
  // still binds, director10's "1/4 aur 1/8" over three bars)
  const lineNs = new Set((text.match(/\d+/g) ?? []).map(Number));
  const wn = (r.call.bars ?? []).every((b) => lineNs.has(Number(b?.parts))) ? refWholes(ref) : null;
  // (round 8: as the live gate takes a card's own board — board-sync gateCtxFor — its template words and the ref's own
  // words are known words: a legend row, a mix-up marker)
  const refWords = [];
  const walk = (v) => { if (typeof v === "string") refWords.push(...(v.toLowerCase().match(/\p{L}+/gu) ?? [])); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === "object") Object.values(v).forEach(walk); };
  walk(r.call);
  const g = gateWhiteboard(retimeToLine(x.script, text), { reply: text, speechMs, withhold: w, authoredRef: true, extraWords: ["barabar", "hisse", "parimap", ...BOARD_WORDS, ...refWords], ...(wn ? { wholes: wn } : {}) });
  // round 7 (main, director4 S2): the board must SHOW the numbers the ref authors (a template that cannot draw them, or
  // draws one as "?", fails the ref, never the child's screen)
  // (a grouped number — "4,815", "1,00,000" — is one number: place-value@1's Indian grouping failed numbers_not_shown)
  const grouped = (t) => (String(t ?? "").match(/\d+(?:,\d{2,3}(?!\d))*(?:\.\d+)?(?:\/\d+)?/g) ?? []).flatMap((n) => (n.includes(",") ? [n.replace(/,/g, ""), ...n.split(",")] : [n]));
  const drawn = new Set((x.script.ops ?? []).flatMap((o) => (o.op === "text" || o.op === "label" ? grouped(o.text) : o.op === "numwork" ? (o.rows ?? []).flat().map(String) : [])));
  const authored = refNumbersOf(r.call).filter((v) => !drawn.has(v));
  // (and a beat whose line gives measures — "4 m, 5 m, 3 m" — with a board that draws none of them shows the wrong thing:
  // c6's worked pentagon was a bare shape@1)
  const measures = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(?:cm|mm|km|m)\b/g)].map((m) => m[1]);
  const lineOnly = measures.length >= 2 && !measures.some((v) => drawn.has(v)) ? [`line_measures_not_on_board:${[...new Set(measures)].join(",")}`] : [];
  // round 7 (main, director6 #1): a number the line STATES is never drawn "?": the production pass that writes a withheld
  // answer as "?" (board-sync regate → maskReveals) is run on this board; a stated number it would mask fails the ref
  const nums = (t) => String(t ?? "").match(/\d+(?:\.\d+)?(?:\/\d+)?/g) ?? [];
  const textNums = (sc) => new Set((sc?.ops ?? []).flatMap((o) => (o.op === "text" || o.op === "label" ? (/\?/.test(String(o.text ?? "")) ? [] : nums(o.text)) : o.op === "numwork" ? (o.rows ?? []).flat().map(String).filter((v) => v !== "?") : [])));
  const stated = new Set(nums(text));
  let maskedStated = [];
  try {
    const rg = regate(retimeToLine(x.script, text), { intent: { intentId: "certify" }, line: { lessonId: "" } }, { reply: text, speechMs, withhold: w });
    const after = textNums(rg.ok ? rg.script : rg.gate?.script);
    maskedStated = [...textNums(x.script)].filter((v) => stated.has(v) && !after.has(v));
  } catch { /* the gate above still judges the ref */ }
  const failed = [...g.checks.filter((c) => !c.pass).map((c) => c.id), ...(authored.length ? [`numbers_not_shown:${authored.join(",")}`] : []), ...lineOnly,
    ...(maskedStated.length ? [`stated_drawn_as_unknown:${[...new Set(maskedStated)].join(",")}`] : [])];
  return !failed.length ? { ok: true, call: r.call } : { ok: false, call: r.call, failed };
}
