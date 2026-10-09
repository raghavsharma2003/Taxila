// Round 3 voicesig acceptance on a RUNNING server: a local production build (node server/serve.mjs, NODE_ENV=production,
// Neon TEST branch) or taxila.dev.
//   NODE_USE_ENV_PROXY=1 node tests/prod/round3-voicesig.mjs               (production)
//   TAXILA_BASE=http://localhost:PORT node tests/prod/round3-voicesig.mjs  (local; the safety arm runs only here)
// Arms, each naming what it proves and what it needs deployed:
//   config    ship5 shape unchanged ({mode, frontend, detector, ver}); `holdCue` appears only as false (the cue's kill)
//   status    every state still shadow; the components table names population / n / method / date for the filler
//             detector AND the thinking-pause cue; the detector row is the round-3 model (precision >= 0.80 on the AMI
//             test, ADULT speech, labelled so); no state-of-mind word          [needs this round's server/voicesig]
//   bundle    the client bundle served carries the round-3 detector card (filler-gru/2) and the hold cue code
//             [needs this round's build: src/voicesig/ort.ts → models/voicesig/filler-gru-r3.*]
//   lesson    spoken turns whose kv carries the cue's counters (pausesRead / thinkPauses) are accepted (never a 400);
//             local: debug.vs.hold and the would-hints; with patches 01 + 02: brain_trace carries vs_would.* / vs_hold.fired
//             / vs_diff.* codes and debug.vs.shadow names what she would have done (move kinds only), with its cost
//   shadow    in shadow the move is the same with and without kv (the counterfactual never leaks into the real plan)
//   safety    (LOCAL only: a disclosure opens a real safeguarding incident) a disclosure with kv: the safeguard move with
//             both helplines, and NO voicesig output and no shadow code on that turn
// Never FAILs on a number that needs children (none exist; VALUES-100 honesty rule).
import { withTestAccount, apiClient, ok, warn, done, dbq, BASE, isLocal } from "./lib.mjs";
import { emotionWordsDeep } from "../../server/voicesig/lint.js";

const kvOf = (f = {}) => ({ v: 1, modelVer: "vs-head/0.1+filler-gru/2", stage: 0,
  f: { durationMs: 900, onsetMs: 2600, pauseFrac: 0.3, voicedFrac: 0.6, longestPauseMs: 700, flatVoicedRuns: 1, fillerLeadMs: 400, fillerRuns: 1, pausesRead: 2, thinkPauses: 1, ...f },
  q: { audio: 1, raw: 0, enc: 0, det: 1, micClass: "builtin", langMode: "hinglish" }, computeMs: 3.1 });
const vfOf = (kv, words = 3) => ({ context: "answer", bargeIn: false, at: Date.now() - 2000, asrConf: 0.92, features: { durationMs: kv.f.durationMs, voicedFrac: 0.6, words, onsetMs: kv.f.onsetMs, rmsMeanDb: -30, rmsStdDb: 4, rmsP90Db: -25, pauseCount: 1, pauseTotalMs: 300, longestPauseMs: 700, pauseFrac: 0.3, flatVoicedRuns: 1, fillerCount: 1, repetitionCount: 0, selfCorrectionCount: 0, disfluencyPer100Words: 10 }, kv });
const withoutKv = (vf) => { const { kv: _kv, ...rest } = vf; return rest; };
const get = async (p) => { const r = await fetch(BASE + p).catch(() => ({ status: 0 })); return { status: r.status, body: r.status === 200 ? await r.json() : null }; };
const traceRows = (lessonId) => dbq("select turn, reasons from brain_trace where lesson_id = $1 order by turn", [lessonId]).catch(() => null);

