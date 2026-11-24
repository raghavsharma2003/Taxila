import { initLessonState, step } from "/home/user/Taxila/server/director/state.js";
import { classifyFast, targetFor } from "/home/user/Taxila/server/director/classify.js";
import { findItem } from "/home/user/Taxila/server/director/items.js";
import { kit, CTX, cls } from "/home/user/Taxila/tests/fixtures/kit.mjs";
const K = kit();
const turn = (r, c, extra = {}) => step(r.state, { event: "turn", kit: K, cls: c, now: (r.state.turn + 1) * 20_000, ...extra });
const said = (r, text) => { const target = targetFor(r.state, K, findItem(r.state, K, r.state.activeItemId)); const f = classifyFast({ target, childText: text, typed: false }); return f.result ?? { outcome: "no_evidence", confidence: 1, source: "model", flags: { ...f.flags, wantsToStop: !!f.request }, request: f.request }; };
let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, lang: "hinglish" }, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 });
while (r.state.phase !== "practice" || !r.move.itemId || r.move.itemId.startsWith("fade:")) r = turn(r, cls("no_evidence"));
console.log("practice:", r.move.kind, r.move.itemId, "| ask:", r.ui.ask?.itemId);
for (const t of ["kuch aur padhte hain", "nahi, kuch aur padhte hain na", "मुझे कुछ और पढ़ना है", "kuch aur padhte hain please"]) {
  r = turn(r, said(r, t), { childText: t });
  console.log(JSON.stringify(t), "->", r.move.kind, r.move.request ?? "", "| itemId", r.move.itemId ?? null, "| lastMove.itemId", r.state.lastMove?.itemId ?? null, "| ui.ask", r.ui.ask?.itemId ?? null, "| chips", (r.ui.chips ?? []).map((c) => c.id).join(","), "| shape:", String(r.move.shape).slice(0, 80));
}
