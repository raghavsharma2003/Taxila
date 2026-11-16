// Gate 2, H2 (RULINGS-2026-11-16-gate2.md, dc-r8-gate2-habit-children): the battery of habit children, run through sessions
// as the server serves them. Not a test file (the leading "_"): the per-mode tests import it.
//
// One session is what /api/play/act and /api/play/next do, in order, for NAMING_LEVELS levels:
//   currentLevel(s, entry) → her acts → gradeActs (final) → nameOnRepeat(lessonEvidence(grade)) → afterLevelBody → nextBody(door)
// so the picker repeats keys, steers the next level toward a suspected mix-up (nextFocus), lifts the band after a clean win,
// may switch family once, and serves rows in its own order, exactly as served. The one difference from the routes: the
// grade is NOT passed through withNaming, i.e. naming is forced ON here (shared/play.ts NAMING_OFF is untouched, so nothing
// a child sees or the lesson receives changes). The judges' method (each mode's judges/gate2-judge-2026-11-16.md).
//
// Her acts on a level are her habit's first attempt; when that does not solve it she then does the solve (she gets it after
// the play-out), as the judges' children did. The evidence is the first decision's either way (gradeLevel), so the repair
// moves only the band (adaptAfter) and the next level.
//
// A cell is (goal, fade, pL, the doors she takes after levels 1-3); every cell runs `seeds` sessions (child ids hb0, hb1 …,
// the same for every habit child, so they meet the same served rows). For each habit child the battery returns, per mix-up
// (kit id), the share of her sessions in which a level's row was named it (misconceptionId on a row: from one level or on a
// repeat), pooled over all her sessions, the worst fade (pooled over pL, doors and seeds) and the worst single cell.
// The per-mode tests assert on the worst fade (enough sessions that a child at 1 in 20 is not flagged by chance) and use the
// worst cell for the known failures.
//
// The rules the battery proves (dc-r8-gate2-habit-children H1, H3, H4) are on in the product; `legacy` (runBattery,
// withRules) runs the same children under the rules from before them (shared/play.ts HABIT_RULES off inside one synchronous
// run), so each mode's negative control keeps showing the failures those rules fix.
import { coverage, entryKey, seedOf, currentLevel, nextBody, afterLevelBody, nameOnRepeat, entryOfBody, basesOf, NAMING_LEVELS } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { logicFor } from "../src/play/families/index.ts";
import { mulberry32, hash32 } from "../src/play/core/rng.ts";
import { TALLY_PAD, TALLY_PAD_COLS, four, tallyFourActs, numberLineEnd } from "../src/play/families/stambh/tally.logic.ts";
import { PAD as KON_PAD, PAD_COLS as KON_PAD_COLS, padTake, placeSigOf, isAcute, opensAnticlockwise, goodPose, vertexOffPose, centreOnArmPose, initPlace, asPlaced, markFor, joinAFirst, PRINT_EVERY, norm, BW, BH } from "../src/play/families/kon/kon.place.ts";
import { asked, nameOf, corners, denotes, labelPoints, arcTargets, arcHit, angleSizes, LETTER_H, LETTER_W } from "../src/play/families/kon/kon.name.ts";
import { HABIT_RULES } from "../shared/play.ts";

export const MODES = {
  "stambh/tally": { family: "stambh", mode: "tally", goals: ["read", "keep"] },
  "kon/place": { family: "kon", mode: "place", goals: ["measure", "draw"] },
  "kon/name": { family: "kon", mode: "name", goals: ["say", "find"] },
};
export const FADES = [1, 2, 3];
/** pL: none (the class default), and low, middle, high (the band the picker serves moves with it) */
export const PLS = [undefined, 0.3, 0.6, 0.9];
/** the doors after levels 1, 2 and 3: all eight */
export const DOOR_SEQS = Array.from({ length: 8 }, (_, m) => [0, 1, 2].map((i) => ((m >> i) & 1 ? "teekha" : "garam")));
export const LINE = 0.1;
/**
 * The sweep the gate runs, and the full one (HABIT_FULL=1). Gate: every fade, pL and door sequence (96 cells a goal); two
 * sessions a cell for each habit child (192; 64 per fade), six for a random one (576; 192 per fade), and one for each
 * constant answer over two pL values (48; 16 per fade, every value). Full: ten, thirty and four sessions a cell, constants
 * over every pL.
 */
export const sweep = (env = process.env) => (env.HABIT_FULL === "1"
  ? { full: true, seeds: 10, randomSeeds: 30, constSeeds: 4, constPls: null }
  : { full: false, seeds: 2, randomSeeds: 6, constSeeds: 1, constPls: [undefined, 0.3] });

const entryOf = (family, mode, goal) => coverage().entries.find((e) => e.family === family && e.mode === mode && e.goal === goal);
const envOf = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 900, via: "touch", act }));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v)));

// ───────────────────────────── the served path, memoised ─────────────────────────────
// currentLevel and nextBody are pure in the body; the session's chance memory and the reaction history are carried through
// them untouched (nextBody spreads the body) and read by nothing that picks, so they are left out of the memo key. One part
// of the chance memory does pick (dc-r8-gate2-discriminating-level): nextBody copies the placement sightings' base
// directions into the next body (basesOf), so the next body's memo key carries them.
const LEVEL_MEMO = new Map(), NEXT_MEMO = new Map();
// (the rules in force are in every key: the steer of dc-r8-gate2-discriminating-level is one of the rules `legacy` turns off)
const keyOf = (s, e) => { const { chance: _c, hist: _h, ...rest } = s; return `${HABIT_RULES.on ? 1 : 0}|${entryKey(e)}#${JSON.stringify(rest)}`; };
function levelOf(s, e) {
  const k = keyOf(s, e);
  if (!LEVEL_MEMO.has(k)) LEVEL_MEMO.set(k, currentLevel(s, e));
  return LEVEL_MEMO.get(k);
}
function nextOf(s, e, door) {
  const bases = basesOf(s.chance);
  const k = `${door}|${keyOf(s, e)}|${JSON.stringify(bases)}`;
  if (!NEXT_MEMO.has(k)) { const b = nextBody({ ...s, chance: bases.map(({ mis, base }) => ({ mis, act: { base } })), hist: null }, e, door); delete b.up; delete b.chance; delete b.hist; NEXT_MEMO.set(k, b); }
  const b = { ...NEXT_MEMO.get(k), hist: s.hist ?? null };
  if (s.chance !== undefined) b.chance = s.chance;
  return b;
}
// the grade is pure in (level, acts): many children make the same acts on the same served level
const GRADE_MEMO = new Map();
function gradeOf(lv, acts, final) {
  const k = `${HABIT_RULES.on ? 1 : 0}|${final ? 1 : 0}|${lv.levelId}|${lv.fade}|${JSON.stringify(acts)}`;
  if (!GRADE_MEMO.has(k)) GRADE_MEMO.set(k, gradeActs(lv, envOf(acts), { final }));
  return GRADE_MEMO.get(k);
}
/**
 * The generator's candidates, memoised while the battery runs. The picker (pickLevels) calls the family's generate and then
 * scores what it returns, never changing it; generate reads, of the request, only the fields kept in the key here (stambh
 * tally reads neither recent, mis, pL, focus, harder nor n; kon reads recent (kon/name's "first name level" flag, kon/place's
 * level mix), n, bases (kon/place) and focus (kon/name's steer), never mis, pL or harder). The picker still scores every
 * candidate afresh for every body. The method is put back when the battery ends; the test "the memo changes nothing"
 * compares served sessions with and without it.
 */
