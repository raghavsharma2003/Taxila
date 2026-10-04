// W1-C acceptance (BUILD-PLAN §3 W1-C #2, §7 "settle"; comprehension audit G2): the why-probe's blind verdict must be
// folded at the NEXT turn — settle rate ≥ 95% over lessons at child reply delays of 0, 1, 2 and 4 s (production was
// 0/5 at 0 s). Each lesson is a scripted text lesson whose child explains every "why"; the held verdicts are read from
// the account's own pending_grade rows before the account is deleted (TAXILA_DB_URL = the target's database):
//   settled = the verdict was in when its event folded (fallback_at null); not settled = the turn claimed the fallback.
// A verdict that lands late is still applied once as a correction (corrected_at): reported, never counted as settled.
// Size: W1C_SETTLE_LESSONS (default 8 = 2 per delay; the plan's full run is 30). One account per delay; its lessons run
// one per test-clock day. Run this file alone: the leftover-guardian count is global.
import { withTestAccount, ok, warn, done } from "./lib.mjs";
import { driveLesson, targetDb, advanceClock } from "./_w1c.mjs";

const N = Number(process.env.W1C_SETTLE_LESSONS ?? 8);
const DELAYS = [0, 1000, 2000, 4000];
const TOPICS = ["c5-maths-ch01-t01", "c5-maths-ch02-t01", "c5-maths-ch01-t02", "c5-maths-ch03-t01"];
const db = await targetDb();
if (!db) warn("TAXILA_DB_URL is not set: lessons run, but the settle rate cannot be read (pending_grade rows)");

const tally = Object.fromEntries(DELAYS.map((d) => [d, { held: 0, settled: 0, late: 0, lessons: 0, errors: 0 }]));
const perDelay = Math.max(1, Math.round(N / DELAYS.length));

for (const delay of DELAYS) {
  // one account per delay; its lessons run one after another (a child has one open lesson at a time)
  await withTestAccount(async ({ api, child }) => {
    const lessonIds = [];
    for (let i = 0; i < perDelay; i++) {
      try {
        if (i > 0) await advanceClock(api, 1);                               // one lesson a learning day ("done for today")
        const d = await driveLesson(api, child.id, { topicId: TOPICS[(i + DELAYS.indexOf(delay)) % TOPICS.length], maxTurns: 14, delayMs: delay, explain: true });
        lessonIds.push(d.lessonId);
        tally[delay].lessons++;
      } catch (e) { tally[delay].errors++; warn(`delay ${delay} ms lesson ${i + 1}: ${e.message}`); }
    }
    if (!db || !lessonIds.length) return;
    await new Promise((r) => setTimeout(r, 4000));                       // late verdicts land and are corrected
    const rows = await db(`select event_id, results is not null as graded, fallback_at is not null as fallback, corrected_at is not null as corrected
      from pending_grade where lesson_id = any($1::uuid[])`, [lessonIds]);
    for (const r of rows) {
      tally[delay].held++;
      if (!r.fallback && r.graded) tally[delay].settled++;
      if (r.fallback && r.corrected) tally[delay].late++;
    }
  }, { tag: `w1c-settle-${delay}`, child: { firstName: "Asha", classLevel: 5, languagePref: "english", interests: ["cricket"] } });
}

const all = Object.values(tally).reduce((a, t) => ({ held: a.held + t.held, settled: a.settled + t.settled, late: a.late + t.late }), { held: 0, settled: 0, late: 0 });
for (const d of DELAYS) {
  const t = tally[d];
  console.log(`delay ${d / 1000} s: ${t.lessons} lessons, held ${t.held}, settled ${t.settled}${t.held ? ` (${Math.round((100 * t.settled) / t.held)}%)` : ""}, late-corrected ${t.late}${t.errors ? `, ${t.errors} errors` : ""}`);
}
ok(Object.values(tally).every((t) => t.lessons > 0), `lessons ran at every delay (${DELAYS.map((d) => tally[d].lessons).join("/")})`);
if (db) {
  ok(all.held >= 4, `enough held why / teach-back events to measure (${all.held})`);
  const rate = all.held ? all.settled / all.held : 0;
  ok(rate >= 0.95, `settle rate ≥ 95%: ${all.settled}/${all.held} = ${(100 * rate).toFixed(1)}% (late-corrected ${all.late})`);
  const unsettled = all.held - all.settled;
  ok(all.late >= unsettled * 0.8 || unsettled === 0, `an unsettled verdict is applied as a late correction (${all.late}/${unsettled})`);
}
done();
