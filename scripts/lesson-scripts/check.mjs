#!/usr/bin/env node
// Round 7 F (dc-r7-teaching-scripts): the one-command check for an authored lesson script, data/lesson-scripts/<topicId>.json.
// Every gate a script must pass before the Director may walk it, in one place (the test and the pipeline both call it):
//   S  structure against its kit: every kit skill in kit order, real misconceptions and items, a full worked example with
//      no faded blanks, 2-3 keyed checks that never print their key, remediation that never falls back to counting, every
//      kit misconception checked somewhere, c5 number-line boards only;
//   W  Studio's whiteboard gate (certifyBoardRef's W-checks) on every board, against a stand-in for what she will say over
//      it; W6 timing is left to the turn-time gate on her real line (Studio re-times every board to it);
//   V  Brain's runtime validator (server/director/script.js validateTopicScript): every skill walkable, no errors.
// The blind solve is NOT done here (it is a separate Claude agent's job, keys stripped): `--blind <file>` writes the
// key-free packet for it, and `--keys <file>` the matching keys to compare its answers against.
//
//   node scripts/lesson-scripts/check.mjs <topicId>                     exit 1 on any error
//   node scripts/lesson-scripts/check.mjs <topicId> --blind q.json --keys k.json
//   node scripts/lesson-scripts/check.mjs --all
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BOARD_REFS } from "../../server/forge/explainer/board-ref.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
// LESSON_SCRIPTS_DIR (relative to the repo root): check a staged folder, e.g. data/lesson-scripts-v2, before it goes live
export const SCRIPTS = join(ROOT, process.env.LESSON_SCRIPTS_DIR || "data/lesson-scripts");

export const kitTopic = (topicId) => {
  const f = join(ROOT, "data/kits", `${topicId.split("-").slice(0, 2).join("-")}.json`);
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")).topics.find((t) => t.topicId === topicId) ?? null : null;
};
export const scriptOf = (topicId) => JSON.parse(readFileSync(join(SCRIPTS, `${topicId}.json`), "utf8"));
export const allTopics = () => readdirSync(SCRIPTS).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort();

/** Board parameter ranges (Studio's templates, server/forge/explainer/templates.js and board-ref.js). */
/** A board whose template has no range rule here is left to Studio's own resolver and gate (certifyBoardRef), as long as
 *  Studio lists it as a maths template (BOARD_REFS): never refused only because this file does not know it yet. */