const GEN_MEMO = new Map();
export function withGenMemo(fn) {
  const patched = [];
  for (const [f, m] of [["stambh", "tally"], ["kon", "place"], ["kon", "name"]]) {
    const lg = logicFor(f, m);
    if (!lg || patched.some(([x]) => x === lg)) continue;
    const orig = lg.generate;
    lg.generate = (req) => {
      const { recent, mis: _m, pL: _p, focus, harder: _h, n, ...rest } = req;
      // (of recent, kon reads only whether a name level was played and whether an acute or an anticlockwise place level was)
      const placed = (recent ?? []).map(placeSigOf).filter(Boolean);
      const k = f === "kon" ? `${HABIT_RULES.on ? 1 : 0}|${f}|${JSON.stringify(rest)}|${(recent ?? []).some((r) => String(r).startsWith("name:"))}|${placed.some(isAcute)}|${placed.some(opensAnticlockwise)}|${n ?? ""}|${focus ?? ""}` : `${f}|${JSON.stringify(rest)}`;
      if (!GEN_MEMO.has(k)) GEN_MEMO.set(k, orig(req));
      return GEN_MEMO.get(k);
    };
    patched.push([lg, orig]);
  }
  try { return fn(); } finally { for (const [lg, orig] of patched) lg.generate = orig; }
}
/**
 * The rules from before dc-r8-gate2-habit-children's H1, H3 and H4 (the negative control): `legacy` runs fn with the product's
 * HABIT_RULES switched off, synchronously, and puts it back (the switch is a test seam; nothing else writes it).
 */
export function withRules(legacy, fn) {
  if (!legacy) return fn();
  const was = HABIT_RULES.on;
  HABIT_RULES.on = false;
  try { return fn(); } finally { HABIT_RULES.on = was; }
}
export const memoSize = () => LEVEL_MEMO.size + NEXT_MEMO.size + GRADE_MEMO.size + GEN_MEMO.size;
/** drop the memos (a test file's battery holds them only while it runs) */
export function clearMemo() { LEVEL_MEMO.clear(); NEXT_MEMO.clear(); GRADE_MEMO.clear(); GEN_MEMO.clear(); }
/**
 * The generator memo changes nothing: the same sessions (served levels, rows, names) with and without it, for a careful, a
 * blind and a habit child, at every fade, two pL values and three door sequences. → { same, sessions }
 */
export function memoAgrees(modeName, goal, childIds = ["careful", "blind", "slip-random"]) {
  const M = MODES[modeName], entry = entryOf(M.family, M.mode, goal);
  const kids = childrenFor(modeName, goal).filter((c) => childIds.includes(c.id));
  const cells = FADES.flatMap((fade) => [undefined, 0.3].flatMap((pL) => [DOOR_SEQS[0], DOOR_SEQS[5], DOOR_SEQS[7]].map((doors) => ({ goal, fade, pL, doors }))));
  const run = () => cells.flatMap((cell) => kids.map((child) => runSession({ entry, cell, child, sIdx: 1 }).trace.map((t) => `${t.levelId}:${t.verdict}:${t.rows.map((r) => `${r.outcome}/${r.misconceptionId ?? ""}`).join(",")}`).join(" ")));
  clearMemo();
  const plain = run();
  clearMemo();
  const memo = withGenMemo(run);
  clearMemo();
  return { same: JSON.stringify(plain) === JSON.stringify(memo), sessions: plain.length };
}

/** what she does after a miss: clear what the goal needs cleared, then the solve */
function repairOf(lv) {
  const logic = logicFor(lv.family, lv.mode), sol = logic.solve(lv) ?? [];
  const g = lv.params?.goal;
  if (lv.family === "stambh" && g === "keep") return [{ kind: "again" }, ...sol];
  if (lv.family === "kon" && (g === "measure" || g === "draw")) return [{ kind: "free" }, ...sol];
  if (lv.family === "kon" && g === "say") return [{ kind: "clear" }, ...sol];
  return sol;
}

/**
 * One served session for one habit child. → { named: Set(kit id), levels: [{ goal, levelId, first, verdict, rows }] }
 */
export function runSession({ entry, cell, child, sIdx, levels = NAMING_LEVELS }) {
  const childId = `hb${sIdx}`;
  let e = entry;
  let s = { childId, key: entryKey(e), skillId: e.skillId, lessonId: null, classLevel: e.classLevel, fade: cell.fade, lang: "hinglish", childArt: null, lastArt: null,
    mis: {}, ...(cell.pL !== undefined ? { pL: cell.pL } : {}), n: 0, seed: seedOf(childId, entryKey(e), 0), door: "garam", recent: [], hist: null };
  const ctx = { rng: mulberry32(hash32(`${child.id}|${cell.goal}|${cell.fade}|${cell.pL}|${cell.doors.join("")}|${sIdx}`)), prev: null, i: 0, mem: {} };
  const named = new Set(), trace = [];
  for (let i = 0; i < levels; i++) {
    const lv = levelOf(s, e);
    if (!lv) break;
    ctx.i = i;
    const own = child.acts[lv.params?.goal];
    const logic = logicFor(lv.family, lv.mode);
    const mine = lv.family === entry.family && lv.mode === entry.mode;
    const first = (mine && own ? own(lv, ctx) : null) ?? logic.solve(lv);
    const g0 = gradeOf(lv, first, false);
    // after a miss: what she does once she has seen the play-out (a child who holds the mix-up may give it again: `again`),
    // then the solve
    const again = !g0?.solved && mine ? child.again?.[lv.params?.goal]?.(lv, ctx) ?? [] : [];
    const all = g0?.solved ? first : [...first, ...again, ...repairOf(lv)];
    const g = gradeOf(lv, all, true);
    const rows = nameOnRepeat(lessonEvidence(g.grade, lv), s, lv);
    for (const r of rows) if (r.misconceptionId) named.add(r.misconceptionId);
    const pick = (g.grade?.evidence ?? []).find((r) => r.chanceMis)?.chanceMis ?? null;
    trace.push({ goal: lv.params?.goal, levelId: lv.levelId, params: lv.params, first, verdict: g.grade?.verdict, firstTry: !!g0?.solved, pick, rows });
    ctx.prev = { level: lv, first, firstTry: !!g0?.solved };
    s = afterLevelBody(s, { grade: g.grade, level: lv, history: null });
    if (i < levels - 1) { const next = nextOf(s, e, cell.doors[i] ?? "garam"); e = entryOfBody(next, e); s = next; }
  }
  return { named, trace };
}

/**
 * The battery for one mode. → Promise<{ mode, seeds, goals: { [goal]: { kits: { rule: kit }, rows: [ { child, label, holds,
 *   random, constant, sessions, all: { kit: share }, worstFade: { kit: { share, at, n } }, worstCell: { kit: { share, at, n } } } ] } },
 *   ms }>. `seeds`: sessions per cell (random children get `randomSeeds`, constant answers `constSeeds` over `constPls`);
 * `pls`, `fades`, `doors`: the cells; `only`: a filter on the children; `goals`: some of the mode's goals.
 * Async: it yields between children, so in the one-process `npm test` other suites' timers keep running; the generator
 * memo is put on only while one child's sessions run (synchronously), so no other suite ever meets it. `legacy`: the rules
 * from before H1, H3 and H4 (withRules), the same way.
 */
