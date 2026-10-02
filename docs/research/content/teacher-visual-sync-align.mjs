// teacher-visual-sync-align.mjs — ground-truth word times for the turns recorded by teacher-visual-sync-probe.mjs,
// then scores the estimators the whiteboard/pointer scheduler could use to place a board write at the moment the
// teacher SAYS the thing (teacher-visual.md §5).
//   ground truth: Azure Speech fast transcription (word offsets), same Foundry resource, locales en-IN + hi-IN.
//   anchors:      digit runs ("3", "4", "180") — script-neutral, so they match across the Roman transcript and the
//                 Devanagari STT output. Matched in order by LCS.
//   estimators:   P  proportional by characters over the KNOWN audio duration (upper bound; WS lane / cached audio)
//                 S  proportional by spoken units (syllable proxy + number length + punctuation pauses), known duration
//                 R  units / rate, rate fitted leave-one-turn-out (the live WebRTC case: duration unknown)
//                 Q  CAUSAL live estimator: R, re-anchored at the speech onset after the last punctuation pause that
//                    precedes the anchor, found in the audio envelope (20 ms RMS frames, silence >= 140 ms). This is
//                    what the client can compute from the level tap it already has (src/lesson/level.ts).
//                 L  LIVE hybrid: R until response.done arrives, then S with D = usage.output_token_details.audio_tokens
//                    × 50 ms (measured exact: 20 audio tokens per second of audio). response.done arrives seconds
//                    before playback ends because generation outruns real time. Done time ≈ the last recorded event.
//                 Y  CAUSAL live estimator: syllable-nucleus tracking (de Jong & Wempe 2009 style): count intensity
//                    peaks in the played audio and fire when the count reaches the text-syllable count before the
//                    anchor × (nuclei/syllable ratio, fitted leave-one-turn-out). Params (w=2, gap=130 ms, floor=25 dB)
//                    were picked by a 72-cell grid ON THIS SAME DATA, so Y is optimistic by an unknown amount.
//   lead:         playTime(anchor) − arrival time of the transcript delta that contained it (WS-paced audio, playback
//                 assumed to start at the first audio delta).
// Never prints keys. Usage: node teacher-visual-sync-align.mjs <probeOutDir> <result.json>
import fs from "node:fs";
import path from "node:path";

const DIR = process.argv[2]; const OUTF = process.argv[3] || "teacher-visual-sync-result.json";
const KEY = process.env.AZURE_OPENAI_API_KEY;
const BASE = (process.env.AZURE_OPENAI_ENDPOINT || "").replace(/\/+$/, "").replace(/\/openai\/v1$/, "");
const SPEECH = BASE.replace(".openai.azure.com", ".cognitiveservices.azure.com");

