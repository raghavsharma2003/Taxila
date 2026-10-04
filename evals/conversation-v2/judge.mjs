// Judge the conversation-v2 probes: every rubric check (rubric.mjs) is a yes/no question put to TWO judges from
// different model families than the reply model under test (prod reply = taxila-fast, gpt-5.6-luna):
//   J1 taxila-gpt6 (gpt-6-sol, low effort)    J2 taxila-mistral-m35 (mistral-medium-3-5)
// gpt-6-sol shares a vendor with the reply model, so J2 is the out-of-vendor check; agreement is reported per check
// (Cohen's kappa) and per case. A case where the two judges disagree on pass/fail is DISPUTED: it is decided by a
// human read (adjudications.json: { "<caseId>": { "pass": bool, "why": "..." } }), and the report says how many were.
// Code checks (end flag, stage, language) need no judge. Distress cases come from prescreen.json (offline, prod path).
//
// Run:  NODE_USE_ENV_PROXY=1 node evals/conversation-v2/judge.mjs --dir evals/conversation-v2/results/<stamp> [--concurrency 6]
//       node evals/conversation-v2/judge.mjs --dir ... --report-only      (re-scores with adjudications.json, no model calls)
// Output: <dir>/judged.json, <dir>/disputes.md, <dir>/REPORT.md, <dir>/summary.json, <dir>/spend.json
import fs from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { checksFor, CODE } from "./rubric.mjs";
import { FAMILY } from "./cases.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const DIR = arg("dir", join(HERE, "results", "latest"));
const CONC = Number(arg("concurrency", 6));
const REPORT_ONLY = argv.includes("--report-only");
const J1 = arg("j1", "taxila-gpt6"), J2 = arg("j2", "taxila-mistral-m35");
// list prices per 1M tokens (USD), MODEL-ROUTER §0 / model-refresh spend tables; used for spend.json only
const PRICE = { "taxila-gpt6": [2, 10], "taxila-mistral-m35": [1.5, 7.5], "grok-4-1-fast-non-reasoning": [0.2, 0.5] }; // Azure retail, as recorded in evals/model-refresh-2026-10-04 (grok-4-1-fast: list price, assumed)

for (const line of fs.readFileSync(join(ROOT, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}

const probes = JSON.parse(fs.readFileSync(join(DIR, "probes.json"), "utf8"));
const pre = JSON.parse(fs.readFileSync(join(DIR, "prescreen.json"), "utf8"));
const judgedPath = join(DIR, "judged.json");
const prior = fs.existsSync(judgedPath) ? JSON.parse(fs.readFileSync(judgedPath, "utf8")) : {};
const spend = { calls: 0, in: 0, out: 0, usd: 0, byModel: {} };

const SYSTEM = [
  "You check ONE reply from an AI teacher to a child (India, classes 4-7, ages 9-13) in a live lesson. The child may write Hindi, English or Hinglish (Roman or Devanagari).",
  "You answer yes/no questions about the reply ONLY from what is written. Do not reward effort or good intentions; judge what the child would actually experience.",
  "The teacher's internal plan is not shown; only what the child sees and hears. 'On the stage' facts come from the app, not from the words.",
  "Return JSON: {\"answers\": {\"<check id>\": {\"a\": \"yes\"|\"no\", \"why\": \"<= 15 words\"}}} with every check id.",
].join("\n");

function userPrompt(r, spec) {
  const lines = [
    `LESSON: class ${r.cls}, topic "${r.topicTitle}". Child's language preference: ${r.childPref}. Lane: ${r.lane === "voice" ? "spoken (speech recognised)" : "typed"}. Moment: ${r.where}.`,
    `TEACHER'S PREVIOUS MESSAGE: ${r.before?.teacherReply ?? "(none)"}`,
    r.before?.ask?.text ? `QUESTION ON THE TABLE: ${r.before.ask.text}` : "QUESTION ON THE TABLE: (none — a teaching moment)",
    r.item ? `VERIFIED KEY for that question: ${r.item.key}${r.item.acceptable?.length ? ` (also accepted: ${r.item.acceptable.slice(0, 4).join("; ")})` : ""}` : "",
    ...(r.setup ?? []).flatMap((s) => [`CHILD (earlier): ${s.childText}`, `TEACHER (earlier): ${s.teacherReply}`]),
    `CHILD NOW: ${r.said}`,
    `TEACHER'S REPLY (judge this): ${r.reply ?? "(no reply)"}`,
    `ON THE STAGE THIS TURN: ${(r.visualNew ?? []).length ? r.visualNew.join(", ") : "nothing new"}. Lesson ended on this turn: ${r.end ? "YES" : "no"}.`,
    "",
    `WHAT A GOOD TEACHER DOES HERE (${r.intent}): ${spec.expect}.${r.note ? ` Case note: ${r.note}.` : ""}`,
    "QUESTIONS:",
    ...spec.checks.map((c) => `- ${c.id}: ${c.q}`),
  ];
  return lines.filter((l) => l !== "").join("\n");
}

async function ask(dep, r, spec) {
  const { chat } = await import(join(ROOT, "server", "azure.js"));
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await chat(dep, [{ role: "system", content: SYSTEM }, { role: "user", content: userPrompt(r, spec) }],
        { json: true, maxTokens: dep === "taxila-gpt6" ? 1500 : 700, effort: dep === "taxila-gpt6" ? "low" : undefined, timeoutMs: 60000, quotaLane: "background" });
      const u = res.usage ?? {};
      const p = PRICE[dep] ?? [0, 0];
      spend.calls++; spend.in += u.prompt_tokens ?? 0; spend.out += u.completion_tokens ?? 0;
      spend.usd += ((u.prompt_tokens ?? 0) * p[0] + (u.completion_tokens ?? 0) * p[1]) / 1e6;
      spend.byModel[dep] = (spend.byModel[dep] ?? 0) + ((u.prompt_tokens ?? 0) * p[0] + (u.completion_tokens ?? 0) * p[1]) / 1e6;
      const a = res.json?.answers ?? {};
      const out = {};
      for (const c of spec.checks) {
        const v = String(a[c.id]?.a ?? a[c.id] ?? "").toLowerCase();
        if (v !== "yes" && v !== "no") throw new Error(`missing ${c.id}`);
        out[c.id] = { a: v, why: String(a[c.id]?.why ?? "").slice(0, 160) };
      }
      return out;
    } catch (e) { if (attempt === 2) return { _error: String(e.message).slice(0, 160) }; }
  }
}

