// duplex-real E2: overlaps, continuers, barge-ins, other voices, and turn ends on REAL recorded adult speech (AMI Meeting
// Corpus, CC BY 4.0, headset channels; participants include Indian-L1 adults; English) through the REAL STT lane.
//
// What changed against evals/p1-duplex/ami.mjs (same meetings, same annotations, same frames): the transcription stream is
// no longer SttSim. Every child-role channel X is streamed in real time to the production socket twice:
//   pass "turns"  X's channel with every other speaker's stretches (where X is silent) replaced by X's own room floor, in
//                 the AUDIO and the frames alike; the live bridge runs in the loop with no her lines and its probes go to
//                 the socket → turn-end decision gaps and thinking-pause cut-offs, live;
//   pass "raw"    X's real channel, unmasked (the others' real bleed is in it); the bridge runs in the loop (probes live)
//                 and the socket's events are recorded. Then, OFFLINE, every her = Y replays those recorded events against
//                 the same real frames (the "overlap" replay) → continuers, barge-ins, room talk, her own bleed. Probes the
//                 replay engine sends are not honoured (the recording has the raw pass's probes): reported.
// The SAME replay harness with SttSim in place of the recording ("sim" arm) isolates what the real STT changes.
// Scoring definitions are ami.mjs's, with one change forced by not masking: a continuer / barge-in only counts when no third
// speaker talks within ±1 s (so the third speaker's real bleed cannot be mistaken for X).
//
//   node evals/duplex-real/ami-real.mjs record <frames_dir> <pcm_dir> --meetings ES2004b,... [--pass raw|turns] [--conc 6]
//   node evals/duplex-real/ami-real.mjs score  <frames_dir> --rec <name> [--arm real|sim] [--name x] [--meetings ...]
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { loadEnv, ROOT, f32, noise, runSession, pool, q, rate } from "./lib.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const RES = path.join(HERE, "results");
const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const LISTEN = new Set(["yeah", "yes", "yep", "yup", "mm-hmm", "mm", "hmm", "mhm", "uh-huh", "okay", "ok", "right", "sure", "alright", "oh", "uh", "huh", "ah", "mmm", "hm"]);
const dec = (w) => w.replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');

function spurts(words, maxGap) {
  const out = [];
  for (const [s, e, w] of words) {
    const last = out.at(-1);
    if (last && s - last.end < maxGap) { last.end = Math.max(last.end, e); last.words.push([s, e, w]); } else out.push({ start: s, end: e, words: [[s, e, w]] });
  }
  return out;
}
const anyTalk = (words, a, b) => words.some(([s, e]) => s < b && e > a);
const floorOf = (db) => [...db].sort((a, b) => a - b)[Math.floor(db.length * 0.1)];

/** The "turns" mask: frames where any other speaker talks (±) and X does not. */
export function turnsMask(M, X) {
  const cx = M.chans[X], n = cx.db.length;
  const m = new Uint8Array(n), xOn = new Uint8Array(n);
  for (const [s0, e0] of cx.words) for (let k = Math.max(0, Math.floor((s0 - 150) / 20)); k <= Math.min(n - 1, Math.ceil((e0 + 150) / 20)); k++) xOn[k] = 1;
  for (const z of Object.keys(M.chans).filter((a) => a !== X)) for (const [s0, e0] of M.chans[z].words) for (let k = Math.max(0, Math.floor((s0 - 100) / 20)); k <= Math.min(n - 1, Math.ceil((e0 + 150) / 20)); k++) if (!xOn[k]) m[k] = 1;
  return m;
}

