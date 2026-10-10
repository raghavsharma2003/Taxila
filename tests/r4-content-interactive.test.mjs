// Round 4 · stream 2 (content), brief item 4: a game / animation / simulation ask ends in something the child can DO.
// Measured (round3-forge R2, taxila.dev and this branch's local production build, 2026-10-10): 5 of 6 such asks ended in a
// still board, because the Director set move.visual AFTER planModule (patch request 02), so the topic engine's open task
// (modules.js interactiveDefault) never fired live and only the board rung was mounted. No browser, no model.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getKit } from "../server/content/index.js";
import { planModule } from "../server/director/modules.js";

const mounts = (cmds) => cmds.filter((c) => c.op === "mount").map((c) => `${c.engine ?? c.module?.engine}:${(c.params ?? c.module?.params)?.mode ?? ""}`);

describe("r4 content: interactive asks", () => {
  it("the Director puts the visual ask on the move before the module plan (patch 02)", () => {
    const src = readFileSync(new URL("../server/director/state.js", import.meta.url), "utf8");
    const set = src.indexOf("if (p.visual) move.visual = p.visual;");
    const plan = src.indexOf("planModule(s, { kit: input.kit");
    assert.ok(set > 0 && plan > 0 && set < plan, "move.visual is assigned before planModule");
  });
  for (const [topic, engine] of [["c6-maths-ch06-t01", "geoboard@1:build"], ["c5-maths-ch01-t01", "place-value@1:build"]]) {
    it(`${topic}: a game ask after the board rung mounts ${engine} (certified), not the board rung again`, async () => {
      const kit = await getKit(topic, { generate: false });
      const s = { module: null, turn: 3, ctx: { sessionId: `r4i-${topic}`, classLevel: 6 }, failedEngines: [], lastContent: [] };
      assert.deepEqual(mounts(planModule(s, { kit, item: null, move: { kind: "explain" }, lang: "hinglish", band: "B3" })), ["explainer@1:play"]);
      s.turn = 4;
      assert.deepEqual(mounts(planModule(s, { kit, item: null, move: { kind: "reteach", visual: "game" }, lang: "hinglish", band: "B3" })), [engine]);
    });
  }
  it("a picture ask is unchanged: no engine task replaces the board", async () => {
    const kit = await getKit("c5-maths-ch01-t01", { generate: false });
    const s = { module: null, turn: 3, ctx: { sessionId: "r4i-pic", classLevel: 5 }, failedEngines: [], lastContent: [] };
    planModule(s, { kit, item: null, move: { kind: "explain" }, lang: "hinglish", band: "B3" });
    s.turn = 4;
    assert.ok(!mounts(planModule(s, { kit, item: null, move: { kind: "reteach", visual: "picture" }, lang: "hinglish", band: "B3" })).includes("place-value@1:build"));
  });
});
