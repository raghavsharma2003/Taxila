// Round 5 (docs/design/round5/BRIEF.md: the owner's two phone lessons, "everything is broken"):
//   (c) ONE TURN AT A TIME: the engine never posts a turn while one is in flight (its own commit, or a tapped / typed answer
//       her reply has not started for) nor within 3 s of a tap — the owner's "Homework" chip raced the silence backstop;
//   (b) HALF-DUPLEX D4: while her voice is audible (+ a tail) the mic is gated, transcription items begun then are dropped
//       whole, no micro-commit goes out without an open item (no commit_empty), an empty turn is never the child's;
//   (a) the D5 pre-duck never fires on her own echo (her pitch, octave-tolerant) and does fire on a child over her.
import { test } from "node:test";
import assert from "node:assert/strict";

import { DuplexLive, TAP_GUARD_MS, IN_FLIGHT_MAX_MS, HALF_DUPLEX_TAIL_MS, D5_PREDUCK_LEVEL } from "../src/duplex/live.ts";
import { LevelMeter } from "../src/lesson/level.ts";

function rig(opts) {
  let clock = 0, tick = null;
  const acts = [];
  const port = {
    duck: (lv) => acts.push([clock, "duck", lv]), pause: () => { acts.push([clock, "pause"]); return true; }, resume: () => acts.push([clock, "resume"]),
    stop: () => acts.push([clock, "stop"]), commit: (t) => acts.push([clock, "commit", t.text]), sttCommit: () => acts.push([clock, "probe"]),
    dropReply: () => acts.push([clock, "drop"]), fallback: (w) => acts.push([clock, "fallback", w]), state: () => {}, micGate: (g) => acts.push([clock, "gate", g]),
  };
  const live = new DuplexLive({ lessonId: "t", port, now: () => clock, setInterval: (fn) => { tick = fn; return 1; }, clearInterval: () => {}, band: "B2", ...opts });
  live.start();
  return {
    live, acts,
    run(untilMs, frameAt) {
      for (; clock < untilMs; clock += 20) {
        const f = frameAt(clock);
        live.frame(clock, f.rms, f.f0, f.her, f.herF0 ?? null);
        if (clock % 100 === 80) tick?.();
      }
    },
    set t(v) { clock = v; },
    get t() { return clock; },
  };
}
const speak = (t, reason = "backstop_silence", text = "हाँ") => ({ to: "voice", op: "speak", t, reason, firstSound: "prompt", verdictNotBefore: null, text, textHash: "h", uptake: null, turnSeq: 1 });
const commits = (acts) => acts.filter((a) => a[1] === "commit");

// ───────────────────────────── (c) one turn at a time ─────────────────────────────

test("(c) a tapped answer holds the engine's turn for 3 s and until her reply starts; the safeguard is never held", () => {
  const r = rig({});
  r.live.screen("choice_pick");
  r.live["handle"](speak(r.t + 500));
  assert.equal(commits(r.acts).length, 0, "within 3 s of the tap");
  r.t = TAP_GUARD_MS + 1000;
  r.live["handle"](speak(r.t));
  assert.equal(commits(r.acts).length, 0, "the tapped turn is still in flight (her reply has not started)");
  r.live["handle"](speak(r.t, "safeguard", "मुझे डर लग रहा है"));
  assert.equal(commits(r.acts).length, 1, "the safety floor is never held");
  r.live.herStart("अच्छा, होमवर्क की बात करते हैं।");
  r.live.herEnd();
  r.live["handle"](speak(r.t + 10));
  assert.equal(commits(r.acts).length, 2, "her reply started: the next turn may go");
  assert.ok((r.live.stats.held ?? 0) + r.live.half.heldSpeaks >= 2, "both holds are counted");
});

