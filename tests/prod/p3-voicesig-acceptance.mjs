// ship5 p3-voicesig acceptance: voice-signal knowledge states end to end on a RUNNING server.
//   NODE_USE_ENV_PROXY=1 node tests/prod/p3-voicesig-acceptance.mjs      (TAXILA_BASE=http://localhost:PORT for a local server)
// Needs the patches in docs/design/ship5/p3-voicesig/APPLY.md applied and deployed (and 021 migrated for the pace arm).
// Arms, each naming what it proves:
//   config    GET /api/voicesig/config: the pipeline ships ON (mode shadow, frontend + detector on) — 404 = patch 06 missing;
//   status    GET /api/voicesig/status: all 8 states listed with population / precision / recall / n, every state that is not
//             measured on children says "shadow", no state-of-mind word anywhere in the payload (restriction 12);
//   lesson    spoken turns carrying TurnRequest.voiceFeatures.kv are accepted (never a 400), the turn's knowledge state is
//             read (debug.vs on a local server; brain_trace vs.* codes when a database url is given), lesson.state.vsb
//             learns per turn, and in shadow the reply/move is unaffected by kv (same move with and without kv);
//   safety    a disclosure with kv: the safeguard move with both helplines, and NO voicesig output on that turn (no
//             debug.vs, no vs.* code in its trace row, the baseline did not learn from it);
//             (LOCAL targets only unless P3VS_SAFETY=1: the turn opens a real safeguarding incident);
//   pace      the parent's "Remember answering pace" choice: POST /api/consent voice_pace_memory → 200; with it on and
//             VOICESIG_SUBJECT_KEY set on the server, lesson end writes voicesig rows; turning it off deletes them at once.
//             WARN (not FAIL) when the server has no subject key (status.persistence says so) or no database url is given.
// Never FAILs on a number that needs children (VALUES-100 honesty rule): live states are reported, not required.
import { withTestAccount, ok, warn, done, dbq, BASE, isLocal } from "./lib.mjs";
import { emotionWordsDeep } from "../../server/voicesig/lint.js";

const kvOf = (f = {}) => ({ v: 1, modelVer: "vs-head/0.1", stage: 0, f: { durationMs: 900, onsetMs: 1400, pauseFrac: 0.1, voicedFrac: 0.6, longestPauseMs: 120, flatVoicedRuns: 0, ...f }, q: { audio: 1, raw: 0, enc: 0, det: 0, micClass: "builtin", langMode: "hinglish" }, computeMs: 2.1 });
const vfOf = (kv, words = 2) => ({ context: "answer", bargeIn: false, at: Date.now() - 2000, asrConf: 0.92, features: { durationMs: kv.f.durationMs, voicedFrac: 0.6, words, onsetMs: kv.f.onsetMs, rmsMeanDb: -30, rmsStdDb: 4, rmsP90Db: -25, pauseCount: 0, pauseTotalMs: 0, longestPauseMs: 120, pauseFrac: 0.1, flatVoicedRuns: 0, fillerCount: 0, repetitionCount: 0, selfCorrectionCount: 0, disfluencyPer100Words: 0 }, kv });

// ── config + status ──
const get = async (p) => { const r = await fetch(BASE + p).catch(() => ({ status: 0 })); return { status: r.status, body: r.status === 200 ? await r.json() : null }; };
const cfg = await get("/api/voicesig/config");
ok(cfg.status === 200, `config: GET /api/voicesig/config → ${cfg.status} (404 = patch 06 not deployed)`);
ok(cfg.body?.mode === "shadow" || cfg.body?.mode === "on", `config: voice signals ship ON (mode ${cfg.body?.mode}; off = killed)`);
ok(cfg.body?.frontend === true, "config: the shared front-end is on for clients");
const st = await get("/api/voicesig/status");
ok(st.status === 200 && st.body?.states?.length === 8, `status: 8 knowledge states listed (${st.body?.states?.length})`);
for (const s of st.body?.states ?? []) {
  ok(["simulated", "adult", "children", "none"].includes(s.population) && "precision" in s && "recall" in s && "fired" in s, `status: ${s.state} carries population ${s.population}, precision ${s.precision}, recall ${s.recall}, n ${s.fired}`);
  if (s.population !== "children") ok(s.live === false && /^shadow: /.test(s.says), `status: ${s.state} is not measured on children → says "${s.says}"`);
  else ok(s.live === (s.precision >= 0.8 && s.level >= 1 && st.body.mode === "on"), `status: ${s.state} live=${s.live} matches its child-measured precision ${s.precision}`);
}
ok(st.body && emotionWordsDeep(st.body).length === 0, `status: no state-of-mind word in the payload (${emotionWordsDeep(st.body ?? {}).join(", ") || "none"})`);
if (st.body?.liveStates?.length) warn(`status: LIVE states: ${st.body.liveStates.join(", ")}`);
const persistence = st.body?.persistence;

