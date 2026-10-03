// Parent-report battery on simulated children (STUDENT-SIM personas, evals/comprehension-sim): seeds one school week
// (2026-W39, Mon 21 - Sun 27 Sep 2026, five lesson days) for three personas into the TEST Neon branch through the REAL
// learner writer (kt_evidence / kt_skill_state / kt_misconception / comp_facet_state via ledgerStmts + facetStmts +
// commit), generates every daily note and the weekly letter with the real generator (Lane B on taxila-brain), runs
// one weekly letter end to end through the Conductor job queue (enqueue → claim → runJob → complete_job), and has the
// INDEPENDENT checker (server/reports/check.js) re-derive every claim from the rows it cites. Then it mutates claims
// (a count +1, a foreign row, a dropped row, another skill's title) to measure that the checker catches what it should.
//
// NEVER production: refuses unless CONDUCTOR_TEST_DATABASE_URL is set and is not the DATABASE_URL endpoint.
// Usage: NODE_USE_ENV_PROXY=1 node --env-file=.env.local server/reports/eval/sim-week.mjs [--no-llm]
import { mkdirSync, writeFileSync } from "fs";
import { randomUUID } from "crypto";

const TEST = process.env.CONDUCTOR_TEST_DATABASE_URL, PROD = process.env.DATABASE_URL;
const hostOf = (u) => { try { return new URL(u).hostname.replace(/-pooler\./, "."); } catch { return ""; } };
if (!TEST || (PROD && hostOf(TEST) === hostOf(PROD))) { console.error("refusing: CONDUCTOR_TEST_DATABASE_URL unset or the production endpoint"); process.exit(2); }
process.env.DATABASE_URL = TEST;                 // server/db.js (the learner writer) reads it lazily: from here on, test branch only
const NO_LLM = process.argv.includes("--no-llm");
const RUN = randomUUID().slice(0, 8);

const { q, one } = await import("../../db.js");
const { commit, ledgerStmts } = await import("../../learner/writer.js");
const { facetStmts } = await import("../../comprehension/store.js");
const { newLearnerState, fuseEvidence } = await import("../../comprehension/fuse.js");
const { beliefFor } = await import("../../comprehension/state.js");
const { shapeById } = await import("../../comprehension/probes/shapes.js");
const { outcomeIndex } = await import("../../learner/kt/outcomes.js");
const { rank, DELAY_MS } = await import("../../learner/kt/ledger.js");
const { PERSONAS } = await import("../../../evals/comprehension-sim/personas.mjs");
const { rng, itemAnswer, probeAnswer, choiceAnswer } = await import("../../../evals/comprehension-sim/child.mjs");
const { concepts } = await import("../../../evals/comprehension-sim/world.mjs");
const { generateReport, kitLookup, findReport } = await import("../index.js");
const { checkReport } = await import("../check.js");
const { JOB_BUDGET } = await import("../config.js");
const C = await import("../../conductor/index.js");
const { configure, closePool } = await import("../../conductor/pg.js");
await import("../jobs.js");

// ───────────── the week ─────────────
const WEEK = "2026-W39";
const DAYS = [
  { day: "2026-09-21", topics: ["c1", "c2"], fresh: ["c1", "c2"] },
  { day: "2026-09-22", topics: ["c3", "c4"], fresh: ["c3", "c4"] },
  { day: "2026-09-23", topics: ["c5", "c6"], fresh: ["c5", "c6"] },
  { day: "2026-09-25", topics: ["c1", "c3", "c5"], fresh: [] },
  { day: "2026-09-26", topics: ["c2", "c4", "c6"], fresh: [] },
];
const PICK = [
  // `interest`: a memory row shaped like the real lesson-end writer's output (server/routes/lesson.js: a model
  // paraphrase, ≤ 14 words); the report must never quote it (no interest line since pr-2)
  { persona: "p02", name: "Aarav", pref: "hinglish", interest: "loves cricket" },                       // understander, Hinglish
  { persona: "p18", name: "Meher", pref: "english", interest: "Enjoys drawing animals with her sister" }, // confident misconception, English
  { persona: "p24", name: "Kabir", pref: "hindi", interest: "kabaddi khelna pasand hai" },              // Hindi-medium understander, Hindi
];
const CS = concepts();
const byId = Object.fromEntries(CS.map((c) => [c.id, c]));

