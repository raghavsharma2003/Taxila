// Round 7 face-prewarm-for-first-sound: the home's worker-backed live stage is handed to the lesson's face, and the stills
// a lesson face may paint are decoded at idle on the home.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

// the device flag reads location + localStorage: stubbed per test and restored after it (one-process isolation)
function stubPage(t) {
  const saved = { location: Object.getOwnPropertyDescriptor(globalThis, "location"), localStorage: Object.getOwnPropertyDescriptor(globalThis, "localStorage") };
  const store = new Map();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, writable: true, value: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) } });
  Object.defineProperty(globalThis, "location", { configurable: true, writable: true, value: { search: "" } });
  t.after(() => {
    for (const k of ["location", "localStorage"]) {
      if (saved[k]) Object.defineProperty(globalThis, k, saved[k]);
      else delete globalThis[k];
    }
  });
}

test("the stills a lesson face may paint: both posters, and the light-mouth sprites for a lite look", async () => {
  const P = await import("../src/face-puppet/prewarm.ts");
  const r8 = P.stillUrls("r8");
  assert.deepEqual(r8.slice(0, 2), ["/face-puppet/r8/rest-medium.webp", "/face-puppet/r8/rest-close.webp"]);
  assert.deepEqual(r8.slice(2).sort(), ["ee", "half", "oh", "open"].map((k) => `/face-puppet/r8/lite/${k}.webp`).sort());
  assert.equal(P.stillUrls("lamp2").length, 2, "a key rig has no lite sprites");
  for (const u of r8) assert.ok(readFileSync(new URL(`../public${u}`, import.meta.url)).length > 0, `${u} ships`);
});

test("hand-off: only a revealed stage whose rig draws in a worker, and ?handoff=0 turns it off on the device", async (t) => {
  stubPage(t);
  const P = await import("../src/face-puppet/prewarm.ts");
  assert.equal(P.canHandOff({ isRevealed: true, offThread: true }), true);
  assert.equal(P.canHandOff({ isRevealed: true, offThread: false }), false, "a main-thread rig would compete with her first sound");
  assert.equal(P.canHandOff({ isRevealed: false, offThread: true }), false);
  globalThis.location.search = "?handoff=0";
  assert.equal(P.canHandOff({ isRevealed: true, offThread: true }), false);
  globalThis.location.search = "";
  assert.equal(P.canHandOff({ isRevealed: true, offThread: true }), false, "the device keeps the opt-out");
  globalThis.location.search = "?handoff=1";
  assert.equal(P.canHandOff({ isRevealed: true, offThread: true }), true);
  assert.equal(P.handoffKey("asha", "r8", "b3"), "asha|r8|b3");
  assert.ok(P.HANDOFF_PARK_MS >= 5000 && P.HANDOFF_PARK_MS <= 15000);
});

test("PuppetFace parks a hand-off stage longer and adopts it across meters; the stage retargets its tap", () => {
  const f = src("src/face-puppet/PuppetFace.tsx");
  assert.match(f, /canHandOff\(stage\) \? HANDOFF_PARK_MS : PARK_MS/);
  assert.match(f, /if \(parked\.key !== key\) \{\s*if \(parked\.hand !== hand \|\| !canHandOff\(parked\.stage\)\) return null;\s*parked\.stage\.retarget\(sources\);/);
  assert.match(f, /const parkKey = `\$\{hand\}\|\$\{srcKey\}`/);
  assert.match(f, /prewarmStills\(look\)/);
  const s = src("src/face-puppet/stage.ts");
  assert.match(s, /retarget\(sources: TapSource\[\]\): void \{[\s\S]*?this\.tap\.dispose\(\);\s*this\.tap = new TeacherTap\(sources\);/);
  assert.match(s, /get offThread\(\): boolean \{\s*return this\.rig instanceof RemoteRig;/);
});
