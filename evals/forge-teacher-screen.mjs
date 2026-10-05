// W2-B #1 acceptance ("the teacher sees the screen"): across n ≥ 30 explain / worked-example turns on fraction and number
// topics, the numbers the teacher SAYS match the module's own values (live-content audit 6: she said quarters while the
// line showed fifths). Real Director (step()), real compile() instructions (text lane), the real reply deployment
// (DEPLOY.reply); the turn's numbers are read from her line (numerals, fractions, English and Hinglish number words) and
// must be a subset of the numbers on screen (the module's params, which the facts row states) ∪ the numbers of the move's
// own content lines (the same source). Two arms on the same turns: WITH the facts row (as shipped) and WITHOUT it (the
// row stripped from the content: the pre-W2-B prompt), so the row's effect is measured, not assumed.
// Run: set -a; . ./.env.local; NODE_USE_ENV_PROXY=1 node evals/forge-teacher-screen.mjs [--n 36]
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const N = +arg("--n", 36);
process.env.FORGE_EXPLAINER_MODEL = "off";

const { getKit } = await import("../server/content/index.js");
const { initLessonState, step } = await import("../server/director/state.js");
const { instructionsFor } = await import("../server/compiler/instructions.js");
const { FACTS_ROW_PREFIX, screenContradiction, partsOnScreen: screenPartsOf, contentPartsOf, stripStrayParts } = await import("../server/director/modules.js");
const { chat, DEPLOY } = await import("../server/azure.js");
const { BRIEF } = await import("../tests/fixtures/kit.mjs");

const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  ek: 1, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5, panch: 5, chhe: 6, chhah: 6, saat: 7, aath: 8, nau: 9, das: 10,
  half: "1/2", halves: 2, aadha: "1/2", aadhe: "1/2", quarter: "1/4", quarters: 4, chauthai: 4, third: 3, thirds: 3, tihai: 3, fifth: 5, fifths: 5, sixth: 6, sixths: 6, eighth: 8, eighths: 8 };
/** The numbers in a line: numerals and fractions as written, number words as their value. */
function numbersSaid(text) {
  const t = String(text).toLowerCase();
  const out = new Set();
  for (const m of t.matchAll(/(\d+)\s*\/\s*(\d+)/g)) { out.add(`${m[1]}/${m[2]}`); out.add(m[1]); out.add(m[2]); }
  for (const m of t.replace(/(\d+)\s*\/\s*(\d+)/g, " ").matchAll(/\d+(?:[.,]\d+)*/g)) out.add(m[0].replace(/,/g, ""));
  for (const w of t.match(/[a-z]+/g) ?? []) if (WORDS[w] !== undefined) { const v = String(WORDS[w]); out.add(v); if (v.includes("/")) for (const p of v.split("/")) out.add(p); }
  return out;
}
const numbersIn = (s) => numbersSaid(s);
/**
 * The PART COUNTS in a line (the audit's failure: "quarters" said over a line cut in fifths): the denominator of every
 * fraction, every part word (half 2, third 3, quarter 4, fifth 5 …; Hinglish aadha 2, tihai 3, chauthai 4) and every
 * "N equal parts / N barabar hisse". This is the acceptance metric; numbersSaid is the stricter diagnostic.
 */
const PART_WORDS = { half: 2, halves: 2, aadha: 2, aadhe: 2, third: 3, thirds: 3, tihai: 3, quarter: 4, quarters: 4, chauthai: 4, fourth: 4, fourths: 4,
  fifth: 5, fifths: 5, sixth: 6, sixths: 6, seventh: 7, sevenths: 7, eighth: 8, eighths: 8, ninth: 9, ninths: 9, tenth: 10, tenths: 10, twelfth: 12, twelfths: 12 };
