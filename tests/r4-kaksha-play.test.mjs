// K2: the Briefing's words, the Hangar colours, and the two patch requests to G1 (K-P3 the Briefing seam, K-P4 the
// Antariksh cosmetics). The rendered checks (hold / Enter / warp, the look line's truth, replayed acts identical with and
// without the colours, launch → first frame) are tests/prod/r4-kaksha-briefing.mjs on a tree with G1 + the patches.
// Run: node --test tests/r4-kaksha-play.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { recipe } from "../src/ui-v3/kaksha/play/recipe.ts";
import { cosmeticsFor } from "../src/ui-v3/kaksha/play/cosmetics.ts";

const ROOT = new URL("..", import.meta.url).pathname;
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const LEVEL = { family: "nishana", mode: "place", mal: { "whole-number-bias": "c6-m-1", "line-as-unit": "c6-m-2", "made-up-rule": "x" },
  params: { lo: 0, hi: 2, values: [{ form: "fraction", den: 3 }], goal: "place" } };
const BASE = { dress: { theme: "neela-nebula", wrapper: "mine-sweep", pace: "steady" } };
const MODEL = { dress: { theme: "laal-grah", wrapper: "beacon-rescue", pace: "steady" } };

test("recipe: every line is read from the level or the dress; nothing for missing data", () => {
  const r = recipe({ engine: "antariksh", level: LEVEL, dress: MODEL, dressFinal: true });
  assert.equal(r.title, "Antariksh");
  assert.equal(r.mode, "Beacon rescue · number line");
  assert.deepEqual(r.lines.map((l) => l.key), ["built", "checks", "params", "look"]);
  assert.match(r.lines[1].text, /bigger bottom number/); assert.match(r.lines[1].text, /whole line/);
  assert.doesNotMatch(r.lines[1].text, /made-up/, "an unknown mal-rule is left out, never guessed");
  assert.equal(r.lines[2].text, "Fractions in 3 parts, on a line from 0 to 2");
  assert.equal(r.lines[3].text, "Look: red planet · pace: steady");
  // an engine-less family, no params, no dress: the card still says only true things
  const bare = recipe({ engine: "khand", level: { family: "todo-jodo", mode: "atoms", params: {} }, dress: null, dressFinal: true });
  assert.deepEqual(bare.lines.map((l) => l.key), ["built"]);
  assert.equal(bare.mode, "");
});

test("TRUTH: the look is named only once the dress is final (the model can still replace the base dress)", () => {
  const early = recipe({ engine: "antariksh", level: LEVEL, dress: BASE, dressFinal: false });
  assert.ok(!early.lines.some((l) => l.key === "look"), "no look line before the model's dress answers");
  const final = recipe({ engine: "antariksh", level: LEVEL, dress: MODEL, dressFinal: true });
  assert.match(final.lines.find((l) => l.key === "look").text, /red planet/);
});

test("recipe lines for decimals, whole numbers and rounding", () => {
  const lv = (values, extra = {}) => ({ ...LEVEL, mal: {}, params: { lo: 0, hi: 10, values, goal: "place", ...extra } });
  assert.equal(recipe({ engine: "antariksh", level: lv([{ form: "decimal", den: 10 }]), dress: null, dressFinal: false }).lines[1].text, "Decimals on a line from 0 to 10");
  assert.equal(recipe({ engine: "antariksh", level: lv([{ form: "whole", den: 1 }]), dress: null, dressFinal: false }).lines[1].text, "Numbers on a line from 0 to 10");
  assert.equal(recipe({ engine: "antariksh", level: lv([{ form: "whole", den: 1 }], { goal: "round", to: 100 }), dress: null, dressFinal: false }).lines[1].text, "Round to the nearest 100");
  assert.match(recipe({ engine: "antariksh", level: lv([{ form: "fraction", den: 4 }, { form: "fraction", den: 3 }]), dress: null, dressFinal: false }).lines[1].text, /3 and 4 parts/);
});

