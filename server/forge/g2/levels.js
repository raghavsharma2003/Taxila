// Server-side expansion (FACTORY.md §4.8a in the G2-lite form): TRUSTED code turns a verified kit topic into the
// LevelSpecs a G2 module plays. Agent code never sees this file's inputs; it gets refs to what this file emits.
// Truth sources, in order (§4.4): KitMath recompute (fractions) → the kit item's `verified.agrees === true` → a kit
// diagnostic's own `correct` flag (human-authored, blind-checked). Anything else is not a G2 item.
// Child-free by construction: the input is a topic id, the output carries kit text and kit keys only.
import { readFileSync, readdirSync } from "fs";
import { fractionTask, miscDistractors, parseValue, eq, str } from "../kitmath.js";
import { revealsAnswer } from "../../director/items.js";

const KITS = new URL("../../../data/kits/", import.meta.url);
export const LEVELS_VERSION = "g2-levels@1";
const LABEL_MAX = 28;
const PROMPT_MAX = 180;

let kitIndex = null;
/** topicId → raw kit topic (data/kits/*.json read directly: no compiler/learner imports in the runner image). */
export function loadTopic(topicId) {
  if (!kitIndex) {
    kitIndex = new Map();
    for (const f of readdirSync(KITS).filter((n) => /^c\d+-[a-z]+\.json$/.test(n))) {
      const k = JSON.parse(readFileSync(new URL(f, KITS), "utf8"));
      for (const t of k.topics || []) kitIndex.set(t.topicId, { ...t, _class: k.class, _subject: k.subject, _file: f });
    }
  }
  return kitIndex.get(topicId) || null;
}
export const _resetKitIndex = () => { kitIndex = null; };

const isInt = (s) => /^\d{1,4}$/.test(String(s).trim());
const isFrac = (s) => /^\d{1,3}\s*\/\s*\d{1,3}$/.test(String(s).trim());
const short = (s) => typeof s === "string" && s.trim().length > 0 && s.trim().length <= LABEL_MAX;

/** Integer distractors by code (no misconception id: "other"). Deterministic, positive, never the key. */
export function intDistractors(key, n = 3) {
  const k = +key;
  const rev = +String(k).split("").reverse().join("");
  const cands = [k + 1, k - 1, k + 10, k - 10, rev, k * 10, k + 2, k - 2].filter((v) => Number.isInteger(v) && v >= 0 && v !== k);
  return [...new Set(cands)].slice(0, n).map((v) => ({ v: String(v), label: String(v), misc: null }));
}

/** Why an item is (not) a G2 item. Pure; exported for the tests. */
export function itemSpec(item, topic, mode = "choice") {
  const prompt = { en: String(item.prompt_en || "").trim(), hi: String(item.prompt_hi || item.prompt_en || "").trim() };
  if (!prompt.en || prompt.en.length > PROMPT_MAX || prompt.hi.length > PROMPT_MAX) return { skip: "prompt_length" };
  if (revealsAnswer(prompt.en, item) || revealsAnswer(prompt.hi, item)) return { skip: "prompt_reveals" };
  const ans = String(item.answer || "").trim();
  if (isFrac(ans)) {
    const task = fractionTask(item);
    const v = parseValue(ans);
    if (!task?.key || !v || !eq(task.key, v)) return { skip: "kitmath_disagrees" };       // KitMath is truth #1
    if (mode === "build") return { skip: "build_fraction_v0" };
    const ds = miscDistractors(task, topic.misconceptions || []).map((d) => ({ v: d.value, label: d.value, misc: d.misc }));
    for (const alt of [`${v.n + 1}/${v.d}`, `${v.n}/${v.d + 1}`, `${Math.max(1, v.n - 1)}/${v.d}`]) {
      const a = parseValue(alt);
      if (a && !eq(a, v) && !ds.some((d) => eq(parseValue(d.v), a))) ds.push({ v: alt, label: alt, misc: null });
    }
    return { spec: { id: item.id, mode: "choice", prompt, key: { v: str(v), label: ans }, acceptable: [ans, ...(item.acceptable || []).filter(isFrac)], distractors: ds.slice(0, 3), truth: "kitmath" } };
  }
  if (isInt(ans)) {
    if (item.verified?.agrees !== true) return { skip: "unverified" };
    if (String(item.verified.solverAnswer ?? "").trim() && parseValue(item.verified.solverAnswer) && !eq(parseValue(item.verified.solverAnswer), parseValue(ans))) return { skip: "solver_disagrees" };
    if (mode === "build") {
      const k = +ans;
      if (k < 1 || k > 99) return { skip: "build_range" };
      return { spec: { id: item.id, mode: "build", prompt, key: { v: String(k), label: String(k) }, acceptable: [], distractors: [],
        units: [{ v: "10", label: "10" }, { v: "1", label: "1" }], truth: "verified" } };
    }
    return { spec: { id: item.id, mode: "choice", prompt, key: { v: ans, label: ans }, acceptable: (item.acceptable || []).filter(isInt), distractors: intDistractors(ans), truth: "verified" } };
  }
  return { skip: "answer_shape" };
}

