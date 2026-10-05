// Teacher Brain kernel gates (TEACHER-BRAIN §15.1; BUILD-PLAN W2-E acceptance): G-KERNEL-PURE, G-KERNEL-ORDER, G-BUDGET,
// G-LAT, G-AUTHORITY, plus the closed reason vocabulary and the trace rows (codes and digests only, never words).
import { test } from "node:test";
import assert from "node:assert/strict";
import { arbitrate, proposal, AUTHORITY, rankOf, priorityOf, DEFAULT_BUDGETS } from "../server/brain/kernel.js";
import { relationalProposals, relationalEffects } from "../server/brain/relational-adapter.js";
import { directorProposalOf, studioProposalsOf, whiteboardAskOf, turnStudioOf, proposalsOf } from "../server/brain/propose.js";
import { isReason, reason, knownReasons, FAMILIES } from "../server/brain/reasons.js";
import { brainTraceStmt, decisionRecordStmt, inputsHashOf, reteachDecisionOf } from "../server/brain/trace.js";
import { directorProposal } from "../server/director/proposal.js";

// a seeded generator (the tests are reproducible; the kernel itself never draws)
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) | 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = (r, xs) => xs[Math.floor(r() * xs.length)];
const MOVES = ["greet", "retrieval", "hook", "explain", "worked_example", "probe", "hint", "reteach", "practice", "teachback", "wrap", "repair", "safeguard", "break"];
const OVERLAYS = ["WARM_BOUNDARY", "CHECK_IN", "OWN_SLIP", "AFFIRM_RECHECK", "SHARE_UPTAKE", "NOTICE", "CHRISTEN", "HOME_TEACH_BACK", "POINT_OUT", "LAUGH_WITH"];

/** A random turn's proposals, as the turn builds them (the Director's real proposal shape, W2-C proposal.js). */
function randomTurn(r, { release = false } = {}) {
  const kind = pick(r, MOVES);
  const ui = { chips: r() < 0.3 ? ["a", "b"] : undefined, tray: r() < 0.3 ? "module" : r() < 0.1 ? "studio" : "none" };
  const dir = directorProposalOf({ move: { kind }, proposal: directorProposal({ kind, ...(kind === "probe" ? { probe: "why" } : {}) }, { stopping: kind === "wrap" && r() < 0.3, ui }) });
  const d = {
    affect: { display: "neutral_warm", intensity: 1, cause: "none", turn: 1 }, canRemember: false, ui: { teacherAffect: { display: "neutral_warm", intensity: 1 } }, notes: [], events: [],
    ...(release ? { floor: "RELEASE" } : r() < 0.4 ? { moveOverlay: { kind: pick(r, OVERLAYS), shapeId: "s", priority: 1 } } : {}),
    ...(r() < 0.2 ? { callbackId: "cb1" } : {}), ...(r() < 0.1 ? { floorFix: ["romance"] } : {}),
  };
  const studio = studioProposalsOf({ propose: { ...(r() < 0.5 ? { reveal: "i1" } : {}), ...(r() < 0.2 ? { retire: "i0" } : {}), ...(r() < 0.1 ? { highlight: "h" } : {}) } });
  const wb = whiteboardAskOf({ beat: r() < 0.5 ? { id: "b1-explain", type: "explain" } : { id: "b2-practice_set", type: "practice_set" }, lane: pick(r, ["text", "cascade", "voice"]), late: false, strained: r() < 0.2 }).proposals;
  const ps = [dir, ...relationalProposals(d), ...studio, ...wb, proposal("vibe", "knobs", AUTHORITY.vibe)];
  // shuffle: the kernel's answer must not depend on the order proposers ran in
  for (let i = ps.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ps[i], ps[j]] = [ps[j], ps[i]]; }
  return ps;
}

