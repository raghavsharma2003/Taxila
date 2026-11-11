const { initLessonState, step } = await import("/home/user/Taxila/server/director/state.js");
const { kitFromFile } = await import("/home/user/Taxila/server/content/kits.js");
const { getTopic } = await import("/home/user/Taxila/server/content/curriculum.js");
const { CTX, cls } = await import("/home/user/Taxila/tests/fixtures/kit.mjs");
const { requestOf } = await import("/home/user/Taxila/server/director/requests.js");
const kit = kitFromFile(getTopic("c5-maths-ch02-t01"));
let r = step(initLessonState({ topicId: kit.topicId, kit, ctx: { ...CTX, classLevel: 5, ageBand: "10-12" }, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
let now = 0;
for (const text of ["triangle ki picture dikhao", "picture dikhao", "haan", "picture dikhao"]) {
  now += 20000; const req = requestOf(text);
  r = step(r.state, { event: "turn", kit, cls: { ...cls("no_evidence"), ...(req ? { request: req } : {}) }, text, now });
  console.log(JSON.stringify(text), r.move.kind, r.move.request, JSON.stringify(r.move.see ?? null), JSON.stringify(r.state.offTopic ?? null));
}
