#!/usr/bin/env node
// Round 7 F (main 2026-11-05): fill the kit gaps the lesson-script pipeline found, before the 30-topic script batch.
// Per topic: a full worked example for every skill the topic's one `workedExample` does not teach (`skillExamples`), a
// real misconception for every skill no item targets (`misconceptions[]` entries with a `skillId`), and (class 8-9 depth,
// 2026-11-08) new practice items (`newItems`, kit item shape) until every skill has ≥ 3. Claude authors them
// in session and a SEPARATE Claude agent blind-solves them (no Azure). This script is the code part:
//   lint(add, kit)          → error strings (shape, ids, coverage, exact arithmetic of "a op b = c" step results)
//   blind(adds)             → the solver's packet: problems and diagnostics, no answers
//   apply(add, kitTopic)    → the kit topic with the additions (idempotent: an existing id is replaced, never doubled)
//
//   node scripts/kits/kit-gaps.mjs lint  <dir>                     every <dir>/*.json against its kit
//   node scripts/kits/kit-gaps.mjs blind <dir> <out.json> <keys.json>
//   node scripts/kits/kit-gaps.mjs apply <dir>                     write the additions into data/kits (after the blind solve)
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const kitFile = (topicId) => join(ROOT, "data/kits", `${topicId.split("-").slice(0, 2).join("-")}.json`);
export const kitTopic = (topicId) => JSON.parse(readFileSync(kitFile(topicId), "utf8")).topics.find((t) => t.topicId === topicId) ?? null;

/**
 * The arithmetic in a step result is exact: the result is split on "=", every part that is PURE arithmetic (digits,
 * + − × ÷ / and brackets, optionally a trailing unit word) is evaluated, and all of them must be equal. A part with words,
 * a mixed number ("3 4/10") or a list is not judged (the blind solver judges those).
 */
export function wrongArithmetic(text) {
  // a list of facts ("9 × 6 = 54, 9 × 7 = 63") is judged clause by clause
  // digit grouping, Indian (3,50,000) or international (350,000): a comma followed by 2-digit groups ending in 3 digits
  const clauses = String(text).replace(/(\d),(?=(?:\d{2},)*\d{3}\b)/g, "$1").split(/[,;]|\band\b|→/);
  if (clauses.length > 1) return clauses.flatMap((c) => wrongClause(c));
  return wrongClause(text);
}
function wrongClause(text) {
  const norm = String(text).replace(/(\d),(?=(?:\d{2},)*\d{3}\b)/g, "$1").replace(/[×✕]/g, "*").replace(/(\d)\s*x\s*(\d)/g, "$1*$2")
    .replace(/÷/g, "/").replace(/[−–]/g, "-").replace(/₹/g, "");
  const parts = norm.split("=").map((x) => x.trim().replace(/\s*(cm|mm|km|m|kg|g|ml|l|°|rupees?|days?|minutes?|hours?)\.?$/i, "").trim());
  const vals = [];
  for (const p of parts) {
    if (!/^[\d\s.+\-*/()]+$/.test(p) || !/\d/.test(p) || /\d\s+\d/.test(p)) continue;
    try {
      // eslint-disable-next-line no-new-func
      const v = Function(`"use strict"; return (${p});`)();
      if (Number.isFinite(v)) vals.push([p, v]);
    } catch { /* not an expression */ }
  }
  const ops = vals.filter(([p]) => /[-+*/]/.test(p.replace(/^\d+\/\d+$/, "")));
  if (!ops.length) return [];
  const v0 = vals[0][1];
  return vals.some(([, v]) => Math.abs(v - v0) > 1e-9) ? [`${parts.join(" = ")} (parts are ${vals.map(([, v]) => Math.round(v * 1e6) / 1e6).join(" vs ")})`] : [];
}

const existing_has = (kit, id) => kit.misconceptions.some((m) => m.id === id);

