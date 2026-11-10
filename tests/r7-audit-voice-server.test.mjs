// Whole-project audit 2026-11-09, voice area (docs/design/round7/audit/voice.md): one test per server-side fix.
import { test } from "node:test";
import assert from "node:assert/strict";
import { speakStreamed } from "../server/latency/speech-stream.js";

async function* deltasOf(parts) { for (const p of parts) yield p; }

test("V-01: a synthesis error with more clauses queued than the lookahead rejects (the reply always ends)", async () => {
  const clauses = ["Ek baat suno.", "Do aur do chaar.", "Teen aur teen chhe.", "Chaar aur chaar aath.", "Paanch aur paanch das."];
  const synth = async function* (clause) { await new Promise((r) => setTimeout(r, 5)); throw new Error("tts down: " + clause); };
  const p = speakStreamed({ deltas: deltasOf(clauses.map((c) => c + " ")), synth, emit: () => {} });
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error("never settled")), 2000));
  await assert.rejects(Promise.race([p, timeout]), /tts down/);
});

// ── V-12: the same-origin D5 socket admits a paired child device (the upgrade sets the child-scope mark) ──
import { handleD5Upgrade } from "../server/duplex/d5route.js";
import { CHILD_SCOPE, requireGuardian } from "../server/auth.js";
import { EventEmitter } from "node:events";
class FakeSocket extends EventEmitter {
  constructor() { super(); this.out = []; this.destroyed = false; }
  write(b) { this.out.push(Buffer.isBuffer(b) ? b : Buffer.from(b)); return true; }
  end(b) { if (b) this.out.push(b); }
  destroy() { this.destroyed = true; }
  setNoDelay() {}
  get text() { return Buffer.concat(this.out).toString("latin1"); }
}
test("V-12: the D5 upgrade marks the request child-scoped, so a paired device's session is not refused 'paired to a child'", async () => {
  const ENV = { AZURE_AI_CENTRALINDIA_ENDPOINT: "https://vl.example.cognitiveservices.azure.com/", AZURE_AI_CENTRALINDIA_KEY: "k" };
  const req = { method: "GET", url: "/api/duplex/voicelive?lessonId=00000000-0000-0000-0000-000000000001",
    headers: { upgrade: "websocket", connection: "Upgrade", "sec-websocket-version": "13", "sec-websocket-key": "dGhlIHNhbXBsZSBub25jZQ==", host: "taxila.dev", origin: "https://taxila.dev" } };
  let marked = null;
  const authorize = {
    lookupLesson: async () => ({ id: "x", child_id: "c1", ended_at: null }),
    // the real requireGuardian refuses a device-only request with no mark (403 scope.child_device) before any lookup
    child: async (r) => { marked = r[CHILD_SCOPE]; if (!r[CHILD_SCOPE]) throw Object.assign(new Error("this device is paired to a child"), { status: 403 }); return { guardian: { id: "g-v12" }, child: { id: "c1" } }; },
    consent: async () => true,
    mode: async () => ({ duplex: "on", lane: "d5" }),
  };
  const s = new FakeSocket();
  const relay = await handleD5Upgrade(req, s, Buffer.alloc(0), { env: ENV, authorize, openUpstream: () => ({ send() {}, close() {} }), phrases: { lookup: async () => null } });
  assert.equal(marked, true);
  assert.match(s.text, /^HTTP\/1\.1 101/);
  relay?.end?.(1000, "test");
  // and the mark is what requireGuardian reads: no mark → refused before any database read
  await assert.rejects(requireGuardian({ headers: { cookie: "tx_child=d.abc" } }), (e) => e.status === 403);
});

