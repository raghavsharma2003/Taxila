// Release 14 (owner phone lessons 3a7da0ad / 56d898ce): D4 runs half-duplex on the live lane. Her loudspeaker echo never
// opens a burst, never ducks or yields her, and a transcription item that starts over her line is dropped whole; after a
// tap or typed answer no engine SPEAK races the reply to it. The child's own answer after her line still commits.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DuplexLive, HALF_DUPLEX_TAIL_MS } from "../src/duplex/live.ts";

function rig(opts) {
  let clock = 0, tick = null;
  const acts = [];
  const port = {
    duck: (lv) => acts.push([clock, "duck", lv]), pause: () => { acts.push([clock, "pause"]); return true; }, resume: () => acts.push([clock, "resume"]),
    stop: () => acts.push([clock, "stop"]), commit: (t) => acts.push([clock, "commit", t.text]), sttCommit: () => acts.push([clock, "probe"]),
    dropReply: () => {}, fallback: (w) => acts.push([clock, "fallback", w]), state: () => {},
  };
  const live = new DuplexLive({ lessonId: "t", port, now: () => clock, setInterval: (fn) => { tick = fn; return 1; }, clearInterval: () => {}, band: "B2", ...opts });
  live.start();
  return {
    live, acts,
    run(untilMs, frameAt) {
      for (; clock < untilMs; clock += 20) {
        const f = frameAt(clock);
        live.frame(clock, f.rms, f.f0, f.her);
        if (clock % 100 === 80) tick?.();
      }
    },
    get t() { return clock; },
  };
}
const yields = (acts) => acts.filter((a) => a[1] === "pause" || a[1] === "stop");
const ducks = (acts) => acts.filter((a) => a[1] === "duck" && a[2] < 1);
const commits = (acts) => acts.filter((a) => a[1] === "commit");
const HER = "चार गुणा तीन का मतलब है चार को तीन बार जोड़ना, यानी चार और चार और चार, जो बारह होता है, और यही गुणा का असली मतलब है।";
const echo = () => ({ rms: 0.1, f0: 210, her: -20 }); // a phone loudspeaker with weak device AEC: as loud as a child, pitched
const quiet = () => ({ rms: 0.001, f0: null, her: null });

test("half-duplex: her loud echo never ducks or yields her (the full engine on the same audio does)", () => {
  for (const [opts, wantDuck] of [[{ halfDuplex: true }, false], [{}, true]]) {
    const r = rig(opts);
    r.live.herStart(HER);
    r.run(4000, echo);
    assert.equal(yields(r.acts).length, 0, `${JSON.stringify(opts)} no yield`);
    assert.equal(ducks(r.acts).length > 0, wantDuck, `${JSON.stringify(opts)}: ${JSON.stringify(r.acts)}`);
    if (opts.halfDuplex) assert.ok(r.live.half.gatedFrames > 150, String(r.live.half.gatedFrames));
  }
});

test("half-duplex: a transcription item that starts over her line is her echo, dropped whole (no commit, even after she ends)", () => {
  const r = rig({ halfDuplex: true });
  r.live.setUi({ answerForm: "number", beat: "check" });
  r.live.herStart("सात गुणा आठ कितना होता है?");
  r.run(1500, echo);
  assert.equal(r.live.echoOnly({ type: "input_audio_buffer.speech_started", item_id: "e1", audio_start_ms: 1200 }), true);
  r.live.stt({ type: "input_audio_buffer.speech_started", item_id: "e1", audio_start_ms: 1200 });
  r.run(2500, echo);
  r.live.herEnd();
  r.run(2500 + HALF_DUPLEX_TAIL_MS + 100, quiet);
  r.live.stt({ type: "input_audio_buffer.speech_stopped", item_id: "e1", audio_end_ms: 2600 });
  r.live.stt({ type: "conversation.item.input_audio_transcription.completed", item_id: "e1", transcript: "क्यों भाई" });
  r.run(9000, quiet);
  assert.equal(commits(r.acts).length, 0, JSON.stringify(r.acts));
  assert.equal(r.live.half.echoItems, 1);
  assert.equal(r.live.echoOnly({ type: "conversation.item.input_audio_transcription.completed", item_id: "e1", transcript: "x" }), false, "the item is forgotten once final");
});

