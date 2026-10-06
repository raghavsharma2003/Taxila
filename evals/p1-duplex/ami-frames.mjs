// Real recorded ADULT speech for the duplex floor (p1-duplex, 2026-10-06): AMI Meeting Corpus individual-headset channels
// (CC BY 4.0, "AMI Meeting Corpus, University of Edinburgh / IDIAP / TNO et al."; licence read at source by the voicesig
// stream 2026-10-04, evals/voicesig/CORPORA.md). Downloads each headset wav of a meeting, computes the device's own 20 ms
// frames (RMS dB + the shipped YIN from src/voice/dsp.ts, the same HOP / WIN / gate as TaxilaFDB mix.mjs) after one
// per-channel gain that puts the channel owner's active speech at -20 dBFS (the device AGC's job), writes frames + the
// manual word annotations (v1.6.2) to <out>/<meeting>.json, and DELETES every wav. Nothing lands in the repo.
//
//   node evals/p1-duplex/ami-frames.mjs <work_dir_with_manual/> <out_dir> IS1008b ES2004b ...
// The work dir holds the unzipped ami_public_manual_1.6.2 annotations under manual/ (evals/voicesig/train/ami_prep.py).
import fs from "node:fs";
import path from "node:path";
import { yin } from "../../src/voice/dsp.ts";

const BASE = "https://groups.inf.ed.ac.uk/ami/AMICorpusMirror/amicorpus";
const SR = 16000, HOP = 320, WIN = 640, SPEECH_DB = -20;

/** participants + channels of a meeting from corpusResources/meetings.xml */
export function meetingMeta(manual, meeting) {
  const src = fs.readFileSync(path.join(manual, "corpusResources/meetings.xml"), "latin1");
  const m = new RegExp(`<meeting [^>]*observation="${meeting}"[^>]*>([\\s\\S]*?)</meeting>`).exec(src);
  if (!m) throw new Error(`no meeting ${meeting}`);
  const P = {};
  const ps = fs.readFileSync(path.join(manual, "corpusResources/participants.xml"), "latin1");
  for (const x of ps.matchAll(/<participant nite:id="([^"]+)" sex="([^"]*)"[^>]*?native_language="([^"]*)"/g)) P[x[1]] = { sex: x[2], l1: x[3] };
  return [...m[1].matchAll(/channel="(\d+)" nxt_agent="(\w)"[^>]*global_name="([^"]+)"/g)].map((x) => ({ ch: +x[1], agent: x[2], id: x[3], ...(P[x[3]] ?? {}) }));
}

/** Manual word annotations of one agent: [startMs, endMs, word] (punctuation and < 40 ms tokens dropped). */
export function agentWords(manual, meeting, agent) {
  const src = fs.readFileSync(path.join(manual, "words", `${meeting}.${agent}.words.xml`), "latin1");
  const out = [];
  for (const m of src.matchAll(/<w [^>]*starttime="([\d.]+)" endtime="([\d.]+)"([^>]*)>([^<]*)<\/w>/g)) {
    if (m[3].includes("punc=")) continue;
    const s = Math.round(+m[1] * 1000), e = Math.round(+m[2] * 1000);
    if (e - s < 40) continue;
    out.push([s, e, m[4].trim().toLowerCase()]);
  }
  return out;
}

function pcmOf(buf) {
  // RIFF: find the "data" chunk (16-bit mono expected)
  let o = 12;
  while (o + 8 <= buf.length) {
    const id = buf.toString("ascii", o, o + 4), n = buf.readUInt32LE(o + 4);
    if (id === "data") return new Int16Array(buf.buffer.slice(buf.byteOffset + o + 8, buf.byteOffset + o + 8 + (n & ~1)));
    o += 8 + n + (n & 1);
  }
  throw new Error("no data chunk");
}

async function framesOf(url, words) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const pcm = pcmOf(Buffer.from(await res.arrayBuffer()));
  const x = new Float32Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) x[i] = pcm[i] / 32768;
  // gain: the owner's active speech (frames inside their own words, within 30 dB of the 95th pct) → -20 dBFS
  const on = new Uint8Array(Math.ceil(x.length / HOP));
  for (const [s, e] of words) for (let k = Math.floor((s * SR) / 1000 / HOP); k < Math.ceil((e * SR) / 1000 / HOP) && k < on.length; k++) on[k] = 1;
  const raw = [];
  for (let k = 0; k < on.length; k++) if (on[k]) { let s = 0; for (let i = k * HOP; i < Math.min(x.length, (k + 1) * HOP); i++) s += x[i] * x[i]; raw.push(s / HOP); }
  raw.sort((a, b) => a - b);
  const p95 = raw[Math.floor(0.95 * (raw.length - 1))] ?? 1e-6;
  const act = raw.filter((v) => v >= p95 / 1000);
  const ms = act.reduce((a, b) => a + b, 0) / Math.max(1, act.length);
  const g = Math.pow(10, SPEECH_DB / 20) / Math.sqrt(ms || 1e-12);
  for (let i = 0; i < x.length; i++) x[i] = Math.max(-1, Math.min(1, x[i] * g));
  const db = [], f0 = [];
  for (let i = 0; i + HOP <= x.length; i += HOP) {
    let s = 0;
    for (let k = i; k < i + HOP; k++) s += x[k] * x[k];
    const d = 10 * Math.log10(s / HOP + 1e-12);
    let f = null;
    if (d > -45 && i + WIN <= x.length) f = yin(x.subarray(i, i + WIN), SR, 70, 600).f0;
    db.push(+d.toFixed(1));
    f0.push(f ? +f.toFixed(1) : null);
  }
  return { gainDb: +(20 * Math.log10(g)).toFixed(1), db, f0 };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [work, out, ...meetings] = process.argv.slice(2);
  const manual = path.join(work, "manual");
  fs.mkdirSync(out, { recursive: true });
  for (const meeting of meetings) {
    const file = path.join(out, `${meeting}.json`);
    if (fs.existsSync(file)) { console.log(meeting, "cached"); continue; }
    const spk = meetingMeta(manual, meeting);
    const chans = {};
    for (const sp of spk) {
      const words = agentWords(manual, meeting, sp.agent);
      const t0 = Date.now();
      const fr = await framesOf(`${BASE}/${meeting}/audio/${meeting}.Headset-${sp.ch}.wav`, words);
      chans[sp.agent] = { ...sp, words, ...fr };
      console.log(meeting, sp.agent, sp.l1, `${words.length} words, ${fr.db.length} frames, gain ${fr.gainDb} dB, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    }
    fs.writeFileSync(file, JSON.stringify({ corpus: "AMI Meeting Corpus (CC BY 4.0)", meeting, hopMs: 20, chans }));
  }
}
