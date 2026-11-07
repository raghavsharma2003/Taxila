import { initLessonState, step } from "/home/user/Taxila/server/director/state.js";
import { kit, CTX, cls } from "/home/user/Taxila/tests/fixtures/kit.mjs";
const K = kit(); const NE = cls("no_evidence");
for (const pre of [1, 2, 3, 5, 8]) {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 });
  const turn = (c, t) => (r = step(r.state, { event: "turn", kit: K, cls: c, now: (r.state.turn + 1) * 20000, text: t }));
  for (let i = 0; i < pre; i++) turn(r.move.itemId ? cls("correct") : NE, "ok");
  const share = { outcome: "no_evidence", confidence: 1, source: "model", flags: NE.flags, request: { type: "uptake", kind: "personal_share", topic: "cousin ki shaadi next week", whole: true } };
  turn(share, "meri cousin ki shaadi hai next week");
  const phase0 = r.state.phase; let n = 0, back = 0; const kinds = [];
  for (; n < 14 && !back; n++) { turn(r.move.itemId ? cls("correct") : NE, "x"); kinds.push(r.move.kind + (r.move.itemId ? "*" : "")); if (/shaadi/.test(r.move.must ?? "") || /shaadi/.test(r.move.shape ?? "")) back = n + 1; }
  console.log(`pre ${pre} phase ${phase0} back after ${back || "never"} : ${kinds.join(" ")}`);
}
