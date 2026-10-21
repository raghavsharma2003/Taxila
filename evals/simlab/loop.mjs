// The sim lab loop (AGENT.md §2): N personas × arms × lanes → whole lessons through the real server → judge → failure
// clusters. One run writes evals/simlab/results/<run-id>/: meta.json, records/*.json (compact lesson records),
// transcripts/*.md, scores.json, FAILURES.md. No audio is ever written.
//
//   NODE_USE_ENV_PROXY=1 node evals/simlab/loop.mjs --arms director=http://127.0.0.1:8791 [--arms ...,agent=http://127.0.0.1:8792]
//       [--lanes text,voice] [--n 30] [--only p01,p05] [--turns 14] [--conc 6] [--run-id <id>] [--note "…"] [--no-judge2]
//       [--ack] (voice lane: ask /api/lesson/turn-ack beside each spoken turn) [--email-key k] (deterministic test emails
//       simlab+<persona>-<arm>-<k>@taxila.test, for a server cohort list) [--rejudge <run-dir>]   (re-judge existing records with the current judge, e.g. a different judge model)
//
// Each arm is a running server (evals/simlab/serve.mjs; the agent arm with TAXILA_TEACHER=agent). Same personas, same
// order, for every arm and lane.
import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, cpSync, rmSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { ROOT, MODELS, REGION, pool } from "./lib.mjs";
import { runLesson } from "./runner.mjs";
import { judgeLesson, autoChecks, understandingScore, SAFETY_BRIEF } from "./judge.mjs";
import { transcriptMd, failuresMd } from "./report.mjs";
import { childMode, ANSWER_MODEL } from "./decide.mjs";

const argv = process.argv.slice(2);
// a value is never the next flag: `--email-key --only p01` once made every test email "…---only" and silently missed the
// server's cohort list (0 continuers on r5-rel141-f618f8d-voice)
const arg = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  if (i < 0) return d;
  const v = argv[i + 1];
  if (v == null || v.startsWith("--")) throw new Error(`--${k} needs a value`);
  return v;
};
const flag = (k) => argv.includes(`--${k}`);

const PERSONAS = JSON.parse(readFileSync(join(ROOT, "evals/simlab/personas.json"), "utf8"));
const byId = new Map(PERSONAS.map((p) => [p.id, p]));

const rejudge = arg("rejudge", null);
const head = (() => { try { return execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim(); } catch { return "?"; } })();
const runId = rejudge ? rejudge.split("/").filter(Boolean).pop() : arg("run-id", `${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}-${head}`);
// a run is written in the scratch root (SIMLAB_WORK, default the OS tmp) and copied into results/ when it is complete
const FINAL = rejudge ?? join(ROOT, "evals/simlab/results", runId);
const OUT = rejudge ?? (flag("in-place") ? FINAL : join(process.env.SIMLAB_WORK || "/tmp", "simlab", runId));
for (const d of ["records", "transcripts"]) mkdirSync(join(OUT, d), { recursive: true });

const arms = Object.fromEntries((arg("arms", "director=http://127.0.0.1:8791")).split(",").map((s) => s.split("=")));
const lanes = arg("lanes", "text").split(",");
const only = arg("only", null)?.split(",");
const n = Number(arg("n", 30));
// --also p65,p66: cards added on top of the --n spread (e.g. main's pet-incident cards in a baseline run)
const also = arg("also", null)?.split(",") ?? [];
const personas = (only ? PERSONAS.filter((p) => only.some((o) => p.id.startsWith(o))) : spread(PERSONAS.filter((p) => !p.petEvent), n))
  .concat(also.length ? PERSONAS.filter((p) => also.some((o) => p.id.startsWith(o))) : []);
// TEST and production share the taxila-fast deployment (same TPM): lessons in parallel are capped (main, 2026-10-15:
// ≤4, starts staggered) so a lab run never throttles a live lesson. Judging calls only the judge deployments.
const MAX_LESSONS = Number(process.env.SIMLAB_MAX_LESSONS || 4);
const conc = Math.min(Number(arg("conc", 4)), MAX_LESSONS);
const judgeConc = Number(arg("judge-conc", 8));
// --audit-aware-arms a,b: in decided mode these arms' child answers the deep-marks items (SIMLAB_DEEP_MARKS) on the plain row
const auditArms = arg("audit-aware-arms", "").split(",").filter(Boolean);
const STAGGER_MS = 8000;
const turns = Number(arg("turns", 14));
const useJudge2 = !flag("no-judge2");

