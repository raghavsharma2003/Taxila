// nova-sonic.mjs — VOICE v3 hosted renders on Amazon Nova 2 Sonic (Bedrock, us-east-1), round 2, 2026-10-04.
// Speech-to-speech model driven by a TEXT user turn. plain = verbatim reader system prompt; expressive = the same
// reader + the shared delivery band + the scene (prose direction, its only native expressive control).
// The model's own transcript is kept so the verbatim rate (does an S2S model say a fixed line?) is a result too.
// Bedrock bidirectional streaming is HTTP/2; Node's http2 ignores HTTPS_PROXY, so the session opens the CONNECT
// tunnel itself and hands the SDK a TLS socket over it.
// Run: cd /home/user/Taxila; set -a; . ./.env.local; set +a; SDK_FROM=<dir with @aws-sdk>/ node docs/research/voice/v3/renders/nova-sonic.mjs [voiceRegex]
import http from "node:http";
import tls from "node:tls";
import fs from "node:fs";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { LINES, save, record, wavHdr, wavInfo, BAND, READER } from "./lib.mjs";
const require = createRequire(process.env.SDK_FROM || import.meta.url);
const http2 = require("node:http2");
const REGION = "us-east-1", HOST = `bedrock-runtime.${REGION}.amazonaws.com`, MODEL = "amazon.nova-2-sonic-v1:0";
const FILTER = process.argv[2] ? new RegExp(process.argv[2]) : null;

function tunnel(host) {
  const p = new URL(process.env.HTTPS_PROXY);
  return new Promise((res, rej) => {
    const req = http.request({ host: p.hostname, port: p.port, method: "CONNECT", path: `${host}:443` });
    req.on("connect", (r, sock) => (r.statusCode === 200 ? res(sock) : rej(new Error(`CONNECT ${r.statusCode}`))));
    req.on("error", rej); req.end();
  });
}
let nextSock = null;
const realConnect = http2.connect;
http2.connect = (authority, opts = {}, ...rest) => {
  const sock = nextSock; nextSock = null;
  if (!sock) return realConnect(authority, opts, ...rest);
  const ca = fs.readFileSync(process.env.NODE_EXTRA_CA_CERTS || "/root/.ccr/ca-bundle.crt");
  return realConnect(authority, { ...opts, createConnection: () => tls.connect({ socket: sock, servername: HOST, ALPNProtocols: ["h2"], ca: [...tls.rootCertificates, ca] }) }, ...rest);
};
const { BedrockRuntimeClient, InvokeModelWithBidirectionalStreamCommand } = require("@aws-sdk/client-bedrock-runtime");
const { NodeHttp2Handler } = require("@smithy/node-http-handler");

