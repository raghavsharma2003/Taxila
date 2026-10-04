// Barge-in and overlap repair (ARCHITECTURE.md §3.5): today's pause-then-decide (`cascade-barge-pause-decide`) with the
// transcript class decided as soon as the words allow, and a playback-anchored heardUpTo on every yield. Pure, browser-safe.
//
//   acoustic gate:   onset -> duck (EnergyVad ~90 ms); sustained voice (EnergyVad "sustain") -> pause.
//   early class:     >= 3 partial tokens that are not a repair/stop shape -> it is a real turn: yield now.
//   class at a stop: the child goes quiet for OVERLAP_CAND_MS -> overlapKind(text) (Study C, 16/16 on M-C1) decides:
//                    continuer -> resume from the last word gap; repair -> repeat_from(heardUpTo), shorter and slower;
//                    stop -> yield and hold; answer / turn -> yield, the words are the child's turn.
//   no words:        quiet for NO_TEXT_RESUME_MS with no transcript -> resume (cough, noise, her own echo).
import { overlapKind } from "../../src/duplex/turnPolicy.ts";
import { normText } from "./understand.js";

export const OVERLAP_CAND_MS = 300;
export const NO_TEXT_RESUME_MS = 1200;
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
  /** @param {{ text:string, startedAt:number, msPerChar:number, askedYesNo?:boolean, responseId?:string }} reply */
  constructor(reply, onsetAt) {
    this.reply = reply;
    this.onsetAt = onsetAt;
    this.state = "ducked";
    this.text = "";
    this.lastVoiceAt = onsetAt;
    this.resolved = null;
    this.pausedAt = null;
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
        if (this.text && quiet >= OVERLAP_CAND_MS) return out.concat(this.resolve(overlapKind(this.text, { askedYesNo: !!this.reply.askedYesNo }), e.t));
        if (!this.text && quiet >= NO_TEXT_RESUME_MS) return out.concat(this.resolve("continuer", e.t));
      } else if (quiet >= 400) {
        // a duck that never became sustained voice: release (today's DUCK_RELEASE behaviour)
        this.resolved = "noise";
        out.push({ do: "unduck", t: e.t });
      }
      return out;
    }
    if (e.type === "partial" || e.type === "final") {
      this.text = e.text;
      const t = normText(e.text);
      const toks = t ? t.split(" ") : [];
      if (toks.length >= EARLY_TOKENS && !REPAIR_START.test(t) && !STOP_START.test(t)) {
        if (this.state === "ducked") { this.state = "paused"; this.pausedAt = e.t; out.push({ do: "pause", t: e.t }); }
        return out.concat(this.resolve("turn", e.t));
      }
    }
    return out;
  }
}
