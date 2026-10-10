// duplex r4: a CLOSED-LOOP AMI overlap rig. The round-3 rig (evals/duplex-r3/ami-overlap.mjs) is open-loop: her line
// (another participant Y's real speech) plays to its end whatever the engine does, so a continuer that lands after the
// engine yielded or committed is scored "over her" although, on a device, her audio had stopped. Here her floor reacts:
//   - stop / dropReply ends her line at once; pause silences it; resume continues it;
//   - a due line starts only when the engine would let her speak (not while the child holds the floor or a reply is
//     committed); otherwise it is skipped;
//   - a commit is answered by her next scheduled line at its RECORDED time (default, "aligned": the recording's bleed stays
//     true), or, with --shift-replies, after --reply-ms (default 700) by the next unplayed line of Y moved to now (a stress
//     variant: it re-times most of the conversation against a child recording that cannot react);
//   - the child's recorded mic carries Y's real bleed at its ORIGINAL time. While she is not sounding that original
//     audio, frames where only Y spoke are replaced by the mic's noise floor (no f0), and STT items that began in such
//     frames are dropped, so her absence is not heard as a phantom voice. A shifted reply has no bleed (a perfect AEC).
// The child's side cannot react (it is a recording): X's words and timing are fixed. What this rig CAN show is which
// failures disappear once her audio really stops, and what her floor does on the events that remain truly over her.
// `--open` replays exactly like the round-3 rig (no reaction, no mask, no STT filter) to check the harness against it.
// Real recorded adult speech (AMI, CC BY 4.0, evaluation only) + the real STT events recorded in round 2; not children.
//   node evals/duplex-r4/ami-closed.mjs <frames_dir> --name <x> [--open | --shift-replies [--reply-ms 700]] [--meetings ...] [--set OVERLAP.x=v]
//   (internal) --one <meeting> --out <file>
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { spawn } from "node:child_process";
import { loadEnv, ROOT, HOP_MS, rate, q } from "../duplex-real/lib.mjs";
import { scoreTurns } from "../duplex-real/ami-real.mjs";

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const OPEN = argv.includes("--open");
const SHIFT = argv.includes("--shift-replies");
const REPLY_MS = Number(opt("--reply-ms", 700));
const RES = path.join(ROOT, "evals/duplex-real/results");
const LISTEN = new Set(["yeah", "yes", "yep", "yup", "mm-hmm", "mm", "hmm", "mhm", "uh-huh", "okay", "ok", "right", "sure", "alright", "oh", "uh", "huh", "ah", "mmm", "hm"]);
const dec = (w) => w.replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
const floorOf = (db) => [...db].sort((a, b) => a - b)[Math.floor(db.length * 0.1)];
function spurts(words, maxGap) { const out = []; for (const [s, e, w] of words) { const l = out.at(-1); if (l && s - l.end < maxGap) { l.end = Math.max(l.end, e); l.words.push([s, e, w]); } else out.push({ start: s, end: e, words: [[s, e, w]] }); } return out; }
const anyTalk = (words, a, b) => words.some(([s, e]) => s < b && e > a);
const herLines = (M, Y) => spurts(M.chans[Y].words.map(([s, e, w]) => [s, e, dec(w)]), 700).filter((s) => s.end - s.start >= 600).map((s) => ({ start: s.start, end: s.end, text: s.words.map((w) => w[2]).join(" ") }));
const TRAIN = new Set(["ES2004b", "IS1008b"]);
const HER_FLOOR = new Set(["idle", "her_turn", "overlap"]);
// aligned replies: a line due while a reply is committed is that reply
const MAY_SPEAK = new Set([...HER_FLOOR, "committed"]);

