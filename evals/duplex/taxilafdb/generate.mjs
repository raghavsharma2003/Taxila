// TaxilaFDB scenario generator (ARCHITECTURE.md v2 §6.1): timed child Hinglish/Hindi/English exchanges for classes 4-7, in
// 12 families, with GOLD LABELS BY CONSTRUCTION. Deterministic (seeded), offline, USD 0. Audio is rendered separately
// (render.mjs: Azure Speech, one SSML synthesis call per child utterance so pre-pause prosody stays inside one phrase).
//
// A scenario is: HER line (the question or an explanation she is speaking) → the child's segments with scripted pauses
// (or an overlap during her line) → optional background overlays. Gold per scenario:
//   pauses[]   one per inter-segment silence, with a class: thinking classes (filler, hesitation, hold_request,
//              word_search, repair_open, mid_explanation, drift_pause) are where a takeover is a CUT-OFF (metric M2);
//              repair / pre_disclosure are complete-looking values followed by more (M1 + M11); question_pause and
//              word_search_long / hold_long are where a listed CUT_IN is allowed (M10)
//   endClass   "respond" (a prompt reply is the human reference) | "either" (explanation without a yield cue: a visibly
//              listening wait of 0.5-2.5 s is acceptable, wait time II) | null (her-floor families)
//   overlap    her-floor families: expected YIELD (barge_in kinds) or KEEP_TALKING (continuer, background, echo)
//   cutIn      the allowed CUT_IN reason and its window
//   distress   the disclosure segment (lines only from the existing S/S2 sets)
// Template families (`tfam`) are the split unit (split.mjs): test template families are never seen in training.
//
//   node evals/duplex/taxilafdb/generate.mjs [--seed 20261004] [--out evals/duplex/taxilafdb/data/scenarios.json]
import fs from "node:fs";
import path from "node:path";
import { rng } from "../streams.mjs";
import * as T from "./topics.mjs";

export const GEN_VERSION = "taxilafdb-gen/2026-10-04";
const HERE = path.dirname(new URL(import.meta.url).pathname);

/** Thinking-pause classes: a floor-taking sound here is a false cut-off (M2). */
export const THINKING = new Set(["filler", "hesitation", "hold_request", "hold_long", "word_search", "repair_open", "mid_explanation", "drift_pause"]);
/** Pause classes where a listed CUT_IN is allowed (not a cut-off when the reason matches). */
export const CUTIN_OK = { question_pause: "question_to_her", word_search_long: "word_search_cue", hold_long: "hold_offer", drift_pause_late: "off_task_drift" };

function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
function ms(r, a, b) { return Math.round(r.u(a, b) / 10) * 10; }
const bandOf = (k) => (k <= 5 ? "B2" : "B3");

/** The engine context the Director would send (seam S6): FORM only, never the key. */
function ctxClosed(item, extra = {}) {
  return {
    exchange: "closed_answer",
    expected: { form: item.form, slots: item.slots || 1, ...(item.units ? { units: item.units } : {}), ...(item.options ? { options: item.options } : {}) },
    questionType: "recall", beat: "check", itemId: item.id, terms: item.terms,
    wt1: { faceMs: 3000, voiceMs: 6000 }, cutIn: { wordSearchCue: "offer", offTaskMs: null },
    allowLexicalBackchannel: false, allowAudioBackchannel: false, weakerLanguage: false, ...extra,
  };
}
function ctxOpen(exchange, extra = {}) {
  return {
    exchange, expected: null, questionType: exchange === "open_explanation" ? "reasoning" : "open", beat: extra.beat ?? null, itemId: extra.itemId ?? null,
    terms: extra.terms ?? [], wt1: { faceMs: 4000, voiceMs: 9000 }, cutIn: { wordSearchCue: "offer", offTaskMs: null },
    allowLexicalBackchannel: false, allowAudioBackchannel: false, weakerLanguage: false, ...extra,
  };
}

let SEQ = 0;
function S(r, o) {
  SEQ++;
  const klass = o.klass ?? 4 + Math.floor(r() * 4);
  return {
    id: `${o.family.toLowerCase()}-${o.tfam.split(".").slice(1).join("-")}-${String(SEQ).padStart(4, "0")}`,
    family: o.family, sub: o.sub, tfam: o.tfam, lang: o.lang ?? "hinglish", klass, band: bandOf(klass), topic: o.topic ?? null,
    ctx: o.ctx, her: o.her, child: o.child ?? null, overlays: o.overlays ?? [], gold: o.gold,
  };
}

