// r7 Games: kit units carry {friendF}/{friendM}/{friend} slots (Learning, round 7). data/arena and data/play/vakya are built
// from the kits and keep the slot text; the play serve path fills every child-visible string at serve time
// (server/director/friend.js), with a name that is never the child's own. These tests hold that: no served string — start,
// level, act doors, next — contains "{friend", and the filled level still grades (the server regenerates it per route).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { arenaItems, vakyaItems, currentLevel, entryFor, nextBody } from "../server/play/levels.js";
import { startSession } from "../server/play/start.js";
import { gradeActs } from "../server/play/grade.js";
import { logicFor } from "../src/play/families/index.ts";
import { env } from "../src/play/core/pick.ts";

const cov = JSON.parse(readFileSync(new URL("../data/play/coverage.json", import.meta.url), "utf8"));
const entries = Object.entries(cov.skills ?? {}).filter(([, e]) => (e.family === "arena" || e.family === "vakya") && e.grammar?.bank).map(([skillId]) => entryFor({ skillId })).filter(Boolean);

// put a slot into every string of a bank item (the cached objects the generator reads), as a slotted kit would
function slot(items) {
  const walk = (o) => { for (const [k, v] of Object.entries(o)) { if (typeof v === "string" && /\s/.test(v)) o[k] = `{friendF} ${v} {friendM}`; else if (v && typeof v === "object") walk(v); } };
  items.forEach(walk);
}
const has = (x) => JSON.stringify(x).includes("{friend");

test("the arena and vakya banks keep slots at rest and every served level is filled, never with the child's name", async () => {
  const picked = [entries.find((e) => e.family === "arena"), entries.find((e) => e.family === "vakya")].filter(Boolean);
  assert.equal(picked.length, 2, "an arena and a vakya entry exist");
  let checked = 0;
  for (const e of picked) {
    const items = (e.family === "arena" ? arenaItems : vakyaItems)(e.grammar.bank, e.topicId);
    assert.ok(items.length, `${e.topicId} has bank items`);
    slot(items);
    assert.ok(has(items), "the bank (as built) carries the slot text");
    for (const name of ["Zoya", "Kabir", ""]) {
      const r = await startSession({ id: `t-friend-${name || "anon"}`, class_level: e.classLevel, first_name: name }, { topicId: e.topicId, skillId: e.skillId });
      assert.ok(r, `${e.topicId} starts`);
      if (!has(levelsRaw(r.session, e))) continue;   // this level drew no slotted string (the generator may not use every field)
      checked++;
      assert.ok(!has(r.level), `${e.topicId}: the served level has no {friend slot`);
      if (name) assert.ok(!JSON.stringify(r.level).includes(name), `${e.topicId}: the friend is never the child (${name})`);
      for (const door of ["garam", "teekha"]) assert.ok(!has(currentLevel(nextBody(r.session, e, door), e, name) ?? {}), `${door} door filled`);
      const logic = logicFor(r.level.family, r.level.mode);
      assert.equal(typeof logic?.solve, "function");
      assert.equal(gradeActs(r.level, env(logic.solve(r.level)), { final: true })?.grade?.verdict, "solved", `${e.topicId}: the filled level still grades solved`);
    }
  }
  assert.ok(checked >= 4, `slotted levels were served and checked (${checked})`);
});
// the level as generated, before the fill (the slot must have reached it for the fill to be tested)
import { levelsFor } from "../server/play/levels.js";
function levelsRaw(s, e) { const r = levelsFor(s, e); return s.door === "teekha" && r?.teekha ? r.teekha : r?.garam; }

test("every play route passes the child's name to the serve fill", () => {
  const src = readFileSync(new URL("../server/play/routes.js", import.meta.url), "utf8");
  const lines = src.split("\n").filter((l) => l.includes("currentLevel(") && !l.startsWith("import"));
  assert.ok(lines.length >= 5);
  for (const l of lines) for (const c of l.split("currentLevel(").slice(1)) assert.match(c, /^(nextBody\([^)]*\)|\w+), entry, (name|child\?\.first_name)\)/, `${l.trim()} fills with the child's name`);
  assert.match(readFileSync(new URL("../server/play/start.js", import.meta.url), "utf8"), /currentLevel\(s, entry, child\.first_name\)/);
  assert.ok(entryFor);
});
