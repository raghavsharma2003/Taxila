// turn-markers.mjs — Study C (turn-taking science and children), measurement M-C1, 2026-10-04.
//
// Question: the client's end-of-turn heuristic (`src/lesson/turnModel.ts textCompleteness/endThreshold/holdMsFor`, behind
// `turn.predictive`, default OFF) and the barge-in backchannel test (`src/lesson/cascadeLink.ts isBackchannel`) encode a
// theory of which words HOLD the floor and which YIELD it. Does that theory match (a) the discourse-marker evidence
// (Jabeen et al. 2022: Urdu/Hindi fillers occur turn-initially or medially, never turn-finally; Bona 2023: 92% of
// 9-year-olds' filled pauses are within-turn; O'Reilly-Brown: clause-final "na" is an agreement-seeking tag), and (b) the
// way our production STT actually spells those words?
//
// Method (deterministic, no model calls, no network). Imports the REAL shipped source (Node 22 type stripping):
//   F  filler fragments:   every transcript of the 5 hesitant stimuli (d01-d05) from the 2026-10-04 STT refresh rows,
//                          production arm D4 (gpt-live-transcribe kw+prompt) and S0 (MAI-Transcribe-2-Streaming), all
//                          noise conditions; the leading segment up to the first ASR punctuation mark IF its first token is
//                          a filler. Truth: HOLD (each such clip continues with the answer). This is what the child's FIRST
//                          fragment would be if she paused after the filler long enough for the 500 ms candidate endpoint.
//   P  punctuated prefixes: every transcript of all 30 stimuli (same arms), cut at each internal ASR punctuation mark
//                          (ASR punctuates where it hears a prosodic break, so these approximate real pause points).
//                          Truth: HOLD (the utterance continues).
//   U  full utterances:    every complete transcript. Truth: YIELD (the clip ends there).
//   M  marker probes:      a hand-authored set of short fragments whose floor function is given by the literature
//                          (labels are the doc's, not measured on children): explicit hold requests, turn-initial prefaces,
//                          fillers in both scripts, yield markers. Reported per item.
//   B  backchannel audit:  isBackchannel() on lone answers and repair requests that may arrive while she is speaking.
// Contexts: the four the scorer distinguishes — number answer, default, probe, explanation (teachback).
// "send" = the fragment would be committed as the child's whole turn (score >= threshold, or the context holds 0 ms).
// Limits: synthetic TTS child clips (no real children yet: E1 pending); text only (no prosody — the rising "haan?" and the
//         flat "haan" are the same string here, which is itself a finding); ASR punctuation is a proxy for pause location.
// Output: evals/duplex/results/turn-markers-2026-10-04.json (+ printed tables).
import fs from "node:fs";
import path from "node:path";
import { textCompleteness, endThreshold, holdMsFor, PREDICTIVE_SILENCE_MS } from "../../src/lesson/turnModel.ts";
import { isBackchannel } from "../../src/lesson/cascadeLink.ts";
import { policyDecide, overlapKind } from "../../src/duplex/turnPolicy.ts";
import { STIMULI } from "../../docs/research/voice/v2/stt/stimuli.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROWS = path.join(HERE, "../model-refresh-2026-10-04/stt/results/rows-2026-10-04.json");
const OUT = path.join(HERE, "results/turn-markers-2026-10-04.json");
const CFGS = ["D4 live-tx kw+prompt (CURRENT)", "S0 MAI-Tx-2-Streaming nohint"];

const CONTEXTS = {
  number: { answerForm: "number" },
  default: {},
  probe: { beat: "probe" },
  explain: { beat: "teachback" },
};

const shipped = (text, ctx) => {
  const score = textCompleteness(text, ctx);
  const thr = endThreshold(ctx);
  const hold = holdMsFor(ctx);
  const send = hold === 0 || score >= thr;
  // silence the child gets before the fragment is committed (candidate endpoint + hold window if held)
  const allowMs = PREDICTIVE_SILENCE_MS + (send ? 0 : hold);
  return { score, thr, hold, send, allowMs };
};
const candidate = (text, ctx) => {
  const d = policyDecide(text, ctx);
  return { score: d.p, cue: d.cue, send: d.send, hold: d.holdMs, allowMs: PREDICTIVE_SILENCE_MS + (d.send ? 0 : d.holdMs) };
};
const ARMS = { shipped, candidate };
let decide = shipped;

