// Play: the style interface is the only place colour lives (GRAMMAR.md §8, DESIGN.md §4). Family views and scenes ask the
// painter for roles and materials; a colour literal in a family file fails here. Also: every logic has a view, every lab
// has a scene, and the art tokens keep their contrast floors.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { LOGIC } from "../src/play/families/index.ts";
import { LABS } from "../src/play/families/kyun-lab/labs.ts";

const FAM = new URL("../src/play/families/", import.meta.url).pathname;
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });

describe("play style lint", () => {
  it("no colour literal in any family file (views, scenes, logic)", () => {
    const bad = [];
    for (const f of walk(FAM).filter((x) => x.endsWith(".ts"))) {
      readFileSync(f, "utf8").split("\n").forEach((line, i) => {
        const code = line.replace(/\/\/.*$/, "");
        if (/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/.test(code)) bad.push(`${f.replace(FAM, "")}:${i + 1}`);
      });
    }
    assert.deepEqual(bad, []);
  });
  it("every (family, mode) with a logic has a view, and every lab has an apparatus scene", async () => {
    const views = readFileSync(join(FAM, "views.ts"), "utf8");
    for (const key of Object.keys(LOGIC)) assert.ok(views.includes(`"${key}"`), `no view for ${key}`);
    const scenes = readFileSync(join(FAM, "kyun-lab/scenes.ts"), "utf8");
    const reg = /const SCENES[^{]*\{([^}]*)\}/.exec(scenes)?.[1] ?? "";
    for (const id of Object.keys(LABS)) assert.ok(new RegExp(`\\b${id}\\b`).test(reg), `no scene for lab ${id}`);
  });
  it("every lab names its kit source, has ≥ 1 free condition and marks illustrative numbers honestly", () => {
    for (const lab of Object.values(LABS)) {
      assert.ok(lab.source.startsWith(lab.topicIds[0]), `${lab.id}: source must quote its kit topic`);
      assert.ok(lab.free.length >= 1, lab.id);
      // a law (pendulum, similar triangles) or a category (floats, sticks, glows, starch) may be exact; a modelled amount may not
      if (lab.exact) assert.ok(["jhoola", "parchhai"].includes(lab.id) || ["float", "stick", "glow", "starch"].includes(lab.outcome.kind), `${lab.id}: an illustrative model value marked exact`);
    }
  });
});