function partsSaid(text) {
  const t = String(text).toLowerCase();
  const out = new Set();
  for (const m of t.matchAll(/(\d+)\s*\/\s*(\d+)/g)) out.add(m[2]);
  for (const w of t.match(/[a-z]+/g) ?? []) if (PART_WORDS[w]) out.add(String(PART_WORDS[w]));
  for (const m of t.matchAll(/(\d+|[a-z]+)\s+(?:equal\s+parts|barabar\s+(?:hisse|hisson|bhaag|tukde|tukdon))/g)) { const v = /^\d+$/.test(m[1]) ? m[1] : WORDS[m[1]]; if (v !== undefined) out.add(String(v)); }
  return out;
}
/** The part counts on screen: denominators of the module's fractions, its partition / parts / denominators params. */
function partsOnScreen(params, contentText) {
  const out = new Set();
  const j = JSON.stringify(params).replace(/\[(\d+),(\d+)\]/g, "$1/$2");
  for (const m of j.matchAll(/(\d+)\/(\d+)/g)) out.add(m[2]);
  for (const k of ["partition", "parts", "denominators", "parts_n"]) {
    const v = params?.[k] ?? params?.script?.facts?.onScreen?.[k];
    for (const x of [v].flat()) if (Number.isInteger(x)) out.add(String(x));
  }
  for (const m of String(contentText).matchAll(/(\d+)\s*\/\s*(\d+)/g)) out.add(m[2]);
  return out;
}

