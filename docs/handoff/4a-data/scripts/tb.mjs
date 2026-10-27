import { initLessonState, step } from "/home/user/Taxila/server/director/state.js";
import { findItem } from "/home/user/Taxila/server/director/items.js";
import { classifyFast, targetFor } from "/home/user/Taxila/server/director/classify.js";
import { kit, CTX, cls } from "/home/user/Taxila/tests/fixtures/kit.mjs";
const K = kit(); const NE = cls("no_evidence");
const turn = (r, c, extra = {}) => step(r.state, { event: "turn", kit: K, cls: c, now: (r.state.turn + 1) * 20_000, ...extra });
let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 });
while (r.state.phase !== "practice" || !r.move.itemId || r.move.itemId.startsWith("fade:")) r = turn(r, NE);
for (const L of ["Bas, ab main thak gayi", "main thak gayi", "break chahiye"]) {
const f = classifyFast({ target: targetFor(r.state, K, findItem(r.state, K, r.state.activeItemId)), childText: L, typed: true });
const c = f.result ?? { outcome: "no_evidence", confidence: 1, source: "model", flags: f.flags, request: f.request };
const t = turn(r, c, { text: L });
console.log(L, JSON.stringify(c.request), t.move.kind, t.move.request, t.move.checkin, t.move.shape.slice(0, 90), JSON.stringify(t.ui.chips?.map(x=>x.id)), t.ui.handover);}