/** n personas spread over the grid (every class, temperament and language), the safety cards always in. */
function spread(all, k) {
  if (k >= all.length) return all;
  const safety = all.filter((p) => p.safetyEvent);
  const rest = all.filter((p) => !p.safetyEvent);
  return [...safety, ...rest.slice(0, Math.max(0, k - safety.length))];
}

const compact = (rec) => ({ ...rec, turns: rec.turns.map((t) => ({ ...t, ui: t.ui ? { ask: t.ui.ask, chips: t.ui.chips, tray: t.ui.tray, answerForm: t.ui.answerForm, verdict: t.ui.verdict, phase: t.ui.phase, studioSlot: t.ui.studioSlot ? { state: t.ui.studioSlot.state, kind: t.ui.studioSlot.artifact?.kind } : undefined } : undefined })) });

let meta = { runId, head, date: new Date().toISOString(), arms, lanes, n: personas.length, turns, models: MODELS, childRules: process.env.SIMLAB_CHILD_RULES || "v1", region: REGION,
  // decided mode: the harness draws each answer's outcome (answer-model.json, printed here); free: the child model answers
  childMode: childMode(), ...(childMode() === "decided" ? { answerModel: ANSWER_MODEL, seed: process.env.SIMLAB_SEED || "taxila", kitRoot: process.env.SIMLAB_KIT_ROOT || "this repo", ...(process.env.SIMLAB_DEEP_MARKS ? { deepMarks: process.env.SIMLAB_DEEP_MARKS.split("/").pop(), auditAwareArms: arg("audit-aware-arms", "") } : {}) } : {}), note: arg("note", "") };
// a re-run of some lessons into an existing run keeps that run's meta and logs the re-run
if (existsSync(join(OUT, "meta.json"))) {
  const old = JSON.parse(readFileSync(join(OUT, "meta.json"), "utf8"));
  meta = rejudge ? old : { ...old, reruns: [...(old.reruns ?? []), { date: meta.date, head, personas: personas.map((p) => p.id), why: arg("note", "") }] };
}
// the safety_floor brief that scored this run (a rejudge records it, so before/after runs compare on one brief)
meta = { ...meta, safetyBrief: SAFETY_BRIEF, ...(rejudge ? { rejudged: [...(meta.rejudged ?? []), { date: new Date().toISOString(), safetyBrief: SAFETY_BRIEF }] } : {}) };
writeFileSync(join(OUT, "meta.json"), JSON.stringify(meta, null, 1));

let voice = null;
if (lanes.includes("voice")) voice = await import("./voice.mjs");

// 1. lessons
const jobs = [];
for (const p of personas) for (const [arm, base] of Object.entries(arms)) for (const lane of lanes) jobs.push({ p, arm, base, lane });
const recFile = (j) => join(OUT, "records", `${j.p.id}--${j.arm}--${j.lane}.json`);
if (!rejudge) {
  console.log(`simlab ${runId}: ${jobs.length} lessons (${personas.length} personas × ${Object.keys(arms).length} arms × ${lanes.length} lanes), conc ${conc}`);
  let done = 0, started = 0;
  await pool(jobs, conc, async (j) => {
    if (existsSync(recFile(j)) && flag("resume")) return;
    const k = started++;
    if (k < conc) await new Promise((r) => setTimeout(r, k * STAGGER_MS)); // the first wave starts staggered, not as one burst
    const rec = await runLesson(j.p, { base: j.base, lane: j.lane, maxTurns: turns, voice, ack: flag("ack") && j.lane === "voice", auditAware: auditArms.includes(j.arm),
      ...(arg("email-key", null) ? { emailKey: `${j.arm}-${arg("email-key")}`, tag: "simlab" } : {}) });
    rec.arm = j.arm;
    writeFileSync(recFile(j), JSON.stringify(compact(rec)));
    console.log(`[${++done}/${jobs.length}] ${j.p.id} ${j.arm}/${j.lane}: ${rec.turns.length - 1} turns, ${rec.errors.length} errors`);
  });
}

// accounts the server would not delete (a safeguarding incident holds the erase for review): listed, never forced
const leftovers = readdirSync(join(OUT, "records")).flatMap((f) => JSON.parse(readFileSync(join(OUT, "records", f), "utf8")).errors.filter((e) => e.at === "cleanup").map((e) => e.msg));
if (leftovers.length) writeFileSync(join(OUT, "LEFTOVER-ACCOUNTS.json"), JSON.stringify(leftovers, null, 1));

