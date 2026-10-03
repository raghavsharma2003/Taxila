// The gate kernel (server/compiler/gates.js): harvest port task 2 with its default INVERTED. The source mapped
// `unverified` to adult gates (romance and engagement mechanics on). Taxila has no adult branch at all.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { gatesFor, saferGates, assertMinorGates, MINOR_GATES } from "../server/compiler/gates.js";
import { compile, FLOOR_FIX, FIX_LOAD_GATE } from "../server/compiler/compile.js";
import { CHARACTERS } from "../server/compiler/characters/index.js";

test("every tier — adult, verified, unverified, unknown, garbage — gets the frozen minor gates", () => {
  for (const t of ["adult", "verified_adult", "unverified", "minor", undefined, null, 18, {}, "13+"]) assert.equal(gatesFor(t), MINOR_GATES, String(t));
  assert.ok(Object.isFrozen(MINOR_GATES) && Object.isFrozen(MINOR_GATES.neverRules));
  assert.equal(MINOR_GATES.romance, false);
  assert.equal(MINOR_GATES.engagementMechanics, false);
  assert.throws(() => { "use strict"; MINOR_GATES.romance = true; }, TypeError);
});

test("the ratchet only restricts: a permissive set on either side comes back minor", () => {
  const permissive = { tier: "adult", romance: true, companionRegister: true, engagementMechanics: true, personalDataAsks: true, claimsHumanity: true, helplines: false, neverRules: [] };
  assert.deepEqual(saferGates(permissive, permissive), MINOR_GATES);
  assert.throws(() => assertMinorGates(permissive), /no adult branch/);
  assert.equal(assertMinorGates(MINOR_GATES), MINOR_GATES);
});

test("compile() gives a brief that claims adulthood the same minor floor, byte for byte", () => {
  const base = {
    character: CHARACTERS.arjun, lessonState: { phase: "teach", turn: 1, minutes: 0, hintLevel: 0 }, move: { kind: "explain", shape: "one idea" },
    topic: { title: "Fractions", classLevel: 6, subject: "maths" }, language: "english", lane: "text",
  };
  const brief = { firstName: "A", classLevel: 6, ageBand: "10-15", languagePref: "english", interests: [], recentWins: [], activeMisconceptions: [], memoryCallbacks: [], vibe: { pace: "medium", verbosity: "brief", humour: "low" }, relationshipStage: "new" };
  assert.equal(compile({ ...base, brief: { ...brief, ageTier: "adult" } }), compile({ ...base, brief }));
});

test("no source file defines a permissive gate (romance/engagement mechanics on) for any tier", () => {
  const hits = [];
  const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = `${d}/${e.name}`; if (e.isDirectory()) { if (e.name !== "node_modules") walk(p); } else if (/\.(m?js|tsx?)$/.test(e.name) && /\b(romance|engagementMechanics)\s*:\s*true\b/.test(readFileSync(p, "utf8"))) hits.push(p); } };
  for (const d of ["../server", "../src", "../shared"]) walk(new URL(d, import.meta.url).pathname);
  assert.deepEqual(hits, []);
});

test("the kit load gate renders the longest correction pair the director can produce (computed, not pinned)", () => {
  const keys = Object.keys(FLOOR_FIX);
  const len = (c) => c.reduce((a, k) => a + FLOOR_FIX[k].length, 0);
  let longest = 0;
  for (const a of keys) for (const b of keys) if (a < b) longest = Math.max(longest, len([a, b]));
  assert.equal(len(FIX_LOAD_GATE), longest);
  // every key but exclusivity stays <= 25 characters, so the longest pair is still the original one: the load
  // gate admits exactly what it admitted before the never-rules keys existed (2026-10-03 review: personal_data
  // at 31 characters made exclusivity + personal_data 6 characters longer than what checkFits measured)
  for (const [k, v] of Object.entries(FLOOR_FIX)) if (k !== "exclusivity") assert.ok(v.length <= 25, `${k}: ${v.length}`);
  assert.deepEqual([...FIX_LOAD_GATE].sort(), ["ai_denial", "exclusivity"]);
});

test("assertMinorGates is a tripwire, not a live guard: it fails only on a gate set gatesFor cannot return today", () => {
  // documented in context (decision gate-kernel-no-adult-branch): compile()'s per-call assertion has no runtime
  // effect while gatesFor has one answer; this pins that it WOULD throw for any widened set.
  for (const k of Object.keys(MINOR_GATES).filter((x) => x !== "tier" && x !== "neverRules")) {
    assert.throws(() => assertMinorGates({ ...MINOR_GATES, [k]: !MINOR_GATES[k] }), /no adult branch/, k);
  }
  assert.throws(() => assertMinorGates({ ...MINOR_GATES, neverRules: MINOR_GATES.neverRules.slice(1) }), /no adult branch/);
});
