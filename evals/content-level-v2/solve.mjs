// Blind solver for RS-6's new items (re-levelled kit items and placement items). The solver is from another model family
// than the generator (generator taxila-gpt6 / OpenAI; solver DeepSeek-V4-Pro). It sees the question (and options), never
// the key. Agreement is decided by code first (normalised text / numbers / option text); only a code mismatch goes to a
// third-family equivalence check (grok-4-20-non-reasoning), which sees question, key and the solver's answer.
// Writes item.verified = { solverAnswer, agrees, how, note?, solver, date } in place.
//
//   node --env-file=.env.local evals/content-level-v2/solve.mjs relevel|placement
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { chatJSON, pool } from "./lib/azure-lite.mjs";
import { norm } from "../../server/director/items.js";

const which = process.argv[2];
const SOLVER = "DeepSeek-V4-Pro", EQUIV = "grok-4-20-non-reasoning";
const DIR = new URL(`../../data/${which === "placement" ? "placement" : "kits-relevel"}/`, import.meta.url);

const SOLVE_SYS = `Solve each question as a careful student would, then give ONLY the final answer, short (a number with unit, a word,
a phrase, or the exact text of the chosen option). For a "why" question give the key idea in under 15 words. If the question
is in Hindi or asks for Hindi, answer in Hindi. Reply as JSON {"a":[{"id":"...","answer":"..."}]}.`;
const EQUIV_SYS = `You check an answer key. For each case you get a question, the key (plus accepted forms) and an independent solver's
answer. Decide: same (the solver's answer means the same as the key, allowing units, wording, number words, order),
and which is correct. Reply as JSON {"r":[{"id":"...","same":true|false,"correct":"key|solver|both|neither|ambiguous","note":"<= 15 words"}]}.`;

const nums = (s) => (norm(String(s).replace(/(?<=\d),(?=\d)/g, "")).match(/\d+(?:\.\d+)?(?:\/\d+)?/g) || []).map((x) => x.includes("/") ? +(x.split("/")[0] / x.split("/")[1]).toFixed(6) : +x);
function codeAgree(it, ans) {
  const a = norm(ans);
  const forms = [it.answer, ...(it.acceptable || [])].map(norm).filter(Boolean);
  if (forms.some((f) => f === a || (f.length > 3 && (a.includes(f) || f.includes(a)) && a.length > 0))) return true;
  if (it.options) { const ok = it.options.find((o) => o.correct); if (ok && (norm(ok.text) === a || a.startsWith(norm(ok.text)))) return true; }
  const kn = nums(it.answer), an = nums(ans);
  if (kn.length && an.length && /^[\s\d.,/₹a-z°%-]*$/i.test(String(it.answer)) && kn.length === an.length && kn.every((x, i) => Math.abs(x - an[i]) < 1e-6)) return true;
  return false;
}

const files = readdirSync(DIR).filter((f) => /^c\d-[a-z]+\.json$/.test(f)).map((f) => ({ f, d: JSON.parse(readFileSync(new URL(f, DIR), "utf8")) }));
const items = [];
for (const { f, d } of files) {
  const list = which === "placement" ? d.items : d.topics.flatMap((t) => [...t.openers, ...(t.ongrade || []), ...t.harder]);
  for (const it of list) if (!it.verified) items.push({ it, f, cls: d.class, subject: d.subject });
}
const groups = new Map();
for (const x of items) { const k = `${x.cls}|${x.subject}`; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(x); }
const batches = []; for (const [k, xs] of groups) for (let i = 0; i < xs.length; i += 10) batches.push({ k, xs: xs.slice(i, i + 10) });
let cost = 0;
const mismatches = [];
await pool(batches, 8, async ({ k, xs }) => {
  const [cls, subject] = k.split("|");
  const q = xs.map(({ it }) => ({ id: it.id, question: it.prompt_en, ...(it.options ? { options: it.options.map((o) => o.text) } : {}) }));
  const { json, cost: c } = await chatJSON(SOLVER, SOLVE_SYS, `Class ${cls} ${subject}.\n` + JSON.stringify(q), { maxTokens: 6000, tag: `solve:${which}` });
  cost += c;
  for (const { it } of xs) {
    const a = (json.a || []).find((r) => r.id === it.id)?.answer;
    if (a == null) continue;
    if (codeAgree(it, String(a))) it.verified = { solverAnswer: String(a), agrees: true, how: "code", solver: SOLVER, date: "2026-10-04" };
    else mismatches.push({ it, a: String(a) });
  }
  process.stdout.write(".");
});
const mb = []; for (let i = 0; i < mismatches.length; i += 10) mb.push(mismatches.slice(i, i + 10));
await pool(mb, 6, async (xs) => {
  const q = xs.map(({ it, a }) => ({ id: it.id, question: it.prompt_en, ...(it.options ? { options: it.options.map((o) => o.text) } : {}), key: it.answer, accepted: it.acceptable || [], solver: a }));
  const { json, cost: c } = await chatJSON(EQUIV, EQUIV_SYS, JSON.stringify(q), { maxTokens: 3000, tag: `equiv:${which}` });
  cost += c;
  for (const { it, a } of xs) {
    const r = (json.r || []).find((x) => x.id === it.id);
    if (!r) continue;
    const agrees = !!r.same || r.correct === "both";
    it.verified = { solverAnswer: a, agrees, how: "equivalence", correct: r.correct, note: r.note, solver: SOLVER, checker: EQUIV, date: "2026-10-04" };
  }
  process.stdout.write("+");
});
for (const { f, d } of files) writeFileSync(new URL(f, DIR), JSON.stringify(d, null, 1));
const all = files.flatMap(({ d }) => which === "placement" ? d.items : d.topics.flatMap((t) => [...t.openers, ...(t.ongrade || []), ...t.harder]));
const v = all.filter((x) => x.verified);
console.log(`\n${which}: ${all.length} items; verified ${v.length}; agree ${v.filter((x) => x.verified.agrees).length} (code ${v.filter((x) => x.verified.how === "code").length}, equivalence ${v.filter((x) => x.verified.how === "equivalence" && x.verified.agrees).length}); disagree ${v.filter((x) => !x.verified.agrees).length}; $${cost.toFixed(3)}`);