/** A kit diagnostic as a choice item: options with exactly one correct, every label short. */
export function diagnosticSpec(m, topicId) {
  const d = m.diagnostic;
  if (!d || !Array.isArray(d.options)) return { skip: "no_diagnostic" };
  const right = d.options.filter((o) => o.correct);
  if (right.length !== 1 || d.options.length < 2 || d.options.length > 4) return { skip: "diag_shape" };
  if (!d.options.every((o) => short(o.text))) return { skip: "diag_label_length" };
  const prompt = { en: String(d.prompt_en || "").trim(), hi: String(d.prompt_hi || d.prompt_en || "").trim() };
  if (!prompt.en || prompt.en.length > PROMPT_MAX || prompt.hi.length > PROMPT_MAX) return { skip: "prompt_length" };
  // exact option text (forge-g1-case-folded-keys: in grammar items the capital or the apostrophe IS the answer)
  const texts = d.options.map((o) => o.text.trim());
  if (new Set(texts).size !== texts.length) return { skip: "diag_duplicate_options" };
  return { spec: { id: `diag:${m.id}`, mode: "choice", prompt, key: { v: right[0].text.trim(), label: right[0].text.trim() }, acceptable: [],
    distractors: d.options.filter((o) => !o.correct).map((o) => ({ v: o.text.trim(), label: o.text.trim(), misc: o.misconceptionId || null })), truth: "diagnostic" } };
}

/**
 * Every G2-eligible item of a topic for an archetype, kit order. → { specs, skipped: {reason: n} }
 * @param {"choice"|"build"} archetype
 */
export function eligibleSpecs(topic, archetype) {
  const specs = [], skipped = {};
  const note = (r) => { skipped[r] = (skipped[r] || 0) + 1; };
  for (const it of topic.items || []) { const r = itemSpec(it, topic, archetype); r.spec ? specs.push(r.spec) : note(r.skip); }
  if (archetype === "choice") for (const m of topic.misconceptions || []) { const r = diagnosticSpec(m, topic.topicId); r.spec ? specs.push(r.spec) : note(r.skip); }
  return { specs, skipped };
}

/** Which archetype a topic supports best (code, not a model): build needs ≥ 4 small verified integers. */
export function archetypeFor(topic) {
  const b = eligibleSpecs(topic, "build").specs.length, c = eligibleSpecs(topic, "choice").specs.length;
  if (b >= 4) return "build";
  return c >= 4 ? "choice" : null;
}

/**
 * Split into visible (build loop) and held-out (final gate only, never shown to the builder: QA R10) sets, then levels
 * of ≤ perLevel items. Deterministic by index: every third item is held out.
 */
export function splitLevels(specs, { perLevel = 4, maxLevels = 2 } = {}) {
  const visible = [], heldOut = [];
  specs.forEach((s, i) => ((i % 3 === 2) ? heldOut : visible).push(s));
  const chunk = (xs) => { const out = []; for (let i = 0; i < xs.length && out.length < maxLevels; i += perLevel) out.push({ id: `L${out.length + 1}`, items: xs.slice(i, i + perLevel) }); return out; };
  return { visible: chunk(visible), heldOut: chunk(heldOut.length ? heldOut : visible.slice(-2)), all: chunk(specs) };
}

/** The params the kit receives (no truth field; that stays server-side for the re-grade). */
export function frameLevels(levels) {
  return levels.map((l) => ({ id: l.id, items: l.items.map(({ truth, ...rest }) => rest) }));
}
