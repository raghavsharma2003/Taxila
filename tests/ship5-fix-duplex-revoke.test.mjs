// ship5 fixer (experience review B3, 2026-10-06): a duplex revoke merges the revoked commit's words into the next turn
// (governor G7: "the child resumed before her verdict word"), and the runtime posted that merged text as a NEW turn, so
// words the server had already answered ("haan didi, ready hoon") were sent and answered again ("haan didi, ready hoon
// example do"). Now the merged commit names the revoked commit (DuplexTurn.revokeOf) and the runtime sends only the new
// words unless the revoked turn is still in flight (then the merged words supersede it under its turnSeq).
import { test } from "node:test";
import assert from "node:assert/strict";
import { DuplexLive } from "../src/duplex/live.ts";
import { freshWords } from "../src/lesson/runtime.ts";

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
    commit(t) { ev.push(["commit", c.now(), t]); }, sttCommit() {}, dropReply() { ev.push(["drop", c.now()]); }, fallback(r) { ev.push(["fallback", c.now(), r]); }, state() {} };
  const live = new DuplexLive({ lessonId: "L1", port, now: c.now, setInterval: c.setInterval, clearInterval: c.clearInterval });
  const pending = []; let item = 0, herOn = false;
  const frame = (loud) => { const t = c.now(); while (pending.length && pending[0][0] <= t) live.stt(pending.shift()[1]); live.frame(t, loud ? LOUD : herOn ? ECHO : QUIET, loud ? 240 : null, herOn ? -22 : null); };
  const r = { c, ev, live,
    quiet(ms) { const end = c.now() + ms; while (c.now() < end) { frame(false); c.run(c.now() + 20); } },
    say(text, ms) {
      const id = `item_${++item}`, start = c.now();
      pending.push([start + 10, { type: "input_audio_buffer.speech_started", item_id: id, audio_start_ms: start - 1_000_000 }]);
      while (c.now() < start + ms) { frame(true); c.run(c.now() + 20); }
      const toks = text.split(/\s+/);
      toks.forEach((w, i) => pending.push([start + ((i + 1) * ms) / toks.length + 600, { type: "conversation.item.input_audio_transcription.delta", item_id: id, delta: (i ? " " : "") + w }]));
      pending.push([start + ms + 500, { type: "conversation.item.input_audio_transcription.completed", item_id: id, transcript: text }]);
      pending.sort((a, b) => a[0] - b[0]);
    },
    her(text) { live.setUi({ beat: "explain", handover: "answer" }); herOn = true; return live.herStart(text); },
    herEnd() { herOn = false; live.herEnd(); } };
  live.start(); r.quiet(800); return r;
}

test("B3: a turn merged after a revoke carries the revoked commit's words, and only the new words are fresh", () => {
  const r = rig();
  r.her("Namaste Riya! Aaj hum bade numbers padhenge. Ready ho?"); r.quiet(3000); r.herEnd(); r.quiet(300);
  r.say("haan didi ready hoon", 1100);
  r.quiet(2500);
  const commits = () => r.ev.filter((e) => e[0] === "commit");
  assert.equal(commits().length, 1, JSON.stringify(r.ev.map((e) => e.slice(0, 2))));
  // her reply starts and the child goes on at once ("example do")
  r.her("Bahut badhiya! Chalo shuru karte hain. Pehle yeh batao, 3456 mein 4 ki place value kya hai?");
  r.quiet(100);
  r.say("example do", 700);
  r.quiet(6000);
  const cs = commits();
  const last = cs.at(-1)[2];
  if (process.env.RV_DEBUG) console.log(JSON.stringify(cs.map((x) => [x[2].text, x[2].revokeOf ?? null])), JSON.stringify(r.ev.filter((e) => e[0] !== "commit").map((e) => e.slice(0, 2))));
  // this rig reproduces the e2e case: her reply had started, the child went on, the engine revoked and merged
  assert.equal(cs.length, 2);
  assert.match(last.text, /haan.*example do/);
  assert.ok(last.revokeOf, `a merged turn must name the revoked commit: ${JSON.stringify(last)}`);
  assert.equal(last.revokeOf.text, cs[0][2].text);
  assert.equal(freshWords(last.text, last.revokeOf.text), "example do");
});

test("B3: freshWords strips the already-sent words (case and punctuation folded) and keeps a non-continuation whole", () => {
  assert.equal(freshWords("haan didi, ready hoon example do", "haan didi ready hoon"), "example do");
  assert.equal(freshWords("Haan didi ready hoon.", "haan didi ready hoon"), "");
  assert.equal(freshWords("teen bata chaar", "teen"), "bata chaar");
  assert.equal(freshWords("example do", "haan didi"), "example do");
});