test("ranks: priority = 100 − 10 × rank + urgency; the Director's proposal ranks read back exactly (W2-C proposal.js)", () => {
  for (let rank = 0; rank <= 12; rank++) for (const u of [0, 5, 9]) assert.equal(rankOf({ priority: priorityOf(rank, u) }), rank);
  assert.equal(rankOf(directorProposal({ kind: "safeguard" })), AUTHORITY.safety);
  assert.equal(rankOf(directorProposal({ kind: "wrap" }, { stopping: true })), AUTHORITY.release);
  assert.equal(rankOf(directorProposal({ kind: "practice" })), AUTHORITY.director);
  assert.equal(rankOf(directorProposal({ kind: "probe" })), AUTHORITY.comprehension);
});

test("G-KERNEL-PURE: equal inputs give a byte-equal plan; a planted clock or random call is caught", () => {
  const r = rng(7);
  const realNow = Date.now, realRandom = Math.random;
  try {
    Date.now = () => { throw new Error("kernel read the clock"); };
    Math.random = () => { throw new Error("kernel drew a random number"); };
    for (let i = 0; i < 500; i++) {
      const ps = randomTurn(r);
      const a = JSON.stringify(arbitrate(structuredClone(ps)));
      const b = JSON.stringify(arbitrate(structuredClone(ps)));
      assert.equal(a, b);
      // order-independence: the same proposals in reverse give the same accepted set
      assert.deepEqual(arbitrate([...structuredClone(ps)].reverse()).accepted.map((p) => `${p.source}:${p.kind}`).sort(), JSON.parse(a).accepted.map((p) => `${p.source}:${p.kind}`).sort());
    }
    // negative control: an impure wrapper IS caught by the same detector
    const impure = (ps) => ({ ...arbitrate(ps), at: Date.now() });
    assert.throws(() => impure(randomTurn(r)), /clock/);
  } finally { Date.now = realNow; Math.random = realRandom; }
});

test("G-KERNEL-ORDER: no accepted proposal sits under a higher accepted proposal's veto (5k generated turns)", () => {
  const r = rng(11);
  for (let i = 0; i < 5000; i++) {
    const out = arbitrate(randomTurn(r));
    for (const p of out.accepted) {
      for (const v of out.accepted) {
        if (v === p || rankOf(v) >= rankOf(p) || !v.vetoes?.length) continue;
        assert.ok(!v.vetoes.some((x) => x === "*" || x === p.source || x === `kind:${p.kind}`), `${p.source}:${p.kind} accepted under ${v.source}'s veto`);
      }
    }
    // a safeguard move freezes every proposal below it
    if (out.move?.source === "safety") assert.deepEqual(out.accepted.filter((p) => p.source !== "safety").map((p) => p.kind), []);
  }
});

test("G-BUDGET: 10k turns — exactly one move, ≤ 1 new thing on screen, never a reveal on a closing move, no callback in a correction", () => {
  const r = rng(13);
  for (let i = 0; i < 10_000; i++) {
    const out = arbitrate(randomTurn(r));
    assert.equal(out.accepted.filter((p) => p.kind === "move").length, 1, "one move per turn");
    const attention = out.accepted.reduce((a, p) => a + (p.costs?.attention ?? 0), 0);
    assert.ok(attention <= DEFAULT_BUDGETS.attention, `attention ${attention} ≤ 1`);
    const kind = out.move.payload?.move?.kind;
    if (["wrap", "safeguard", "break"].includes(kind)) assert.ok(!out.accepted.some((p) => p.kind === "reveal" || p.kind === "ask_whiteboard"), `no reveal on ${kind}`);
    if (["reteach", "hint", "repair"].includes(kind)) assert.ok(!out.accepted.some((p) => p.kind === "callback"), "no callback in a correction");
    if (kind === "reteach") assert.ok(!out.accepted.some((p) => p.kind === "humour"), "no humour in a re-teach");
  }
});

test("G-AUTHORITY: a child's goodbye beside any pedagogy, plan or Studio proposal → RELEASE wins in 100% of 10k turns (safety alone outranks it)", () => {
  const r = rng(17);
  let releases = 0, safetyWins = 0;
  for (let i = 0; i < 10_000; i++) {
    const out = arbitrate(randomTurn(r, { release: true }));
    if (out.move.source === "safety") { safetyWins += 1; continue; } // a disclosure in the same turn: crisis outranks the bond (AT-B6)
    assert.equal(out.move.source, "relational", "the release is the turn's move");
    assert.deepEqual(out.accepted.filter((p) => p.source === "studio" || p.source === "director" || p.source === "comprehension").map((p) => p.kind), [], "nothing below rides on a goodbye");
    assert.equal(relationalEffects(out).release, true);
    releases += 1;
  }
  assert.ok(releases > 9000 && safetyWins > 0, `${releases} releases, ${safetyWins} safety`);
});

