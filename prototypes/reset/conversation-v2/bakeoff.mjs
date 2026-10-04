// Intent-reading bake-off for the UNDERSTAND step (CONVERSATION-V2 §4, §8): which Azure Direct model should read what
// the child means? Every battery case is read IN THE CONTEXT production actually produced for it (the teacher's
// previous message, the question on the table and its verified key, the earlier child/teacher turns of a multi-turn
// case — from the conversation-v2 run's probes.json); distress cases get their topic's first kit question.
//
// Scores (n = 357 cases, 2026-10-04):
//   primary   the note's intent is one of the gold labels
//   covers    every gold label is in {intent} ∪ also (multi-intent cases need both)
//   action    policy.mjs's move from the model's note equals the move from the gold note — the score that matters:
//             a confusion that leads to the same move (answer_correct vs answer_wrong: code grades both) costs nothing
//   distress  recall on the 10 distress cases, false alarms on the other 347
//   ms        wall time per call from this US sandbox to eastus2 (indicative; prod runs in the same region)
//
// Run: NODE_USE_ENV_PROXY=1 node prototypes/reset/conversation-v2/bakeoff.mjs --run evals/conversation-v2/results/<stamp>
//        [--arms grok,fast,luna6,sol6,sol6low,mistral] [--concurrency 8] [--reps 1]
import fs from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { SYSTEM, userPrompt, parseNote, inferLang, INTENTS } from "./understand.mjs";
import { decide, initState } from "./policy.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..");
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const RUN = arg("run", null);
if (!RUN) { console.error("--run <conversation-v2 results dir> required"); process.exit(2); }
const CONC = Number(arg("concurrency", 8));
const REPS = Number(arg("reps", 1));
const OUT = arg("out", join(RUN, "understand-bakeoff"));
fs.mkdirSync(OUT, { recursive: true });

