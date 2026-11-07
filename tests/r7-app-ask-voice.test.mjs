// r7 stream E app-ask-voice: "Say it" on Ask goes through Voice's transcribe path (no second recognizer); what she heard
// lands in the field for the child to fix; a failure says to type instead.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("transcribeAsk posts the clip with the child's id to Voice's route and returns what it heard", async () => {
  const real = globalThis.fetch;
  try {
    const { transcribeAsk } = await import("../src/child/askVoice.ts");
    let seen = null;
    globalThis.fetch = async (url, init) => { seen = { url: String(url), body: JSON.parse(init.body) }; return new Response(JSON.stringify({ text: " why is the sky blue ", asrConfidence: 0.9 }), { status: 200 }); };
    const clip = new Blob([new Uint8Array(800).fill(7)], { type: "audio/webm" });
    assert.equal(await transcribeAsk("c1", clip), "why is the sky blue");
    assert.equal(seen.url, "/api/voice/transcribe");
    assert.equal(seen.body.childId, "c1");
    assert.equal(seen.body.mime, "audio/webm");
    assert.equal(Buffer.from(seen.body.audio, "base64").length, 800);
    assert.equal(seen.body.lessonId, undefined, "no lesson exists yet on Ask");
    globalThis.fetch = async () => new Response(JSON.stringify({ text: "", asrConfidence: 0 }), { status: 200 });
    assert.equal(await transcribeAsk("c1", clip), "", "heard nothing: say again");
    globalThis.fetch = async () => new Response("{}", { status: 400 });
    assert.equal(await transcribeAsk("c1", clip), null, "refused: type instead");
  } finally {
    globalThis.fetch = real;
  }
});

test("Ask: hands-free listens on open only when the mic is already allowed; Tap to talk and Type instead wait", () => {
  const a = read("src/child/screens/Ask.tsx");
  assert.match(a, /if \(!kx \|\| prefs\.handsFree === false \|\| prefs\.quiet \|\| !canRecord\(\)\) return;/);
  assert.match(a, /micGranted\(\)\.then\(\(ok\) => \{ if \(live && ok\) void listen\(\); \}\)/);
  assert.match(a, /setText\(\(t0\) => \(t0\.trim\(\) \? `\$\{t0\.trim\(\)\} \$\{heard\}` : heard\)\)/, "what she heard goes into the field, never straight to Ask");
});

test("Voice's seam (to-voice/003) applies to the tree, or Voice has applied it", () => {
  const cwd = new URL("..", import.meta.url);
  const patch = "docs/patches/to-voice/003-app-ask-transcribe-childid.patch";
  try {
    execFileSync("git", ["apply", "--check", patch], { cwd, stdio: "pipe" });
  } catch {
    // Voice applied it (claude/r4-duplex 16c9bf2e): the patch now reverses cleanly instead
    execFileSync("git", ["apply", "--check", "--reverse", patch], { cwd, stdio: "pipe" });
  }
});
