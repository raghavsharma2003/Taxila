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
export function validateSkillScriptV2(sk, kit, { classLevel, version: v21 = 2, recordedRun = null } = {}) {
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
  // v2.3 (dc-r7-script-walk-v6-1): an optional authored `simpler` on explain beats, worked steps, checks and follow-up cards:
  // spoken in place of anything model-written, so it is a statement (no "?"), at most 2 sentences, and on a card never its key
  const simplerOk = (where, x, key = null, maxS = 2) => {
    if (x == null) return;
    said(where, x);
    for (const f of ["hi", "en"]) {
      const t = String(x?.[f] ?? "");
      if (/[?？]/.test(t)) err(`${where}.${f}: a statement, never a question`);
      if ((t.match(/[.!।]+(?:\s|$)/g) ?? []).length > maxS) err(`${where}.${f}: at most ${maxS} sentences`);
      const k = key != null ? keyLeaks(key, t) : null;
      if (k && new RegExp(`(?<![\\d./])${k.replace(/[./]/g, "\\$&")}(?![\\d/])`).test(t)) err(`${where}.${f}: states its card's key ${k}`);
    }
  };
  for (const [i, b] of (sk?.explain ?? []).entries()) simplerOk(`explain[${i}].simpler`, b?.simpler);
  for (const [i, st] of (sk?.workedExample?.steps ?? []).entries()) simplerOk(`workedExample.steps[${i}].simpler`, st?.simpler);
  for (const [i, c] of (sk?.checks ?? []).entries()) simplerOk(`checks[${i}].simpler`, c?.simpler, c?.key);
  for (const [i, r] of (sk?.remediation ?? []).entries()) { simplerOk(`remediation[${i}].simpler`, r?.simpler, null, 3); simplerOk(`remediation[${i}].then.simpler`, r?.then?.simpler, r?.then?.key); }
  // (director10, Learning: the runtime silently dropped a why over its cap) a card's why rides whole after "kyunki" in its close,
  // so in 2.3 one over WHY_MAX_WORDS is an error here, never a why the runtime quietly leaves unsaid (check.mjs refuses it too)
  // (a recorded run's own copy, replayed by tests/fixtures/replay.mjs runScriptOf, is validated as that run validated it)
  if (Number(v21) >= 2.3 && !recordedRun) {
    const whyOk = (where, x) => { for (const f of ["hi", "en"]) { const n = String(x?.[f] ?? "").trim().split(/\s+/).filter(Boolean).length; if (n > WHY_MAX_WORDS) err(`${where}.${f}: ${n} words; a card's why is at most ${WHY_MAX_WORDS}`); } };
    for (const [i, b] of (sk?.explain ?? []).entries()) if (b?.ask?.why) whyOk(`explain[${i}].ask.why`, b.ask.why);
    if (sk?.workedExample?.why) whyOk("workedExample.why", sk.workedExample.why);
    for (const [i, st] of (sk?.workedExample?.steps ?? []).entries()) if (st?.why) whyOk(`workedExample.steps[${i}].why`, st.why);
    if (sk?.workedExample?.yourStep?.why) whyOk("workedExample.yourStep.why", sk.workedExample.yourStep.why);
    for (const [i, c] of (sk?.checks ?? []).entries()) if (c?.why) whyOk(`checks[${i}].why`, c.why);
    for (const [i, r] of (sk?.remediation ?? []).entries()) if (r?.then?.why) whyOk(`remediation[${i}].then.why`, r.then.why);
  }
  // ── v2.1 (dc-r7-script-walk-v3, director5's data findings), for scripts marked version 2.1 ──
  if (Number(v21) >= 2.1) {
    const spoken = [];
    const walk = (x, where) => { if (x && typeof x === "object" && "hi" in x && "en" in x) spoken.push([where, x]); else if (x && typeof x === "object") for (const [k, v] of Object.entries(x)) if (!["board", "convey", "move", "targets", "key", "accept", "wrongIfMis", "itemId", "why", "id", "skillId"].includes(k) || (k === "why" && typeof v === "object")) walk(v, `${where}.${k}`); };
    walk(sk, "");
    for (const [where, x] of spoken) for (const f of ["hi", "en"]) {
      const t = String(x[f] ?? "");
      // a card character is a {friend} slot, never the child's name or the teacher's
      if (/(?<![\p{L}])(?:Asha|Riya)(?![\p{L}])/u.test(t)) err(`${where}.${f}: names "Asha"/"Riya"; a card character is the {friend} slot`);
      // a "?" is never read aloud as a glyph ("1/4 = ?", "? cm")
      if (/(?:^|\s|[=:(])\?(?=\s|$|[.,)])/.test(t) || /\?\s*(?:cm|m|km|kg|g)\b/.test(t)) err(`${where}.${f}: a "?" inside the sentence would be read aloud; write the gap in words`);
    }
    // a beat's keyed question is a transfer, never an echo of a number its point states
    for (const [i, b] of (sk?.explain ?? []).entries()) {
      const k = firstNum(b?.ask?.key);
      if (k && [b?.point?.hi, b?.point?.en].some((t) => new RegExp(`(?<![\\d./])${k.replace(/[./]/g, "\\$&")}(?![\\d/])`).test(String(t ?? "")))) err(`explain[${i}].ask: its key ${k} is said in the beat's point (an echo, not a transfer)`);
    }
    // classes 4-5: at most 3 steps (the child's step counted)
    if (cl <= 5 && ((sk?.workedExample?.steps ?? []).length + 1) > 3) err(`workedExample: ${(sk.workedExample.steps.length + 1)} steps; at most 3 for class ${cl}`);
    // a follow-up card shows a board
    for (const [i, r] of (sk?.remediation ?? []).entries()) if (!r?.board && !r?.then?.board) err(`remediation[${i}]: its follow-up card needs a board (board or then.board)`);
  }
  // ── v2.2 (dc-r7-script-walk-v4 data rules), for scripts marked version 2.2 ──
  if (Number(v21) >= 2.2) {
    // a follow-up card is shown and read whole: 120 characters at most (ASK_MAX), for the Hinglish card the lessons show and
    // read (Learning's check.mjs rule; an English overflow is reported to Learning, never a reason to drop the skill)
    for (const [i, r] of (sk?.remediation ?? []).entries()) for (const f of ["hi"]) {
      const t = String(r?.then?.prompt?.[f] ?? "");
      if (t.length > 120) err(`remediation[${i}].then.prompt.${f}: ${t.length} characters; at most 120`);
    }
    // every check and every follow-up card carries its own board
    for (const [i, c] of (sk?.checks ?? []).entries()) if (!c?.board) err(`checks[${i}]: needs its own board`);
    for (const [i, r] of (sk?.remediation ?? []).entries()) if (r?.then && typeof r.then === "object" && !r.then.board) err(`remediation[${i}].then: needs its own board`);
  }
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
  // one list (SCRIPT_VERSIONS) decides both what validates and what the Director walks: a version bump in the data fails here
  if (!SCRIPT_VERSIONS.includes(Number(sc.version ?? 1))) errors.push(`version ${sc.version} is not a known script version (SCRIPT_VERSIONS: ${SCRIPT_VERSIONS.join(", ")})`);
  const ok = [];
  const topicBad = errors.length > 0;
  for (const sk of sc.skills ?? []) {
    const e = (Number(sc.version) >= 2 ? validateSkillScriptV2 : validateSkillScript)(sk, kit, { classLevel: sc.classLevel, version: Number(sc.version), recordedRun: sc.recordedRun ?? null });
    if (!e.length && !topicBad) ok.push(sk.skillId);
    errors.push(...e);
  }
  return { ok, errors };
}