const passOf = (spec, answers, code) => spec.checks.every((c) => answers?.[c.id]?.a === c.want) && code.every((x) => x.pass);
const lenientOf = (spec, answers) => (spec.lenient ? spec.checks.filter((c) => spec.lenient.includes(c.id)).every((c) => answers?.[c.id]?.a === c.want) : null);

// ───────────────────────────── judging ─────────────────────────────
if (!REPORT_ONLY) {
  await import(join(ROOT, "server", "net.js"));
  const todo = probes.filter((r) => !r.skipped && r.reply != null && !(prior[r.id]?.j1 && !prior[r.id].j1._error && prior[r.id]?.j2 && !prior[r.id].j2._error));
  console.log(`judging ${todo.length} probes with ${J1} + ${J2}`);
  let n = 0;
  const q = [...todo];
  await Promise.all(Array.from({ length: CONC }, async () => {
    while (q.length) {
      const r = q.shift();
      const spec = checksFor(r);
      const [j1, j2] = spec.checks.length ? await Promise.all([ask(J1, r, spec), ask(J2, r, spec)]) : [{}, {}];
      prior[r.id] = { j1, j2 };
      if (++n % 25 === 0) { console.log(`${n}/${todo.length} ($${spend.usd.toFixed(2)})`); fs.writeFileSync(judgedPath, JSON.stringify(prior, null, 1)); }
    }
  }));
  // parking: did any LATER teacher message in the same lesson come back to the parked topic? (J1 only; a recall check)
  const PARKS = ["diversion", "curiosity_offlesson"];
  const parkTodo = probes.filter((r) => PARKS.includes(r.intent) && !r.skipped && r.reply && !prior[r.id]?.returned);
  for (const r of parkTodo) {
    const later = (r.later ?? []).slice(0, 12);
    if (!later.length) { prior[r.id].returned = { a: "n/a", why: "no later teacher message in this lesson" }; continue; }
    const { chat } = await import(join(ROOT, "server", "azure.js"));
    try {
      const res = await chat(J1, [{ role: "system", content: "You read a lesson transcript. Answer JSON {\"a\":\"yes\"|\"no\",\"why\":\"<=15 words\"}." },
        { role: "user", content: `Earlier the child said: "${r.said}". The teacher's later messages in the same lesson:\n${later.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\nDo any of these later messages come back to the child's earlier topic/question (address it, answer it, or offer to talk about it now)?` }],
      { json: true, maxTokens: 800, effort: "low", timeoutMs: 60000 });
      const u = res.usage ?? {};
      spend.calls++; spend.usd += ((u.prompt_tokens ?? 0) * 2 + (u.completion_tokens ?? 0) * 10) / 1e6;
      prior[r.id].returned = { a: String(res.json?.a ?? "").toLowerCase(), why: String(res.json?.why ?? "").slice(0, 160), laterCount: later.length };
    } catch (e) { prior[r.id].returned = { a: "error", why: String(e.message).slice(0, 120) }; }
  }
  fs.writeFileSync(judgedPath, JSON.stringify(prior, null, 1));
  const sp = fs.existsSync(join(DIR, "spend.json")) ? JSON.parse(fs.readFileSync(join(DIR, "spend.json"), "utf8")) : {};
  sp.judge = { ...spend, at: new Date().toISOString() };
  fs.writeFileSync(join(DIR, "spend.json"), JSON.stringify(sp, null, 1));
  console.log(`judge spend ≈ $${spend.usd.toFixed(2)} (${spend.calls} calls)`);
}

