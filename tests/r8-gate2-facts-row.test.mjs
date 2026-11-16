// Gate 2, H5 (RULINGS-2026-11-16-gate2.md, dc-r8-gate2-habit-children): "Before naming, the teacher's facts row carries right
// or wrong, first try, and the number of checks, and nothing else of her act (not `bundles` with `answer`, not `read=45`, not
// `shown: other_scale`). The raw act stays in the trail. A miss in the mix-up's form weighs the same as any other miss."
//
// For stambh/tally, kon/place and kon/name (shared/play.ts FACTS_UNTIL_NAMED):
//   1. As served (naming off, shared/play.ts NAMING_OFF untouched), through the real route (POST /api/play/act, the session
//      token signed for a lesson): every served level of every goal, at every fade, for eight children and three pL values,
//      played by the solver, by each mal-rule (then the solve, and alone), by the battery's blind and random-slip children
//      (then the solve), and one impasse post. The signed seam row is exactly game, verdict, first_try, checks (an impasse:
//      game, checks); the signed rows' misses all weigh GAME_WEIGHT; the signed trail is the server's raw replay.
//   2. With naming on (the battery's path: gradeActs, nameOnRepeat, seamOf, seamOut, afterLevelBody, nextBody, as
//      tests/_habit-children.mjs runs it), sessions of four levels for the holders and the blind and random children: until a
//      level names a mix-up its row is the same four pairs and its misses weigh GAME_WEIGHT; a level that names one keeps
//      naming's own row (unchanged).
// Pure, no DB (the route's child check and queries are swapped inside each test and put back).
import { test } from "node:test";
import assert from "node:assert/strict";
import { FACTS_UNTIL_NAMED, GAME_WEIGHT, CHANCE_WEIGHT, NAMING_OFF, factsUntilNamed, playFactsRow } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";
import { env } from "../src/play/core/pick.ts";
import { mulberry32, hash32 } from "../src/play/core/rng.ts";
import { coverage, currentLevel, entryKey, seedOf, nameOnRepeat, afterLevelBody, nextBody, entryOfBody, NAMING_LEVELS } from "../server/play/levels.js";
import { gradeActs, lessonEvidence, withNaming } from "../server/play/grade.js";
import { routes, playDeps, seamOf, seamOut, seamLead } from "../server/play/routes.js";
import { signSession } from "../server/play/session.js";
import { verifyEvidence, verifySeam } from "../server/play/evidence.js";
import { childrenFor, repairOf } from "./_habit-children.mjs";

// The sweep: the gate's, and the full one (H5_FULL=1; measured 2026-11-16: 230 s, 2,483 level-end posts on 313 served
// levels, 2,448 naming-on levels). Gate: 2 children × 3 fades × 2 pL served through the route, one blind and one random
// slip each; naming on, one session a cell and one door sequence (~20 s).
const FULL = process.env.H5_FULL === "1";
const SW = FULL ? { children: 8, pls: [undefined, 0.3, 0.9], slipSeeds: 2, sessionSeeds: 3, doors: [["garam", "garam", "garam"], ["teekha", "teekha", "teekha"]], minLevels: 30 }
  : { children: 2, pls: [undefined, 0.9], slipSeeds: 1, sessionSeeds: 1, doors: [["garam", "teekha", "garam"]], minLevels: 10 };
const LES = "33333333-3333-4333-8333-333333333333";
const ROW = ["game", "verdict", "first_try", "checks"];
const keysOf = (row) => row.split(" ").filter(Boolean).map((p) => p.split("=")[0]);
const valOf = (row, k) => row.split(" ").find((p) => p.startsWith(`${k}=`))?.slice(k.length + 1);
const fakeRes = () => { const r = { statusCode: 0, headers: {}, body: null, setHeader(k, v) { r.headers[k] = v; }, end(x) { r.body = x ? JSON.parse(x) : null; } }; return r; };
const sessionOf = (e, childId, fade, pL) => ({ childId, key: entryKey(e), skillId: e.skillId, lessonId: LES, classLevel: e.classLevel, fade, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, ...(pL !== undefined ? { pL } : {}), n: 0, seed: seedOf(childId, entryKey(e), 0), door: "garam", recent: [], hist: null });
const MODE_GOALS = { "stambh/tally": ["read", "keep"], "kon/place": ["measure", "draw", "size"], "kon/name": ["say", "find"] };
const checksOf = (f) => Number(f?.checks ?? f?.commits) || 0;
/** the facts of her act the old row carried (the ruling's examples among them) */
const ACT_KEYS = /(^| )(bundles|answer|read|made|said|taps|picked|pick|shown|placed|centre_px|base_deg|misses|extra|gap|why)=/;