export async function runBattery(modeName, opts = {}) {
  const { seeds = 2, randomSeeds = seeds * 3, constSeeds = seeds, constPls = null, fades = FADES, pls = PLS, doors = DOOR_SEQS, only = null, goals = null, genMemo = true, legacy = false } = opts;
  const t0 = performance.now();
  const M = MODES[modeName], out = { mode: modeName, seeds, randomSeeds, constSeeds, constPls: constPls ?? pls, goals: {} };
  for (const goal of goals ?? M.goals) {
    const entry = entryOf(M.family, M.mode, goal);
    const kits = { ...entry.misMap };
    const rows = [];
    for (const child of childrenFor(modeName, goal)) {
      if (only && !only(child)) continue;
      const run = () => childRow({ entry, goal, kits, child, n: child.random ? randomSeeds : child.constant ? constSeeds : seeds, fades, pls: child.constant && constPls ? constPls : pls, doors });
      rows.push(withRules(legacy, () => (genMemo ? withGenMemo(run) : run())));
      await new Promise((r) => setImmediate(r));
    }
    out.goals[goal] = { kits, rows };
  }
  clearMemo();
  out.ms = Math.round(performance.now() - t0);
  return out;
}
/** a cell at or over this share, for a child with no randomness in her acts, is listed in the packet (answer 3) */
export const CELL_LIST = 0.5;
function childRow({ entry, goal, kits, child, n, fades, pls, doors }) {
  const byFade = new Map(), byDoor = new Map(), byCell = new Map(), tot = new Map();
  let sessions = 0;
  const bump = (m, key, named) => { const r = m.get(key) ?? { n: 0, hit: {} }; r.n++; for (const kit of named) r.hit[kit] = (r.hit[kit] ?? 0) + 1; m.set(key, r); };
  for (const fade of fades) for (const pL of pls) for (const d of doors) {
    const cell = { goal, fade, pL, doors: d }, ck = `f${fade} pL${pL ?? "-"} ${d.map((x) => x[0]).join("")}`;
    for (let k = 0; k < n; k++) {
      const { named } = runSession({ entry, cell, child, sIdx: k });
      sessions++;
      bump(byFade, fade, named); bump(byDoor, d.map((x) => x[0]).join(""), named); bump(byCell, ck, named); bump(tot, "all", named);
    }
  }
  const worst = (m) => {
    const w = {};
    for (const kit of Object.values(kits)) for (const [key, r] of m) { const sh = (r.hit[kit] ?? 0) / r.n; if (!w[kit] || sh > w[kit].share) w[kit] = { share: sh, at: key, n: r.n }; }
    return w;
  };
  // answer 3: the cells at or over CELL_LIST, and the share of all her sessions they hold (how often such a cell is served
  // in the sweep: every fade, pL and door sequence alike)
  const listed = Object.fromEntries(Object.values(kits).map((kit) => {
    const cells = [...byCell].filter(([, r]) => (r.hit[kit] ?? 0) / r.n >= CELL_LIST);
    return [kit, { cells: cells.map(([key, r]) => `${key} (${(r.hit[kit] ?? 0)}/${r.n})`), served: cells.reduce((a, [, r]) => a + r.n, 0) / sessions }];
  }));
  const all = Object.fromEntries(Object.values(kits).map((kit) => [kit, (tot.get("all").hit[kit] ?? 0) / tot.get("all").n]));
  return { child: child.id, label: child.label, holds: child.holds ?? null, random: !!child.random, constant: !!child.constant, sessions, all, worstFade: worst(byFade), worstDoor: worst(byDoor), worstCell: worst(byCell), listed };
}

/** the rule name of a kit id in this goal's map */
const ruleOfKit = (kits, kit) => Object.keys(kits).find((r) => kits[r] === kit) ?? kit;
/**
 * The table the battery prints (each PACKET.md's "Gate 2 battery"): one line per child and mix-up it is named at all, or
 * holds; constant children are folded into one line per goal (the worst value, and how many values are named ≥ 1 in 10).
 */
export function batteryTable(res) {
  const lines = [`| goal | child | holds | mix-up | named (all sessions) | worst fade | worst door sequence | worst cell |`, `|---|---|---|---|---|---|---|---|`];
  const pct = (x) => (x === 0 ? "0" : x.toFixed(3));
  const wd = (w) => `${pct(w.share)} (${w.at}, n ${w.n})`;
  for (const [goal, G] of Object.entries(res.goals)) {
    const consts = G.rows.filter((r) => r.constant);
    for (const r of G.rows.filter((x) => !x.constant)) {
      for (const [rule, kit] of Object.entries(G.kits)) {
        const holds = r.holds && r.holds[rule];
        if (!holds && r.worstFade[kit].share === 0) continue;
        lines.push(`| ${goal} | ${r.label}${r.random ? " (random)" : ""} | ${holds ? "**holds**" : ""} | ${rule} | ${pct(r.all[kit])} (n ${r.sessions}) | ${pct(r.worstFade[kit].share)} (fade ${r.worstFade[kit].at}) | ${wd(r.worstDoor[kit])} | ${pct(r.worstCell[kit].share)} (${r.worstCell[kit].at}, n ${r.worstCell[kit].n}) |`);
      }
    }
    for (const [rule, kit] of Object.entries(G.kits)) {
      if (!consts.length) continue;
      const nonH = consts.filter((r) => !(r.holds && r.holds[rule]));
      const w = nonH.reduce((a, r) => (!a || r.worstFade[kit].share > a.worstFade[kit].share ? r : a), null);
      if (!w) continue;
      const wdoor = nonH.reduce((a, r) => (!a || r.worstDoor[kit].share > a.worstDoor[kit].share ? r : a), null);
      const over = nonH.filter((r) => r.worstFade[kit].share >= LINE || r.worstDoor[kit].share >= LINE).map((r) => r.label.replace(/^constant /, ""));
      lines.push(`| ${goal} | constant answer (${consts.length} values; worst: ${w.label}) | | ${rule} | ${pct(w.all[kit])} (n ${w.sessions}) | ${pct(w.worstFade[kit].share)} (fade ${w.worstFade[kit].at}) | ${wd(wdoor.worstDoor[kit])} (${wdoor.label}) | ${pct(w.worstCell[kit].share)} (${w.worstCell[kit].at}, n ${w.worstCell[kit].n}) |`);
      if (over.length) lines.push(`| ${goal} | constant values named ≥ 1 in 10 at some fade or door sequence | | ${rule} | ${over.join(", ")} | | | |`);
    }
  }
  const L = listedCells(res);
  lines.push("", `Children with no randomness in their acts whose worst cell is named ${CELL_LIST} or more (answer 3), with the share of her sessions such cells hold:`, "");
  if (!L.length) lines.push("none.");
  else { lines.push(`| goal | child | mix-up | worst cell | cells at or over ${CELL_LIST} (named/n) | share of her sessions in them |`, `|---|---|---|---|---|---|`); for (const x of L) lines.push(`| ${x.goal} | ${x.label} | ${x.rule} | ${pct(x.worstCell.share)} (${x.worstCell.at}, n ${x.worstCell.n}) | ${x.cells.join("; ")} | ${x.served.toFixed(3)} |`); }
  return lines.join("\n");
}
/**
 * The non-holder rows of a result whose worst fade (pooled over pL, doors and seeds) or worst door sequence (pooled over
 * fades, pL and seeds: answer 3, so one door cannot hide inside a fade) is at or over the line:
 * [{ goal, child, label, rule, share, fade, by }]
 */
export function overLine(res, line = LINE) {
  const out = [];
  for (const [goal, G] of Object.entries(res.goals)) for (const r of G.rows) for (const [rule, kit] of Object.entries(G.kits)) {
    if (r.holds && r.holds[rule]) continue;
    const w = r.worstFade[kit], d = r.worstDoor[kit];
    if (w.share >= line) out.push({ goal, child: r.child, label: r.label, rule, share: w.share, fade: w.at, by: "fade", all: r.all[kit] });
    if (d.share >= line) out.push({ goal, child: r.child, label: r.label, rule, share: d.share, fade: `doors ${d.at}`, by: "doors", all: r.all[kit] });
  }
  return out.sort((a, b) => b.share - a.share);
}
/** answer 3: the non-holder children with no randomness (not `random`) whose worst cell is at or over CELL_LIST */
export function listedCells(res) {
  const out = [];
  for (const [goal, G] of Object.entries(res.goals)) for (const r of G.rows) for (const [rule, kit] of Object.entries(G.kits)) {
    if (r.random || (r.holds && r.holds[rule]) || r.worstCell[kit].share < CELL_LIST) continue;
    out.push({ goal, child: r.child, label: r.label, rule, worstCell: r.worstCell[kit], cells: r.listed[kit].cells, served: r.listed[kit].served });
  }
  return out;
}
/** the worst non-holder share for a goal, by fade and by door sequence: { fade: { share, label, rule, at }, door: … } */
export function worstNonHolder(res, goal) {
  const G = res.goals[goal], best = { fade: null, door: null };
  for (const r of G.rows) for (const [rule, kit] of Object.entries(G.kits)) {
    if (r.holds && r.holds[rule]) continue;
    for (const [k, w] of [["fade", r.worstFade[kit]], ["door", r.worstDoor[kit]]]) if (!best[k] || w.share > best[k].share) best[k] = { share: w.share, label: r.label, rule, at: w.at };
  }
  return best;
}
/** the holder rows: [{ goal, child, label, rule, why, all, worstFade }] */
export function holders(res) {
  const out = [];
  for (const [goal, G] of Object.entries(res.goals)) for (const r of G.rows) for (const [rule, kit] of Object.entries(G.kits)) {
    if (!(r.holds && r.holds[rule])) continue;
    out.push({ goal, child: r.child, label: r.label, rule, why: r.holds[rule], all: r.all[kit], half: r.all[kit] >= 0.5 ? "named in half or more" : "named in fewer than half (reported, not failed)" });
  }
  return out;
}
export const rowOf = (res, goal, child) => res.goals[goal]?.rows.find((r) => r.child === child) ?? null;