/** Child segments → pause classes + end class. */
function pausesOf(segs) {
  return segs.slice(0, -1).map((s, i) => ({ afterSeg: i, ms: s.pauseMs, cls: s.pauseCls }));
}

function askOf(item, lang) { return lang === "en" && item.askEn ? item.askEn : item.ask; }
function sayOf(item, lang, wrong) { return lang === "en" ? (wrong ? item.wrongEn : item.sayEn) ?? item.say : wrong ? item.wrong : item.say; }

// ═══════════════════════════════ F1 closed answers ═══════════════════════════════
function F1(r, out) {
  const closed = T.CLOSED;
  const fluentFam = (it) => ({ integer: "F1.fluent_int", fraction: "F1.fluent_frac", decimal: "F1.fluent_dec_unit", number_unit: "F1.fluent_dec_unit", choice: "F1.fluent_choice_yn", yes_no: "F1.fluent_choice_yn", word: "F1.fluent_word" }[it.form]);
  // fluent (50): every item at least once, right and wrong values (verdict-blind check), some English
  for (let k = 0; k < 50; k++) {
    const it = closed[k % closed.length];
    const lang = k % 7 === 3 ? "en" : "hinglish";
    const wrong = k % 3 === 1;
    out.push(S(r, { family: "F1", sub: "closed_fluent", tfam: fluentFam(it), lang, klass: it.klass, topic: it.id, ctx: ctxClosed(it),
      her: { text: askOf(it, lang), lastAct: it.form === "yes_no" ? "asked_yes_no" : it.form === "choice" ? "asked_choice" : "asked_closed", askedYesNo: it.form === "yes_no" },
      child: { start: { mode: "after_her", gapMs: ms(r, 700, 2600) }, segs: [{ text: sayOf(it, lang, wrong), kind: "answer", value: wrong ? it.wrongV : it.v, pauseMs: 0, contour: "f" }] },
      gold: { endClass: "respond", correct: !wrong, finalValue: wrong ? it.wrongV : it.v } }));
  }
  // value + tail word (15): "बासठ दीदी", "छप्पन होता है", "answer बारह है"
  const tails = [["दीदी", "tail_address"], ["होता है", "tail_verb"], ["है ना", "tail_tag"]];
  for (let k = 0; k < 15; k++) {
    const it = closed.filter((x) => x.form === "integer" || x.form === "fraction")[k % 22];
    if (!it) continue;
    const [tw] = tails[k % 3];
    const wrong = k % 4 === 2;
    out.push(S(r, { family: "F1", sub: "closed_tail", tfam: "F1.tail", klass: it.klass, topic: it.id, ctx: ctxClosed(it), her: { text: it.ask, lastAct: "asked_closed", askedYesNo: false },
      child: { start: { mode: "after_her", gapMs: ms(r, 700, 2400) }, segs: [{ text: `${wrong ? it.wrong : it.say} ${tw}`, kind: "answer", value: wrong ? it.wrongV : it.v, pauseMs: 0, contour: "f" }] },
      gold: { endClass: "respond", correct: !wrong, finalValue: wrong ? it.wrongV : it.v } }));
  }
  // multi-slot (10): "आठ corners [pause] और बारह edges"
  for (let k = 0; k < 10; k++) {
    const it = T.MULTI[k % T.MULTI.length];
    const en = k % 5 === 4;
    const parts = en ? it.partsEn : it.parts;
    const p = ms(r, 400, 1300);
    out.push(S(r, { family: "F1", sub: "closed_multi", tfam: "F1.multi", lang: en ? "en" : "hinglish", klass: it.klass, topic: it.id, ctx: ctxClosed(it),
      her: { text: en ? it.askEn : it.ask, lastAct: "asked_closed", askedYesNo: false },
      child: { start: { mode: "after_her", gapMs: ms(r, 900, 2600) }, segs: [{ text: parts[0], kind: "answer_part", pauseMs: p, pauseCls: "mid_answer_slot", contour: "l" }, { text: parts[1], kind: "answer", value: it.v, pauseMs: 0, contour: "f" }] },
      gold: { endClass: "respond", correct: true, finalValue: it.v } }));
  }
  // hesitant (35): filler or preface before the value
  const prefaces = { hi: ["मुझे लगता है", "उत्तर है", "हम्म मुझे लगता है"], en: ["I think", "the answer is"] };
  for (let k = 0; k < 35; k++) {
    const it = closed.filter((x) => x.form !== "word")[k % 33];
    const en = k % 6 === 5;
    const lang = en ? "en" : "hinglish";
    const mode = k % 3; // 0 filler, 1 preface, 2 filler + filler
    const segs = [];
    let tfam;
    if (mode === 0) { segs.push({ text: pick(r, en ? T.FILLERS.en : T.FILLERS.hi), kind: "filler", pauseMs: ms(r, 500, 1600), pauseCls: "filler", contour: "l" }); tfam = "F1.hes_filler"; }
    else if (mode === 1) { segs.push({ text: pick(r, en ? prefaces.en : prefaces.hi), kind: "preface", pauseMs: ms(r, 600, 1800), pauseCls: "hesitation", contour: "l" }); tfam = "F1.hes_preface"; }
    else {
      segs.push({ text: pick(r, en ? T.FILLERS.en : T.FILLERS.hi), kind: "filler", pauseMs: ms(r, 400, 1200), pauseCls: "filler", contour: "l" });
      segs.push({ text: pick(r, en ? T.FILLERS.en : ["मतलब", "वो", "यानी"]), kind: "filler", pauseMs: ms(r, 500, 1500), pauseCls: "filler", contour: "l" });
      tfam = "F1.hes_double";
    }
    const wrong = k % 3 === 2;
    segs.push({ text: sayOf(it, lang, wrong), kind: "answer", value: wrong ? it.wrongV : it.v, pauseMs: 0, contour: "f" });
    out.push(S(r, { family: "F1", sub: "closed_hesitant", tfam, lang, klass: it.klass, topic: it.id, ctx: ctxClosed(it),
      her: { text: askOf(it, lang), lastAct: it.form === "yes_no" ? "asked_yes_no" : "asked_closed", askedYesNo: it.form === "yes_no" },
      child: { start: { mode: "after_her", gapMs: ms(r, 900, 3200) }, segs }, gold: { endClass: "respond", correct: !wrong, finalValue: wrong ? it.wrongV : it.v } }));
  }
  // self-repair (30): value, pause, [marker], corrected value
  for (let k = 0; k < 30; k++) {
    const it = closed.filter((x) => ["integer", "fraction", "yes_no", "number_unit"].includes(x.form))[k % 30];
    const en = k % 7 === 6;
    const lang = en ? "en" : "hinglish";
    const mode = k % 3; // 0 marker inline with the new value, 1 marker alone then value, 2 bare second value
    const segs = [{ text: sayOf(it, lang, true), kind: "value_wrong", value: it.wrongV, pauseMs: ms(r, 300, 1500), pauseCls: "repair", contour: k % 2 ? "f" : "l" }];
    let tfam;
    const marker = en ? pick(r, T.REPAIRS.en) : pick(r, it.form === "yes_no" ? ["सॉरी", "wait"] : T.REPAIRS.hi);
    if (mode === 0) { segs.push({ text: `${marker} ${sayOf(it, lang, false)}`, kind: "answer", value: it.v, pauseMs: 0, contour: "f" }); tfam = "F1.rep_inline"; }
    else if (mode === 1) {
      segs.push({ text: marker, kind: "repair_marker", pauseMs: ms(r, 300, 1000), pauseCls: "repair_open", contour: "l" });
      segs.push({ text: sayOf(it, lang, false), kind: "answer", value: it.v, pauseMs: 0, contour: "f" });
      tfam = "F1.rep_marker";
    } else { segs.push({ text: sayOf(it, lang, false), kind: "answer", value: it.v, pauseMs: 0, contour: "f" }); tfam = "F1.rep_bare"; }
    out.push(S(r, { family: "F1", sub: "self_repair", tfam, lang, klass: it.klass, topic: it.id, ctx: ctxClosed(it),
      her: { text: askOf(it, lang), lastAct: it.form === "yes_no" ? "asked_yes_no" : "asked_closed", askedYesNo: it.form === "yes_no" },
      child: { start: { mode: "after_her", gapMs: ms(r, 800, 2600) }, segs }, gold: { endClass: "respond", correct: true, finalValue: it.v, repairedFrom: it.wrongV } }));
  }
}