test("H5: the three modes and only they; NAMING_OFF is as it was", () => {
  assert.deepEqual([...FACTS_UNTIL_NAMED].sort(), ["kon/name", "kon/place", "stambh/tally"]);
  assert.deepEqual([...NAMING_OFF].sort(), ["kon/name", "kon/place", "stambh/tally"]);
  for (const k of Object.keys(LOGIC)) { const [f, m] = k.split("/"); assert.equal(factsUntilNamed(f, m), FACTS_UNTIL_NAMED.has(k), k); }
});

/** the plays on one served level: [name, acts, { impasse? }] */
function playsOf(lv, modeName) {
  const lg = LOGIC[`${lv.family}/${lv.mode}`], sol = lg.solve(lv) ?? [], goal = lv.params?.goal;
  const out = [["solve", sol]];
  for (const m of lg.malRules) {
    const a = lg.malActs(lv, m);
    if (!a?.length) continue;
    out.push([`${m}+solve`, [...a, ...repairOf(lv)]], [`${m}-only`, a]);
  }
  for (const c of childrenFor(modeName, goal).filter((x) => x.id === "blind" || x.id === "slip-random")) for (let k = 0; k < SW.slipSeeds; k++) {
    const ctx = { rng: mulberry32(hash32(`${c.id}|${lv.levelId}|${k}`)), prev: null, i: 0, mem: {} };
    const first = c.acts[goal]?.(lv, ctx);
    if (!first?.length) continue;
    out.push([`${c.id}${k}`, [...first, ...repairOf(lv)]]);
  }
  return out;
}

