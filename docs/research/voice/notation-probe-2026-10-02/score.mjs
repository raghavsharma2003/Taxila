// Scores raw.json (G1-spoken-notation probe). Rubric classifier = taxila-brain, temperature 0, JSON out, one call per row,
// given the item's value, the mode/medium convention, what the engine was asked to say, and what was HEARD (ASR of the audio).
// This is a research measurement, not child grading; a hand audit of a random sample is logged beside it (audit.json).
// Run: set -a; . /home/user/Taxila/.env.local; set +a; node score.mjs
import fs from "fs";
import { ITEMS } from "./items.mjs";
const KEY = process.env.AZURE_OPENAI_API_KEY;
const OAI = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, "");
const BRAIN = process.env.DEPLOY_BRAIN || "taxila-brain";
const DIR = new URL("./", import.meta.url);
const raw = JSON.parse(fs.readFileSync(new URL("./raw.json", DIR), "utf8"));
const OUTF = new URL("./scored.json", DIR);
const prev = fs.existsSync(OUTF) ? JSON.parse(fs.readFileSync(OUTF, "utf8")).rows : [];
const done = new Map(prev.filter((r) => r.score && !r.score.err).map((r) => [`${r.engine}|${r.arm}|${r.mode}|${r.id}`, r.score]));
const byId = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MODE_RULE = {
  en: "English mode, English-medium school. Expected: English words for numbers and notation (Indian English: lakh/crore are CORRECT for Indian-comma numbers; 'upon', 'by', 'over', 'fourths', 'quarters' are all acceptable fraction readings). Any Hindi number word or Hindi maths term is FOREIGN to this mode.",
  hl: "Hinglish mode, English-medium school. Expected: Hindi sentence frame, but numbers and maths/science words in ENGLISH as an English-medium school uses them (twelve, three upon/by four, point, square root, lakh/crore). Hindi number words (baarah, teen, chauthai, bata, dashamlav) are FOREIGN to this medium. The ASR may write English words in Devanagari (ट्वेल्व = twelve): judge the words, not the script.",
  hi: "Hindi mode, Hindi-medium school (NCERT Hindi books). Expected: Hindi number words and NCERT Hindi-medium terms (तीन बटा चार or तीन-चौथाई; दशमलव; की घात / का वर्ग / का घन; वर्गमूल; ऋण; वर्ग सेंटीमीटर; डिग्री सेल्सियस; प्रतिशत; लाख/करोड़). English number words or English maths terms where a Hindi-medium term exists (three, point, square root, by, minus, percent) are FOREIGN; unit names like सेंटीमीटर, किलोग्राम, डिग्री सेल्सियस are expected loanwords, not foreign.",
};

const SYS = `You classify how a teacher voice spoke one maths/science item. You get: the item's intended value, the language-mode convention, the text the engine was given, the engine's own transcript (if any), and HEARD = an automatic transcript of the audio (it can have its own errors).
Return JSON only:
{"heard":"<=15 words: how the notation was actually voiced, from HEARD",
 "render_error":bool,   // notation voiced wrongly or unnaturally: a symbol read literally (slash, caret, hat, superscript, comma, 'C' for celsius when it should be degrees Celsius), a sign/unit/power/root/decimal point dropped, a mixed number voiced as a single number, garbled or nonsense rendering, or the item not posed at all
 "number_misread":bool, // any numeric VALUE in HEARD differs from the intended value (wrong digit, wrong place value, 7.05 heard as 7.5, 2 1/3 as 21/3, 1,250 as 125, lakh as thousand, wrong power). A different but equivalent wording is NOT a misread.
 "mixed_convention":bool, // within this one item, more than one convention for the same kind of notation (e.g. 'one by two' and 'one-fourth' together; Hindi and English number words mixed; lakh and million mixed for one number), OR a convention FOREIGN to the mode (see MODE).
 "digit_exact":bool|null, // ONLY for helpline items: true if the number was voiced digit by digit with every digit right; else false. null for other items.
 "asr_suspect":bool,    // true if a flagged error looks like an artefact of the automatic transcript rather than the voice (compare with the engine transcript / given text)
 "note":"<=20 words"}
Judge only the notation and numbers, not the teacher's lead-in wording. Common Indian-English forms are acceptable, not errors: 'three fourth', 'two cube', 'centimetre square', 'into' for times, 'is to' for a ratio. Be strict and literal otherwise.`;

