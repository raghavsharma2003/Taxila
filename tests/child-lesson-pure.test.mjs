// Child lesson surface: the pure pieces (Node strips the TS types on import). The layout solver's column
// sums and minimums, phase → geometry (geometry changes only when the phase does, PD-G3), the single ring
// target, the Young ledge filter, the open-mic gate (§3.9), the plan day, and the UiBridge seams (cascade lane
// kept as a CascadeLink, the pause speech hold, the WAV copy of the cascade stream).
import { test } from "node:test";
import assert from "node:assert/strict";

import { solveLayout } from "../src/child/lesson/layout.ts";
import { geometryOf, nextPhase } from "../src/child/lesson/geometry.ts";
import { ringTarget } from "../src/child/lesson/ring.ts";
import { ledgeChipFits } from "../src/child/lesson/ledge.ts";
import { hasHeadset, openMicAllowed } from "../src/child/lesson/headset.ts";
import { planDay } from "../src/child/day.ts";
import { UiBridge } from "../src/lesson/uiBridge.ts";
import { CascadeLink } from "../src/lesson/cascadeLink.ts";
import { TextLink } from "../src/lesson/textLink.ts";
import { LevelMeter } from "../src/lesson/level.ts";

const GEOMETRIES = ["L1", "L2", "L3", "L4", "L5"];
const FAMILIES = ["young", "older"];

// ───────────── solveLayout ─────────────

test("solveLayout: every stacked column sums to the container height at 584 / 680 / 744", () => {
  for (const h of [584, 680, 744]) {
    for (const family of FAMILIES) {
      for (const geometry of GEOMETRIES) {
        for (const captionsOn of [true, false]) {
          const L = solveLayout({ width: 360, height: h, family, geometry, captionsOn });
          assert.equal(L.family, "stacked");
          const sum = L.top + L.stage + (L.ledgeOverlay ? 0 : L.ledge) + L.caption + L.canvas + L.control;
          assert.equal(sum, h, `${family} ${geometry} h=${h} captions=${captionsOn}: ${sum}`);
          for (const k of ["top", "stage", "ledge", "caption", "canvas", "control"]) assert.ok(L[k] >= 0, `${k} ≥ 0`);
        }
      }
    }
  }
});

test("solveLayout: minimums hold (control, top, Young canvas room, ledge rows where a ledge exists)", () => {
  for (const h of [584, 680, 744]) {
    for (const geometry of GEOMETRIES) {
      const y = solveLayout({ width: 360, height: h, family: "young", geometry, captionsOn: true });
      assert.ok(y.control >= 104, `young control ${y.control}`);
      assert.equal(y.top, 56);
      if (geometry !== "L1" && geometry !== "L5") assert.ok(y.ledge >= 56, `young ledge ${y.ledge}`);
      const o = solveLayout({ width: 360, height: h, family: "older", geometry, captionsOn: true });
      assert.equal(o.control, 112);
      assert.equal(o.top, 48);
      if (geometry !== "L1" && geometry !== "L5") assert.ok(o.ledge >= 48, `older ledge ${o.ledge}`);
      // Work geometries keep a canvas
      if (geometry === "L3" || geometry === "L4") {
        assert.ok(y.canvas > 0 && o.canvas > 0, `canvas at ${geometry} h=${h}`);
      }
    }
  }
  // Young L3/L4 below 680: the ledge is the 56 dp overlay, not a row
  const ov = solveLayout({ width: 360, height: 640, family: "young", geometry: "L3", captionsOn: true });
  assert.equal(ov.ledgeOverlay, true);
  assert.equal(ov.ledge, 56);
  // Older L3: no stage, a PiP instead
  const o3 = solveLayout({ width: 360, height: 640, family: "older", geometry: "L3", captionsOn: true });
  assert.equal(o3.stage, 0);
  assert.deepEqual(o3.pip, { w: 96, h: 120 });
});

