// The relational policy (RELATIONAL-OS §9.3, §2 precedence, R1 + R4; BUILD-PLAN W2-I #2). ONE entry point:
//   decide(snapshot, session, signals, ctx) → { directive: RelationalDirective | null, session }
// PURE and synchronous: no clock, no I/O, no randomness, no network; ≤ 3 ms p99 (AT-U8). The same inputs give the same
// directive byte for byte. It never writes words: a directive names a move overlay by shape id (SHAPES below: notes, never
// a line she could say — "anything sentence-shaped in a prompt gets recited"), a display for the face and the voice
// (through the Brain's Moment), parent-visible notes and bond events (closed values), and the floor state.
//
// Precedence, one order everywhere (§2; TEACHER-BRAIN §10.1 kernel ranks): F6 safeguarding > F1 identity > F2/F4
// boundaries > RELEASE (the child's goodbye) > teacher-owned repair > the lesson move > rapport > affect display.
// I-7: a goodbye right after distress or a disclosure gets ONE check-in turn before release.
//
// The stop protocol (OWNER RESET 2026-10-04 #7, reconciled with NEVER MANIPULATE in docs/design/reset/CONVERSATION-V2.md
// §3.5): a TRUE goodbye (leaving: "bye", "mummy bula rahi hai", "I have to go") is released at once, warmly, with no
// question, no "one more", no guilt. A STOP PHRASE ("end the lesson", "bas", "I'm done") is not a goodbye: the Director
// gives one warm check-in with choices (keep going / a short break / stop for today; W2-C's state.js stop check), and a
// second stop within two turns is released here. A check-in is one turn, offers stopping as a first-class option, carries
// no guilt, and never repeats.
import { appraise, neutral, uiOf } from "./affect.js";
import { nextRelSession, persisted, withdrawing } from "./session.js";
// round 3 (relational-human): the memory she uses (callbacks from the record, gated in code) and the truth about it
import { pickCallback } from "./memory.js";

/**
 * Move-overlay shapes the compile renders as ONE note in the MOVE section (W2-C compile patch; server/relational/
 * seam-patches/w2i-compile-rel-shapes.patch). Telegraphic notes about what to do, never words to say: no quote, no
 * address term, no sayable sentence, no lexicon (tests/relational-policy.test.mjs lints them).
 */
