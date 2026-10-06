// duplex-real E1: thinking pauses and turn ends on REAL Hindi adult speech through the REAL STT lane.
//
// Data: LiveKit EOT-Bench public sample, Hindi config (livekit/eot-bench-data, CC BY 4.0): 400 real user turns from
// human-to-agent task conversations (adults; Hindi with some English), every silence >= 100 ms annotated, the last one
// being the turn end; every other silence is a HOLD (the speaker went on). LABEL: adults, not children; task-call register,
// not a lesson; the agent's previous line stands in for her question.
//
// Session layout (one per shard, rows in order): [her line, ~70 ms per char up to 8 s; the mic hears only a noise bed at
// the clip's own floor, i.e. perfect echo cancellation] [400 ms] [the real turn, gained to -20 dBFS active speech]
// [5 s of the same noise bed]. The live bridge (DuplexLive) decides on the real 20 ms frames and the real socket's events;
// its micro-commit probes go to the socket. Scored per turn:
//   pause cut-off   a commit inside a HOLD >= 500 ms (the PLAN's thinking pause); also every hold >= 100 ms;
//                   silence-640 / silence-900 baselines on the same holds
//   in-speech cut   a commit while the speaker is still in a voiced stretch before the turn end
//   decision gap    first commit at or after the turn end (last word end = start of the final silence) minus that end;
//                   missed when none within the 5 s tail
//
//   node evals/duplex-real/eot.mjs <eot_dir> --lane D4|MAI [--shards 4] [--limit 400] [--name x] [--replay results.jsonl.gz]
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { loadEnv, ROOT, f32, activeGain, framesOf, noise, runSession, pool, q, rate, HOP_MS } from "./lib.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const MS_PER_CHAR = 70, HER_MAX = 8000, LEAD = 400, TAIL = 5000, SR = 16000;

/** Build one session from rows: the mic stream, her lines, and each turn's absolute times. */
export function buildSession(dir, rows) {
  const parts = [], her = [], turns = [];
  let t = 0;
  for (const r of rows) {
    const raw = f32(fs.readFileSync(path.join(dir, `${r.id}.s16`)));
    const g = activeGain(raw);
    const x = raw.map((v) => Math.max(-1, Math.min(1, v * g)));
    // the clip's own floor: 10th percentile frame level, at least -70 dBFS
    const fr = [];
    for (let i = 0; i + 320 <= x.length; i += 320) { let s = 0; for (let k = i; k < i + 320; k++) s += x[k] * x[k]; fr.push(10 * Math.log10(s / 320 + 1e-12)); }
    fr.sort((a, b) => a - b);
    const floorDb = Math.max(-70, fr[Math.floor(fr.length * 0.1)] ?? -70);
    const text = (r.herPrev || "जी, बताइए।").slice(0, 400);
    const herMs = Math.min(HER_MAX, Math.max(1200, text.length * MS_PER_CHAR));
    const seed = parseInt(r.id.replace(/\D/g, ""), 10) || 7;
    parts.push(noise(Math.round(((herMs + LEAD) * SR) / 1000), floorDb, seed));
    her.push({ start: t, end: t + herMs, text });
    t += herMs + LEAD;
    // align the turn to the 20 ms grid
    const turnStart = t;
    parts.push(x);
    t += (x.length / SR) * 1000;
    parts.push(noise(Math.round((TAIL * SR) / 1000), floorDb, seed + 1));
    turns.push({ id: r.id, start: turnStart, durMs: r.durationMs, spans: r.spans.map(([a, b]) => [turnStart + a, turnStart + b]), end: turnStart + r.spans.at(-1)[0], windowEnd: t + TAIL, words: r.words.length, latin: r.words.some((w) => /[a-z]/i.test(w[2])) });
    t += TAIL;
  }
  const n = parts.reduce((a, p) => a + p.length, 0);
  const x = new Float32Array(n);
  let o = 0;
  for (const p of parts) { x.set(p, o); o += p.length; }
  return { x, her, turns };
}

