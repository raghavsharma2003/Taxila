// p1-duplex on REAL RECORDED ADULT SPEECH (AMI Meeting Corpus, CC BY 4.0; 4 meetings whose participants include Indian-L1
// English speakers). LABEL: adults in a meeting room, English (Indian, European, native), NOT children, NOT Hindi.
//
// What is real: every mic frame (the child-role speaker's own headset channel: their voice, the room, and the other
// speakers' real acoustic bleed), every pause, overlap, continuer and interruption, and every word time (manual
// annotation). What is simulated: the transcription stream (evals/duplex/streams.mjs SttSim, the D4 lane = production
// gpt-live-transcribe timing calibrated from M-D2, run over the child-role speaker's annotated words), and "her" is
// another participant replayed open loop (her real voice keeps going after a yield; only the decision is scored).
//
// Driven through the LIVE bridge (src/duplex/live.ts DuplexLive: the class the lesson runs), with the same frame / STT /
// her-playback inputs the cascade link gives it. For each ordered pair (child = X, her = Y) of a meeting:
//   continuer   X burst inside a Y spurt, every token a listening token, ≤ 1.2 s, Y talks on ≥ 1 s after → expect KEEP TALKING
//   barge-in    X burst inside a Y spurt with ≥ 2 non-listening words, and Y really stopped within 2 s of X's onset while X
//               went on ≥ 1 s (the human floor transfer) → expect YIELD; scored: hush and yield latency from X's onset
//   room talk   a third participant Z talks ≥ 0.8 s inside a Y spurt while X is silent ± 0.5 s (their real bleed into X's mic)
//               → expect no yield (the TV / sibling analogue: another voice in the room)
//   turn end    X spurt (Y silent throughout) whose end was followed by another speaker within 2 s and X silent ≥ 1.5 s
//               → decision gap = the engine's commit − X's last word end (missed if none within 3 s)
//   pause       a ≥ 500 ms gap inside an X spurt (X goes on, nobody else talks) → a commit inside it is a cut-off;
//               silence-640 / silence-900 baselines on the SAME pauses for reference
//
//   node evals/p1-duplex/ami.mjs <frames_dir> [--name r1] [--lane D4] [--meetings IS1008b,ES2004b]
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { rng, SttSim, STT, calibrate } from "../duplex/streams.mjs";
import { ROOT } from "../duplex/lib.mjs";
import { DuplexLive } from "../../src/duplex/live.ts";
import { OVERLAP } from "../../src/duplex/config.ts";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const LISTEN = new Set(["yeah", "yes", "yep", "yup", "mm-hmm", "mm", "hmm", "mhm", "uh-huh", "okay", "ok", "right", "sure", "alright", "oh", "uh", "huh", "ah", "mmm", "hm"]);
const dec = (w) => w.replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');

/** Merge an agent's words into spurts (gaps < maxGap). */
function spurts(words, maxGap) {
  const out = [];
  for (const [s, e, w] of words) {
    const last = out.at(-1);
    if (last && s - last.end < maxGap) { last.end = Math.max(last.end, e); last.words.push([s, e, w]); } else out.push({ start: s, end: e, words: [[s, e, w]] });
  }
  return out;
}
const anyTalk = (words, a, b) => words.some(([s, e]) => s < b && e > a);

function q(arr, p) { if (!arr.length) return null; const z = [...arr].sort((x, y) => x - y); return Math.round(z[Math.min(z.length - 1, Math.floor((z.length - 1) * p))]); }
function wilson(k, n) { if (!n) return [0, 0]; const z = 1.96, p = k / n, d = 1 + (z * z) / n, c = p + (z * z) / (2 * n), m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n)); return [+((c - m) / d).toFixed(3), +((c + m) / d).toFixed(3)]; }

/** Run one (child X, her Y) pair over a meeting. */
/**
 * mode "overlap": her = Y; the third and fourth speakers are masked to the room floor wherever X is silent (a lesson has
 *                 two parties); scores continuers, barge-ins and echo.
 * mode "room":    her = Y; nothing masked; scores only the room-talk false yields (the other adults are the TV / sibling).
 * mode "turns":   no her lines; every other speaker masked where X is silent; scores turn-end decision gaps and pauses.
 */
