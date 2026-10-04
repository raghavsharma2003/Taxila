// W1-C acceptance (BUILD-PLAN §3 W1-C #5; comprehension audit G9; personalisation 1): the re-teach loop on the academic
// record. A scripted child keeps answering wrong, so the engine re-teaches; read from the test account's OWN rows
// (TAXILA_DB_URL = the target's database) before the account is deleted:
//   - reteach_attempts rows are written, and two re-teaches on a skill use DIFFERENT arms (a failed arm is excluded):
//     a HARD check, and a lesson in which no skill is re-taught twice fails (it proves nothing);
//   - two failed arms on one skill lead to a prerequisite descent (or, with no weak prerequisite, a park), read from
//     the lesson's saved state (failedArms / lastArmBySkill / parked: comprehension/reteach.js noteReteach, through
//     seam-patches/w1c-state-reteach.patch);
//   - at the next lesson start (+1 day on the test clock) the attempts RESOLVE (outcome set), and a final one is
//     rewarded on the ROW — but a test account never pays the population arm_posteriors (session.js resolutionStmt).
import { withTestAccount, ok, warn, done } from "./lib.mjs";
import { driveLesson, advanceClock, targetDb } from "./_w1c.mjs";

const TOPIC = "c5-maths-ch02-t01";
const db = await targetDb();
if (!db) warn("TAXILA_DB_URL is not set: the lesson runs, but the re-teach rows cannot be read");

await withTestAccount(async ({ api, child }) => {
  const d0 = await driveLesson(api, child.id, { topicId: TOPIC, maxTurns: 30, wrong: () => true, explain: false });
  const moves = d0.turns.map((t) => t.move);
  console.log(`moves: ${moves.join(",")}`);
  const reteaches = moves.filter((m) => m === "reteach").length;
  ok(reteaches >= 1, `a child who keeps getting it wrong is re-taught (${reteaches} re-teach moves)`);
  if (!db) return;
  const rows = await db(`select id, skill_id, arm_id, rep_class, trigger, chosen_by, outcome, rewarded_at from reteach_attempts
    where child_id = $1 order by at, id`, [child.id]);
  console.log(`reteach_attempts: ${rows.map((r) => `${r.skill_id.split("-").pop()}:${r.arm_id}(${r.trigger}/${r.chosen_by})`).join(" ") || "none"}`);
  ok(rows.length >= 1, `reteach_attempts rows are written (${rows.length})`);
  const bySkill = {};
  for (const r of rows) (bySkill[r.skill_id] ??= []).push(r.arm_id);
  const repeated = Object.entries(bySkill).filter(([, arms]) => arms.length >= 2);
  ok(repeated.length > 0, `a skill is re-taught at least twice in the lesson (${Object.entries(bySkill).map(([k, a]) => `${k.split("-").pop()}×${a.length}`).join(" ") || "none"})`);
  ok(repeated.every(([, arms]) => new Set(arms).size === arms.length), `a re-taught skill gets a different arm each time (${repeated.map(([, a]) => a.join(" → ")).join("; ") || "none"})`);

  // two failed arms → prerequisite descent (or park): the decision is in the lesson's saved state
  const st = (await db("select state from lesson where id = $1", [d0.lessonId]))[0]?.state ?? {};
  const failed = st.failedArms ?? {}, last = st.lastArmBySkill ?? {}, parked = st.parked ?? [];
  console.log(`state: failedArms ${JSON.stringify(failed)} lastArmBySkill ${JSON.stringify(last)} parked ${JSON.stringify(parked)}`);
  const twoFailed = Object.keys(failed).filter((k) => (failed[k] ?? []).length >= 2);
  ok(twoFailed.length > 0, `two arms failed on one skill in the lesson (${Object.entries(failed).map(([k, a]) => `${k.split("-").pop()}:[${a.join(",")}]`).join(" ") || "no failedArms in the state: seam-patches/w1c-state-reteach.patch is not applied"})`);
  const descended = twoFailed.filter((k) => String(last[k] ?? "").startsWith("descent:") || parked.includes(k));
  ok(descended.length > 0, `…and the next decision on it is a prerequisite descent or a park (${twoFailed.map((k) => `${k.split("-").pop()} → ${parked.includes(k) ? "park" : last[k] ?? "none"}`).join("; ") || "none"})`);

  // population posteriors before the resolution (the test account must not move them)
  const arms = [...new Set(rows.map((r) => r.arm_id))];
  const nOf = async () => Object.fromEntries((await db("select arm_id || '@' || cluster as k, n from arm_posteriors where arm_id = any($1::text[])", [arms])).map((p) => [p.k, Number(p.n)]));
  const before = await nOf();
  // the next lesson start resolves them
  await advanceClock(api, 1);
  const d1 = await driveLesson(api, child.id, { topicId: TOPIC, maxTurns: 2 });
  ok(d1.start.status === 201, "+1 day: the next lesson starts (the start resolves the record)");
  await new Promise((r) => setTimeout(r, 3000));                           // resolutions are written off the start path
  const after = await db("select id, arm_id, outcome, reward, rewarded_at, cluster from reteach_attempts where child_id = $1 order by at, id", [child.id]);
  console.log(`resolved: ${after.map((r) => `${r.arm_id}=${r.outcome ?? "open"}${r.rewarded_at ? "/final" : ""}`).join(" ")}`);
  ok(after.length > 0 && after.every((r) => r.outcome), `every attempt resolves from the child's later answers (${after.filter((r) => r.outcome).length}/${after.length})`);
  const finals = after.filter((r) => r.rewarded_at);
  ok(finals.length > 0, `final attempts are rewarded on their own row (${finals.length} final)`);
  ok(finals.every((r) => r.cluster && r.reward != null), "final attempts carry their reward and cluster");
  const nowN = await nOf();
  const moved = Object.keys({ ...before, ...nowN }).filter((k) => (nowN[k] ?? 0) !== (before[k] ?? 0));
  ok(moved.length === 0, `a test account's resolutions never touch the population arm_posteriors (${moved.length ? `moved: ${moved.join(", ")}` : "unchanged"})`);
}, { tag: "w1c-reteach", child: { firstName: "Kabir", classLevel: 5, languagePref: "english", interests: ["cricket"] } });
done();
