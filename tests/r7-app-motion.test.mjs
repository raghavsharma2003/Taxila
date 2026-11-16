// r7 stream E app-motion-transitions: one go() for Kaksha screens, a View Transition unless motion is reduced; her window
// morphs between Home, Your teacher and the lesson's stage; the dock holds still.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("go() asks for a View Transition only when motion is allowed, and the screens use it", () => {
  assert.match(read("src/ui-v3/kaksha/screens/go.ts"), /nav\(to, \{ viewTransition: !reducedMotion \}\)/);
  for (const f of ["src/ui-v3/kaksha/screens/KakshaHome.tsx", "src/ui-v3/kaksha/screens/KakshaWorld.tsx", "src/child/chrome.tsx"]) {
    const s = read(f);
    assert.match(s, /useKxGo\(reducedMotion\)/, f);
    assert.doesNotMatch(s, /go=\{\(to\) => nav\(to\)\}/, `${f}: a plain navigate left`);
  }
});

test("her window shares one transition name on Home, Your teacher and the stage; reduced motion stops every animation", () => {
  assert.match(read("src/ui-v3/kaksha/kaksha.css"), /\.kx-home-face \{[^}]*view-transition-name: kx-asha;/);
  assert.match(read("src/ui-v3/kaksha/kit.css"), /\.kx-teacher-face \{ view-transition-name: kx-asha; \}/);
  assert.match(read("src/ui-v3/kaksha/lesson/stage.css"), /\.ks-face--stage \{ view-transition-name: kx-asha; \}/);
  const k = read("src/ui-v3/kaksha/kaksha.css");
  assert.match(k, /@media \(prefers-reduced-motion: reduce\) \{\s*::view-transition-group\(\*\), ::view-transition-old\(\*\), ::view-transition-new\(\*\) \{ animation: none !important; \}/);
  assert.match(k, /nav\.kx-nav\.kx-nav \{ view-transition-name: kx-dock; \}/);
});