/** Turn ends and pauses of X (ami.mjs "turns" scoring). */
export function scoreTurns(M, X, acts, phases) {
  const xw = M.chans[X].words.map(([s, e, w]) => [s, e, dec(w)]);
  const allOther = Object.keys(M.chans).filter((a) => a !== X).flatMap((a) => M.chans[a].words);
  const phaseAt = (t) => { let p = "idle"; for (const [tt, ph] of phases) { if (tt > t) break; p = ph; } return p; };
  const ends = [], pauses = [];
  for (const s of spurts(xw, 1500)) {
    for (let k = 1; k < s.words.length; k++) {
      const a = s.words[k - 1][1], b = s.words[k][0];
      if (b - a < 500 || anyTalk(allOther, a, b)) continue;
      pauses.push({ ms: b - a, cut: acts.some(([t, kk]) => kk === "commit" && t > a + 20 && t < b) });
    }
    const nextOther = allOther.filter(([st]) => st >= s.end - 100).sort((p, q2) => p[0] - q2[0])[0];
    const nextX = xw.find(([st]) => st > s.end);
    if (nextX && nextX[0] - s.end < 1500) continue;
    const c = acts.find(([t, k]) => k === "commit" && t >= s.end - 200 && t <= s.end + 8000);
    ends.push({ gap: c ? Math.max(0, c[0] - s.end) : null, why: c?.[3] ?? null, human: nextOther && nextOther[0] - s.end <= 2000 ? nextOther[0] - s.end : null, words: s.words.length, phase: phaseAt(s.end + 1500) });
  }
  return { ends, pauses };
}

/** Continuers, barge-ins, room talk and her own bleed for one (X, her = Y) replay. */
export function scoreOverlap(M, X, Y, acts, logs) {
  const xw = M.chans[X].words.map(([s, e, w]) => [s, e, dec(w)]);
  const yw = M.chans[Y].words.map(([s, e, w]) => [s, e, dec(w)]);
  const others = Object.keys(M.chans).filter((a) => a !== X && a !== Y);
  const otherWords = others.flatMap((z) => M.chans[z].words);
  const ySp = spurts(yw, 700).filter((s) => s.end - s.start >= 600);
  const duckOf = (a, b) => acts.find(([t, k, x]) => t >= a && t <= b && k === "duck" && x <= 0.06);
  const yieldsIn = (a, b) => acts.filter(([t, k]) => t >= a && t <= b && (k === "pause" || k === "stop"));
  const res = { cont: [], barge: [], room: [], echoSpurts: 0, echoYields: 0 };
  const xb = spurts(xw, 300);
  for (const y of ySp) {
    for (const b of xb) {
      if (b.start < y.start + 300 || b.start > y.end - 200) continue;
      if (anyTalk(otherWords, b.start - 1000, b.end + 1000)) continue; // a third voice nearby: not attributable
      const toks = b.words.map((w) => w[2].toLowerCase());
      const listening = toks.every((w) => LISTEN.has(w));
      if (listening && b.end - b.start <= 1200 && y.end - b.end >= 1000) {
        const ys = yieldsIn(b.start - 20, b.end + 1000);
        res.cont.push({ ok: ys.length === 0, hushed: !!duckOf(b.start - 20, b.end + 300), words: toks.join(" "), ms: b.end - b.start,
          why: logs.filter(([t, a]) => a === "YIELD" && t >= b.start - 20 && t <= b.end + 1000).map((x) => `${x[4] ?? ""}|${x[2]}`).join(",") });
      } else if (!listening && toks.filter((w) => !LISTEN.has(w)).length >= 2 && y.end - b.start <= 2000 && y.end > b.start) {
        const xEnd = spurts(xw.filter(([s]) => s >= b.start), 500)[0]?.end ?? b.end;
        if (xEnd - y.end < 1000) continue;
        const h = duckOf(b.start - 1000, b.start + 2000);
        const yl = yieldsIn(b.start - 1000, b.start + 2500)[0];
        res.barge.push({ hush: h ? Math.max(0, h[0] + 20 - b.start) : null, yield: yl ? Math.max(0, yl[0] + 50 - b.start) : null, early: !!((h && h[0] < b.start - 20) || (yl && yl[0] < b.start - 20)), words: toks.slice(0, 6).join(" ") });
      }
    }
    for (const z of others) {
      for (const s of spurts(M.chans[z].words, 300)) {
        if (s.end - s.start < 800 || s.start < y.start + 300 || s.end > y.end) continue;
        if (anyTalk(xw, s.start - 500, s.end + 500)) continue;
        res.room.push({ yielded: yieldsIn(s.start - 20, s.end + 500).length > 0, hushed: !!duckOf(s.start - 20, s.end),
          why: logs.filter(([t, a]) => a === "YIELD" && t >= s.start - 20 && t <= s.end + 500).map((x) => `${x[4] ?? ""}|${x[2]}`).join(",") });
      }
    }
    if (!anyTalk(xw, y.start - 500, y.end + 500) && !others.some((z) => anyTalk(M.chans[z].words, y.start, y.end))) {
      res.echoSpurts++;
      if (yieldsIn(y.start, y.end).length) res.echoYields++;
    }
  }
  return res;
}

