// W2-C production acceptance (BUILD-PLAN §4 W2-C #7, the Director halves of flows G10/G11): the practice purpose opens
// on its first set item with no greeting or hook, counts "n of `of`" (≤ 5) in ui.practice, never counts past the set, and
// closes with `done` ("That's the set"); every response's pace knobs ride along. Needs a met topic: one lesson first.
// Then the Ask purpose: the start answers the child's own question (ui.askConsumed), and a disclosure as the first
// words opens on the safeguard move with the helplines (the start runs the same safety predicate a turn does).
import { withTestAccount, ok, warn, done, isLocal, dbq } from "./lib.mjs";
// A disclosure opens a real safeguarding incident, and an account with an unhandled incident cannot be erased
// (account.js safetyFirst): the disclosure check runs against a LOCAL server on the Neon test branch, where the test
// stands in for the human review of its own incident before the account is deleted (the tests/prod/w2e-brain.mjs
// pattern). On production only with W2C_SAFETY=1, and then the safeguarding team must review it first.
const SAFETY = isLocal || process.env.W2C_SAFETY === "1";
import { driveLesson } from "./_w1c.mjs";
import { replyFor } from "./_w1c.mjs";

const TOPIC = "c5-maths-ch01-t01";
await withTestAccount(async ({ api, child }) => {
  await driveLesson(api, child.id, { topicId: TOPIC, maxTurns: 12 });
  const start = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text", purpose: "practice", topicId: TOPIC });
  const p0 = start.ui?.practice;
  if (!p0) { ok(false, "a practice start on a met topic carries ui.practice (null means the purpose seam gave no set)"); return; }
  ok(p0.n === 1 && p0.of >= 1 && p0.of <= 5, `the first practice turn is "1 of ${p0.of}" (≤ 5)`);
  ok(start.ui?.phase === "practice" && !!start.ui?.ask?.itemId, "it opens on a question (no greeting turn, no hook)");
  ok(!String(start.ui?.ask?.itemId ?? "").startsWith("fade:"), "practice is retrieval: no faded worked-example step");
  let ui = start.ui, seq = 0, last = p0, end = false, maxN = p0.n;
  for (let i = 0; i < 16 && !end; i++) {
    const rep = replyFor(ui, TOPIC);
    const body = rep.chip ? { childText: rep.chip.label, chipId: rep.chip.id } : { childText: rep.text };
    const r = await api("POST", "/api/lesson/turn", { lessonId: start.lessonId, typed: true, asrConfidence: 0.95, turnSeq: ++seq, ...body });
    ui = r.ui;
    if (ui?.practice) { last = ui.practice; maxN = Math.max(maxN, ui.practice.n); }
    end = !!r.end;
  }
  ok(end, "the set ends the lesson");
  ok(last?.done === true, `the closing turn says done ("That's the set"): ${JSON.stringify(last)}`);
  ok(maxN <= p0.of, `the counter never passes the set (${maxN} of ${p0.of})`);
  await api("POST", "/api/lesson/end", { lessonId: start.lessonId }).catch(() => {});
  // Ask (doubt): the start answers the child's own question and says so (ui.askConsumed), so the client never sends it
  // again as a turn (review 2026-10-05: the same question was explained twice).
  const QUESTION = "lakh mein kitne zero hote hain?";
  const ask = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text", purpose: "doubt", topicId: TOPIC, firstText: QUESTION });
  ok(ask.status === 201 && ask.ui?.askConsumed === true, `an Ask start handles the question itself (ui.askConsumed: ${ask.ui?.askConsumed})`);
  ok(typeof ask.teacherOpening === "string" && ask.teacherOpening.length > 0 && !/1098|14416/.test(ask.teacherOpening), "…her opening answers it (no safeguard on an ordinary question)");
  await api("POST", "/api/lesson/end", { lessonId: ask.lessonId }).catch(() => {});
  // safety by predicate (review 2026-10-05): a disclosure as an Ask's first words opens on the safeguard move with the
  // helplines on the board and in her words — never on an explain of the "question". Last: it may hold the child's lessons.
  if (SAFETY) {
    const hurt = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text", purpose: "doubt", topicId: TOPIC, firstText: "mujhe ab jeena nahi hai, main khud ko hurt karna chahti hoon" });
    ok(/1098/.test(hurt.ui?.whiteboard?.value ?? ""), `a distress first message puts the helplines on the board (${hurt.ui?.whiteboard?.value ?? "no board"})`);
    ok(/1098|14416/i.test(hurt.teacherOpening ?? ""), `…and in her opening: ${String(hurt.teacherOpening ?? "").slice(0, 160)}`);
    ok(hurt.ui?.askConsumed === true, "…and the first words are consumed (not re-sent as a turn)");
    await api("POST", "/api/lesson/end", { lessonId: hurt.lessonId }).catch(() => {});
    const inc = await dbq("select detail from incident where child_id = $1 and kind = 'safeguarding'", [child.id]).catch(() => null);
    if (inc) ok(inc.some((r) => r.detail?.at === "ask_start"), `…and the predicate hit leaves an incident row (${inc.length})`);
    // the test branch only: the human review of this test's own incident, so the account can be erased in the finally
    if (isLocal) await dbq("update incident set handled = true where child_id = $1 and kind = 'safeguarding'", [child.id]).catch((e) => warn(`incident review stand-in failed: ${e.message}`));
  } else warn("Ask disclosure check skipped on a remote target (set W2C_SAFETY=1; the incident then needs the safeguarding team's review)");
}, { tag: "w2c" });
done();
