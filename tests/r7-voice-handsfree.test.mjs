// Round 7, stream B Voice, item voice-handsfree-default (decision D2, dc-r7-handsfree-default): hands-free duplex is every
// child's default. Server: /api/duplex/config answers { duplex: "on", lane: "d5" } for every request when Voice Live is
// configured (no cohort, no sign-in lookup); TAXILA_DUPLEX_LANE=d4 pins D4; the cohort is only the override while the global
// mode is "shadow"; the kill switch wins. d5route: no cohort gate, only the lane. Client: an unreadable switch runs
// hands-free on D4, never tap; a definite d5 answer puts the lesson on D5 unless the device escape hatch says d4.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { duplexLane, modeFor } from "../server/duplex/config.js";
import { authorizeD5 } from "../server/duplex/d5route.js";
import { DEFAULT_PREFS } from "../src/child/prefs.ts";
import { resolveDuplexMode, resolveDuplexLane, resetDuplexFlagCache } from "../src/duplex/flags.ts";

const VL = { AZURE_AI_CENTRALINDIA_ENDPOINT: "https://vl.example.cognitiveservices.azure.com/", AZURE_AI_CENTRALINDIA_KEY: "k" };
const LESSON = "00000000-0000-0000-0000-000000000001";
const req = { method: "GET", url: `/api/duplex/voicelive?lessonId=${LESSON}`, headers: { upgrade: "websocket", connection: "Upgrade", "sec-websocket-version": "13", "sec-websocket-key": "dGhlIHNhbXBsZSBub25jZQ==", host: "taxila.dev", cookie: "tx_session=s" } };
const deps = (mode) => ({
  env: VL, lookupLesson: async () => ({ id: LESSON, child_id: "c1", ended_at: null }),
  child: async () => ({ guardian: { id: "g1", email: "parent@example.com" }, child: { id: "c1" } }), consent: async () => true, mode,
});
const status = (p) => p.then(() => 200, (e) => e.status);

test("r7 handsfree: every child gets duplex on, lane d5 when Voice Live is configured, with no cohort lookup", async () => {
  let looked = 0;
  const lookup = async () => { looked++; throw new Error("not signed in"); };
  for (const r of [{ headers: {} }, { headers: { cookie: "tx_session=a" } }]) {
    assert.deepEqual(await modeFor(r, { env: VL, lookup }), { duplex: "on", lane: "d5" });
    assert.deepEqual(await modeFor(r, { env: { ...VL, TAXILA_DUPLEX: "1" }, lookup }), { duplex: "on", lane: "d5" });
  }
  assert.equal(looked, 0);
  assert.deepEqual(await modeFor({ headers: {} }, { env: {}, lookup }), { duplex: "on" }, "no Voice Live → hands-free on D4");
  assert.deepEqual(await modeFor({ headers: {} }, { env: { ...VL, TAXILA_DUPLEX_LANE: "d4" }, lookup }), { duplex: "on" }, "the env pins D4");
  assert.deepEqual(await modeFor({ headers: {} }, { env: { ...VL, TAXILA_DUPLEX: "off" }, lookup }), { duplex: "off" }, "kill switch");
  assert.deepEqual(await modeFor({ headers: {} }, { env: { ...VL, TAXILA_DUPLEX: "shadow" }, lookup }), { duplex: "shadow" }, "shadow, no cohort");
  for (const v of ["d4", "D4", " off ", "0"]) assert.equal(duplexLane({ ...VL, TAXILA_DUPLEX_LANE: v }), "d4", v);
  for (const v of ["", "d5", "on"]) assert.equal(duplexLane({ ...VL, TAXILA_DUPLEX_LANE: v }), "d5", v);
});

test("r7 handsfree: the D5 stream opens for any consented child on lane d5; off, shadow and d4 answers never open it", async () => {
  assert.equal(await status(authorizeD5(req, { lessonId: LESSON, ...deps(async () => ({ duplex: "on", lane: "d5" })) })), 200);
  assert.equal(await status(authorizeD5(req, { lessonId: LESSON, ...deps(async () => ({ duplex: "on" })) })), 403);
  assert.equal(await status(authorizeD5(req, { lessonId: LESSON, ...deps(async () => ({ duplex: "off" })) })), 403);
  assert.equal(await status(authorizeD5(req, { lessonId: LESSON, ...deps(async () => ({ duplex: "shadow", lane: "d5" })) })), 403);
  // the real modeFor behind it: an ordinary (non-cohort) parent's child is allowed
  assert.equal(await status(authorizeD5(req, { lessonId: LESSON, ...deps((r) => modeFor(r, { env: VL, lookup: async () => ({ email: "parent@example.com" }) })) })), 200);
});

test("r7 handsfree: the client runs hands-free when the switch is unreadable (lane D4), and takes D5 from a definite answer", async () => {
  const store = new Map();
  const had = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) } });
  const srv = (body, ok = true) => async () => ({ ok, json: async () => body });
  try {
    resetDuplexFlagCache();
    const offline = async () => { throw new Error("offline"); };
    assert.equal(await resolveDuplexMode(offline), "on");
    assert.equal(await resolveDuplexLane(offline), "d4", "no definite answer never asks for a D5 stream");
    resetDuplexFlagCache();
    assert.equal(await resolveDuplexMode(srv({ duplex: "on", lane: "d5" })), "on");
    assert.equal(await resolveDuplexLane(srv({ duplex: "on", lane: "d5" })), "d5");
    resetDuplexFlagCache();
    store.set("tx.flag.d5", "d4");
    assert.equal(await resolveDuplexLane(srv({ duplex: "on", lane: "d5" })), "d4", "the device escape hatch");
    store.clear();
    resetDuplexFlagCache();
    assert.equal(await resolveDuplexMode(srv({ duplex: "off" })), "off", "the kill switch still turns it off");
  } finally {
    resetDuplexFlagCache();
    if (had) Object.defineProperty(globalThis, "localStorage", had); else delete globalThis.localStorage;
  }
});

test("r7 handsfree: hands-free is the unset default (null, not tap) and the lesson only starts muted for an explicit false", () => {
  assert.equal(DEFAULT_PREFS.handsFree, null);
  assert.match(fs.readFileSync(new URL("../src/child/lesson/LessonScreen.tsx", import.meta.url), "utf8"), /startMuted: prefs\.handsFree === false/);
});
