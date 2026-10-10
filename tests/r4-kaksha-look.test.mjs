// The Kaksha look (main session 2026-10-10: Volt for both families, Holo the alternate, a per-device ?look= switch, the
// ?ui= pattern; the whole child app under the look ONLY for the ui.kaksha cohort). Pure; no browser.
// Run: node --test tests/r4-kaksha-look.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { KAKSHA_LOOK, LOOK_KEY, kakshaLook, lookAttr, futurist, _resetLookUrlForTests } from "../src/ui-v3/kaksha/look.ts";
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

test("ChildShell carries the look ONLY for the ui.kaksha cohort (K-P14); everyone else gets nothing", () => {
  device("");
  assert.deepEqual(kakshaShellAttrs({ ui: { kaksha: true } }, "older"), { "data-klook": "volt", "data-ktheme": "night" });
  assert.deepEqual(kakshaShellAttrs({ ui: { kaksha: true } }, "young"), { "data-klook": "volt", "data-ktheme": "dawn" });
  assert.deepEqual(kakshaShellAttrs({ ui: { kaksha: false } }, "older"), {});
  assert.deepEqual(kakshaShellAttrs({}, "older"), {});
  assert.deepEqual(kakshaShellAttrs(null, "older"), {});
  assert.deepEqual(kakshaShellAttrs({ ui: { kaksha: true } }, null), {});
  const shell = read("src/child/ChildShell.tsx");
  assert.match(shell, /\.\.\.kakshaShellAttrs\(ctx \? me : null, ctx\?\.family\),/);
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