// ── the runtime half: the merged turn after a revoke never re-sends already-sent words ──
import { LessonRuntime } from "../src/lesson/runtime.ts";
import { MemoryOutboxStore } from "../src/lesson/outbox.ts";

class QuietLink {
  constructor(levels) { this.mode = "text"; this.levels = levels; this.fns = new Set(); }
  on(fn) { this.fns.add(fn); return () => this.fns.delete(fn); }
  emit(e) { for (const f of [...this.fns]) f(e); }
  async connect() { this.emit({ type: "connection", state: "connected" }); }
  applyInstructions() {} sendChild() {} promptTeacher() {} interrupt() {} setPushToTalk() {} talkStart() {} talkEnd() {} close() {}
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function apiWith(turn) {
  const calls = [];
  return { calls,
    start: async () => ({ lessonId: "L", topic: { id: "t", title: "T", chapter: "1" }, teacher: { id: "asha", name: "Asha", voice: "v" }, moduleCommands: [], ui: {} }),
    turn: async (r, signal) => { calls.push({ ...r }); return turn(r, signal); },
    end: async () => ({}), realtimeToken: async () => { throw new Error("no"); } };
}
const reply = { move: { kind: "probe", shape: "x" }, moduleCommands: [], ui: {} };

test("B3 runtime: the revoked turn already landed → only the new words are posted", async () => {
  const a = apiWith(async () => reply);
  let link;
  const rt = new LessonRuntime({ api: a, outboxStore: new MemoryOutboxStore(true), createLink: (_m, c) => (link = new QuietLink(c.levels)) });
  await rt.start("c1", "text");
  link.emit({ type: "child_final", text: "haan didi ready hoon", startedAt: Date.now(), typed: false });
  await wait(30);
  link.emit({ type: "child_final", text: "haan didi, ready hoon example do", startedAt: Date.now(), typed: false, revokeOf: { turnId: 1, text: "haan didi ready hoon" } });
  await wait(30);
  assert.deepEqual(a.calls.map((c) => c.childText), ["haan didi ready hoon", "example do"]);
  rt.dispose();
});

test("B3 runtime: the revoked turn still in flight → the merged words supersede it under the same turnSeq (edited)", async () => {
  let first = true;
  const a = apiWith((r, signal) => new Promise((res, rej) => {
    if (first && !r.edited) { first = false; signal?.addEventListener("abort", () => rej(signal.reason)); setTimeout(() => res(reply), 400); return; }
    res(reply);
  }));
  let link;
  const rt = new LessonRuntime({ api: a, outboxStore: new MemoryOutboxStore(true), createLink: (_m, c) => (link = new QuietLink(c.levels)) });
  await rt.start("c1", "text");
  link.emit({ type: "child_final", text: "teen", startedAt: Date.now(), typed: false });
  await wait(30);
  link.emit({ type: "child_final", text: "teen bata chaar", startedAt: Date.now(), typed: false, revokeOf: { turnId: 1, text: "teen" } });
  await wait(600);
  const sent = a.calls.map((c) => [c.childText, c.turnSeq, !!c.edited]);
  assert.deepEqual(sent.at(-1), ["teen bata chaar", sent[0][1], true], JSON.stringify(sent));
  assert.equal(sent.filter((x) => x[0] === "teen bata chaar").length, 1);
  rt.dispose();
});

test("B3 runtime: the edit lost the race (editLanded) → the new words follow as their own turn", async () => {
  let n = 0;
  const a = apiWith((r, signal) => new Promise((res, rej) => {
    n++;
    if (n === 1) { signal?.addEventListener("abort", () => rej(signal.reason)); setTimeout(() => res(reply), 400); return; }
    if (r.edited) return res({ ...reply, editLanded: true });
    res(reply);
  }));
  let link;
  const rt = new LessonRuntime({ api: a, outboxStore: new MemoryOutboxStore(true), createLink: (_m, c) => (link = new QuietLink(c.levels)) });
  await rt.start("c1", "text");
  link.emit({ type: "child_final", text: "haan didi", startedAt: Date.now(), typed: false });
  await wait(30);
  link.emit({ type: "child_final", text: "haan didi example do", startedAt: Date.now(), typed: false, revokeOf: { turnId: 1, text: "haan didi" } });
  await wait(600);
  const texts = a.calls.map((c) => c.childText);
  assert.equal(texts.at(-1), "example do", JSON.stringify(texts));
  rt.dispose();
});
