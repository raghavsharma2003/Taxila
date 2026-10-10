// Round 4 · stream 2 (content), brief item 7 (VALUES V3.3 at scale): SIMULATED lessons, model-free, in process.
//
// Each lesson runs the REAL Director (server/director/state.js step: its moves, its module mounts through modules.js and
// the tray gate), the REAL Studio seam (prefetch, statusFacts, composeAsk, slotFor, onReveal, requestIntent with the
// board ladder: board-first, code boards, the claims board, the template; the tray gate on every reveal), on a device of a
// random contract class and band. What is NOT real, said plainly: the child is scripted (answers right / wrong by the
// verified key at a set rate, ~1 in 6 turns a visual ask: picture / diagram / game / animation / simulation), the
// classifier is replaced by that script, her line is the move's own content (the reply model is not called: the board is
// gated against that line), the kernel accepts every Studio proposal the Director's tray allows, and the line planner (a
// model) is absent, so boards come from code. No DB, no network. Numbers from this file are SIMULATION, never a child.
//
// Measures, per the bars:
//   right-artifact-ready  at a moment that needs a visual (a visual ask; an explanation beat), something certified is on
//                         the stage on that turn: for an interactive ask something to DO (a play piece, an engine, a
//                         skeleton activity), for a picture ask or an explanation beat a board or piece — ≥ 90 %
//   stale or wrong        a reveal / mount for a skill outside the lesson's topic, a piece revealed after it was retired, a
//                         slot shown that the tray gate refuses at the device's class — 0
//   visible failures      a board slot that ends failed after her line pointed at the screen; a module config the frame
//                         refuses (engineConfigError); an uncertified mount — 0
//   frequency             visuals on stage per 3 minutes of teaching (a turn = 25 s) — ≥ 1
//
//   node tests/prod/r4-content-sim.mjs [--lessons 200] [--turns 24] [--seed 7] [--out DIR]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const LESSONS = Number(arg("lessons", "200")) || 200;
const TURNS = Number(arg("turns", "24")) || 24;
let seed = Number(arg("seed", "7")) || 7;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
process.env.TAXILA_BOARD_SYNC_MS ||= "300";
process.env.FORGE3_PLAY ||= "1";

const { normalizeKit } = await import("../../server/content/kits.js");
const { initLessonState, step } = await import("../../server/director/state.js");
const seamMod = await import("../../server/studio/seam.js");
const { studioSeam, _reset, _setDeps, _lesson } = seamMod;
const lib = await import("../../server/studio/library.js");
const { certifyForTray, setViewport, contractBox, _clearViewports } = await import("../../server/forge3/tray-gate.js");
const { engineConfigError } = await import("../../server/director/engine-check.js");
const { EXPLAIN_BEATS, nextBeat } = await import("../../server/brain/beat.js");
const { screenClaims, POINTS_AT_SCREEN } = await import("../../server/studio/qa/semantics.js");

// no DB, no model: the library has nothing, the planners decline, the play learner read is skipped
lib._setQuery(async () => []);
_setDeps({ q: async () => [], planBuild: async () => ({ ok: false }), q8Strings: async () => ({ ok: false }), planWhiteboard: async () => ({ ok: false, script: null, usd: 0, why: "sim: no model" }), gateAvailable: () => false, writeEvidence: async () => {} });

const kits = [];
for (const f of fs.readdirSync(path.join(ROOT, "data", "kits")).filter((n) => /^c[4-7]-[a-z]+\.json$/.test(n)).sort()) {
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "kits", f), "utf8"));
  for (const t of d.topics ?? []) { const k = normalizeKit(t, { topicId: t.topicId, verified: true }); if (k?.items?.length) kits.push({ kit: k, cls: d.class ?? Number(t.topicId[1]) }); }
}
const ASKS = [["picture dikhao", "diagram"], ["show me a diagram", "diagram"], ["game khelna hai", "game"], ["animation dikhao na", "animation"], ["simulation dikhao", "simulation"]];
const INTERACTIVE = new Set(["game", "animation", "simulation"]);
const VPS = ["p360", "p412", "l1366"];
const stats = { lessons: 0, turns: 0, teachMs: 0, needs: 0, ready: 0, interactiveNeeds: 0, interactiveReady: 0, pictureNeeds: 0, pictureReady: 0, explainNeeds: 0, explainReady: 0,
  visuals: 0, stale: [], failures: [], byShown: {} };
const UUIDish = () => "00000000-0000-4000-8000-" + Math.floor(rnd() * 1e12).toString(16).padStart(12, "0");
const settle = () => new Promise((r) => setTimeout(r, 0));

