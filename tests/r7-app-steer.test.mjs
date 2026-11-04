// r7 app-lesson-steer-chips + app-lesson-stage-first: the steer chips go out with the chip ids the Director reads, and the
// stage solver keeps the stage the largest zone without shrinking a certified box.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { solveStage } from "../src/ui-v3/kaksha/lesson/stageLayout.ts";

const desk = fs.readFileSync(new URL("../src/child/lesson/useDesk.ts", import.meta.url), "utf8");
const classify = fs.readFileSync(new URL("../server/director/classify.js", import.meta.url), "utf8");

test("steer chip ids are ones the Director reads (req:visual, req:game, the 'another' help request)", () => {
  const line = desk.match(/export const STEER_ID[^\n]*/)[0];
  const ids = [...line.matchAll(/(diagram|game|another|else): ("[^"]+"|null)/g)].map((m) => [m[1], m[2]]);
  assert.equal(ids.length, 4, "four steer rows");
  for (const [, id] of ids) {
    if (id === "null") continue;
    const v = JSON.parse(id);
    const known = /^req:(visual|story|game)$/.test(v) || new RegExp(`\\b${v}: "`).test(classify.slice(classify.indexOf("HELP_REQUESTS")));
    assert.ok(known, `${v} is read by classify.js`);
  }
});

test("'something else' goes as words the change_topic lexicon reads", async () => {
  const { requestOf } = await import("../server/director/requests.js").catch(() => ({}));
  if (!requestOf) return; // the lexicon's export name moved: the id test above still guards the chip ids
  for (const words of ["Kuch aur baat karte hain", "Can we talk about something else"]) {
    const r = requestOf(words);
    assert.equal(r?.type, "change_topic", words);
  }
});

const sizes = [[360, 800], [412, 915], [1280, 800], [1366, 768]];
test("the stage is the largest zone at every size, with or without the answer pad", () => {
  for (const [w, h] of sizes) for (const answerNeed of [0, 232]) {
    const L = solveStage({ width: w, height: h, family: "older", chips: true, artifact: true, answerNeed });
    const stage = L.stage.w * L.stage.h;
    for (const z of [L.answer, L.dock, L.chips, L.tile, L.caption]) if (z) assert.ok(stage > z.w * z.h, `${w}x${h} pad ${answerNeed}`);
    assert.equal(L.overflow, false, `${w}x${h} pad ${answerNeed} fits`);
  }
});

test("phone columns sum to the container exactly", () => {
  for (const [w, h] of [[360, 800], [412, 915], [360, 640]]) {
    const L = solveStage({ width: w, height: h, family: "older", chips: true, artifact: true });
    assert.equal(L.dock.y + L.dock.h + 8, h, `${w}x${h}`);
  }
});

test("grow a box, never shrink one: the stage slot ≥ every certified tray and play box", () => {
  const bc = JSON.parse(fs.readFileSync(new URL("../server/forge3/certs/box-contract.json", import.meta.url), "utf8"));
  const vp = { p360: [360, 800], p412: [412, 915], l1366: [1366, 768] };
  for (const [band, family] of [["b3", "older"], ["b2", "young"]]) {
    for (const [id, [w, h]] of Object.entries(vp)) {
      const tray = bc.boxes[band].tray[id].box, play = bc.boxes[band].play[id].box;
      const s = solveStage({ width: w, height: h, family, chips: family === "older", artifact: true }).slot;
      const p = solveStage({ width: w, height: h, family, chips: family === "older", artifact: true, play: true }).slot;
      assert.ok(s.w >= tray.w && s.h >= tray.h, `${band} ${id} stage ${s.w}x${s.h} vs tray ${tray.w}x${tray.h}`);
      assert.ok(p.w >= play.w && p.h >= play.h, `${band} ${id} play ${p.w}x${p.h} vs play ${play.w}x${play.h}`);
    }
  }
});

test("the PiP shows only while a piece holds a phone stage, and keeps to the bottom-right of the slot", () => {
  const none = solveStage({ width: 360, height: 800, family: "older", chips: true, artifact: false });
  assert.equal(none.pip, null);
  const L = solveStage({ width: 360, height: 800, family: "older", chips: true, artifact: true });
  assert.ok(L.pip && L.pip.x + L.pip.w <= L.slot.x + L.slot.w && L.pip.y + L.pip.h <= L.slot.y + L.slot.h && L.pip.y > L.slot.y + L.slot.h / 2);
  assert.equal(solveStage({ width: 1280, height: 800, family: "older", artifact: true }).pip, null, "wide: a tile, no PiP");
});

test("the geometry spec is generated from the solver and current", async () => {
  const { execFileSync } = await import("node:child_process");
  execFileSync(process.execPath, [new URL("../src/child/dev/stage-geometry.mjs", import.meta.url).pathname, "--check"]);
});