// filler spellings: Latin and Devanagari (plus whatever the ASR invents; we detect by shape, then list what we saw)
const FILLER_RE = /^(?:u+m+|u+h+|h+m+|m+|a+m+|e+r*m+|उ+म्*म*ा?|अ+म्*म*|अं|आम|ओम|हम्*म*ा?|हूँ|ام|vol)$/iu;
const firstSeg = (t) => String(t).split(/[।.,?!\n]/u)[0].trim();
const tok = (t) => String(t).toLowerCase().split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean);

const allRows = JSON.parse(fs.readFileSync(ROWS, "utf8")).filter((r) => r.text && String(r.text).trim());
const ids = new Set(STIMULI.map((s) => s.id));
// dev = the two production arms the candidate lexicon was written against; test = every other STT config in the same
// refresh (spellings the candidate never saw).
const DEV = (r) => CFGS.includes(r.cfg);
const TEST = (r) => !CFGS.includes(r.cfg);

function buildSets(filter) {
  const speechRows = allRows.filter((r) => ids.has(r.id) && filter(r));
  const F = [], P = [], U = [];
  const spellings = {};
  for (const r of speechRows.filter((r) => /^d0/.test(r.id))) {
    const seg = firstSeg(r.text);
    const words = tok(seg);
    if (!words.length || !FILLER_RE.test(words[0])) continue;
    const mark = String(r.text).slice(seg.length).trim().charAt(0) || "";
    const frag = words[0] + (/[।.?,]/u.test(mark) ? mark : "");
    spellings[words[0]] = (spellings[words[0]] ?? 0) + 1;
    F.push({ id: r.id, cfg: r.cfg.slice(0, 3), arm: r.arm, frag });
  }
  for (const r of speechRows) {
    const t = String(r.text).replace(/\s+/g, " ").trim();
    U.push({ id: r.id, cfg: r.cfg.slice(0, 3), arm: r.arm, text: t });
    const re = /[।.,?!](?=\s*\S)/gu;
    let m;
    while ((m = re.exec(t))) {
      const prefix = t.slice(0, m.index + 1).trim();
      if (tok(prefix).length) P.push({ id: r.id, cfg: r.cfg.slice(0, 3), arm: r.arm, text: prefix, lastMark: m[0] });
    }
  }
  return { n: speechRows.length, F, P, U, spellings };
}
const sets = { dev: buildSets(DEV), test: buildSets(TEST) };

function table(items, field, truth) {
  const out = {};
  for (const [name, ctx] of Object.entries(CONTEXTS)) {
    let wrong = 0, addMs = 0;
    for (const it of items) {
      const d = decide(it[field], ctx);
      if (truth === "HOLD" && d.send) wrong++;
      if (truth === "YIELD" && !d.send) { wrong++; addMs += d.hold; }
    }
    out[name] = { n: items.length, wrong, rate: +(wrong / Math.max(1, items.length)).toFixed(3), ...(truth === "YIELD" ? { meanAddedMs: Math.round(addMs / Math.max(1, items.length)) } : {}) };
  }
  return out;
}

