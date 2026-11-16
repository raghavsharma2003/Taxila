// Gate 2 for kon/name (night rulings 2026-11-11 "For gate 2"; rulings 2026-11-15 "Kept for gate 2";
// dc-r8-game-gate-play-then-evidence). Law 3's number: an act that a blind guess or one ordinary slip produces more than
// 1 time in 10 names nothing by itself.
//
// Every number in the packet's "Gate 2: evidence" section is computed here, over every generated say and find level (fades
// 1-3, a first and a later level at fade 1, eight seeds, the coverage's own kit map), through the law itself (konLogic.apply,
// arcHit, arcTargets, vertexNamePick), and asserted. With KON_NAME_GATE2_PRINT=<file> the tables are written to that file as
// JSON (the packet is printed from them).
//
//   say   a name of three taps: three random taps give a vertex-first or vertex-last name 1 time in 6 at worst (4 of the 24
//         orders of three different letters out of four), so one name names nothing (a chance pick, chanceMis).
//   find  one tap among five arcs: the mix-up's arc is 1 in 5 for a blind tap (0 on the 2 levels in 5 where the mix-up's
//         reading meets no other arc).
//   per session (law 3 read per session, 2026-11-16): named on the second occurrence, a session's four levels
//         (NAMING_LEVELS) give 1 in 7.6 (say) and 1 in 5.5 (find): over. The server names it on the THIRD, on levels whose
//         figures and letters differ two by two (konLogic.chanceRepeat): at worst 1 in 37 a session. say since
//         dc-r8-gate2-discriminating-level (main's answer 2, 2026-11-16): never without a sighting on a discriminating
//         level (every reading across the screen gives the right name there: readsAcrossAll), and then on the second, each
//         confirmed on its own level (H3): at worst 1 in 223 a session.
//   faint solves  the first fade-1 level with O at the vertex, and a find level whose mix-up reading meets no other arc
//         (the wide key among them): the right answer enters at CHANCE_WEIGHT and discriminates nothing.
//   Wapas  after a wrong find tap: the miss stays the level's first decision (grade, trail, the session's memory), the checks
//         keep counting.
import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { konLogic } from "../src/play/families/kon/kon.logic.ts";
import { WIDE, readsAcrossAll, angleSizes, arcHit, arcTargets, asked, corners, isVertexNameSaid, nameFaint, nameOf, nameSurface, vertexNamePick } from "../src/play/families/kon/kon.name.ts";
import { env, proveLevel } from "../src/play/core/pick.ts";
import { coverage, entryKey, levelsFor, seedOf, nameOnRepeat, afterLevelBody, repeatMet, surfaceOf, surfacesDiffer, CHANCE_MEMORY, NAMING_LEVELS } from "../server/play/levels.js";
import { atLeast, oneIn } from "./_session-figure.mjs";
import { gradeActs, lessonEvidence, chancePick, withNaming } from "../server/play/grade.js";
import { signSession, verifySession } from "../server/play/session.js";
import { CHANCE_WEIGHT, GAME_WEIGHT, namingOn, playFactsRow } from "../shared/play.ts";

const LAW3 = 0.1;
const NE = (goal) => coverage().entries.find((e) => e.family === "kon" && e.mode === "name" && e.goal === goal);
const KIT = NE("say").misMap["vertex-name"];
const req = (goal, seed, fade, recent = []) => ({ family: "kon", mode: "name", goal, topicId: "c6-maths-ch02-t02", skillId: NE(goal).skillId, classLevel: 6, fade, mis: {},
  misMap: NE(goal).misMap, grammar: NE(goal).grammar, recent, seed });
