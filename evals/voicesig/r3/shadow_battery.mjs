// Round 3 voicesig: "what she would have done" on a LOCAL production build (patches 01 + 02 applied), driven by SCRIPTED
// child turns (not children): a battery of spoken answers whose kv timing varies (fast / slow onsets, leading fillers,
// long pauses) so the session baseline matures and the shadow states fire. Reads debug.vs on every turn (local only) and
// reports: how many turns read a state, how many would have handed a tie-breaker, how often the counterfactual plan
// changed her move (and to what), and the counterfactual's cost. Labelled SCRIPTED turns: says nothing about children.
//   TAXILA_BASE=http://localhost:PORT node --env-file=.env.local evals/voicesig/r3/shadow_battery.mjs [--children 3] [--turns 14]
import fs from "node:fs";
import path from "node:path";
import { withTestAccount, BASE, isLocal } from "../../../tests/prod/lib.mjs";
import { cleanCodes } from "../../../server/voicesig/lint.js";

if (!isLocal) throw new Error("local only: debug.vs is served to localhost requests only");
const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const nKids = Number(opt("--children", 3)), nTurns = Number(opt("--turns", 14));
const ANSWERS = ["paanch", "umm shayad baarah", "das", "aaa... saat", "pata nahi", "yaad nahi aa raha", "chaar", "umm... teen", "haan ji, aath", "nau", "shayad do", "matlab woh chhe hai", "gyaarah", "ek"];
let seed = 7;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const kvOf = (slow) => ({ v: 1, modelVer: "vs-head/0.1+filler-gru/2", stage: 0,
  f: { durationMs: 700 + Math.round(rnd() * 900), onsetMs: slow ? 2500 + Math.round(rnd() * 2500) : 500 + Math.round(rnd() * 600), pauseFrac: slow ? 0.35 : 0.05, voicedFrac: 0.6,
    longestPauseMs: slow ? 800 : 120, flatVoicedRuns: slow ? 1 : 0, fillerLeadMs: slow ? 350 : 0, fillerRuns: slow ? 1 : 0, pausesRead: slow ? 2 : 1, thinkPauses: slow ? 1 : 0 },
  q: { audio: 1, raw: 0, enc: 0, det: 1, micClass: "builtin", langMode: "hinglish" }, computeMs: 3 });
const vfOf = (kv) => ({ context: "answer", bargeIn: false, at: Date.now() - 2000, asrConf: 0.92, features: { durationMs: kv.f.durationMs, voicedFrac: 0.6, words: 2, onsetMs: kv.f.onsetMs, rmsMeanDb: -30, rmsStdDb: 4, rmsP90Db: -25, pauseCount: 1, pauseTotalMs: 300, longestPauseMs: kv.f.longestPauseMs, pauseFrac: kv.f.pauseFrac, flatVoicedRuns: kv.f.flatVoicedRuns, fillerCount: kv.f.fillerRuns, repetitionCount: 0, selfCorrectionCount: 0, disfluencyPer100Words: 0 }, kv });

const rows = [];
await withTestAccount(async ({ api }) => {
  for (let k = 0; k < nKids; k++) {
    const { child } = await api("POST", "/api/children", { firstName: ["Aarav", "Diya", "Kabir", "Isha", "Vihaan"][k % 5], classLevel: 5 + (k % 3), languagePref: "hinglish", interests: ["cricket"] });
    await api("POST", "/api/consent", { childId: child.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
    await api("POST", "/api/parent/controls", { childId: child.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
    const s = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text" });
    let asked = null; // the item the teacher just asked (debug.item, local only): half the answers are RIGHT, with or without hesitation
    for (let i = 0; i < nTurns; i++) {
      const right = asked?.answer != null && rnd() < 0.5;
      const text = right ? (rnd() < 0.5 ? `umm shayad ${asked.answer}` : String(asked.answer)) : ANSWERS[(i + k * 3) % ANSWERS.length];
      const slow = /umm|aaa|shayad|matlab|pata|yaad/.test(text) || rnd() < 0.2;
      const t0 = performance.now();
      const r = await api("POST", "/api/lesson/turn", { lessonId: s.lessonId, childText: text, asrConfidence: 0.92, typed: false, turnSeq: i + 1, voiceFeatures: vfOf(kvOf(slow)) }).catch((e) => ({ err: String(e?.status ?? e) }));
      const vs = r?.debug?.vs ?? null;
      const tm = Object.fromEntries((r?.debug?.timings ?? []).filter((x) => x.kind?.startsWith("@")).map((x) => [x.kind, x.ms]));
      rows.push({ kid: k, turn: i + 1, right, move: r?.move?.kind ?? null, err: r?.err ?? null, state: vs?.state ?? null, live: vs?.live ?? null, would: vs?.would ?? [], hold: vs?.hold ?? null,
        shadow: vs?.shadow ?? null, codes: (vs?.reasons ?? []).filter((c) => /^vs_(would|diff|hold)\./.test(c)), wallMs: Math.round(performance.now() - t0),
        plannedMs: tm["@planned"] ?? null, cfMs: tm["@vs_counterfactual"] != null && tm["@planned"] != null ? tm["@vs_counterfactual"] - tm["@planned"] : null });
      asked = r?.debug?.item ?? null;
      if (r?.end) break;
    }
    await api("POST", "/api/lesson/end", { lessonId: s.lessonId }).catch(() => {});
  }
}, { tag: "r3vs-battery" });

const withWould = rows.filter((r) => r.would.length);
const ran = withWould.filter((r) => r.shadow);
const changed = ran.filter((r) => r.shadow.changed);
const q = (a, p) => { if (!a.length) return null; const z = [...a].sort((x, y) => x - y); return z[Math.min(z.length - 1, Math.floor(p * (z.length - 1)))]; };
const res = {
  id: "voicesig-r3-shadow-battery", date: new Date().toISOString().slice(0, 10), base: BASE,
  label: "SCRIPTED child turns (not children) on a LOCAL production build (HEAD + this stream + patches 01-04, NODE_ENV=production, Neon TEST branch). Shadow: nothing acts.",
  turns: rows.length, errors: rows.filter((r) => r.err).length, stateRead: rows.filter((r) => r.state).length,
  states: rows.reduce((a, r) => (r.state ? { ...a, [r.state]: (a[r.state] ?? 0) + 1 } : a), {}),
  liveReads: rows.filter((r) => r.live).length,
  wouldHint: withWould.length, counterfactualRan: ran.length, changed: changed.length,
  changes: changed.map((r) => `${r.shadow.actual?.move}${r.shadow.actual?.probe ? "+" + r.shadow.actual.probe : ""} -> ${r.shadow.shadow?.move}${r.shadow.shadow?.probe ? "+" + r.shadow.shadow.probe : ""} (${r.would.join(",")})`),
  holdFiredTurns: rows.filter((r) => r.codes.includes("vs_hold.fired")).length,
  counterfactualMs: { n: ran.length, p50: q(ran.map((r) => r.shadow.ms), 0.5), p95: q(ran.map((r) => r.shadow.ms), 0.95), max: ran.length ? Math.max(...ran.map((r) => r.shadow.ms)) : null },
  // restriction 12: every voicesig code the turns carried passes the runtime guard (dropped = a state-of-mind word)
  r12Dropped: cleanCodes(rows.flatMap((r) => r.codes)).dropped.length,
};
fs.mkdirSync(path.join(path.dirname(new URL(import.meta.url).pathname), "../results/2026-10-09"), { recursive: true });
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "../results/2026-10-09/shadow-battery-local.json"), JSON.stringify({ ...res, rows }, null, 1));
console.log(JSON.stringify(res, null, 1));
