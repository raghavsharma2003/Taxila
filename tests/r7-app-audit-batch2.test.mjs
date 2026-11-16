// Round 7 whole-project audit, app area, batch 2: APP-06 (sealedAt survives normaliseMap), APP-19 (the settlement keeps its order).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { normaliseMap, sealedChaptersOf } from "../src/child/api.ts";
import { world, sinceOf } from "../src/ui-v3/kaksha/world.ts";

const CAT = JSON.parse(fs.readFileSync(new URL("../data/kaksha/catalog.json", import.meta.url), "utf8"));

test("APP-06: normaliseMap carries sealedAt through to the World's seals", () => {
  const raw = { mode: "sky", hidden: false, subjects: [{ subject: "maths", book: "b", chapters: [
    { id: "a", number: 1, title: "A", sealed: true, here: false, sealedAt: "2026-11-02T10:00:00Z", secure: 1, total: 1, topics: [{ id: "t", title: "T", skills: [{ skillId: "s", state: "secure" }] }] },
    { id: "b", number: 2, title: "B", sealed: true, here: false, secure: 0, total: 1, topics: [] }] }], skills: [] };
  const m = normaliseMap(raw, "sky");
  assert.equal(m.subjects[0].chapters[0].sealedAt, "2026-11-02T10:00:00Z");
  assert.equal(m.subjects[0].chapters[1].sealedAt, null);
  assert.equal(sealedChaptersOf(m)[0].sealedAt, "2026-11-02T10:00:00Z");
});

const sk = (id, since) => ({ skillId: id, title: id, subject: "maths", state: "secure", ...(since ? { secureSince: since } : {}) });
const slotOf = (w) => Object.fromEntries(w.structures.map((s) => [s.skillId, s.slot]));

test("APP-19: a newly secure skill is appended; no existing structure moves", () => {
  const old = ["m1", "m2", "m3", "m4", "m5"].map((id, i) => sk(id, `2026-10-0${i + 1}T08:00:00Z`));
  const w5 = slotOf(world(old, CAT, undefined, sinceOf(old)));
  const more = [...old, sk("zz-new", "2026-11-09T08:00:00Z")];
  const w6 = slotOf(world(more, CAT, undefined, sinceOf(more)));
  for (const id of Object.keys(w5)) assert.equal(w6[id], w5[id], `${id} stayed`);
  assert.equal(w6["zz-new"], 5);
});

test("APP-19: skills with no stamp (secure before stamps) come first, and a stamped one never goes before them", () => {
  const base = [sk("a1"), sk("a2"), sk("a3")];
  const before = slotOf(world(base, CAT, undefined, sinceOf(base)));
  const more = [...base, sk("aa-new", "2026-11-09T08:00:00Z")];
  const after = slotOf(world(more, CAT, undefined, sinceOf(more)));
  for (const id of Object.keys(before)) assert.equal(after[id], before[id], `${id} stayed`);
  assert.equal(after["aa-new"], 3);
});

test("APP-19: both callers pass the stamps", () => {
  assert.match(fs.readFileSync(new URL("../src/ui-v3/kaksha/screens/KakshaWorld.tsx", import.meta.url), "utf8"), /world\(skills, CATALOG, before \?\? undefined, since\)/);
  assert.match(fs.readFileSync(new URL("../src/ui-v3/kaksha/lesson/debrief.ts", import.meta.url), "utf8"), /sinceOf\(after\.skills\)/);
});

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("APP-17: the hull and trail colours come from the look's palette, not the retired classic Night one", async () => {
  const { cosmeticsFor, paletteFor } = await import("../src/ui-v3/kaksha/play/cosmetics.ts");
  const { K_VOLT_NIGHT, K_VOLT_DAY, K_NIGHT } = await import("../src/ui-v3/kaksha/tokens.ts");
  const items = [{ id: "hull-x", kind: "hull", hue: "her", open: true }, { id: "trail-x", kind: "trail", hue: "secure", open: true }];
  const eq = { hull: "hull-x", trail: "trail-x" };
  const hex = (s) => parseInt(s.slice(1), 16);
  assert.equal(paletteFor("older"), K_VOLT_NIGHT);
  assert.equal(paletteFor("young"), K_VOLT_DAY);
  assert.deepEqual(cosmeticsFor(eq, items, paletteFor("young")), { hull: hex(K_VOLT_DAY.her), trail: hex(K_VOLT_DAY.secure) });
  assert.notEqual(K_VOLT_DAY.her, K_NIGHT.her, "the two palettes really differ, so the old read was wrong");
  assert.match(read("src/ui-v3/kaksha/lesson/KakshaLesson.tsx"), /cosmeticsFor\(eq, items, paletteFor\(family\)\)/);
});

test("APP-18: under Less motion a new station is drawn at full size", () => {
  assert.match(read("src/ui-v3/kaksha/Orbit.tsx"), /const k = reducedMotion \? 1 : Math\.min\(1, t \/ 1\.4\)/);
});

test("APP-13: the first-paint list and the shell's list both name /pricing, /pair and /signin", () => {
  assert.match(read("index.html"), /promises\|privacy\|help\|leaving\|trust\|pricing\|pair\|signin/);
  assert.match(read("src/app/Shell.tsx"), /PUBLIC_PATH = \/\^\\\/\(promises\|privacy\|help\|leaving\|trust\|pricing\|pair\|signin\)/);
});

test("APP-11: the landing scrolls to its hash; APP-14: one word for 'secure'; APP-16: her name from the record", () => {
  assert.match(read("src/app/landing/Landing.tsx"), /scrollIntoView/);
  assert.match(read("src/copy/en.ts"), /"growth\.now": "Secure since \{date\}"/);
  assert.doesNotMatch(read("src/copy/en.ts"), /Pakka/);
  const c = read("src/ui-v3/kaksha/copy.ts");
  assert.match(c, /openSub: K\("Just start\. \{T\} takes it/);
  assert.match(read("src/ui-v3/kaksha/views.tsx"), /kt\("openSub", \{ T: p\.teacher\.name \}\)/);
});

test("APP-05: submitting or confirming by typing cancels the Ask recording; a late recorder is cancelled", () => {
  const a = read("src/child/screens/Ask.tsx");
  assert.equal((a.match(/cancelVoice\(\);/g) ?? []).length, 2);
  assert.match(a, /if \(!alive\.current\) \{ r\.cancel\(\); return; \}/);
});
