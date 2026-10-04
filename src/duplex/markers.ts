/**
 * LexicalMarkers for the engine tick (ARCHITECTURE.md v2 §2.3, §2.5.1-§2.5.3): code features on the echo-subtracted turn
 * text, recomputed on every transcript change (µs; no model). Sources, each imported, never copied:
 *   - server/duplex/understand.js (the duplex prototype's slice note: hold tail, repair, asks, IDK, word search, stop,
 *     projection, the Study C cue via src/duplex/turnPolicy.ts) — the SAME module the server slice runs;
 *   - src/duplex/form.ts readForm (the expected-answer grammar: FormState, values, repairOpen / repaired on values).
 * Order matters (M-D6 h01): the hold lexicon is read before the value grammar, so "एक मिनट" first visible as "एक" is
 * never a value once the hold tail lands.
 *
 * Verdict-blind: the context carries the answer FORM only. Values are read for STABILITY (the verdict clock), never graded.
 * Erasable TypeScript.
 */
import { understand, normText } from "../../server/duplex/understand.js";
import { readForm, type FormRead } from "./form.ts";
import type { EngineContext, LexicalMarkers, Ms, SemanticEstimate } from "./engine.ts";
import type { CueClass } from "./turnPolicy.ts";

const REPEAT = /(?:^|\s)(?:फिर से|phir se|दोबारा|dobara|kya bola|क्या बोला|kya kaha|क्या कहा|repeat|say (?:it )?again|once more)(?:\s|$)|^(?:क्या|kya|what|sorry|huh|हैं)$/u;
const QWORDS = /(?:^|\s)(?:क्या|kya|क्यों|kyun|kyon|कैसे|kaise|कौन|kaun|कब|kab|कहाँ|कहां|kahan|कितना|कितने|kitna|kitne|what|why|how|which|who|when|where|can|could|is it|are you|आप)(?=\s|$)/u;
const DEVANAGARI = /[ऀ-ॿ]/u;
const LATIN = /[a-z]/i;

const FORM_ANSWER: Record<string, string> = {
  integer: "number", decimal: "number", fraction: "number", number_unit: "number", choice: "choice", yes_no: "yesno",
};

export interface MarkerRead {
  markers: LexicalMarkers;
  form: FormRead;
  /** The text the markers were read on (hold-stripped tail is internal). */
  text: string;
  distress: { distress: boolean; kind: "self_harm" | "abuse" | "fear" | null };
}

/** Stateful across ticks: the value-stability clock and the off-task clock live here. */
export class MarkerTracker {
  private lastText = "";
  private lastRead: MarkerRead | null = null;
  private lastValueKey: string | null = null;
  private lastValueSeenAt: Ms | null = null;
  private offTaskSince: Ms | null = null;

  beginTurn(): void {
    this.lastText = "";
    this.lastRead = null;
    this.lastValueKey = null;
    this.lastValueSeenAt = null;
    this.offTaskSince = null;
  }

  /**
   * @param text echo-subtracted turn text
   * @param ctx the Director's engine context (form only)
   * @param t now
   * @param lastValueAudioEnd audio time the newest value ended (the host's best estimate), for the verdict clock
   * @param semantic the latest semantic estimate (off-task / asks-her reads), or null
   * @param childTalking the child voiced in the last tick (off-task drift accumulates only over child talk)
   */
  read(text: string, ctx: EngineContext, t: Ms, lastValueAudioEnd: Ms | null, semantic: SemanticEstimate | null, childTalking: boolean): MarkerRead {
    const same = text === this.lastText && this.lastRead !== null;
    const base = same ? (this.lastRead as MarkerRead) : this.compute(text, ctx);
    this.lastText = text;
    this.lastRead = base;
    // the verdict-stability clock: restarts whenever the last value (or its position) changes
    const key = base.form.lastValue !== null ? `${base.form.lastValue}@${base.form.values.length}` : null;
    if (key !== this.lastValueKey) {
      this.lastValueKey = key;
      this.lastValueSeenAt = key === null ? null : (lastValueAudioEnd ?? t);
    }
    const lastValueAgeMs = this.lastValueSeenAt === null ? null : Math.max(0, t - this.lastValueSeenAt);
    // off-task drift: only on a fresh semantic read that says so, and only while the child keeps talking
    const offTask = !!semantic && (semantic.offTask ?? 0) >= 0.7;
    if (offTask && childTalking) this.offTaskSince ??= t;
    else if (!offTask) this.offTaskSince = null;
    const offTaskMs = this.offTaskSince === null ? 0 : t - this.offTaskSince;
    return { ...base, markers: { ...base.markers, lastValueAgeMs, offTaskMs } };
  }

