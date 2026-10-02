// azure-speech-voices.mjs — v2 voice sweep (2026-10-02): every Azure-billed Hindi/Indian voice on 5 teacher passages.
//
// Measures per (arm x passage): time-to-first-byte, total synthesis time, audio duration, ASR round-trip
// WER/CER vs source through taxila-transcribe (gpt-4o-transcribe, no language hint), and the script the ASR
// returned. WER is an INTELLIGIBILITY FLOOR, not a humanness score (Meera azure-tts law: metrics won, ears lost).
//
// Run:  set -a; . /home/user/Taxila/.env.local; set +a
//       NODE_USE_ENV_PROXY=1 node docs/research/voice/v2/azure-speech-voices.mjs [synth|asr|all] [armFilterRegex]
// Outputs: docs/research/voice/v2/samples/<CODE>.mp3, samples/KEY.json (code -> arm/passage), results.json.
// Passages are TEST STIMULI ONLY. Nothing here is product prompt text.
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "samples");
mkdirSync(OUT, { recursive: true });
const KEY = process.env.AZURE_OPENAI_API_KEY;
const OAI = (process.env.AZURE_OPENAI_ENDPOINT || "").replace(/\/+$/, "");
const REGION = process.env.SPEECH_REGION || "eastus2";
const MODE = process.argv[2] || "all";
const FILTER = process.argv[3] ? new RegExp(process.argv[3]) : null;

// ---- passages: segments carry an optional mood so styled arms can switch style inside one utterance ----
// numLang = the language digit/fraction ASR output is normalised into for that passage.
const P = [
  { id: "a-greet", lang: "hinglish", numLang: "en", segs: [{ t: "अरे Aarav, नमस्ते! कैसे हो? पिछली बार तुमने बताया था ना कि Sunday को तुम्हारा cricket match था? तो बताओ, match जीते क्या? चलो, आज हम कुछ बहुत मज़ेदार सीखते हैं।" }] },
  { id: "b-fractions", lang: "hinglish", numLang: "en", segs: [{ t: "देखो, एक pizza लो और उसे दो बराबर हिस्सों में काटो। एक हिस्सा हुआ one by two, यानी आधा। अब उसी pizza को चार बराबर हिस्सों में काटो, तो दो हिस्से भी उतना ही pizza हैं, two by four. इसलिए one by two और two by four, equivalent fractions हैं। अच्छा, तुम बताओ, अगर pizza के आठ हिस्से हों, तो कितने हिस्से आधे के बराबर होंगे?" }] },
  { id: "c-hindi", lang: "hindi", numLang: "hi", segs: [{ t: "चलो बच्चों, आज हम पेड़-पौधों के बारे में बात करेंगे। क्या तुमने कभी सोचा है कि पौधे पानी कैसे पीते हैं? उनकी जड़ें मिट्टी से पानी खींचती हैं, बिल्कुल वैसे ही जैसे तुम नली से दूध पीते हो। बताओ, जड़ें पौधे के किस हिस्से में होती हैं?" }] },
  { id: "d-english", lang: "english", numLang: "en", segs: [{ t: "Very good, beta. You took your time and thought it through, and that is exactly what good learners do. Now let us try one more, okay? Read the question slowly, and tell me what you notice first." }] },
  { id: "e-praise-correct", lang: "hinglish", numLang: "hi", segs: [
    { t: "अरे वाह! शाबाश! बिल्कुल सही जवाब, तुमने तो कमाल कर दिया!", mood: "praise" },
    { t: "अच्छा, अगले वाले में एक छोटी सी गलती हुई है, कोई बात नहीं। तीन बटा चार, दो बटा तीन से बड़ा होता है, छोटा नहीं। चलो, एक बार साथ में देखते हैं।", mood: "correct" },
  ] },
];
const text = (p) => p.segs.map((s) => s.t).join(" ");