test("H5, as served (naming off), through POST /api/play/act on every served level: the seam row is game, verdict, first_try, checks; every miss weighs GAME_WEIGHT; the trail is the raw replay", async () => {
  const saved = { ...playDeps };
  const t0 = performance.now();
  const tally = {};
  try {
    playDeps.requireChild = async (_req, id) => ({ guardian: { id: "g" }, child: { id, class_level: 6, first_name: "Riya", language_pref: "hinglish" } });
    playDeps.q = async () => [];
    playDeps.writeHome = async () => ({ written: true, n: 0 });
    for (const [modeName, goals] of Object.entries(MODE_GOALS)) {
      const [fam, mode] = modeName.split("/");
      const t = (tally[modeName] = { levels: 0, posts: 0, mixMiss: 0, otherMiss: 0, impasse: 0, oldActRows: 0 });
      for (const e of coverage().entries.filter((x) => x.family === fam && x.mode === mode && goals.includes(x.goal))) {
        const seen = new Set();
        for (const fade of [1, 2, 3]) for (let c = 0; c < SW.children; c++) for (const pL of SW.pls) {
          const s = sessionOf(e, `h5-${c}`, fade, pL), lv = currentLevel(s, e);
          if (!lv || seen.has(`${lv.levelId}|${lv.fade}`)) continue;
          seen.add(`${lv.levelId}|${lv.fade}`);
          t.levels++;
          const sid = signSession(s);
          for (const [name, acts] of playsOf(lv, modeName)) {
            const where = `${modeName} ${lv.levelId} f${fade} ${name}`;
            const r = fakeRes();
            await routes["POST /api/play/act"]({}, r, { sessionId: sid, levelId: lv.levelId, acts: env(acts), final: true });
            assert.equal(r.statusCode, 200, where);
            t.posts++;
            const raw = gradeActs(lv, env(acts), { final: true }), b = r.body;
            // the facts row the teacher reads: exactly these four pairs
            const seam = verifySeam(b.seamToken, { childId: s.childId, lessonId: LES });
            assert.ok(seam && seam.kind === "level_end", where);
            assert.deepEqual(keysOf(seam.row), ROW, `${where}: ${seam.row}`);
            assert.equal(valOf(seam.row, "game"), modeName, where);
            assert.equal(valOf(seam.row, "verdict"), raw.grade.verdict, where);
            assert.equal(valOf(seam.row, "first_try"), raw.trail.firstTry ? "1" : "0", where);
            assert.equal(valOf(seam.row, "checks"), String(checksOf(raw.grade.facts)), where);
            assert.deepEqual(Object.keys(b.seam.facts).sort(), ["checks", "first_try", "verdict"], where);
            // the row it replaces carried her act (the negative control): the old lead and the family's facts
            const old = playFactsRow({ game: modeName, ...seamLead({ facts: { ...raw.grade.facts, verdict: raw.grade.verdict } }, raw.trail, s, null), ...raw.grade.facts, verdict: raw.grade.verdict });
            if (ACT_KEYS.test(old)) t.oldActRows++;
            // the rows the learner model folds: no mix-up, and a miss weighs GAME_WEIGHT whatever its form
            const ev = verifyEvidence(b.evidenceToken, { childId: s.childId, lessonId: LES });
            assert.ok(ev?.rows.length, where);
            ev.rows.forEach((row, i) => {
              assert.equal(row.misconceptionId, undefined, where); assert.equal(row.chanceMis, undefined, where); assert.equal(row.chanceAct, undefined, where);
              const o = raw.grade.evidence[i];
              assert.equal(row.outcome, o.outcome, where);
              if (row.outcome === "correct") { assert.equal(row.weight, o.weight, where); return; }
              assert.equal(row.weight, GAME_WEIGHT, `${where}: a miss at ${row.weight}`);
              if (o.chanceMis || o.misconceptionId || o.weight === CHANCE_WEIGHT) t.mixMiss++; else t.otherMiss++;
            });
            // the raw act stays in the trail: the server's replay, its mal-rules left out while naming is off
            assert.deepEqual(ev.trail, { ...raw.trail, mal: [] }, where);
            // (dc-r8-gate2-shadow S1: the route's trail adds the shadow's wouldName; the signed one never carries it)
            const { wouldName: _w, ...shown } = b.trail;
            assert.ok("wouldName" in b.trail, where);
            assert.deepEqual(shown, ev.trail, where);
          }
          // an impasse post (mid-level, her first acts): game and the checks so far
          const first = playsOf(lv, modeName).find(([n]) => n.endsWith("-only"))?.[1] ?? (LOGIC[`${lv.family}/${lv.mode}`].solve(lv) ?? []).slice(0, 1);
          const r = fakeRes();
          await routes["POST /api/play/act"]({}, r, { sessionId: sid, levelId: lv.levelId, acts: env(first), impasse: true });
          assert.equal(r.statusCode, 200);
          const seam = r.body.seamToken ? verifySeam(r.body.seamToken, { childId: s.childId, lessonId: LES }) : null;
          if (seam?.kind === "impasse") {
            t.impasse++;
            assert.deepEqual(keysOf(seam.row), ["game", "checks"], seam.row);
            assert.equal(valOf(seam.row, "checks"), String(checksOf(gradeActs(lv, env(first)).facts)));
          } else if (seam) assert.deepEqual(keysOf(seam.row), ROW, seam.row);
        }
      }
      assert.ok(t.levels >= SW.minLevels, `${modeName}: ${t.levels} served levels`);
      assert.ok(t.mixMiss > 0 && t.otherMiss > 0, `${modeName}: both kinds of miss met (${t.mixMiss} in the mix-up's form, ${t.otherMiss} other)`);
      assert.ok(t.oldActRows > 0 && t.impasse > 0, `${modeName}: ${JSON.stringify(t)}`);
    }
  } finally { Object.assign(playDeps, saved); }
  console.log(`# H5 served: ${JSON.stringify(tally)} (${Math.round(performance.now() - t0)} ms)`);
});