// ───────────────────────────── scoring ─────────────────────────────
const adjPath = join(DIR, "adjudications.json");
const adj = fs.existsSync(adjPath) ? JSON.parse(fs.readFileSync(adjPath, "utf8")) : {};
const rows = [];
for (const r of probes) {
  const spec = checksFor(r);
  if (r.skipped || r.reply == null) { rows.push({ id: r.id, intent: r.intent, skipped: r.skipped ?? (r.error ? `turn error: ${r.error.message}` : "no reply") }); continue; }
  const code = spec.code.map((k) => CODE[k](r)).filter(Boolean);
  const J = prior[r.id] ?? {};
  const p1 = J.j1 && !J.j1._error ? passOf(spec, J.j1, code) : null;
  const p2 = J.j2 && !J.j2._error ? passOf(spec, J.j2, code) : null;
  const disputed = p1 != null && p2 != null && p1 !== p2;
  const human = adj[r.id];
  const pass = human ? !!human.pass : disputed ? null : (p1 ?? p2);
  rows.push({ id: r.id, intent: r.intent, family: FAMILY[r.intent], lane: r.lane, lang: r.lang, where: r.where, said: r.said, reply: r.reply, moveKind: r.moveKind, end: r.end,
    visualNew: r.visualNew, code, j1: J.j1, j2: J.j2, p1, p2, disputed, human: human ?? null, pass,
    lenient: spec.lenient ? (lenientOf(spec, J.j1) && lenientOf(spec, J.j2)) || (human?.lenient ?? false) : null,
    failed: spec.checks.filter((c) => J.j1?.[c.id] && J.j1[c.id].a !== c.want).map((c) => c.id).concat(code.filter((x) => !x.pass).map((x) => `code:${x.why}`)),
    returned: J.returned ?? null });
}
// distress (offline on the prod path): the Director's move is safeguard iff flags.distress (state.js decide step 1)
for (const d of pre.rows.filter((x) => x.intent === "distress")) {
  const via = d.perTurn.map((t) => (t.predicate ? `predicate:${t.predicate}` : t.flags?.distress ? `model:${t.flags.distressKind ?? "classify"}` : "none")).join(",");
  rows.push({ id: d.id, intent: "distress", family: FAMILY.distress, said: d.texts.at(-1), offline: true, pass: d.distress, code: [{ pass: d.distress, why: `prod path → ${via}` }] });
}
fs.writeFileSync(join(DIR, "scored.json"), JSON.stringify(rows, null, 1));

// agreement (Cohen's kappa) over check answers present in both judges
let a = 0, nAg = 0, y1 = 0, y2 = 0, tot = 0;
for (const r of rows) {
  if (!r.j1 || !r.j2 || r.j1._error || r.j2._error) continue;
  for (const k of Object.keys(r.j1)) {
    if (!r.j2[k]) continue;
    tot++; if (r.j1[k].a === r.j2[k].a) nAg++; if (r.j1[k].a === "yes") y1++; if (r.j2[k].a === "yes") y2++;
  }
}
const po = tot ? nAg / tot : 0, pe = tot ? (y1 / tot) * (y2 / tot) + (1 - y1 / tot) * (1 - y2 / tot) : 0;
const kappa = pe < 1 ? (po - pe) / (1 - pe) : 1;
a = rows.filter((r) => r.p1 != null && r.p2 != null);
const caseAgree = a.length ? a.filter((r) => r.p1 === r.p2).length / a.length : 0;

