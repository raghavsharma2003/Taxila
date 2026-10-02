// Kit pinning (content/index.js): a lesson reads back the exact kit it started on. Kit files are rewritten
// by another workflow while lessons run; a lesson that started on a mini-kit once switched to the file kit
// the moment one appeared, and its "-mk-" item ids resolved to nothing.
import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

import { RAW_KIT, CTX } from "./fixtures/kit.mjs";
import { normalizeKit, kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import * as content from "../server/content/index.js";
import { initLessonState, step } from "../server/director/state.js";
import { findItem } from "../server/director/items.js";

/** asset_cache stand-in, shared by every module instance (it is the durable copy across processes). */
const durable = new Map();
const memStore = { get: async (k) => durable.get(k) ?? null, put: async (k, v) => { durable.set(k, structuredClone(v)); } };

const topic = getTopic(RAW_KIT.topicId);
const mk = (id) => `${RAW_KIT.topicId}-mk-${id}`;
const MINI_RAW = { ...RAW_KIT, items: RAW_KIT.items.map((i) => ({ ...i, id: mk(i.id) })) };

describe("kit pinning", () => {
  const dir = mkdtempSync(join(tmpdir(), "taxila-kits-"));
  // The kit loader reads TAXILA_KITS_DIR per call; scoped to these tests (npm test runs every file in one process).
  const saved = process.env.TAXILA_KITS_DIR;
  before(() => { process.env.TAXILA_KITS_DIR = dir; });
  after(() => {
    if (saved === undefined) delete process.env.TAXILA_KITS_DIR; else process.env.TAXILA_KITS_DIR = saved;
    rmSync(dir, { recursive: true, force: true });
  });

  test("a lesson started on a mini-kit keeps resolving its item after a file kit appears", async () => {
    content.setPinStore(memStore);
    assert.equal(kitFromFile(topic), null, "no kit file yet");
    const mini = normalizeKit(MINI_RAW, { topicId: topic.id, verified: false });
    await content.pinKit(mini);
    // Walk the lesson to its first practice item, as the start + turn routes would.
    let r = step(initLessonState({ topicId: topic.id, kit: mini, ctx: CTX, seed: 1, now: 0 }), { event: "start", kit: mini, now: 0 });
    for (let i = 0; i < 6 && !r.state.activeItemId; i++) r = step(r.state, { event: "turn", kit: mini, cls: { outcome: "no_evidence", confidence: 1, source: "test", flags: {} }, now: (i + 1) * 20_000 });
    const state = { ...r.state, kitHash: mini.hash };
    assert.match(state.activeItemId, /-mk-/);

    writeFileSync(join(dir, `c${topic.classLevel}-${topic.subject}.json`), JSON.stringify({ topics: [RAW_KIT] }));
    const file = kitFromFile(topic);
    assert.ok(file && file.hash !== mini.hash, "the file kit is a different kit");
    assert.equal(findItem(state, file, state.activeItemId), null, "the file kit cannot resolve the lesson's item");

    const kit = await content.pinnedKit(topic.id, state.kitHash);
    assert.equal(kit.hash, mini.hash);
    assert.ok(findItem(state, kit, state.activeItemId), "the pinned kit still resolves activeItemId");

    // A cold process (fresh module, empty memory) reads the same kit back from the durable copy.
    const cold = await import("../server/content/index.js?cold");
    cold.setPinStore(memStore);
    assert.equal((await cold.pinnedKit(topic.id, state.kitHash))?.hash, mini.hash);
    assert.equal(await cold.pinnedKit(topic.id, "0000000000000000"), null, "an unknown pin is null (the route answers 503), never generated");
  });

  test("a file kit pinned at start is served from the file while it is unchanged", async () => {
    const fresh = await import("../server/content/index.js?file");
    fresh.setPinStore({ get: async () => { throw new Error("the durable copy is not needed"); }, put: async () => {} });
    const file = kitFromFile(topic);
    assert.equal((await fresh.pinnedKit(topic.id, file.hash))?.hash, file.hash);
    assert.equal(kitFromFile(topic), file, "an unchanged file is normalized once, not on every lookup");
  });
});