async function seedChild(guardianId, pick) {
  const P = PERSONAS.find((p) => p.id === pick.persona);
  const child = await one(`insert into child (guardian_id, first_name, class_level, language_pref, school_medium) values ($1, $2, $3, $4, $5)
    returning id, legal_mode, first_name, class_level, language_pref`, [guardianId, pick.name, P.classLevel, pick.pref, pick.pref === "hindi" ? "hindi" : "english"]);
  const r = rng(`reports-sim:${P.id}`);
  const truth = Object.fromEntries(CS.map((c, i) => [c.skillId, { ...P.truth(i) }]));
  let S = newLearnerState({ childId: child.id, classLevel: P.classLevel });
  let seq = 0;
  const lessons = [];
  for (const [si, plan] of DAYS.entries()) {
    const start = Date.parse(`${plan.day}T11:30:00.000Z`);                     // 17:00 IST
    const lesson = await one("insert into lesson (child_id, topic_id, kind, started_at) values ($1, $2, 'live', $3) returning id", [child.id, byId[plan.topics[0]].topicId, new Date(start).toISOString()]);
    const sessionId = String(lesson.id);
    let minute = 0, ep = 0;
    const events = [];
    const base = () => { minute += 1; return { id: `sim-${RUN}-${child.id.slice(0, 8)}-${++seq}`, seq, sessionId, sessionStartAt: new Date(start).toISOString(),
      at: new Date(start + minute * 60_000).toISOString(), episodeId: `${sessionId}-ep${++ep}`, itemKey: `k${seq}`, graderVersion: "sim", topicType: "T3" }; };
    const fuse = (ev) => { S = fuseEvidence(S, [ev], {}); events.push(ev); };
    const before = S.ledger;
    // session open: one callback per skill learned in an earlier session (a delayed check, C31)
    for (const [k, sk] of Object.entries(S.ledger.skills)) {
      if (rank(sk.display) >= rank("learned_today") && sk.anchorAt && start - Date.parse(sk.anchorAt) >= DELAY_MS) {
        const a = itemAnswer(P, truth[k], "std", r);
        fuse({ ...base(), skillIds: [k], cls: "item.open", outcome: outcomeIndex("item.open", a.o), grader: "code", shapeId: "C31", via: "callback", form: "produce" });
      }
    }
    for (const cid of plan.topics) {
      const c = byId[cid], k = c.skillId, t = truth[k], mis = c.misconceptions[0]?.id;
      if (plan.fresh.includes(cid)) fuse({ ...base(), skillIds: [k], cls: "item.open", outcome: 0, grader: "code", teach: true });
      const kinds = plan.fresh.includes(cid) ? ["std", "disc", "std", "coinc", "std", "disc"] : ["std", "disc", "std", "std"];
      for (const [j, kind] of kinds.entries()) {
        const a = itemAnswer(P, t, kind, r);
        fuse({ ...base(), skillIds: [k], cls: "item.open", outcome: outcomeIndex("item.open", a.o), grader: "code", form: "produce",
          ...(kind === "disc" && mis ? { discriminates: mis } : {}), ...(a.mis && mis ? { misconceptionId: mis } : {}), ...(kind === "coinc" ? { coincident: true } : {}) });
        const revisit = !plan.fresh.includes(cid);
        const probe = j === 1 ? "C01" : j === 3 ? "C06" : j === 2 && revisit ? "C13" : j === 0 && revisit ? "C05" : null;
        if (probe) {
          const shape = shapeById(probe);
          const pa = await probeAnswer(P, t, c, shape, r, null);
          if (pa.outcome != null && pa.outcome >= 0) fuse({ ...base(), skillIds: [k], cls: shape.emits, outcome: pa.outcome, grader: pa.grader, shapeId: probe, via: "dialogue",
            spanOk: pa.spanOk, ...(pa.mis && mis ? { misconceptionId: mis } : {}) });
        }
      }
      if (mis && !plan.fresh.includes(cid)) {                                   // the kit diagnostic (a 3-option choice)
        const a = choiceAnswer(P, t, 3, r);
        fuse({ ...base(), skillIds: [k], cls: "item.mcq3", outcome: outcomeIndex("item.mcq3", a.o), grader: "code", discriminates: mis, ...(a.mis ? { misconceptionId: mis } : {}) });
      }
    }
    const ended = new Date(start + (minute + 2) * 60_000).toISOString();
    await q("update lesson set ended_at = $2 where id = $1", [lesson.id, ended]);
    const stmts = ledgerStmts(child, before, S.ledger, events);
    const touched = [...new Set(events.flatMap((e) => e.skillIds))];
    stmts.push(...facetStmts(child, touched.map((k) => beliefFor(k, { ...S, now: ended }))).map((s) => ({ ...s, layer: "kt", rows: "any" })));
    await commit(child, stmts);
    if (si === 1) {                                                              // what the child said they like (memory, cited turn)
      const t = await one("insert into turn (lesson_id, seq, speaker, text, at) values ($1, 1, 'child', $2, $3) returning id", [lesson.id, `I like ${pick.interest}`, new Date(start + 5 * 60_000).toISOString()]);
      await q("insert into memory (child_id, kind, text, source_turn, created_at) values ($1, 'interest', $2, $3, $4)", [child.id, pick.interest, t.id, new Date(start + 6 * 60_000).toISOString()]);
    }
    lessons.push({ id: String(lesson.id), day: plan.day, events: events.length });
  }
  return { child, persona: P.id, archetype: P.archetype, lessons };
}

