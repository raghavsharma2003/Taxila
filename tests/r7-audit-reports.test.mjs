// r7 audit, parent notes: LEARN-11 (a month or term with no lessons failed the gate: its zero header carries no facts),
// LEARN-12 (a full week with the rest line was 6 body lines against 5: the letter was never stored), LEARN-13 (C1, a right
// answer on a later try with no hint, and solo answers counted as "needed a hint"), LEARN-18 (notes listed newest first by
// window, not by period text). Pure: hand-built facts, the real claim builder, renderer and gate.
import { test } from "node:test";
import assert from "node:assert/strict";
import { gateReport } from "../server/reports/gate.js";
import { buildClaims, isHinted, isSolvedAfterHint } from "../server/reports/claims.js";
import { renderLang } from "../server/reports/render.js";
import { assemble, laneAOrder } from "../server/reports/writer.js";
import { LANGS, CAPS } from "../server/reports/config.js";
import { listReports } from "../server/reports/store.js";
import { dayFacts, SKILLS } from "./fixtures/report-facts.mjs";

function assembled(facts) {
  const built = buildClaims(facts, {});
  const cadence = facts.window.cadence;
  const renders = {};
  for (const L of LANGS) {
    const R = renderLang({ cadence, ...built }, facts.child, L);
    const o = laneAOrder(R.lines, L, cadence);
    R.voice = { order: o.order, text: assemble(o.order, R.lines, L) };
    renders[L] = R;
  }
  return { built, body: { cadence, claims: built.claims, renders } };
}

test("LEARN-11: a month and a term with no lessons pass the gate", () => {
  for (const [cadence, period] of [["monthly", "2026-12"], ["term", "2027-T1"]]) {
    const f = dayFacts({ cadence, period, lessons: [] });
    f.events = [];
    const { built, body } = assembled(f);
    assert.match(built.claims[0].shapeId, /^header\.zero_(month|term)$/);
    assert.ok(gateReport(body, { firstName: "Riya" }), cadence);
  }
});

test("LEARN-12: a full week with the rest line stays within the weekly body cap and passes the gate", () => {
  const f = dayFacts({ cadence: "weekly", period: "2026-W41", extra: [
    { sessionId: "S2", at: "2026-10-06T11:45:00.000Z", skillIds: [SKILLS.C], cls: "item.open", outcome: 0 },
    { sessionId: "S2", at: "2026-10-06T11:46:00.000Z", skillIds: [SKILLS.C], cls: "item.open", outcome: 0 },
  ] });
  f.child.bedtime = "21:00";
  const late = (id, day, hhmm) => { const s = new Date(`${day}T${hhmm}:00+05:30`); return { id, startedAt: s.toISOString(), endedAt: new Date(s.getTime() + 20 * 60_000).toISOString() }; };
  f.rest = [late("x1", "2026-10-01", "21:30"), late("x2", "2026-10-03", "22:10"), late("x3", "2026-10-05", "21:05")];
  const { built, body } = assembled(f);
  assert.ok(built.claims.some((c) => c.section === "rest"), "the rest line shows");
  assert.ok(gateReport(body, { firstName: "Riya" }));
  const rows = built.claims.filter((c) => c.section === "row").length;
  assert.ok(rows <= CAPS.weekly.row - 1, `rows ${rows}: the rest line takes a row's place`);
});

test("LEARN-13: a later-try right answer with no hint, and a solo answer, are not 'needed a hint'", () => {
  const e = (cls, outcome) => ({ cls, outcome, skillIds: ["s"], teach: false, contaminated: false });
  assert.equal(isHinted(e("item.open", 1)), false, "C1: a later try, no hint");
  assert.equal(isHinted(e("solo", 1)), false);
  assert.equal(isHinted(e("item.open", 2)), true);
  assert.equal(isHinted(e("item.open", 4)), true);
  assert.equal(isSolvedAfterHint(e("item.open", 3)), true);
  assert.equal(isSolvedAfterHint(e("item.open", 4)), false);
});

test("LEARN-18: the notes list orders by the end of each note's window", async () => {
  let sql = "";
  await listReports({ q: async (t) => { sql = t; return []; } }, "c1");
  assert.match(sql, /order by window_to desc/);
  assert.doesNotMatch(sql, /order by period desc/);
});
