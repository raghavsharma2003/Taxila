// duplex r4: a SYNTHETIC child-like clip with controlled mid-sentence pauses (Azure gpt-4o-mini-tts, x1.2 pitch, the
// first-sound.mjs voice), for the hands-free mid-utterance check. Each phrase is synthesised alone and joined with exactly
// `--pause` ms of silence, so the pause the engine meets is known to the frame. Not a child; label every number from it so.
//   node --env-file=.env.local evals/duplex-r4/synth-midpause.mjs --out <file.wav> --pause 450 "phrase one" "phrase two" ...
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); if (i < 0) return d; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const out = opt("--out", null), pauseMs = Number(opt("--pause", 450)), voice = opt("--voice", "shimmer");
const phrases = argv;
const SR = 24000;
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""), KEY = process.env.AZURE_OPENAI_API_KEY;
const CHILD_VOICE = "Voice of a shy 9-year-old Indian child answering a teacher in class. Natural, a little hesitant, Indian accent, not theatrical.";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "midpause-"));
const trim = (b) => { // drop leading / trailing silence so the pause between phrases is exactly pauseMs
  const thr = 32768 * 0.01, n = b.length >> 1;
  let a = 0, z = n - 1;
  while (a < n && Math.abs(b.readInt16LE(a * 2)) < thr) a++;
  while (z > a && Math.abs(b.readInt16LE(z * 2)) < thr) z--;
  return b.subarray(a * 2, (z + 1) * 2);
};
const parts = [];
for (const [i, text] of phrases.entries()) {
  const r = await fetch(`${E}/audio/speech`, { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.DEPLOY_TTS || "gpt-4o-mini-tts", voice, input: text, instructions: CHILD_VOICE, response_format: "pcm" }) });
  if (!r.ok) throw new Error(`tts ${r.status} ${(await r.text()).slice(0, 200)}`);
  const a = path.join(tmp, `in${i}.pcm`), b = path.join(tmp, `out${i}.pcm`);
  fs.writeFileSync(a, Buffer.from(await r.arrayBuffer()));
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", String(SR), "-ac", "1", "-i", a, "-af", `asetrate=${SR * 1.2},aresample=${SR},atempo=${(1 / 1.2).toFixed(4)}`, "-f", "s16le", "-ar", String(SR), "-ac", "1", b]);
  const pcm = trim(fs.readFileSync(b));
  if (i) parts.push(Buffer.alloc(Math.round((pauseMs * SR) / 1000) * 2));
  parts.push(pcm);
  console.log(`phrase ${i}: ${Math.round(pcm.length / 2 / SR * 1000)} ms "${text}"`);
}
const raw = path.join(tmp, "all.pcm");
fs.writeFileSync(raw, Buffer.concat(parts));
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", String(SR), "-ac", "1", "-i", raw, "-ar", "48000", out]);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`wrote ${out}: ${Math.round(Buffer.concat(parts).length / 2 / SR * 1000)} ms, pauses ${pauseMs} ms x ${phrases.length - 1}`);
