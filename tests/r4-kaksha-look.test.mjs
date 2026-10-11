// The Kaksha look (main session 2026-10-10: Volt for both families, Holo the alternate, a per-device ?look= switch, the
// ?ui= pattern; the whole child app under the look ONLY for the ui.kaksha cohort). Pure; no browser.
// Run: node --test tests/r4-kaksha-look.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { KAKSHA_LOOK, LOOK_KEY, LOOK_KEY_OLD, kakshaLook, lookAttr, futurist, _resetLookUrlForTests } from "../src/ui-v3/kaksha/look.ts";
import { UI_KAKSHA_KEY, UI_KAKSHA_KEY_OLD } from "../src/ui-v3/kaksha/flag.ts";
import { kakshaShellAttrs } from "../src/ui-v3/kaksha/shell-attrs.ts";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
function device(search) {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  globalThis.location = { search };
  _resetLookUrlForTests();
  return store;
}

test("the pick: Volt for both families, and the attribute follows it", () => {
  assert.deepEqual(KAKSHA_LOOK, { young: "volt", older: "volt" });
  device("");
  assert.equal(kakshaLook("young"), "volt"); assert.equal(kakshaLook("older"), "volt");
  assert.equal(lookAttr("older"), "volt"); assert.equal(futurist(), true);
});

test("?look=holo switches this device (both families) and stays; ?look=default gives the pick back; classic is dev-only", () => {
  const store = device("?look=holo");
  assert.equal(kakshaLook("older"), "holo"); assert.equal(kakshaLook("young"), "holo");
  assert.equal(store.get(LOOK_KEY), "holo", "the device remembers");
  globalThis.location = { search: "" }; _resetLookUrlForTests();
  assert.equal(kakshaLook("young"), "holo", "stays on later pages");
  globalThis.location = { search: "?look=default" }; _resetLookUrlForTests();
  assert.equal(kakshaLook("young"), "volt");
  device("?look=classic");
  assert.equal(kakshaLook("older"), "volt", "a production build ignores ?look=classic (node: not a dev build)");
  device("?look=nonsense");
  assert.equal(kakshaLook("older"), "volt");
  delete globalThis.localStorage; delete globalThis.location;
});

test("ChildShell carries the look for EVERY account (release 11), even before /api/me; nothing only on a ?ui=classic device", () => {
  const store = device("");
  for (const me of [{ ui: { kaksha: true } }, { ui: { kaksha: false } }, {}, null]) {
    assert.deepEqual(kakshaShellAttrs(me, "older"), { "data-klook": "volt", "data-ktheme": "night" });
    assert.deepEqual(kakshaShellAttrs(me, "young"), { "data-klook": "volt", "data-ktheme": "dawn" });
  }
  assert.deepEqual(kakshaShellAttrs(null, null), { "data-klook": "volt", "data-ktheme": "night" }, "the gate before /api/me: the night look");
  store.set(UI_KAKSHA_KEY, "0");
  assert.deepEqual(kakshaShellAttrs({ ui: { kaksha: true } }, "older"), {}, "?ui=classic device: today's classic shell");
  const shell = read("src/child/ChildShell.tsx");
  assert.match(shell, /\.\.\.kakshaShellAttrs\(ctx \? me : null, ctx\?\.family \?\? null\),/);
  delete globalThis.localStorage; delete globalThis.location;
});

test("the shared-screen mapping is var() only and matches nothing without data-klook", () => {
  const css = read("src/ui-v3/kaksha/childshell.css").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b|\brgba?\(/, "no colour literal");
  const sels = [...css.matchAll(/([^{}]+)\{[^}]*\}/g)].map((m) => m[1].trim());
  for (const sel of sels) for (const one of sel.split(",")) assert.match(one.trim(), /^\.tx-child[^ ]*\[data-klook/, `scoped: ${one.trim()}`);
  const tokens = read("src/ui-v3/kaksha/tokens.css");
  for (const look of ["holo", "volt"]) for (const t of ["night", "dawn"]) assert.ok(tokens.includes(`.tx-child[data-klook="${look}"][data-ktheme="${t}"]`), `k tokens on the shell: ${look} ${t}`);
});

test("release 11 starts every device on the shipped default: a pre-r11 ?look= / ?ui=classic key is ignored and removed", async () => {
  const { kakshaEnabled, _resetKakshaUrlForTests } = await import("../src/ui-v3/kaksha/flag.ts");
  const store = device("");
  store.set(LOOK_KEY_OLD, "holo"); store.set(UI_KAKSHA_KEY_OLD, "0");
  _resetKakshaUrlForTests();
  assert.equal(kakshaLook("older"), "volt", "an old ?look=holo does not override the new default");
  assert.equal(kakshaEnabled(true), true, "an old ?ui=classic does not override the new default");
  assert.equal(store.has(LOOK_KEY_OLD), false, "the old look key is removed on first read");
  assert.equal(store.has(UI_KAKSHA_KEY_OLD), false, "the old ui key is removed on first read");
  assert.notEqual(LOOK_KEY, LOOK_KEY_OLD); assert.notEqual(UI_KAKSHA_KEY, UI_KAKSHA_KEY_OLD);
  globalThis.location = { search: "?ui=classic" }; _resetKakshaUrlForTests();
  assert.equal(kakshaEnabled(true), false, "?ui=classic keeps working from then on");
  delete globalThis.localStorage; delete globalThis.location;
});