function runPair(M, X, Y, lane, seed, mode = "overlap") {
  const cx = M.chans[X], cy = Y ? M.chans[Y] : null;
  const others = Object.keys(M.chans).filter((a) => a !== X && a !== Y);
  // the room floor of X's channel (10th percentile) and the frames to mask
  const floorDb = [...cx.db].sort((a, b) => a - b)[Math.floor(cx.db.length * 0.1)];
  const maskOf = mode === "room" ? null : (() => {
    const m = new Uint8Array(cx.db.length);
    const xOn = new Uint8Array(cx.db.length);
    for (const [s0, e0] of cx.words) for (let k = Math.max(0, Math.floor((s0 - 150) / 20)); k <= Math.min(cx.db.length - 1, Math.ceil((e0 + 150) / 20)); k++) xOn[k] = 1;
    for (const z of mode === "turns" ? Object.keys(M.chans).filter((a) => a !== X) : others) {
      for (const [s0, e0] of M.chans[z].words) for (let k = Math.max(0, Math.floor((s0 - 100) / 20)); k <= Math.min(cx.db.length - 1, Math.ceil((e0 + 150) / 20)); k++) if (!xOn[k]) m[k] = 1;
    }
    return m;
  })();
  const xw = cx.words.map(([s, e, w]) => [s, e, dec(w)]);
  const yw = cy ? cy.words.map(([s, e, w]) => [s, e, dec(w)]) : [];
  const ySp = cy ? spurts(yw, 700).filter((s) => s.end - s.start >= 600) : [];
  // the STT timeline: X's own annotated words (segments = X bursts)
  const xSeg = spurts(xw, 300);
  const tl = { segs: xSeg.map((s) => ({ start: s.start, end: s.end, contour: "f", text: s.words.map((w) => w[2]).join(" "), src: "child" })), words: [], end: 0, childStart: null };
  xSeg.forEach((s, i) => { for (const [a, b, w] of s.words) tl.words.push({ w, seg: i, start: a, end: b, src: "child" }); });
  tl.end = tl.words.at(-1)?.end ?? 0;
  const r = rng(seed);
  const stt = new SttSim(tl, r, STT[lane], { serverVadMs: 1500 });

  // the live bridge, on a virtual clock
  let now = 0;
  let interval = null;
  const acts = []; // [t, kind, extra]
  let herLive = null; // the Y spurt currently "playing" as her line, and whether she has been stopped
  const port = {
    duck: (lv) => acts.push([now, "duck", lv]),
    pause: () => { acts.push([now, "pause"]); if (herLive) herLive.stoppedAt = now + 50; return !!herLive; },
    resume: () => { acts.push([now, "resume"]); if (herLive) herLive.stoppedAt = null; },
    stop: () => { acts.push([now, "stop"]); if (herLive) herLive.stoppedAt = now + 50; },
    commit: (turn) => acts.push([now, "commit", turn.text]),
    sttCommit: () => { acts.push([now, "probe"]); stt.commit(now); },
    dropReply: () => acts.push([now, "drop"]),
    fallback: (why) => acts.push([now, "fallback", why]),
    state: (st) => { if (phases.at(-1)?.[1] !== st.phase) phases.push([now, st.phase]); },
  };
  const phases = [];
  const logs = [];
  const phaseAt = (t) => { let p = "idle"; for (const [tt, ph] of phases) { if (tt > t) break; p = ph; } return p; };
  const live = new DuplexLive({ lessonId: `ami-${M.meeting}-${X}${Y}`, port, now: () => now, setInterval: (fn) => { interval = fn; return 1; }, clearInterval: () => { interval = null; }, band: "B4", log: (row) => { if (process.env.AMI_DEBUG || row.action === "YIELD" || row.action === "HUSH") logs.push([row.t, row.action, row.reasons.join("+"), row.phase]); } });
  live.start();
  const item = new Map(); // sim item id → { text sent }
  const toRaw = (ev) => {
    if (ev.type === "partial") {
      const prev = item.get(ev.itemId) ?? "";
      if (!prev) live.stt({ type: "input_audio_buffer.speech_started", item_id: ev.itemId, audio_start_ms: ev.audioStartMs ?? ev.t });
      const delta = ev.text.startsWith(prev) ? ev.text.slice(prev.length) : (prev ? " " : "") + ev.text;
      item.set(ev.itemId, ev.text);
      if (delta) live.stt({ type: "conversation.item.input_audio_transcription.delta", item_id: ev.itemId, delta });
    } else if (ev.type === "speech_stopped") {
      live.stt({ type: "input_audio_buffer.speech_stopped", item_id: ev.itemId, audio_end_ms: ev.t });
    } else if (ev.type === "final") {
      if (!item.has(ev.itemId)) live.stt({ type: "input_audio_buffer.speech_started", item_id: ev.itemId, audio_start_ms: ev.audioStartMs ?? ev.t });
      live.stt({ type: "conversation.item.input_audio_transcription.completed", item_id: ev.itemId, transcript: ev.text });
      item.delete(ev.itemId);
    }
  };
  let yi = 0;
  const n = cx.db.length;
  for (let i = 0; i < n; i++) {
    now = i * 20;
    // her line: Y's spurts
    if (herLive && now >= herLive.end) {
      if (herLive.stoppedAt === null) live.herEnd(); else live.herStopped();
      herLive = null;
    }
    if (!herLive && yi < ySp.length && now >= ySp[yi].start) {
      const s = ySp[yi++];
      herLive = { ...s, stoppedAt: null };
      live.setUi({});
      live.herStart(s.words.map((w) => w[2]).join(" "));
    }
    for (const ev of stt.tick(now)) toRaw(ev);
    const herSounding = herLive && herLive.stoppedAt === null && now >= herLive.start && now < herLive.end;
    const herOut = herSounding && cy.db[i] > -60 ? cy.db[i] : null;
    const masked = maskOf?.[i] === 1;
    live.frame(now, Math.pow(10, (masked ? floorDb : cx.db[i]) / 20), masked ? null : cx.f0[i], herOut);
    if (i % 5 === 4 && interval) interval();
  }
  live.stop();

  // ── score ──
  const firstAct = (kinds, a, b) => acts.find(([t, k, x]) => t >= a && t <= b && kinds.includes(k) && (k !== "duck" || x <= OVERLAP.hushLevel + 1e-9));
  const yieldsIn = (a, b) => acts.filter(([t, k]) => t >= a && t <= b && (k === "pause" || k === "stop"));
  const res = { cont: [], barge: [], room: [], ends: [], pauses: [], echoSpurts: 0, echoYields: 0 };
  const xb = spurts(xw, 300);
  for (const y of mode === "turns" ? [] : ySp) {
    for (const b of mode === "room" ? [] : xb) {
      if (b.start < y.start + 300 || b.start > y.end - 200) continue;
      const toks = b.words.map((w) => w[2].toLowerCase());
      const listening = toks.every((w) => LISTEN.has(w));
      if (listening && b.end - b.start <= 1200 && y.end - b.end >= 1000) {
        const ys = yieldsIn(b.start - 20, b.end + 1000);
        res.cont.push({ ok: ys.length === 0, hushed: !!firstAct(["duck"], b.start - 20, b.end + 300), words: toks.join(" "), ms: b.end - b.start,
          why: logs.filter(([t, a]) => a === "YIELD" && t >= b.start - 20 && t <= b.end + 1000).map((x) => x[2]).join(",") });
      } else if (!listening && toks.filter((w) => !LISTEN.has(w)).length >= 2 && y.end - b.start <= 2000 && y.end > b.start) {
        // X went on >= 1 s past Y's real stop (the human floor transfer)
        const xEnd = spurts(xw.filter(([s]) => s >= b.start), 500)[0]?.end ?? b.end;
        if (xEnd - y.end < 1000) continue;
        // from 1 s before the annotated first word: an in-breath, a false start or a lip onset is the barge-in's acoustic
        // start (a stop before the first word is counted and reported as "early", latency 0)
        const h = firstAct(["duck"], b.start - 1000, b.start + 2000);
        const yl = yieldsIn(b.start - 1000, b.start + 2500)[0];
        res.barge.push({ hush: h ? Math.max(0, h[0] + 20 - b.start) : null, yield: yl ? Math.max(0, yl[0] + 50 - b.start) : null, early: !!((h && h[0] < b.start - 20) || (yl && yl[0] < b.start - 20)), words: toks.slice(0, 6).join(" "),
          ...(process.env.AMI_DEBUG ? { y: [y.start - b.start, y.end - b.start], ph: phases.filter(([t]) => t >= b.start - 3000 && t <= b.start + 1500).map(([t, p2]) => `${t - b.start}:${p2}`), trail: logs.filter(([t]) => t >= b.start - 100 && t <= b.start + 1500).map((x) => `${x[0] - b.start}:${x[1]}:${x[3]}:${x[2]}`) } : {}) });
      }
    }
    // room talk: another participant inside her spurt while X is silent ± 0.5 s
    for (const z of mode === "room" ? others : []) {
      for (const s of spurts(M.chans[z].words, 300)) {
        if (s.end - s.start < 800 || s.start < y.start + 300 || s.end > y.end) continue;
        if (anyTalk(xw, s.start - 500, s.end + 500)) continue;
        res.room.push({ yielded: yieldsIn(s.start - 20, s.end + 500).length > 0, hushed: !!firstAct(["duck"], s.start - 20, s.end) });
      }
    }
    // her own bleed into X's mic while nobody else talks: a self-yield is an echo trigger
    if (mode === "overlap" && !anyTalk(xw, y.start - 500, y.end + 500) && !others.some((z) => anyTalk(M.chans[z].words, y.start, y.end))) {
      res.echoSpurts++;
      if (yieldsIn(y.start, y.end).length) res.echoYields++;
    }
  }
  // turn ends and pauses: X spurts with Y (her) silent throughout
  const allOther = Object.keys(M.chans).filter((a) => a !== X).flatMap((a) => M.chans[a].words);
  for (const s of mode === "turns" ? spurts(xw, 1500) : []) {
    // pauses inside it
    for (let k = 1; k < s.words.length; k++) {
      const a = s.words[k - 1][1], b = s.words[k][0];
      if (b - a < 500 || anyTalk(allOther, a, b)) continue;
      res.pauses.push({ ms: b - a, cut: acts.some(([t, kk]) => kk === "commit" && t > a + 20 && t < b) });
    }
    const nextOther = allOther.filter(([st]) => st >= s.end - 100).sort((p, q2) => p[0] - q2[0])[0];
    const nextX = xw.find(([st]) => st > s.end);
    if (nextX && nextX[0] - s.end < 1500) continue;
    const c = acts.find(([t, k]) => k === "commit" && t >= s.end - 200 && t <= s.end + 8000);
    const early = acts.filter(([t, k]) => k === "commit" && t >= s.start && t < s.end - 200).length;
    res.ends.push({ gap: c ? c[0] - s.end : null, human: nextOther && nextOther[0] - s.end <= 2000 ? nextOther[0] - s.end : null, words: s.words.length, phase: phaseAt(s.end + 1500), phaseAtStart: phaseAt(s.start + 100), early });
  }
  res.stats = { commits: live.stats.commits, yields: live.stats.yields, hushes: live.stats.hushes, frames: live.stats.frames, errors: live.stats.errors, fallback: live.fallenBack };
  return res;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = argv[0];
  const lane = opt("--lane", "D4");
  const name = opt("--name", "run");
  const meetings = (opt("--meetings", null)?.split(",")) ?? fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort();
  const f = path.join(ROOT, "evals/duplex/results/live-calibration-2026-10-04.json");
  if (lane === "D4" && fs.existsSync(f)) calibrate(JSON.parse(fs.readFileSync(f, "utf8")));
  const t0 = Date.now();
  const all = { cont: [], barge: [], room: [], ends: [], pauses: [], echoSpurts: 0, echoYields: 0, runs: [] };
  for (const m of meetings) {
    const M = JSON.parse(fs.readFileSync(path.join(dir, `${m}.json`), "utf8"));
    const agents = Object.keys(M.chans).sort();
    for (const X of agents) for (const Y of [...agents, null]) {
      if (X === Y) continue;
      if (opt("--pairs", null) && !opt("--pairs").split(",").includes(`${X}${Y ?? "-"}`)) continue;
      const seed = crypto.createHash("sha1").update(`${m}${X}${Y}${lane}`).digest().readUInt32LE(0);
      const modes = Y === null ? ["turns"] : (opt("--modes", "overlap,room")).split(",");
      for (const mode of modes) {
      const r = runPair(M, X, Y, lane, seed, mode);
      for (const k of ["cont", "barge", "room", "ends", "pauses"]) all[k].push(...r[k]);
      all.echoSpurts += r.echoSpurts; all.echoYields += r.echoYields;
      all.runs.push({ meeting: m, mode, child: X, childL1: M.chans[X].l1, her: Y, ...r.stats });
      process.stdout.write(`${m} ${mode} ${X}<-${Y} cont ${r.cont.length} barge ${r.barge.length} room ${r.room.length} ends ${r.ends.length} pauses ${r.pauses.length}\n`);
      }
    }
  }
  const stops = all.barge.map((b) => Math.min(b.hush ?? Infinity, b.yield ?? Infinity)).filter(Number.isFinite);
  const yl = all.barge.map((b) => b.yield).filter((x) => x !== null);
  const gaps = all.ends.map((e) => e.gap).filter((x) => x !== null);
  const k = (arr, fn) => { const kk = arr.filter(fn).length; return { k: kk, n: arr.length, rate: arr.length ? +(kk / arr.length).toFixed(3) : null, ci95: wilson(kk, arr.length) }; };
  const out = {
    id: `p1-ami-${name}`, date: new Date().toISOString().slice(0, 10), lane, meetings,
    label: "REAL RECORDED ADULT SPEECH (AMI Meeting Corpus, CC BY 4.0, English incl. Indian-L1 adults; real mic frames, real pauses / overlaps / continuers / interruptions, manual word times). SIMULATED: the STT stream (SttSim, D4 = production gpt-live-transcribe timing) and her playback (another participant replayed open loop). Not children, not Hindi.",
    seconds: Math.round((Date.now() - t0) / 1000), pairs: all.runs.length,
    continuer_keepTalking: k(all.cont, (c) => c.ok),
    continuer_failures: all.cont.filter((c) => !c.ok).slice(0, 40),
    bargeIn_detail: process.env.AMI_DEBUG ? all.barge : undefined,
    continuer_hushed: k(all.cont, (c) => c.hushed),
    bargeIn_stop: { n: all.barge.length, stopped: stops.length, early: all.barge.filter((b) => b.early).length, p50: q(stops, 0.5), p90: q(stops, 0.9), within200: stops.filter((x) => x <= 200).length },
    bargeIn_yield: { n: all.barge.length, yielded: yl.length, p50: q(yl, 0.5), p90: q(yl, 0.9), within1000: yl.filter((x) => x <= 1000).length },
    roomTalk_falseYield: k(all.room, (r) => r.yielded),
    roomTalk_hushed: k(all.room, (r) => r.hushed),
    echo_selfYield: { k: all.echoYields, n: all.echoSpurts, rate: all.echoSpurts ? +(all.echoYields / all.echoSpurts).toFixed(3) : null },
    turnEnd_missedByPhase: Object.entries(all.ends.filter((e) => e.gap === null).reduce((a, e) => ((a[`${e.phaseAtStart}->${e.phase}${e.early ? "+early" : ""}`] = (a[`${e.phaseAtStart}->${e.phase}${e.early ? "+early" : ""}`] ?? 0) + 1), a), {})).sort((x, y) => y[1] - x[1]).slice(0, 12),
    turnEnd_decisionGap: { n: all.ends.length, decided: gaps.length, p50: q(gaps, 0.5), p90: q(gaps, 0.9), missed8s: all.ends.length - gaps.length, humanNextSpeakerP50: q(all.ends.map((e) => e.human).filter((x) => x !== null), 0.5), within350: gaps.filter((x) => x <= 350).length },
    pause_cutoff: { ...k(all.pauses, (p) => p.cut), silence640: k(all.pauses, (p) => p.ms > 640), silence900: k(all.pauses, (p) => p.ms > 900) },
    runs: all.runs,
  };
  fs.mkdirSync(path.join(HERE, "results"), { recursive: true });
  const file = path.join(HERE, "results", `ami-${name}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 1));
  const { runs, ...head } = out;
  console.log(JSON.stringify(head, null, 1));
}
