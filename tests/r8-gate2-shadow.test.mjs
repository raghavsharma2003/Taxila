// Gate 2, dc-r8-gate2-shadow S1 (RULINGS-2026-11-16-gate2-second-reading.md): "In these three modes the rules as built decide,
// on every level, whether they would name a mix-up, and write that to the trail and the trace as `wouldName` (the mix-up, the
// sightings it rests on, the level ids). Nothing of it reaches the teacher's facts row, the seam, or the learner model: those
// keep H5's row (`game verdict first_try checks`) and an ordinary miss at 0.5."
//
// Through the real routes (POST /api/play/act then /api/play/next, the session token signed for a lesson, and once from the
// home), sessions of NAMING_LEVELS levels played by the battery's holders of each mode's mix-ups:
//   - every level end of a shadow mode carries `wouldName` (null or the naming) in the response's trail and in the trace's
//     play.outcome row (its trail and its own key); a holder's session names in shadow in every mode;
//   - the seam row is exactly H5's four pairs; the seam, the evidence rows, the signed evidence and seam tokens and the KT
//     events the lesson folds (playKtEvents), and the home fold's written events, carry no misconceptionId, chanceMis or
//     wouldName, and every miss weighs GAME_WEIGHT; the signed trail is the raw replay with no mal-rule (as NAMING_OFF);
//   - no level served changes: the same session with the shadow switch off serves the same levels and the same rows;
//   - a mode outside NAMING_SHADOW has no wouldName.
// Pure, no DB (the route's child check, queries and the trace insert are swapped inside each test and put back).
import { test } from "node:test";
import assert from "node:assert/strict";
import { NAMING_SHADOW, NAMING_OFF, namingShadow, GAME_WEIGHT } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";
import { env } from "../src/play/core/pick.ts";
import { mulberry32, hash32 } from "../src/play/core/rng.ts";
import { coverage, entryKey, seedOf, NAMING_LEVELS } from "../server/play/levels.js";
import { gradeActs } from "../server/play/grade.js";
import { routes, playDeps } from "../server/play/routes.js";
import { signSession, verifySession } from "../server/play/session.js";
import { verifyEvidence, verifySeam, playKtEvents } from "../server/play/evidence.js";
import { _setTraceDeps, _resetTrace } from "../server/trace/writer.js";
import { childrenFor, repairOf } from "./_habit-children.mjs";

const LES = "44444444-4444-4444-8444-444444444444";
const ROW = ["game", "verdict", "first_try", "checks"];
const keysOf = (row) => row.split(" ").filter(Boolean).map((p) => p.split("=")[0]);
const fakeRes = () => { const r = { statusCode: 0, headers: {}, body: null, setHeader(k, v) { r.headers[k] = v; }, end(x) { r.body = x ? JSON.parse(x) : null; } }; return r; };
const MODE_GOALS = { "stambh/tally": ["read", "keep"], "kon/place": ["measure", "draw"], "kon/name": ["say", "find"] };
const DOORS = [["garam", "garam", "garam"], ["teekha", "garam", "teekha"]];
const NAMES = /"(misconceptionId|chanceMis|chanceAct|wouldName)"/;

/** the route's deps and the trace swapped for one test; → { trace: buffered rows, homeWrites, restore } */
function harness() {
  const saved = { ...playDeps };
  const homeWrites = [];
  playDeps.requireChild = async (_req, id) => ({ guardian: { id: "g" }, child: { id, class_level: 6, first_name: "Riya", language_pref: "hinglish" } });
  playDeps.q = async () => [];
  playDeps.writeHome = async (_child, events) => { homeWrites.push(...events); return { written: true, n: events.length }; };
  const st = _setTraceDeps({ off: false, insert: async () => {} });
  return { trace: st.buf, homeWrites, restore() { Object.assign(playDeps, saved); _resetTrace(); _setTraceDeps({ off: null, insert: null }); } };
}
const post = async (route, body) => { const r = fakeRes(); await routes[route]({}, r, body); assert.equal(r.statusCode, 200, `${route} ${JSON.stringify(r.body).slice(0, 120)}`); return r.body; };

/**
 * One served session through the routes for a habit child: her acts on each level of her mode (then, after a miss, what she
 * does again and the solve), the solve elsewhere; one final post per level, then /next. → [{ level, body, raw, trace }]
 */
