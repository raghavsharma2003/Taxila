#!/usr/bin/env node
// AI-JUDGE PROXY for the v2 voice samples (experiments only, OpenRouter). Not a decision instrument: the lineage has
// already seen a metric winner lose by ear (companion-tech.md §2). The final call needs human Indian ears.
//
// Every clip in samples/*.mp3 (Azure sweep codes + ref-* OpenRouter references) plus human anchor clips is
// re-encoded identically (two-pass linear loudnorm -24 LUFS, mp3 64 kbps mono 24 kHz) so loudness and codec cannot
// unblind or bias, then sent as audio to each judge with the intended script. The judge never sees a file name,
// vendor, voice name or arm. Human anchors (IndicTTS-Hindi, native speakers reading studio prose) calibrate
// whether a judge can tell a real native speaker from TTS at all.
//
// Usage: set -a; . .env.local; set +a; NODE_USE_ENV_PROXY=1 node docs/research/voice/v2/judge-voices.mjs
//   env: JUDGE_TMP (re-encode cache dir), HUMAN_DIR (anchor wavs + meta.json), JUDGES (comma list), CONC
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { PASSAGES } from "./passages-ref.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const SAMPLES = path.join(HERE, "samples");
const OUTF = process.env.JUDGE_OUT || path.join(HERE, "judge-results.json");
const TMP = process.env.JUDGE_TMP || path.join(HERE, ".judge-tmp");
const HUMAN_DIR = process.env.HUMAN_DIR || null;
const OR = process.env.OPENROUTER_API_KEY;
const JUDGES = (process.env.JUDGES || "google/gemini-3.1-pro-preview,qwen/qwen3.8-omni-flash,openai/gpt-audio").split(",");
const RETEST_JUDGE = JUDGES[0], RETEST_FRAC = 0.15;
const CONC = +(process.env.CONC || 6);
fs.mkdirSync(TMP, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- clip inventory (code -> passage text). Names/arms stay in the KEY files, never reach the judge. ----
const keyAz = fs.existsSync(path.join(SAMPLES, "KEY.json")) ? JSON.parse(fs.readFileSync(path.join(SAMPLES, "KEY.json"), "utf8")) : {};
const keyRef = fs.existsSync(path.join(SAMPLES, "KEY-ref.json")) ? JSON.parse(fs.readFileSync(path.join(SAMPLES, "KEY-ref.json"), "utf8")).clips : {};
const clips = [];
for (const f of fs.readdirSync(SAMPLES).filter((f) => f.endsWith(".mp3")).sort()) {
  const ref = f.startsWith("ref-"); const code = f.replace(/^ref-/, "").replace(/\.mp3$/, "");
  const k = ref ? keyRef[code] : keyAz[code];
  if (!k || !PASSAGES[k.passage]) { console.log(`skip ${f}: no key/passage`); continue; }
  clips.push({ id: ref ? `ref-${code}` : code, file: path.join(SAMPLES, f), passage: k.passage, text: PASSAGES[k.passage].text, lang: PASSAGES[k.passage].lang, set: ref ? "openrouter-ref" : "azure" });
}
if (HUMAN_DIR && fs.existsSync(path.join(HUMAN_DIR, "meta.json"))) {
  const meta = JSON.parse(fs.readFileSync(path.join(HUMAN_DIR, "meta.json"), "utf8"));
  for (const [h, m] of Object.entries(meta)) clips.push({ id: `human-${h}`, file: path.join(HUMAN_DIR, `${h}.wav`), passage: "human-anchor", text: m.text, lang: "hindi", set: "human-anchor", maxDur: 20 });
}

if (process.env.CLIP_IDS) { const ids = new Set(process.env.CLIP_IDS.split(",")); const pick = clips.filter((c) => ids.has(c.id)); clips.length = 0; clips.push(...pick); }
if (process.env.LIMIT) { const L = +process.env.LIMIT; const pick = clips.filter((c) => c.set === "azure").slice(0, L).concat(clips.filter((c) => c.set !== "azure").slice(0, L)); clips.length = 0; clips.push(...pick); }

// ---- uniform re-encode ----
function prep(c) {
  const out = path.join(TMP, crypto.createHash("sha1").update(c.file + fs.statSync(c.file).size).digest("hex").slice(0, 12) + ".mp3");
  if (fs.existsSync(out)) return out;
  const pre = c.maxDur ? ["-t", String(c.maxDur)] : [];
  const fade = c.maxDur ? `,afade=t=out:st=${c.maxDur - 0.6}:d=0.6` : "";
  const s = execFileSync("sh", ["-c", `ffmpeg -hide_banner ${pre.join(" ")} -i "${c.file}" -af "aresample=24000${fade},loudnorm=I=-24:TP=-1:LRA=20:print_format=json" -f null - 2>&1 | sed -n '/{/,/}/p'`]).toString();
  const m = JSON.parse(s);
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...pre, "-i", c.file, "-af", `aresample=24000${fade},loudnorm=I=-24:TP=-1:LRA=20:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`, "-ac", "1", "-c:a", "libmp3lame", "-b:a", "64k", out]);
  return out;
}

