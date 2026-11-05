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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
export const SCRIPTS = join(ROOT, "data/lesson-scripts");

export const kitTopic = (topicId) => {
  const f = join(ROOT, "data/kits", `${topicId.split("-").slice(0, 2).join("-")}.json`);
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")).topics.find((t) => t.topicId === topicId) ?? null : null;
};
export const scriptOf = (topicId) => JSON.parse(readFileSync(join(SCRIPTS, `${topicId}.json`), "utf8"));
export const allTopics = () => readdirSync(SCRIPTS).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort();

/** Board parameter ranges (Studio's templates, server/forge/explainer/templates.js and board-ref.js). */
export const RANGE = {
  "fraction-parts@1": (p) => p.parts >= 2 && p.parts <= 12 && p.shade >= 0 && p.shade <= p.parts,
  "fraction-of@1": (p) => p.b >= 2 && p.b <= 6 && p.d >= 2 && p.d <= 6 && p.a >= 1 && p.a <= p.b && p.c >= 1 && p.c <= p.d,
  "equal-groups@1": (p) => p.groups >= 2 && p.groups <= 6 && p.each >= 1 && p.each <= 8,
  "compare@1": (p) => p.left?.items?.length >= 1 && p.right?.items?.length >= 1,
  "measured@1": (p) => ["m", "cm"].includes(p.unit) && ["rect", "square", "triangle", "circle"].includes(p.shape),
  "shape@1": (p) => typeof p.shape === "string",
  "number-line-hop@1": (p) => Number.isInteger(p.start) && Array.isArray(p.hops),
  // marks label points and hop draws the solved jumps; a CHECK uses mark k or target [a, den], never both
  "fraction-line@1": (p) => {
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
  if (new RegExp(`(^|[^\\w/])${esc(k)}\\s+or\\s|\\sor\\s+${esc(k)}([^\\w/]|$)`).test(p)) return false;
  return new RegExp(`(^|[^\\w/])${esc(k)}([^\\w/]|$)`).test(p);
}

/** Every board beat with its stand-in line and what it must withhold. */
export function beatsOf(skill) {
  const we = skill.workedExample;
  return [
    ...skill.explain.map((e) => ({ id: e.id, board: e.board, line: e.point, withhold: null, check: false })),
    { id: "we", board: we.board, line: [we.problem, ...we.steps.map((x) => x.result), we.answer].join(" "), withhold: null, check: false },
    ...skill.checks.map((c) => ({ id: c.id, board: c.board, line: c.prompt, withhold: { values: [c.key, ...(c.accept ?? [])] }, check: true })),
    ...skill.remediation.map((r, i) => ({ id: `rem${i + 1}`, board: r.board, line: r.move, withhold: null, check: false })),
  ].filter((b) => b.board);
}

/** S: structure against the kit. → error strings */
export function structureErrors(s, kit) {
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
      if (c.board?.template === "fraction-line@1" && (p.hop || (p.marks ?? []).length || (p.mark === undefined && !p.target))) e.push(at(`${c.id} check line shows instead of asking (use mark or target)`));
    }
    if (k.ladder.length < 3) e.push(at("ladder: fewer than 3 rungs"));
    for (const r of k.ladder) if (!items.has(r.itemId)) e.push(at(`ladder ${r.itemId} is not a kit item`));
    for (const r of k.remediation) {
      if (!mis.has(r.targets) || !r.move || !r.then || !r.thenKey) e.push(at(`remediation ${r.targets}`));
      if (/\bcount (them|the (pieces|parts|squares|units))\b/i.test(r.move)) e.push(at("remediation falls back to counting"));
    }
    for (const b of beatsOf(k)) {
      if (!RANGE[b.board.template]?.(b.board.params ?? {})) e.push(at(`${b.id} ${b.board.template} params out of range ${JSON.stringify(b.board.params)}`));
    }
  }
  if ((s.skills.at(-1)?.bridgeToNext ?? null) !== null) e.push("the last skill has a bridge");
  const checked = new Set(s.skills.flatMap((k) => k.checks.map((c) => c.targets)));
  for (const m of mis) if (!checked.has(m)) e.push(`misconception ${m} is never checked`);
  return e;
}

/** W: Studio's whiteboard gate on every board (W6 left to turn time). → { errors, w6 } */
export async function boardErrors(s, kit) {
  const [{ resolveBoardRef }, { expand }, { gateWhiteboard }, { retimeToLine }] = await Promise.all([
    import("../../server/forge/explainer/board-ref.js"), import("../../server/forge/explainer/templates.js"),
    import("../../server/studio/qa/whiteboard.js"), import("../../server/stagecraft/board-sync.js")]);
  const errors = [], w6 = [];
  for (const k of s.skills) for (const b of beatsOf(k)) {
    const r = resolveBoardRef(b.board, { kit });
    if (!r.ok) { errors.push(`${k.skillId}/${b.id}: ${r.why}`); continue; }
    const text = String(b.line ?? "");
    const g = gateWhiteboard(retimeToLine(expand(r.call).script, text), { reply: text, speechMs: Math.max(1500, text.split(/\s+/).length * 400), withhold: b.withhold ?? { values: [] }, kit });
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
  const { validateTopicScript } = await import("../../server/director/script.js");
  const r = validateTopicScript(s, kit);
  const e = (r.errors ?? []).map((x) => (typeof x === "string" ? x : JSON.stringify(x)));
  if ((r.ok ?? []).length !== s.skills.length) e.push(`walkable ${(r.ok ?? []).length}/${s.skills.length} skills`);
  return e;
}

/** All three gates for one topic. */
export async function checkTopic(topicId) {
  const s = scriptOf(topicId), kit = kitTopic(topicId);
  const S = structureErrors(s, kit);
  const W = kit ? await boardErrors(s, kit) : { errors: [], w6: [] };
  const V = kit ? await runtimeErrors(s, kit) : [];
  return { topicId, ok: !S.length && !W.errors.length && !V.length, structure: S, boards: W.errors, timingOnly: W.w6, runtime: V };
}

/** The blind solver's packet (prompts only) and the matching keys, for every check and remediation follow-up. */
export function blindPacket(topicId) {
  const s = scriptOf(topicId), questions = [], keys = [], examples = [];
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
