// The G1 gate (FACTORY.md §5.1, G1 column): trusted code over data, no agent code, no model judge.
//   Q0 schema      — engine params against fraction-bars@1's declared params; scenes through the scene@1 validator
//                    (zod schema + lint S1–S7); payload ≤ 56 KiB.
//   Q4 solver      — the goal is reachable and not already met at mount (bars: parts-for-target; scenes: the DSL solver).
//   Q5 truth       — the key the child will be graded on is RE-DERIVED here from the payload alone and must equal the
//                    verified kit key (KitMath for fractions, the kit's own answer/diagnostic otherwise). A kit answer
//                    that disagrees with KitMath fails the fill and is reported (the kit is wrong, not the child).
//   leak           — no pre-commit string names the answer (server/director/items.js revealsAnswer, the same predicate
//                    that guards the teacher), and the activity does not start solved.
//   Q8 safety      — every child-visible string is a kit string or a pre-cleared strings-table row; no URL, e-mail or
//                    phone number; a local blocklist (en / Hinglish / Devanagari) as a second net. The child's first
//                    name in NON-kit text is child-dependent, so it is checked at serve time (childNameClash), never
//                    folded into the cached, child-free verdict.
// A headless render (Q2) is NOT here: the spec samples it at 5 % async for G1 (render-check.mjs).
import { validate as validateScene } from "./scene/dsl.mjs";
import { parseValue, keyValues, eq, R, cmp } from "./kitmath.js";
import { normText, strictText, SAME_RE } from "./derive.js";
import { HOOK_BY_ID, DECOR, TEMPLATE_STRINGS } from "./strings.js";
import { revealsAnswer } from "../director/items.js";

export const GATE_VERSION = "g1-gate@1";
export const INIT_MAX_BYTES = 56 * 1024;

/** fraction-bars@1 declared params (mirror of the EngineDef in src/modules/frame/engines/fractionBars.tsx; a test
 *  pins the names against that file). */
export const FRACTION_BARS_PARAMS = {
  denominators: { type: "array" }, numerators: { type: "array" }, locked: { type: "array" },
  mode: { type: "string", enum: ["shade", "compare"] }, target: { type: "string" }, targetBar: { type: "number", min: 0, max: 2 },
  equivalentOk: { type: "boolean" }, question: { type: "string", enum: ["bigger", "smaller"] }, showLabels: { type: "boolean" },
};

// Second-net blocklist (FACTORY.md §5.1 Q8 "local Hinglish-normalised blocklist"). Kit strings are human-authored and
// verified; table rows are reviewed; this catches a bad row or a corrupted kit, not a model (no model text reaches here).
// Two tiers (FACTORY.md §5.1 Q8 "per-topic curriculum allowance from the kit"): SEVERE applies to every string, kit
// strings included (sexual, romance/companion register, slurs, self-harm); MILD applies only to non-kit strings, because
// kits legitimately say "farmers kill snakes", "fat and protein", "blood" (science, measured: 11 kit false positives).
const SEVERE = [
  /\b(suicide|sex|sexy|nude|porn|girlfriend|boyfriend|date me|love you|i love you|baby\s*girl|ishq|mohabbat)\b/i,
  /\b(chutiya|bhenchod|madarchod|harami|kamina|randi)\b/i,
  /(हरामी|कमीना|इश्क|आत्महत्या)/,
];
const MILD = [
  /\b(kill|murder|blood|gun|knife|bomb|drugs?|alcohol|beer|whisky|cigarette|gamble|betting|casino|kiss|jaan|pyaar)\b/i,
  /\b(maar\s*dal|khoon|nasha|sharab|daru|gaali)\b/i,
  /(मार\s*डाल|खून|नशा|शराब|दारू|गाली|प्यार)/,
  /\b(stupid|idiot|dumb|loser|ugly|fat)\b/i,
];
const PII = [/https?:\/\/|www\.|\.com\b|\.in\b/i, /[\w.+-]+@[\w-]+\.[\w.]+/, /(?:\+?91[\s-]?)?\b\d{10}\b/, /\b\d{4}\s?\d{4}\s?\d{4}\b/];

/** Whole-word (or whole-phrase) containment: "he" is not in "paheli". */
const hasTerm = (text, term) => new RegExp(`(^|[^\\p{L}\\p{N}])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\p{L}\\p{N}])`, "u").test(text);
const fail = (out, code, detail) => out.push(detail ? `${code}:${detail}` : code);

