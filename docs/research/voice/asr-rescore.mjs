// asr-rescore.mjs — second ASR pass over a probe-voices-hindi.mjs output dir, WITH a language hint.
//
// Why: the first pass (no hint) lets gpt-4o-transcribe pick the language. On 2026-10-02 it returned
// Urdu (Nastaliq) for some clips, so key-term recall read 0 for words that were spoken correctly.
// Pass 1 is kept as a language-ID signal ("heard as Urdu"). Pass 2 (language=hi for s1-s4, en for s5)
// is the intelligibility floor. Neither ranks voices.
//
//   NODE_USE_ENV_PROXY=1 node asr-rescore.mjs <outdir>
import { readFileSync, writeFileSync } from "node:fs";
const KEY = process.env.AZURE_OPENAI_API_KEY;
const base = (process.env.AZURE_OPENAI_ENDPOINT || "").replace(/\/+$/, "").replace(/\/openai\/v1$/, "");
const DEP = process.env.DEPLOY_TRANSCRIBE || "taxila-transcribe";
const out = process.argv[2];
const rows = JSON.parse(readFileSync(`${out}/results.json`, "utf8"));
const KEYS = { // same as probe-voices-hindi.mjs
  "s1-deva": [["ध्यान"], ["बराबर"], ["हिस्सों", "हिस्से"], ["भिन्न"], ["कहलाता"]],
  "s2-roman": [["denominator", "डिनॉमिनेटर", "डेनोमिनेटर", "डिनोमिनेटर", "डीनॉमिनेटर", "डेनॉमिनेटर"], ["pizza", "पिज़्ज़ा", "पिज्जा", "पिज़ा", "पिजा"], ["barabar", "बराबर"], ["tukde", "टुकड़े", "टुकडे"], ["khaaye", "khaye", "खाए", "खाये"]],
  "s3-mixed": [["photosynthesis", "फोटोसिंथेसिस", "फ़ोटोसिंथेसिस"], ["sunlight", "सनलाइट"], ["पानी", "pani", "paani"], ["carbon", "कार्बन"], ["dioxide", "डाइऑक्साइड", "डाईऑक्साइड", "डायोक्साइड", "डायऑक्साइड", "डाइआक्साइड"]],
  "s4-numerals": [["rectangle", "रेक्टेंगल", "रेक्टैंगल"], ["12", "बारह", "twelve"], ["5", "पाँच", "पांच", "five"], ["60", "साठ", "sixty"], ["square", "स्क्वायर", "स्क्वेयर", "स्क्वैर", "sq"]],
  "s5-english": [["good"], ["check"], ["bigger"], ["three", "3"], ["two", "2"]],
};
// Script-aware aliases (Urdu/Nastaliq spellings of the same spoken words). Raw recall ignores these;
// script-aware recall uses them. Kept separate per Gurukul `hinglish-script-score`.
const URDU = {
  "s1-deva": [["دھیان"], ["برابر"], ["حصوں", "حصے"], ["بھن", "بھنّ", "بِھن"], ["کہلاتا"]],
  "s2-roman": [["ڈینومینیٹر", "ڈی نومینیٹر", "ڈینامینیٹر"], ["پیزا", "پزا"], ["برابر"], ["ٹکڑے"], ["کھائے", "کھاۓ"]],
  "s3-mixed": [["فوٹوسنتھیسس", "فوٹو سنتھیسس", "فوٹوسینتھیسس"], ["سن لائٹ", "سنلائٹ"], ["پانی"], ["کاربن"], ["ڈائی آکسائیڈ", "ڈائیآکسائیڈ", "ڈائی اکسائیڈ", "ڈائی آکسائڈ"]],
  "s4-numerals": [["ریکٹینگل", "ریکٹنگل", "ریکٹیںگل"], ["12", "بارہ"], ["5", "پانچ"], ["60", "ساٹھ"], ["اسکوائر", "سکوائر", "اسکوئر"]],
  "s5-english": [[], [], [], [], []],
};
const norm = (t) => t.toLowerCase().normalize("NFC").replace(/[़]/g, "").replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ");
const recall = (stim, text, sa = false) => KEYS[stim].filter((alts, i) => [...alts, ...(sa ? URDU[stim][i] : [])].some((a) => norm(text).includes(norm(a)))).length / KEYS[stim].length;
const urdu = (t) => /[؀-ۿ]/.test(t || "");
for (const r of rows) {
  if (r.err || !r.audio_s || r.audio_s < 0.2) continue;
  const wav = readFileSync(`${out}/${r.arm.replace(/[:|]/g, "_")}__${r.stim}.wav`);
  const fd = new FormData();
  fd.append("file", new Blob([wav], { type: "audio/wav" }), "a.wav");
  fd.append("language", r.stim === "s5-english" ? "en" : "hi");
  const res = await fetch(`${base}/openai/deployments/${DEP}/audio/transcriptions?api-version=2025-03-01-preview`, { method: "POST", headers: { "api-key": KEY }, body: fd });
  const text = res.ok ? (await res.json()).text || "" : `HTTP ${res.status}`;
  r.asr_hi = text; r.recall_hi = res.ok ? +recall(r.stim, text).toFixed(2) : null;
  r.recall_sa = res.ok ? +Math.max(recall(r.stim, text, true), recall(r.stim, r.asr || "", true)).toFixed(2) : null;
  r.heard_urdu_hinted = urdu(text);
  r.heard_urdu = urdu(r.asr); r.recall_nohint = r.key_recall = +recall(r.stim, r.asr || "").toFixed(2);
  console.log(`${r.arm} ${r.stim} raw=${r.recall_nohint}${r.heard_urdu ? "(URDU)" : ""} hinted=${r.recall_hi}${r.heard_urdu_hinted ? "(URDU)" : ""} script-aware=${r.recall_sa} :: ${text.slice(0, 80)}`);
}
writeFileSync(`${out}/results.json`, JSON.stringify(rows, null, 1));