// ---- arms ----
const MAI_STYLED = ["Kavya", "Priya", "Dhruv", "Arjun"]; // StyleList present in voices/list (Harper, Grant: none)
const MAI = ["Kavya", "Priya", "Harper", "Arjun", "Dhruv", "Grant"];
const DHD = ["Diya", "Lavanya", "Meera", "Aarti", "Arjun", "Neerja"];
const OMNI = ["Swara", "Kavya", "Aarti", "Ananya", "Diya", "Madhur"]; // unlisted in voices/list, but resolve (probe 2026-10-02)
const ARMS = [
  ...MAI.map((n) => ({ arm: `mai-hd:${n}`, kind: "az", voice: `hi-IN-${n}:MAI-Voice-2.1`, loc: "hi-IN", styles: MAI_STYLED.includes(n) ? { praise: "excited", correct: "softvoice" } : null })),
  ...MAI.map((n) => ({ arm: `mai-flash:${n}`, kind: "az", voice: `hi-IN-${n}:MAI-Voice-2.1-Flash`, loc: "hi-IN", styles: MAI_STYLED.includes(n) ? { praise: "excited", correct: "softvoice" } : null })),
  ...DHD.map((n) => ({ arm: `dhd-plain:${n}`, kind: "az", voice: `en-IN-${n}:DragonHDLatestNeural`, loc: "en-IN", styles: null })),
  ...DHD.map((n) => ({ arm: `dhd-lang:${n}`, kind: "az", voice: `en-IN-${n}:DragonHDLatestNeural`, loc: "en-IN", styles: null, langTag: true })),
  { arm: "swara-plain", kind: "az", voice: "hi-IN-SwaraNeural", loc: "hi-IN", styles: null },
  { arm: "swara-styled", kind: "az", voice: "hi-IN-SwaraNeural", loc: "hi-IN", styles: { default: "cheerful", praise: "cheerful", correct: "empathetic" } },
  { arm: "diya-dragon", kind: "az", voice: "hi-IN-Diya:DragonLatestNeural", loc: "hi-IN", styles: null },
  ...OMNI.map((n) => ({ arm: `omni:${n}`, kind: "az", voice: `hi-IN-${n}:DragonHDOmniLatestNeural`, loc: "hi-IN", styles: null })),
  ...["coral", "sage", "shimmer", "marin"].map((v) => ({ arm: `4omtts:${v}`, kind: "oai", voice: v })),
].filter((a) => !FILTER || FILTER.test(a.arm));

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// Wrap Devanagari runs (with the spaces/punctuation between them) in <lang xml:lang="hi-IN">.
const langTag = (s) => esc(s).replace(/[ऀ-ॿ][ऀ-ॿ\s,!?।.\-]*[ऀ-ॿ।!?]?/g, (m) => {
  const core = m.replace(/\s+$/, ""); return `<lang xml:lang="hi-IN">${core}</lang>` + m.slice(core.length);
});
function ssml(a, p) {
  const body = p.segs.map((s) => {
    let inner = `<prosody rate="0.95">${a.langTag ? langTag(s.t) : esc(s.t)}</prosody>`;
    const st = a.styles && (a.styles[s.mood] || a.styles.default);
    if (st) inner = `<mstts:express-as style="${st}">${inner}</mstts:express-as>`;
    return inner;
  }).join(" ");
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${a.loc}"><voice name="${a.voice}">${body}</voice></speak>`;
}

// gpt-4o-mini-tts: a voice DESCRIPTION (shape, not lines).
const ACCENT = [
  "Voice: a North Indian woman in her late twenties who teaches primary school; Hindi is her mother tongue and she grew up in Delhi.",
  "Accent: native Indian throughout, never American or British. Hindi with native pronunciation: retroflex t/d, aspirated kh/gh/th/dh/bh, nasal vowels kept, Hindi rhythm and intonation.",
  "English words inside Hindi sentences are said the way an Indian teacher says them, with Indian vowels and a light Indian r.",
  "Delivery: warm, patient, unhurried (slightly slower than conversational), smiling; mid pitch; talking to one 9-year-old, not announcing.",
].join("\n");
const MOODNOTE = {
  "a-greet": "Mood: delighted to see the child again, friendly and curious.",
  "b-fractions": "Mood: explaining with a picture in mind, clear pauses at each step; the last sentence is a gentle, open question.",
  "c-hindi": "Language: pure Hindi, as spoken to a class-3 child. Mood: calm, story-like wonder.",
  "d-english": "Language: Indian English, as spoken by a Hindi-speaking teacher. Mood: proud, encouraging.",
  "e-praise-correct": "Mood: the first part is genuinely excited, bright praise; then the voice drops to soft, gentle, reassuring, unhurried for the correction.",
};

