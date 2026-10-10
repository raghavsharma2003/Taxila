// Round 4 stream 5, Part B: the look switch. PuppetLook "r8" | "lamp1" keyed in src/face-puppet/assets.ts (base, clear
// colour, views, posters); GET /api/face/config reports `look` (TAXILA_FACE_LOOK, default r8); the device override is
// ?look=; under lamp1 every Asha fallback is her lamp1 still, never TutorFace's Plate2D vector. lamp1 is HELD (its live
// puppet failed the blind uncanny gate, 2026-10-10): no source may select it (a dev build may trial it with &heldlook=1).
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const store = new Map();
// this file's page globals, (re)installed by every reset: another test file run in the same process installs its own
const stub = (name, value) => Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
const storage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
let search = "";
const where = { get search() { return search; } };
const ownGlobals = () => { stub("localStorage", storage); stub("location", where); };
ownGlobals();
const A = await import("../src/face-puppet/assets.ts");
const F = await import("../src/face-puppet/flag.ts");
const L = await import("../src/face-puppet/look.ts");
const { faceConfig, faceLookOf, FACE_LOOKS, HELD_FACE_LOOKS, COHORT_FACE_LOOKS } = await import("../server/face-puppet/config.js");
const { PUPPET_REV: SERVER_REV } = await import("../server/face-puppet/rev.js");

const ROOT = new URL("..", import.meta.url);
const answer = (body) => async () => ({ ok: true, status: 200, json: async () => body });
const fresh = (q = "") => { ownGlobals(); store.clear(); search = q; F.resetPuppetServerFlag(); L.resetLookForTests(); };

test("assets: one pack per look, keyed (base, clear colour, views, posters); r8 stays the default and its old names hold", () => {
  assert.deepEqual([...A.PUPPET_LOOKS], ["r8", "lamp1", "lamp2"]);
  assert.deepEqual([...FACE_LOOKS, ...HELD_FACE_LOOKS, ...COHORT_FACE_LOOKS].sort(), [...A.PUPPET_LOOKS].sort(), "the server and the client key the same looks");
  assert.equal(A.isPuppetLook("lamp2"), false, "lamp2 is owner-cohort only: never painted without the server's cohort answer");
  assert.equal(A.lookPack("lamp2").rig, "keys");
  assert.equal(A.lookPack("lamp2").base, "/face-puppet/lamp2/");
  assert.deepEqual([...HELD_FACE_LOOKS], [...A.HELD_LOOKS], "and hold the same ones");
  assert.equal(A.isPuppetLook("lamp1"), false, "held: never painted");
  assert.equal(A.isPuppetLook("lamp1", { held: true }), true, "a dev trial may admit it");
  assert.equal(A.DEFAULT_LOOK, "r8", "lamp1 becomes the default only on the owner's yes");
  assert.equal(A.PUPPET_REV, SERVER_REV);
  assert.equal(A.lookPack("r8").base, "/face-puppet/r8/");
  assert.equal(A.lookPack("lamp1").base, "/face-puppet/lamp1/");
  assert.equal(A.puppetPoster("medium", "lamp1"), "/face-puppet/lamp1/rest-medium.webp");
  assert.equal(A.puppetPoster("close", "r8"), "/face-puppet/r8/rest-close.webp");
  assert.equal(A.puppetPoster(), "/face-puppet/r8/rest-medium.webp", "no look given: the default");
  assert.deepEqual([A.PUPPET_BASE, A.PUPPET_VIEW.medium, A.PUPPET_CLEAR], [A.lookPack("r8").base, A.lookPack("r8").view.medium, [...A.lookPack("r8").clear]]);
  assert.equal(A.lookBackground("r8"), "rgb(251,229,189)", "the host's backdrop is the r8 cream it always was");
  assert.equal(A.lookPack("nope").look, "r8", "an unknown look is the default, never a crash");
  assert.ok(existsSync(new URL("public/face-puppet/r8/rest-medium.webp", ROOT)));
});

test("assets: a SHIPPED pack's clear colour and views are its geom.json's own (public/face-puppet/<look>/, the copy this stream owns)", () => {
  // the Asha agent's art/ pack is upstream work in progress (its final lamp1 moved to 4-number views for its own runtime),
  // so only a pack copied into public/ binds the keyed values
  for (const look of A.PUPPET_LOOKS) {
    const f = new URL(`public/face-puppet/${look}/geom.json`, ROOT);
    if (!existsSync(f)) continue;
    const g = JSON.parse(readFileSync(f, "utf8"));
    if (!g.views) continue; // r8 predates `views` in geom.json: its views are the tuned constants
    const p = A.lookPack(look);
    assert.deepEqual([...p.clear], g.clear, `${look} clear`);
    // a key pack's geom.json views are 4-number contain windows for its own demo; the product's framings are keyed
    if (g.views.medium.length !== 3) continue;
    assert.deepEqual([...p.view.medium], g.views.medium, `${look} medium view`);
    assert.deepEqual([...p.view.close], g.views.close, `${look} close view`);
  }
  assert.ok(!existsSync(new URL("public/face-puppet/lamp1/", ROOT)), "the held lamp1 pack is not shipped");
  assert.ok(existsSync(new URL("public/face-puppet/lamp2/geom.json", ROOT)), "the cohort's lamp2 pack is shipped");
});