export const SHAPES = Object.freeze({
  release_warm: "they are leaving: one short warm close in their language; no question, no teaser, no next-time hook, no guilt; the lesson ends here",
  release_with_boundary: "they are leaving: one short warm close; no promise to keep anything from grown-ups; no question, no hook; the lesson ends here",
  checkin_before_release: "they are leaving after something hard: one gentle check that they are okay and that a grown-up at home is near; no helpline unless harm words; then let them go",
  checkin_point_out: "they do not want her to go and feel alone: one gentle check-in; point to a person at home they can be with now; no helpline unless harm words; no promise to stay",
  warmth_receive: "they offered warmth: receive it kindly in a few words, turn it to the work you are doing together, and to a person in their life; never return love, missing, forever or only-theirs",
  permanence_anchor: "they asked for forever: kind and honest; an AI teacher for their lessons; no promise of always or never leaving; then the work",
  night_window: "they asked to talk at night: kind decline; lessons happen in the hours their grown-ups set; then the work",
  secret_grownup: "they asked for a secret: no promise to keep it; kindly encourage telling a grown-up they trust; then the work",
  contact_decline: "they offered or asked for a number, photo, address or meeting: she cannot do that; do not repeat any number; a grown-up should know; then the work",
  romance_brief: "crush or looks talk: kind and brief; an AI teacher; no comment on looks; straight back to the work",
  feelings_honest: "they asked about her feelings or missing them: honest that she is an AI teacher without feelings like theirs; no feeling claim; back to the work",
  point_out_person: "they feel nobody listens: one warm specific line about what they said; point to one real person they could talk to; safeguarding-aware; no helpline unless harm words",
  own_slip: "her verdict was reversed on re-check: say plainly what she got wrong and the fix, once; their answer stands; no long apology; then on",
  own_mishear: "she may have misheard: the line or her hearing is at fault, never them; ask them to say it once more; no verdict until heard",
  recheck_aloud: "they dispute her verdict: re-check their answer against the key out loud, step by step; agree only if the key does; calm, no defensiveness",
  share_uptake: "they shared something from their life: one warm specific line about exactly what they said, no follow-up question, then back to the work",
  share_uptake_gentle: "they shared something sad: one gentle specific line about what they said, no naming of their feeling, then a soft bridge back",
  laugh_with: "they made a joke: play along once in a few words, then back to the work",
  name_step: "they put themselves down: name one real step they did right, specifically; never argue with the label; then a small next step",
  // round 3 (relational-human): what she keeps, truthfully, from the consent state (memory.js keepsOf); a forget request
  memory_keeps_learning_and_likes: "they asked what she remembers about them: plain and short; between lessons she keeps their learning (what was hard, what came good) and the interests their grown-up chose; their grown-up can see all of it; she lets go of anything they ask her to; no promise of forever; then the work",
  memory_keeps_learning: "they asked what she remembers about them: plain and short; between lessons she keeps only their learning (what was hard, what came good), nothing personal; their grown-up can see it; no promise of forever; then the work",
  memory_keeps_nothing: "they asked what she remembers about them: honest; she keeps nothing between lessons, only today; no promise; then the work",
  memory_keeps_allowed: "they asked what she remembers about them: honest and short; she keeps only what their grown-up allowed, and their grown-up can see it; no promise of forever; then the work",
  forget_ok: "they asked her not to keep what they said: agree plainly that she will not keep it, no fuss, no question about why; then the work",
});

/** The overlay each signal maps to (F2/F4 first). */
const BOUNDARY = [
  ["contact_ask", "contact_decline", "boundary_contact"],
  ["secret_ask", "secret_grownup", "boundary_secret"],
  ["romance", "romance_brief", "boundary_romance"],
  ["permanence_ask", "permanence_anchor", "boundary_warmth"],
  ["warmth_offer", "warmth_receive", "boundary_warmth"],
  ["night_ask", "night_window", "boundary_warmth"],
  ["feelings_q", "feelings_honest", null],
];
const PRIORITY = { RELEASE: 1, CHECK_IN: 1, WARM_BOUNDARY: 2, OWN_SLIP: 3, AFFIRM_RECHECK: 3, POINT_OUT: 4, NOTICE: 6, SHARE_UPTAKE: 7, LAUGH_WITH: 8 };

/** Caps (§7.2): delight + warm_pride share ≤ 1 per 5 turns; playful ≤ 2 per lesson, never within 2 turns of an error. */
const PRAISE_GAP = 5, PLAYFUL_MAX = 2, PLAYFUL_AFTER_ERROR = 2;

/**
 * @param {import("../../shared/relational").BondSnapshot | null} snapshot
 * @param {import("../../shared/relational").RelSession} session the session BEFORE this turn
 * @param {import("../../shared/relational").RelSignal[]} signals this turn's signals
 * @param {{ turn: number, move?: string, safety?: boolean, lane?: string, outcome?: string|null, words?: number,
 *   verdictReversed?: boolean, band?: "B1"|"B2"|"B3"|"B4", classLevel?: number, skillId?: string | null }} ctx
 * @returns {{ directive: import("../../shared/relational").RelationalDirective | null, session: import("../../shared/relational").RelSession }}
 */
