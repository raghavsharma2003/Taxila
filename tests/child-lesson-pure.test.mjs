// Child lesson surface: the pure pieces (Node strips the TS types on import). The layout solver's column
// sums and minimums, phase → geometry (geometry changes only when the phase does, PD-G3), the single ring
// target, the Young ledge filter, the open-mic gate (§3.9), the plan day, and the UiBridge seams (cascade lane
// kept as a CascadeLink, the pause speech hold, the WAV copy of the cascade stream).
import { test } from "node:test";
import assert from "node:assert/strict";

import { deskPhaseOf } from "../src/child/lesson/geometry.ts";
import { ledgeChipFits } from "../src/child/lesson/ledge.ts";
import { hasHeadset, openMicAllowed } from "../src/child/lesson/headset.ts";
import { planDay } from "../src/child/day.ts";
import { UiBridge } from "../src/lesson/uiBridge.ts";
import { CascadeLink } from "../src/lesson/cascadeLink.ts";
import { TextLink } from "../src/lesson/textLink.ts";
import { LevelMeter } from "../src/lesson/level.ts";


// ───────────── solveLayout ─────────────

test("deskPhaseOf: in-phase moves never change the phase; phase moves do; the server's ui.phase wins", () => {
  assert.equal(deskPhaseOf(null, { kind: "greet", shape: "" }), "warmup");
  assert.equal(deskPhaseOf("teach", { kind: "hint", shape: "" }), "teach");
  assert.equal(deskPhaseOf("teach", { kind: "repair", shape: "" }), "teach");
  assert.equal(deskPhaseOf("teach", { kind: "safeguard", shape: "" }), "teach");
  assert.equal(deskPhaseOf("teach", { kind: "practice", shape: "" }), "practice");
  assert.equal(deskPhaseOf("practice", { kind: "wrap", shape: "" }), "wrap");
  assert.equal(deskPhaseOf("warmup", { kind: "probe", shape: "" }, "teach"), "teach");
  assert.equal(deskPhaseOf("warmup", null), "warmup");
});

test("ledgeChipFits: Young keeps numerals, pictures and short words; drops sentences", () => {
  assert.equal(ledgeChipFits({ kind: "math", value: "3/4 + 1/4 = 1" }, "young"), true);
  assert.equal(ledgeChipFits({ kind: "image", value: "/x.png" }, "young"), true);
  assert.equal(ledgeChipFits({ kind: "text", value: "aadha" }, "young"), true);
  assert.equal(ledgeChipFits({ kind: "text", value: "Which fraction is bigger, one half or one third?" }, "young"), false);
  assert.equal(ledgeChipFits({ kind: "text", value: "Which fraction is bigger, one half or one third?" }, "older"), true);
  // Worked-example problems arrive as kind "math" but are sentences: off the Young ledge.
  assert.equal(ledgeChipFits({ kind: "math", value: "Count the faces, edges and corners of a cube." }, "young"), false);
  assert.equal(ledgeChipFits({ kind: "math", value: "Count the faces, edges and corners of a cube." }, "older"), true);
  assert.equal(ledgeChipFits({ kind: "math", value: "12 + 7 = 19" }, "young"), true);
  assert.equal(ledgeChipFits({ kind: "text", value: "ek do teen chaar" }, "young"), false, "more than 3 words");
});

test("ledgeChipFits: the safeguarding helplines always reach the Young ledge (safety by predicate)", () => {
  const HELPLINES = { kind: "text", value: "Childline 1098 · Tele-MANAS 14416" }; // server/director/state.js
  for (const family of ["young", "older"]) {
    assert.equal(ledgeChipFits(HELPLINES, family), true, family);
    assert.equal(ledgeChipFits(HELPLINES, family, { safeguard: true }), true, family);
  }
  assert.equal(ledgeChipFits({ kind: "text", value: "Kisi bade se baat karo abhi" }, "young", { safeguard: true }), true);
  assert.equal(ledgeChipFits({ kind: "text", value: "Tele-MANAS 14416" }, "young"), true);
});

test("open mic: only Older, only with a headset (or a passed probe), never after EchoGuard demotion", () => {
  assert.equal(hasHeadset([{ kind: "audiooutput", label: "Speaker" }, { kind: "audioinput", label: "Built-in Microphone" }]), false);
  assert.equal(hasHeadset([{ kind: "audiooutput", label: "" }]), false, "no labels before permission → tap");
  assert.equal(hasHeadset([{ kind: "audiooutput", label: "Wired Headphones" }]), true);
  assert.equal(hasHeadset([{ kind: "audiooutput", label: "boAt Rockerz (Bluetooth)" }]), true);
  assert.equal(hasHeadset([{ kind: "videoinput", label: "Headset camera" }]), false);
  const base = { older: true, wanted: true, headset: true, echoDemoted: false };
  assert.equal(openMicAllowed(base), true);
  assert.equal(openMicAllowed({ ...base, older: false }), false);
  assert.equal(openMicAllowed({ ...base, wanted: false }), false);
  assert.equal(openMicAllowed({ ...base, headset: false }), false, "loudspeaker → tap-to-talk");
  assert.equal(openMicAllowed({ ...base, headset: false, probePassed: true }), true);
  assert.equal(openMicAllowed({ ...base, echoDemoted: true }), false);
});