// (find draws one key arc per request, so it takes more requests than say to meet every key often)
const SEEDS = { say: [1, 7, 42, 99, 123, 512, 777, 2024], find: Array.from({ length: 40 }, (_, i) => 1 + 37 * i) };
function all(goal) {
  // (say: and the levels a session is steered to once vertex-name is suspected: dc-r8-gate2-discriminating-level, the focus)
  const seen = new Set(), out = [];
  for (const fade of [1, 2, 3]) for (const recent of fade === 1 ? [[], ["name:say:0:50:50:0:0"]] : [[]]) for (const sd of SEEDS[goal]) for (const r of [req(goal, sd, fade, recent), ...(goal === "say" ? [{ ...req(goal, sd, fade, recent), focus: KIT }] : [])]) for (const c of konLogic.generate(r)) {
    const v = konLogic.validate(c.level), k = JSON.stringify(v.params);
    if (seen.has(k)) continue;
    // (the picker's proof, as a served level carries it: which mix-ups the level shows)
    const proof = proveLevel(konLogic, v);
    if (!proof) continue;
    seen.add(k); out.push({ ...v, proof: { ...v.proof, ...proof } });
  }
  return out;
}
const LEVELS = { say: all("say"), find: all("find") };
const run = (level, acts) => { let s = konLogic.init(level); const ms = []; acts.forEach((a, i) => { const r = konLogic.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); }); return { s, ms }; };
const sayActs = (t) => [...t.map((at) => ({ kind: "letter", at })), { kind: "commit" }];
const isMix = (level, acts) => run(level, acts).ms.some((m) => m.kind === "misconception_consequence" && m.misconceptionId === "vertex-name");
const fr = (x) => `1 in ${(1 / x).toFixed(x > 0 ? 1 : 0)}`;

// ───────────────────────────── the tables ─────────────────────────────
let memo = null;
function tables() {
  if (memo) return memo;
  // say: every three-tap name, through the law. Blind (a): each tap any of the four letters (a letter may be tapped again,
  // as the view allows); blind (b): three different letters (the ruling's model, the worse one). One slip from the right
  // name (either order): one tap on another letter (any of the three others, so every neighbouring letter is among them);
  // one swap of two neighbouring taps.
  const say = { levels: LEVELS.say.length, any: { mix: 0, of: 0, right: 0 }, distinct: { mix: 0, of: 0 }, worstAny: 0, worstDistinct: 0, letterSlip: { mix: 0, of: 0 }, swap: { mix: 0, of: 0 }, faint: 0 };
  for (const lv of LEVELS.say) {
    let mA = 0, nA = 0, mD = 0, nD = 0;
    for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) for (let c = 0; c < 4; c++) {
      const t = [a, b, c], m = isMix(lv, sayActs(t));
      assert.equal(m, isVertexNameSaid(lv.params, t), `${lv.levelId} ${t}`);
      nA++; if (m) mA++;
      if (run(lv, sayActs(t)).s.done) say.any.right++;
      if (new Set(t).size === 3) { nD++; if (m) mD++; }
    }
    say.any.mix += mA; say.any.of += nA; say.distinct.mix += mD; say.distinct.of += nD;
    say.worstAny = Math.max(say.worstAny, mA / nA); say.worstDistinct = Math.max(say.worstDistinct, mD / nD);
    const c = asked(lv.params);
    for (const right of [[c.a, c.v, c.b], [c.b, c.v, c.a]]) {
      for (let i = 0; i < 3; i++) for (let x = 0; x < 4; x++) if (x !== right[i]) {
        const t = right.slice(); t[i] = x; say.letterSlip.of++; if (isMix(lv, sayActs(t))) say.letterSlip.mix++;
      }
      for (const i of [0, 1]) { const t = right.slice(); [t[i], t[i + 1]] = [t[i + 1], t[i]]; say.swap.of++; if (isMix(lv, sayActs(t))) say.swap.mix++; }
    }
    if (nameFaint(lv.params, lv.fade)) say.faint++;
  }
  // find: one tap. Blind: an arc at random (1 in 5 on the mix-up's arc, where there is one). A blind rule that never reads
  // the name: a fixed arc (by its place among the five), the smallest / largest / second smallest angle, a corner at random.
  // One slip: a tap meant for the key that leaves its touch disc (8, 16, 24 or 32 board px past its rim, all round) and
  // lands on another arc: the share of those landings on the mix-up's arc.
  const find = { levels: LEVELS.find.length, withPick: 0, noPick: 0, wide: 0, wideNoPick: 0, keys: [0, 0, 0, 0, 0], rules: {}, slip: { worst: 0, mean: 0, n: 0 }, faint: 0, discriminatesOnNoPick: 0 };
  const R = { "arc 0": () => 0, "arc 1": () => 1, "arc 2 (the wide one)": () => 2, "arc 3": () => 3, "arc 4": () => 4,
    "the smallest angle": (z) => z.indexOf(Math.min(...z)), "the largest angle": (z) => z.indexOf(Math.max(...z)),
    "the second smallest": (z) => z.indexOf([...z].sort((x, y) => x - y)[1]) };
  const hits = Object.fromEntries([...Object.keys(R), "a corner (3 or 4)"].map((k) => [k, 0]));
  for (const lv of LEVELS.find) {
    const p = lv.params, k = vertexNamePick(p), z = angleSizes(p);
    find.keys[p.ask]++;
    if (p.ask === WIDE) { find.wide++; if (k < 0) find.wideNoPick++; }
    if (nameFaint(p, lv.fade)) find.faint++;
    if (k < 0) { find.noPick++; if (lv.proof?.discriminates?.length) find.discriminatesOnNoPick++; continue; }
    find.withPick++;
    // the tap on the mix-up's arc is the mix-up (and only that arc is)
    for (let a = 0; a < 5; a++) if (a !== p.ask) assert.equal(isMix(lv, [{ kind: "arc", at: a }]), a === k, `${lv.levelId} arc ${a}`);
    for (const [name, f] of Object.entries(R)) if (f(z) === k) hits[name]++;
    if (k === 3 || k === 4) hits["a corner (3 or 4)"] += 0.5;
    const T = arcTargets(p)[p.ask], seen = [];
    for (const out of [8, 16, 24, 32]) for (let i = 0; i < 72; i++) {
      const a = (2 * Math.PI * i) / 72, r = T.side / 2 + out, h = arcHit(p, T.x + r * Math.cos(a), T.y + r * Math.sin(a));
      if (h >= 0 && h !== p.ask) seen.push(h);
    }
    const share = seen.length ? seen.filter((h) => h === k).length / seen.length : 0;
    find.slip.worst = Math.max(find.slip.worst, share); find.slip.mean += share; find.slip.n++;
  }
  find.slip.mean /= Math.max(1, find.slip.n);
  for (const [name, h] of Object.entries(hits)) find.rules[name] = +(h / find.levels).toFixed(3);
  find.worstRule = Math.max(...Object.values(find.rules));
  // the pairs (the server's rule: the second sighting on another figure with other letters)
  const pair = { say: say.worstDistinct ** 2, find: 0.2 ** 2, mixed: say.worstDistinct * 0.2, findRule: find.worstRule ** 2 };
  // per session: each goal's chance on one level (say: the worse blind model; find: a blind tap, the worst blind rule, the
  // worst slip off the key), and say and find together (they count toward one another): the worse of the two. Over the
  // NAMING_LEVELS levels a session names from, named on the k-th: P(k or more of n)
  const n = NAMING_LEVELS, k = konLogic.chanceRepeat["say:vertex-name"]?.sightings ?? 2;
  const pf = Math.max(0.2, find.worstRule, find.slip.worst), ps = say.worstDistinct, pm = Math.max(ps, pf);
  const session = { n, k, say: { p: ps, before: atLeast(n, ps, 2), after: atLeast(n, ps, k) }, find: { p: pf, before: atLeast(n, pf, 2), after: atLeast(n, pf, k) },
    mixed: { p: pm, before: atLeast(n, pm, 2), after: atLeast(n, pm, k) }, sayBlindAny: atLeast(n, say.worstAny, k) };
  memo = { say, find, pair, session };
  return memo;
}