for (let n = 0; n < LESSONS; n++) {
  const { kit, cls: classLevel } = pick(kits);
  const lessonId = UUIDish();
  const young = classLevel <= 4;
  const vp = pick(VPS);
  _reset(); _clearViewports();
  setViewport(lessonId, { box: contractBox(vp, { young }), young });
  const child = { id: `sim-${n}`, first_name: "Riya", class_level: classLevel, language_pref: "hinglish" };
  const ctx = { firstName: "Riya", teacherName: "Asha", protege: { name: "Bittu", what: "a puppy" }, ageBand: young ? "6-9" : "10-15", lang: "hinglish", interests: [], firstMeeting: false,
    hasCallback: false, topicTitle: kit.title ?? kit.topicId, classLevel, sessionId: lessonId };
  studioSeam.prefetch({ lessonId, child, topicId: kit.topicId, kit, band: undefined, mode: "text", purpose: "lesson", skillIds: kit.skills.map((s) => s.id), activeMisconceptionIds: [], reteach: null, bond: null });
  await settle(); await new Promise((r) => setTimeout(r, 5));
  let now = 0;
  let r = step(initLessonState({ topicId: kit.topicId, kit, ctx, seed: n + 1, now }), { event: "start", kit, now });
  let beat = null;
  const skills = new Set(kit.skills.map((s) => s.id));
  stats.lessons++;
  for (let t = 0; t < TURNS && !r.state?.ended && r.move?.kind !== "wrap"; t++) {
    now += 25_000;
    const item = r.state.activeItemId ? kit.items.find((i) => i.id === r.state.activeItemId) : null;
    let text, cls, ask = null;
    if (rnd() < 0.17) {
      ask = pick(ASKS);
      text = ask[0];
      cls = { outcome: "no_evidence", confidence: 1, source: "request", request: { type: "visual", kind: ask[1], whole: true } };
    } else if (item) {
      const right = rnd() < 0.62;
      text = right ? String(item.answer) : "pata nahi";
      cls = { outcome: right ? "correct" : "incorrect", confidence: 0.9, source: "sim", itemId: item.id };
    } else { text = "haan"; cls = { outcome: "no_evidence", confidence: 1, source: "sim" }; }
    r = step(r.state, { event: "turn", kit, cls, text, now });
    stats.turns++;
    stats.teachMs += 25_000;
    beat = nextBeat(beat, r.move, r.state);
    const L = _lesson(lessonId);
    // the turn as turn.js wires it: statusFacts, composeAsk for an interactive ask, the kernel accepts what the tray allows,
    // slotFor, onReveal; then the whiteboard ask on an explanation beat or a picture ask, drawn from her line (the content)
    const view = studioSeam.statusFacts(lessonId, { beat: beat?.type ?? null });
    const visual = r.move?.visual ?? null;
    let play = null;
    if (visual && INTERACTIVE.has(visual)) play = await studioSeam.composeAsk(lessonId, { visual, skillId: r.state.lastMove?.skillId ?? r.move?.skillId ?? null, topicId: kit.topicId, child });
    const mounts = (r.moduleCommands ?? []).filter((c) => c.op === "mount");
    const asking = !!r.move?.itemId && ["practice", "probe", "retrieval"].includes(r.move.kind);
    const turnStudio = view?.propose?.reveal && !(r.ui?.tray && ["module", "tiles", "pad"].includes(r.ui.tray) && !visual) ? { reveal: view.propose.reveal } : view?.propose?.retire ? { retire: view.propose.retire } : null;
    let slot = studioSeam.slotFor(lessonId, turnStudio, { beat: beat?.type ?? null, tray: r.ui?.tray ?? null, asking, visualRequest: !!visual });
    if (turnStudio?.reveal && slot?.intentId === turnStudio.reveal) studioSeam.onReveal({ lessonId, childId: child.id, turn: L?.turn, studio: turnStudio });
    // her line stands in as the move's content (the facts the reply is written from)
    const line = (r.state.lastContent ?? []).filter((x) => typeof x === "string" && !x.startsWith("on screen now")).join(" ").slice(0, 300) || "Dekho screen par.";
    const wantsBoard = !play && !mounts.length && (EXPLAIN_BEATS.has(beat?.type) || (visual && !INTERACTIVE.has(visual)));
    let board = null, boardFailed = false;
    if (wantsBoard && (!slot?.artifact || slot.artifact.kind === "whiteboard")) {
      const wbAsk = { intent: { intentId: `${lessonId}:wb:${t}`, lessonId, kind: "whiteboard", skillId: r.state.lastMove?.skillId ?? kit.skills[0].id, need: "explain", beat: beat?.type ?? "explain" },
        line: { lessonId, text: line }, kit: { topicId: kit.topicId, content: (r.state.lastContent ?? []).slice(0, 8) }, mode: "fresh", ...(visual ? { requested: true } : {}) };
      studioSeam.preselectWhiteboard(wbAsk);
      const ack = studioSeam.requestIntent(wbAsk);
      if (ack) {
        for (let k = 0; k < 40; k++) { const s2 = seamMod.slotSnapshot(lessonId, ack.intentId); if (s2?.artifact || s2?.state === "failed") { board = s2; break; } await new Promise((res) => setTimeout(res, 10)); }
        if (board?.artifact) slot = board;
        else { boardFailed = true; if (POINTS_AT_SCREEN.test(line) && (screenClaims(line).parts.length || screenClaims(line).groups.length)) stats.failures.push({ lesson: n, topic: kit.topicId, turn: t, why: "board slot failed while her line points at the screen" }); }
      }
    }
    // what is on the stage this turn, and the checks
    const shown = slot?.artifact ? slot.artifact.kind : mounts.length ? "module" : null;
    if (shown) { stats.visuals++; stats.byShown[shown] = (stats.byShown[shown] ?? 0) + 1; }
    if (slot?.artifact) {
      const g = certifyForTray(slot.artifact, { vp, young, topicId: kit.topicId, classLevel, verdict: null, factsKind: null });
      if (!g.ok && slot.artifact.kind !== "frame") stats.stale.push({ lesson: n, topic: kit.topicId, turn: t, why: `uncertified ${slot.artifact.kind} on stage: ${g.why}` });
      const p = L?.pieces?.get(slot.intentId);
      if (p?.skillId && !skills.has(p.skillId) && p.source !== "play") stats.stale.push({ lesson: n, topic: kit.topicId, turn: t, why: `piece for skill ${p.skillId} outside the topic` });
      if (p?.retiredWhy && p.state === "retired" && slot.state !== "failed") stats.stale.push({ lesson: n, topic: kit.topicId, turn: t, why: "a retired piece revealed" });
    }
    for (const m of mounts) {
      if (engineConfigError(m.engine, m.params)) stats.failures.push({ lesson: n, topic: kit.topicId, turn: t, why: `mount the frame refuses: ${m.engine}` });
    }
    // the moments that need a visual
    if (visual) {
      stats.needs++;
      const interactive = INTERACTIVE.has(visual);
      const ok = interactive ? (!!play || mounts.length > 0 || ["play", "skeleton", "frame"].includes(slot?.artifact?.kind ?? "") || (visual !== "game" && slot?.artifact?.kind === "whiteboard" && (slot.artifact.script?.ops?.length ?? 0) >= 3))
        : !!shown;
      if (interactive) { stats.interactiveNeeds++; if (ok) stats.interactiveReady++; } else { stats.pictureNeeds++; if (ok) stats.pictureReady++; }
      if (ok) stats.ready++;
    } else if (EXPLAIN_BEATS.has(beat?.type) && beat?.since === r.state.turn) {
      stats.needs++; stats.explainNeeds++;
      if (shown) { stats.ready++; stats.explainReady++; }
    }
  }
}
const pct = (a, b) => (b ? Math.round((1000 * a) / b) / 10 : null);
const perThree = stats.teachMs ? (stats.visuals / (stats.teachMs / 180_000)) : 0;
const summary = { at: new Date().toISOString(), method: "SIMULATION (scripted child, no reply model, no line planner, kernel accepts Studio proposals)", lessons: stats.lessons, turns: stats.turns,
  rightArtifactReady: { pct: pct(stats.ready, stats.needs), n: stats.needs, interactive: `${stats.interactiveReady}/${stats.interactiveNeeds}`, picture: `${stats.pictureReady}/${stats.pictureNeeds}`, explain: `${stats.explainReady}/${stats.explainNeeds}` },
  staleOrWrong: stats.stale.length, visibleFailures: stats.failures.length, visualsPer3Min: Math.round(perThree * 100) / 100, shown: stats.byShown };
console.log(JSON.stringify(summary, null, 1));
for (const x of [...stats.stale.slice(0, 5), ...stats.failures.slice(0, 5)]) console.log(" ", JSON.stringify(x));
const out = arg("out", null);
if (out) { fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, "r4-content-sim.json"), JSON.stringify({ summary, stale: stats.stale, failures: stats.failures }, null, 1)); }
const pass = summary.rightArtifactReady.pct >= 90 && !stats.stale.length && !stats.failures.length && perThree >= 1;
console.log(pass ? "PASS (simulation)" : "FAIL (simulation)");
process.exit(pass ? 0 : 1);
