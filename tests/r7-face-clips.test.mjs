// Round 7 face-prerendered-clip-visemes: her Hello / language-sample clips ship viseme + word sidecars, and the bridge
// anchors them to the clip's audio time on the puppet bus.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const B = await import("../src/face-puppet/clipBridge.ts");
const VALID = new Set([0, 1, 2, 4, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 18, 19, 20, 21]);

test("every Hello clip has a sidecar: ordered visemes with real ids, words inside the clip, seals present", () => {
  for (const lang of ["en", "hi", "hinglish"]) {
    const s = JSON.parse(readFileSync(new URL(`../public/audio/hello-${lang}.visemes.json`, import.meta.url), "utf8"));
    assert.ok(s.visemes.length > 50 && s.words.length > 10, lang);
    for (let i = 1; i < s.visemes.length; i++) assert.ok(s.visemes[i].ms >= s.visemes[i - 1].ms, `${lang} ordered`);
    for (const v of s.visemes) assert.ok(VALID.has(v.id), `${lang} id ${v.id}`);
    for (const w of s.words) assert.ok(w.ms >= 0 && w.ms + w.durMs <= s.durMs + 50, `${lang} word ${w.text} inside the clip`);
    assert.ok(s.visemes.some((v) => v.id === 21), `${lang}: at least one bilabial seal (m / p / b)`);
  }
});

test("sidecarUrl and remaining: the url next to the clip; a resumed clip keeps only what is ahead", () => {
  assert.equal(B.sidecarUrl("/audio/hello-en.mp3"), "/audio/hello-en.visemes.json");
  assert.equal(B.sidecarUrl("/audio/x.ogg?v=2"), "/audio/x.visemes.json");
  const s = { rev: 1, durMs: 3000, visemes: [{ ms: 0, id: 21 }, { ms: 500, id: 1 }, { ms: 1500, id: 0 }], words: [{ ms: 0, durMs: 400, text: "a" }, { ms: 900, durMs: 500, text: "b" }] };
  const r = B.remaining(s, 800);
  assert.deepEqual(r.visemes.map((v) => v.ms), [1500]);
  assert.deepEqual(r.words.map((w) => w.text), ["b"]);
});

test("the App patch wires the Hello clip to the bridge", () => {
  const p = readFileSync(new URL("../docs/patches/to-app/003-face-hello-clip-visemes.patch", import.meta.url), "utf8");
  assert.match(p, /attachClipVisemes\(a, src, ctx\.current\)/);
});
