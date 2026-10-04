// budget-sim.mjs — Study D (duplex architecture), measurement M-D1, 2026-10-04.
//
// Question: given the stage latencies this repo has ALREADY measured, what child-stops → first-teacher-sound gap does each
// architectural change in docs/research/duplex/ARCHITECTURE.md buy, per turn class, and which change carries the most?
//
// Method (deterministic, seeded, no network, no model calls):
//   - Director-stage samples are bootstrapped from the 48 real cascade turns in evals/results/cascade-latency-2026-10-03-*.json
//     (US sandbox → eastus2, synthetic child speech; each row has endpoint / stt / director / tts and the Director's internal
//     timeline @ctx … @classified … @replied … @stored).
//   - India stages are lognormals fitted to measured p50/p90 (MODEL-STACK §2.3, INDIA-MOVE, hv-latency):
//       MAI-Transcribe-2-Streaming final after commit 68/75 ms (Chennai, n=20); D4 live-transcribe final 753/914 (Chennai);
//       India-app /turn Director 1562/2020 (Chennai, typed, n=60); DragonHD TTS first byte 228/287 (US→eastus2, n=20).
//   - Stages marked [E] are ASSUMPTIONS, not measurements (on-device commit overhead, India-app RTT, CHN→CI TTS delta,
//     fast-path server time). They are printed with the result so nobody mistakes the output for a measurement.
//   - Stages are sampled independently. Scenario A (today, eastus2) is the calibration check: its simulated p50/p90 is
//     compared with the measured end-to-end 3316/4010 ms first sound (n=12).
// Output: evals/duplex/results/budget-sim-2026-10-04.json (+ a printed table).
// Limits: a composition model, not a measurement of the new architecture; independence understates tail coupling; no real
// children (E1 pending); the share of turns in each class is unmeasured (MODEL-STACK §4 item 7).
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const RES = path.join(HERE, "../results");
const FILES = ["integration-after", "integration-before", "lesson-truth-after", "lesson-truth-after-c6"].map((f) => path.join(RES, `cascade-latency-2026-10-03-${f}.json`));
const rows = FILES.flatMap((f) => JSON.parse(fs.readFileSync(f, "utf8")).rows);

// ── seeded RNG (mulberry32) + samplers ──
let seed = 20261004;
const rnd = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const gauss = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
/** lognormal from a p50 and a p90 (ms). */
const LN = (p50, p90) => { const mu = Math.log(p50), s = (Math.log(p90) - mu) / 1.2816; return () => Math.exp(mu + s * gauss()); };
const U = (a, b) => () => a + (b - a) * rnd();
const pick = (a) => a[Math.floor(rnd() * a.length)];

// ── the Director's internal timeline from the real rows ──
const tl = (s) => Object.fromEntries([...String(s).matchAll(/@(\w+):(\d+)/g)].map((m) => [m[1], +m[2]]));
const dir = rows.map((r) => ({ ...tl(r.directorTimings), director: r.director, endpointOver: r.endpoint - 900, stt: r.stt, tts: r.tts, sound: r.sound })).filter((d) => d.replied && d.stored);

// ── stages ──
const S = {
  maiFinal: LN(68, 75), // [M] Chennai
  d4FinalChn: LN(753, 914), // [M] Chennai
  dirIndia: LN(1562, 2020), // [M] Chennai, India app, typed /turn (includes RTT to eastus2 AI)
  dragonHd: LN(228, 287), // [M] US → eastus2
  chnCiTts: U(0, 60), // [E] Chennai → centralindia TTS delta (unmeasured; MODEL-STACK §4 item 5)
  clientCommit: LN(40, 90), // [E] on-device VAD frame (32 ms) + lexical + Smart Turn int8 scorer (10-100 ms vendor)
  indiaRtt: LN(60, 120), // [E] child (India) → India-app ACA round trip incl. TLS reuse; not measured from a phone
  fastServer: U(55, 70), // [E] ctx+kit load (~50 ms in the rows' @ctx/@kit) + classifyFast + pick + guard (µs-ms)
  outLead: () => 110, // [M] cascade-latency 'sound' = first byte + 60 ms start lead + 50 ms nominal output
};
const storeShare = () => { const d = pick(dir); return d.stored - d.replied; }; // [M] the store step currently before the reply returns

