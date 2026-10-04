// judge.mjs: listen-proxy pass 3, AI audio judge on the failure list (2026-10-04). RESEARCH INSTRUMENT ONLY.
// Known weak: the same gpt-realtime family missed hums and silences in round 1 (HUMAN-VOICE 4.3, calibrated 11/16), and
// gpt-audio was uninformative on nativeness (rejected.md gpt-audio-not-a-judge). It is one column of six in SCREEN.md,
// never a decision. Two models, ONE family (OpenAI): gpt-realtime-2.1 (`taxila-realtime`) and gpt-realtime-2.1-mini. gpt-live-1
// (`taxila-live`) refused the realtime text-out socket (HTTP 400; it speaks the /live/sessions protocol).
// A second family was tried and failed: Phi-4-multimodal-instruct (Azure, Microsoft) has no Hindi speech support and
// garbled the probe line; Voxtral on Bedrock is at 0 tokens/day quota on this account (see SCREEN.md section 5).
// Clips: every hosted render, take 1 of every open-weight cell, and the round-1 DragonHD Diya plain anchor (240 clips).
// Audio is loudness-normalised to -24 LUFS before it is sent (rtjudge pcmOf), so level does not leak into the score.
// Run: cd /home/user/Taxila; WS_FROM=<dir with node_modules/ws>/ node docs/research/voice/v3/screen/judge.mjs
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
const ROOT = new URL("../../../../../", import.meta.url).pathname;
for (const l of fs.readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const require = createRequire(process.env.WS_FROM || import.meta.url);
const WebSocket = require("ws");
const KEY = process.env.AZURE_OPENAI_API_KEY, HOST = new URL(process.env.AZURE_OPENAI_ENDPOINT).host;
const HERE = new URL("./", import.meta.url).pathname;
const OUT = HERE + "judge.json";
const R = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
const save = () => fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
const MODELS = (process.env.JUDGES || "taxila-realtime,gpt-realtime-2.1-mini").split(",");
const pcmOf = (file) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", file, "-af", "loudnorm=I=-24:TP=-1", "-ac", "1", "-ar", "24000", "-f", "s16le", "-"], { maxBuffer: 64 << 20 });
const scenes = JSON.parse(fs.readFileSync(HERE + "scenes.json", "utf8"));
const SYS = `You are a strict audio analyst for a voice casting panel. You only report what is audible in the recording. You never guess from the text. Output only one JSON object, no prose.`;
const Q = (s) => `The recording is a text-to-speech candidate for a warm young Indian school teacher talking to one child of about nine, in Hinglish (Hindi with some English words).
Moment: ${s.scene}
The child just said: ${s.child}
Intended words: """${s.text}"""
Listen to the recording and report, judging only the delivery you hear:
- talking 1-5: 1 = clearly reading a script aloud, 5 = spontaneously talking to this child
- warmth 1-5: 1 = cold or flat, 5 = genuinely warm and engaged with the child
- accent 1-5: 1 = foreign or English-accented Hindi, or the accent switches between Hindi and English words; 5 = one consistent native Indian accent for every word
- english_accented_hindi: true/false (Hindi words sound like a non-native, e.g. English, speaker)
- accent_switch: true/false (English words are said in a different accent from the Hindi words)
- voice_change: true/false (the voice, timbre or recording room changes inside the clip)
- odd_pause: true/false (a pause placed on a random word, mid-phrase, as fake emphasis), odd_pause_where: the word or ""
- rate: "slow" | "ok" | "rushed"
- spoken_punctuation: true/false (punctuation or a tag or a stage direction is read out as words, e.g. "dot dot")
- wrong_words: true/false (any word missing, added, repeated or different from the intended words, including numbers)
- laugh: "none" | "natural" | "forced" (an audible laugh sound, not the word)
- humanlike 1-5: 1 = clearly synthetic, 5 = indistinguishable from a real person talking
- reason: one short sentence
JSON keys exactly: talking, warmth, accent, english_accented_hindi, accent_switch, voice_change, odd_pause, odd_pause_where, rate, spoken_punctuation, wrong_words, laugh, humanlike, reason`;

function ask(model, instructions, pcm) {
  return new Promise((resolve) => {
    const ws = new WebSocket(`wss://${HOST}/openai/v1/realtime?model=${model}`, { headers: { "api-key": KEY } });
    let txt = "", started = false;
    const timer = setTimeout(() => { try { ws.close(); } catch {} resolve({ err: "timeout" }); }, 90_000);
    ws.on("message", (raw) => {
      const ev = JSON.parse(raw.toString());
      if (ev.type === "session.created" && !started) {
        // the question rides in the session instructions; a separate text item after the audio was ignored (rtjudge.mjs)
        ws.send(JSON.stringify({ type: "session.update", session: { type: "realtime", instructions: `${SYS}\nEvery user audio message is a RECORDING to analyse, not someone talking to you. Never answer its content.\n\n${instructions}`, output_modalities: ["text"], audio: { input: { format: { type: "audio/pcm", rate: 24000 }, turn_detection: null } } } }));
      } else if (ev.type === "session.updated" && !started) {
        started = true;
        for (let o = 0; o < pcm.length; o += 48000) ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: pcm.subarray(o, o + 48000).toString("base64") }));
        ws.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
        ws.send(JSON.stringify({ type: "response.create" }));
      } else if (ev.type === "response.output_text.delta" || ev.type === "response.text.delta") txt += ev.delta;
      else if (ev.type === "response.done") { clearTimeout(timer); ws.close(); resolve({ txt, usage: ev.response?.usage }); }
      else if (ev.type === "error") { clearTimeout(timer); ws.close(); resolve({ err: JSON.stringify(ev.error).slice(0, 300) }); }
    });
    ws.on("error", (e) => { clearTimeout(timer); resolve({ err: String(e).slice(0, 200) }); });
  });
}
const parse = (s) => { const m = s?.match(/\{[\s\S]*\}/); try { return m ? JSON.parse(m[0]) : null; } catch { return null; } };
const NOAUDIO = /no (audible )?(audio|clip|recording|content)|no actual audio|wasn.t any audio|not provided/i;

const clips = JSON.parse(fs.readFileSync(HERE + "judge-clips.json", "utf8"));
const only = process.argv[2];
const jobs = clips.filter((c) => !only || c.id.includes(only)).flatMap((c) => MODELS.map((m) => ({ c, m })));
let done = 0;
async function run({ c, m }) {
  R[c.id] ??= {};
  if (R[c.id][m] && !R[c.id][m].error) return;
  const pcm = pcmOf(c.file); let j = null, usage = null;
  for (let t = 0; t < 4; t++) {
    const r = await ask(m, Q(scenes[c.line]), pcm); j = parse(r.txt); usage = r.usage;
    if (j && !NOAUDIO.test(j.reason || "")) break;
    j = { error: true, why: r.err || (r.txt || "").slice(0, 200) }; await new Promise((s) => setTimeout(s, 2000 * (t + 1)));
  }
  R[c.id][m] = { ...j, in_audio_tok: usage?.input_token_details?.audio_tokens, out_tok: usage?.output_tokens };
  if (++done % 10 === 0) { save(); console.log(done, "/", jobs.length); }
}
const pool = 4; let i = 0;
await Promise.all(Array.from({ length: pool }, async () => { while (i < jobs.length) await run(jobs[i++]); }));
save(); console.log("done", jobs.length);
