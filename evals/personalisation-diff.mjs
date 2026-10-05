// Personalisation diff (BUILD-PLAN W2-C acceptance; personalisation audit §4.4). Two children who behave differently get
// visibly different, evidence-driven teaching — measured through the real API (text lane, the real classifier and reply
// model), no debug payload, so it runs the same on a local server and on production:
//
//   (c) guidance: a child who says "pata nahi" to everything on day 1 gets the WORKED example on day 2 (a worked_example
//       move that is not the first-step probe) and no first-step probe: their stuck items route them (state.js noteStuck,
//       fading.js guidanceLevel); a child who is right first time on day 1 attempts first on day 2 (no worked_example,
//       no faded step before the first practice item). Control arm (review 2026-10-05: the (c) test must discriminate):
//       a child who attends day 1 with neutral replies ("achha") and never gets stuck leaves a record that cannot tell,
//       so day 2 asks the first-step probe — the idk arm must NOT look like it.
//   (d) pace: "dheere" raises TurnResponse.pace.waitNudgeSec above the band default within 2 turns, and the endpoint
//       silence with it.
//   (b) history: day 1 a scripted mix-up (wrong answers) until the engine re-teaches, then right answers (the in-lesson
//       re-check is right → repaired_now); day 2 the same mix-up → the first re-teach uses the day-1 arm, chosen_by
//       child_history. Control: a child wrong all of day 1 (its arms failed) → day 2's first re-teach is not
//       child_history and never an arm that failed on day 1. Read from the account's own reteach_attempts rows, so it
//       needs TAXILA_DB_URL (the target's database: the Neon test branch locally); without it (b) is NOT RUN (a WARN).
//
// n ≥ 3 children per arm (--n), all under ONE @taxila.test account (deleted in a finally), day 2 by the account's test
// clock (/api/test/clock). Run:
//   NODE_USE_ENV_PROXY=1 TAXILA_BASE=<url> node evals/personalisation-diff.mjs [--n 3] [--topic c5-maths-ch01-t01]
// tests/prod/w2c-personalisation.mjs runs it in the production battery (run.mjs --wave 2).
import { readFileSync } from "node:fs";
import { withTestAccount, ok, warn, done } from "../tests/prod/lib.mjs";
import { replyFor, advanceClock, targetDb } from "../tests/prod/_w1c.mjs";
import { normalizeKit } from "../server/content/kits.js";
import { blankOf } from "../server/director/fading.js";
import { BAND_DEFAULTS } from "../server/persona/adapter.js";

const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : dflt; };
const N = Math.max(1, Number(arg("n", 3)));
const TOPIC = arg("topic", "c5-maths-ch01-t01");
const CLASS = Number(TOPIC.match(/^c(\d)/)?.[1] ?? 5);
/** --only b|c|d (comma list): run just those parts (iterating; a release run runs all). */
const ONLY = new Set(String(arg("only", "b,c,d")).split(","));

/** The kit topic as the server normalises it (for the faded step's key, computed by the same code). */
function kitOf(topicId) {
  const file = new URL(`../data/kits/c${topicId.match(/^c(\d)/)[1]}-${topicId.split("-")[1]}.json`, import.meta.url);
  const t = JSON.parse(readFileSync(file, "utf8")).topics.find((x) => x.topicId === topicId);
  return normalizeKit(t, { topicId, verified: true });
}
const KIT = kitOf(TOPIC);
const fadeAnswer = (itemId) => {
  const i = Number(String(itemId).slice(5));
  const we = KIT.workedExample;
  return we ? blankOf(we.steps[i], we.fadedVersion[i]) : null;
};

/** One reply: "idk" says pata nahi to everything (and keeps going past a break); "right" answers every item right. */
function reply(arm, ui) {
  const chips = ui?.chips ?? [];
  const goOn = chips.find((c) => c.id === "break:continue") ?? chips.find((c) => c.id === "break:easier") ?? chips.find((c) => c.id === "safe:continue");
  if (arm === "idk") return goOn ? { chipId: goOn.id, childText: goOn.label } : { childText: "pata nahi" };
  // neutral: attends, never says "don't know", never answers an item (an acknowledgement is unclear, not a miss)
  if (arm === "neutral") return goOn ? { chipId: goOn.id, childText: goOn.label } : { childText: "achha" };
  const id = ui?.ask?.itemId;
  if (id?.startsWith("fade:")) return { childText: fadeAnswer(id) ?? "pata nahi" };
  if (goOn && !id) return { chipId: goOn.id, childText: goOn.label };
  const r = replyFor(ui, TOPIC, { explain: true });
  return r.chip ? { chipId: r.chip.id, childText: r.chip.label } : { childText: r.text };
}

