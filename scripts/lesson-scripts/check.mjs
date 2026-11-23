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
//   node scripts/lesson-scripts/check.mjs <topicId> --since <rev>     also list every part whose spoken text changed since <rev>
//   LESSON_SCRIPTS_DIR=data/lesson-scripts-staged node scripts/lesson-scripts/check.mjs <topicId> --standard
//                                                                     hold a staged script to the pilots' standard for this run
//   node scripts/lesson-scripts/check.mjs <topicId> --d32 [--rules]   hold a script to Learning 020's rules for this run; --rules
//                                                                     lists stated-rule sentences (R) and askWhole candidates (A)
//   node scripts/lesson-scripts/check.mjs <topicId> --d33 [--rules]   hold a script to Learning 021's rules for this run and list
//                                                                     the boards that answer their own card (B); --rules adds the
//                                                                     whyAlt-as-help lines (H) and operation pairs (O)
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { BOARD_REFS } from "../../server/forge/explainer/board-ref.js";
import { toSpoken } from "../../server/voice/spoken.js";
// (Learning 018, A.1: the view a picture turn draws beside a board is read from the same call Studio draws it with — read-only)
import { pictureTurn } from "../../server/stagecraft/board-first.js";
// (Learning 021 rule 1: the frozen safety predicate the walk reads a child's reply with, imported, never copied or changed)
import { scanSafety } from "../../server/director/safety.js";

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
      if (!c.key || !wrongsOf(c).length || wrongsOf(c).includes(String(c.key).trim())) e.push(at(`${c.id} key and the misconception's answer`));
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
  if (a.wrongIfMis !== undefined && wrongsOf(a).includes(String(a.key).trim())) e.push(`${at}: wrongIfMis equals the key`);
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
/** 048 G8: a card's named wrong answer(s): `wrongIfMis` is one string or a list of the ways it is said ("barabar", "dono barabar"). */
export const wrongsOf = (c) => (Array.isArray(c?.wrongIfMis) ? c.wrongIfMis : c?.wrongIfMis != null ? [c.wrongIfMis] : []).map((x) => String(x ?? "").trim()).filter(Boolean);
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
    // (a crossing is the same figure whatever its angles are labelled: the posing board asks "?", the answer board names it)
    case "lines@1": return p.kind === "cross" ? `cross[${p.deg}]` : `lines${JSON.stringify({ ...p, angles: undefined })}`;
    // (hideResult only hides the answer cell: a posing board with it and its answer board without it draw the same figure)
    default: { const { hideResult, ...rest } = p; return `${board.template}${JSON.stringify(rest)}`; }
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
  const valuesOf = (kk, list, distractors = true) => list.flatMap(([id, c]) => [["key", c.key], ...(distractors ? wrongsOf(c).map((w) => ["distractor", w]) : [])]
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
  // (director21 S2/E1: a card's reask and the teach-back's prompt are questions; a problemAlt may pose its problem as one;
  // Learning 019 A.1: a card's `hindi` form is its question)
  const ok = (path) => /\.(ask\.prompt|prompt|problem|ask|reask|problemAlt|hindi)$/.test(path) || /checks\[\d+\]\.prompt$/.test(path) || /then\.prompt$/.test(path) || /yourStep\.prompt$/.test(path);
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
// (director20 S1: backTo, coming back to an earlier card: one sentence, no slot, no question)
export const JOINT_KINDS = ["asidePark", "asideReturn", "hindiSwitch", "askAgain", "backTo"];
// (director21 J1, v2.4: four seams, three forms each, one sentence that asks nothing and names nothing: after her aside reply and
// before the lesson; after a miss verdict and before a remediation; after "try it first" and before the card; after the AI line
// and before the lesson)
export const SEAM_KINDS = ["afterAside", "beforeRemediation", "afterTryFirst", "afterAiLine"];
// (the v2.4 fields switch on with "version": 2.4, or with a teachback on a v2.3 script while the runtime walks versions up to 2.3)
function isV24(s) { return (s?.version ?? 1) >= 2.4 || !!s?.teachback; }
const jointKindsOf = (s) => (isV24(s) ? [...JOINT_KINDS, ...SEAM_KINDS] : JOINT_KINDS);
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
/** director20 R2: when the child says "samajh nahi aaya" or "pata nahi" to her opening, one plain sentence of what today is
 * about (`greetSimpler` { hi, en }), then the hook: one sentence, no question, at most 20 words. */
export function greetErrors(s) {
  const g = s.greetSimpler; if (!g) return ["greetSimpler: one plain sentence { hi, en } of what today is about (director20 R2)"];
  const e = [];
  for (const lang of ["hi", "en"]) { const t = String(g[lang] ?? "").trim(); const at = `greetSimpler${lang === "en" ? " (en)" : ""}`;
    if (!t) { e.push(`${at}: empty`); continue; }
    if (/[?？]/.test(t) || t.split(/(?<=[.!?])\s+(?=\S)/).length !== 1) e.push(`${at}: one plain sentence, no question`);
    if (t.split(/\s+/).length > 20) e.push(`${at}: at most 20 words`); }
  return e;
}
export function jointErrors(s) {
  const e = [], j = s.joints;
  if (!j || typeof j !== "object") return ["joints: a { asidePark, asideReturn, hindiSwitch, askAgain } block, three forms each (D13)"];
  const norm = (t) => String(t ?? "").toLowerCase().replace(/\{[a-z]+\}/g, "{}").replace(/[^\p{L}\p{N}{} ]+/gu, " ").replace(/\s+/g, " ").trim();
  const TOPICS = /\b(cricket|football|kabaddi|ipl|cartoon|cartoons|movie|movies|film|game|games|video game|mobile|phone|gaana|gaane|song|dance|doraemon|chhota bheem|pokemon|youtube)\b/i;
  const twins = twinsUsedBy(s);
  for (const kind of jointKindsOf(s)) {
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
          // (dc-r8-director25: the switch promises what follows, other and easier words, not "Hindi": the scripts have no Hindi-only
          // text. The en is the same line in English; it never promises English)
          if (lang === "en" && /\benglish\b/i.test(t)) e.push(`${at}: the en is the same line in English; it never promises English`);
          if (/\b(baant|milaa|chal|naap|gin)\w*/i.test(t) && lang === "hi") e.push(`${at}: an odd verb for switching language ("${t.match(/\b(baant|milaa|chal|naap|gin)\w*/i)[0]}"): say she will say it in Hindi`);
          if (/\bab se\b|\baage se\b|\bhamesha\b|from now on|\bfrom now\b|from here on/i.test(t)) e.push(`${at}: a switch promises nothing beyond this turn (no "ab se" / "from now on")`);
        }
        if (kind === "backTo" && (sents.length !== 1 || /[?？]/.test(t))) e.push(`${at}: one sentence that brings her back to the earlier card, asking nothing`);
        if (SEAM_KINDS.includes(kind)) {
          if (sents.length !== 1 || /[?？]/.test(t)) e.push(`${at}: a seam is one sentence that asks nothing (J1)`);
          // (a seam joins two authored parts; it states no fact, verdict or promise of its own)
          if (/\b(sahi|galat|right|wrong|correct|zaroor|promise|baad mein|later)\b/i.test(t)) e.push(`${at}: a seam judges nothing and promises nothing ("${t.match(/\b(sahi|galat|right|wrong|correct|zaroor|promise|baad mein|later)\b/i)[0]}")`);
        }
        if (kind === "askAgain") {
          if (/[?？]/.test(t)) e.push(`${at}: never a question (a yes/no card would take it as the card)`);
          if (/sunai|suna nahi|sun nahi|saaf nahi|chhoot|hear|heard|missed|clearly|awaaz/i.test(t)) e.push(`${at}: never claims she did not hear (the child may have spoken clearly)`);
        }
        if (lang === "hi") for (const p of twins) for (const en of p.en) if (wordRe(en).test(t.replace(/\{[a-z]+\}/g, ""))) e.push(`${at}: "${en}" while this script says "${p.hi.find((h) => true)}" (twins.json): use the script's word`);
      });
    }
  }
  // (dc-r8-director25 H4: helpSpent and afterKeyGoOn, said by the help function when the ladder is empty; optional, so a script
  // written before them still passes) (dc-r8-director26 J1: beforeWorked, the lead into a worked problem; optional likewise)
  // (dc-r8-director26 N1, B2: helpToCard, a point's card after its wordings are spent; checkinStop, the stop menu; optional likewise)
  for (const k of Object.keys(j)) if (!jointKindsOf(s).includes(k) && !["helpSpent", "afterKeyGoOn", "beforeWorked", "helpToCard", "checkinStop", ...D27_JOINTS, ...D28_JOINTS, ...D29_JOINTS, ...D33_JOINTS, "afterWorked"].includes(k)) e.push(`joints.${k}: not a joint kind (${jointKindsOf(s).join(", ")})`);
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
      if (/[a-z]/i.test(String(st.result)) && EN_WORDS.test(String(st.result)) && !(isD27(s) && HINGLISH.test(String(st.result)))) e.push(at(`workedExample.steps[${i}].result: '${st.result}' is spoken; write it in Hinglish`));
      if (/^\s*kyunki\b/i.test(st.why?.hi ?? "")) e.push(at(`workedExample.steps[${i}].why: starts with "kyunki" (the runtime adds it)`));
    }
    if (/^\s*kyunki\b/i.test(we.why?.hi ?? "")) e.push(at(`workedExample.why: starts with "kyunki" (the runtime adds it)`));
    // director8 (dc-r7-script-walk-v6, R2): a close's "why" comes only from the closed card's own authored why, so every
    // keyed card carries one; and a bridge points at its own board (bridgeBoard), never at a board that was not drawn
    const cards = [...k.explain.filter((b) => b.ask).map((b) => [`${b.id}.ask`, b.ask]), ...k.checks.map((c, i) => [`checks[${i}]`, c]),
      ...k.remediation.map((r, i) => [`remediation[${i}].then`, r.then ?? {}])];
    for (const [where, c] of cards) {
      // (director20 S1: a card whose question is not its last sentence carries `ask`, the question alone, re-asked after a hint)
      if (c.ask !== undefined) for (const lang of ["hi", "en"]) { const q = String(c.ask?.[lang] ?? "").trim();
        if (!/[?？]$/.test(q) || (q.match(/[?？]/g) ?? []).length !== 1 || q.split(/\s+/).length > 20) e.push(at(`${where}.ask${lang === "en" ? " (en)" : ""}: the card's question alone, one sentence ending in "?", at most 20 words`)); }
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
        // (d32, main: the appended wholes keep the posed drawing's own shape; a circle posed and strips answered is a new figure)
        && (c.answerBoard.params?.as ?? null) === (board.params?.as ?? null)
        && figureOf({ template: "wholes@1", params: { ...(board.params?.as ? { as: board.params.as } : {}), wholes: (c.answerBoard.params?.wholes ?? []).slice(0, (board.params?.wholes ?? []).length) } }) === b;
      // (dc-r8-director28 item 6, Learning 017 C: a card that asks the child to count the marks of a line it names — the count-marks
      // card, "12 barabar gaps ke beech kitne marks?" — is posed over the line it starts from, never over the line whose ticks it asks
      // to count; its answerBoard adds that line. Allowed where the answer's lines begin with the posing board's and the key is a count.)
      const countPosed = /^\d+$/.test(String(c.key ?? "").trim()) && /^line\[/.test(String(a)) && /^line\[/.test(String(b ?? ""))
        && String(a).replace(/\]$/, ",").startsWith(String(b).replace(/\]$/, ",")) && a !== b;
      if (a !== b && !appended && !countPosed) e.push(at(`${where}: its answerBoard poses ${a}, the board on screen while it is asked draws ${b ?? "nothing"}: give it its own unmarked board`));
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
      if (!wrongsOf(c).length) e.push(at(`${c.id}: wrongIfMis`));
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
  if ((s.version ?? 1) >= 2.3) e.push(...spokenSymbolErrors(s), ...remediationKeyErrors(s), ...askBoardQuestionErrors(s), ...workedProblemNumberErrors(s), ...unitFigureErrors(s), ...rhetoricalQuestionErrors(s), ...answerOnBoardErrors(s), ...whyKeyErrors(s), ...pointKeyErrors(s), ...jointErrors(s), ...greetErrors(s), ...oneTermErrors(s), ...repeatErrors(s), ...crossingBoardErrors(s), ...markGroundErrors(s), ...spokenKeyErrors(s), ...earlierKeyErrors(s), ...ladderRepeatErrors(s, kit), ...thenSayErrors(s), ...frameRepeatErrors(s, kit), ...wordKeySpreadErrors(s), ...yesNoSpreadErrors(s), ...placeValueKeyErrors(s), ...sayBoardNumberErrors(s), ...negatedClaimErrors(s), ...sharedSentenceErrors(s), ...friendVerbErrors(s), ...bridgeTrueErrors(s), ...hookReuseErrors(s), ...d22Errors(s), ...d24Errors(s), ...d25Errors(s), ...voiceTextErrors(s), ...d27Errors(s), ...d28Errors(s), ...d29Errors(s), ...d30Errors(s), ...d31Errors(s), ...d32Errors(s), ...d33Errors(s));
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
    // (a remediation's say is posed with its then-card in one move, over the then-card's board — director16 D11.1: its own picture
    // is no longer drawn; only a help re-teach after a check draws r.board — so the say is judged against the then-card's board)
    // (dc-r8-director27 P1, on the scripts that carry its fields: a remediation with a board of its own pages it at its own first
    // word and its then-card's board at the card's — so the say and its simpler are judged against the remediation's board, the
    // card against its own)
    k.remediation.forEach((r, i) => {
      if (isD27(s) && r.board && r.then?.board && JSON.stringify(r.board) !== JSON.stringify(r.then.board)) {
        out.push({ id: `${k.skillId}/remediation[${i}]`, board: r.board, withhold: vals(r.then), parts: [["say", r.say], ["simpler", r.simpler]], own: true });
        out.push({ id: `${k.skillId}/remediation[${i}].then`, board: r.then.board, withhold: vals(r.then), parts: [["then.prompt", r.then.prompt], ["then.simpler", r.then.simpler]] });
        return;
      }
      out.push({ id: `${k.skillId}/remediation[${i}]`, board: r.then?.board ?? r.board, withhold: vals(r.then),
        parts: [["say", r.say], ["simpler", r.simpler], ["then.prompt", r.then?.prompt], ["then.simpler", r.then?.simpler]] });
    });
    const next = s.skills[si + 1];
    if (k.bridgeToNext && next) out.push({ id: `${k.skillId}/bridge`, board: firstBoard(next), withhold: vals(next.explain?.[0]?.ask),
      parts: [["bridgeToNext", k.bridgeToNext], ["next.point", next.explain?.[0]?.point]] });
  });
  return out.map((u) => ({ ...u, parts: u.parts.filter(([, t]) => t && (typeof t === "string" ? t.trim() : t.hi || t.en)) }));
}

let ownTakeN = 0;
/** dc-r8-director27: whether a remediation's own board is drawn under a line of hers, as the walk draws it (board-first's preselect,
 *  then takePreselected re-gating it on her real line). */
