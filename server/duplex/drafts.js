// THINK (ARCHITECTURE.md §2.3): drafts kept warm, keyed and cancellable. Server side.
//
// Every artefact carries a GenKey { lessonId, turnSeq, itemId, phase: "wait"|"candidate"|"commit", gen, transcriptHash|null,
// outcome? }. There is no "latest" read (`voice-features-latest-signals-race`): a draft is promoted only on key identity.
//   W  wait-time drafts: launched at her hand-over on a code-gradable closed item, one per likely outcome, keyed WITHOUT the
//      child's words (needs seam S5); promoted at commit when the code grade names an outcome that has a ready draft.
//   C  candidate speculation: launched at a candidate endpoint on the candidate text; ONE live generation per turn (a new
//      candidate text cancels the old one: `reply-two-drafts` measured duplicates as slower); <= 3 per turn, then wait for
//      the commit; promoted only if the committed text hashes the same (lexical identity, `cascade-speculative-reply`).
//   K  commit: today's path (the Director plans fresh) when nothing matches.
// Safety: a distress hit aborts and QUARANTINES every non-safety draft of the turn; a quarantined draft can never be promoted.
//
// The manager is clock-agnostic: `launch(job, now)` is injected and returns { abort(now) -> billed, readyAt?, done? }.
// The simulator injects a virtual-time launcher (measured TTFT/rate); production injects azureLauncher (launch.js).
import { textHash } from "./understand.js";

export const CAPS = { maxCandidatePerTurn: 3, maxWaitDrafts: 3 };

export class DraftManager {
  /** @param {{ launch: (job:object, now:number) => { abort:(now:number)=>{in:number,out:number}, readyAt?:number, usage?:{in:number,out:number} }, caps?: object, lessonId?: string }} o */
  constructor(o) {
    this.launch = o.launch;
    this.caps = { ...CAPS, ...(o.caps || {}) };
    this.lessonId = o.lessonId || "sim";
    this.turnSeq = 0;
    this.jobs = [];
    this.stats = { launched: { wait: 0, candidate: 0 }, promoted: { wait: 0, candidate: 0, commit: 0 }, aborted: 0, discarded: 0, quarantined: 0,
      tokens: { used: { in: 0, out: 0 }, wasted: { in: 0, out: 0 } }, turns: 0, waitTurns: 0, waitHits: 0, candTurns: 0, candHits: 0 };
    this.gen = 0;
    this.safety = false;
  }

  /** A new child turn (her hand-over). W drafts launch here for code-gradable closed items. */
  onHandover(now, { itemId, codeGradable, outcomes = [] } = {}) {
    this.closeTurn(now);
    this.turnSeq++;
    this.stats.turns++;
    this.itemId = itemId ?? null;
    this.safety = false;
    this.candCount = 0;
    this.waitLaunched = false;
    if (codeGradable && outcomes.length) {
      this.waitLaunched = true;
      this.stats.waitTurns++;
      for (const oc of outcomes.slice(0, this.caps.maxWaitDrafts)) this.start(now, { phase: "wait", outcome: oc.outcome, value: oc.value ?? null, transcriptHash: null });
    }
  }

  key(phase, extra) { return { lessonId: this.lessonId, turnSeq: this.turnSeq, itemId: this.itemId, phase, gen: ++this.gen, ...extra }; }

  start(now, spec) {
    const key = this.key(spec.phase, spec);
    const h = this.launch({ key, text: spec.text ?? null }, now);
    const j = { key, h, startedAt: now, state: "live" };
    this.jobs.push(j);
    this.stats.launched[spec.phase]++;
    return j;
  }

  liveCandidate() { return this.jobs.find((j) => j.key.phase === "candidate" && j.state === "live" && j.key.turnSeq === this.turnSeq); }

