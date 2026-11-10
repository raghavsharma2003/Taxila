// Main on integrations 25c and 28: scriptFor cached a topic's script by topic id alone, so a suite walking the real c4 kit left the
// real script for a later mini-kit suite on the same topic id. The cache is keyed by the kit (topic id + kit hash, else the kit object).
import { test } from "node:test";
import assert from "node:assert/strict";
import { scriptFor, setScriptForTest } from "../server/director/script.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";

test("two kits sharing a topic id never serve each other's script", (t) => {
  t.after(() => setScriptForTest());
  const real = kitFromFile(getTopic("c4-maths-ch05-t01"));
  assert.ok(real.hash, "a file kit carries its hash");
  const a = scriptFor(real);
  assert.ok(a, "the real kit walks the real script");
  assert.equal(scriptFor(real), a, "cached for the same kit");
  // a mini-kit on the same topic id: none of the real kit's skills, so the real script validates no skill for it
  const mini = { topicId: real.topicId, title: "mini", skills: [], items: [] };
  assert.equal(scriptFor(mini), null);
  // and the real kit still has its own, after the mini-kit was read
  assert.equal(scriptFor(real), a);
  // a kit with the same topic id and another hash is read for itself
  const other = { ...real, hash: "0000000000000000" };
  assert.notEqual(scriptFor(other), a);
  // an override for the topic is served after it is set, never an entry cached before it
  setScriptForTest(real.topicId, null);
  assert.equal(scriptFor(real), null);
});