function wav(pcm) {
  const h = Buffer.alloc(44); h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(24000, 24); h.writeUInt32LE(48000, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40); return Buffer.concat([h, pcm]);
}
async function stt(name) {
  const cache = path.join(DIR, `${name}.stt.json`);
  if (fs.existsSync(cache)) return JSON.parse(fs.readFileSync(cache, "utf8"));
  const fd = new FormData();
  fd.append("audio", new Blob([wav(fs.readFileSync(path.join(DIR, `${name}.pcm`)))], { type: "audio/wav" }), "a.wav");
  fd.append("definition", JSON.stringify({ locales: ["en-IN", "hi-IN"] }));
  const r = await fetch(`${SPEECH}/speechtotext/transcriptions:transcribe?api-version=2025-10-15`, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": KEY }, body: fd });
  const j = await r.json(); if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j).slice(0, 200)}`);
  fs.writeFileSync(cache, JSON.stringify(j)); return j;
}
// spoken units: vowel groups in Roman text, numbers by digit count, pauses at punctuation
function units(s) {
  let u = 0;
  for (const tok of s.match(/\d+|[A-Za-z’']+|[,.;:?!—–-]|\S/g) || []) {
    if (/^\d+$/.test(tok)) u += 1.3 * tok.length + 0.7;
    else if (/^[A-Za-z’']+$/.test(tok)) u += Math.max(1, (tok.toLowerCase().match(/[aeiouy]+/g) || []).length);
    else if (/[.?!]/.test(tok)) u += 2.2;
    else if (/[,;:—–]/.test(tok)) u += 1.2;
    else if (tok === "/" || tok === "=" || tok === "+" || tok === "×") u += 1.5;   // "by", "equals", "plus", "times"
  }
  return u;
}
function lcs(a, b) { // a,b arrays of strings → matched index pairs
  const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, () => new Int16Array(n + 1));
  for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) d[i][j] = a[i] === b[j] ? d[i + 1][j + 1] + 1 : Math.max(d[i + 1][j], d[i][j + 1]);
  const out = []; let i = 0, j = 0;
  while (i < m && j < n) { if (a[i] === b[j]) { out.push([i, j]); i++; j++; } else if (d[i + 1][j] >= d[i][j + 1]) i++; else j++; }
  return out;
}
const q = (xs, p) => { const s = [...xs].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))] : null; };
const stat = (xs) => ({ n: xs.length, median: q(xs, 0.5), p90: q(xs, 0.9), max: xs.length ? Math.max(...xs) : null });

function pauses(pcm) { // speech onsets (ms) that end a silence of >= 140 ms
  const N = 480, fr = []; for (let i = 0; i + N * 2 <= pcm.length; i += N * 2) { let e = 0; for (let k = 0; k < N; k++) { const v = pcm.readInt16LE(i + 2 * k) / 32768; e += v * v; } fr.push(Math.sqrt(e / N)); }
  const voiced = fr.filter((x) => x > 0.003).sort((a, b) => a - b); const thr = Math.max(0.004, 0.12 * (voiced[voiced.length >> 1] || 0.05));
  const out = []; let run = 0, started = false;
  fr.forEach((x, i) => { if (x < thr) run++; else { if (started && run >= 7) out.push(i * 20); run = 0; started = true; } });
  return out;
}
const NUM = { 0: 2, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 2, 7: 2, 8: 1, 9: 1, 10: 1, 11: 3, 12: 1, 13: 2, 14: 2, 15: 2, 16: 2, 17: 3, 18: 2, 19: 2 };
function numSyl(d) { const n = +d; if (n in NUM) return NUM[n]; if (n < 100) return 2 + (n % 10 ? NUM[n % 10] : 0); if (n < 1000) return NUM[Math.floor(n / 100)] + 2 + (n % 100 ? numSyl(String(n % 100)) : 0); return d.length * 1.5; }
function syl(s) { let u = 0; for (const tok of s.match(/\d+|[A-Za-z\u2019']+|[\/=+×]/g) || []) { if (/^\d+$/.test(tok)) u += numSyl(tok); else if (/^[A-Za-z]/.test(tok)) u += Math.max(1, (tok.toLowerCase().replace(/e$/, "").match(/[aeiouy]+/g) || []).length); else u += tok === "=" ? 2 : 1; } return u; }
function nuclei(pcm, P = { w: 2, gap: 130, floor: 25 }) { // intensity peaks (ms), 10 ms frames, ±w-frame smoothing
  const N = 240, db = []; for (let i = 0; i + N * 2 <= pcm.length; i += N * 2) { let e = 0; for (let k = 0; k < N; k++) { const v = pcm.readInt16LE(i + 2 * k) / 32768; e += v * v; } db.push(10 * Math.log10(e / N + 1e-10)); }
  const sm = db.map((_, i) => { let s = 0, c = 0; for (let j = i - P.w; j <= i + P.w; j++) if (j >= 0 && j < db.length) { s += db[j]; c++; } return s / c; });
  const mx = Math.max(...sm); const out = []; let last = -1e9;
  for (let i = 1; i < sm.length - 1; i++) if (sm[i] >= sm[i - 1] && sm[i] > sm[i + 1] && sm[i] > mx - P.floor && i * 10 - last >= P.gap) { out.push(i * 10); last = i * 10; }
  return out;
}
const turns = [];
for (const f of fs.readdirSync(DIR).filter((f) => /^r\d+-\w+\.json$/.test(f)).sort()) {
  const rec = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
  const g = await stt(rec.name);
  const words = (g.phrases || []).flatMap((p) => p.words || []);
  const gt = []; for (const w of words) for (const d of w.text.match(/\d+/g) || []) gt.push({ d, t: w.offsetMilliseconds });
  const tx = rec.transcript; const an = []; for (const m of tx.matchAll(/\d+/g)) an.push({ d: m[0], pos: m.index });
  const pairs = lcs(an.map((x) => x.d), gt.map((x) => x.d));
  // text arrival per char position
  const xs = rec.events.filter((e) => e.k === "x"); let acc = 0; const arr = xs.map((e) => { acc += e.d.length; return { end: acc, t: e.t }; });
  const firstAudio = rec.events.find((e) => e.k === "a")?.t;
  const doneAt = rec.events.at(-1)?.t; const audioTok = rec.usage?.output_token_details?.audio_tokens;
  const D = rec.samples / 24 /* ms */; const U = units(tx);
  const onsets = pauses(fs.readFileSync(path.join(DIR, `${rec.name}.pcm`)));
  const firstOnset = words[0]?.offsetMilliseconds ?? 0;
  const puncts = [...tx.matchAll(/[,.;:?!—]/g)].map((m) => m.index + 1);
  const nu = nuclei(fs.readFileSync(path.join(DIR, `${rec.name}.pcm`)));
  turns.push({ name: rec.name, lang: rec.lang, D, U, nu, doneAt, Dtok: audioTok ? audioTok * 50 : null, SY: syl(tx), chars: tx.length, firstAudio, anchors: pairs.map(([i, j]) => {
    const a = an[i]; const pre = tx.slice(0, a.pos);
    return { d: a.d, pos: a.pos, gt: gt[j].t, uPre: units(pre), sPre: syl(pre), arrival: arr.find((x) => x.end > a.pos)?.t };
  }), onsets, puncts, tx, firstOnset, nAnchorsTx: an.length, nAnchorsGt: gt.length });
}

const res = { date: "2026-10-02", model: process.env.RT_MODEL || "taxila-realtime", nTurns: turns.length, byEstimator: {}, perTurn: [] };
const errs = { P: [], S: [], R: [], Q: [], Y: [], L: [] }; const byLang = {}; const leads = []; const signed = { S: [], Y: [], L: [] }; let lFromDone = 0;
for (const t of turns) {
  const others = turns.filter((o) => o !== t); const rate = others.reduce((s, o) => s + o.U, 0) / others.reduce((s, o) => s + o.D, 0); // units per ms
  const e = { P: [], S: [], R: [], Q: [], Y: [], L: [] };
  const ratio = others.reduce((s, o) => s + o.nu.length, 0) / others.reduce((s, o) => s + o.SY, 0);
  // Q: walk punctuation in order, snapping each to the first envelope onset within ±1200 ms of its prediction
  const bounds = [{ pos: 0, t: t.firstOnset }]; let oi = 0;
  for (const p of t.puncts) {
    const prev = bounds[bounds.length - 1]; const pred = prev.t + units(t.tx.slice(prev.pos, p)) / rate;
    while (oi < t.onsets.length && t.onsets[oi] < pred - 1200) oi++;
    if (oi < t.onsets.length && t.onsets[oi] <= pred + 1200 && t.onsets[oi] > prev.t) bounds.push({ pos: p, t: t.onsets[oi++] });
  }
  for (const a of t.anchors) {
    e.P.push(Math.abs((a.pos / t.chars) * t.D - a.gt));
    e.S.push(Math.abs((a.uPre / t.U) * t.D - a.gt));
    e.R.push(Math.abs(a.uPre / rate - a.gt));
    const b = bounds.filter((x) => x.pos <= a.pos && x.t <= a.gt).at(-1) || bounds[0];   // causal: boundary already heard
    e.Q.push(Math.abs(b.t + units(t.tx.slice(b.pos, a.pos)) / rate - a.gt));
    const yk = Math.max(0, Math.round(a.sPre * ratio)); const y = t.nu[Math.min(yk, t.nu.length - 1)] ?? 0;
    e.Y.push(Math.abs(y - a.gt)); signed.Y.push(y - a.gt); signed.S.push((a.uPre / t.U) * t.D - a.gt);
    const afterDone = t.Dtok != null && t.firstAudio + a.gt - 300 > t.doneAt;   // needs the estimate 300 ms before the word
    const l = afterDone ? (a.uPre / t.U) * t.Dtok : a.uPre / rate; if (afterDone) lFromDone++;
    e.L.push(Math.abs(l - a.gt)); signed.L.push(l - a.gt);
    if (a.arrival != null && t.firstAudio != null) leads.push(t.firstAudio + a.gt - a.arrival);
  }
  for (const k of Object.keys(e)) { errs[k].push(...e[k]); (byLang[t.lang] ??= { P: [], S: [], R: [], Q: [], Y: [], L: [] })[k].push(...e[k]); }
  res.perTurn.push({ name: t.name, durMs: Math.round(t.D), chars: t.chars, unitsPerSec: +(t.U / t.D * 1000).toFixed(2), anchorsMatched: t.anchors.length, anchorsTx: t.nAnchorsTx, anchorsGt: t.nAnchorsGt,
    medErrMs: Object.fromEntries(Object.entries(e).map(([k, v]) => [k, q(v, 0.5)])) });
}
for (const k of Object.keys(errs)) res.byEstimator[k] = { all: stat(errs[k]), ...Object.fromEntries(Object.entries(byLang).map(([l, v]) => [l, stat(v[k])])) };
res.signedMs = Object.fromEntries(Object.entries(signed).map(([k, v]) => [k, { median: q(v, 0.5), p10: q(v, 0.1), p90: q(v, 0.9), earlyShare: +(v.filter((x) => x < 0).length / v.length).toFixed(3) }]));
// pointer/board policy: start the mark `pre` ms before the estimate and hold to the end of the sentence. covered = the
// mark is already visible when the word starts; earlyMs = how long it was visible before the word (p90, max).
res.policy = Object.fromEntries([0, 200, 400, 600].map((pre) => { const v = signed.L.map((x) => x - pre);
  const early = v.filter((x) => x <= 0).map((x) => -x);
  return [`pre${pre}`, { covered: +(early.length / v.length).toFixed(3), earlyP90: q(early, 0.9), earlyMax: early.length ? Math.max(...early) : null, lateMedian: q(v.filter((x) => x > 0), 0.5) }]; }));
res.L_shareAfterDone = +(lFromDone / errs.L.length).toFixed(3);
res.audioTokensPerSec = turns.map((t) => t.Dtok ? +(t.Dtok / t.D * 20).toFixed(3) : null);
res.leadMs = stat(leads); res.leadMs.min = leads.length ? Math.min(...leads) : null; res.leadMs.p10 = q(leads, 0.1);
res.within250 = Object.fromEntries(Object.entries(errs).map(([k, v]) => [k, +(v.filter((x) => x <= 250).length / v.length).toFixed(3)]));
res.within500 = Object.fromEntries(Object.entries(errs).map(([k, v]) => [k, +(v.filter((x) => x <= 500).length / v.length).toFixed(3)]));
fs.writeFileSync(OUTF, JSON.stringify(res, null, 1));
console.log(JSON.stringify({ byEstimator: Object.fromEntries(Object.entries(res.byEstimator).map(([k, v]) => [k, v.all])), signedMs: res.signedMs, within250: res.within250, within500: res.within500, leadMs: res.leadMs, L_shareAfterDone: res.L_shareAfterDone, policy: res.policy }, null, 1));
