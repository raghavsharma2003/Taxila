// The teacher's micro-reaction for one play post (DESIGN.md §5): the authored bank, the shared deterministic picker, and
// on top of the play guard (shared/play.ts reactionProblems) the lesson's own never-rules floor over the TEACHER's words
// (server/director/safety.js floorViolations) and a scanSafety pass. A line that trips anything is skipped, never edited.
// The hidden values (the level's key: the answer the child has not produced yet) may never be spoken.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pickReaction, newHistory } from "../../src/play/core/react.ts";
import { floorViolations, scanSafety } from "../director/safety.js";
import { gcd, lcm } from "../../src/play/core/rat.ts";
import { nazariyaHidden } from "../../src/play/families/nazariya/index.ts";
import { stambhHidden } from "../../src/play/families/stambh/stambh.logic.ts";
import { pendulumHidden } from "../../src/play/families/yantra/pendulum.logic.ts";
import { openingOf } from "../../src/play/families/kon/kon.logic.ts";
import { angle2 } from "../../src/play/families/kon/kon.lines.ts";
import { hopValue } from "../../src/play/families/nishana/line.logic.ts";
import { weighHidden } from "../../src/play/families/taraazu/weigh.logic.ts";
import { kaalHidden } from "../../src/play/families/kaal/kaal.logic.ts";
import { vakyaHidden } from "../../src/play/families/vakya/vakya.logic.ts";
import { kilaHidden } from "../../src/play/families/kila/kila.logic.ts";
import { ghadiHidden } from "../../src/play/families/ghadi/ghadi.logic.ts";
import { nakshaHidden } from "../../src/play/families/naksha/naksha.logic.ts";
import { darpanHidden } from "../../src/play/families/darpan/darpan.logic.ts";
import { tileHidden } from "../../src/play/families/darpan/tile.logic.ts";
import { feetaHidden } from "../../src/play/families/feeta/feeta.logic.ts";
import { naapHidden, NAAP_MODES } from "../../src/play/families/feeta/naap.logic.ts";
import { kramHidden } from "../../src/play/families/kram/kram.logic.ts";
import { gunaHidden } from "../../src/play/families/guna/guna.logic.ts";
import { hissaHidden } from "../../src/play/families/hissa/hissa.logic.ts";
import { koshtakHidden } from "../../src/play/families/koshtak/koshtak.logic.ts";
import { parkarHidden } from "../../src/play/families/parkar/parkar.logic.ts";
import { aankdeHidden } from "../../src/play/families/aankde/aankde.logic.ts";
import { paheliHidden } from "../../src/play/families/paheli/paheli.logic.ts";
import { galtiHidden } from "../../src/play/families/galti-pakdo/galti.logic.ts";
import { chhaanoHidden } from "../../src/play/families/chhaano/chhaano.logic.ts";
import { gatiHidden } from "../../src/play/families/gati/gati.logic.ts";
import { chumbakHidden, CHUMBAK_MODES } from "../../src/play/families/kyun-lab/chumbak.logic.ts";
import { bhaapHidden } from "../../src/play/families/bhaap/bhaap.logic.ts";
import { aakashHidden } from "../../src/play/families/aakash/aakash.logic.ts";
import { rangHidden } from "../../src/play/families/rang/rang.logic.ts";
import { badlaavHidden } from "../../src/play/families/badlaav/badlaav.logic.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
let BANK = null;
/**
 * data/play/reactions.json plus every data/play/reactions/<name>.json (S0.3: one file per family or engine, so lanes add
 * lines without editing a shared file). A split file holds `{ family: { <id>: … } }` and / or `{ engine: { <id>: … } }`;
 * an id may not be defined twice (a merge never silently overwrites another lane's lines).
 */
export function bank() {
  if (BANK) return BANK;
  const b = JSON.parse(readFileSync(join(ROOT, "data/play/reactions.json"), "utf8"));
  b.family ??= {}; b.engine ??= {};
  const dir = join(ROOT, "data/play/reactions");
  if (existsSync(dir)) for (const f of readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
    const part = JSON.parse(readFileSync(join(dir, f), "utf8"));
    for (const key of ["family", "engine"]) for (const [id, lines] of Object.entries(part[key] ?? {})) {
      if (b[key][id]) throw new Error(`data/play/reactions/${f}: ${key} ${id} is already defined`);
      b[key][id] = lines;
    }
  }
  BANK = b;
  return BANK;
}