async function playSession(h, { entry, child, fade, doors, k, lesson = true, forget = false }) {
  const childId = `sh${k}`;
  let token = signSession({ childId, key: entryKey(entry), skillId: entry.skillId, lessonId: lesson ? LES : null, classLevel: entry.classLevel, fade, lang: "hinglish", childArt: null, lastArt: null,
    mis: {}, n: 0, seed: seedOf(childId, entryKey(entry), 0), door: "garam", recent: [], hist: null });
  const ctx = { rng: mulberry32(hash32(`${child.id}|${fade}|${doors.join("")}|${k}`)), prev: null, i: 0, mem: {} };
  const out = [];
  for (let i = 0; i < NAMING_LEVELS; i++) {
    const { level: lv } = await post("POST /api/play/level", { sessionId: token });
    ctx.i = i;
    const lg = LOGIC[`${lv.family}/${lv.mode}`], mine = lv.family === entry.family && lv.mode === entry.mode;
    const first = (mine ? child.acts[lv.params?.goal]?.(lv, ctx) : null) ?? lg.solve(lv);
    const g0 = gradeActs(lv, env(first), { final: false });
    const again = !g0?.solved && mine ? child.again?.[lv.params?.goal]?.(lv, ctx) ?? [] : [];
    const acts = env(g0?.solved ? first : [...first, ...again, ...repairOf(lv)]);
    const n0 = h.trace.length;
    const body = await post("POST /api/play/act", { sessionId: token, levelId: lv.levelId, acts, final: true });
    out.push({ level: lv, body, raw: gradeActs(lv, acts, { final: true }), trace: h.trace.slice(n0).filter((x) => x.kind === "play.outcome"), session: verifySession(body.sessionId) });
    ctx.prev = { level: lv, first, firstTry: !!g0?.solved };
    token = body.sessionId;
    // `forget`: the session's shadow memory dropped after every level (the control: what the memory steers, if anything)
    if (forget) { const { shadow: _m, ...rest } = verifySession(token); token = signSession(rest); }
    if (i < NAMING_LEVELS - 1) token = (await post("POST /api/play/next", { sessionId: token, door: doors[i] })).sessionId;
  }
  return out;
}

/** every promise S1 makes about one level end of a shadow mode */
function holdsShadow(x, { lesson }) {
  const { level: lv, body: b, raw } = x, where = `${lv.levelId}`;
  // the trail and the trace carry the decision, null or not
  assert.ok(b.trail && "wouldName" in b.trail, `${where}: wouldName in the trail`);
  assert.equal(x.trace.length, 1, `${where}: one play.outcome`);
  const t = x.trace[0].data;
  assert.deepEqual(t.wouldName, b.trail.wouldName, `${where}: the trace's wouldName`);
  assert.deepEqual(t.trail?.wouldName, b.trail.wouldName, `${where}: the trace's trail`);
  const w = b.trail.wouldName;
  if (w) {
    assert.equal(lv.mal?.[w.rule], w.mis, `${where}: the rule is this level's for the mix-up`);
    assert.ok(["repeat", "act"].includes(w.by), where);
    assert.equal(w.sightings, w.levels.length, where);
    assert.equal(w.levels.at(-1), lv.levelId, where);
    assert.ok(w.by === "act" || w.levels.length >= 2, `${where}: a repeat rests on two sightings or more`);
  }
  // the seam: H5's row, nothing of the naming
  assert.equal(b.seam?.kind, "level_end", where);
  assert.deepEqual(Object.keys(b.seam.facts).sort(), ["checks", "first_try", "verdict"], where);
  assert.doesNotMatch(JSON.stringify(b.seam), NAMES, where);
  // the evidence rows: no mix-up, every miss at GAME_WEIGHT
  assert.doesNotMatch(JSON.stringify(b.evidence), NAMES, where);
  for (const r of b.evidence) if (r.outcome !== "correct") assert.equal(r.weight, GAME_WEIGHT, `${where}: a miss at ${r.weight}`);
  if (lesson) {
    const seam = verifySeam(b.seamToken, { childId: x.session.childId, lessonId: LES });
    assert.deepEqual(keysOf(seam.row), ROW, `${where}: ${seam.row}`);
    const ev = verifyEvidence(b.evidenceToken, { childId: x.session.childId, lessonId: LES });
    assert.doesNotMatch(JSON.stringify(ev), NAMES, `${where}: the signed evidence`);
    assert.deepEqual(ev.trail, { ...raw.trail, mal: [] }, `${where}: the signed trail is the raw replay, naming off`);
    // what the learner model folds from it (the lesson turn's playKtEvents)
    const kt = playKtEvents({ tokens: [b.evidenceToken], childId: x.session.childId, lessonId: LES, startedAt: 0, now: 1000, childSeq: 1 });
    assert.ok(kt.events.length, where);
    assert.doesNotMatch(JSON.stringify(kt.events), NAMES, `${where}: the KT events`);
  } else assert.equal(b.evidenceToken, undefined, where);
  return w;
}

test("S1: the shadow switch is on for the three modes, apart from NAMING_OFF (which is as it was)", () => {
  assert.deepEqual([...NAMING_SHADOW].sort(), ["kon/name", "kon/place", "stambh/tally"]);
  assert.deepEqual([...NAMING_OFF].sort(), ["kon/name", "kon/place", "stambh/tally"]);
  for (const k of Object.keys(LOGIC)) { const [f, m] = k.split("/"); assert.equal(namingShadow(f, m), NAMING_SHADOW.has(k), k); }
});

