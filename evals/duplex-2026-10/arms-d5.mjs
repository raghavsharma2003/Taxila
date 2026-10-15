// LANE D5 on the bake-off audio through the REAL code path (main's gate, 2026-10-11): the shipped relay
// (server/duplex/voicelive.js VoiceLiveRelay, the same session, allowlists and frame batching the server runs) to Azure Voice
// Live, its events into the shipped DuplexLive with the D5 options CascadeDuplex sets for lane "d5" (source "voicelive",
// vadGate "server", Voice Live silence 500 ms), driven by evals/duplex-real/lib.mjs runSession (device frames from the mic,
// her output level per frame, her line's start / end). The stereo frame is what src/duplex/d5Worklet.ts sends: channel 0 =
// the mic variant (`phone`: her echo through the phone-speaker model, no device AEC; `clean`: a -30 dB residue), channel 1
// = her played line (assemble.mjs `<id>.her.s16` at her stream position). Open loop like arms-ours (her audio is not cut
// by a yield; the yield is scored). Scored by score.mjs as arm "d5" (engine acts, like the duplex arm).
// The turn context is what the Director's turn ui carries (uiOf below), not the harness shortcut arms-ours used.
//   NODE_USE_ENV_PROXY=1 node --env-file=.env.local evals/duplex-2026-10/arms-d5.mjs --bake <dir> --variant phone|clean|owner [--no-preduck] [--conc 4] [--only id,..] [--arm-name d5]
import fs from "node:fs";
import path from "node:path";
import { ROOT, framesOf, runSession, pool, loadEnv } from "../duplex-real/lib.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const BAKE = arg("--bake"), VAR = arg("--variant", "phone"), CONC = Number(arg("--conc", 4));
// round 5: the pre-duck is on by default (CascadeDuplex D5_PREDUCK_DEFAULT); --no-preduck measures without it
const PREDUCK = !process.argv.includes("--no-preduck");
const ARM = arg("--arm-name", PREDUCK ? "d5" : "d5-nopreduck");
const ONLY = arg("--only") ? new Set(arg("--only").split(",")) : null;
const SR = 16000, HOP = 320;
const TAIL_MS = 6000;
loadEnv();

const readS16 = (f) => { const b = fs.readFileSync(f); const x = new Float32Array(b.length / 2); for (let i = 0; i < x.length; i++) x[i] = b.readInt16LE(i * 2) / 32768; return x; };

/** The Director's turn ui for the scenario's context (src/duplex/live.ts TurnUi: beat, answerForm, handover). */
export function uiOf(ctx) {
  if (!ctx) return {};
  if (ctx.exchange === "closed_answer") {
    const f = ctx.expected?.form;
    if (f === "yes_no") return { beat: ctx.beat ?? "check" };
    if (f === "choice") return { beat: ctx.beat ?? "check", answerForm: "choice" };
    if (f === "word" || f === "phrase") return { beat: ctx.beat ?? "check", answerForm: "words" };
    return { beat: ctx.beat ?? "check", answerForm: "number" };
  }
  if (ctx.exchange === "open_explanation") return { beat: ctx.beat ?? "explain" };
  return {};
}

/** The D5 socket: the shipped relay to Voice Live; stereo frames built from the mic block and her played line. */
async function openD5(herX, herOff, onEvent) {
  const { VoiceLiveRelay, voiceLiveConfig, D5_FRAME_BYTES } = await import(ROOT + "server/duplex/voicelive.js");
  const { D5_SERVER_VAD_MS } = await import(ROOT + "src/duplex/cascadeDuplex.ts");
  const cfg = voiceLiveConfig();
  if (!cfg) throw new Error("voice live not configured (TAXILA_VOICELIVE_* / AZURE_AI_CENTRALINDIA_*)");
  let ready;
  const up = new Promise((r) => { ready = r; });
  const errors = [];
  let closedWhy = null;
  const relay = new VoiceLiveRelay({
    cfg,
    client: {
      send: (text) => {
        const e = JSON.parse(text);
        if (e.type === "d5.session" && e.phase === "updated") ready();
        if (e.type === "error") errors.push(String(e.error?.code ?? "").slice(0, 80));
        if (e.type === "d5.closed") closedWhy = e.reason;
        onEvent(e);
      },
      close: () => {},
    },
    openUpstream: (url, headers) => new WebSocket(url, { headers }),
  });
  await Promise.race([up, new Promise((_, rej) => setTimeout(() => rej(new Error(`d5 session timeout ${closedWhy ?? ""}`)), 25000))]);
  relay.clientText(JSON.stringify({ type: "vad", silenceMs: D5_SERVER_VAD_MS }));
  return {
    lane: "D5", model: cfg.model, region: "centralindia", errors,
    append(block, frameIdx) {
      const b = Buffer.alloc(D5_FRAME_BYTES);
      for (let k = 0; k < HOP; k++) {
        const j = frameIdx * HOP + k - herOff;
        const h = j >= 0 && j < herX.length ? herX[j] : 0;
        b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round((block[k] ?? 0) * 32767))), k * 4);
        b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(h * 32767))), k * 4 + 2);
      }
      relay.clientBinary(b);
    },
    commit() { relay.clientText(JSON.stringify({ type: "commit" })); },
    close() { relay.end(1000, "done"); },
  };
}