/** Values a line must not say aloud before the child produces them (per family; the server knows the key). */
export function hiddenOf(level) {
  const p = level.params ?? {};
  // r7 kaal: the event's year (and, in a century goal, its century) is never said before the child places it. Checked by
  // family first: kaal's modes ("place", "order") share names with nishana's
  if (level.family === "kaal") return kaalHidden(level);
  // r7 kila: the squares to net, the trap square (the LCM) and the towers to build (the factors) before the child sets them
  if (level.family === "kila") return kilaHidden(level);
  // r7 naksha: the route's run lengths, the fuel, the pump's cm and the plan's side lengths before the child produces them
  if (level.family === "naksha") return nakshaHidden(level);
  // r7 ghadi: the time / trip length / date the child must produce (the minute hand's number, the arrival, the ticket, the
  // flag's date, the winner's bib) is never said first. Checked by family first: ghadi's "set" and "run" are shared names
  if (level.family === "ghadi") return ghadiHidden(level);
  // r7 darpan: the count of mirror lines, the smallest turn (degrees and the fraction) and the order before the child finds them
  // r7 tilings2: the gap to fill and how many copies close the corner
  if (level.family === "darpan") return level.mode === "tile" ? tileHidden(level) : darpanHidden(level);
  // r7 feeta: the length / perimeter / metres the child must produce and the nearest route are never said first. Checked by
  // family first: feeta's "compare" is also nishana's mode name
  // r7 naap (feeta's science modes): the curve's cm and the road's km, the water's reading, the eraser's length, the
  // foot-rulers, the children's tenths and the jobs' temperatures the child is to know
  if (level.family === "feeta") return NAAP_MODES.includes(level.mode) ? naapHidden(level) : feetaHidden(level);
  // r7 guna: the product (or the estimate), the quotient and its leftover, a story's answer are never said first. Checked by
  // family first: modes may share names with other families
  if (level.family === "guna") return gunaHidden(level);
  // r7 kram: the next / far count, the list's next numbers and its step, the rule (and its far output), the rhythm count and
  // the square the pieces fill are never said first. Checked by family first: kram's goal names are its own, its modes too
  if (level.family === "kram") return kramHidden(level);
  // r7 hissa: the product, the quotient (and its part-cup), the slid number, the second spend and the scaled amount are never
  // said first. Checked by family first: "story" is also guna's mode name
  if (level.family === "hissa") return hissaHidden(level);
  // r7 koshtak: the row's worth, the lid's run of numbers, the bracket's worth and its opened row, the simplest form are
  // never said first. Checked by family first: modes may share names with other families
  if (level.family === "koshtak") return koshtakHidden(level);
  // r7 parkar: the parts a construction fixes that the card does not give (the third side, the angle, the stick, the half
  // length or angle, the altitude) are never said first. Checked by family first: modes may share names with other families
  if (level.family === "parkar") return parkarHidden(level);
  // r7 aankde: each row's count, the lost row's count, the size sold most, the towers' level (the mean) and the median are
  // never said first. Checked by family first: modes may share names with other families ("line")
  if (level.family === "aankde") return aankdeHidden(level);
  // r7 paheli: the bags that make the load, the magic sum and the centre, the cracked digits, the starts that reach the
  // palindrome are never said first. Checked by family first: modes may share names with other families
  if (level.family === "paheli") return paheliHidden(level);
  // r7 galti-pakdo: whether the working is all correct, the first wrong line, the mended line and the true x are never said
  // first. Checked by family first: modes may share names with other families
  if (level.family === "galti-pakdo") return galtiHidden(level);
  // r7 chhaano: the methods the mixture needs (and, when it winnows, where the grain falls) are never said first. Checked
  // by family first: modes may share names with other families
  if (level.family === "chhaano") return chhaanoHidden(level);
  // r7 gati: the speed a trip makes and the m/s a speedometer reading is are never said first. Checked by family first
  if (level.family === "gati") return gatiHidden(level);
  // r7 chumbak (kyun-lab's magnet modes): the pole spots, the carriages to turn, the magnet bar, the new poles at a break,
  // the stronger magnet and its pins, the landmark's direction are never said first. Checked by family first
  if (level.family === "kyun-lab" && CHUMBAK_MODES.includes(level.mode)) return chumbakHidden(level);
  // r7 bhaap: the tools a process needs (and, for a device, where it goes) are never said first. Checked by family first
  if (level.family === "bhaap") return bhaapHidden(level);
  // r7 aakash: the words that give the idea away (the Earth turns west to east, once round is a year, tilted towards, in
  // line) are never said first. Checked by family first
  if (level.family === "aakash") return aakashHidden(level);
  // r7 rang: the words that give the idea away (which colour means what, extra base turns green, each use's own base) are
  // never said first. Checked by family first
  if (level.family === "rang") return rangHidden(level);
  // r7 badlaav: the words that give the idea away (a new substance, it cannot be reversed, dissolving needs no heat, oxygen,
  // where the burnt fuel went, rust needs water) are never said first. Checked by family first
  if (level.family === "badlaav") return badlaavHidden(level);
  switch (level.mode) {
    case "equation": return [p.x];
    case "equality": return [p.x];
    case "atoms": return p.goal === "hcf" ? [gcd(p.n, p.m)] : p.goal === "lcm" ? [lcm(p.n, p.m)] : [];
    case "bundles": return [p.a - p.b];
    case "place": case "compare": return [];
    case "views": case "array": case "floor": case "powers": case "mirror": return nazariyaHidden(level);   // r4-khand
    case "tri": case "solid": return nazariyaHidden(level);   // r7 nazariya2: the cloth's area; how many faces / edges / corners
    case "bars": case "picto": return stambhHidden(level);   // round 7: the diff bar's value
    // r7: answers the law computes from what the child is told (never what is on screen as given)
    case "pair": case "close": return [openingOf(p)];        // ∠COB = 180 − ∠AOC; ∠B from the angle sum / isosceles
    case "cross": return [Math.round(angle2(p))];             // r7 kon2: the reading ∠2 must show (equal to ∠1, or 180° − ∠1)
    case "hop": return p.hop ? [hopValue(p.hop)] : [];        // where the hop lands
    case "pendulum": return pendulumHidden(level);           // the thread lengths that keep the beat
    case "weigh": case "fill": return weighHidden(level);    // round 7: the label in grams / ml
    case "rail": return vakyaHidden(level);                  // r7 vakya: the key sentence and its words, before the child builds them
    default: return [];
  }
}
/** A line passes the lesson floor: no never-rule family, and scanSafety finds nothing in it. */
export function floorOk(text) {
  try {
    if (floorViolations(text).length) return false;
    return !scanSafety(text).distress;
  } catch { return false; }
}

/**
 * @param {import("../../shared/play.ts").Moment[]} moments
 * @param {{ lang: string, level: any, solved?: boolean, engine?: string|null, history?: { used: string[], lastAt: number, count: number }, nowS: number }} o
 * @returns {{ reaction: any, history: { used: string[], lastAt: number, count: number } }}
 */
export function reactionFor(moments, o) {
  const h = newHistory();
  if (o.history) { for (const u of o.history.used ?? []) h.used.add(u); h.lastAt = o.history.lastAt ?? -1e9; h.count = o.history.count ?? 0; }
  const reaction = pickReaction(bank(), moments, { lang: o.lang, family: o.level.family, mode: o.level.mode, goal: o.level.goal, engine: o.engine ?? null, seed: o.level.levelId, hist: h, nowS: o.nowS, hidden: o.solved ? [] : hiddenOf(o.level), extraCheck: floorOk });
  return { reaction, history: { used: [...h.used].slice(-40), lastAt: h.lastAt, count: h.count } };
}