test("H5, naming on (the battery's path): until a level names a mix-up its row is game, verdict, first_try, checks and every miss weighs GAME_WEIGHT; a level that names one keeps naming's own row", () => {
  const t0 = performance.now();
  const tally = {};
  for (const [modeName, goals] of Object.entries(MODE_GOALS)) {
    const [fam, mode] = modeName.split("/");
    const t = (tally[modeName] = { levels: 0, named: 0, before: 0, mixMiss: 0 });
    for (const goal of goals.filter((g) => g !== "size")) {
      const entry = coverage().entries.find((x) => x.family === fam && x.mode === mode && x.goal === goal);
      const kids = childrenFor(modeName, goal).filter((c) => c.holds || c.id === "blind" || c.id === "slip-random");
      for (const child of kids) for (const fade of [1, 2, 3]) for (const doors of SW.doors) for (let k = 0; k < SW.sessionSeeds; k++) {
        const childId = `h5n${k}`;
        let e = entry, s = { ...sessionOf(e, childId, fade, undefined), lessonId: null };
        const ctx = { rng: mulberry32(hash32(`${child.id}|${goal}|${fade}|${doors.join("")}|${k}`)), prev: null, i: 0, mem: {} };
        for (let i = 0; i < NAMING_LEVELS; i++) {
          const lv = currentLevel(s, e);
          if (!lv) break;
          ctx.i = i;
          const lg = LOGIC[`${lv.family}/${lv.mode}`], mine = lv.family === fam && lv.mode === mode;
          const first = (mine ? child.acts[lv.params?.goal]?.(lv, ctx) : null) ?? lg.solve(lv);
          const g0 = gradeActs(lv, env(first), { final: false });
          const again = !g0?.solved && mine ? child.again?.[lv.params?.goal]?.(lv, ctx) ?? [] : [];
          const g = gradeActs(lv, env(g0?.solved ? first : [...first, ...again, ...repairOf(lv)]), { final: true });
          const rows = nameOnRepeat(lessonEvidence(g.grade, lv), s, lv);
          const named = rows.some((r) => r.misconceptionId);
          const s2 = afterLevelBody(s, { grade: g.grade, level: lv, history: null });
          const raw = seamOf(g.grade, lv, [], false);
          const { row } = seamOut(lv, raw, { named, trail: g.trail, s, s2, now: g.facts });
          if (mine) {
            t.levels++;
            const where = `${modeName} ${child.id} ${lv.levelId} level ${i + 1}`;
            if (named) {
              t.named++;
              assert.equal(row, playFactsRow({ game: modeName, ...seamLead(raw, g.trail, s, s2), ...raw.facts }), `${where}: naming's own row`);
            } else {
              t.before++;
              assert.deepEqual(keysOf(row), ROW, `${where}: ${row}`);
              for (const r of rows) if (r.outcome !== "correct") assert.equal(r.weight, GAME_WEIGHT, `${where}: a miss at ${r.weight}`);
              if (g.grade.evidence.some((r) => r.chanceMis && r.outcome !== "correct")) t.mixMiss++;
            }
          }
          ctx.prev = { level: lv, first, firstTry: !!g0?.solved };
          s = s2;
          if (i < NAMING_LEVELS - 1) { const nx = nextBody(s, e, doors[i]); e = entryOfBody(nx, e); s = nx; }
        }
      }
    }
    assert.ok(t.before > 0 && t.mixMiss > 0, `${modeName}: ${JSON.stringify(t)}`);
    assert.ok(t.named > 0, `${modeName}: some level names a mix-up, so naming's own row is checked too (${JSON.stringify(t)})`);
  }
  console.log(`# H5 naming on: ${JSON.stringify(tally)} (${Math.round(performance.now() - t0)} ms)`);
});

test("H5: withNaming (naming off) and the route's rows agree: a mix-up-form miss and any other miss both weigh GAME_WEIGHT", () => {
  // the weights before H5, for the record: a pick's miss CHANCE_WEIGHT (0.25), any other miss GAME_WEIGHT (0.5)
  assert.equal(CHANCE_WEIGHT, 0.25); assert.equal(GAME_WEIGHT, 0.5);
  const e = coverage().entries.find((x) => x.family === "kon" && x.mode === "name" && x.goal === "say");
  const lv = currentLevel(sessionOf(e, "w", 2, undefined), e), lg = LOGIC["kon/name"];
  const mix = gradeActs(lv, env([...lg.malActs(lv, "vertex-name"), ...repairOf(lv)]), { final: true });
  assert.equal(mix.grade.evidence[0].weight, CHANCE_WEIGHT, "inside the play server the grade keeps its pick weight");
  const out = nameOnRepeat(lessonEvidence(mix.grade, lv), { n: 0 }, lv);
  assert.equal(out[0].weight, GAME_WEIGHT); assert.equal(out[0].chanceMis, undefined);
  const off = withNaming(lv, mix);
  assert.equal(nameOnRepeat(lessonEvidence(off.grade, lv), { n: 0 }, lv)[0].weight, GAME_WEIGHT);
});
