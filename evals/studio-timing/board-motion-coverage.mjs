// round 7 (C1 motion ops): how many board-first boards MOVE, class 4-7 kits; code only. M2: per subject AND per class, by
// template, any motion op (move, rotate, scale, follow, sweep, morph); `--json <file>` writes the per-topic rows (for
// before/after on the same kits).
const { initLessonState, step } = await import("../../server/director/state.js");
const { kitFromFile } = await import("../../server/content/kits.js");
const cur = await import("../../server/content/curriculum.js");
const { CTX, cls } = await import("../../tests/fixtures/kit.mjs");
const { whiteboardIntentOf } = await import("../../server/brain/propose.js");
const bf = await import("../../server/stagecraft/board-first.js");
const { certifyForTray } = await import("../../server/forge3/tray-gate.js");
const { findItem } = await import("../../server/director/items.js");
const { isMotionOp } = await import("../../shared/whiteboard.js");
const rows = [];
const topics = [4,5,6,7].flatMap((c) => ["maths","science","evs"].flatMap((s) => cur.topicSequence(c, s))).map((id) => cur.getTopic(id)).filter(Boolean);
const by = {}; let n = 0, hit = 0, err = 0; const moving = [];
for (const tp of topics) {
  let kit; try { kit = kitFromFile(tp); } catch { continue; }
  try {
    let r = step(initLessonState({ topicId: kit.topicId, kit, ctx: { ...CTX }, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
    for (let i = 0; i < 4 && !["explain", "worked_example", "reteach"].includes(r.move.kind); i++) r = step(r.state, { event: "turn", kit, cls: cls("no_evidence"), text: "haan", now: 20000 * (i + 1) });
    if (!["explain", "worked_example", "reteach"].includes(r.move.kind)) continue;
    const id = `bf-${kit.topicId}`;
    const ask = whiteboardIntentOf({ lessonId: id, turn: r.state.turn, beat: { id: "b", type: "explain" }, next: r.state, kit, item: r.state.lastMove?.itemId ? findItem(r.state, kit, r.state.lastMove.itemId) : null, line: { text: "" } });
    const p = bf.preselect(ask, { kit, certify: (script) => certifyForTray({ kind: "whiteboard", script }, { vp: "p412" }).ok });
    const [, c, subj] = String(kit.topicId).match(/^c(\d)-([a-z]+)/) ?? [null, "?", "?"];
    const key = `c${c}-${subj}`;
    by[key] ??= { n: 0, board: 0, moving: 0 }; by[key].n++; n++;
    const moves = !!p?.script?.ops?.some(isMotionOp);
    rows.push({ topicId: kit.topicId, template: p?.row?.template ?? p?.template ?? p?.script?.facts?.archetype ?? null, board: !!p?.row, moving: moves });
    if (p?.row) { by[key].board++; hit++; if (moves) { by[key].moving++; moving.push(kit.topicId); } }
  } catch (e) { err++; }
}
const tmpl = {}; for (const r of rows) if (r.board) { const t = r.template ?? "?"; tmpl[t] ??= { n: 0, moving: 0 }; tmpl[t].n++; if (r.moving) tmpl[t].moving++; }
const ji = process.argv.indexOf("--json"); if (ji > 0) (await import("node:fs")).writeFileSync(process.argv[ji + 1], JSON.stringify(rows));
console.log(JSON.stringify({ moving: moving.length, topics: topics.length, explainMoves: n, boardFirst: hit, rate: n ? +(hit / n).toFixed(3) : 0, err, by, tmpl }, null, 1));