/** One (child X, her Y) session with her floor reacting. Returns acts, phases, logs and her sounding segments. */
async function runClosed({ M, X, Y, R, DuplexLive }) {
  const cx = M.chans[X], cy = M.chans[Y];
  const nFrames = cx.db.length;
  const floorDb = floorOf(cx.db);
  const xw = cx.words, yw = cy.words;
  const acts = [], phases = [], logs = [];
  let clock = 0, interval = null;
  let stopFlag = false, pauseFlag = false, resumeFlag = false, commitAt = null;
  const port = {
    duck: (lv) => acts.push([clock, "duck", lv]),
    pause: () => { acts.push([clock, "pause"]); pauseFlag = true; return true; },
    resume: () => { acts.push([clock, "resume"]); resumeFlag = true; },
    stop: () => { acts.push([clock, "stop"]); stopFlag = true; },
    commit: (turn) => { acts.push([clock, "commit", turn.text, turn.duplex?.engineSummary?.reasons?.[0] ?? null]); commitAt = clock; },
    sttCommit: () => acts.push([clock, "probe"]),
    dropReply: () => { acts.push([clock, "drop"]); stopFlag = true; commitAt = null; },
    fallback: (why) => acts.push([clock, "fallback", why]),
    state: (st) => { if (phases.at(-1)?.[1] !== st.phase) phases.push([clock, st.phase]); },
  };
  const live = new DuplexLive({ lessonId: `closed-${M.meeting}-${X}${Y}`, port, now: () => clock, setInterval: (fn) => { interval = fn; return 1; }, clearInterval: () => { interval = null; }, band: "B4",
    log: (row) => { if (row.action === "YIELD" || row.action === "HUSH" || row.action === "SPEAK") logs.push([row.t, row.action, (row.reasons ?? []).join("+"), row.phase, row.detail]); } });
  live.start();
  const phase = () => phases.at(-1)?.[1] ?? "idle";
  const plan = herLines(M, Y);
  let pi = 0, cur = null;
  const segs = [], skipped = [];
  const masked = new Uint8Array(nFrames);
  const dropItems = new Set();
  let ri = 0;
  const replay = R.sttLog;
  const end = (t) => { live.herEnd(); cur.end = t; if (!cur.paused) cur.on.push([cur.onAt, t]); segs.push(cur); cur = null; };
  for (let i = 0; i < nFrames; i++) {
    const tf = i * HOP_MS;
    clock = tf;
    if (!OPEN) {
      // her floor reacts to what the engine did on the last frame
      if (stopFlag && cur) end(tf);
      if (pauseFlag && cur && !cur.paused) { cur.paused = true; cur.on.push([cur.onAt, tf]); }
      if (resumeFlag && cur && cur.paused) { cur.paused = false; cur.onAt = tf; }
      stopFlag = pauseFlag = resumeFlag = false;
    }
    if (cur && tf >= cur.plannedEnd) end(tf);
    if (!OPEN && SHIFT && commitAt !== null && tf >= commitAt + REPLY_MS) {
      // her reply: only if the commit still stands; the next unplayed line of Y, moved to now
      if (phase() === "committed") {
        if (cur) end(tf);
        if (pi < plan.length) {
          const p = plan[pi++];
          live.setUi({}); live.herStart(p.text);
          cur = { start: tf, plannedEnd: tf + (p.end - p.start), shift: tf - p.start, src: p, kind: "reply", paused: false, onAt: tf, on: [] };
        }
      }
      commitAt = null;
    }
    while (pi < plan.length && tf >= plan[pi].start) {
      const p = plan[pi++];
      if (OPEN) { if (cur) end(tf); live.setUi({}); live.herStart(p.text); cur = { start: tf, plannedEnd: p.end, shift: 0, src: p, kind: "line", paused: false, onAt: tf, on: [] }; continue; }
      // a due line starts only when she holds or may take the floor; a late start keeps the recorded audio aligned
      if (cur || !(SHIFT ? HER_FLOOR : MAY_SPEAK).has(phase()) || (SHIFT && commitAt !== null) || tf > p.end - 300) { skipped.push(p); continue; }
      live.setUi({}); live.herStart(p.text);
      cur = { start: tf, plannedEnd: p.end, shift: 0, src: p, kind: "line", paused: false, onAt: tf, on: [] };
    }
    const sounding = cur && !cur.paused;
    const herOut = sounding ? (cy.db[i - Math.round(cur.shift / HOP_MS)] ?? null) : null;
    // the recorded mic carries Y's bleed at its original time; silence it unless she is sounding that original audio
    if (!OPEN) {
      const yTalk = anyTalk(yw, tf - 100, tf + 100), xTalk = anyTalk(xw, tf - 100, tf + 100);
      if (yTalk && !xTalk && !(sounding && cur.shift === 0)) masked[i] = 1;
    }
    while (ri < replay.length && replay[ri].t <= tf) {
      const raw = replay[ri++].raw;
      if (!OPEN) {
        if (raw.type === "input_audio_buffer.speech_started" && masked[Math.floor((raw.audio_start_ms ?? 0) / HOP_MS)] === 1) { dropItems.add(raw.item_id); continue; }
        if (raw.item_id && dropItems.has(raw.item_id)) continue;
      }
      if (raw.type === "error") { if ((raw.error?.code ?? raw.error) === "input_audio_buffer_commit_empty") live.commitEmpty?.(); continue; }
      live.stt(raw);
    }
    const db = masked[i] ? floorDb : cx.db[i];
    live.frame(tf, Math.pow(10, db / 20), masked[i] ? null : cx.f0[i], herOut !== null && herOut > -60 ? herOut : null);
    if (i % 5 === 4 && interval) interval();
  }
  if (cur) end(nFrames * HOP_MS);
  live.stop();
  return { acts, phases, logs, segs, skipped: skipped.length, masked: masked.reduce((a, b) => a + b, 0) };
}

