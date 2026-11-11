// r7 stream E app-world-hangar-depth (PIPELINE §14 B2-4): chapter seals on the Kaksha World and the Debrief, decided by
// the ledger (server/routes/child.js buildMap: every skill Got it or Secure), never by an app count; a seal fires once,
// in the lesson that sealed it.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const map = (sealed) => ({ skills: [{ skillId: "s1", title: "x", subject: "maths", state: "got_it" }],
  subjects: [{ subject: "maths", chapters: [{ id: "c6-maths-ch07", title: "Fractions", sealed }, { id: "c6-maths-ch02", title: "Angles", sealed: true }] }] });

test("nowSealed: only chapters the ledger sealed during this lesson; an unknown read claims nothing", async () => {
  const { nowSealed } = await import("../src/ui-v3/kaksha/lesson/debrief.ts");
  assert.deepEqual(nowSealed(map(false), map(true)), [{ chapterId: "c6-maths-ch07", title: "Fractions", subject: "maths" }]);
  assert.deepEqual(nowSealed(map(true), map(true)), [], "sealed before the lesson: not this lesson's moment");
  assert.deepEqual(nowSealed(null, map(true)), []);
  assert.deepEqual(nowSealed({ skills: [] }, map(true)), [], "a read without chapters is unknown");
  assert.deepEqual(nowSealed({ ...map(false), hidden: true }, map(true)), []);
});

test("the World lists the sealed chapters from the map's own flag; nothing in the app counts skills to seal", async () => {
  const { sealedChaptersOf } = await import("../src/child/api.ts");
  assert.deepEqual(sealedChaptersOf(map(false)), [{ id: "c6-maths-ch02", subject: "maths", title: "Angles" }]);
  const v = read("src/ui-v3/kaksha/views.tsx");
  assert.match(v, /data-testid="world-seals"/);
  for (const f of ["src/ui-v3/kaksha/lesson/debrief.ts", "src/child/api.ts", "src/ui-v3/kaksha/views.tsx"]) {
    assert.doesNotMatch(read(f), /every\(\(x\) => x\.state === "got_it"/, `${f}: the seal rule belongs to the server`);
  }
});

test("an equipped board theme and rim reach the lesson only while the item is open (colour only)", async () => {
  const { lessonLook } = await import("../src/ui-v3/kaksha/play/cosmetics.ts");
  const items = [
    { id: "board-nebula", kind: "board", hue: "ion", open: true },
    { id: "rim-light", kind: "rim", hue: "her", open: false },
    { id: "hull-thirds", kind: "hull", hue: "plasma", open: true },
  ];
  assert.deepEqual(lessonLook({ board: "board-nebula", rim: "rim-light" }, items), { board: "ion", rim: null }, "a closed rim never shows");
  assert.deepEqual(lessonLook({ board: "hull-thirds" }, items), { board: null, rim: null }, "a hull in the board slot is ignored");
  assert.match(read("src/ui-v3/kaksha/lesson/KakshaLesson.tsx"), /setLook\(lessonLook\(eq, items\)\)/);
});

test("the catalog grows per subject with unique ids, known kinds and hues that have a --k-hue var", () => {
  const c = JSON.parse(read("data/kaksha/catalog.json"));
  const ids = c.items.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const i of c.items) {
    assert.ok(["hull", "trail", "board", "rim", "emote"].includes(i.kind), i.id);
    assert.match(read("src/ui-v3/kaksha/kaksha.css"), new RegExp(`--k-hue-${i.hue}:`), `${i.id}: --k-hue-${i.hue}`);
    assert.doesNotThrow(() => new RegExp(i.match), i.id);
  }
  for (const kind of ["hull", "trail", "board", "rim", "emote"]) assert.ok(c.items.filter((i) => i.kind === kind).length >= 2, kind);
});