// ═══════════════════════════════ F2 open explanations ═══════════════════════════════
function F2(r, out) {
  for (let k = 0; k < 80; k++) {
    const ex = T.EXPLAIN[k % T.EXPLAIN.length];
    const lang = ex.lang ?? "hinglish";
    const cue = k % 3 === 0; // a final yield cue
    const filler = k % 4 === 1;
    const segs = [];
    ex.chunks.forEach((c, i) => {
      const last = i === ex.chunks.length - 1;
      if (filler && i === 1) segs.push({ text: pick(r, lang === "en" ? T.FILLERS.en : ["उम्म", "मतलब", "वो"]), kind: "filler", pauseMs: ms(r, 500, 1400), pauseCls: "filler", contour: "l" });
      segs.push({ text: last && cue ? `${c} ${lang === "en" ? "that's it" : pick(r, T.YIELD_CUES)}` : c, kind: last && cue ? "explain_end_cue" : "explain_chunk",
        pauseMs: last ? 0 : ms(r, 600, 3000), pauseCls: last ? undefined : "mid_explanation", contour: last ? "f" : "l" });
    });
    const tfam = `F2.${cue ? "cue" : "nocue"}_${ex.subject === "maths" ? "maths" : "sci"}${filler ? "_filler" : ""}`;
    out.push(S(r, { family: "F2", sub: "open_explanation", tfam, lang, klass: ex.klass, topic: ex.id,
      ctx: ctxOpen("open_explanation", { beat: ex.beat, itemId: ex.id, terms: ex.terms }), her: { text: ex.ask, lastAct: "asked_open", askedYesNo: false },
      child: { start: { mode: "after_her", gapMs: ms(r, 1200, 4000) }, segs }, gold: { endClass: cue ? "respond" : "either" } }));
  }
}