/** Continuers, barge-ins, room talk and her bleed over the segments she ACTUALLY sounded (same rules as scoreOverlap). */
function scoreClosed(M, X, Y, run) {
  const { acts, logs, segs } = run;
  const xw = M.chans[X].words.map(([s, e, w]) => [s, e, dec(w)]);
  const others = Object.keys(M.chans).filter((a) => a !== X && a !== Y);
  const otherWords = others.flatMap((z) => M.chans[z].words);
  const duckOf = (a, b) => acts.find(([t, k, x]) => t >= a && t <= b && k === "duck" && x <= 0.06);
  const yieldsIn = (a, b) => acts.filter(([t, k]) => t >= a && t <= b && (k === "pause" || k === "stop"));
  const soundingAt = (seg, t) => seg.on.some(([a, b]) => t >= a && t < b);
  const res = { cont: [], barge: [], room: [], echoSpurts: 0, echoYields: 0 };
  const xb = spurts(xw, 300);
  for (const y of segs) {
    for (const b of xb) {
      if (b.start < y.start + 300 || b.start > y.plannedEnd - 200 || !soundingAt(y, b.start)) continue;
      if (anyTalk(otherWords, b.start - 1000, b.end + 1000)) continue;
      const toks = b.words.map((w) => w[2].toLowerCase());
      const listening = toks.every((w) => LISTEN.has(w));
      if (listening && b.end - b.start <= 1200 && y.plannedEnd - b.end >= 1000) {
        res.cont.push({ ok: yieldsIn(b.start - 20, b.end + 1000).length === 0, shifted: y.shift !== 0, words: toks.join(" "), at: b.start,
          why: logs.filter(([t, a]) => a === "YIELD" && t >= b.start - 20 && t <= b.end + 1000).map((x) => `${x[4]?.reason ?? ""}|${x[2]}`).join(",") });
      } else if (!listening && toks.filter((w) => !LISTEN.has(w)).length >= 2) {
        const xEnd = spurts(xw.filter(([s]) => s >= b.start), 500)[0]?.end ?? b.end;
        // round-3 rule on her original timing (Y gave way within 2 s and X kept on >= 1 s past it); a shifted reply has no
        // such timing, so there the child must keep talking >= 1.5 s
        const isBarge = y.shift === 0 ? (y.plannedEnd - b.start <= 2000 && y.plannedEnd > b.start && xEnd - y.plannedEnd >= 1000) : xEnd - b.start >= 1500;
        if (!isBarge) continue;
        const h = duckOf(b.start - 1000, b.start + 2000);
        const yl = yieldsIn(b.start - 1000, b.start + 2500)[0];
        res.barge.push({ hush: h ? Math.max(0, h[0] + 20 - b.start) : null, yield: yl ? Math.max(0, yl[0] + 50 - b.start) : null, shifted: y.shift !== 0, words: toks.slice(0, 6).join(" ") });
      }
    }
    for (const z of others) {
      for (const s of spurts(M.chans[z].words, 300)) {
        if (s.end - s.start < 800 || s.start < y.start + 300 || s.end > y.plannedEnd || !soundingAt(y, s.start)) continue;
        if (anyTalk(xw, s.start - 500, s.end + 500)) continue;
        res.room.push({ yielded: yieldsIn(s.start - 20, s.end + 500).length > 0, shifted: y.shift !== 0 });
      }
    }
    // her own bleed exists only while she sounds her ORIGINAL audio (a shifted reply has no recorded bleed)
    if (y.shift === 0 && y.end - y.start >= 600 && !anyTalk(xw, y.start - 500, y.end + 500) && !others.some((z) => anyTalk(M.chans[z].words, y.start, y.end))) {
      res.echoSpurts++;
      if (yieldsIn(y.start, y.end).length) res.echoYields++;
    }
  }
  return res;
}

async function one(framesDir, m, rec, outFile) {
  loadEnv();
  if (opt("--set", null)) { const cfg = await import(ROOT + "src/duplex/config.ts"); for (const kv of opt("--set").split(",")) { const [k, v] = kv.split("="); const [o, key] = k.split("."); cfg[o][key] = v === "true" ? true : v === "false" ? false : Number(v); } }
  const { DuplexLive } = await import(ROOT + "src/duplex/live.ts");
  const M = JSON.parse(fs.readFileSync(path.join(framesDir, `${m}.json`), "utf8"));
  M.meeting = m;
  const agg = { cont: [], barge: [], room: [], echoSpurts: 0, echoYields: 0, pauses: [], ends: [], segs: 0, shiftedSegs: 0, skipped: 0, maskedFrames: 0 };
  for (const X of Object.keys(M.chans).sort()) {
    const R = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(RES, `${rec}.${m}.${X}.json.gz`))));
    for (const Y of Object.keys(M.chans).sort().filter((a) => a !== X)) {
      const run = await runClosed({ M, X, Y, R, DuplexLive });
      const s = scoreClosed(M, X, Y, run);
      const t = scoreTurns(M, X, run.acts, run.phases);
      for (const k of ["cont", "barge", "room", "pauses", "ends"]) agg[k].push(...(s[k] ?? t[k]).map((e) => ({ ...e, pair: `${X}${Y}` })));
      agg.echoSpurts += s.echoSpurts; agg.echoYields += s.echoYields;
      agg.segs += run.segs.length; agg.shiftedSegs += run.segs.filter((g) => g.shift !== 0).length; agg.skipped += run.skipped; agg.maskedFrames += run.masked;
    }
  }
  fs.writeFileSync(outFile, JSON.stringify(agg));
}

