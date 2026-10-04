// BUILD LAUNCH FROM PARTIAL INTENT (ARCHITECTURE.md v2 §4.3; v1 BUILD loop kept). Speech and work are separate tracks
// (law 9): while the child is still talking, a partial can already say what she will want to SHOW next, so the work
// starts now and is ready at the turn boundary. Prefetch only (`forge-live-codegen-race`, `live-free-generation`: no
// live codegen to a child): a library lookup, T1 engine parameters, a whiteboard script draft. Every result is triaged in
// code (triage.js): INTERRUPT (safety) / WHEN_IDLE (revealed only at a turn boundary, through the kernel) / SILENT.
//
// Intent sources:
//   misconception   the turn's last value equals a kit misconception value (SERVER ONLY: misconception values are key
//                   material and never reach the device, duplex-verdict-blind-timing)
//   curiosity       an on-topic question to her ("ye denominator kya hota hai?") naming a topic term
//   aid_request     a screen event (the child tapped "dikhao" / an aid)
//   hint            a device PrepareHint.buildIntent (aid requests the device saw first)
// One launch per intent key per turn; a distress turn launches nothing and drops what is queued.
import { understand, textHash } from "./understand.js";
import { RevealQueue, triage } from "./triage.js";

export class BuildIntents {
  /** @param {{ launch?: (intent:object, now:number) => Promise<object>|object|null, reveal?: RevealQueue }} [o] */
  constructor(o = {}) {
    this.launch = o.launch || null;
    this.reveal = o.reveal || new RevealQueue();
    this.turn = 0;
    this.seen = new Set();
    this.safety = false;
    this.stats = { launched: 0, deduped: 0, results: { INTERRUPT: 0, WHEN_IDLE: 0, SILENT: 0 }, droppedForSafety: 0 };
  }

  begin(turnSeq) { this.turn = turnSeq; this.seen.clear(); this.safety = false; }

  /**
   * A partial (server side, where the misconception values live). Returns the intent it launched, or null.
   * @param {string} text  echo-subtracted turn text
   * @param {{ itemId?: string|null, misconceptionValues?: string[], misconceptionIds?: Record<string,string>, topicTerms?: string[], answerForm?: string, beat?: string }} ctx
   */
  fromPartial(text, ctx = {}, now = 0) {
    if (this.safety || !text) return null;
    const n = understand(text, { answerForm: ctx.answerForm, beat: ctx.beat, misconceptionValues: ctx.misconceptionValues || [] });
    if (n.safety.distress) { this.onSafety(); return null; }
    if (n.misconception !== null && ctx.itemId) {
      const id = ctx.misconceptionIds?.[n.misconception] ?? `value:${n.misconception}`;
      return this.fire({ kind: "misconception", key: `mis:${ctx.itemId}:${id}`, itemId: ctx.itemId, misconceptionId: id }, now);
    }
    if (n.asks && ctx.topicTerms?.length) {
      const words = new Set(text.toLowerCase().split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean));
      const term = ctx.topicTerms.find((x) => words.has(String(x).toLowerCase()));
      if (term) return this.fire({ kind: "curiosity", key: `q:${term.toLowerCase()}`, term, textHash: textHash(text) }, now);
    }
    return null;
  }

  /** A screen event: an aid request is an explicit "show me". */
  fromScreen(ev, now = 0) {
    if (this.safety || ev?.kind !== "aid_request") return null;
    return this.fire({ kind: "aid_request", key: `aid:${ev.target ?? "any"}`, target: ev.target ?? null, childRequested: true }, now);
  }

  /** The device's PrepareHint.buildIntent (prefetch keys only). */
  fromHint(key, now = 0) {
    if (this.safety || !key) return null;
    return this.fire({ kind: "hint", key: String(key) }, now);
  }

  fire(intent, now) {
    if (this.seen.has(intent.key)) { this.stats.deduped++; return null; }
    this.seen.add(intent.key);
    this.stats.launched++;
    const turn = this.turn;
    const job = { ...intent, turn, at: now, prefetchOnly: true };
    const p = this.launch ? this.launch(job, now) : null;
    if (p && typeof p.then === "function") p.then((r) => this.land(r, turn, now), () => {});
    else if (p) this.land(p, turn, now);
    return job;
  }

  /** A build result landed. Triage decides; a result for an old turn or a distress turn is never revealed. */
  land(result, turn, now) {
    const cls = triage(result);
    this.stats.results[cls]++;
    if (cls === "INTERRUPT") return cls;
    if (this.safety || turn !== this.turn) { this.stats.droppedForSafety += this.safety ? 1 : 0; return "SILENT"; }
    return this.reveal.push(result, now);
  }

  onSafety() {
    this.safety = true;
    this.reveal.items = [];
  }

  /** Drained only at a turn boundary (triage.js RevealQueue): never mid-utterance. */
  drain(floorState) { return this.reveal.drain(floorState); }
}
