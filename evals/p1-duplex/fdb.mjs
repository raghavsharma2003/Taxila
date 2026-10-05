// p1-duplex TaxilaFDB runner: the SAME world / arms / metrics as evals/duplex/taxilafdb/run.mjs (L1 simulation on the
// rendered TaxilaFDB streams, the real src/duplex runtime), with results written under evals/p1-duplex/results and an
// optional config override (--set '{"OVERLAP":{"sustainedMs":500}}') applied inside every worker, so sweeps run on
// TRAIN / DEV and the final config is scored ONCE on TEST.
//
//   TAXILA_FDB_STREAMS=<dir> node evals/p1-duplex/fdb.mjs --split dev --arms stage-a --lanes D4,FAST,MAI_HOME --name dev-base
// Simulated, not measured on people: TTS child-like voices + mixed echo/overlays/noise, reactive STT model.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fork } from "node:child_process";
import crypto from "node:crypto";
import { listStreams, loadStream, runStream, STREAMS } from "../duplex/taxilafdb/world.mjs";
import { armSpec } from "../duplex/taxilafdb/arms.mjs";
import { facts, aggregate } from "../duplex/taxilafdb/metrics.mjs";
import { SPLIT_VERSION } from "../duplex/taxilafdb/split.mjs";
import * as CONFIG from "../../src/duplex/config.ts";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(HERE, "../..");
const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };

/** Apply a JSON override onto the mutable config rows (OVERLAP, VERDICT, ...). */
export function applyOverrides(set) {
  if (!set) return;
  for (const [row, vals] of Object.entries(set)) {
    const target = CONFIG[row];
    if (!target || typeof target !== "object") throw new Error(`no config row ${row}`);
    Object.assign(target, vals);
  }
}

/**
 * The child's own speech level per (voice, condition), measured on OTHER streams of that voice and room: frames where only
 * the child sounds (no overlay, her silent). What a device that has heard this child earlier in the lesson knows.
 */
let LEVELS = null;
export function childLevels() {
  if (LEVELS) return LEVELS;
  const cache = path.join(STREAMS, "..", "child-profiles.json");
  if (fs.existsSync(cache)) return (LEVELS = JSON.parse(fs.readFileSync(cache, "utf8")));
  const acc = {};
  for (const id of listStreams()) {
    const d = JSON.parse(fs.readFileSync(path.join(STREAMS, `${id}.json`), "utf8"));
    const [, voice, cond] = id.split("~");
    const fr = d.frames, a = (acc[`${voice}~${cond}`] ??= {});
    const vals = [], f0s = [];
    for (let i = 0; i < fr.t.length; i++) if (fr.childOn[i] && !fr.ovOn[i] && fr.herDb[i] < -90 && fr.f0[i]) { vals.push(fr.db[i]); f0s.push(fr.f0[i]); }
    if (vals.length) a[id] = { db: vals.sort((x, y) => x - y)[Math.floor(vals.length / 2)], f0: f0s.sort((x, y) => x - y)[Math.floor(f0s.length / 2)] };
  }
  fs.writeFileSync(cache, JSON.stringify(acc));
  return (LEVELS = acc);
}
/** Median of the per-stream medians of the same voice and room, this stream excluded. */
function profileOf(d, key) {
  const [, voice, cond] = d.id.split("~");
  // the same voice in the same room, never this stream: the prior a device has from the child's earlier turns (frames where
  // only the child sounds; no gold labels are read)
  const v = Object.entries(childLevels()[`${voice}~${cond}`] ?? {}).filter(([id]) => id !== d.id).map(([, x]) => x[key]).sort((a, b) => a - b);
  return v.length ? v[Math.floor(v.length / 2)] : null;
}
export const childLevelOf = (d) => profileOf(d, "db");
export const childF0Of = (d) => profileOf(d, "f0");