/** Drive one text lesson; returns the moves and what was on the Question card, up to the first practice item. */
async function lesson(api, childId, arm, { maxTurns = 12, stopAtPractice = false } = {}) {
  const start = await api("POST", "/api/lesson/start", { childId, mode: "text", topicId: TOPIC });
  const log = [{ kind: "start", phase: start.ui?.phase, itemId: start.ui?.ask?.itemId ?? null }];
  let ui = start.ui, seq = 0, firstPractice = null;
  for (let i = 0; i < maxTurns; i++) {
    const body = reply(arm, ui);
    const r = await api("POST", "/api/lesson/turn", { lessonId: start.lessonId, typed: true, asrConfidence: 0.95, turnSeq: ++seq, ...body });
    ui = r.ui;
    log.push({ kind: r.move?.kind, shape: r.move?.shape ?? "", phase: ui?.phase, itemId: ui?.ask?.itemId ?? null, pace: r.pace ?? null });
    if (!firstPractice && ui?.phase === "practice" && ui?.ask?.itemId) firstPractice = { at: log.length - 1, itemId: ui.ask.itemId };
    if (r.end || (stopAtPractice && firstPractice && !String(firstPractice.itemId).startsWith("fade:"))) break;
  }
  await api("POST", "/api/lesson/end", { lessonId: start.lessonId }).catch(() => {});
  return { log, firstPractice };
}

/** Did the lesson give a worked or faded example before (or as) its first practice item? */
const supported = (run) => run.log.some((x) => x.kind === "worked_example" || String(x.itemId ?? "").startsWith("fade:"));
/** The first-step probe ("what would you do first?"; director/shapes.js firstStep) — a worked_example move by kind. */
const FIRST_STEP = /what they would do first|how they would start/;
const probed = (run) => run.log.some((x) => x.kind === "worked_example" && FIRST_STEP.test(x.shape ?? ""));
const workedShown = (run) => run.log.some((x) => x.kind === "worked_example" && !FIRST_STEP.test(x.shape ?? ""));

// ── (b): the re-teach arm that repaired THIS child goes first next time ──
const B_TOPIC = "c5-maths-ch02-t01";   // the W1-C re-teach battery's topic: a wrong-answering child is re-taught on it
const B_KIT = kitOf(B_TOPIC);
/** One (b) lesson: wrong answers until the engine re-teaches; then right (`fixAfter`) or still wrong. */
async function reteachLesson(api, childId, { fixAfter, maxTurns = 30, stopAtReteach = false }) {
  const start = await api("POST", "/api/lesson/start", { childId, mode: "text", topicId: B_TOPIC });
  let ui = start.ui, seq = 0, retaught = false, after = 0;
  const moves = [];
  for (let i = 0; i < maxTurns; i++) {
    const id = ui?.ask?.itemId;
    const chips = ui?.chips ?? [];
    const goOn = chips.find((c) => c.id === "break:continue") ?? chips.find((c) => c.id === "break:easier");
    let body;
    if (goOn && !id) body = { chipId: goOn.id, childText: goOn.label };
    else if (id?.startsWith("fade:")) { const k = B_KIT.workedExample; const j = Number(id.slice(5)); body = { childText: blankOf(k.steps[j], k.fadedVersion[j]) ?? "pata nahi" }; }
    else { const r = replyFor(ui, B_TOPIC, { wrong: !(retaught && fixAfter), explain: true }); body = r.chip ? { chipId: r.chip.id, childText: r.chip.label } : { childText: r.text }; }
    const r = await api("POST", "/api/lesson/turn", { lessonId: start.lessonId, typed: true, asrConfidence: 0.95, turnSeq: ++seq, ...body });
    moves.push(r.move?.kind);
    ui = r.ui;
    if (r.move?.kind === "reteach") retaught = true;
    if (retaught) after++;
    if (r.end || (stopAtReteach && retaught) || (retaught && fixAfter && after >= 6)) break;
  }
  await api("POST", "/api/lesson/end", { lessonId: start.lessonId }).catch(() => {});
  return { lessonId: start.lessonId, moves, retaught };
}