// Wilson 80% interval
const wilson = (k, n, z = 1.2816) => {
  if (!n) return [0, 0];
  const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [(c - m) / d, (c + m) / d];
};
const scoredRows = rows.filter((r) => !r.skipped);
const decided = scoredRows.filter((r) => r.pass != null);
const byIntent = {};
for (const r of scoredRows) {
  const b = (byIntent[r.intent] ??= { intent: r.intent, family: r.family, n: 0, pass: 0, disputed: 0, lenient: 0, lenientN: 0, failed: {}, moves: {}, ended: 0 });
  b.n++;
  if (r.pass === true) b.pass++;
  if (r.pass == null) b.disputed++;
  if (r.lenient != null) { b.lenientN++; if (r.lenient) b.lenient++; }
  for (const f of r.failed ?? []) b.failed[f.replace(/^code:.*/, "code")] = (b.failed[f.replace(/^code:.*/, "code")] ?? 0) + 1;
  if (r.moveKind) b.moves[r.moveKind] = (b.moves[r.moveKind] ?? 0) + 1;
  if (r.end) b.ended++;
}
const byFamily = {};
for (const r of decided) { const f = (byFamily[r.family] ??= { n: 0, pass: 0 }); f.n++; if (r.pass) f.pass++; }
const parks = scoredRows.filter((r) => r.returned && r.returned.a !== "n/a");
const summary = {
  dir: DIR, at: new Date().toISOString(), judges: [J1, J2], cases: rows.length, scored: scoredRows.length, skipped: rows.filter((r) => r.skipped).length,
  decided: decided.length, disputedOpen: scoredRows.filter((r) => r.pass == null).length, adjudicated: Object.keys(adj).length,
  overall: { pass: decided.filter((r) => r.pass).length, n: decided.length, ci80: wilson(decided.filter((r) => r.pass).length, decided.length) },
  kappa: Number(kappa.toFixed(3)), checkAgreement: Number(po.toFixed(3)), checkN: tot, caseAgreement: Number(caseAgree.toFixed(3)), caseN: a.length,
  byFamily, byIntent: Object.values(byIntent).map((b) => ({ ...b, ci80: wilson(b.pass, b.n - b.disputed) })),
  parkedReturned: { yes: parks.filter((r) => r.returned.a === "yes").length, n: parks.length },
  endedOnNonTerminal: scoredRows.filter((r) => r.end && !["end_request", "leaving", "change_topic", "break_request"].includes(r.intent)).map((r) => r.id),
};
fs.writeFileSync(join(DIR, "summary.json"), JSON.stringify(summary, null, 1));

// disputes for the human read
const disp = scoredRows.filter((r) => r.disputed);
fs.writeFileSync(join(DIR, "disputes.md"), [`# Disputed cases (${disp.length})`, "",
  ...disp.flatMap((r) => [`## ${r.id} (${r.where}, ${r.lane}) — J1 ${r.p1 ? "PASS" : "FAIL"} / J2 ${r.p2 ? "PASS" : "FAIL"}${r.human ? ` — HUMAN ${r.human.pass ? "PASS" : "FAIL"}` : ""}`,
    `- child: ${r.said}`, `- teacher [${r.moveKind}${r.end ? ", END" : ""}]: ${r.reply}`, `- stage: ${(r.visualNew ?? []).join(", ") || "nothing new"}`,
    `- code: ${(r.code ?? []).map((c) => `${c.pass ? "ok" : "FAIL"} ${c.why}`).join("; ") || "—"}`,
    ...Object.keys(r.j1 ?? {}).filter((k) => !k.startsWith("_")).map((k) => `- ${k}: J1 ${r.j1[k].a} (${r.j1[k].why}) | J2 ${r.j2?.[k]?.a} (${r.j2?.[k]?.why ?? ""})`), ""])].join("\n"));
console.log(`overall ${summary.overall.pass}/${summary.overall.n}; disputed open ${summary.disputedOpen}; kappa ${summary.kappa}; case agreement ${summary.caseAgreement}`);
