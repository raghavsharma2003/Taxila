// THE SERVER SLICE (ARCHITECTURE.md v2 §2.2, §10, §11 seam S1/S2): one per lesson. The device runs the floor; the server
// keeps the authorities the device must not hold:
//   - partials FAN-IN from the device (or a server-side STT tap) into the turn transcript (fanin.js);
//   - ECHO SUBTRACTION with her stored teacher text and its TTS word timings (echo.js);
//   - STICKY SAFETY on every partial: the server is the authority (partialSafety.js; `TurnRequest.duplex.safetyPending`);
//   - SPECULATIVE DRAFTS + TTS WARM-UP driven by the device's PrepareHint stream (speculator.js), and wait-time drafts at
//     her hand-over (key material stays here);
//   - BUILD LAUNCH from partial intent (buildIntent.js; misconception values are server-only).
// It never decides the floor and never speaks. Its turn summary is what the device sends with `/turn` (seam S2) and what
// the Director reads: hashes and flags, never the child's words in a trace row (`w2e-brain-trace`).
// Pure apart from the injected launchers, so the simulator and the tests drive it on virtual time.
import { TurnTranscript } from "./fanin.js";
import { EchoSubtractor } from "./echo.js";
import { PartialSafety } from "./partialSafety.js";
import { Speculator } from "./speculator.js";
import { BuildIntents } from "./buildIntent.js";

export class DuplexSlice {
  /**
   * @param {{ lessonId: string, source?: string, launchDraft?: Function, launchWarm?: Function, launchBuild?: Function, scan?: Function }} o
   */
  constructor(o) {
    this.lessonId = o.lessonId;
    this.echo = new EchoSubtractor();
    this.fanin = new TurnTranscript({ source: o.source || "other", filter: (text, meta) => this.echo.subtract(text, meta.t, this.fanin.lag.p90, meta.fromMs !== undefined ? { fromMs: meta.fromMs, toMs: meta.toMs } : null, meta.times ?? null) });
    this.safety = new PartialSafety(o.scan ? { scan: o.scan } : {});
    this.spec = new Speculator({ launchDraft: o.launchDraft || noLaunch, launchWarm: o.launchWarm, lessonId: o.lessonId });
    this.builds = new BuildIntents({ launch: o.launchBuild });
    this.turnSeq = 0;
    this.ctx = {};
    this.genId = null;
    this.superseded = [];
    this.heardUpTo = null;
    this.cutInReason = null;
    this.engineSummary = null;
  }

  /**
   * Her floor-handing line ended: a new child turn. `ctx` is SERVER context (it may hold the key and misconception values
   * for W drafts and misconception intents; none of it ever goes back to the device).
   */
  handover({ t, itemId = null, ctx = {}, codeGradable = false, outcomes = [], carryFrom = null }) {
    this.turnSeq++;
    this.ctx = { ...ctx, itemId };
    this.fanin.begin(t, { carryFrom });
    this.safety.begin(t);
    this.builds.begin(this.turnSeq);
    this.spec.onHandover(t, { itemId, codeGradable, outcomes });
    this.genId = null;
    this.cutInReason = null;
    this.engineSummary = null;
  }

  /** Her utterance as it plays (for echo subtraction): word boundaries when TTS gives them, else text + rate. */
  herUtterance({ utteranceId, text, words = null, startedAt, msPerChar = 70 }) {
    if (words?.length) this.echo.heard(utteranceId, words);
    else this.echo.heardText(utteranceId, text, startedAt, msPerChar);
  }

  herStopped(utteranceId, t, heardUpTo = null) {
    this.echo.stopAt(utteranceId, t);
    if (heardUpTo) this.heardUpTo = heardUpTo;
  }

  /** The device committed the STT item (micro-commit probe). */
  commitSent(t) { this.fanin.commitSent(t); }

  /**
   * One partial / final. Returns the safety state (sticky) and any build intent it launched.
   * @param {{type:"partial"|"final", itemId:string, text:string, t:number, delta?:boolean, words?:object[], audioStartMs?:number, audioEndMs?:number}} ev
   */
  partial(ev) {
    const changed = this.fanin.push(ev);
    const view = this.fanin.view(ev.t);
    const s = this.safety.check(view.text, view.coverageEndMs, ev.t);
    if (s.tripped) { this.spec.onSafety(ev.t); this.builds.onSafety(); }
    const intent = changed && !s.distress ? this.builds.fromPartial(view.text, this.ctx, ev.t) : null;
    return { safety: s, intent, textHash: view.textHash, changed };
  }

  /**
   * The Director's model distress read on the committed turn (classify's flag / distressCheck), routed here by
   * server/brain/turn.js through duplex/registry.js (safety-robust 2026-10-05). Sticky like a predicate hit; a trip
   * cancels speculative drafts and build intents exactly as a predicate hit on a partial does.
   */
  modelNote(kind, t) {
    const s = this.safety.modelNote(kind === "self_harm" || kind === "abuse" || kind === "fear" ? kind : null, t);
    if (s.tripped) { this.spec.onSafety(t); this.builds.onSafety(); }
    return s;
  }

  /** A device PrepareHint (with the stable text it keys on and the code-built uptake). */
  prepare(t, hint, words) {
    this.spec.onPrepare(t, hint, words);
    if (hint?.buildIntent) this.builds.fromHint(hint.buildIntent, t);
  }

  screen(ev, t) { return this.builds.fromScreen(ev, t); }

  /** SPEAK was governed on the device: promote by hash identity (or by the code grade for W drafts). */
  speak(t, { text, textHash, grade = null, cutInReason = null, engineSummary = null }) {
    const r = this.spec.onSpeak(t, { text, textHash, grade });
    this.genId = r.key ? `${r.key.turnSeq}:${r.key.gen}` : null;
    this.cutInReason = cutInReason;
    this.engineSummary = engineSummary;
    return r;
  }

  /** The child resumed before her verdict word: the row the Director planned is superseded (seam S2). */
  revoke(t) {
    if (this.genId) this.superseded.push(this.genId);
    this.genId = null;
    this.spec.onRevoke(t);
  }

  /** What the device sends with /turn (seam S2: TurnRequest.duplex). Hashes and flags only. */
  turnSummary() {
    const v = this.fanin.view(this.fanin.updatedAt ?? 0);
    const s = this.safety.state();
    return {
      transcriptHash: v.textHash,
      genId: this.genId,
      safetyPending: s.distress ? { kind: s.kind, source: s.source } : null,
      superseded: [...this.superseded],
      heardUpTo: this.heardUpTo,
      cutInReason: this.cutInReason,
      engineSummary: this.engineSummary,
    };
  }

  /** Reveals at a turn boundary; `phase` is the device governor's FloorPhase (v2) — v1 floor states still accepted. */
  drainReveals(phase) { return /^[a-z_]+$/.test(String(phase)) ? this.builds.drainAtPhase(phase) : this.builds.drain(phase); }

  close(t) { this.spec.close(t); }

  summary() { return { turns: this.turnSeq, speculation: this.spec.summary(), builds: { ...this.builds.stats }, echoRemovedTokens: this.fanin.echoRemoved }; }
}

function noLaunch() {
  return { abort: () => ({ in: 0, out: 0 }) };
}