// ───────────── run ─────────────
const t0 = Date.now();
await q("delete from guardian where email like 'reports-sim+%@test.invalid' and created_at < now() - interval '1 hour'");
const g = await one("insert into guardian (email, pw_hash, name) values ($1, 'x', 'reports-sim') returning id", [`reports-sim+${RUN}@test.invalid`]);
for (const p of ["core_tutoring", "learning_profile", "memory"]) await q("insert into consent (guardian_id, child_id, purpose, version, granted, method) values ($1, null, $2, 'sim', true, 'sim')", [g.id, p]);
const kids = [];
for (const pick of PICK) kids.push({ ...(await seedChild(g.id, pick)), pick });
console.log(`[sim] seeded ${kids.length} children, ${kids.reduce((a, k) => a + k.lessons.reduce((b, l) => b + l.events, 0), 0)} kt_evidence rows in ${Date.now() - t0} ms`);

const llm = NO_LLM ? null : undefined;                 // undefined → the real Azure chat (taxila-brain → taxila-fast)
const db = { q };
const results = [];

// (1) one weekly letter through the Conductor job queue, for real
await configure({ url: TEST, driver: "neon-ws", max: 4 });
const jobKid = kids[0].child.id;
await C.enqueueJob(jobKid, { kind: "parent.letter", idemKey: `parent.letter:${jobKid}:${WEEK}`, input: { isoWeek: WEEK }, lane: "fast", priority: 2,
  budgetMicroUsd: JOB_BUDGET.weekly, maxAttempts: 4, leaseSec: 120 }, { correlationId: `reports-sim:${RUN}` });
const dup = await C.enqueueJob(jobKid, { kind: "parent.letter", idemKey: `parent.letter:${jobKid}:${WEEK}`, input: { isoWeek: WEEK }, lane: "fast", budgetMicroUsd: JOB_BUDGET.weekly });
const claimed = await C.claimJobs("fast", { kinds: ["parent.letter"], childIds: [jobKid], worker: "reports-sim" });
const jobT = performance.now();
const jobOk = claimed[0] ? await C.runJob(claimed[0]) : false;
const jobMs = Math.round(performance.now() - jobT);
const jobRow = await one("select status, result_ref, spent_micro_usd, attempts from job where child_id = $1 and kind = 'parent.letter'", [jobKid]);
const reclaim = await C.claimJobs("fast", { kinds: ["parent.letter"], childIds: [jobKid], worker: "reports-sim" });
const jobDone = await one("select count(*)::int as n from student_event where child_id = $1 and type = 'job.done'", [jobKid]);
const job = { claimed: claimed.length, duplicateEnqueueId: dup, ok: jobOk, ms: jobMs, row: jobRow, reclaimed: reclaim.length, jobDoneEvents: jobDone.n };
console.log("[sim] conductor job:", JSON.stringify(job));
await closePool();

// (2) every daily note and every other weekly letter, directly
for (const k of kids) {
  for (const p of [...k.lessons.map((l) => ({ cadence: "daily", period: l.day })), { cadence: "weekly", period: WEEK }]) {
    const s = performance.now();
    let out, err = null;
    try { out = await generateReport(k.child.id, p, { db, llm, budgetMicroUsd: JOB_BUDGET[p.cadence] }); }
    catch (e) { err = { code: e.code, message: String(e.message).slice(0, 300), violations: e.violations ?? null }; }
    results.push({ child: k.child.id, persona: k.persona, ...p, ms: Math.round(performance.now() - s), id: out?.id ?? null, existing: !!out?.existing, skipped: out?.skipped ?? null, err });
  }
}