export async function run() {
  const results = { c: { idk: [], right: [], neutral: [] }, d: null, b: { fix: [], ctl: [] } };
  const db = await targetDb();
  if (!db) warn("TAXILA_DB_URL is not set: (b) cannot read reteach_attempts and is NOT RUN");
  await withTestAccount(async ({ api }) => {
    const kids = {};
    const cArms = ONLY.has("c") ? ["idk", "right", "neutral"] : [];
    for (const arm of [...cArms, ...(db && ONLY.has("b") ? ["bfix", "bctl"] : [])]) {
      kids[arm] = [];
      for (let i = 0; i < N; i++) {
        const { child } = await api("POST", "/api/children", { firstName: `${{ idk: "Asha", right: "Ravi", neutral: "Neel", bfix: "Bina", bctl: "Chandu" }[arm]}${"abc"[i] ?? i}`,
          classLevel: arm.startsWith("b") ? 5 : CLASS, languagePref: arm.startsWith("b") ? "english" : "hinglish", interests: ["cricket"] });
        await api("POST", "/api/consent", { childId: child.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
        await api("POST", "/api/parent/controls", { childId: child.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
        kids[arm].push(child);
      }
    }
    // (d) pace, on a child of its own (one lesson a day per child: the plan's "done" refuses a second lesson start)
    const { child: c0 } = await api("POST", "/api/children", { firstName: "Mira", classLevel: CLASS, languagePref: "hinglish", interests: ["cricket"] });
    await api("POST", "/api/consent", { childId: c0.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
    await api("POST", "/api/parent/controls", { childId: c0.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
    const paceRun = !ONLY.has("d") ? Promise.resolve() : (async () => {
      const start = await api("POST", "/api/lesson/start", { childId: c0.id, mode: "text", topicId: TOPIC });
      const turns = [];
      let seq = 0;
      for (const childText of ["haan", "didi thoda dheere bolo please", "achha"]) {
        const r = await api("POST", "/api/lesson/turn", { lessonId: start.lessonId, typed: true, asrConfidence: 0.95, turnSeq: ++seq, childText });
        turns.push(r.pace ?? null);
        if (r.end) break;
      }
      await api("POST", "/api/lesson/end", { lessonId: start.lessonId }).catch(() => {});
      results.d = turns;
    })();
    // day 1: every arm, every child in parallel
    const bArms = db && ONLY.has("b") ? ["bfix", "bctl"] : [];
    await Promise.all([paceRun, ...cArms.flatMap((arm) => kids[arm].map((c) => lesson(api, c.id, arm, { maxTurns: 14 }))),
      ...bArms.flatMap((arm) => kids[arm].map((c) => reteachLesson(api, c.id, { fixAfter: arm === "bfix" })))]);
    const day1Rows = {};
    for (const arm of bArms) for (const c of kids[arm]) day1Rows[c.id] = await db("select id, skill_id, arm_id, rep_class, chosen_by from reteach_attempts where child_id = $1 order by at, id", [c.id]);
    await advanceClock(api, 1);
    // day 2: up to the first practice item ((c)); up to the first re-teach ((b))
    const day2 = await Promise.all(cArms.flatMap((arm) => kids[arm].map(async (c) => ({ arm, run: await lesson(api, c.id, arm === "right" ? "right" : arm, { maxTurns: 10, stopAtPractice: true }) }))));
    for (const { arm, run } of day2) results.c[arm].push(run);
    const day2b = {};
    await Promise.all(bArms.flatMap((arm) => kids[arm].map(async (c) => { day2b[c.id] = await reteachLesson(api, c.id, { fixAfter: false, stopAtReteach: true, maxTurns: 40 }); })));
    for (const arm of bArms) for (const c of kids[arm]) {
      await new Promise((r) => setTimeout(r, 500));
      const all = await db("select id, skill_id, arm_id, rep_class, chosen_by, outcome, rewarded_at from reteach_attempts where child_id = $1 order by at, id", [c.id]);
      const before = new Set(day1Rows[c.id].map((x) => String(x.id)));
      const d1 = all.filter((x) => before.has(String(x.id))), d2 = all.filter((x) => !before.has(String(x.id)));
      if (process.env.PD_DEBUG) {
        const st = (await db("select state->'lastReteach' lr, state->'changedApproach' ca, state->'history' h, state->'ctx'->'reteach'->'attempts' att, state->'turn' t from lesson where id = $1", [day2b[c.id]?.lessonId]))[0];
        console.log(`  debug ${arm} ${c.id}: all ${JSON.stringify(all)} · day-2 state ${JSON.stringify(st)}`);
      }
      results.b[arm === "bfix" ? "fix" : "ctl"].push({ day1: d1, day2first: d2[0] ?? null, day2moves: day2b[c.id]?.moves ?? [] });
    }
  }, { tag: "w2c", child: { classLevel: CLASS } });

  // ── verdicts ──
  if (ONLY.has("c")) {
  const idkWorked = results.c.idk.filter((r) => workedShown(r) && !probed(r)).length;
  ok(results.c.idk.length >= N && idkWorked === results.c.idk.length,
    `(c) all-"don't know" children get the worked example on day 2, with no first-step probe: ${idkWorked}/${results.c.idk.length}`);
  const neutralProbed = results.c.neutral.filter(probed).length;
  ok(results.c.neutral.length >= N && neutralProbed === results.c.neutral.length,
    `(c) control: neutral children (attended, never stuck) are asked the first-step probe on day 2 — the idk arm is routed differently: ${neutralProbed}/${results.c.neutral.length}`);
  const rightAttempt = results.c.right.filter((r) => !supported(r) && r.firstPractice && !String(r.firstPractice.itemId).startsWith("fade:")).length;
  ok(results.c.right.length >= N && rightAttempt === results.c.right.length,
    `(c) right-first-time children attempt first on day 2: ${rightAttempt}/${results.c.right.length}`);
  for (const [arm, runs] of Object.entries(results.c)) for (const r of runs) console.log(`  ${arm}: ${r.log.map((x) => `${x.kind}${x.itemId ? `[${String(x.itemId).split("-").pop()}]` : ""}`).join(" > ")}`);
  }
  if (ONLY.has("d")) {
  const band = CLASS <= 2 ? "B1" : CLASS <= 4 ? "B2" : CLASS <= 7 ? "B3" : "B4";
  const dflt = BAND_DEFAULTS[band].wait;
  const paces = results.d ?? [];
  const raised = paces.slice(1, 3).some((p) => p && p.waitNudgeSec > dflt);
  ok(raised, `(d) "dheere" raises waitNudgeSec above the ${band} default ${dflt} s within 2 turns: ${paces.map((p) => p?.waitNudgeSec ?? "-").join(" → ")}`);
  const endpointUp = paces.slice(1, 3).some((p) => p && paces[0] && p.endpointSilenceMs > paces[0].endpointSilenceMs);
  ok(endpointUp, `(d) …and the endpoint silence: ${paces.map((p) => p?.endpointSilenceMs ?? "-").join(" → ")} ms`);
  }
  if (db && ONLY.has("b")) {
    // RT9 and child_history are the same promise for the child: the arm that repaired THEIR mix-up comes first. A day-2
    // delayed check failed on the skill fires delayed_fail → a recap through that arm (selectReteach step 1); any other
    // trigger reaches step 4b (child_history). Either counts, with the SAME arm, and it must be the first re-teach.
    const FIRST = new Set(["child_history", "recap"]);
    const fixOk = results.b.fix.filter(({ day1, day2first }) => day2first && FIRST.has(day2first.chosen_by)
      && day1.some((x) => x.arm_id === day2first.arm_id && x.skill_id === day2first.skill_id && ["repaired_now", "resolved_next", "resolved_delayed"].includes(x.outcome ?? ""))).length;
    for (const [arm, rows] of Object.entries(results.b)) for (const { day1, day2first, day2moves } of rows)
      console.log(`  b.${arm}: day 1 ${day1.map((x) => `${x.arm_id}(${x.chosen_by})=${x.outcome ?? "open"}`).join(" ") || "no re-teach"} → day 2 first ${day2first ? `${day2first.arm_id}(${day2first.chosen_by})` : "none"} · day 2 moves ${day2moves.join(",")}`);
    ok(results.b.fix.length >= N && fixOk === results.b.fix.length,
      `(b) the arm that repaired THIS child's mix-up on day 1 is the first re-teach on day 2 (child_history or its recap): ${fixOk}/${results.b.fix.length}`);
    const ctlOk = results.b.ctl.filter(({ day1, day2first }) => day2first && !FIRST.has(day2first.chosen_by)
      && !day1.filter((x) => x.outcome === "failed" && x.skill_id === day2first.skill_id).slice(-2).some((x) => x.rep_class === day2first.rep_class)).length;
    ok(results.b.ctl.length >= N && ctlOk === results.b.ctl.length,
      `(b) control: after failed day-1 arms, day 2's first re-teach is not from the child's history and not a class that just failed: ${ctlOk}/${results.b.ctl.length}`);
  } else warn("(b) history: NOT RUN (no TAXILA_DB_URL); proven offline in tests/comprehension-reteach.test.mjs (resolveAttempts → selectReteach, end to end)");
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await run();
  done();
}