for (const line of fs.readFileSync(join(ROOT, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
await import(join(ROOT, "server", "net.js"));
const { chat } = await import(join(ROOT, "server", "azure.js"));
const { CASES } = await import(join(ROOT, "evals", "conversation-v2", "cases.mjs"));
const { TOPICS } = await import(join(ROOT, "evals", "conversation-v2", "topics.mjs"));
const { getKit } = await import(join(ROOT, "server", "content", "index.js"));

// arm → deployment, effort, list price per 1M tokens (in, out)
const ARMS = {
  grok: { dep: "grok-4-1-fast-non-reasoning", effort: undefined, price: [0.2, 0.5], note: "prod classify deployment" },
  fast: { dep: "taxila-fast", effort: "none", price: [0.2, 1.2], note: "gpt-5.6-luna, prod reply deployment" },
  luna6: { dep: "taxila-gpt6-luna", effort: "none", price: [0.1, 0.5], note: "gpt-6-luna" },
  sol6: { dep: "taxila-gpt6", effort: "none", price: [2, 10], note: "gpt-6-sol, no reasoning" },
  sol6low: { dep: "taxila-gpt6", effort: "low", price: [2, 10], note: "gpt-6-sol, low reasoning" },
  mistral: { dep: "taxila-mistral-m35", effort: undefined, price: [1.5, 7.5], note: "mistral-medium-3-5" },
};
const arms = (arg("arms", Object.keys(ARMS).join(","))).split(",").filter((a) => ARMS[a]);

// ── contexts ──
const probes = new Map(JSON.parse(fs.readFileSync(join(RUN, "probes.json"), "utf8")).map((p) => [p.id, p]));
const pre = new Map(JSON.parse(fs.readFileSync(join(RUN, "prescreen.json"), "utf8")).rows.map((r) => [r.id, r]));
const ctxs = [];
for (const c of CASES) {
  const p = probes.get(c.id);
  const t = TOPICS[c.topic ?? "T5NL"];
  if (p && !p.skipped && p.said) {
    ctxs.push({ id: c.id, gold: c.gold, ctx: { cls: p.cls, topicTitle: p.topicTitle, phase: p.where, teacherLast: p.before?.teacherReply, ask: p.before?.ask?.text,
      key: p.item?.key, earlier: (p.setup ?? []).map((s) => ({ child: s.childText, teacher: s.teacherReply })), said: p.said } });
  } else if (c.offline || !p) {
    const kit = await getKit(t.id);
    const item = kit.items.find((i) => i.kind === "practice") ?? kit.items[0];
    const said = pre.get(c.id)?.texts?.at(-1) ?? c.text.replace(/\{key\}/g, item.answer).replace(/\{wrong\}/g, "7");
    ctxs.push({ id: c.id, gold: c.gold, synthetic: true, ctx: { cls: t.cls, topicTitle: t.title, phase: "practice", teacherLast: item.prompt_en, ask: item.prompt_en, key: item.answer, earlier: [], said } });
  }
}
console.log(`${ctxs.length} contexts (${ctxs.filter((x) => x.synthetic).length} synthetic), arms ${arms.join(",")}, reps ${REPS}`);

// ── gold → note → move ──
const goldNote = (g) => ({ intent: g[0], also: g.slice(1), answer: "", topic: "", learning: g.includes("curiosity_offlesson"), inBounds: !g.some((x) => /out_of_bounds|insistence_oob/.test(x)),
  langTo: g.includes("language_switch") ? "x" : "", method: g.includes("method_instruction") ? "x" : "", distress: g.includes("distress"), confidence: 1 });
/** Context state for the policy: an insistence case has a parked topic from its setup turn (the gold note says so too). */
function stateFor(item) {
  const s = initState({ itemOnTable: !!item.ctx.ask });
  if (item.gold.includes("insistence") || item.gold.includes("insistence_oob")) {
    s.later.push({ id: "p0", topic: "(setup topic)", at: 0, promise: "after this question" });
  }
  return s;
}
const moveOf = (note, item) => decide(stateFor(item), { ...note, langTo: note.langTo ? "hindi" : "", method: note.method ? note.method : "" }).move;
/** Same action? A language switch is a MODIFIER: re-saying, re-explaining or rephrasing in the asked language are the
 * same act for the child, so for a gold language_switch the note must carry lang_to and land on one of those moves. */
const RESAY = new Set(["repeat", "reteach", "rephrase", "adopt"]);
function sameAction(note, item) {
  if (!note) return false;
  const mp = moveOf(note, item), mg = moveOf(goldNote(item.gold), item);
  if (mp === mg) return true;
  return item.gold.includes("language_switch") && !!note.langTo && RESAY.has(mp) && RESAY.has(mg);
}

// ── run ──
const RESCORE = argv.includes("--rescore");
const prev = RESCORE ? JSON.parse(fs.readFileSync(join(OUT, "results.json"), "utf8")) : null;
const results = {};
const spend = prev?.spend ?? { usd: 0, calls: 0 };
for (const a of arms) results[a] = [];
if (RESCORE) {
  const byId = new Map(ctxs.map((x) => [x.id, x]));
  for (const a of arms) for (const r of prev.results[a] ?? []) {
    const item = byId.get(r.id);
    if (!item) continue;
    // notes parsed before inferLang existed: fill the language slot the same way parseNote now does
    const note = r.note && !r.note.langTo && [r.note.intent, ...r.note.also].includes("language_switch") ? { ...r.note, langTo: inferLang(item.ctx.said) } : r.note;
    results[a].push({ ...r, note, primary: !!note && r.gold.includes(note.intent), covers: !!note && r.gold.every((x) => [note.intent, ...note.also].includes(x)), action: sameAction(note, item) });
  }
}
const jobs = [];
if (!RESCORE) for (let rep = 0; rep < REPS; rep++) for (const a of arms) for (const item of ctxs) jobs.push({ a, item, rep });
let done = 0;
await Promise.all(Array.from({ length: CONC }, async () => {
  while (jobs.length) {
    const { a, item, rep } = jobs.shift();
    const arm = ARMS[a];
    const t0 = Date.now();
    let note = null, err = null, usage = null;
    try {
      const r = await chat(arm.dep, [{ role: "system", content: SYSTEM }, { role: "user", content: userPrompt(item.ctx) }],
        { json: true, maxTokens: arm.effort === "low" ? 1500 : 300, effort: arm.effort, timeoutMs: 20000, retries: 0 });
      note = parseNote(r.json, item.ctx.said); usage = r.usage;
      if (!note) err = "unusable note";
    } catch (e) { err = String(e.message).slice(0, 120); }
    const ms = Date.now() - t0;
    if (usage) { spend.calls++; spend.usd += ((usage.prompt_tokens ?? 0) * arm.price[0] + (usage.completion_tokens ?? 0) * arm.price[1]) / 1e6; }
    const g = item.gold;
    results[a].push({ id: item.id, rep, gold: g, ms, err, note,
      primary: !!note && g.includes(note.intent),
      covers: !!note && g.every((x) => [note.intent, ...note.also].includes(x)),
      action: sameAction(note, item),
      distress: !!note?.distress, goldDistress: g.includes("distress") });
    if (++done % 100 === 0) console.log(`${done} calls ($${spend.usd.toFixed(2)})`);
  }
}));

// ── score ──
const wilson = (k, n, z = 1.2816) => { if (!n) return [0, 0]; const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [(c - m) / d, (c + m) / d]; };
const pct = (x) => `${(100 * x).toFixed(0)}%`;
const q = (xs, p) => { const s = [...xs].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0; };
const table = [];
for (const a of arms) {
  const R = results[a];
  const ok = R.filter((r) => !r.err);
  const k = (f) => R.filter(f).length;
  const dz = R.filter((r) => r.goldDistress), nd = R.filter((r) => !r.goldDistress);
  table.push({ arm: a, dep: ARMS[a].dep, note: ARMS[a].note, n: R.length, errors: R.length - ok.length,
    primary: k((r) => r.primary), covers: k((r) => r.covers), action: k((r) => r.action),
    actionCi: wilson(k((r) => r.action), R.length), primaryCi: wilson(k((r) => r.primary), R.length),
    distressRecall: `${dz.filter((r) => r.distress).length}/${dz.length}`, falseDistress: `${nd.filter((r) => r.distress).length}/${nd.length}`,
    p50: q(ok.map((r) => r.ms), 0.5), p90: q(ok.map((r) => r.ms), 0.9) });
}
// per intent action accuracy (first rep)
const byIntent = {};
for (const a of arms) for (const r of results[a].filter((x) => x.rep === 0)) {
  const b = ((byIntent[r.gold[0]] ??= {})[a] ??= { n: 0, action: 0, primary: 0 });
  b.n++; if (r.action) b.action++; if (r.primary) b.primary++;
}
// reproducibility across reps
const repro = {};
if (REPS > 1) for (const a of arms) {
  const by = {};
  for (const r of results[a]) (by[r.id] ??= []).push(r.note?.intent ?? "ERR");
  repro[a] = Object.values(by).filter((v) => new Set(v).size === 1).length + "/" + Object.keys(by).length;
}
fs.writeFileSync(join(OUT, "results.json"), JSON.stringify({ at: new Date().toISOString(), arms: ARMS, table, byIntent, repro, spend, results }, null, 1));
const lines = ["| arm | deployment | primary intent | action (policy move) | action 80% CI | covers multi | distress recall | false distress | errors | p50 ms | p90 ms |", "|---|---|---|---|---|---|---|---|---|---|---|"];
for (const t of table) lines.push(`| ${t.arm} | ${t.dep} (${t.note}) | ${t.primary}/${t.n} (${pct(t.primary / t.n)}) | ${t.action}/${t.n} (${pct(t.action / t.n)}) | ${pct(t.actionCi[0])}-${pct(t.actionCi[1])} | ${t.covers}/${t.n} | ${t.distressRecall} | ${t.falseDistress} | ${t.errors} | ${t.p50} | ${t.p90} |`);
lines.push("", "Per intent, action accuracy (n per intent):", "", `| intent | ${arms.join(" | ")} |`, `|---|${arms.map(() => "---").join("|")}|`);
for (const i of INTENTS.filter((x) => byIntent[x])) lines.push(`| ${i} | ${arms.map((a) => byIntent[i][a] ? `${byIntent[i][a].action}/${byIntent[i][a].n}` : "-").join(" | ")} |`);
if (REPS > 1) lines.push("", `Same intent on every rep: ${Object.entries(repro).map(([a, v]) => `${a} ${v}`).join(", ")}`);
lines.push("", `Spend ≈ $${spend.usd.toFixed(2)} over ${spend.calls} calls.`);
fs.writeFileSync(join(OUT, "TABLE.md"), lines.join("\n"));
console.log(lines.slice(0, table.length + 2).join("\n"));
console.log(`spend ≈ $${spend.usd.toFixed(2)}`);