test("G-AUTHORITY: a teacher-owned repair (OWN_SLIP / AFFIRM_RECHECK) is accepted and precedes the Director's next item", () => {
  for (const kind of ["OWN_SLIP", "AFFIRM_RECHECK"]) {
    for (const move of ["practice", "probe", "retrieval", "explain"]) {
      const ps = [directorProposalOf({ move: { kind: move }, proposal: directorProposal({ kind: move }) }),
        ...relationalProposals({ moveOverlay: { kind, shapeId: "own.1", priority: 1 }, affect: { display: "sheepish_own", intensity: 1, cause: "teacher_owned_verified", turn: 3 } })];
      const out = arbitrate(ps.reverse());
      const iRepair = out.accepted.findIndex((p) => p.kind === "overlay");
      const iMove = out.accepted.findIndex((p) => p.kind === "move");
      assert.ok(iRepair >= 0 && iMove >= 0 && iRepair < iMove, `${kind} before ${move}`);
      assert.equal(relationalEffects(out).overlay?.kind, kind);
    }
  }
});

test("relational floor: SAFETY freezes everything below; floorFix is carried; rapport never rides a correction", () => {
  const out = arbitrate([directorProposalOf({ move: { kind: "practice" }, proposal: directorProposal({ kind: "practice" }) }),
    ...relationalProposals({ floor: "SAFETY", floorFix: ["romance"], callbackId: "c", affect: { display: "calm_steady", intensity: 1, cause: "safety", turn: 2 } }),
    ...studioProposalsOf({ propose: { reveal: "x" } })]);
  const fx = relationalEffects(out);
  assert.equal(fx.safety, true);
  assert.deepEqual(fx.floorFix, ["romance"]);
  assert.ok(!out.accepted.some((p) => p.kind === "reveal" || p.kind === "callback"));
  const corr = arbitrate([directorProposalOf({ move: { kind: "hint" }, proposal: directorProposal({ kind: "hint" }) }), ...relationalProposals({ callbackId: "c", moveOverlay: { kind: "NOTICE", shapeId: "n" } })]);
  assert.deepEqual(corr.rejected.map((x) => x.why).sort(), ["conflict.callback_in_correction", "conflict.callback_in_correction"]);
});

test("Studio: a reveal needs the attention slot (rejected beside a new module or chips); the whiteboard ask follows the same rule", () => {
  const busy = arbitrate([directorProposalOf({ move: { kind: "explain" }, proposal: directorProposal({ kind: "explain" }, { ui: { tray: "module" } }) }), ...studioProposalsOf({ propose: { reveal: "i1", retire: "i0" } }),
    ...whiteboardAskOf({ beat: { id: "b2-explain", type: "explain" }, lane: "cascade" }).proposals]);
  assert.deepEqual(turnStudioOf(busy), { retire: "i0" }, "the retire (no attention) goes; the reveal waits");
  assert.ok(busy.rejected.some((x) => x.p.kind === "reveal" && x.why === "over_budget.attention"));
  const free = arbitrate([directorProposalOf({ move: { kind: "explain" }, proposal: directorProposal({ kind: "explain" }, { ui: { tray: "none" } }) }),
    ...whiteboardAskOf({ beat: { id: "b2-explain", type: "explain" }, lane: "cascade" }).proposals]);
  assert.ok(free.accepted.some((p) => p.kind === "ask_whiteboard"));
  assert.equal(whiteboardAskOf({ beat: { id: "b", type: "explain" }, lane: "voice" }).declined, "studio_rejected.voice_lane");
  assert.equal(whiteboardAskOf({ beat: { id: "b", type: "explain" }, lane: "text", strained: true }).declined, "studio_rejected.strained");
  assert.deepEqual(whiteboardAskOf({ beat: { id: "b", type: "practice_set" }, lane: "text" }).proposals, [], "only explanation beats ask");
});

