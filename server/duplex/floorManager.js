// The FLOOR MANAGER (ARCHITECTURE.md §2.6): the arbiter that owns who holds the floor, at frame rate. Deterministic: the
// same event sequence always yields the same actions (so it replays, shadows and unit-tests). Browser-safe: the device runs
// it (law 1: the floor lives on the device); it lives under server/duplex/ like server/director/safety.js, which the
// device also imports, so there is exactly one copy of every rule.
//
// Arbitration order inside step() (first match wins): 1 safety, 2 explicit child floor commands, 3 overlap during her
// speech, 4 hold request, 5 end of turn, 6 backchannel, 7 WT1 silence ladder.
//
// It never speaks, grades or calls a model by itself. It emits ACTIONS; the host obeys them:
//   duck / unduck / pause / resume / yield{heardUpTo} / repeat_from{heardUpTo}     reply channel (SPEAK)
//   stt_commit                      close the STT item now (the device commit; also the "probe" at a candidate)
//   candidate{text}                 start/refresh C speculation (THINK)      cancel_candidate   stop paying for it
//   commit{text, why, safety?}      the child's turn is over: plan the reply (revocable until her verdict word)
//   revoke                          the child resumed before the verdict word: drop the reply, merge, re-plan
//   safety_attend{kind}             sticky for the turn: quarantine drafts, freeze timers, no nods
//   nod / mm                        listening face / clip channel (content-blind)
//   hold_pose / checkin / offer     the child asked for time
//   nudge_face / nudge_voice        WT1 ladder after her question (silence only)
//   ask_model{gen,text}             optional hold shortener (may only shorten a hold, never trigger speech)
import { Ear } from "./ear.js";
import { understand } from "./understand.js";
import { decideEnd, CAND_MS, HOLD_REQUEST_MS, SAFETY_SILENCE_MS } from "./eot.js";
import { BackchannelPolicy } from "./backchannel.js";
import { Overlap } from "./bargein.js";

export const DEFAULTS = {
  cand: CAND_MS,
  prosody: true,
  repair: true,
  sttProbe: true,       // close the STT item at every candidate, so the decision reads a final, not a lagging partial
  nods: "bop",          // "bop" | "level" | "off"
  audioMm: false,
  model: false,         // hold shortener
  modelMinHoldMs: 800,  // only ask when the hold is at least this long
  modelP: 0.9,
  modelMarginMs: 200,
  revocableMs: 1500,    // law 2: the first ~1.5 s of her reply carries no verdict
  checkinMs: HOLD_REQUEST_MS,
  offerMs: 15000,
};
const WT1 = { recall: [4000, 7000], reasoning: [7000, 11000], default: [5000, 9000] };

export class FloorManager {
  constructor(opts = {}) {
    this.o = { ...DEFAULTS, ...opts };
    this.ear = new Ear();
    this.bc = new BackchannelPolicy({ audio: this.o.audioMm, mode: this.o.nods === "level" ? "level" : "bop" });
    this.state = "C_WAITING";
    this.ctx = {};
    this.items = new Map();
    this.order = [];
    this.log = [];
    this.gen = 0;
    this.resetTurn(0);
  }

  resetTurn(t) {
    this.items.clear();
    this.order = [];
    this.turnStartAt = t;
    this.onsetAt = null;
    this.safety = null;
    this.holdUntil = null;
    this.holdReq = false;
    this.candidateAt = null;
    this.pausedBefore = false;
    this.committedAt = null;
    this.checkedIn = false;
    this.offered = false;
    this.nudged = 0;
    this.lastDecision = null;
    this.safeguarded = false;
    this.ear.newTurn();
    this.bc.newTurn();
  }

  text() { return this.order.map((id) => this.items.get(id).text).filter(Boolean).join(" ").trim(); }
  allFinal() { return this.order.every((id) => this.items.get(id).final); }

  note() {
    const n = understand(this.text(), this.ctx);
    n.hesitatedEarlier = this.pausedBefore;
    return n;
  }

  act(out, a) { out.push(a); this.log.push({ ...a, state: this.state }); }

  /** @param {{type:string, t:number}} e */
  step(e) {
    const out = [];
    const t = e.t;
    switch (e.type) {
      case "handover":
        this.ctx = e.ctx || {};
        this.state = "C_WAITING";
        this.resetTurn(t);
        this.reply = null;
        this.overlap = null;
        break;
      case "teacher_start":
        this.reply = { ...e.reply, startedAt: t };
        if (e.ctx) this.ctx = e.ctx; // the context of the answer her line asks for (a called-out answer is scored against it)
        if (this.state === "COMMITTED" || this.state === "C_WAITING" || this.state === "T_SPEAKING") this.state = "T_SPEAKING";
        break;
      case "teacher_end":
        if (this.state === "T_SPEAKING") { this.state = "C_WAITING"; this.resetTurn(t); if (e.ctx) this.ctx = e.ctx; }
        this.reply = null;
        break;
      case "partial":
      case "final":
        this.onText(e, out);
        break;
      case "model":
        this.onModel(e, out);
        break;
      case "frame":
        this.onFrame(e, out);
        break;
      default:
        break;
    }
    return out;
  }

