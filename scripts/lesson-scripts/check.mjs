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
export const allTopics = () => readdirSync(SCRIPTS).filter((f) => /^c\d+-.*\.json$/.test(f)).map((f) => f.slice(0, -5)).sort();

/** Board parameter ranges (Studio's templates, server/forge/explainer/templates.js and board-ref.js). */
/** A board whose template has no range rule here is left to Studio's own resolver and gate (certifyBoardRef), as long as
 *  Studio lists it as a maths template (BOARD_REFS): never refused only because this file does not know it yet. */
export const rangeOk = (b) => (RANGE[b.template] ? RANGE[b.template](b.params ?? {}) : BOARD_REFS[b.template]?.subject === "maths");
export const RANGE = {
  "fraction-parts@1": (p) => p.parts >= 2 && p.parts <= 12 && p.shade >= 0 && p.shade <= p.parts,
  "fraction-of@1": (p) => p.b >= 2 && p.b <= 6 && p.d >= 2 && p.d <= 6 && p.a >= 1 && p.a <= p.b && p.c >= 1 && p.c <= p.d,
  // Studio cb7108d7: `sizes` [2-6 groups of 1-10] draws the same heap shared into groups of THOSE sizes (unequal allowed)
  "equal-groups@1": (p) => (Array.isArray(p.sizes) ? p.sizes.length >= 2 && p.sizes.length <= 6 && p.sizes.every((n) => Number.isInteger(n) && n >= 1 && n <= 10)
    : p.groups >= 2 && p.groups <= 6 && p.each >= 1 && p.each <= 8),
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
 * director11 D2: what a card's why says it is pointing at, against the board drawn under it at the close. PURE.
 *  - a line / mark / ring (rekha, nishaan, line, mark) over a fraction picture (bars, wholes, parts, groups, grid) is a
 *    mismatch: it belongs on a fraction-line or number-line-scale (geometry boards draw their own lines)
 *  - a bar / strip (patti) is drawn as bars, or as a bar whole
 *  - a round whole (cake, roti, pizza, laddoo, watermelon) is drawn as wholes or a round fraction-parts, not a line or bars
 *  - group sizes listed in the why ("7, 3, 3, 3") are the groups drawn: never one equal-groups of another size
 *  - a "not equal" why never closes over a board that draws only equal parts (D1: the judged figure, not the ideal one)
 */
export function whyFigureErrors(why, board) {
  const t = `${why?.hi ?? ""} ${why?.en ?? ""}`.toLowerCase();
  if (!t.trim() || !board?.template) return [];
  const p = board.params ?? {}, tpl = board.template, out = [];
  const isLine = tpl === "fraction-line@1" || tpl === "number-line-scale@1";
  const isBar = tpl === "fraction-bars@1" || (tpl === "fraction-parts@1" && p.whole === "bar") || (tpl === "wholes@1" && p.as === "bar");
  const isRound = (tpl === "wholes@1" && p.as !== "bar") || (tpl === "fraction-parts@1" && p.whole !== "bar");
  // only where the board is a fraction picture: in geometry a "rekha" is a line segment and a "nishaan" a chalk mark on a
  // wheel, both drawn by their own templates
  const fractionBoard = ["fraction-bars@1", "wholes@1", "fraction-parts@1", "equal-groups@1", "shade-grid@1"].includes(tpl);
  if (/\b(rekha|nishaan|number line|on the line|mark)\b/.test(t) && fractionBoard) out.push(`its why points at a line or a mark, the board is ${tpl}`);
  if (/\b(patti|strip|bars?)\b/.test(t) && !/chocolate bar/.test(t) && !isBar && !isLine) out.push(`its why points at a bar, the board is ${tpl}`);
  if (/\b(cake|roti|pizza|laddoo|tarbooz|watermelon)\b/.test(t) && (isLine || tpl === "fraction-bars@1")) out.push(`its why points at a round whole, the board is ${tpl}`);
  const sizes = /\b(?:groups?|samooh)\s+(\d+(?:\s*,\s*\d+)+(?:\s*(?:,|and|aur)\s*\d+)?)/.exec(t);
  if (sizes && tpl === "equal-groups@1") {
    const ns = sizes[1].split(/\s*(?:,|and|aur)\s*/).map(Number);
    if (Array.isArray(p.sizes)) { if (ns.join() !== p.sizes.join()) out.push(`its why lists groups ${ns.join(", ")}, the board draws groups ${p.sizes.join(", ")}`); }
    else if (new Set(ns).size > 1) out.push(`its why lists unequal groups ${ns.join(", ")}, the board draws ${p.groups} equal groups of ${p.each}`);
  }
  const notEqual = /\b(not equal|barabar nahi|unequal)\b/.test(t);
  const onlyEqual = (tpl === "wholes@1" && (p.wholes ?? []).every((w) => w.equal !== false)) || (tpl === "equal-groups@1" && !(Array.isArray(p.sizes) && new Set(p.sizes).size > 1)) || (tpl === "fraction-parts@1");
  if (notEqual && onlyEqual) out.push(`its why judges "not equal", the board draws only equal parts (draw the judged figure)`);
  return out;
}

/**
 * director12 D6: a card's PROMPT names the figure it is posed on, so the board on screen while it is asked must draw it:
 *  - "patti" / strip / bar → bars (a bar whole or fraction bars), never a number line
 *  - "rekha" / number line / "nishaan" / mark → a line, never a fraction picture
 *  - "ringed" / "gola lagaya" or "<fraction> wala nishaan" → that mark is drawn on the posing board
 * PURE. Geometry boards draw their own lines and are left alone.
 */
export function promptFigureErrors(prompt, board) {
  const t = `${prompt?.hi ?? ""} ${prompt?.en ?? ""}`.toLowerCase();
  if (!t.trim() || !board?.template) return [];
  const p = board.params ?? {}, tpl = board.template, out = [];
  const isLine = tpl === "fraction-line@1" || tpl === "number-line-scale@1";
  const isBar = tpl === "fraction-bars@1" || (tpl === "fraction-parts@1" && p.whole === "bar") || (tpl === "wholes@1" && p.as === "bar");
  const fractionBoard = ["fraction-bars@1", "wholes@1", "fraction-parts@1", "equal-groups@1", "shade-grid@1"].includes(tpl);
  if (/\b(patti|strip|bars?)\b/.test(t) && !/chocolate bar/.test(t) && isLine) out.push(`its prompt says "patti"/bar, it is posed on a line (${tpl}): pose it on bars`);
  if (/\b(rekha|nishaan|number line|on the line)\b/.test(t) && fractionBoard) out.push(`its prompt points at a line or a mark, it is posed on ${tpl}`);
  const marks = [...(p.marks ?? []), ...(p.mark ? [p.mark] : [])];
  if (/\b(ringed|circled)\b|gol(a)? (kiya|lagaya|ghera)|ghera hua/.test(t) && !marks.length) out.push(`its prompt names a ringed mark, the posing board (${tpl}) draws no mark`);
  return out;
}

/**
 * The posed figure of a board: what is drawn, never what answers (shade, marks, labels, hops). Equivalent drawings of
 * one figure compare equal, so a card may pose it one way and reveal it another:
 *   fractions   fraction-bars@1 parts are "bars of these denominators"; a 0-1 fraction-line@1 is "a line of these
 *               denominators" (director12 D6: a card that says "patti" is posed on bars, never on a line, so the two differ)
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
    case "fraction-bars@1": return `bars${JSON.stringify(sorted((p.bars ?? []).map((x) => x.parts)))}`;
    case "fraction-line@1": return (p.from ?? 0) === 0 && (p.to ?? 1) === 1 ? `line${JSON.stringify(sorted(p.dens ?? [p.den]))}` : `line${JSON.stringify([p.dens ?? [p.den], p.from, p.to])}`;
    case "area-grid@1": return `shape["${Number(p.w) === Number(p.h) ? "square" : "rectangle"}"]`;
    case "shape@1": case "measured@1": return `shape["${kind(p.shape)}"]`;
    case "fraction-parts@1": return `parts${JSON.stringify([p.parts, p.whole ?? null])}`;
    case "wholes@1": return p.as === "bar" && (p.wholes ?? []).every((w) => w.equal !== false) ? `bars${JSON.stringify(sorted((p.wholes ?? []).map((w) => w.parts)))}`
      : `wholes${JSON.stringify((p.wholes ?? []).map((w) => [w.parts, w.equal !== false]))}`;
    case "equal-groups@1": return `groups[${Array.isArray(p.sizes) ? p.sizes.reduce((a, b) => a + Number(b), 0) : Number(p.groups) * Number(p.each)}]`;
    case "shade-grid@1": return `groups[${Number(p.rows) * Number(p.cols)}]`;
    case "number-line-scale@1": return `scale${JSON.stringify([p.from, p.to, p.step])}`;
    // (to-studio 006, D14.7a: an answer mark on these four is a highlight on the same figure)
    case "compare@1": case "angle@1": case "number-line-hop@1": case "place-value@1": { const { mark, ...rest } = p; return `${board.template}${JSON.stringify(rest)}`; }
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
/** director14 D9.1: a spoken field (any { hi, en } text) never quotes a bare symbol: the voice reads "'?' wala nishaan".
 * Say it in words ("question mark wala nishaan"); the board keeps its "?". Boards ({ template, params }) are not walked. */
export function spokenSymbolErrors(s) {
  const e = [], Q = `['"\u2018\u2019\u201C\u201D]`;
  const bad = new RegExp(`${Q}\\s*[^\\p{L}\\p{N}\\s'"\u2018\u2019\u201C\u201D]{1,3}\\s*${Q}`, "u");
  const walk = (x, path) => {
    if (Array.isArray(x)) return x.forEach((v, i) => walk(v, `${path}[${i}]`));
    if (!x || typeof x !== "object" || x.template) return;
    for (const lang of ["hi", "en"]) if (typeof x[lang] === "string" && bad.test(x[lang])) e.push(`${path}${lang === "en" ? " (en)" : ""}: a quoted symbol is read out (${x[lang].match(bad)[0]}); say it in words`);
    for (const [k, v] of Object.entries(x)) if (k !== "hi" && k !== "en") walk(v, path ? `${path}.${k}` : k);
  };
  walk(s.skills, "skills");
  return e;
}

/** director19 D14.7b (batch D's hand fixes: "barabar", "90°", "reflex" got past the number-only rule): the values a card's key
 * and accept list carry. `nums`: a fraction, or a number above 10, with or without its unit or sign ("90°", "₹50", "4000 m",
 * "1/4 km"); `words`: a word key or word accept form (4+ letters, not a yes/no or a number word) that the card's own prompt
 * does not already offer (a choice card's options are said in its prompt: naming one is not a leak). */
const YESNO = /^(yes|no|haan|han|nahi|nahin|ji|right|wrong|sahi|galat|true|false|same|equal|barabar|dono|both|none|never|always|kabhi|hamesha|koi)$/i;
const NUMWORD = /^(zero|one|two|three|four|five|six|seven|eight|nine|ten|ek|do|teen|chaar|char|paanch|chhah|chhe|saat|aath|nau|das|half|aadha|aadhi)$/i;
// (comparatives, order and quantity words are the teaching's own vocabulary: never a key's giveaway on their own)
const COMMON = /^(zyada|jyada|kam|bada|badi|bade|chhota|chhoti|chhote|more|less|bigger|smaller|larger|longer|shorter|lamba|lambi|chhoti|pehle|pehla|pehli|baad|first|last|next|saare|sare|sab|all|jodo|jod|ghatao|ghata|add|subtract|guna|baanto|upar|neeche|aage|peeche|left|right|daayen|baayen|seedha|ulta|plus|minus|times|ganit|aur|or|and)$/i;
export function keyValues(c) {
  const said = (x) => (x && typeof x === "object" ? [x.hi, x.en].filter(Boolean).join(" ") : String(x ?? ""));
  const prompt = ` ${said(c?.prompt).toLowerCase()} `;
  const inPrompt = (w) => new RegExp(`(?<![\\p{L}\\p{N}])${w.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "u").test(prompt);
  const forms = [c?.key, ...(c?.accept ?? [])].map((v) => String(v ?? "").trim()).filter(Boolean);
  const nums = new Set(), words = new Set();
  for (const f of forms) {
    const m = f.match(/^(?:₹|rs\.?\s*)?(\d+(?:[./]\d+)?)\s*(?:°|%|[\p{L}.]{1,12})?$/iu);
    if (m && !(/^\d+$/.test(m[1]) && Number(m[1]) <= 10)) nums.add(m[1]);
  }
  // (a word key: the key itself, one word; a choice card — any of its key or accept forms offered in its prompt — names
  // its options aloud, so none of them leaks)
  const k = String(c?.key ?? "").trim().toLowerCase();
  const choice = forms.some((f) => inPrompt(f.toLowerCase()));
  if (!choice && /^[\p{L}][\p{L}-]{3,}$/u.test(k) && !YESNO.test(k) && !NUMWORD.test(k) && !COMMON.test(k)) words.add(k);
  return { nums: [...nums], words: [...words] };
}
/** The numbers the walk's points (point, mustSay, simpler) have taught by the end of each skill: a constant of the topic ("a
 * right angle is 90°") said again in a why or a remediation is the lesson, not a giveaway (D14.7b unit values only). */
export function taughtBy(s) {
  const said = (x) => (x && typeof x === "object" ? [x.hi, x.en].filter(Boolean).join(" ") : String(x ?? ""));
  const out = new Map(); const acc = new Set();
  for (const k of s.skills ?? []) {
    for (const b of k.explain ?? []) for (const n of [said(b.point), ...(b.mustSay ?? []).map(said), said(b.simpler)].join(" ").match(/\d+(?:[./]\d+)?/g) ?? []) acc.add(n);
    out.set(k.skillId, new Set(acc));
  }
  return out;
}
const hasWord = (t, w) => new RegExp(`(?<![\\p{L}])${w}(?![\\p{L}])`, "iu").test(String(t ?? ""));

/** director14 D9.2 + director15 D10.4: a remediation never states a value of a card still to come. Its say, its simpler
 * and its then-card (prompt, key, why, simpler) are checked against every keyed card of its skill (a remediation can fire
 * at any of them: explain asks, the worked yourStep, checks; other then-cards) and of every later skill: their keys AND
 * their distractors (`wrongIfMis`), choice cards included (steady 44: c5-t02's s1 remediation said 1/4, e2's key, firing
 * at e1; c5-t01's whole-number-bias remediation used e3's distractor 1/5). A value is matched by its fraction or number
 * with its unit ("1/4 km" by "1/4"); bare whole numbers 0-10 are too common to police in teaching lines, except that a
 * then-card's own key a/b states b when a card still to come has the whole-number key b (c5-t01: the count-marks
 * then-card's 1/8 m gave e2's "8 gaps" before e2 was posed again). */
export function remediationKeyErrors(s) {
  const e = [], TAUGHT = taughtBy(s);
  const said = (x) => (x && typeof x === "object" ? [x.hi, x.en].filter(Boolean).join(" ") : String(x ?? ""));
  const cardsOf = (k) => [...(k.explain ?? []).map((b) => [b.id, b.ask]), ["workedExample.yourStep", k.workedExample?.yourStep],
    ...(k.checks ?? []).map((c) => [c.id, c]), ...(k.remediation ?? []).map((r, i) => [`remediation[${i}].then`, r.then])].filter(([, c]) => c);
  const core = (v) => {
    const m = String(v ?? "").trim().match(/^(\d+(?:[./]\d+)?)(?:\s*[\p{L}]{1,6})?$/u);
    if (!m) return null;
    return /^\d+$/.test(m[1]) && Number(m[1]) <= 10 ? null : m[1];
  };
  const whole = (v) => { const m = String(v ?? "").trim().match(/^(\d+)(?:\s*[\p{L}]{1,6})?$/u); return m && Number(m[1]) >= 2 ? m[1] : null; };
  const hasNum = (t, c) => new RegExp(`(^|[^\\d/.])${c.replace(/[./]/g, "\\$&")}([^\\d/]|$)`).test(` ${t} `);
  // (director16 ruling: keys of ALL later cards stay forbidden; distractors only within the SAME skill)
  const valuesOf = (kk, list, distractors = true) => list.flatMap(([id, c]) => [["key", c.key], ...(distractors ? [["distractor", c.wrongIfMis]] : [])]
    .map(([kind, v]) => ({ where: `${kk.skillId}/${id}`, card: c, kind, v: core(v), w: kind === "key" ? whole(v) : null })));
  s.skills.forEach((k, si) => {
    const later = s.skills.slice(si + 1).flatMap((kk) => valuesOf(kk, cardsOf(kk), false));
    (k.remediation ?? []).forEach((r, i) => {
      // (still to come: from the first card that can call this remediation — the first of the walk's asks, yourStep and checks
      // targeting its misconception — on, every then-card of the skill, and every later skill; a card already behind is not)
      const walk = cardsOf(k).filter(([id]) => !id.startsWith("remediation["));
      const f = walk.findIndex(([, c]) => c.targets === r.targets);
      const ahead = [...valuesOf(k, f < 0 ? walk : walk.slice(f)), ...valuesOf(k, cardsOf(k).filter(([id]) => id.startsWith("remediation["))), ...later];
      const parts = [["", ` ${said(r.say)} ${said(r.simpler)} `], [".then", ` ${said(r.then?.prompt)} ${r.then?.key ?? ""} ${said(r.then?.why)} ${said(r.then?.simpler)} `]];
      for (const [part, t] of parts) for (const a of ahead) {
        if (a.card === r.then) continue;
        // (D14.7b: unit and word keys from the card's key and accept list; keys only, not distractors)
        if (a.kind === "key") { const kv = keyValues(a.card), taught = TAUGHT.get(a.where.split("/")[0]) ?? new Set();
          for (const n of kv.nums) if (n !== a.v && !taught.has(n) && hasNum(t, n)) e.push(`${k.skillId}/remediation[${i}]${part}: states ${n}, the key of ${a.where} still to come`);
          for (const w of kv.words) if (hasWord(t, w)) e.push(`${k.skillId}/remediation[${i}]${part}: says "${w}", the key of ${a.where} still to come`); }
        if (a.v && hasNum(t, a.v)) e.push(`${k.skillId}/remediation[${i}]${part}: states ${a.v}, the ${a.kind} of ${a.where} still to come`);
        if (part && a.w && /\//.test(core(r.then?.key) ?? "") && core(r.then.key).split("/")[1] === a.w) e.push(`${k.skillId}/remediation[${i}].then: its key ${r.then.key} states ${a.w}, the key of ${a.where} still to come`);
      }
    });
  });
  return [...new Set(e)];
}

/** director15 D10 (Brain R4 drops the code-side "Diya hai … Dhoondhna hai …" recital, so the worked problem is the one
 * line always said): every number a worked example's givens or find use is stated in its problem. */
export function workedProblemNumberErrors(s) {
  const e = [], nums = (t) => String(t ?? "").match(/\d+(?:[./]\d+)?/g) ?? [];
  for (const k of s.skills) {
    const we = k.workedExample;
    if (!we?.problem) continue;
    for (const lang of ["hi", "en"]) {
      const have = new Set(nums(we.problem[lang]).flatMap((n) => [n, ...n.split("/")]));
      const extra = [...(we.givens ?? []).map((g) => g?.[lang]), we.find?.[lang]].flatMap(nums).filter((n) => !have.has(n));
      if (extra.length) e.push(`${k.skillId}/workedExample: its givens/find use ${[...new Set(extra)].join(", ")}, which its problem${lang === "en" ? " (en)" : ""} never states`);
    }
  }
  return e;
}

/** director16 D11.1 (dc-r7-held-board): every spoken part of a unit names only the figure its unit's card board draws (a
 * line, bars or strips, a round whole; unequal parts; group sizes): the point, mustSay, simpler, worked steps, remediation
 * say and simpler, the bridge. The board gate (W10) checks the counts; this checks the figure. */
export function unitFigureErrors(s) {
  const e = [];
  for (const u of unitsOf(s)) {
    if (!u.board) continue;
    for (const [field, t] of u.parts) {
      if (field === "next.point" || typeof t === "string") continue;
      // a card's own question (and the worked problem) follows the prompt rule (D6: a cake story may be posed on a line)
      if (/(^|\.)(prompt|problem|find)$/.test(field)) { for (const m of promptFigureErrors(t, u.board)) e.push(`${u.id} ${field}: ${m}`); continue; }
      // an imagined thing ("ek roti socho") is not a claim about the board
      const imagined = /\b(socho|soch lo|maan lo|imagine|think of|suppose|jaise ki)\b/i.test(`${t.hi ?? ""} ${t.en ?? ""}`);
      for (const m of whyFigureErrors(t, u.board)) if (!(imagined && /round whole/.test(m))) e.push(`${u.id} ${field}: ${m.replace(/^its why/, "it")} (the unit's card board)`);
    }
  }
  return e;
}

/** director16 D11.2: no rhetorical question in a spoken field that is not a card. Only a card asks: a point, mustSay,
 * simpler, worked step, remediation say, why or bridge is a statement ("Neeche ka 4? Patti ke 4 barabar tukde." was cut
 * whole by the "?"-drop). A card's prompt and the worked problem (its question) may ask. */
export function rhetoricalQuestionErrors(s) {
  const e = [];
  const ok = (path) => /\.(ask\.prompt|prompt|problem)$/.test(path) || /checks\[\d+\]\.prompt$/.test(path) || /then\.prompt$/.test(path) || /yourStep\.prompt$/.test(path);
  const walk = (x, path) => {
    if (Array.isArray(x)) return x.forEach((v, i) => walk(v, `${path}[${i}]`));
    if (!x || typeof x !== "object" || x.template) return;
    for (const lang of ["hi", "en"]) if (typeof x[lang] === "string" && /[?？]/.test(x[lang]) && !ok(path)) e.push(`${path}${lang === "en" ? " (en)" : ""}: a question outside a card ("${x[lang].match(/[^.!?]*[?？]/)[0].trim()}"); say it as a statement`);
    for (const [k, v] of Object.entries(x)) if (k !== "hi" && k !== "en") walk(v, path ? `${path}.${k}` : k);
  };
  walk(s.skills, "skills");
  return e;
}

/** director17 D12 (c5-t02: the s1 worked board showed 1/6 and 1/3 shaded, so the yourStep "which is bigger" was a picture
 * read; c2's order card was posed on labelled shaded bars): no card is posed on a board that shows its answer — its
 * answerBoard itself, or two or more wholes / bars already shaded or named so the compare or order reads off the picture.
 * The yourStep is posed over its own board, else the worked example's. */
export function answerOnBoardErrors(s) {
  const e = [];
  const shown = (board) => {
    const p = board?.params ?? {};
    const xs = board?.template === "fraction-bars@1" ? (p.bars ?? []) : board?.template === "wholes@1" ? (p.wholes ?? []) : [];
    // (a "?" bar is the one asked: its shading is the given and its name the question)
    return xs.filter((x) => x.label !== "?").filter((x) => (x.shade ?? 0) > 0 || (x.label != null && x.label !== "?" && x.label !== "" && /\d+\s*\/\s*\d+/.test(String(x.label))) || /\d+\s*\/\s*\d+/.test(String(x.title ?? ""))).length;
  };
  for (const k of s.skills) {
    const we = k.workedExample;
    const cards = [...k.explain.filter((b) => b.ask).map((b) => [b.id, b.ask, b.ask.board ?? b.board]),
      ...(we?.yourStep ? [["workedExample.yourStep", we.yourStep, we.yourStep.board ?? we.board]] : []),
      ...k.checks.map((c) => [c.id, c, c.board]), ...k.remediation.map((r, i) => [`remediation[${i}].then`, r.then, r.then?.board])];
    for (const [id, c, board] of cards) {
      if (!board || !c) continue;
      if (shown(board) >= 2) e.push(`${k.skillId}/${id}: posed on ${board.template} with ${shown(board)} wholes already shaded or named (the compare reads off the picture); pose it on unnamed, unshaded bars`);
    }
  }
  return e;
}

/** director17 D12 (c5-t02 e1's why "1/8 bas 1/4 ka aadha" gave e2's key): a card's why — said at its close, before the next
 * card — never states the key of a card still to come in its skill (fractions and numbers above 10). */
export function whyKeyErrors(s) {
  const e = [], TAUGHT = taughtBy(s);
  const core = (v) => { const m = String(v ?? "").trim().match(/^(\d+(?:[./]\d+)?)(?:\s*[\p{L}]{1,6})?$/u); if (!m) return null; return /^\d+$/.test(m[1]) && Number(m[1]) <= 10 ? null : m[1]; };
  const hasNum = (t, c) => new RegExp(`(^|[^\\d/.])${c.replace(/[./]/g, "\\$&")}([^\\d/]|$)`).test(` ${t} `);
  const said = (x) => (x && typeof x === "object" ? [x.hi, x.en].filter(Boolean).join(" ") : String(x ?? ""));
  // (within the skill: a later skill re-uses the basic fractions as its own new idea)
  for (const k of s.skills) { const seq = [...k.explain.filter((b) => b.ask).map((b) => [`${k.skillId}/${b.id}`, b.ask]),
    ...(k.workedExample?.yourStep ? [[`${k.skillId}/workedExample.yourStep`, k.workedExample.yourStep]] : []), ...k.checks.map((c) => [`${k.skillId}/${c.id}`, c])];
  seq.forEach(([where, c], i) => {
    const own = core(c.key);
    const ownKv = keyValues(c);
    for (const [later, l] of seq.slice(i + 1)) {
      const v = core(l.key);
      if (v && v !== own && hasNum(said(c.why), v)) e.push(`${where}.why: states ${v}, the key of ${later} still to come`);
      // (D14.7b: unit and word keys, from the later card's key and accept list; a value this card also answers is its own)
      const kv = keyValues(l);
      for (const n of kv.nums) if (n !== v && n !== own && !ownKv.nums.includes(n) && !(TAUGHT.get(k.skillId) ?? new Set()).has(n) && hasNum(said(c.why), n)) e.push(`${where}.why: states ${n}, the key of ${later} still to come`);
      for (const w of kv.words) if (!ownKv.words.includes(w) && String(c.key ?? "").toLowerCase() !== w && hasWord(said(c.why), w)) e.push(`${where}.why: says "${w}", the key of ${later} still to come`);
    }
  }); }
  return [...new Set(e)];
}

/** director18 D13 (c4 s2: e1's point "12 … 4 barabar group, har group mein 3" solved e3 "In 12 kanchon ka 1/4"): a point
 * (with its mustSay and simpler) never states the key of a later card in its skill — a fraction or number above 10 by
 * together with every number that card's prompt gives (the point solved the card). */
export function pointKeyErrors(s) {
  const e = [];
  const said = (x) => (x && typeof x === "object" ? [x.hi, x.en].filter(Boolean).join(" ") : String(x ?? ""));
  const nums = (t) => (String(t ?? "").replace(/,(?=\d{3}\b)/g, "").match(/\d+(?:[./]\d+)?/g) ?? []);
  const hasNum = (t, c) => new RegExp(`(^|[^\\d/.])${c.replace(/[./]/g, "\\$&")}([^\\d/]|$)`).test(` ${t} `);
  for (const k of s.skills) {
    const cards = [...k.explain.filter((b) => b.ask).map((b) => [b.id, b.ask]), ...(k.workedExample?.yourStep ? [["workedExample.yourStep", k.workedExample.yourStep]] : []), ...k.checks.map((c) => [c.id, c])];
    k.explain.forEach((b) => {
      const t = [said(b.point), ...(b.mustSay ?? []).map(said), said(b.simpler)].join(" ");
      const ownAt = cards.findIndex(([id]) => id === b.id), own = said(b.ask?.prompt);
      for (const [id, c] of cards.slice(ownAt + 1)) {
        const m = String(c.key ?? "").trim().match(/^(\d+(?:[./]\d+)?)(?:\s*[\p{L}]{1,8})?$/u);
        if (!m) continue;
        const key = m[1];
        // (a prompt fraction gives its parts: "1/4 of 12" is solved by "12 … 4 barabar group, har group mein 3"; 0 and 1 are trivial)
        const prompt = [...new Set(nums(said(c.prompt)).flatMap((n) => (n.includes("/") ? n.split("/") : [n])).filter((n) => n !== key && n !== "0" && n !== "1"))];
        // (the point SOLVES that card: its key with every number the card's prompt gives; teaching the notation "1/3" before a
        // 1/3 card is the lesson, not a leak)
        if (hasNum(own, key)) continue;   // (the point's own question names it: e1 "1/3 isi line par hai ya 3 ke paas?")
        // (two or more of its numbers, and a key the card does not name itself: a choice card "1/4 ya 1/8?" names its key)
        if (hasNum(said(c.prompt), key)) continue;
        if (hasNum(t, key) && prompt.length >= 2 && prompt.every((n) => hasNum(t, n))) e.push(`${k.skillId}/${b.id} point: states ${key}, the key of ${k.skillId}/${id} still to come, with its prompt's ${prompt.join(", ")} (the point solves that card)`);
      }
    });
  }
  return e;
}

/** director18 D13 (c5-t02 e1's why was a verbless fragment after "kyunki"): a card's why — said after code's "kyunki" — is
 * a full clause with a verb. A cheap check on the Hinglish copula/verb forms and the English verbs; a why it cannot read is
 * listed for the manual read, never passed silently. */
export function whyVerbErrors(s) {
  const e = [];
  // (an equation is a clause: "4 + 5 + 6 = 15 cm"; this is a manual-read list, not a gate: "2 patti, lambai ek hi, par … bati
  // hai" has a verb and is still a fragment, so a verb test cannot prove a full clause)
  const EQ = /=/;
  const HI = /\b(hai|hain|tha|thi|the|hoga|hogi|honge|hota|hoti|hote|ho|hua|hui|hue|gaya|gayi|gaye|raha|rahi|rahe|sakta|sakti|sakte|milta|milti|milte|mila|mili|aata|aati|aate|aaya|aayi|aaye|jaata|jaati|jaate|lagta|lagti|lagte|banta|banti|bante|bana|bani|bane|padta|padti|chahiye|karta|karti|karte|kiya|ki|kiye|deta|deti|dete|leta|leti|lete|rukta|rukti|pahunchta|pahunchti|jaayein|aayein|baithta|baithti|bachta|bachti|bacha|bachi|bache|batata|batati|ginta|gintey|dikhta|dikhti)\b/i;
  const EN = /\b(is|are|was|were|be|been|has|have|had|makes?|made|gives?|gave|takes?|took|reaches?|stops?|sits?|lies?|comes?|goes?|gets?|got|fits?|needs?|means?|shows?|covers?|leaves?|counts?|equals?|adds?|cuts?|lands?|ends?|holds?|stays?)\b/i;
  for (const k of s.skills) {
    const cards = [...k.explain.filter((b) => b.ask).map((b) => [b.id, b.ask]), ...(k.workedExample?.yourStep ? [["workedExample.yourStep", k.workedExample.yourStep]] : []), ...k.checks.map((c) => [c.id, c]), ...k.remediation.map((r, i) => [`remediation[${i}].then`, r.then])];
    for (const [id, c] of cards) {
      if (!c?.why) continue;
      if (c.why.hi && !HI.test(c.why.hi) && !EQ.test(c.why.hi)) e.push(`${k.skillId}/${id}.why: no verb found after "kyunki" ("${c.why.hi}"); make it a full clause (or read it by hand)`);
      if (c.why.en && !EN.test(c.why.en) && !EQ.test(c.why.en)) e.push(`${k.skillId}/${id}.why (en): no verb found after "because" ("${c.why.en}"); make it a full clause (or read it by hand)`);
    }
  }
  return e;
}

/** director18 D13 (dc-r7-script-walk-v6-10): her joints are authored per topic. `joints` { asidePark, asideReturn,
 * hindiSwitch, askAgain }, each ≥ 3 distinct { hi, en } forms (a single authored sentence is said every time), each ≤ 16
 * words, in the topic's own words; never naming a topic the child did not raise.
 * director19 D14 (dc-r7-script-walk-v6-11; the park's second sentence said twice, the return's {said} dropped or parroted in
 * first person, "ab Hindi mein baantte hain", "Mujhe theek se sunai nahi diya" to a child who spoke clearly):
 * - no form carries {said}: a child's sentence cannot be said back grammatically by code. The only slot is {aside} (Brain's
 *   alias {topic}), in the aside kinds.
 * - asidePark: ONE sentence holding {aside} that promises the return and nothing else (no next action: the walk says what is
 *   next), asking nothing, promising no "question".
 * - asideReturn: ONE question on {aside}, and nothing after it (the return is its own turn; the child answers next).
 * - hindiSwitch: one plain sentence that she will say it in Hindi (.hi) / in English (.en): no odd verb, no "?", nothing
 *   beyond its turn ("ab se", "from now on": v6.10, c5-t02 steady 38).
 * - askAgain: neutral ("Ek baar aur batao."): never claims she did not hear, never a question (a yes/no card would read it as
 *   the card).
 * - no form holds an English word whose Hindi twin the same script's spoken Hindi uses (data/lesson-twins.json,
 *   shared with Brain's dry-matrix predicate). */
export const JOINT_KINDS = ["asidePark", "asideReturn", "hindiSwitch", "askAgain"];
export const JOINT_MAX_WORDS = 16;
export const TWINS = JSON.parse(readFileSync(new URL("../../data/lesson-twins.json", import.meta.url), "utf8")).twins;
const wordRe = (w) => new RegExp(`(?<![\\p{L}])${w.replace(/\s+/g, "\\s+")}(?![\\p{L}])`, "iu");
/** The twin pairs whose Hindi side the script's own spoken Hindi uses (joints excluded). */
export function twinsUsedBy(s) {
  const { joints, ...rest } = s ?? {};
  const hiText = [];
  const walk = (x, k) => { if (typeof x === "string") { if (k === "hi") hiText.push(x); } else if (Array.isArray(x)) x.forEach((y) => walk(y, k)); else if (x && typeof x === "object") for (const [kk, v] of Object.entries(x)) walk(v, kk === "hi" ? "hi" : k === "hi" ? "hi" : kk); };
  walk(rest, null);
  const t = hiText.join(" \n ");
  return TWINS.filter((p) => p.hi.some((h) => wordRe(h).test(t)));
}
const sentencesOf = (t) => String(t ?? "").trim().split(/(?<=[.!?？।])\s+(?=\S)/).filter((x) => /[\p{L}\p{N}{]/u.test(x));
export function jointErrors(s) {
  const e = [], j = s.joints;
  if (!j || typeof j !== "object") return ["joints: a { asidePark, asideReturn, hindiSwitch, askAgain } block, three forms each (D13)"];
  const norm = (t) => String(t ?? "").toLowerCase().replace(/\{[a-z]+\}/g, "{}").replace(/[^\p{L}\p{N}{} ]+/gu, " ").replace(/\s+/g, " ").trim();
  const TOPICS = /\b(cricket|football|kabaddi|ipl|cartoon|cartoons|movie|movies|film|game|games|video game|mobile|phone|gaana|gaane|song|dance|doraemon|chhota bheem|pokemon|youtube)\b/i;
  const twins = twinsUsedBy(s);
  for (const kind of JOINT_KINDS) {
    const forms = j[kind];
    if (!Array.isArray(forms) || forms.length < 3) { e.push(`joints.${kind}: at least 3 forms (got ${Array.isArray(forms) ? forms.length : 0})`); continue; }
    for (const lang of ["hi", "en"]) {
      const seen = new Set();
      forms.forEach((f, i) => {
        const t = String(f?.[lang] ?? "").trim(), at = `joints.${kind}[${i}]${lang === "en" ? " (en)" : ""}`;
        if (!t) { e.push(`${at}: empty`); return; }
        const n = norm(t);
        if (seen.has(n)) e.push(`${at}: the same form twice`); seen.add(n);
        const w = t.replace(/\{[a-z]+\}/g, "X").split(/\s+/).filter(Boolean).length;
        if (w > JOINT_MAX_WORDS) e.push(`${at}: ${w} words > ${JOINT_MAX_WORDS}`);
        const aside = /^aside/.test(kind);
        for (const slot of t.match(/\{[^}]*\}/g) ?? []) {
          if (slot === "{said}") e.push(`${at}: no {said}: a child's words cannot be said back by code (D14); return on {aside}`);
          else if (!["{aside}", "{topic}"].includes(slot) || !aside) e.push(`${at}: slot ${slot} is not allowed here`);
        }
        if (aside && !/\{(aside|topic)\}/.test(t)) e.push(`${at}: an aside ${kind === "asidePark" ? "park" : "return"} names it with {aside}`);
        if (TOPICS.test(t.replace(/\{[a-z]+\}/g, ""))) e.push(`${at}: names a topic (${t.match(TOPICS)[0]}) the child may not have raised; use {aside}`);
        const sents = sentencesOf(t);
        if (kind === "asidePark") {
          if (sents.length !== 1) e.push(`${at}: a park is ONE sentence that promises the return (got ${sents.length}); the walk says what is next`);
          if (/sawaal|question/i.test(t)) e.push(`${at}: a park promises no question (none may be open)`);
          if (/[?？]/.test(t)) e.push(`${at}: asks nothing`);
          if (/\b(pehle|abhi\s+yeh|chalo|let'?s|first)\b/i.test(t)) e.push(`${at}: a park promises the return and nothing else (no next action: the walk says it)`);
        }
        if (kind === "asideReturn" && (sents.length !== 1 || !/[?？]$/.test(t) || (t.match(/[?？]/g) ?? []).length !== 1)) e.push(`${at}: a return is ONE question on {aside} and nothing after it (D14)`);
        if (kind === "hindiSwitch") {
          if (/[?？]/.test(t)) e.push(`${at}: asks nothing`);
          if (sents.length !== 1) e.push(`${at}: one plain sentence`);
          if (lang === "hi" && !/\bhindi\b/i.test(t)) e.push(`${at}: says plainly she will say it in Hindi`);
          if (lang === "en" && !/\benglish\b/i.test(t)) e.push(`${at}: says plainly she will say it in English`);
          if (/\b(baant|milaa|chal|naap|gin)\w*/i.test(t) && lang === "hi") e.push(`${at}: an odd verb for switching language ("${t.match(/\b(baant|milaa|chal|naap|gin)\w*/i)[0]}"): say she will say it in Hindi`);
          if (/\bab se\b|\baage se\b|\bhamesha\b|from now on|\bfrom now\b|from here on/i.test(t)) e.push(`${at}: a switch promises nothing beyond this turn (no "ab se" / "from now on")`);
        }
        if (kind === "askAgain") {
          if (/[?？]/.test(t)) e.push(`${at}: never a question (a yes/no card would take it as the card)`);
          if (/sunai|suna nahi|sun nahi|saaf nahi|chhoot|hear|heard|missed|clearly|awaaz/i.test(t)) e.push(`${at}: never claims she did not hear (the child may have spoken clearly)`);
        }
        if (lang === "hi") for (const p of twins) for (const en of p.en) if (wordRe(en).test(t.replace(/\{[a-z]+\}/g, ""))) e.push(`${at}: "${en}" while this script says "${p.hi.find((h) => true)}" (twins.json): use the script's word`);
      });
    }
  }
  for (const k of Object.keys(j)) if (!JOINT_KINDS.includes(k)) e.push(`joints.${k}: not a joint kind (${JOINT_KINDS.join(", ")})`);
  return e;
}

/** director15 D10.2 (c4 steady 78: "Kya tab ek hissa is aadhe se bada hoga?" over a half labelled "?"): an ask's board
 * never puts "?" on a value its prompt states: a bar of p parts labelled "?" when the prompt names 1/p (in digits or as
 * aadha / tihaai / chauthai), or a line's "?" mark k/den when the prompt says k/den. */
export function askBoardQuestionErrors(s) {
  const e = [];
  const said = (x) => (x && typeof x === "object" ? [x.hi, x.en].filter(Boolean).join(" ") : String(x ?? ""));
  const WORD = { 2: /\b(aadh[aeiā]+|half|halves)\b/i, 3: /\b(tihaa?i|ek-tihaa?i|thirds?)\b/i, 4: /\b(chautha+i|ek-chautha+i|quarters?)\b/i };
  const states = (t, n, d) => new RegExp(`(^|[^\\d/])${n}/${d}([^\\d]|$)`).test(t) || (n === 1 && WORD[d]?.test(t));
  const asks = (k) => [...(k.explain ?? []).filter((b) => b.ask).map((b) => [b.id, b.ask.prompt, b.ask.board ?? b.board]),
    ["workedExample.yourStep", k.workedExample?.yourStep?.prompt, k.workedExample?.yourStep?.board ?? k.workedExample?.board],
    ...(k.checks ?? []).map((c) => [c.id, c.prompt, c.board]), ...(k.remediation ?? []).map((r, i) => [`remediation[${i}].then`, r.then?.prompt, r.then?.board])];
  for (const k of s.skills) for (const [id, prompt, board] of asks(k)) {
    if (!prompt || !board) continue;
    const t = said(prompt), p = board.params ?? {};
    // (director16: D10 checked only the unit fraction 1/p, so "2/3 ya 3/10" over two "?" bars passed; any n/p is a statement)
    if (board.template === "fraction-bars@1") for (const b of p.bars ?? []) {
      const said = b.label === "?" && (states(t, 1, b.parts) || new RegExp(`(^|[^\\d/])\\d+/${b.parts}([^\\d]|$)`).test(t));
      if (said) e.push(`${k.skillId}/${id}: its board labels a bar of ${b.parts} parts "?" though its prompt states that bar's fraction`);
    }
    if (board.template === "fraction-line@1" && Number.isInteger(p.mark) && p.den && states(t, p.mark, p.den)) e.push(`${k.skillId}/${id}: its board marks ${p.mark}/${p.den} "?" though its prompt states it`);
  }
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
      if (["compare@1", "angle@1", "number-line-hop@1", "place-value@1"].includes(board?.template) && board?.params?.mark !== undefined) e.push(at(`${where}: its posing board carries an answer mark (to-studio 006): only an answerBoard does`));
      const a = figureOf(c.answerBoard), b = figureOf(board);
      // director11 D1: a judgement card may reveal the judged figure and then the equal one beside it (wholes appended)
      const appended = c.answerBoard?.template === "wholes@1" && board?.template === "wholes@1"
        && figureOf({ template: "wholes@1", params: { wholes: (c.answerBoard.params?.wholes ?? []).slice(0, (board.params?.wholes ?? []).length) } }) === b;
      if (a !== b && !appended) e.push(at(`${where}: its answerBoard poses ${a}, the board on screen while it is asked draws ${b ?? "nothing"}: give it its own unmarked board`));
    }
    // director11 D1/D2 (dc-r7-script-walk-v6-3): the board a card closes over (its answerBoard, else its own board) draws
    // the figure its why names, in the answer state it judges. whyFigureErrors compares them.
    const closes = [...k.explain.filter((b) => b.ask).map((b) => [`${b.id}.ask`, b.ask, b.ask.board ?? b.board]),
      ...k.checks.map((c, i) => [`checks[${i}]`, c, c.board]), ...k.remediation.map((r, i) => [`remediation[${i}].then`, r.then, r.then?.board]).filter(([, c]) => c),
      ...(we.yourStep ? [["workedExample.yourStep", { ...we.yourStep, why: we.yourStep.why ?? we.why }, we.yourStep.board ?? we.board]] : [])];
    for (const [where, c, own] of closes) for (const m of whyFigureErrors(c.why, c.answerBoard ?? own)) e.push(at(`${where}: ${m}`));
    // director12 D6: and its prompt names the figure it is POSED on (its own board, else the beat's)
    for (const [where, c, posed] of closes) for (const m of promptFigureErrors(c.prompt, posed)) e.push(at(`${where}: ${m}`));
    // integration 13 (Brain, state.js scriptWhyOf): the runtime silently drops a why over WHY_MAX_WORDS, so the checker
    // refuses one: every authored why (cards, worked example, its steps and yourStep) in hi and en
    const whys = [...cards.map(([where, c]) => [where, c.why]), ["workedExample", we.why], ...(we.steps ?? []).map((st, i) => [`workedExample.steps[${i}]`, st.why]),
      ...(we.yourStep?.why ? [["workedExample.yourStep", we.yourStep.why]] : [])];
    for (const [where, w] of whys) for (const lang of ["hi", "en"]) {
      const n = String(w?.[lang] ?? "").split(/\s+/).filter(Boolean).length;
      if (n > WHY_MAX_WORDS) e.push(at(`${where}.why${lang === "en" ? " (en)" : ""}: ${n} words > ${WHY_MAX_WORDS} (the runtime drops it)`));
    }
    // (director17 D12, dc-r7-script-walk-v6-9 N2: from v2.3 a bridge belongs to the next card's unit and has no board of its own)
    if ((s.version ?? 1) >= 2.3) { if (k.bridgeBoard) e.push(at("bridgeBoard: a bridge is spoken over the next card's board (v6.9 N2); remove it")); }
    else if (k.bridgeToNext && !k.bridgeBoard?.template) e.push(at("bridgeToNext: a bridgeBoard { template, params } it points at"));
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
      // director14 D9.3 (c5-t02 s1 steady 6: the then-card posed on its own answer, 1/7 and 1/9 already marked): a follow-up
      // card is never posed with every value it names already marked (a reference mark the prompt names, "1/3 ka mark", is fine)
      const tp = r.then?.board?.params ?? {};
      if (r.then?.board?.template === "fraction-line@1") {
        const val = (a, b) => Math.round((Number(a) / Number(b)) * 1e6);
        const named = [...new Set([...`${r.then.prompt?.hi ?? ""} ${r.then.prompt?.en ?? ""}`.matchAll(/(\d+)\/(\d+)/g)].map((m) => val(m[1], m[2])))];
        const marked = new Set((tp.marks ?? []).map((m) => (Array.isArray(m) ? val(m[0], m[1]) : val(m.num, tp.den))));
        if (tp.hop || (named.length && named.every((v) => marked.has(v)))) e.push(at(`remediation[${j}].then is posed with its values already marked (its answer shows): drop the marks`));
      }
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
  if ((s.version ?? 1) >= 2.3) e.push(...spokenSymbolErrors(s), ...remediationKeyErrors(s), ...askBoardQuestionErrors(s), ...workedProblemNumberErrors(s), ...unitFigureErrors(s), ...rhetoricalQuestionErrors(s), ...answerOnBoardErrors(s), ...whyKeyErrors(s), ...pointKeyErrors(s), ...jointErrors(s));
  return e;
}

/** W: Studio's whiteboard gate on every board (W6 left to turn time). → { errors, w6 } */
/** director16 dc-r7-held-board (v6.8, D11): the board follows the card. A UNIT is a card plus the teaching that leads into
 * it — an explain point and its ask, the worked example and its yourStep, a remediation and its then-card, a bridge and the
 * next skill's first card — and the whole unit is spoken over ONE board, its card's: an explain beat's ask board (else the
 * beat's board), the yourStep's board (else the worked board), the then-card's board, the next skill's first card board.
 * A check is its own unit. → [{ id, board, parts: [[field, { hi, en } | string]], withhold }] */
export function unitsOf(s) {
  const out = [];
  const firstBoard = (k) => k?.explain?.[0] ? (k.explain[0].ask?.board ?? k.explain[0].board) : null;
  const vals = (c) => ({ values: [c?.key, ...(c?.accept ?? [])].filter(Boolean) });
  s.skills.forEach((k, si) => {
    for (const e of k.explain) out.push({ id: `${k.skillId}/${e.id}`, board: e.ask?.board ?? e.board, withhold: vals(e.ask),
      parts: [["point", e.point], ...(e.mustSay ?? []).map((m, i) => [`mustSay[${i}]`, m]), ["simpler", e.simpler], ["ask.prompt", e.ask?.prompt]] });
    const we = k.workedExample;
    out.push({ id: `${k.skillId}/worked`, board: we.yourStep?.board ?? we.board, withhold: vals(we.yourStep),
      parts: [["problem", we.problem], ...(we.givens ?? []).map((g, i) => [`givens[${i}]`, g]), ["find", we.find],
        ...(we.steps ?? []).flatMap((st, i) => [[`steps[${i}].do`, st.do], [`steps[${i}].result`, st.result], [`steps[${i}].why`, st.why], [`steps[${i}].simpler`, st.simpler]]),
        ["yourStep.prompt", we.yourStep?.prompt], ["yourStep.simpler", we.yourStep?.simpler]] });
    const fb = [...k.explain].reverse().find((e) => e.board)?.board;
    for (const c of k.checks) out.push({ id: `${k.skillId}/${c.id}`, board: c.board ?? fb, withhold: vals(c), parts: [["prompt", c.prompt], ["simpler", c.simpler]] });
    k.remediation.forEach((r, i) => out.push({ id: `${k.skillId}/remediation[${i}]`, board: r.then?.board ?? r.board, withhold: vals(r.then),
      parts: [["say", r.say], ["simpler", r.simpler], ["then.prompt", r.then?.prompt], ["then.simpler", r.then?.simpler]] }));
    const next = s.skills[si + 1];
    if (k.bridgeToNext && next) out.push({ id: `${k.skillId}/bridge`, board: firstBoard(next), withhold: vals(next.explain?.[0]?.ask),
      parts: [["bridgeToNext", k.bridgeToNext], ["next.point", next.explain?.[0]?.point]] });
  });
  return out.map((u) => ({ ...u, parts: u.parts.filter(([, t]) => t && (typeof t === "string" ? t.trim() : t.hi || t.en)) }));
}

export async function boardErrors(s, kit) {
  const [{ resolveBoardRef }, { expand }, { gateWhiteboard }, { retimeToLine, refWholes }] = await Promise.all([
    import("../../server/forge/explainer/board-ref.js"), import("../../server/forge/explainer/templates.js"),
    import("../../server/studio/qa/whiteboard.js"), import("../../server/stagecraft/board-sync.js")]);
  const errors = [], w6 = [];
  // (v2.3+, the held board: every teaching line is gated with its whole unit over the unit's card board; a card's close
  // keeps its answerBoard, said under her verdict and the card's why)
  const said = (x) => (x && typeof x === "object" ? [x.hi, x.en].filter(Boolean).join(" ") : String(x ?? ""));
  const held = (s.version ?? 1) >= 2.3;
  const units = held ? unitsOf(s).filter((u) => u.board).map((u) => ({ skillId: u.id.split("/")[0], b: { id: u.id.split("/").slice(1).join("/"), board: u.board, line: u.parts.map(([, t]) => said(t)).join(" "), withhold: u.withhold } })) : [];
  const beats = held ? [...units, ...s.skills.flatMap((k) => beatsOf(k, s.version ?? 1).filter((b) => /\.answer$/.test(b.id)).map((b) => ({ skillId: k.skillId, b })))]
    : s.skills.flatMap((k) => beatsOf(k, s.version ?? 1).map((b) => ({ skillId: k.skillId, b })));
  for (const { skillId, b } of beats) { const k = { skillId };
    const r = resolveBoardRef(b.board, { kit });
    if (!r.ok) { errors.push(`${k.skillId}/${b.id}: ${r.why}`); continue; }
    const text = String(b.line ?? "");
    // (as certifyBoardRef since Studio's 5982e751: a bar whose parts her line names is a whole of its own, never an unspoken "2")
    const lineNs = new Set((text.match(/\d+/g) ?? []).map(Number));
    const wn = (r.call.bars ?? []).every((x) => lineNs.has(Number(x?.parts))) ? refWholes(b.board) : null;
    const g = gateWhiteboard(retimeToLine(expand(r.call).script, text), { reply: text, speechMs: Math.max(1500, text.split(/\s+/).length * 400), withhold: b.withhold ?? { values: [] }, kit, asked: true, ...(wn ? { wholes: wn } : {}) });
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
    // (director18 D13: a manual-read list, never a gate — whys with no verb found after code's "kyunki")
    if (args.includes("--manual")) { const sc = scriptOf(t); for (const m of sc && (sc.version ?? 1) >= 2.3 ? whyVerbErrors(sc) : []) console.log(`  M ${m}`); }
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