test("G-LAT: kernel p99 ≤ 10 ms over 10k simulated turns", () => {
  const r = rng(19);
  const turns = Array.from({ length: 10_000 }, () => randomTurn(r));
  const ms = turns.map((ps) => { const t = performance.now(); arbitrate(ps); return performance.now() - t; }).sort((a, b) => a - b);
  const p99 = ms[Math.floor(ms.length * 0.99)];
  assert.ok(p99 <= 10, `p99 ${p99.toFixed(3)} ms`);
});

test("reasons: a closed vocabulary — every code the proposers emit is known; a typo throws", () => {
  const r = rng(23);
  for (let i = 0; i < 2000; i++) {
    const out = arbitrate(randomTurn(r));
    for (const p of [...out.accepted, ...out.rejected.map((x) => x.p)]) for (const c of p.reason ?? []) assert.ok(isReason(c), c);
    for (const x of out.rejected) assert.ok(isReason(x.why), x.why);
  }
  assert.throws(() => reason("move", "dance"));
  assert.deepEqual(knownReasons(["move.hook", "nonsense", "move.hook", "beat.explain"]), ["move.hook", "beat.explain"]);
  assert.ok(Object.keys(FAMILIES).length > 10);
});

test("trace rows: codes and digests only (no words), one statement per turn, idempotent per (lesson, turn)", () => {
  const ps = proposalsOf({ r: { move: { kind: "practice" }, proposal: directorProposal({ kind: "practice" }) }, relational: null, studioView: null, whiteboard: [], vibe: { waitNudgeSec: 4, endpointSilenceMs: 700 } });
  const arb = arbitrate(ps);
  const childWords = "mera naam Kabir hai aur main Delhi mein rehta hoon";
  const st = brainTraceStmt({ lessonId: "L", turn: 3, lane: "text", move: "practice", beat: "practice_set", inputsHash: inputsHashOf({ prev: { turn: 2 }, cls: { outcome: "correct", source: "exact", flags: { dontKnow: false } }, move: { kind: "practice" }, lane: "text" }),
    proposals: ps, arb, reasons: ["lane.text", "made-up"], serverMs: 12.6, kernelUs: 40, legalMode: "M1" });
  assert.match(st.text, /insert into brain_trace/);
  assert.match(st.text, /on conflict \(lesson_id, turn\) do nothing/);
  const flat = JSON.stringify(st.params);
  assert.ok(!flat.includes("Kabir") && !flat.includes(childWords));
  assert.ok(!st.params[9].includes("made-up"), "unknown codes never reach a row");
  assert.equal(st.params[10], 13);
  const d = decisionRecordStmt({ lessonId: "L", turn: 3, pointId: "RT-ARM", options: ["a", "b"], chosen: "a", chosenBy: "thompson", randomised: true, legalMode: "M1" });
  assert.match(d.text, /insert into decision_record/);
  assert.equal(reteachDecisionOf({ turn: 4, lastReteach: { turn: 4, move: "reteach", armId: "arm1", chosenBy: "kit_primary", skillId: "s" } }, { lessonId: "L", legalMode: "M1" }).params[6], false);
  assert.equal(reteachDecisionOf({ turn: 5, lastReteach: { turn: 4, move: "reteach", armId: "arm1" } }, { lessonId: "L", legalMode: "M1" }), null);
});