test("planDay: the IST calendar day", () => {
  assert.equal(planDay(new Date("2026-10-02T19:00:00Z")), "2026-10-03", "00:30 IST is the next day");
  assert.equal(planDay(new Date("2026-10-02T10:00:00Z")), "2026-10-02");
});

// ───────────── UiBridge seams ─────────────

const ctx = (extra = {}) => ({
  lessonId: "L1",
  voice: "x",
  levels: { teacher: new LevelMeter(), mic: new LevelMeter() },
  api: {},
  ...extra,
});

test("UiBridge: a cascade start builds a CascadeLink (never a TextLink); a typed start a TextLink", () => {
  const b = new UiBridge();
  const c = b.deps.createLink("text", ctx({ cascade: true }));
  assert.ok(c instanceof CascadeLink, "cascade kept");
  assert.equal(b.state.cascade, true);
  assert.equal(b.state.pushToTalk, true, "tap-to-talk by default before connect");
  const t = b.deps.createLink("text", ctx());
  assert.ok(t instanceof TextLink);
  assert.equal(b.state.cascade, false);
  b.dispose();
});

test("UiBridge: the pause hold delays teacher speech until released, and an abort while held rejects", async () => {
  const b = new UiBridge();
  const realFetch = globalThis.fetch;
  let fetched = 0;
  // Count only this test's speech requests: under full-suite load a link built by an earlier test can
  // still fire its own fetch inside the 10 ms held window (seen as fetched=1 at the first assert).
  globalThis.fetch = async (url, init) => {
    if (String(url) === "/api/tts" && JSON.parse(init?.body ?? "{}").lessonId === "L1") fetched++;
    return new Response(new Blob([new Uint8Array(10)]), { status: 200 });
  };
  try {
    b.holdSpeech(true);
    const speech = b["cachingSpeech"];
    const ac = new AbortController();
    const p = speech({ lessonId: "L1", seq: 1 }, ac.signal);
    await new Promise((r) => setTimeout(r, 10));
    assert.equal(fetched, 0, "nothing fetched while held");
    assert.equal(b.speechWaiting, 1);
    b.holdSpeech(false);
    await p;
    assert.equal(fetched, 1);
    assert.equal(b.state.buffered, 1, "the clip is in the phir-se buffer");
    b.holdSpeech(true);
    const ac2 = new AbortController();
    const p2 = speech({ lessonId: "L1", seq: 2 }, ac2.signal);
    ac2.abort();
    await assert.rejects(p2);
    assert.equal(b.speechWaiting, 0);
    b.holdSpeech(false);
  } finally {
    globalThis.fetch = realFetch;
    b.dispose();
  }
});

test("UiBridge: the cascade stream passes through untouched and its copy lands in the buffer as WAV", async () => {
  const b = new UiBridge();
  const realFetch = globalThis.fetch;
  const pcm = new Uint8Array(24_000); // 0.5 s of PCM16 mono at 24 kHz
  globalThis.fetch = async () => new Response(new Blob([pcm]), { status: 200 });
  try {
    const body = await b["cachingStream"]({ lessonId: "L1", seq: 1 }, new AbortController().signal);
    const out = new Uint8Array(await new Response(body).arrayBuffer());
    assert.equal(out.length, pcm.length);
    assert.equal(b.state.buffered, 1);
    const clip = b["clips"][0];
    assert.equal(clip.blob.type, "audio/wav");
    assert.equal(clip.blob.size, 44 + pcm.length);
    assert.equal(Math.round(clip.ms), 500);
  } finally {
    globalThis.fetch = realFetch;
    b.dispose();
  }
});

test("captions: dashes are clause boundaries, short tails merge, at rest the last full sentence stays up", async () => {
  const { clauses, restingLine } = await import("../src/child/lesson/captions.ts");
  const q = "Aaj hum ek mazedaar cheez dekhenge jo tumne pehle bhi dekhi hai—likhne ya padhne mein?";
  const list = clauses(q);
  assert.ok(list.every((c) => c.split(" ").length <= 12), JSON.stringify(list));
  assert.equal(list.at(-1), "likhne ya padhne mein?");
  // 11 words without punctuation: no stranded 2-word tail.
  const long = clauses("ek do teen chaar paanch chheh saat aath nau das gyaarah");
  assert.equal(long.length, 1);
  assert.equal(restingLine("Bahut accha. Ab batao, kaunsa bada hai — aadha ya teesra?"), "Ab batao, kaunsa bada hai — aadha ya teesra?");
  assert.equal(restingLine(""), "");
});