test("equip follows the child across devices through Learning's route, kept apart from device memory", async () => {
  const real = globalThis.fetch;
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  try {
    const { syncEquipped, pushEquipped } = await import("../src/ui-v3/kaksha/equipSync.ts");
    globalThis.fetch = async () => new Response(JSON.stringify({ equipped: { hull: "hull-thirds", board: null } }), { status: 200 });
    assert.deepEqual(await syncEquipped("c1"), { hull: "hull-thirds" });
    assert.equal(store.get("kx.hangar.c1.equipped"), JSON.stringify({ hull: "hull-thirds" }), "the server's set is kept on the device");
    globalThis.fetch = async () => new Response("{}", { status: 404 });
    assert.equal(await syncEquipped("c1"), null, "no route yet: the device's choice stands");
    let sent = null;
    globalThis.fetch = async (url, init) => { sent = JSON.parse(init.body); return new Response(JSON.stringify({ equipped: {} }), { status: 200 }); };
    assert.equal(await pushEquipped("c1", { hull: "hull-thirds", emote: "Bad Slug!" }), true);
    assert.deepEqual(sent, { childId: "c1", equipped: { hull: "hull-thirds", trail: null, board: null, rim: null, emote: null } }, "a bad emote slug is never sent");
  } finally {
    globalThis.fetch = real;
    delete globalThis.localStorage;
  }
});

test("a seal shows 'since' only with the ledger's stamp", async () => {
  const { sealedChaptersOf } = await import("../src/child/api.ts");
  const m = { subjects: [{ subject: "maths", chapters: [{ id: "a", title: "A", sealed: true, sealedAt: "2026-11-02T10:00:00Z" }, { id: "b", title: "B", sealed: true, sealedAt: null }] }] };
  assert.deepEqual(sealedChaptersOf(m), [{ id: "a", subject: "maths", title: "A", sealedAt: "2026-11-02T10:00:00Z" }, { id: "b", subject: "maths", title: "B" }]);
});

test("a chapter that dipped and re-sealed is not this lesson's moment (its first sealedAt predates the start read)", async () => {
  const { nowSealed } = await import("../src/ui-v3/kaksha/lesson/debrief.ts");
  const before = { skills: [{ skillId: "s9", title: "x", subject: "maths", state: "secure", secureSince: "2026-11-04T09:00:00Z" }],
    subjects: [{ subject: "maths", chapters: [{ id: "ch7", title: "Fractions", sealed: false, sealedAt: null }] }] };
  const resealed = { ...before, subjects: [{ subject: "maths", chapters: [{ id: "ch7", title: "Fractions", sealed: true, sealedAt: "2026-11-01T10:00:00Z" }] }] };
  const fresh = { ...before, subjects: [{ subject: "maths", chapters: [{ id: "ch7", title: "Fractions", sealed: true, sealedAt: "2026-11-05T10:30:00Z" }] }] };
  assert.deepEqual(nowSealed(before, resealed), []);
  assert.deepEqual(nowSealed(before, fresh).map((c) => c.chapterId), ["ch7"]);
});

test("Yesterday/Today from the ledger's secureSince; the device snapshot only when the map has no stamps", async () => {
  const { secureBeforeToday, localDay } = await import("../src/ui-v3/kaksha/memory.ts");
  const today = localDay(new Date("2026-11-06T12:00:00"));
  const skills = [
    { skillId: "a", state: "secure", secureSince: new Date("2026-11-06T09:00:00").toISOString() },
    { skillId: "b", state: "secure", secureSince: new Date("2026-11-02T09:00:00").toISOString() },
    { skillId: "c", state: "secure", secureSince: null },
    { skillId: "d", state: "got_it", secureSince: null },
  ];
  assert.deepEqual([...secureBeforeToday(skills, today)].sort(), ["b", "c"], "a is new today; an unstamped secure skill is old");
  assert.equal(secureBeforeToday([{ skillId: "a", state: "secure" }], today), null, "no stamps at all: fall back to the device");
  assert.match(read("src/ui-v3/kaksha/screens/KakshaWorld.tsx"), /secureBeforeToday\(skills\) \?\? rollSnapshot\(cid, now\)/);
});
