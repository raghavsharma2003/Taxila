// duplex-real E1, REPLAY arm: score the CURRENT engine on recorded real-STT runs of eot.mjs (same audio frames, same socket
// events, deterministic), so a before/after compares engines on identical STT output. Frames are computed once and cached.
// A replay cannot honour probes the engine sends that the recording did not have (or vice versa): reported as
// `probeMismatch`; every change is then confirmed with a fresh live run (eot.mjs).
//   node evals/duplex-real/eot-replay.mjs <eot_dir> --rec eot-D4-before --name eot-D4-replay-x [--shards 8] [--cache dir]
//        [--ctx free|open_explanation|question_to_her|chit_chat]   (the Director ui the bridge sees; default none = free)
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { loadEnv, ROOT, framesOf, runSession, pool } from "./lib.mjs";
import { buildSession, scoreTurns, aggregate } from "./eot.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
/** The Director ui per context (src/duplex/live.ts maps it to the engine's exchange context). */
export const CTX_UI = { free: {}, open_explanation: { beat: "explain", handover: "explain" }, question_to_her: { beat: "chat", handover: "question" }, chit_chat: { beat: "chat", handover: "chat" } };

export async function replayAll({ dir, rec, shards = 8, cacheDir = null, ctx = "free", DuplexLive, limit = 400, semantic = null, conc = 4 }) {
  const idx = JSON.parse(fs.readFileSync(path.join(dir, "index.json"), "utf8"));
  const rows = idx.rows.slice(0, limit);
  const per = Math.ceil(rows.length / shards);
  const recorded = JSON.parse(zlib.gunzipSync(fs.readFileSync(rec)).toString());
  const out = await pool(Array.from({ length: shards }, (_, s) => async () => {
    const chunk = rows.slice(s * per, (s + 1) * per);
    const S = buildSession(dir, chunk);
    let frames;
    const cf = cacheDir ? path.join(cacheDir, `frames-${shards}-${s}.json`) : null;
    if (cf && fs.existsSync(cf)) frames = JSON.parse(fs.readFileSync(cf, "utf8"));
    else { frames = framesOf(S.x); if (cf) { fs.mkdirSync(cacheDir, { recursive: true }); fs.writeFileSync(cf, JSON.stringify(frames)); } }
    const her = S.her.map((h) => ({ ...h, ui: CTX_UI[ctx] ?? {} }));
    const log = recorded.find((x) => x.shard === s).sttLog;
    const r = await runSession({ id: `replay-${s}`, x: S.x, frames, her, stt: { replay: log }, band: "B4", DuplexLive, semantic });
    const recProbes = log.filter((e) => e.raw.type === "input_audio_buffer.committed").length;
    return { scored: scoreTurns(S.turns, r.acts, r.sttLog), probes: r.acts.filter((a) => a[1] === "probe").length, recProbes };
  }), conc);
  return { per: out.flatMap((o) => o.scored), probes: out.reduce((a, o) => a + o.probes, 0), recProbes: out.reduce((a, o) => a + o.recProbes, 0) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  loadEnv();
  const { DuplexLive } = await import(ROOT + "src/duplex/live.ts");
  const dir = argv[0], recName = opt("--rec", "eot-D4-before"), name = opt("--name", `${recName}-replay`);
  const ctx = opt("--ctx", "free");
  const rec = path.join(HERE, "results", `${recName}.stt.json.gz`);
  const t0 = Date.now();
  const { per, probes, recProbes } = await replayAll({ dir, rec, shards: Number(opt("--shards", 8)), cacheDir: opt("--cache", null), ctx, DuplexLive });
  const hash = (f) => crypto.createHash("sha1").update(fs.readFileSync(ROOT + f)).digest("hex").slice(0, 10);
  const res = {
    id: `duplex-real-${name}`, date: new Date().toISOString().slice(0, 10), lane: `replay of ${recName}`, ctx,
    engineHash: { config: hash("src/duplex/config.ts"), rules: hash("src/duplex/engineRules.ts"), host: hash("src/duplex/host.ts"), fanin: hash("server/duplex/fanin.js"), understand: hash("server/duplex/understand.js") },
    label: "REAL RECORDED ADULT SPEECH (LiveKit eot-bench Hindi, CC BY 4.0) + REAL STT EVENTS recorded live from the production socket, REPLAYED at their recorded times through the current engine (deterministic). Not children.",
    seconds: Math.round((Date.now() - t0) / 1000),
    probeMismatch: { engineProbes: probes, recordedCommits: recProbes },
    ...aggregate(per),
    perTurn: per,
  };
  fs.writeFileSync(path.join(HERE, "results", `${name}.json`), JSON.stringify(res, null, 1));
  const { perTurn, ...head } = res;
  console.log(JSON.stringify({ name, ctx, cut500: head.pauseCutoff_500, cutAll: head.pauseCutoff_all100.rate, turnsCut: head.turnsWithAnyCutoff.rate, inSpeech: head.inSpeechCommits, gap: head.decisionGap, byReason: head.gapByReason, probeMismatch: head.probeMismatch }));
}