test("gate 2, say (a name of three taps): three random taps give vertex-name at worst 1 in 6, over law 3's line, so one name names nothing; a pair is 1 in 36", () => {
  const { say, pair } = tables();
  assert.ok(say.levels >= 100, `${say.levels} say levels`);
  // on EVERY level: 4 of 64 (a letter may be tapped again), 4 of 24 (three different letters)
  assert.equal(say.any.mix, say.levels * 4); assert.equal(say.any.of, say.levels * 64); assert.equal(say.any.right, say.levels * 2);
  assert.equal(say.distinct.mix, say.levels * 4); assert.equal(say.distinct.of, say.levels * 24);
  assert.equal(say.worstAny, 1 / 16); assert.equal(say.worstDistinct, 1 / 6);
  assert.ok(say.worstDistinct > LAW3, "one name is over the line: it names nothing by itself");
  assert.ok(pair.say <= LAW3 && Math.abs(pair.say - 1 / 36) < 1e-12, "two names on two levels: 1 in 36");
  // one tap on another letter (so on any neighbouring letter) never gives it: the mix-up is the right three letters
  assert.equal(say.letterSlip.mix, 0); assert.equal(say.letterSlip.of, say.levels * 18);
  // one swap of two neighbouring taps always does (it is the mix-up's own act): one sighting names nothing for that reason
  // too, and a pair needs a second act on another level
  assert.equal(say.swap.mix, say.swap.of);
  assert.ok(chancePick({ goal: "say", family: "kon", mode: "name" }, "vertex-name"), "say:vertex-name is a chance pick");
  // dc-r8-gate2-discriminating-level (main's answer 2): never named without a sighting on a discriminating level (every reading
  // across gives the right name there: readsAcrossAll, firmSighting), and then on the second
  assert.deepEqual(konLogic.chanceRepeat["say:vertex-name"], { sightings: 3, firm: 2, needFirm: true }, "per session: two, one on a discriminating level");
  for (const lv of LEVELS.say) assert.equal(konLogic.firmSighting(lv, "vertex-name"), readsAcrossAll(lv.params), lv.levelId);
});