/** Child-visible strings of a payload, by where they sit (title/question are pre-commit; options/steps are the task). */
export function visibleStrings(fill) {
  const pre = [], task = [];
  if (fill.hook) pre.push(...langs(fill.hook));
  if (fill.scene) {
    const s = fill.scene;
    pre.push(...langs(s.meta.title));
    if (s.probe?.ask) pre.push(...langs(s.probe.ask));
    for (const n of s.nodes) {
      if (n.kind === "text") pre.push(...langs(n.text.fmt ?? n.text));
      if (n.kind === "button") task.push(...langs(n.label));
      if (n.kind === "choice") for (const o of n.options) if (o.label) task.push(...langs(o.label));
      if (n.kind === "order") for (const o of n.items) if (o.label) task.push(...langs(o.label));
      if (n.say) pre.push(...langs(n.say));
    }
  }
  return { pre: [...new Set(pre)], task: [...new Set(task)] };
}
const langs = (l) => (l ? [l.en, l.hi, l.hi_latn].filter((x) => typeof x === "string" && x) : []);

/** The strings a fill may show: this item's and topic's kit strings, the strings table, template constants. */
export function allowedStrings(item, kit, { kitOnly = false } = {}) {
  const s = new Set();
  const add = (x) => { if (typeof x === "string" && x) { s.add(x); s.add(x.trim()); } };
  if (!kitOnly) {
    for (const h of Object.values(HOOK_BY_ID)) [h.en, h.hi, h.hi_latn].forEach(add);
    for (const t of TEMPLATE_STRINGS) [t.en, t.hi, t.hi_latn].forEach(add);
  }
  [item.prompt_en, item.prompt_hi, item.answer, ...(item.acceptable || [])].forEach(add);
  for (const o of item.options || []) add(o.text);
  // Parsed pieces of the item's own prompt (order steps, scramble words, quoted contrast options).
  for (const m of String(item.prompt_en).matchAll(/\(([a-f])\)\s*([^()]+?)(?=\s*\([a-f]\)|$)/g)) add(m[2].trim().replace(/[.;,]\s*$/, ""));
  for (const m of String(item.prompt_en).matchAll(/['‘’"“”]([^'‘’"“”]{1,80})['‘’"“”]/g)) add(m[1].trim());
  for (const w of String(item.answer).replace(/[.!?]$/, "").split(/\s+/)) add(w);
  for (const m of kit.misconceptions) for (const o of m.diagnostic?.options || []) add(o.text);
  return s;
}

/**
 * @param {object} fill    { tier, renderer, template?, params?, scene?, hook?, skin?, decor?, grade, correctId?, correctOrder? }
 * @param {{ item: any, kit: any, childFirstName?: string, activity: any }} ctx
 * @returns {{ ok: boolean, gateVersion: string, failures: string[], checks: Record<string, boolean>, ms: number, sceneErrors?: string[] }}
 */