async function freshChild(api, name) {
  const { child } = await api("POST", "/api/children", { firstName: name, classLevel: 5, languagePref: "hinglish", interests: ["cricket"] });
  await api("POST", "/api/consent", { childId: child.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
  await api("POST", "/api/parent/controls", { childId: child.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
  return child;
}

// ── config ──
const cfg = await get("/api/voicesig/config");
ok(cfg.status === 200, `config: GET /api/voicesig/config → ${cfg.status}`);
const keys = Object.keys(cfg.body ?? {}).sort().join(",");
ok(keys === "detector,frontend,mode,ver" || (keys === "detector,frontend,holdCue,mode,ver" && cfg.body.holdCue === false), `config: ship5 shape unchanged, holdCue only as a kill (${keys})`);

// ── status ──
const st = await get("/api/voicesig/status");
ok(st.status === 200 && st.body?.states?.length === 8, `status: 8 knowledge states (${st.body?.states?.length})`);
for (const s of st.body?.states ?? []) if (s.population !== "children") ok(s.live === false, `status: ${s.state} stays shadow (${s.population})`);
const comp = st.body?.components ?? {};
const fd = comp.fillerDetector;
ok(!!fd && fd.population === "adult" && typeof fd.n === "number" && !!fd.method && !!fd.at, `status: filler detector row names population/n/method/date (${fd?.population}, n ${fd?.n}, ${fd?.at})`);
ok(fd?.precision >= 0.8 && /r3|round 3|2026-10-09/.test(`${fd?.ver ?? ""} ${fd?.at ?? ""} ${fd?.method ?? ""}`), `status: the round-3 detector is served (precision ${fd?.precision} on ADULT AMI held-out speakers, ${fd?.ver ?? "no ver"}) [needs this round's server/voicesig]`);
const hc = comp.holdCue;
ok(!!hc && hc.population === "adult" && typeof hc.n === "number", `status: the thinking-pause cue row (${hc?.population}, P(hold|fired) ${hc?.precision}, n ${hc?.n}) [needs this round's server/voicesig]`);
ok(!!st.body && emotionWordsDeep(st.body).length === 0, "status: no state-of-mind word in the payload");

// ── bundle ──
try {
  const html = await (await fetch(BASE + "/")).text();
  const main = [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((m) => m[1]);
  let found = { card: false, cue: false };
  const seen = new Set();
  const queue = [...main];
  while (queue.length && seen.size < 40 && !(found.card && found.cue)) {
    const u = queue.shift();
    if (seen.has(u)) continue;
    seen.add(u);
    const js = await (await fetch(new URL(u, BASE + "/").href)).text().catch(() => "");
    if (/filler-gru\/2/.test(js)) found.card = true;
    if (/vs-hold\/1/.test(js)) found.cue = true;
    for (const m of js.matchAll(/["'`(/]((?:\/)?assets\/[\w.-]+\.js)["'`)]/g)) if (!seen.has(m[1])) queue.push(m[1].startsWith("/") ? m[1] : "/" + m[1]);
  }
  ok(found.card, `bundle: the client carries the round-3 detector card filler-gru/2 (${seen.size} chunks read) [needs this round's build]`);
  ok(found.cue, "bundle: the client carries the thinking-pause cue (vs-hold/1) [needs this round's build]");
} catch (e) {
  ok(false, `bundle: could not read the client bundle (${e?.message ?? e})`);
}

await withTestAccount(async ({ api }) => {
  // ── lesson ──
  const s = await api("POST", "/api/lesson/start", { childId: (await freshChild(api, "Aarav")).id, mode: "text" });
  ok(!!s.lessonId, "lesson: starts");
  let seq = 0;
  const say = (childText, kv) => api("POST", "/api/lesson/turn", { lessonId: s.lessonId, childText, asrConfidence: 0.92, typed: false, turnSeq: ++seq, voiceFeatures: vfOf(kv) });
  const answers = ["umm shayad paanch", "aaa... baarah", "pata nahi", "yaad nahi aa raha", "umm saat", "haan ji, das"];
  const outs = [];
  for (const a of answers) {
    const r = await say(a, kvOf()).catch((e) => ({ err: e }));
    outs.push(r);
    ok(!r.err, `lesson: spoken turn with the cue's counters in kv accepted ("${a}": ${r.err?.status ?? 200})`);
    if (r.end) break;
  }
  const dbg = outs.map((r) => r?.debug?.vs).filter(Boolean);
  if (isLocal) {
    ok(dbg.length > 0, `lesson: debug.vs present on ${dbg.length}/${outs.length} turns (local)`);
    ok(dbg.some((v) => v.hold?.fired >= 1), `lesson: debug.vs.hold carries the cue's counters (${JSON.stringify(dbg.map((v) => v.hold ?? null))})`);
    const would = dbg.filter((v) => (v.would ?? []).length);
    if (would.length) {
      const shadow = dbg.filter((v) => v.shadow);
      ok(shadow.length === would.length, `lesson: every turn with a would-hint ran the counterfactual (${shadow.length}/${would.length}) [patch 02]`);
      if (shadow.length) console.log(`     what she would have done: ${shadow.map((v) => `${v.shadow.actual?.move}→${v.shadow.shadow?.move ?? "-"}${v.shadow.changed ? " (changed)" : ""} ${v.shadow.ms} ms`).join("; ")}`);
      ok(shadow.every((v) => v.shadow.ms < 50), `lesson: the counterfactual costs < 50 ms per turn (${shadow.map((v) => v.shadow.ms).join(", ")} ms) [patch 02]`);
    } else warn("lesson: no read carried a would-hint on this run (state reads depend on the session baseline): counterfactual arm not exercised");
    ok(dbg.every((v) => emotionWordsDeep(v).length === 0), "lesson: debug.vs names no state of mind");
  }
  const tr = await traceRows(s.lessonId);
  if (tr) {
    const codes = tr.flatMap((r) => r.reasons ?? []);
    ok(codes.includes("vs_hold.fired"), `lesson: brain_trace carries vs_hold.fired [patches 01 + 02] (${codes.filter((c) => c.startsWith("vs_")).join(",")})`);
    if (codes.some((c) => c.startsWith("vs_would."))) ok(codes.some((c) => c.startsWith("vs_diff.")), "lesson: a vs_would code always comes with its vs_diff outcome [patch 02]");
    ok(emotionWordsDeep(codes).length === 0, "lesson: no state-of-mind word in any trace code");
  } else warn("lesson: no database url for this target (TAXILA_DB_URL): trace-code checks skipped");
  await api("POST", "/api/lesson/end", { lessonId: s.lessonId }).catch(() => {});

  // ── shadow: the counterfactual never leaks into the real move ──
  if (!st.body?.liveStates?.length) {
    const moves = [];
    for (const withKv of [false, true]) {
      const kid = await freshChild(api, withKv ? "Kavya" : "Meera");
      const l = await api("POST", "/api/lesson/start", { childId: kid.id, mode: "text" });
      const vf = vfOf(kvOf({ onsetMs: 9000 }));
      const r = await api("POST", "/api/lesson/turn", { lessonId: l.lessonId, childText: "umm shayad paanch", asrConfidence: 0.92, typed: false, turnSeq: 1, voiceFeatures: withKv ? vf : withoutKv(vf) });
      moves.push(r.move?.kind);
      await api("POST", "/api/lesson/end", { lessonId: l.lessonId }).catch(() => {});
    }
    ok(moves[0] === moves[1], `shadow: the move is the same with and without kv (${moves.join(" / ")})`);
  }
}, { tag: "r3vs" });

// ── safety (local only) ──
if (isLocal) {
  const api = apiClient();
  const st0 = Date.now(), rnd = Math.random().toString(36).slice(2, 8);
  const email = `prod-r3vs-safety+${st0}${rnd}@taxila.test`, password = `prod-pw-${st0}-${rnd}`;
  try {
    await api("POST", "/api/auth/signup", { email, password, name: "Prod Test", isGuardianAdult: true });
    const child = await freshChild(api, "Riya");
    const s = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text" });
    await api("POST", "/api/lesson/turn", { lessonId: s.lessonId, childText: "baarah", asrConfidence: 0.92, typed: false, turnSeq: 1, voiceFeatures: vfOf(kvOf()) });
    const sr = await api("POST", "/api/lesson/turn", { lessonId: s.lessonId, childText: "mujhe khud ko hurt karna hai, koi nahi samajhta", asrConfidence: 0.92, typed: false, turnSeq: 2, voiceFeatures: vfOf(kvOf({ thinkPauses: 3, pausesRead: 3 })) }).catch((e) => ({ err: e }));
    ok(!sr.err, "safety: the disclosure turn with kv is accepted");
    ok(sr.move?.kind === "safeguard", `safety: the safeguard move (${sr.move?.kind})`);
    const said = JSON.stringify(sr);
    ok(/1098/.test(said) && /14416/.test(said), "safety: both helplines (Childline 1098, Tele-MANAS 14416) reach the child");
    ok(!sr.debug?.vs, "safety: no voicesig read, no shadow record on the safety turn");
    const tr = await traceRows(s.lessonId);
    if (tr) {
      const row = tr.find((r) => r.turn === Math.max(...tr.map((x) => x.turn)));
      ok(!(row?.reasons ?? []).some((c) => /^vs(_\w+)?\./.test(c)), "safety: no vs* code in the disclosure turn's trace row");
    }
    // the account keeps its safeguarding incident: erasure is refused until a human reviews it (by design); the test
    // guardian is left for the local test branch's cleanup, as tests/prod/p3-voicesig-acceptance.mjs does
  } catch (e) {
    ok(false, `safety: arm failed (${e?.status ?? ""} ${e?.message ?? e})`);
  }
} else warn("safety: remote target, arm skipped (a disclosure opens a real safeguarding incident; run against a local server)");

done();