// ── scenarios: each returns { sound, content } ms after the child's last word ──
// sound = first audible teacher sound; content = first audio of the verdict/reply body.
const SC = {
  "A today eastus2 (calibration)": () => {
    const d = pick(dir); const t = 900 + d.endpointOver + d.stt + d.director + d.tts + S.outLead();
    return { sound: t, content: t };
  },
  "B India app today (900 ms server VAD, MAI, Director, DragonHD)": () => {
    const ep = 900 + pick(dir).endpointOver; const t = ep + S.maiFinal() + S.dirIndia() + S.dragonHd() + S.chnCiTts() + S.outLead();
    return { sound: t, content: t };
  },
  "C B + 500 ms candidate, commit at candidate (closed answer)": () => {
    const ep = 500 + pick(dir).endpointOver; const t = ep + S.maiFinal() + S.dirIndia() + S.dragonHd() + S.chnCiTts() + S.outLead();
    return { sound: t, content: t };
  },
  "C2 C + store moved after first audio": () => {
    const ep = 500 + pick(dir).endpointOver; const t = ep + S.maiFinal() + Math.max(300, S.dirIndia() - storeShare()) + S.dragonHd() + S.chnCiTts() + S.outLead();
    return { sound: t, content: t };
  },
  "C3 C2 + client-decided commit (on-device floor, manual STT commit)": () => {
    const ep = 500 + S.clientCommit(); const t = ep + S.maiFinal() + Math.max(300, S.dirIndia() - storeShare()) + S.dragonHd() + S.chnCiTts() + S.outLead();
    return { sound: t, content: t };
  },
  "P C3 + uptake prelude (child's token, verdict-neutral) as first sound": () => {
    const ep = 500 + S.clientCommit(); const fin = ep + S.maiFinal();
    const content = fin + Math.max(300, S.dirIndia() - storeShare()) + S.dragonHd() + S.chnCiTts() + S.outLead();
    const sound = Math.min(content, fin + S.indiaRtt() / 2 + S.dragonHd() + S.chnCiTts() + S.outLead());
    return { sound, content };
  },
  "D C3 + pre-answer drafts (code-graded closed answer; body drafted during wait time I, TTS at commit)": () => {
    const ep = 500 + S.clientCommit(); const t = ep + S.maiFinal() + S.indiaRtt() + S.fastServer() + S.dragonHd() + S.chnCiTts() + S.outLead();
    return { sound: t, content: t };
  },
  "E D + body audio pre-synthesised and cached on the device": () => {
    const ep = 500 + S.clientCommit(); const t = ep + S.maiFinal() + S.indiaRtt() + S.fastServer() + S.outLead();
    return { sound: t, content: t };
  },
  "F E with a 300 ms candidate (needs a predictive scorer validated on children, X1/E-C1)": () => {
    const ep = 300 + S.clientCommit(); const t = ep + S.maiFinal() + S.indiaRtt() + S.fastServer() + S.outLead();
    return { sound: t, content: t };
  },
  "X0 explanation turn, held 1.5 s after the candidate, Director after commit": () => {
    const ep = 500 + S.clientCommit() + 1500; const t = ep + S.maiFinal() + Math.max(300, S.dirIndia() - storeShare()) + S.dragonHd() + S.chnCiTts() + S.outLead();
    return { sound: t, content: t };
  },
  "X1 explanation turn, held 1.5 s, speculation launched at the candidate fragment": () => {
    const cand = 500 + S.clientCommit(); const fin = cand + S.maiFinal();
    const ready = fin + Math.max(300, S.dirIndia() - storeShare()); // speculative classify ∥ replies from the candidate text
    const commit = cand + 1500 + S.indiaRtt(); // the hold expires, the client tells the server the same text is final
    const t = Math.max(ready, commit) + S.dragonHd() + S.chnCiTts() + S.outLead();
    return { sound: t, content: t };
  },
};

