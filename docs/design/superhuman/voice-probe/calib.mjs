import { judgeClip } from "./rtjudge.mjs";
import fs from "node:fs";
const scene = "A teacher reacts to a child's funny answer, then moves on to the next question.";
const words = "अरे, यह तो बहुत funny था! चलो, अब अगला सवाल देखते हैं।";
const C = [
 ["spoken-laughter-word", "cap/diya-en-laughter-bracket.mp3", {spoken_direction:true}],
 ["spoken-breathing-word", "cap/diya-en-breathing-bracket.mp3", {spoken_direction:true}],
 ["plain", "cap/diya-hi-plain.mp3", {spoken_direction:false, laugh:false}],
 ["pure-laugh-tag-omni", "bank-test/hi-IN-Diya-laugh.wav", {laugh:true}],
 ["pure-hum-omni", "bank-test/hi-IN-Arjun-hum.wav", {hum:true}],
 ["two-speakers", "bank-test/ctrl-two-speakers.wav", {same_speaker:false}],
 ["long-silence", "cap/priyaHD-hi-laughter-bracket.mp3", {long_pause:true}],
 ["omni-laughter-tag-in-line", "cap/omniSwara-hi-laughter-bracket.mp3", {}],
 ["omni-sigh-tag-in-line", "cap/omniSwara-hi-sigh-bracket.mp3", {}],
];
const out = [];
for (const [id, f, exp] of C) for (const rep of [1,2]) {
  const j = await judgeClip(f, { scene, words });
  const hits = Object.entries(exp).map(([k,v]) => `${k}:${j[k]===v?"OK":"MISS("+j[k]+")"}`).join(" ");
  console.log(id, rep, hits, JSON.stringify(j).slice(0,260));
  out.push({ id, rep, exp, j });
}
fs.writeFileSync("calib-results.json", JSON.stringify(out, null, 1));