async function judge(r) {
  const it = byId[r.id];
  const user = `ITEM ${r.id} (${r.cls}) intended value: ${it.value}${it.digitExact ? ` [HELPLINE, must be digit-exact ${it.digitExact}]` : ""}
MODE: ${MODE_RULE[r.mode]}
ENGINE: ${r.engine === "rt" ? "realtime voice model (posed the item to a child)" : "text-to-speech (read the given text)"}
GIVEN TEXT: ${r.input}
ENGINE TRANSCRIPT: ${r.model_text ?? "(none: TTS)"}
HEARD: ${r.asr}`;
  for (let a = 1; a <= 4; a++) {
    const res = await fetch(`${OAI}/chat/completions`, { method: "POST", headers: { "api-key": KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ model: BRAIN, messages: [{ role: "system", content: SYS }, { role: "user", content: user }], response_format: { type: "json_object" } }) });
    if (res.status === 429) { await sleep(4000 * a); continue; }
    if (!res.ok) return { err: `HTTP ${res.status} ${(await res.text()).slice(0, 100)}` };
    try { return JSON.parse((await res.json()).choices[0].message.content); } catch (e) { return { err: "parse" }; }
  }
  return { err: "429" };
}

const rows = raw.rows.filter((r) => !r.err);
let k = 0;
async function worker() {
  while (k < rows.length) {
    const r = rows[k++]; const key = `${r.engine}|${r.arm}|${r.mode}|${r.id}`;
    r.score = done.get(key) || await judge(r);
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
fs.writeFileSync(OUTF, JSON.stringify({ date: "2026-10-02", judge: BRAIN, sys: SYS, mode_rule: MODE_RULE, rows }, null, 1));

// Tables
const pct = (a, n) => (n ? `${a}/${n} (${Math.round((100 * a) / n)}%)` : "-");
const ok = rows.filter((r) => r.score && !r.score.err);
const line = (lab, set) => {
  const n = set.length, re = set.filter((r) => r.score.render_error).length, mc = set.filter((r) => r.score.mixed_convention).length,
    nm = set.filter((r) => r.score.number_misread).length, nmClean = set.filter((r) => r.score.number_misread && !r.score.asr_suspect).length,
    reClean = set.filter((r) => r.score.render_error && !r.score.asr_suspect).length;
  return `| ${lab} | ${n} | ${pct(re, n)} | ${pct(reClean, n)} | ${pct(mc, n)} | ${pct(nm, n)} | ${pct(nmClean, n)} |`;
};
const out = ["| cell | n | rendering error | rendering error (excl. ASR-suspect) | mixed convention | number misread | number misread (excl. ASR-suspect) |", "|---|---|---|---|---|---|---|"];
for (const e of ["rt", "tts"]) for (const a of ["W", "P"]) out.push(line(`${e} ${a} all`, ok.filter((r) => r.engine === e && r.arm === a)));
for (const e of ["rt", "tts"]) for (const a of ["W", "P"]) for (const m of ["en", "hl", "hi"]) out.push(line(`${e} ${a} ${m}`, ok.filter((r) => r.engine === e && r.arm === a && r.mode === m)));
out.push("", "| class | rt W err/mix/mis | rt P err/mix/mis | tts W err/mix/mis | tts P err/mix/mis |", "|---|---|---|---|---|");
const classes = [...new Set(ITEMS.map((i) => i.cls.split("-")[0]))];
for (const c of classes) {
  const cell = (e, a) => { const s = ok.filter((r) => r.engine === e && r.arm === a && r.cls.split("-")[0] === c);
    return `${s.filter((r) => r.score.render_error).length}/${s.filter((r) => r.score.mixed_convention).length}/${s.filter((r) => r.score.number_misread).length} of ${s.length}`; };
  out.push(`| ${c} | ${cell("rt", "W")} | ${cell("rt", "P")} | ${cell("tts", "W")} | ${cell("tts", "P")} |`);
}
const hl = ok.filter((r) => r.cls === "helpline");
out.push("", "helpline digit-exact:", ...hl.map((r) => `- ${r.engine} ${r.arm} ${r.mode} ${r.id}: ${r.score.digit_exact} :: ${r.asr}`));
fs.writeFileSync(new URL("./tables.md", DIR), out.join("\n"));
console.log(out.join("\n"));
console.log(`judge errors: ${rows.filter((r) => r.score?.err).length}`);