const now = () => performance.now();
async function timed(url, opts) {
  const t0 = now(); const r = await fetch(url, opts); const thdr = now() - t0;
  if (!r.ok) return { err: `HTTP ${r.status} ${(await r.text()).slice(0, 200)}` };
  const rd = r.body.getReader(); const ch = []; let ttfb = null;
  for (;;) { const { done, value } = await rd.read(); if (done) break; if (ttfb === null && value?.length) ttfb = now() - t0; ch.push(Buffer.from(value)); }
  return { buf: Buffer.concat(ch), ttfb, hdr: thdr, total: now() - t0 };
}
async function synth(a, p) {
  if (a.kind === "az") return timed(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST",
    headers: { "Ocp-Apim-Subscription-Key": KEY, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3", "User-Agent": "taxila-voice-v2" }, body: ssml(a, p) });
  return timed(`${OAI}/audio/speech`, { method: "POST", headers: { "api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.DEPLOY_TTS || "gpt-4o-mini-tts", voice: a.voice, input: text(p), response_format: "mp3", instructions: `${ACCENT}\n${MOODNOTE[p.id]}` }) });
}
const dur = (f) => { try { return +(+execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim()).toFixed(2); } catch { return null; } };
const code = (used) => { for (;;) { const c = randomBytes(3).toString("hex").toUpperCase().slice(0, 5); if (!used.has(c)) { used.add(c); return c; } } };

// ---- ASR + WER ----
async function asr(file) {
  const fd = new FormData(); fd.append("file", new Blob([readFileSync(file)], { type: "audio/mpeg" }), "a.mp3");
  const base = OAI.replace(/\/openai\/v1$/, "");
  for (let i = 0; i < 3; i++) {
    const r = await fetch(`${base}/openai/deployments/${process.env.DEPLOY_TRANSCRIBE || "taxila-transcribe"}/audio/transcriptions?api-version=2025-03-01-preview`, { method: "POST", headers: { "api-key": KEY }, body: fd });
    if (r.ok) return (await r.json()).text || "";
    if (r.status !== 429 && r.status < 500) return { err: `HTTP ${r.status}` };
    await new Promise((res) => setTimeout(res, 2000 * (i + 1)));
  }
  return { err: "retries" };
}
const C = { "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "n", "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "n", "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n", "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n", "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m", "य": "y", "र": "r", "ल": "l", "ळ": "l", "व": "v", "श": "sh", "ष": "sh", "स": "s", "ह": "h" };
const NUK = { "k": "q", "kh": "kh", "g": "g", "j": "z", "d": "r", "dh": "rh", "ph": "f" };
const V = { "अ": "a", "आ": "aa", "इ": "i", "ई": "ii", "उ": "u", "ऊ": "uu", "ऋ": "ri", "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au", "ऑ": "o", "ऍ": "e" };
const M = { "ा": "aa", "ि": "i", "ी": "ii", "ु": "u", "ू": "uu", "ृ": "ri", "े": "e", "ै": "ai", "ो": "o", "ौ": "au", "ॅ": "e", "ॉ": "o" };
function translit(s) {
  s = s.normalize("NFD"); let o = ""; let pend = false; // pend = consonant awaiting inherent a
  for (const ch of s) {
    if (C[ch]) { if (pend) o += "a"; o += C[ch]; pend = true; }
    else if (ch === "़") { const m = o.match(/(kh|dh|ph|k|g|j|d)$/); if (m) o = o.slice(0, -m[1].length) + NUK[m[1]]; }
    else if (M[ch]) { o += M[ch]; pend = false; }
    else if (ch === "्") { pend = false; }
    else if (ch === "ं" || ch === "ँ") { if (pend) o += "a"; o += "n"; pend = false; }
    else if (ch === "ः") { if (pend) o += "a"; o += "h"; pend = false; }
    else if (V[ch]) { if (pend) o += "a"; o += V[ch]; pend = false; }
    else { if (pend) o += "a"; pend = false; o += ch; }
  }
  if (pend) o += "a"; return o;
}
const NUMW = { en: ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"], hi: ["shunya", "ek", "do", "tiin", "chaar", "paanch", "chhah", "saat", "aath", "nau", "das"] };
function fold(w) {
  w = w.replace(/chh/g, "ch").replace(/ch/g, "C").replace(/ck/g, "k").replace(/c(?=[eiy])/g, "s").replace(/c/g, "k").replace(/ph/g, "f")
    .replace(/sh/g, "s").replace(/([bkdgjptC])h/g, "$1").replace(/z/g, "j").replace(/w/g, "v").replace(/q/g, "k").replace(/x/g, "ks")
    .replace(/aa/g, "a").replace(/ee|ii/g, "i").replace(/oo|uu/g, "u").replace(/ai/g, "e").replace(/au/g, "o").replace(/y$/, "i").replace(/(.)\1+/g, "$1");
  if (w.length > 2) w = w.replace(/a$/, "");
  return w.replace(/C/g, "c");
}
function words(s, numLang) {
  s = s.replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x966)).replace(/½/g, " 1/2 ").replace(/¾/g, " 3/4 ")
    .replace(/(\d+)\s*\/\s*(\d+)/g, (_, a, b) => ` ${a} ${numLang === "hi" ? "bataa" : "by"} ${b} `)
    .replace(/\b(\d|10)\b/g, (d) => ` ${NUMW[numLang][+d]} `);
  s = translit(s).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ");
  return s.split(/\s+/).filter(Boolean).map(fold).filter(Boolean);
}
const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
const near1 = (x, y) => x === y || lev(x, y) / Math.max(x.length, y.length) <= 0.34;
const near = (x, y) => Array.isArray(x) ? x.some((v) => near1(v, y)) : near1(x, y);
// Latin words in Hinglish sources: the Devanagari spellings an unhinted ASR may return for them.
const ALIAS = { aarav: ["आरव"], sunday: ["संडे"], cricket: ["क्रिकेट"], match: ["मैच"], pizza: ["पिज़्ज़ा", "पिज्जा", "पिज़ा"], one: ["वन"], by: ["बाय", "बाई"], two: ["टू"], four: ["फोर", "फ़ोर"],
  equivalent: ["इक्विवेलेंट", "इक्विवैलेंट", "इक्वीवेलेंट", "इक्विवलेंट"], fractions: ["फ्रैक्शंस", "फ्रैक्शन्स", "फ्रेक्शंस", "फ्रैक्शन"] };
const refWords = (s, numLang) => s.split(/\s+/).flatMap((w) => { const ws = words(w, numLang); const a = ALIAS[w.toLowerCase().replace(/[^a-z]/g, "")];
  return a && ws.length === 1 ? [[ws[0], ...a.map((x) => words(x, numLang)[0])]] : ws; });
function wer(ref, hyp) { const d = Array.from({ length: ref.length + 1 }, (_, i) => [i]); for (let j = 1; j <= hyp.length; j++) d[0][j] = j;
  for (let i = 1; i <= ref.length; i++) for (let j = 1; j <= hyp.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (near(ref[i - 1], hyp[j - 1]) ? 0 : 1));
  return d[ref.length][hyp.length] / ref.length; }
const cer = (ref, hyp) => { const a = ref.map((x) => (Array.isArray(x) ? x[0] : x)).join(""), b = hyp.join(""); return lev(a, b) / a.length; };
function scripts(s) { const n = (re) => (s.match(re) || []).length; const r = { deva: n(/[ऀ-ॿ]/g), latin: n(/[A-Za-z]/g), arabic: n(/[؀-ۿ]/g), bengali: n(/[ঀ-৿]/g), other: n(/[਀-෿]/g) };
  const tot = Object.values(r).reduce((x, y) => x + y, 0) || 1; return Object.fromEntries(Object.entries(r).filter(([, v]) => v).map(([k, v]) => [k, +(v / tot).toFixed(2)])); }

// ---- run ----
const RES = join(HERE, "results.json"), KEYF = join(OUT, "KEY.json");
let rows = existsSync(RES) ? JSON.parse(readFileSync(RES, "utf8")) : [];
let key = existsSync(KEYF) ? JSON.parse(readFileSync(KEYF, "utf8")) : {};
const used = new Set(Object.keys(key));
const save = () => { writeFileSync(RES, JSON.stringify(rows, null, 1)); writeFileSync(KEYF, JSON.stringify(key, null, 1)); };

if (MODE === "synth" || MODE === "all") {
  const jobs = ARMS.flatMap((a) => P.map((p) => [a, p]));
  let k = 0;
  const worker = async () => { while (k < jobs.length) { const [a, p] = jobs[k++];
    if (rows.some((r) => r.arm === a.arm && r.passage === p.id && r.code)) continue; // resume
    rows = rows.filter((r) => !(r.arm === a.arm && r.passage === p.id));
    let r; for (let i = 0; i < 3; i++) { try { r = await synth(a, p); } catch (e) { r = { err: `EXC ${e.cause?.code || e.message}` }; }
      if (!r.err || !/EXC|HTTP (429|5)/.test(r.err)) break; await new Promise((res) => setTimeout(res, 3000 * (i + 1))); }
    if (r.err) { rows.push({ arm: a.arm, voice: a.voice, passage: p.id, err: r.err }); console.log(`${a.arm} ${p.id} ERR ${r.err}`); continue; }
    const c = code(used); const f = join(OUT, `${c}.mp3`); writeFileSync(f, r.buf);
    key[c] = { arm: a.arm, voice: a.voice, passage: p.id, styles: a.styles || null, langTag: !!a.langTag };
    const row = { code: c, arm: a.arm, voice: a.voice, passage: p.id, chars: text(p).length, ttfb_ms: Math.round(r.ttfb), hdr_ms: Math.round(r.hdr), total_ms: Math.round(r.total), bytes: r.buf.length, audio_s: dur(f) };
    rows.push(row); save(); console.log(`${a.arm} ${p.id} ${c} ttfb=${row.ttfb_ms} total=${row.total_ms} dur=${row.audio_s}`);
  } };
  await Promise.all([worker(), worker()]); save();
}
if (MODE === "asr" || MODE === "all") {
  const todo = rows.filter((r) => r.code && (!FILTER || FILTER.test(r.arm)));
  let k = 0;
  const worker = async () => { while (k < todo.length) { const r = todo[k++]; const p = P.find((x) => x.id === r.passage);
    if (r.wer !== undefined && MODE !== "asr") continue;
    let t; try { t = await asr(join(OUT, `${r.code}.mp3`)); } catch (e) { t = { err: `EXC ${e.cause?.code || e.message}` }; }
    if (typeof t !== "string") { r.asr_err = t.err; continue; }
    const ref = refWords(text(p), p.numLang), hyp = words(t, p.numLang);
    Object.assign(r, { asr: t, wer: +wer(ref, hyp).toFixed(3), cer: +cer(ref, hyp).toFixed(3), asr_script: scripts(t) });
    console.log(`${r.arm} ${r.passage} wer=${r.wer} cer=${r.cer} ${JSON.stringify(r.asr_script)}`);
  } };
  await Promise.all([worker(), worker(), worker(), worker()]); save();
}