test("gate 2, find (one tap among five arcs): the mix-up's arc is 1 in 5 blind and at most 1 in 5 for a rule that ignores the name; one tap names nothing; a pair is 1 in 25 (1 in 30 with a say name)", () => {
  const { find, pair } = tables();
  assert.ok(find.levels >= 100, `${find.levels} find levels`);
  // the keys are spread over the five arcs (night ruling kon/name 2)
  for (const n of find.keys) assert.ok(n >= 0.12 * find.levels && n <= 0.28 * find.levels, `keys ${find.keys}`);
  // the 2 levels in 5 with no mix-up arc: the wide key always among them
  assert.equal(find.wideNoPick, find.wide);
  assert.ok(find.noPick >= 0.3 * find.levels && find.noPick <= 0.5 * find.levels, `${find.noPick} of ${find.levels}`);
  for (const [name, r] of Object.entries(find.rules)) assert.ok(r <= 0.3, `${name}: ${r}`);
  assert.ok(find.worstRule ** 2 <= LAW3, "a pair by the worst blind rule is under the line");
  assert.ok(pair.find <= LAW3 && pair.mixed <= LAW3);
  assert.ok(konLogic.oneDecision.includes("find")); assert.deepEqual(konLogic.chanceRepeat["find:vertex-name"], { sightings: 3 });
});

test("gate 2, per session: named on the second sighting, a session's four levels are over 1 in 10 (say 1 in 7.6, find 1 in 5.5); on the third they are under (at worst 1 in 37), for say, find and the two together", () => {
  const { session } = tables();
  assert.equal(session.n, 4); assert.equal(session.k, 3);
  for (const g of ["say", "find", "mixed"]) {
    assert.ok(session[g].before > LAW3, `${g}: the second sighting, ${oneIn(session[g].before)} a session`);
    assert.ok(session[g].after <= LAW3, `${g}: the third, ${oneIn(session[g].after)} a session`);
  }
  // the arithmetic, as the packet prints it: say 1/6: 1 - (5/6)^4 - 4(1/6)(5/6)^3 = 171/1296; the third: 21/1296
  assert.ok(Math.abs(session.say.before - 171 / 1296) < 1e-12 && Math.abs(session.say.after - 21 / 1296) < 1e-12);
  // find's worst on one level is the blind tap, 1 in 5: the second 0.1808, the third 4(1/5)^3(4/5) + (1/5)^4 = 0.0272
  assert.equal(session.find.p, 0.2); assert.ok(Math.abs(session.find.after - 0.0272) < 1e-12);
  assert.equal(session.mixed.p, 0.2);
  // two would still be over even at three levels: 1 - (4/5)^3 - 3(1/5)(4/5)^2 = 0.104
  assert.ok(atLeast(3, 0.2, 2) > LAW3);
  assert.ok(CHANCE_MEMORY >= session.n - 1);
  // say by dc-r8-gate2-discriminating-level: named on the second sighting, one of them on a discriminating level, each
  // confirmed on its own level by her name after the play-out (H3): a blind name is a sighting (1/6)^2 = 1 in 36 a level, so
  // at worst (every level discriminating) two in a session of four is 1 in 223
  assert.ok(atLeast(session.n, session.say.p ** 2, 2) <= LAW3 / 10, `${oneIn(atLeast(session.n, session.say.p ** 2, 2))}`);
});