// ───────────────────────────── the children ─────────────────────────────
// A child: { id, label, acts: { [goal]: (level, ctx) => acts | null }, holds?: { [rule]: why }, random?, constant?,
//   again?: { [goal]: (level, ctx) => acts } } (what she does after a miss, once she has seen the play-out, before the solve;
//   kon/name say, H3: the holders name it their way again, the blind guessers guess again; absent: the solve).
// ctx: { rng (seeded per session), prev: { level, first, firstTry } | null (her previous level), i (0-based), mem }.
// null from an act function: she does the solve on that level (the habit has nothing to do there).

/** a pad's key at (row, col) in a grid of `cols` (the digit keys only), or null */
const keyAtOf = (pad, cols) => (r, c) => { const i = r * cols + c; return r >= 0 && c >= 0 && c < cols && i < pad.length && /^\d$/.test(pad[i]) ? pad[i] : null; };
const posOf = (pad, cols) => (k) => { const i = pad.indexOf(k); return [Math.floor(i / cols), i % cols]; };
const DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const DIR_NAME = (d) => ({ "-1,-1": "up-left", "-1,0": "up", "-1,1": "up-right", "0,-1": "left", "0,1": "right", "1,-1": "down-left", "1,0": "down", "1,1": "down-right" })[d.join(",")];
/**
 * The typing slips, as identities she can make on every level: one key one off (each position from the left, each of the
 * eight directions on the pad's grid: no key there, no slip), two neighbouring presses swapped, one press not registered,
 * one press registered twice. `take` is the pad's own rule on the keys pressed. → [{ id, apply(v) → number | null }]
 */
function typingSlips(pad, cols, take, maxDigits) {
  const keyAt = keyAtOf(pad, cols), pos = posOf(pad, cols), out = [];
  for (let i = 0; i < maxDigits; i++) for (const d of DIRS) out.push({ id: `key ${i + 1} ${DIR_NAME(d)}`, apply: (v) => { const k = [...String(v)]; if (i >= k.length) return null; const [r, c] = pos(k[i]); const n = keyAt(r + d[0], c + d[1]); return n ? take([...k.slice(0, i), n, ...k.slice(i + 1)]) : null; } });
  for (let i = 0; i + 1 < maxDigits; i++) out.push({ id: `swap ${i + 1}-${i + 2}`, apply: (v) => { const k = [...String(v)]; if (i + 1 >= k.length || k[i] === k[i + 1]) return null; return take([...k.slice(0, i), k[i + 1], k[i], ...k.slice(i + 2)]); } });
  for (let i = 0; i < maxDigits; i++) out.push({ id: `miss ${i + 1}`, apply: (v) => { const k = [...String(v)]; if (i >= k.length) return null; return take([...k.slice(0, i), ...k.slice(i + 1)]); } });
  for (let i = 0; i < maxDigits; i++) out.push({ id: `twice ${i + 1}`, apply: (v) => { const k = [...String(v)]; if (i >= k.length) return null; return take([...k.slice(0, i + 1), k[i], ...k.slice(i + 1)]); } });
  return out;
}
/** the tally box takes two digits */
const tallyTake = (keys) => { const t = keys.slice(0, 2).join(""); return t === "" ? null : Number(t); };
const TALLY_SLIPS = typingSlips([...TALLY_PAD], TALLY_PAD_COLS, tallyTake, 2);
const KON_SLIPS = typingSlips([...KON_PAD], KON_PAD_COLS, (k) => padTake(k), 3);
const slipOr = (slip, v) => { const x = slip.apply(v); return x === null || x === undefined ? v : x; };
const pickOf = (xs, rng) => xs[Math.floor(rng() * xs.length) % xs.length];

// stambh/tally ──────────────────────────────────────────────────────────────────
/** the ways of reading a tally of b bundles and s loose lines (tally.logic.ts WAYS: the right one and seven others) */
const TALLY_WAYS = { right: [(b, s) => 5 * b + s, 1], "bundles only": [(b) => 5 * b, 1], "loose twice": [(b, s) => 5 * b + 2 * s, 1], "bundle as six": [(b, s) => 6 * b + s, 1],
  "bundles as ones": [(b) => b, 0], "groups and loose": [(b, s) => b + s, 0], "bundle as ten": [(b, s) => 10 * b + s, 0], "loose only": [(_b, s) => s, 0] };
const TALLY_COUNTING = (strokes) => ({ none: (f) => f, "a bundle skipped": (f, b, s) => f(Math.max(0, b - 1), s), "a bundle twice": (f, b, s) => f(b + 1, s),
  "a loose line missed": (f, b, s) => f(b, Math.max(0, s - 1)), "a loose line twice": (f, b, s) => f(b, s + 1),
  ...(strokes ? { "a stroke missed": (f, b, s) => f(b, s) - 1, "a stroke twice": (f, b, s) => f(b, s) + 1 } : {}) });
const readN = (lv) => lv.params.counts[0];
const readActs = (n) => [{ kind: "total", row: 0, n: clamp(n, 0, 99) }, { kind: "check" }];
const keepActsOf = (p, across, totals, rowOf = (r) => r) => {
  const acts = [], seen = p.cats.map(() => 0);
  for (const r of p.seq) { acts.push({ kind: "mark", row: rowOf(r), across: across(r, seen[r]) }); seen[r]++; }
  totals.forEach((n, r) => acts.push({ kind: "total", row: r, n: clamp(n, 0, 99) }));
  acts.push({ kind: "check" });
  return acts;
};
const rightAcross = (_r, k) => k % 5 === 4;

