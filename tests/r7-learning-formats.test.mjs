// Round 7 F, learning-how-this-child-learns: the population explain-format allocator (server/learner/formats.js) and its
// night outcome join. Pure, with a fake db for the join.
import { test } from "node:test";
import assert from "node:assert/strict";
import { FLOOR, FORMAT_WORDS, POINT_ID, allocateFormat, eligibleFormats, formatOutcome, joinFormatOutcomes } from "../server/learner/formats.js";
import { bannedHits } from "../server/reports/lexicon.js";

test("eligible: the kit's primary then secondary, deduplicated; F5 (chant) only for T1/T2", () => {
  assert.deepEqual(eligibleFormats({ topicType: "T3", formats: { primary: "F3", secondary: ["F1", "F5", "F3", "F9"] } }), ["F3", "F1"]);
  assert.deepEqual(eligibleFormats({ topicType: "T2", formats: { primary: "F5", secondary: ["F1"] } }), ["F5", "F1"]);
  assert.deepEqual(eligibleFormats({}), []);
});

test("allocate: seeded (replay-exact), one eligible format has propensity 1, propensities in (0, 1]", () => {
  const el = ["F3", "F1", "F4"];
  assert.deepEqual(allocateFormat(el, {}, { seed: "L1:s1" }), allocateFormat(el, {}, { seed: "L1:s1" }));
  assert.deepEqual(allocateFormat(["F2"], {}, { seed: "x" }), { format: "F2", propensity: 1, explored: false });
  assert.equal(allocateFormat([], {}, { seed: "x" }), null);
  for (let i = 0; i < 50; i++) {
    const r = allocateFormat(el, { F3: { alpha: 40, beta: 5 } }, { seed: `s${i}`, mc: 100 });
    assert.ok(r.propensity > 0 && r.propensity <= 1, JSON.stringify(r));
  }
});

test("the exploration floor keeps every eligible format in play, even against a strong winner", () => {
  const el = ["F3", "F1", "F4", "F6"], counts = {};
  const N = 3000;
  for (let i = 0; i < N; i++) { const f = allocateFormat(el, { F3: { alpha: 200, beta: 2 } }, { seed: `k${i}`, mc: 20 }).format; counts[f] = (counts[f] ?? 0) + 1; }
  for (const f of el) assert.ok((counts[f] ?? 0) / N >= (FLOOR / el.length) * 0.7, `${f}: ${counts[f]}`);
  assert.ok(counts.F3 / N > 0.7, "the strong winner still wins most of the time");
});

test("outcome: the first scored answer on the skill after the explain; NA, teach and helped rows do not count", () => {
  const d = { at: "2026-11-04T10:00:00.000Z", skillId: "s1" };
  const row = (min, o) => ({ occurred_at: `2026-11-04T10:0${min}:00.000Z`, skill_ids: ["s1"], cls: "item.open", outcome: 0, ...o });
  assert.equal(formatOutcome(d, [row(1, { outcome: 6 }), row(2, {})]), 1, "NA skipped, then a first-try right");
  assert.equal(formatOutcome(d, [row(1, { teach: true }), row(2, { outcome: 2 })]), 0, "right after hints is not first-try");
  assert.equal(formatOutcome(d, [row(1, { assisted: "parent" })]), null, "a helped answer is no outcome");
  assert.equal(formatOutcome(d, [{ ...row(1, {}), skill_ids: ["s2"] }]), null);
});

test("the night join: population increments per (format, topic type, band), no child id written; decisions without context skipped", async () => {
  const writes = [];
  const q = async (t, p) => {
    if (/from decision_record/.test(t)) return [
      { lesson_id: "L1", at: "2026-11-04T10:00:00Z", chosen: "F3", options: { skillId: "s1", topicType: "T3", band: "B3" } },
      { lesson_id: "L1", at: "2026-11-04T10:10:00Z", chosen: "F1", options: { skillId: "s2", topicType: "T3", band: "B3" } },
      { lesson_id: "L1", at: "2026-11-04T10:20:00Z", chosen: "F4", options: {} },
    ];
    if (/from kt_evidence/.test(t)) return [
      { session_id: "L1", occurred_at: "2026-11-04T10:05:00Z", skill_ids: ["s1"], cls: "item.open", outcome: 0 },
      { session_id: "L1", occurred_at: "2026-11-04T10:15:00Z", skill_ids: ["s2"], cls: "item.open", outcome: 3 },
    ];
    if (/insert into format_posterior/.test(t)) { writes.push({ t, p }); return []; }
    throw new Error(`unexpected ${t.slice(0, 60)}`);
  };
  const r = await joinFormatOutcomes("child-1", "2026-11-04", { q });
  assert.deepEqual(r, { decisions: 3, scored: 2, cells: 2 });
  assert.deepEqual(writes.map((w) => w.p).sort(), [["F1", "T3", "B3", 0, 1, 1], ["F3", "T3", "B3", 1, 0, 1]]);
  for (const w of writes) assert.ok(!w.p.includes("child-1") && !/child_id/.test(w.t), "population only");
  assert.equal(POINT_ID, "explain_format");
});

test("the parent words for formats are plain and pass the report lexicon", () => {
  for (const w of Object.values(FORMAT_WORDS)) assert.deepEqual(bannedHits(w), [], w);
});
