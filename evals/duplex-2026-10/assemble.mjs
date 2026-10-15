// duplex bake-off 2026-10 (docs/research/duplex-2026-10/BAKEOFF.md): build the mic audio for the bake-off subset of TaxilaFDB
// TEST (66 scenarios, `bake-ids.txt`), re-rendered today with Azure Speech (evals/duplex/taxilafdb/render.mjs --only).
//
// Two acoustic variants per scenario (16 kHz mono, one child voice: the first test voice of the scenario):
//   clean  TaxilaFDB's own mix: child + her voice as AEC RESIDUE (-30 dB) + noise bed: what the device hears when the
//          browser's echo canceller works.
//   phone  the same + her voice played through a PHONE LOUDSPEAKER and back into the mic with NO echo canceller: a small
//          speaker (300 Hz - 5 kHz band-pass, soft clipping), 60 ms device path delay, a 120 ms room tail, at COUPLING_DB
//          under the child's active-speech level. This is the case that made the owner tap.
//   owner  round 5 (docs/design/round5/BRIEF.md): the OWNER'S phone. The same loudspeaker path and coupling as `phone`, behind
//          a WEAK device echo canceller (Android 10, Chrome, echoCancellation=true "is not enough on this phone"): no
//          suppression for the first OWNER_CONVERGE_MS of each of her lines (the canceller re-converging), then OWNER_ERLE_DB.
//          The owner's recorder shows her words transcribed as the child, so the residue reaches the ASR: this models it [E].
// The realtime arms (Voice Live, gpt-realtime) do not use her DragonHD audio from here: they hear THEIR OWN output through
// the same speaker model, closed loop (bakeoff.mjs), so a server echo canceller has its true reference.
// Simulated: TTS child-like voices, a modelled speaker path. Not children, not a phone.
//
//   TAXILA_FDB_CACHE=<audio dir> node evals/duplex-2026-10/assemble.mjs --ids <file> --manifest <render manifest> --out <dir>
import fs from "node:fs";
import path from "node:path";
import { buildStream } from "../duplex/taxilafdb/mix.mjs";
import { loadScenarios, pcmPath, SR } from "../duplex/taxilafdb/render.mjs";

export const COUPLING_DB = -6;
export const OWNER_CONVERGE_MS = 500;
export const OWNER_ERLE_DB = 10;
const dbToLin = (db) => Math.pow(10, db / 20);

/** Biquad band-pass section (RBJ cookbook). */
function biquad(x, type, f0, q) {
  const w = (2 * Math.PI * f0) / SR, a = Math.sin(w) / (2 * q), c = Math.cos(w);
  let b0, b1, b2;
  if (type === "hp") { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; } else { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; }
  const a0 = 1 + a, a1 = -2 * c, a2 = 1 - a;
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
  }
  return y;
}

/** A phone loudspeaker heard by the phone's own mic: band-limit, mild clipping, device delay, a short room tail. */
export function speakerPath(x, { delayMs = 60, tailMs = 120, seed = 7 } = {}) {
  let y = biquad(biquad(x, "hp", 300, 0.7), "lp", 5000, 0.7);
  y = y.map((v) => Math.tanh(2.2 * v) / 2.2);
  const d = Math.round((delayMs * SR) / 1000), t = Math.round((tailMs * SR) / 1000);
  // sparse exponentially-decaying reflections (deterministic)
  let s = seed;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const taps = Array.from({ length: 24 }, (_, k) => ({ at: Math.round(rnd() * t), g: (rnd() - 0.5) * 0.5 * Math.exp((-3 * k) / 24) }));
  const out = new Float32Array(y.length + d + t);
  for (let i = 0; i < y.length; i++) { out[i + d] += y[i]; for (const tp of taps) out[i + d + tp.at] += y[i] * tp.g; }
  return out;
}

export function activeRms(x) {
  const HOP = 320, fr = [];
  for (let i = 0; i + HOP <= x.length; i += HOP) { let s = 0; for (let k = i; k < i + HOP; k++) s += x[k] * x[k]; fr.push(s / HOP); }
  const db = fr.map((p) => 10 * Math.log10(p + 1e-12)).sort((a, b) => a - b);
  const p95 = db[Math.floor(0.95 * (db.length - 1))] ?? -100;
  const act = fr.filter((p) => 10 * Math.log10(p + 1e-12) > p95 - 30);
  return Math.sqrt(act.reduce((a, b) => a + b, 0) / Math.max(1, act.length));
}