function tallyChildren(goal) {
  const C = [];
  const add = (id, label, acts, o = {}) => C.push({ id, label, acts: { [goal]: acts }, ...o });
  if (goal === "read") {
    add("careful", "careful (right every level)", (lv) => readActs(readN(lv)));
    add("blind", "blind guesser (0-99)", (_lv, c) => readActs(Math.floor(c.rng() * 100)), { random: true });
    // one random slip a level: a counting slip under the right way of reading, or a typing slip on the pad
    add("slip-random", "one random slip a level", (lv, c) => {
      const n = readN(lv), b = Math.floor(n / 5), s = n % 5, f = TALLY_WAYS.right[0];
      const counting = Object.entries(TALLY_COUNTING(true)).filter(([k]) => k !== "none").map(([, g]) => g(f, b, s));
      const typed = TALLY_SLIPS.map((sl) => sl.apply(n)).filter((x) => x !== null && x !== n);
      return readActs(c.rng() < 0.5 ? pickOf(counting, c.rng) : pickOf(typed.length ? typed : counting, c.rng));
    }, { random: true });
    // the same slip every level: every way of reading × every counting slip, and every typing slip on the right number
    for (const [wn, [f, strokes]] of Object.entries(TALLY_WAYS)) for (const [cn, g] of Object.entries(TALLY_COUNTING(!!strokes))) {
      if (wn === "right" && cn === "none") continue;
      add(`way:${wn}/${cn}`, `same every level: ${wn}${cn === "none" ? "" : `, ${cn}`}`, (lv) => { const n = readN(lv); return readActs(g(f, Math.floor(n / 5), n % 5)); });
    }
    for (const sl of TALLY_SLIPS) add(`typing:${sl.id}`, `same typing slip every level: ${sl.id}`, (lv) => readActs(slipOr(sl, readN(lv))));
    for (let X = 0; X <= 99; X++) add(`const:${X}`, `constant ${X}`, () => readActs(X), { constant: true });
    add("last-first", "what I typed last time (my first answer)", (lv, c) => readActs(c.prev ? c.prev.first.find((a) => a.kind === "total").n : readN(lv)));
    add("last-key", "last time's right number", (lv, c) => readActs(c.prev ? readN(c.prev.level) : readN(lv)));
    add("line-end", "the number line's end (printed after a miss)", (lv) => readActs(numberLineEnd(lv.params)));
    // the mix-up itself
    add("holder", "the mix-up: each bundle read as four", (lv) => readActs(four(readN(lv))), { holds: { "tally-four": "a bundle read as its four standing lines: the kit's first sign" } });
    add("holder-half", "the mix-up on half her levels", (lv, c) => readActs(c.rng() < 0.5 ? four(readN(lv)) : readN(lv)), { random: true, holds: { "tally-four": "holds it, shows it on half her levels" } });
    return C;
  }
  // keep
  const totalsOf = (lv) => lv.params.counts;
  add("careful", "careful (right every level)", (lv) => keepActsOf(lv.params, rightAcross, totalsOf(lv)));
  add("blind", "blind guesser (any row, any button, totals 0-99)", (lv, c) => {
    const p = lv.params;
    return keepActsOf(p, () => c.rng() < 0.5, p.counts.map(() => Math.floor(c.rng() * 100)), () => Math.floor(c.rng() * p.cats.length));
  }, { random: true });
  // keep's slips: one stroke's button the other one, one stroke in the next row, one total one off, one total mistyped
  const strokeFlip = (p, idx) => { let k = -1; return (r, kth) => { k++; return k === idx ? !rightAcross(r, kth) : rightAcross(r, kth); }; };
  add("slip-random", "one random slip a level", (lv, c) => {
    const p = lv.params, kind = Math.floor(c.rng() * 4), t = [...p.counts], row = Math.floor(c.rng() * p.cats.length);
    if (kind === 0) return keepActsOf(p, strokeFlip(p, Math.floor(c.rng() * p.seq.length)), t);
    if (kind === 1) { const idx = Math.floor(c.rng() * p.seq.length); let k = -1; return keepActsOf(p, rightAcross, t, (r) => { k++; return k === idx ? (r + 1) % p.cats.length : r; }); }
    if (kind === 2) { t[row] += c.rng() < 0.5 ? -1 : 1; return keepActsOf(p, rightAcross, t); }
    const typed = TALLY_SLIPS.map((sl) => sl.apply(t[row])).filter((x) => x !== null && x !== t[row]);
    if (typed.length) t[row] = pickOf(typed, c.rng);
    return keepActsOf(p, rightAcross, t);
  }, { random: true });
  add("flip-first", "same every level: the first stroke's button the other one", (lv) => keepActsOf(lv.params, strokeFlip(lv.params, 0), totalsOf(lv)));
  add("flip-last", "same every level: the last stroke's button the other one", (lv) => keepActsOf(lv.params, strokeFlip(lv.params, lv.params.seq.length - 1), totalsOf(lv)));
  add("cross-missed", "same every level: the first bundle's line across drawn standing", (lv) => { let done = false; return keepActsOf(lv.params, (r, k) => { if (!done && k % 5 === 4) { done = true; return false; } return rightAcross(r, k); }, totalsOf(lv)); });
  add("next-row", "same every level: the first stroke in the next row", (lv) => { let k = -1; const p = lv.params; return keepActsOf(p, rightAcross, totalsOf(lv), (r) => { k++; return k === 0 ? (r + 1) % p.cats.length : r; }); });
  for (const [d, nm] of [[1, "one more"], [-1, "one less"]]) add(`total${d}`, `same every level: the first row's total ${nm}`, (lv) => { const t = [...totalsOf(lv)]; t[0] += d; return keepActsOf(lv.params, rightAcross, t); });
  for (const sl of TALLY_SLIPS) add(`typing:${sl.id}`, `same typing slip every level (first row's total): ${sl.id}`, (lv) => { const t = [...totalsOf(lv)]; t[0] = slipOr(sl, t[0]); return keepActsOf(lv.params, rightAcross, t); });
  for (let X = 0; X <= 99; X++) add(`const:${X}`, `constant ${X} (every total)`, (lv) => keepActsOf(lv.params, rightAcross, lv.params.counts.map(() => X)), { constant: true });
  add("only-across", "only the second button (every stroke a line across)", (lv) => keepActsOf(lv.params, () => true, totalsOf(lv)));
  add("alternate", "the two buttons in turn", (lv) => { let k = 0; return keepActsOf(lv.params, () => (k++ % 2) === 1, totalsOf(lv)); });
  add("last-totals", "what I typed last time (last level's totals)", (lv, c) => {
    const prev = c.prev?.first.filter((a) => a.kind === "total").map((a) => a.n) ?? [];
    return keepActsOf(lv.params, rightAcross, lv.params.counts.map((n, r) => prev[r] ?? n));
  });
  for (const [nm, rowF] of [["first", () => 0], ["last", (p) => p.cats.length - 1], ["middle", (p) => Math.floor((p.cats.length - 1) / 2)]]) {
    add(`row-${nm}`, `every stroke in the ${nm} row (totals as drawn)`, (lv) => {
      const p = lv.params, r0 = rowF(p), t = p.cats.map((_, r) => (r === r0 ? p.seq.length : 0));
      let k = -1; return keepActsOf(p, () => (++k % 5) === 4, t, () => r0);
    });
  }
  add("holder-counted", "the mix-up: bundles drawn, each counted as four", (lv) => tallyFourActs(lv.params, "counted"), { holds: { "tally-four": "every total short by its bundles: the kit's first sign" } });
  add("holder-five", "only the first button, the standing line (five as five standing lines), totals right", (lv) => tallyFourActs(lv.params, "five"), { holds: { "tally-four": "five written as five standing lines: the kit's second sign" } });
  add("holder-plain", "five standing lines, each group read as four", (lv) => tallyFourActs(lv.params, "plain"), { holds: { "tally-four": "both signs" } });
  return C;
}

// kon/place ──────────────────────────────────────────────────────────────────
const head = (q) => [{ kind: "move", x: q.x, y: q.y }, { kind: "spin", deg: norm(Math.round(q.rot)) }, { kind: "lock" }];
/** measure: the two numbers the placed protractor prints where OB crosses its rim (outer: the rim angle; inner: 180 − it), on her pose */
function measureReads(p, q = goodPose(p)) {
  const ap = asPlaced(p, q);
  if (!ap) return null;
  const outer = Math.round(ap.r), inner = 180 - outer;
  return { outer, inner, right: Math.round(ap.value) };
}
const measureRight = (p) => p.theta;
const readAct = (n) => ({ kind: "read", n: clamp(n, 0, 180) });
/** the finger's drops that miss: the centre off by (dx, dy) board px, the turn right (eight ways × six distances) */
const DROPS = DIRS.flatMap((d) => [12, 16, 20, 24, 28, 32].map((r) => { const L = Math.hypot(d[0], d[1]); return { id: `drop ${r} ${DIR_NAME(d)}`, dx: (r * d[1]) / L, dy: (-r * d[0]) / L }; }));
const TICKS = [-10, -5, 5, 10];
/** the same drop every level, give or take a finger's wobble: the centre within JITTER board px of the habit's spot, anywhere
 *  in that disc, afresh each level (H1: a placement's value is its offset on the board, and offsets within a finger's drop
 *  of each other are one act) */
const JITTER = 4;
const JITTERED = DROPS.filter((d) => /^drop (20|24) (up|up-right)$/.test(d.id));
const wobble = (d, rng) => { const a = 2 * Math.PI * rng(), r = JITTER * Math.sqrt(rng()); return { dx: d.dx + r * Math.cos(a), dy: d.dy + r * Math.sin(a) }; };
const near = (v, every) => Math.round(v / every) * every;