  onText(e, out) {
    if (!this.items.has(e.itemId)) { this.items.set(e.itemId, { text: "", final: false }); this.order.push(e.itemId); }
    const it = this.items.get(e.itemId);
    if (it.final && e.type === "partial") return;
    it.text = String(e.text || "").trim();
    if (e.type === "final") it.final = true;
    if (this.state === "OVERLAP" && this.overlap) { for (const a of this.overlap.step({ type: e.type, t: e.t, text: this.text() })) this.onOverlapAction(a, out); return; }
    if (this.state === "T_SPEAKING" || this.state === "C_WAITING" && !this.text()) return;
    const n = this.note();
    // 1. safety: on every slice, sticky for the turn
    if (n.safety.distress && !this.safety) {
      this.safety = n.safety.kind;
      const prev = this.state;
      this.state = "SAFETY_ATTEND";
      this.act(out, { do: "safety_attend", t: e.t, kind: n.safety.kind, from: prev });
      this.act(out, { do: "cancel_candidate", t: e.t, quarantine: true });
      if (prev === "COMMITTED" || prev === "T_SPEAKING" || prev === "OVERLAP") this.act(out, { do: "yield", t: e.t, kind: "safety" });
      this.overlap = null;
      this.reply = null;
      return;
    }
    if (this.safety) return;
    // new words while a hold runs: re-decide on the fresher text
    if (this.state === "C_PAUSED" || this.state === "C_HOLD_REQUESTED") this.decide(e.t, out, n, "text");
  }

  onModel(e, out) {
    if (this.state !== "C_PAUSED" || e.gen !== this.gen || !this.holdUntil) return;
    const silenceEnd = this.ear.lastLoudAt + this.o.cand;
    if (e.p >= this.o.modelP && e.t <= this.holdUntil - this.o.modelMarginMs && e.t >= silenceEnd) this.commit(e.t, out, "model shortened hold", { p: e.p });
  }

  onFrame(e, out) {
    const f = this.ear.push(e.t, e.rms, e.f0);
    const t = e.t;
    // 3. overlap during her speech
    if (this.state === "T_SPEAKING") {
      if (f.edge === "onset" && this.reply) {
        if (this.reply.verdictAt !== undefined && t < this.reply.verdictAt && this.revocable) { this.revoke(t, out, "resumed during uptake"); return; }
        this.state = "OVERLAP";
        this.overlap = new Overlap(this.reply, t);
        this.act(out, { do: "duck", t });
      }
      return;
    }
    if (this.state === "OVERLAP") {
      for (const a of this.overlap.step({ type: "frame", t, edge: f.edge, loud: f.loud })) this.onOverlapAction(a, out);
      return;
    }
    if (this.state === "COMMITTED") {
      if (f.edge === "onset") this.revoke(t, out, "resumed before her first sound");
      return;
    }
    const resumed = f.edge === "onset" || (f.loud && this.onsetAt !== null && this.ear.speaking && (this.state === "C_PAUSED" || this.state === "C_HOLD_REQUESTED"));
    if (f.edge === "onset" && this.state === "C_WAITING") { this.state = "C_SPEAKING"; this.onsetAt = t; }
    // 1. safety attend: never over the child; the safeguard at >= 1.5 s of silence
    if (this.state === "SAFETY_ATTEND") {
      if (!f.loud && f.silenceMs >= SAFETY_SILENCE_MS && !this.safeguarded) this.commit(t, out, "safeguard after 1.5 s silence", { safety: this.safety });
      return;
    }
    if (resumed && (this.state === "C_PAUSED" || this.state === "C_HOLD_REQUESTED")) {
      if (this.state === "C_PAUSED") this.act(out, { do: "cancel_candidate", t, why: "resumed in hold" });
      this.state = "C_SPEAKING";
      this.holdUntil = null;
      this.pausedBefore = true;
    }
    if (this.state === "C_SPEAKING" && !f.loud && f.silenceMs >= this.o.cand && this.candidateAt !== this.ear.lastLoudAt) {
      this.candidateAt = this.ear.lastLoudAt;
      if (this.o.sttProbe) this.act(out, { do: "stt_commit", t, why: "probe at candidate" });
      this.decide(t, out, this.note(), "candidate");
    } else if (this.state === "C_PAUSED" && this.holdUntil !== null && t >= this.holdUntil) {
      this.commit(t, out, `hold expired (${this.lastDecision?.why})`);
    } else if (this.state === "C_HOLD_REQUESTED") {
      const quiet = f.silenceMs;
      if (!this.checkedIn && quiet >= this.o.checkinMs) { this.checkedIn = true; this.act(out, { do: "checkin", t }); }
      if (!this.offered && quiet >= this.o.offerMs) { this.offered = true; this.act(out, { do: "offer", t }); }
    } else if (this.state === "C_WAITING" && this.onsetAt === null) {
      const lad = WT1[this.ctx.questionType] || WT1.default;
      const since = t - this.turnStartAt;
      if (this.nudged === 0 && since >= lad[0]) { this.nudged = 1; this.act(out, { do: "nudge_face", t }); }
      if (this.nudged === 1 && since >= lad[1]) { this.nudged = 2; this.act(out, { do: "nudge_voice", t }); }
    }
    // 6. backchannel (content-blind)
    if (this.o.nods !== "off" && (this.state === "C_SPEAKING" || this.state === "C_PAUSED")) {
      for (const a of this.bc.step(f, this.ear.prosody(), { state: this.state, answerForm: this.ctx.answerForm, safety: !!this.safety, hold: this.holdReq })) this.act(out, a);
    }
  }