export function lint(add, kit) {
  const e = [];
  if (!kit) return [`no kit topic ${add.topicId}`];
  const skillIds = kit.skills.map((s) => s.id);
  // main 2026-11-08 (c8/c9 English and Hindi): an add may be SCOPED to the skills it covers (language skills only; the
  // literature and comprehension skills wait for the books). Coverage is then judged for those skills alone, and
  // workedExampleSkill is optional (never a default guess: a wrong one marks a skill as taught when it is not).
  const scope = Array.isArray(add.scope) ? add.scope : null;
  if (scope) for (const sid of scope) if (!skillIds.includes(sid)) e.push(`scope ${sid} is not a kit skill`);
  const inScope = (sid) => !scope || scope.includes(sid);
  if ((!scope || add.workedExampleSkill != null) && !skillIds.includes(add.workedExampleSkill)) e.push(`workedExampleSkill ${add.workedExampleSkill} is not a kit skill`);
  const scripted = add.topicId === "c5-maths-ch02-t02" && !add.requireSource; // the next-30 batch only (its lesson script taught s1/s2)
  const taught = new Set([add.workedExampleSkill ?? (scope ? kit.workedExample?.skillId : undefined), ...(scope ? (kit.skillExamples ?? []).map((x) => x.skillId) : [])].filter(Boolean));
  const want = scripted ? [] : skillIds.filter((s) => !taught.has(s) && inScope(s));
  const got = (add.skillExamples ?? []).map((x) => x.skillId);
  if (scope) { for (const g of got) if (!scope.includes(g)) e.push(`skillExamples: ${g} is outside the add's scope`); }
  if (want.join() !== [...got].sort().join() && want.sort().join() !== [...got].sort().join()) e.push(`skillExamples cover ${got.join(",")}, want ${want.join(",")}`);
  const prompts = new Set([kit.workedExample?.problem, ...kit.items.map((i) => i.prompt_en)].map((x) => String(x ?? "").trim().toLowerCase()));
  for (const x of add.skillExamples ?? []) {
    const at = `${x.skillId} example`;
    if (!x.problem || !x.givens?.length || !x.find || !x.answer || !x.why) e.push(`${at}: incomplete`);
    if (!Array.isArray(x.steps) || x.steps.length < 2 || x.steps.length > 6 || x.steps.some((s) => !s.do || s.result == null || /_{2,}/.test(`${s.do} ${s.result}`))) e.push(`${at}: 2-6 complete steps`);
    if (prompts.has(String(x.problem).trim().toLowerCase())) e.push(`${at}: copies a kit problem`);
    for (const s of x.steps ?? []) for (const w of wrongArithmetic(s.result)) e.push(`${at}: ${w}`);
    for (const f of ["do", "why"]) for (const t of [x[f], ...(x.steps ?? []).map((s) => s[f])]) if (t && /!|\blet's\b|\bgreat\b|\bwell done\b/i.test(t)) e.push(`${at}: '${f}' is a line, not a shape`);
  }
  const existing = new Set(kit.misconceptions.map((m) => m.id));
  const misBySkill = {};
  for (const i of kit.items) if (i.targetsMisconception) (misBySkill[i.skillId] ??= new Set()).add(i.targetsMisconception);
  for (const m of kit.misconceptions) if (m.skillId) (misBySkill[m.skillId] ??= new Set()).add(m.id);
  // an item the add itself points at a misconception also gives its skill one
  for (const i of add.newItems ?? []) if (i.targetsMisconception && existing_has(kit, i.targetsMisconception)) (misBySkill[i.skillId] ??= new Set()).add(i.targetsMisconception);
  const needs = scripted ? ["c5-maths-ch02-t02-s2"] : skillIds.filter((s) => !misBySkill[s] && inScope(s));
  const newSkills = (add.newMisconceptions ?? []).map((m) => m.skillId);
  for (const s of needs) if (!newSkills.includes(s)) e.push(`no new misconception for ${s}`);
  for (const m of add.newMisconceptions ?? []) {
    const at = `misconception ${m.id}`;
    if (!m.id?.startsWith(`${add.topicId}-m-`)) e.push(`${at}: id must start ${add.topicId}-m-`);
    if (existing.has(m.id)) e.push(`${at}: duplicates a kit id`);
    if (!skillIds.includes(m.skillId)) e.push(`${at}: skillId`);
    if (!m.belief || !(m.signs?.length >= 2) || !m.remediation?.representation || !m.remediation?.moveShape) e.push(`${at}: incomplete`);
    if (/\bcount (them|the (pieces|parts|squares|units))\b/i.test(m.remediation?.moveShape ?? "")) e.push(`${at}: remediation counts`);
    const o = m.diagnostic?.options ?? [];
    if (!m.diagnostic?.prompt_en || !m.diagnostic?.prompt_hi || o.length < 3) e.push(`${at}: diagnostic needs both prompts and ≥ 3 options`);
    if (o.filter((x) => x.correct).length !== 1) e.push(`${at}: exactly one correct option`);
    if (!o.some((x) => !x.correct && x.misconceptionId === m.id)) e.push(`${at}: no option carries this belief's answer`);
    if (new Set(o.map((x) => String(x.text).trim())).size !== o.length) e.push(`${at}: duplicate options`);
  }
  // round 7 F class 8-9 depth (main 2026-11-08): new practice items so every skill has a ≥ 3-rung ladder
  const KINDS = new Set(["practice", "near_transfer", "far_transfer", "predict", "contrast", "why", "teachback", "retrieval", "error_spot", "translate_rep"]);
  const itemIds = new Set(kit.items.map((i) => i.id));
  const perSkill = Object.fromEntries(skillIds.map((sid) => [sid, kit.items.filter((i) => i.skillId === sid).length]));
  for (const it of add.newItems ?? []) {
    const at = `item ${it.id}`;
    if (!it.id?.startsWith(`${add.topicId}-`)) e.push(`${at}: id must start ${add.topicId}-`);
    if (itemIds.has(it.id)) e.push(`${at}: duplicates a kit id`);
    itemIds.add(it.id);
    if (!skillIds.includes(it.skillId)) e.push(`${at}: skillId`);
    else perSkill[it.skillId]++;
    if (!KINDS.has(it.kind)) e.push(`${at}: kind ${it.kind}`);
    if (![1, 2, 3, 4, 5].includes(it.difficulty)) e.push(`${at}: difficulty 1-5`);
    if (!it.prompt_en || !it.prompt_hi || !it.answer) e.push(`${at}: prompt_en, prompt_hi and answer`);
    if (!Array.isArray(it.acceptable)) e.push(`${at}: acceptable []`);
    if (!Array.isArray(it.hints) || it.hints.length !== 4 || it.hints.some((h) => !String(h ?? "").trim())) e.push(`${at}: 4 hints (pump, hint, prompt, assertion)`);
    if (prompts.has(String(it.prompt_en ?? "").trim().toLowerCase())) e.push(`${at}: copies a kit prompt`);
    if (it.targetsMisconception && !existing.has(it.targetsMisconception) && !(add.newMisconceptions ?? []).some((m) => m.id === it.targetsMisconception)) e.push(`${at}: targetsMisconception unknown`);
    if (it.verified) e.push(`${at}: verified is set by the blind solve, never authored`);
    for (const w of wrongArithmetic(it.answer)) e.push(`${at}: ${w}`);
  }
  if (add.newItems || scope) for (const [sid, n] of Object.entries(perSkill)) if (n < 3 && inScope(sid)) e.push(`${sid}: ${n} items after the additions, want ≥ 3`);
  // every addition names what in the chapter it draws on (main 2026-11-08: chapter scope; science cites the chapter line)
  // (required for scoped adds and adds that set requireSource; earlier batches predate the field)
  if (scope || add.requireSource) for (const x of [...(add.skillExamples ?? []), ...(add.newMisconceptions ?? []), ...(add.newItems ?? [])]) if (!String(x.source ?? "").trim()) e.push(`${x.id ?? `${x.skillId} example`}: no source`);
  return e;
}

/** The solver's packet: no answers, no keys, options shuffled out of their authored order. */
export function blind(adds) {
  const questions = [], keys = [];
  for (const a of adds) {
    for (const x of a.skillExamples ?? []) {
      const id = `${x.skillId}/example`;
      questions.push({ id, kind: "solve", problem: x.problem, steps: x.steps.map((s) => s.do) });
      keys.push({ id, key: x.answer, steps: x.steps });
    }
    for (const it of a.newItems ?? []) {
      questions.push({ id: `${it.id}/item`, kind: "answer", prompt: it.prompt_en });
      keys.push({ id: `${it.id}/item`, key: it.answer, acceptable: it.acceptable });
    }
    for (const m of a.newMisconceptions ?? []) {
      const id = `${m.id}/diagnostic`;
      const opts = [...m.diagnostic.options].sort((p, q) => (String(p.text) < String(q.text) ? -1 : 1));
      questions.push({ id, kind: "choose", prompt: m.diagnostic.prompt_en, options: opts.map((x) => x.text),
        belief: m.belief, task: "pick the one correct option; then say which option a child holding `belief` would pick" });
      keys.push({ id, key: m.diagnostic.options.find((x) => x.correct).text, beliefPick: m.diagnostic.options.find((x) => x.misconceptionId === m.id)?.text });
    }
  }
  return { questions, keys };
}

/** The kit topic with the additions (pure; an existing id is replaced). */
export function apply(add, topic) {
  const t = structuredClone(topic);
  const ex = new Map((t.skillExamples ?? []).map((x) => [x.skillId, x]));
  for (const x of add.skillExamples ?? []) ex.set(x.skillId, x);
  t.skillExamples = [...ex.values()].sort((p, q) => (p.skillId < q.skillId ? -1 : 1));
  if (add.workedExampleSkill && t.workedExample) t.workedExample = { ...t.workedExample, skillId: add.workedExampleSkill };
  const mis = new Map(t.misconceptions.map((m) => [m.id, m]));
  for (const m of add.newMisconceptions ?? []) mis.set(m.id, m);
  t.misconceptions = [...mis.values()];
  const items = new Map(t.items.map((i) => [i.id, i]));
  for (const it of add.newItems ?? []) items.set(it.id, it);
  t.items = [...items.values()];
  return t;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [cmd, dir, out, keysOut] = process.argv.slice(2);
  const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  const adds = files.map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));
  if (cmd === "lint") {
    let bad = 0;
    for (const a of adds) { const e = lint(a, kitTopic(a.topicId)); console.log(`${a.topicId}: ${e.length ? "FAIL" : "ok"} (${(a.skillExamples ?? []).length} examples, ${(a.newMisconceptions ?? []).length} misconceptions, ${(a.newItems ?? []).length} items)`); for (const x of e) console.log(`  ${x}`); if (e.length) bad++; }
    process.exit(bad ? 1 : 0);
  } else if (cmd === "blind") {
    const p = blind(adds);
    writeFileSync(out, JSON.stringify(p.questions, null, 1)); writeFileSync(keysOut, JSON.stringify(p.keys, null, 1));
    console.log(`${p.questions.length} questions → ${out}`);
  } else if (cmd === "apply") {
    const byFile = new Map();
    for (const a of adds) {
      const f = kitFile(a.topicId);
      const kit = byFile.get(f) ?? JSON.parse(readFileSync(f, "utf8"));
      const i = kit.topics.findIndex((t) => t.topicId === a.topicId);
      kit.topics[i] = apply(a, kit.topics[i]);
      byFile.set(f, kit);
    }
    for (const [f, kit] of byFile) writeFileSync(f, JSON.stringify(kit, null, 1));
    console.log(`applied ${adds.length} topics to ${byFile.size} kit files`);
  } else { console.error("usage: kit-gaps.mjs lint|blind|apply <dir> [out keys]"); process.exit(2); }
}