export async function ownBoardTaken(s, kit, board, text, { spoken = true } = {}) {
  const BF = await import("../../server/stagecraft/board-first.js");
  const { gateCtxFor } = await import("../../server/stagecraft/board-sync.js");
  const id = `chk-own-${ownTakeN++}`;
  const ask = { intent: { intentId: `${id}:wb:1`, lessonId: id, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: board, scriptBeat: { scriptId: "s", beatId: "remediation", kind: "remediation" } },
    line: { lessonId: id, text: "" }, mode: "continue", kit: { topicId: s.topicId, content: [] } };
  const p = BF.preselect(ask, { kit });
  if (p?.by !== "script") return false;
  const real = { ...ask, line: { lessonId: id, text } };
  // (the say draws it, so the say speaks it; a simpler is said over it once it is up, so its words need only pass its gate)
  return !!BF.takePreselected(real, gateCtxFor(real, { kit, redact: [], prior: [] })) && (!spoken || BF.scriptBoardSpoken(real));
}
export async function boardErrors(s, kit) {
  const [{ resolveBoardRef }, { expand, BOARD_WORDS = [] }, { gateWhiteboard }, { retimeToLine, refWholes }] = await Promise.all([
    import("../../server/forge/explainer/board-ref.js"), import("../../server/forge/explainer/templates.js"),
    import("../../server/studio/qa/whiteboard.js"), import("../../server/stagecraft/board-sync.js")]);
  const errors = [], w6 = [];
  // (v2.3+, the held board: every teaching line is gated with its whole unit over the unit's card board; a card's close
  // keeps its answerBoard, said under her verdict and the card's why)
  const said = (x) => (x && typeof x === "object" ? [x.hi, x.en].filter(Boolean).join(" ") : String(x ?? ""));
  const held = (s.version ?? 1) >= 2.3;
  const all = held ? unitsOf(s).filter((u) => u.board) : [];
  // (dc-r8-director27 P1: a remediation's own board is taken as the walk takes it — preselected as the script's and re-gated on each
  // line said over it, the say and its simpler, as tests/r7-board-ref does — not through the unit stand-in)
  for (const u of all.filter((x) => x.own)) for (const [field, t] of u.parts) {
    const text = typeof t === "string" ? t : t?.hi;
    if (text && !(await ownBoardTaken(s, kit, u.board, text, { spoken: field === "say" }))) errors.push(`${u.id} ${field}: its own board is not taken under its words (the walk would keep what is up)`);
  }
  const units = all.filter((u) => !u.own).map((u) => ({ skillId: u.id.split("/")[0], b: { id: u.id.split("/").slice(1).join("/"), board: u.board, line: u.parts.map(([, t]) => said(t)).join(" "), withhold: u.withhold } }));
  const beats = held ? [...units, ...s.skills.flatMap((k) => beatsOf(k, s.version ?? 1).filter((b) => /\.answer$/.test(b.id)).map((b) => ({ skillId: k.skillId, b })))]
    : s.skills.flatMap((k) => beatsOf(k, s.version ?? 1).map((b) => ({ skillId: k.skillId, b })));
  for (const { skillId, b } of beats) { const k = { skillId };
    const r = resolveBoardRef(b.board, { kit });
    if (!r.ok) { errors.push(`${k.skillId}/${b.id}: ${r.why}`); continue; }
    const text = String(b.line ?? "");
    // (as certifyBoardRef since Studio's 5982e751: a bar whose parts her line names is a whole of its own, never an unspoken "2")
    const lineNs = new Set((text.match(/\d+/g) ?? []).map(Number));
    const wn = (r.call.bars ?? []).every((x) => lineNs.has(Number(x?.parts))) ? refWholes(b.board) : null;
    const g = gateWhiteboard(retimeToLine(expand(r.call).script, text), { reply: text, speechMs: Math.max(1500, text.split(/\s+/).length * 400), withhold: b.withhold ?? { values: [] }, kit, asked: true, ...(wn ? { wholes: wn } : {}),
      // (to-learning 010, Studio r8 board grammar: the legend Studio draws from a board's roles — "shaded part", "your answer"
      // — is the template's own words, accepted as board-sync's TEMPLATE_WORDS accepts them)
      ...(BOARD_WORDS.length ? { extraWords: [...BOARD_WORDS] } : {}) });
    const failed = g.checks.filter((c) => !c.pass);
    const timingOnly = (c) => c.id === "W6.timing" || (c.id === "W19.settled" && Array.isArray(c.detail) && c.detail.every((d) => d === "W6.timing"));
    const bad = failed.filter((c) => !timingOnly(c));
    if (bad.length) errors.push(`${k.skillId}/${b.id}: ${bad.map((c) => `${c.id} ${JSON.stringify(c.detail)}`).join(" | ")}`);
    else if (failed.length) w6.push(`${k.skillId}/${b.id}`);
  }
  // (main, d33: an authored picture is drawn only when a child asks for it, so nothing above builds it. The two-pass read of a new staged
  // script found a closing question's `pictureBoard` that does not draw (equal-groups of 9 a group, over the template's 8): its caption
  // would be said over nothing. Every `pictureBoard`, wherever it sits, must resolve and expand to a script with something in it)
  const pics = [];
  (function walk(o, at) {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) { o.forEach((x, i) => walk(x, `${at}[${i}]`)); return; }
    if (o.pictureBoard && typeof o.pictureBoard === "object") pics.push({ at: `${at}.pictureBoard`, board: o.pictureBoard });
    for (const [k, v] of Object.entries(o)) if (k !== "pictureBoard") walk(v, at ? `${at}.${k}` : k);
  })(s, "");
  for (const { at, board } of pics) {
    try {
      const r = resolveBoardRef(board, { kit });
      if (!r.ok) { errors.push(`${at}: does not draw (${r.why})`); continue; }
      const ops = expand(r.call)?.script?.ops ?? expand(r.call)?.script ?? null;
      if (!ops || (Array.isArray(ops) && !ops.length)) errors.push(`${at}: draws nothing`);
    } catch (err) { errors.push(`${at}: does not draw (${String(err?.message ?? err).slice(0, 120)})`); }
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
  // (Learning 021 rule 1: a safety matter, on for every script at once)
  S.push(...safetyErrors(s));
  if (isV24(s)) S.push(...chapterSynonymErrors(topicId, allTopics().filter((t) => t !== topicId).map((t) => ({ topicId: t, s: scriptOf(t) })).concat([{ topicId, s }])));
  const W = kit ? await boardErrors(s, kit) : { errors: [], w6: [] };
  if (kit) W.errors.push(...await allBoardsResolve(s, kit));
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

/** dc-r8-director27, Learning 016 A and D (the walk uses them in Brain 042): where the child said "haan" to a check-in, she now does
 *  one small thing.
 *  - `explain[].quick` { prompt, key, accept, say } on every explain beat: a question of 14 words or fewer that the point just said
 *    or its board shows answers in a word or two; its key is not its card's key (and neither is accepted for the other); `say`
 *    states the answer in one line of 12 words or fewer, asking nothing.
 *  - `workedExample.steps[].ask` { prompt, key, accept, right } on at least one step of every worked example of two or more steps:
 *    the question whose answer is that step's result (14 words or fewer); `right` confirms it with its reason (15 words or fewer);
 *    its key is not the child's own step's key.
 *  - Lengths the walk relies on: a worked `problem` 30 words or fewer; a told step ("do: result, kyunki why") 30 or fewer; the
 *    longest lead-in, the problem, the told steps before the first question and that question 75 or fewer; `wrap.covered` 20 per
 *    sentence (wrap.ack's 8 is d24's).
 *  - joints.afterKeyReturn (three forms: after a key, one sentence that says this will come again and that they go back to the
 *    earlier question) and joints.tiredBye (two forms: one sentence to a child who says she is tired, before the goodbye; no taste
 *    claim, no promise).
 *  The rules apply to the four pilots and to any script that declares one of the fields, so the 30 staged scripts are not failed
 *  for lacking them. */
// (dc-r8-director31 item 10: c5-maths-ch02-t03 went live as judged, the fifth live script, held to every pilot rule;
// director32: c6-maths-ch07-t01 the sixth)
export const D27_PILOTS = ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c6-maths-ch06-t01", "c5-maths-ch02-t03", "c6-maths-ch07-t01"];
export const D27_JOINTS = ["afterKeyReturn", "tiredBye"];
export const QUICK_PROMPT_MAX = 14, QUICK_SAY_MAX = 12, ASK_PROMPT_MAX = 14, ASK_RIGHT_MAX = 15, WORKED_PROBLEM_MAX = 30, TOLD_STEP_MAX = 30, WORKED_OPEN_MAX = 75, COVERED_MAX = 20;
export function isD27(s) {
  if (D27_PILOTS.includes(s?.topicId)) return true;
  return (s?.skills ?? []).some((k) => (k.explain ?? []).some((b) => b.quick) || (k.workedExample?.steps ?? []).some((x) => x.ask))
    || D27_JOINTS.some((j) => s?.joints?.[j]);
}
const d27Words = (t) => String(t ?? "").replace(/\{[a-zA-Z]+\}/g, "X").split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
const d27Norm = (t) => String(t ?? "").toLowerCase().replace(/[‐–—-]/g, " ").replace(/[^\p{L}\p{N}/.₹ ]+/gu, " ").replace(/\s+/g, " ").trim();
/** a told step as the walk says it: "do: result, kyunki why" */
export const toldStepText = (x, l = "hi") => `${x?.do?.[l] ?? ""}: ${x?.result ?? ""}, ${l === "hi" ? "kyunki" : "because"} ${x?.why?.[l] ?? ""}`;
export function d27Errors(s) {
  if (!isD27(s)) return [];
  const e = [];
  const has = (t, forms) => { const n = ` ${d27Norm(t)} `; return forms.some((f) => { const x = d27Norm(f); return x && n.includes(` ${x} `); }); };
  const keyed = (q, at, { promptMax, lineField, lineMax }) => {
    if (!q || typeof q !== "object") { e.push(`${at}: missing`); return false; }
    for (const l of ["hi", "en"]) {
      const p = String(q.prompt?.[l] ?? "").trim(), a = `${at}.prompt${l === "en" ? " (en)" : ""}`;
      if (!p) { e.push(`${a}: empty`); continue; }
      if (d27Words(p) > promptMax) e.push(`${a}: ${d27Words(p)} words > ${promptMax}`);
      if (!/[?？]\s*$/.test(p) || (p.match(/[?？]/g) ?? []).length !== 1) e.push(`${a}: one question, ending on it`);
      const t = String(q[lineField]?.[l] ?? "").trim(), b = `${at}.${lineField}${l === "en" ? " (en)" : ""}`;
      if (!t) { e.push(`${b}: empty`); continue; }
      if (d27Words(t) > lineMax) e.push(`${b}: ${d27Words(t)} words > ${lineMax}`);
      if (/[?？]/.test(t)) e.push(`${b}: asks nothing`);
      if (sentencesOf(t).length !== 1) e.push(`${b}: one sentence`);
    }
    if (typeof q.key !== "string" || !q.key.trim()) e.push(`${at}.key: a key`);
    if (!Array.isArray(q.accept) || !q.accept.length || q.accept.some((x) => typeof x !== "string" || !x.trim())) e.push(`${at}.accept: a list of the ways a child says it`);
    // (the line said after it states the answer: its key or an accepted form, in either language)
    const forms = [q.key, ...(q.accept ?? [])];
    if (q.key && !has(`${q[lineField]?.hi ?? ""}`, forms) && !has(`${q[lineField]?.en ?? ""}`, forms)) e.push(`${at}.${lineField}: states the answer (its key or an accepted form)`);
    return true;
  };
  const same = (a, b) => d27Norm(a) && d27Norm(a) === d27Norm(b);
  for (const k of s.skills ?? []) {
    for (const b of k.explain ?? []) {
      const at = `${k.skillId}/${b.id}.quick`;
      // (dc-r8-director28, Learning 017 B: a quick question is kept only where its point and card do not fit one turn; d29Errors
      // reads where it may stand. Scripts not yet under 017 keep director27's rule.)
      if (!b.quick) { if (!isD29(s)) e.push(`${at}: every explain beat has a quick question { prompt, key, accept, say } (dc-r8-director27)`); continue; }
      if (!keyed(b.quick, at, { promptMax: QUICK_PROMPT_MAX, lineField: "say", lineMax: QUICK_SAY_MAX })) continue;
      const card = b.ask;
      if (card) {
        const cf = [card.key, ...(card.accept ?? [])], qf = [b.quick.key, ...(b.quick.accept ?? [])];
        if (cf.some((x) => qf.some((y) => same(x, y)))) e.push(`${at}: its key or an accepted form is the card's (${card.key}): after it the card must still need its own thinking`);
        for (const l of ["hi", "en"]) if (leaks(b.quick.prompt?.[l] ?? "", card.key) || has(b.quick.say?.[l] ?? "", [card.key])) e.push(`${at}${l === "en" ? " (en)" : ""}: names the card's key ${card.key}`);
      }
    }
    const we = k.workedExample;
    if (!we) continue;
    const S = `${k.skillId}/workedExample`;
    for (const l of ["hi", "en"]) { const n = d27Words(we.problem?.[l]); if (n > WORKED_PROBLEM_MAX) e.push(`${S}.problem${l === "en" ? " (en)" : ""}: ${n} words > ${WORKED_PROBLEM_MAX}`); }
    const steps = we.steps ?? [];
    steps.forEach((x, j) => { const n = d27Words(toldStepText(x)); if (n > TOLD_STEP_MAX) e.push(`${S}.steps[${j}]: told, ${n} words > ${TOLD_STEP_MAX}`); });
    if (steps.length >= 2 && !steps.some((x) => x.ask)) e.push(`${S}: a worked example of ${steps.length} steps asks the child at least one step (steps[].ask, dc-r8-director27)`);
    steps.forEach((x, j) => {
      if (!x.ask) return;
      const at = `${S}.steps[${j}].ask`;
      if (!keyed(x.ask, at, { promptMax: ASK_PROMPT_MAX, lineField: "right", lineMax: ASK_RIGHT_MAX })) return;
      const y = we.yourStep;
      if (y && [x.ask.key, ...(x.ask.accept ?? [])].some((a) => [y.key, ...(y.accept ?? [])].some((b) => same(a, b)))) e.push(`${at}: its key is the child's own step's (${y.key}): ask another step`);
      if (y) for (const l of ["hi", "en"]) if (has(x.ask.right?.[l] ?? "", [y.key])) e.push(`${at}.right${l === "en" ? " (en)" : ""}: gives the child's own step's answer ${y.key}`);
      // (its answer is this step's result)
      if (!has(String(x.result), [x.ask.key, ...(x.ask.accept ?? [])])) e.push(`${at}: its key is not this step's result ("${x.result}")`);
    });
    // (the problem is said with what follows it up to the first question: a step's ask, else the child's own step)
    const first = steps.findIndex((x) => x.ask);
    const lead = Math.max(0, ...(s.joints?.beforeWorked ?? []).map((f) => d27Words(f?.hi)));
    const told = (first < 0 ? steps : steps.slice(0, first)).reduce((n, x) => n + d27Words(toldStepText(x)), 0);
    const q = first < 0 ? we.yourStep?.prompt?.hi : steps[first].ask?.prompt?.hi;
    const open = lead + d27Words(we.problem?.hi) + told + d27Words(q);
    if (open > WORKED_OPEN_MAX) e.push(`${S}: the lead-in, the problem${told ? ", the told steps" : ""} and the first question are ${open} words > ${WORKED_OPEN_MAX}`);
  }
  for (const l of ["hi", "en"]) for (const c of sentencesOf(s.wrap?.covered?.[l])) if (d27Words(c) > COVERED_MAX) e.push(`wrap.covered${l === "en" ? " (en)" : ""}: "${c.slice(0, 30)}…" ${d27Words(c)} words > ${COVERED_MAX}`);
  for (const k of s.skills ?? []) for (const l of ["hi", "en"]) if (k.covered && d27Words(k.covered[l]) > COVERED_MAX) e.push(`${k.skillId}.covered${l === "en" ? " (en)" : ""}: ${d27Words(k.covered[l])} words > ${COVERED_MAX}`);
  const j = s.joints ?? {};
  const TASTE = /\b(mujhe|mera|meri|mere|achha laga|achha lagta|maza aaya|pasand|i like|i loved|i enjoyed|i feel|i'm (?:happy|sad|glad|proud))\b/i;
  const PROMISE = /\b(zaroor|pakka|promise|wada|vaada|kal|tomorrow|surely|i will|main\s+\w+\s+(?:dungi|karungi|aaungi))\b/i;
  for (const [kind, n] of [["afterKeyReturn", 3], ["tiredBye", 2]]) {
    const forms = j[kind];
    if (!Array.isArray(forms) || forms.length < n) { e.push(`joints.${kind}: ${n} forms (got ${Array.isArray(forms) ? forms.length : 0}; dc-r8-director27)`); continue; }
    const seen = new Set();
    forms.forEach((f, i) => { for (const l of ["hi", "en"]) {
      const t = String(f?.[l] ?? "").trim(), at = `joints.${kind}[${i}]${l === "en" ? " (en)" : ""}`;
      if (!t) { e.push(`${at}: empty`); continue; }
      if (sentencesOf(t).length !== 1) e.push(`${at}: one sentence`);
      if (/[?？]/.test(t)) e.push(`${at}: asks nothing`);
      if (d27Words(t) > JOINT_MAX_WORDS) e.push(`${at}: ${d27Words(t)} words > ${JOINT_MAX_WORDS}`);
      if (/\{[^}]*\}/.test(t)) e.push(`${at}: no slot`);
      if (TASTE.test(t)) e.push(`${at}: no claim of taste or feeling ("${t.match(TASTE)[0]}")`);
      if (l === "hi") { const x = d27Norm(t); if (seen.has(x)) e.push(`${at}: the same form twice`); seen.add(x); }
      if (kind === "afterKeyReturn") {
        if (!/\b(phir|dobara|fir|again)\b/i.test(t)) e.push(`${at}: says this will come again`);
        if (!/\b(pichhl\w*|pehle wal\w*|wapas|earlier|back)\b/i.test(t)) e.push(`${at}: says they go back to the earlier question`);
      }
      if (kind === "tiredBye") {
        if (PROMISE.test(t)) e.push(`${at}: promises nothing ("${t.match(PROMISE)[0]}")`);
        if (!/\b(thak|thaka|thaki|thakaan|thakna|tired|aaram|rest)\w*/i.test(t)) e.push(`${at}: speaks to her being tired`);
        if (/\b(bye|alvida|phir milenge|phir milte|goodbye|see you)\b/i.test(t)) e.push(`${at}: the goodbye is its own line; this one comes before it`);
      }
    } });
  }
  return e;
}

/** dc-r8-director27, Brain 043 (two script fields; the walk uses them in the same order): a right answer goes on.
 *  - `whyShort` { hi, en } beside a card's `why` (an explain card, a remediation's follow-up card, a check; not the closing question, not
 *    the worked example's own card): the why cut to its core, 10 words or fewer, said in the why's place after a right verdict when the
 *    why and what comes next do not fit in one turn. Every number in it is in the card's prompt, key or why; it asks nothing and does not
 *    open on "kyunki" (the walk joins it to the verdict as it joins a why). A card with a why and no whyShort is a compile hole, never an
 *    error here (the staged scripts have none and walk as before).
 *  - `joints.workedInvite`: three forms, each one question of 10 words or fewer that invites the child to do the next problem together —
 *    said where a right verdict stands alone before a worked example. No promise, no praise, no slot.
 *  The rules apply to any script that has the fields. */
export const D28_JOINTS = ["workedInvite"];
export const WHY_SHORT_MAX = 10, INVITE_MAX = 10;
export function d28Errors(s) {
  const e = [];
  const said = (x) => (x && typeof x === "object" ? String(x.hi ?? "") : String(x ?? ""));
  const nums = (t) => new Set((String(t ?? "").replace(/₹/g, " ").match(/\d+(?:[./]\d+)?/g) ?? []));
  const PRAISE = /\b(shabash|bahut\s+(?:achha|badhiya)|well\s+done|great|good\s+job|wah|kamaal|super|excellent|badhiya)\b/i;
  const PROMISE = /\b(zaroor|pakka|promise|wada|vaada|surely|i will|i'll|main\s+\w+\s+(?:dungi|karungi|aaungi))\b/i;
  for (const k of s.skills ?? []) {
    const cards = [...(k.explain ?? []).filter((b) => b.ask).map((b) => [`${k.skillId}/${b.id}.ask`, b.ask]),
      ...(k.remediation ?? []).map((r, i) => [`${k.skillId}/remediation[${i}].then`, r.then]).filter(([, c]) => c && typeof c === "object"),
      ...(k.checks ?? []).map((c) => [`${k.skillId}/${c.id}`, c])];
    for (const [where, c] of cards) {
      if (!c.whyShort) continue;
      const at = `${where}.whyShort`;
      if (!c.why) { e.push(`${at}: a card with no why has no short why`); continue; }
      if (typeof c.whyShort !== "object") { e.push(`${at}: { hi, en }`); continue; }
      const own = new Set([...nums(said(c.prompt)), ...nums(c.prompt?.en), ...nums(c.key), ...nums(said(c.why)), ...nums(c.why?.en), ...(c.accept ?? []).flatMap((a) => [...nums(a)])]);
      for (const l of ["hi", "en"]) {
        const t = String(c.whyShort?.[l] ?? "").trim(), a = `${at}${l === "en" ? " (en)" : ""}`;
        if (!t) { e.push(`${a}: empty`); continue; }
        const n = d27Words(t);
        if (n > WHY_SHORT_MAX) e.push(`${a}: ${n} words > ${WHY_SHORT_MAX}`);
        if (n >= d27Words(c.why?.[l])) e.push(`${a}: no shorter than the why (${n} words)`);
        for (const x of nums(t)) if (!own.has(x)) e.push(`${a}: states ${x}, which the card's prompt, key and why do not`);
        if (/[?？]/.test(t)) e.push(`${a}: asks nothing`);
        if (l === "hi" && /^\s*(?:kyunki|toh)\b/i.test(t)) e.push(`${a}: no leading "kyunki" or "toh" (the walk joins it to the verdict as it joins the why)`);
        if (l === "en" && /^\s*(?:because|so)\b/i.test(t)) e.push(`${a}: no leading "because" or "so"`);
        if (PRAISE.test(t)) e.push(`${a}: praises ("${t.match(PRAISE)[0]}"); the verdict before it is the praise`);
      }
    }
    const y = k.workedExample?.yourStep;
    if (y?.whyShort) e.push(`${k.skillId}/workedExample.yourStep.whyShort: the child's own step has no short why`);
  }
  if (s.teachback?.whyShort) e.push(`teachback.whyShort: the closing question has no short why`);
  const forms = s.joints?.workedInvite;
  if (forms != null) {
    if (!Array.isArray(forms) || forms.length !== 3) e.push(`joints.workedInvite: 3 forms (got ${Array.isArray(forms) ? forms.length : 0}; Brain 043 R2)`);
    else {
      for (const l of ["hi", "en"]) {
        const seen = new Set();
        forms.forEach((f, i) => {
          const t = String(f?.[l] ?? "").trim(), at = `joints.workedInvite[${i}]${l === "en" ? " (en)" : ""}`;
          if (!t) { e.push(`${at}: empty`); return; }
          if (d27Words(t) > INVITE_MAX) e.push(`${at}: ${d27Words(t)} words > ${INVITE_MAX}`);
          if (sentencesOf(t).length !== 1 || !/[?？]$/.test(t) || (t.match(/[?？]/g) ?? []).length !== 1) e.push(`${at}: one question, ending on it`);
          if (/\{[^}]*\}/.test(t)) e.push(`${at}: no slot`);
          if (/\d/.test(t)) e.push(`${at}: no number`);
          if (PRAISE.test(t)) e.push(`${at}: no praise ("${t.match(PRAISE)[0]}")`);
          if (PROMISE.test(t)) e.push(`${at}: no promise ("${t.match(PROMISE)[0]}")`);
          if (!/\b(saath|milkar|together)\b/i.test(t)) e.push(`${at}: invites the child to do it together`);
          const x = d27Norm(t); if (seen.has(x)) e.push(`${at}: the same form twice`); seen.add(x);
        });
      }
    }
  }
  return e;
}

/** dc-r8-director28, Learning 017 (the walk's side is Brain 044): a point and its card share a turn again; quick questions and the
 *  invitation go; worked examples ask the reasoning step. Word counts are of the `hi` text (d27Words).
 *  A. Fit, the parts that share a turn:
 *   1. each hook slot 20 words or fewer, one or two sentences; hook + the skill's first point + its card 75 or fewer;
 *   2. every later point + its card 61 or fewer;
 *   (a beat over its limit is an error unless it keeps a `quick`: the script's record that the pair could not be cut, B.2)
 *   3. a remediation's `say` + its follow-up card 49 or fewer: MEASURED AND REPORTED, never failed (where it cannot be cut it stays
 *      whole and the walk says it alone, ending on a check-in: fitReport lists it);
 *   4. a worked example's opening, from the problem's first word to the end of its first question (an asked step, else the child's
 *      own step), 53 or fewer; at most one told step stands between, and it is 10 words or fewer as told.
 *  B. A `quick` is an error on a beat that fits; on a beat that does not, its key and every accepted form are not in the point.
 *  D. An asked step and the child's own step never ask a bare sum ("24 + 18 kitna?", "Pehle 7 aur 9 jodo", "2 × 42 kitna hoga?"):
 *     the asked step is where the child decides what to do, and the arithmetic may be told.
 *  E. `joints.stepMiss`: three forms of 4 words or fewer, each saying the answer was not it, naming no answer, asking nothing.
 *     `joints.workedInvite` is gone.
 *  The rules apply to the scripts under 017 (D29_PILOTS); the staged scripts are reported by the compile report, not failed here. */
// (dc-r8-director31 item 10: every live script — the four pilots and c5-maths-ch02-t03, live as judged; director32: c6-maths-ch07-t01)
export const D29_PILOTS = ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c6-maths-ch06-t01", "c5-maths-ch02-t03", "c6-maths-ch07-t01"];
export const D29_JOINTS = ["stepMiss", "startAnyway", "afterPark"];
export const HOOK_MAX = 20, FIRST_TURN_MAX = 75, POINT_CARD_MAX = 61, REM_CARD_MAX = 49, WORKED_OPENING_MAX = 53, BETWEEN_TOLD_MAX = 10, STEP_MISS_MAX = 4;
export function isD29(s) { return D29_PILOTS.includes(s?.topicId) || STANDARD_STAGED.includes(s?.topicId); }
/** The fit of every pair that shares a turn, measured (A.1 to A.4). */
export function fitOf(s) {
  const W = (x) => d27Words(x?.hi);
  const hooks = [], points = [], rems = [], worked = [];
  for (const k of s?.skills ?? []) {
    const ex = k.explain ?? [], e1 = ex[0];
    for (const [i, sl] of (k.hook?.interestSlots ?? []).entries()) {
      const hook = W(sl.use), point = W(e1?.point), card = W(e1?.ask?.prompt);
      hooks.push({ skill: k.skillId, slot: i, interest: sl.interest, hook, sentences: sentencesOf(sl.use?.hi).length, point, card, total: hook + point + card });
    }
    ex.forEach((b, j) => {
      const point = W(b.point), card = W(b.ask?.prompt);
      const first = j === 0;
      const total = first ? Math.max(0, ...hooks.filter((h) => h.skill === k.skillId).map((h) => h.total)) : point + card;
      points.push({ skill: k.skillId, id: b.id, first, point, card, total, limit: first ? FIRST_TURN_MAX : POINT_CARD_MAX, quick: !!b.quick });
    });
    (k.remediation ?? []).forEach((r, i) => {
      const say = W(r.say), then = W(r.then?.prompt), alt = r.sayAlt ? W(r.sayAlt) : null;
      rems.push({ skill: k.skillId, i, targets: r.targets, say, then, total: say + then, alt: alt == null ? null : alt + then });
    });
    const we = k.workedExample;
    if (we) {
      const steps = we.steps ?? [], f = steps.findIndex((x) => x.ask);
      const between = (f < 0 ? steps : steps.slice(0, f)).map((x) => d27Words(toldStepText(x)));
      const q = f < 0 ? we.yourStep?.prompt : steps[f].ask?.prompt;
      const problem = W(we.problem), question = W(q);
      worked.push({ skill: k.skillId, problem, between, question, total: problem + between.reduce((a, b) => a + b, 0) + question, asked: f < 0 ? "yourStep" : `steps[${f}]` });
    }
  }
  return { hooks, points, rems, worked };
}
/** A bare sum asked: two numbers joined by an operator, or "<n> aur <n> jodo / guna karo". */
const SUM_ASKED = /\d\s*[+×*÷−]\s*\d|\d\s+x\s+\d|\b\d+\s+(?:aur|and)\s+\d+\s+(?:jodo|guna|ghatao|add|multiply)/i;
export function d29Errors(s) {
  if (!isD29(s)) return [];
  const e = [], fit = fitOf(s);
  const has = (t, forms) => { const n = ` ${d27Norm(t)} `; return forms.some((f) => { const x = d27Norm(f); return x && n.includes(` ${x} `); }); };
  for (const h of fit.hooks) {
    const at = `${h.skill}/hook.slot${h.slot}`;
    if (h.hook > HOOK_MAX) e.push(`${at}: ${h.hook} words > ${HOOK_MAX} (Learning 017 A.1: one or two sentences that set the scene)`);
    if (h.sentences < 1 || h.sentences > 2) e.push(`${at}: one or two sentences (${h.sentences})`);
  }
  const skills = new Map((s.skills ?? []).map((k) => [k.skillId, k]));
  for (const p of fit.points) {
    const b = (skills.get(p.skill)?.explain ?? []).find((x) => x.id === p.id);
    const at = `${p.skill}/${p.id}`, over = p.total > p.limit;
    const what = p.first ? "the hook, the first point and its card" : "the point and its card";
    if (over && !p.quick) e.push(`${at}: ${what} are ${p.total} words > ${p.limit} (Learning 017 A.${p.first ? 1 : 2}): cut the point, not the card's givens; a pair that cannot be cut keeps a quick question (B.2) and is listed in docs/status/learning.md`);
    if (!over && p.quick) e.push(`${at}.quick: ${what} fit one turn (${p.total} ≤ ${p.limit}): no quick question (Learning 017 B.1)`);
    if (b?.quick) {
      const forms = [b.quick.key, ...(b.quick.accept ?? [])].filter(Boolean);
      for (const l of ["hi", "en"]) for (const f of forms) if (has(b.point?.[l] ?? "", [f])) e.push(`${at}.quick${l === "en" ? " (en)" : ""}: "${f}" is in the point: the child applies the point to something it did not say (Learning 017 B.2)`);
    }
  }
  for (const w of fit.worked) {
    const at = `${w.skill}/workedExample`;
    if (w.total > WORKED_OPENING_MAX) e.push(`${at}: the problem${w.between.length ? ", the told steps" : ""} and the first question (${w.asked}) are ${w.total} words > ${WORKED_OPENING_MAX} (Learning 017 A.4)`);
    if (w.between.length > 1) e.push(`${at}: ${w.between.length} told steps before the first question; one at most (Learning 017 A.4)`);
    else if (w.between.length === 1 && w.between[0] > BETWEEN_TOLD_MAX) e.push(`${at}: the told step before the first question is ${w.between[0]} words > ${BETWEEN_TOLD_MAX} (Learning 017 A.4)`);
  }
  for (const k of s.skills ?? []) {
    const we = k.workedExample;
    if (!we) continue;
    (we.steps ?? []).forEach((x, j) => { for (const l of ["hi", "en"]) { const p = String(x.ask?.prompt?.[l] ?? ""); if (SUM_ASKED.test(p)) e.push(`${k.skillId}/workedExample.steps[${j}].ask.prompt${l === "en" ? " (en)" : ""}: asks a sum ("${p}"); ask the step where the child decides what to do, and tell the arithmetic (Learning 017 D.1)`); } });
    for (const l of ["hi", "en"]) { const p = String(we.yourStep?.prompt?.[l] ?? ""); if (SUM_ASKED.test(p)) e.push(`${k.skillId}/workedExample.yourStep.prompt${l === "en" ? " (en)" : ""}: hands the child the sum ("${p}"); her own step still needs thinking (Learning 017 D.2)`); }
  }
  const j = s.joints ?? {};
  if (j.workedInvite != null) e.push("joints.workedInvite: the invitation is gone (Learning 017 E.2)");
  const forms = j.stepMiss;
  if (!Array.isArray(forms) || forms.length !== 3) e.push(`joints.stepMiss: 3 forms (got ${Array.isArray(forms) ? forms.length : 0}; Learning 017 E.1)`);
  else for (const l of ["hi", "en"]) {
    const seen = new Set();
    forms.forEach((f, i) => {
      const t = String(f?.[l] ?? "").trim(), at = `joints.stepMiss[${i}]${l === "en" ? " (en)" : ""}`;
      if (!t) { e.push(`${at}: empty`); return; }
      if (d27Words(t) > STEP_MISS_MAX) e.push(`${at}: ${d27Words(t)} words > ${STEP_MISS_MAX}`);
      if (sentencesOf(t).length !== 1) e.push(`${at}: one sentence`);
      if (/[?？]/.test(t)) e.push(`${at}: asks nothing`);
      if (/\d|\{[^}]*\}/.test(t)) e.push(`${at}: names no answer (no number, no slot)`);
      if (!(l === "hi" ? /\b(nahi|nahin|na)\b/i : /\b(no|not|isn't|wrong)\b/i).test(t)) e.push(`${at}: says the answer was not it`);
      const x = d27Norm(t); if (seen.has(x)) e.push(`${at}: the same form twice`); seen.add(x);
    });
  }
  return e;
}
/** Learning 017's fit, as lines for the checker's report and the status file (A.3 is measured here, never failed). */
export function fitReport(s) {
  const f = fitOf(s), out = [];
  for (const h of f.hooks) out.push(`hook ${h.skill.replace(/^.*-/, "")} slot${h.slot} (${h.interest}): hook ${h.hook} + first point ${h.point} + card ${h.card} = ${h.total}/${FIRST_TURN_MAX}${h.hook > HOOK_MAX ? `, hook over ${HOOK_MAX}` : ""}${h.total > FIRST_TURN_MAX ? " OVER" : ""}`);
  for (const p of f.points.filter((x) => !x.first)) out.push(`point ${p.skill.replace(/^.*-/, "")} ${p.id}: ${p.point} + card ${p.card} = ${p.total}/${POINT_CARD_MAX}${p.quick ? " (keeps quick)" : ""}${p.total > POINT_CARD_MAX ? " OVER" : ""}`);
  for (const r of f.rems) out.push(`remediation ${r.skill.replace(/^.*-/, "")}[${r.i}]: say ${r.say} + card ${r.then} = ${r.total}/${REM_CARD_MAX}${r.total > REM_CARD_MAX ? " WHOLE (said alone)" : ""}${r.alt != null ? `; sayAlt + card ${r.alt}` : ""}`);
  for (const w of f.worked) out.push(`worked ${w.skill.replace(/^.*-/, "")}: problem ${w.problem}${w.between.length ? ` + told ${w.between.join("+")}` : ""} + first question ${w.question} (${w.asked}) = ${w.total}/${WORKED_OPENING_MAX}${w.total > WORKED_OPENING_MAX ? " OVER" : ""}`);
  return out;
}

/** Learning 018 (dc-r8-director29 item 9): captions read against the view that is drawn, written to be said.
 *  A.1 Every `viewCaption` (and `answerViewCaption`) is true of the view drawn for its board: a caption that names a line, a
 *      strip, a circle or a grid fails when neither the view pictureTurn draws beside the board nor the held board itself is
 *      that kind (the held board stays up as the split's left panel, so naming it is true).
 *  A.2 A worked example's caption names no asked step's answer (nor the child's own step's, while the worked board is still up
 *      for it), in digits or in words: the key and every accepted form, number words read as digits; a form the problem
 *      itself states is a given, not an answer.
 *  A.3 `answerViewCaption` { hi, en } beside the `answerBoard` of every remediation follow-up card and every check whose
 *      answer board has a second view: one or two sentences, asking nothing, said after the key (it may name it). Where the
 *      answer board has no second view there is none (listed on the F lines).
 *  C.1 `joints.startAnyway`: three forms of 6 words or fewer, said after a second "aap batao" at the greeting: no question.
 *  C.2 The park forms (`joints.asidePark`) promise the return and nothing else (d22's rule stands); the turn goes on into the
 *      live part through `joints.afterPark`: three forms of 8 words or fewer that lead back to the work, asking nothing.
 *  "Said beats fitted": a remediation over REM_CARD_MAX with its card fails unless it is listed in REM_WHOLE (topic, skill,
 *  remediation target) with its reason; the walk says a listed one alone, ending on its check-in. */
export const START_ANYWAY_MAX = 6, AFTER_PARK_MAX = 8;
export const REM_WHOLE = [
  // (Learning 018, 2026-11-18: each was a note when cut to 49 — director29's judges named three of them — and is said whole now)
  { topicId: "c5-maths-ch02-t01", skillId: "c5-maths-ch02-t01-s3", targets: "c5-maths-ch02-t01-m-whole-number-bias",
    reason: "two sentences: the same top number means the same gaps walked; the bigger bottom number means shorter gaps, so less far (cut to fit it read \"Neeche wala bada, toh har gap chhota\")" },
  { topicId: "c5-maths-ch02-t01", skillId: "c5-maths-ch02-t01-s3", targets: "c5-maths-ch02-t01-m-not-numbers",
    reason: "the train needs the stations, the gaps between them and what goes on top and below, said as a teacher says it (director29 c5-t01 steady 84: \"Train ka number ek fraction: upar gine gaps, neeche 5\")" },
  { topicId: "c5-maths-ch02-t02", skillId: "c5-maths-ch02-t02-s2", targets: "c5-maths-ch02-t02-m-same-bottom-equal",
    reason: "the two rotis, what was taken from each and why equal parts let the count decide: three sentences against a 25-word card" },
  { topicId: "c5-maths-ch02-t02", skillId: "c5-maths-ch02-t02-s2", targets: "c5-maths-ch02-t02-m-tops-only",
    reason: "the judge's named note (\"3 wali ka ek hissa 9 wali ke teen jitna; 9 wali ke 2 usse chhote\"): one part of the 3 strip against three of the 9, and so two of the 9 are less" },
  { topicId: "c5-maths-ch02-t02", skillId: "c5-maths-ch02-t02-s3", targets: "c5-maths-ch02-t02-m-tops-only",
    reason: "the bigger part first, then the same count coloured: two steps, each a sentence, against a 25-word card" },
  // (Learning 019, 2026-11-18: director30's judge heard it end without its conclusion, offtopic 82)
  { topicId: "c5-maths-ch02-t02", skillId: "c5-maths-ch02-t02-s2", targets: "c5-maths-ch02-t02-m-gap-thinking",
    reason: "the two strips with their counts, how much of each is empty, and the conclusion it lacked (director30 c5-t02 offtopic 82): the counts keep its board drawn, and with them it cannot end on its conclusion inside 49 with its 25-word card" },
];
export const remWhole = (topicId, skillId, targets) => REM_WHOLE.find((x) => x.topicId === topicId && x.skillId === skillId && x.targets === targets) ?? null;
export const VIEW_KIND_WORDS = {
  line: /\b(number line|line|lines|rekha|rekhayein|rekhaon)\b/i,
  strip: /\b(patti|pattiyan|pattiyaan|pattiyon|strip|strips|bar|bars)\b/i,
  circle: /\b(circle|circles|gol|gola|golon)\b/i,
  grid: /\b(jaal|grid|grids)\b/i,
};
/** The kind of a board or of a drawn view's call: line, strip, circle, grid, or figure (a shape, a word board). */
export function boardKind(ref) {
  if (!ref?.template) return null;
  const t = ref.template, p = ref.params ?? ref;
  // (Studio 014: a line's wholes as strips end to end are strips — pattiyan)
  if (t === "fraction-line@1" && p.as === "strips") return "strip";
  if (t === "fraction-line@1" || t === "unrolled@1" || t === "number-line-hop@1") return "line";
  if (t === "fraction-bars@1") return "strip";
  if (t === "fraction-parts@1") return p.whole === "bar" ? "strip" : "circle";
  if (t === "wholes@1") return p.as === "bar" ? "strip" : "circle";
  if (t === "shade-grid@1" || t === "equal-groups@1") return "grid";
  // (Studio 014: a compare table's to-scale view is bars — pattiyan)
  if (t === "compare@1" && p.scale === true) return "strip";
  return "figure";
}
/** The second view a picture turn draws beside `ref` (pictureTurn, as tests/r8-picture-turn holds it): { template, view, kind } or null. */
export function viewOf(ref, at = "x") {
  const ask = { intent: { intentId: `l018:${at}`, lessonId: "l018", kind: "whiteboard", style: { band: "B3" }, boardRef: ref,
    scriptBeat: { kind: "check", ownBoard: true, answers: [] }, held: { board: ref, unit: at }, request: { kind: "show" } }, line: { text: "" }, mode: "fresh" };
  const v = pictureTurn(ask, {})?.view;
  return v ? { template: v.template, view: v.view, kind: boardKind(v.call) } : null;
}
/** The kinds a caption names that are neither the drawn view's nor the held board's. */
export function wrongKinds(text, viewKind, heldKind) {
  return Object.keys(VIEW_KIND_WORDS).filter((k) => VIEW_KIND_WORDS[k].test(String(text ?? "")) && k !== viewKind && k !== heldKind);
}
const NUM_W = { ek: 1, one: 1, do: 2, two: 2, teen: 3, three: 3, chaar: 4, char: 4, four: 4, paanch: 5, five: 5, chhah: 6, chhe: 6, six: 6, saat: 7, seven: 7, aath: 8, eight: 8, nau: 9, nine: 9, das: 10, ten: 10 };
const l018Norm = (t) => ` ${d27Norm(t).split(" ").map((w) => NUM_W[w] ?? w).join(" ")} `;
/** The asked step's answer forms a worked caption names (A.2). */
export function workedCaptionHits(we) {
  const out = [], given = l018Norm(`${we?.problem?.hi ?? ""} ${we?.problem?.en ?? ""}`);
  const asked = (we?.steps ?? []).map((st, j) => [`steps[${j}].ask`, st.ask]).filter(([, a]) => a);
  if (we?.yourStep && !we.yourStep.board) asked.push(["yourStep", we.yourStep]);
  for (const l of ["hi", "en"]) {
    const c = we?.viewCaption?.[l]; if (!c) continue;
    const cap = l018Norm(c);
    for (const [at, a] of asked) for (const f of [a.key, ...(a.accept ?? [])].filter((x) => x != null)) {
      const x = l018Norm(f).trim();
      if (!x || given.includes(` ${x} `)) continue;
      if (cap.includes(` ${x} `)) { out.push({ l, at, form: String(f) }); break; }
    }
  }
  return out;
}
/** Every board with its caption, and every answer board, with the view drawn for it. */
export function captionViews(s) {
  const out = [];
  const walk = (o, p) => {
    if (Array.isArray(o)) return o.forEach((y, i) => walk(y, `${p}[${i}]`));
    if (!o || typeof o !== "object") return;
    for (const [bk, ck] of [["board", "viewCaption"], ["answerBoard", "answerViewCaption"]]) if (o[bk]?.template)
      out.push({ at: `${p}.${bk}`, cap: ck, ref: o[bk], caption: o[ck] ?? null, view: viewOf(o[bk], `${p}.${bk}`), held: boardKind(o[bk]), owner: o });
    for (const [k, v] of Object.entries(o)) if (!["board", "answerBoard", "bridgeBoard"].includes(k)) walk(v, p ? `${p}.${k}` : k);
  };
  (s?.skills ?? []).forEach((k, i) => walk(k, `skills[${i}]`));
  if (s?.teachback) walk(s.teachback, "teachback");
  return out;
}
/** The follow-up cards and checks (A.3), each with its answer board's view. */
export function answerCards(s) {
  const out = [];
  (s?.skills ?? []).forEach((k, i) => {
    for (const c of k.checks ?? []) out.push({ at: `skills[${i}].${c.id}`, skillId: k.skillId, card: c });
    (k.remediation ?? []).forEach((r, j) => { if (r.then) out.push({ at: `skills[${i}].remediation[${j}].then`, skillId: k.skillId, card: r.then }); });
  });
  for (const x of out) x.view = x.card.answerBoard?.template ? viewOf(x.card.answerBoard, x.at) : null;
  return out;
}
export function d30Errors(s) {
  if (!isD29(s)) return [];
  const e = [];
  for (const b of captionViews(s)) {
    if (!b.caption) continue;
    for (const l of ["hi", "en"]) {
      const bad = wrongKinds(b.caption[l], b.view?.kind ?? null, b.held);
      if (bad.length) e.push(`${b.at.replace(/\.(answer)?[bB]oard$/, "")}.${b.cap}${l === "en" ? " (en)" : ""}: names a ${bad.join(" and a ")}, but the view drawn is ${b.view ? `a ${b.view.kind} (${b.view.view})` : "none"} over a ${b.held} board (Learning 018 A.1)`);
    }
  }
  (s.skills ?? []).forEach((k, i) => { for (const h of workedCaptionHits(k.workedExample)) e.push(`skills[${i}].workedExample.viewCaption${h.l === "en" ? " (en)" : ""}: names ${h.at}'s answer "${h.form}" (Learning 018 A.2)`); });
  for (const x of answerCards(s)) {
    const c = x.card.answerViewCaption, at = `${x.at}.answerViewCaption`;
    if (x.view && !c) { e.push(`${at}: what to look at in the answer board's picture, said after the key (Learning 018 A.3)`); continue; }
    if (!x.view && c) { e.push(`${at}: the answer board has no second view; write none (Learning 018 A.3)`); continue; }
    if (!c) continue;
    for (const l of ["hi", "en"]) {
      const t = String(c[l] ?? "").trim(), a = `${at}${l === "en" ? " (en)" : ""}`;
      if (!t) { e.push(`${a}: empty`); continue; }
      const n = sentencesOf(t).length;
      if (n < 1 || n > 2) e.push(`${a}: one or two sentences (got ${n})`);
      if (/[?？]/.test(t)) e.push(`${a}: asks nothing`);
    }
  }
  for (const [name, max, rule] of [["startAnyway", START_ANYWAY_MAX, "C.1"], ["afterPark", AFTER_PARK_MAX, "C.2"]]) {
  const forms = s.joints?.[name];
  if (!Array.isArray(forms) || forms.length !== 3) e.push(`joints.${name}: 3 forms (got ${Array.isArray(forms) ? forms.length : 0}; Learning 018 ${rule})`);
  else for (const l of ["hi", "en"]) {
    const seen = new Set();
    forms.forEach((f, i) => {
      const t = String(f?.[l] ?? "").trim(), at = `joints.${name}[${i}]${l === "en" ? " (en)" : ""}`;
      if (!t) { e.push(`${at}: empty`); return; }
      if (d27Words(t) > max) e.push(`${at}: ${d27Words(t)} words > ${max}`);
      if (/[?？]/.test(t)) e.push(`${at}: asks nothing`);
      if (/\d|\{[^}]*\}/.test(t)) e.push(`${at}: no number, no slot`);
      const x = d27Norm(t); if (seen.has(x)) e.push(`${at}: the same form twice`); seen.add(x);
    });
  }
  }
  for (const r of fitOf(s).rems) if (r.total > REM_CARD_MAX && !remWhole(s.topicId, r.skill, r.targets))
    e.push(`${r.skill}/remediation[${r.i}]: say and card are ${r.total} words > ${REM_CARD_MAX}: cut it, or, where it cannot be said in full sentences inside the limit, list it in REM_WHOLE with its reason (Learning 018, said beats fitted)`);
  for (const w of REM_WHOLE) if (w.topicId === s.topicId && !fitOf(s).rems.some((r) => r.skill === w.skillId && r.targets === w.targets && r.total > REM_CARD_MAX))
    e.push(`REM_WHOLE ${w.skillId} ${w.targets}: listed but fits (or is gone); take it off the list`);
  return e;
}
/** Learning 018's lines for the F report: the captions' views, the answer boards with no second view, the remediations left whole. */
export function d30Report(s) {
  const out = [], cv = captionViews(s).filter((b) => b.cap === "viewCaption" && b.caption);
  out.push(`captions: ${cv.length} read against their view (${cv.filter((b) => b.view).length} with a second view, ${cv.filter((b) => !b.view).length} held board only)`);
  const ac = answerCards(s);
  out.push(`answerViewCaption: ${ac.filter((x) => x.card.answerViewCaption).length} of ${ac.filter((x) => x.view).length} answer boards with a second view`);
  for (const x of ac.filter((y) => !y.view)) out.push(`answer board with no second view (no answerViewCaption): ${x.at}${x.card.answerBoard ? ` (${x.card.answerBoard.template})` : " (none)"}`);
  for (const r of fitOf(s).rems) { const w = remWhole(s.topicId, r.skill, r.targets); if (w) out.push(`remediation ${r.skill.replace(/^.*-/, "")}[${r.i}] left whole (${r.total}/${REM_CARD_MAX}): ${w.reason}`); }
  return out;
}

/** Learning 019 (dc-r8-director30 items 2, 5's joint, 6): the plain-Hindi form of every card, the worked close's seam, easier
 *  wordings that lead to a step without stating it, the wrap's one "achha laga", and the read of what changed since a run.
 *  A.1 `hindi` { hi, en } beside the `prompt` of every card the child answers: an explain card, a remediation's follow-up card,
 *      a check, an asked worked step, the worked example's own step and the closing question. The same question with the same
 *      givens and the same key, in the Hindi a child of that class uses at home: English stays only where it is the school's word
 *      for the thing (fraction, line, rectangle, the units), never an English connective or verb. One or two sentences ending
 *      on the question. Every number and slot of the prompt and no other; no key or accepted form the prompt does not state
 *      (a yes and a no offered together are a choice, not an answer). Said when a child asks for Hindi (Brain 046 Q2).
 *  A.2 `joints.afterWorked`: three forms of 6 words or fewer, said between a worked example's close and the next card; they ask
 *      nothing, name no number and carry no slot.
 *  A.3 An asked step's `simpler` (and the child's own step's) never contains the step's answer: its key and every accepted form,
 *      in words or digits, number words read as digits; a form the problem itself states is a given.
 *  A.4 `--since <rev>` lists every point, remediation, card and worked example whose spoken text changed since <rev>, with its
 *      board (and a card's key), so main reads each against its board before a run (changedParts).
 *  B   (all four) The wrap says "achha laga" once at most: no `wrap.ack` form says it, and one form at most across the wrap's
 *      ack, ask and goodbye. (c5-t01) A card whose `accept` holds an equal fraction in other numbers says in its `why` that the
 *      two are the same: the why names the other form. */
export const AFTER_WORKED_MAX = 6;
/** Scripts outside the live ones held to the pilots' standard (Learning 019 Part 2): the staged batch, still staged
 *  (c5-maths-ch02-t03 left it for D29_PILOTS when it went live, dc-r8-director31 item 10; c6-maths-ch07-t01 in director32). */
export const STANDARD_STAGED = ["c4-maths-ch01-t02"];
/** English words that have a plain Hindi word a child uses at home (Learning 019 A.1): never in a `hindi` form's hi. */
export const HINDI_FORM_ENGLISH = /\b(and|or|but|so|the|are|was|were|of|what|which|who|how|many|much|equal|equally|part|parts|piece|pieces|colou?r|colou?red|shaded?|same|total|left|count|whole|half|bigger|smaller|biggest|smallest|more|less|than|answer|find|first|second|third|then|now|yes|right|wrong|side|sides|length|breadth|width|cost|times|each|every|between|after|before|top|bottom|distance|share|shared|divide|divided|add|subtract|multiply|correct|think|tell|cut|eat|ate|eaten|take|took|give|gave|walk|walked|run|ran|fence|wire|round|rounds)\b/i;
/** Every card the child answers, with where it is (A.1). */
export function hindiCards(s) {
  const out = [];
  for (const k of s?.skills ?? []) {
    for (const b of k.explain ?? []) if (b.ask?.prompt) out.push({ at: `${k.skillId}/${b.id}.ask`, card: b.ask });
    (k.remediation ?? []).forEach((r, j) => { if (r.then?.prompt) out.push({ at: `${k.skillId}/remediation[${j}].then`, card: r.then }); });
    for (const c of k.checks ?? []) if (c.prompt) out.push({ at: `${k.skillId}/${c.id}`, card: c });
    const we = k.workedExample;
    (we?.steps ?? []).forEach((x, j) => { if (x.ask?.prompt) out.push({ at: `${k.skillId}/workedExample.steps[${j}].ask`, card: x.ask }); });
    if (we?.yourStep?.prompt) out.push({ at: `${k.skillId}/workedExample.yourStep`, card: we.yourStep });
  }
  if (s?.teachback?.prompt) out.push({ at: "teachback", card: s.teachback });
  return out;
}
const d31Nums = (t) => [...new Set(String(t ?? "").replace(/₹/g, " ").match(/\d+(?:[./]\d+)?/g) ?? [])].sort();
const d31Slots = (t) => [...new Set(String(t ?? "").match(/\{[a-zA-Z]+\}/g) ?? [])].sort();
const YES_W = /\b(haan|han|ha|yes|ji)\b/i, NO_W = /\b(nahi|nahin|na|no)\b/i;
/** A `hindi` form's faults (A.1). */
export function hindiFormErrors(card, at) {
  const e = [], h = card?.hindi, p = card?.prompt ?? {};
  if (!h || typeof h !== "object") return [`${at}.hindi: the question in the Hindi a child uses at home { hi, en } (Learning 019 A.1)`];
  for (const l of ["hi", "en"]) {
    const t = String(h[l] ?? "").trim(), a = `${at}.hindi${l === "en" ? " (en)" : ""}`;
    if (!t) { e.push(`${a}: empty`); continue; }
    const n = sentencesOf(t).length;
    if (n < 1 || n > 2) e.push(`${a}: one or two sentences (got ${n})`);
    if (!/[?？]\s*$/.test(t)) e.push(`${a}: ends on the question`);
    const want = d31Nums(p.hi), got = d31Nums(t);
    if (JSON.stringify(want) !== JSON.stringify(got)) e.push(`${a}: the numbers of the question exactly (question ${want.join(", ") || "none"}; form ${got.join(", ") || "none"})`);
    if (JSON.stringify(d31Slots(p.hi)) !== JSON.stringify(d31Slots(t))) e.push(`${a}: the question's slots exactly`);
  }
  const hi = String(h.hi ?? "");
  if (hi && d27Norm(hi) === d27Norm(p.hi)) e.push(`${at}.hindi: the same words as the card; say it in the Hindi a child uses at home`);
  const en = hi.match(HINDI_FORM_ENGLISH);
  if (en) e.push(`${at}.hindi: "${en[0]}" is English where a plain Hindi word exists (Learning 019 A.1)`);
  const H = l018Norm(hi), P = l018Norm(p.hi), choice = YES_W.test(hi) && NO_W.test(hi);
  for (const f of [card.key, ...(card.accept ?? [])].filter((x) => x != null)) {
    const x = l018Norm(f).trim();
    if (!x || P.includes(` ${x} `)) continue;
    if (choice && (YES_W.test(x) || NO_W.test(x)) && x.split(" ").length === 1) continue;
    if (H.includes(` ${x} `)) { e.push(`${at}.hindi: names the answer "${f}" that the question does not state (Learning 019 A.1)`); break; }
  }
  return e;
}
/** The asked steps' (and the own step's) easier wordings that state the step's answer (A.3). */
export function stepSimplerHits(we) {
  const out = [], given = l018Norm(`${we?.problem?.hi ?? ""} ${we?.problem?.en ?? ""}`);
  const asked = (we?.steps ?? []).map((st, j) => [`steps[${j}]`, st.ask, [st.simpler, st.ask?.simpler]]).filter(([, a]) => a);
  if (we?.yourStep) asked.push(["yourStep", we.yourStep, [we.yourStep.simpler]]);
  for (const [at, a, texts] of asked) for (const l of ["hi", "en"]) {
    const t = texts.map((x) => x?.[l]).filter(Boolean).join(" ");
    if (!t) continue;
    const T = l018Norm(t);
    for (const f of [a.key, ...(a.accept ?? [])].filter((x) => x != null)) {
      const x = l018Norm(f).trim();
      if (!x || given.includes(` ${x} `)) continue;
      if (T.includes(` ${x} `)) { out.push({ at, l, form: String(f) }); break; }
    }
  }
  return out;
}
const fracVal = (t) => {
  const x = String(t ?? "").trim(), m = x.match(/^(\d+)\s*\/\s*(\d+)$/), w = x.match(/^(\d+)\s+(?:aur\s+|and\s+)?(\d+)\s*\/\s*(\d+)$/);
  if (m && +m[2]) return [+m[1], +m[2]];
  return w && +w[3] ? [+w[1] * +w[3] + +w[2], +w[3]] : null;
};
/** The equal fractions in other numbers a card accepts (B, c5-t01). */
export function equalForms(card) {
  const k = fracVal(card?.key); if (!k) return [];
  return [...new Set((card.accept ?? []).map((a) => String(a).trim()).filter((a) => { const v = fracVal(a); return v && v[0] * k[1] === v[1] * k[0] && !(v[0] === k[0] && v[1] === k[1] && /^\d+\s*\/\s*\d+$/.test(a)); }))];
}
export function d31Errors(s) {
  if (!isD29(s)) return [];
  const e = [];
  // (Learning 020 rule 1: under d32 a card may have no `hindi` form — a hole the compile report lists; one that is present passes A.1)
  for (const { at, card } of hindiCards(s)) if (card.hindi || !isD32(s)) e.push(...hindiFormErrors(card, at));
  const forms = s.joints?.afterWorked;
  if (!Array.isArray(forms) || forms.length !== 3) e.push(`joints.afterWorked: 3 forms (got ${Array.isArray(forms) ? forms.length : 0}; Learning 019 A.2)`);
  else for (const l of ["hi", "en"]) {
    const seen = new Set();
    forms.forEach((f, i) => {
      const t = String(f?.[l] ?? "").trim(), at = `joints.afterWorked[${i}]${l === "en" ? " (en)" : ""}`;
      if (!t) { e.push(`${at}: empty`); return; }
      if (d27Words(t) > AFTER_WORKED_MAX) e.push(`${at}: ${d27Words(t)} words > ${AFTER_WORKED_MAX}`);
      if (sentencesOf(t).length !== 1) e.push(`${at}: one sentence`);
      if (/[?？]/.test(t)) e.push(`${at}: asks nothing`);
      if (/\d|\{[^}]*\}/.test(t)) e.push(`${at}: no number, no slot`);
      const x = d27Norm(t); if (seen.has(x)) e.push(`${at}: the same form twice`); seen.add(x);
    });
  }
  (s.skills ?? []).forEach((k) => { for (const h of stepSimplerHits(k.workedExample)) e.push(`${k.skillId}/workedExample.${h.at}.simpler${h.l === "en" ? " (en)" : ""}: states the step's answer "${h.form}"; say what to look at, not what is there (Learning 019 A.3)`); });
  const LAGA = /\b(achha|accha|acha)\s+laga\b/i, w = s.wrap ?? {};
  (w.ack ?? []).forEach((f, i) => { if (LAGA.test(String(f?.hi ?? ""))) e.push(`wrap.ack[${i}]: "achha laga" is the child's word here; the ack says it in other words (Learning 019 B)`); });
  const laga = [...(w.ack ?? []), ...(w.ask ?? []), w.goodbye].filter((f) => LAGA.test(String(f?.hi ?? ""))).length;
  if (laga > 1) e.push(`wrap: "achha laga" in ${laga} forms; one at most across ack, ask and goodbye (Learning 019 B)`);
  for (const { at, card } of hindiCards(s)) {
    const eq = equalForms(card); if (!eq.length || !card.why) continue;
    const dot = (t) => ` ${d27Norm(t).replace(/\.(?=\s|$)/g, "").trim()} `, n = dot(card.why.hi);
    if (!eq.some((f) => n.includes(dot(f)))) e.push(`${at}.why: accepts ${eq.join(", ")} for ${card.key}: say they are the same (name the other form) (Learning 019 B)`);
  }
  return e;
}
/** Learning 020 Part 1 (dc-r8-director31 items 1, 2's re-asks, 3's ends, 4, 5, 7's checker rules; docs/patches/to-learning/
 *  020-director31-hindi-rules-and-rewrites.md). The rule set `d32Errors` applies to a topic in D32_READY (each script's agent adds
 *  its topic when the script passes) or to every topic named with `--d32`; elsewhere every script checks as it did under 019.
 *  1  A `hindi` form is another sentence: it fails when more than HINDI_OVERLAP_MAX of its content words (numbers, fractions,
 *     slots, names, the script's `terms` and the function words dropped; a word's final vowels dropped, so "hua" and "hue" are
 *     one word) are in its card's prompt. "samkon" never, where `terms` has "right angle". A card may have no `hindi` form: it
 *     is a hole (the compile report lists it) and the walk gives that card's unsaid help.
 *  2  `joints.hindiSwitch` promises only Hindi: none of "aasaan", "seedhe", "doosre shabdon".
 *  3  A stated rule is true: no point, remediation, why, `covered` or wrap sentence says unequal pieces have no fraction name or
 *     that a fraction is named only when the parts are equal (RULE_FALSE). `--rules` prints every sentence of those fields with
 *     "tabhi", "sirf", "hamesha", "kabhi nahi", "nahi hota", a bare closing contrast (", guna nahi."), or an
 *     operation named with "sirf"/"nahi" as an R line for the independent reader (a listing, not an error; isRuleSentence).
 *  4  `reask` { hi, en } on every asked worked step and on the teachback: a second way of asking, ending on the question;
 *     `told` { hi, en } on every worked step: the sentence she says when she tells the step, asking nothing.
 *  5  No two cards of a script end on the same last sentence.
 *  6  The verdict, point and card turn: the previous card's `whyShort` (its `why` where there is none) + the point + the card ≤
 *     POINT_TURN_MAX words unless listed in POINT_WHOLE (two a script at most); the first teaching turn (the first skill's longest
 *     hook use, the longest `joints.startAnyway` form, its first point and card) ≤ FIRST_TEACH_MAX.
 *  7  A card, check, follow-up card, own step or asked step whose board has no second view (viewOf) has a `pictureBoard`
 *     { template, params } with a `pictureCaption` { hi, en }.
 *  8  `askWhole: true` on a card whose question asks for a change its board does not show: required on ASK_WHOLE_REQUIRED;
 *     `--rules` prints the candidates (A lines: "agar", "ek aur", "aur ek", "socho" in the prompt, no askWhole) for main.
 *  9  `whyAltAsHelp: true` only where `whyAlt` names neither the key nor an accepted form, nor one option of a two-way card.
 *  10 Every card's `simpler`, every `reask` and every step's easier wording never names the key or an accepted form the prompt
 *     does not state; on a two-way card (the prompt has "ya", or the accepted forms name both options) a wording that names one
 *     option and not the other fails.
 *  Also: no `wrap.ack` form says "yaad rakh" (a promise she cannot keep). */
export const D32_READY = ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c5-maths-ch02-t03", "c6-maths-ch06-t01",
  // (the two staged scripts rewritten for director32, each read cold by an independent reader and fixed)
  "c4-maths-ch01-t02", "c6-maths-ch07-t01"];
