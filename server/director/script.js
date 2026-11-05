// round 7 (dc-r7-teaching-scripts, T-schema): a topic's lesson script (shared/contracts.ts TopicScript, Learning's
// LESSON-SCRIPTS-SPEC.md shape) checked in code against its kit before the Director may walk it. A skill whose script fails is
// never walked (the lesson keeps the kit path for it). PURE.
import { belowLevel, rateAsFraction } from "../brain/say.js";
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
    const e = validateSkillScript(sk, kit, { classLevel: sc.classLevel });
    if (!e.length && !topicBad) ok.push(sk.skillId);
    errors.push(...e);
  }
  return { ok, errors };
}