function placeChildren(goal) {
  const C = [];
  const add = (id, label, acts, o = {}) => C.push({ id, label, acts: { [goal]: acts }, ...o });
  if (goal === "measure") {
    const at = (p, n) => [...head(goodPose(p)), readAct(n)];
    add("careful", "careful (right every level)", (lv) => at(lv.params, measureRight(lv.params)));
    add("blind", "blind: any placement, any number", (_lv, c) => [{ kind: "move", x: c.rng() * BW, y: c.rng() * BH }, { kind: "spin", deg: Math.floor(c.rng() * 360) }, { kind: "lock" }, readAct(Math.floor(c.rng() * 181))], { random: true });
    add("blind-number", "placed right, any number (0-180)", (lv, c) => at(lv.params, Math.floor(c.rng() * 181)), { random: true });
    add("slip-random", "one random slip a level (typing, a tick, a drop)", (lv, c) => {
      const p = lv.params, v = measureRight(p), kind = Math.floor(c.rng() * 3);
      if (kind === 0) { const xs = KON_SLIPS.map((s) => s.apply(v)).filter((x) => x !== null && x !== v); return at(p, xs.length ? pickOf(xs, c.rng) : v); }
      if (kind === 1) return at(p, v + pickOf(TICKS, c.rng));
      const d = pickOf(DROPS, c.rng), g = goodPose(p);
      return [...head({ ...g, x: g.x + d.dx, y: g.y + d.dy }), readAct(measureReads(p, { ...g, x: g.x + d.dx, y: g.y + d.dy })?.right ?? v)];
    }, { random: true });
    for (const sl of KON_SLIPS) add(`typing:${sl.id}`, `same typing slip every level: ${sl.id}`, (lv) => at(lv.params, slipOr(sl, measureRight(lv.params))));
    for (const t of TICKS) add(`tick${t}`, `same every level: a tick ${t > 0 ? "+" : ""}${t}`, (lv) => at(lv.params, measureRight(lv.params) + t));
    for (const d of DROPS) add(`drop:${d.id}`, `same every level: ${d.id} (reads what it shows)`, (lv) => {
      const p = lv.params, g = goodPose(p), q = { ...g, x: g.x + d.dx, y: g.y + d.dy };
      return [...head(q), readAct(measureReads(p, q)?.right ?? measureRight(p))];
    });
    for (const d of JITTERED) add(`wobble:${d.id}`, `same every level, give or take ${JITTER} px: ${d.id} (reads what it shows)`, (lv, c) => {
      const p = lv.params, g = goodPose(p), w = wobble(d, c.rng), q = { ...g, x: g.x + w.dx, y: g.y + w.dy };
      return [...head(q), readAct(measureReads(p, q)?.right ?? measureRight(p))];
    }, { random: true });
    // dc-r8-gate2-discriminating-level (answer 1): the fixed finger the ruling names: her centre held ON THE BOARD where the
    // bottom edge on the vertex put it on her first level, the base along the arm, every level
    add("fixed-vo", "the finger held on the board where the bottom edge sat on her first level (reads what it shows)", (lv, c) => {
      const p = lv.params, g = goodPose(p);
      c.mem.off ??= (() => { const q = vertexOffPose(p); return [q.x - p.vx, q.y - p.vy]; })();
      const q = { ...g, x: g.x + c.mem.off[0], y: g.y + c.mem.off[1] };
      return [...head(q), readAct(measureReads(p, q)?.right ?? measureRight(p))];
    });
    for (const t of [-3, -2, -1, 1, 2, 3]) add(`turn${t}`, `same every level: the turn ${t}°`, (lv) => { const p = lv.params, g = goodPose(p); return [...head({ ...g, rot: g.rot + t }), readAct(measureRight(p))]; });
    for (let X = 0; X <= 180; X++) add(`const:${X}`, `constant ${X}`, (lv) => at(lv.params, X), { constant: true });
    add("last-first", "what I typed last time (my first number)", (lv, c) => at(lv.params, c.prev ? c.prev.first.find((a) => a.kind === "read")?.n ?? measureRight(lv.params) : measureRight(lv.params)));
    add("last-key", "last time's right number", (lv, c) => at(lv.params, c.prev ? measureRight(c.prev.level.params) : measureRight(lv.params)));
    add("printed-near-right", "the printed number nearest her reading (right scale)", (lv) => at(lv.params, near(measureRight(lv.params), PRINT_EVERY[lv.params.scale])));
    add("rest", "locks it where it rests, reads what it shows", (lv) => { const p = lv.params, q = initPlace(p).pose; return [...head(q), readAct(measureReads(p, q)?.right ?? measureRight(p))]; });
    add("smaller", "the smaller of the two printed numbers", (lv) => { const r = measureReads(lv.params); return at(lv.params, r ? Math.min(r.outer, r.inner) : measureRight(lv.params)); },
      { holds: { "wrong-scale": "on every obtuse angle she gives the acute reading: one scale chosen by how the angle looks, not by the 0 on the arm (kit sign: two readings for one angle add to 180)" } });
    add("larger", "the larger of the two printed numbers", (lv) => { const r = measureReads(lv.params); return at(lv.params, r ? Math.max(r.outer, r.inner) : measureRight(lv.params)); },
      { holds: { "wrong-scale": "a reading over 90 for a narrow angle: the kit's first sign (told only on some levels: an acute angle for the larger number, one opening anticlockwise for the inner scale; a session meets one of each by its fourth level, answer 4)" } });
    add("printed-near-outer", "the printed number nearest the outer scale's reading", (lv) => { const r = measureReads(lv.params); return at(lv.params, r ? near(r.outer, PRINT_EVERY[lv.params.scale]) : measureRight(lv.params)); });
    add("printed-near-inner", "the printed number nearest the inner scale's reading", (lv) => { const r = measureReads(lv.params); return at(lv.params, r ? near(r.inner, PRINT_EVERY[lv.params.scale]) : measureRight(lv.params)); });
    add("outer", "always the outer scale", (lv) => { const r = measureReads(lv.params); return at(lv.params, r ? r.outer : measureRight(lv.params)); },
      { holds: { "wrong-scale": "always reads the outer scale: the kit's second sign" } });
    add("inner", "always the inner scale", (lv) => { const r = measureReads(lv.params); return at(lv.params, r ? r.inner : measureRight(lv.params)); },
      { holds: { "wrong-scale": "always one scale, whichever 0 is on the arm (the outer sign's mirror) (told only on some levels: an acute angle for the larger number, one opening anticlockwise for the inner scale; a session meets one of each by its fourth level, answer 4)" } });
    add("other", "the mix-up: the other scale's number", (lv) => at(lv.params, 180 - measureRight(lv.params)), { holds: { "wrong-scale": "the other scale's number on every level" } });
    add("vertex-off", "the mix-up: the bottom edge on the vertex, reads what it shows", (lv) => { const p = lv.params, q = vertexOffPose(p); return [...head(q), readAct(measureReads(p, q)?.right ?? measureRight(p))]; },
      { holds: { "vertex-off": "the bottom edge on the vertex: the kit's first sign" } });
    add("centre-on-arm", "the centre mark on A, reads what it shows", (lv) => { const p = lv.params, q = centreOnArmPose(p); return [...head(q), readAct(measureReads(p, q)?.right ?? measureRight(p))]; },
      { holds: { "centre-on-arm": "the centre mark on an arm's end (not mapped by the coverage until integration 49: never named here)" } });
    return C;
  }
  // draw
  const atD = (p, r, end = "v", q = goodPose(p)) => [...head(q), { kind: "mark", r: clamp(r, 0, 180) }, { kind: "join", end }];
  const rightMark = (p) => markFor(p, goodPose(p), p.theta);
  const firstEnd = (lv) => (joinAFirst(lv.seed) ? "e" : "v");
  add("careful", "careful (right every level)", (lv) => atD(lv.params, rightMark(lv.params)));
  add("blind", "blind: any placement, any dot, either button", (_lv, c) => [{ kind: "move", x: c.rng() * BW, y: c.rng() * BH }, { kind: "spin", deg: Math.floor(c.rng() * 360) }, { kind: "lock" }, { kind: "mark", r: Math.floor(c.rng() * 181) }, { kind: "join", end: c.rng() < 0.5 ? "v" : "e" }], { random: true });
  add("blind-dot", "placed right, any dot, either button", (lv, c) => atD(lv.params, Math.floor(c.rng() * 181), c.rng() < 0.5 ? "v" : "e"), { random: true });
  add("blind-join", "placed right, the right dot, either button", (lv, c) => atD(lv.params, rightMark(lv.params), c.rng() < 0.5 ? "v" : "e"), { random: true });
  add("slip-random", "one random slip a level (a nudge, a tick, the other button, a drop)", (lv, c) => {
    const p = lv.params, m = rightMark(p), kind = Math.floor(c.rng() * 4);
    if (kind === 0) return atD(p, m + (c.rng() < 0.5 ? -1 : 1));
    if (kind === 1) return atD(p, m + pickOf(TICKS, c.rng));
    if (kind === 2) return atD(p, m, "e");
    const d = pickOf(DROPS, c.rng), g = goodPose(p), q = { ...g, x: g.x + d.dx, y: g.y + d.dy };
    return atD(p, markFor(p, q, p.theta), "v", q);
  }, { random: true });
  for (const t of [-1, 1, ...TICKS]) add(`dot${t}`, `same every level: the dot ${t > 0 ? "+" : ""}${t} on the rim`, (lv) => atD(lv.params, rightMark(lv.params) + t));
  for (const d of DROPS) add(`drop:${d.id}`, `same every level: ${d.id}`, (lv) => { const p = lv.params, g = goodPose(p), q = { ...g, x: g.x + d.dx, y: g.y + d.dy }; return atD(p, markFor(p, q, p.theta), "v", q); });
  for (const d of JITTERED) add(`wobble:${d.id}`, `same every level, give or take ${JITTER} px: ${d.id}`, (lv, c) => { const p = lv.params, g = goodPose(p), w = wobble(d, c.rng), q = { ...g, x: g.x + w.dx, y: g.y + w.dy }; return atD(p, markFor(p, q, p.theta), "v", q); }, { random: true });
  // dc-r8-gate2-discriminating-level (answer 1): the fixed finger (as in measure)
  add("fixed-vo", "the finger held on the board where the bottom edge sat on her first level", (lv, c) => {
    const p = lv.params, g = goodPose(p);
    c.mem.off ??= (() => { const q = vertexOffPose(p); return [q.x - p.vx, q.y - p.vy]; })();
    const q = { ...g, x: g.x + c.mem.off[0], y: g.y + c.mem.off[1] };
    return atD(p, markFor(p, q, p.theta), "v", q);
  });
  for (let X = 0; X <= 180; X++) add(`const:${X}`, `constant dot ${X}`, (lv) => atD(lv.params, X), { constant: true });
  add("btn-first", "the first join button", (lv) => atD(lv.params, rightMark(lv.params), firstEnd(lv)));
  add("btn-last", "the last join button", (lv) => atD(lv.params, rightMark(lv.params), firstEnd(lv) === "e" ? "v" : "e"));
  add("btn-O", "always 'O se jodo' (right)", (lv) => atD(lv.params, rightMark(lv.params), "v"));
  add("last-dot", "what I did last time (the same dot and button)", (lv, c) => {
    if (!c.prev || c.prev.level.params.goal !== "draw") return atD(lv.params, rightMark(lv.params));
    const f = c.prev.first; return atD(lv.params, f.find((a) => a.kind === "mark")?.r ?? rightMark(lv.params), f.find((a) => a.kind === "join")?.end ?? "v");
  });
  add("last-key", "last time's right dot", (lv, c) => atD(lv.params, c.prev && c.prev.level.params.goal === "draw" ? rightMark(c.prev.level.params) : rightMark(lv.params)));
  add("printed-near", "the printed number nearest the asked size (right scale)", (lv) => atD(lv.params, markFor(lv.params, goodPose(lv.params), near(lv.params.theta, PRINT_EVERY[lv.params.scale]))));
  add("rest", "locks it where it rests, marks the asked size", (lv) => { const p = lv.params, q = initPlace(p).pose; return atD(p, markFor(p, q, p.theta), "v", q); });
  add("outer", "always the outer scale (dot where it reads the size)", (lv) => atD(lv.params, lv.params.theta), { holds: { "wrong-scale": "always reads the outer scale: the kit's second sign" } });
  add("inner", "always the inner scale", (lv) => atD(lv.params, 180 - lv.params.theta), { holds: { "wrong-scale": "always one scale, whichever 0 is on the arm (told only on some levels: an acute angle for the larger number, one opening anticlockwise for the inner scale; a session meets one of each by its fourth level, answer 4)" } });
  add("other", "the mix-up: the other scale's mark", (lv) => atD(lv.params, markFor(lv.params, goodPose(lv.params), 180 - lv.params.theta)), { holds: { "wrong-scale": "the other scale on every level" } });
  add("btn-A", "the mix-up: always 'A se jodo'", (lv) => atD(lv.params, rightMark(lv.params), "e"), { holds: { "join-wrong-end": "joins the far end on every level: the kit's first sign" } });
  add("vertex-off", "the mix-up: the bottom edge on the vertex", (lv) => { const p = lv.params, q = vertexOffPose(p); return atD(p, markFor(p, q, p.theta), "v", q); }, { holds: { "vertex-off": "the bottom edge on the vertex" } });
  return C;
}