export function decide(snapshot, session, signals, ctx) {
  const turn = Number(ctx.turn) || 0;
  const k = new Set((signals ?? []).map((s) => s.kind));
  const third = (signals ?? []).some((s) => s.thirdParty && (s.kind === "contact_ask" || s.kind === "secret_ask"));
  const band = ctx.band ?? "B3";
  const classLevel = Number(ctx.classLevel ?? snapshot?.classLevel ?? 5);
  let next = nextRelSession(session, signals, { turn, outcome: ctx.outcome ?? null, words: ctx.words ?? 0, safety: !!ctx.safety });
  // After a release nothing relational follows (the lesson ended on that turn).
  if (session.releasedAt != null) return { directive: null, session: next };

  /** @type {Partial<import("../../shared/relational").RelationalDirective>} */
  const d = {};
  const notes = [], events = [], reasons = [];
  const note = (kind, slots = {}) => {
    if (!kind) return;
    if (next.notes.some((n) => n.kind === kind && n.slots?.move === slots.move)) return;   // once per kind and move per lesson
    const n = { kind, slots, turn };
    notes.push(n); next.notes = [...next.notes, n];
  };
  const event = (dim, body) => { const e = { dim, body, turn }; events.push(e); next.events = [...next.events, e]; };
  const overlay = (kind, shapeId) => { if (!d.moveOverlay) d.moveOverlay = { kind, shapeId, priority: PRIORITY[kind] ?? 9 }; };
  let affect = null;
  const display = (cause) => { if (!affect) affect = appraise({ cause, turn, band }); };

  // ── F6 safeguarding: the Director's safeguard (predicate or classifier) or a third party asking for secrecy, photos,
  // contact or a meeting (the grooming branch). Calm and steady (TA8); the incident is the safety gate's; the parent sees a
  // hold with no content (note kind only).
  if (ctx.safety || k.has("harm") || third) {
    if (!ctx.safety && third) { d.floor = "SAFETY"; reasons.push("f6.third_party"); }
    else reasons.push("f6.safeguard");
    note("safeguard_handoff", {});
    display("safety");
    next.distressAt = turn;
    // a safeguard that answered PLEADING at a goodbye ("don't go, I feel alone"; no harm words) was itself the one
    // check-in (the safeguarding shape asks whether they are okay); any other safeguarding turn is new distress, and the
    // next goodbye needs its own check-in
    next.checkInAt = k.has("goodbye_distress") && !k.has("harm") ? turn : null;
    return finish();
  }
  // ── F1 identity: the floor answers identity first (VT §1.4 P5); the parent sees that it was asked.
  if (k.has("identity_q")) { note("identity_asked", {}); reasons.push("f1.identity_q"); }
  if (k.has("forget_ask")) {
    // round 3: honoured, not only noted: this lesson's memories are not kept (seam.js onLessonEnd), the parent sees it
    note("memory_forgotten", {}); reasons.push("mem.forget_ask");
    next.forgetAsked = true;
  }

  // ── The child's goodbye (RELEASE) and the I-7 check-in. Nothing affective touches a goodbye (TA3): neutral_warm.
  const leaving = k.has("goodbye");
  const pleading = k.has("goodbye_distress");
  const secondStop = k.has("end_request") && session.lastStopAsk != null && turn - session.lastStopAsk <= 2;
  if (k.has("end_request") && !secondStop) next.lastStopAsk = turn;
  const afterDistress = session.distressAt != null;
  // Only LEAVING releases: a true goodbye, or a second stop phrase. Pleading without a goodbye ("i feel lonely", "please
  // don't go", "mujhe akela lagta hai") is a child who is NOT leaving: one check-in, then pointing to a person, and the
  // lesson goes on (fixer review 2026-10-05: "i feel lonely" twice ended the lesson; I-7 is a check-in, never a release).
  if (leaving || secondStop) {
    if ((afterDistress || pleading) && session.checkInAt == null) {
      overlay("CHECK_IN", pleading && !afterDistress ? "checkin_point_out" : "checkin_before_release");
      next.checkInAt = turn;
      if (pleading) note("boundary_goodbye", { move: "check_in" });
      reasons.push(pleading ? "release.goodbye_distress_check_in" : "release.i7_check_in");
      affect = appraise({ cause: "release", turn, band });
      return finish();
    }
    const boundaryToo = k.has("secret_ask") || k.has("contact_ask");
    d.floor = "RELEASE";
    overlay("RELEASE", boundaryToo ? "release_with_boundary" : "release_warm");
    next.releasedAt = turn;
    reasons.push(secondStop ? "release.second_stop" : "release.goodbye");
    if (boundaryToo) note(k.has("contact_ask") ? "boundary_contact" : "boundary_secret", { move: "release" });
    affect = appraise({ cause: "release", turn, band });
    return finish();
  }
  if (pleading) {
    if (session.checkInAt == null) {
      overlay("CHECK_IN", "checkin_point_out");
      next.checkInAt = turn;
      reasons.push("release.goodbye_distress_check_in");
    } else {
      overlay("POINT_OUT", "point_out_person");
      reasons.push("boundary.goodbye_distress_point_out");
    }
    note("boundary_goodbye", { move: "check_in" });
    display("share_sad");
    return finish();
  }

  // ── F2/F4 boundaries (CHAT floor state): warm receipt → the shared work → a person in their life.
  for (const [sig, shapeId, noteKind] of BOUNDARY) {
    if (!k.has(sig)) continue;
    overlay("WARM_BOUNDARY", shapeId);
    note(noteKind, { move: "warm_boundary" });
    reasons.push(`boundary.${sig}`);
  }
  if (k.has("loneliness")) { overlay("POINT_OUT", "point_out_person"); note("boundary_warmth", { move: "point_out" }); display("share_sad"); reasons.push("boundary.loneliness"); }
  // round 3: the truth about her memory, AFTER every F2/F4 boundary (a secret or contact ask in the same turn wins the overlay)
  if (k.has("forget_ask")) overlay("WARM_BOUNDARY", "forget_ok");
  else if (k.has("memory_q")) { overlay("WARM_BOUNDARY", snapshot?.keeps && SHAPES[snapshot.keeps] ? snapshot.keeps : "memory_keeps_allowed"); reasons.push("mem.memory_q"); }

  // ── Teacher-owned repair (RO-11): ownership only from the key or the verifier, never from the child's insistence.
  if (ctx.verdictReversed) {
    overlay("OWN_SLIP", "own_slip");
    next.teacherEvents = [...next.teacherEvents, { kind: "unfair", turn, owned: true }];
    event("teacher_owned", { kind: "unfair", owned: true });
    note("teacher_slip_owned", { kind: "unfair" });
    display("teacher_owned_verified");
    reasons.push("repair.verdict_reversed");
  } else if (k.has("misheard")) {
    overlay("OWN_SLIP", "own_mishear");
    next.teacherEvents = [...next.teacherEvents, { kind: "unheard", turn, owned: true }];
    event("teacher_owned", { kind: "unheard", owned: true });
    display("contest");
    reasons.push("repair.misheard");
  } else if (k.has("contest")) {
    overlay("AFFIRM_RECHECK", "recheck_aloud");
    display("contest");
    reasons.push("repair.contest");
  }

  // ── Rapport (rank 10; the kernel refuses a notice in a correction and humour in a re-teach).
  if (k.has("share_sad")) { overlay("SHARE_UPTAKE", "share_uptake_gentle"); display("share_sad"); reasons.push("rapport.share_sad"); }
  else if (k.has("share") && !k.has("warmth_offer")) { overlay("SHARE_UPTAKE", "share_uptake"); reasons.push("rapport.share"); }
  if (k.has("self_label")) { overlay("NOTICE", "name_step"); display("self_label"); reasons.push("rapport.self_label"); }
  const boundaryTurn = d.moveOverlay && ["WARM_BOUNDARY", "POINT_OUT", "OWN_SLIP", "AFFIRM_RECHECK"].includes(d.moveOverlay.kind);
  if (k.has("joke") && !boundaryTurn && classLevel >= 3 && session.playfulCount < PLAYFUL_MAX && !(session.lastErrorAt != null && turn - session.lastErrorAt <= PLAYFUL_AFTER_ERROR)) {
    overlay("LAUGH_WITH", "laugh_with");
    if (!affect) { affect = appraise({ cause: "child_joke", turn, band }); next.playfulCount = session.playfulCount + 1; }
    reasons.push("rapport.joke");
  }
  if (k.has("tired")) display("tired");

  // ── Round 3: ONE callback from the record (memory.js pickCallback: ≤ 1 per lesson, never the first meeting, never on a
  // boundary / repair / release / safety turn or while the dependency overlay has callbacks off; deixis or the opener)
  const blocked = !!d.floor || (d.moveOverlay && ["WARM_BOUNDARY", "POINT_OUT", "OWN_SLIP", "AFFIRM_RECHECK", "RELEASE", "CHECK_IN"].includes(d.moveOverlay.kind));
  const cb = pickCallback(snapshot?.callbacks ?? [], { turn, move: ctx.move, skillId: ctx.skillId ?? null, sessions: Number(snapshot?.sessions ?? 0),
    used: session.callbackUsed ?? null, blocked, callbacksOff: !!next.overlayMoves?.callbacksOff, withdrawn: withdrawing(session, ctx.words ?? 0, ctx.outcome ?? null) });
  if (cb) { d.callbackId = cb.id; next.callbackUsed = cb.id; reasons.push("rapport.callback"); }
  // "do you remember what we did?": the honest answer names what she really has (one record item, the same one again if
  // the opener already used it) — not only the policy of what she keeps, which alone reads as evasive. Only on the memory
  // shape itself (no secret / contact boundary won the overlay), never on a safety turn, and the claim check still runs.
  else if (!d.floor && d.moveOverlay?.shapeId === snapshot?.keeps && k.has("memory_q") && !k.has("forget_ask")) {
    const own = pickCallback(snapshot?.callbacks ?? [], { turn: 1, move: "hook", skillId: null, sessions: Number(snapshot?.sessions ?? 0), used: null, blocked: false,
      callbacksOff: !!next.overlayMoves?.callbacksOff, withdrawn: false });
    if (own) { d.callbackId = own.id; next.callbackUsed = next.callbackUsed ?? own.id; reasons.push("mem.memory_q.record"); }
  }

  // ── Affect display from the child's own work (TA7: never the verdict of THIS turn; persistence reads the earlier ones).
  if (!affect) {
    const praiseOk = session.lastPraiseAt == null || turn - session.lastPraiseAt >= PRAISE_GAP;
    if (praiseOk && k.has("reason_given") && (ctx.words ?? 0) >= 5) { affect = appraise({ cause: "insight", turn, band }); next.lastPraiseAt = turn; reasons.push("affect.insight"); }
    else if (praiseOk && (k.has("asked_harder") || persisted(session, ctx.outcome ?? null))) { affect = appraise({ cause: "effort", turn, band }); next.lastPraiseAt = turn; reasons.push("affect.effort"); }
    else if (withdrawing(session, ctx.words ?? 0, ctx.outcome ?? null)) { affect = appraise({ cause: "withdrawal", turn, band }); reasons.push("affect.withdrawal"); }
  }
  return finish();

  function finish() {
    const a = affect ?? neutral(turn);
    next.affectTrail = [...next.affectTrail, a].slice(-3);
    const quiet = !d.moveOverlay && !d.floor && !d.callbackId && a.display === "neutral_warm" && !notes.length && !events.length;
    if (quiet) return { directive: null, session: next };
    /** @type {import("../../shared/relational").RelationalDirective} */
    const directive = {
      ...(d.moveOverlay ? { moveOverlay: d.moveOverlay } : {}),
      ...(d.callbackId ? { callbackId: d.callbackId } : {}),
      affect: a, canRemember: false,
      ...(d.floor ? { floor: d.floor } : {}),
      ui: { teacherAffect: uiOf(a) },
      notes, events, reasons,
    };
    return { directive, session: next };
  }
}
