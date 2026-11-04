// r7 games · Yantra (E6), the core3d@1 engine over the beam law (src/play/engines/yantra). What this pins:
//   - the registry mounts it for (yantra, beam) only, and the 2D beam view stays the board twin (viewFor still answers);
//   - the engine module exports `create` (loaded through Vite's module graph, as the app's dynamic import loads it);
//   - its themes are the art pack the dress validator, the base dress and the kaksha recipe all know;
//   - the economy lint holds over its files (no Math.random, no clock, no timers, no storage, traced progress writes);
//   - its pure geometry places the law's own trace points and turns a mirror in the level's step (never its own physics).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ENGINE_ENTRIES, engineFor } from "../src/play/engines/registry.ts";
import { ENGINES, ENGINE_THEMES, validateDelta, dressFor } from "../src/play/engines/core3d/api.ts";
import { baseDress } from "../src/play/engines/core3d/dress.ts";
import { logicFor } from "../src/play/families/index.ts";
import { pickLevels } from "../src/play/core/pick.ts";
import { trace } from "../src/play/families/yantra/beam.logic.ts";
import { beamTimeline, cellAt, dragTurn, freeCell, headingOf, timeAt, toBoard, toWorld } from "../src/play/engines/yantra/geom.ts";

const ROOT = new URL("..", import.meta.url).pathname;
const DIR = join(ROOT, "src/play/engines/yantra");
const FILES = readdirSync(DIR).filter((f) => /\.(ts|tsx)$/.test(f)).map((f) => join(DIR, f));
const code = (f) => readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").split("\n").map((l) => l.replace(/\/\/.*$/, "")).join("\n");

test("registry · engineFor(yantra, beam) is the Yantra entry; circuit and pendulum stay 2D; the 2D beam view stays the twin", async () => {
  const e = engineFor("yantra", "beam");
  assert.ok(e, "an engine renders the beam law");
  assert.equal(e.id, "yantra");
  assert.deepEqual(e.renders, [{ family: "yantra", mode: "beam" }]);
  assert.equal(engineFor("yantra", "beam", "route"), e);
  assert.equal(engineFor("yantra", "beam", "periscope"), e);
  assert.equal(engineFor("yantra", "circuit"), null);
  assert.equal(engineFor("yantra", "pendulum"), null);
  assert.equal(ENGINE_ENTRIES.filter((x) => x.id === "yantra").length, 1);
  assert.ok(ENGINES.includes("yantra"));
  assert.match(readFileSync(join(ROOT, "src/play/engines/registry.ts"), "utf8"), /load: \(\) => import\("\.\/yantra\/index\.ts"\)/);
  // the board twin: the family index still has the 2D beam view
  assert.match(readFileSync(join(ROOT, "src/play/families/index.ts"), "utf8"), /beam/);
});

test("engine module · index.ts exports create (through Vite's module graph, as the app loads the chunk)", async () => {
  assert.match(readFileSync(join(DIR, "index.ts"), "utf8"), /export \{ create \} from "\.\/engine\.ts"/);
  const { createServer } = await import("vite");
  const server = await createServer({ root: ROOT, logLevel: "error", appType: "custom", server: { middlewareMode: true, hmr: false } });
  try {
    const mod = await server.ssrLoadModule("/src/play/engines/yantra/index.ts");
    assert.equal(typeof mod.create, "function");
    assert.equal(mod.create.length, 2, "create(core, deps)");
  } finally { await server.close(); }
});

test("themes · lab, rooftop, bench: listed for the engine, validated as a dress, rotated by the base dress, named by the recipe", () => {
  assert.deepEqual([...ENGINE_THEMES.yantra], ["lab", "rooftop", "bench"]);
  for (const theme of ENGINE_THEMES.yantra) {
    assert.deepEqual(validateDelta("yantra", { theme }), { theme });
    assert.deepEqual(validateDelta("antariksh", { theme }), {}, "a Yantra theme is not another engine's");
    const d = dressFor({ engine: "yantra", base: { theme, wrapper: "beacon-rescue", music: "calm", pace: "steady", teacherMove: "notice", lang: "en" }, delta: { theme }, classLevel: 7, secure: false, childMusicOn: false, lessonLang: "en", verb: "fire" });
    assert.equal(d.dress.theme, theme);
  }
  assert.deepEqual(validateDelta("yantra", { theme: "mitti" }), {});
  assert.deepEqual(validateDelta("yantra", { theme: "Lab" }), {}, "dropped, never repaired");
  const seen = new Set(Array.from({ length: 6 }, (_, n) => baseDress({ engine: "yantra", key: "c7-science-ch11-t03-s3", n, lang: "hinglish" }).theme));
  assert.deepEqual([...seen].sort(), ["bench", "lab", "rooftop"]);
  // the engine's own palette and the shell's words know the same three
  const pal = readFileSync(join(DIR, "palette.ts"), "utf8");
  assert.match(pal, /YANTRA_THEMES: readonly YantraTheme\[\] = \["lab", "rooftop", "bench"\]/);
  const recipe = readFileSync(join(ROOT, "src/ui-v3/kaksha/play/recipe.ts"), "utf8"), copy = readFileSync(join(ROOT, "src/ui-v3/kaksha/copy.ts"), "utf8");
  assert.match(recipe, /yantra: "engYantra"/);
  for (const [t, k] of [["lab", "themeLab"], ["rooftop", "themeRooftop"], ["bench", "themeBench"]]) { assert.match(recipe, new RegExp(`${t}: "${k}"`)); assert.match(copy, new RegExp(`${k}: K\\(`)); }
});

