// Round 5 truth bar (server/brain/supersede.js), the pure half: which edits supersede, the state they restore, the
// statements that move the original's rows, and the live fold that notices rows moved on ANOTHER replica.
// The database half: tests/r5-edit-supersede-db.run.mjs (the TEST branch).
import { test } from "node:test";
import assert from "node:assert/strict";

import { supersedable, editMissed, restoredState, supersedeStmts, undoStmt, orphanCacheStmts, supersededBy } from "../server/brain/supersede.js";
import { loadLive, evictLive } from "../server/learner/live.js";

const state = (acks, last) => ({ acks: acks.map(([turnSeq, edited]) => ({ turnSeq, ...(edited ? { edited: true } : {}) })), lastAck: last == null ? undefined : { turnSeq: last, out: {} } });

test("an edit supersedes only the lesson's latest landed turn, and only once", () => {
  assert.equal(supersedable(state([[1], [2]], 2), 2), true, "the latest landed turn");
  assert.equal(supersedable(state([[1], [2]], 2), 1), false, "a later turn landed");
  assert.equal(editMissed(state([[1], [2]], 2), 1), true, "…which is a missed edit");
  assert.equal(editMissed(state([[1], [2]], 2), 2), false);
  assert.equal(supersedable(state([[1], [2, true]], 2), 2), false, "already an edit: a second edit is a replay");
  assert.equal(supersedable(state([[1]], 1), null), false, "no turnSeq, no edit");
  assert.equal(editMissed(state([[1]], 1), 7), false, "a turn that never landed is not missed (it is an edit in flight)");
});

test("the restored state keeps the turn-row counter growing (the original's rows stay in place)", () => {
  const prev = { turn: 4, seq: 9, activeItemId: "i2", supersede: 5, recent: [{ who: "teacher", text: "q" }] };
  const s = restoredState(prev, { turn: 5, seq: 11, activeItemId: "i3" });
  assert.deepEqual([s.turn, s.seq, s.activeItemId, "supersede" in s], [4, 11, "i2", false]);
  assert.equal(prev.seq, 9, "the snapshot itself is not mutated");
});

test("the statements: the original's evidence MOVES to the archives (one key), its rows are labelled, nothing is deleted outright", () => {
  const st = supersedeStmts({ childId: "c", lessonId: "L", turnSeq: 3, turn: 7, ids: { kt: ["L:5:0"], rows: [12] } });
  const by = supersededBy("L", 3);
  assert.equal(by, "L:3");
  for (const x of st) if (/delete from/.test(x.text)) assert.match(x.text, /with moved as \(delete from \w+ .* returning \*\)\s+insert into \w+_superseded select moved\.\*/s, "every delete is a move");
  assert.deepEqual(st.filter((x) => /insert into \w+_superseded/.test(x.text)).map((x) => x.text.match(/insert into (\w+)/)[1]), ["kt_evidence_superseded", "evidence_superseded", "brain_trace_superseded"]);
  assert.ok(st.some((x) => /update turn set meta = meta \|\| jsonb_build_object\('superseded'/.test(x.text)), "the transcript rows are labelled");
  assert.ok(st.some((x) => /update misconception_state m set evidence_count = \(select count\(\*\)/.test(x.text)), "the legacy counts are recounted, never decremented");
  const u = undoStmt({ lessonId: "L", turnSeq: 3, turn: 7, prev: { a: 1, supersede: 2 }, ids: { kt: [], rows: [] } });
  assert.deepEqual(u.params[3], { a: 1 }, "the snapshot never carries an in-flight edit mark");
  assert.match(u.text, /on conflict \(lesson_id\) do update/, "one row per lesson, overwritten");
});

test("cache rows only the superseded turn created are removed; the rest are rewritten by the diff", () => {
  const cached = { ledger: { skills: { a: {}, b: {} }, mis: { m1: {}, m2: {} } } };
  const after = { ledger: { skills: { a: {} }, mis: { m1: {} } } };
  const out = orphanCacheStmts("c", cached, after);
  assert.deepEqual(out.map((x) => `${x.text.match(/from (\w+)/)[1]}:${x.params[1]}`), ["kt_skill_state:b", "skill_state:b", "comp_facet_state:b", "kt_misconception:m2"]);
});

test("loadLive notices rows MOVED out of kt_evidence (a supersede on another replica): the cached fold is replayed from the log", async () => {
  const id = "00000000-0000-0000-0000-0000000005e5";
  const cache = new Map();
  let present = 0;
  const reads = [];
  const q = async (text, params) => {
    if (/count\(\*\)/.test(text)) return [{ n: present }];
    reads.push(params[1]);
    return [];
  };
  await loadLive({ id, class_level: 4 }, { q, cache });
  cache.set(id, { ...cache.get(id), maxSeq: 5, n: 3 });
  present = 3;
  await loadLive({ id, class_level: 4 }, { q, cache });
  assert.equal(reads.at(-1), 5, "all rows still there: only the new ones are read");
  present = 2; // one of the three rows moved to kt_evidence_superseded elsewhere
  await loadLive({ id, class_level: 4 }, { q, cache });
  assert.equal(reads.at(-1), 0, "a row went missing: full replay");
  evictLive(id, cache);
});
