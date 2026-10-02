// teacher-visual-sync-align.mjs — ground-truth word times for the turns recorded by teacher-visual-sync-probe.mjs,
// then scores the estimators the whiteboard/pointer scheduler could use to place a board write at the moment the
// teacher SAYS the thing (teacher-visual.md §5).
//   ground truth: Azure Speech fast transcription (word offsets), same Foundry resource, locales en-IN + hi-IN.
//   anchors:      digit runs ("3", "4", "180") — script-neutral, so they match across the Roman transcript and the
//                 Devanagari STT output. Matched in order by LCS.
//   estimators:   P  proportional by characters over the KNOWN audio duration (upper bound; WS lane / cached audio)
//                 S  proportional by spoken units (syllable proxy + number length + punctuation pauses), known duration
//                 R  units / rate, rate fitted leave-one-turn-out (the live WebRTC case: duration unknown)
//                 R+ R, re-anchored at the previous matched punctuation pause found in the audio envelope (not used:
//                    needs the audio tap; reported as future work)
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
  const D = rec.samples / 24 /* ms */; const U = units(tx);
  turns.push({ name: rec.name, lang: rec.lang, D, U, chars: tx.length, firstAudio, anchors: pairs.map(([i, j]) => {
    const a = an[i]; const pre = tx.slice(0, a.pos);
    return { d: a.d, pos: a.pos, gt: gt[j].t, uPre: units(pre), arrival: arr.find((x) => x.end > a.pos)?.t };
  }), nAnchorsTx: an.length, nAnchorsGt: gt.length });
}

const res = { date: "2026-10-02", model: process.env.RT_MODEL || "taxila-realtime", nTurns: turns.length, byEstimator: {}, perTurn: [] };
const errs = { P: [], S: [], R: [] }; const byLang = {}; const leads = [];
for (const t of turns) {
  const others = turns.filter((o) => o !== t); const rate = others.reduce((s, o) => s + o.U, 0) / others.reduce((s, o) => s + o.D, 0); // units per ms
  const e = { P: [], S: [], R: [] };
  for (const a of t.anchors) {
    e.P.push(Math.abs((a.pos / t.chars) * t.D - a.gt));
    e.S.push(Math.abs((a.uPre / t.U) * t.D - a.gt));
    e.R.push(Math.abs(a.uPre / rate - a.gt));
    if (a.arrival != null && t.firstAudio != null) leads.push(t.firstAudio + a.gt - a.arrival);
  }
  for (const k of Object.keys(e)) { errs[k].push(...e[k]); (byLang[t.lang] ??= { P: [], S: [], R: [] })[k].push(...e[k]); }
  res.perTurn.push({ name: t.name, durMs: Math.round(t.D), chars: t.chars, unitsPerSec: +(t.U / t.D * 1000).toFixed(2), anchorsMatched: t.anchors.length, anchorsTx: t.nAnchorsTx, anchorsGt: t.nAnchorsGt,
    medErrMs: Object.fromEntries(Object.entries(e).map(([k, v]) => [k, q(v, 0.5)])) });
}
for (const k of Object.keys(errs)) res.byEstimator[k] = { all: stat(errs[k]), ...Object.fromEntries(Object.entries(byLang).map(([l, v]) => [l, stat(v[k])])) };
res.leadMs = stat(leads); res.leadMs.min = leads.length ? Math.min(...leads) : null; res.leadMs.p10 = q(leads, 0.1);
res.within250 = Object.fromEntries(Object.entries(errs).map(([k, v]) => [k, +(v.filter((x) => x <= 250).length / v.length).toFixed(3)]));
res.within500 = Object.fromEntries(Object.entries(errs).map(([k, v]) => [k, +(v.filter((x) => x <= 500).length / v.length).toFixed(3)]));
fs.writeFileSync(OUTF, JSON.stringify(res, null, 1));
console.log(JSON.stringify({ byEstimator: res.byEstimator, within250: res.within250, within500: res.within500, leadMs: res.leadMs }, null, 1));