// kon/name ──────────────────────────────────────────────────────────────────
const sayActs = (t) => [...t.map((i) => ({ kind: "letter", at: i })), { kind: "commit" }];
/** the points in reading order by where their letters are drawn: rows top to bottom or bottom to top, each row left to right
 *  or right to left; columns left to right or right to left, each top to bottom or bottom to top (kon.name.ts readingOrders) */
function readingOrders(Q) {
  const groups = (axis, tol) => {
    const idx = Q.map((_, i) => i).sort((i, j) => Q[i][axis] - Q[j][axis]), out = [];
    for (const i of idx) { const g = out[out.length - 1]; if (g && Q[i][axis] - Q[g[g.length - 1]][axis] <= tol) g.push(i); else out.push([i]); }
    return out;
  };
  const rows = groups(1, LETTER_H).reverse(), cols = groups(0, LETTER_W), orders = [];
  for (const [on, outer] of [["rows top first", rows], ["rows bottom first", [...rows].reverse()]]) for (const [dn, d] of [["left to right", 1], ["right to left", -1]]) orders.push({ id: `${on}, ${dn}`, o: outer.flatMap((g) => [...g].sort((i, j) => d * (Q[i][0] - Q[j][0]))) });
  for (const [on, outer] of [["columns left first", cols], ["columns right first", [...cols].reverse()]]) for (const [dn, d] of [["top to bottom", 1], ["bottom to top", -1]]) orders.push({ id: `${on}, ${dn}`, o: outer.flatMap((g) => [...g].sort((i, j) => d * (Q[j][1] - Q[i][1]))) });
  return orders;
}
const READ_IDS = readingOrders([[0, 0], [100, 0], [0, 100], [100, 100]]).map((x) => x.id);
/** the say slips, on the name she means (a, v, b): two taps swapped, a tap missed and its letter added last, a tap on the
 *  letter nearest the one she means, a tap registered twice */