function readPcm16(key) {
  const b = fs.readFileSync(pcmPath(key));
  const x = new Float32Array(b.length / 2);
  for (let i = 0; i < x.length; i++) x[i] = b.readInt16LE(i * 2) / 32768;
  return x;
}

const s16 = (x) => { const b = Buffer.alloc(x.length * 2); for (let i = 0; i < x.length; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(x[i] * 32767))), i * 2); return b; };

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
  const ids = fs.readFileSync(arg("--ids"), "utf8").trim().split(",");
  const manifest = JSON.parse(fs.readFileSync(arg("--manifest"), "utf8"));
  const out = arg("--out");
  fs.mkdirSync(out, { recursive: true });
  const scen = new Map(loadScenarios().map((s) => [s.id, s]));
  const index = [];
  for (const id of ids) {
    const sc = scen.get(id), rec = (manifest.renders[id] || []).find((r) => !r.error && (!sc.child || r.child?.ok));
    if (!sc || !rec) { console.warn("skip", id); continue; }
    const s = buildStream(sc, rec, manifest, "clean");
    const her = manifest.her[sc.her.text];
    const herPcm = readPcm16(her.key);
    const herGain = 0.1 / Math.max(activeRms(herPcm), 1e-6); // -20 dBFS active speech, as the mix normalises every voice
    const herAt = 200 - her.start; // mix.mjs HER_LEAD = 200 ms
    const echo = speakerPath(herPcm.map((v) => v * herGain));
    const phone = s.pcm.slice();
    const o = Math.round((herAt * SR) / 1000);
    for (let i = 0; i < echo.length; i++) { const j = o + i; if (j >= 0 && j < phone.length) phone[j] += echo[i] * dbToLin(COUPLING_DB); }
    fs.writeFileSync(path.join(out, `${id}.clean.s16`), s16(s.pcm));
    fs.writeFileSync(path.join(out, `${id}.phone.s16`), s16(phone));
    // owner: the phone echo through a weak device AEC (full echo while it converges, then OWNER_ERLE_DB less)
    const owner = s.pcm.slice();
    const conv = Math.round((OWNER_CONVERGE_MS * SR) / 1000), erle = dbToLin(-OWNER_ERLE_DB), ramp = Math.round(0.1 * SR);
    for (let i = 0; i < echo.length; i++) {
      const j = o + i;
      if (j < 0 || j >= owner.length) continue;
      const g = i < conv ? 1 : i < conv + ramp ? 1 + ((erle - 1) * (i - conv)) / ramp : erle;
      owner[j] += echo[i] * dbToLin(COUPLING_DB) * g;
    }
    fs.writeFileSync(path.join(out, `${id}.owner.s16`), s16(owner));
    fs.writeFileSync(path.join(out, `${id}.her.s16`), s16(herPcm.map((v) => v * herGain)));
    // the child-only track (child + overlays + noise, her residue off): the realtime arms place it against THEIR voice
    const solo = buildStream({ ...sc, gold: { ...sc.gold, echoDb: -300 } }, rec, manifest, "clean");
    fs.writeFileSync(path.join(out, `${id}.child.s16`), s16(solo.pcm));
    const meta = { id, family: sc.family, sub: sc.sub, lang: sc.lang, voice: rec.voice, herText: sc.her.text, herLastAct: sc.her.lastAct, herAtMs: herAt, couplingDb: COUPLING_DB,
      child: sc.child ? { text: sc.child.segs.map((g) => g.text).join(" "), segs: sc.child.segs, start: sc.child.start } : null, ctx: sc.ctx, goldScenario: sc.gold, gold: s.gold, endMs: s.meta.endMs, frames: s.frames };
    fs.writeFileSync(path.join(out, `${id}.json`), JSON.stringify(meta));
    index.push({ id, family: sc.family, sub: sc.sub, endMs: s.meta.endMs });
  }
  fs.writeFileSync(path.join(out, "index.json"), JSON.stringify(index, null, 1));
  console.log(`assembled ${index.length} scenarios → ${out}`);
}
