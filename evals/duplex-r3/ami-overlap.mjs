// duplex r3 E2 (overlap) on REAL adult speech + the REAL STT events recorded in round 2 (AMI Meeting Corpus, CC BY 4.0,
// English incl. Indian-L1 adults; evaluation only): the same open-loop replay and the same scoring as
// evals/duplex-real/ami-real.mjs `score` (her = another participant Y; continuers, barge-ins, other voices in the room, her
// own bleed), run one meeting per process in parallel so a before/after fits in a working session. Scoring is imported,
// never copied. Turn-end rows are not part of this runner (E1 / eot-bench measures turn ends).
//   node evals/duplex-r3/ami-overlap.mjs <frames_dir> --name <x> [--meetings ES2004b,ES2005b,IS1004b,IS1008b] [--rec ami-raw-D4] [--tmp dir]
//        [--set OVERLAP.armedRevoke=false,...]   (ablation of one mutable config row)
//   (internal) --one <meeting> --out <file>
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { spawn } from "node:child_process";
import { loadEnv, ROOT, runSession, q, rate } from "../duplex-real/lib.mjs";
import { scoreOverlap } from "../duplex-real/ami-real.mjs";

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const HERE = path.dirname(new URL(import.meta.url).pathname);
const RES = path.join(ROOT, "evals/duplex-real/results");
const dec = (w) => w.replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
const floorOf = (db) => [...db].sort((a, b) => a - b)[Math.floor(db.length * 0.1)];
function spurts(words, maxGap) { const out = []; for (const [s, e, w] of words) { const l = out.at(-1); if (l && s - l.end < maxGap) { l.end = Math.max(l.end, e); l.words.push([s, e, w]); } else out.push({ start: s, end: e, words: [[s, e, w]] }); } return out; }
const herLines = (M, Y) => spurts(M.chans[Y].words.map(([s, e, w]) => [s, e, dec(w)]), 700).filter((s) => s.end - s.start >= 600).map((s) => ({ start: s.start, end: s.end, text: s.words.map((w) => w[2]).join(" "), outDb: M.chans[Y].db }));

/** `--set OVERLAP.armedRevoke=false,PAUSE_WAIT.question=0`: ablations on the engine's mutable config rows (eval only). */
async function applySets(sets) {
  if (!sets) return;
  const cfg = await import(ROOT + "src/duplex/config.ts");
  for (const kv of sets.split(",")) {
    const [k, v] = kv.split("=");
    // dotted paths of any depth (round 4: OVERLAP.echoRef.on=true)
    const keys = k.split(".");
    let o = cfg;
    for (const key of keys.slice(0, -1)) o = o[key];
    o[keys.at(-1)] = v === "true" ? true : v === "false" ? false : Number(v);
  }
}

async function one(framesDir, m, rec, outFile) {
  loadEnv();
  await applySets(opt("--set", null));
  const { DuplexLive } = await import(ROOT + "src/duplex/live.ts");
  const M = JSON.parse(fs.readFileSync(path.join(framesDir, `${m}.json`), "utf8"));
  const all = { cont: [], barge: [], room: [], echoSpurts: 0, echoYields: 0, pairs: 0, hushes: 0, hushLatency: [] };
  for (const X of Object.keys(M.chans).sort()) {
    const R = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(RES, `${rec}.${m}.${X}.json.gz`))));
    for (const Y of Object.keys(M.chans).sort().filter((a) => a !== X)) {
      const cx = M.chans[X];
      const r = await runSession({ id: `${m}-${X}${Y}`, x: new Float32Array(0), frames: { db: cx.db, f0: cx.f0 }, floorDb: floorOf(cx.db), her: herLines(M, Y), stt: { replay: R.sttLog }, band: "B4", DuplexLive });
      all.pairs++;
      const s = scoreOverlap(M, X, Y, r.acts, r.logs);
      for (const k of ["cont", "barge", "room"]) all[k].push(...s[k].map((x) => ({ ...x, m, X, Y })));
      all.echoSpurts += s.echoSpurts; all.echoYields += s.echoYields;
      // why the engine yielded on her own bleed (the same spurt rule as scoreOverlap's echo count)
      const xw = M.chans[X].words, others = Object.keys(M.chans).filter((a) => a !== X && a !== Y);
      const talk = (words, a, b) => words.some(([s0, e0]) => s0 < b && e0 > a);
      for (const y of herLines(M, Y)) {
        if (talk(xw, y.start - 500, y.end + 500) || others.some((z) => talk(M.chans[z].words, y.start, y.end))) continue;
        const yl = r.logs.filter(([t, a]) => a === "YIELD" && t >= y.start && t <= y.end);
        if (yl.length) (all.echoWhy ??= []).push(`${yl[0][4] ?? ""}|${yl[0][2]}`);
      }
    }
  }
  fs.writeFileSync(outFile, JSON.stringify(all));
}

