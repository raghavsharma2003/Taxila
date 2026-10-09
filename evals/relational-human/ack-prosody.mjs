// Round 3, stream relational-human: how the acknowledgement SOUNDS. Renders the ack phrase in the lesson voice (the
// production render: server/latency/ackAudio.js → preludeRender → DragonHD Diya for Asha, Arjun's voice for Arjun) in
// text variants that change only the trailing punctuation, and writes each clip as s16le 24 kHz PCM for
// ack-prosody-analyse.py (F0 contour of the final voiced stretch, duration, level). The point: a teacher's thinking echo is
// LEVEL or gently continuing ("chhe faces…"), never a falling statement (reads "yes, that's it") nor a rise (reads
// "really?"): both would carry a verdict the words do not.
//
//   node <envrun> node evals/relational-human/ack-prosody.mjs --out DIR [--teacher asha]
import fs from "fs";
import path from "path";

const argv = process.argv;
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const OUT = arg("out");
const TEACHER = arg("teacher", "asha");
if (!OUT) throw new Error("--out DIR");
fs.mkdirSync(OUT, { recursive: true });
const { styleForChild } = await import("../../server/routes/voice.js");
const { ackAudio } = await import("../../server/latency/ackAudio.js");

const child = { id: "00000000-0000-0000-0000-000000000000", first_name: "Aarav", class_level: 4, language_pref: "hinglish", teacher_id: TEACHER, school_medium: "english" };
const style = styleForChild(child, undefined, TEACHER, undefined, {});
console.log(`engine=${style.engine ?? "oai"} voice=${style.dhd?.voice ?? style.voice}`);
const PHRASES = ["chhe faces", "aath corners", "baarah edges", "teen faces", "paanch", "chaar corners", "56", "3/4"];
const VARIANTS = { plain: (p) => p, comma: (p) => `${p},`, question: (p) => `${p}?` };
const rows = [];
for (const p of PHRASES) {
  for (const [v, f] of Object.entries(VARIANTS)) {
    const text = f(p);
    const t0 = performance.now();
    const pcm = await ackAudio(text, style);
    const ms = Math.round(performance.now() - t0);
    const file = path.join(OUT, `${p.replace(/[^a-z0-9]+/gi, "_")}__${v}.pcm`);
    if (pcm) fs.writeFileSync(file, pcm);
    rows.push({ phrase: p, variant: v, text, file: pcm ? path.basename(file) : null, synthMs: ms, clipMs: pcm ? Math.round((pcm.length / 2 / 24000) * 1000) : null });
    console.log(`${p.padEnd(14)} ${v.padEnd(9)} synth ${ms} ms clip ${rows.at(-1).clipMs} ms`);
  }
}
// cache check: the same text again is the same bytes (verdict-neutral by construction)
const again = await ackAudio("chhe faces", style);
const first = fs.readFileSync(path.join(OUT, "chhe_faces__plain.pcm"));
console.log(`same text, same bytes: ${!!again && again.equals(first)}`);
fs.writeFileSync(path.join(OUT, "renders.json"), JSON.stringify({ date: new Date().toISOString(), teacher: TEACHER, engine: style.engine ?? "oai", voice: style.dhd?.voice ?? style.voice, rows }, null, 1));
process.exit(0);