  /** A candidate endpoint with this text. Same text as the live generation -> nothing; new text -> cancel and re-key. */
  onCandidate(now, text) {
    if (this.safety) return null;
    const hash = textHash(text);
    const live = this.liveCandidate();
    if (live && live.key.transcriptHash === hash) return live;
    if (live) this.kill(live, now, "aborted");
    if (this.candCount >= this.caps.maxCandidatePerTurn) return null;
    this.candCount++;
    if (this.candCount === 1) this.stats.candTurns++;
    return this.start(now, { phase: "candidate", transcriptHash: hash, text });
  }

  /** The child resumed inside a hold: the candidate text is stale, stop paying for it. */
  onResume(now) { const live = this.liveCandidate(); if (live) this.kill(live, now, "aborted"); }

  /** Sticky safety: every non-safety draft of this turn is aborted and quarantined. */
  onSafety(now) {
    this.safety = true;
    for (const j of this.jobs) if (j.key.turnSeq === this.turnSeq && j.state === "live") { this.kill(j, now, "aborted"); j.quarantined = true; this.stats.quarantined++; }
  }

  kill(j, now, how) {
    const billed = j.h.readyAt !== undefined && j.h.readyAt <= now ? j.h.usage : j.h.abort(now);
    j.state = how;
    this.stats[how]++;
    if (billed) { this.stats.tokens.wasted.in += billed.in || 0; this.stats.tokens.wasted.out += billed.out || 0; }
  }

  /**
   * The floor committed. `grade` = the code grade of the committed text ({ outcome, value } when classifyFast decided, else null).
   * @returns {{ phase: "wait"|"candidate"|"commit", readyAt: number|null, key: object|null }}
   */
  onCommit(now, text, grade) {
    let pick = null;
    if (!this.safety) {
      const hash = textHash(text);
      const cur = this.jobs.filter((j) => j.key.turnSeq === this.turnSeq && j.state === "live" && !j.quarantined);
      if (grade && this.waitLaunched) pick = cur.find((j) => j.key.phase === "wait" && j.key.outcome === grade.outcome) || null;
      if (!pick) pick = cur.find((j) => j.key.phase === "candidate" && j.key.transcriptHash === hash) || null;
    }
    if (this.waitLaunched && pick?.key.phase === "wait") this.stats.waitHits++;
    if (this.candCount > 0 && pick?.key.phase === "candidate") this.stats.candHits++;
    for (const j of this.jobs) {
      if (j.key.turnSeq !== this.turnSeq || j.state !== "live") continue;
      if (j === pick) {
        j.state = "promoted";
        this.stats.promoted[j.key.phase]++;
        const u = j.h.usage || { in: 0, out: 0 };
        this.stats.tokens.used.in += u.in; this.stats.tokens.used.out += u.out;
      } else this.kill(j, now, j.h.readyAt !== undefined && j.h.readyAt <= now ? "discarded" : "aborted");
    }
    if (!pick) this.stats.promoted.commit++;
    this.committed = true;
    return pick ? { phase: pick.key.phase, readyAt: pick.h.readyAt ?? null, key: pick.key } : { phase: "commit", readyAt: null, key: null };
  }

  /** A commit was revoked (the child resumed before the verdict word): the promoted draft is void, a new candidate will follow. */
  onRevoke() { this.committed = false; }

  closeTurn(now) {
    for (const j of this.jobs) if (j.state === "live") this.kill(j, now, j.h.readyAt !== undefined && j.h.readyAt <= now ? "discarded" : "aborted");
    this.jobs = this.jobs.filter((j) => j.state === "live");
  }

  summary() {
    const s = this.stats, w = s.tokens.wasted, u = s.tokens.used;
    const tot = w.in + w.out + u.in + u.out;
    return { ...s, waitHitRate: s.waitTurns ? s.waitHits / s.waitTurns : null, candHitRate: s.candTurns ? s.candHits / s.candTurns : null,
      wastedShare: tot ? (w.in + w.out) / tot : 0 };
  }
}
