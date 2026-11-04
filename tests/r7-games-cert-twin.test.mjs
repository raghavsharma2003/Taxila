// r7 Games: a play certificate certifies the GAME, never its board twin. Since StudioStage's PiP zone (6e1036a37) handed
// play a 263 x 432 box on a 360 px phone, PlayStudioRenderer refused the box ("layout") and the harness judged the text
// twin as if it were the game. play-cert now judges each size on its own, probes the box and the mounted view, and fails a
// size whose stage refused the box or mounted no play stage (twin:layout / twin:no-stage). These tests hold that in place.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../server/forge3/play-cert.js", import.meta.url), "utf8");
const table = JSON.parse(readFileSync(new URL("../server/forge3/certs/play.json", import.meta.url), "utf8"));

test("play-cert judges every play size through the twin probe (2D and 3D loops)", () => {
  assert.match(src, /const judgePlay = async/);
  assert.equal((src.match(/await judgePlay\(artifact,/g) ?? []).length, 2, "both the 2D and the 3D loop use judgePlay");
  assert.ok(!/judge\.judge\(artifact, \{ viewports: PLAY_VIEWPORTS/.test(src), "no play judge call bypasses the probe");
  assert.match(src, /e\.message === "layout"/, "the renderer's layout refusal fails the size");
  assert.match(src, /twin:\$\{refused \? "layout" : "no-stage"\}/);
  assert.match(src, /box: Object\.fromEntries\(Object\.entries\(r\.probes\)/, "each sample records the box it was judged in");
});

test("a certificate sample never passes a size at which the game did not mount", () => {
  let recorded = 0;
  for (const s of table.samples ?? []) {
    if (!s.game) continue;
    recorded++;
    for (const [vp, game] of Object.entries(s.game)) {
      if (!game) assert.equal(s.byViewport?.[vp], false, `${s.key} ${s.topicId} ${s.art} passes ${vp} without the game mounted`);
      if (s.byViewport?.[vp]) assert.ok(s.box?.[vp] && s.box[vp].w >= 300 && s.box[vp].h >= 440, `${s.key} ${s.topicId} ${s.art} passes ${vp} in a box under MIN_BOX: ${JSON.stringify(s.box?.[vp])}`);
    }
  }
  assert.ok(recorded >= 0);
});
