const tree = process.argv[2];
const { initLessonState, step } = await import(`${tree}/server/director/state.js`);
const { classifyFast, targetFor } = await import(`${tree}/server/director/classify.js`);
const { findItem } = await import(`${tree}/server/director/items.js`);
const { kit, CTX, cls } = await import(`${tree}/tests/fixtures/kit.mjs`);
const K = kit();
for (const seed of [5, 11, 23]) {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed, now: 0 }), { event: "start", kit: K, now: 0 });
  const turn = (c, t) => (r = step(r.state, { event: "turn", kit: K, cls: c, text: t, now: (r.state.turn + 1) * 20000 }));
  while (r.state.phase !== "practice" || !r.move.itemId || r.move.itemId.startsWith("fade:")) turn(cls("no_evidence"), "haan");
  const said = (t) => { const target = targetFor(r.state, K, findItem(r.state, K, r.state.activeItemId)); const f = classifyFast({ target, childText: t, typed: true }); return f.result ?? { ...cls("no_evidence"), flags: f.flags, request: f.request }; };
  const first = r.move.itemId; const seq = [];
  for (const [t, c] of [["pata nahi", null], ["70", cls("incorrect")], ["bhai kuch samajh nahi aaya haha", null], ["pata nahi", null], ["hmm", null]]) {
    turn(c ?? said(t), t); seq.push(`${r.move.kind}${r.move.itemId === first ? "*" : ""}`);
  }
  console.log(`seed ${seed}: ${seq.join(" ")}   (* = still the first card)`);
}