test("server: /api/face/config reports the look; unset, unknown or HELD is r8", () => {
  assert.equal(faceConfig({}).look, "r8");
  assert.equal(faceConfig({ TAXILA_FACE_LOOK: "r8" }).look, "r8");
  for (const v of ["", "lamp2", "plate", "0", "lamp1", " LAMP1 "]) assert.equal(faceLookOf({ TAXILA_FACE_LOOK: v }), "r8", JSON.stringify(v));
  assert.equal(faceConfig({ TAXILA_FACE_LOOK: "lamp1", TAXILA_FACE_PUPPET2D: "0" }).puppet2d, false, "the kill switch is independent of the look");
});

test("client: ?look= wins and persists; 'default' forgets; else the server's look, remembered; a HELD look never paints", async () => {
  fresh("?look=r8");
  assert.equal(L.faceLookNow(), "r8");
  assert.equal(await L.faceLook(answer({ puppet2d: true, look: "r9" })), "r8", "the device choice beats the server");
  fresh();
  store.set(L.LOOK_DEVICE_KEY, "r8");
  assert.equal(L.faceLookNow(), "r8", "persisted across pages");
  search = "?look=default";
  L.resetLookForTests();
  assert.equal(L.faceLookNow(), null, "'default' forgets; nothing known yet");
  fresh();
  assert.equal(L.faceLookNow(), null, "a first visit waits for the server");
  assert.equal(await L.faceLook(answer({ puppet2d: true, look: "r8" })), "r8");
  assert.equal(L.faceLookNow(), "r8", "known for the rest of the page");
  F.resetPuppetServerFlag();
  assert.equal(L.faceLookNow(), "r8", "and remembered for the next page");
  // HELD (lamp1): from the URL, a stored device choice, the server, or a remembered server answer, it is never painted
  fresh("?look=lamp1");
  assert.equal(L.faceLookNow(), null, "?look=lamp1 is ignored");
  fresh("?look=lamp1&heldlook=1");
  assert.equal(L.faceLookNow(), null, "&heldlook=1 trials only in a dev build (not here)");
  fresh();
  store.set(L.LOOK_DEVICE_KEY, "lamp1");
  store.set(L.LOOK_SERVER_KEY, "lamp1");
  assert.equal(L.faceLookNow(), null, "a stored lamp1 (from before the hold) is ignored");
  assert.equal(await L.faceLook(answer({ puppet2d: true, look: "lamp1" })), "r8", "a server that says lamp1 gets r8");
  fresh("?look=bogus");
  assert.equal(await L.faceLook(answer({ puppet2d: true })), "r8", "an old server with no look: the default");
  fresh();
  assert.equal(await L.faceLook(async () => { throw new Error("offline"); }), "r8", "fail-open: the default");
});

test("client: the kill switch and the look come from ONE config request", async () => {
  fresh();
  let calls = 0;
  const f = async () => { calls++; return { ok: true, status: 200, json: async () => ({ puppet2d: false, look: "lamp1" }) }; };
  assert.equal(await F.puppetServerAllows(f), false);
  assert.equal(await L.faceLook(f), "r8", "lamp1 is held: the same answer, the default look");
  assert.equal(calls, 1);
  assert.equal(F.puppetServerKnownOff(), true);
});

test("under lamp1 no path shows TutorFace's Plate2D for Asha: the puppet's fallbacks and the kill switch hold her still", () => {
  const face = readFileSync(new URL("src/face-puppet/PuppetFace.tsx", ROOT), "utf8");
  assert.match(face, /export const holdsOwnStill = \(look: PuppetLook \| null\): boolean => look === "lamp1" \|\| look === "lamp2";/);
  assert.match(face, /setPhase\(revealed\.current \|\| holdsOwnStill\(look\) \? "held" : "fallback"\)/, "a pre-reveal failure holds the still");
  assert.match(face, /if \(phase === "fallback" && !p\.still && !holdsOwnStill\(look\)\)/, "TutorFace only for a look that has no own still");
  assert.match(face, /failedThisPage \? \(holdsOwnStill\(faceLookNow\(\)\) \? "held" : "fallback"\)/, "a page that saw a failure starts on the still");
  assert.match(face, /new PuppetStage\(el, \{\s*look,/, "the stage loads the look's pack");
  const lesson = readFileSync(new URL("src/face-puppet/LessonFace.tsx", ROOT), "utf8");
  assert.match(lesson, /if \(off && !holdsOwnStill\(faceLookNow\(\)\)\) return <TutorFace/, "the kill switch keeps her still under lamp1");
  assert.match(lesson, /still=\{off \|\| p\.tier === "D"\}/);
  const site = readFileSync(new URL("src/app/landing/Site.tsx", ROOT), "utf8");
  assert.match(site, /const grown = look === "lamp1" \|\| look === "lamp2" \? look : null;/);
  assert.match(site, /const still = grown !== null && tutor\.id === "asha";/, "the landing portrait is her own still under lamp1 or lamp2");
});
