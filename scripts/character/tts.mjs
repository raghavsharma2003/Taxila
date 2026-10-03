// One real TTS sentence per look for the lip-sync evidence clip: Azure gpt-4o-mini-tts via server/azure.js (the same
// call the product makes). Keys come from .env.local (never printed). Run with NODE_USE_ENV_PROXY=1 in the sandbox.
//   node scripts/character/tts.mjs <outDir>
import fs from "node:fs";
import path from "node:path";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const { tts } = await import("../../server/azure.js");
const out = process.argv[2] || "docs/design/teacher/renders/audio";
fs.mkdirSync(out, { recursive: true });
// Hinglish, a class-4 fractions line: bilabials (p, b, m), dentals (t, d), a retroflex (ṭ in "baanta"), open vowels.
export const SENTENCE = "Chalo, aaj hum ek mazedaar cheez seekhenge. Agar ek pizza ko chaar barabar hisson mein baanta jaaye, toh har hissa ek-chauthai hota hai. Batao, do hisse milkar kitna hua?";
// Voices: the two live characters' ear-tested voices; the third look has no voice probed yet (VOICE-TEACHER §6),
// so "sage" stands in for this evidence clip only.
const VOICES = { teal: "marin", slate: "cedar", plum: "sage" };
const instructions = "A warm, clear Indian school teacher speaking Hinglish to a 9-year-old. Natural pace, friendly, not theatrical.";
for (const [look, voice] of Object.entries(VOICES)) {
  const f = path.join(out, `${look}.mp3`);
  if (fs.existsSync(f)) { console.log(`cached ${f}`); continue; }
  const buf = await tts(SENTENCE, voice, instructions);
  fs.writeFileSync(f, Buffer.from(buf));
  console.log(`wrote ${f} (${voice}, ${Buffer.from(buf).length} bytes)`);
}
fs.writeFileSync(path.join(out, "sentence.json"), JSON.stringify({ sentence: SENTENCE, voices: VOICES, model: process.env.DEPLOY_TTS || "gpt-4o-mini-tts", instructions, date: new Date().toISOString().slice(0, 10) }, null, 1));