// ═══════════════════════════════ F3 questions to her ═══════════════════════════════
function F3(r, out) {
  for (let k = 0; k < 40; k++) {
    const q = T.QUESTIONS[k % T.QUESTIONS.length];
    const mid = k % 2 === 1;
    if (!mid) {
      const lead = k % 6 === 4;
      const segs = lead ? [{ text: "दीदी", kind: "address", pauseMs: ms(r, 300, 700), pauseCls: "hesitation", contour: "l" }, { text: q.q.replace(/^दीदी /, ""), kind: "question", pauseMs: 0, contour: "r" }]
        : [{ text: q.q, kind: "question", pauseMs: 0, contour: "r" }];
      const it = T.CLOSED[k % T.CLOSED.length];
      out.push(S(r, { family: "F3", sub: "question_initial", tfam: lead ? "F3.initial_address" : `F3.initial_${q.lang === "en" ? "en" : "hi"}`, lang: q.lang, topic: it.id,
        ctx: ctxClosed(it), her: { text: it.ask, lastAct: "asked_closed", askedYesNo: false },
        child: { start: { mode: "after_her", gapMs: ms(r, 900, 2800) }, segs }, gold: { endClass: "respond", identity: !!q.identity } }));
    } else {
      const ex = T.EXPLAIN[k % T.EXPLAIN.length];
      const segs = [
        { text: ex.chunks[0], kind: "explain_chunk", pauseMs: ms(r, 500, 1400), pauseCls: "mid_explanation", contour: "l" },
        { text: q.q, kind: "question", pauseMs: ms(r, 700, 1500), pauseCls: "question_pause", contour: "r" },
        { text: k % 4 === 1 ? "मुझे वो समझ नहीं आया" : "मतलब मैं confuse हूँ", kind: "trail", pauseMs: 0, contour: "f" },
      ];
      out.push(S(r, { family: "F3", sub: "question_mid", tfam: `F3.mid_${k % 4 === 1 ? "a" : "b"}`, lang: "hinglish", topic: ex.id,
        ctx: ctxOpen("open_explanation", { beat: ex.beat, itemId: ex.id, terms: ex.terms }), her: { text: ex.ask, lastAct: "asked_open", askedYesNo: false },
        child: { start: { mode: "after_her", gapMs: ms(r, 1200, 3000) }, segs }, gold: { endClass: "respond", identity: !!q.identity, cutIn: { reason: "question_to_her", afterSeg: 1 } } }));
    }
  }
}

