// render.mjs — does the Devanagari step fix how DragonHD Diya SAYS Hindi number words? 40 real Director replies that carry
// Roman Hindi number words, rendered BEFORE (today's production document: plainSsml at Diya's -35 % base rate, hinglish cell)
// and AFTER (the same document with toDevanagari between speakable() and escaping, exactly the patch in
// docs/design/reset/prework/rs7/patches/01-dhd-spokenrun.patch), 2 takes each, then transcribed by TWO STTs:
//   azure   Azure Speech STT hi-IN short-audio REST, Lexical (centralindia; the v4 probe's instrument)
//   gpt     taxila-transcribe (production push-to-talk STT deployment), language=hi
// Scored per number word (expected = the Devanagari number the line means): heard if the transcript carries it as the
// Devanagari word (norm, plus ASR spelling variants), as digits, or as a Roman spelling. Also Hindi-word recall: the share
// of the line's Hindi words (as Devanagari) the STT hears.
//   set -a; . ./.env.local; set +a; NODE_USE_ENV_PROXY=1 node evals/translit/render.mjs [render|stt|score|all]
import fs from "node:fs";
import path from "node:path";
import { analyze, toDevanagari } from "../../server/voice/translit/index.js";
import { NUMBER_WORDS, cardinalOf } from "../../server/voice/translit/numbers.js";
import { plainSsml, escapeXml, langRuns } from "../../server/voice/expressive/compile/dhd.js";
import { speakable } from "../../server/voice/spoken.js";
import { WORDS } from "../../server/voice/spoken-lexicon.js";
import { norm } from "./norm.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(HERE, "renders");
const MAN = path.join(HERE, "results/render-manifest.json");
const VOICE = { voice: "en-IN-Diya:DragonHDLatestNeural", baseRate: -35 };
const SPOKEN = { mode: "hinglish", ageBand: "10-15" };
const TAKES = 2;
const step = process.argv[2] ?? "all";
const env = process.env;
const REGION = env.AZURE_AI_CENTRALINDIA_REGION || "centralindia";
const SKEY = env.AZURE_AI_CENTRALINDIA_KEY;

const HI = WORDS.hi.below100;
const SCALE = { "सौ": 100, "हज़ार": 1000, "लाख": 100000, "करोड़": 10000000 };
const NUM_DEVA = new Set([...HI, ...Object.keys(SCALE)]);
const ROMAN_OF = {}; for (const [r, d] of Object.entries(NUMBER_WORDS)) (ROMAN_OF[d] ??= []).push(r);
for (const [r, d] of Object.entries({ saath: "साठ", bees: "बीस", do: "दो" })) (ROMAN_OF[d] ??= []).push(r);
// ASR spellings seen for number words (TALKING-RULES §5.2: "पच्चास" for पचास in 7/8 renders on every arm, Nova included)
const ASR_VARIANTS = { "पचास": ["पच्चास"], "छह": ["छः", "छै", "छे"], "पाँच": ["पांच"], "सौ": ["सो"], "हज़ार": ["हजार"], "करोड़": ["करोड"] };

// ── the 40 lines ──
function pickLines() {
  const corpus = JSON.parse(fs.readFileSync(path.join(HERE, "data/corpus.json"), "utf8"));
  const cand = [];
  for (const r of corpus.rows) {
    const nums = analyze(r.text).filter((a) => a.out !== a.w && NUM_DEVA.has(a.out));
    if (!nums.length) continue;
    const mx = Math.max(...nums.map((a) => (SCALE[a.out] ? 100 : cardinalOf(a.out))));
    cand.push({ id: r.id, text: r.text, nums: nums.length, mx });
  }
  cand.sort((a, b) => b.mx - a.mx || b.nums - a.nums || a.id.localeCompare(b.id));
  const seen = new Set(); const pick = [];
  for (const c of cand) {
    const k = c.text.replace(/^[A-Z][a-z]+,\s*/, "").slice(0, 40).toLowerCase();
    if (seen.has(k) || c.text.length > 300) continue;
    seen.add(k); pick.push(c);
    if (pick.length === 40) break;
  }
  return pick;
}

