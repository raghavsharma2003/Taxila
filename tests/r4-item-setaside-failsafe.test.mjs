// Main safety review of patch 13 (2026-10-10): the SHADOW set-aside runs inside classifyFast's predicate branch, the branch
// the safety floor exists for. Whatever happens in the shadow (an item with a broken field, a heard line the leak check
// cannot read), the predicate result must come back exactly as with the flag off: never a throw, never a different result.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { classifyFast, targetFor } from "../server/director/classify.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";

const kit = kitFromFile(getTopic("c9-sst-ch14-t01"));
const SST = kit.items.find((i) => i.id === "c9-sst-ch14-t01-i08");
// a posed, verified item whose content throws when read (as a corrupt or half-loaded kit would)
const broken = () => {
  const it = { ...SST };
  for (const k of ["answer", "acceptable", "hints", "prompt_en", "prompt_hi", "options"]) {
    Object.defineProperty(it, k, { enumerable: true, get() { throw new Error(`broken item field ${k}`); } });
  }
  return it;
};

describe("patch 13 shadow: fail-safe on the predicate branch (main safety review)", () => {
  test("a throwing item in shadow returns the plain predicate result, flags and all", () => {
    const was = process.env.TAXILA_ITEM_SETASIDE;
    try {
      const target = { ...targetFor({ phase: "practice", hintLevel: 0 }, kit, SST), item: broken() };
      for (const t of ["mere papa mujhe roz maarte hain", "the strong bully the weak", "I hurt myself"]) {
        process.env.TAXILA_ITEM_SETASIDE = "off";
        const off = classifyFast({ target, childText: t, typed: true, heard: "Who would stop a bully or a thief?", lang: "english" });
        process.env.TAXILA_ITEM_SETASIDE = "shadow";
        let sh;
        assert.doesNotThrow(() => { sh = classifyFast({ target, childText: t, typed: true, heard: "Who would stop a bully or a thief?", lang: "english" }); }, t);
        assert.equal(sh.result.source, "predicate", t);
        assert.equal(sh.result.flags.distress, true, `the floor still fires: ${t}`);
        assert.equal(sh.result.setAsideWould, undefined, `no shadow annotation from a failed shadow: ${t}`);
        assert.deepEqual(sh.result, off.result, t);
        assert.deepEqual(sh.flags, off.flags, t);
      }
    } finally {
      if (was === undefined) delete process.env.TAXILA_ITEM_SETASIDE; else process.env.TAXILA_ITEM_SETASIDE = was;
    }
  });
});