// ═══════════════════════════════ F4 chit-chat ═══════════════════════════════
function F4(r, out) {
  for (let k = 0; k < 30; k++) {
    const c = T.CHAT[k % T.CHAT.length];
    const segs = c.reply.map((t, i) => ({ text: t, kind: "chat", pauseMs: i < c.reply.length - 1 ? ms(r, 300, 900) : 0, pauseCls: i < c.reply.length - 1 ? "mid_chat" : undefined, contour: i < c.reply.length - 1 ? "l" : "f" }));
    out.push(S(r, { family: "F4", sub: "chit_chat", tfam: `F4.${c.reply.length > 1 ? "two" : "one"}_${/^[A-Za-z]/.test(c.ask) ? "en" : "hi"}`, lang: /^[A-Za-z]/.test(c.ask) ? "en" : "hinglish",
      ctx: ctxOpen("chit_chat"), her: { text: c.ask, lastAct: "chit_chat", askedYesNo: /है ना\?$/.test(c.ask) },
      child: { start: { mode: "after_her", gapMs: ms(r, 400, 1400) }, segs }, gold: { endClass: "respond" } }));
  }
}

// ═══════════════════════════════ F5 holds and word searches ═══════════════════════════════
function F5(r, out) {
  // hold requests (30), 5 of them long (>= 15 s: the hold_offer moment)
  for (let k = 0; k < 30; k++) {
    const it = T.CLOSED.filter((x) => x.form !== "word")[k % 33];
    const en = k % 6 === 5;
    const long = k % 6 === 2 && k < 30;
    const hold = pick(r, en ? T.HOLDS.en : T.HOLDS.hi);
    const segs = [
      { text: hold, kind: "hold_request", pauseMs: long ? ms(r, 15800, 17500) : ms(r, 2500, 6500), pauseCls: long ? "hold_long" : "hold_request", contour: "l" },
      { text: `${k % 3 === 0 && !en ? "हाँ " : ""}${sayOf(it, en ? "en" : "hinglish", false)}`, kind: "answer", value: it.v, pauseMs: 0, contour: "f" },
    ];
    out.push(S(r, { family: "F5", sub: long ? "hold_long" : "hold_request", tfam: long ? "F5.hold_long" : `F5.hold_${en ? "en" : hold.includes("सोच") ? "think" : "wait"}`, lang: en ? "en" : "hinglish",
      klass: it.klass, topic: it.id, ctx: ctxClosed(it), her: { text: askOf(it, en ? "en" : "hinglish"), lastAct: "asked_closed", askedYesNo: false },
      child: { start: { mode: "after_her", gapMs: ms(r, 800, 2200) }, segs },
      gold: { endClass: "respond", holdRequest: true, ...(long ? { cutIn: { reason: "hold_offer", afterSeg: 0, minSilenceMs: 15000 } } : {}) } }));
  }
  // word searches (20): "वो… क्या कहते हैं…" then the term; long ones allow a cue offer after 1.5 s
  const termItems = [{ term: "denominator", ask: "fraction में नीचे वाले नंबर को क्या कहते हैं?", id: "ws-denominator" }, { term: "evaporation", ask: "पानी भाप बने उसे क्या कहते हैं?", id: "ws-evaporation" },
    { term: "photosynthesis", ask: "पौधे खाना कैसे बनाते हैं, उसका नाम?", id: "ws-photosynthesis" }, { term: "perimeter", ask: "चारों sides का जोड़ क्या कहलाता है?", id: "ws-perimeter" },
    { term: "numerator", ask: "ऊपर वाले नंबर का नाम क्या है?", id: "ws-numerator" }];
  for (let k = 0; k < 20; k++) {
    const t = termItems[k % termItems.length];
    const long = k % 2 === 0;
    const segs = [
      { text: k % 4 === 1 ? "उम्म वो" : "वो", kind: "filler", pauseMs: ms(r, 400, 900), pauseCls: "filler", contour: "l" },
      { text: pick(r, T.WORD_SEARCH.hi), kind: "word_search", pauseMs: long ? ms(r, 2600, 4200) : ms(r, 700, 1300), pauseCls: long ? "word_search_long" : "word_search", contour: "l" },
      { text: `${t.term}${k % 3 === 0 ? " कहते हैं" : ""}`, kind: "term", pauseMs: 0, contour: "f" },
    ];
    out.push(S(r, { family: "F5", sub: long ? "word_search_long" : "word_search", tfam: `F5.ws_${long ? "long" : "short"}`, lang: "hinglish", topic: t.id,
      ctx: ctxClosed({ id: t.id, form: "word", terms: [t.term] }), her: { text: t.ask, lastAct: "asked_closed", askedYesNo: false },
      child: { start: { mode: "after_her", gapMs: ms(r, 900, 2400) }, segs },
      gold: { endClass: "respond", ...(long ? { cutIn: { reason: "word_search_cue", afterSeg: 1, minSilenceMs: 1500 } } : {}) } }));
  }
}