async function sonic(voiceId, system, text) {
  nextSock = await tunnel(HOST);
  const client = new BedrockRuntimeClient({ region: REGION, requestHandler: new NodeHttp2Handler({ requestTimeout: 120000, sessionTimeout: 120000, disableConcurrentStreams: true }) });
  const promptName = randomUUID(), sysName = randomUUID(), userName = randomUUID(), audName = randomUUID();
  const ev = (e) => ({ chunk: { bytes: new TextEncoder().encode(JSON.stringify({ event: e })) } });
  const silence = Buffer.alloc(16000 * 2 * 0.1).toString("base64"); // 100 ms of 16 kHz silence per chunk
  let tSend = 0, done = false;
  let finish; const finished = new Promise((r) => (finish = r));
  async function* body() {
    yield ev({ sessionStart: { inferenceConfiguration: { maxTokens: 1024, topP: 0.9, temperature: 0.7 } } });
    yield ev({ promptStart: { promptName, textOutputConfiguration: { mediaType: "text/plain" },
      audioOutputConfiguration: { mediaType: "audio/lpcm", sampleRateHertz: 24000, sampleSizeBits: 16, channelCount: 1, voiceId, encoding: "base64", audioType: "SPEECH" } } });
    yield ev({ contentStart: { promptName, contentName: sysName, type: "TEXT", interactive: false, role: "SYSTEM", textInputConfiguration: { mediaType: "text/plain" } } });
    yield ev({ textInput: { promptName, contentName: sysName, content: system } });
    yield ev({ contentEnd: { promptName, contentName: sysName } });
    // an open (silent) audio input stream, as the session expects a live mic
    yield ev({ contentStart: { promptName, contentName: audName, type: "AUDIO", interactive: true, role: "USER",
      audioInputConfiguration: { mediaType: "audio/lpcm", sampleRateHertz: 16000, sampleSizeBits: 16, channelCount: 1, audioType: "SPEECH", encoding: "base64" } } });
    for (let i = 0; i < 3; i++) { yield ev({ audioInput: { promptName, contentName: audName, content: silence } }); await new Promise((r) => setTimeout(r, 100)); }
    yield ev({ contentStart: { promptName, contentName: userName, type: "TEXT", interactive: true, role: "USER", textInputConfiguration: { mediaType: "text/plain" } } });
    yield ev({ textInput: { promptName, contentName: userName, content: text } });
    tSend = performance.now();
    yield ev({ contentEnd: { promptName, contentName: userName } });
    while (!done) { yield ev({ audioInput: { promptName, contentName: audName, content: silence } }); await Promise.race([new Promise((r) => setTimeout(r, 100)), finished]); }
    yield ev({ contentEnd: { promptName, contentName: audName } });
    yield ev({ promptEnd: { promptName } });
    yield ev({ sessionEnd: {} });
  }
  const pcm = []; let ttfb = null, said = "", spec = "", usage = null, role = null, stage = null, err = null, idle = null;
  const t0 = performance.now();
  const kill = setTimeout(() => { done = true; finish(); }, 60000);
  try {
    const resp = await client.send(new InvokeModelWithBidirectionalStreamCommand({ modelId: MODEL, body: body() }));
    for await (const o of resp.body) {
      if (o.internalServerException || o.modelStreamErrorException || o.validationException || o.throttlingException) { err = JSON.stringify(o).slice(0, 300); break; }
      if (!o.chunk?.bytes) continue;
      const e = JSON.parse(new TextDecoder().decode(o.chunk.bytes)).event || {};
      if (e.contentStart) { role = e.contentStart.role; try { stage = JSON.parse(e.contentStart.additionalModelFields || "{}").generationStage; } catch { stage = null; } }
      if (e.textOutput && role === "ASSISTANT") { if (stage === "SPECULATIVE") spec += e.textOutput.content; else said += e.textOutput.content; }
      if (e.usageEvent) usage = e.usageEvent.details?.total;
      if (e.audioOutput) { if (ttfb === null) ttfb = Math.round(performance.now() - tSend); pcm.push(Buffer.from(e.audioOutput.content, "base64")); clearTimeout(idle); idle = setTimeout(() => { done = true; finish(); }, 2500); }
      if (e.completionEnd || (e.contentEnd && e.contentEnd.type === "AUDIO" && e.contentEnd.stopReason === "END_TURN")) { done = true; finish(); }
      if (done && e.completionEnd) break;
    }
  } catch (e) { err = String(e.message || e).slice(0, 300); }
  clearTimeout(kill); clearTimeout(idle); done = true; finish();
  if (!pcm.length) return { err: err || "no audio" };
  return { buf: wavHdr(Buffer.concat(pcm)), ttfb, total: Math.round(performance.now() - t0), said: (said || spec).trim(), said_stage: said ? "FINAL" : "SPECULATIVE", usage, err };
}

const VOICES = [["aws-nova2sonic-kiara", "kiara"], ["aws-nova2sonic-arjun-m", "arjun"]];
const norm = (s) => (s || "").replace(/[\s।,!?.\-"'“”]/g, "").toLowerCase();
for (const [arm, voiceId] of VOICES) {
  if (FILTER && !FILTER.test(arm)) continue;
  for (const l of LINES) for (const cond of ["plain", "expressive"]) {
    if (process.env.ONLY && `${l.id}__${cond}` !== process.env.ONLY) continue;
    const system = cond === "plain" ? READER : `${READER}\n${BAND}\nThe moment: ${l.scene}`;
    let r = null;
    for (let a = 0; a < 2 && !(r && r.buf); a++) r = await sonic(voiceId, system, l.text);
    const id = `${arm}/${l.id}__${cond}`;
    if (!r.buf) { console.log(id, "ERR", r.err); record({ arm, line: l.id, cond, engine: "aws-bedrock-nova-2-sonic", voice: voiceId, error: r.err }); continue; }
    const file = save(arm, l.id, cond, r.buf), info = wavInfo(r.buf);
    record({ arm, line: l.id, cond, file, engine: "aws-bedrock-nova-2-sonic", voice: `${MODEL} / ${voiceId}`, status: "GA", region: REGION, sample_rate: info.rate, dur_s: info.dur,
      ttfb_ms: r.ttfb, ttfb_basis: "end of user text turn -> first audioOutput chunk (session already open)", total_ms: r.total, text: l.text, said: r.said, verbatim: norm(r.said) === norm(l.text),
      settings: { system, inference: { temperature: 0.7, topP: 0.9 }, output: "lpcm 24 kHz", notes: "S2S driven by a text user turn; transcript is the model's own" },
      licence: "Amazon Bedrock Nova 2 Sonic, on-demand speech/text tokens", billing: "AWS Activate credit (USD 1k)", chars: l.text.length, transcript_stage: r.said_stage, usage_tokens: r.usage, stream_note: r.err || undefined });
    console.log(id, `ttfb=${r.ttfb} dur=${info.dur} verbatim=${norm(r.said) === norm(l.text)} said=${r.said.slice(0, 70)}`);
  }
}
process.exit(0);