// ---------- M: marker probes (labels from the literature, see TURN-TAKING-CHILDREN.md §6) ----------
const M = [
  // explicit requests for time: HOLD
  ["ek minute", "HOLD", "explicit hold request"], ["एक मिनट", "HOLD", "explicit hold request"],
  ["ruko", "HOLD", "explicit hold request"], ["रुको", "HOLD", "explicit hold request"],
  ["soch raha hoon", "HOLD", "explicit hold request"], ["सोच रही हूँ", "HOLD", "explicit hold request"],
  ["सोचने दो", "HOLD", "explicit hold request"], ["wait", "HOLD", "explicit hold request"],
  ["let me think", "HOLD", "explicit hold request"],
  // turn-initial prefaces / time-gaining starters: HOLD
  ["haan toh", "HOLD", "preface"], ["हाँ तो", "HOLD", "preface"], ["matlab", "HOLD", "preface/reformulation"],
  ["मतलब", "HOLD", "preface/reformulation"], ["woh", "HOLD", "preface/word search"], ["वो", "HOLD", "preface/word search"],
  ["वो जो", "HOLD", "word search"], ["kya bolte hain", "HOLD", "word search"], ["क्या कहते हैं", "HOLD", "word search"],
  ["jaise ki", "HOLD", "projects continuation"], ["मुझे लगता है", "HOLD", "projects a complement"],
  ["answer hai", "HOLD", "projects a value"], ["उत्तर है", "HOLD", "projects a value"],
  // fillers as the ASR spells them (spellings observed in the 2026-10-04 rows): HOLD
  ["उम्म।", "HOLD", "filler"], ["उम", "HOLD", "filler"], ["अं", "HOLD", "filler"], ["हम्म", "HOLD", "filler"],
  ["umm", "HOLD", "filler"], ["Um.", "HOLD", "filler"],
  // yield markers: YIELD
  ["दो बटा चार और एक बटा दो same होते हैं ना", "YIELD", "clause-final na tag"], ["same hai na?", "YIELD", "tag question"],
  ["bas", "YIELD", "closure"], ["बस इतना ही", "YIELD", "closure"], ["that's it", "YIELD", "closure"],
  ["pata nahi", "YIELD", "IDK"], ["मुझे नहीं पता", "YIELD", "IDK"], ["समझ नहीं आया", "YIELD", "trouble claim"],
  ["phir se bolo", "YIELD", "repair request"], ["पंद्रह", "YIELD", "bare value"], ["haan", "YIELD", "yes answer"],
];
function markerResults() {
  return M.map(([text, truth, fn]) => {
    const per = {};
    for (const [name, ctx] of Object.entries(CONTEXTS)) {
      const d = decide(text, ctx);
      per[name] = { score: d.score, send: d.send, allowMs: d.allowMs, ok: truth === "HOLD" ? !d.send : d.send };
    }
    return { text, truth, fn, per };
  });
}
const markerSummary = (Mres) => Object.fromEntries(Object.keys(CONTEXTS).map((c) => [c, {
  holdHonoured: Mres.filter((m) => m.truth === "HOLD" && m.per[c].ok).length, holdItems: Mres.filter((m) => m.truth === "HOLD").length,
  yieldHonoured: Mres.filter((m) => m.truth === "YIELD" && m.per[c].ok).length, yieldItems: Mres.filter((m) => m.truth === "YIELD").length,
}]));

// ---------- B: overlap while she speaks (>= 1 s of her reply left) ----------
// expect: what a teacher should do. "resume" = keep talking (continuer); "stop" = yield the floor (answer, repair, stop, turn).
const Bitems = [
  ["haan", "resume", "continuer when she asked nothing (flat haan, Bali 2009)", false],
  ["haan", "stop", "answer when she just asked a yes/no check", true],
  ["हाँ", "stop", "answer to her yes/no check, Devanagari", true],
  ["haan?", "stop", "rising haan = repair request (Bali 2009)", false], ["हाँ?", "stop", "same, Devanagari", false],
  ["achha", "resume", "receipt / continuer", false], ["ok", "resume", "continuer", false], ["hmm", "resume", "continuer", false],
  ["theek hai", "resume", "continuer (multi-word)", false], ["ji", "resume", "continuer / polite yes", false],
  ["nahi", "stop", "disagreement", false], ["नहीं", "stop", "answer to her yes/no check", true],
  ["kya?", "stop", "repair request", false], ["क्या?", "stop", "repair request", false],
  ["ruko", "stop", "stop request", false], ["ek minute", "stop", "hold request", false],
];
const B = Bitems.map(([text, expect, note, askedYesNo]) => {
  const shippedResume = isBackchannel(text, 0.9);
  const kind = overlapKind(text, { askedYesNo });
  const candidateResume = kind === "continuer";
  return { text, askedYesNo, expect, note, shipped: shippedResume ? "resume" : "stop", candidate: candidateResume ? "resume" : "stop", candidateKind: kind };
});
const bScore = (arm) => B.filter((b) => b[arm] === b.expect).length;

