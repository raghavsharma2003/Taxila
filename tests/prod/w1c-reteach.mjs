// W1-C acceptance (BUILD-PLAN §3 W1-C #5; comprehension audit G9; personalisation 1): the re-teach loop on the academic
// record. A scripted child keeps answering wrong, so the engine re-teaches; read from the test account's OWN rows
// (TAXILA_DB_URL = the target's database) before the account is deleted:
//   - reteach_attempts rows are written, and two re-teaches on a skill use DIFFERENT arms (a failed arm is excluded);
//   - at the next lesson start (+1 day on the test clock) the attempts RESOLVE (outcome set), and a final one is rewarded.
import { withTestAccount, ok, warn, done } from "./lib.mjs";
import { driveLesson, advanceClock, targetDb } from "./_w1c.mjs";

const TOPIC = "c5-maths-ch02-t01";
const db = await targetDb();
if (!db) warn("TAXILA_DB_URL is not set: the lesson runs, but the re-teach rows cannot be read");

await withTestAccount(async ({ api, child }) => {
  const d0 = await driveLesson(api, child.id, { topicId: TOPIC, maxTurns: 24, wrong: () => true, explain: false });
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
  const repeated = Object.values(bySkill).filter((arms) => arms.length >= 2);
  if (repeated.length) ok(repeated.every((arms) => new Set(arms).size === arms.length), `a re-taught skill gets a different arm each time (${repeated.map((a) => a.join(" → ")).join("; ")})`);
  else warn("no skill was re-taught twice in this lesson: the different-arm and descent checks did not run");
  // (a prerequisite descent or a park is a decision, not an attempt row: the descent itself is pinned offline in
  // tests/comprehension-reteach.test.mjs, two failed arms → descent → park, through the same reteachSessionInputs)
  // the next lesson start resolves them
  await advanceClock(api, 1);
  const d1 = await driveLesson(api, child.id, { topicId: TOPIC, maxTurns: 2 });
  ok(d1.start.status === 201, "+1 day: the next lesson starts (the start resolves the record)");
  await new Promise((r) => setTimeout(r, 3000));                           // resolutions are written off the start path
  const after = await db("select id, arm_id, outcome, reward, rewarded_at, cluster from reteach_attempts where child_id = $1 order by at, id", [child.id]);
  console.log(`resolved: ${after.map((r) => `${r.arm_id}=${r.outcome ?? "open"}${r.rewarded_at ? "/final" : ""}`).join(" ")}`);
  ok(after.length > 0 && after.every((r) => r.outcome), `every attempt resolves from the child's later answers (${after.filter((r) => r.outcome).length}/${after.length})`);
  const finals = after.filter((r) => r.rewarded_at);
  ok(finals.length > 0 ? finals.every((r) => r.cluster && r.reward != null) : true, `final attempts carry their reward and cluster (${finals.length} final)`);
  if (finals.length) {
    const post = await db("select arm_id, n from arm_posteriors where arm_id = any($1::text[])", [finals.map((r) => r.arm_id)]);
    ok(post.length > 0, `arm_posteriors hold the population update (no child id): ${post.map((p) => `${p.arm_id}:n=${p.n}`).join(" ")}`);
  }
}, { tag: "w1c-reteach", child: { firstName: "Kabir", classLevel: 5, languagePref: "english", interests: ["cricket"] } });
done();