export function summarize(parts, meta) {
  const all = { cont: [], barge: [], room: [], echoSpurts: 0, echoYields: 0, pairs: 0 };
  for (const p of parts) { for (const k of ["cont", "barge", "room"]) all[k].push(...p[k]); all.echoSpurts += p.echoSpurts; all.echoYields += p.echoYields; all.pairs += p.pairs; }
  const stops = all.barge.map((b) => Math.min(b.hush ?? Infinity, b.yield ?? Infinity)).filter(Number.isFinite);
  const yl = all.barge.map((b) => b.yield).filter((x) => x !== null);
  return {
    ...meta, pairs: all.pairs,
    continuer_keepTalking: rate(all.cont.filter((c) => c.ok).length, all.cont.length),
    continuer_hushed: rate(all.cont.filter((c) => c.hushed).length, all.cont.length),
    continuer_failure_reasons: Object.entries(all.cont.filter((c) => !c.ok).reduce((a, c) => { const k = (c.why.split(",")[0] || "none").split("|")[0]; a[k] = (a[k] ?? 0) + 1; return a; }, {})),
    bargeIn_stop: { n: all.barge.length, stopped: stops.length, p50: q(stops, 0.5), p90: q(stops, 0.9), within200: stops.filter((x) => x <= 200).length, within200rate: rate(stops.filter((x) => x <= 200).length, all.barge.length) },
    bargeIn_yield: { n: all.barge.length, yielded: yl.length, p50: q(yl, 0.5), p90: q(yl, 0.9), within1000: yl.filter((x) => x <= 1000).length },
    roomTalk_falseYield: rate(all.room.filter((r) => r.yielded).length, all.room.length),
    roomTalk_hushed: rate(all.room.filter((r) => r.hushed).length, all.room.length),
    roomTalk_yield_reasons: Object.entries(all.room.filter((r) => r.yielded).reduce((a, r) => { const k = (r.why.split(",")[0] || "none").split("|")[0]; a[k] = (a[k] ?? 0) + 1; return a; }, {})),
    echo_selfYield: rate(all.echoYields, all.echoSpurts),
    echo_yield_reasons: Object.entries(parts.flatMap((p) => p.echoWhy ?? []).reduce((a, w) => { const k = w.split("|")[0] + "|" + (w.split("|")[1] || "").split("+")[0]; a[k] = (a[k] ?? 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 12),
    detail: { cont: all.cont.filter((c) => !c.ok), barge: all.barge },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const framesDir = argv[0];
  const rec = opt("--rec", "ami-raw-D4");
  if (opt("--one")) { await one(framesDir, opt("--one"), rec, opt("--out")); process.exit(0); }
  const name = opt("--name", "r3-ami");
  const meetings = opt("--meetings", "ES2004b,ES2005b,IS1004b,IS1008b").split(",");
  const tmp = opt("--tmp", path.join(path.dirname(path.dirname(path.resolve(framesDir))), "r3-duplex", `ami-tmp-${name}`));
  fs.mkdirSync(tmp, { recursive: true });
  const t0 = Date.now();
  await Promise.all(meetings.map((m) => new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [new URL(import.meta.url).pathname, framesDir, "--one", m, "--rec", rec, "--out", path.join(tmp, `${m}.json`), ...(opt("--set", null) ? ["--set", opt("--set")] : [])], { stdio: ["ignore", "ignore", "inherit"] });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${m} exit ${code}`))));
  })));
  const parts = meetings.map((m) => JSON.parse(fs.readFileSync(path.join(tmp, `${m}.json`), "utf8")));
  const crypto = await import("node:crypto");
  const hash = (f) => crypto.createHash("sha1").update(fs.readFileSync(ROOT + f)).digest("hex").slice(0, 10);
  const out = summarize(parts, {
    id: `duplex-r3-${name}`, date: new Date().toISOString().slice(0, 10), rec, meetings, seconds: Math.round((Date.now() - t0) / 1000), set: opt("--set", null),
    engineHash: { config: hash("src/duplex/config.ts"), rules: hash("src/duplex/engineRules.ts"), overlap: hash("src/duplex/overlap.ts"), host: hash("src/duplex/host.ts"), governor: hash("src/duplex/governor.ts") },
    label: "REAL RECORDED ADULT SPEECH (AMI, CC BY 4.0, English incl. Indian-L1 adults; evaluation only) + REAL STT events (production gpt-live-transcribe socket, recorded live in round 2), replayed open loop per her = Y through the current engine. Not children, not Hindi.",
  });
  fs.writeFileSync(path.join(RES, `${name}.json`), JSON.stringify(out, null, 1));
  const { detail, ...head } = out;
  console.log(JSON.stringify(head));
}
