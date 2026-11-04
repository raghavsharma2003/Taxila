// r7 stream E: moments / Later, the class-4 older look (D3), hands-free dock and the cold-start paint.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { bandForClass, familyOf, YOUNG_MAX_CLASS } from "../src/child/band.ts";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("D3: classes 1-3 young, class 4 and up the older family (OWNER-RESET #1)", () => {
  assert.equal(YOUNG_MAX_CLASS, 3);
  for (const c of [1, 2, 3]) assert.equal(familyOf(bandForClass(c)), "young", `class ${c}`);
  for (const c of [4, 5, 6, 7, 8, 9]) assert.equal(familyOf(bandForClass(c)), "older", `class ${c}`);
  assert.equal(bandForClass(4), "b3");
});

test("src/app/band.ts has no second class → band table", () => {
  assert.match(read("src/app/band.ts"), /export \{ bandForClass \} from "\.\.\/child\/band\.ts"/);
});

test("the stop check-in's chips are a moment card, never answer tiles", async () => {
  const src = read("src/ui-v3/kaksha/lesson/Moments.tsx");
  // the pure helper, re-implemented here from its source contract: stop:end present and every id stop:* / break:*
  assert.match(src, /c\.id === "stop:end"/);
  assert.match(src, /\/\^\(stop\|break\):\//);
  const body = read("src/ui-v3/kaksha/lesson/StageBody.tsx");
  assert.match(body, /const tray = stopChoices \? null : m\.tray;/, "the check-in's tiles never render as an answer surface");
});

test("Pause → End is the check-in: Keep going, Short break, End (D5)", () => {
  const desk = read("src/child/lesson/Desk.tsx");
  assert.match(desk, /<EndConfirm [^>]*onBreak=\{a\.takeBreak\}/);
  assert.match(desk, /m\.sheet === "break" && <BreakSheet/);
  const ud = read("src/child/lesson/useDesk.ts");
  assert.match(ud, /holdSpeech\(sheet === "pause" \|\| sheet === "end" \|\| sheet === "hint" \|\| sheet === "break"\)/, "a break holds her speech");
});

test("hands-free: Voice's dock states drive the dock; mute is runtime.setMuted; the link follows the live engine", () => {
  const ud = read("src/child/lesson/useDesk.ts");
  assert.match(ud, /handsFreeDock\(\{ expected: bs\.duplexExpected/);
  assert.match(ud, /runtime\.setPushToTalk\(!engineOpen \|\| paused\)/, "hands-free on screen never opens the mic before the engine is live");
  assert.match(ud, /toggleMute: \(\) => \{ ptt\.stop\(\); runtime\.setMuted\(!muted\); \}/);
  assert.match(read("src/child/lesson/AnswerDock.tsx"), /m\.mic\.handsFree \|\| m\.mic\.muted \? \(/);
});

test("cold start: the Kaksha paths paint Volt first, and the manifest is --k-void", () => {
  const html = read("index.html");
  assert.match(html, /\/\^\\\/\(c\\\/\|who\|start\|parent\)\//);
  assert.match(html, /\[data-boot=kx\] \.tx-skel\{background:#05060A\}/);
  const mf = JSON.parse(read("public/manifest.webmanifest"));
  assert.equal(mf.background_color, "#05060A");
  assert.equal(mf.theme_color, "#05060A");
  const tok = read("src/ui-v3/kaksha/tokens.css");
  assert.match(tok, /--k-void: #05060A;/, "the manifest colour is the night void token");
});