// (3) the independent checker on every stored report, then mutants
const checks = [];
const mutants = { made: 0, caught: 0, byKind: {} };
const foreign = (await one("select id from kt_evidence where child_id <> all($1::uuid[]) limit 1", [kids.map((k) => k.child.id)]))?.id ?? "kt-foreign-none";
for (const res of results.filter((r) => r.id)) {
  const row = await findReport(db, res.child, res.cadence, res.period);
  const c = await checkReport(db, row, kitLookup);
  checks.push({ ...res, supported: c.supported, total: c.total, lines: c.lines, unsupported: c.claims.filter((x) => !x.ok) });
  const otherTitle = CS.map((x) => x.title).find((t) => !row.claims.some((cl) => cl.slots.skill === t));
  for (const [i, cl] of row.claims.entries()) {
    const variants = [];
    const nums = Object.keys(cl.slots).filter((s) => typeof cl.slots[s] === "number");
    if (nums[0]) variants.push(["count+1", { ...cl, slots: { ...cl.slots, [nums[0]]: cl.slots[nums[0]] + 1 } }]);
    // slot swaps and off-by-ones on EVERY numeric slot: a set-membership digit check would pass these; only the
    // checker's re-derivation from rows can catch them (review finding on the numeric-fidelity claim)
    if (typeof cl.slots.n === "number" && typeof cl.slots.k === "number" && cl.slots.n !== cl.slots.k) variants.push(["swap_n_k", { ...cl, slots: { ...cl.slots, n: cl.slots.k, k: cl.slots.n } }]);
    for (const key of nums.slice(1)) variants.push(["other_slot+1", { ...cl, slots: { ...cl.slots, [key]: cl.slots[key] + 1 } }]);
    for (const key of nums) if (cl.slots[key] > 1) variants.push(["slot-1", { ...cl, slots: { ...cl.slots, [key]: cl.slots[key] - 1 } }]);
    if (cl.slots.date) variants.push(["date+1", { ...cl, slots: { ...cl.slots, date: { ...cl.slots.date, d: cl.slots.date.d === 28 ? 27 : cl.slots.date.d + 1 } } }]);
    if (cl.factIds.some((f) => f.startsWith("kt_evidence:"))) {
      variants.push(["foreign_row", { ...cl, factIds: [...cl.factIds.filter((f, j) => j !== cl.factIds.findIndex((x) => x.startsWith("kt_evidence:"))), `kt_evidence:${foreign}`] }]);
      if (cl.factIds.length > 1) variants.push(["dropped_row", { ...cl, factIds: cl.factIds.filter((f, j) => j !== cl.factIds.findIndex((x) => x.startsWith("kt_evidence:"))) }]);
    }
    if (cl.slots.skill && otherTitle) variants.push(["other_skill_title", { ...cl, slots: { ...cl.slots, skill: otherTitle } }]);
    for (const [kind, m] of variants) {
      const r = await checkReport(db, { ...row, claims: row.claims.map((x, j) => (j === i ? m : x)) }, kitLookup);
      const caught = !r.claims[i].ok;
      mutants.made++; if (caught) mutants.caught++;
      const b = (mutants.byKind[kind] ??= { made: 0, caught: 0, missed: [] }); b.made++; if (caught) b.caught++; else b.missed.push(`${cl.shapeId}`);
    }
  }
}