const SAY_SLIPS = [
  { id: "swap 1-2", f: (t) => [t[1], t[0], t[2]] }, { id: "swap 2-3", f: (t) => [t[0], t[2], t[1]] }, { id: "swap 1-3", f: (t) => [t[2], t[1], t[0]] },
  ...[0, 1, 2].map((i) => ({ id: `miss ${i + 1}, added last`, f: (t) => [...t.slice(0, i), ...t.slice(i + 1), t[i]] })),
  ...[0, 1, 2].map((i) => ({ id: `the letter beside ${i + 1}`, f: (t, p) => { const L = labelPoints(p), x = t[i]; const n = [0, 1, 2, 3].filter((j) => j !== x).sort((a, b) => Math.hypot(L[a][0] - L[x][0], L[a][1] - L[x][1]) - Math.hypot(L[b][0] - L[x][0], L[b][1] - L[x][1]))[0]; return t.map((y, k) => (k === i ? n : y)); } })),
  ...[0, 1].map((i) => ({ id: `tap ${i + 1} twice`, f: (t) => [...t.slice(0, i + 1), t[i], ...t.slice(i + 1)].slice(0, 3) })),
];
function nameChildren(goal) {
  const C = [];
  const add = (id, label, acts, o = {}) => C.push({ id, label, acts: { [goal]: acts }, ...o });
  if (goal === "say") {
    const right = (p) => nameOf(asked(p));
    add("careful", "careful (right every level)", (lv) => sayActs(right(lv.params)));
    // H3: her name after the play-out (`again`, before the solve). The blind guessers guess again; a slip or a habit that is
    // not the belief is corrected once she has seen which angle her name means (the solve); the holders give the belief again
    const blind3 = (c) => { const xs = [0, 1, 2, 3]; for (let i = 3; i > 0; i--) { const j = Math.floor(c.rng() * (i + 1)); [xs[i], xs[j]] = [xs[j], xs[i]]; } return xs.slice(0, 3); };
    const anyOrder = (k, c) => { const xs = [k.a, k.v, k.b]; for (let i = 2; i > 0; i--) { const j = Math.floor(c.rng() * (i + 1)); [xs[i], xs[j]] = [xs[j], xs[i]]; } return xs; };
    const anew = (taps) => [{ kind: "clear" }, ...sayActs(taps)];
    add("blind", "blind: three different letters (and again after a miss)", (_lv, c) => sayActs(blind3(c)), { random: true, again: { say: (_lv, c) => anew(blind3(c)) } });
    const blindAny = (c) => [0, 1, 2].map(() => Math.floor(c.rng() * 4));
    add("blind-any", "blind: any three taps, repeats allowed (and again after a miss)", (_lv, c) => sayActs(blindAny(c)), { random: true, again: { say: (_lv, c) => anew(blindAny(c)) } });
    add("slip-random", "one random slip a level", (lv, c) => sayActs(pickOf(SAY_SLIPS, c.rng).f(right(lv.params), lv.params)), { random: true });
    for (const sl of SAY_SLIPS) add(`slip:${sl.id}`, `same slip every level: ${sl.id}`, (lv) => sayActs(sl.f(right(lv.params), lv.params)));
    for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) for (let d = 0; d < 4; d++) add(`const:${a}${b}${d}`, `constant taps ${a}${b}${d}`, () => sayActs([a, b, d]), { constant: true });
    add("last", "what I did last time (the same taps)", (lv, c) => sayActs(c.prev && c.prev.level.params.goal === "say" ? c.prev.first.filter((x) => x.kind === "letter").map((x) => x.at) : right(lv.params)));
    for (const [k, id] of READ_IDS.entries()) add(`read:${k}`, `reads the three letters across the screen: ${id}`, (lv) => {
      const p = lv.params, c = asked(p), three = new Set([c.a, c.v, c.b]);
      return sayActs(readingOrders(labelPoints(p))[k].o.filter((i) => three.has(i)));
    });
    for (const [nm, idx] of [["first", 0], ["last", 3], ["second", 1]]) add(`order-${nm}`, `starts at the ${nm} letter on screen (rows top first, left to right)`, (lv) => {
      const p = lv.params, o = readingOrders(labelPoints(p))[0].o, c = asked(p), three = new Set([c.a, c.v, c.b]);
      const t = [o[idx], ...o.filter((i) => three.has(i) && i !== o[idx])].slice(0, 3);
      return sayActs(t);
    });
    // (after the play-out the holders name it their way again: the vertex first with the arms the other way round, the vertex
    // last likewise, any order afresh)
    add("v-first", "the mix-up: the vertex first", (lv) => { const c = asked(lv.params); return sayActs([c.v, c.a, c.b]); },
      { holds: { "vertex-name": "the vertex first: the kit's first sign" }, again: { say: (lv) => { const c = asked(lv.params); return anew([c.v, c.b, c.a]); } } });
    add("v-last", "the mix-up: the vertex last", (lv) => { const c = asked(lv.params); return sayActs([c.a, c.b, c.v]); },
      { holds: { "vertex-name": "the vertex last" }, again: { say: (lv) => { const c = asked(lv.params); return anew([c.b, c.a, c.v]); } } });
    add("v-any", "the mix-up: any order of the three letters", (lv, c) => sayActs(anyOrder(asked(lv.params), c)),
      { random: true, holds: { "vertex-name": "any order is as good: the belief itself (2 in 3 of her names put the vertex at an end, the one after the play-out too)" }, again: { say: (lv, c) => anew(anyOrder(asked(lv.params), c)) } });
    return C;
  }
  // find
  const arc = (k) => [{ kind: "arc", at: k }];
  const targets = (p) => arcTargets(p);
  const byTarget = (p, key) => { const T = targets(p); const ks = [0, 1, 2, 3, 4].filter((k) => T[k]); return ks.sort((a, b) => key(T[a]) - key(T[b])); };
  add("careful", "careful (right every level)", (lv) => arc(lv.params.ask ?? 0));
  add("blind", "blind tap", (_lv, c) => arc(Math.floor(c.rng() * 5)), { random: true });
  const OFFS = DIRS.flatMap((d) => [16, 24, 32].map((r) => ({ id: `${r} ${DIR_NAME(d)}`, dx: (r * d[1]) / Math.hypot(...d), dy: (-r * d[0]) / Math.hypot(...d) })));
  const offTap = (p, o) => { const T = targets(p)[p.ask ?? 0]; if (!T) return p.ask ?? 0; const k = arcHit(p, T.x + o.dx, T.y + o.dy); return k >= 0 ? k : p.ask ?? 0; };
  add("slip-random", "one random slip a level (the finger off the key, 24-32 px any way)", (lv, c) => arc(offTap(lv.params, pickOf(OFFS.filter((o) => !o.id.startsWith("16")), c.rng))), { random: true });
  for (const o of OFFS) add(`off:${o.id}`, `same finger offset every level: ${o.id}`, (lv) => arc(offTap(lv.params, o)));
  for (let k = 0; k < 5; k++) add(`const:${k}`, `constant arc ${k}`, () => arc(k), { constant: true });
  add("last", "what I did last time (the same arc)", (lv, c) => arc(c.prev && c.prev.level.params.goal === "find" ? c.prev.first[0].at : lv.params.ask ?? 0));
  for (const [nm, key] of [["leftmost", (t) => t.x], ["rightmost", (t) => -t.x], ["topmost", (t) => -t.y], ["bottommost", (t) => t.y]]) add(`pos:${nm}`, `the ${nm} arc`, (lv) => arc(byTarget(lv.params, key)[0] ?? 0));
  add("pos:middle", "the middle arc, left to right", (lv) => { const o = byTarget(lv.params, (t) => t.x); return arc(o[Math.floor(o.length / 2)] ?? 0); });
  for (const [nm, f] of [["smallest", (z) => z.indexOf(Math.min(...z))], ["largest", (z) => z.indexOf(Math.max(...z))], ["middle-sized", (z) => z.indexOf([...z].sort((a, b) => a - b)[2])]]) add(`size:${nm}`, `the ${nm} angle`, (lv) => arc(f(angleSizes(lv.params))));
  add("inside-tri", "the arc at the vertex inside the triangle", (lv) => arc(lv.params.tri ?? 0));
  const atLetter = (p, which) => { const t = nameOf(asked(p), p.ord ?? 0); const k = which === "first" ? denotes(p, [t[1], t[0], t[2]]) : denotes(p, [t[0], t[2], t[1]]); return k >= 0 ? k : null; };
  add("first-letter", "the mix-up: the angle at the name's first letter", (lv) => { const k = atLetter(lv.params, "first"); return k === null ? null : arc(k); }, { holds: { "vertex-name": "puts the arc at the first letter: the kit's second sign" } });
  add("last-letter", "the mix-up: the angle at the name's last letter", (lv) => { const k = atLetter(lv.params, "last"); return k === null ? null : arc(k); }, { holds: { "vertex-name": "the vertex at the name's end" } });
  void corners;
  return C;
}

/** the battery's children for a mode's goal */
export function childrenFor(modeName, goal) {
  if (modeName === "stambh/tally") return tallyChildren(goal);
  if (modeName === "kon/place") return placeChildren(goal);
  if (modeName === "kon/name") return nameChildren(goal);
  return [];
}
