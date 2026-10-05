// Owner ear check 2026-10-05 ("she speaks extremely slow, like she is drunk; not the version we voted for"): speak the
// voted final passages through the PRODUCTION render path (styleForChild -> expressive plan -> renderParts -> DragonHD)
// at a given base rate, and compare speaking speed with the voted Diya renders (docs/research/voice/final/renders/wav).
// Measures: audio seconds (PCM after the engine, plus the planned pauses), words per second. Not an ear: a proxy.
//   node evals/voice-pace-owner/measure.mjs <rate> <expressive 1|0>
import { readFileSync } from "node:fs";
import { PASSAGES, textOf } from "../../docs/research/voice/final/passages.mjs";
import { styleForChild } from "../../server/routes/voice.js";
import { expressiveSeam } from "../../server/voice/expressive/seam.js";
import { renderParts } from "../../server/voice/expressive/render.js";
import { dhdStream } from "../../server/voice/azureTts.js";

const [rate = "0", expr = "1"] = process.argv.slice(2);
process.env.TAXILA_DHD_RATE_ASHA = rate;
if (expr === "0") process.env.TAXILA_VOICE_EXPRESSIVE = "0";
const child = { id: "00000000-0000-0000-0000-000000000001", class_level: 4, teacher_id: "asha", language: "hinglish" };
const style = styleForChild(child, "9-12");
const moment = { move: "explain", verdict: "ungraded", engagement: "engaged", teacherAffect: { display: "neutral_warm", intensity: 1, cause: "none", turn: 2 },
  bondStage: "first_sessions", safety: false, childLaughed: false, thinkAloud: false, band: "B2", lang: "hinglish" };
const wavSec = (f) => { const b = readFileSync(f); return (b.length - 44) / (24000 * 2); };
const rows = [];
for (const p of PASSAGES) {
  const text = textOf(p), words = text.split(/\s+/).filter(Boolean).length;
  const delivery = expr === "0" ? null : expressiveSeam.planDelivery(moment, text);
  const { parts } = renderParts({ lessonId: "pace-eval", seq: 1, text, style, delivery, log: false });
  let samples = 0, pauseMs = 0;
  for (const part of parts) {
    pauseMs += part.pauseBeforeMs || 0;
    const s = await dhdStream(part.render.ssml);
    for await (const c of s.chunks) samples += c.length / 2;
  }
  const sec = samples / 24000 + pauseMs / 1000;
  const voted = wavSec(`docs/research/voice/final/renders/wav/diya__${p.id}.wav`);
  rows.push({ passage: p.id, words, parts: parts.length, planned: !!delivery, sec: +sec.toFixed(1), wps: +(words / sec).toFixed(2), votedSec: +voted.toFixed(1), votedWps: +(words / voted).toFixed(2), slowerThanVoted: `${Math.round((sec / voted - 1) * 100)}%` });
}
console.log(JSON.stringify({ rate, expressive: expr, style: style.dhd, rows }, null, 1));