test("the whiteboard ask (W2-E fixer): only on moves that explain, never over an interactive piece or a ready reveal; it REPLACES the template rung", () => {
  const ex = { id: "b2-explain", type: "explain" };
  for (const kind of ["repair", "hint", "hold", "show_module"]) {
    const w = whiteboardAskOf({ beat: ex, lane: "text", move: { kind } });
    assert.deepEqual(w.proposals, [], `${kind} inside an explain beat does not ask`);
    assert.equal(w.declined, "studio_rejected.not_explain");
    assert.ok(isReason(w.declined));
  }
  for (const kind of ["explain", "worked_example", "reteach", "recap"]) assert.equal(whiteboardAskOf({ beat: ex, lane: "text", move: { kind } }).proposals.length, 1, kind);
  const game = { onScreen: { kind: "game", archetype: "shade_fraction", onScreen: {} }, statuses: [] };
  assert.equal(whiteboardAskOf({ beat: ex, lane: "text", move: { kind: "explain" }, studioView: game }).declined, "studio_rejected.attention", "never pull a game away");
  const ready = { onScreen: null, statuses: [], propose: { reveal: "i9" } };
  assert.equal(whiteboardAskOf({ beat: ex, lane: "text", move: { kind: "explain" }, studioView: ready }).declined, "studio_rejected.reveal_ready", "the piece made for this beat wins");
  // the Director's template rung (explainer@1 in the module tray) costs the turn's attention: the ask that replaces it does not
  const rungDir = directorProposalOf({ move: { kind: "explain" }, proposal: directorProposal({ kind: "explain" }, { ui: { tray: "module" } }) });
  const plain = arbitrate([rungDir, ...whiteboardAskOf({ beat: ex, lane: "text", move: { kind: "explain" } }).proposals]);
  assert.ok(plain.rejected.some((x) => x.p.kind === "ask_whiteboard" && x.why === "over_budget.attention"), "beside an engine show it waits");
  const rung = whiteboardAskOf({ beat: ex, lane: "text", move: { kind: "explain" }, rungMounted: true });
  assert.equal(rung.proposals[0].payload.replacesRung, true);
  assert.equal(rung.proposals[0].costs.attention, 0);
  assert.ok(arbitrate([rungDir, ...rung.proposals]).accepted.some((p) => p.kind === "ask_whiteboard"), "it replaces the rung");
  for (const code of ["studio.replaces_rung", "studio.rung_replaced", "studio_rejected.held", "studio_rejected.declined_by_studio", "cls.correct", "cls_source.fallback",
    "verdict.not_yet", "guard.replaced", "release.check_in_given", "release.goodbye_wrap", "component_error.director", "turn.lane_resume"]) assert.ok(isReason(code), code);
});

test("relational adapter: HOLD_ONE_TURN is surfaced (holdOneTurn) rather than silently dropped", () => {
  const out = arbitrate([directorProposalOf({ move: { kind: "practice" }, proposal: directorProposal({ kind: "practice" }) }), ...relationalProposals({ floor: "HOLD_ONE_TURN" })]);
  assert.equal(relationalEffects(out).holdOneTurn, true);
  assert.equal(relationalEffects(arbitrate([directorProposalOf({ move: { kind: "practice" }, proposal: directorProposal({ kind: "practice" }) })])).holdOneTurn, false);
});

test("trace rows: item_id / misconception_id only when the database has the columns; the comprehension trail is codes", async () => {
  const { comprehensionReasons } = await import("../server/brain/trace.js");
  const base = { lessonId: "l", turn: 1, lane: "text", move: "practice", inputsHash: "x", proposals: [], arb: { accepted: [], rejected: [] }, legalMode: "M1" };
  assert.equal(brainTraceStmt(base).params.length, 13);
  const w = brainTraceStmt({ ...base, withIds: true, itemId: "i1", misconceptionId: "m-edges" });
  assert.equal(w.params.length, 15);
  assert.deepEqual(w.params.slice(13), ["i1", "m-edges"]);
  assert.deepEqual(comprehensionReasons({ cls: { outcome: "incorrect", source: "model", fallback: true }, classified: true, uiVerdict: "not_yet", guard: { caught: ["praise"], replaced: true } }),
    ["cls.incorrect", "cls_source.fallback", "verdict.not_yet", "guard.replaced", "guard.praise"]);
  assert.deepEqual(comprehensionReasons({ cls: null, classified: false, help: true }), ["cls.none", "cls_source.help", "verdict.ungraded"]);
  for (const c of comprehensionReasons({ cls: { outcome: "misconception", source: "exact" }, classified: true, uiVerdict: "not_yet", guard: { caught: ["leak", "drift"], rewritten: true } })) assert.ok(isReason(c), c);
});
