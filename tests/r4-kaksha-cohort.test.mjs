// Release 11 (dc-r4-volt-everywhere): the cohort no longer gates anything (Kaksha is on for every account); the server
// half below still answers ui.kaksha and stays harmless. Originally K-P10: the Kaksha owner cohort is enforced server-side (main session 2026-10-10). In a production build Kaksha is ON for
// an account the server marks as in the cohort (GET /api/me → ui.kaksha, from TAXILA_UI_KAKSHA), with no URL step;
// ?ui=classic turns it off on a device. An account outside the cohort that types ?ui=kaksha still gets today's Home.
// Run: node --test tests/r4-kaksha-cohort.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { kakshaCohort, uiFlagsFor } from "../server/ui/kaksha-cohort.js";
import { kakshaDecision, kakshaEnabled, _resetKakshaUrlForTests, UI_KAKSHA_KEY } from "../src/ui-v3/kaksha/flag.ts";

const ROOT = new URL("..", import.meta.url).pathname;
const sha = (s) => createHash("sha256").update(s).digest("hex");

test("server: only a signed-in guardian on TAXILA_UI_KAKSHA gets ui.kaksha; the list may be plain or hashed", () => {
  assert.deepEqual(uiFlagsFor({ email: "owner@example.com" }, {}), { kaksha: false }, "no list: nobody");
  const env = { TAXILA_UI_KAKSHA: ` Owner@Example.com , ${sha("second@example.com")} ` };
  assert.equal(kakshaCohort(env).size, 2);
  assert.deepEqual(uiFlagsFor({ email: "owner@example.com" }, env), { kaksha: true });
  assert.deepEqual(uiFlagsFor({ email: "SECOND@example.com" }, env), { kaksha: true });
  assert.deepEqual(uiFlagsFor({ email: "someone@else.com" }, env), { kaksha: false });
  assert.deepEqual(uiFlagsFor({}, env), { kaksha: false });
  assert.deepEqual(uiFlagsFor(null, env), { kaksha: false });
  // the answer carries a boolean only, never the list
  assert.deepEqual(Object.keys(uiFlagsFor({ email: "owner@example.com" }, env)), ["kaksha"]);
});

test("server: GET /api/me (and /api/child/boot, which folds meData) carries ui from uiFlagsFor", () => {
  const acc = fs.readFileSync(path.join(ROOT, "server/routes/account.js"), "utf8");
  assert.match(acc, /import \{ uiFlagsFor \} from "\.\.\/ui\/kaksha-cohort\.js";/);
  assert.match(acc, /return \{ guardian: g, children, consents, ui: uiFlagsFor\(g\) \};/);
  const routes = fs.readFileSync(path.join(ROOT, "src/child/routes.tsx"), "utf8");
  assert.match(routes, /kakshaEnabled\(\(me as \{ ui\?: \{ kaksha\?: boolean \} \}\)\.ui\?\.kaksha\)/, "the route switch passes the server's cohort answer");
});

test("release 11 (dc-r4-volt-everywhere): Kaksha for EVERY account in every build; ?ui=classic is the only way out", () => {
  for (const server of [false, undefined, true]) for (const dev of [false, true]) for (const buildDefault of [false, true]) {
    assert.equal(kakshaDecision({ dev, buildDefault, server, device: null }), true, `on by default (server ${server}, dev ${dev})`);
    assert.equal(kakshaDecision({ dev, buildDefault, server, device: true }), true);
    assert.equal(kakshaDecision({ dev, buildDefault, server, device: false }), false, "?ui=classic on this device always wins");
  }
});

test("end to end in a production-like runtime: on with no URL; ?ui=classic turns it off on the device and it stays off; ?ui=default restores", () => {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  globalThis.location = { search: "" };
  _resetKakshaUrlForTests();
  assert.equal(kakshaEnabled(undefined), true, "before /api/me answers: Kaksha");
  assert.equal(kakshaEnabled(false), true, "outside the old cohort: Kaksha");
  globalThis.location = { search: "?ui=classic" };
  _resetKakshaUrlForTests();
  assert.equal(kakshaEnabled(true), false, "?ui=classic: today's classic app on this device");
  assert.equal(store.get(UI_KAKSHA_KEY), "0");
  globalThis.location = { search: "" };
  _resetKakshaUrlForTests();
  assert.equal(kakshaEnabled(true), false, "and it stays off on that device");
  globalThis.location = { search: "?ui=default" };
  _resetKakshaUrlForTests();
  assert.equal(kakshaEnabled(false), true, "?ui=default clears the device choice");
  delete globalThis.localStorage;
  delete globalThis.location;
});