// ───────────── T2: the Director walks the script (kill switch TAXILA_R7_SCRIPT=off) ─────────────
/** The one list of script versions: the validator accepts these and the Director walks these. A new data version is added here,
 *  with its validator rules, before any script carries it (tests/r7-brain-live-scripts.test.mjs fails otherwise). */
/** The most words a card's authored why may have: it is said whole after "kyunki" in its close (state.js scriptWhyOf). */
export const WHY_MAX_WORDS = 22;
export const SCRIPT_VERSIONS = Object.freeze([1, 2, 2.1, 2.2, 2.3]);
/** The script versions the Director walks: SCRIPT_VERSIONS (the validator's accepted versions), never a second list. */
export const WALK_VERSIONS = new Set(SCRIPT_VERSIONS);
export const scriptOn = (env = process.env) => !/^(off|0|false)$/i.test(String(env.TAXILA_R7_SCRIPT ?? ""));
const SCRIPT_DIR = new URL("../../data/lesson-scripts/", import.meta.url);
const loaded = new Map();
/** Tests: a script for a topic in place of data/lesson-scripts (null: none); no argument clears every override and the cache. */
export function setScriptForTest(topicId, script) { if (topicId === undefined) { loaded.clear(); return; } loaded.set(`test:${topicId}`, script); loaded.delete(topicId); }
/**
 * The topic's validated script: { script, ok } (ok: the skill ids the Director may walk), or null (no script, or none walkable).
 * Read once per topic per process.
 */
const scriptDir = () => (process.env.TAXILA_R7_SCRIPT_DIR ? new URL(`file://${process.env.TAXILA_R7_SCRIPT_DIR.replace(/\/?$/, "/").replace(/^(?!\/)/, `${process.cwd()}/`)}`) : SCRIPT_DIR);
/** Why a topic has no walkable script (null when it has one): the file is missing or unreadable, its version is not walkable,
 *  or no skill validated. Runs check this before spending (director6's first start walked nothing, silently). */
