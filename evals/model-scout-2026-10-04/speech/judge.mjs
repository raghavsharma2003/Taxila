// Speech scout 2026-10-04: AI-judge proxy for Polly vs DragonHD Diya on the 5 HUMAN-VOICE lines, using the SAME
// instrument as HUMAN-VOICE §4.3 (docs/design/superhuman/voice-probe/rtjudge.mjs, gpt-realtime-2.1 `taxila-realtime`,
// calibrated 11/16 on known controls; a weak instrument, not a decision). Diya clips are RE-JUDGED in this run so
// every arm is scored by the same judge on the same day.
//   asr   : taxila-transcribe ASR -> content-word recall + spoken-tag leak (same recall() as voice-probe/analyze.mjs)
//   judge : judgeClip x2 per clip (humanlike, emotion_fit, pitch_movement, glitch, events)
//   pair  : judgePair position-swapped (A/B then B/A) Polly arm vs Diya plain, and vs Diya full layer
// Run: NODE_USE_ENV_PROXY=1 WS_FROM=<dir with node_modules/ws>/ node judge.mjs [asr|judge|pair|all]
import "./env.mjs";
import fs from "node:fs";
const VP = new URL("../../../docs/design/superhuman/voice-probe/", import.meta.url).pathname;
const { LINES } = await import(VP + "lines.mjs");
const { judgeClip, judgePair } = await import(VP + "rtjudge.mjs");
const KEY = process.env.AZURE_OPENAI_API_KEY, OAI = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");
const MODE = process.argv[2] || "all";
const OUT = new URL("./results/judge.json", import.meta.url).pathname;
const R = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
const save = () => fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
const HERE = new URL("./wav/", import.meta.url).pathname;
const ARMS = {
  "polly-kajal-neural-aps1": (l) => `${HERE}polly-kajal-neural-hi-aps1__${l}__plain.wav`,
  "polly-kajal-gen-use1": (l) => `${HERE}polly-kajal-gen-hi-use1__${l}__plain.wav`,
  "dhd-diya-plain": (l) => `${VP}wav/dhd-diya__${l}__plain.wav`,
  "dhd-diya-fulllayer": (l) => `${VP}wav/dhd-diya__${l}__expressive.spliced.wav`,
};
const clips = Object.entries(ARMS).flatMap(([arm, f]) => LINES.map((L) => ({ id: `${arm}__${L.id}`, arm, line: L.id, file: f(L.id) })));
const lineOf = (id) => LINES.find((l) => l.id === id);
const LEAK = /laugh|breath|sigh|amused|softly|chuckl|bracket|neutral|reflective|intrigued|appreciative|reassuring|लाफ|ब्रीद|साइ[गंन]|सांस|साँस|हंस|हँस|न्यूट्रल|एम्यूज़|\[|\]/i;
const norm = (s) => s.normalize("NFC").replace(/[़]/g, "").toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
const ALIAS = { tens: ["टेंस", "टेन्स"], total: ["टोटल"], cold: ["कोल्ड"], drink: ["ड्रिंक"], burp: ["बर्प"], divide: ["डिवाइड"], pizza: ["पिज़्ज़ा", "पिज्जा", "पिज़ा"] };
function recall(line, said) {
  const s = new Set(norm(said)); const ws = norm(line.text);
  const hit = ws.filter((w) => s.has(w) || (ALIAS[w] || []).some((a) => s.has(a.normalize("NFC").replace(/[़]/g, ""))));
  return +(hit.length / ws.length).toFixed(3);
}
async function asr(file) {
  const fd = new FormData(); fd.append("file", new Blob([fs.readFileSync(file)], { type: "audio/wav" }), "a.wav");
  const base = OAI.replace(/\/openai\/v1$/, "");
  for (let a = 0; a < 3; a++) {
    const r = await fetch(`${base}/openai/deployments/taxila-transcribe/audio/transcriptions?api-version=2025-03-01-preview`, { method: "POST", headers: { "api-key": KEY }, body: fd });
    if (r.ok) return (await r.json()).text || "";
    await new Promise((s) => setTimeout(s, 2000 * (a + 1)));
  }
  return null;
}
const NOAUDIO = /no (audible )?(audio|clip|recording|content)|no actual audio|wasn.t any audio|not provided/i;
if (MODE === "asr" || MODE === "all") for (const c of clips) {
  R[c.id] ??= {}; if (R[c.id].asr != null) continue;
  const said = await asr(c.file); if (said == null) { console.log(c.id, "ASR ERR"); continue; }
  R[c.id].asr = said; R[c.id].leak = LEAK.test(said); R[c.id].recall = recall(lineOf(c.line), said); save();
  console.log(c.id, R[c.id].recall, said.slice(0, 80));
}
if (MODE === "judge" || MODE === "all") for (const c of clips) {
  R[c.id] ??= {}; const l = lineOf(c.line);
  for (const rep of [0, 1]) {
    const k = `judge${rep}`; if (R[c.id][k] && !R[c.id][k].error) continue;
    let j; for (let t = 0; t < 4; t++) { j = await judgeClip(c.file, { scene: l.scene, words: l.text }); if (!j.error && !NOAUDIO.test(j.reason || "")) break; j = { error: true, reason: j.reason }; }
    R[c.id][k] = j; save();
    console.log(c.id, rep, j.error ? "ERR" : `hl=${j.humanlike} fit=${j.emotion_fit} pitch=${j.pitch_movement} glitch=${j.glitch} | ${j.reason}`);
  }
}
if (MODE === "pair" || MODE === "all") {
  R.__pairs ??= {};
  for (const polly of ["polly-kajal-neural-aps1", "polly-kajal-gen-use1"]) for (const ref of ["dhd-diya-plain", "dhd-diya-fulllayer"]) for (const L of LINES) {
    const key = `${polly}__vs__${ref}__${L.id}`; if (R.__pairs[key]?.ab && R.__pairs[key]?.ba && !R.__pairs[key].ab.error && !R.__pairs[key].ba.error) continue;
    const p = ARMS[polly](L.id), d = ARMS[ref](L.id);
    const ab = await judgePair(p, d, { scene: L.scene }); // A = Polly
    const ba = await judgePair(d, p, { scene: L.scene }); // A = Diya
    const vote = (w, pollyIs) => (w === "tie" || !w ? 0 : w === pollyIs ? 1 : -1);
    R.__pairs[key] = { ab, ba, pollyScore: vote(ab.winner, "A") + vote(ba.winner, "B") }; save();
    console.log(key, ab.winner, ba.winner, "polly score", R.__pairs[key].pollyScore);
  }
}