const SPEAK = (body) => `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-IN"><voice name="${escapeXml(VOICE.voice)}">${body}</voice></speak>`;
/** AFTER: plainSsml with the step inserted (mirrors patches/01-dhd-spokenrun.patch). */
function afterSsml(written) {
  const s = toDevanagari(speakable(written, SPOKEN).trim(), { force: true, mode: "hinglish", written });
  const rate = `${VOICE.baseRate >= 0 ? "+" : ""}${VOICE.baseRate}%`;
  return SPEAK(`<prosody rate="${rate}">${langRuns(escapeXml(s))}</prosody>`);
}

async function tts(ssml) {
  let last = "";
  for (let a = 0; a < 7; a++) {
    const r = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": SKEY, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "riff-16khz-16bit-mono-pcm", "User-Agent": "taxila-rs7-translit" }, body: ssml });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    if (r.status === 429 || r.status >= 500) { last = `${r.status} ${(await r.text()).slice(0, 100)}`; await new Promise((s) => setTimeout(s, 3000 * (a + 1))); continue; }
    throw new Error(`tts HTTP ${r.status} ${(await r.text()).slice(0, 160)}`);
  }
  throw new Error(`tts retries (${last})`);
}
async function sttAzure(wav) {
  for (let a = 0; a < 4; a++) {
    const r = await fetch(`https://${REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=hi-IN&format=detailed`, { method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": SKEY, "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000", Accept: "application/json" }, body: wav });
    if (r.status === 429 || r.status >= 500) { await new Promise((s) => setTimeout(s, 2500 * (a + 1))); continue; }
    const j = await r.json();
    return (j.NBest?.[0]?.Lexical ?? j.DisplayText ?? "").trim();
  }
  return "";
}
async function sttGpt(wav) {
  const base = env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "").replace(/\/openai\/v1$/, "");
  const dep = env.DEPLOY_TRANSCRIBE || "taxila-transcribe";
  for (let a = 0; a < 4; a++) {
    const fd = new FormData();
    fd.append("file", new Blob([wav], { type: "audio/wav" }), "line.wav");
    fd.append("response_format", "json"); fd.append("language", "hi");
    const r = await fetch(`${base}/openai/deployments/${encodeURIComponent(dep)}/audio/transcriptions?api-version=2025-03-01-preview`, { method: "POST", headers: { "api-key": env.AZURE_OPENAI_API_KEY }, body: fd });
    if (r.status === 429 || r.status >= 500) { await new Promise((s) => setTimeout(s, 3000 * (a + 1))); continue; }
    const j = await r.json();
    if (!r.ok) throw new Error(`stt HTTP ${r.status} ${JSON.stringify(j).slice(0, 160)}`);
    return String(j.text ?? "").trim();
  }
  return "";
}

const load = () => (fs.existsSync(MAN) ? JSON.parse(fs.readFileSync(MAN, "utf8")) : null);
const save = (m) => fs.writeFileSync(MAN, JSON.stringify(m, null, 1));

async function render() {
  const lines = pickLines();
  const man = load() ?? { v: "taxila-rs7-render/1", date: new Date().toISOString().slice(0, 10), voice: VOICE, spoken: SPOKEN, region: REGION, lines: [], chars: 0 };
  fs.mkdirSync(OUT, { recursive: true });
  for (const l of lines) {
    let e = man.lines.find((x) => x.id === l.id);
    if (!e) { e = { id: l.id, text: l.text, ssml: { before: plainSsml(l.text, VOICE, SPOKEN), after: afterSsml(l.text) }, takes: [] }; man.lines.push(e); }
    for (const arm of ["before", "after"]) for (let t = 1; t <= TAKES; t++) {
      const f = path.join(OUT, `${l.id}__${arm}__t${t}.wav`);
      if (fs.existsSync(f)) continue;
      fs.writeFileSync(f, await tts(e.ssml[arm]));
      man.chars += e.ssml[arm].length;
      if (!e.takes.find((x) => x.arm === arm && x.t === t)) e.takes.push({ arm, t, file: path.relative(HERE, f) });
      process.stdout.write(`\rrendered ${l.id} ${arm} t${t}   `);
    }
    save(man);
  }
  console.log("\nlines", man.lines.length, "ssml chars", man.chars);
}

async function stt() {
  const man = load();
  const jobs = [];
  for (const e of man.lines) for (const tk of e.takes) for (const eng of ["azure", "gpt"]) if (tk[eng] == null) jobs.push([tk, eng]);
  let k = 0;
  const worker = async () => { while (k < jobs.length) { const [tk, eng] = jobs[k++]; const wav = fs.readFileSync(path.join(HERE, tk.file)); try { tk[eng] = eng === "azure" ? await sttAzure(wav) : await sttGpt(wav); } catch (err) { tk[eng + "Err"] = String(err.message).slice(0, 120); } process.stdout.write(`\rstt ${k}/${jobs.length}  `); } };
  await Promise.all(Array.from({ length: 4 }, worker));
  save(man);
  console.log("");
}

// ── scoring ──
const devaTokens = (s) => String(s).split(/[^ऀ-ॿ]+/).filter(Boolean).map(norm);
function expectedNumbers(text) {
  return analyze(text).filter((a) => a.out !== a.w && NUM_DEVA.has(a.out)).map((a) => ({ roman: a.w.toLowerCase(), deva: a.out }));
}
function numberHeard(exp, transcript, used) {
  const toks = devaTokens(transcript);
  const forms = [exp.deva, ...(ASR_VARIANTS[exp.deva] ?? [])].map(norm);
  for (let i = 0; i < toks.length; i++) if (!used.has(`d${i}`) && forms.includes(toks[i])) { used.add(`d${i}`); return true; }
  const lat = String(transcript).toLowerCase().match(/[a-z]+|\d[\d,]*/g) ?? [];
  const n = SCALE[exp.deva] ?? cardinalOf(exp.deva);
  const romans = new Set([...(ROMAN_OF[exp.deva] ?? []), exp.roman]);
  for (let i = 0; i < lat.length; i++) {
    if (used.has(`l${i}`)) continue;
    const x = lat[i];
    if (romans.has(x)) { used.add(`l${i}`); return true; }
    if (/^\d/.test(x)) {
      const digits = x.replace(/,/g, "");
      // a digit run carries the number if it is the number, or (scale words) it is a multiple shaped like it
      if (digits === String(n) || (SCALE[exp.deva] && digits.length >= String(n).length) || digits.includes(String(n))) { used.add(`l${i}`); return true; }
    }
  }
  return false;
}
function score() {
  const man = load();
  const agg = {};
  const perLine = [];
  for (const e of man.lines) {
    const exp = expectedNumbers(e.text);
    const target = devaTokens(toDevanagari(speakable(e.text, SPOKEN), { force: true, mode: "hinglish" })).filter((t) => !NUM_DEVA.has(t));
    const row = { id: e.id, n: exp.length };
    for (const tk of e.takes) for (const eng of ["azure", "gpt"]) {
      const tr = tk[eng]; if (tr == null) continue;
      const urdu = /[\u0600-\u06FF]/.test(tr);
      for (const key of [`${tk.arm}/${eng}`, ...(urdu ? [] : [`${tk.arm}/${eng}:deva-only`])]) {
      const a = (agg[key] ??= { numbers: 0, heard: 0, hiWords: 0, hiHeard: 0, misses: {}, clips: 0, urdu: 0 });
      a.clips++; if (urdu) a.urdu++;
      const used = new Set();
      for (const x of exp) { a.numbers++; if (numberHeard(x, tr, used)) a.heard++; else a.misses[x.deva] = (a.misses[x.deva] ?? 0) + 1; }
      const toks = devaTokens(tr); const bag = new Map(); for (const t of toks) bag.set(t, (bag.get(t) ?? 0) + 1);
      for (const t of target) { a.hiWords++; if (bag.get(t) > 0) { a.hiHeard++; bag.set(t, bag.get(t) - 1); } }
      }
      row[`${tk.arm}/${eng}#${tk.t}`] = tr;
    }
    perLine.push(row);
  }
  const table = Object.fromEntries(Object.entries(agg).map(([k, a]) => [k, { clips: a.clips, arabicScriptClips: a.urdu, numberWords: `${a.heard}/${a.numbers}`, numberPct: +(100 * a.heard / a.numbers).toFixed(1), hindiWordRecall: +(100 * a.hiHeard / a.hiWords).toFixed(1), topMisses: Object.entries(a.misses).sort((x, y) => y[1] - x[1]).slice(0, 8) }]));
  const res = { date: new Date().toISOString().slice(0, 10), lines: man.lines.length, takes: TAKES, voice: VOICE.voice, region: REGION, ssmlChars: man.chars, table, perLine };
  fs.writeFileSync(path.join(HERE, `results/render-score-${res.date}.json`), JSON.stringify(res, null, 1));
  console.table(Object.fromEntries(Object.entries(table).map(([k, v]) => [k, { clips: v.clips, "urdu-script": v.arabicScriptClips, numbers: v.numberWords, "%": v.numberPct, "hindi word recall %": v.hindiWordRecall }])));
  for (const [k, v] of Object.entries(table)) console.log(k, "misses:", JSON.stringify(v.topMisses));
}

// The anchor: the v4 script probe's Roman L1 line (TALKING-RULES §5.3: पैंतीस heard as "पेंटीज" 2/2 + 2/2). Not a corpus
// reply (the probe's own Roman rendering of the L1 think-aloud), so it is reported apart from the 40.
const ANCHOR = "Sattaais aur paintees. Pehle tens jodte hain, bees aur tees, pachaas. Phir saat aur paanch, baarah. Toh total hua baasath!";
async function anchor() {
  const res = { text: ANCHOR, takes: [] };
  for (const arm of ["before", "after"]) for (let t = 1; t <= 4; t++) {
    const wav = await tts(arm === "before" ? plainSsml(ANCHOR, VOICE, SPOKEN) : afterSsml(ANCHOR));
    const f = path.join(OUT, `anchor__${arm}__t${t}.wav`); fs.writeFileSync(f, wav);
    res.takes.push({ arm, t, azure: await sttAzure(wav), gpt: await sttGpt(wav) });
  }
  const exp = expectedNumbers(ANCHOR);
  for (const arm of ["before", "after"]) for (const eng of ["azure", "gpt"]) {
    let h = 0, n = 0, p35 = 0;
    for (const tk of res.takes.filter((x) => x.arm === arm)) { const used = new Set(); for (const x of exp) { n++; if (numberHeard(x, tk[eng], used)) h++; } if (/पैंतीस|35/.test(tk[eng])) p35++; }
    res[`${arm}/${eng}`] = { numbers: `${h}/${n}`, paintees35: `${p35}/4` };
  }
  fs.writeFileSync(path.join(HERE, "results/render-anchor.json"), JSON.stringify(res, null, 1));
  for (const k of Object.keys(res).filter((k) => k.includes("/"))) console.log(k, JSON.stringify(res[k]));
  for (const tk of res.takes) console.log(tk.arm, tk.t, "az:", tk.azure, "| gpt:", tk.gpt);
}
// ── the other two switch voices (1 take, Azure STT): does the step help Priya (hi-IN MAI) and marin (gpt-4o-mini-tts)?
// Documents come from server/voice/voice-switch.js documentFor (the standalone interface), before = step off, after = on.
async function voices() {
  const { VOICE_CHOICES, documentFor } = await import("../../server/voice/voice-switch.js");
  const { execFileSync } = await import("node:child_process");
  const man = load(); const out = { date: new Date().toISOString().slice(0, 10), voices: {} };
  const lines = man.lines.map((l) => ({ id: l.id, text: l.text }));
  for (const id of ["priya", "marin"]) {
    const c = VOICE_CHOICES[id];
    const rows = [];
    for (const l of lines) for (const arm of ["before", "after"]) {
      const f = path.join(OUT, `${id}__${l.id}__${arm}.wav`);
      const doc = documentFor({ ...c, devanagari: true }, l.text, SPOKEN, { env: arm === "after" ? { TAXILA_VOICE_DEVANAGARI: "1" } : {} });
      if (!fs.existsSync(f)) {
        let raw;
        if (doc.engine === "speech") { try { raw = await tts(doc.ssml); } catch (e) { rows.push({ id: l.id, arm, error: String(e.message).slice(0, 140) }); continue; } }
        else {
          const base = env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "").replace(/\/openai\/v1$/, "");
          const r = await fetch(`${base}/openai/v1/audio/speech`, { method: "POST", headers: { "api-key": env.AZURE_OPENAI_API_KEY, "content-type": "application/json" },
            body: JSON.stringify({ model: env.DEPLOY_TTS || "gpt-4o-mini-tts", input: doc.input, voice: doc.voice, response_format: "wav" }) });
          if (!r.ok) throw new Error(`oai tts ${r.status} ${(await r.text()).slice(0, 120)}`);
          raw = execFileSync("ffmpeg", ["-loglevel", "error", "-i", "-", "-ar", "16000", "-ac", "1", "-f", "wav", "-"], { input: Buffer.from(await r.arrayBuffer()) });
        }
        fs.writeFileSync(f, raw);
      }
      const tr = await sttAzure(fs.readFileSync(f));
      rows.push({ id: l.id, arm, azure: tr });
      process.stdout.write(`\r${id} ${rows.length}/${lines.length * 2}  `);
    }
    const agg = {};
    for (const r of rows) {
      const a = (agg[r.arm] ??= { numbers: 0, heard: 0, hiWords: 0, hiHeard: 0, failed: 0 });
      if (r.error) { a.failed++; continue; }
      const text = lines.find((l) => l.id === r.id).text;
      const used = new Set(); for (const x of expectedNumbers(text)) { a.numbers++; if (numberHeard(x, r.azure, used)) a.heard++; }
      const target = devaTokens(toDevanagari(speakable(text, SPOKEN), { force: true, mode: "hinglish" })).filter((t) => !NUM_DEVA.has(t));
      const bag = new Map(); for (const t of devaTokens(r.azure)) bag.set(t, (bag.get(t) ?? 0) + 1);
      for (const t of target) { a.hiWords++; if (bag.get(t) > 0) { a.hiHeard++; bag.set(t, bag.get(t) - 1); } }
    }
    out.voices[id] = Object.fromEntries(Object.entries(agg).map(([k, a]) => [k, { failedRenders: a.failed, numberWords: `${a.heard}/${a.numbers}`, numberPct: +(100 * a.heard / a.numbers).toFixed(1), hindiWordRecall: +(100 * a.hiHeard / a.hiWords).toFixed(1) }]));
    out.voices[id].rows = rows;
    console.log("\n", id, JSON.stringify({ before: out.voices[id].before, after: out.voices[id].after }));
  }
  fs.writeFileSync(path.join(HERE, `results/render-voices-${out.date}.json`), JSON.stringify(out, null, 1));
}
if (step === "voices") await voices();
if (step === "anchor") await anchor();
if (step === "render" || step === "all") await render();
if (step === "stt" || step === "all") await stt();
if (step === "score" || step === "all") score();