test("gate 2, surfaces: a second sighting counts only on another figure with other letters (both parts differ); the shared one-prior rule", () => {
  const a = LEVELS.say[0], b = LEVELS.say.find((l) => l.params.lets !== a.params.lets && nameSurface(l.params)[0] !== nameSurface(a.params)[0]);
  assert.deepEqual(nameSurface(a.params), [`say:${a.params.h1}:${a.params.h2}:${a.params.h3}:${a.params.tri}:${a.params.ask}`, `lets:${a.params.lets}`]);
  const sa = surfaceOf(a), sb = surfaceOf(b);
  assert.ok(Array.isArray(sa) && sa.length === 2 && surfacesDiffer(sa, sb));
  const sameLets = surfaceOf({ ...b, params: { ...b.params, lets: a.params.lets } }), sameFig = surfaceOf({ ...a, params: { ...a.params, lets: b.params.lets } });
  assert.ok(repeatMet([sa], sb), "another figure, other letters: named");
  assert.ok(!repeatMet([sa], sameLets), "the same letters on another figure: not named");
  assert.ok(!repeatMet([sa], sameFig), "the same figure with other letters: not named");
  assert.ok(!repeatMet([sa], sa));
  // a say name and a find tap on the same figure and letters are still the same letters: not a repeat
  assert.ok(!repeatMet([sa], surfaceOf({ ...a, goal: "find", params: { ...a.params, goal: "find" } })));
  assert.ok(CHANCE_MEMORY >= 1);
});

test("gate 2, faint solves: the first fade-1 level with O at the vertex, and every find level with no mix-up arc (the wide key among them), solve at CHANCE_WEIGHT with no discriminates; others keep their weight", () => {
  const { say, find } = tables();
  assert.ok(say.faint > 0 && find.faint >= find.noPick);
  let firstO = 0, later = 0;
  for (const goal of ["say", "find"]) for (const lv of LEVELS[goal]) {
    const p = lv.params, row = konLogic.grade(lv, env(konLogic.solve(lv)), { final: true }).evidence[0];
    assert.equal(row.outcome, "correct");
    const faint = nameFaint(p, lv.fade);
    // (dc-r8-gate2-discriminating-level: a say level where every reading across gives the right name is faint too)
    assert.equal(faint, (lv.fade === 1 && p.lets[0] === "O" && asked(p).v === 0) || (goal === "find" && vertexNamePick(p) < 0) || (goal === "say" && readsAcrossAll(p)), lv.levelId);
    if (lv.fade === 1 && p.lets[0] === "O" && asked(p).v === 0) firstO++;
    if (faint) { assert.equal(row.weight, CHANCE_WEIGHT, lv.levelId); assert.equal(row.discriminates, undefined, lv.levelId); continue; }
    later++;
    assert.equal(row.weight, goal === "find" ? CHANCE_WEIGHT : GAME_WEIGHT, lv.levelId);
    // (a level that shows the mix-up's own act: its right answer tells against it)
    assert.equal(row.discriminates, konLogic.malActs(lv, "vertex-name") ? KIT : undefined, lv.levelId);
  }
  assert.ok(firstO > 0 && later > 0);
  // a find level with no mix-up arc: the proof claims nothing either (the 2 levels in 5)
  assert.equal(find.discriminatesOnNoPick, 0);
  // at fade 1 a later level never has O at the vertex: only the first is faint for that reason
  for (const lv of LEVELS.say.filter((l) => l.fade === 1 && l.params.lets[0] !== "O" && !readsAcrossAll(l.params))) assert.ok(!nameFaint(lv.params, 1));
});

const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });
function served(goal) {
  const entry = NE(goal), out = [];
  for (const fade of [1, 2, 3]) for (const child of ["a", "b", "c", "d", "e", "f", "g", "h"]) for (let k = 0; k < 2; k++) {
    const lv = levelsFor(sessionOf(entry, { fade, childId: child, seed: seedOf(child, entryKey(entry), k), recent: k ? ["name:say:0:50:50:0:0"] : [] }), entry)?.garam;
    if (lv && konLogic.malActs(lv, "vertex-name")) out.push(lv);
  }
  return out;
}
const about = /vertex|sign=|mal=|misconception=|chance/i;

