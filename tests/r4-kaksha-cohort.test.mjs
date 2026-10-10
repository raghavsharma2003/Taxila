// K-P10: the Kaksha owner cohort is enforced server-side (main session 2026-10-10). In a production build, ?ui=kaksha or
// the device key turns Kaksha on ONLY for an account the server marks as in the cohort (GET /api/me → ui.kaksha, from
// TAXILA_UI_KAKSHA). An account outside the cohort that types ?ui=kaksha still gets today's Home.
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

test("decision: production, outside the cohort, ?ui=kaksha → today's Home", () => {
  for (const server of [false, undefined]) assert.equal(kakshaDecision({ dev: false, buildDefault: false, server, device: true }), false);
  assert.equal(kakshaDecision({ dev: false, buildDefault: false, server: true, device: true }), true, "cohort + opt-in");
  assert.equal(kakshaDecision({ dev: false, buildDefault: false, server: true, device: null }), false, "cohort alone does not switch it on");
  assert.equal(kakshaDecision({ dev: true, buildDefault: false, server: undefined, device: true }), true, "dev builds: the URL stays free");
  assert.equal(kakshaDecision({ dev: false, buildDefault: true, server: false, device: null }), true, "the deploy-wide default, after acceptance");
  assert.equal(kakshaDecision({ dev: false, buildDefault: true, server: true, device: false }), false, "?ui=classic always wins on the device");
});

test("end to end in a production-like runtime: typing ?ui=kaksha does nothing outside the cohort", () => {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  globalThis.location = { search: "?ui=kaksha" };
  _resetKakshaUrlForTests();
  // node has no import.meta.env: a production-like build (DEV false, VITE_UI_KAKSHA unset)
  assert.equal(kakshaEnabled(false), false, "outside the cohort: today's Home");
  assert.equal(kakshaEnabled(undefined), false, "before /api/me answers: today's Home");
  assert.equal(store.get(UI_KAKSHA_KEY), "1", "the device remembers the opt-in");
  assert.equal(kakshaEnabled(true), true, "inside the cohort: Kaksha");
  globalThis.location = { search: "?ui=classic" };
  _resetKakshaUrlForTests();
  assert.equal(kakshaEnabled(true), false, "?ui=classic turns it off even in the cohort");
  delete globalThis.localStorage;
  delete globalThis.location;
});
