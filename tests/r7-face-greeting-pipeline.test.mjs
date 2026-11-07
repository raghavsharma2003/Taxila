// Round 7 face-home-daily-greeting: the one-command clip path (scripts/character/greetings-pipeline.mjs) is ready for the
// owner's yes: every line maps to its clip file, and the checks catch a missing clip, a missing or empty sidecar and an
// unsealed b / m / p word, and pass on real sidecars (the Hello clips stand in for rendered greetings).
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

test("every greeting line has a stable clip file under public/audio", async () => {
  const { greetingLines } = await import("../scripts/character/render-greetings.mjs");
  const lines = greetingLines();
  assert.equal(lines.length, 27);
  assert.equal(new Set(lines.map((l) => l.id)).size, 27);
  for (const l of lines) assert.ok(l.file.endsWith(`/public/audio/hello-day-${l.id}.mp3`), l.file);
});

test("the checks: missing files, empty sidecars and unsealed b / m / p words fail; a sealed line passes", async () => {
  const P = await import("../scripts/character/greetings-pipeline.mjs");
  const l = { id: "x", file: "/a/hello-day-x.mp3" };
  const files = (map) => (f) => map[f] ?? null;
  assert.deepEqual(P.checkLine(l, files({})).problems, ["no clip", "no sidecar"]);
  assert.deepEqual(P.checkLine(l, files({ "/a/hello-day-x.mp3": "mp3", "/a/hello-day-x.visemes.json": '{"visemes":[],"words":[]}' })).problems, ["sidecar has no visemes"]);
  const words = [{ ms: 100, durMs: 200, text: "MORNING" }, { ms: 400, durMs: 150, text: "START" }];
  const open = { visemes: [{ ms: 100, id: 1 }, { ms: 400, id: 19 }], words };
  assert.deepEqual(P.checkLine(l, files({ "/a/hello-day-x.mp3": "mp3", "/a/hello-day-x.visemes.json": JSON.stringify(open) })).problems, ["lip seals 0/1"]);
  const sealed = { visemes: [{ ms: 100, id: 21 }, { ms: 400, id: 19 }], words };
  const ok = P.checkLine(l, files({ "/a/hello-day-x.mp3": "mp3", "/a/hello-day-x.visemes.json": JSON.stringify(sealed) }));
  assert.deepEqual(ok, { id: "x", problems: [], seals: "1/1" });
  assert.equal(P.bilabialWord("Shabash"), true);
  assert.equal(P.bilabialWord("phone"), false, "ph is not a lip seal");
});

test("the real Hello sidecars pass the same checks (the rendered greetings will be checked the same way)", async () => {
  const P = await import("../scripts/character/greetings-pipeline.mjs");
  for (const lang of ["en", "hi", "hinglish"]) {
    const r = P.checkLine({ id: `hello-${lang}`, file: `${ROOT}public/audio/hello-${lang}.mp3` });
    assert.deepEqual(r.problems, [], lang);
  }
});