// ───────────── summary ─────────────
const stored = await q(`select r.id, r.cadence, r.period, r.child_id, r.meta, r.renders, r.claims from parent_report r where r.child_id = any($1::uuid[]) order by r.child_id, r.cadence, r.period`, [kids.map((k) => k.child.id)]);
const laneB = stored.map((r) => r.meta.laneB);
const callMs = laneB.flatMap((l) => (l.attempts || []).filter((a) => a.ms != null && !a.error).map((a) => a.ms)).sort((a, b) => a - b);
const pct = (a, p) => (a.length ? a[Math.min(a.length - 1, Math.floor(p * (a.length - 1)))] : null);
const totalClaims = checks.reduce((a, c) => a + c.total, 0), supportedClaims = checks.reduce((a, c) => a + c.supported, 0);
const summary = {
  at: new Date().toISOString(), run: RUN, week: WEEK, llm: !NO_LLM, children: kids.map((k) => ({ id: k.child.id, persona: k.persona, archetype: k.archetype, lang: k.pick.pref, lessons: k.lessons.length, events: k.lessons.reduce((a, l) => a + l.events, 0) })),
  reports: { attempted: results.length, stored: stored.length, gateThrows: results.filter((r) => r.err?.code === "report_gate").length, errors: results.filter((r) => r.err).map((r) => ({ ...r.err, period: r.period, persona: r.persona })), skipped: results.filter((r) => r.skipped).length },
  claimSupport: { supported: supportedClaims, total: totalClaims, rate: totalClaims ? supportedClaims / totalClaims : null, linesMapped: checks.reduce((a, c) => a + c.lines.mapped, 0), lines: checks.reduce((a, c) => a + c.lines.total, 0),
    unsupported: checks.flatMap((c) => c.unsupported.map((u) => ({ persona: c.persona, period: c.period, ...u }))) },
  mutants: { ...mutants, rate: mutants.made ? mutants.caught / mutants.made : null },
  laneB: { reports: laneB.length, laneB: laneB.filter((l) => l.lane === "B").length, models: Object.fromEntries([...new Set(laneB.map((l) => l.model))].map((m) => [m, laneB.filter((l) => l.model === m).length])),
    calls: laneB.reduce((a, l) => a + (l.attempts?.length || 0), 0), invalid: laneB.flatMap((l) => (l.attempts || []).filter((a) => a.invalid)).map((a) => a.invalid),
    errors: laneB.flatMap((l) => (l.attempts || []).filter((a) => a.error)).map((a) => a.error), msP50: pct(callMs, 0.5), msP90: pct(callMs, 0.9),
    spentMicroUsd: laneB.reduce((a, l) => a + (l.spentMicroUsd || 0), 0), perReportMicroUsd: laneB.length ? Math.round(laneB.reduce((a, l) => a + (l.spentMicroUsd || 0), 0) / laneB.length) : null },
  screened: stored.flatMap((r) => r.meta.screened.map((s) => s.reason)),
  // the memory rows exist (memory consent granted): no line may quote them, in any language
  interestQuoted: stored.flatMap((r) => Object.values(r.renders).flatMap((R) => R.lines.map((l) => l.text)))
    .filter((t) => PICK.some((p) => t.includes(p.interest))).length,
  // Lane B prompt / completion tokens per call (budget sizing; JOB_BUDGET comment)
  tokens: (() => { const u = laneB.flatMap((l) => (l.attempts || []).map((a) => a.usage).filter(Boolean)); const s = (k) => u.map((x) => x[k] ?? 0).sort((a, b) => a - b);
    return { calls: u.length, promptP50: pct(s("prompt_tokens"), 0.5), promptMax: s("prompt_tokens").at(-1) ?? null, completionP50: pct(s("completion_tokens"), 0.5), completionMax: s("completion_tokens").at(-1) ?? null }; })(),
  perCadenceMicroUsd: Object.fromEntries(["daily", "weekly"].map((c) => { const xs = stored.filter((r) => r.cadence === c).map((r) => r.meta.laneB.spentMicroUsd || 0); return [c, xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null]; })),
  shapes: Object.fromEntries([...new Set(stored.flatMap((r) => r.claims.map((c) => c.shapeId)))].map((s) => [s, stored.flatMap((r) => r.claims).filter((c) => c.shapeId === s).length])),
  job,
  ms: Date.now() - t0,
};
const examples = stored.filter((r) => r.cadence === "weekly").map((r) => ({ persona: kids.find((k) => k.child.id === r.child_id).persona, lang: r.meta.lang,
  lines: r.renders[r.meta.lang].lines.filter((l) => !l.voiceOnly).map((l) => l.text), voice: r.renders[r.meta.lang].voice.text }));
const dir = new URL("./results/", import.meta.url);
mkdirSync(dir, { recursive: true });
const file = new URL(`sim-week-${summary.at.slice(0, 10)}${NO_LLM ? "-nollm" : ""}.json`, dir);
writeFileSync(file, JSON.stringify({ summary, examples, checks, results }, null, 1));
console.log(JSON.stringify(summary, null, 1));
for (const e of examples) console.log(`\n── ${e.persona} (${e.lang}) ──\n${e.lines.join("\n")}\n[voice] ${e.voice}`);
// the seeded rows stay on the test branch for inspection; the next run sweeps guardians older than an hour
console.log(`\n[sim] wrote ${file.pathname}`);
