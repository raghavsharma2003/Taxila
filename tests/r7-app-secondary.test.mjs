// r7 stream E app-secondary-screens-kaksha (OWNER-RESET #12): no child screen left in the old look under Kaksha.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("every secondary child screen has a Kaksha branch built from the kit", () => {
  for (const [f, part] of [
    ["src/child/screens/Notebook.tsx", /if \(kx\) \{[\s\S]*StatePanel glyph="notebook"/],
    ["src/child/screens/Ask.tsx", /if \(kx\) \{[\s\S]*<Panel as="form"/],
    ["src/child/screens/Me.tsx", /if \(kx\) \{[\s\S]*<SwitchRow[\s\S]*<ChoiceRow/],
    ["src/child/screens/Teacher.tsx", /if \(kx\) \{[\s\S]*<Comms/],
    ["src/child/screens/Hello.tsx", /kakshaEnabled\([\s\S]*<KxPage[\s\S]*className="kx-boot"/],
    ["src/app/Who.tsx", /Object\.keys\(look\)\.length\) \{[\s\S]*<KxPage/],
  ]) assert.match(read(f), part, f);
});

test("ChildScreen's Kaksha frame is the kit's KxPage (Kaksha's own root, one bar, one dock)", () => {
  const c = read("src/child/chrome.tsx");
  assert.match(c, /<KxPage family=\{family\}/);
  assert.doesNotMatch(c, /cs--kx/);
});

test("the hold, offline and signed-out Home states are Kaksha views; the hold keeps its copy and the lesson's Help sheet", () => {
  const h = read("src/ui-v3/kaksha/screens/KakshaHome.tsx");
  assert.doesNotMatch(h, /ClassicHome/);
  assert.match(h, /<HelpSheet /);
  // a hold never offers a lesson, practice or Ask
  assert.match(h, /kind === "signedout" \? kn\.dock : dockForPlan\(kn\.dock, plan\)/);
  const v = read("src/ui-v3/kaksha/screens/HomeState.tsx");
  for (const k of ["home.hold.head", "home.hold.sub", "home.hold.help"]) assert.ok(v.includes(`tw2("${k}")`), k);
  assert.doesNotMatch(v.slice(v.indexOf('p.kind === "hold"'), v.indexOf('p.kind === "signedout"')), /practiceTo|lesson/);
});

test("Me under Kaksha drops the no-op Theme row and keeps the rest", () => {
  const me = read("src/child/screens/Me.tsx");
  const kx = me.slice(me.indexOf("if (kx) {"), me.indexOf("  return (\n    <ChildScreen testid=\"me\""));
  assert.doesNotMatch(kx, /id="theme"/);
  for (const id of ["captions", "type", "talk", "face", "sounds", "calm", "bigtext"]) assert.match(kx, new RegExp(`id="${id}"`), id);
  assert.match(kx, /testid="switch-learner"/);
  assert.match(kx, /note=\{t\("aiTeacher"\)\}/, "her name travels with AI teacher");
});

test("the kit is pure: no fetch, no router, no raster", () => {
  const k = read("src/ui-v3/kaksha/kit.tsx");
  assert.doesNotMatch(k, /fetch\(|react-router|\.png|\.webp|\.jpg/);
});