async function one(id) {
  const meta = JSON.parse(fs.readFileSync(path.join(BAKE, `${id}.json`), "utf8"));
  // + TAIL_MS of the room's own noise after the stream: an engine that patiently waits out a teach-back must get to decide
  const x0 = readS16(path.join(BAKE, `${id}.${VAR}.s16`));
  const x = new Float32Array(x0.length + Math.round((TAIL_MS * SR) / 1000));
  x.set(x0);
  const bed = x0.subarray(Math.max(0, x0.length - SR), x0.length);
  for (let i = x0.length; i < x.length; i++) x[i] = bed[(i - x0.length) % Math.max(1, bed.length)] ?? 0;
  const herX = readS16(path.join(BAKE, `${id}.her.s16`));
  const herOff = Math.round((meta.herAtMs * SR) / 1000);
  const t0 = Date.now();
  const { DuplexLive } = await import(ROOT + "src/duplex/live.ts");
  const nF = Math.floor(x.length / HOP), outDb = new Array(nF).fill(-120);
  for (let f = 0; f < nF; f++) { let s = 0; for (let k = 0; k < HOP; k++) { const j = f * HOP + k - herOff; const v = j >= 0 && j < herX.length ? herX[j] : 0; s += v * v; } outDb[f] = 10 * Math.log10(s / HOP + 1e-12); }
  const fr = framesOf(x);
  // her played line on the stream clock: its pitch per frame (the device reads it off the player, liveTap.ts)
  const herAligned = new Float32Array(x.length);
  for (let i = 0; i < herX.length; i++) { const j = i + herOff; if (j >= 0 && j < x.length) herAligned[j] = herX[i]; }
  const outF0 = framesOf(herAligned).f0;
  const her = [{ start: meta.gold.herSpan.start, end: meta.gold.herSpan.end, text: meta.herText, outDb, outF0, ui: uiOf(meta.ctx) }];
  let liveRef = null;
  // the stream's audio clock starts with the first appended frame, which runSession sends at session time 0
  class D5Live extends DuplexLive { constructor(o) { super(o); liveRef = this; this.audioOrigin(0); } }
  const r = await runSession({
    id: `d5-${id}-${VAR}`, x, frames: fr, her, band: "B2", DuplexLive: D5Live, floorDb: null,
    stt: { open: (onEvent) => openD5(herX, herOff, onEvent) },
    liveOptions: { source: "voicelive", vadGate: "server", preDuck: PREDUCK, supportsCommit: false, serverVadMs: (await import(ROOT + "src/duplex/cascadeDuplex.ts")).D5_SERVER_VAD_MS },
  });
  return { id, arm: ARM, variant: VAR, acts: r.acts, phases: r.phases, logs: r.logs.filter((l) => l[1] === "YIELD" || l[1] === "SPEAK" || l[1] === "HUSH"),
    stt: r.sttLog.map((s) => ({ t: s.t, type: s.raw.type, item: s.raw.item_id, text: s.raw.transcript ?? s.raw.delta ?? null })), errors: r.errors, d5: liveRef?.d5 ?? null, ms: Date.now() - t0 };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const idx = JSON.parse(fs.readFileSync(path.join(BAKE, "index.json"), "utf8")).filter((r) => !ONLY || ONLY.has(r.id));
  const outDir = path.join(BAKE, "runs");
  fs.mkdirSync(outDir, { recursive: true });
  let done = 0, failed = 0;
  await pool(idx.map((r) => async () => {
    const file = path.join(outDir, `${ARM}.${VAR}.${r.id}.json`);
    if (fs.existsSync(file)) { done++; return; }
    for (let attempt = 0; attempt < 3; attempt++) {
      try { fs.writeFileSync(file, JSON.stringify(await one(r.id))); break; } catch (e) { console.warn(r.id, attempt, String(e.message).slice(0, 200)); if (attempt === 2) failed++; await new Promise((q) => setTimeout(q, 4000 * (attempt + 1))); }
    }
    if (++done % 10 === 0) console.log(`${ARM}/${VAR} ${done}/${idx.length}`);
  }), CONC);
  console.log(`${ARM}/${VAR} done ${done}/${idx.length}, failed ${failed}`);
}