// ── V-26: DragonHD keeps bracketed maths and emphasised words; stage directions still go ──
import { stripStageDirections } from "../server/voice/expressive/compile/dhd.js";
test("V-26: bracketed maths and *emphasis* are said; [laughs] and *smiles* are not", () => {
  assert.equal(stripStageDirections("Set [1, 2, 3] dekho"), "Set [1, 2, 3] dekho");
  assert.equal(stripStageDirections("Yeh *zaroori* hai"), "Yeh zaroori hai");
  assert.equal(stripStageDirections("Arre wah! [laughs] Sahi jawab. *smiles* Ab agla."), "Arre wah! Sahi jawab. Ab agla.");
});

// ── V-20: a streamed reply's prewarm is aborted (no second synthesis) and the reply counts in the speech limit ──
import { _turnAudio, turnAudioDeps } from "../server/routes/voice.js";
import { __test as prewarmTest } from "../server/voice/prewarm.js";
import { createHash } from "node:crypto";
test("V-20: when turn-audio streamed the reply, the turn's prewarm entry is taken and aborted", async () => {
  const tokenHash = createHash("sha256").update("t").digest("hex");
  const abort = new AbortController();
  const lessonId = "00000000-0000-0000-0000-0000000000b2";
  Object.assign(turnAudioDeps, { style: () => ({}), synth: async function* (clause) { yield Buffer.from(clause); },
    lessonTurn: async (req, body, hooks) => {
      // what brain/turn.js prewarm() leaves behind for this reply (no speech call here: a hand-made entry)
      prewarmTest.entries.set(`${lessonId}:7`, { tokenHash, guardianId: "g-v20", abort, timer: setTimeout(() => {}, 0) });
      hooks.onClause({ text: "Achha." });
      await new Promise((r) => setTimeout(r, 10));
      return { teacherReply: "Achha. Ab agla sawaal.", teacherReplySeq: 7 };
    } });
  const res = { chunks: [], statusCode: 0, writableEnded: false, writeHead(c) { this.statusCode = c; }, flushHeaders() {}, write(b) { this.chunks.push(Buffer.from(b)); return true; },
    end() { this.writableEnded = true; }, on() {}, once() {}, off() {} };
  try {
    await _turnAudio({ headers: { cookie: "tx_session=t", accept: "application/x-taxila-pcm-frames;v=2" }, url: "/api/lesson/turn-audio" }, res, { lessonId });
    assert.equal(abort.signal.aborted, true, "the duplicate synthesis was stopped");
    assert.equal(prewarmTest.entries.has(`${lessonId}:7`), false);
  } finally { Object.assign(turnAudioDeps, { lessonTurn: null, style: null, synth: null }); prewarmTest.clear(); }
});

// ── V-17: maths read aloud as maths ──
import { speakable } from "../server/voice/spoken.js";
test("V-17: subtraction, round numbers, 'by', dot-times, dates, a dial number before its cue, '= ?' and π", () => {
  const EN = {}, HI = { mode: "hindi", schoolMedium: "hindi" };
  assert.equal(speakable("75000-25000 = 50000", EN), "Seventy-five thousand minus twenty-five thousand equals fifty thousand");
  assert.equal(speakable("60000 40000 se bada hai", EN), "Sixty thousand forty thousand se bada hai");
  assert.equal(speakable("Divide 5000 by 1250", EN), "Divide five thousand by one thousand two hundred fifty");
  assert.equal(speakable("9.30 baje", EN), "Nine thirty baje");
  assert.equal(speakable("15/08/1947", EN), "Fifteen August nineteen forty-seven");
  assert.equal(speakable("15/08/1947", HI), "पंद्रह अगस्त उन्नीस सौ सैंतालीस");
  assert.match(speakable("112 pe call karo", EN), /^one one two pe call karo$/i);
  assert.equal(speakable("5 + 3 = ?", EN), "Five plus three equals ?");
  assert.equal(speakable("A = πr²", EN), "A equals pi r squared");
  // unchanged: real phone numbers and real years
  assert.equal(speakable("Call 98765 43210", EN), "Call nine eight seven six five four three two one zero");
  assert.equal(speakable("in 1947", EN), "in nineteen forty-seven");
});