function herLines(M, Y) {
  const cy = M.chans[Y];
  const yw = cy.words.map(([s, e, w]) => [s, e, dec(w)]);
  return spurts(yw, 700).filter((s) => s.end - s.start >= 600).map((s) => ({ start: s.start, end: s.end, text: s.words.map((w) => w[2]).join(" "), outDb: cy.db }));
}

function micOf(pcmDir, M, X, pass) {
  const x = f32(fs.readFileSync(path.join(pcmDir, `${M.meeting}.${X}.s16`)));
  const cx = M.chans[X];
  const mask = pass === "turns" ? turnsMask(M, X) : null;
  if (mask) {
    const fl = floorOf(cx.db);
    const bed = noise(320, fl, 3);
    for (let k = 0; k < mask.length; k++) if (mask[k]) for (let i = 0; i < 320; i++) { const j = k * 320 + i; if (j < x.length) x[j] = bed[i] * (0.8 + 0.4 * ((k * 7 + i) % 5) / 5); }
  }
  return { x, mask };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  loadEnv();
  await import(ROOT + "server/net.js");
  const { DuplexLive } = await import(ROOT + "src/duplex/live.ts");
  const cmd = argv[0];
  const framesDir = argv[1];
  const meetings = (opt("--meetings", "ES2004b,ES2005b,IS1004b")).split(",");
  fs.mkdirSync(RES, { recursive: true });
  const cfgHash = crypto.createHash("sha1").update(fs.readFileSync(ROOT + "src/duplex/config.ts")).digest("hex").slice(0, 10);
  if (cmd === "record") {
    const pcmDir = argv[2];
    const pass = opt("--pass", "raw"), lane = opt("--lane", "D4"), conc = Number(opt("--conc", 6));
    const name = opt("--name", `ami-${pass}-${lane}`);
    const jobs = [];
    for (const m of meetings) {
      const M = JSON.parse(fs.readFileSync(path.join(framesDir, `${m}.json`), "utf8"));
      for (const X of Object.keys(M.chans).sort()) jobs.push(async () => {
        const file = path.join(RES, `${name}.${m}.${X}.json.gz`);
        if (fs.existsSync(file)) { console.log(m, X, "cached"); return; }
        const { x, mask } = micOf(argv[2], M, X, pass);
        const cx = M.chans[X];
        const frames = { db: mask ? cx.db.map((d, k) => (mask[k] ? floorOf(cx.db) : d)) : cx.db, f0: mask ? cx.f0.map((f, k) => (mask[k] ? null : f)) : cx.f0 };
        const t0 = Date.now();
        const r = await runSession({ id: `${m}-${X}-${pass}`, x, frames, her: [], stt: { lane }, band: "B4", DuplexLive });
        const turns = pass === "turns" ? scoreTurns(M, X, r.acts, r.phases) : null;
        fs.writeFileSync(file, zlib.gzipSync(JSON.stringify({ meeting: m, X, pass, lane, model: r.model, region: r.region, configHash: cfgHash, errors: r.errors, wallLagMs: r.wallLagMs, acts: r.acts, phases: r.phases, sttLog: r.sttLog, turns })));
        console.log(m, X, pass, `${Math.round((Date.now() - t0) / 1000)} s`, `stt events ${r.sttLog.length}, commits ${r.stats.commits}, probes ${r.acts.filter((a) => a[1] === "probe").length}, errors ${r.errors.length}`);
      });
    }
    await pool(jobs, conc);
  } else if (cmd === "score") {
    const rec = opt("--rec", "ami-raw-D4"), arm = opt("--arm", "real"), name = opt("--name", `${rec}-${arm}`);
    const turnsRec = opt("--turns", rec.replace("-raw-", "-turns-"));
    const all = { cont: [], barge: [], room: [], ends: [], pauses: [], echoSpurts: 0, echoYields: 0, replayProbesIgnored: 0, pairs: 0 };
    let calibrated = false;
    for (const m of meetings) {
      const M = JSON.parse(fs.readFileSync(path.join(framesDir, `${m}.json`), "utf8"));
      for (const X of Object.keys(M.chans).sort()) {
        const recFile = path.join(RES, `${rec}.${m}.${X}.json.gz`);
        const R = arm === "real" ? JSON.parse(zlib.gunzipSync(fs.readFileSync(recFile))) : null;
        // turn ends: the live turns pass (real), or SttSim on the masked frames (sim)
        if (arm === "real") {
          const T = path.join(RES, `${turnsRec}.${m}.${X}.json.gz`);
          if (fs.existsSync(T)) { const tt = JSON.parse(zlib.gunzipSync(fs.readFileSync(T))).turns; all.ends.push(...tt.ends); all.pauses.push(...tt.pauses); }
        }
        for (const Y of [...Object.keys(M.chans).sort().filter((a) => a !== X), ...(arm === "sim" ? [null] : [])]) {
          let stt;
          if (arm === "real") stt = { replay: R.sttLog };
          else {
            const { rng, SttSim, STT, calibrate } = await import(ROOT + "evals/duplex/streams.mjs");
            if (!calibrated) { const f = ROOT + "evals/duplex/results/live-calibration-2026-10-04.json"; if (fs.existsSync(f)) calibrate(JSON.parse(fs.readFileSync(f, "utf8"))); calibrated = true; }
            const xw = M.chans[X].words.map(([s, e, w]) => [s, e, dec(w)]);
            const xSeg = spurts(xw, 300);
            const tl = { segs: xSeg.map((s) => ({ start: s.start, end: s.end, contour: "f", text: s.words.map((w) => w[2]).join(" "), src: "child" })), words: [], end: 0, childStart: null };
            xSeg.forEach((s, i) => { for (const [a, b, w] of s.words) tl.words.push({ w, seg: i, start: a, end: b, src: "child" }); });
            tl.end = tl.words.at(-1)?.end ?? 0;
            const seed = crypto.createHash("sha1").update(`${m}${X}${Y}D4`).digest().readUInt32LE(0);
            stt = { sim: new SttSim(tl, rng(seed), STT.D4, { serverVadMs: 1500 }) };
          }
          const cx = M.chans[X];
          const mask = Y === null ? turnsMask(M, X) : null;
          const r = await runSession({ id: `${m}-${X}${Y}`, x: new Float32Array(0), frames: { db: cx.db, f0: cx.f0 }, mask, floorDb: floorOf(cx.db), her: Y ? herLines(M, Y) : [], stt, band: "B4", DuplexLive });
          if (Y === null) { const tt = scoreTurns(M, X, r.acts, r.phases); all.ends.push(...tt.ends); all.pauses.push(...tt.pauses); continue; }
          all.pairs++;
          all.replayProbesIgnored += arm === "real" ? r.acts.filter((a) => a[1] === "probe").length : 0;
          const s = scoreOverlap(M, X, Y, r.acts, r.logs);
          for (const k of ["cont", "barge", "room"]) all[k].push(...s[k]);
          all.echoSpurts += s.echoSpurts; all.echoYields += s.echoYields;
        }
        process.stdout.write(`${m} ${X} done\n`);
      }
    }
    const stops = all.barge.map((b) => Math.min(b.hush ?? Infinity, b.yield ?? Infinity)).filter(Number.isFinite);
    const yl = all.barge.map((b) => b.yield).filter((x) => x !== null);
    const gaps = all.ends.map((e) => e.gap).filter((x) => x !== null);
    const out = {
      id: `duplex-real-${name}`, date: new Date().toISOString().slice(0, 10), arm, rec, meetings, configHash: cfgHash, pairs: all.pairs,
      label: arm === "real"
        ? "REAL RECORDED ADULT SPEECH (AMI, CC BY 4.0, English incl. Indian-L1 adults) + REAL STT (production gpt-live-transcribe socket, real time, US sandbox → eastus2). Overlap rows: recorded real-STT events replayed per her = Y (her = another participant, open loop). Turn rows: live in the loop, probes honoured. Not children, not Hindi."
        : "REAL RECORDED ADULT SPEECH (AMI) + SIMULATED STT (SttSim D4, calibrated), on the identical replay harness: the reference arm for what the real STT changes.",
      continuer_keepTalking: rate(all.cont.filter((c) => c.ok).length, all.cont.length),
      continuer_failures: all.cont.filter((c) => !c.ok).slice(0, 80),
      continuer_failure_reasons: Object.entries(all.cont.filter((c) => !c.ok).reduce((a, c) => { const k = (c.why.split(",")[0] || "none").split("|")[0]; a[k] = (a[k] ?? 0) + 1; return a; }, {})),
      roomTalk_yield_reasons: Object.entries(all.room.filter((r) => r.yielded).reduce((a, r) => { const k = (r.why.split(",")[0] || "none").split("|")[0]; a[k] = (a[k] ?? 0) + 1; return a; }, {})),
      bargeIn_stop: { n: all.barge.length, stopped: stops.length, early: all.barge.filter((b) => b.early).length, p50: q(stops, 0.5), p90: q(stops, 0.9), within200: stops.filter((x) => x <= 200).length },
      bargeIn_yield: { n: all.barge.length, yielded: yl.length, p50: q(yl, 0.5), p90: q(yl, 0.9), within1000: yl.filter((x) => x <= 1000).length },
      roomTalk_falseYield: rate(all.room.filter((r) => r.yielded).length, all.room.length),
      roomTalk_hushed: rate(all.room.filter((r) => r.hushed).length, all.room.length),
      echo_selfYield: rate(all.echoYields, all.echoSpurts),
      turnEnd_decisionGap: { n: all.ends.length, decided: gaps.length, missed8s: all.ends.length - gaps.length, p50: q(gaps, 0.5), p90: q(gaps, 0.9), within350: gaps.filter((x) => x <= 350).length, humanNextSpeakerP50: q(all.ends.map((e) => e.human).filter((x) => x !== null), 0.5) },
      gapByReason: Object.entries(all.ends.filter((e) => e.gap !== null).reduce((a, e) => { (a[e.why] ??= []).push(e.gap); return a; }, {})).map(([why, g]) => ({ why, n: g.length, p50: q(g, 0.5) })).sort((a, b) => b.n - a.n),
      pause_cutoff: { ...rate(all.pauses.filter((p) => p.cut).length, all.pauses.length), silence640: rate(all.pauses.filter((p) => p.ms > 640).length, all.pauses.length), silence900: rate(all.pauses.filter((p) => p.ms > 900).length, all.pauses.length) },
      replayProbesIgnored: all.replayProbesIgnored,
      bargeIn_detail: all.barge,
    };
    fs.writeFileSync(path.join(RES, `${name}.json`), JSON.stringify(out, null, 1));
    const { continuer_failures, bargeIn_detail, ...head } = out;
    console.log(JSON.stringify(head, null, 1));
  }
}