test("(c) one engine turn at a time: a second commit waits for her reply, a lost reply stops holding after the cap", () => {
  const r = rig({});
  r.live["handle"](speak(1000, "turn_end", "छप्पन"));
  r.live["handle"](speak(2500, "backstop_silence", ""));
  assert.equal(commits(r.acts).length, 1, "a turn is in flight");
  r.t = 1000 + IN_FLIGHT_MAX_MS + 10;
  r.live["handle"](speak(r.t, "backstop_silence", "फिर से"));
  assert.equal(commits(r.acts).length, 2, "a reply that never came does not freeze the floor");
});

test("(c) a typed line (submit) is held the same way; a screen 'type' keystroke is not a turn", () => {
  const r = rig({});
  r.live.screen("type");
  r.live["handle"](speak(100, "turn_end", "सात"));
  assert.equal(commits(r.acts).length, 1, "typing is not a submitted answer");
  r.live.herStart("हाँ, सात।");
  r.live.screen("submit");
  r.live["handle"](speak(1500, "turn_end", "आठ"));
  assert.equal(commits(r.acts).length, 1);
});

// ───────────────────────────── (b) half-duplex D4 ─────────────────────────────

const HER = "चार गुणा तीन का मतलब है चार को तीन बार जोड़ना, यानी बारह। अब बताओ, पाँच गुणा दो कितना होता है?";

test("(b) half-duplex: the mic is gated while her voice is audible and for the tail after; her echo never reaches the engine", () => {
  const r = rig({ halfDuplex: true });
  r.live.setUi({ answerForm: "number", beat: "check" });
  r.live.herStart(HER);
  // loud echo, pitched, the whole line (the owner's phone)
  r.run(3000, () => ({ rms: 0.1, f0: 210, her: -20 }));
  const gate = r.acts.filter((a) => a[1] === "gate");
  assert.deepEqual(gate.map((g) => g[2]), [true], "gated once, still gated");
  // the transcriber had already started an item on her echo: dropped whole
  assert.equal(r.live.echoOnly({ type: "input_audio_buffer.speech_started", item_id: "e1", audio_start_ms: 500 }), true);
  r.live.stt({ type: "conversation.item.input_audio_transcription.completed", item_id: "e1", transcript: "क्यों भाई" });
  r.live.herEnd();
  r.run(3000 + HALF_DUPLEX_TAIL_MS + 100, () => ({ rms: 0.001, f0: null, her: null }));
  assert.deepEqual(r.acts.filter((a) => a[1] === "gate").map((g) => g[2]), [true, false], "open again after the tail");
  r.run(8000, () => ({ rms: 0.001, f0: null, her: null }));
  assert.equal(r.acts.filter((a) => a[1] === "duck" || a[1] === "pause" || a[1] === "stop").length, 0, "no hush, no yield on her echo");
  assert.ok(!commits(r.acts).some((c) => c[2].includes("क्यों")), "her echo never became the child's turn");
  assert.ok(r.live.half.echoItems >= 1);
});

test("(b) half-duplex: a micro-commit only with an open item (no commit_empty); an empty turn is never committed", () => {
  const r = rig({ halfDuplex: true });
  r.live["handle"]({ to: "stt", op: "commit", t: 100 });
  assert.equal(r.acts.filter((a) => a[1] === "probe").length, 0, "nothing open: no commit");
  assert.equal(r.live.echoOnly({ type: "input_audio_buffer.speech_started", item_id: "c1", audio_start_ms: 200 }), false, "her voice is not in the room: a real item");
  r.live["handle"]({ to: "stt", op: "commit", t: 300 });
  assert.equal(r.acts.filter((a) => a[1] === "probe").length, 1);
  r.live["handle"](speak(900, "backstop_silence", ""));
  assert.equal(commits(r.acts).length, 0, "an empty turn is not the child's on D4");
});

