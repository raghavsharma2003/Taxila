// BR5, the relational adapter (TEACHER-BRAIN §9.5; BUILD-PLAN W2-E #5). W2-I's RelationalDirective (one per turn, from
// server/relational/seam.js decide()) is split into the kernel's authority ranks, so the bond can never be outbid by
// pedagogy and can never outrank the safety floor:
//   floor SAFETY, floorFix               → source safety, rank 0 (the floor freezes everything below it)
//   floor/overlay RELEASE                → rank 1, a MOVE: the child's goodbye ends the lesson this turn (NEVER MANIPULATE)
//   CHECK_IN                             → rank 1 overlay (one check-in after distress, before release; I-7)
//   OWN_SLIP, AFFIRM_RECHECK             → rank 7, teacher-owned repair: said before the next move
//   WARM_BOUNDARY, POINT_OUT             → rank 8, merged INTO the Director's move (a shape overlay)
//   NOTICE, CHRISTEN, SHARE_UPTAKE, LAUGH_WITH, HOME_TEACH_BACK, callbackId → rank 10 rapport (no callback or notice in
//                                          a correction; no humour in a re-teach: kernel conflict table)
//   affect                               → no proposal: it is Moment.teacherAffect (it cannot be outbid, only suppressed
//                                          by safety: TA8)
// Pure.
import { AUTHORITY, proposal } from "./kernel.js";

const RAPPORT_KIND = { NOTICE: "notice", LAUGH_WITH: "humour", CHRISTEN: "rapport", SHARE_UPTAKE: "rapport", HOME_TEACH_BACK: "rapport" };

/**
 * @param {import("../../shared/relational").RelationalDirective | null} d
 * @returns {import("../../shared/brain").Proposal[]}
 */
export function relationalProposals(d) {
  if (!d || typeof d !== "object") return [];
  const out = [];
  const ov = d.moveOverlay && typeof d.moveOverlay === "object" ? d.moveOverlay : null;
  const shape = (o) => ({ kind: o.kind, shapeId: String(o.shapeId ?? "") });
  if (d.floor === "SAFETY") {
    out.push(proposal("safety", "floor", AUTHORITY.safety, { payload: { floor: "SAFETY" }, urgency: 9, mandatory: true, reason: ["safety.relational_floor"], vetoes: ["*"] }));
  } else if (d.floor === "HOLD_ONE_TURN") {
    out.push(proposal("safety", "hold_one_turn", AUTHORITY.safety, { payload: { floor: "HOLD_ONE_TURN" }, urgency: 8, mandatory: true, reason: ["safety.hold_one_turn"] }));
  }
  if (Array.isArray(d.floorFix) && d.floorFix.length) {
    out.push(proposal("safety", "floor_fix", AUTHORITY.safety, { payload: { families: d.floorFix.map(String) }, urgency: 1, mandatory: true, reason: ["safety.floor_fix"] }));
  }
  if (d.floor === "RELEASE" || ov?.kind === "RELEASE") {
    out.push(proposal("relational", "move", AUTHORITY.release, { payload: { move: { kind: "wrap" }, overlay: ov?.kind === "RELEASE" ? shape(ov) : { kind: "RELEASE", shapeId: "" } },
      urgency: 9, mandatory: true, reason: ["release.goodbye", "rel.RELEASE"], vetoes: ["*"] }));
  } else if (ov) {
    if (ov.kind === "CHECK_IN") out.push(proposal("relational", "overlay", AUTHORITY.release, { payload: shape(ov), urgency: 5, mandatory: true, reason: ["release.check_in", "rel.CHECK_IN"] }));
    else if (ov.kind === "OWN_SLIP" || ov.kind === "AFFIRM_RECHECK") out.push(proposal("relational", "overlay", AUTHORITY.repair, { payload: shape(ov), urgency: 5, reason: [`rel.${ov.kind}`] }));
    else if (ov.kind === "WARM_BOUNDARY" || ov.kind === "POINT_OUT") out.push(proposal("relational", "overlay", AUTHORITY.director, { payload: shape(ov), urgency: 1, reason: [`rel.${ov.kind}`] }));
    else if (RAPPORT_KIND[ov.kind]) out.push(proposal("relational", RAPPORT_KIND[ov.kind], AUTHORITY.rapport, { payload: shape(ov), reason: [`rel.${ov.kind}`] }));
  }
  if (d.callbackId) out.push(proposal("relational", "callback", AUTHORITY.rapport, { payload: { callbackId: String(d.callbackId) }, reason: ["rapport.callback"] }));
  if (d.noticeId && ov?.kind !== "NOTICE") out.push(proposal("relational", "notice", AUTHORITY.rapport, { payload: { noticeId: String(d.noticeId) }, reason: ["rapport.notice"] }));
  return out;
}

/**
 * What the accepted relational proposals mean for the turn.
 * @param {{ accepted: import("../../shared/brain").Proposal[] }} arb
 * @returns {{ release: boolean, safety: boolean, overlay: { kind: string, shapeId: string } | null, callbackId: string | null,
 *   noticeId: string | null, floorFix: string[], holdOneTurn: boolean }}
 * holdOneTurn: the relational floor asked the realtime lane to hold one turn (RELATIONAL-OS §9). Surfaced so the turn traces
 * it; nothing acts on it yet (the realtime lane, W2-D, is its consumer: an open item, never silently dropped).
 */
export function relationalEffects(arb) {
  const acc = arb?.accepted ?? [];
  const rel = acc.filter((p) => p.source === "relational");
  const release = rel.some((p) => p.kind === "move");
  const overlayP = rel.find((p) => p.kind === "move") ?? rel.find((p) => p.kind === "overlay") ?? rel.find((p) => ["notice", "humour", "rapport"].includes(p.kind) && p.payload?.kind);
  const overlay = overlayP ? (overlayP.kind === "move" ? overlayP.payload.overlay : overlayP.payload) : null;
  return {
    release,
    safety: acc.some((p) => p.source === "safety" && p.kind === "floor"),
    overlay: overlay ? { kind: String(overlay.kind), shapeId: String(overlay.shapeId ?? "") } : null,
    callbackId: rel.find((p) => p.kind === "callback")?.payload?.callbackId ?? null,
    noticeId: rel.find((p) => p.kind === "notice" && p.payload?.noticeId)?.payload?.noticeId ?? null,
    floorFix: acc.filter((p) => p.kind === "floor_fix").flatMap((p) => p.payload?.families ?? []),
    holdOneTurn: acc.some((p) => p.source === "safety" && p.kind === "hold_one_turn"),
  };
}