/** Rule 7 (a picture has something to draw): on for a topic listed here, with --d32, or when forced. Studio 014's views are in. */
export const D32_PICTURES_READY = ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c5-maths-ch02-t03", "c6-maths-ch06-t01",
  "c4-maths-ch01-t02", "c6-maths-ch07-t01"];
/** Cards with no honest drawing: any picture of the thing would draw the card's own answer. A picture request there gets the
 *  card's hint (to Brain 048 G5). Main lists each with its reason: { topicId, at, reason }. */
export const PICTURE_NONE = [
  { topicId: "c4-maths-ch05-t01", at: "c4-maths-ch05-t01-s2/workedExample.steps[0].ask", reason: "15 pencils into groups for 1/3: any drawing of the groups is the key (three equal groups)" },
  // (d33 two-pass read: the worked board's second view lays the sides in a line with "?" for their total, which is the step's answer; `noView`)
  { topicId: "c6-maths-ch06-t01", at: "c6-maths-ch06-t01-s1/workedExample.steps[0].ask", reason: "what to find first for the fence: the view totals the sides as \"?\", which is the key (the perimeter)" },
];
export const isD32 = (s) => D32_READY.includes(s?.topicId);
export const HINDI_OVERLAP_MAX = 0.5, POINT_TURN_MAX = 62, FIRST_TEACH_MAX = 75, POINT_WHOLE_PER_SCRIPT = 2;
/** Pairs said whole over POINT_TURN_MAX, each with its reason (as REM_WHOLE): { topicId, skillId, explainId, reason }. */
export const POINT_WHOLE = [];
/** Cards whose question asks for a change the board does not show (main confirms each from the A lines): { topicId, skillId, card }. */
export const ASK_WHOLE_REQUIRED = [
  // (director31 c4 stuck 18, steering 30: "ek aur tukda rang do" over a board that shows no change)
  { topicId: "c4-maths-ch05-t01", skillId: "c4-maths-ch05-t01-s1", card: "e3" },
];
const D32_STOP = new Set("hai hain ho hota hoti hote tha thi the ko ka ki ke mein me se par pe aur ya toh to kya yeh ye woh wo is us isme isko usko unka uska iska apna apni bhi sirf wala wali wale liye tak ne na nahi nahin ek do teen char chaar paanch jab agar ab phir hi kaun kaunsa kaunsi kaunse kitna kitni kitne kaise kyun".split(" "));
/** The names in a text: a capitalised word not at a sentence's start, and the friend pool. */
const namesIn = (t) => new Set(sentencesOf(t).flatMap((x) => x.split(/\s+/).slice(1).map((w) => w.replace(/[^\p{L}]/gu, "")).filter((w) => /^\p{Lu}\p{Ll}+$/u.test(w)).map((w) => w.toLowerCase())));
const contentWords = (t, drop) => String(t ?? "").toLowerCase().replace(/\{[a-zA-Z]+\}/g, " ").replace(/\d+(?:[./]\d+)?/g, " ").replace(/[^\p{L}\s]+/gu, " ")
  .split(/\s+/).filter((w) => w && !D32_STOP.has(w) && !drop.has(w)).map((w) => w.replace(/(?<=..)[aeiou]+$/, ""));