/** Score one session's acts against its turns. */
export function scoreTurns(turns, acts, sttLog) {
  const commits = acts.filter(([, k]) => k === "commit").map(([t, , text, why]) => ({ t, text, why }));
  const out = [];
  for (const tr of turns) {
    const inWin = commits.filter((c) => c.t >= tr.start && c.t < tr.windowEnd);
    const holds = tr.spans.slice(0, -1).map(([a, b]) => ({ ms: b - a, cut: inWin.some((c) => c.t > a + 20 && c.t < b) }));
    const voiced = []; // voiced stretches before the end: between holds
    let s = tr.start;
    for (const [a, b] of tr.spans.slice(0, -1)) { voiced.push([s, a]); s = b; }
    voiced.push([s, tr.end]);
    const inSpeech = inWin.filter((c) => voiced.some(([a, b]) => c.t >= a && c.t < b - 200)).length;
    const after = inWin.find((c) => c.t >= tr.end - 200);
    // STT timing: first partial / final in this turn's window
    const ev = sttLog.filter((e) => e.t >= tr.start && e.t < tr.windowEnd);
    const firstDelta = ev.find((e) => e.raw.type === "conversation.item.input_audio_transcription.delta");
    const lastFinal = [...ev].reverse().find((e) => e.raw.type === "conversation.item.input_audio_transcription.completed");
    out.push({ id: tr.id, latin: tr.latin, holds, inSpeech, gap: after ? Math.max(0, after.t - tr.end) : null, why: after?.why ?? null, commits: inWin.length,
      firstPartialMs: firstDelta ? firstDelta.t - tr.start : null, finalAfterEndMs: lastFinal ? lastFinal.t - tr.end : null,
      text: inWin.map((c) => c.text).join(" | ").slice(0, 300) });
  }
  return out;
}