test("gate 2, the server's rule with naming ON (levels.js / grade.js directly): one say name or one find tap reaches nothing, nor does a second; the third on other figures with other letters names it; the same letters again do not; nothing past the session's fourth level; as served (naming off) nothing", () => {
  const S = served("say").filter((l) => !readsAcrossAll(l.params)), F = served("find");
  assert.ok(S.length >= 4 && F.length >= 4, `${S.length} say, ${F.length} find`);
  const apart = (x, ...ys) => ys.every((y) => surfacesDiffer(surfaceOf(x), surfaceOf(y)));
  const a = S[0], b = S.find((l) => apart(l, a)), f = F.find((l) => apart(l, a, b)), c = S.find((l) => apart(l, a, b, f));
  // dc-r8-gate2-discriminating-level (answer 2): a say level on which every reading across gives the right name
  const d = LEVELS.say.find((l) => readsAcrossAll(l.params) && konLogic.malActs(l, "vertex-name") && apart(l, a, b, c, f));
  assert.ok(b && f && c && d);
  // (gate 2, H3: a say name is a sighting when her name after the play-out is again the vertex at an end: she names it so twice)
  const malSeq = (lv) => { const m = konLogic.malActs(lv, "vertex-name"); return lv.params.goal === "say" ? [...m, { kind: "clear" }, ...m] : m; };
  const mal = (lv) => gradeActs(lv, env(malSeq(lv)), { final: true });
  // one say name that she puts right after the play-out is no sighting: nothing is remembered
  {
    const once = gradeActs(a, env([...konLogic.malActs(a, "vertex-name"), { kind: "clear" }, ...konLogic.solve(a)]), { final: true });
    assert.equal(once.grade.evidence[0].chanceMis, undefined);
    assert.equal(afterLevelBody(sessionOf(NE("say")), { grade: once.grade, level: a }).chance, undefined);
  }
  const play = (seq, n0 = 0) => {
    let s = sessionOf(NE("say"), { n: n0 }); const out = [];
    for (const lv of seq) {
      const g = mal(lv), rows = nameOnRepeat(lessonEvidence(g.grade, lv), s, lv);
      out.push({ g, rows });
      s = { ...afterLevelBody(s, { grade: g.grade, level: lv }), n: (s.n ?? 0) + 1 };
      const key = Buffer.alloc(32, 7);
      s = verifySession(signSession(s, { key }), { key });
    }
    return { s, out };
  };
  // say (dc-r8-gate2-discriminating-level): no level among them tells the mix-up from reading across, so three sightings on
  // other figures with other letters name nothing; with a discriminating level among two, the second names it. find alone:
  // the third, as before
  const F2 = F.filter((l) => apart(l, a, b, c, f, d)), f2 = F2[0], f3 = F2.find((l) => apart(l, f2));
  assert.ok(f2 && f3);
  for (const seq of [[a, b, c], [a, f, b], [f, a, c]]) assert.equal(play(seq).out[2].rows[0].misconceptionId, undefined, "no discriminating level: not named");
  for (const seq of [[a, d], [d, a], [f, d]]) assert.equal(play(seq).out[1].rows[0].misconceptionId, KIT, "a discriminating level among two: named on the second");
  for (const seq of [[a, d, b], [d, a, b], [f, d, a], [f, f2, f3]]) {
    const { s, out } = play(seq);
    out.forEach(({ g, rows }, i) => {
      // the moment plays out her name or her arc (the device), but nothing about the vertex is in it, the facts, the facts row or the trail
      const m = g.moments.at(-1);
      assert.equal(m.kind, "misconception_consequence");
      for (const k of ["sign", "vertex_ok", "arms_ok"]) assert.equal(m.facts[k], undefined, k);
      assert.equal(g.grade.evidence[0].chanceMis, KIT); assert.equal(g.grade.evidence[0].weight, CHANCE_WEIGHT); assert.equal(g.grade.evidence[0].misconceptionId, undefined);
      assert.deepEqual(g.trail.mal, [], "never in the level's own trail");
      assert.doesNotMatch(playFactsRow(g.grade.facts), about); assert.doesNotMatch(playFactsRow(g.facts), about);
      const at = seq.includes(d) ? 1 : 2;
      if (i < at) { assert.equal(rows[0].misconceptionId, undefined, `sighting ${i + 1} names nothing`); assert.equal(rows[0].chanceMis, undefined, "nor carries the pick"); }
      else { assert.equal(rows[0].misconceptionId, KIT, `sighting ${i + 1} names it`); assert.equal(rows[0].named, "repeat"); assert.equal(rows[0].weight, GAME_WEIGHT); }
    });
    assert.equal(s.chance.length, 3); assert.ok(s.chance.every((x) => x.mis === KIT && Array.isArray(x.surface) && x.surface.length === 2));
  }
  // the same letters on the discriminating figure, or the same level twice: the second names nothing
  const sameLets = { ...d, params: { ...d.params, lets: a.params.lets } };
  assert.ok(readsAcrossAll(sameLets.params));
  for (const seq of [[a, sameLets], [d, d]]) assert.equal(play(seq).out[1].rows[0].misconceptionId, undefined);
  // past the session's fourth level: the second sighting names nothing
  assert.equal(play([a, d], NAMING_LEVELS - 1).out[1].rows[0].misconceptionId, undefined);
  assert.equal(play([a, d], NAMING_LEVELS - 2).out[1].rows[0].misconceptionId, KIT, "the second on the fourth level: named");
  // as served today: the flag main switches (shared/play.ts NAMING_OFF)
  let u = sessionOf(NE("say")), last = null;
  for (const lv of [a, d, b]) { const g = withNaming(lv, mal(lv)); last = nameOnRepeat(lessonEvidence(g.grade, lv), u, lv); u = afterLevelBody(u, { grade: g.grade, level: lv }); }
  if (namingOn("kon", "name")) assert.equal(last[0].misconceptionId, KIT);
  else { assert.equal(u.chance, undefined, "naming off: nothing remembered"); assert.equal(last[0].misconceptionId, undefined); assert.equal(last[0].chanceMis, undefined); assert.equal(last[0].weight, GAME_WEIGHT); }
});

