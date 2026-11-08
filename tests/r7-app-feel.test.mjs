// r7 stream E, Learning's patch to-app/007 (cold-start answers): the child's "Maths feels…" at Hello and the parent's
// "How does school feel…" in set-up. Never a quiz: three faces, no right answer, no score, nothing after a pick but "Got it".
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const F = await import("../src/child/feel.ts");
const { R7 } = await import("../src/copy/en.ts");

test("the rows are the class's main subjects: maths, and EVS (1-5) or science (6+)", () => {
  assert.deepEqual(F.feelSubjects(3), ["maths", "evs"]);
  assert.deepEqual(F.feelSubjects(5), ["maths", "evs"]);
  assert.deepEqual(F.feelSubjects(6), ["maths", "science"]);
  assert.deepEqual(F.feelSubjects(9), ["maths", "science"]);
});

test("only what she picked is sent, in the route's own values; nothing picked sends nothing", () => {
  assert.equal(F.feelBody("c1", {}), null);
  assert.equal(F.feelBody("c1", { maths: undefined }), null);
  assert.deepEqual(F.feelBody("c1", { maths: "tricky", evs: undefined }), { childId: "c1", childPicks: { maths: "tricky" } });
  assert.deepEqual(F.feelBody("c1", { maths: "easy", science: "okay", sst: "nope" }), { childId: "c1", childPicks: { maths: "easy", science: "okay" } });
  assert.deepEqual([...F.PICKS], ["easy", "okay", "tricky"]);
  assert.match(read("src/child/api.ts"), /postJson<\{ note\?: unknown \}>\("\/api\/placement\/onboarding", body\)/);
});

test("Hello asks it after the likes and before the voice check, sends once on Next, and never waits on the answer", () => {
  const h = read("src/child/screens/Hello.tsx");
  assert.match(h, /\{ card: "likes", key: "bootLikes" \}, \{ card: "feel", key: "bootFeel" \}, \{ card: "hi", key: "bootHi" \}/);
  assert.match(h, /const afterLikes = \(picks: string\[\]\) => \{ setLikes\(picks\); setCard\("feel"\); \};/);
  assert.match(h, /if \(body\) void postFeelPicks\(body\)\.catch\(/);
  assert.equal((h.match(/case "feel":/g) ?? []).length, 2, "both looks");
});

test("it is never a test: no question marks, no score words, no exclamation, faces drawn not emoji", () => {
  const words = Object.entries(R7).filter(([k]) => k.startsWith("feel.")).map(([, v]) => v);
  assert.ok(words.length >= 8);
  for (const w of words) {
    assert.doesNotMatch(w, /[?!]/, w);
    assert.doesNotMatch(w, /\b(score|right answer is|correct|wrong|level|test|quiz|behind|ahead)\b/i, w);
    assert.doesNotMatch(w, /\p{Extended_Pictographic}/u, w);
  }
  assert.doesNotMatch(read("src/child/FeelFaces.tsx"), /\p{Extended_Pictographic}/u);
});

test("set-up asks the parent the same, optional, and posts parentView after the child exists and before the PIN", () => {
  const c = read("src/onboarding/ChildProfile.tsx");
  const iChapters = c.indexOf("parentApi.setSchoolChapter(child.id");
  const iView = c.indexOf("parentApi.setParentView(child.id, d.parentView)");
  const iPin = c.indexOf('await postJson("/api/parent/pin", { pin: pin1 }); pinSaved = true');
  assert.ok(iChapters > 0 && iView > iChapters && iPin > iView, "chapters, then the parent's view, then the PIN");
  assert.match(c, /feelSubjects\(cl\)\.map\(\(s\) => \(\s*<FeelPicker/);
  assert.match(c, /if \(v === "unsure"\) delete pv\[s\]; else pv\[s\] = v;/);
  assert.doesNotMatch(c.slice(c.indexOf('data-testid="onb-feel"'), c.indexOf('data-testid="onb-feel"') + 1500), /\b(behind|on track|ahead)\b/i, "no level word to the parent");
});