// ═══════════════════════════════ F6 IDK and trouble ═══════════════════════════════
function F6(r, out) {
  for (let k = 0; k < 24; k++) {
    const it = T.CLOSED[k % T.CLOSED.length];
    const en = k % 5 === 4;
    const mode = k % 3; // 0 idk, 1 filler + idk, 2 repeat request (she is silent)
    let segs, tfam;
    if (mode === 2) { segs = [{ text: pick(r, T.REPEAT_REQ), kind: "repeat_request", pauseMs: 0, contour: "r" }]; tfam = "F6.repeat"; }
    else if (mode === 1) { segs = [{ text: en ? "umm" : "उम्म", kind: "filler", pauseMs: ms(r, 600, 1500), pauseCls: "filler", contour: "l" }, { text: pick(r, en ? T.IDK.en : T.IDK.hi), kind: "idk", pauseMs: 0, contour: "f" }]; tfam = "F6.filler_idk"; }
    else { segs = [{ text: pick(r, en ? T.IDK.en : T.IDK.hi), kind: "idk", pauseMs: 0, contour: "f" }]; tfam = `F6.idk_${en ? "en" : "hi"}`; }
    out.push(S(r, { family: "F6", sub: "idk", tfam, lang: en ? "en" : "hinglish", klass: it.klass, topic: it.id, ctx: ctxClosed(it),
      her: { text: askOf(it, en ? "en" : "hinglish"), lastAct: "asked_closed", askedYesNo: it.form === "yes_no" },
      child: { start: { mode: "after_her", gapMs: ms(r, 1000, 3500) }, segs }, gold: { endClass: "respond" } }));
  }
}

// ═══════════════════════════════ F7 barge-ins while she speaks ═══════════════════════════════
function F7(r, out) {
  const plain = T.HER_LONG.filter((h) => !h.yn && !h.asks), yn = T.HER_LONG.filter((h) => h.yn), asks = T.HER_LONG.filter((h) => h.asks);
  for (let k = 0; k < 50; k++) {
    const kind = ["repair", "stop", "turn", "answer", "fold_in"][k % 5];
    let her, text, tfam;
    if (kind === "answer") { her = pick(r, yn); text = pick(r, ["हाँ", "नहीं", "हाँ दीदी", "नहीं दीदी"]); tfam = "F7.answer_yn"; }
    else if (kind === "fold_in") { her = pick(r, asks); text = her.v; tfam = "F7.fold_in"; }
    else { her = pick(r, plain); text = pick(r, T.BARGE[kind]); tfam = `F7.${kind}`; }
    const at = kind === "answer" || kind === "fold_in" ? { kind: "after_question" } : { kind: k % 2 ? "boundary" : "mid" };
    out.push(S(r, { family: "F7", sub: `barge_${kind}`, tfam, lang: "hinglish", ctx: ctxOpen("free"), her: { text: her.text, lastAct: "explaining", askedYesNo: !!her.yn },
      child: { start: { mode: "during_her", at, offsetMs: ms(r, 40, 220) }, segs: [{ text, kind: "barge", pauseMs: 0, contour: kind === "repair" ? "r" : "f" }] },
      gold: { endClass: null, overlap: { expected: "yield", kind } } }));
  }
}

// ═══════════════════════════════ F8 continuers while she speaks ═══════════════════════════════
function F8(r, out) {
  const plain = T.HER_LONG.filter((h) => !h.yn && !h.asks);
  for (let k = 0; k < 36; k++) {
    const her = plain[k % plain.length];
    const boundary = k % 3 !== 2;
    out.push(S(r, { family: "F8", sub: "continuer", tfam: `F8.${boundary ? "boundary" : "mid"}_${k % 2 ? "a" : "b"}`, ctx: ctxOpen("free"), her: { text: her.text, lastAct: "explaining", askedYesNo: false },
      child: { start: { mode: "during_her", at: { kind: boundary ? "boundary" : "mid" }, offsetMs: ms(r, 30, 160) }, segs: [{ text: T.CONTINUERS[k % T.CONTINUERS.length], kind: "continuer", pauseMs: 0, contour: "l" }] },
      gold: { endClass: null, overlap: { expected: "keep_talking", kind: "continuer" } } }));
  }
}

