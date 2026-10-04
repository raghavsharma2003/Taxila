// Real-audio features for the duplex simulator: each scenario's segments as child-voice TTS clips (lib.mjs childClip: the
// cascade-latency recipe, cached outside the repo), assembled with the scripted pauses over -58 dBFS room noise exactly as
// live-validate.mjs streams them, then turned into 20 ms frames (RMS + the shipped YIN F0). The simulator then replays the
// real prosody and real segment durations, with the STT model and post-commit stages still drawn per seed.
// Needs Azure only for clips not yet cached (gpt-4o-mini-tts, ~USD 0.001 per clip).
import { loadEnv, ROOT, SR, childClip, noise, withNoise, pcmFrames } from "./lib.mjs";

export const LEAD_MS = 600, TAIL_MS = 4500;

let ttsCfg = null;
async function cfg() {
  if (ttsCfg) return ttsCfg;
  loadEnv();
  await import(ROOT + "server/net.js");
  const { endpoint } = await import(ROOT + "server/azure.js");
  ttsCfg = { endpoint: endpoint("TTS"), key: process.env.AZURE_OPENAI_API_KEY, deployment: process.env.DEPLOY_TTS || "gpt-4o-mini-tts" };
  return ttsCfg;
}

/** live-validate.mjs's buildAudio, voice and noise seeds by `idx` (the scenario's index in the streamed set). */
export async function assemble(sc, idx, { lead = LEAD_MS, tail = TAIL_MS } = {}) {
  const voice = idx % 2 ? "sage" : "coral";
  const parts = [noise(lead, idx + 1)], segs = [];
  let pos = lead, ttsNew = 0;
  for (const [si, [text, pause]] of sc.segs.entries()) {
    const c = await childClip(text, voice, await cfg());
    if (!c.cached) ttsNew++;
    const ms = Math.round((c.pcm.length / 2 / SR) * 1000);
    parts.push(withNoise(c.pcm, idx * 10 + si));
    segs.push({ start: pos, end: pos + ms, text, pause });
    pos += ms;
    if (pause) { parts.push(noise(pause, idx * 100 + si)); pos += pause; }
  }
  parts.push(noise(tail, idx + 7));
  const pcm = Buffer.concat(parts);
  return { pcm, segs, trueEnd: segs.at(-1).end, voice, ttsNew };
}

/**
 * Frames + segment durations + lead for every scenario, in the shape harness.mjs reads from `env`.
 * A teacher-overlap scenario's child audio starts at its scripted childStartMs.
 */
export async function ttsFeatures(scenarios, { indexOf = (sc, i) => i } = {}) {
  const frames = {}, segDur = {}, lead = {};
  let ttsNew = 0;
  for (const [i, sc] of scenarios.entries()) {
    const L = sc.teacher ? sc.teacher.childStartMs : LEAD_MS;
    const a = await assemble(sc, indexOf(sc, i), { lead: L, tail: 9500 });
    ttsNew += a.ttsNew;
    frames[sc.id] = await pcmFrames(a.pcm);
    segDur[sc.id] = a.segs.map((s) => s.end - s.start);
    lead[sc.id] = L;
  }
  return { frames, segDur, lead, ttsNew };
}