  /** End-of-turn decision at the candidate, or again when fresher text lands inside a hold. */
  decide(t, out, n, why) {
    const d = decideEnd(n, this.ctx, this.o.prosody ? this.ear.prosody() : {}, { prosody: this.o.prosody, repair: this.o.repair });
    this.lastDecision = d;
    if (d.cue === "hold_request") {
      if (this.state !== "C_HOLD_REQUESTED") { this.state = "C_HOLD_REQUESTED"; this.holdReq = true; this.act(out, { do: "hold_pose", t }); }
      return;
    }
    this.holdReq = false;
    if (d.commit) { this.commit(t, out, `${why}: ${d.why}`, { p: d.p }); return; }
    const until = this.ear.lastLoudAt + this.o.cand + d.holdMs;
    if (until <= t) { this.commit(t, out, `${why}: hold already elapsed (${d.why})`, { p: d.p }); return; }
    // a hold starts (or fresher text lands inside one): speculation runs on this text (the draft manager re-keys on change)
    this.act(out, { do: "candidate", t, text: this.text() });
    const wasPaused = this.state === "C_PAUSED";
    this.state = "C_PAUSED";
    this.holdUntil = until;
    if (this.o.model && d.holdMs >= this.o.modelMinHoldMs && (!wasPaused || why === "text")) {
      this.gen++;
      this.act(out, { do: "ask_model", t, gen: this.gen, text: this.text(), ctx: this.ctx });
    }
  }

  commit(t, out, why, extra = {}) {
    if (!this.o.sttProbe || !this.allFinal()) this.act(out, { do: "stt_commit", t, why: "commit" });
    this.state = "COMMITTED";
    this.committedAt = t;
    this.revocable = this.o.revocableMs > 0 && !extra.safety;
    if (extra.safety) this.safeguarded = true;
    this.holdUntil = null;
    this.act(out, { do: "commit", t, text: this.text(), why, ...extra });
  }

  revoke(t, out, why) {
    this.act(out, { do: "revoke", t, why });
    if (this.reply) this.act(out, { do: "yield", t, kind: "revoke" });
    this.reply = null;
    this.state = this.safety ? "SAFETY_ATTEND" : "C_SPEAKING";
    if (this.safety) this.safeguarded = false;
    this.committedAt = null;
    this.pausedBefore = true;
  }

  onOverlapAction(a, out) {
    this.act(out, a);
    if (a.do === "resume" || a.do === "unduck" || a.do === "repeat_from") { this.state = "T_SPEAKING"; this.overlap = null; return; }
    if (a.do === "yield") {
      // the overlap words become the child's turn (fold-in): the floor is hers, scored like any turn
      this.reply = null;
      this.overlap = null;
      const keep = [...this.items.entries()];
      this.resetTurn(a.t);
      for (const [id, v] of keep) { this.items.set(id, v); this.order.push(id); }
      this.onsetAt = a.t;
      if (a.hold) { this.state = "C_HOLD_REQUESTED"; this.holdReq = true; this.act(out, { do: "hold_pose", t: a.t }); }
      else this.state = "C_SPEAKING";
    }
  }
}