test("S1, through the routes: a holder's session names in shadow (wouldName in trail and trace); the seam, the rows, the tokens, the KT events and the home fold carry nothing of it", async () => {
  const h = harness();
  const tally = {};
  try {
    for (const [modeName, goals] of Object.entries(MODE_GOALS)) {
      const [fam, mode] = modeName.split("/");
      const t = (tally[modeName] = { sessions: 0, levels: 0, wouldName: 0, byRepeat: 0, home: 0 });
      for (const goal of goals) {
        const entry = coverage().entries.find((e) => e.family === fam && e.mode === mode && e.goal === goal);
        const holders = childrenFor(modeName, goal).filter((c) => c.holds);
        assert.ok(holders.length, `${modeName} ${goal}: holders`);
        for (const child of holders) for (const fade of [1, 2, 3]) for (const doors of DOORS) {
          const lesson = t.sessions % 4 !== 3;   // one session in four from the home
          const levels = await playSession(h, { entry, child, fade, doors, k: t.sessions, lesson });
          t.sessions++;
          if (!lesson) t.home++;
          for (const x of levels) {
            if (x.level.family !== fam || x.level.mode !== mode) continue;
            t.levels++;
            const w = holdsShadow(x, { lesson });
            if (w) { t.wouldName++; if (w.by === "repeat") t.byRepeat++; }
          }
        }
      }
      assert.ok(t.wouldName > 0, `${modeName}: a holder is named in shadow (${JSON.stringify(t)})`);
    }
    // the home fold: what it wrote to her learner record names nothing
    assert.ok(h.homeWrites.length > 0, "the home sessions folded");
    assert.doesNotMatch(JSON.stringify(h.homeWrites), NAMES, "the home fold's events");
  } finally { h.restore(); }
  console.log(`# S1 shadow: ${JSON.stringify(tally)}`);
});

test("S1: nothing she sees changes; the same session with its shadow memory dropped after every level serves the same levels, rows, seams and lines", async () => {
  const h = harness();
  try {
    for (const modeName of Object.keys(MODE_GOALS)) {
      const [fam, mode] = modeName.split("/"), goal = MODE_GOALS[modeName][0];
      const entry = coverage().entries.find((e) => e.family === fam && e.mode === mode && e.goal === goal);
      const child = childrenFor(modeName, goal).find((c) => c.holds);
      const on = await playSession(h, { entry, child, fade: 2, doors: DOORS[0], k: 900 });
      const off = await playSession(h, { entry, child, fade: 2, doors: DOORS[0], k: 900, forget: true });
      assert.ok(on.some((x) => x.session.shadow?.length), `${modeName}: the memory kept a sighting`);
      assert.deepEqual(off.map((x) => x.level.levelId), on.map((x) => x.level.levelId), `${modeName}: the same levels`);
      on.forEach((x, i) => {
        const y = off[i];
        assert.deepEqual(x.body.evidence, y.body.evidence, `${modeName} level ${i + 1}: the same rows`);
        assert.deepEqual(x.body.seam, y.body.seam, `${modeName} level ${i + 1}: the same seam`);
        assert.deepEqual(x.body.moments, y.body.moments, `${modeName} level ${i + 1}: the same moments`);
        assert.deepEqual(x.body.reaction, y.body.reaction, `${modeName} level ${i + 1}: the same line`);
        assert.deepEqual(x.body.doors.map((d) => d.level.levelId), y.body.doors.map((d) => d.level.levelId), `${modeName} level ${i + 1}: the same doors`);
        const strip = (t) => { const { wouldName: _w, ...rest } = t; return rest; };
        assert.deepEqual(strip(x.body.trail), strip(y.body.trail), `${modeName} level ${i + 1}: the same trail`);
      });
    }
  } finally { h.restore(); }
});

test("S1: a mode outside the shadow switch writes no wouldName", async () => {
  const h = harness();
  try {
    let n = 0;
    for (const e of coverage().entries.filter((x) => !namingShadow(x.family, x.mode) && LOGIC[`${x.family}/${x.mode}`]?.malRules?.length).slice(0, 12)) {
      const lg = LOGIC[`${e.family}/${e.mode}`];
      const token = signSession({ childId: "so", key: entryKey(e), skillId: e.skillId, lessonId: LES, classLevel: e.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
        mis: {}, n: 0, seed: seedOf("so", entryKey(e), 0), door: "garam", recent: [], hist: null });
      const { level: lv } = await post("POST /api/play/level", { sessionId: token });
      const a = lg.malActs(lv, lg.malRules[0]) ?? lg.solve(lv) ?? [];
      if (!a.length) continue;
      const n0 = h.trace.length;
      const b = await post("POST /api/play/act", { sessionId: token, levelId: lv.levelId, acts: env([...a, ...(lg.solve(lv) ?? [])]), final: true });
      assert.equal(b.trail?.wouldName, undefined, lv.levelId);
      assert.ok(!h.trace.slice(n0).some((x) => "wouldName" in (x.data ?? {})), lv.levelId);
      assert.equal(verifySession(b.sessionId).shadow, undefined, lv.levelId);
      n++;
    }
    assert.ok(n >= 5, `${n} levels`);
  } finally { h.restore(); }
});
