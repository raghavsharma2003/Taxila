// round 7 (C1 studio-board-timing): board-first preselect coverage over class 4-7 kits (code only, no model call).
// node evals/studio-timing/board-first-coverage.mjs  → {topics, explainMoves, boardFirst, rate, by subject}
const { initLessonState, step } = await import("../../server/director/state.js");
const { kitFromFile } = await import("../../server/content/kits.js");
const cur = await import("../../server/content/curriculum.js");
const { CTX, cls } = await import("../../tests/fixtures/kit.mjs");
const { whiteboardIntentOf } = await import("../../server/brain/propose.js");
const bf = await import("../../server/stagecraft/board-first.js");
const { certifyForTray } = await import("../../server/forge3/tray-gate.js");
const { findItem } = await import("../../server/director/items.js");
const topics = [4,5,6,7].flatMap((c) => ["maths","science","evs"].flatMap((s) => cur.topicSequence(c, s))).map((id) => cur.getTopic(id)).filter(Boolean);
const by = {}; let n = 0, hit = 0, err = 0;
for (const tp of topics) {
  let kit; try { kit = kitFromFile(tp); } catch { continue; }
  try {
    let r = step(initLessonState({ topicId: kit.topicId, kit, ctx: { ...CTX }, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
    for (let i = 0; i < 4 && !["explain", "worked_example", "reteach"].includes(r.move.kind); i++) r = step(r.state, { event: "turn", kit, cls: cls("no_evidence"), text: "haan", now: 20000 * (i + 1) });
    if (!["explain", "worked_example", "reteach"].includes(r.move.kind)) continue;
    const id = `bf-${kit.topicId}`;
    const ask = whiteboardIntentOf({ lessonId: id, turn: r.state.turn, beat: { id: "b", type: "explain" }, next: r.state, kit, item: r.state.lastMove?.itemId ? findItem(r.state, kit, r.state.lastMove.itemId) : null, line: { text: "" } });
    const p = bf.preselect(ask, { kit, certify: (script) => certifyForTray({ kind: "whiteboard", script }, { vp: "p412" }).ok });
    const subj = (String(kit.topicId).match(/^c\d-([a-z]+)/) ?? [])[1] ?? "?";
    by[subj] ??= { n: 0, hit: 0 }; by[subj].n++; n++;
    if (p?.row) { by[subj].hit++; hit++; }
  } catch (e) { err++; }
}
console.log(JSON.stringify({ topics: topics.length, explainMoves: n, boardFirst: hit, rate: n ? +(hit / n).toFixed(3) : 0, err, by }));