// ═══════════════════════════════ F9 rejection ═══════════════════════════════
function F9(r, out) {
  const plain = T.HER_LONG.filter((h) => !h.yn && !h.asks);
  // (a) during her speech (24): TV, sibling, side-talk, cooker → she keeps talking
  for (let k = 0; k < 24; k++) {
    const kind = ["tv", "sibling", "side_talk", "cooker"][k % 4];
    const her = plain[k % plain.length];
    const ov = kind === "tv" ? { kind, text: pick(r, T.TV_LINES), gainDb: -6 - Math.round(r() * 8) }
      : kind === "sibling" ? { kind, text: pick(r, T.SIBLING_LINES), gainDb: -4 - Math.round(r() * 6) }
      : kind === "side_talk" ? { kind, text: pick(r, T.SIDE_TALK), gainDb: 0 } : { kind, gainDb: -8 - Math.round(r() * 6) };
    out.push(S(r, { family: "F9", sub: `reject_her_${kind}`, tfam: `F9.her_${kind}`, ctx: ctxOpen("free"), her: { text: her.text, lastAct: "explaining", askedYesNo: false },
      child: null, overlays: [{ ...ov, at: { rel: "her", frac: r.u(0.2, 0.6) } }],
      gold: { endClass: null, overlap: { expected: "keep_talking", kind: kind === "side_talk" ? "side_talk" : kind === "cooker" ? "noise" : "background_speech" } } }));
  }
  // (b) during the child's thinking (16): background while she waits, then the child answers → no turn taken on the noise
  for (let k = 0; k < 16; k++) {
    const it = T.CLOSED.filter((x) => x.form === "integer")[k % 17];
    const kind = ["tv", "sibling", "cooker", "tv"][k % 4];
    const ov = kind === "tv" ? { kind, text: pick(r, T.TV_LINES), gainDb: -8 - Math.round(r() * 6) } : kind === "sibling" ? { kind, text: pick(r, T.SIBLING_LINES), gainDb: -6 - Math.round(r() * 6) } : { kind, gainDb: -8 };
    out.push(S(r, { family: "F9", sub: `reject_child_${kind}`, tfam: `F9.child_${kind === "cooker" ? "noise" : "speech"}`, klass: it.klass, topic: it.id, ctx: ctxClosed(it),
      her: { text: it.ask, lastAct: "asked_closed", askedYesNo: false },
      child: { start: { mode: "after_her", gapMs: ms(r, 3800, 5200) }, segs: [{ text: it.say, kind: "answer", value: it.v, pauseMs: 0, contour: "f" }] },
      overlays: [{ ...ov, at: { rel: "handover", ms: ms(r, 600, 1400) } }], gold: { endClass: "respond", backgroundBeforeAnswer: true } }));
  }
}

// ═══════════════════════════════ F10 safety ═══════════════════════════════
function F10(r, out) {
  const D = T.DISTRESS;
  for (let k = 0; k < 21; k++) {
    const d = D[k % D.length];
    const mode = k % 3; // 0 after a value, 1 after a filler pause, 2 during her speech
    const it = T.CLOSED.filter((x) => x.form === "integer")[k % 17];
    if (mode === 2) {
      const her = T.HER_LONG[k % 8];
      out.push(S(r, { family: "F10", sub: "safety_during_her", tfam: "F10.during_her", ctx: ctxOpen("free"), her: { text: her.text, lastAct: "explaining", askedYesNo: false },
        child: { start: { mode: "during_her", at: { kind: "boundary" }, offsetMs: ms(r, 60, 200) }, segs: [{ text: d.text, kind: "distress", pauseMs: 0, contour: "f" }] },
        gold: { endClass: null, distressSeg: 0, distressKind: d.kind, overlap: { expected: "yield", kind: "safety" } } }));
      continue;
    }
    const segs = mode === 0
      ? [{ text: it.say, kind: "answer", value: it.v, pauseMs: ms(r, 300, 900), pauseCls: "pre_disclosure", contour: "l" }, { text: d.text, kind: "distress", pauseMs: 0, contour: "f" }]
      : [{ text: "पता नहीं", kind: "idk_pre", pauseMs: ms(r, 900, 1800), pauseCls: "pre_disclosure", contour: "f" }, { text: d.text, kind: "distress", pauseMs: 0, contour: "f" }];
    out.push(S(r, { family: "F10", sub: mode === 0 ? "safety_after_value" : "safety_after_pause", tfam: mode === 0 ? "F10.after_value" : "F10.after_pause", klass: it.klass, topic: it.id,
      ctx: ctxClosed(it), her: { text: it.ask, lastAct: "asked_closed", askedYesNo: false },
      child: { start: { mode: "after_her", gapMs: ms(r, 900, 2400) }, segs }, gold: { endClass: null, distressSeg: 1, distressKind: d.kind } }));
  }
  // benign controls (3): the same sets' benign rows; must NOT enter safety_attend
  for (let k = 0; k < 3; k++) {
    out.push(S(r, { family: "F10", sub: "safety_benign", tfam: "F10.benign", ctx: ctxOpen("chit_chat"), her: { text: "कैसा लगा ये सवाल?", lastAct: "chit_chat", askedYesNo: false },
      child: { start: { mode: "after_her", gapMs: ms(r, 600, 1500) }, segs: [{ text: T.DISTRESS_BENIGN[k], kind: "chat", pauseMs: 0, contour: "f" }] }, gold: { endClass: "respond", benignControl: true } }));
  }
}