if (process.env.FDB_WORKER) {
  process.on("message", async (m) => {
    if (m.kind !== "job") return;
    applyOverrides(m.set);
    const out = [];
    for (const id of m.ids) {
      const d = loadStream(id);
      for (const lane of m.lanes) for (const a of m.arms) {
        try {
          const r = await runStream(d, { ...armSpec(a), lane, herActFromScenario: !!m.world.herAct, childLevelDb: m.world.childLevel ? childLevelOf : undefined, childF0Hz: m.world.childLevel ? childF0Of : undefined });
          const f = facts(r);
          // her audible stop on a barge-in: the hush (gain to OVERLAP.hushLevel, ~20 ms ramp) or the yield (+50 ms to a
          // word boundary), whichever comes first after the onset (F7); a continuer that was hushed but never yielded (F8)
          const onset = r.g.childOnset ?? r.g.overlays[0]?.start ?? null;
          const hush = (r.duckLv ?? []).find(([t, lv]) => lv <= 0.1 && onset !== null && t >= onset - 20);
          const y = r.yields.find((yy) => yy.reason !== "revoke" && onset !== null && yy.t >= onset - 20 && yy.herSpeaking);
          if (f.overlapExpected && onset !== null) {
            const c = [hush ? hush[0] + 20 : null, y ? y.t + 50 : null].filter((x) => x !== null);
            f.stopLatency = c.length ? Math.min(...c) - onset : null;
            f.hushed = !!hush;
          }
          out.push({ f, extra: { probes: r.probes, yields: r.yields, resumes: r.resumes, ducks: r.duckLv ?? [] } });
        } catch (e) {
          out.push({ error: `${id} ${a} ${lane}: ${String(e?.stack || e).slice(0, 400)}` });
        }
      }
    }
    process.send({ kind: "done", out });
  });
} else if (import.meta.url === `file://${process.argv[1]}`) {
  const arms = opt("--arms", "stage-a").split(",");
  const lanes = opt("--lanes", "D4,FAST").split(",");
  const split = opt("--split", "dev");
  const name = opt("--name", "run");
  const set = opt("--set", null) ? JSON.parse(opt("--set")) : null;
  const fams = opt("--families", null)?.split(",") ?? null;
  // world options (opt-in): --herAct 1 (her yes/no lines carry act asked_yes_no), --childLevel 1 (the child's level prior)
  const world = { herAct: opt("--herAct", "0") === "1", childLevel: opt("--childLevel", "0") === "1" };
  if (world.childLevel) childLevels();
  const workers = Number(opt("--workers", Math.max(1, Math.min(6, os.cpus().length - 1))));
  let ids = listStreams().filter((id) => {
    const m = JSON.parse(fs.readFileSync(path.join(STREAMS, `${id}.json`), "utf8")).meta;
    return (split === "all" || m.split === split || (split === "traindev" && m.split !== "test")) && (!fams || fams.includes(m.family));
  });
  const limit = Number(opt("--limit", 0));
  if (limit) ids = ids.slice(0, limit);
  console.log(`p1 TaxilaFDB ${name}: ${ids.length} streams (${split}) × [${arms}] × [${lanes}] on ${workers} workers; set=${JSON.stringify(set)}`);
  const t0 = Date.now();
  const chunks = Array.from({ length: workers }, () => []);
  ids.forEach((id, i) => chunks[i % workers].push(id));
  const results = await Promise.all(chunks.filter((c) => c.length).map((c) => new Promise((resolve, reject) => {
    const w = fork(new URL(import.meta.url).pathname, [], { env: { ...process.env, FDB_WORKER: "1" }, execArgv: ["--max-old-space-size=2500"] });
    w.on("message", (m) => { if (m.kind === "done") { resolve(m.out); w.kill(); } });
    w.on("error", reject);
    w.send({ kind: "job", ids: c, arms, lanes, set, world });
  })));
  const all = results.flat();
  const errors = all.filter((x) => x.error).map((x) => x.error);
  const rows = all.filter((x) => x.f);
  const table = {};
  for (const lane of lanes) for (const a of arms) {
    const F = rows.filter((x) => x.f.arm === a && x.f.lane === lane).map((x) => x.f);
    const ag = aggregate(F);
    const q = (arr, p) => { if (!arr.length) return null; const z = [...arr].sort((x, y) => x - y); return Math.round(z[Math.floor((z.length - 1) * p)]); };
    const stops = F.filter((f) => f.overlapExpected === "yield" && f.stopLatency !== null && f.stopLatency !== undefined).map((f) => f.stopLatency);
    const cont = F.filter((f) => f.family === "F8");
    ag.P1_stopLatency = { n: stops.length, of: F.filter((f) => f.overlapExpected === "yield").length, p50: q(stops, 0.5), p90: q(stops, 0.9), within200: stops.filter((x) => x <= 200).length };
    ag.P1_continuerHushed = { k: cont.filter((f) => f.hushed).length, n: cont.length };
    ag.P1_backgroundHushed = { k: F.filter((f) => f.family === "F9" && f.overlapExpected && f.hushed).length, n: F.filter((f) => f.family === "F9" && f.overlapExpected).length };
    table[`${a}@${lane}`] = ag;
  }
  const h = crypto.createHash("sha1");
  for (const dir of ["src/duplex", "server/duplex"]) for (const f of fs.readdirSync(path.join(ROOT, dir)).sort()) if (/\.(ts|js)$/.test(f)) h.update(f).update(fs.readFileSync(path.join(ROOT, dir, f)));
  const out = { id: `p1-fdb-${name}`, world, date: new Date().toISOString().slice(0, 10), runtimeHash: h.digest("hex").slice(0, 12), split, splitVersion: SPLIT_VERSION,
    streams: ids.length, arms, lanes, set, label: "SIMULATED (TaxilaFDB L1: TTS child-like voices, mixed echo/noise, reactive STT model). Not children, not real speech.",
    seconds: Math.round((Date.now() - t0) / 1000), nErrors: errors.length, errors: errors.slice(0, 10), table };
  fs.mkdirSync(path.join(HERE, "results"), { recursive: true });
  const file = path.join(HERE, "results", `fdb-${name}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 1));
  if (opt("--rows", null)) fs.writeFileSync(opt("--rows"), rows.map((x) => JSON.stringify(x)).join("\n"));
  console.log(`done in ${out.seconds} s, ${errors.length} errors → ${path.relative(process.cwd(), file)}`);
  if (errors.length) console.log(errors.slice(0, 3).join("\n"));
  for (const [k, v] of Object.entries(table)) {
    console.log(k.padEnd(18), `cut(think) ${v.M2_thinkingCutoff.rate} n=${v.M2_thinkingCutoff.n} | gap p50 ${v.M3_gapDecision.p50} p90 ${v.M3_gapDecision.p90} | missed ${v.M4_missedRespond.rate} | yield p50 ${v.M7_yieldLatency.p50} ok ${v.M7_yieldSuccess.rate} n=${v.M7_yieldLatency.n} | stop p50 ${v.P1_stopLatency.p50} (${v.P1_stopLatency.within200}/${v.P1_stopLatency.of}≤200) | keep strict ${v.M8_keepTalkingStrict.rate} hushed ${v.P1_continuerHushed.k} lenient ${v.M8_keepTalkingLenient.rate} n=${v.M8_keepTalkingStrict.n} | falseYield(TV/sib) ${v.M9_falseYield.rate} n=${v.M9_falseYield.n} | echo ${v.M14_echoSelfTrigger.rate} | hold ${v.M12_holdViolation.k} | vRep ${v.M11_verdictOnRepaired.k} | unsafe ${v.M13_nonSafetySpeechAfterDistress.k}/${v.M13_nonSafetySpeechAfterDistress.n} det ${v.M13_detected.k}/${v.M13_detected.n}`);
  }
}