test("gate 2, Wapas after a wrong find tap: the miss stays her first decision (grade, trail, the session's memory); the checks keep counting; the right tap after it is no first-try solve", () => {
  const F = served("find"), lv = F[0], p = lv.params, k = vertexNamePick(p);
  const other = [0, 1, 2, 3, 4].find((x) => x !== p.ask && x !== k);
  for (const wrong of [k, other]) {
    const acts = [{ kind: "arc", at: wrong }, { kind: "undo" }, { kind: "arc", at: p.ask }];
    const r = run(lv, acts);
    assert.ok(r.s.done); assert.equal(r.s.commits, 2, "Wapas takes back her arc, not the check");
    assert.equal(run(lv, acts.slice(0, 2)).s.nm.picked, null, "her arc is gone from the screen");
    const g = gradeActs(lv, env(acts), { final: true });
    assert.equal(g.grade.verdict, "solved"); assert.equal(g.grade.evidence.length, 1);
    const row = g.grade.evidence[0];
    assert.equal(row.outcome, "incorrect", "the miss is the level's evidence");
    if (wrong === k) { assert.equal(row.chanceMis, KIT); assert.equal(row.weight, CHANCE_WEIGHT); } else { assert.equal(row.chanceMis, undefined); assert.equal(row.weight, GAME_WEIGHT); }
    assert.equal(g.trail.firstTry, false); assert.equal(g.trail.undos, 1);
    assert.equal(g.trail.misses + g.trail.refused, 1, "the miss is counted");
    // the session remembers the mix-up's tap (naming on) as it would without Wapas
    const s2 = afterLevelBody(sessionOf(NE("find")), { grade: g.grade, level: lv });
    assert.equal((s2.chance ?? []).length, wrong === k ? 1 : 0);
  }
  // say: Wapas after a wrong name takes back the name, not the check
  const sl = served("say")[0], m = konLogic.malActs(sl, "vertex-name"), right = konLogic.solve(sl);
  const r = run(sl, [...m, { kind: "undo" }, { kind: "clear" }, ...right]);
  assert.ok(r.s.done); assert.equal(r.s.commits, 2);
  if (process.env.KON_NAME_GATE2_PRINT) writeFileSync(process.env.KON_NAME_GATE2_PRINT, JSON.stringify(tables(), null, 1));
});

test("gate 2: the tables print (fractions)", () => {
  const t = tables();
  assert.match(fr(t.pair.say), /^1 in 36/); assert.match(fr(t.pair.find), /^1 in 25/); assert.match(fr(t.pair.mixed), /^1 in 30/);
});
