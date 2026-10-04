// Barge-in and overlap repair (ARCHITECTURE.md §3.5): today's pause-then-decide (`cascade-barge-pause-decide`) with the
// transcript class decided as soon as the words allow, and a playback-anchored heardUpTo on every yield. Pure, browser-safe.
//
//   acoustic gate:   onset -> duck (EnergyVad ~90 ms); sustained voice (EnergyVad "sustain") -> pause.
//   early class:     >= 3 partial tokens that are not a repair/stop shape -> it is a real turn: yield now.
//   class at a stop: the child goes quiet for OVERLAP_CAND_MS -> stt_commit (probe), then overlapKind(final text)
//                    (Study C, 16/16 on M-C1) decides (a partial decides only once it has >= 3 tokens, see early class):
//                    continuer -> resume from the last word gap; repair -> repeat_from(heardUpTo), shorter and slower;
//                    stop -> yield and hold; answer / turn -> yield, the words are the child's turn.
//   no words:        NO_TEXT_RESUME_MS after the probe with no transcript -> resume (cough, noise, her own echo).
//   fold-in:         a value spoken over a question that asks for a number is an ANSWER (yield; the words are the turn).
import { overlapKind } from "../../src/duplex/turnPolicy.ts";
import { normText, valuesIn } from "./understand.js";

export const OVERLAP_CAND_MS = 300;
// After the probe commit, how long to wait for words before treating sustained overlap as noise and resuming. M-D2 (real
// taxila-live-transcribe, n=58 client commits): the final lands 915 / 1,311 ms (p50 / p90) after a commit, so 1,200 ms
// resumed over real turns whose words were still in flight (sim: 10 of 76 overlap turns); 1,600 = p90 + 300 ms.
export const NO_TEXT_RESUME_MS = 1600;
const EARLY_TOKENS = 3;
const REPAIR_START = /^(?:क्या|kya|फिर|phir|dobara|दोबारा|what|sorry|हाँ\?|haan\?)/u;
const STOP_START = /^(?:रुको|ruko|wait|stop|एक मिनट|ek minute|बस|bas)/u;

/** Characters of `text` heard by `t`, snapped back to the last word boundary (the playback clock, `heardUpTo`). */
export function heardChars(text, startedAt, t, msPerChar) {
  const played = Math.max(0, Math.min(text.length, Math.floor((t - startedAt) / msPerChar)));
  if (played >= text.length) return text.length;
  const cut = text.lastIndexOf(" ", played);
  return cut < 0 ? 0 : cut;
}

export class Overlap {
  /** @param {{ text:string, startedAt:number, msPerChar:number, askedYesNo?:boolean, answerForm?:string, responseId?:string }} reply */
  constructor(reply, onsetAt) {
    this.reply = reply;
    this.onsetAt = onsetAt;
    this.state = "ducked";
    this.text = "";
    this.lastVoiceAt = onsetAt;
    this.resolved = null;
    this.pausedAt = null;
    this.probedAt = null;
    this.final = false;
  }

  /** overlapKind plus fold-in: a value over a number question answers it. */
  kindOf(text) {
    const n = normText(text);
    const toks = n ? n.split(" ") : [];
    // a short repair request in any spelling ("फिर से बोलो", "kya bola", "sorry what") is a repair, not a new turn
    if (toks.length && toks.length <= 3 && REPAIR_START.test(n) && !valuesIn(text).length) return "repair";
    const k = overlapKind(text, { askedYesNo: !!this.reply.askedYesNo });
    if ((k === "turn" || k === "continuer") && this.reply.answerForm === "number" && valuesIn(text).length) return "answer";
    return k;
  }

  heardUpTo(t) {
    const at = this.pausedAt ?? t;
    return { responseId: this.reply.responseId ?? null, chars: heardChars(this.reply.text, this.reply.startedAt, at, this.reply.msPerChar), ms: Math.max(0, at - this.reply.startedAt) };
  }

  resolve(kind, t) {
    this.resolved = kind;
    const heard = this.heardUpTo(t);
    if (kind === "continuer") return [{ do: "resume", t, kind }];
    if (kind === "repair") return [{ do: "repeat_from", t, kind, heardUpTo: heard, slower: true }];
    if (kind === "stop") return [{ do: "yield", t, kind, heardUpTo: heard, hold: true }];
    return [{ do: "yield", t, kind, heardUpTo: heard }];
  }

  /** @param {{type:string, t:number, edge?:string, loud?:boolean, silenceMs?:number, text?:string}} e */
  step(e) {
    if (this.resolved) return [];
    const out = [];
    if (e.type === "frame") {
      if (e.loud) this.lastVoiceAt = e.t;
      if (e.edge === "sustain" && this.state === "ducked") { this.state = "paused"; this.pausedAt = e.t; out.push({ do: "pause", t: e.t }); }
      const quiet = e.t - this.lastVoiceAt;
      if (this.state !== "ducked" || this.text) {
        if (quiet >= OVERLAP_CAND_MS && this.probedAt === null && !this.final) { this.probedAt = e.t; out.push({ do: "stt_commit", t: e.t, why: "overlap probe" }); }
        if (this.text && this.final && quiet >= OVERLAP_CAND_MS) return out.concat(this.resolve(this.kindOf(this.text), e.t));
        if (this.probedAt !== null && e.t - this.probedAt >= NO_TEXT_RESUME_MS) return out.concat(this.text ? this.resolve(this.kindOf(this.text), e.t) : this.resolve("continuer", e.t));
      } else if (quiet >= 400) {
        // a duck that never became sustained voice: release (today's DUCK_RELEASE behaviour)
        this.resolved = "noise";
        out.push({ do: "unduck", t: e.t });
      }
      return out;
    }
    if (e.type === "partial" || e.type === "final") {
      this.text = e.text;
      if (e.type === "final") this.final = true;
      const t = normText(e.text);
      const toks = t ? t.split(" ") : [];
      if (toks.length >= EARLY_TOKENS && !REPAIR_START.test(t) && !STOP_START.test(t)) {
        if (this.state === "ducked") { this.state = "paused"; this.pausedAt = e.t; out.push({ do: "pause", t: e.t }); }
        return out.concat(this.resolve(this.kindOf(e.text), e.t));
      }
      if (this.final && e.t - this.lastVoiceAt >= OVERLAP_CAND_MS && this.text) {
        if (this.state === "ducked") { this.state = "paused"; this.pausedAt = e.t; out.push({ do: "pause", t: e.t }); }
        return out.concat(this.resolve(this.kindOf(this.text), e.t));
      }
    }
    return out;
  }
}
