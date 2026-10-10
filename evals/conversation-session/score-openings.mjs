// The session-opening battery (openings.mjs, 49 scripted openings, classes 3-8, Hinglish / Hindi / English), run through the
// session-first intake beat (server/director/session/beat.js) with the REAL kit files and syllabus. Deterministic: no model,
// no network, no database. A confirm reply that code cannot grade is counted (needsModel) and continued as no_evidence:
// that grade only moves the segment's mode (transfer / foundation), never its purpose or topic.
//   node evals/conversation-session/score-openings.mjs [--set heldout|dev] [--verbose] [--json]
// BEFORE (today's start, no intake): the lesson opens on the plan's level-path topic whatever the child says.
import { intakeStart, intakeStep } from "../../server/director/session/beat.js";
import { planPrior } from "../../server/director/session/prior.js";
import { INTAKE_MAX_MS } from "../../server/director/session/flags.js";
import { getTopic } from "../../server/content/curriculum.js";
import { kitFromFile } from "../../server/content/kits.js";

const argv = process.argv.slice(2);
const set = argv.includes("--set") ? argv[argv.indexOf("--set") + 1] : "heldout";
const verbose = argv.includes("--verbose");
const rows = set === "dev" ? (await import("./dev-openings.mjs")).DEV_OPENINGS : (await import("./openings.mjs")).OPENINGS;

const kitFor = (id) => { const t = getTopic(id); return t ? kitFromFile(t) : null; };
const prefixOk = (got, want) => (want == null ? got == null : !!got && got.startsWith(want));

function priorOf(o) {
  const tw = o.ctx.testWindow;
  const p = planPrior(null, { classLevel: o.cls, levelPathTopic: o.ctx.levelPathTopic, dueReviews: o.ctx.dueReviews, pointer: o.ctx.pointer });
  return tw ? { ...p, testWindow: { subject: tw.subject, when: tw.when, chapters: [] } } : p;
}

export function runOpening(o) {
  const t0 = 1_000_000;
  let { state } = intakeStart({ now: t0, classLevel: o.cls, ctx: { subjects: o.ctx.subjects, pointer: o.ctx.pointer } });
  const prior = priorOf(o);
  let res = null, childTurns = 0, needsModel = 0, i = 0;
  const moves = [];
  for (; i < o.turns.length; i++) {
    childTurns++;
    res = intakeStep(state, { text: o.turns[i], now: t0 + 15_000 * (i + 1), kitFor, statusOf: () => "unseen", prior });
    if (res.needsGrade) { needsModel++; res = intakeStep(res.state, { graded: "no_evidence", now: t0 + 15_000 * (i + 1) + 500, kitFor, statusOf: () => "unseen", prior }); }
    moves.push(res.move?.kind ?? null);
    state = res.state;
    if (res.done) break;
  }
  // the script ran out while she still waited on an answer: the 90 s limit closes the intake with what is known
  let timedOut = false;
  if (!res?.done) { timedOut = true; res = intakeStep(state, { text: "", now: t0 + INTAKE_MAX_MS + 1, kitFor, statusOf: () => "unseen", prior, graded: "no_evidence" }); }
  const d = res.decision;
  const purposeOk = d.purpose === o.expect.purpose;
  const topicOk = o.expect.purpose === "safeguard" ? true : prefixOk(d.topicId, o.expect.topicPrefix);
  const turnsOk = childTurns <= o.expect.maxTurns;
  return { id: o.id, cls: o.cls, lang: o.lang, expect: o.expect, got: { purpose: d.purpose, topicId: d.topicId, mode: d.mode, foundation: d.foundation }, childTurns, timedOut, needsModel, moves,
    purposeOk, topicOk, turnsOk, ok: purposeOk && topicOk, before: { purpose: "level_path", topicId: o.ctx.levelPathTopic,
      ok: o.expect.purpose === "level_path" ? prefixOk(o.ctx.levelPathTopic, o.expect.topicPrefix) : false } };
}

const res = rows.map(runOpening);
const n = res.length;
const count = (f) => res.filter(f).length;
const safety = res.filter((r) => r.expect.purpose === "safeguard");
const falseSafe = res.filter((r) => r.expect.purpose !== "safeguard" && r.got.purpose === "safeguard");
const turns = res.filter((r) => r.got.purpose !== "safeguard").map((r) => r.childTurns).sort((a, b) => a - b);
const q = (p) => turns[Math.min(turns.length - 1, Math.floor(p * turns.length))];
console.log(`openings (${set}), n = ${n}; deterministic code path, no model, real kit files`);
console.log(`BEFORE (today: the plan's topic, no intake): purpose+topic right ${count((r) => r.before.ok)}/${n}`);
console.log(`AFTER  (session-first intake): purpose+topic right ${count((r) => r.ok)}/${n}; purpose ${count((r) => r.purposeOk)}/${n}; topic ${count((r) => r.topicOk)}/${n}`);
console.log(`turns to the first teaching beat (child turns, non-safeguard, n = ${turns.length}): p50 ${q(0.5)}, p90 ${q(0.9)}, max ${turns.at(-1)}; within the case's own max ${count((r) => r.turnsOk)}/${n}; timed out ${count((r) => r.timedOut)}`);
console.log(`safety: safeguard openings decided safeguard ${count((r) => r.expect.purpose === "safeguard" && r.got.purpose === "safeguard")}/${safety.length}; false safeguards ${falseSafe.length}`);
console.log(`confirm replies that need the model's closed-label read: ${res.reduce((a, r) => a + r.needsModel, 0)}`);
const byPurpose = {};
for (const r of res) { const b = (byPurpose[r.expect.purpose] ??= { n: 0, ok: 0 }); b.n++; if (r.ok) b.ok++; }
for (const [k, v] of Object.entries(byPurpose)) console.log(`  ${k.padEnd(16)} ${v.ok}/${v.n}`);
const byLang = {};
for (const r of res) { const b = (byLang[r.lang] ??= { n: 0, ok: 0 }); b.n++; if (r.ok) b.ok++; }
console.log(`  by language: ${Object.entries(byLang).map(([k, v]) => `${k} ${v.ok}/${v.n}`).join(", ")}`);
if (verbose) for (const r of res) if (!r.ok || !r.turnsOk) console.log(`${r.ok ? "TURNS" : "FAIL "} ${r.id} c${r.cls} want ${r.expect.purpose}/${r.expect.topicPrefix} got ${r.got.purpose}/${r.got.topicId} (${r.got.mode}) turns ${r.childTurns}/${r.expect.maxTurns} moves ${r.moves.join(",")}`);
if (argv.includes("--json")) console.log(JSON.stringify(res));
