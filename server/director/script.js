// round 7 (dc-r7-teaching-scripts, T-schema): a topic's lesson script (shared/contracts.ts TopicScript, Learning's
// LESSON-SCRIPTS-SPEC.md shape) checked in code against its kit before the Director may walk it. A skill whose script fails is
// never walked (the lesson keeps the kit path for it). PURE.
import { readFileSync as readScriptFile } from "fs";
import { belowLevel, rateAsFraction, looksEnglish } from "../brain/say.js";
import { INTERESTS } from "../persona/signals.js";
export { rateAsFraction };

const SAY_KINDS = new Set(["why", "practice", "near_transfer", "far_transfer", "contrast", "error_spot", "predict", "translate_rep", "retrieval"]);
// a shape that carries a quoted sentence of 6+ words is a LINE (it would be recited)
const QUOTED_LINE = /["“”‘’]([^"“”‘’]{0,200})["“”‘’]/g;
// a shape written as a sentence to say: a greeting, "Let's …", praise, an exclamation (the spec's banned list)
const SPOKEN = /^\s*(?:let'?s|chalo|good job|well done|shabash|hello|hi\b|namaste)\b|!\s*$/i;

const nums = (s) => String(s ?? "").match(/\d+(?:\.\d+)?(?:\/\d+)?/g) ?? [];
const firstNum = (s) => String(s ?? "").match(/\d+(?:\.\d+)?(?:\/\d+)?/)?.[0] ?? null;
/** The key's number when it is one number and the question is not a choice among options (where the key is legitimately named). */
const keyLeaks = (key, q) => (/^\s*\d+(?:\.\d+)?(?:\/\d+)?\s*\p{L}{0,6}\.?\s*$/u.test(String(key ?? "")) && !/\bor\b|\byaa?\b|\bki\b.*\bya\b|order|kram|,\s*\d/i.test(String(q ?? "")) && !/^\s*(yes|no|haan|nahi)\b/i.test(String(key)) ? nums(key)[0] : null);
/** A calculation "4 + 5 = 9 m", "2 × (50 + 30) = 2 × 80 = 160": every "=" link evaluates to the same number. null: not arithmetic. */
export function calcHolds(calc) {
  let raw = String(calc ?? "").replace(/[a-zA-Z²\s]+$/u, "").split("=");
  // a leading label ("3 rounds", "Perimeter") names what is computed; it is not a term of the calculation
  if (raw.length >= 2 && /\p{L}{2,}/u.test(raw[0]) && !/[+\-−×x*÷/]\s*\d/.test(raw[0])) raw = raw.slice(1);
  const parts = raw.map((p) => p.replace(/[^\d+\-−×x*÷/().\s]/g, "").trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const ev = (e) => {
    const js = e.replace(/[×x]/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
    if (!/^[\d+\-*/().\s]+$/.test(js)) return NaN;
    try { return Function(`"use strict"; return (${js});`)(); } catch { return NaN; }
  };
  const vals = parts.map(ev);
  if (vals.some((v) => !Number.isFinite(v))) return null;
  return vals.every((v) => Math.abs(v - vals[0]) < 1e-9);
}
/** A board ref's params, nested ({ template, params }) or flat ({ template, ...params }). */
export const boardParams = (b) => (b && typeof b === "object" ? (b.params && typeof b.params === "object" ? b.params : Object.fromEntries(Object.entries(b).filter(([k]) => !["template", "withhold", "auto"].includes(k)))) : {});

/**
 * One skill's script against its kit.
 * @returns {string[]} the errors (empty: ok)
 */
export function validateSkillScript(sk, kit, { classLevel } = {}) {
  const errors = [];
  const err = (m) => errors.push(`${sk?.skillId ?? "?"}: ${m}`);
  if (!(kit?.skills ?? []).some((k) => k.id === sk?.skillId)) err("skillId is not a skill of the kit");
  const cl = Number(classLevel);
  const kitText = (kit?.items ?? []).map((i) => `${i.prompt_en ?? ""} ${i.prompt_hi ?? ""}`).join(" ");
  const shape = (where, t, { optional = false } = {}) => {
    if (!String(t ?? "").trim()) { if (!optional) err(`${where}: empty`); return; }
    for (const m of String(t).matchAll(QUOTED_LINE)) if (m[1].trim().split(/\s+/).length >= 6) err(`${where}: a quoted line ("${m[1].slice(0, 40)}…"); write what to convey, not the words`);
    if (SPOKEN.test(String(t))) err(`${where}: written as a line to say (greeting, "let's", praise or "!"); a shape, not a sentence`);
    if (belowLevel(t, cl, kitText)) err(`${where}: below class ${cl} (counting on, a tiny sum, or counting sides)`);
    if (rateAsFraction(t)) err(`${where}: reads a rate as a fraction`);
  };
  // hook
  shape("hook.convey", sk?.hook?.convey);
  shape("hook.slotUse", sk?.hook?.slotUse);
  if (!Array.isArray(sk?.hook?.interestSlots) || !sk.hook.interestSlots.length) err("hook.interestSlots: at least one");
  // explain: each a shape over a board it can point at
  if (!Array.isArray(sk?.explain) || sk.explain.length < 1 || sk.explain.length > 4) err("explain: 1-4 beats");
  for (const [i, b] of (sk?.explain ?? []).entries()) {
    shape(`explain[${i}].convey`, b?.convey);
    if (b?.board && !b.board.auto && !b.board.template) err(`explain[${i}].board: a template or { auto: true }`);
    if (b?.board?.template && !String(b.point ?? "").trim()) err(`explain[${i}].point: what on the board to point at`);
  }
  // the worked example: stated, givens, every step (results hold), the answer = the last result, and why
  const w = sk?.workedExample ?? {};
  if (!String(w.problem ?? "").trim()) err("workedExample.problem: stated in full");
  if (!Array.isArray(w.givens) || !w.givens.length) err("workedExample.givens: at least one");
  for (const g of w.givens ?? []) if (!/\p{L}{2,}/u.test(String(g))) err(`workedExample.givens: "${g}" is a bare number; say what it is`);
  if (nums(w.problem).length && !(w.givens ?? []).some((g) => nums(g).some((n) => nums(w.problem).includes(n)))) err("workedExample.givens: none of the problem's numbers is given");
  if (!String(w.find ?? "").trim()) err("workedExample.find: what is asked");
  if (!Array.isArray(w.steps) || w.steps.length < 2) err("workedExample.steps: at least two (every step, never one)");
  for (const [i, st] of (w.steps ?? []).entries()) {
    shape(`workedExample.steps[${i}].do`, st?.do);
    if (!String(st?.result ?? "").trim()) err(`workedExample.steps[${i}].result: exact`);
    if (/_{2,}/.test(String(st?.result ?? ""))) err(`workedExample.steps[${i}].result: a faded blank (the worked example has none)`);
    if (calcHolds(st?.result) === false) err(`workedExample.steps[${i}].result does not hold: ${st.result}`);
  }
  if (!String(w.answer ?? "").trim()) err("workedExample.answer: said (toh jawab)");
  shape("workedExample.why", w.why);
  const last = [...(w.steps ?? [])].reverse().find((s) => /=/.test(String(s?.result ?? "")))?.result;
  // the answer's number is the last step's result (any of its equal forms: "7/4 = 1 and 3/4")
  if (last && w.answer && firstNum(w.answer) && !nums(last).includes(firstNum(w.answer))) err(`workedExample.answer ${w.answer} is not the last step's result ${last}`);
  // checks: 2-3, keyed, a real misconception with its wrong answer, the key never inside the question
  const misIds = new Set((kit?.misconceptions ?? []).map((m) => m.id));
  if (!Array.isArray(sk?.checks) || sk.checks.length < 2 || sk.checks.length > 3) err("checks: 2-3");
  for (const [i, c] of (sk?.checks ?? []).entries()) {
    if (!String(c?.prompt ?? "").trim() || !String(c?.key ?? "").trim()) err(`checks[${i}]: prompt and key`);
    if (!misIds.has(c?.targets)) err(`checks[${i}].targets: ${c?.targets} is not a kit misconception`);
    if (!String(c?.wrongIfMis ?? "").trim()) err(`checks[${i}].wrongIfMis: the answer the misconception gives`);
    if (firstNum(c?.wrongIfMis) && firstNum(c?.wrongIfMis) === firstNum(c?.key)) err(`checks[${i}]: wrongIfMis equals the key`);
    const k = keyLeaks(c?.key, c?.prompt);
    if (k && new RegExp(`(?<![\\d./])${k.replace(/[./]/g, "\\$&")}(?![\\d/])`).test(String(c?.prompt ?? ""))) err(`checks[${i}]: its key ${k} is inside its question`);
    if (rateAsFraction(c?.prompt)) err(`checks[${i}]: reads a rate as a fraction`);
  }
  // the ladder: the kit's real items of this skill, 3-5 rungs
  const items = new Map((kit?.items ?? []).map((it) => [it.id, it]));
  if (!Array.isArray(sk?.ladder) || sk.ladder.length < 3 || sk.ladder.length > 5) err("ladder: 3-5 rungs");
  for (const [i, r] of (sk?.ladder ?? []).entries()) {
    const it = items.get(r?.itemId);
    if (!it) { err(`ladder[${i}]: ${r?.itemId} is not a kit item`); continue; }
    if (!SAY_KINDS.has(it.kind)) err(`ladder[${i}]: ${r.itemId} is a ${it.kind}, not a practice kind`);
    if (it.skillId !== sk.skillId) err(`ladder[${i}]: ${r.itemId} is skill ${it.skillId}`);
    shape(`ladder[${i}].why`, r?.why, { optional: true });
  }
  // remediation: one per misconception the checks target; a new representation, never counting; a keyed follow-up
  const remedied = new Set((sk?.remediation ?? []).map((r) => r?.targets));
  for (const c of sk?.checks ?? []) if (c?.targets && !remedied.has(c.targets)) err(`remediation: none for ${c.targets}`);
  for (const [i, r] of (sk?.remediation ?? []).entries()) {
    if (!misIds.has(r?.targets)) err(`remediation[${i}].targets: ${r?.targets} is not a kit misconception`);
    shape(`remediation[${i}].move`, r?.move);
    if (!String(r?.then ?? "").trim() || !String(r?.thenKey ?? "").trim()) err(`remediation[${i}]: then and thenKey`);
    const tk = keyLeaks(r?.thenKey, r?.then);
    if (tk && new RegExp(`(?<![\\d./])${tk.replace(/[./]/g, "\\$&")}(?![\\d/])`).test(String(r?.then ?? ""))) err(`remediation[${i}]: its key ${tk} is inside its question`);
  }
  if (sk?.bridgeToNext != null) shape("bridgeToNext", sk.bridgeToNext);
  return errors;
}

// ───────────── script v2 (dc-r7-script-walk-v2: F1-F4) ─────────────
/** A spoken / shown field in the lesson language: a Said's hi (Hinglish / Hindi) or en; a v1 plain string only when it is not
 *  English in a Hinglish lesson (code never speaks an English-only field there). null: nothing code may say. */
export function saidIn(x, lang = "hinglish") {
  if (x == null) return null;
  if (typeof x === "object") { const v = lang === "english" ? x.en : x.hi; return String(v ?? "").trim() || null; }
  const t = String(x).trim();
  if (!t) return null;
  return lang === "english" || !looksEnglish(t) ? t : null;
}
const isSaid = (x) => !!x && typeof x === "object" && String(x.hi ?? "").trim() && String(x.en ?? "").trim();
/** One v2 skill's script against its kit: the v1 checks that still apply, plus F1-F4. */
export function validateSkillScriptV2(sk, kit, { classLevel } = {}) {
  const errors = [];
  const err = (m) => errors.push(`${sk?.skillId ?? "?"}: ${m}`);
  if (!(kit?.skills ?? []).some((k) => k.id === sk?.skillId)) err("skillId is not a skill of the kit");
  const cl = Number(classLevel);
  const kitText = (kit?.items ?? []).map((i) => `${i.prompt_en ?? ""} ${i.prompt_hi ?? ""}`).join(" ");
  const misIds = new Set((kit?.misconceptions ?? []).map((m) => m.id));
  const shape = (where, t) => {
    if (!String(t ?? "").trim()) { err(`${where}: empty`); return; }
    for (const m of String(t).matchAll(QUOTED_LINE)) if (m[1].trim().split(/\s+/).length >= 6) err(`${where}: a quoted line; write what to convey, not the words`);
    if (SPOKEN.test(String(t))) err(`${where}: written as a line to say; a shape, not a sentence`);
  };
  // F1: a spoken field has both forms, and its hi form is not English
  const said = (where, x, { optional = false } = {}) => {
    if (x == null && optional) return;
    if (!isSaid(x)) { err(`${where}: needs { hi, en } (F1: every spoken or shown field has a Hinglish form)`); return; }
    if (looksEnglish(x.hi)) err(`${where}.hi: reads as English ("${String(x.hi).slice(0, 40)}…"); write it in Hinglish`);
    for (const v of [x.hi, x.en]) {
      if (belowLevel(v, cl, kitText)) err(`${where}: below class ${cl}`);
      if (rateAsFraction(v)) err(`${where}: reads a rate as a fraction`);
    }
  };
  const asked = (where, a) => {
    if (!a || typeof a !== "object") { err(`${where}: a keyed question { prompt, key }`); return; }
    said(`${where}.prompt`, a.prompt);
    if (!String(a.key ?? "").trim()) err(`${where}.key: the answer it is judged against`);
    for (const f of ["hi", "en"]) { const k = keyLeaks(a.key, a.prompt?.[f]); if (k && new RegExp(`(?<![\\d./])${k.replace(/[./]/g, "\\$&")}(?![\\d/])`).test(String(a.prompt?.[f] ?? ""))) err(`${where}: its key ${k} is inside its question (${f})`); }
    if (a.targets != null && !misIds.has(a.targets)) err(`${where}.targets: ${a.targets} is not a kit misconception`);
  };
  // F4: the hook's interest slots
  shape("hook.convey", sk?.hook?.convey);
  const slots = sk?.hook?.interestSlots;
  if (!Array.isArray(slots) || !slots.length) err("hook.interestSlots: at least one { interest, use }");
  for (const [i, sl] of (slots ?? []).entries()) {
    if (!sl || typeof sl !== "object" || !Object.hasOwn(INTERESTS, sl.interest)) { err(`hook.interestSlots[${i}].interest: one of ${Object.keys(INTERESTS).join(", ")}`); continue; }
    said(`hook.interestSlots[${i}].use`, sl.use);
    const words = [sl.interest, ...INTERESTS[sl.interest]];
    if (isSaid(sl.use) && !words.some((w) => new RegExp(`(?<![\\p{L}])${w}`, "iu").test(`${sl.use.hi} ${sl.use.en}`))) err(`hook.interestSlots[${i}].use: is not set in ${sl.interest} (none of its words)`);
  }
  // F2: every explain beat ends in its keyed micro-question, and names what her line must say
  if (!Array.isArray(sk?.explain) || sk.explain.length < 1 || sk.explain.length > 4) err("explain: 1-4 beats");
  for (const [i, b] of (sk?.explain ?? []).entries()) {
    shape(`explain[${i}].convey`, b?.convey);
    if (!Array.isArray(b?.mustSay) || b.mustSay.length < 1 || b.mustSay.length > 3) err(`explain[${i}].mustSay: 1-3 terms or numbers`);
    for (const [j, m] of (b?.mustSay ?? []).entries()) if (!isSaid(m)) err(`explain[${i}].mustSay[${j}]: { hi, en }`);
    if (b?.board && !b.board.auto && !b.board.template) err(`explain[${i}].board: a template or { auto: true }`);
    said(`explain[${i}].point`, b?.point, { optional: true });
    asked(`explain[${i}].ask`, b?.ask);
  }
  // F3: the worked example — stated, every step with its result and why, the last step the child's, then the answer and why
  const w = sk?.workedExample ?? {};
  said("workedExample.problem", w.problem);
  if (!Array.isArray(w.givens) || !w.givens.length) err("workedExample.givens: at least one");
  for (const [i, g] of (w.givens ?? []).entries()) said(`workedExample.givens[${i}]`, g);
  said("workedExample.find", w.find);
  if (!Array.isArray(w.steps) || !w.steps.length) err("workedExample.steps: at least one before the child's step");
  for (const [i, st] of (w.steps ?? []).entries()) {
    said(`workedExample.steps[${i}].do`, st?.do);
    said(`workedExample.steps[${i}].why`, st?.why);
    if (!String(st?.result ?? "").trim()) err(`workedExample.steps[${i}].result: exact`);
    if (calcHolds(st?.result) === false) err(`workedExample.steps[${i}].result does not hold: ${st.result}`);
  }
  asked("workedExample.yourStep", w.yourStep);
  said("workedExample.answer", w.answer);
  said("workedExample.why", w.why);
  const yk = firstNum(w.yourStep?.key);
  if (yk && isSaid(w.answer) && firstNum(w.answer.en) && !nums(w.answer.en).includes(yk)) err(`workedExample.answer ${w.answer.en} does not carry the child's step's key ${yk}`);
  // checks
  if (!Array.isArray(sk?.checks) || sk.checks.length < 2 || sk.checks.length > 3) err("checks: 2-3");
  for (const [i, c] of (sk?.checks ?? []).entries()) {
    asked(`checks[${i}]`, c);
    if (!misIds.has(c?.targets)) err(`checks[${i}].targets: ${c?.targets} is not a kit misconception`);
    if (!String(c?.wrongIfMis ?? "").trim()) err(`checks[${i}].wrongIfMis: the answer the misconception gives`);
    if (firstNum(c?.wrongIfMis) && firstNum(c?.wrongIfMis) === firstNum(c?.key)) err(`checks[${i}]: wrongIfMis equals the key`);
  }
  // ladder
  const items = new Map((kit?.items ?? []).map((it) => [it.id, it]));
  if (!Array.isArray(sk?.ladder) || sk.ladder.length < 3 || sk.ladder.length > 5) err("ladder: 3-5 rungs");
  for (const [i, r] of (sk?.ladder ?? []).entries()) {
    const it = items.get(r?.itemId);
    if (!it) { err(`ladder[${i}]: ${r?.itemId} is not a kit item`); continue; }
    if (!SAY_KINDS.has(it.kind)) err(`ladder[${i}]: ${r.itemId} is a ${it.kind}, not a practice kind`);
    if (it.skillId !== sk.skillId) err(`ladder[${i}]: ${r.itemId} is skill ${it.skillId}`);
  }
  // remediation: said, then a keyed follow-up card
  const targeted = new Set([...(sk?.checks ?? []).map((c) => c?.targets), ...(sk?.explain ?? []).map((b) => b?.ask?.targets)].filter(Boolean));
  const remedied = new Set((sk?.remediation ?? []).map((r) => r?.targets));
  for (const t of targeted) if (!remedied.has(t)) err(`remediation: none for ${t}`);
  for (const [i, r] of (sk?.remediation ?? []).entries()) {
    if (!misIds.has(r?.targets)) err(`remediation[${i}].targets: ${r?.targets} is not a kit misconception`);
    shape(`remediation[${i}].move`, r?.move);
    said(`remediation[${i}].say`, r?.say);
    asked(`remediation[${i}].then`, r?.then);
  }
  said("bridgeToNext", sk?.bridgeToNext, { optional: true });
  return errors;
}

/**
 * A topic's script against its kit: every skill checked; `ok` lists the skills the Director may walk.
 * @param {import("../../shared/contracts.ts").TopicScript} sc
 * @returns {{ ok: string[], errors: string[] }}
 */
export function validateTopicScript(sc, kit) {
  if (!sc || typeof sc !== "object") return { ok: [], errors: ["no script"] };
  const errors = [];
  if (sc.topicId !== kit?.topicId) errors.push(`topicId ${sc.topicId} is not the kit's ${kit?.topicId}`);
  if (!Array.isArray(sc.skills) || !sc.skills.length) errors.push("skills: at least one");
  const ok = [];
  const topicBad = errors.length > 0;
  for (const sk of sc.skills ?? []) {
    const e = (Number(sc.version) >= 2 ? validateSkillScriptV2 : validateSkillScript)(sk, kit, { classLevel: sc.classLevel });
    if (!e.length && !topicBad) ok.push(sk.skillId);
    errors.push(...e);
  }
  return { ok, errors };
}

// ───────────── T2: the Director walks the script (kill switch TAXILA_R7_SCRIPT=off) ─────────────
/** The script versions the Director walks. */
export const WALK_VERSIONS = new Set([1]);
export const scriptOn = (env = process.env) => !/^(off|0|false)$/i.test(String(env.TAXILA_R7_SCRIPT ?? ""));
const SCRIPT_DIR = new URL("../../data/lesson-scripts/", import.meta.url);
const loaded = new Map();
/** Tests: a script for a topic in place of data/lesson-scripts (null: none); no argument clears every override and the cache. */
export function setScriptForTest(topicId, script) { if (topicId === undefined) { loaded.clear(); return; } loaded.set(`test:${topicId}`, script); loaded.delete(topicId); }
/**
 * The topic's validated script: { script, ok } (ok: the skill ids the Director may walk), or null (no script, or none walkable).
 * Read once per topic per process.
 */
export function scriptFor(kit) {
  const id = kit?.topicId;
  if (!id || !scriptOn()) return null;
  if (!loaded.has(id)) {
    let sc = loaded.has(`test:${id}`) ? loaded.get(`test:${id}`) : undefined;
    // under node --test the files are read only with TAXILA_R7_SCRIPT=on, so the kit-path suites stay as written when
    // scripts land in data/lesson-scripts; a test that walks a script sets one with setScriptForTest
    const fileOk = !process.env.NODE_TEST_CONTEXT || /^on$/i.test(String(process.env.TAXILA_R7_SCRIPT ?? ""));
    if (sc === undefined && fileOk) { try { sc = JSON.parse(readScriptFile(new URL(`${id}.json`, SCRIPT_DIR), "utf8")); } catch { sc = null; } }
    sc ??= null;
    const v = sc ? validateTopicScript(sc, kit) : null;
    // (the v2 walk — beat completion, R1 — lands after the schema: until then a v2 script validates but is not walked)
    loaded.set(id, v?.ok.length && WALK_VERSIONS.has(Number(sc.version ?? 1)) ? { script: sc, ok: new Set(v.ok) } : null);
  }
  return loaded.get(id);
}
/** A walkable skill's script, or null. */
export function skillScriptOf(kit, skillId) {
  const f = scriptFor(kit);
  return f?.ok.has(skillId) ? f.script.skills.find((k) => k.skillId === skillId) ?? null : null;
}
export const scriptIdOf = (kit) => { const f = scriptFor(kit); return f ? `${f.script.topicId}@${f.script.version ?? 1}` : null; };
/** The beats of a skill, in order: the hook (the lesson's first skill only), each explain beat, the worked example, each check. */
export function walkBeats(sk, { hook = false } = {}) {
  return [...(hook ? ["hook"] : []), ...(sk.explain ?? []).map((b) => `explain:${b.id}`), "worked", ...(sk.checks ?? []).map((c) => `check:${c.id}`)];
}
const keyed = (id, skillId, prompt, key, accept, extra) => ({ id, skillId, kind: "practice", difficulty: 1, prompt_en: prompt, prompt_hi: prompt,
  answer: String(key), acceptable: [...(accept ?? [])].map(String), hints: [], ...extra });
/** A script check as a keyed card (the classifier grades it against its key, like any item). */
export const scriptCheckItem = (skillId, c) => keyed(`script:${skillId}:${c.id}`, skillId, c.prompt, c.key, c.accept,
  { scriptCheck: { checkId: c.id, targets: c.targets, wrongIfMis: c.wrongIfMis } });
/** A remediation's follow-up question as a keyed card. */
export const scriptThenItem = (skillId, r) => keyed(`script:${skillId}:then:${r.targets}`, skillId, r.then, r.thenKey, [], { scriptThen: { targets: r.targets } });
const WORDS = {
  hinglish: { given: "Diya hai", first: "Pehle", then: "Phir", answer: "Toh jawab" },
  hindi: { given: "Diya hai", first: "Pehle", then: "Phir", answer: "Toh jawab" },
  english: { given: "Given", first: "First", then: "Then", answer: "So the answer is" },
};
const dot = (t) => String(t).trim().replace(/[.;,]+$/, "") + ".";
/** The script's worked example as code lines (brain/say.js speaks them after one framing sentence): givens, each step's result, the answer. */
export function scriptWorkedLines(w, lang = "hinglish") {
  const W = WORDS[lang] ?? WORDS.hinglish;
  const steps = (w?.steps ?? []).map((x) => String(x?.result ?? "").trim()).filter(Boolean);
  if (steps.length < 2 || !String(w?.answer ?? "").trim()) return null;
  // (F1, director4: "Diya hai: the flower bed is a closed five-sided shape" in a Hinglish lesson) code never speaks an
  // English-only field: such givens are left out, and an English-only answer keeps only its number and unit
  const givens = (w.givens ?? []).map((g) => saidIn(g, lang)).filter(Boolean);
  const answer = saidIn(w.answer, lang) ?? String(w.answer).match(/\d+(?:\.\d+)?(?:\/\d+)?(?:\s*(?:km|cm|mm|m|kg|g|l|ml|rupees|₹))?/)?.[0] ?? null;
  if (!answer) return null;
  return [...(givens.length ? [dot(`${W.given}: ${givens.join(", ")}`)] : []), ...steps.map((r, i) => dot(`${i === 0 ? W.first : W.then}: ${r}`)), dot(`${W.answer}: ${answer}`)];
}
