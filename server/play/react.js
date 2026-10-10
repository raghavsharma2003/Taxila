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
  switch (level.mode) {
    case "equation": return [p.x];
    case "equality": return [p.x];
    case "atoms": return p.goal === "hcf" ? [gcd(p.n, p.m)] : p.goal === "lcm" ? [lcm(p.n, p.m)] : [];
    case "bundles": return [p.a - p.b];
    case "place": case "compare": return [];
    case "views": case "array": case "floor": case "powers": case "mirror": return nazariyaHidden(level);   // r4-khand
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
 * @param {{ lang: string, level: any, solved?: boolean, history?: { used: string[], lastAt: number, count: number }, nowS: number }} o
 * @returns {{ reaction: any, history: { used: string[], lastAt: number, count: number } }}
 */
export function reactionFor(moments, o) {
  const h = newHistory();
  if (o.history) { for (const u of o.history.used ?? []) h.used.add(u); h.lastAt = o.history.lastAt ?? -1e9; h.count = o.history.count ?? 0; }
  const reaction = pickReaction(bank(), moments, { lang: o.lang, family: o.level.family, mode: o.level.mode, goal: o.level.goal, seed: o.level.levelId, hist: h, nowS: o.nowS, hidden: o.solved ? [] : hiddenOf(o.level), extraCheck: floorOk });
  return { reaction, history: { used: [...h.used].slice(-40), lastAt: h.lastAt, count: h.count } };
}
