// Round 7 (voice-tts-transport, main's condition 2): first audio and whole-line time per codec on throttled mobile links,
// in real Chromium (its own WebCodecs Opus decoder). A local server streams recorded teacher lines (bake *.her.s16, as her
// 24 kHz PCM) through the SHIPPED frame writer (server/voice/frames.js) with codec pcm | adpcm | opus; the page fetches with
// DevTools network throttling, parses frames, decodes (ADPCM: the shipped decoder; Opus: AudioDecoder) and records when
// the first 100 ms of playable PCM existed and when the whole line had. No Azure call.
//   node evals/tts-transport/first-audio.mjs <dir of *.her.s16> [--n 12] [--out f.json]
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { stripTypeScriptTypes } from "node:module";
import { frameWriter, FRAME, FRAMES_CONTENT_TYPE } from "../../server/voice/frames.js";
import { loadOpus } from "../../server/voice/opus.js";

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const DIR = process.argv[2], N = Number(arg("--n", 12)), OUT = arg("--out");
if (!(await loadOpus())) throw new Error("opusscript did not load");
// --concat k joins k consecutive recordings into one line (QA D12's real lines are 398-497 KB of PCM; the bake's are ~75 KB)
const K = Number(arg("--concat", 1));
const all = fs.readdirSync(DIR).filter((f) => f.endsWith(".her.s16")).sort().map((f) => fs.readFileSync(path.join(DIR, f)));
const lines = Array.from({ length: Math.min(N, Math.floor(all.length / K)) }, (_, i) => Buffer.concat(all.slice(i * K, i * K + K)));
const adpcmJs = stripTypeScriptTypes(fs.readFileSync(new URL("../../src/lesson/adpcm.ts", import.meta.url), "utf8"));

const server = http.createServer((req, res) => {
  if (req.url === "/") return res.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><title>tts</title>");
  if (req.url === "/adpcm.js") return res.writeHead(200, { "content-type": "text/javascript" }).end(adpcmJs);
  const m = /^\/line\/(\d+)\/(pcm|adpcm|opus)$/.exec(req.url);
  if (!m) return res.writeHead(404).end();
  const pcm = lines[Number(m[1])];
  res.writeHead(200, { "content-type": FRAMES_CONTENT_TYPE, "cache-control": "no-store" });
  const w = frameWriter(res, true, { codec: m[2] });
  w.json(FRAME.header, { v: 2, codec: w.codec });
  for (let i = 0; i < pcm.length; i += 4800) w.pcm(pcm.subarray(i, i + 4800)); // 100 ms chunks, as TTS streams them
  w.json(FRAME.end, { t: "end", status: "ok" });
  res.end();
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

const PAGE = async ({ url, firstBytes }) => {
  const { decodeAdpcm } = await import("/adpcm.js");
  const t0 = performance.now();
  const res = await fetch(url);
  const reader = res.body.getReader();
  let buf = new Uint8Array(0), got = 0, first = null, wire = 0, firstWire = null, firstPacket = null, queued = 0;
  const dec = typeof AudioDecoder !== "undefined" ? new AudioDecoder({ output: (d) => { got += d.numberOfFrames * 2; d.close(); if (first === null && got >= firstBytes) first = performance.now() - t0; }, error: () => {} }) : null;
  dec?.configure({ codec: "opus", sampleRate: 24000, numberOfChannels: 1 });
  let ts = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    wire += value.length;
    if (firstWire === null) firstWire = performance.now() - t0;
    const m = new Uint8Array(buf.length + value.length); m.set(buf); m.set(value, buf.length);
    let i = 0;
    while (i + 4 <= m.length) {
      const len = (m[i + 1] << 16) | (m[i + 2] << 8) | m[i + 3];
      if (i + 4 + len > m.length) break;
      const type = m[i], body = m.subarray(i + 4, i + 4 + len);
      if (type === 0) got += body.length;
      else if (type === 5) got += decodeAdpcm(body).length;
      else if (type === 6) { if (firstPacket === null) firstPacket = performance.now() - t0; dec.decode(new EncodedAudioChunk({ type: "key", timestamp: ts, data: body.slice() })); ts += 20000; queued++; }
      if (first === null && got >= firstBytes) first = performance.now() - t0;
      i += 4 + len;
    }
    buf = m.slice(i);
  }
  if (dec) await dec.flush();
  return { firstMs: first, allMs: performance.now() - t0, wire, pcmBytes: got, opusDecoder: !!dec, firstWire, firstPacket };
};

const { chromium } = await import("playwright");
const browser = await chromium.launch();
const PROFILES = { "slow-3g": { downloadThroughput: 400 * 1024 / 8, uploadThroughput: 400 * 1024 / 8, latency: 400 }, "fast-3g": { downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8, latency: 150 }, "4g": { downloadThroughput: 9 * 1024 * 1024 / 8, uploadThroughput: 9 * 1024 * 1024 / 8, latency: 60 } };
const results = {};
for (const [prof, cond] of Object.entries(PROFILES)) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(base);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, ...cond });
  results[prof] = {};
  for (const codec of ["pcm", "adpcm", "opus"]) {
    const rows = [];
    for (let i = 0; i < lines.length; i++) rows.push(await page.evaluate(PAGE, { url: `${base}/line/${i}/${codec}`, firstBytes: 4800 }));
    const med = (k) => { const v = rows.map((r) => r[k]).filter((x) => x !== null).sort((a, b) => a - b); return Math.round(v[Math.floor(v.length / 2)]); };
    const p90 = (k) => { const v = rows.map((r) => r[k]).filter((x) => x !== null).sort((a, b) => a - b); return Math.round(v[Math.min(v.length - 1, Math.floor(v.length * 0.9))]); };
    results[prof][codec] = { n: rows.length, firstWireMs: med("firstWire"), firstAudioMs: { p50: med("firstMs"), p90: p90("firstMs") }, wholeLineMs: { p50: med("allMs"), p90: p90("allMs") }, wireKB: Math.round(rows.reduce((a, r) => a + r.wire, 0) / rows.length / 1024), samplesOk: rows.every((r) => r.pcmBytes >= 4800) };
  }
  await ctx.close();
}
await browser.close();
server.close();
const out = { method: { date: new Date().toISOString().slice(0, 10), what: "Chromium (Playwright) + CDP throttling, local server, the shipped frameWriter, first 100 ms of PCM decoded / whole line decoded", lines: lines.length, concat: K, pcmKB: Math.round(lines.reduce((a, l) => a + l.length, 0) / lines.length / 1024) }, results };
console.log(JSON.stringify(out, null, 1));
if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