export function gateFill(fill, ctx) {
  const t0 = performance.now();
  const { item, kit, activity } = ctx;
  const failures = [];
  const checks = { schema: true, solver: true, truth: true, leak: true, safety: true, size: true };
  let sceneErrors;

  // ── Q0 schema + size ──
  const payload = fill.renderer === "scene@1" ? { scene: fill.scene } : fill.params;
  const bytes = Buffer.byteLength(JSON.stringify(payload ?? null));
  if (bytes > INIT_MAX_BYTES) { checks.size = false; fail(failures, "size", String(bytes)); }
  if (fill.renderer === "fraction-bars@1") {
    for (const [k, v] of Object.entries(fill.params || {})) {
      const spec = FRACTION_BARS_PARAMS[k];
      if (!spec) { checks.schema = false; fail(failures, "schema.unknown_param", k); continue; }
      const typeOk = spec.type === "array" ? Array.isArray(v) : typeof v === spec.type;
      if (!typeOk || (spec.enum && !spec.enum.includes(v)) || (spec.min !== undefined && v < spec.min) || (spec.max !== undefined && v > spec.max)) { checks.schema = false; fail(failures, "schema.bad_value", k); }
    }
    const p = fill.params;
    const dens = p.denominators || [];
    if (!dens.length || dens.length > 3 || !dens.every((d) => Number.isInteger(d) && d >= 1 && d <= 12)) { checks.schema = false; fail(failures, "schema.denominators"); }
    if ((p.numerators || []).some((n, i) => !Number.isInteger(n) || n < 0 || n > dens[i])) { checks.schema = false; fail(failures, "schema.numerators"); }
  } else if (fill.renderer === "scene@1") {
    const v = validateScene(fill.scene);
    if (!v.ok) { checks.schema = false; sceneErrors = v.errors.map((e) => e.code); for (const c of new Set(sceneErrors)) fail(failures, c.startsWith("S4") ? "solver" : "scene", c); if (sceneErrors.some((c) => c.startsWith("S4"))) checks.solver = false; }
    else if (v.fixes.length) { checks.schema = false; fail(failures, "scene.autofixed", v.fixes.length); }  // shipped bytes must be the gated bytes
  } else { checks.schema = false; fail(failures, "schema.renderer", fill.renderer); }

  // ── Q4 solver + Q5 truth: re-derive the graded key from the payload alone ──
  const kitKeys = keyValues(item);
  if (fill.renderer === "fraction-bars@1") {
    const p = fill.params;
    if (p.mode === "compare") {
      const fr = p.denominators.map((d, i) => R(p.numerators[i] ?? 0, d));
      const best = fr.reduce((acc, f) => (p.question === "smaller" ? cmp(f, acc) < 0 : cmp(f, acc) > 0) ? f : acc, fr[0]);
      const winners = fr.filter((f) => eq(f, best));
      if (winners.length === fr.length) {                     // all equal: the "same" button is the only right tap
        if (!SAME_RE.test(String(item.answer))) { checks.truth = false; fail(failures, "truth.kit_key_disagrees_kitmath", `${item.answer}≠same`); }
      } else if (winners.length > 1) { checks.solver = false; fail(failures, "solver.two_winning_bars"); }
      else if (!kitKeys.length) { checks.truth = false; fail(failures, "truth.kit_answer_not_a_value", item.answer); }
      else if (!kitKeys.some((k) => eq(k, best))) { checks.truth = false; fail(failures, "truth.kit_key_disagrees_kitmath", `${item.answer}≠${best.n}/${best.d}`); }
    } else {
      const m = String(p.target || "").match(/^(\d+)\/(\d+)$/);
      const tb = p.targetBar ?? 0; const d = p.denominators[tb];
      if (!m || (p.locked || [])[tb]) { checks.solver = false; fail(failures, "solver.no_open_target_bar"); }
      else {
        const t = { n: +m[1], d: +m[2] };
        const parts = (t.n * d) % t.d === 0 ? (t.n * d) / t.d : null;
        if (parts === null || parts > d) { checks.solver = false; fail(failures, "solver.target_unreachable", `${p.target} on ${d}`); }
        if ((p.numerators || [])[tb] && parts !== null && (p.numerators[tb] * t.d === t.n * d)) { checks.leak = false; fail(failures, "leak.starts_solved"); }
        // What is graded: the value shown on the target bar at goal. For equivalence items the kit asks for the
        // numerator over a given denominator, so the graded form is the target fraction itself.
        const graded = R(t.n, t.d);
        if (!kitKeys.length) { checks.truth = false; fail(failures, "truth.kit_answer_not_a_value", item.answer); }
        else if (!kitKeys.some((k) => eq(k, graded) || (activity?.task?.op === "equiv" && kitKeys.some((kk) => kk.n === t.n && kk.d === 1)))) {
          checks.truth = false; fail(failures, "truth.kit_key_disagrees_kitmath", `${item.answer}≠${p.target}`);
        }
      }
    }
  } else if (fill.renderer === "scene@1" && fill.scene?.probe) {
    const pr = fill.scene.probe;
    if (fill.template === "choice-card@1") {
      const m = pr.correct.match(/^pick == '([a-z0-9_]+)'$/);
      const ch = fill.scene.nodes.find((n) => n.kind === "choice");
      const opt = m && ch?.options.find((o) => o.id === m[1]);
      // Exact for diagnostics (the label IS the kit option text); case/punctuation-preserving for contrast items.
      const okKey = opt && (item.diagnostic ? opt.label.en === item.options.find((o) => o.correct)?.text
        : [item.answer, ...(item.acceptable || [])].map(strictText).includes(strictText(opt.label.en)));
      if (!okKey) { checks.truth = false; fail(failures, "truth.choice_key_mismatch"); }
      const kitMisc = new Set(kit.misconceptions.map((x) => x.id));
      for (const t of pr.traps) if (!kitMisc.has(fill.miscMap?.[t.misc])) { checks.truth = false; fail(failures, "truth.trap_not_a_kit_misconception", t.misc); }
      for (const o of ch?.options || []) if (o.id !== opt?.id && item.diagnostic) {
        const src = item.options.find((x) => x.text === o.label?.en);
        if (src?.correct) { checks.truth = false; fail(failures, "truth.two_correct_options"); }
      }
    } else if (fill.template === "sequence-steps@1") {
      const m = pr.correct.match(/^order\(steps\) == '([^']+)'$/);
      const order = m ? m[1].split(",") : [];
      const node = fill.scene.nodes.find((n) => n.kind === "order");
      const label = (id) => node?.items.find((x) => x.id === id)?.label?.en;
      const letters = String(item.answer).toLowerCase().match(/\b[a-f]\b/g) || [];
      const asSentence = normText(order.map(label).join(" "));
      const isScramble = activity?.sentence !== undefined;
      const okKey = isScramble ? asSentence === normText(item.answer.replace(/[.!?]$/, ""))
        : letters.length === order.length && order.every((id, i) => id === `s_${letters[i]}`);
      if (!okKey) { checks.truth = false; fail(failures, "truth.order_key_mismatch"); }
      if (node?.start && node.start.join(",") === order.join(",")) { checks.leak = false; fail(failures, "leak.starts_solved"); }
    }
  }
  if (item.verified && item.verified.agrees === false) { checks.truth = false; fail(failures, "truth.kit_item_disputed"); }

  // ── leak: pre-commit strings must not name the answer ──
  const { pre, task } = visibleStrings(fill);
  const answerForms = [item.answer, ...(item.acceptable || []), fill.grade?.key, fill.params?.mode === "shade" ? fill.params.target : null]
    .filter((x) => typeof x === "string").map(normText).filter((x) => x.length >= 2);
  for (const s of pre) {
    if (s === item.prompt_en || s === item.prompt_hi) continue;             // posing the question is not a leak
    // Stricter than the spoken-turn predicate: a title never needs to name an option, so ANY key form in a
    // non-question string is a leak, even one the question itself names ("Answer: Dadaji went to the shop").
    if (revealsAnswer(s, item) || answerForms.some((a) => hasTerm(normText(s), a))) {
      checks.leak = false; fail(failures, "leak.pre_commit_string", s.slice(0, 40));
    }
  }

  // ── Q8 safety ──
  const allowed = allowedStrings(item, kit);
  const kitStrings = allowedStrings(item, kit, { kitOnly: true });
  for (const s of [...pre, ...task]) {
    if (!allowed.has(s) && !allowed.has(s.trim())) { checks.safety = false; fail(failures, "safety.string_not_cleared", s.slice(0, 40)); }
    const fromKit = kitStrings.has(s) || kitStrings.has(s.trim());
    if (SEVERE.some((re) => re.test(s)) || (!fromKit && MILD.some((re) => re.test(s)))) { checks.safety = false; fail(failures, "safety.blocklist", s.slice(0, 40)); }
    if (PII.some((re) => re.test(s))) { checks.safety = false; fail(failures, "safety.pii_pattern", s.slice(0, 40)); }
  }
  // The child-name check is child-DEPENDENT, so it is not part of the child-free verdict that is cached and memoised
  // (index.js runs childNameClash at serve time, on every hit). It is applied here only when a caller asks for it.
  if (ctx.childFirstName && childNameClash(fill, item, kit, ctx.childFirstName)) { checks.safety = false; fail(failures, "safety.child_name"); }
  if (fill.decor && !(DECOR[fill.skin] || []).includes(fill.decor)) { checks.safety = false; fail(failures, "safety.decor_not_in_skin", fill.decor); }
  if (fill.hook && !HOOK_BY_ID[fill.hook.id]) { checks.safety = false; fail(failures, "safety.hook_not_in_table"); }

  return { ok: failures.length === 0, gateVersion: GATE_VERSION, failures, checks, ms: +(performance.now() - t0).toFixed(2), ...(sceneErrors ? { sceneErrors } : {}), bytes };
}

/**
 * Does a NON-kit child-visible string of this fill carry the child's first name? Kit strings are verified, human
 * authored and child-free: kits name characters constantly (Chintu 154x, Ravi 123x, Riya 104x across c4-c7), so a
 * child who shares a character's name must not lose the activity — the check exists for generated / table text.
 * @param {object} fill  a gate-shaped fill ({ hook, scene? }) or a cached body ({ hook, payload: { scene? } })
 */
export function childNameClash(fill, item, kit, childFirstName) {
  const name = String(childFirstName || "").trim();
  if (name.length < 3) return false;
  const f = fill.scene || !fill.payload?.scene ? fill : { ...fill, scene: fill.payload.scene };
  const { pre, task } = visibleStrings(f);
  const kitStrings = allowedStrings(item, kit, { kitOnly: true });
  const re = new RegExp(`(^|[^\\p{L}])${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\p{L}])`, "iu");
  return [...pre, ...task].some((s) => !(kitStrings.has(s) || kitStrings.has(s.trim())) && re.test(s));
}

export { parseValue };