test("(b) half-duplex: CascadeLink's mic gate ANDs with the link's own mic state and never outlives the engine", async () => {
  const { CascadeLink } = await import("../src/lesson/cascadeLink.ts");
  const track = { enabled: true, stop() {} };
  const link = new CascadeLink({ lessonId: "L1", levels: { mic: new LevelMeter(), teacher: new LevelMeter() }, fetchToken: async () => ({}), transcribe: async () => ({ text: "" }) });
  link["mic"] = { getAudioTracks: () => [track], getTracks: () => [track] };
  const surface = link["duplexSurface"]();
  surface.micGate(true);
  assert.equal(track.enabled, false);
  link["setMicEnabled"](true);
  assert.equal(track.enabled, false, "the link wanting the mic does not open a gated mic");
  surface.micGate(false);
  assert.equal(track.enabled, true);
  link["setMicEnabled"](false);
  surface.micGate(false);
  assert.equal(track.enabled, false, "the gate opening does not open a mic the link switched off");
  link.close();
});

// ───────────────────────────── (a) the D5 pre-duck ─────────────────────────────

test("(a) D5 pre-duck: never on her own echo (her pitch, or an octave of it), fast on a child over her", () => {
  const r = rig({ source: "voicelive", vadGate: "server", preDuck: true, supportsCommit: false });
  r.live.herStart(HER);
  // her echo 10 dB above the learned coupling (a weak device AEC re-converging), pitched at hers or its octave
  r.run(3000, (t) => ({ rms: 0.1, f0: t % 200 < 100 ? 210 : 420, her: -20, herF0: 210 }));
  assert.equal(r.live.d5.preDucks, 0, JSON.stringify(r.acts));
  // a child over her: pitch 300 Hz (6 st from hers), 14 dB above her echo (D5_PREDUCK_MARGIN_DB 12)
  r.run(3400, () => ({ rms: 0.5, f0: 300, her: -20, herF0: 210 }));
  const d = r.acts.find((a) => a[1] === "duck" && a[2] === D5_PREDUCK_LEVEL);
  assert.ok(d && d[0] - 3000 <= 120, `pre-duck within 120 ms: ${JSON.stringify(r.acts)}`);
  assert.equal(r.live.d5.preDucks, 1);
});

test("(c) the shipped path too: a spoken final within 3 s of a tapped answer is not a second turn", async () => {
  const { CascadeLink, LINK_TAP_GUARD_MS } = await import("../src/lesson/cascadeLink.ts");
  const link = new CascadeLink({ lessonId: "L1", levels: { mic: new LevelMeter(), teacher: new LevelMeter() }, fetchToken: async () => ({}), transcribe: async () => ({ text: "" }), ack: false, prefetch: false, predictive: false });
  const events = [];
  link.on((e) => events.push(e));
  link.sendChild("Homework", { chipId: "c-homework" });
  link["onChildEvent"]({ type: "child_final", text: "होमवर्क", startedAt: Date.now() });
  const finals = events.filter((e) => e.type === "child_final");
  assert.deepEqual(finals.map((f) => [f.text, !!f.typed]), [["Homework", true]], "only the tapped turn");
  link["typedAt"] = Date.now() - LINK_TAP_GUARD_MS - 10;
  link["onChildEvent"]({ type: "child_final", text: "और एक सवाल", startedAt: Date.now() });
  assert.equal(events.filter((e) => e.type === "child_final").length, 2, "later, a spoken final is a turn again");
  link.close();
});

