// Adversarial review of the ship5 integration (2026-10-06): the duplex safety floor for a distress line spoken OVER her
// in a high voice. p1-duplex's tone guard (src/duplex/host.ts overlapFeatures: a burst whose opening f0 >= OVERLAP.toneF0Hz
// = 540 Hz is "not a voice", targetSpeaker 0.1) was fitted on a pressure-cooker whistle; children's crying / shouting
// speech is routinely above 540 Hz. Such a burst is not the child: no hush, no sustained-voice yield, and the child never
// takes the floor, so the safeguard turn waits for the governor's silence path. Synthetic signals (the p1-duplex-live
// rig): f0 260 → the safeguard turn is committed 500 ms after the child stops; f0 600 → 4,500 ms, and she keeps talking
// over the whole distress line. The transcript and the predicate are identical in both arms.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DuplexLive } from "../src/duplex/live.ts";

const LOUD = Math.pow(10, -24 / 20), QUIET = Math.pow(10, -60 / 20), ECHO = Math.pow(10, -52 / 20);
function clock() {
  let now = 1_000_000; const timers = []; let seq = 0;
  return { now: () => now,
    setInterval: (fn, ms) => { const h = ++seq; timers.push({ h, at: now + ms, fn, every: ms }); return h; },
    clearInterval: (h) => { const i = timers.findIndex((x) => x.h === h); if (i >= 0) timers.splice(i, 1); },
    run(to) { for (;;) { timers.sort((a, b) => a.at - b.at); const x = timers[0]; if (!x || x.at > to) break; now = x.at; if (x.every) x.at += x.every; else timers.shift(); x.fn(); } now = to; } };
}
function rig() {
  const c = clock(); const ev = [];
  const port = { gain: 1, duck(l) { this.gain = l; }, pause() { ev.push(["pause", c.now()]); return true; }, resume() {}, stop() { ev.push(["stop", c.now()]); },
    commit(t) { ev.push(["commit", c.now(), t]); }, sttCommit() {}, dropReply() {}, fallback(r) { ev.push(["fallback", c.now(), r]); }, state() {} };
  const live = new DuplexLive({ lessonId: "L1", port, now: c.now, setInterval: c.setInterval, clearInterval: c.clearInterval });
  const pending = []; let item = 0, herOn = false;
  const frame = (loud, f0) => { const t = c.now(); while (pending.length && pending[0][0] <= t) live.stt(pending.shift()[1]); live.frame(t, loud ? LOUD : herOn ? ECHO : QUIET, loud ? f0 : null, herOn ? -22 : null); };
  const r = { c, ev,
    quiet(ms) { const end = c.now() + ms; while (c.now() < end) { frame(false); c.run(c.now() + 20); } },
    say(text, ms, f0) {
      const id = `item_${++item}`, start = c.now();
      pending.push([start + 10, { type: "input_audio_buffer.speech_started", item_id: id, audio_start_ms: start - 1_000_000 }]);
      while (c.now() < start + ms) { frame(true, f0); c.run(c.now() + 20); }
      const toks = text.split(/\s+/);
      toks.forEach((w, i) => pending.push([start + ((i + 1) * ms) / toks.length + 600, { type: "conversation.item.input_audio_transcription.delta", item_id: id, delta: (i ? " " : "") + w }]));
      pending.push([start + ms + 500, { type: "conversation.item.input_audio_transcription.completed", item_id: id, transcript: text }]);
      pending.sort((a, b) => a[0] - b[0]);
    },
    her(text) { live.setUi({ beat: "explain" }); herOn = true; live.herStart(text); } };
  live.start(); r.quiet(800); return r;
}
const LINE = "तो देखो, जब हम pizza को चार बराबर हिस्सों में काटते हैं, तो हर हिस्सा एक चौथाई होता है, और दो हिस्से मिलकर आधा बनाते हैं।";

for (const f0 of [260, 600]) {
  test(`ship5 review: a distress line said over her at f0 ${f0} Hz: she yields while the child is still speaking and the safeguard turn commits within 1.5 s`, () => {
    const r = rig();
    r.her(LINE); r.quiet(1500);
    const onset = r.c.now();
    r.say("मुझे मर जाना है", 1400, f0);
    const end = r.c.now();
    r.quiet(8000);
    const yielded = r.ev.find((e) => e[0] === "pause" || e[0] === "stop");
    const safe = r.ev.find((e) => e[0] === "commit" && e[2].duplex?.safetyPending);
    assert.ok(safe, `a committed turn carries safetyPending: ${JSON.stringify(r.ev.map((e) => e.slice(0, 2)))}`);
    assert.ok(safe[1] - end <= 1500, `the safeguard turn committed ${safe[1] - end} ms after the child stopped (f0 ${f0} Hz)`);
    assert.ok(yielded && yielded[1] <= end, `she stopped talking over the distress line ${yielded ? yielded[1] - onset : "never"} ms after its onset (the line lasted ${end - onset} ms)`);
  });
}