const N = 200_000;
const q = (a, p) => a[Math.min(a.length - 1, Math.floor(p * a.length))];
const out = {};
for (const [name, f] of Object.entries(SC)) {
  const snd = [], con = [];
  for (let i = 0; i < N; i++) { const r = f(); snd.push(r.sound); con.push(r.content); }
  snd.sort((a, b) => a - b); con.sort((a, b) => a - b);
  out[name] = { sound: { p50: Math.round(q(snd, 0.5)), p90: Math.round(q(snd, 0.9)) }, content: { p50: Math.round(q(con, 0.5)), p90: Math.round(q(con, 0.9)) },
    shareSoundLe600: +(snd.filter((x) => x <= 600).length / N).toFixed(3), shareSoundLe1000: +(snd.filter((x) => x <= 1000).length / N).toFixed(3), shareSoundLe1600: +(snd.filter((x) => x <= 1600).length / N).toFixed(3) };
}

const measuredA = { sound: (() => { const s = rows.map((r) => r.sound).sort((a, b) => a - b); return { p50: q(s, 0.5), p90: q(s, 0.9), n: s.length }; })() };
const directorShape = (() => {
  const c = dir.map((d) => d.classified - d.kit).sort((a, b) => a - b), r = dir.map((d) => d.replied - d.planned).sort((a, b) => a - b), st = dir.map((d) => d.stored - d.replied).sort((a, b) => a - b);
  return { n: dir.length, classifyMs: { p50: q(c, 0.5), p90: q(c, 0.9) }, replyAfterPlanMs: { p50: q(r, 0.5), p90: q(r, 0.9) }, storeBeforeReturnMs: { p50: q(st, 0.5), p90: q(st, 0.9) } };
})();

const result = {
  id: "M-D1", date: "2026-10-04", method: "Monte Carlo composition of measured stage distributions (see header); n=200000 draws per scenario; seed 20261004",
  calibration: { measuredTodayFirstSound: measuredA.sound, simulatedToday: out["A today eastus2 (calibration)"].sound },
  directorShape,
  assumptions: { clientCommit: "[E] LN(40,90)", indiaRtt: "[E] LN(60,120)", chnCiTts: "[E] U(0,60)", fastServer: "[E] U(55,70)", storeAfterAudio: "[E] design change, uses measured store step", independence: "[E]" },
  scenarios: out,
};
fs.mkdirSync(path.join(HERE, "results"), { recursive: true });
fs.writeFileSync(path.join(HERE, "results/budget-sim-2026-10-04.json"), JSON.stringify(result, null, 2));

console.log(`calibration: measured today first sound p50/p90 ${measuredA.sound.p50}/${measuredA.sound.p90} (n=${measuredA.sound.n}); simulated ${out["A today eastus2 (calibration)"].sound.p50}/${out["A today eastus2 (calibration)"].sound.p90}`);
console.log("director shape (n=%d): classify p50/p90 %o, reply after plan %o, store before return %o", directorShape.n, directorShape.classifyMs, directorShape.replyAfterPlanMs, directorShape.storeBeforeReturnMs);
console.log("\n| scenario | first sound p50 / p90 | content p50 / p90 | P(sound ≤ 0.6 s) | ≤ 1.0 s | ≤ 1.6 s |\n|---|---|---|---|---|---|");
for (const [k, v] of Object.entries(out)) console.log(`| ${k} | ${v.sound.p50} / ${v.sound.p90} | ${v.content.p50} / ${v.content.p90} | ${v.shareSoundLe600} | ${v.shareSoundLe1000} | ${v.shareSoundLe1600} |`);
