// duplex r4: mid-sentence pauses through the REAL transcriber. Each clip (SYNTHETIC child-like TTS with exactly N ms
// between phrases, evals/duplex-r4/synth-midpause.mjs; not a child) is streamed IN REAL TIME to the production
// gpt-live-transcribe socket (lane D4: server/voice/stt.js sttSession shape, server VAD 1,500 ms backstop) with the duplex
// engine (src/duplex/live.ts DuplexLive) in the loop; its micro-commit probes go to the socket live. Per utterance: any
// floor commit before the speech end (a truncated turn), the words the turn was committed with, and speech end -> commit.
// Session layout per context: 6 x [her line (her question; mic hears the noise bed) | 400 ms | the clip | 5 s tail].
//   NODE_USE_ENV_PROXY=1 node evals/duplex-r4/realstt-midpause.mjs --clips a.wav,b.wav --out <file.json> [--reps 6] [--conc 4]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { loadEnv, ROOT, f32, activeGain, framesOf, noise, runSession, pool, q } from "../duplex-real/lib.mjs";

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
loadEnv();
const { DuplexLive } = await import(ROOT + "src/duplex/live.ts");
const SR = 16000, LEAD = 400, TAIL = 5000;
const CTX = {
  free: { ui: {}, her: "Achha Golu, ab batao, tumne kya dekha?" },
  closed_phrase: { ui: { answerForm: "words" }, her: "Is dabbe ki shape ka naam kya hai?" },
  closed_number: { ui: { answerForm: "number" }, her: "Ek kilo mein kitne gram hote hain?" },
  open_explanation: { ui: { beat: "explain", handover: "explain" }, her: "Ab tum mujhe samjhao, yeh kaise hota hai?" },
};
const clips = opt("--clips").split(","), reps = Number(opt("--reps", 6));
const load = (wav) => {
  const raw = execFileSync("ffmpeg", ["-v", "error", "-i", wav, "-f", "s16le", "-ar", String(SR), "-ac", "1", "-"], { maxBuffer: 64 << 20 });
  const x = f32(raw), g = activeGain(x);
  return x.map((v) => Math.max(-1, Math.min(1, v * g)));
};
const jobs = [];
for (const clip of clips) for (const [ctx, c] of Object.entries(CTX)) jobs.push(async () => {
  const u = load(clip);
  const herMs = 2500, parts = [], her = [], utts = [];
  let t = 0;
  for (let r = 0; r < reps; r++) {
    parts.push(noise(Math.round(((herMs + LEAD) * SR) / 1000), -62, 7 + r));
    her.push({ start: t, end: t + herMs, text: c.her, ui: c.ui });
    t += herMs + LEAD;
    // speech start / end inside the clip (first / last sample above 1 % FS)
    let a = 0, z = u.length - 1;
    while (a < u.length && Math.abs(u[a]) < 0.01) a++;
    while (z > a && Math.abs(u[z]) < 0.01) z--;
    utts.push({ start: t + (a / SR) * 1000, end: t + (z / SR) * 1000 });
    parts.push(u);
    t += (u.length / SR) * 1000;
    parts.push(noise(Math.round((TAIL * SR) / 1000), -62, 70 + r));
    t += TAIL;
  }
  const n = parts.reduce((s, p) => s + p.length, 0), x = new Float32Array(n);
  let o = 0; for (const p of parts) { x.set(p, o); o += p.length; }
  const res = await runSession({ id: `mid-${path.basename(clip)}-${ctx}`, x, frames: framesOf(x), her, stt: { lane: "D4" }, band: "B3", DuplexLive });
  const commits = res.acts.filter((a) => a[1] === "commit").map(([tt, , text, why]) => ({ t: tt, text, why }));
  const probes = res.acts.filter((a) => a[1] === "probe").map((a) => a[0]);
  return utts.map((ut, i) => {
    const next = utts[i + 1]?.start ?? Infinity;
    const early = commits.filter((cm) => cm.t > ut.start + 100 && cm.t < ut.end - 50);
    const after = commits.find((cm) => cm.t >= ut.end - 50 && cm.t < Math.min(next, ut.end + TAIL));
    return { clip: path.basename(clip), ctx, i, truncated: early.length > 0, early: early.map((e) => ({ at: Math.round(e.t - ut.start), text: e.text, why: e.why })),
      committed: after?.text ?? null, why: after?.why ?? null, endToCommit: after ? Math.round(after.t - ut.end) : null,
      probesInUtterance: probes.filter((p) => p > ut.start && p < ut.end).length, sttErrors: res.errors.length };
  });
});
const rows = (await pool(jobs, Number(opt("--conc", 4)))).flat();
const by = {};
for (const r of rows) { const k = `${r.clip}|${r.ctx}`; (by[k] ??= []).push(r); }
const summary = Object.entries(by).map(([k, rs]) => ({ k, n: rs.length, truncated: rs.filter((r) => r.truncated).length, noCommit: rs.filter((r) => r.committed === null).length, endToCommit: { p50: q(rs.map((r) => r.endToCommit).filter((v) => v !== null), 0.5), p90: q(rs.map((r) => r.endToCommit).filter((v) => v !== null), 0.9) }, probes: rs.reduce((a, r) => a + r.probesInUtterance, 0) }));
for (const s of summary) console.log(JSON.stringify(s));
const tot = { n: rows.length, truncated: rows.filter((r) => r.truncated).length };
console.log(JSON.stringify(tot));
fs.writeFileSync(opt("--out"), JSON.stringify({ date: new Date().toISOString().slice(0, 10), label: "SYNTHETIC child-like TTS clips (not a child) with controlled mid-sentence pauses, streamed in real time to the REAL production transcription socket (D4, gpt-live-transcribe) from the US sandbox, the duplex engine in the loop, probes live", summary, tot, rows }, null, 1));