test("economy lint · the Yantra engine: no Math.random, no clock, no timers, no storage, no economy words, traced progress", () => {
  assert.ok(FILES.length >= 6, "the lint sees the engine's files");
  const all = FILES.map((f) => [f.slice(ROOT.length), code(f)]);
  for (const [f, c] of all) {
    assert.doesNotMatch(c, /\bMath\.random\b|getRandomValues|randomUUID/, `${f}: randomness (cosmetics use core.cosmeticRandom)`);
    assert.doesNotMatch(c, /\b(Date\.now|new Date\b|performance\.now)/, `${f}: a wall clock`);
    assert.doesNotMatch(c, /\b(setTimeout|setInterval|requestIdleCallback)\b/, `${f}: a timer`);
    assert.doesNotMatch(c, /\b(localStorage|sessionStorage|indexedDB|document\.cookie)\b/, `${f}: persisted state`);
    for (const m of c.matchAll(/progress\.set\(([^)]*)\)/g)) assert.match(m[1], /\{\s*(act|moment|level)\s*:/, `${f}: an untraced progress write`);
    for (const m of c.matchAll(/(["'`])((?:\\.|(?!\1)[^\\])*)\1/g)) assert.doesNotMatch(m[2], /\b(points?|coins?|streaks?|lives|rewards?|leaderboard|bonus|unlock(ed)?|hurry|jaldi|game over)\b/i, `${f}: an economy word "${m[2]}"`);
  }
  const words = JSON.stringify(JSON.parse(readFileSync(join(DIR, "copy.json"), "utf8")).hint);
  assert.doesNotMatch(words, /\b(points?|coins?|streaks?|rewards?|shabash|great|well done|wrong|galat)\b/i, "hints: how to act, never a verdict or praise");
  // the engine animates the law's trace: it imports trace() and draws no beam of its own
  const engine = code(join(DIR, "engine.ts")), scene = code(join(DIR, "scene.ts"));
  assert.match(engine, /scene\.shoot\(trace\(p, s\.placed\)\)/);
  assert.doesNotMatch(scene, /reflect\(|2 \* r - d/, "no reflection maths in the scene");
  // every child decision is a law act through the controller
  assert.match(engine, /ctl\.dispatch\(a\)/);
  assert.doesNotMatch(engine, /ctl\.state\s*=|\.placed\.push\(|\.placed\s*=/, "the engine never writes the law's state");
});

test("geometry · the law's trace points land on the bench where the board says, and a drag turns in the level's step", () => {
  const logic = logicFor("yantra", "beam");
  let checked = 0;
  for (const goal of ["route", "periscope"]) for (const seed of [1, 4, 9]) {
    const r = pickLevels(logic, { family: "yantra", mode: "beam", topicId: "t", skillId: "s", classLevel: 7, fade: 1, goal, mis: {}, misMap: {}, grammar: {}, recent: [], seed });
    const p = r.garam.params, tr = trace(p, p.sol);
    assert.ok(tr.hit);
    for (const [x, y] of tr.points) { const w = toWorld(p, x, y), b = toBoard(p, w.x, w.z); assert.ok(Math.abs(b.x - x) < 1e-9 && Math.abs(b.y - y) < 1e-9); }
    // each solution mirror's cell is found under its centre, and it was a free cell for a tap
    for (const m of p.sol) { const w = toWorld(p, m.x + 0.5, m.y + 0.5); assert.deepEqual(cellAt(p, w.x, w.z), { x: m.x, y: m.y }); assert.ok(freeCell(p, [], m.x, m.y)); }
    assert.ok(!freeCell(p, [], p.lamp.x, p.lamp.y)); for (const w of p.walls) assert.ok(!freeCell(p, [], w.x, w.y));
    // the draw-out reaches every point in order, and ends on the law's last point
    const tl = beamTimeline(tr.points);
    for (let i = 1; i < tr.points.length; i++) assert.ok(timeAt(tl, i) >= timeAt(tl, i - 1));
    assert.equal(timeAt(tl, tr.points.length - 1), tl.dur);
    assert.ok(tl.dur >= 0.55 && tl.dur <= 1.6);
    checked++;
  }
  assert.equal(checked, 6);
  // headings: 0 = +x, 90 = away from the child (−z), as the law's 90 = up the board
  assert.equal(Math.round(headingOf(1, 0)), 0); assert.equal(Math.round(headingOf(0, -1)), 90); assert.equal(Math.round(headingOf(-1, 0)), 180);
  // a quarter turn of the finger turns a 45°-step mirror from 0 to 90; small wobbles stay on the step; r and r+180 are one line
  assert.equal(dragTurn(0, 0, 90, 45), 90);
  assert.equal(dragTurn(0, 10, 25, 45), 0);
  assert.equal(dragTurn(45, 350, 20, 15), 75);
  assert.equal(dragTurn(135, 0, 90, 45), 45);
  for (let a = 0; a < 360; a += 7) { const r = dragTurn(30, 0, a, 15); assert.ok(r >= 0 && r < 180 && r % 15 === 0); }
});