const files = readdirSync(new URL("data/kits/", ROOT)).filter((f) => /^c[4-7]-maths\.json$/.test(f)).sort();
// fraction topics first (where a part count can be wrong), then the other number topics
const all = files.flatMap((f) => JSON.parse(readFileSync(new URL(`data/kits/${f}`, ROOT), "utf8")).topics);
const isFrac = (t) => /\d+\s*\/\s*\d+|fraction/i.test(JSON.stringify(t.workedExample ?? {}) + JSON.stringify(t.skills ?? []));
const topics = [...all.filter(isFrac), ...all.filter((t) => !isFrac(t))].map((t) => t.topicId);
const NE = { outcome: "no_evidence", flags: {}, source: "test", confidence: 1 };
const turns = [];
for (const id of topics) {
  if (turns.length >= N) break;
  const kit = await getKit(id, { generate: false }); if (!kit) continue;
  // fraction and number topics only: the worked example states numbers
  if (!/\d/.test(kit.workedExample?.problem ?? "")) continue;
  const cl = +id[1];
  const ctx = { protege: { name: "Golu", what: "a pretend elephant" }, teacherName: "Asha", teacherId: "asha", sessionId: `ts-${id}`, lang: "hinglish",
    classLevel: cl, ageBand: cl <= 4 ? "6-9" : "10-15", firstName: "Riya", interests: [], address: "tum" };
  let r = step(initLessonState({ topicId: id, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
  for (let i = 0; i < 6; i++) {
    r = step(r.state, { event: "turn", kit, cls: NE, now: (i + 1) * 20000 });
    if (!["explain", "worked_example"].includes(r.move.kind) || !r.state.module) continue;
    // the lesson's brief as the start route pins it (a fixture child of this class; no interests, no memories)
    const st = { ...structuredClone(r.state), brief: { ...BRIEF, classLevel: cl, ageBand: ctx.ageBand, interests: [], memoryCallbacks: [], recentWins: [] }, mode: "text" };
    turns.push({ id, kind: r.move.kind, state: st, kit, module: r.state.module });
    if (turns.filter((t) => t.id === id).length >= 2) break;
  }
}

async function reply(state, kit) {
  const instructions = instructionsFor(state, kit, "text");
  const res = await chat(DEPLOY.reply, [{ role: "system", content: instructions }, { role: "user", content: "(the child is listening)" }], { maxTokens: 220, effort: "none", timeoutMs: 15000, retries: 1 });
  return res.text;
}

const arms = { with_facts: [], without_facts: [], with_facts_guard: [] };
for (const t of turns.slice(0, N)) {
  const facts = t.state.lastContent.find((l) => l.startsWith(FACTS_ROW_PREFIX)) ?? "";
  const screen = numbersIn(JSON.stringify(t.module.params).replace(/\[(\d+),(\d+)\]/g, "$1/$2"));
  const content = numbersIn(t.state.lastContent.filter((l) => !l.startsWith(FACTS_ROW_PREFIX)).join(" "));
  const allowed = new Set([...screen, ...content, "1"]);   // "1" ("one part", "ek") is never a wrong part count
  for (const arm of ["with_facts", "without_facts", "with_facts_guard"]) {
    const st = structuredClone(t.state);
    if (arm === "without_facts") st.lastContent = st.lastContent.filter((l) => !l.startsWith(FACTS_ROW_PREFIX));
    let text = "";
    let error = null;
    try {
      text = await reply(st, t.kit);
      // the guard arm: the reply path's rewrite (lesson.js re-asks once with the reason) when the line contradicts the screen
      const c = arm === "with_facts_guard" ? screenContradiction(text, t.module) : null;
      if (c) {
        const instructions = instructionsFor(st, t.kit, "text");
        const r2 = await chat(DEPLOY.reply, [{ role: "system", content: instructions }, { role: "user", content: "(the child is listening)" }, { role: "assistant", content: text },
          { role: "system", content: `Rewrite that turn: it names parts the screen does not show (${c.stray.join(", ")}). ${c.onScreen}. Same move, same language, one idea, end by handing the floor back.` }],
          { maxTokens: 220, effort: "none", timeoutMs: 15000, retries: 1 });
        text = r2.text;
        // the code repair after a rewrite that still contradicts the screen (seam-patches/w2b-parts-repair.patch for the
        // live reply path): the sentences naming stray counts go; nothing left → the move's fixed line in production
        if (screenContradiction(text, t.module)) text = stripStrayParts(text, t.module) ?? "";
      }
    } catch (e) { error = String(e.message).slice(0, 120); }
    const said = error ? [] : [...numbersSaid(text)];
    const stray = said.filter((n) => !allowed.has(n));
    const parts = error ? [] : [...partsSaid(text)];
    // the screen's part counts as the board / engine really shows them (W2-B fixer: a board's [x, y] coordinates are not
    // fractions, which the JSON scan read as 118/152) ∪ the move's own content counts; the old scan is kept as `loose`
    const screenParts = new Set([...screenPartsOf(t.module), ...contentPartsOf(t.state.lastContent), ...(t.module.engine === "explainer@1" ? [] : partsOnScreen(t.module.params, t.state.lastContent.join(" ")))]);
    const partStray = parts.filter((p) => !screenParts.has(p));
    arms[arm].push({ topic: t.id, move: t.kind, engine: t.module.engine, facts: facts.slice(FACTS_ROW_PREFIX.length, FACTS_ROW_PREFIX.length + 90), said, stray,
      parts, partStray, partsOk: !error && partStray.length === 0, ok: !error && stray.length === 0, error, text: text.slice(0, 240) });
  }
}
const sum = (rows) => ({ n: rows.length,
  // acceptance: the part counts she says are the screen's (fractions' denominators, part words, "N equal parts")
  partsMatch: rows.filter((r) => r.partsOk).length, partsRate: rows.length ? +(rows.filter((r) => r.partsOk).length / rows.length).toFixed(3) : null,
  mentionsParts: rows.filter((r) => r.parts.length).length,
  // diagnostic: EVERY number she says is on screen or in the move's content (stricter than the acceptance: a number she
  // derives, 1 kg = 1000 g, or a digit of an on-screen number counts as stray here)
  allNumbersMatch: rows.filter((r) => r.ok).length, mentionsNumbers: rows.filter((r) => r.said.length).length });
const out = { date: new Date().toISOString().slice(0, 10), deployment: DEPLOY.reply, n: turns.length,
  with_facts: sum(arms.with_facts), without_facts: sum(arms.without_facts), with_facts_guard: sum(arms.with_facts_guard),
  partMissesGuard: arms.with_facts_guard.filter((r) => !r.partsOk),
  partMisses: arms.with_facts.filter((r) => !r.partsOk), partMissesWithout: arms.without_facts.filter((r) => !r.partsOk),
  misses: arms.with_facts.filter((r) => !r.ok).map(({ topic, stray, facts, text }) => ({ topic, stray, facts, text })) };
mkdirSync(new URL("evals/results/", ROOT), { recursive: true });
writeFileSync(new URL(`evals/results/forge-teacher-screen-${out.date}.json`, ROOT), JSON.stringify({ ...out, rows: arms }, null, 1));
console.log(JSON.stringify(out, null, 1));