/** Rule 1's measure: the share of the form's content words that are in its card's prompt. */
export function hindiOverlap(card, s) {
  const p = card?.prompt?.hi ?? "", h = card?.hindi?.hi ?? "";
  const drop = new Set([...FRIEND_POOL, "Asha", "Riya"].map((x) => x.toLowerCase()));
  for (const x of s?.terms ?? []) for (const w of `${x.hi ?? ""} ${x.en ?? ""}`.toLowerCase().split(/[^\p{L}]+/u)) if (w) drop.add(w);
  for (const w of [...namesIn(p), ...namesIn(h)]) drop.add(w);
  const H = new Set(contentWords(h, drop)), P = new Set(contentWords(p, drop)), shared = [...H].filter((w) => P.has(w));
  return { form: H.size, prompt: P.size, shared: shared.length, share: H.size ? shared.length / H.size : 0, words: shared };
}
/** Every card the child answers with its board, the givens a hint may name, and a short id: [{ at, skillId, id, kind, card, board, given }]. */
export function d32Cards(s) {
  const out = [];
  for (const k of s?.skills ?? []) {
    const put = (id, kind, card, board, given = "") => out.push({ at: `${k.skillId}/${id}`, skillId: k.skillId, id, kind, card, board: board ?? null, given });
    for (const b of k.explain ?? []) if (b.ask?.prompt) put(b.id, "card", b.ask, b.ask.board ?? b.board);
    (k.remediation ?? []).forEach((r, j) => { if (r.then?.prompt) put(`remediation[${j}].then`, "follow-up", r.then, r.then.board ?? r.board); });
    for (const c of k.checks ?? []) if (c.prompt) put(c.id, "check", c, c.board);
    const we = k.workedExample, wg = `${we?.problem?.hi ?? ""} ${we?.problem?.en ?? ""}`;
    (we?.steps ?? []).forEach((x, j) => { if (x.ask?.prompt) put(`workedExample.steps[${j}].ask`, "asked step", x.ask, we.board, wg); });
    if (we?.yourStep?.prompt) put("workedExample.yourStep", "own step", we.yourStep, we.yourStep.board ?? we.board, we.yourStep.board ? "" : wg);
  }
  if (s?.teachback?.prompt) out.push({ at: "teachback", skillId: null, id: "teachback", kind: "closing", card: s.teachback, board: s.teachback.board ?? null, given: "" });
  return out;
}
const lastSentence = (t) => { const x = sentencesOf(t); return d27Norm(x[x.length - 1] ?? ""); };
const isYesNo = (x) => x.split(" ").length === 1 && (YES_W.test(x) || NO_W.test(x));
/** A two-way card's two options, read from "X ya Y" in its question where one side is the key or an accepted form: [key side, other
 *  side] or null. A list of three ("X, Y, ya Z") is not two-way; a number is paired with a number ("1/10 loge ya 1/5"). */
