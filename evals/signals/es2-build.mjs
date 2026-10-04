// ES-2 controlled-prosody clips (SIGNALS-SPEC §7.1): Azure Speech neural voices (Azure-only directive) with SSML that
// fixes exact internal pauses (<break>), speaking rate and a raised pitch; onset silence is prepended DIGITALLY in
// es2-run.mjs (exact to the sample, unlike a leading <break>, which TTS may trim). 600 clips = 3 language modes × 20 bases
// (voice × text) × 10 variants. The SSML is the truth.
//
// TTS is not a child: these clips prove MEASUREMENT (extractor accuracy, invariance), never meaning
// (decision sig-synthetic-proves-measurement-only). Voices are standard neural (DragonHD ignores <prosody>,
// rj-prosody-rate-on-dragonhd); "child register" is approximated by pitch +15% [U].
//
//   node evals/signals/es2-build.mjs   → PCM cache (scratch, not committed) + evals/signals/data/es2-manifest.json
// Env: ES2_CACHE (default: the session scratchpad), ES2_LIMIT (clips, for a smoke run). Reads .env.local; prints no key.
import fs from "node:fs";
import path from "node:path";

const ROOT = new URL("../../", import.meta.url).pathname;
for (const l of fs.readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const REGION = process.env.AZURE_SPEECH_REGION_SIN || "centralindia";
const KEY = process.env.AZURE_SPEECH_KEY_SIN;
export const CACHE = process.env.ES2_CACHE || "/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/sig/es2";
const LIMIT = Number(process.env.ES2_LIMIT || 600);
/** USD per 1M characters, Azure neural TTS standard (list price, used only for the spend estimate). [V: Azure pricing page] */
const USD_PER_M = 15;

const VOICES = {
  hi: ["hi-IN-AnanyaNeural", "hi-IN-KavyaNeural", "hi-IN-RehaanNeural", "hi-IN-SwaraNeural"],
  hinglish: ["hi-IN-AnanyaNeural", "hi-IN-KavyaNeural", "hi-IN-AaravNeural", "hi-IN-RehaanNeural"],
  en: ["en-IN-AnanyaNeural", "en-IN-AashiNeural", "en-IN-RehaanNeural", "en-IN-KavyaNeural"],
};
// Texts without punctuation (so TTS adds no pauses of its own); the hi "lh" texts carry commas = non-final phrases (Hindi
// L-H rises, R §5.2), used for the f0 end-slope check and excluded from pause-count truth.
const TEXTS = {
  hi: [
    { t: "मेरे हिसाब से जवाब पांच है क्योंकि दोनों हिस्से बराबर हैं", lh: false },
    { t: "आधा बड़ा है क्योंकि उसमें दो ही टुकड़े हैं", lh: false },
    { t: "तीन और दो मिलाकर पांच होते हैं", lh: false },
    { t: "नीचे वाली संख्या को हर कहते हैं", lh: false },
    { t: "पौधे सूरज की रोशनी से खाना बनाते हैं", lh: false },
    { t: "मैंने पहले दो लिए, फिर तीन जोड़े, तो पांच हुआ", lh: true },
    { t: "अगर हर बड़ा हो, तो टुकड़े छोटे होते हैं, इसलिए यह छोटा है", lh: true },
    { t: "पहले ऊपर देखा, फिर नीचे देखा, और फिर तुलना की", lh: true },
    { t: "पानी गरम हुआ, भाप बनी, और बादल बन गए", lh: true },
    { t: "मैंने गिना, सात थे, फिर दो हटाए", lh: true },
  ],
  hinglish: [
    { t: "mujhe lagta hai answer paanch hai kyunki dono parts equal hain", lh: false },
    { t: "half bada hai kyunki usme sirf do pieces hain", lh: false },
    { t: "pehle maine numerator dekha phir denominator compare kiya", lh: false },
    { t: "plants sunlight se apna food banate hain", lh: false },
    { t: "teen plus do karke paanch aata hai", lh: false },
    { t: "denominator bada hoga toh pieces chhote honge", lh: false },
    { t: "water evaporate hota hai aur clouds ban jaate hain", lh: false },
    { t: "main isko do parts mein tod ke solve karti hoon", lh: false },
    { t: "ek pizza ke chaar slices mein se do khaye toh aadha bacha", lh: false },
    { t: "triangle ke teen sides hote hain aur teen angles", lh: false },
  ],
  en: [
    { t: "I think the answer is five because both parts are equal", lh: false },
    { t: "one half is bigger because it has only two pieces", lh: false },
    { t: "first I looked at the top number and then the bottom", lh: false },
    { t: "plants make their food from sunlight and water", lh: false },
    { t: "three plus two makes five so the answer is five", lh: false },
    { t: "when the bottom number is bigger the pieces are smaller", lh: false },
    { t: "water turns into vapour and then the clouds form", lh: false },
    { t: "I split it into two parts and added them together", lh: false },
    { t: "a triangle has three sides and three corners", lh: false },
    { t: "the numerator tells us how many pieces we take", lh: false },
  ],
};
const FILLERS = { hi: ["उम्म", "आआ", "मतलब"], hinglish: ["ummm", "aaa", "matlab"], en: ["ummm", "uhh", "like"] };
/** 10 variants per base: rate, internal pause durations (ms), digital onset (ms), filler lead. */
const VARIANTS = [
  { rate: 0, pauses: [], onset: 700, filler: false },
  { rate: -30, pauses: [], onset: 1500, filler: false },
  { rate: -15, pauses: [500], onset: 400, filler: false },
  { rate: 10, pauses: [300, 800], onset: 3000, filler: false },
  { rate: 20, pauses: [], onset: 2000, filler: false },
  { rate: 0, pauses: [500, 1100, 1500], onset: 1000, filler: false },
  { rate: 0, pauses: [], onset: 1000, filler: true },
  { rate: -15, pauses: [800], onset: 4500, filler: true },
  { rate: 0, pauses: [300, 500, 800, 1100], onset: 6000, filler: false },
  { rate: 10, pauses: [500, 800], onset: 700, filler: true },
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
function ssml(lang, voice, text, v, filler) {
  const words = text.split(" ");
  const k = v.pauses.length;
  const segs = [];
  for (let i = 0; i <= k; i++) segs.push(words.slice(Math.round((i * words.length) / (k + 1)), Math.round(((i + 1) * words.length) / (k + 1))).join(" "));
  let body = segs.map((s, i) => esc(s) + (i < k ? `<break time="${v.pauses[i]}ms"/>` : "")).join(" ");
  if (filler) body = `${esc(filler)}<break time="250ms"/> ${body}`;
  const loc = lang === "en" ? "en-IN" : "hi-IN";
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${loc}"><voice name="${voice}"><prosody rate="${v.rate >= 0 ? "+" : ""}${v.rate}%" pitch="+15%">${body}</prosody></voice></speak>`;
}

/** 40 extra Hindi clips that END on a non-final phrase (continuation word): the case where a Hindi L-H rise lands in
 *  f0EndSlopeStPerS (A9). Compared against the same voices' final statements (R §5.2 confound, O-2). */
const LH_END = ["मैंने पहले दो लिए, फिर", "अगर हर बड़ा हो, तो", "पहले ऊपर देखा, फिर", "पानी गरम हुआ, और", "मैंने गिना, सात थे, फिर",
  "आधा बड़ा है, क्योंकि", "तीन और दो, मतलब", "नीचे वाली संख्या, यानी", "पौधे सूरज से, और", "मैंने जोड़ा, तो"];

export function manifest() {
  const clips = [];
  for (const [vi, voice] of VOICES.hi.entries()) {
    for (const [ti, t] of LH_END.entries()) {
      const v = { rate: 0, pauses: [], onset: 1000, filler: false };
      clips.push({ id: `hi-lhend-v${vi}-t${ti}`, lang: "hi", base: `hi-lhend-${vi}`, voice, text: t, lh: true, lhEnd: true, words: t.split(" ").length, ...v, fillerWord: null, ssml: ssml("hi", voice, t, v, null) });
    }
  }
  for (const lang of ["hi", "hinglish", "en"]) {
    for (let b = 0; b < 20; b++) {
      const voice = VOICES[lang][b % 4];
      const text = TEXTS[lang][b % 10];
      for (const [vi, v] of VARIANTS.entries()) {
        const filler = v.filler ? FILLERS[lang][(b + vi) % 3] : null;
        clips.push({ id: `${lang}-b${b}-v${vi}`, lang, base: `${lang}-b${b}`, voice, text: text.t, lh: text.lh, words: text.t.split(" ").length, ...v, fillerWord: filler, ssml: ssml(lang, voice, text.t, v, filler) });
      }
    }
  }
  return clips;
}

async function synth(c) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const r = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST", headers: { "Ocp-Apim-Subscription-Key": KEY, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "raw-24khz-16bit-mono-pcm", "User-Agent": "taxila-signals-es2" }, body: c.ssml,
    });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    if (r.status === 429 || r.status >= 500) { await new Promise((s) => setTimeout(s, 1000 * 2 ** attempt)); continue; }
    throw new Error(`TTS ${r.status}: ${(await r.text()).slice(0, 160)}`);
  }
  throw new Error("TTS retries exhausted");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!KEY) throw new Error("AZURE_SPEECH_KEY_SIN missing from .env.local");
  fs.mkdirSync(CACHE, { recursive: true });
  const clips = manifest().slice(0, LIMIT);
  let chars = 0, made = 0, cached = 0, failed = 0;
  const queue = [...clips];
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const c = queue.shift();
      const f = path.join(CACHE, `${c.id}.pcm`);
      if (fs.existsSync(f) && fs.statSync(f).size > 1000) { cached++; continue; }
      try { fs.writeFileSync(f, await synth(c)); chars += c.ssml.length; made++; } catch (e) { failed++; console.warn(c.id, String(e.message).slice(0, 120)); }
    }
  }));
  const meta = { date: "2026-10-04", region: REGION, clips: clips.length, synthesized: made, cached, failed, ssmlCharsSent: chars, estUsdUpperBound: Math.round((chars / 1e6) * USD_PER_M * 100) / 100, cache: CACHE };
  fs.writeFileSync(new URL("./data/es2-manifest.json", import.meta.url), JSON.stringify({ meta, clips: manifest().map(({ ssml: _s, ...c }) => c) }, null, 1));
  console.log(JSON.stringify(meta));
}
