// W2-C production acceptance (BUILD-PLAN §4 W2-C #7, the Director halves of flows G10/G11): the practice purpose opens
// on its first set item with no greeting or hook, counts "n of `of`" (≤ 5) in ui.practice, never counts past the set, and
// closes with `done` ("That's the set"); every response's pace knobs ride along. Needs a met topic: one lesson first.
import { withTestAccount, ok, warn, done } from "./lib.mjs";
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
  warn("Ask (doubt) opening on the child's own question needs server/director/seam-patches/w2c-lesson-purpose-talk.patch in lesson.js (W2-E); not checked here");
}, { tag: "w2c" });
done();