test("solveLayout: split, micro, compact and tiny families from the container, not the viewport", () => {
  assert.equal(solveLayout({ width: 1280, height: 800, family: "older", geometry: "L3", captionsOn: true }).family, "split");
  assert.equal(solveLayout({ width: 320, height: 540, family: "young", geometry: "L2", captionsOn: true }).family, "micro");
  assert.equal(solveLayout({ width: 800, height: 400, family: "young", geometry: "L2", captionsOn: true }).family, "compact");
  assert.equal(solveLayout({ width: 300, height: 400, family: "young", geometry: "L2", captionsOn: true }).family, "tiny");
  const s = solveLayout({ width: 1280, height: 800, family: "young", geometry: "L2", captionsOn: true });
  assert.equal(s.top + s.ledge + s.canvas, 800, "split work column sums to the height");
  assert.ok(s.teacherCol >= 320 && s.teacherCol <= 1280 - 320);
});

// ───────────── phase → geometry ─────────────

test("nextPhase/geometryOf: in-phase moves never change the geometry; phase moves do", () => {
  const inPhase = ["hint", "repair", "reteach", "celebrate", "safeguard"];
  for (const family of FAMILIES) {
    for (const start of ["P0", "P1", "P3", "P5", "P6", "P7"]) {
      for (const kind of inPhase) {
        const p = nextPhase(start, { kind });
        assert.equal(p, start, `${kind} keeps ${start}`);
        assert.equal(geometryOf(p, family), geometryOf(start, family));
      }
    }
  }
  assert.equal(nextPhase("P0", null), "P0");
  assert.equal(nextPhase("P0", { kind: "retrieval" }), "P1");
  assert.equal(nextPhase("P1", { kind: "explain" }), "P3");
  assert.equal(nextPhase("P3", { kind: "wrap" }), "P7");
  assert.equal(nextPhase("P3", { kind: "hint" }, "P5"), "P5", "a server phase wins");
  assert.equal(geometryOf("P6", "young"), "L4");
  assert.equal(geometryOf("P6", "older"), "L3");
  assert.equal(geometryOf("P7", "young"), "L5");
  // a sequence of moves: geometry changes exactly when the derived phase changes
  const moves = ["greet", "hint", "retrieval", "repair", "explain", "worked_example", "hint", "practice", "probe", "teachback", "wrap"];
  let phase = "P0";
  for (const kind of moves) {
    const next = nextPhase(phase, { kind });
    if (geometryOf(next, "young") !== geometryOf(phase, "young")) assert.notEqual(next, phase);
    phase = next;
  }
  assert.equal(phase, "P7");
});

// ───────────── the single ring ─────────────

test("ringTarget: at most one target, and inside a live lesson only in YOUR TURN and not paused", () => {
  const phases = ["idle", "starting", "live", "ending", "ended", "error"];
  const B = [false, true];
  const valid = new Set(["chips", "mic", "input", "finish", "start", null]);
  for (const phase of phases)
    for (const yourTurn of B)
      for (const paused of B)
        for (const chipsLive of B)
          for (const tapToTalk of B)
            for (const youngTyping of B) {
              const r = ringTarget({ phase, yourTurn, paused, chipsLive, tapToTalk, youngTyping });
              assert.ok(valid.has(r));
              assert.equal(typeof r === "string" || r === null, true);
              if (phase === "live" && (!yourTurn || paused)) assert.equal(r, null);
              if (phase === "starting" || phase === "ending") assert.equal(r, null);
              if (phase === "live" && yourTurn && !paused && chipsLive) assert.equal(r, "chips");
            }
  assert.equal(ringTarget({ phase: "live", yourTurn: true, paused: false, chipsLive: false, tapToTalk: true, youngTyping: false }), "mic");
  assert.equal(ringTarget({ phase: "live", yourTurn: true, paused: false, chipsLive: false, tapToTalk: false, youngTyping: false }), "input");
  assert.equal(ringTarget({ phase: "ended", yourTurn: false, paused: false, chipsLive: false, tapToTalk: false, youngTyping: false }), "finish");
});

// ───────────── Young ledge, open mic, plan day ─────────────

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
  globalThis.fetch = async () => {
    fetched++;
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