const traceCodes = async (lessonId) => {
  const rows = await dbq("select turn, reasons from brain_trace where lesson_id = $1 order by turn", [lessonId]).catch(() => null);
  return rows;
};
const lessonState = async (lessonId) => (await dbq("select state from lesson where id = $1", [lessonId]).catch(() => null))?.[0]?.state ?? null;

await withTestAccount(async ({ api, child, password }) => {
  // ── lesson ──
  const s = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text" });
  ok(!!s.lessonId, "lesson: starts");
  let seq = 0;
  const say = (childText, kv, extra = {}) => api("POST", "/api/lesson/turn", { lessonId: s.lessonId, childText, asrConfidence: 0.92, typed: false, turnSeq: ++seq, ...(kv ? { voiceFeatures: vfOf(kv) } : {}), ...extra });
  const answers = ["umm shayad paanch", "baarah", "pata nahi", "yaad nahi aa raha", "saat", "haan ji, das"];
  const outs = [];
  for (let i = 0; i < answers.length; i++) {
    const r = await say(answers[i], kvOf({ onsetMs: 900 + i * 150 })).catch((e) => ({ err: e }));
    outs.push(r);
    ok(!r.err, `lesson: spoken turn ${i + 1} with kv accepted (${r.err?.status ?? r.status})`);
    if (r.end) break;
  }
  const dbg = outs.map((r) => r?.debug?.vs).filter(Boolean);
  if (isLocal) ok(dbg.length > 0, `lesson: debug.vs present on ${dbg.length}/${outs.length} turns (local server)`);
  for (const v of dbg) {
    ok(v.live === false || st.body?.liveStates?.includes(v.state), `lesson: a ${v.state ?? "null"} read is ${v.live ? "live (gate open)" : "shadow"}`);
    ok(v.live || Object.keys(v.hints ?? {}).length === 0, "lesson: a shadow read hands the Director no tie-breaker");
    ok(emotionWordsDeep(v).length === 0, "lesson: debug.vs names no state of mind");
  }
  const tr = await traceCodes(s.lessonId);
  if (tr) {
    const vsRows = tr.filter((r) => (r.reasons ?? []).some((c) => c.startsWith("vs.")));
    ok(vsRows.length > 0, `lesson: brain_trace carries vs.* codes on ${vsRows.length}/${tr.length} turns (patches 02 + 03)`);
    ok(tr.every((r) => emotionWordsDeep(r.reasons ?? []).length === 0), "lesson: no state-of-mind word in any trace code");
  } else warn("lesson: no database url (TAXILA_DB_URL / local test branch): trace-code checks skipped");
  const state = await lessonState(s.lessonId);
  if (state) ok((state.vsb?.turns ?? 0) >= 1 && Object.keys(state.vsb?.rows ?? {}).length > 0, `lesson: the session baseline learned (${state.vsb?.turns} turns, ${Object.keys(state.vsb?.rows ?? {}).length} rows)`);

  // shadow does not change the move: the same answer with and without kv, on two fresh lessons, plans the same move
  if (!st.body?.liveStates?.length) {
    const moves = [];
    for (const withKv of [false, true]) {
      const l = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text" });
      const r = await api("POST", "/api/lesson/turn", { lessonId: l.lessonId, childText: "umm shayad paanch", asrConfidence: 0.92, typed: false, turnSeq: 1, voiceFeatures: withKv ? vfOf(kvOf({ onsetMs: 9000 })) : (({ kv, ...rest }) => rest)(vfOf(kvOf({ onsetMs: 9000 }))) });
      moves.push(r.move?.kind);
      await api("POST", "/api/lesson/end", { lessonId: l.lessonId }).catch(() => {});
    }
    ok(moves[0] === moves[1], `lesson: in shadow the move is the same with and without kv (${moves.join(" / ")})`);
  }

  // ── safety (opens a real safeguarding incident: LOCAL targets only, or P3VS_SAFETY=1 when the safeguarding team expects it) ──
  const before = (await lessonState(s.lessonId))?.vsb?.turns ?? null;
  const runSafety = isLocal || process.env.P3VS_SAFETY === "1";
  if (!runSafety) warn("safety: arm skipped on a remote target (P3VS_SAFETY=1 only when the safeguarding team expects an incident)");
  const sr = !runSafety ? null : await say("mujhe khud ko hurt karna hai, koi nahi samajhta", kvOf({ onsetMs: 300 })).catch((e) => ({ err: e }));
  if (sr) {
  ok(!sr.err, "safety: the disclosure turn with kv is accepted");
  ok(sr.move?.kind === "safeguard", `safety: the safeguard move (${sr.move?.kind})`);
  const helplines = JSON.stringify(sr);
  ok(/1098/.test(helplines) && /14416/.test(helplines), "safety: both helplines (Childline 1098, Tele-MANAS 14416) reach the child");
  ok(!sr.debug?.vs, "safety: no voicesig read on the safety turn");
  const tr2 = await traceCodes(s.lessonId);
  if (tr2) {
    const last = tr2.at(-1);
    ok(!(last?.reasons ?? []).some((c) => /^vs(_gate|_act)?\./.test(c)), `safety: the safety turn's trace row has no vs code (${(last?.reasons ?? []).filter((c) => c.startsWith("vs")).join(",") || "none"})`);
    const after = (await lessonState(s.lessonId))?.vsb?.turns ?? null;
    if (before != null) ok(after === before, `safety: the baseline did not learn from the disclosure (${before} → ${after})`);
  }
  }
  await api("POST", "/api/lesson/end", { lessonId: s.lessonId }).catch(() => {});

  // ── pace choice ──
  const c1 = await api("POST", "/api/consent", { childId: child.id, grants: { voice_pace_memory: true }, password }).catch((e) => ({ err: e }));
  ok(!c1.err, `pace: the parent can turn on "Remember answering pace" (${c1.err?.status ?? 200}; 400 = patch 05 missing)`);
  const l2 = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text" });
  for (let i = 0; i < 3; i++) await api("POST", "/api/lesson/turn", { lessonId: l2.lessonId, childText: "das", asrConfidence: 0.92, typed: false, turnSeq: i + 1, voiceFeatures: vfOf(kvOf({ onsetMs: 1000 + i * 100 })) }).catch(() => {});
  await api("POST", "/api/lesson/end", { lessonId: l2.lessonId }).catch(() => {});
  if (persistence !== "per_child_under_pace_consent") warn(`pace: server persistence is "${persistence}" (no VOICESIG_SUBJECT_KEY): rows are session-only, persistence arm skipped`);
  else {
    const n = async () => (await dbq("select count(*)::int as n from voicesig.subject s join voicesig.baseline b using (subject) where s.child_id = $1", [child.id]).catch(() => null))?.[0]?.n ?? null;
    let rows = null;
    for (let k = 0; k < 10 && !rows; k++) { rows = await n(); if (!rows) await new Promise((r) => setTimeout(r, 1000)); }
    if (rows == null) warn("pace: no database url: row checks skipped");
    else {
      ok(rows > 0, `pace: lesson end stored ${rows} answering-pace rows under the parent's choice`);
      await api("POST", "/api/consent", { childId: child.id, grants: { voice_pace_memory: false }, password });
      ok((await n()) === 0, "pace: turning it off deleted them at once");
    }
  }
}, { tag: "p3vs" });
done();