const d32Norm = (t) => l018Norm(String(t ?? "").replace(/['’]s\b/gi, "").replace(/\.(?!\d)/g, " "));
export function twoWayOptions(card) {
  const forms = [card?.key, ...(card?.accept ?? [])].filter((x) => x != null).map((f) => d32Norm(f).trim()).filter(Boolean);
  const q = sentencesOf(card?.prompt?.hi ?? "").filter((x) => /(?<![\p{L}])ya(?![\p{L}])/iu.test(x)).pop();
  if (!q) return null;
  const segs = q.split(/(?<![\p{L}])ya(?![\p{L}])/iu);
  if (segs.length !== 2) return null;
  const ctx = segs[0].split(/[:;]|(?<![\p{L}])toh(?![\p{L}])/iu).pop();
  if (/,\s*$/.test(ctx) && ctx.replace(/,\s*$/, "").includes(",")) return null;
  const keep = (w) => /^\d/.test(w) || !D32_STOP.has(w);
  const L = d32Norm(ctx).trim().split(" ").filter(keep), R = d32Norm(segs[1]).trim().split(" ").filter(keep);
  const right = R[0], num = /^\d/.test(right ?? "");
  const left = num ? [...L].reverse().find((w) => /^\d/.test(w)) : L[L.length - 1];
  const judged = (w) => isYesNo(w) || /^(sahi|galat|theek|barabar)$/.test(w); // (a verdict, or "equal": those words are in every hint)
  if (!left || !right || left === right || judged(left) || judged(right)) return null;
  const hit = (w) => forms.includes(w); // (an accepted form is the option itself: a loose pairing is not read as two-way)
  if (hit(left) && !hit(right)) return [left, right];
  if (hit(right) && !hit(left)) return [right, left];
  return null;
}
const has = (T, x) => T.includes(` ${x} `);
const reEsc = (x) => x.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
/** A form named as one side of a choice ("X ... ya Y", "Y ya ... X"), not given: and in a re-ask, beside another of its kind (another
 *  fraction, another name or slot), since a re-ask restates the question's options. */
const offered = (T, x, reask) => {
  const X = reEsc(x);
  if (new RegExp(` ${X}(?: \\S+){0,3} (?:ya|or|aur|and) `).test(T) || new RegExp(` (?:ya|or|aur|and)(?: \\S+){0,3} ${X} `).test(T)) return true;
  if (!reask) return false;
  const fr = (T.match(/\d+\/\d+/g) ?? []), xf = x.match(/\d+\/\d+/g) ?? [];
  if (xf.length && fr.some((y) => !xf.includes(y))) return true;
  const tail = x.split(" ").slice(1).join(" ");
  return !!tail && T.split(` ${tail} `).length > 2; // ("Ben ke paas … {friend} ke paas": both sides in the same words)
};
/** The hint wordings of a card that name its answer (rule 10) or one option of a two-way card: [{ field, l, form }]. */
export function hintHits(c, fields) {
  const out = [], card = c.card, given = d32Norm(`${card.prompt?.hi ?? ""} ${card.prompt?.en ?? ""} ${c.given ?? ""}`), opts = twoWayOptions(card);
  for (const [field, text] of fields) for (const l of ["hi", "en"]) {
    const t = text?.[l]; if (!t) continue;
    const T = d32Norm(t);
    for (const f of [card.key, ...(card.accept ?? [])].filter((x) => x != null)) {
      const x = d32Norm(f).trim();
      if (!x || has(given, x) || isYesNo(x)) continue;
      if (has(T, x) && !offered(T, x, field === "reask")) { out.push({ field, l, form: String(f) }); break; }
    }
    if (l === "hi" && opts && has(T, opts[0]) !== has(T, opts[1])) out.push({ field, l, form: `${has(T, opts[0]) ? opts[0] : opts[1]}" and not "${has(T, opts[0]) ? opts[1] : opts[0]}`, twoWay: true });
  }
  return out;
}
export const RULE_FALSE = [/fraction\s+naam\s+nahi\s+(hota|hai)/i, /sirf\s+barabar\b.*\bfraction\s+(ka\s+)?naam/i, /tabhi\s+kehte\s+hain\s+jab\b.*\bbarabar/i,
  /\bno fraction name\b/i, /\bonly equal\b.*\bfraction name\b/i];
export const RULE_WORDS = /(?<![\p{L}])(tabhi|sirf|hamesha|kabhi\s+nahi|nahi\s+hota)(?![\p{L}])/iu;
/** The arithmetic operations a stated rule can be about (the hi words and their forms, and the symbols). */
const RULE_OPS = /(?<![\p{L}])(guna|jod\p{L}*|jud\p{L}*|ghata\p{L}*|ghat\p{L}*|bhaag\p{L}*|bhag\p{L}*|baant\p{L}*|bant\p{L}*)(?![\p{L}])|[×÷]/iu;
/** director32 (report-c6 A): "Parimap mein bhujayein jodte hain, guna nahi." has no trigger word and passed both reads, so a
 *  sentence that ends on a bare contrast (", guna nahi.", ", jod nahi.", "… nahi hota.") or names an operation with "sirf" or
 *  "nahi" is listed too. A listing for the reader, not an error: most such sentences are true. */
const RULE_SHAPES = [RULE_WORDS, /,\s*[\p{L}-]+\s+nahi\s*[.!]?\s*$/iu, /(?<![\p{L}])nahi\s+(hota|hoti|hote)\s*[.!]?\s*$/iu];
export function isRuleSentence(text) {
  const t = String(text ?? "");
  return RULE_SHAPES.some((re) => re.test(t)) || (RULE_OPS.test(t) && /(?<![\p{L}])(sirf|nahi)(?![\p{L}])/iu.test(t));
}
/** The sentences of the fields where a rule is stated (rule 3): [{ at, l, text }]. */
export function ruleSentences(s) {
  const out = [], put = (at, f) => { for (const l of ["hi", "en"]) for (const x of sentencesOf(f?.[l])) out.push({ at, l, text: x }); };
  for (const k of s?.skills ?? []) {
    const id = k.skillId;
    put(`${id}/covered`, k.covered);
    for (const b of k.explain ?? []) { put(`${id}/${b.id}.point`, b.point); put(`${id}/${b.id}.pointAlt`, b.pointAlt); }
    (k.remediation ?? []).forEach((r, j) => { put(`${id}/remediation[${j}].say`, r.say); put(`${id}/remediation[${j}].sayAlt`, r.sayAlt); });
    (k.workedExample?.steps ?? []).forEach((x, j) => put(`${id}/workedExample.steps[${j}].why`, x.why));
  }
  for (const c of d32Cards(s)) for (const f of ["why", "whyShort", "whyAlt"]) put(`${c.at}.${f}`, c.card[f]);
  const w = s?.wrap ?? {};
  for (const [k, v] of Object.entries(w)) (Array.isArray(v) ? v : [v]).forEach((f, i) => { if (f && typeof f === "object" && (f.hi || f.en)) put(`wrap.${k}${Array.isArray(v) ? `[${i}]` : ""}`, f); });
  return out;
}
/** Rule 6's counts: [{ skill, id, at, reason, point, card, total, limit, first, listed }]. */
export function pointTurns(s) {
  const W = (x) => d27Words(x?.hi), out = [];
  const max = (xs) => Math.max(0, ...xs);
  (s?.skills ?? []).forEach((k, i) => (k.explain ?? []).forEach((b, j) => {
    const at = `${k.skillId}/${b.id}`, point = W(b.point), card = W(b.ask?.prompt);
    if (j === 0) {
      if (i !== 0) return;
      const hook = max((k.hook?.interestSlots ?? []).map((sl) => W(sl.use))), start = max((s.joints?.startAnyway ?? []).map(W));
      out.push({ skill: k.skillId, id: b.id, at, first: true, hook, start, point, card, total: hook + start + point + card, limit: FIRST_TEACH_MAX, listed: null });
      return;
    }
    const prev = k.explain[j - 1].ask, reason = W(prev?.whyShort ?? prev?.why);
    const listed = POINT_WHOLE.find((x) => x.topicId === s.topicId && x.skillId === k.skillId && x.explainId === b.id) ?? null;
    out.push({ skill: k.skillId, id: b.id, at, first: false, reason, point, card, total: reason + point + card, limit: POINT_TURN_MAX, listed });
  }));
  return out;
}
const ASK_CHANGE = /(?<![\p{L}])(agar|ek\s+aur|aur\s+ek|socho)(?![\p{L}])/iu;
/** Rule 8's candidates: cards whose prompt asks for an imagined change and that carry no askWhole. */
export function askWholeCandidates(s) { return d32Cards(s).filter((c) => ASK_CHANGE.test(c.card.prompt?.hi ?? "") && c.card.askWhole !== true); }
const PICTURE_KINDS = new Set(["card", "follow-up", "check", "asked step", "own step"]);
/** Rule 7: the cards a picture request would draw nothing new over: [{ at, template }]. */
export function noPictureCards(s) {
  // (main, d33: `noView: true` on a card takes its board's second view away where that view draws the card's own answer — c6 s1 worked
  // step, whose view totals the sides as "?"; the walk honours the same flag. Such a card must be on PICTURE_NONE with its reason)
  return d32Cards(s).filter((c) => PICTURE_KINDS.has(c.kind) && !c.card.pictureBoard && (c.card.noView === true || !(c.board?.template && viewOf(c.board, c.at))))
    .map((c) => ({ at: c.at, template: c.board?.template ?? null }));
}
const formsOk = (e, at, f, { question, max, rule } = {}) => {
  const r = rule ? ` (Learning 020 rule ${rule})` : "";
  if (!f || typeof f !== "object") { e.push(`${at}: { hi, en }${r}`); return; }
  for (const l of ["hi", "en"]) {
    const t = String(f[l] ?? "").trim(), a = `${at}${l === "en" ? " (en)" : ""}`;
    if (!t) { e.push(`${a}: empty${r}`); continue; }
    if (question === true && !/[?？]\s*$/.test(t)) e.push(`${a}: ends on the question${r}`);
    if (question === false && /[?？]/.test(t)) e.push(`${a}: asks nothing${r}`);
    if (max && d27Words(t) > max) e.push(`${a}: ${d27Words(t)} words > ${max}${r}`);
  }
};
export function d32Errors(s, { force = false } = {}) {
  if (!force && !isD32(s)) return [];
  const e = [], cards = d32Cards(s), school = (s.terms ?? []).some((x) => /right angle/i.test(`${x.en ?? ""} ${x.hi ?? ""}`));
  // 1
  for (const c of cards) {
    if (!c.card.hindi) continue;
    const o = hindiOverlap(c.card, s);
    if (o.share > HINDI_OVERLAP_MAX) e.push(`${c.at}.hindi: ${o.shared} of its ${o.form} content words are the card's (${o.words.join(", ")}): ${Math.round(o.share * 100)}% > ${HINDI_OVERLAP_MAX * 100}%; say it in another sentence, or write none (Learning 020 rule 1)`);
    if (school && /samkon/i.test(c.card.hindi.hi ?? "")) e.push(`${c.at}.hindi: "samkon": the school's word is "right angle" (Learning 020 rule 1)`);
  }
  // 2
  (s.joints?.hindiSwitch ?? []).forEach((f, i) => { const m = String(f?.hi ?? "").match(/(?<![\p{L}])(aasaan|aasan|seedhe|doosre\s+shabdon)(?![\p{L}])/iu); if (m) e.push(`joints.hindiSwitch[${i}]: "${m[1]}": promise only Hindi ("Theek hai, Hindi mein poochhti hoon.") (Learning 020 rule 2)`); });
  // 3
  for (const x of ruleSentences(s)) if (RULE_FALSE.some((re) => re.test(x.text))) e.push(`${x.at}${x.l === "en" ? " (en)" : ""}: "${x.text}" is a false rule: a piece cannot be named by counting the pieces unless they are equal; it still has a fraction (Learning 020 rule 3, dc-r8-director31 ruling 1)`);
  // 4
  for (const k of s.skills ?? []) (k.workedExample?.steps ?? []).forEach((x, j) => {
    const at = `${k.skillId}/workedExample.steps[${j}]`;
    if (x.ask) { formsOk(e, `${at}.ask.reask`, x.ask.reask, { question: true, rule: 4 }); if (x.ask.reask?.hi && d27Norm(x.ask.reask.hi) === d27Norm(x.ask.prompt?.hi)) e.push(`${at}.ask.reask: the question's own words; ask it another way (Learning 020 rule 4)`); }
    formsOk(e, `${at}.told`, x.told, { question: false, max: TOLD_STEP_MAX, rule: 4 });
  });
  if (s.teachback) { formsOk(e, "teachback.reask", s.teachback.reask, { question: true, rule: 4 }); if (s.teachback.reask?.hi && d27Norm(s.teachback.reask.hi) === d27Norm(s.teachback.prompt?.hi)) e.push("teachback.reask: the question's own words; ask it another way (Learning 020 rule 4)"); }
  // 5
  const ends = new Map();
  for (const c of cards) { const x = lastSentence(c.card.prompt?.hi); if (!x) continue; if (ends.has(x)) e.push(`${c.at}: ends on "${x}", as ${ends.get(x)} does; each card ends on its own sentence (Learning 020 rule 5)`); else ends.set(x, c.at); }
  // 6
  const turns = pointTurns(s);
  for (const p of turns) {
    if (p.first && p.total > p.limit) e.push(`${p.at}: the first teaching turn (hook ${p.hook} + startAnyway ${p.start} + point ${p.point} + card ${p.card}) is ${p.total} words > ${p.limit}: cut the point (Learning 020 rule 6)`);
    if (!p.first && p.total > p.limit && !p.listed) e.push(`${p.at}: short reason ${p.reason} + point ${p.point} + card ${p.card} = ${p.total} words > ${p.limit}: cut the point (one example, one new thing), never the card's givens, or list it in POINT_WHOLE with its reason (Learning 020 rule 6)`);
  }
  const listed = POINT_WHOLE.filter((x) => x.topicId === s.topicId);
  for (const w of listed) if (!turns.some((p) => p.listed === w && p.total > p.limit)) e.push(`POINT_WHOLE ${w.skillId} ${w.explainId}: listed but fits (or is gone); take it off the list`);
  if (listed.length > POINT_WHOLE_PER_SCRIPT) e.push(`POINT_WHOLE: ${listed.length} pairs listed for ${s.topicId}, more than ${POINT_WHOLE_PER_SCRIPT}: the limit is wrong for this script; say so to main (Learning 020 rule 6)`);
  // 7
  const none = PICTURE_NONE.filter((x) => x.topicId === s?.topicId);
  if (force || D32_PICTURES_READY.includes(s?.topicId)) {
    const bare = noPictureCards(s);
    for (const n of none) if (!bare.some((x) => x.at === n.at)) e.push(`PICTURE_NONE ${n.at}: listed but the card has a picture now (or is gone); take it off the list`);
  }
  if (force || D32_PICTURES_READY.includes(s?.topicId)) for (const x of noPictureCards(s).filter((x) => !none.some((n) => n.at === x.at))) e.push(`${x.at}: its board (${x.template ?? "none"}) has no second view: author a pictureBoard { template, params } with a pictureCaption (Learning 020 rule 7)`);
  for (const c of cards) if (c.card.pictureBoard) {
    const pb = c.card.pictureBoard;
    if (!pb?.template || !BOARD_REFS[pb.template] || typeof (pb.params ?? null) !== "object") e.push(`${c.at}.pictureBoard: { template, params } with a known template (Learning 020 rule 7)`);
    formsOk(e, `${c.at}.pictureCaption`, c.card.pictureCaption, { question: false, rule: 7 });
  }
  // 8
  for (const r of ASK_WHOLE_REQUIRED.filter((x) => x.topicId === s.topicId)) {
    const c = cards.find((x) => x.skillId === r.skillId && x.id === r.card);
    if (!c) e.push(`ASK_WHOLE_REQUIRED ${r.skillId} ${r.card}: no such card; take it off the list`);
    else if (c.card.askWhole !== true) e.push(`${c.at}: short ask marker missing: askWhole: true (its question asks for a change the board does not show; Learning 020 rule 8)`);
  }
  for (const c of cards) if (c.card.askWhole != null && c.card.askWhole !== true) e.push(`${c.at}.askWhole: true or absent`);
  // 9
  for (const c of cards) {
    if (c.card.whyAltAsHelp == null) continue;
    if (c.card.whyAltAsHelp !== true) { e.push(`${c.at}.whyAltAsHelp: true or absent`); continue; }
    if (!c.card.whyAlt) { e.push(`${c.at}.whyAltAsHelp: no whyAlt`); continue; }
    for (const h of hintHits({ ...c, given: "" }, [["whyAlt", c.card.whyAlt]])) e.push(`${c.at}.whyAlt${h.l === "en" ? " (en)" : ""}: said as help, it names "${h.form}"; take whyAltAsHelp off or reword it (Learning 020 rule 9)`);
  }
  // 10
  for (const c of cards) {
    const fields = [["simpler", c.card.simpler], ["reask", c.card.reask]];
    for (const h of hintHits(c, fields)) {
      if (!h.twoWay && c.kind === "asked step" && h.field === "simpler") continue; // (019's stepSimplerHits holds it)
      e.push(`${c.at}.${h.field}${h.l === "en" ? " (en)" : ""}: ${h.twoWay ? `leaves one option: names "${h.form}"` : `names the answer "${h.form}"`} (Learning 020 rule 10)`);
    }
  }
  for (const k of s.skills ?? []) (k.workedExample?.steps ?? []).forEach((x, j) => {
    if (!x.ask) return;
    const c = cards.find((y) => y.at === `${k.skillId}/workedExample.steps[${j}].ask`);
    for (const h of hintHits(c, [["simpler", x.simpler]]).filter((y) => y.twoWay)) e.push(`${k.skillId}/workedExample.steps[${j}].simpler: leaves one option: names "${h.form}" (Learning 020 rule 10)`);
  });
  // wrap.ack
  (s.wrap?.ack ?? []).forEach((f, i) => { if (/yaad\s+rakh/i.test(String(f?.hi ?? ""))) e.push(`wrap.ack[${i}]: "yaad rakh…" promises what she cannot keep (Learning 020)`); });
  return e;
}
/** The --rules listing: R lines (stated rules for the reader) and A lines (askWhole candidates for main). */
export function d32Listing(s) {
  return [
    ...ruleSentences(s).filter((x) => x.l === "hi" && isRuleSentence(x.text)).map((x) => `R ${x.at}: ${x.text}`),
    ...askWholeCandidates(s).map((c) => `A ${c.at} over ${c.board?.template ?? "no board"}: ${c.card.prompt.hi}`),
  ];
}
/** Learning 021 Part 1 (dc-r8-director32 items 9, 2, 6, 10; docs/patches/to-learning/021-director32-own-reason-hindi-drawings-read.md).
 *  1  A script never trips the safety reader: every key, accept form and named wrong answer (`wrongIfMis`, one or a list) of every
 *     keyed object in a script (cards, checks, follow-ups, asked and own steps, the teachback, quick asks) is read by `scanSafety`
 *     as a child's reply; a form it marks is an error (safetyErrors, in checkTopic for EVERY script, not a d33 opt-in). Hits in a
 *     staged script that is not served are listed in SAFETY_STAGED_KNOWN instead (rewritten before it is served).
 *     SAFETY_SEEN: words a judged run saw set off the safety turn as a right answer while scanSafety does not mark them (the
 *     model's distress read did; the checker makes no model call): a form with one is an error too.
 *  2  `--rules` H lines: every card's `whyAlt` against rule 9 (H+ passes and is unmarked; H- fails, with what it names; H0 none).
 *  3  A posing board that is its own answer (boardAnswerCards): a card that tells the child to cut into N over a board that
 *     draws N parts, or asks "kitne gap / hisse / tukde" with a number key over a board that draws exactly that many parts.
 *     `--d33` lists them (B lines); an error only for a topic in D33_READY or named with --d33.
 *  4  `--rules` O lines: every sentence of a point, a remediation or a `covered` line that names an arithmetic operation, with
 *     the first later sentence in the script (document order) that names the same one.
 *  5  `joints.noPicture` (no other drawing: names no number, promises nothing) and `joints.yourTurn` (an invitation, not a
 *     question): three { hi, en } forms each, statements under 14 words; checked when present, required in D33_READY. */
export const D33_READY = [];
export const isD33 = (s) => D33_READY.includes(s?.topicId);
/** Staged, unserved scripts whose forms trip the safety reader, each rewritten before it is served: { topicId, at, form }. */
export const SAFETY_STAGED_KNOWN = [];
/** Words a judged run saw set off the safety turn as a right answer, though scanSafety does not mark them: { word, seen }. */
export const SAFETY_SEEN = [
  { word: "blade", seen: "director32 c4-maths-ch01-t02 steering rows 45-48: the accept form \"chhote blade wali\" said as a right answer opened the safety turn twice (the model's distress read; scanSafety does not mark it)" },
];
const seenWordIn = (t) => SAFETY_SEEN.find((w) => new RegExp(`(?<![\\p{L}])${w.word}(?![\\p{L}])`, "iu").test(t)) ?? null;
/** Every key, accept form and named wrong answer of a script: [{ at, field, form }]. Cards are named as d32Cards names them;
 *  any other keyed object by its path under its skill. */
export function answerForms(s) {
  const out = [], named = new Map(d32Cards(s).map((c) => [c.card, c.at]));
  const put = (at, o) => {
    if (o.key != null && typeof o.key !== "object") out.push({ at, field: "key", form: String(o.key) });
    (Array.isArray(o.accept) ? o.accept : []).forEach((f, i) => { if (f != null) out.push({ at, field: `accept[${i}]`, form: String(f) }); });
    wrongsOf(o).forEach((f, i) => out.push({ at, field: Array.isArray(o.wrongIfMis) ? `wrongIfMis[${i}]` : "wrongIfMis", form: f }));
  };
  const walk = (o, path) => {
    if (!o || typeof o !== "object") return;
    if (!Array.isArray(o) && ("key" in o || "accept" in o || "wrongIfMis" in o)) put(named.get(o) ?? path, o);
    for (const [k, v] of Object.entries(o)) walk(v, Array.isArray(o) ? `${path}[${k}]` : `${path}.${k}`);
  };
  for (const k of s?.skills ?? []) for (const [f, v] of Object.entries(k)) walk(v, `${k.skillId}/${f}`);
  for (const [f, v] of Object.entries(s ?? {})) if (f !== "skills") walk(v, f);
  return out;
}
/** Rule 1's hits: [{ at, field, form, by }]. */
export function safetyHits(s) {
  return answerForms(s).flatMap((x) => {
    const r = scanSafety(x.form);
    if (r.distress) return [{ ...x, by: `scanSafety ${r.kind}` }];
    const w = seenWordIn(x.form);
    return w ? [{ ...x, by: `"${w.word}" (SAFETY_SEEN)` }] : [];
  });
}
export function safetyErrors(s) {
  const e = [], hits = safetyHits(s), known = SAFETY_STAGED_KNOWN.filter((x) => x.topicId === s?.topicId);
  const listed = (h) => known.some((k) => k.at === h.at && k.form === h.form);
  for (const h of hits) if (!listed(h)) e.push(`${h.at}.${h.field} "${h.form}": the safety reader marks it as a child's reply (${h.by}); a right or named wrong answer never trips it: use another word (Learning 021 rule 1)`);
  for (const k of known) if (!hits.some((h) => h.at === k.at && h.form === k.form)) e.push(`SAFETY_STAGED_KNOWN ${k.at} "${k.form}": listed but no longer a hit (or gone); take it off the list`);
  return e;
}
/** Rule 2's H lines: one per card. H+ its whyAlt passes rule 9 and is not marked whyAltAsHelp; H- it fails rule 9 (what it names);
 *  H0 the card has no whyAlt. A marked whyAlt that passes is not listed (rule 9 holds it). */
export function whyAltHelpLines(s) {
  const out = [];
  for (const c of d32Cards(s)) {
    const w = c.card.whyAlt;
    if (!w || !(w.hi || w.en)) { out.push(`H0 ${c.at}: no whyAlt`); continue; }
    const hits = hintHits({ ...c, given: "" }, [["whyAlt", w]]);
    if (hits.length) out.push(`H- ${c.at}: fails rule 9: names ${hits.map((h) => `"${h.form}"${h.l === "en" ? " (en)" : ""}`).join(", ")}${c.card.whyAltAsHelp === true ? " (marked)" : ""}: ${w.hi ?? w.en}`);
    else if (c.card.whyAltAsHelp !== true) out.push(`H+ ${c.at}: passes rule 9, unmarked: ${w.hi ?? w.en}`);
  }
  return out;
}
/** Rule 4: the arithmetic operations a sentence names (Hinglish and English words, and the signs between numbers). */
export const OPERATIONS = {
  add: /(?<![\p{L}])(?:jod(?!iy|i(?![\p{L}]))\p{L}*|plus|add\p{L}*)(?![\p{L}])|[\d)]\s*\+\s*\(?\s*\d/iu,
  subtract: /(?<![\p{L}])(?:ghata\p{L}*|ghate|ghatt\p{L}*|minus|subtract\p{L}*)(?![\p{L}])|[\d)]\s*[−–]\s*\(?\s*\d|[\d)]\s+-\s+\(?\s*\d/iu,
  multiply: /(?<![\p{L}])(?:gun(?:a|aa|e|i|o)\p{L}*|multipl\p{L}*|times)(?![\p{L}])|[\d)]\s*[×x]\s*\(?\s*\d/iu,
  divide: /(?<![\p{L}])(?:bhaa?g\s+(?:do|de|dena|diya|diye|karo|kiya|kar|karte|karna)|divid\p{L}*|baant\p{L}*)(?![\p{L}])|÷/iu,
};
export const operationsOf = (t) => Object.keys(OPERATIONS).filter((k) => OPERATIONS[k].test(String(t ?? "")));
/** Every spoken Hindi sentence of a script in document order: [{ at, text }] (`at` under its skill id). */
export function scriptSentences(s) {
  const out = [];
  const walk = (o, path) => {
    if (!o || typeof o !== "object") return;
    if (!Array.isArray(o) && typeof o.hi === "string") { for (const x of sentencesOf(o.hi)) out.push({ at: path, text: x }); return; }
    for (const [k, v] of Object.entries(o)) walk(v, Array.isArray(o) ? `${path}[${k}]` : `${path}.${k}`);
  };
  for (const [f, v] of Object.entries(s ?? {})) {
    if (f === "skills") for (const k of v ?? []) for (const [g, w] of Object.entries(k)) walk(w, `${k.skillId}/${g}`);
    else walk(v, f);
  }
  return out;
}
const OP_SOURCE = /\/(?:explain\[\d+\]\.(?:point|pointAlt)|remediation\[\d+\]\.(?:say|sayAlt|simpler)|covered)$/;
/** Rule 4's O lines: a point, remediation or covered sentence naming an operation, with the first later sentence naming it too. */
export function operationPairs(s) {
  const all = scriptSentences(s), out = [];
  all.forEach((x, i) => {
    if (!OP_SOURCE.test(x.at)) return;
    for (const op of operationsOf(x.text)) {
      const later = all.slice(i + 1).find((y) => OPERATIONS[op].test(y.text));
      out.push(`O ${x.at} [${op}]: ${x.text} → ${later ? `${later.at}: ${later.text}` : "no later sentence names it"}`);
    }
  });
  return out;
}
/** Rule 3: the parts a board draws, one count per drawn thing (a bar, a whole, a line, a grid, a set of groups). */
export function partCountsOf(b) {
  const p = b?.params ?? {}, n = (x) => (Number.isInteger(Number(x)) && Number(x) > 0 ? Number(x) : null), out = [];
  const span = Number(p.to ?? 1) - Number(p.from ?? 0);
  switch (b?.template) {
    case "fraction-parts@1": out.push(n(p.parts)); break;
    case "fraction-bars@1": for (const x of p.bars ?? []) out.push(n(x?.parts)); break;
    case "wholes@1": for (const x of p.wholes ?? []) out.push(n(Array.isArray(x?.parts) ? x.parts.length : x?.parts)); break;
    case "shade-grid@1": out.push(n(Number(p.rows) * Number(p.cols))); break;
    case "equal-groups@1": out.push(n(p.groups)); break;
    case "fraction-line@1": for (const d of p.dens ?? [p.den]) out.push(n(Number(d) * span)); break;
    case "number-line-scale@1": out.push(n(Number(p.step) > 0 ? span / Number(p.step) : null)); break;
    default: break;
  }
  return out.filter((x) => x != null);
}
// (the child is told to cut: an imperative or an ask, "kaato", "baantoge", "hisse karne hain"; a given, "kati hai", "kaatkar", is not)
const CUT_DO = "(?:kaat|baant|tod|mod)(?:o|oge|ogi|ein|en|enge|engi|na|ni|ne)|kar(?:o|oge|ogi|na|ni|ne|ein|en|enge)";
const CUT_HI = new RegExp(`(\\d+)\\s+(?:barabar\\s+)?(?:tukd\\p{L}*|hiss\\p{L}*|bhaag\\p{L}*|gaps?|parts?)\\s+(?:(?:mein|me)\\s+)?(?:${CUT_DO})(?![\\p{L}])`, "iu");
const CUT_EN = /(?:^|[.!?]\s+)(?:now\s+|then\s+)?(?:cut|divide|fold|split|share)\s[^.?!]*?\binto\s+(\d+)\b/iu;
const COUNT_HI = /(?<![\p{L}])kitn(?:e|i|a)\s+(?:barabar\s+)?(?:gap|hiss|tukd|bhaag|khaan|part|piece|ghar)\p{L}*/iu;
const COUNT_EN = /\bhow many\s+(?:equal\s+)?(?:gaps|parts|pieces|sections|spaces|squares)\b/iu;
/** Rule 3: cards whose posing board draws their answer: [{ at, kind: "cut" | "count", n, board }]. A cut card tells the child to
 *  cut (fold, share) into N over a board that already draws N parts; a count card asks how many gaps / parts with a whole-number
 *  key over a board that draws exactly that many. */
export function boardAnswerCards(s) {
  const out = [];
  for (const c of d32Cards(s)) {
    const counts = partCountsOf(c.board), hi = String(c.card.prompt?.hi ?? ""), en = String(c.card.prompt?.en ?? "");
    if (!counts.length) continue;
    const cut = Number((hi.match(CUT_HI) ?? en.match(CUT_EN) ?? [])[1]);
    if (cut && counts.includes(cut)) { out.push({ at: c.at, kind: "cut", n: cut, board: c.board, prompt: hi }); continue; }
    const key = Number(String(c.card.key ?? "").trim());
    if ((COUNT_HI.test(hi) || COUNT_EN.test(en)) && Number.isInteger(key) && key > 0 && counts.includes(key)) out.push({ at: c.at, kind: "count", n: key, board: c.board, prompt: hi });
  }
  return out;
}
/** Rule 3's B lines (`--d33`): the cards boardAnswerCards catches, for main to confirm before the rule is an error. */
export const boardAnswerLines = (s) => boardAnswerCards(s).map((x) => `B ${x.at} [${x.kind} ${x.n}] over ${boardLine(x.board)}: ${x.prompt}`);
/** Rule 5: the two new joints, three forms each. */
export const D33_JOINTS = ["noPicture", "yourTurn"];
export const D33_JOINT_FORMS = 3, D33_JOINT_MAX = 13; // (under 14 words)
const NUMBER_SAID = /\d|(?<![\p{L}])(?:teen|chaar|char|paanch|chhe|chheh|saat|aath|nau|das|aadha|aadhi|aadhe|two|three|four|five|six|seven|eight|nine|ten|half)(?![\p{L}])/iu;
const PROMISE = /(?<![\p{L}])(?:phir|baad\s+mein|baad\s+me|yaad|later|remember|next\s+time|again)(?![\p{L}])/iu;
export function d33JointErrors(s, { required = false } = {}) {
  const e = [], j = s?.joints ?? {};
  for (const kind of D33_JOINTS) {
    const forms = j[kind];
    if (forms == null) { if (required) e.push(`joints.${kind}: ${D33_JOINT_FORMS} forms { hi, en } (Learning 021 rule 5)`); continue; }
    if (!Array.isArray(forms) || forms.length !== D33_JOINT_FORMS) { e.push(`joints.${kind}: ${D33_JOINT_FORMS} forms (got ${Array.isArray(forms) ? forms.length : 0}) (Learning 021 rule 5)`); continue; }
    forms.forEach((f, i) => {
      formsOk(e, `joints.${kind}[${i}]`, f, { question: false, max: D33_JOINT_MAX });
      for (const l of ["hi", "en"]) {
        const t = String(f?.[l] ?? ""), at = `joints.${kind}[${i}]${l === "en" ? " (en)" : ""}`;
        if (!t) continue;
        if (kind === "noPicture" && NUMBER_SAID.test(t)) e.push(`${at}: names a number ("${t.match(NUMBER_SAID)[0]}"); there is no other drawing, and it names no answer (Learning 021 rule 5)`);
        if (kind === "noPicture" && PROMISE.test(t)) e.push(`${at}: "${t.match(PROMISE)[0]}" promises something; it promises nothing (Learning 021 rule 5)`);
      }
    });
    const seen = new Set();
    forms.forEach((f, i) => { const n = d27Norm(f?.hi ?? ""); if (n && seen.has(n)) e.push(`joints.${kind}[${i}]: the same form twice (Learning 021 rule 5)`); seen.add(n); });
  }
  return e.map((x) => (/Learning 021/.test(x) ? x : `${x} (Learning 021 rule 5)`));
}
/** Learning 021's errors: rule 5's joints wherever they are written (required, and rule 3, for a topic in D33_READY or forced). */
export function d33Errors(s, { force = false } = {}) {
  const on = force || isD33(s), e = d33JointErrors(s, { required: on });
  if (on) for (const x of boardAnswerCards(s)) e.push(`${x.at}: its posing board (${x.board?.template}) already draws the ${x.n} ${x.kind === "cut" ? "parts the card tells the child to cut into" : "parts the card asks the child to count"}: pose it over a board that leaves the ${x.kind === "cut" ? "cut" : "count"} to the child, or list it in PICTURE_NONE with no picture (Learning 021 rule 3)`);
  return e;
}
/** The spoken fields of a part, by kind (A.4). */
const PART_FIELDS = {
  point: ["point", "pointAlt", "simpler", "viewCaption"],
  card: ["prompt", "reask", "hindi", "right", "simpler", "why", "whyShort", "whyAlt", "viewCaption", "answerViewCaption"],
  remediation: ["say", "sayAlt", "simpler", "viewCaption"],
  worked: ["problem", "problemAlt", "simpler", "viewCaption", "answer", "why"],
  step: ["do", "why", "simpler", "result"],
};
const spokenOf = (x) => (x == null ? "" : typeof x === "string" ? x : typeof x === "object" ? String(x.hi ?? JSON.stringify(x)) : String(x));
/** Every part of a script with its spoken fields and board: [{ at, kind, fields, board, key }]. */
export function partsOf(s) {
  const out = [], put = (at, kind, o, board, extra = {}) => out.push({ at, kind, fields: Object.fromEntries(PART_FIELDS[kind].map((f) => [f, spokenOf(o?.[f])])), board: board ?? null, ...extra });
  for (const k of s?.skills ?? []) {
    const id = k.skillId.replace(/^.*-(s\d+)$/, "$1");
    for (const b of k.explain ?? []) {
      put(`${id} ${b.id} point`, "point", b, b.board);
      if (b.ask) put(`${id} ${b.id} card`, "card", b.ask, b.ask.board ?? b.board, { key: b.ask.key });
    }
    for (const r of k.remediation ?? []) {
      put(`${id} remediation ${r.targets.replace(/^.*-m-/, "")}`, "remediation", { ...r, sayAlt: r.sayAlt }, r.board ?? null, { altBoard: r.sayAlt?.board ?? null });
      if (r.then) put(`${id} remediation ${r.targets.replace(/^.*-m-/, "")} card`, "card", r.then, r.then.board ?? r.board ?? null, { key: r.then.key });
    }
    for (const c of k.checks ?? []) put(`${id} ${c.id}`, "card", c, c.board ?? null, { key: c.key });
    const we = k.workedExample;
    if (we) {
      put(`${id} worked`, "worked", we, we.board);
      (we.steps ?? []).forEach((x, j) => { put(`${id} worked step ${j}`, "step", x, we.board); if (x.ask) put(`${id} worked step ${j} ask`, "card", x.ask, we.board, { key: x.ask.key }); });
      if (we.yourStep) put(`${id} worked own step`, "card", we.yourStep, we.yourStep.board ?? we.board, { key: we.yourStep.key });
    }
  }
  if (s?.teachback) put("teachback", "card", s.teachback, s.teachback.board ?? null, { key: s.teachback.key });
  return out;
}
/** What changed between two versions of a script, part by part (A.4): [{ at, kind, board, key, changed: [[field, old, new]] }]. */
export function changedParts(sNew, sOld) {
  const old = new Map(partsOf(sOld).map((p) => [p.at, p]));
  return partsOf(sNew).flatMap((p) => {
    const o = old.get(p.at);
    const changed = Object.keys(p.fields).filter((f) => p.fields[f] !== (o?.fields?.[f] ?? "")).map((f) => [f, o?.fields?.[f] ?? "", p.fields[f]]);
    const boardMoved = o && JSON.stringify(o.board) !== JSON.stringify(p.board);
    return changed.length || boardMoved ? [{ at: p.at, kind: p.kind, board: p.board, key: p.key ?? null, boardMoved: !!boardMoved, isNew: !o, changed }] : [];
  });
}
const boardLine = (b) => (b?.template ? `${b.template} ${JSON.stringify(b.params ?? {})}` : "no board of its own");
/** The --since lines for one topic. */
export function sinceReport(sNew, sOld) {
  return changedParts(sNew, sOld).flatMap((c) => [
    `${c.at} [${c.kind}${c.isNew ? ", new" : ""}] over ${boardLine(c.board)}${c.boardMoved ? " (board changed)" : ""}${c.key != null ? `; key ${c.key}` : ""}`,
    ...c.changed.map(([f, a, b]) => `    ${f}: ${a ? `"${a}" → ` : ""}"${b}"`),
  ]);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
  const topics = args.includes("--all") ? allTopics() : args.filter((a, i) => !a.startsWith("--") && !["--blind", "--keys", "--since"].includes(args[i - 1]));
  if (!topics.length) { console.error("usage: check.mjs <topicId> [--blind q.json --keys k.json] | --all"); process.exit(2); }
  let bad = 0;
  // (Learning 019 Part 2: --standard holds the named staged scripts to the pilots' standard for this run only, as STANDARD_STAGED does
  // for good; the v2.4 rules — second wordings, reasks, the wrap — fire once a script has its teachback)
  if (args.includes("--standard")) for (const t of topics) if (!STANDARD_STAGED.includes(t)) STANDARD_STAGED.push(t);
  // (Learning 020: --d32 holds the named scripts to the 020 rules for this run only, as D32_READY does for good)
  if (args.includes("--d32")) for (const t of topics) { if (!D32_READY.includes(t)) D32_READY.push(t); if (!D32_PICTURES_READY.includes(t)) D32_PICTURES_READY.push(t); }
  // (Learning 021: --d33 holds the named scripts to the 021 rules for this run only, as D33_READY does for good)
  if (args.includes("--d33")) for (const t of topics) if (!D33_READY.includes(t)) D33_READY.push(t);
  for (const t of topics) {
    const r = await checkTopic(t);
    console.log(`${t}: ${r.ok ? "ok" : "FAIL"}  structure ${r.structure.length}, boards ${r.boards.length}, runtime ${r.runtime.length}; W6 left to turn time on ${r.timingOnly.length}`);
    for (const x of [...r.structure.map((m) => `  S ${m}`), ...r.boards.map((m) => `  W ${m}`), ...r.runtime.map((m) => `  V ${m}`)]) console.log(x);
    // (Learning 017 A: the fit of every pair that shares a turn, measured; a remediation over its limit is reported, never failed)
    if (isD29(scriptOf(t)) || args.includes("--fit")) for (const m of fitReport(scriptOf(t))) console.log(`  F ${m}`);
    if (isD29(scriptOf(t))) for (const m of d30Report(scriptOf(t))) console.log(`  F ${m}`);
    // (Learning 019 A.4: every point, remediation, card and worked example whose spoken text changed since a named commit, with its
    // board and key: main reads each against its board and card before a run)
    if (opt("--since")) {
      const rel = relative(ROOT, join(SCRIPTS, `${t}.json`));
      let old = null; try { old = JSON.parse(execFileSync("git", ["show", `${opt("--since")}:${rel}`], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1 << 26 })); } catch { old = null; }
      const lines = sinceReport(scriptOf(t), old ?? { skills: [] });
      console.log(`  C changed since ${opt("--since")}${old ? "" : " (the script is not in that commit: every part is new)"}: ${lines.filter((x) => !x.startsWith(" ")).length} parts`);
      for (const m of lines) console.log(`  C ${m}`);
    }
    // (director18 D13: a manual-read list, never a gate — whys with no verb found after code's "kyunki")
    // (Learning 020 rules 3 and 8: stated-rule sentences for the independent reader, askWhole candidates for main; a listing, never a gate)
    if (args.includes("--rules")) for (const m of d32Listing(scriptOf(t))) console.log(`  ${m}`);
    // (Learning 021 rules 2 and 4: the whyAlt-as-help lines and the operation pairs; listings, never a gate)
    if (args.includes("--rules")) for (const m of [...whyAltHelpLines(scriptOf(t)), ...operationPairs(scriptOf(t))]) console.log(`  ${m}`);
    // (Learning 021 rule 3: the cards whose posing board draws their answer, for main to confirm)
    if (args.includes("--d33") || args.includes("--rules")) for (const m of boardAnswerLines(scriptOf(t))) console.log(`  ${m}`);
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

/** director20 R1 (dc-r8-director20): data/lesson-aside-replies.json, her authored lines around an aside, per kind. Every kind
 * has 3 returns (one question on {aside}), 3 replies (one {word} slot, no question), 2 plain (no slot, no question); the sad
 * set has 3 replies (no slot, no question). No other slot; at most 16 words; no named topic (TOPICS) in her own words. */
export function asideReplyErrors(d) {
  const e = [], KINDS = ["sport", "show", "food", "people", "game", "other"];
  const words = (t) => String(t).replace(/\{[a-z]+\}/g, "X").split(/\s+/).filter(Boolean).length;
  const form = (at, f, { slot, question }) => {
    for (const lang of ["hi", "en"]) { const t = String(f?.[lang] ?? "").trim(), w = `${at}${lang === "en" ? " (en)" : ""}`;
      if (!t) { e.push(`${w}: empty`); continue; }
      const slots = t.match(/\{[^}]*\}/g) ?? [];
      if (slot ? slots.length !== 1 || slots[0] !== slot : slots.length) e.push(`${w}: ${slot ? `exactly one ${slot}` : "no slot"}`);
      if (question ? !/[?？]$/.test(t) || (t.match(/[?？]/g) ?? []).length !== 1 : /[?？]/.test(t)) e.push(`${w}: ${question ? "one question, nothing after it" : "asks nothing"}`);
      if (words(t) > 16) e.push(`${w}: ${words(t)} words > 16`);
      // (main on director20: she claims no feeling of her own, she is an AI)
      if (/\bmujhe\b[^.]*\b(laga|lagi|lagta|lagti)\b|\bbura laga\b|\bkhushi hui\b|\bachha laga\b|\bI(?:'m| am) (?:sorry|glad|happy|sad)\b|\bI (?:feel|felt|love|like)\b/i.test(t)) e.push(`${w}: claims a feeling of her own`);
    }
  };
  for (const k of KINDS) { const v = d?.kinds?.[k];
    if (!v) { e.push(`kinds.${k}: missing`); continue; }
    if ((v.returns ?? []).length !== 3) e.push(`kinds.${k}.returns: 3 forms`);
    if ((v.replies ?? []).length !== 3) e.push(`kinds.${k}.replies: 3 forms`);
    if ((v.plain ?? []).length !== 2) e.push(`kinds.${k}.plain: 2 forms`);
    (v.returns ?? []).forEach((f, i) => form(`kinds.${k}.returns[${i}]`, f, { slot: "{aside}", question: true }));
    // (main on director20: a return never assumes an activity the kind does not guarantee: a person or an 'other' aside was
    // not played or eaten)
    if (k === "people" || k === "other") (v.returns ?? []).forEach((f, i) => { if (/\b(khela|kheli|khele|khelte|khaya|khayi|khaye|khaate|dekha|dekhi|padha|banaya|played|ate|watched|eaten)\b/i.test(`${f?.hi} ${f?.en}`)) e.push(`kinds.${k}.returns[${i}]: assumes an activity (played, ate, watched) the kind does not guarantee`); });
    (v.replies ?? []).forEach((f, i) => form(`kinds.${k}.replies[${i}]`, f, { slot: "{word}", question: false }));
    (v.plain ?? []).forEach((f, i) => form(`kinds.${k}.plain[${i}]`, f, { slot: null, question: false }));
    // (director21 R3: phraseReplies[i] answers returns[i]; one {phrase}, said back about the child; no fact, no taste of hers)
    if (v.phraseReplies) {
      if (v.phraseReplies.length !== (v.returns ?? []).length) e.push(`kinds.${k}.phraseReplies: one per return (${(v.returns ?? []).length})`);
      v.phraseReplies.forEach((f, i) => {
        form(`kinds.${k}.phraseReplies[${i}]`, f, { slot: "{phrase}", question: false });
        if (/\b(mujhe|mera|meri|mere|main|I|my|me)\b/.test(`${f?.hi} ${f?.en}`)) e.push(`kinds.${k}.phraseReplies[${i}]: says nothing of hers (a taste, a fact about her)`);
      });
    }
  }
  if ((d?.sad?.replies ?? []).length !== 3) e.push("sad.replies: 3 forms");
  (d?.sad?.replies ?? []).forEach((f, i) => form(`sad.replies[${i}]`, f, { slot: null, question: false }));
  return e;
}

/** director20 W1 (dc-r8-director20; "line… rekha", "Square… varg", "group… samooh" in one turn): one term per idea per spoken
 * form. No { hi } form holds both words of a twin pair (data/lesson-twins.json). Allowed: the `terms` glossary, and a gloss
 * that introduces a term in a point or its mustSay ("line yaani rekha", "acute angle, yaani nyun kon", "obtuse angle, adhik
 * kon"). "question mark" is not the twin of nishaan. */
export function oneTermErrors(s) {
  const glossed = new Map();
  const e = [], wre = (w) => `(?<![\\p{L}])${w.replace(/\s+/g, "\\s+")}(?![\\p{L}])`;
  const walk = (x, path) => {
    if (Array.isArray(x)) return x.forEach((v, i) => walk(v, `${path}[${i}]`));
    if (!x || typeof x !== "object" || x.template) return;
    if (typeof x.hi === "string") {
      const t = x.hi.replace(/question\s+mark/gi, "");
      for (const p of TWINS) {
        const en = p.en.find((w) => new RegExp(wre(w), "iu").test(t)), hi = p.hi.find((w) => new RegExp(wre(w), "iu").test(t));
        if (!en || !hi) continue;
        const m = /\.(point|mustSay\[\d+\])$/.test(path) ? [[en, hi], [hi, en]].map(([a, b]) => t.match(new RegExp(`(\\p{L}+\\s+)?${wre(a)}(\\s+\\p{L}+)?\\s*,?\\s*(yaani\\s+)?(\\p{L}+\\s+)?${wre(b)}`, "iu"))).find(Boolean) : null;
        if (!m) { e.push(`${path}: "${en}" and "${hi}" in one form: one term per idea (twins.json)`); continue; }
        // (a gloss introduces one term once per script: keyed by the glossed phrase; a point and its own mustSay are one beat)
        // (the word before a gloss names the term only when it is not a function word: "acute angle" vs "obtuse angle")
        const term = m[0].toLowerCase().replace(/\s+/g, " ").replace(/^(bhi|par|ki|ka|ke|yeh|ye|woh|wo|toh|aur|use|is|us|ek|jo|hai|hain|the|a|an|this|that|and|its) /, ""), beat = path.replace(/\.(point|mustSay\[\d+\])$/, "");
        if (glossed.has(term) && glossed.get(term) !== beat) e.push(`${path}: "${m[0]}" glossed again: a term is glossed once per script`);
        else glossed.set(term, beat);
      }
    }
    for (const [k, v] of Object.entries(x)) if (k !== "hi" && k !== "en") walk(v, path ? `${path}.${k}` : k);
  };
  walk(s.skills, "skills");
  return e;
}

/** The keyed cards of a script in walk order: [where, card, posing board]. */
function cardsInOrder(s) { return s.skills.flatMap((k) => [...k.explain.filter((b) => b.ask).map((b) => [`${k.skillId}/${b.id}`, b.ask, b.ask.board ?? b.board, "ask"]),
  ...(k.workedExample?.yourStep ? [[`${k.skillId}/workedExample.yourStep`, k.workedExample.yourStep, k.workedExample.yourStep.board ?? k.workedExample.board, "yourStep"]] : []),
  ...k.checks.map((c) => [`${k.skillId}/${c.id}`, c, c.board, "check"]), ...k.remediation.map((r, i) => r.then && [`${k.skillId}/remediation[${i}].then`, r.then, r.then.board, "then"]).filter(Boolean)]); }

/** main on the staged reader pass, batch 1 (c5-ch02-t03 s2 e2 repeats s1 e2; s2 c3 "3/4 = ?/8" answered in s1 e3's why; c7 s2
 * c1 = s2 e1; a then-card reusing check c2's exact numbers): the same question is never asked twice in a script — two cards
 * with the same prompt numbers and the same key — and a then-card never reuses a check's exact prompt numbers. */
export function repeatErrors(s) {
  const e = [], said = (x) => [x?.hi, x?.en].filter(Boolean).join(" ");
  const nums = (t) => (String(t ?? "").replace(/,(?=\d{3}\b)/g, "").match(/\d+(?:[./]\d+)?/g) ?? []).sort().join(" ");
  const keyOf = (c) => String(c.key ?? "").toLowerCase().replace(/[^\p{L}\p{N}/.]+/gu, " ").trim();
  const seen = new Map(), checkNums = new Map();
  for (const [where, c, , kind] of cardsInOrder(s)) {
    const n = nums(c.prompt?.hi ?? c.prompt?.en);
    if (!n) continue;
    const sig = `${n}|${keyOf(c)}`;
    if (seen.has(sig)) e.push(`${where}: asks the same as ${seen.get(sig)} (numbers ${n}, key ${c.key}): one question once per script`);
    else seen.set(sig, where);
    if (kind === "check") checkNums.set(n, where);
    if (kind === "then" && checkNums.has(n) && (n.split(" ").length >= 2 || n.split(" ").some((x) => Number(x) > 10))) e.push(`${where}: reuses ${checkNums.get(n)}'s exact numbers (${n}): a then-card asks something new`);
  }
  return [...new Set(e)];
}

/** main on batch 1 (c6/c7: "bagal wala kona", "theek saamne wala" said over separate angles): a card about crossing lines is
 * posed on a board that draws the crossing (lines@1 kind cross), never on angle@1, which draws separate angles. */
function crossingRe() { return /\b(crossing|kaat(?:-|\s)?t[ie]|kaatti|kat(?:-|\s)?ti|saamne wal[aie]|bagal wal[aie]|vertically opposite|shirshabhimukh|linear pair|rekhik yugm)\b/i; }
export function crossingBoardErrors(s) {
  const e = [], said = (x) => [x?.hi, x?.en].filter(Boolean).join(" ");
  for (const k of s.skills) {
    for (const b of k.explain) if (b.ask) { const board = b.ask.board ?? b.board;
      if (board?.template === "angle@1" && crossingRe().test(`${said(b.point)} ${said(b.ask.prompt)} ${said(b.ask.why)}`)) e.push(`${k.skillId}/${b.id}: speaks of crossing lines over angle@1 (separate angles): pose it on lines@1 { kind: "cross" }`); }
    for (const [where, c, board] of cardsInOrder({ skills: [{ ...k, explain: [] }] }))
      if (board?.template === "angle@1" && crossingRe().test(`${said(c.prompt)} ${said(c.why)}`)) e.push(`${where}: speaks of crossing lines over angle@1 (separate angles): pose it on lines@1 { kind: "cross" }`);
  }
  return e;
}

/** main on the 361 ungrounded marks: an answer board's mark is derived only from the card's key — a keyed angle (by name or by
 * its drawn degrees), a keyed column title or item, a keyed hop landing, a keyed place or digit value — never from a guess
 * about which side or which angle. A compare `add` is refused (its column is a guess). */
export function markGroundErrors(s) {
  const e = [], num = (x) => { const m = String(x ?? "").replace(/,/g, "").match(/-?\d+(?:\.\d+)?/); return m ? Number(m[0]) : null; };
  const norm = (x) => String(x ?? "").toLowerCase().replace(/[₹°,]/g, "").replace(/\b(angle|kon|wala|wali|ka|ki|ke)\b/g, " ").replace(/\s+/g, " ").trim();
  for (const [where, c] of cardsInOrder(s)) {
    const ab = c.answerBoard, m = ab?.params?.mark;
    if (!m || !["angle@1", "compare@1", "number-line-hop@1", "place-value@1"].includes(ab.template)) continue;
    const forms = [c.key, ...(c.accept ?? [])].map(norm).filter(Boolean), p = ab.params;
    let ok = true;
    if (ab.template === "angle@1") { const a = p.angles?.[m.index]; ok = !!a && (forms.some((f) => a.name && norm(a.name).endsWith(f)) || num(c.key) === a.deg); }
    if (ab.template === "compare@1") { const col = p[m.side];
      ok = !m.add && !!col && (m.item === undefined ? forms.some((f) => norm(col.title) === f || norm(col.title).includes(f)) : forms.some((f) => norm(col.items?.[m.item]) === f)); }
    if (ab.template === "number-line-hop@1") { let at = Number(p.start ?? 0); const lands = (p.hops ?? []).map((h) => (at += Number(h)));
      ok = m.land ? lands.at(-1) === num(c.key) : lands[m.hop] === num(c.key); }
    if (!ok) e.push(`${where}.answerBoard.mark: not named by the card's key (${c.key}): a mark is derived from the key only`);
  }
  return e;
}

/** main on batch 3 (c5-ch01-t01: "60,040 ko words mein padho", "8,06,125 … lakh?"): her voice speaks a numeral in words
 * (server/voice/spoken.js, the same renderer), so a card whose key — or an accept form — can be heard in the spoken form of
 * its own prompt gives its answer aloud. The number goes on the board only, and the prompt points at it. A key the written
 * prompt already offers (a choice card) is the `leaks` rule's, not this one's. */
// (a spoken number heard whole: "three hundred" inside "three hundred sixty", "thirty" inside "thirty six", is another number)
function inNumber(sp, sf) {
  const NUMTOK = /^(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|lakh|lakhs|crore|crores|point|upon)$/;
  for (let i = sp.indexOf(sf); i >= 0; i = sp.indexOf(sf, i + 1)) {
    const prev = sp.slice(0, i).trim().split(" ").at(-1) ?? "", next = sp.slice(i + sf.length).trim().split(" ")[0] ?? "";
    const sfFirst = sf.trim().split(" ")[0], sfLast = sf.trim().split(" ").at(-1);
    if ((NUMTOK.test(sfFirst) && NUMTOK.test(prev)) || (NUMTOK.test(sfLast) && NUMTOK.test(next))) continue;
    return true;
  }
  return false;
}
function spNorm(t) { return ` ${String(t ?? "").toLowerCase().replace(/[-‐–]/g, " ").replace(/[^\p{L}\p{N}/.]+/gu, " ").replace(/\s+/g, " ").trim()} `; }
export function spokenKeyErrors(s) {
  const e = [];
  for (const [where, c] of cardsInOrder(s)) for (const [lang, mode] of [["hi", "hinglish"], ["en", "english"]]) {
    const raw = c.prompt?.[lang];
    if (!raw) continue;
    // (a choice card names its options aloud: "kaunsa bada hai, 987 ya 1012?" is the leaks rule's, not this one's)
    if (/\s(ya|or)\s/i.test(` ${raw} `)) continue;
    // (a place-value or read-aloud card: "7382 mein 7 ki value?" is answered by the "seven thousand" she says inside the number)
    const place = /\b(value|jagah|place|expanded|keemat|kimat|sthaan|words|shabdon|padh|read)\b/i.test(raw);
    const sp = spNorm(toSpoken(raw, { mode })), rw = spNorm(String(raw).replace(/(\d),(?=\d{2,3}\b)/g, "$1"));
    for (const f of [c.key, ...(c.accept ?? [])].map((v) => String(v ?? "").trim()).filter(Boolean)) {
      if (YESNO.test(f)) continue;
      const sf = spNorm(toSpoken(f, { mode }));
      if (sf.trim().length < 3 || (!/\s/.test(sf.trim()) && (NUMWORD.test(sf.trim()) || YESNO.test(sf.trim()) || COMMON.test(sf.trim())))) continue;
      if ((place ? sp.includes(sf) : inNumber(sp, sf)) && !rw.includes(spNorm(f.replace(/(\d),(?=\d{2,3}\b)/g, "$1"))) && !rw.includes(sf)) { e.push(`${where}: its key "${f}" is heard in its own spoken prompt ("${toSpoken(raw, { mode }).slice(0, 80)}"): put the number on the board only and point at it`); break; }
    }
  }
  return [...new Set(e)];
}

/** main on batch 3 (c4-ch09: "4 × 7 = 28" said four times before c1 asks 4 × 7): a card's key is never stated in an earlier
 * spoken field of its skill — hook, points, mustSay, simplers, whys, the worked example, earlier cards — unless the card's own
 * prompt names it (a choice). Numbers above 10 and fractions, by their unit-free value; word keys by keyValues. And a then-card's
 * key is never stated in any why, point or worked line of its skill (a remediation fires after them). */
export function earlierKeyErrors(s) {
  const e = [];
  const said = (x) => (x && typeof x === "object" ? [x.hi, x.en].filter(Boolean).join(" ") : String(x ?? ""));
  const core = (v) => { const m = String(v ?? "").trim().replace(/^(₹|rs\.?\s*)/i, "").replace(/,(?=\d{2,3}\b)/g, "").match(/^(\d+(?:[./]\d+)?)(?:\s*(?:°|%|[\p{L}.]{1,8}))?$/u); if (!m) return null; return /^\d+$/.test(m[1]) && Number(m[1]) <= 10 ? null : m[1]; };
  const hasNum = (t, c) => new RegExp(`(^|[^\\d/.,])${c.replace(/[./]/g, "\\$&")}([^\\d/]|$)`).test(` ${String(t).replace(/(\d),(?=\d{2,3}\b)/g, "$1")} `);
  // (the line works this card's own problem: two of its numbers, or one that is a fraction, a decimal or above 10)
  const shares = (t, pn, h) => { const sh = pn.filter((n) => n !== h && hasNum(t, n)); return sh.length >= 2 || sh.some((n) => /[./]/.test(n) || Number(n) > 10); };
  const valuesOf = (c) => { const kv = keyValues(c); return { nums: [...new Set([core(c.key), ...kv.nums].filter(Boolean))], words: kv.words }; };
  // (a value with another unit is another quantity: "₹15 per metre" is not the key "15 cm")
  const UNIT = /^(mm|cm|m|km|g|kg|ml|l|litre|litres|metre|metres|meter|minute|minutes|min|hour|hours|ghante|rupaye|rupees|paise|°|degree)\b/i;
  const unitOf = (k) => { const m = String(k ?? "").match(/^(₹)?\s*[\d.,/]+\s*(°|[\p{L}]+)?/u); return m?.[1] ? "₹" : m?.[2] && UNIT.test(m[2]) ? m[2].toLowerCase() : null; };
  const sameQty = (t, n, u) => { if (!u) return hasNum(t, n); const re = new RegExp(`(^|[^\\d/.,])(₹\\s*)?${n.replace(/[./]/g, "\\$&")}(?![\\d/])\\s*(°|[\\p{L}]+)?`, "gu");
    for (const m of ` ${String(t).replace(/(\d),(?=\d{2,3}\b)/g, "$1")} `.matchAll(re)) { const tu = m[2] ? "₹" : m[3] && UNIT.test(m[3]) ? m[3].toLowerCase() : null; if (!tu || tu === u || tu.startsWith(u) || u.startsWith(tu)) return true; } return false; };
  const states = (t, c) => { const v = valuesOf(c), own = said(c.prompt), u = unitOf(c.key);
    return [...v.nums.filter((n) => !defined.has(n) && sameQty(t, n, u) && !hasNum(own, n)), ...v.words.filter((w) => hasWord(t, w) && !hasWord(own, w))]; };
  // (a constant the lesson defines in a mustSay — "right angle = 90°", "1 m = 100 cm" — is recalled, not given away)
  const defined = new Set(), before = [];
  for (const k of s.skills) {
    for (const b of k.explain) for (const m of b.mustSay ?? []) for (const n of said(m).replace(/(\d),(?=\d{2,3}\b)/g, "$1").match(/\d+(?:[./]\d+)?/g) ?? []) defined.add(n);
    const seq = [];   // [kind, label, text | card]
    (k.hook?.interestSlots ?? []).forEach((h, i) => seq.push(["t", `hook[${i}]`, said(h.use)]));
    for (const b of k.explain) {
      seq.push(["t", `${b.id}.point`, [said(b.point), ...(b.mustSay ?? []).map(said), said(b.simpler)].join(" ")]);
      if (b.ask) { seq.push(["c", b.id, b.ask]); seq.push(["t", `${b.id}.ask`, `${said(b.ask.simpler)} ${said(b.ask.why)}`]); }
    }
    const we = k.workedExample;
    if (we) {
      // (the worked answer and why are said after the child's yourStep: the steps before it, the close after it)
      seq.push(["t", "workedExample.problem", [said(we.problem), ...(we.givens ?? []).map(said)].join(" ")]);
      seq.push(["t", "workedExample", [...(we.steps ?? []).flatMap((x) => [said(x.do), String(x.result ?? ""), said(x.why), said(x.simpler)]), said(we.simpler)].join(" ")]);
      if (we.yourStep) { seq.push(["c", "workedExample.yourStep", we.yourStep]); seq.push(["t", "workedExample.yourStep", `${said(we.yourStep.simpler)} ${said(we.yourStep.why)}`]); }
      seq.push(["t", "workedExample.answer", `${said(we.answer)} ${said(we.why)}`]);
    }
    for (const c of k.checks) { seq.push(["c", c.id, c]); seq.push(["t", c.id, `${said(c.simpler)} ${said(c.why)}`]); }
    seq.forEach(([kind, id, c], i) => {
      if (kind !== "c") return;
      // (the numbers of the question itself: its last sentence that asks, "What is 4 × 7?" after "4 × 6 = 24 hai")
      const q = (lang) => { const t = String(c.prompt?.[lang] ?? ""); const qs = t.split(/(?<=[.?!])\s+/).filter((x) => x.includes("?")); return qs.length ? qs.at(-1) : t; };
      const pn = [...new Set(([q("hi"), q("en")].join(" ").replace(/(\d),(?=\d{2,3}\b)/g, "$1").match(/\d+(?:[./]\d+)?/g) ?? []).filter((n) => n !== "0" && n !== "1"))];
      const allPn = [...new Set((said(c.prompt).replace(/(\d),(?=\d{2,3}\b)/g, "$1").match(/\d+(?:[./]\d+)?/g) ?? []).filter((n) => n !== "0" && n !== "1"))];
      // (in its skill: the key said with one of the card's own numbers, or a word key — a value in passing in another problem,
      // "30 cm" for a hexagon before a 30 m room, is not this card's answer)
      // (the worked problem's own given is its yourStep's answer when the maths says so: vertically opposite angles are equal)
      const given = id === "workedExample.yourStep" ? said(we?.problem) : "";
      for (const [, at, t] of seq.slice(0, i).filter(([kk]) => kk === "t")) {
        const hit = states(t, c).filter((h) => (!/\d/.test(h) || shares(t, allPn, h)) && !(given && hasNum(given, h)));
        if (hit.length) e.push(`${k.skillId}/${id}: its key ${hit.join(", ")} is already said in ${at}`); }
      // (an earlier skill: the line solved this card — its key with every number its question gives — not a number in passing)
      for (const [, at, t] of before) { const hit = states(t, c).filter((h) => /\d/.test(h) && !pn.includes(h)); if (hit.length && pn.length && pn.every((n) => hasNum(t, n))) e.push(`${k.skillId}/${id}: its key ${hit.join(", ")} is already said, with its prompt's ${pn.join(", ")}, in ${at}`); }
    });
    // (an earlier skill's lines were said too: c4-ch09's s2 worked "4 × 7 = 28" before s3 c1 asks 4 × 7)
    before.push(...seq.filter(([kk]) => kk === "t").map(([kk, id, t]) => [kk, `${k.skillId}/${id}`, t]));
    // then-cards: against every why, point and worked line of the skill
    const teach = seq.filter(([kk]) => kk === "t");
    (k.remediation ?? []).forEach((r, j) => { if (!r.then) return;
      const tn = [...new Set((said(r.then.prompt).replace(/(\d),(?=\d{2,3}\b)/g, "$1").match(/\d+(?:[./]\d+)?/g) ?? []).filter((n) => n !== "0" && n !== "1"))];
      for (const [, at, t] of teach) { const hit = states(t, r.then).filter((h) => !/\d/.test(h) || shares(t, tn, h)); if (hit.length) e.push(`${k.skillId}/remediation[${j}].then: its key ${hit.join(", ")} is already said in ${at}`); } });
  }
  return [...new Set(e)];
}

/** main on batch 3 (c4-ch14: a then-card = ladder rung i02; a worked problem = rung i04): a script card never repeats a kit
 * ladder item — the same prompt numbers and the same answer — and a worked problem never uses an item's numbers with its answer. */
export function ladderRepeatErrors(s, kit) {
  if (!kit?.items?.length) return [];
  const e = [], said = (x) => (x && typeof x === "object" ? (x.en ?? x.hi ?? "") : String(x ?? ""));
  const nums = (t) => (String(t ?? "").replace(/(\d),(?=\d{2,3}\b)/g, "$1").match(/\d+(?:[./]\d+)?/g) ?? []).sort().join(" ");
  const keyNum = (v) => (String(v ?? "").replace(/(\d),(?=\d{2,3}\b)/g, "$1").match(/\d+(?:[./]\d+)?/) ?? [String(v ?? "").toLowerCase().trim()])[0];
  const items = kit.items.map((it) => ({ id: it.id.replace(`${kit.topicId}-`, ""), n: nums(it.prompt_en), a: keyNum(it.answer) })).filter((x) => x.n);
  for (const [where, c] of cardsInOrder(s)) {
    const n = nums(said(c.prompt)), a = keyNum(c.key);
    const hit = n && items.find((it) => it.n === n && it.a === a);
    if (hit) e.push(`${where}: repeats kit ladder item ${hit.id} (numbers ${n}, answer ${c.key}): ask something the practice does not`);
  }
  for (const k of s.skills) { const we = k.workedExample; if (!we?.problem) continue;
    const n = nums(said(we.problem)), last = keyNum(String(we.steps?.at(-1)?.result ?? ""));
    const hit = n && items.find((it) => it.n === n && (it.a === last || n.split(" ").length >= 2 && it.a === keyNum(said(we.answer))));
    if (hit) e.push(`${k.skillId}/workedExample: repeats kit ladder item ${hit.id} (numbers ${n}): the worked problem uses its own numbers`); }
  return [...new Set(e)];
}

function deSaid(x) { return (x && typeof x === "object" ? [x.hi, x.en].filter(Boolean).join(" ") : String(x ?? "")); }
function deStop() { return new Set("the a an and or of to in on at is are was were be it its this that these those what which who how many much does do did can will would should there here than then with from for by as your you she he they we our their his her ek ka ki ke ko se me mein par hai hain tha thi the toh aur ya kya kaun kaunsa kaunsi kitna kitni kitne yeh woh is us inka unka iska uska apna apni apne batao bolo socho dekho kar karo hota hoti hote hua hui wala wali wale bhi hi nahi no yes haan sahi galat right wrong same different board par every still look take just went came only none exactly where towards small large longer shorter bigger smaller split match fits further meeting both each other again once more after before first second third last next half whole into onto over under left made make makes come comes goes going turn turned turns show shows tell says said give gives used uses using keep kept like want".split(" ")); }
function deWords(t) { const S = deStop(); return (String(t ?? "").toLowerCase().match(/\p{L}{4,}/gu) ?? []).filter((w) => !S.has(w)); }
/** (d) main on batch 4 and the pilots: a remediation's say never states or acts out its own then-card's key. Staying on the
 * same object is fine when the then-card is another instance (other numbers, or the other case) whose answer the say does not
 * give. Refused: the then-card's word key said in the say/simpler; its number key said there; or the say working the then-card's
 * own instance (all of the then-prompt's numbers, or for a number-free yes/no card two of its object words) and concluding. */
export function thenSayErrors(s) {
  const e = [];
  const prompts = []; for (const k of s.skills) { for (const b of k.explain) if (b.ask) prompts.push(b.ask); if (k.workedExample?.yourStep) prompts.push(k.workedExample.yourStep); prompts.push(...k.checks); for (const r of k.remediation) if (r.then) prompts.push(r.then); }
  const df = new Map(); for (const c of prompts) for (const w of new Set(deWords(c.prompt?.en))) df.set(w, (df.get(w) ?? 0) + 1);
  const terms = new Set(s.skills.flatMap((k) => k.explain.flatMap((b) => (b.mustSay ?? []).flatMap((m) => deWords(deSaid(m))))));
  const nums = (t) => [...new Set((String(t ?? "").replace(/(\d),(?=\d{2,3}\b)/g, "$1").match(/\d+(?:[./]\d+)?/g) ?? []).filter((n) => n !== "0" && n !== "1"))];
  const hasNum = (t, c) => new RegExp(`(^|[^\\d/.])${c.replace(/[./]/g, "\\$&")}([^\\d/]|$)`).test(` ${t} `);
  for (const k of s.skills) (k.remediation ?? []).forEach((r, i) => {
    if (!r.then) return;
    const say = ` ${deSaid(r.say)} ${deSaid(r.simpler)} `, sayL = say.toLowerCase();
    const key = String(r.then.key ?? "").trim(), kl = key.toLowerCase(), prompt = deSaid(r.then.prompt);
    const at = `${k.skillId}/remediation[${i}]`;
    // (a word key, said in the say and not offered by the then-card's own prompt)
    if (/^\p{L}[\p{L} -]{2,}$/u.test(key) && !/^(yes|no|haan|han|nahi|nahin)$/i.test(key) && new RegExp(`(?<![\\p{L}])${kl.replace(/[-]/g, "[- ]")}(?![\\p{L}])`, "u").test(sayL) && !prompt.toLowerCase().includes(kl)) { e.push(`${at}: its say states "${key}", its then-card's key`); return; }
    // (a number key said in the say, with one of the then-card's own numbers: the say worked its instance)
    const kn = (key.replace(/(\d),(?=\d{2,3}\b)/g, "$1").match(/^(?:₹\s*)?(\d+(?:[./]\d+)?)/) ?? [])[1];
    const pn = nums(r.then.prompt?.en ?? r.then.prompt?.hi);
    if (kn && hasNum(say, kn) && !hasNum(prompt, kn) && (pn.length === 0 || pn.some((n) => hasNum(say, n)))) { e.push(`${at}: its say states ${kn}, its then-card's key, on the then-card's own numbers`); return; }
    // (a yes/no card: the say works the then-card's own instance)
    if (/^(yes|no|haan|han|nahi|nahin)$/i.test(key)) {
      // (the then-card's givens: its numbers outside the question sentence — "Is that 2/4?" proposes, the 4 pieces and 2 eaten are the case)
      const en = String(r.then.prompt?.en ?? r.then.prompt?.hi ?? ""), qs = en.split(/(?<=[.?!])\s+/), givenTxt = qs.filter((x) => !x.includes("?")).join(" ");
      const gn = givenTxt ? nums(givenTxt) : pn;
      const same = gn.length ? gn.every((n) => hasNum(say, n)) : [...new Set(deWords(r.then.prompt?.en))].filter((w) => (df.get(w) ?? 0) < 3 && !terms.has(w) && sayL.includes(w)).length >= 2;
      if (same) e.push(`${at}: its say acts out its then-card's own case (${gn.length ? gn.join(", ") : "same objects"}), whose yes/no answer it gives: the then-card asks another instance`);
    }
  });
  return e;
}
/** (f) main on the pilots (c4: all 12 yes/no keys "No"): yes/no keys are not all one answer in a script, and a skill never
 * runs three yes/no cards in a row with the same key. A child who always says "nahi" fails some probes. */
export function yesNoSpreadErrors(s) {
  const e = [], yn = (k) => { const x = String(k ?? "").trim().toLowerCase(); return /^(yes|haan|han)$/.test(x) ? "yes" : /^(no|nahi|nahin)$/.test(x) ? "no" : null; };
  const all = [];
  for (const k of s.skills) {
    const cards = [...k.explain.filter((b) => b.ask).map((b) => [b.id, b.ask]), ...(k.workedExample?.yourStep ? [["workedExample.yourStep", k.workedExample.yourStep]] : []), ...k.checks.map((c) => [c.id, c]), ...k.remediation.map((r, i) => r.then && [`remediation[${i}].then`, r.then]).filter(Boolean)];
    const run = cards.map(([id, c]) => [id, yn(c.key)]).filter(([, v]) => v);
    all.push(...run.map(([, v]) => v));
    for (let i = 2; i < run.length; i++) if (run[i][1] === run[i - 1][1] && run[i][1] === run[i - 2][1]) e.push(`${k.skillId}/${run[i][0]}: the third yes/no card in a row keyed "${run[i][1]}" (${run[i - 2][0]}, ${run[i - 1][0]}): vary the answer`);
  }
  if (all.length >= 3 && new Set(all).size === 1) e.push(`script: all ${all.length} yes/no cards are keyed "${all[0]}": a child who always says it passes every probe`);
  return e;
}
/** (e) a skill does not ask the same question frame twice: prompts with numbers and letter names masked, word/letter/yes-no keys. */
/** (h) main 2026-11-11, from Brain's authoredWhole: every authored unit she says whole (a point, simpler, card, remediation say,
 *  then-card, worked problem, given, step simpler, yourStep, hook use, bridge, greetSimpler) has no whole sentence of three words or
 *  more that another unit also holds, in either form. Two units sharing a sentence make the runtime unable to tell which one was
 *  started, and a simpler that repeats a sentence of what it simplifies gives the child the same words again. Slots ({friend}) are
 *  read as one word, so "{friend} kehta hai … Kya woh sahi hai?" and "Rahul kehta hai … Kya woh sahi hai?" share their tail. */
export function sharedSentenceErrors(s) {
  const units = [];
  const add = (where, v, parent = null) => { for (const lang of ["hi", "en"]) { const t = typeof v === "string" ? (lang === "hi" ? v : null) : v?.[lang]; if (t) units.push({ where, lang, t, parent }); } };
  add("greetSimpler", s.greetSimpler);
  for (const [n, sk] of (s.skills ?? []).entries()) {
    const S = sk.skillId ?? `s${n + 1}`;
    (sk.hook?.interestSlots ?? []).forEach((sl, i) => add(`${S}/hook.slot${i}`, sl.use));
    for (const e of sk.explain ?? []) { add(`${S}/${e.id}.point`, e.point); add(`${S}/${e.id}.simpler`, e.simpler, `${S}/${e.id}.point`); add(`${S}/${e.id}.ask`, e.ask?.prompt); add(`${S}/${e.id}.ask.simpler`, e.ask?.simpler, `${S}/${e.id}.ask`); }
    (sk.remediation ?? []).forEach((m, i) => { const R = `${S}/remediation[${i}]`; add(`${R}.say`, m.say); add(`${R}.simpler`, m.simpler, `${R}.say`); add(`${R}.then`, m.then?.prompt); add(`${R}.then.simpler`, m.then?.simpler, `${R}.then`); });
    const we = sk.workedExample;
    if (we) {
      add(`${S}/workedExample.problem`, we.problem); add(`${S}/workedExample.simpler`, we.simpler, `${S}/workedExample.problem`);
      (we.givens ?? []).forEach((g, k) => add(`${S}/workedExample.givens[${k}]`, g));
      (we.steps ?? []).forEach((st, k) => add(`${S}/workedExample.steps[${k}].simpler`, st.simpler));
      add(`${S}/workedExample.yourStep`, we.yourStep?.prompt); add(`${S}/workedExample.yourStep.simpler`, we.yourStep?.simpler, `${S}/workedExample.yourStep`);
    }
    for (const c of sk.checks ?? []) { add(`${S}/${c.id}`, c.prompt); add(`${S}/${c.id}.simpler`, c.simpler, `${S}/${c.id}`); }
    add(`${S}/bridgeToNext`, sk.bridgeToNext);
  }
  const keyOf = (x) => String(x).toLowerCase().replace(/\{\w+\}/g, " slot ").replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
  const seen = new Map(), e = [];
  for (const u of units) {
    for (const sent of sentencesOf(u.t)) {
      const k = keyOf(sent);
      if (k.split(" ").length < 3) continue;
      const m = `${u.lang}|${k}`, prev = seen.get(m);
      if (!prev) { seen.set(m, u); continue; }
      if (prev.where === u.where) continue;
      const own = u.parent === prev.where || prev.parent === u.where;
      // (a card's short question tag, "Kya woh sahi hai?" / "Is that right?", may close many cards: it names no unit)
      if (!own && /[?？]\s*$/.test(sent) && k.split(" ").length <= 5) continue;
      const kind = own ? "a simpler repeats a sentence of what it simplifies" : "two units share a whole sentence";
      e.push(`${u.where}${u.lang === "en" ? " (en)" : ""}: ${kind} with ${prev.where}: "${sent.slice(0, 70)}" (say it in other words)`);
    }
  }
  return e;
}

/** director21 (dc-r8-director21) data rules. friendVerb, bridgeTrue and hookReuse hold for every v2.3+ script; E1 (teachback,
 *  wrap), C1 (second wordings), S2 (reask) and one-word-per-idea are required from v2.4. */
function FRIEND_M_RE() { return /\b(kehta|bolta|karta|leta|deta|jaata|jata|aata|khaata|khata|sochta|likhta|ginta|banata|rakhta|chalta|daudta|padhta|gaya|liya|diya|likha|kaha|bola|socha|gina|banaya|rakha|chala|daud[aā]|padha|hua|tha)\b/i; }
function FRIEND_F_RE() { return /\b(kehti|bolti|karti|leti|deti|jaati|jati|aati|khaati|khati|sochti|likhti|ginti|banati|rakhti|chalti|daudti|padhti|gayi|gai|li|di|likhi|kahi|boli|sochi|ginti|banayi|rakhi|chali|daudi|padhi|hui|thi)\b/i; }
export function friendVerbErrors(s) {
  const e = [];
  const walk = (x, p, k) => {
    if (typeof x === "string") {
      if (k !== "hi") return;
      for (const m of x.matchAll(/\{(friend|friendM|friendF)\}((?:\s+\S+){1,7})/g)) {
        // (the verb that agrees is the first gendered verb after the name, before the next sentence)
        const tail = m[2].split(/[.?!:;]/)[0];
        const masc = tail.match(FRIEND_M_RE()), fem = tail.match(FRIEND_F_RE());
        // (with "ne" the verb agrees with the object, not the speaker: "Zoya ne kaha" is right for anyone)
        if (/^\s*(ka\s+kehna|ne)\b/i.test(m[2])) continue;
        if (m[1] === "friend" && (masc || fem)) e.push(`${p}: {friend} with the verb "${(masc ?? fem)[0]}": the name may be a girl's or a boy's; use {friendM}/{friendF}, or "{friend} ka kehna hai" (director21 row 12)`);
        else if (m[1] === "friendF" && masc && !fem) e.push(`${p}: {friendF} with the masculine verb "${masc[0]}"`);
        else if (m[1] === "friendM" && fem && !masc) e.push(`${p}: {friendM} with the feminine verb "${fem[0]}"`);
      }
      return;
    }
    if (Array.isArray(x)) x.forEach((y, i) => walk(y, `${p}[${i}]`, k));
    else if (x && typeof x === "object") for (const [kk, v] of Object.entries(x)) if (kk !== "joints") walk(v, p ? `${p}.${kk}` : kk, kk === "hi" ? "hi" : k);
  };
  walk(s, "", null);
  return e;
}
/** A bridge says what comes next; it is never a recap of what was done ("Ab tak ek roti ke barabar hisse kiye", "sirf ek hop
 *  chale", "Neeche ka number same tha"): a lesson can reach it by a path that did none of it. */
export function bridgeTrueErrors(s) {
  const e = [];
  const PAST = { hi: /\b(ab tak|abhi tak|ab talak|humne|hum ne|tumne|tum ne)\b|\b\w+(e|i|a)\s+(the|thi|tha)\b|\b(chale|kiye|kiya|dekha|dekhe|seekha|seekhe|nikala|nikale)\b/i,
    en: /\bso far\b|\bwe (have |'ve )?(did|done|saw|seen|learned|learnt|went|stopped|found)\b|\byou (did|have done|found)\b|\buntil now\b/i };
  for (const k of s.skills ?? []) for (const lang of ["hi", "en"]) {
    for (const [f, v] of [["bridgeToNext", k.bridgeToNext?.[lang]], ["bridgeToNext.simpler", k.bridgeToNext?.simpler?.[lang]]]) {
      const t = String(v ?? ""); const m = t.match(PAST[lang]);
      if (m) e.push(`${k.skillId}/${f}${lang === "en" ? " (en)" : ""}: a bridge says what comes next, never what was done ("${m[0]}"): it must be true on every path (director21 row 12)`);
    }
  }
  return e;
}
/** A hook's things are said again in its skill (c4 s2's "dibbe" never came back). */
function HOOK_STOP() { return new Set("socho dekho jaise kabhi tumne tumhare tumhari humare aaj kuch bahut sabse jab tab phir aur lekin isliye kyunki wala wali wale kitna kitni kitne ek do teen char paanch hota hoti hote hain hai tha thi the karte karti karta liye mein par se ko ki ka ke bhi toh yeh woh agar".split(" ")); }
export function hookReuseErrors(s) {
  const e = [];
  const said = (x) => (x && typeof x === "object" ? String(x.hi ?? "") : String(x ?? "")).toLowerCase();
  for (const k of s.skills ?? []) {
    const { hook, ...rest } = k;
    const later = JSON.stringify(rest).toLowerCase();
    for (const [i, sl] of (hook?.interestSlots ?? []).entries()) {
      const words = said(sl.use).replace(/\{[a-z]+\}/g, " ").match(/\p{L}{4,}/gu) ?? [];
      const things = words.filter((w) => !HOOK_STOP().has(w));
      if (things.length && !things.some((w) => new RegExp(`(?<![\\p{L}])${w.slice(0, Math.max(4, w.length - 1))}`, "u").test(later))) e.push(`${k.skillId}/hook.slot${i}: none of the hook's things (${things.slice(0, 4).join(", ")}) is said again in the skill: use them or cut the hook (director21 row 12)`);
    }
  }
  return e;
}
/** One word per idea (director21 row 12: the twins check missed gaps/hisse, hisse/kadam, dheri/group, hisse/tukda): within one
 *  script's spoken Hindi, words of one set name one thing; a script uses one of them. */
export function SYNONYM_SETS() { return [
  { idea: "a step along a line", words: ["gap", "gaps", "kadam", "kadmon", "hop", "hops", "chhalaang", "chhalaangein"] },
  { idea: "a group of things", words: ["dheri", "dheriyan", "dheriyon", "group", "groups", "samooh", "samoohon"] },
  { idea: "one piece of a cut whole", words: ["tukda", "tukde", "tukdon", "hissa", "hisse", "hisson"] },
  // director22 clause 8: c6 said aadha raasta, aadha kinaara, aadha chakkar and aadha parimap for one thing; c4 and c5-t02 said
  // "bar" beside "patti" for the drawn strip
  { idea: "half the way round", words: ["aadha raasta", "aadhe raaste", "aadha kinaara", "aadhe kinaare", "aadha chakkar", "aadhe chakkar", "aadha parimap", "aadhe parimap", "aadha perimeter", "aadhe perimeter"] },
  { idea: "a drawn strip", words: ["bar", "bars", "patti", "pattiyan", "pattiyon"] },
]; }
/** The spoken-Hindi counts of each synonym set's words in one script ({ [setIdx]: { word: n } }), the `terms` glossary and the
 *  joints left out. */
export function synonymUse(s) {
  const { joints, terms, ...rest } = s;
  const hi = []; const walk = (x, k) => { if (typeof x === "string") { if (k === "hi") hi.push(x); } else if (Array.isArray(x)) x.forEach((y) => walk(y, k)); else if (x && typeof x === "object") for (const [kk, v] of Object.entries(x)) walk(v, kk === "hi" ? "hi" : k === "hi" ? "hi" : kk); };
  walk(rest, null); const t = hi.join(" \n ").toLowerCase();
  return SYNONYM_SETS().map((set) => { const used = {}; for (const w of set.words) { const n = (t.match(new RegExp(`(?<![\\p{L}])${w}(?![\\p{L}])`, "gu")) ?? []).length; if (n) used[w] = n; } return used; });
}
// (forms of one word count as one: "tukda/tukde/tukdon" is one root)
// (a two-word name is told apart by its second word: "aadha raasta" and "aadhe raaste" are one name, "aadha kinaara" another)
function rootOf(w) { if (w.includes(" ")) return rootOf(w.split(" ").slice(1).join(" ")); return w.replace(/(on|ein|iyan|iyon|yan|yon|e|s|a|i)$/, "").slice(0, 4); }
export function synonymErrors(s) {
  const e = [];
  SYNONYM_SETS().forEach((set, i) => {
    const used = synonymUse(s)[i];
    const roots = new Set(Object.keys(used).map(rootOf));
    if (roots.size > 1) e.push(`one word per idea (${set.idea}): this script says ${Object.entries(used).map(([w, n]) => `"${w}" ×${n}`).join(", ")}; say one (director21 row 12)`);
  });
  return e;
}
/** main, 2026-11-15: a chapter shares one word per idea, because a child takes all its lessons (c5-t01 said "tukde" and c5-t02
 *  "hisse" for an equal part of a whole). Across the scripts of one chapter (same class and chapter in the topicId), each synonym
 *  set's chapter word is the root used most; a script using another root for that idea is refused. `scripts` is [{ topicId, s }]. */
export function chapterSynonymErrors(topicId, scripts) {
  const ch = (t) => t.split("-").slice(0, 3).join("-");
  const mine = scripts.filter((x) => ch(x.topicId) === ch(topicId));
  if (mine.length < 2) return [];
  const e = [];
  // (twin pairs count too: "line" in one lesson and "rekha" in the next is two words for one thing to the child)
  const sets = [...SYNONYM_SETS(), ...TWINS.map((p) => ({ idea: `${p.en[0]} / ${p.hi[0]}`, words: [...p.en, ...p.hi], twin: p }))];
  const useOf = (sc, set, i) => {
    if (!set.twin) return synonymUse(sc)[i];
    const { joints, terms, ...rest } = sc;
    const hi = []; const walk = (x, k) => { if (typeof x === "string") { if (k === "hi") hi.push(x); } else if (Array.isArray(x)) x.forEach((y) => walk(y, k)); else if (x && typeof x === "object") for (const [kk, v] of Object.entries(x)) walk(v, kk === "hi" ? "hi" : k === "hi" ? "hi" : kk); };
    walk(rest, null); const t = hi.join(" \n ").toLowerCase(); const u = {};
    for (const side of ["en", "hi"]) { const n = set.twin[side].reduce((a, w) => a + (t.match(new RegExp(`(?<![\\p{L}])${w.replace(/\s+/g, "\\s+")}(?![\\p{L}])`, "gu")) ?? []).length, 0); if (n) u[set.twin[side][0]] = n; }
    return u;
  };
  const rootFor = (set, w) => (set.twin ? w : rootOf(w));
  sets.forEach((set, i) => {
    const tally = {}, byScript = {};
    for (const { topicId: t, s } of mine) { const u = useOf(s, set, i); byScript[t] = new Set(Object.keys(u).map((w) => rootFor(set, w))); for (const [w, n] of Object.entries(u)) tally[rootFor(set, w)] = (tally[rootFor(set, w)] ?? 0) + n; }
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!top) return;
    const other = [...(byScript[topicId] ?? [])].filter((r) => r !== top);
    if (other.length) e.push(`one word per idea in chapter ${ch(topicId)} (${set.idea}): this script says ${other.map((r) => set.words.find((w) => rootFor(set, w) === r)).join(", ")} where the chapter's lessons say ${set.words.find((w) => rootFor(set, w) === top)} (main 2026-11-15)`);
  });
  return e;
}
/** v2.4 (director21 E1, C1, S2): the ending, second wordings and question-only re-asks are authored. */
export function d22Errors(s) {
  if (!isV24(s)) return [];
  const e = [];
  const two = (x, at) => { const r = []; for (const l of ["hi", "en"]) if (!String(x?.[l] ?? "").trim()) r.push(`${at}${l === "en" ? " (en)" : ""}: empty`); return r; };
  const keyOf = (x) => String(x).toLowerCase().replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
  // E1
  const tb = s.teachback;
  if (!tb) e.push("teachback: { prompt, key, accept[], why, board? } (director21 E1)");
  else {
    // director22 T2: three lead-in forms, one said before the teach-back: one sentence that says a last question is coming and
    // names nothing in it (no value, no question, no praise)
    if (!Array.isArray(tb.leadIn) || tb.leadIn.length !== 3) e.push("teachback.leadIn: three forms [{ hi, en }] (director22 T2)");
    else {
      const seen = new Set();
      tb.leadIn.forEach((f, i) => {
        e.push(...two(f, `teachback.leadIn[${i}]`));
        for (const l of ["hi", "en"]) {
          const x = String(f?.[l] ?? ""), at = `teachback.leadIn[${i}]${l === "en" ? " (en)" : ""}`;
          if (!x) continue;
          if (sentencesOf(x).length !== 1) e.push(`${at}: one sentence`);
          if (/[?？]/.test(x)) e.push(`${at}: asks nothing (the teach-back is the question)`);
          if (/\d/.test(x)) e.push(`${at}: names no value`);
          if (x.split(/\s+/).length > 14) e.push(`${at}: at most 14 words`);
          if (/\b(shabaash|bahut badhiya|great|well done|good job|excellent|bahut achha)\b/i.test(x)) e.push(`${at}: praises nothing`);
          if (l === "hi") { const k = keyOf(x); if (seen.has(k)) e.push(`${at}: the same as another form`); seen.add(k); }
        }
      });
    }
    e.push(...two(tb.prompt, "teachback.prompt"), ...two(tb.why, "teachback.why"));
    if (tb.key == null || String(tb.key).trim() === "") e.push("teachback.key: missing");
    if (!Array.isArray(tb.accept)) e.push("teachback.accept: a list");
    if (!/[?？]\s*$/.test(String(tb.prompt?.hi ?? ""))) e.push("teachback.prompt: ends on its question");
    if (sentencesOf(tb.prompt?.hi).length > 3) e.push("teachback.prompt: at most three sentences");
  }
  const w = s.wrap;
  if (!w) e.push("wrap: { covered, goodbye } (director21 E1)");
  else {
    e.push(...two(w.covered, "wrap.covered"), ...two(w.goodbye, "wrap.goodbye"));
    for (const l of ["hi", "en"]) {
      const c = String(w.covered?.[l] ?? ""), g = String(w.goodbye?.[l] ?? ""), at = l === "en" ? " (en)" : "";
      if (sentencesOf(c).length !== 2) e.push(`wrap.covered${at}: exactly two sentences on what the lesson covered (got ${sentencesOf(c).length})`);
      if (/[?？]/.test(c + g)) e.push(`wrap${at}: asks nothing`);
      if (/\b(tum|tumne|tumhe|tumhara|tumhari|tumhare|aapne|you|your)\b/i.test(c)) e.push(`wrap.covered${at}: says what the lesson covered, never what the child did ("${c.match(/\b(tum|tumne|tumhe|tumhara|tumhari|tumhare|aapne|you|your)\b/i)[0]}")`);
      if (/\b(shabaash|bahut badhiya|great job|well done|good job|excellent)\b/i.test(c + g)) e.push(`wrap${at}: praises nothing (the child's work is not known to an authored line)`);
      if (sentencesOf(g).length !== 1) e.push(`wrap.goodbye${at}: one sentence`);
    }
  }
  // C1: a second wording shows it another way: no sentence of the first, and not the first shortened
  const alt = (first, second, at) => {
    if (!second) return [`${at}: missing (director21 C1: a second wording that shows it another way)`];
    const r = [...two(second, at)];
    for (const l of ["hi", "en"]) {
      const a = String(first?.[l] ?? ""), b = String(second?.[l] ?? ""); if (!a || !b) continue;
      const as = new Set(sentencesOf(a).map(keyOf).filter((x) => x.split(" ").length >= 3));
      const hit = sentencesOf(b).map(keyOf).find((x) => as.has(x));
      if (hit) r.push(`${at}${l === "en" ? " (en)" : ""}: repeats a sentence of the first wording ("${hit.slice(0, 50)}")`);
      const aw = new Set(keyOf(a).split(" ")), bw = keyOf(b).split(" ").filter((x) => x.length > 2);
      if (bw.length && bw.filter((x) => aw.has(x)).length / bw.length > 0.8) r.push(`${at}${l === "en" ? " (en)" : ""}: the first wording shortened (${Math.round(100 * bw.filter((x) => aw.has(x)).length / bw.length)}% of its words are the first's): show it another way`);
    }
    return r;
  };
  // S2: a card whose last sentence cannot stand alone carries a reask
  const BACK = /\b(woh|wo|yeh|ye|uska|uski|uske|iska|iski|iske|unka|inka|use|ise|it|that|this|they|he|she|them|its)\b/i;
  const card = (c, at) => {
    const r = [];
    if (c?.why) r.push(...alt(c.why, c.whyAlt, `${at}.whyAlt`));
    const ss = sentencesOf(c?.prompt?.hi), last = ss.at(-1) ?? "";
    const needs = ss.length > 1 && (BACK.test(last) || last.split(/\s+/).length <= 5);
    if (c?.reask) {
      r.push(...two(c.reask, `${at}.reask`));
      for (const l of ["hi", "en"]) { const t = String(c.reask[l] ?? ""); if (t && (sentencesOf(t).length !== 1 || !/[?？]\s*$/.test(t))) r.push(`${at}.reask${l === "en" ? " (en)" : ""}: one question, alone`);
        if (t && l === "hi" && BACK.test(t) && !/\d/.test(t)) r.push(`${at}.reask: points back ("${t.match(BACK)[0]}") without its givens: a reask stands alone`); }
    } else if (needs) r.push(`${at}: its last sentence "${last.slice(0, 50)}" cannot be asked alone: give it a reask (director21 S2)`);
    return r;
  };
  for (const k of s.skills ?? []) {
    const S = k.skillId;
    // director22 T5: each skill says in one sentence what it covered; the wrap says those of the skills the lesson reached
    if (!k.covered) e.push(`${S}.covered: one sentence on what this skill covered (director22 T5)`);
    else {
      e.push(...two(k.covered, `${S}.covered`));
      for (const l of ["hi", "en"]) {
        const c = String(k.covered?.[l] ?? ""), at = `${S}.covered${l === "en" ? " (en)" : ""}`;
        if (!c) continue;
        if (sentencesOf(c).length !== 1) e.push(`${at}: one sentence (got ${sentencesOf(c).length})`);
        if (/[?？]/.test(c)) e.push(`${at}: asks nothing`);
        if (/\b(tum|tumne|tumhe|tumhara|tumhari|tumhare|aapne|you|your)\b/i.test(c)) e.push(`${at}: says what the lesson covered, never what the child did`);
        if (/\b(shabaash|bahut badhiya|great job|well done|good job|excellent)\b/i.test(c)) e.push(`${at}: praises nothing`);
      }
    }
    // director22 clause 8: a remediation said again shows it another way (offtopic 62 repeated row 60 word for word)
    (k.remediation ?? []).forEach((r, i) => { if (r.say) e.push(...alt(r.say, r.sayAlt, `${S}/remediation[${i}].sayAlt`)); });
    for (const b of k.explain ?? []) { e.push(...alt(b.point, b.pointAlt, `${S}/${b.id}.pointAlt`)); if (b.ask) e.push(...card(b.ask, `${S}/${b.id}.ask`)); }
    const we = k.workedExample;
    if (we) { e.push(...alt(we.problem, we.problemAlt, `${S}/workedExample.problemAlt`)); if (we.yourStep) e.push(...card(we.yourStep, `${S}/workedExample.yourStep`)); }
    for (const c of k.checks ?? []) e.push(...card(c, `${S}/${c.id}`));
    (k.remediation ?? []).forEach((r, i) => { if (r.then) e.push(...card(r.then, `${S}/remediation[${i}].then`)); });
  }
  return [...e, ...synonymErrors(s)];
}
/** director23 (dc-r8-director23 C, T2): an authored caption for every board's picture view, and the wrap's acknowledgement forms.
 *  `viewCaption` { hi, en } sits beside each `board` a card, beat, worked example or remediation carries: one or two sentences that
 *  say what to look at in the picture, asking nothing and naming no key of its own card or of any card after it (the picture is
 *  drawn while the card is still open). `wrap.ack`: three forms, one short sentence each, said when the child spoke after the
 *  closing key's check-in; it grades nothing and praises nothing. */
export function d24Errors(s) {
  if (!isV24(s)) return [];
  const e = [];
  const items = [];
  const walk = (x, p) => {
    if (Array.isArray(x)) return x.forEach((y, i) => walk(y, `${p}[${i}]`));
    if (!x || typeof x !== "object") return;
    if (x.board?.template) items.push({ at: p, x });
    else if (x.key != null && x.prompt) items.push({ at: p, x });
    // (dc-r8-director27: a quick question's key is read off its own point's board by design; it is no later card's answer)
    // (and a worked step's ask is held against its own worked example's captions below, not every later caption: "1" or "4" as a
    // step's count is not given away by a caption of another board that names the same small number)
    for (const [k, v] of Object.entries(x)) if (k !== "board" && k !== "answerBoard" && k !== "viewCaption" && k !== "quick" && !(k === "ask" && /\.steps\[\d+\]$/.test(p))) walk(v, p ? `${p}.${k}` : k);
  };
  (s.skills ?? []).forEach((k, i) => walk(k, `skills[${i}]`));
  const keyHit = (text, key) => {
    const k = String(key ?? "").toLowerCase().trim();
    if (!k || !/\d/.test(k)) return false;
    return new RegExp(`(^|[^\\w/])${esc(k)}([^\\w/]|$)`).test(String(text).toLowerCase());
  };
  (s.skills ?? []).forEach((k, i) => { const we = k.workedExample; if (!we) return;
    // (the worked board is up while the steps are asked; the child's own step's board comes after them)
    for (const [at, c] of [[`skills[${i}].workedExample.viewCaption`, we.viewCaption]])
      for (const l of ["hi", "en"]) for (const [j, st] of (we.steps ?? []).entries()) if (st.ask && c?.[l] && keyHit(c[l], st.ask.key)) e.push(`${at}${l === "en" ? " (en)" : ""}: names steps[${j}].ask's key "${st.ask.key}"`); });
  items.forEach(({ at, x }, i) => {
    if (!x.board?.template) return;
    const c = x.viewCaption;
    if (!c) { e.push(`${at}.viewCaption: what to look at in this board's picture view (director23 C)`); return; }
    for (const l of ["hi", "en"]) {
      const t = String(c[l] ?? "").trim(), a = `${at}.viewCaption${l === "en" ? " (en)" : ""}`;
      if (!t) { e.push(`${a}: empty`); continue; }
      const n = sentencesOf(t).length;
      if (n < 1 || n > 2) e.push(`${a}: one or two sentences (got ${n})`);
      if (/[?？]/.test(t)) e.push(`${a}: asks nothing (the card asks)`);
      for (const later of items.slice(i)) if (later.x.key != null && keyHit(t, later.x.key)) { e.push(`${a}: names ${later.at === at ? "its own card's" : `${later.at}'s`} key "${later.x.key}"`); break; }
    }
  });
  // (main's R7 on the merged H4 + L2 tree: `wrap.ask`, the closing question the wrap's first turn ends on — three forms, one question
  // each, asking how the lesson felt; never a comprehension check. Optional: a script without it is said with code's fallback, and
  // scripts/lesson-scripts/compile-report.mjs lists the hole)
  const ask = s.wrap?.ask;
  if (ask !== undefined) {
    if (!Array.isArray(ask) || ask.length !== 3) e.push("wrap.ask: three forms [{ hi, en }] (the wrap's closing question)");
    else {
      const seenA = new Set();
      ask.forEach((f, i) => {
        for (const l of ["hi", "en"]) {
          const t = String(f?.[l] ?? "").trim(), a = `wrap.ask[${i}]${l === "en" ? " (en)" : ""}`;
          if (!t) { e.push(`${a}: empty`); continue; }
          if (sentencesOf(t).length !== 1 || !/[?？]$/.test(t)) e.push(`${a}: one sentence, a question`);
          if (t.split(/\s+/).length > 12) e.push(`${a}: at most 12 words`);
          if (/\b(samajh|samjha|samjhi|theek hai\?|clear|understand|make sense)\b/i.test(t)) e.push(`${a}: asks how the lesson felt, never whether it was understood`);
          if (l === "hi") { const k = t.toLowerCase(); if (seenA.has(k)) e.push(`${a}: the same as another form`); seenA.add(k); }
        }
      });
    }
  }
  const ack = s.wrap?.ack;
  if (!Array.isArray(ack) || ack.length !== 3) e.push("wrap.ack: three forms [{ hi, en }] (director23 T2: said when the child spoke after the closing key's check-in)");
  else {
    const seen = new Set();
    ack.forEach((f, i) => {
      for (const l of ["hi", "en"]) {
        const t = String(f?.[l] ?? "").trim(), a = `wrap.ack[${i}]${l === "en" ? " (en)" : ""}`;
        if (!t) { e.push(`${a}: empty`); continue; }
        if (sentencesOf(t).length !== 1) e.push(`${a}: one sentence`);
        if (t.split(/\s+/).length > 8) e.push(`${a}: at most 8 words`);
        if (/[?？]/.test(t)) e.push(`${a}: asks nothing`);
        if (/\b(sahi|galat|theek nahi|right|wrong|correct|shabaash|bahut badhiya|great|well done|good job|excellent)\b/i.test(t)) e.push(`${a}: grades and praises nothing`);
        if (l === "hi") { const k = t.toLowerCase(); if (seen.has(k)) e.push(`${a}: the same as another form`); seen.add(k); }
      }
    });
  }
  return e;
}
/** director24 (dc-r8-director24, clause 4): code picks the hardest card the child got right at the first try and says what was
 *  authored for it. `did` { hi, en } on every check card and on the teach-back: a short second-person clause that follows "Aaj
 *  tumne" ("1/3 ke neeche do 1/6 ke tukde gine"): no question, no praise, one clause of at most 12 words, not starting with
 *  "Aaj tumne" or "tumne" itself. `wrap.didFrames`: three frames, each one sentence with one {did} slot. */
export function d25Errors(s) {
  if (!isV24(s)) return [];
  const e = [];
  const did = (c, at) => {
    if (!c?.did) { e.push(`${at}.did: what doing this card was, a clause after "Aaj tumne" (director24 clause 4)`); return; }
    for (const l of ["hi", "en"]) {
      const t = String(c.did[l] ?? "").trim(), a = `${at}.did${l === "en" ? " (en)" : ""}`;
      if (!t) { e.push(`${a}: empty`); continue; }
      if (/[?？]/.test(t)) e.push(`${a}: asks nothing`);
      if (/[.!]\s*\S/.test(t) || sentencesOf(t).length > 1) e.push(`${a}: one clause`);
      if (t.split(/\s+/).length > 12) e.push(`${a}: at most 12 words`);
      if (/^(aaj\s+)?tumne\b|^(today\s+)?you\b/i.test(t)) e.push(`${a}: the clause only; "Aaj tumne" / "Today you" is the frame's`);
      if (/\b(shabaash|bahut badhiya|achha kiya|great|well done|good job|excellent|perfect)\b/i.test(t)) e.push(`${a}: praises nothing`);
    }
  };
  (s.skills ?? []).forEach((k, i) => (k.checks ?? []).forEach((c, j) => did(c, `skills[${i}].checks[${j}]`)));
  if (s.teachback) did(s.teachback, "teachback");
  const f = s.wrap?.didFrames;
  if (!Array.isArray(f) || f.length !== 3) e.push("wrap.didFrames: three frames [{ hi, en }], each one sentence with one {did} slot");
  else f.forEach((x, i) => { for (const l of ["hi", "en"]) { const t = String(x?.[l] ?? ""), a = `wrap.didFrames[${i}]${l === "en" ? " (en)" : ""}`;
    if ((t.match(/\{did\}/g) ?? []).length !== 1) e.push(`${a}: one {did} slot`);
    if (/[?？]/.test(t)) e.push(`${a}: asks nothing`);
    if (sentencesOf(t.replace("{did}", "x")).length !== 1) e.push(`${a}: one sentence`);
    if (/\b(shabaash|bahut badhiya|great|well done|good job|excellent)\b/i.test(t)) e.push(`${a}: praises nothing`); } });
  return e;
}
/** Every board and answerBoard in a script resolves (a remediation's own board is held under its then-card's when its say does
 *  not speak it, so the unit gate never resolves it: c5-ch13-t02's 1 × 20 shade-grid went past cols 10 unseen). */
export async function allBoardsResolve(s, kit) {
  const { resolveBoardRef } = await import("../../server/forge/explainer/board-ref.js");
  const e = [];
  const walk = (x, p) => {
    if (Array.isArray(x)) return x.forEach((y, i) => walk(y, `${p}[${i}]`));
    if (!x || typeof x !== "object") return;
    for (const [k, v] of Object.entries(x)) {
      if ((k === "board" || k === "answerBoard") && v && typeof v === "object" && v.template) { const r = resolveBoardRef(v, { kit }); if (!r.ok) e.push(`${p}.${k}: ${v.template} ${r.why}`); }
      else walk(v, p ? `${p}.${k}` : k);
    }
  };
  walk(s, "");
  return e;
}

/** Brain's renderer pass (bda4da9e) left three things only the text can fix: a bare "m" as a unit ("cm lenge ya m?", "har m mein
 *  100 cm"), a plural on a number or fraction ("100s", "1/5s"), and a glossary symbol in brackets ("greater than (>)"). A line
 *  named m ("line l aur m") is a name, not a unit. */
export function voiceTextErrors(s) {
  const e = [];
  const lineM = /\bline\s+m\b|\bl\s+aur\s+m\b|\bl and m\b/i.test(JSON.stringify(s));
  const walk = (x, p, k) => {
    if (typeof x === "string") {
      if (k !== "hi" && k !== "en") return;
      const at = `${p}${k === "en" ? " (en)" : ""}`;
      if (!lineM && (/\b(cm|km|mm|metre|meter|centimetre|kilometre)s?\b/i.test(x) || /(?<![\p{L}\d.'’])m\s+mein\b|\bin\s+m\b(?![\p{L}])/iu.test(x)))
        for (const m of x.matchAll(/(?<![\p{L}\d.'’])m(?![\p{L}])/gu)) if (!/[\d½¼¾]\s*$/.test(x.slice(0, m.index))) { e.push(`${at}: a bare "m" as a unit is read as a letter; say "metre" ("${x.slice(Math.max(0, m.index - 20), m.index + 15)}")`); break; }
      const ns = x.match(/\d(?:\/\d+)?s\b/);
      if (ns) e.push(`${at}: "${ns[0]}" (a plural on a number or fraction) is mis-said; say it in words ("hundreds", "fifths")`);
      const br = x.match(/\(\s*(?:&gt;|&lt;|>|<|°|1\/n|=|×|÷)\s*\)/);
      if (br) e.push(`${at}: a glossary symbol in brackets "${br[0]}" is read aloud; say the word only`);
      return;
    }
    if (Array.isArray(x)) return x.forEach((y, i) => walk(y, `${p}[${i}]`, k));
    if (x && typeof x === "object") for (const [kk, v] of Object.entries(x)) { if (kk === "board" || kk === "answerBoard") continue; walk(v, p ? `${p}.${kk}` : kk, kk); }
  };
  walk(s, "", null);
  return e;
}

export function frameRepeatErrors(s, kit = null) {
  const e = [];
  const frame = (t) => String(t ?? "").replace(/\{[a-zA-Z]+\}/g, "@n").replace(/\b[A-Z]{1,3}\b/g, "@").replace(/\d+(?:[.,/]\d+)*/g, "#").toLowerCase().replace(/[^\p{L}#@ ]+/gu, " ").split(/\s+/).filter((w) => w && !deStop().has(w));
  const jac = (a, b) => { const A = new Set(a), B = new Set(b); let n = 0; for (const x of A) if (B.has(x)) n++; return n / (A.size + B.size - n || 1); };
  const kclass = (key) => { const k = String(key ?? "").trim().toLowerCase(); return /^(yes|no|haan|nahi)$/.test(k) ? "yn" : /\d/.test(k) ? null : "w:" + k.replace(/\b[a-z]{1,3}\b/g, "@"); };
  for (const k of s.skills) {
    const cards = [...k.explain.filter((b) => b.ask).map((b) => [b.id, b.ask]), ...(k.workedExample?.yourStep ? [["workedExample.yourStep", k.workedExample.yourStep]] : []), ...k.checks.map((c) => [c.id, c]), ...k.remediation.map((r, i) => r.then && [`remediation[${i}].then`, r.then]).filter(Boolean)];
    for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) {
      const [ia, a] = cards[i], [ib, b] = cards[j], ka = kclass(a.key), kb = kclass(b.key);
      if (!ka || ka !== kb) continue;
      const J = jac(frame(a.prompt?.en), frame(b.prompt?.en));
      if (J >= 0.6) e.push(`${k.skillId}/${ib}: asks ${k.skillId}/${ia}'s question again (same frame, ${Math.round(J * 100)}% alike, key ${b.key}): ask something new`);
    }
    // (e2, main on batch 5: c6-ch07-t01 c3 = ladder rl-o2, c6-ch02-t03 s2 c1 = i03) each card against its own skill's ladder
    // items: the same frame with the same answer is a repeat of the practice
    const items = new Map((kit?.items ?? []).map((it) => [it.id, it]));
    const norm = (x) => String(x ?? "").toLowerCase().replace(/(\d),(?=\d{2,3}\b)/g, "$1").replace(/[^\p{L}\p{N}/.]+/gu, " ").trim();
    for (const l of k.ladder ?? []) {
      const it = items.get(l.itemId);
      if (!it) continue;
      for (const [ia, a] of cards) {
        const ck = norm(a.key), ik = norm(it.answer);
        if (!ck || !ik) continue;
        const same = ik === ck || ik.startsWith(`${ck} `) || [it.answer, ...(it.acceptable ?? [])].some((v) => norm(v) === ck);
        if (!same) continue;
        const J = jac(frame(a.prompt?.en), frame(it.prompt_en));
        if (J >= 0.4) e.push(`${k.skillId}/${ia}: asks its ladder item ${l.itemId.replace(/^c\d+-[a-z]+-ch\d+-t\d+-/, "")}'s question (same frame, ${Math.round(J * 100)}% alike, answer ${a.key}): ask something the practice does not, or drop that rung`);
      }
    }
  }
  return e;
}

/** (f2, main on batch 5: every "which is more" in c6-ch07-t03 s1 is "same"; every factor-or-multiple card in c6-ch05 is
 * "multiple"): a two- or three-way word key — same/more/less, before/after, factor/multiple, … — is not one answer through a
 * skill: never three in a row with the same word, and not all one word when a skill asks three or more. */
export function wordKeySpreadErrors(s) {
  const e = [];
  const CHOICE = /^(same|barabar|equal|ek jaise|utna hi|utni hi|more|less|bigger|smaller|zyada|kam|bada|chhota|badi|chhoti|before|after|pehle|baad|baad mein|factor|multiple|factors|multiples|gunankhand|guneej|common factor|common multiple|above|below|upar|neeche|left|right|daayein|baayein|clockwise|anticlockwise|even|odd|sam|visham)$/i;
  const canon = (k) => { const x = String(k ?? "").trim().toLowerCase(); return CHOICE.test(x) ? x.replace(/^(barabar|equal|ek jaise|utna hi|utni hi)$/, "same").replace(/^(zyada|bigger|bada|badi)$/, "more").replace(/^(kam|smaller|chhota|chhoti)$/, "less").replace(/^(pehle)$/, "before").replace(/^(baad|baad mein)$/, "after").replace(/^(factors|gunankhand)$/, "factor").replace(/^(multiples|guneej)$/, "multiple").replace(/^sam$/, "even").replace(/^visham$/, "odd") : null; };
  for (const k of s.skills) {
    const cards = [...k.explain.filter((b) => b.ask).map((b) => [b.id, b.ask]), ...(k.workedExample?.yourStep ? [["workedExample.yourStep", k.workedExample.yourStep]] : []), ...k.checks.map((c) => [c.id, c]), ...k.remediation.map((r, i) => r.then && [`remediation[${i}].then`, r.then]).filter(Boolean)];
    const run = cards.map(([id, c]) => [id, canon(c.key)]).filter(([, v]) => v);
    for (let i = 2; i < run.length; i++) if (run[i][1] === run[i - 1][1] && run[i][1] === run[i - 2][1]) e.push(`${k.skillId}/${run[i][0]}: the third card in a row keyed "${run[i][1]}" (${run[i - 2][0]}, ${run[i - 1][0]}): vary the answer`);
    if (run.length >= 3 && new Set(run.map(([, v]) => v)).size === 1) e.push(`${k.skillId}: all ${run.length} of its choice cards are keyed "${run[0][1]}": a child who always says it passes every one`);
  }
  return [...new Set(e)];
}

/** (g) main on batch 3's wrong key (c4-ch04 s2 e2: "5281 ka 1 … value?" keyed 10): a place-value card's key is solved from
 * its number — in its prompt, else on its own board — and must be one of the asked digit's values there; its wrongIfMis
 * must not be. Card form: "<number> mein/ka <digit> … value / jagah", "the <digit> in/of <number> … worth". */
export function placeValueKeyErrors(s) {
  const e = [];
  const text = (x) => (x && typeof x === "object" ? [x.hi, x.en].filter(Boolean).join(" ") : String(x ?? ""));
  const nums = (t) => (String(t ?? "").replace(/(\d),(?=\d{2,3}\b)/g, "$1").match(/\b\d{3,}\b/g) ?? []);
  const boardNums = (b) => { const o = []; JSON.stringify(b?.params ?? {}, (k, v) => { if (typeof v === "string" || typeof v === "number") o.push(...nums(String(v))); return v; }); return o; };
  const valOf = (v) => { const m = String(v ?? "").replace(/(\d),(?=\d{2,3}\b)/g, "$1").match(/^\s*(\d+)\s*$/); return m ? Number(m[1]) : null; };
  for (const [where, c, board] of cardsInOrder(s)) {
    const en = String(c.prompt?.en ?? ""), hi = String(c.prompt?.hi ?? "");
    if (!/\b(value|worth|place|jagah|keemat|kimat)\b/i.test(`${en} ${hi}`)) continue;
    const dm = en.match(/\bthe (\d)\b/i) ?? hi.match(/\b(?:ka|ke|mein|me)\s+(?:ank\s+)?(\d)\b/i) ?? en.match(/\bdigit (\d)\b/i);
    const key = valOf(c.key);
    if (!dm || key == null) continue;
    const d = dm[1], cand = [...new Set([...nums(en), ...nums(hi)])], ns = cand.length ? cand : [...new Set(boardNums(c.board ?? board))];
    const values = new Set(ns.flatMap((n) => [...n].map((ch, i) => (ch === d ? Number(d) * 10 ** (n.length - 1 - i) : null)).filter((v) => v != null)));
    if (!values.size) continue;
    if (!values.has(key)) e.push(`${where}: its key ${c.key} is not the value of the ${d} in ${ns.join(" / ")} (${[...values].join(" or ")}): solve the card`);
    for (const w0 of wrongsOf(c)) { const w = valOf(w0);
    if (w != null && values.has(w) && w !== key) e.push(`${where}: its wrongIfMis ${w0} is a right value of the ${d} in ${ns.join(" / ")}`); }
  }
  return e;
}

/** main on the pilots' third read (9 says naming their own rectangle or fractions over the then-card's board): a remediation's
 * say and simpler are spoken over its then-card's board, so every number they name is on that board or in the then-card's
 * own prompt. (A shape the board does not draw is the whiteboard gate's W10.) */
export function sayBoardNumberErrors(s) {
  const e = [];
  const txt = (x) => (x && typeof x === "object" ? [x.hi, x.en].filter(Boolean).join(" ") : String(x ?? ""));
  const nums = (t) => (String(t ?? "").replace(/(\d),(?=\d{2,3}\b)/g, "$1").match(/\d+(?:[./]\d+)?/g) ?? []);
  for (const k of s.skills) (k.remediation ?? []).forEach((r, i) => {
    if (!r.then?.board) return;
    const p = r.then.board.params ?? {};
    const onBoard = new Set([...nums(JSON.stringify(p)), ...nums(txt(r.then.prompt))]);
    // (a fraction-line or bars board shows num/den pairs: [[1,8]] and den 8 draw 1/8 and 8)
    JSON.stringify(p, (key, v) => { if (Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === "number")) onBoard.add(`${v[0]}/${v[1]}`); return v; });
    for (const d of [p.den, ...(p.dens ?? [])].filter(Boolean)) for (let n = 0; n <= 3 * d; n++) onBoard.add(`${n}/${d}`);
    // (a constant the lesson teaches — in its skill's points or mustSay, or a unit fact: 12 on a clock, 90/180/360 degrees, 100 cm,
    // 1000 m — is the method, not another instance)
    const taught = new Set([...k.explain.flatMap((b) => nums([txt(b.point), ...(b.mustSay ?? []).map(txt)].join(" "))), "12", "60", "90", "180", "270", "360", "100", "1000"]);
    // (the two-page turn, director7 + board-first scriptBoardSpoken: a remediation's own board is drawn under its say when the say
    // speaks every number on it — then the say is judged against THAT board; otherwise it plays over the then-card's)
    const sayNums = new Set(nums(`${txt(r.say)}`));
    // (dc-r8-director27: the params read with a space after each comma, so [2,12] is not read as the number 212)
    if (r.board) { const own = nums(isD27(s) ? JSON.stringify(r.board.params ?? {}).replace(/,/g, ", ") : JSON.stringify(r.board.params ?? {})).filter((n) => n !== "0" && n !== "1");
      if (own.length && own.every((n) => sayNums.has(n))) { for (const n of own) onBoard.add(n); for (const n of nums(JSON.stringify(r.board.params ?? {}))) onBoard.add(n);
        // (dc-r8-director27: its own line's fractions too, as the then-card's: [1, 9] marks and dens [3, 9] draw 1/9 and 1/3)
        if (isD27(s)) { const q = r.board.params ?? {}; JSON.stringify(q, (key, v) => { if (Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === "number")) onBoard.add(`${v[0]}/${v[1]}`); return v; });
          for (const d of [q.den, ...(q.dens ?? [])].filter(Boolean)) for (let n = 0; n <= 3 * d; n++) onBoard.add(`${n}/${d}`); } } }
    const missing = [...new Set(nums(`${txt(r.say)} ${txt(r.simpler)}`))].filter((n) => !onBoard.has(n) && !taught.has(n) && !(Number(n) <= 10 && !n.includes("/")));
    if (missing.length) e.push(`${k.skillId}/remediation[${i}]: its say names ${missing.join(", ")}, not on its then-card's board (the say is spoken over it): say the method, or what that board shows`);
  });
  return e;
}
/** rule (f), main 2026-11-11: a yes/no card states a positive claim. "{friend} says it is NOT half", keyed Yes, is refused: a
 * child who understands may answer "nahi, aadha nahi". */
export function negatedClaimErrors(s) {
  const e = [];
  for (const [where, c] of cardsInOrder(s)) {
    if (!/^(yes|haan|han)$/i.test(String(c.key ?? "").trim())) continue;
    // (a closing "haan ya nahi?" / "yes or no?" names the options, not a negation)
    const t = `${c.prompt?.en ?? ""} || ${c.prompt?.hi ?? ""}`.replace(/\b(haan|han|yes)\s*(ya|or)\s*(nahi|nahin|no)\b/gi, "");
    if (/\b(says|claims|kehta|kehti|kehna|ka kehna)\b[^?|]*\b(not|isn't|aren't|doesn't|nahi|nahin)\b/i.test(t)) e.push(`${where}: a "Yes" keyed on a negated claim: state the claim positively`);
  }
  return e;
}