test("cosmetics: only open items tint the engine; colours come from the Kaksha palette; nothing equipped → null", () => {
  const items = [{ id: "hull-thirds", kind: "hull", hue: "plasma", open: true }, { id: "trail-green", kind: "trail", hue: "secure", open: true }, { id: "trail-magnet", kind: "trail", hue: "science", open: false }];
  assert.deepEqual(cosmeticsFor({ hull: "hull-thirds", trail: "trail-green" }, items), { hull: 0x3ee6ff, trail: 0x7cf5b5 });
  assert.deepEqual(cosmeticsFor({ trail: "trail-magnet" }, items), null, "a stale device choice for an unopened part never shows");
  assert.deepEqual(cosmeticsFor({ hull: "trail-green" }, items), null, "an item only fills its own slot");
  assert.equal(cosmeticsFor({}, items), null);
});

test("Briefing: no clock races the child, no score, no lock; hold 650 ms, Enter launches, reduced motion presses", () => {
  const s = read("src/ui-v3/kaksha/play/Briefing.tsx");
  assert.match(s, /HOLD_MS = 650, DRAIN_MS = 220, WARP_MS = 950, FADE_MS = 200/);
  assert.match(s, /if \(e\.key === "Enter" \|\| e\.key === " "\) \{ e\.preventDefault\(\); go\(\); \}/);
  assert.match(s, /if \(p\.reducedMotion\) return go\(\);/);
  assert.doesNotMatch(s, /Math\.random|Date\.now/, "the warp is the same every time");
  for (const f of ["src/ui-v3/kaksha/play/Briefing.tsx", "src/ui-v3/kaksha/play/recipe.ts", "src/ui-v3/kaksha/play/cosmetics.ts"]) {
    assert.doesNotMatch(read(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, ""), /\b(points?|coins?|xp|streaks?|score|level[- ]?up|countdown)\b/i, f);
  }
});

test("K-P3 (patch to G1): the Briefing fronts only an engine that will really mount; one model-dress fetch; no act path", () => {
  const d = read("docs/design/round4/build/kaksha/patches/03-play-briefing-seam.diff");
  // the product files of the patch (the dev page in it stubs the play API on purpose)
  const product = d.split(/^(?=diff --git )/m).filter((sec) => !/^diff --git a\/src\/ui-v3\/kaksha\/dev\//.test(sec)).join("");
  const added = product.split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++")).map((l) => l.replace(/\/\*.*?\*\/|\/\/.*$/g, "")).join("\n");
  assert.match(added, /const tier2d = force\?\.render !== "3d" && tierIs2d;/, "no Briefing on a 2D-tier device (the board twin plays there)");
  assert.match(added, /!briefing \|\| state\.render2d \|\| tier2d \|\| !state\.dress \? null : \(engineFor\(/, "nor under the server's 2D switch, nor for a 2D-only law");
  assert.match(added, /dressReply=\{pre\?\.reply\}/, "the dress fetched during the card is the one PlaySession uses");
  assert.match(added, /\(p\.dressReply \?\? playApi\.dress\(/, "PlaySession fetches only when nothing was fetched for it");
  assert.doesNotMatch(added, /playApi\.act|onToken|grade/i, "the seam never touches acts, tokens or grades");
  assert.ok(!/^\+\+\+ b\/(server|src\/play\/families|src\/play\/core)\//m.test(d), "no law, generator or server file in the patch");
});

test("K-P4 (patch to G1): the Hangar colours reach only the craft's materials and its exhaust puff colour", () => {
  const d = read("docs/design/round4/build/kaksha/patches/04-antariksh-cosmetics.diff");
  assert.ok(!/^\+\+\+ b\/(server|src\/play\/families|src\/play\/core)\//m.test(d), "no law, generator or server file");
  const added = d.split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++"));
  const uses = added.filter((l) => /cosmetics/.test(l) && !/^\+\s*(\/\/|\/\*|\*)/.test(l));
  for (const l of uses) assert.match(l, /cosmetics\?: PlayCosmetics|import type \{ PlayCosmetics \}|function cosmetics\(|cosmetics, lineGroup|W\.cosmetics\(spec\.cosmetics\)|spec\.cosmetics\?\.trail \?\? T\.glow/, l);
  assert.ok(added.some((l) => /hullMat\.color\.setHex\(c\?\.hull \?\? 0xdfe4f2\)/.test(l)) && added.some((l) => /color\.setHex\(c\?\.trail \?\? 0x8fd8ff\)/.test(l)), "colour setters only, with the craft's own colours as the default");
});
