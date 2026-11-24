const { initLessonState, step } = await import("/home/user/Taxila/server/director/state.js");
const { kitFromFile } = await import("/home/user/Taxila/server/content/kits.js");
const { getTopic } = await import("/home/user/Taxila/server/content/curriculum.js");
const { classifyFast } = await import("/home/user/Taxila/server/director/classify.js");
const { CTX } = await import("/home/user/Taxila/tests/fixtures/kit.mjs");
const { answersRequest, isDrawing } = await import("/home/user/Taxila/server/studio/request.js");
const kit = kitFromFile(getTopic("c5-maths-ch02-t01"));
let r = step(initLessonState({ topicId: kit.topicId, kit, ctx: { ...CTX, classLevel: 5, ageBand: "10-12" }, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
let now = 0;
for (const text of ["Picture dikhao", "haan", "screen pe kuch bhi nahi dikh raha", "ok", "triangle ka drawing nahi dikhaya"]) {
  now += 20000;
  const fast = classifyFast({ target: { mode: r.state.target?.mode ?? "explain" }, childText: text, asrConfidence: 0.95 });
  const cls = fast ?? { outcome: "no_evidence", source: "none", flags: {} };
  r = step(r.state, { event: "turn", kit, cls, text, now });
  const sc = r.state.module?.params?.script;
  console.log(JSON.stringify(text), "| req", JSON.stringify(cls.request ?? null), "| move", r.move.kind, JSON.stringify(r.move.request ?? null), "| module", r.state.module?.engine ?? "-", sc ? `ops=${sc.ops.length} drawing=${isDrawing(sc)} answers(subj)=${answersRequest(sc, cls.request?.subject ? { kind: "picture", subject: cls.request.subject } : { kind: "picture" })}` : "");
}
