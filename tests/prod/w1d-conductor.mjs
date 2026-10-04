// W1-D acceptance: the Conductor is live (BUILD-PLAN W1-D item 4). A test lesson on a SUNDAY (W1-C's test clock moves
// this account forward until its learning day is a Sunday), then the clock at +1 d and a lesson on the Monday, must
// yield: student_event / conductor_state / day_plan rows, a stored report.daily for the Sunday that the parent
// "reports" area lists and opens, and the Sunday's parent.letter for its ISO week. Needs a running worker on the
// target (taxila-worker on prod; locally `node server/worker.mjs` on the same database). forge.g2.nightly must
// complete as paused (no build is started for anyone).
// DB checks need TAXILA_DB_URL (the target's database); without it they are skipped with a WARN.
import { withTestAccount, runLesson, ok, warn, done, dbq, waitFor } from "./lib.mjs";
import { learningDay, isoWeek, addDays, weekday } from "../../server/conductor/clock.js";

const TZ = "Asia/Kolkata";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const REPORT_WAIT_MS = Number(process.env.W1D_REPORT_WAIT_MS || 240_000);

await withTestAccount(async ({ api, child, password }) => {
  const clock = await api("GET", "/api/test/clock", undefined, [200, 403, 404]);
  if (!ok(clock.status === 200 && clock.wired === true, `test clock is wired on the target (${clock.status}, wired=${clock.wired})`)) return;

  // 1. move this account's clock forward until its learning day is a Sunday (0-6 days; never backwards)
  const today = learningDay(new Date(clock.now), TZ);
  const k = (7 - weekday(today)) % 7;
  if (k) await api("POST", "/api/test/clock", { advanceDays: k });
  await sleep(clock.settleMs ?? 1500);
  const sunday = addDays(today, k), monday = addDays(sunday, 1), week = isoWeek(sunday);
  console.log(`clock: +${k} d → learning day ${sunday} (Sunday), week ${week}`);

  // 2. a short text lesson on the Sunday
  const l1 = await runLesson(api, child.id, { mode: "text", lines: ["haan ready hoon", "mujhe lagta hai answer 12 hai"] });
  ok(l1.start.status === 201 && l1.end?.status === 200, `Sunday lesson ran (start ${l1.start.ms} ms, ${l1.turns.length} turns, end ${l1.end?.ms} ms)`);

  // 3. the Conductor saw it: events in the log, an actor, a day plan (inline step on the web, else the worker ≤ ~10 s)
  const rows = await dbq("select type from student_event where child_id = $1 order by seq", [child.id]);
  if (rows === null) warn("TAXILA_DB_URL not set: student_event / conductor_state / day_plan checks skipped");
  else {
    const types = rows.map((r) => r.type);
    ok(["app.opened", "lesson.started", "lesson.ended"].every((t) => types.includes(t)), `student_event rows: ${types.join(", ")}`);
    const st = await waitFor(async () => (await dbq("select mode, cursor_seq from conductor_state where child_id = $1", [child.id]))?.[0], { maxMs: 60_000 });
    ok(!!st && Number(st.cursor_seq) >= types.length, `conductor_state folded the lesson (mode ${st?.mode}, cursor ${st?.cursor_seq}/${types.length})`);
    const plan = await waitFor(async () => (await dbq("select day, version from day_plan where child_id = $1 order by adopted_at desc limit 1", [child.id]))?.[0], { maxMs: 60_000 });
    ok(!!plan, `day_plan row (${plan ? `${String(plan.day).slice(0, 10)} v${plan.version}` : "none"})`);
  }

  // 4. the next day: +1 d and a lesson start on the Monday (an event on the new learning day folds the Sunday's night)
  await api("POST", "/api/test/clock", { advanceDays: 1 });
  await sleep(clock.settleMs ?? 1500);
  const l2 = await runLesson(api, child.id, { mode: "text", lines: ["haan"] });
  ok(l2.start.status === 201, `Monday lesson started (${monday})`);

  // the parent corner needs its PIN set (setting it unlocks this session)
  await api("POST", "/api/parent/pin", { pin: "2580", password });

  // 5. the night jobs ran: the parent "reports" area lists Sunday's daily note and the week's letter
  let listed = null;
  const got = await waitFor(async () => {
    listed = await api("GET", `/api/parent/reports?childId=${child.id}`);
    const d = listed.reports.find((r) => r.cadence === "daily" && r.period === sunday);
    const w = listed.reports.find((r) => r.cadence === "weekly" && r.period === week);
    return d && w ? { d, w } : null;
  }, { everyMs: 5000, maxMs: REPORT_WAIT_MS });
  ok(!!got?.d, `report.daily for ${sunday} is listed in the parent reports area (${listed?.reports?.map((r) => `${r.cadence}:${r.period}`).join(", ") || "none"})`);
  ok(!!got?.w, `parent.letter for ${week} (a Sunday) is listed`);
  if (got?.d) {
    const one = await api("GET", `/api/parent/report?childId=${child.id}&id=${got.d.id}`, undefined, [200, 404]);
    ok(one.status === 200, `the daily note opens (${one.status})`);
  }
  const jobs = await dbq("select kind, status, result_ref from job where child_id = $1 order by id", [child.id]);
  if (jobs) {
    console.log(`jobs: ${jobs.map((j) => `${j.kind}=${j.status}${j.result_ref ? `(${String(j.result_ref).slice(0, 40)})` : ""}`).join(", ")}`);
    const g2 = jobs.filter((j) => j.kind === "forge.g2.nightly");
    ok(g2.every((j) => j.status !== "done" || /^paused/.test(j.result_ref || "")), `forge.g2.nightly stays paused (${g2.map((j) => `${j.status}:${j.result_ref}`).join(", ") || "none enqueued"})`);
  }
}, { tag: "w1d-cond" });
done();