// ---------- run both arms on dev and test ----------
const res = {
  measurement: "M-C1 turn-markers",
  date: "2026-10-04",
  method: "deterministic replay of the shipped scorer (turnModel.ts) and the Study C candidate (src/duplex/turnPolicy.ts) over STT transcripts of the 30 stimuli from the 2026-10-04 refresh rows (dev = D4 + S0, the arms the candidate lexicon was written against; test = the other 18 configs), plus an authored marker set and an overlap set; see header",
  sources: { rows: path.relative(path.join(HERE, "../.."), ROWS), devCfgs: CFGS },
  splits: {},
  markers: {},
  overlap: { items: B, shippedCorrect: bScore("shipped"), candidateCorrect: bScore("candidate"), n: B.length },
};
for (const [armName, fn] of Object.entries(ARMS)) {
  decide = fn;
  for (const [split, S] of Object.entries(sets)) {
    res.splits[split] ??= { rows: S.n, spellings: S.spellings, nF: S.F.length, nP: S.P.length, nU: S.U.length, qPrefixes: S.P.filter((p) => p.lastMark === "?").length };
    res.splits[split][armName] = { F_fillerSent: table(S.F, "frag", "HOLD"), P_prematureSend: table(S.P, "text", "HOLD"), U_late: table(S.U, "text", "YIELD") };
  }
  const Mres = markerResults();
  res.markers[armName] = { summary: markerSummary(Mres), failuresDefault: Mres.filter((m) => !m.per.default.ok).map((m) => ({ text: m.text, truth: m.truth, fn: m.fn, score: m.per.default.score })), items: Mres };
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(res, null, 1));

const pct = (v) => `${String(v.wrong).padStart(3)}/${String(v.n).padEnd(4)} ${(v.rate * 100).toFixed(1).padStart(5)}%`;
console.log(`M-C1 turn-markers ${res.date}`);
for (const [split, R] of Object.entries(res.splits)) {
  console.log(`\n== ${split}: rows ${R.rows}; filler fragments ${R.nF}; punctuated prefixes ${R.nP} ('?' ${R.qPrefixes}); full ${R.nU}`);
  console.log(`   spellings: ${JSON.stringify(R.spellings)}`);
  for (const metric of ["F_fillerSent", "P_prematureSend", "U_late"]) {
    console.log(`   ${metric}`);
    for (const c of Object.keys(CONTEXTS)) {
      const a = R.shipped[metric][c], b = R.candidate[metric][c];
      const extra = metric === "U_late" ? `  (+${a.meanAddedMs} / +${b.meanAddedMs} ms mean)` : "";
      console.log(`     ${c.padEnd(8)} shipped ${pct(a)}   candidate ${pct(b)}${extra}`);
    }
  }
}
console.log(`\n== markers (authored; literature labels)`);
for (const c of Object.keys(CONTEXTS)) {
  const a = res.markers.shipped.summary[c], b = res.markers.candidate.summary[c];
  console.log(`   ${c.padEnd(8)} HOLD shipped ${a.holdHonoured}/${a.holdItems} cand ${b.holdHonoured}/${b.holdItems}   YIELD shipped ${a.yieldHonoured}/${a.yieldItems} cand ${b.yieldHonoured}/${b.yieldItems}`);
}
console.log(`   shipped failures (default): ${res.markers.shipped.failuresDefault.map((f) => f.text).join(" | ")}`);
console.log(`   candidate failures (default): ${res.markers.candidate.failuresDefault.map((f) => f.text).join(" | ") || "none"}`);
console.log(`\n== overlap while she speaks: shipped ${res.overlap.shippedCorrect}/${B.length}, candidate ${res.overlap.candidateCorrect}/${B.length}`);
for (const b of B) console.log(`   ${b.text.padEnd(10)} yesno=${String(b.askedYesNo).padEnd(5)} expect ${b.expect.padEnd(6)} shipped ${b.shipped.padEnd(6)} cand ${b.candidate.padEnd(6)} (${b.candidateKind}) — ${b.note}`);
console.log(`\nwrote ${path.relative(process.cwd(), OUT)}`);