function summarise(rows) {
  const cat = (k) => rows.flatMap((r) => r[k]);
  const cont = cat("cont"), barge = cat("barge"), room = cat("room"), pauses = cat("pauses"), ends = cat("ends");
  const eS = rows.reduce((a, r) => a + r.echoSpurts, 0), eY = rows.reduce((a, r) => a + r.echoYields, 0);
  const stopped = barge.filter((b) => b.yield !== null || b.hush !== null);
  const fast = barge.filter((b) => (b.hush !== null && b.hush <= 200) || (b.yield !== null && b.yield <= 200));
  const gaps = ends.map((e) => e.gap).filter((g) => g !== null);
  return {
    R1_amiPauseCutoffs: rate(pauses.filter((p) => p.cut).length, pauses.length),
    R2_amiEndGapP50: q(gaps, 0.5), R2b_amiUndecided: rate(ends.filter((e) => e.gap === null).length, ends.length),
    R3: rate(cont.filter((c) => c.ok).length, cont.length), R3_unshifted: rate(cont.filter((c) => c.ok && !c.shifted).length, cont.filter((c) => !c.shifted).length),
    R4: rate(fast.length, barge.length), R4_stoppedAtAll: stopped.length,
    R5: rate(room.filter((r) => r.yielded).length, room.length),
    R6: rate(eY, eS),
    segs: rows.reduce((a, r) => a + r.segs, 0), shiftedSegs: rows.reduce((a, r) => a + r.shiftedSegs, 0), skippedLines: rows.reduce((a, r) => a + r.skipped, 0),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const framesDir = argv[0];
  const rec = opt("--rec", "ami-raw-D4");
  if (opt("--one")) { await one(framesDir, opt("--one"), rec, opt("--out")); process.exit(0); }
  const name = opt("--name", OPEN ? "closed-open" : "closed");
  const meetings = opt("--meetings", "ES2004b,ES2005b,IS1004b,IS1008b").split(",");
  const tmp = opt("--tmp", path.join(ROOT, "evals/duplex-r4/results", `.tmp-${name}`));
  fs.mkdirSync(tmp, { recursive: true });
  const t0 = Date.now();
  await Promise.all(meetings.map((m) => new Promise((res, rej) => {
    const p = spawn(process.execPath, [new URL(import.meta.url).pathname, framesDir, "--one", m, "--rec", rec, "--out", path.join(tmp, `${m}.json`), "--reply-ms", String(REPLY_MS), ...(OPEN ? ["--open"] : []), ...(SHIFT ? ["--shift-replies"] : []), ...(opt("--set", null) ? ["--set", opt("--set")] : [])], { stdio: ["ignore", "ignore", "inherit"] });
    p.on("exit", (c) => (c === 0 ? res() : rej(new Error(`${m} exited ${c}`))));
  })));
  const rows = Object.fromEntries(meetings.map((m) => [m, JSON.parse(fs.readFileSync(path.join(tmp, `${m}.json`), "utf8"))]));
  const pick = (f) => meetings.filter(f).map((m) => rows[m]);
  const out = { id: `duplex-r4-${name}`, date: new Date().toISOString().slice(0, 10), mode: OPEN ? "open" : SHIFT ? "closed-shifted" : "closed-aligned", replyMs: SHIFT ? REPLY_MS : null, rec, meetings, set: opt("--set", null), seconds: Math.round((Date.now() - t0) / 1000),
    TRAIN: summarise(pick((m) => TRAIN.has(m))), TEST: summarise(pick((m) => !TRAIN.has(m))), ALL: summarise(meetings.map((m) => rows[m])),
    failedContinuers: meetings.flatMap((m) => rows[m].cont.filter((c) => !c.ok).map((c) => ({ m, ...c }))) };
  fs.writeFileSync(path.join(ROOT, "evals/duplex-r4/results", `${name}.json`), JSON.stringify(out, null, 1));
  console.log(JSON.stringify({ mode: out.mode, TRAIN: out.TRAIN, TEST: out.TEST, ALL: out.ALL }, null, 1));
}
