// Personalisation diff (BUILD-PLAN W2-C acceptance; personalisation audit §4.4). Two children who behave differently get
// visibly different, evidence-driven teaching — measured through the real API (text lane, the real classifier and reply
// model), no debug payload, so it runs the same on a local server and on production:
//
//   (c) guidance: a child who says "pata nahi" to everything on day 1 gets a worked or faded example on day 2 (a
//       worked_example move, or the faded step `fade:<i>` on the Question card) before practice; a child who is right
//       first time on day 1 attempts first on day 2 (no worked_example, no faded step before the first practice item).
//   (d) pace: "dheere" raises TurnResponse.pace.waitNudgeSec above the band default within 2 turns, and the endpoint
//       silence with it.
//   (b) history (the re-teach arm that repaired THIS child goes first next time; an arm that failed twice does not) is
//       proven offline in tests/w2c-director.test.mjs over comprehension/reteach.js selectReteach; on production the
//       misconception path needs a scripted mix-up and its resolution on day 2 (W1-C's reteach battery drives that
//       loop); this file reports it as NOT RUN rather than implying coverage.
//
// n ≥ 3 children per arm (--n), all under ONE @taxila.test account (deleted in a finally), day 2 by the account's test
// clock (/api/test/clock). Run:
//   NODE_USE_ENV_PROXY=1 TAXILA_BASE=<url> node evals/personalisation-diff.mjs [--n 3] [--topic c5-maths-ch01-t01]
// tests/prod/w2c-personalisation.mjs runs it in the production battery (run.mjs --wave 2).
import { readFileSync } from "node:fs";
import { withTestAccount, ok, warn, done } from "../tests/prod/lib.mjs";
import { replyFor, advanceClock } from "../tests/prod/_w1c.mjs";
import { normalizeKit } from "../server/content/kits.js";
import { blankOf } from "../server/director/fading.js";
import { BAND_DEFAULTS } from "../server/persona/adapter.js";

const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : dflt; };
const N = Math.max(1, Number(arg("n", 3)));
const TOPIC = arg("topic", "c5-maths-ch01-t01");
const CLASS = Number(TOPIC.match(/^c(\d)/)?.[1] ?? 5);

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
    log.push({ kind: r.move?.kind, phase: ui?.phase, itemId: ui?.ask?.itemId ?? null, pace: r.pace ?? null });
    if (!firstPractice && ui?.phase === "practice" && ui?.ask?.itemId) firstPractice = { at: log.length - 1, itemId: ui.ask.itemId };
    if (r.end || (stopAtPractice && firstPractice && !String(firstPractice.itemId).startsWith("fade:"))) break;
  }
  await api("POST", "/api/lesson/end", { lessonId: start.lessonId }).catch(() => {});
  return { log, firstPractice };
}

/** Did the lesson give a worked or faded example before (or as) its first practice item? */
const supported = (run) => run.log.some((x) => x.kind === "worked_example" || String(x.itemId ?? "").startsWith("fade:"));

export async function run() {
  const results = { c: { idk: [], right: [] }, d: null };
  await withTestAccount(async ({ api }) => {
    const kids = {};
    for (const arm of ["idk", "right"]) {
      kids[arm] = [];
      for (let i = 0; i < N; i++) {
        const { child } = await api("POST", "/api/children", { firstName: `${arm === "idk" ? "Asha" : "Ravi"}${"abc"[i] ?? i}`, classLevel: CLASS, languagePref: "hinglish", interests: ["cricket"] });
        await api("POST", "/api/consent", { childId: child.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
        await api("POST", "/api/parent/controls", { childId: child.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
        kids[arm].push(child);
      }
    }
    // (d) pace, on a child of its own (one lesson a day per child: the plan's "done" refuses a second lesson start)
    const { child: c0 } = await api("POST", "/api/children", { firstName: "Mira", classLevel: CLASS, languagePref: "hinglish", interests: ["cricket"] });
    await api("POST", "/api/consent", { childId: c0.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
    await api("POST", "/api/parent/controls", { childId: c0.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
    const paceRun = (async () => {
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
    // day 1: both arms, every child in parallel
    await Promise.all([paceRun, ...["idk", "right"].flatMap((arm) => kids[arm].map((c) => lesson(api, c.id, arm, { maxTurns: 14 })))]);
    await advanceClock(api, 1);
    // day 2: up to the first practice item
    const day2 = await Promise.all(["idk", "right"].flatMap((arm) => kids[arm].map(async (c) => ({ arm, run: await lesson(api, c.id, arm === "idk" ? "idk" : "right", { maxTurns: 10, stopAtPractice: true }) }))));
    for (const { arm, run } of day2) results.c[arm].push(run);
  }, { tag: "w2c", child: { classLevel: CLASS } });

  // ── verdicts ──
  const idkSupported = results.c.idk.filter(supported).length;
  ok(results.c.idk.length >= N && idkSupported === results.c.idk.length,
    `(c) all-"don't know" children get a worked or faded example on day 2: ${idkSupported}/${results.c.idk.length}`);
  const rightAttempt = results.c.right.filter((r) => !supported(r) && r.firstPractice && !String(r.firstPractice.itemId).startsWith("fade:")).length;
  ok(results.c.right.length >= N && rightAttempt === results.c.right.length,
    `(c) right-first-time children attempt first on day 2: ${rightAttempt}/${results.c.right.length}`);
  for (const [arm, runs] of Object.entries(results.c)) for (const r of runs) console.log(`  ${arm}: ${r.log.map((x) => `${x.kind}${x.itemId ? `[${String(x.itemId).split("-").pop()}]` : ""}`).join(" > ")}`);
  const band = CLASS <= 2 ? "B1" : CLASS <= 4 ? "B2" : CLASS <= 7 ? "B3" : "B4";
  const dflt = BAND_DEFAULTS[band].wait;
  const paces = results.d ?? [];
  const raised = paces.slice(1, 3).some((p) => p && p.waitNudgeSec > dflt);
  ok(raised, `(d) "dheere" raises waitNudgeSec above the ${band} default ${dflt} s within 2 turns: ${paces.map((p) => p?.waitNudgeSec ?? "-").join(" → ")}`);
  const endpointUp = paces.slice(1, 3).some((p) => p && paces[0] && p.endpointSilenceMs > paces[0].endpointSilenceMs);
  ok(endpointUp, `(d) …and the endpoint silence: ${paces.map((p) => p?.endpointSilenceMs ?? "-").join(" → ")} ms`);
  warn("(b) history: proven offline (tests/w2c-director.test.mjs, selectReteach child_history); a production two-day mix-up run is NOT RUN here");
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await run();
  done();
}