// ---- rubric (judge instruction; the rubric itself is shapes + anchors, the clip is the only speech) ----
const RUBRIC = (c) => `You are an expert listener for Indian speech: a native Hindi speaker from North India who also teaches primary school and has heard thousands of hours of both real Indian teachers and synthetic voices.

You will hear ONE audio clip. It may be a real human recording or a text-to-speech voice; you are not told which. The speaker is meant to be an Indian teacher speaking to a child aged about 8-10. The intended words (${c.lang === "english" ? "English" : c.lang === "hindi" ? "Hindi" : "Hindi-English code-mixed"}) are:
"""${c.text}"""

Rate ONLY what you hear. Use the whole scale; 5 is rare and means a listener would not doubt it.
- native_indian (1-5): 1 = clearly a non-Indian speaker attempting the language; 3 = Indian-sounding but with something off (generic, accented, or foreign rhythm); 5 = unmistakably a native Indian (Hindi-belt) speaker.
- naturalness (1-5): 1 = robotic or synthetic (flat, metallic, glitchy, wrong stress, unnatural pauses); 3 = smooth but read-aloud or announcer-like; 5 = indistinguishable from a real person talking spontaneously.
- hindi_pronunciation (1-5): Hindi sounds (retroflex vs dental t/d, aspirates kh gh th dh bh, nasal vowels, schwa deletion, Hindi word stress). For an English-only clip rate the Indian-English pronunciation of the words instead.
- warmth_child (1-5): 1 = cold or flat; 3 = polite or neutral; 5 = genuinely warm, patient, engaged teacher speaking to one child.
- english_accent_leakage (true/false): true if any Hindi word carries a Western (American/British/European) accent: aspirated English-style t/p/k, r-colouring, English vowels, flattened retroflexes, or English intonation on Hindi.
- leakage_evidence: words where you hear it, or "".
- human_or_synthetic: "human" | "synthetic" | "unsure".
- mispronounced: list of words said wrongly (may be empty).
- script_deviation: true if words were added, dropped or replaced versus the intended words.
- reason: one short sentence.

Return only JSON: {"native_indian":n,"naturalness":n,"hindi_pronunciation":n,"warmth_child":n,"english_accent_leakage":bool,"leakage_evidence":"","human_or_synthetic":"","mispronounced":[],"script_deviation":bool,"reason":""}`;

function parseJSON(s) {
  if (!s) return null;
  const m = s.match(/\{[\s\S]*\}/); if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

async function judge(model, c, audio) {
  const b64 = fs.readFileSync(audio).toString("base64");
  const body = { model, temperature: 0, messages: [{ role: "user", content: [{ type: "text", text: RUBRIC(c) }, { type: "input_audio", input_audio: { data: b64, format: "mp3" } }] }] };
  if (!model.startsWith("openai/gpt-audio")) body.response_format = { type: "json_object" };
  else body.modalities = ["text"];
  for (let a = 1; a <= 4; a++) {
    const t0 = performance.now();
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${OR}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      const txt = j.choices?.[0]?.message?.content;
      const out = parseJSON(typeof txt === "string" ? txt : JSON.stringify(txt));
      if (r.ok && out && Number.isFinite(+out.native_indian)) return { ...out, _ms: Math.round(performance.now() - t0), _cost: j.usage?.cost ?? null };
      console.log(`  retry ${a} ${model} ${c.id} ${r.status} ${JSON.stringify(j).slice(0, 200)}`);
    } catch (e) { console.log(`  retry ${a} ${model} ${c.id} ${e.message}`); }
    await sleep(2500 * a);
  }
  return { error: true };
}

const res = fs.existsSync(OUTF) ? JSON.parse(fs.readFileSync(OUTF, "utf8")) : { schema: "taxila-voice-judge/v1", created: new Date().toISOString(), note: "AI-judge PROXY (OpenRouter, experiments only). Not a human ear test; final decision needs human Indian listeners.", judges: JUDGES, retest_judge: RETEST_JUDGE, ratings: {} };
const save = () => fs.writeFileSync(OUTF, JSON.stringify(res, null, 1));
const rng = (s) => parseInt(crypto.createHash("sha1").update(s).digest("hex").slice(0, 8), 16) / 0xffffffff;
const tasks = [];
for (const c of clips) {
  res.ratings[c.id] ??= { set: c.set, passage: c.passage, by: {} };
  for (const j of JUDGES) if (!res.ratings[c.id].by[j] || res.ratings[c.id].by[j].error) tasks.push({ c, j, slot: j });
  if (rng("retest" + c.id) < RETEST_FRAC || c.set === "human-anchor") { const slot = RETEST_JUDGE + "#retest"; if (!res.ratings[c.id].by[slot] || res.ratings[c.id].by[slot].error) tasks.push({ c, j: RETEST_JUDGE, slot }); }
}
console.log(`clips=${clips.length} tasks=${tasks.length}`);
let n = 0, k = 0;
await Promise.all(Array.from({ length: CONC }, async () => {
  while (k < tasks.length) {
    const t = tasks[k++];
    let audio; try { audio = prep(t.c); } catch (e) { console.log(`  missing ${t.c.id}: ${e.message.slice(0, 80)}`); continue; }
    const r = await judge(t.j, t.c, audio);
    res.ratings[t.c.id].by[t.slot] = r;
    if (++n % 10 === 0) { save(); console.log(`${n}/${tasks.length}`); }
  }
}));
save();
console.log("done", n);