test("D5 review #3: her 'phir se' replay plays INTO the link's her-output node (D5's reference channel), gated as hers", async () => {
  const { UiBridge } = await import("../src/lesson/uiBridge.ts");
  const { CascadeLink } = await import("../src/lesson/cascadeLink.ts");
  const saved = { Audio: globalThis.Audio, AudioContext: globalThis.AudioContext, c: URL.createObjectURL, r: URL.revokeObjectURL };
  const node = (ctx) => ({ ctx, links: [], connect(n) { this.links.push(n); return n; }, disconnect() {} });
  const mkCtx = () => { const c = { destination: null, sources: [], createMediaElementSource(el) { const s = node(c); s.el = el; c.sources.push(s); return s; }, createAnalyser() { return { ...node(c), fftSize: 1024, getFloatTimeDomainData: (b) => b.fill(0) }; }, resume: async () => {}, close: async () => { c.closed = true; } }; c.destination = node(c); return c; };
  const own = [];
  globalThis.Audio = class { constructor() { this.played = 0; } play() { this.played++; return Promise.resolve(); } pause() {} removeAttribute() {} };
  globalThis.AudioContext = class { constructor() { const c = mkCtx(); own.push(c); return c; } };
  URL.createObjectURL = () => "blob:x"; URL.revokeObjectURL = () => {};
  try {
    const linkCtx = mkCtx(), herOut = node(linkCtx);
    const gate = [];
    let up = true;
    const link = Object.create(CascadeLink.prototype);
    link.herOutput = () => (up ? { ctx: linkCtx, output: herOut } : null);
    link.externalAudio = (on) => gate.push(on);
    const b = new UiBridge();
    b["link"] = link;
    b["clips"] = [{ seq: 1, blob: new Blob(["x"]), ms: 500 }];
    assert.equal(b.replay(), true);
    assert.equal(linkCtx.sources.length, 1, "the element is a source in the LINK's context");
    assert.deepEqual(linkCtx.sources[0].links.includes(herOut), true, "into her output (the D5 reference + her level)");
    assert.equal(own.length, 0, "no private AudioContext beside the link");
    assert.deepEqual(gate, [true], "the engine gates it as hers");
    b.stopReplay();
    assert.deepEqual(gate, [true, false]);
    b.replay();
    assert.equal(linkCtx.sources.length, 1, "the same element (bound once) replays again");
    b.stopReplay();
    // the link's graph is gone (closed): a new element on its own context, never a dead one
    up = false;
    b.replay();
    assert.equal(own.length, 1);
    b.dispose();
    assert.equal(own[0].closed, true, "its own context closes; the link's never does");
    assert.ok(!linkCtx.closed);
  } finally {
    globalThis.Audio = saved.Audio; globalThis.AudioContext = saved.AudioContext; URL.createObjectURL = saved.c; URL.revokeObjectURL = saved.r;
  }
});

test("D5 review #4/#8: on D5 too, an item Voice Live opens on the ack clip's echo is dropped whole (no revoke, no turn); over her line it stays", () => {
  const r = rig({ source: "voicelive", vadGate: "server", supportsCommit: false });
  r.live.audioOrigin(0);
  r.live.setUi({ answerForm: "number", beat: "check" });
  r.live["handle"](speak(1000, "turn_end", "छप्पन"));
  assert.equal(commits(r.acts).length, 1);
  r.t = 1200;
  r.live.ackStart();
  r.run(1800, () => ({ rms: 0.1, f0: 210, her: -20 }));
  r.live.ackEnd();
  // Voice Live's weak-reference echo of "अच्छा": its item began inside the clip
  const ev = { type: "input_audio_buffer.speech_started", item_id: "a1", audio_start_ms: 1300 - 200 };
  assert.equal(r.live.echoOnly(ev), true, "the ack's echo item");
  assert.equal(r.live.echoOnly({ type: "conversation.item.input_audio_transcription.completed", item_id: "a1", transcript: "अच्छा" }), true);
  assert.equal(r.live.d5.ackEchoItems, 1);
  r.run(4000, () => ({ rms: 0.001, f0: null, her: null }));
  assert.equal(r.acts.filter((a) => a[1] === "drop").length, 0, "the committed answer is not revoked");
  // the child later, her silent and the ack long over: a real item
  assert.equal(r.live.echoOnly({ type: "input_audio_buffer.speech_started", item_id: "c1", audio_start_ms: 3500 }), false);
  // over her LINE an item is how a barge-in reaches the engine: never dropped
  r.live.herStart(HER);
  r.live.ackStart();
  assert.equal(r.live.echoOnly({ type: "input_audio_buffer.speech_started", item_id: "b1", audio_start_ms: r.t - 300 }), false);
});