export function scriptWhyNot(kit) {
  if (!scriptOn()) return "TAXILA_R7_SCRIPT is off";
  if (scriptFor(kit)) return null;
  const at = new URL(`${kit?.topicId}.json`, scriptDir());
  let sc;
  try { sc = JSON.parse(readScriptFile(at, "utf8")); } catch (e) { return `no readable script at ${at.pathname} (${e?.code ?? e?.message ?? e})`; }
  if (!WALK_VERSIONS.has(Number(sc.version ?? 1))) return `version ${sc.version} is not walkable (WALK_VERSIONS: ${[...WALK_VERSIONS].join(", ")})`;
  const v = validateTopicScript(sc, kit);
  return v.ok.length ? "loaded but not walkable (unknown)" : `no skill validated: ${v.errors.slice(0, 3).join(" | ")}${v.errors.length > 3 ? ` (+${v.errors.length - 3})` : ""}`;
}
export function scriptFor(kit) {
  const id = kit?.topicId;
  if (!id || !scriptOn()) return null;
  if (!loaded.has(id)) {
    let sc = loaded.has(`test:${id}`) ? loaded.get(`test:${id}`) : undefined;
    // (loading is decided by TAXILA_R7_SCRIPT alone, never by how the process was started: a kit-path test pins it off in its
    // own hooks; a test that walks a script sets one with setScriptForTest)
    // (TAXILA_R7_SCRIPT_DIR: another folder of scripts, e.g. a run on staged v2 scripts; explicit, never inferred)
    if (sc === undefined) { try { sc = JSON.parse(readScriptFile(new URL(`${id}.json`, scriptDir()), "utf8")); } catch { sc = null; } }
    sc ??= null;
    const v = sc ? validateTopicScript(sc, kit) : null;
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
// (v2: a Said prompt gives the card both forms; a v1 string is both)
const keyed = (id, skillId, prompt, key, accept, extra) => ({ id, skillId, kind: "practice", difficulty: 1,
  prompt_en: typeof prompt === "object" && prompt ? prompt.en : prompt, prompt_hi: typeof prompt === "object" && prompt ? prompt.hi : prompt,
  answer: String(key), acceptable: [...(accept ?? [])].map(String), hints: [], ...extra });
// v6 (main, director8 judges: a close's why from the point's or remediation's last sentence contradicted the card): a card's
// own authored why (KeyedAsk.why / CheckQuestionV2.why, a Said), carried on the card for the close; absent → no why is said
// v2.3 (dc-r7-script-walk-v6-1 R8): a card's authored one-step hint, said on "pata nahi" / "samajh nahi aaya" instead of a model hint
const simplerField = (a) => (a?.simpler && typeof a.simpler === "object" && (a.simpler.hi || a.simpler.en) ? { simpler: { hi: String(a.simpler.hi ?? ""), en: String(a.simpler.en ?? "") } } : {});
// v2.3 (director9 item 4, Learning: c4 e3's "what if" ask): a card's answer-state board, drawn over its close (verdict + why,
// give-up, or the missed card's close), never while the card is live; it may show the key
const answerBoardField = (a) => (a?.answerBoard && typeof a.answerBoard === "object" && a.answerBoard.template ? { answerBoard: { template: String(a.answerBoard.template), params: a.answerBoard.params ?? {} } } : {});
const whyField = (a) => (a?.why && typeof a.why === "object" && (a.why.hi || a.why.en) ? { why: { hi: String(a.why.hi ?? ""), en: String(a.why.en ?? "") } } : {});
/** v2: an explain beat's micro-question, or the worked example's yourStep, as a keyed card. */
export const scriptAskItem = (skillId, beatId, a) => keyed(`script:${skillId}:ask:${beatId}`, skillId, a.prompt, a.key, a.accept,
  { scriptAsk: { beatId, targets: a.targets ?? null, wrongIfMis: a.wrongIfMis ?? null, ...whyField(a), ...simplerField(a), ...answerBoardField(a) } });
/** A script check as a keyed card (the classifier grades it against its key, like any item). */
export const scriptCheckItem = (skillId, c) => keyed(`script:${skillId}:${c.id}`, skillId, c.prompt, c.key, c.accept,
  { scriptCheck: { checkId: c.id, targets: c.targets, wrongIfMis: c.wrongIfMis, ...whyField(c), ...simplerField(c), ...answerBoardField(c) } });
/** A remediation's follow-up question as a keyed card. */
export const scriptThenItem = (skillId, r) => (r.then && typeof r.then === "object" && "key" in r.then
  ? keyed(`script:${skillId}:then:${r.targets}`, skillId, r.then.prompt, r.then.key, r.then.accept, { scriptThen: { targets: r.targets, ...(r.then.wrongIfMis ? { wrongIfMis: r.then.wrongIfMis } : {}), ...whyField(r.then), ...simplerField(r.then), ...answerBoardField(r.then) } })
  : keyed(`script:${skillId}:then:${r.targets}`, skillId, r.then, r.thenKey, [], { scriptThen: { targets: r.targets } }));
/** The script version of a skill (1 or 2). */
export const isV2 = (kit) => Number(scriptFor(kit)?.script?.version ?? 1) >= 2;
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

const BECAUSE = { hinglish: "kyunki", hindi: "kyunki", english: "because" };
/** v2 (F3): the worked example as code lines in the lesson language: givens, then each step's do, result and why. The child's
 *  step (yourStep) is the card after these; the answer and why are said after it (state.js gave). null: a field has no form. */
export function scriptWorkedLinesV2(w, lang = "hinglish") {
  const W = WORDS[lang] ?? WORDS.hinglish;
  const givens = (w?.givens ?? []).map((g) => saidIn(g, lang));
  if (!givens.length || givens.some((g) => !g)) return null;
  const lines = [dot(`${W.given}: ${givens.join(", ")}`)];
  for (const st of w.steps ?? []) {
    const d = saidIn(st.do, lang), y = saidIn(st.why, lang);
    if (!d || !String(st.result ?? "").trim()) return null;
    lines.push(dot(`${d.charAt(0).toUpperCase()}${d.slice(1)}: ${String(st.result).trim()}${y ? `, ${BECAUSE[lang] ?? BECAUSE.hinglish} ${y}` : ""}`));
  }
  return lines;
}
/** v4 W2: one worked step as one spoken line, "Do: result, kyunki why." (null when the step has no do or result). */
export function scriptWorkedStepLine(st, lang = "hinglish") {
  // (director7 dry: "jodo.: 7 + 9 = 16 m, kyunki Ek kone se…": the authored fields' own end stops and capitals are joined away)
  const d = joinable(saidIn(st?.do, lang)), y = joinable(saidIn(st?.why, lang), { lower: true });
  if (!d || !String(st?.result ?? "").trim()) return null;
  return dot(`${d.charAt(0).toUpperCase()}${d.slice(1)}: ${String(st.result).trim()}${y ? `, ${BECAUSE[lang] ?? BECAUSE.hinglish} ${y}` : ""}`);
}
/**
 * v6 R3 (main, director8: "samajh nahi aaya" on a worked step got the next step, or the same words again): the SAME step
 * said smaller and in another order: its reason first, on its own, then the step and its result. Authored words only.
 */
export function scriptWorkedStepSmaller(st, lang = "hinglish") {
  // v6.1 R7 (format 2.3): the step's authored simpler, when the script has one
  const auth = st?.simpler ? saidIn(st.simpler, lang) : null;
  if (auth && String(auth).trim()) return dot(String(auth).trim());
  // v6.1 (director9 c5-t02: "Dekho, rahul ka bar 6 hisson mein…" turned the story's reference into a description of the board,
  // and re-ordering the same step is not smaller): only the step and its result, without its reason, and never "Dekho"
  const d = joinable(saidIn(st?.do, lang), { lower: true });
  if (!d || !String(st?.result ?? "").trim()) return null;
  return dot(`${lang === "english" ? "Just this one step" : "Bas yeh ek kadam"}: ${d}, ${lang === "english" ? "and that gives" : "aur milta hai"} ${String(st.result).trim()}`);
}
/** An authored clause made ready to join into a sentence: its end stop gone, its first letter lowered when asked (never "I"). */
export function joinable(x, { lower = false } = {}) {
  let t = String(x ?? "").replace(/\s+/g, " ").trim().replace(/[.!।;,]+$/, "");
  if (lower && /^[A-Z][a-z]/.test(t) && !/^I\b/.test(t)) t = t.charAt(0).toLowerCase() + t.slice(1);
  return t;
}
/** v2 (R1): did her line say the beat's must-say terms (each, in the lesson language's form or the other)? */
export function saidMust(line, mustSay = [], lang = "hinglish") {
  const t = String(line ?? "").toLowerCase();
  const norm = (x) => String(x ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  return (mustSay ?? []).every((m) => (typeof m === "string" ? [m] : [saidIn(m, lang), m?.hi, m?.en]).filter(Boolean).some((v) => t.replace(/\s+/g, " ").includes(norm(v))));
}

// v2.1 / v2.2: the {friend}, {friendF} and {friendM} slots (server/director/friend.js)
export { fillFriend } from "./friend.js";