// 2. judge
const recs = readdirSync(join(OUT, "records")).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(join(OUT, "records", f), "utf8")));
console.log(`judging ${recs.length} lessons with ${MODELS.judge}${useJudge2 ? ` + ${MODELS.judge2}` : ""}`);
// --reuse-judged: keep the stored LLM judgments (scores.json) and recompute only the code checks and the report
const prior = flag("reuse-judged") && existsSync(join(OUT, "scores.json"))
  ? new Map(JSON.parse(readFileSync(join(OUT, "scores.json"), "utf8")).lessons.map((r) => [`${r.persona}/${r.arm}/${r.lane}`, r])) : new Map();
const rows = await pool(recs, judgeConc, async (rec) => {
  const p = byId.get(rec.persona);
  const row = { persona: rec.persona, arm: rec.arm, lane: rec.lane, turns: rec.turns.filter((t) => t.child).length, auto: autoChecks(rec, p),
    lines: Object.fromEntries(rec.turns.map((t) => [t.n, (t.teacher ?? "").slice(0, 160)])) };
  const old = prior.get(`${rec.persona}/${rec.arm}/${rec.lane}`);
  if (old?.judged && JSON.stringify(old.lines) === JSON.stringify(row.lines)) { row.judged = old.judged; row.judged2 = old.judged2; } // a re-run lesson is judged afresh
  else {
    try { row.judged = await judgeLesson(rec, p, MODELS.judge); } catch (e) { row.judgeError = String(e.message).slice(0, 200); }
    if (useJudge2) { try { row.judged2 = await judgeLesson(rec, p, MODELS.judge2); } catch (e) { row.judge2Error = String(e.message).slice(0, 200); } }
  }
  row.understanding = understandingScore(rec, p, row.judged);
  row.understanding2 = row.judged2 ? understandingScore(rec, p, row.judged2) : null;
  writeFileSync(join(OUT, "transcripts", `${rec.persona}--${rec.arm}--${rec.lane}.md`), transcriptMd(rec, p, row));
  process.stdout.write(".");
  return row;
});
console.log("");

// 3. report
// an arm whose reply model was unavailable on more than 2% of turns (the fallback line was said) is not scored
const unavailable = {};
for (const r of recs) {
  const k = `${r.arm}/${r.lane}`;
  const u = (unavailable[k] ??= { turns: 0, unavailable: 0 });
  for (const t of r.turns) if (t.n > 0 && t.teacher != null) { u.turns++; if ((t.reasons?.guard?.caught ?? []).includes("unavailable")) u.unavailable++; }
}
// over 2% across the run, or in an arm with enough turns to say so (one fallback turn in a 36-turn repeat arm is not a rate)
const all = Object.values(unavailable).reduce((a, u) => ({ turns: a.turns + u.turns, unavailable: a.unavailable + u.unavailable }), { turns: 0, unavailable: 0 });
const dropped = [
  ...(all.turns && all.unavailable / all.turns > 0.02 ? [`whole run ${all.unavailable}/${all.turns}`] : []),
  ...Object.entries(unavailable).filter(([, u]) => u.turns >= 100 && u.unavailable / u.turns > 0.02).map(([k, u]) => `${k} ${u.unavailable}/${u.turns}`),
];
meta.unavailable = unavailable;
if (dropped.length) meta.dropped = dropped;
const { md: md0, sum, clusters } = failuresMd(rows, meta);
const md = dropped.length ? `> **DROPPED — not to be scored.** The reply model was unavailable (fallback line) on more than 2% of turns: ${dropped.join("; ")}. Re-run under the lesson cap.\n\n${md0}` : md0;
writeFileSync(join(OUT, "scores.json"), JSON.stringify({ meta, summary: sum, clusters: clusters.map((c) => ({ type: c.type, lessons: c.lessons, instances: c.instances })), lessons: rows }, null, 1));
writeFileSync(join(OUT, "FAILURES.md"), md);
console.log(md.split("## Failure clusters")[0]);
console.log(clusters.map((c) => `${c.type}: ${c.lessons} lessons / ${c.instances}`).join("\n"));
if (OUT !== FINAL) { mkdirSync(FINAL, { recursive: true }); cpSync(OUT, FINAL, { recursive: true }); }
console.log(`\nwrote ${FINAL}`);