export function aggregate(per) {
  const holds = per.flatMap((p) => p.holds);
  const h500 = holds.filter((h) => h.ms >= 500);
  const gaps = per.map((p) => p.gap).filter((g) => g !== null);
  const fp = per.map((p) => p.firstPartialMs).filter((g) => g !== null);
  const fa = per.map((p) => p.finalAfterEndMs).filter((g) => g !== null);
  return {
    turns: per.length,
    pauseCutoff_500: rate(h500.filter((h) => h.cut).length, h500.length),
    pauseCutoff_all100: rate(holds.filter((h) => h.cut).length, holds.length),
    silence640_500: rate(h500.filter((h) => h.ms > 640).length, h500.length),
    silence900_500: rate(h500.filter((h) => h.ms > 900).length, h500.length),
    turnsWithAnyCutoff: rate(per.filter((p) => p.holds.some((h) => h.cut) || p.inSpeech > 0).length, per.length),
    inSpeechCommits: per.reduce((a, p) => a + p.inSpeech, 0),
    decisionGap: { n: per.length, decided: gaps.length, missed: per.length - gaps.length, p50: q(gaps, 0.5), p90: q(gaps, 0.9), within350: gaps.filter((g) => g <= 350).length, within1000: gaps.filter((g) => g <= 1000).length },
    gapByReason: Object.entries(per.filter((p) => p.gap !== null).reduce((a, p) => { (a[p.why] ??= []).push(p.gap); return a; }, {})).map(([why, g]) => ({ why, n: g.length, p50: q(g, 0.5) })).sort((a, b) => b.n - a.n),
    stt: { firstPartialAfterOnset: { n: fp.length, p50: q(fp, 0.5), p90: q(fp, 0.9) }, lastFinalAfterEnd: { n: fa.length, p50: q(fa, 0.5), p90: q(fa, 0.9) } },
    latinTurns: { n: per.filter((p) => p.latin).length, gapP50: q(per.filter((p) => p.latin && p.gap !== null).map((p) => p.gap), 0.5) },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  loadEnv();
  await import(ROOT + "server/net.js");
  const { DuplexLive } = await import(ROOT + "src/duplex/live.ts");
  const dir = argv[0];
  const lane = opt("--lane", "D4"), name = opt("--name", `eot-${lane}`);
  const shards = Number(opt("--shards", 4)), limit = Number(opt("--limit", 400));
  const replayFile = opt("--replay", null);
  const replay = replayFile ? JSON.parse(zlib.gunzipSync(fs.readFileSync(replayFile)).toString()) : null;
  const idx = JSON.parse(fs.readFileSync(path.join(dir, "index.json"), "utf8"));
  const rows = idx.rows.slice(0, limit);
  const per = Math.ceil(rows.length / shards);
  const t0 = Date.now();
  const results = await pool(Array.from({ length: shards }, (_, s) => async () => {
    const chunk = rows.slice(s * per, (s + 1) * per);
    if (!chunk.length) return null;
    const S = buildSession(dir, chunk);
    const frames = framesOf(S.x);
    const stt = replay ? { replay: replay[s].sttLog } : { lane };
    const r = await runSession({ id: `${name}-${s}`, x: S.x, frames, her: S.her, stt, band: "B4", DuplexLive });
    const scored = scoreTurns(S.turns, r.acts, r.sttLog);
    console.log(`shard ${s}: ${chunk.length} turns, ${(S.x.length / 16000 / 60).toFixed(1)} min, commits ${r.stats.commits}, probes ${r.acts.filter((a) => a[1] === "probe").length}, errors ${r.errors.length}, wall lag ${r.wallLagMs} ms`);
    return { shard: s, r, scored };
  }), shards);
  const okr = results.filter(Boolean);
  const all = okr.flatMap((x) => x.scored);
  const { createHash } = await import("node:crypto");
  const cfgHash = createHash("sha1").update(fs.readFileSync(ROOT + "src/duplex/config.ts")).digest("hex").slice(0, 10);
  const out = {
    id: `duplex-real-${name}`, date: new Date().toISOString().slice(0, 10), lane: replay ? `replay of ${path.basename(replayFile)}` : lane,
    model: okr[0]?.r.model ?? null, region: okr[0]?.r.region ?? null, configHash: cfgHash,
    label: "REAL RECORDED ADULT SPEECH (LiveKit EOT-Bench Hindi, CC BY 4.0: human-to-agent task calls, Hindi with some English, annotated holds / turn ends). REAL STT: the production streaming socket, real time, from the US sandbox (no WebRTC, no India network path). Her line: text only, perfect echo cancellation. Not children.",
    seconds: Math.round((Date.now() - t0) / 1000),
    ...aggregate(all),
    socketErrors: okr.flatMap((x) => x.r.errors).slice(0, 20),
    wallLagMs: okr.map((x) => x.r.wallLagMs),
    worstCuts: all.filter((p) => p.holds.some((h) => h.cut)).slice(0, 25).map((p) => ({ id: p.id, holds: p.holds.filter((h) => h.cut).map((h) => h.ms), text: p.text })),
    missed: all.filter((p) => p.gap === null).slice(0, 25).map((p) => ({ id: p.id, commits: p.commits, finalAfterEndMs: p.finalAfterEndMs, text: p.text })),
    perTurn: all,
  };
  const resDir = path.join(HERE, "results");
  fs.mkdirSync(resDir, { recursive: true });
  fs.writeFileSync(path.join(resDir, `${name}.json`), JSON.stringify(out, null, 1));
  if (!replay) fs.writeFileSync(path.join(resDir, `${name}.stt.json.gz`), zlib.gzipSync(JSON.stringify(okr.map((x) => ({ shard: x.shard, sttLog: x.r.sttLog })))));
  const { perTurn, worstCuts, missed, ...head } = out;
  console.log(JSON.stringify(head, null, 1));
}
