// duplex-real: the REAL AMI headset audio for the real-STT runs (AMI Meeting Corpus, CC BY 4.0). Downloads each headset wav
// of a meeting, applies the SAME per-channel gain evals/p1-duplex/ami-frames.mjs put into the frames (the device AGC's job:
// the owner's active speech at -20 dBFS), and writes <out>/<meeting>.<agent>.s16 (16 kHz mono s16le). Nothing lands in the
// repo; delete <out> after the run.
//   node evals/duplex-real/ami-pcm.mjs <frames_dir> <out_dir> ES2004b ES2005b ...
import fs from "node:fs";
import path from "node:path";

const BASE = "https://groups.inf.ed.ac.uk/ami/AMICorpusMirror/amicorpus";

function pcmOf(buf) {
  let o = 12;
  while (o + 8 <= buf.length) {
    const id = buf.toString("ascii", o, o + 4), n = buf.readUInt32LE(o + 4);
    if (id === "data") return new Int16Array(buf.buffer.slice(buf.byteOffset + o + 8, buf.byteOffset + o + 8 + (n & ~1)));
    o += 8 + n + (n & 1);
  }
  throw new Error("no data chunk");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [framesDir, out, ...meetings] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  for (const m of meetings) {
    const M = JSON.parse(fs.readFileSync(path.join(framesDir, `${m}.json`), "utf8"));
    for (const [agent, c] of Object.entries(M.chans)) {
      const file = path.join(out, `${m}.${agent}.s16`);
      if (fs.existsSync(file)) { console.log(m, agent, "cached"); continue; }
      const res = await fetch(`${BASE}/${m}/audio/${m}.Headset-${c.ch}.wav`);
      if (!res.ok) throw new Error(`${m} ${agent}: ${res.status}`);
      const pcm = pcmOf(Buffer.from(await res.arrayBuffer()));
      const g = Math.pow(10, c.gainDb / 20);
      const o = Buffer.alloc(pcm.length * 2);
      for (let i = 0; i < pcm.length; i++) o.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(pcm[i] * g))), i * 2);
      fs.writeFileSync(file, o);
      console.log(m, agent, c.l1, `${(pcm.length / 16000 / 60).toFixed(1)} min, gain ${c.gainDb} dB`);
    }
  }
}
