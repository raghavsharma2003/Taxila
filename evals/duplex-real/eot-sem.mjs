// duplex-real E1, SEMANTIC ARM: does the stage A semantic estimate (server/duplex/semantic.js: grok-4-1-fast-non-reasoning,
// fallback taxila-fast, both Azure Foundry) separate thinking pauses from turn ends on REAL Hindi transcripts well enough to
// meet the open-context bars? Replays the recorded real-STT runs with the semantic estimator ON: every estimate the host
// asks for is answered from a cache of REAL Azure calls, delivered after that call's own measured latency on the session
// clock. Cache misses are fetched between passes (up to --passes), and the final pass reports any left as `misses` (the
// engine then had no estimate, exactly as on a timeout in production).
//   node evals/duplex-real/eot-sem.mjs <eot_dir> --lane MAI --ctx open_explanation --cache <frames dir> --sem <cache.json>
//        [--split all|train|test] [--passes 3] [--conc 4] [--off]
import fs from "node:fs";
import path from "node:path";
import { loadEnv, ROOT, pool, q } from "./lib.mjs";
import { replayAll } from "./eot-replay.mjs";
import { aggregate } from "./eot.mjs";

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
loadEnv();
await import(ROOT + "server/net.js");
const { DuplexLive } = await import(ROOT + "src/duplex/live.ts");
const { semanticEstimate } = await import(ROOT + "server/duplex/semantic.js");
const HERE = path.dirname(new URL(import.meta.url).pathname);
const dir = argv[0], lane = opt("--lane", "MAI"), ctx = opt("--ctx", "open_explanation"), split = opt("--split", "all");
const semFile = opt("--sem"), passes = Number(opt("--passes", 3)), conc = Number(opt("--conc", 4)), off = argv.includes("--off");
const inSplit = (id) => split === "all" || (parseInt(id.replace(/\D/g, ""), 10) % 2 === 0) === (split === "train");
const cache = semFile && fs.existsSync(semFile) ? JSON.parse(fs.readFileSync(semFile, "utf8")) : {};
const key = (req) => `${req.context.exchange}|${req.context.beat ?? ""}|${req.text}`;
let misses = new Map(), asks = 0, hits = 0;
const semantic = off ? null : {
  lookup(req) { asks++; const c = cache[key(req)]; if (c) { hits++; return c.est ? { ...c.est, latMs: c.latMs, deployment: c.dep } : null; } return null; },
  miss(req) { if (!(key(req) in cache)) misses.set(key(req), req); },
};
let per = null;
for (let p = 0; p < (off ? 1 : passes); p++) {
  misses = new Map(); asks = 0; hits = 0;
  ({ per } = await replayAll({ dir, rec: path.join(HERE, "results", `eot-${lane}-before.stt.json.gz`), shards: 8, cacheDir: opt("--cache"), ctx, DuplexLive, semantic, conc: 2 }));
  console.log(`pass ${p}: asks ${asks}, cache hits ${hits}, new misses ${misses.size}`);
  if (off || !misses.size || p === passes - 1) break;
  let n429 = 0;
  await pool([...misses.values()].map((req) => async () => {
    const t0 = performance.now();
    const r = await semanticEstimate({ text: req.text, context: req.context, timeoutMs: 2500 }).catch(() => null);
    if (!r) n429++;
    // a failed call is cached as "no estimate" with the time it took (production degrades the same way)
    cache[key(req)] = r ? { est: { pComplete: r.pComplete, pHoldWanted: r.pHoldWanted, asksHer: r.asksHer, offTask: r.offTask }, latMs: r.latMs, dep: r.deployment } : { est: null, latMs: Math.round(performance.now() - t0), dep: null };
  }), conc);
  fs.writeFileSync(semFile, JSON.stringify(cache));
  console.log(`  fetched ${misses.size} (no estimate: ${n429})`);
}
const lat = Object.values(cache).filter((c) => c.est).map((c) => c.latMs);
const a = aggregate(per.filter((x) => inSplit(x.id)));
const out = {
  id: `duplex-real-eot-sem-${lane}-${ctx}-${off ? "off" : "on"}-${split}`, date: new Date().toISOString().slice(0, 10), lane: `replay of eot-${lane}-before`, ctx, semantic: off ? "off" : "on",
  label: "REAL RECORDED ADULT SPEECH (eot-bench Hindi) + REAL STT events replayed; semantic estimates are REAL Azure calls (cached, delivered after their measured latency). Not children.",
  semCalls: { cached: Object.keys(cache).length, lastPassAsks: asks, lastPassHits: hits, lastPassMisses: misses.size, latP50: q(lat, 0.5), latP90: q(lat, 0.9) },
  ...a, perTurn: per.filter((x) => inSplit(x.id)),
};
fs.writeFileSync(path.join(HERE, "results", `eot-sem-${lane}-${ctx}-${off ? "off" : "on"}-${split}.json`), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ lane, ctx, sem: off ? "off" : "on", split, cut500: a.pauseCutoff_500, cutAll: a.pauseCutoff_all100.rate, inSpeech: a.inSpeechCommits, gap: a.decisionGap, byReason: a.gapByReason, sem: out.semCalls }));
