// Round 7 F (App's app-world-hangar-depth, PIPELINE §14 B2-4, K-P5): sealedAt / secureSince on /api/child/map (first time
// the map saw it, kept on a dip, null when unknown) and the synced Hangar equip (catalog-checked).
import { test } from "node:test";
import assert from "node:assert/strict";
import { applyMarks, marksOf, syncMarks } from "../server/learner/marks.js";
import { EQUIP_SLOTS, validateEquip } from "../server/learner/equip.js";
import { routes } from "../server/routes/child.js";

const sk = (id, state) => ({ skillId: id, state });
const mapOf = (sealed, states) => ({ subjects: [{ subject: "maths", chapters: [{ id: "c5-maths-ch02", sealed, topics: [{ id: "t", skills: states.map(([i, s]) => sk(i, s)) }] }] }],
  skills: states.map(([i, s]) => sk(i, s)) });

/** A fake db holding child_map_mark rows. */
function fakeDb() {
  const rows = []; let t = 0;
  return { rows, q: async (sql, p) => {
    if (/^select/.test(sql)) return rows.filter((r) => r.child_id === p[0]).map(({ child_id, ...r }) => r);
    const out = [];
    p[1].forEach((k, i) => { if (!rows.some((r) => r.child_id === p[0] && r.kind === k && r.ref_id === p[2][i])) {
      const r = { child_id: p[0], kind: k, ref_id: p[2][i], first_at: new Date(Date.UTC(2026, 10, 5, 10, t++)).toISOString(), backfilled: p[3][i] };
      rows.push(r); const { child_id, ...o } = r; out.push(o); } });
    return out;
  } };
}

test("marks: what is true now", () => {
  assert.deepEqual(marksOf(mapOf(true, [["a", "secure"], ["b", "got_it"]])), [{ kind: "chapter_sealed", ref: "c5-maths-ch02" }, { kind: "skill_secure", ref: "a" }]);
});

test("first read backfills (time unknown → null); a later seal gets its time; a dip and re-seal keeps the first time", async () => {
  const db = fakeDb();
  // first ever read: skill a already secure → backfilled, null
  let m = await syncMarks("k", mapOf(false, [["a", "secure"], ["b", "got_it"]]), { q: db.q });
  assert.equal(m.skills.find((x) => x.skillId === "a").secureSince, null);
  assert.equal(m.subjects[0].chapters[0].sealedAt, null);
  // the chapter seals and b becomes secure in a lesson: both get a time
  m = await syncMarks("k", mapOf(true, [["a", "secure"], ["b", "secure"]]), { q: db.q });
  const sealedAt = m.subjects[0].chapters[0].sealedAt;
  assert.ok(sealedAt && m.skills.find((x) => x.skillId === "b").secureSince);
  assert.equal(m.subjects[0].chapters[0].topics[0].skills.find((x) => x.skillId === "b").secureSince, m.skills.find((x) => x.skillId === "b").secureSince);
  // a dip: not sealed → sealedAt null; re-seal → the FIRST time again, no second mark
  m = await syncMarks("k", mapOf(false, [["a", "secure"], ["b", "got_it"]]), { q: db.q });
  assert.equal(m.subjects[0].chapters[0].sealedAt, null);
  m = await syncMarks("k", mapOf(true, [["a", "secure"], ["b", "secure"]]), { q: db.q });
  assert.equal(m.subjects[0].chapters[0].sealedAt, sealedAt);
  assert.equal(db.rows.filter((r) => r.kind === "chapter_sealed").length, 1);
});

test("no table → the map with null times, never a 500", async () => {
  const m = await syncMarks("k", mapOf(true, [["a", "secure"]]), { q: async () => { throw new Error("relation does not exist"); } });
  assert.equal(m.subjects[0].chapters[0].sealedAt, null);
  assert.equal(m.skills[0].secureSince, null);
  assert.equal(applyMarks(mapOf(false, [["a", "got_it"]]), []).skills[0].secureSince, null);
});

test("equip: catalog ids of the slot's kind; null clears; a slot with no catalog items takes a slug; routes registered", () => {
  const items = [{ id: "hull-thirds", kind: "hull" }, { id: "trail-green", kind: "trail" }];
  assert.deepEqual(validateEquip({ hull: "hull-thirds", trail: null, emote: "wave-1" }, items), { equipped: { hull: "hull-thirds", emote: "wave-1" } });
  assert.match(validateEquip({ hull: "trail-green" }, items).error, /not a hull/);
  assert.match(validateEquip({ wings: "x" }, items).error, /unknown slot/);
  assert.match(validateEquip({ emote: "Bad Id!" }, items).error, /bad item id/);
  assert.match(validateEquip([], items).error, /object/);
  assert.deepEqual(EQUIP_SLOTS, ["hull", "trail", "board", "rim", "emote"]);
  // the real catalog: its first item validates
  assert.ok(validateEquip({ hull: "hull-thirds" }).equipped);
  assert.equal(typeof routes["GET /api/child/equip"], "function");
  assert.equal(typeof routes["PUT /api/child/equip"], "function");
});
