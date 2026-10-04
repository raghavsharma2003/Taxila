// analyze.mjs — per final clip: ASR (taxila-transcribe) for spoken-tag leakage + content-word recall, then the
// calibrated realtime audio judge (events) and a position-swapped pairwise judge (plain vs expressive, same arm).
// Run from voice-probe/: NODE_USE_ENV_PROXY=1 WS_FROM=<ws dir>/ node analyze.mjs [asr|judge|pair|all]
import fs from "node:fs";
import { LINES } from "./lines.mjs";
import { judgeClip, judgePair } from "./rtjudge.mjs";
const KEY = process.env.AZURE_OPENAI_API_KEY, OAI = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");
const MODE = process.argv[2] || "all";
const R = fs.existsSync("analysis.json") ? JSON.parse(fs.readFileSync("analysis.json", "utf8")) : {};
const save = () => fs.writeFileSync("analysis.json", JSON.stringify(R, null, 1));

// final clip set: dhd expressive appears twice (unspliced = layer without clips; spliced = full layer)
const clips = fs.readdirSync("wav").filter((f) => f.endsWith(".wav")).map((f) => {
  const base = f.replace(/\.wav$/, ""); const [arm, line, condRaw] = base.split("__");
  const cond = condRaw === "expressive.spliced" ? "expressive" : condRaw === "expressive" && arm.startsWith("dhd-") ? "expressive-noclip" : condRaw;
  return { id: `${arm}__${line}__${cond}`, file: `wav/${f}`, arm, line, cond };
});
fs.writeFileSync("clips.json", JSON.stringify(clips, null, 1));
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
    const r = await fetch(`${base}/openai/deployments/${process.env.DEPLOY_TRANSCRIBE || "taxila-transcribe"}/audio/transcriptions?api-version=2025-03-01-preview`, { method: "POST", headers: { "api-key": KEY }, body: fd });
    if (r.ok) return (await r.json()).text || "";
    await new Promise((s) => setTimeout(s, 2000 * (a + 1)));
  }
  return "";
}
const NOAUDIO = /no (audible )?(audio|clip|recording|content)|no actual audio|wasn.t any audio|not provided/i;

if (MODE === "asr" || MODE === "all") for (const c of clips) {
  R[c.id] ??= {}; if (R[c.id].asr !== undefined) continue;
  const said = await asr(c.file); const l = lineOf(c.line);
  R[c.id].asr = said; R[c.id].leak = LEAK.test(said); R[c.id].recall = recall(l, said);
  console.log(c.id, R[c.id].leak ? "LEAK" : "", R[c.id].recall, said.slice(0, 90)); save();
}
if (MODE === "judge" || MODE === "all") for (const c of clips) {
  R[c.id] ??= {}; const l = lineOf(c.line);
  for (const rep of [0, 1]) {
    const k = `judge${rep}`; if (R[c.id][k] && !R[c.id][k].error) continue;
    let j; for (let t = 0; t < 4; t++) { j = await judgeClip(c.file, { scene: l.scene, words: l.text }); if (!j.error && !NOAUDIO.test(j.reason || "")) break; j = { error: true, reason: j.reason }; }
    R[c.id][k] = j; save();
    console.log(c.id, rep, j.error ? "ERR" : `laugh=${j.laugh} breath=${j.breath} hum=${j.hum} dir=${j.spoken_direction}:${j.spoken_direction_word} glitch=${j.glitch} hl=${j.humanlike} fit=${j.emotion_fit}`);
  }
}
if (MODE === "pair" || MODE === "all") {
  R.__pairs ??= {};
  const arms = [...new Set(clips.map((c) => c.arm))];
  for (const arm of arms) for (const l of LINES) {
    const plain = clips.find((c) => c.arm === arm && c.line === l.id && c.cond === "plain");
    for (const ex of clips.filter((c) => c.arm === arm && c.line === l.id && c.cond.startsWith("expressive"))) {
      const key = `${arm}__${l.id}__${ex.cond}`; if (R.__pairs[key]?.ab && R.__pairs[key]?.ba) continue;
      const ab = await judgePair(plain.file, ex.file, { scene: l.scene }); // A = plain
      const ba = await judgePair(ex.file, plain.file, { scene: l.scene }); // A = expressive
      const vote = (w, exIs) => (w === "tie" || !w ? 0 : w === exIs ? 1 : -1);
      R.__pairs[key] = { ab, ba, exScore: vote(ab.winner, "B") + vote(ba.winner, "A") }; save();
      console.log(key, ab.winner, ba.winner, "expressive score", R.__pairs[key].exScore);
    }
  }
}
