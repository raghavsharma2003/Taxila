// Whole-project audit 2026-11-09, face area (docs/design/round7/audit/face.md). One test per fixed finding; each fails on
// the code before its fix.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

/** The few page globals PuppetStage touches outside a rig, stubbed for one test and restored after it. */
function stubPage(t) {
  const names = ["document", "window", "devicePixelRatio", "requestAnimationFrame", "cancelAnimationFrame", "addEventListener", "removeEventListener"];
  const saved = Object.fromEntries(names.map((n) => [n, Object.getOwnPropertyDescriptor(globalThis, n)]));
  const rafs = new Map();
  let id = 0;
  const canvas = () => ({ style: {}, className: "", setAttribute() {}, addEventListener() {}, removeEventListener() {}, remove() { this.removed = true; }, clientWidth: 100, clientHeight: 100 });
  const put = (n, value) => Object.defineProperty(globalThis, n, { configurable: true, writable: true, value });
  put("document", { createElement: canvas, addEventListener() {}, removeEventListener() {}, visibilityState: "visible" });
  put("window", globalThis);
  put("devicePixelRatio", 1);
  put("requestAnimationFrame", (fn) => { rafs.set(++id, fn); return id; });
  put("cancelAnimationFrame", (h) => rafs.delete(h));
  put("addEventListener", () => {});
  put("removeEventListener", () => {});
  t.after(() => {
    for (const n of names) {
      if (saved[n]) Object.defineProperty(globalThis, n, saved[n]);
      else delete globalThis[n];
    }
  });
  return { rafs };
}

// FACE-01: the Help sheet mounts a second live face over the lesson's (Desk.tsx renders <HelpSheet> beside the body). The
// newest stage takes the page's one running slot and the lesson's stage is suspended. When the sheet closed, its stage was
// PARKED (stopped, kept for the next mount) but kept the slot until the park timer disposed it: 1.5 s, or 10 s for a
// worker-backed stage (the default). The lesson's face stood frozen on its last frame all that time, over her voice.
test("FACE-01: a parked stage hands the running slot back at once, so the face it suspended draws again", async (t) => {
  const { rafs } = stubPage(t);
  const { PuppetStage } = await import("../src/face-puppet/stage.ts");
  const host = { appendChild() {}, clientWidth: 100, clientHeight: 100 };
  const lesson = new PuppetStage(host, { band: "b2", sources: [] });
  const sheet = new PuppetStage(host, { band: "b2", sources: [] });
  lesson.start();
  sheet.start();
  assert.equal(lesson.running, false, "one running stage per page: the sheet's face suspends the lesson's");
  assert.equal(lesson.suspended, true);
  sheet.park();
  assert.equal(sheet.running, false, "a parked stage draws nothing");
  assert.equal(sheet.canvas.removed, true, "and leaves the page");
  assert.equal(lesson.running, true, "the lesson's face resumes when the sheet's is parked, not when its park timer fires");
  assert.equal(rafs.size, 1, "exactly one frame loop is scheduled");
  // adopted again (the next mount of the same teacher): it takes the slot back
  sheet.start();
  assert.equal(sheet.running, true);
  assert.equal(lesson.running, false);
  sheet.dispose();
  assert.equal(lesson.running, true, "disposing the foreground stage still resumes the one under it");
  lesson.dispose();
  assert.match(src("src/face-puppet/PuppetFace.tsx"), /function park\([^)]*\): void \{[\s\S]*?stage\.park\(\);/, "PuppetFace parks through stage.park()");
});

// FACE-02: the production image copies dist/ and not public/ (Dockerfile), and the greeting looked for its clip only under
// public/audio: in production `clip` was always null, so her once-a-day greeting could never sound.
test("FACE-02: a greeting clip is found where the production image keeps it (dist/audio), and in a checkout (public/audio)", async () => {
  const G = await import("../server/face-puppet/greetings.js");
  const dirs = G.clipDirs({});
  assert.match(dirs[0], /\/dist\/$/, "the built client first");
  assert.match(dirs[1], /\/public\/$/);
  assert.equal(G.clipDirs({ TAXILA_DIST: "/srv/build" })[0], "/srv/build/", "the build the server really serves (serve.mjs TAXILA_DIST)");
  const only = (dir) => (f) => f === `${dir}audio/hello-day-en-m1.mp3`;
  assert.equal(G.clipExists("en-m1", only(dirs[0])), true, "the image: the clip is in dist/audio only");
  assert.equal(G.clipExists("en-m1", only(dirs[1])), true, "a checkout: public/audio");
  assert.equal(G.clipExists("en-m2", only(dirs[0])), false);
  const docker = readFileSync(new URL("../Dockerfile", import.meta.url), "utf8");
  assert.match(docker, /COPY --from=build \/app\/dist \.\/dist/);
  assert.doesNotMatch(docker, /COPY public /, "if the image ever copies public/, this finding's premise changes");
});
