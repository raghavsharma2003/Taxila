// r7 app-nav-unified: the one Kaksha navigation model (src/ui-v3/kaksha/nav-model.ts) and that no child screen under
// Kaksha brings back the classic tab bar.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { backOf, dockItems, navKeyOf } from "../src/ui-v3/kaksha/nav-model.ts";

const cid = "6fc3f68e-0000-4000-8000-000000000001";

test("the dock: Home, World, Practice, Ask, Notebook for the older family", () => {
  assert.deepEqual(dockItems({ cid, family: "older" }).map((i) => i.key), ["home", "world", "practice", "ask", "notebook"]);
  assert.equal(dockItems({ cid, family: "older" })[1].to, `/c/${cid}/map`);
});

test("surfaces the parent turned off are absent, never dimmed", () => {
  const keys = dockItems({ cid, family: "older", surfaces: { map: false, notebook: false } }).map((i) => i.key);
  assert.deepEqual(keys, ["home", "practice", "ask"]);
});

test("Young: no Ask in the dock", () => {
  assert.ok(!dockItems({ cid, family: "young" }).some((i) => i.key === "ask"));
});

test("every child path maps to one dock entry; the lesson has none", () => {
  assert.equal(navKeyOf(`/c/${cid}`), "home");
  assert.equal(navKeyOf(`/c/${cid}/`), "home");
  assert.equal(navKeyOf(`/c/${cid}/hangar`), "world");
  assert.equal(navKeyOf(`/c/${cid}/teacher`), "me");
  assert.equal(navKeyOf(`/c/${cid}/lesson/new`), null);
  assert.equal(navKeyOf("/parent"), null);
});

test("back is one level up; Home has no back", () => {
  assert.equal(backOf(`/c/${cid}`, cid), null);
  assert.equal(backOf(`/c/${cid}/notebook`, cid), `/c/${cid}`);
  assert.equal(backOf(`/c/${cid}/hangar`, cid), `/c/${cid}/map`);
  assert.equal(backOf(`/c/${cid}/teacher`, cid), `/c/${cid}/me`);
});

test("ChildScreen under Kaksha renders the Kaksha frame before the classic OlderNav", () => {
  const src = fs.readFileSync(new URL("../src/child/chrome.tsx", import.meta.url), "utf8");
  const fn = src.slice(src.indexOf("export function ChildScreen"));
  assert.ok(fn.indexOf("kakshaEnabled(") > 0 && fn.indexOf("kakshaEnabled(") < fn.indexOf("<OlderNav"), "the Kaksha branch returns first");
});