// ═══════════════════════════════ F11 off-task drift ═══════════════════════════════
function F11(r, out) {
  for (let k = 0; k < 16; k++) {
    const chunks = T.DRIFT[k % T.DRIFT.length];
    const it = T.CLOSED[k % T.CLOSED.length];
    const klass = k % 2 ? 5 : 6;
    const n = 6 + (k % 4);
    const segs = chunks.slice(0, n).map((c, i) => ({ text: c, kind: "drift", pauseMs: i < n - 1 ? ms(r, 300, 900) : 0, pauseCls: i < n - 1 ? "drift_pause" : undefined, contour: i < n - 1 ? (i % 2 ? "f" : "l") : "f" }));
    out.push(S(r, { family: "F11", sub: "off_task", tfam: `F11.drift_${k % 4}`, lang: k % 4 === 3 ? "en" : "hinglish", klass, topic: it.id, ctx: ctxClosed(it),
      her: { text: it.ask, lastAct: "asked_closed", askedYesNo: false },
      child: { start: { mode: "after_her", gapMs: ms(r, 900, 2000) }, segs }, gold: { endClass: "respond", cutIn: { reason: "off_task_drift", minOffTaskMs: klass <= 5 ? 20000 : 30000 } } }));
  }
}

// ═══════════════════════════════ F12 echo ═══════════════════════════════
function F12(r, out) {
  for (let k = 0; k < 30; k++) {
    const her = T.HER_LONG[k % T.HER_LONG.length];
    const level = [-10, -20, -30][k % 3];
    out.push(S(r, { family: "F12", sub: `echo_${-level}`, tfam: `F12.echo_${-level}`, ctx: ctxOpen("free"), her: { text: her.text, lastAct: her.yn ? "asked_yes_no" : "explaining", askedYesNo: !!her.yn },
      child: null, overlays: [], gold: { endClass: null, echoDb: level, overlap: { expected: "keep_talking", kind: "echo" } } }));
  }
}

export function generate(seed = 20261004) {
  SEQ = 0;
  const r = rng(seed);
  const out = [];
  for (const f of [F1, F2, F3, F4, F5, F6, F7, F8, F9, F10, F11, F12]) f(r, out);
  for (const sc of out) {
    if (sc.child) sc.gold.pauses = pausesOf(sc.child.segs);
    // the off-task clock needs the item terms (host-side; seam S6 would carry them)
    sc.gold.thinkingPauses = (sc.gold.pauses || []).filter((p) => THINKING.has(p.cls)).length;
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
  const seed = Number(arg("--seed", 20261004));
  const file = arg("--out", path.join(HERE, "data", "scenarios.json"));
  const sc = generate(seed);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ version: GEN_VERSION, seed, n: sc.length, scenarios: sc }, null, 0));
  const byF = {};
  for (const s of sc) byF[s.family] = (byF[s.family] || 0) + 1;
  console.log(`${sc.length} scenarios`, byF, `pauses ${sc.reduce((a, s) => a + (s.gold.pauses?.length || 0), 0)} (thinking ${sc.reduce((a, s) => a + s.gold.thinkingPauses, 0)})`);
  console.log(`→ ${path.relative(process.cwd(), file)}`);
}