  private compute(text: string, ctx: EngineContext): MarkerRead {
    const answerForm = ctx.expected ? FORM_ANSWER[ctx.expected.form] : undefined;
    const beat = ctx.beat ?? undefined;
    const n = understand(text, { answerForm, beat });
    // the hold lexicon first: a hold-request tail means no value reading of the words before it
    // and after a granted hold only the words AFTER it are the answer ("एक मिनट … बारह" is 12, not the list 1, 12)
    const formText = n.holdTail ? "" : n.tailText;
    const form = readForm(formText, ctx.expected);
    const t = normText(text);
    const toks = t ? t.split(" ") : [];
    const last2 = toks.slice(-2);
    // the form grammar reads numerals in every script (understand.js's list is partial: "बासठ" read as "plain", p 0.75):
    // a COMPLETE answer of the asked form is a value cue whatever the shorter lexicon thought
    const formValue = !n.holdTail && form.state === "complete" && form.lastValue !== null;
    const cue = (n.holdTail ? "hold_request" : formValue ? "value" : n.lex.cue === "projection" ? "open" : n.lex.cue) as CueClass;
    const asks = n.asks;
    const qMark = /[?？]\s*$/.test(text.trim());
    const questionComplete = asks && (qMark || (QWORDS.test(t) && (n.lex.cue === "verb_final" || n.lex.cue === "yield" || n.lex.cue === "plain")));
    // the ASR's question mark is the child's own closing intonation: "matlab?" is a question, not the filler "matlab…" (M-D7 f08)
    const closedByQuestion = asks && qMark;
    const codeSwitchAtEdge = last2.length === 2 && ((DEVANAGARI.test(last2[0]) && LATIN.test(last2[1])) || (LATIN.test(last2[0]) && DEVANAGARI.test(last2[1])))
      && n.lex.cue !== "verb_final" && n.lex.cue !== "value" && n.lex.cue !== "yield";
    const markers: LexicalMarkers = {
      cue,
      lexP: formValue ? Math.max(n.lex.p, 0.95) : closedByQuestion ? Math.max(n.lex.p, 0.85) : n.lex.p,
      form: form.state,
      values: form.values.length ? form.values : n.values,
      lastValueAgeMs: null,
      holdRequest: n.holdTail,
      fillerTail: n.lex.cue === "filler" && !closedByQuestion,
      openTail: n.lex.cue === "open" && !closedByQuestion,
      projection: n.lex.cue === "projection",
      wordSearch: n.wordSearch,
      // closed forms: the form grammar reads values in every script (understand.js's number list is partial and has no
      // yes/no values); open contexts: understand.js's repair shapes
      repairOpen: ctx.expected && ctx.expected.form !== "open" ? form.repairOpen : n.repairOpen,
      repaired: ctx.expected && ctx.expected.form !== "open" ? form.repaired : n.repaired,
      yieldTag: n.lex.cue === "yield" && !n.idk,
      idk: n.idk,
      asks,
      questionComplete,
      stopRequest: n.stop,
      repeatRequest: REPEAT.test(t) && toks.length <= 4,
      codeSwitchAtEdge,
      offTaskMs: 0,
    };
    return { markers, form, text, distress: n.safety };
  }
}
