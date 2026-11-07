const R = process.argv[2];
const { initLessonState, step } = await import(R + "/server/director/state.js");
const { kitFromFile } = await import(R + "/server/content/kits.js");
const { getTopic } = await import(R + "/server/content/curriculum.js");
const { CTX, cls } = await import(R + "/tests/fixtures/kit.mjs");
const { requestOf } = await import(R + "/server/director/requests.js");
const K = kitFromFile(getTopic("c9-maths-ch08-t02"));
const NE = cls("no_evidence");
const turn = (r, c, extra = {}) => step(r.state, { event: "turn", kit: K, cls: c, now: (r.state.turn + 1) * 20000, ...extra });
const say = (r, text) => { const q = requestOf(text); return turn(r, q ? { ...NE, source: "request", request: q } : NE, { text }); };
let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 9 }, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
for (let i = 0; i < 12 && !(r.state.phase === "practice" && r.move.itemId && !r.move.itemId.startsWith("fade:")); i++) r = turn(r, NE);
console.log("on the table:", r.move.kind, r.move.itemId);
const a = say(r, "pehle theory batao, order mein");
console.log("explain_first in practice →", a.move.kind, a.move.request, "item:", a.move.itemId ?? "-", "| next:", a.state.nextItemId, "| shape:", a.move.shape.slice(0, 110));
const a2 = turn(a, NE, { text: "achha" });
console.log("   then →", a2.move.kind, a2.move.itemId);
for (const t of ["chapter 1 se shuru karo", "start from chapter 8", "chapter 40 padhao"]) {
  const b = say(r, t);
  console.log(JSON.stringify(t), "→", b.move.kind, b.move.request, JSON.stringify(b.ui?.chips ?? []).slice(0, 160), "|", b.move.shape.slice(0, 90));
}
let t0 = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 9 }, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
t0 = turn(t0, NE);
console.log("teach plan before:", t0.state.teachPlan.slice(t0.state.teachIdx).join(","), "now", t0.move.kind);
const c = say(t0, "pehle samjhao");
console.log("explain_first in teach →", c.move.kind, c.move.request, "plan after:", c.state.teachPlan.slice(c.state.teachIdx).join(","));