export const rangeOk = (b) => (RANGE[b.template] ? RANGE[b.template](b.params ?? {}) : BOARD_REFS[b.template]?.subject === "maths");
export const RANGE = {
  "fraction-parts@1": (p) => p.parts >= 2 && p.parts <= 12 && p.shade >= 0 && p.shade <= p.parts,
  "fraction-of@1": (p) => p.b >= 2 && p.b <= 6 && p.d >= 2 && p.d <= 6 && p.a >= 1 && p.a <= p.b && p.c >= 1 && p.c <= p.d,
  "equal-groups@1": (p) => p.groups >= 2 && p.groups <= 6 && p.each >= 1 && p.each <= 8,
  "compare@1": (p) => p.left?.items?.length >= 1 && p.right?.items?.length >= 1,
  // Studio 3dc6208a: measured@1 also draws polygons (sides 3-8, all labelled; names one per corner, ≤ 3 chars)
  "measured@1": (p) => ["m", "cm"].includes(p.unit) && (["rect", "square", "triangle", "circle"].includes(p.shape)
    || (["pentagon", "hexagon", "octagon", "quadrilateral", "polygon"].includes(p.shape) && Array.isArray(p.sides)
      && p.sides.length === ({ pentagon: 5, hexagon: 6, octagon: 8, quadrilateral: 4 }[p.shape] ?? p.sides.length) && p.sides.length >= 3 && p.sides.length <= 8
      && p.sides.every((v) => Number(v) > 0) && (!p.names || (p.names.length === p.sides.length && p.names.every((x) => [...String(x)].length <= 3))))),
  "shape@1": (p) => typeof p.shape === "string",
  "number-line-hop@1": (p) => Number.isInteger(p.start) && Array.isArray(p.hops),
  // marks label points and hop draws the solved jumps; a CHECK uses mark k or target [a, den], never both
  "fraction-line@1": (p) => {
    // Studio (director7): dens [d1, d2] draws both scales on one line, d1 above and d2 below; marks are [num, den] pairs
    if (Array.isArray(p.dens)) return p.den === undefined && p.dens.length === 2 && p.dens.every((d) => Number.isInteger(d) && d >= 2 && d <= 12)
      && [1, 2, 3].includes(p.to) && p.hop === undefined && p.mark === undefined && p.target === undefined
      && (p.marks ?? []).every((m) => Array.isArray(m) && p.dens.includes(m[1]) && Number.isInteger(m[0]) && m[0] >= 0 && m[0] <= m[1] * p.to);
    const inLine = (n) => Number.isInteger(n) && n >= 0 && n <= p.den * p.to;
    return p.den >= 2 && p.den <= 12 && [1, 2, 3].includes(p.to) && (p.marks ?? []).every((m) => inLine(m.num))
      && (p.hop === undefined || inLine(p.hop.num)) && (p.mark === undefined || inLine(p.mark)) && !(p.mark !== undefined && p.target !== undefined)
      && (p.target === undefined || (Array.isArray(p.target) && p.target[1] === p.den && inLine(p.target[0])));
  },
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
/** The prompt prints the key as a word (a two-way choice "X or Y" and yes/no keys are not a leak). */
export function leaks(prompt, key) {
  const p = String(prompt).toLowerCase(), k = String(key).toLowerCase().trim();
  if (!k || /^(yes|no)$/.test(k)) return false;
  // a choice question is not a leak (Brain's rule: a key is never inside a NON-choice question): it offers options
  // with "or" / Hinglish "ya", and the key is one of them
  if (/\b(or|ya)\b/.test(p) && /\?/.test(p)) return false;
  return new RegExp(`(^|[^\\w/])${esc(k)}([^\\w/]|$)`).test(p);
}

/** Every board beat with its stand-in line and what it must withhold. */
export function beatsOf(skill, version = 1) {
  const we = skill.workedExample;
  if (version >= 2) {
    // v2: her line IS the authored Said (spoken nearly verbatim), so the stand-in is its hi + en forms
    const said = (x) => (x && typeof x === "object" ? [x.hi, x.en].filter(Boolean).join(" ") : String(x ?? ""));
    return [
      ...skill.explain.map((e) => ({ id: e.id, board: e.board, line: [said(e.point), ...(e.mustSay ?? []).map(said)].join(" "), withhold: { values: [e.ask?.key].filter(Boolean) }, check: false })),   // the beat's board shows the idea; only its exact key is withheld
      { id: "we", board: we.board, line: [said(we.problem), ...we.givens.map(said), ...we.steps.flatMap((x) => [said(x.do), x.result])].join(" "),
        withhold: { values: [we.yourStep?.key, ...(we.yourStep?.accept ?? [])].filter(Boolean) }, check: false },
      // a check with no board of its own borrows the last explain beat's board at runtime (Brain's cardBeatRef); certify the
      // board the child will actually see against THAT check's answers (Studio 2026-11-05)
      ...skill.checks.map((c) => { const own = !!c.board; const fb = [...skill.explain].reverse().find((e) => e.board)?.board;
        return { id: own ? c.id : `${c.id} (borrows the last explain board)`, board: c.board ?? fb, line: said(c.prompt), withhold: { values: [c.key, ...(c.accept ?? [])] }, check: true }; }),
      ...skill.remediation.map((r, i) => ({ id: `rem${i + 1}`, board: r.board, line: said(r.say), withhold: { values: [r.then?.key, ...(r.then?.accept ?? [])].filter(Boolean) }, check: false })),
      // v2.1 (director5, dc-r7-script-walk-v3): the follow-up card after a remediation carries its own board, gated as a check
      ...skill.remediation.map((r, i) => ({ id: `rem${i + 1}.then`, board: r.then?.board, line: said(r.then?.prompt), withhold: { values: [r.then?.key, ...(r.then?.accept ?? [])].filter(Boolean) }, check: true })),
      // director9 (dc-r7-script-walk-v6-1): a card's answerBoard is drawn only in its close, under her verdict and the card's
      // own why, so it is certified against that line and may show the key
      ...[...skill.explain.filter((e) => e.ask?.answerBoard).map((e) => [`${e.id}.answer`, e.ask]), ...skill.checks.filter((c) => c.answerBoard).map((c) => [`${c.id}.answer`, c]),
        ...skill.remediation.map((r, i) => [`rem${i + 1}.then.answer`, r.then]).filter(([, t]) => t?.answerBoard),
        ...(we.yourStep?.answerBoard ? [["we.answer", we.yourStep]] : [])]
        .map(([id, c]) => ({ id, board: c.answerBoard, line: `${c.key ?? ""} ${said(c.why)}`, withhold: null, check: false })),
      // director8 (dc-r7-script-walk-v6, R1): the bridge is its own segment on its own authored board
      ...(skill.bridgeToNext && skill.bridgeBoard ? [{ id: "bridge", board: skill.bridgeBoard, line: said(skill.bridgeToNext), withhold: null, check: false }] : []),
    ].filter((b) => b.board);
  }
  return [
    ...skill.explain.map((e) => ({ id: e.id, board: e.board, line: e.point, withhold: null, check: false })),
    { id: "we", board: we.board, line: [we.problem, ...we.steps.map((x) => x.result), we.answer].join(" "), withhold: null, check: false },
    ...skill.checks.map((c) => ({ id: c.id, board: c.board, line: c.prompt, withhold: { values: [c.key, ...(c.accept ?? [])] }, check: true })),
    ...skill.remediation.map((r, i) => ({ id: `rem${i + 1}`, board: r.board, line: r.move, withhold: null, check: false })),
  ].filter((b) => b.board);
}

/** S: structure against the kit. → error strings */
export function structureErrors(s, kit) {
  if ((s.version ?? 1) >= 2) return structureErrorsV2(s, kit);
  const e = [];
  if (!kit) return [`no kit topic ${s.topicId}`];
  if (s.skills.map((k) => k.skillId).join() !== kit.skills.map((k) => k.id).join()) e.push("skills are not the kit's, in kit order");
  const mis = new Set(kit.misconceptions.map((m) => m.id)), items = new Map(kit.items.map((i) => [i.id, i]));
  for (const k of s.skills) {
    const at = (x) => `${k.skillId}/${x}`;
    if (!k.hook?.convey || !k.hook.interestSlots?.length) e.push(at("hook"));
    if (k.explain.length < 2) e.push(at("explain: fewer than 2 beats"));
    for (const b of k.explain) if (!b.board || !b.point) e.push(at(`${b.id}: board and point`));
    const we = k.workedExample;
    if (!(we.problem && we.givens?.length && we.steps.length >= 2 && we.answer && we.why)) e.push(at("worked example incomplete"));
    if (/_{2,}/.test(JSON.stringify(we))) e.push(at("worked example has faded blanks"));
    if (k.checks.length < 2 || k.checks.length > 3) e.push(at("2-3 checks"));
    for (const c of k.checks) {
      if (!mis.has(c.targets)) e.push(at(`${c.id} targets ${c.targets}, not a kit misconception`));
      if (!c.key || !c.wrongIfMis || c.wrongIfMis === c.key) e.push(at(`${c.id} key and the misconception's answer`));
      if (leaks(c.prompt, c.key)) e.push(at(`${c.id} prompt prints its key`));
      const p = c.board?.params ?? {};
      if (c.board?.template === "fraction-line@1" && (p.hop || (p.marks ?? []).length || (p.mark === undefined && !p.target && !p.dens))) e.push(at(`${c.id} check line shows instead of asking (use mark or target)`));
    }
    if (k.ladder.length < 3) e.push(at("ladder: fewer than 3 rungs"));
    for (const r of k.ladder) if (!items.has(r.itemId)) e.push(at(`ladder ${r.itemId} is not a kit item`));
    for (const r of k.remediation) {
      if (!mis.has(r.targets) || !r.move || !r.then || !r.thenKey) e.push(at(`remediation ${r.targets}`));
      if (/\bcount (them|the (pieces|parts|squares|units))\b/i.test(r.move)) e.push(at("remediation falls back to counting"));
    }
    for (const b of beatsOf(k, s.version ?? 1)) {
      if (!rangeOk(b.board)) e.push(at(`${b.id} ${b.board.template} params out of range ${JSON.stringify(b.board.params)}`));
    }
  }
  if ((s.skills.at(-1)?.bridgeToNext ?? null) !== null) e.push("the last skill has a bridge");
  const checked = new Set(s.skills.flatMap((k) => k.checks.map((c) => c.targets)));
  for (const m of mis) if (!checked.has(m)) e.push(`misconception ${m} is never checked`);
  return e;
}

/** The interests a v2 hook slot may name, and the words its spoken use must contain (server/persona/signals.js). */
async function interestWords() { return (await import("../../server/persona/signals.js")).INTERESTS; }
/** Hindi function words: a Said.hi without any of them reads as English (F1). */
const HINGLISH = /\b(hai|hain|ho|hota|hoti|hote|ko|ka|ki|ke|mein|me|se|par|aur|ya|toh|to|kya|kitna|kitni|kitne|kaun|kaunsa|kaunsi|kaise|kyun|nahi|nahin|yeh|ye|woh|wo|isme|isko|usko|apna|apni|dekho|batao|socho|chalo|ab|phir|jab|agar|bhi|sirf|wala|wali|wale|liye|tak|baad|pehle|ek|do|teen|char|chaar|paanch|ne|kisne|kisko|kyunki|kam|zyada|bada|badi|chhota|chhoti|khaya|kiya|liya|diya|gaya|hua|lagta|lagti|dono|sabse|kitna|matlab|jaise|waala|barabar|hissa|hisse)\b/i;
/** F1: a spoken/shown field is { hi, en }, both present, and hi reads as Hinglish. */
export function saidErrors(x, at) {
  if (!x || typeof x !== "object" || typeof x.hi !== "string" || typeof x.en !== "string" || !x.hi.trim() || !x.en.trim()) return [`${at}: not a Said { hi, en }`];
  const e = [];
  if (!HINGLISH.test(x.hi)) e.push(`${at}: hi reads as English ("${x.hi.slice(0, 50)}")`);
  if (/!/.test(x.hi) || /!/.test(x.en)) e.push(`${at}: '!' in a spoken line`);
  return e;
}
const keyedErrors = (a, at, mis) => {
  if (!a || typeof a !== "object") return [`${at}: no keyed ask`];
  const e = saidErrors(a.prompt, `${at}.prompt`);
  if (a.key == null || String(a.key).trim() === "") e.push(`${at}: no key`);
  else if (leaks(a.prompt?.hi ?? "", a.key) || leaks(a.prompt?.en ?? "", a.key)) e.push(`${at}: prompt prints its key`);
  if (a.targets !== undefined && !mis.has(a.targets)) e.push(`${at}: targets ${a.targets}, not a kit misconception`);
  if (a.wrongIfMis !== undefined && String(a.wrongIfMis).trim() === String(a.key).trim()) e.push(`${at}: wrongIfMis equals the key`);
  return e;
};

/** S (v2, dc-r7-script-walk-v2): F1 Hinglish Said fields, F2 keyed explain beats, F3 worked yourStep, F4 slots that fit. */
/**
 * v2.1 (director5 judgement, dc-r7-script-walk-v3): Brain's validateSkillScriptV2 rules for version ≥ 2.1, mirrored with
 * its error texts (Brain 2026-11-05): no "Asha"/"Riya" in a spoken field (a card character is the {friend} slot); no gap
 * "?" read aloud; an explain ask's key is not a number its point says; ≤ 3 worked steps (yourStep counted) for class ≤ 5;
 * every remediation has a board or a then.board.
 */
const SKIP = new Set(["board", "convey", "move", "targets", "key", "accept", "wrongIfMis", "itemId", "id"]);
const NAME_RE = /(?<![\p{L}])(?:Asha|Riya)(?![\p{L}])/u;
const GAP_RE = [/(?:^|\s|[=:(])\?(?=\s|$|[.,)])/, /\?\s*(?:cm|m|km|kg|g)\b/];
const firstNum = (k) => (String(k ?? "").match(/\d+(?:\/\d+|\.\d+)?/) ?? [null])[0];
export function v21Errors(s) {
  const e = [];
  const walk = (x, path) => {
    if (Array.isArray(x)) return x.forEach((v, i) => walk(v, `${path}[${i}]`));
    if (!x || typeof x !== "object") return;
    if (typeof x.hi === "string" && typeof x.en === "string") {
      for (const f of ["hi", "en"]) {
        if (NAME_RE.test(x[f])) e.push(`${path}.${f}: names "Asha"/"Riya"; a card character is the {friend} slot`);
        if (GAP_RE.some((re) => re.test(x[f]))) e.push(`${path}.${f}: a "?" inside the sentence would be read aloud; write the gap in words`);
      }
      return;
    }
    for (const [k, v] of Object.entries(x)) if (!SKIP.has(k)) walk(v, path ? `${path}.${k}` : k);
  };
  for (const k of s.skills) {
    walk(k, k.skillId);
    k.explain.forEach((b, i) => {
      const n = firstNum(b.ask?.key);
      const esc = n?.replace(/[./]/g, (c) => `\\${c}`);
      if (n && [b.point?.hi, b.point?.en].some((t) => new RegExp(`(?<![\\d/.])${esc}(?![\\d/.])`).test(String(t ?? ""))))
        e.push(`${k.skillId}/explain[${i}].ask: its key ${n} is said in the beat's point (an echo, not a transfer)`);
    });
    const steps = (k.workedExample?.steps?.length ?? 0) + 1;
    if ((s.classLevel ?? 9) <= 5 && steps > 3) e.push(`${k.skillId}/workedExample: ${steps} steps; at most 3 for class ${s.classLevel}`);
    k.remediation.forEach((r, i) => { if (!r.board && !r.then?.board) e.push(`${k.skillId}/remediation[${i}]: its follow-up card needs a board (board or then.board)`); });
  }
  return e;
}

/**
 * v2.2 (director6 judgement, dc-r7-script-walk-v4; Brain's v4 runtime): then-card prompts ≤ THEN_MAX characters (a long one
 * was cut to its last sentence 10/10 times); every check and then-card has its own board; a then-card never repeats the
 * worked problem (same numbers); worked steps are spoken "<do>: <result>, kyunki <why>." and the answer "Toh poora jawab:
 * <answer>, kyunki <why>.", so a result is Hinglish (no English words), a why does not start with "kyunki", and the
 * answer carries neither "kyunki" nor a leading "Toh".
 */
export const THEN_MAX = 120;
export const SAY_MAX_WORDS = 45;
export const SIMPLER_MAX_WORDS = 35;
/**
 * The posed figure of a board: what is drawn, never what answers (shade, marks, labels, hops). Equivalent drawings of
 * one figure compare equal, so a card may pose it one way and reveal it another:
 *   fractions   fraction-bars@1 parts and a 0-1 fraction-line@1's dens are both "these (distinct) denominators"
 *   a shape     area-grid@1 (w = h → square), shape@1 and measured@1 are "this kind of shape" (its unknown side is the
 *               answer, so dimensions are not part of the figure)
 *   groups      equal-groups@1 is its total (groups × each), the same as a shade-grid@1 of that many cells (the
 *               undivided collection); a card whose prompt gives the groups keeps them
 * PURE.
 */
export function figureOf(board) {
  if (!board?.template) return null;
  const p = board.params ?? {};
  const sorted = (xs) => [...new Set([...xs].map(Number))].sort((a, b) => a - b);   // distinct denominators
  const kind = (k) => ({ rect: "rectangle", rectangle: "rectangle", square: "square" }[k] ?? k);
  switch (board.template) {
    case "fraction-bars@1": return `fractions${JSON.stringify(sorted((p.bars ?? []).map((x) => x.parts)))}`;
    case "fraction-line@1": return (p.from ?? 0) === 0 && (p.to ?? 1) === 1 ? `fractions${JSON.stringify(sorted(p.dens ?? [p.den]))}` : `line${JSON.stringify([p.dens ?? [p.den], p.from, p.to])}`;
    case "area-grid@1": return `shape["${Number(p.w) === Number(p.h) ? "square" : "rectangle"}"]`;
    case "shape@1": case "measured@1": return `shape["${kind(p.shape)}"]`;
    case "fraction-parts@1": return `parts${JSON.stringify([p.parts, p.whole ?? null])}`;
    case "wholes@1": return `wholes${JSON.stringify((p.wholes ?? []).map((w) => [w.parts, w.equal !== false]))}`;
    case "equal-groups@1": return `groups[${Number(p.groups) * Number(p.each)}]`;
    case "shade-grid@1": return `groups[${Number(p.rows) * Number(p.cols)}]`;
    case "number-line-scale@1": return `scale${JSON.stringify([p.from, p.to, p.step])}`;
    default: return `${board.template}${JSON.stringify(p)}`;
  }
}
/** state.js scriptWhyOf drops a why longer than this. */
export const WHY_MAX_WORDS = 22;
const EN_WORDS = /\b(each|is|are|piece|pieces|gap|gaps|the|and|of|part|parts|so|left|more|less)\b/i;
const numsOf = (t) => (String(t ?? "").match(/\d+(?:\/\d+|\.\d+)?/g) ?? []).sort().join(",");
/**
 * The {friend} slot's own names (server/director/friend.js FRIENDS, FRIENDS_F, FRIENDS_M) never appear written into a
 * script, keys and accepts included: the slot may fill with the same name in the same lesson, and then two characters
 * share it ("Tara painted 3/5 … {friend} painted 2/5 … who painted more? Tara").
 */
export const FRIEND_POOL = ["Zoya", "Kabir", "Meera", "Arjun", "Ishaan", "Tara", "Diya", "Aman"];
const POOL_RE = new RegExp(`(?<![\\p{L}])(?:${FRIEND_POOL.join("|")})(?![\\p{L}])`, "u");
export function poolNameErrors(s) {
  const e = [];
  const walk = (x, path) => {
    if (typeof x === "string") { if (POOL_RE.test(x)) e.push(`${path}: names "${x.match(POOL_RE)[0]}", a {friend}-slot name; use another name`); return; }
    if (Array.isArray(x)) return x.forEach((v, i) => walk(v, `${path}[${i}]`));
    if (x && typeof x === "object") for (const [k, v] of Object.entries(x)) walk(v, path ? `${path}.${k}` : k);
  };
  walk(s, "");
  return e;
}
export function v22Errors(s) {
  const e = [];
  for (const k of s.skills) {
    const at = (x) => `${k.skillId}/${x}`;
    const we = k.workedExample ?? {};
    const weNums = numsOf(we.problem?.hi);
    k.checks.forEach((c, i) => { if (!c.board) e.push(at(`checks[${i}]: a check carries its own board`)); });
    k.remediation.forEach((r, i) => {
      const t = r.then ?? {};
      for (const lang of ["hi", "en"]) {
        const len = [...String(t.prompt?.[lang] ?? "")].length;
        if (len > THEN_MAX) e.push(at(`remediation[${i}].then: prompt${lang === "en" ? " (en)" : ""} ${len} > ${THEN_MAX} characters`));
      }
      if (!t.board) e.push(at(`remediation[${i}].then: a then-card carries its own board`));
      // director8 / Brain v6: the runtime splits a long turn (say, then card) but never cuts authored text, so a say is short
      for (const lang of ["hi", "en"]) {
        const w = String(r.say?.[lang] ?? "").split(/\s+/).filter(Boolean).length;
        if (w > SAY_MAX_WORDS) e.push(at(`remediation[${i}].say${lang === "en" ? " (en)" : ""}: ${w} words > ${SAY_MAX_WORDS}`));
      }
      if (weNums && numsOf(t.prompt?.hi) === weNums) e.push(at(`remediation[${i}].then: repeats the worked problem's numbers (${weNums})`));
    });
    for (const [i, st] of (we.steps ?? []).entries()) {
      if (/[a-z]/i.test(String(st.result)) && EN_WORDS.test(String(st.result))) e.push(at(`workedExample.steps[${i}].result: '${st.result}' is spoken; write it in Hinglish`));
      if (/^\s*kyunki\b/i.test(st.why?.hi ?? "")) e.push(at(`workedExample.steps[${i}].why: starts with "kyunki" (the runtime adds it)`));
    }
    if (/^\s*kyunki\b/i.test(we.why?.hi ?? "")) e.push(at(`workedExample.why: starts with "kyunki" (the runtime adds it)`));
    // director8 (dc-r7-script-walk-v6, R2): a close's "why" comes only from the closed card's own authored why, so every
    // keyed card carries one; and a bridge points at its own board (bridgeBoard), never at a board that was not drawn
    const cards = [...k.explain.filter((b) => b.ask).map((b) => [`${b.id}.ask`, b.ask]), ...k.checks.map((c, i) => [`checks[${i}]`, c]),
      ...k.remediation.map((r, i) => [`remediation[${i}].then`, r.then ?? {}])];
    for (const [where, c] of cards) {
      if (!String(c.why?.hi ?? "").trim() || !String(c.why?.en ?? "").trim()) { e.push(at(`${where}: an authored why { hi, en } for its key`)); continue; }
      if (/^\s*kyunki\b/i.test(c.why.hi)) e.push(at(`${where}.why: starts with "kyunki" (the runtime adds it)`));
      if (/^\s*toh\b/i.test(c.why.hi)) e.push(at(`${where}.why: a clause with no leading "Toh"`));
    }
    // director10 cause #2 (Studio, main 2026-11-08): an ask poses the figure its answerBoard reveals; the board on screen
    // while it is asked (its own `board`, else its beat's) must draw that same figure, unmarked. Compared by figureOf.
    const shown = [...k.explain.filter((b) => b.ask?.answerBoard).map((b) => [`${b.id}.ask`, b.ask, b.ask.board ?? b.board]),
      ...k.checks.map((c, i) => [`checks[${i}]`, c, c.board]).filter(([, c]) => c.answerBoard),
      ...k.remediation.map((r, i) => [`remediation[${i}].then`, r.then, r.then?.board]).filter(([, c]) => c?.answerBoard),
      ...(we.yourStep?.answerBoard ? [["workedExample.yourStep", we.yourStep, we.yourStep.board ?? we.board]] : [])];
    for (const [where, c, board] of shown) {
      const a = figureOf(c.answerBoard), b = figureOf(board);
      if (a !== b) e.push(at(`${where}: its answerBoard poses ${a}, the board on screen while it is asked draws ${b ?? "nothing"}: give it its own unmarked board`));
    }
    // integration 13 (Brain, state.js scriptWhyOf): the runtime silently drops a why over WHY_MAX_WORDS, so the checker
    // refuses one: every authored why (cards, worked example, its steps and yourStep) in hi and en
    const whys = [...cards.map(([where, c]) => [where, c.why]), ["workedExample", we.why], ...(we.steps ?? []).map((st, i) => [`workedExample.steps[${i}]`, st.why]),
      ...(we.yourStep?.why ? [["workedExample.yourStep", we.yourStep.why]] : [])];
    for (const [where, w] of whys) for (const lang of ["hi", "en"]) {
      const n = String(w?.[lang] ?? "").split(/\s+/).filter(Boolean).length;
      if (n > WHY_MAX_WORDS) e.push(at(`${where}.why${lang === "en" ? " (en)" : ""}: ${n} words > ${WHY_MAX_WORDS} (the runtime drops it)`));
    }
    if (k.bridgeToNext && !k.bridgeBoard?.template) e.push(at("bridgeToNext: a bridgeBoard { template, params } it points at"));
    // director9 (dc-r7-script-walk-v6-1, format v2.3, additive): an authored smaller re-explanation on every beat, worked
    // step and card. Brain says it on "samajh nahi aaya" / "pata nahi"; the model no longer writes one (it stated wrong maths).
    const said2 = (x) => (x && typeof x === "object" ? [x.hi, x.en].filter(Boolean).join(" ") : String(x ?? ""));
    const items = [...k.explain.map((b) => [b.id, b.simpler, said2(b.point) + " " + said2(b.ask?.prompt) + " " + (b.ask?.key ?? ""), b.ask?.key]),
      ...(we.steps ?? []).map((st, i) => [`workedExample.steps[${i}]`, st.simpler, said2(we.problem) + " " + said2(st.do) + " " + (st.result ?? "") + " " + (we.givens ?? []).map(said2).join(" "), null]),
      ...(we.yourStep ? [["workedExample.yourStep", we.yourStep.simpler, said2(we.problem) + " " + said2(we.yourStep.prompt) + " " + (we.givens ?? []).map(said2).join(" ") + " " + (we.steps ?? []).map((x) => x.result).join(" "), we.yourStep.key]] : []),
      ...k.checks.map((c, i) => [`checks[${i}]`, c.simpler, said2(c.prompt), c.key]),
      ...k.remediation.map((r, i) => [`remediation[${i}].then`, r.then?.simpler, said2(r.then?.prompt), r.then?.key]),
      // director10 (dc-r7-script-walk-v6-2, item 1): the remediation's own check-in ("samjhe?") had no smaller line
      ...k.remediation.map((r, i) => [`remediation[${i}]`, r.simpler, said2(r.say), null])];
    const nums = (t) => new Set((String(t ?? "").replace(/,(?=\d{2,3}\b)/g, "").match(/\d+(?:[./]\d+)?/g) ?? []));
    // director10 (item 3): a keyed card's why names its value, so the close and the board say the same thing. Enforced
    // for numeric and fraction keys, in hi and en (a word or name key is the author's call).
    for (const [where, c] of cards) {
      const kn = [...nums(c.key)];
      if (c.key == null || !kn.length || /^\s*(yes|no|haan|nahi)\s*$/i.test(String(c.key))) continue;
      for (const lang of ["hi", "en"]) if (!kn.every((n) => nums(c.why?.[lang]).has(n))) e.push(at(`${where}.why${lang === "en" ? " (en)" : ""}: names its value ${kn.join(", ")}`));
    }
    for (const [where, sm, givens, key] of items) {
      if (!String(sm?.hi ?? "").trim() || !String(sm?.en ?? "").trim()) { e.push(at(`${where}: a simpler { hi, en } (≤ ${SIMPLER_MAX_WORDS} words, no "?", never the key)`)); continue; }
      for (const lang of ["hi", "en"]) {
        const t = String(sm[lang]);
        const w = t.split(/\s+/).filter(Boolean).length;
        if (w > SIMPLER_MAX_WORDS) e.push(at(`${where}.simpler${lang === "en" ? " (en)" : ""}: ${w} words > ${SIMPLER_MAX_WORDS}`));
        if (/\?/.test(t)) e.push(at(`${where}.simpler${lang === "en" ? " (en)" : ""}: no "?" (it is said, not asked)`));
        const have = nums(givens + " " + (key ?? ""));
        const extra = [...nums(t)].filter((n) => !have.has(n));
        if (extra.length) e.push(at(`${where}.simpler${lang === "en" ? " (en)" : ""}: numbers ${extra.join(", ")} are not in its givens or key`));
      }
      if (key != null && where !== "workedExample.steps" && !/^\s*(yes|no|haan|nahi)\s*$/i.test(String(key)) && leaks(sm.hi, key)) e.push(at(`${where}.simpler: states its key ${key}`));
    }
    if (/\bkyunki\b/i.test(we.answer?.hi ?? "") || /^\s*toh\b/i.test(we.answer?.hi ?? "")) e.push(at(`workedExample.answer: a clause with no "kyunki" and no leading "Toh" (the why says why)`));
  }
  return e;
}

export function structureErrorsV2(s, kit) {
  const e = [];
  if (!kit) return [`no kit topic ${s.topicId}`];
  if (s.skills.map((k) => k.skillId).join() !== kit.skills.map((k) => k.id).join()) e.push("skills are not the kit's, in kit order");
  const mis = new Set(kit.misconceptions.map((m) => m.id)), items = new Map(kit.items.map((i) => [i.id, i]));
  const words = s.__interests ?? {};
  for (const k of s.skills) {
    const at = (x) => `${k.skillId}/${x}`;
    if (!k.hook?.convey || !(k.hook.interestSlots?.length >= 1)) e.push(at("hook"));
    for (const [i, sl] of (k.hook?.interestSlots ?? []).entries()) {
      e.push(...saidErrors(sl.use, at(`hook.slot${i}.use`)));
      const ws = words[sl.interest];
      if (!ws) e.push(at(`hook.slot${i}: interest '${sl.interest}' is not one of the 12`));
      else if (!ws.some((w) => new RegExp(`\\b${w}`, "i").test(sl.use?.hi ?? ""))) e.push(at(`hook.slot${i}: use.hi names no ${sl.interest} word`));
    }
    if (!(k.explain.length >= 1 && k.explain.length <= 4)) e.push(at("explain: 1-4 beats"));
    for (const [i, b] of k.explain.entries()) {
      if (!b.convey) e.push(at(`${b.id}: convey`));
      if (!(b.mustSay?.length >= 1 && b.mustSay.length <= 3)) e.push(at(`${b.id}: 1-3 mustSay`));
      for (const [j, m] of (b.mustSay ?? []).entries()) e.push(...saidErrors(m, at(`${b.id}.mustSay${j}`)).filter((x) => !/reads as English/.test(x)));   // a term may be one word
      if (b.point) e.push(...saidErrors(b.point, at(`${b.id}.point`)));
      if (b.board && !b.point) e.push(at(`${b.id}: a board with no spoken point`));
      e.push(...keyedErrors(b.ask, at(`${b.id}.ask`), mis));
      if (i === 0 && !b.ask) e.push(at("F2: the first beat ends in no keyed question"));
    }
    const we = k.workedExample ?? {};
    for (const f of ["problem", "find", "answer", "why"]) e.push(...saidErrors(we[f], at(`we.${f}`)));
    for (const [j, g] of (we.givens ?? []).entries()) e.push(...saidErrors(g, at(`we.given${j}`)));
    if (!(we.steps?.length >= 1)) e.push(at("we: at least one shown step before yourStep"));
    for (const [j, st] of (we.steps ?? []).entries()) {
      e.push(...saidErrors(st.do, at(`we.step${j}.do`)), ...saidErrors(st.why, at(`we.step${j}.why`)));
      if (st.result == null || String(st.result).trim() === "") e.push(at(`we.step${j}: no result`));
    }
    e.push(...keyedErrors(we.yourStep, at("we.yourStep"), mis));
    const keyNum = String(we.yourStep?.key ?? "").match(/\d+(?:[./]\d+)?/)?.[0];
    if (keyNum && !String(we.answer?.en ?? "").includes(keyNum)) e.push(at(`we: answer.en does not carry yourStep's key ${keyNum}`));
    if (/_{2,}/.test(JSON.stringify(we))) e.push(at("we: faded blanks"));
    if (k.checks.length < 2 || k.checks.length > 3) e.push(at("2-3 checks"));
    for (const c of k.checks) {
      e.push(...keyedErrors({ ...c }, at(c.id), mis));
      if (!c.targets) e.push(at(`${c.id}: targets`));
      if (!c.wrongIfMis) e.push(at(`${c.id}: wrongIfMis`));
      const p = c.board?.params ?? {};
      if (c.board?.template === "fraction-line@1" && (p.hop || (p.marks ?? []).length || (p.mark === undefined && !p.target && !p.dens))) e.push(at(`${c.id} check line shows instead of asking (use mark or target)`));
    }
    if (k.ladder.length < 3) e.push(at("ladder: fewer than 3 rungs"));
    for (const r of k.ladder) if (!items.has(r.itemId)) e.push(at(`ladder ${r.itemId} is not a kit item`));
    const targeted = new Set([...k.checks.map((c) => c.targets), ...k.explain.map((b) => b.ask?.targets)].filter(Boolean));
    const remFor = new Set(k.remediation.map((r) => r.targets));
    for (const t of targeted) if (!remFor.has(t)) e.push(at(`no remediation for ${t}`));
    for (const [j, r] of k.remediation.entries()) {
      if (!mis.has(r.targets) || !r.move) e.push(at(`remediation${j} ${r.targets}`));
      e.push(...saidErrors(r.say, at(`rem${j}.say`)), ...keyedErrors(r.then, at(`rem${j}.then`), mis));
      if (/\bcount (them|the (pieces|parts|squares|units))\b/i.test(r.move ?? "")) e.push(at("remediation falls back to counting"));
    }
    if (k.bridgeToNext != null) e.push(...saidErrors(k.bridgeToNext, at("bridgeToNext")));
    for (const b of beatsOf(k, 2)) if (!rangeOk(b.board)) e.push(at(`${b.id} ${b.board.template} params out of range ${JSON.stringify(b.board.params)}`));
  }
  if ((s.skills.at(-1)?.bridgeToNext ?? null) !== null) e.push("the last skill has a bridge");
  const checked = new Set(s.skills.flatMap((k) => [...k.checks.map((c) => c.targets), ...k.explain.map((b) => b.ask?.targets)]).filter(Boolean));
  for (const m of mis) if (!checked.has(m)) e.push(`misconception ${m} is never checked`);
  if ((s.version ?? 1) >= 2.1) e.push(...v21Errors(s));
  if ((s.version ?? 1) >= 2.2) e.push(...v22Errors(s), ...poolNameErrors(s));
  return e;
}

/** W: Studio's whiteboard gate on every board (W6 left to turn time). → { errors, w6 } */
export async function boardErrors(s, kit) {
  const [{ resolveBoardRef }, { expand }, { gateWhiteboard }, { retimeToLine }] = await Promise.all([
    import("../../server/forge/explainer/board-ref.js"), import("../../server/forge/explainer/templates.js"),
    import("../../server/studio/qa/whiteboard.js"), import("../../server/stagecraft/board-sync.js")]);
  const errors = [], w6 = [];
  for (const k of s.skills) for (const b of beatsOf(k, s.version ?? 1)) {
    const r = resolveBoardRef(b.board, { kit });
    if (!r.ok) { errors.push(`${k.skillId}/${b.id}: ${r.why}`); continue; }
    const text = String(b.line ?? "");
    const g = gateWhiteboard(retimeToLine(expand(r.call).script, text), { reply: text, speechMs: Math.max(1500, text.split(/\s+/).length * 400), withhold: b.withhold ?? { values: [] }, kit, asked: true });
    const failed = g.checks.filter((c) => !c.pass);
    const timingOnly = (c) => c.id === "W6.timing" || (c.id === "W19.settled" && Array.isArray(c.detail) && c.detail.every((d) => d === "W6.timing"));
    const bad = failed.filter((c) => !timingOnly(c));
    if (bad.length) errors.push(`${k.skillId}/${b.id}: ${bad.map((c) => `${c.id} ${JSON.stringify(c.detail)}`).join(" | ")}`);
    else if (failed.length) w6.push(`${k.skillId}/${b.id}`);
  }
  return { errors, w6 };
}

/** V: Brain's runtime validator. → error strings */
export async function runtimeErrors(s, kit) {
  const m = await import("../../server/director/script.js");
  if ((s.version ?? 1) >= 2) {
    // Brain's v2 validator (dc-r7-script-walk-v2): per skill until a topic-level one exists
    if (m.validateTopicScriptV2) { const r = m.validateTopicScriptV2(s, kit); return [...(r.errors ?? []).map(String), ...((r.ok ?? []).length !== s.skills.length ? [`walkable ${(r.ok ?? []).length}/${s.skills.length}`] : [])]; }
    if (m.validateSkillScriptV2) return s.skills.flatMap((k) => { const r = m.validateSkillScriptV2(k, kit, s); return (r?.errors ?? (Array.isArray(r) ? r : [])).map((x) => `${k.skillId}: ${typeof x === "string" ? x : JSON.stringify(x)}`); });
    return ["Brain's v2 validator is not in this tree yet (server/director/script.js validateSkillScriptV2)"];
  }
  const { validateTopicScript } = m;
  const r = validateTopicScript(s, kit);
  const e = (r.errors ?? []).map((x) => (typeof x === "string" ? x : JSON.stringify(x)));
  if ((r.ok ?? []).length !== s.skills.length) e.push(`walkable ${(r.ok ?? []).length}/${s.skills.length} skills`);
  return e;
}

/** All three gates for one topic. */
export async function checkTopic(topicId) {
  const s = scriptOf(topicId), kit = kitTopic(topicId);
  if ((s.version ?? 1) >= 2) Object.defineProperty(s, "__interests", { value: await interestWords(), enumerable: false });
  const S = structureErrors(s, kit);
  const W = kit ? await boardErrors(s, kit) : { errors: [], w6: [] };
  const V = kit ? await runtimeErrors(s, kit) : [];
  return { topicId, ok: !S.length && !W.errors.length && !V.length, structure: S, boards: W.errors, timingOnly: W.w6, runtime: V };
}

/** The blind solver's packet (prompts only) and the matching keys, for every check and remediation follow-up. */
export function blindPacket(topicId) {
  const s = scriptOf(topicId), questions = [], keys = [], examples = [];
  if ((s.version ?? 1) >= 2) {
    // v2: every keyed question the child is asked (explain asks, the worked yourStep with the steps shown before it,
    // checks, remediation follow-ups), in English for the solver; keys stripped
    const ask = (id, prompt, a, extra = {}) => { questions.push({ id, classLevel: s.classLevel, prompt: prompt.en, ...extra }); keys.push({ id, key: a.key, accept: a.accept ?? [] }); };
    for (const k of s.skills) {
      // an explain ask follows her spoken point (and what the board shows); a remediation follow-up follows her say
      for (const b of k.explain) ask(`${k.skillId}/${b.id}`, b.ask.prompt, b.ask, b.point ? { context: { saidJustBefore: b.point.en } } : {});
      const we = k.workedExample;
      ask(`${k.skillId}/we`, we.yourStep.prompt, we.yourStep, { context: { problem: we.problem.en, shownSteps: we.steps.map((x) => `${x.do.en}: ${x.result}`) } });
      for (const c of k.checks) ask(`${k.skillId}/${c.id}`, c.prompt, c);
      k.remediation.forEach((r, i) => ask(`${k.skillId}/rem${i + 1}`, r.then.prompt, r.then, r.say ? { context: { saidJustBefore: r.say.en } } : {}));
      examples.push({ id: `${k.skillId}/we`, classLevel: s.classLevel, problem: we.problem.en, givens: we.givens.map((g) => g.en), find: we.find.en,
        steps: [...we.steps.map((x) => ({ do: x.do.en, result: x.result, why: x.why.en })), { do: "(the child's step)", result: we.yourStep.key }], answer: we.answer.en, why: we.why.en });
    }
    return { questions, keys, examples };
  }
  for (const k of s.skills) {
    for (const c of k.checks) { const id = `${k.skillId}/${c.id}`; questions.push({ id, classLevel: s.classLevel, prompt: c.prompt }); keys.push({ id, key: c.key, accept: c.accept ?? [] }); }
    k.remediation.forEach((r, i) => { const id = `${k.skillId}/rem${i + 1}`; questions.push({ id, classLevel: s.classLevel, prompt: r.then }); keys.push({ id, key: r.thenKey, accept: r.thenAccept ?? [] }); });
    const { board, ...we } = k.workedExample;
    examples.push({ id: `${k.skillId}/we`, classLevel: s.classLevel, ...we });
  }
  return { questions, keys, examples };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
  const topics = args.includes("--all") ? allTopics() : args.filter((a, i) => !a.startsWith("--") && !["--blind", "--keys"].includes(args[i - 1]));
  if (!topics.length) { console.error("usage: check.mjs <topicId> [--blind q.json --keys k.json] | --all"); process.exit(2); }
  let bad = 0;
  for (const t of topics) {
    const r = await checkTopic(t);
    console.log(`${t}: ${r.ok ? "ok" : "FAIL"}  structure ${r.structure.length}, boards ${r.boards.length}, runtime ${r.runtime.length}; W6 left to turn time on ${r.timingOnly.length}`);
    for (const x of [...r.structure.map((m) => `  S ${m}`), ...r.boards.map((m) => `  W ${m}`), ...r.runtime.map((m) => `  V ${m}`)]) console.log(x);
    if (!r.ok) bad++;
    if (opt("--blind")) {
      const p = blindPacket(t);
      writeFileSync(opt("--blind"), JSON.stringify({ questions: p.questions, workedExamples: p.examples }, null, 1));
      if (opt("--keys")) writeFileSync(opt("--keys"), JSON.stringify(p.keys, null, 1));
      console.log(`  blind packet: ${p.questions.length} questions, ${p.examples.length} worked examples → ${opt("--blind")}`);
    }
  }
  process.exit(bad ? 1 : 0);
}