test("half-duplex: the child's own answer after her line still ends the turn on device timing", () => {
  const r = rig({ halfDuplex: true });
  r.live.setUi({ answerForm: "number", beat: "check" });
  r.live.herStart("सात गुणा आठ कितना होता है?");
  r.run(2500, echo);
  r.live.herEnd();
  const from = 3400, to = 4000;
  const frameAt = (t) => (t >= from && t < to ? { rms: 0.3, f0: 290, her: null } : quiet());
  r.run(3700, frameAt);
  assert.equal(r.live.echoOnly({ type: "input_audio_buffer.speech_started", item_id: "c1", audio_start_ms: 3400 }), false, "after the tail: the child");
  r.live.stt({ type: "input_audio_buffer.speech_started", item_id: "c1", audio_start_ms: 3400 });
  r.run(4300, frameAt);
  r.live.stt({ type: "input_audio_buffer.speech_stopped", item_id: "c1", audio_end_ms: 4000 });
  r.live.stt({ type: "conversation.item.input_audio_transcription.completed", item_id: "c1", transcript: "छप्पन" });
  r.run(8000, frameAt);
  const c = commits(r.acts)[0];
  assert.ok(c, JSON.stringify(r.acts));
  assert.equal(c[2], "छप्पन");
});

test("screen hold (every lane): after a tapped answer no engine SPEAK commits until her reply to it starts", () => {
  // the full engine: on half-duplex the empty SPEAK below is already dropped by the no-words rule (tested further down)
  const r = rig({});
  r.live.setUi({ answerForm: "number", beat: "check" });
  r.live.herStart("सात गुणा आठ कितना होता है?");
  r.run(2500, quiet);
  r.live.herEnd();
  r.run(3000, quiet);
  r.live.screen("choice_pick");
  // a voiced burst and then silence: on its own this ends a turn (the backstop / end of turn)
  const burst = (t) => (t >= 3400 && t < 3700 ? { rms: 0.3, f0: 290, her: null } : quiet());
  r.run(9000, burst);
  assert.equal(commits(r.acts).length, 0, `no turn races the tapped answer: ${JSON.stringify(r.acts)}`);
  assert.ok(r.live.half.heldSpeaks >= 1, "the backstop SPEAK it would have committed was held (control: 1 commit without the tap)");
  // her reply to the tap starts: the hold lifts, the next answer commits again
  r.live.herStart("बहुत बढ़िया! अब नौ गुणा चार?");
  r.run(10500, quiet);
  r.live.herEnd();
  const ans = (t) => (t >= 11500 && t < 12100 ? { rms: 0.3, f0: 290, her: null } : quiet());
  r.run(11800, ans);
  r.live.stt({ type: "input_audio_buffer.speech_started", item_id: "c2", audio_start_ms: 11500 });
  r.run(12300, ans);
  r.live.stt({ type: "conversation.item.input_audio_transcription.completed", item_id: "c2", transcript: "छत्तीस" });
  r.run(16000, ans);
  assert.ok(commits(r.acts).some((c) => c[2] === "छत्तीस"), JSON.stringify(r.acts));
});

test("D5 review (confirmed): her acknowledgement clip's echo never revokes the child's committed answer", () => {
  const r = rig({ halfDuplex: true });
  r.live.setUi({ answerForm: "number", beat: "check" });
  r.live.herStart("सात गुणा आठ कितना होता है?");
  r.run(2500, quiet);
  r.live.herEnd();
  const ans = (t) => (t >= 3200 && t < 3800 ? { rms: 0.3, f0: 290, her: null } : quiet());
  r.run(3500, ans);
  r.live.stt({ type: "input_audio_buffer.speech_started", item_id: "c1", audio_start_ms: 3200 });
  r.run(4100, ans);
  r.live.stt({ type: "conversation.item.input_audio_transcription.completed", item_id: "c1", transcript: "छप्पन" });
  let t0 = null;
  for (let u = 4200; u < 9000 && t0 === null; u += 100) { r.run(u, ans); if (commits(r.acts).length) t0 = r.t; }
  assert.ok(t0, `committed: ${JSON.stringify(r.acts)}`);
  // the ack clip plays and its loudspeaker echo comes back as loud as a child
  r.live.ackStart();
  r.run(t0 + 700, echo);
  r.live.ackEnd();
  r.run(t0 + 2500, quiet);
  assert.equal(yields(r.acts).length, 0, `no revoke / stop over her own ack: ${JSON.stringify(r.acts)}`);
  assert.equal(commits(r.acts).length, 1, "the answer is committed once");
});

test("D5 review (confirmed): on half-duplex a burst with no words (a cough, the TV) is never an empty child turn", () => {
  const r = rig({ halfDuplex: true });
  r.live.setUi({ beat: "explain" });
  r.live.herStart("गुणा का मतलब है बार बार जोड़ना।");
  r.run(2500, quiet);
  r.live.herEnd();
  const cough = (t) => (t >= 3400 && t < 3800 ? { rms: 0.3, f0: 180, her: null } : quiet());
  r.run(15000, cough);
  assert.equal(commits(r.acts).filter((c) => !c[2]).length, 0, JSON.stringify(r.acts));
});
