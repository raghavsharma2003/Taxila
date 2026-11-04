// Round 7, stream B Voice, item voice-d5-ear-asr (B4): the D5 ear.
//   server/duplex/phrases.js     the per-lesson phrase list (names, the kit's short answers, a Hinglish core, numbers);
//   voicelive.js                 azure-speech carries it as phrase_list; TAXILA_D5_ASR picks a delta-streaming model;
//   d5route.js phrasesFor        a slow kit never holds the stream open;
//   d5Stream.clip / wavOf        the second ear's source: the sent mic channel on Voice Live's own audio clock;
//   cascadeDuplex secondEar      an unheard turn gets one more listen before she re-asks; turns stay in order.
import { test } from "node:test";
import assert from "node:assert/strict";

import { lessonPhrases, phraseOf, PHRASE_MAX } from "../server/duplex/phrases.js";
import { voiceLiveSession, transcriptionConfig, d5AsrModel } from "../server/duplex/voicelive.js";
import { phrasesFor } from "../server/duplex/d5route.js";
import { D5Stream, wavOf, D5_CLIP_KEEP_MS } from "../src/duplex/d5Stream.ts";
import { CascadeDuplex } from "../src/duplex/cascadeDuplex.ts";

const KIT = { topics: [{ topicId: "c4-maths-area", items: [
  { answer: "40 square cm", acceptable: ["चालीस square cm", "40 sq cm", "forty square centimetres is the area of it"] },
  { answer: "सात", acceptable: ["7", "seven"] },
  { answer: "Because the sides are equal and so the area grows?", acceptable: [] },
] }, { topicId: "other", items: [{ answer: "elsewhere", acceptable: [] }] }] };
const STATE = { topicId: "c4-maths-area", ctx: { firstName: "Aarav", teacherName: "Diya" } };

test("B4 phrases: names first, the lesson's own short answers, then the core; no sentences, no other topic", () => {
  const p = lessonPhrases({ state: STATE, kit: KIT });
  assert.deepEqual(p.slice(0, 2), ["Aarav", "Diya"]);
  for (const w of ["40 square cm", "चालीस square cm", "सात", "seven", "हाँ", "पता नहीं", "तीस", "दीदी"]) assert.ok(p.includes(w), w);
  assert.ok(!p.some((x) => /grows|forty square centimetres/.test(x)), "long answers and sentences are not phrases");
  assert.ok(!p.includes("elsewhere"), "only this lesson's topic");
  assert.equal(new Set(p.map((x) => x.toLowerCase())).size, p.length, "no duplicates");
  assert.ok(p.length <= PHRASE_MAX);
  assert.ok(!/[<>]/.test(phraseOf("<b>x</b>")), "no markup reaches the service");
  assert.equal(phraseOf("kya hai?"), "kya hai", "a trailing mark is trimmed");
  assert.equal(phraseOf(42), null);
  // no kit (a slow lookup): names + core still
  const bare = lessonPhrases({ state: STATE, kit: null });
  assert.ok(bare.includes("Aarav") && bare.includes("हाँ") && !bare.includes("40 square cm"));
});

test("B4 session: azure-speech carries the phrase list and both languages; a transcribe model gets neither; env picks", () => {
  assert.deepEqual(transcriptionConfig({ model: "azure-speech", phrases: ["हाँ", "सात"] }), { model: "azure-speech", language: "hi-IN,en-IN", phrase_list: ["हाँ", "सात"] });
  assert.deepEqual(transcriptionConfig({ model: "azure-speech" }), { model: "azure-speech", language: "hi-IN,en-IN" }, "no list → no field (today's session)");
  assert.deepEqual(transcriptionConfig({ model: "gpt-4o-transcribe", phrases: ["x"] }), { model: "gpt-4o-transcribe" });
  assert.deepEqual(voiceLiveSession({ phrases: ["सात"] }).input_audio_transcription.phrase_list, ["सात"]);
  assert.equal(d5AsrModel({}), "azure-speech", "default unchanged until a live arm");
  assert.equal(d5AsrModel({ TAXILA_D5_ASR: "gpt-4o-transcribe" }), "gpt-4o-transcribe");
  assert.equal(d5AsrModel({ TAXILA_D5_ASR: "whatever" }), "azure-speech");
});

test("B4 phrasesFor: the kit's answers when it is quick; names + core when it is slow or fails", async () => {
  const lesson = { topic_id: "c4-maths-area", state: STATE };
  assert.ok((await phrasesFor(lesson, { kit: async () => KIT })).includes("सात"));
  const t0 = Date.now();
  const slow = await phrasesFor(lesson, { kit: () => new Promise((r) => setTimeout(() => r(KIT), 2000)), timeoutMs: 50 });
  assert.ok(Date.now() - t0 < 1000, "never waits on a slow kit");
  assert.ok(slow.includes("Aarav") && !slow.includes("सात" + "x") && !slow.includes("40 square cm"));
  assert.ok((await phrasesFor(lesson, { kit: async () => { throw new Error("db"); } })).includes("हाँ"));
});

test("B4 d5Stream.clip: the sent mic channel by Voice Live audio time; old audio is dropped; WAV header", () => {
  const sent = [];
  const st = new D5Stream({});
  st.ws = { readyState: 1, bufferedAmount: 0, send: (b) => sent.push(b) };
  // 20 ms frames, stereo: left = frame index, right = 9999 (her reference, never in the clip)
  for (let f = 0; f < 50; f++) {
    const st16 = new Int16Array(320 * 2);
    for (let i = 0; i < 320; i++) { st16[2 * i] = f; st16[2 * i + 1] = 9999; }
    st.frame(st16.buffer, f * 0.02);
  }
  const c = st.clip(100, 160); // frames 5..7
  assert.equal(c.length, 960);
  assert.equal(c[0], 5);
  assert.equal(c[c.length - 1], 7);
  assert.ok(!c.includes(9999), "only the mic channel");
  assert.equal(st.clip(2000, 2100), null, "past the end");
  assert.equal(st.clip(50, 40), null);
  const w = wavOf(new Int16Array([1, -1]));
  assert.equal(String.fromCharCode(...w.slice(0, 4)), "RIFF");
  assert.equal(String.fromCharCode(...w.slice(8, 12)), "WAVE");
  assert.equal(new DataView(w.buffer).getUint32(24, true), 16000);
  assert.equal(w.length, 48);
  assert.ok(D5_CLIP_KEEP_MS >= 8000);
});

function duplex(secondEar) {
  const out = [];
  const d = new CascadeDuplex({
    lessonId: "L1", audio: () => null, herSounding: () => false, duck() {}, pause: () => false, resume() {}, stop() {},
    emitChild: (e) => out.push(e), sttCommit() {}, setServerVad() {}, ...(secondEar ? { secondEar } : {}),
  }, { mode: "on", lane: "d5" });
  // two items: their spans on the Voice Live clock
  d.noteSpan({ type: "input_audio_buffer.speech_started", item_id: "i1", audio_start_ms: 1000 });
  d.noteSpan({ type: "input_audio_buffer.speech_stopped", item_id: "i1", audio_end_ms: 1600 });
  return { d, out };
}
const turn = (o = {}) => ({ turnId: 1, text: "", startedAt: 0, itemId: "i1", asrConfidence: 0, duplex: { transcriptHash: null, safetyPending: null, cutInReason: null, unheard: true, engineSummary: {} }, ...o });
const flush = () => new Promise((r) => setTimeout(r, 10));

test("B4 second ear: an unheard turn is re-heard from the device clip; words found → a real turn, no unheard", async () => {
  const asked = [];
  const { d, out } = duplex(async (a0, a1) => { asked.push([a0, a1]); return { text: "सात है ना", confidence: 0.8 }; });
  d.commit(turn());
  assert.equal(out.length, 0, "held while the second ear listens");
  await flush();
  assert.deepEqual(asked, [[700, 1800]], "the item's span, with pre-roll and tail");
  assert.equal(out[0].text, "सात है ना");
  assert.equal(out[0].asrConfidence, 0.8);
  assert.equal(out[0].duplex.unheard, undefined, "no longer unheard");
});

test("B4 second ear: nothing found (or no surface) → the unheard turn as before; later turns wait their turn", async () => {
  const { d, out } = duplex(async () => null);
  d.commit(turn());
  d.commit(turn({ turnId: 2, text: "aur", itemId: "i2", asrConfidence: undefined, duplex: { transcriptHash: null, safetyPending: null, cutInReason: null, engineSummary: {} } }));
  assert.equal(out.length, 0, "the second turn waits behind the held one");
  await flush();
  assert.deepEqual(out.map((e) => [e.text, !!e.duplex.unheard]), [["", true], ["aur", false]]);
  const plain = duplex(null);
  plain.d.commit(turn());
  assert.equal(plain.out.length, 1, "no second ear: out at once, unheard");
  const heard = duplex(async () => ({ text: "x" }));
  heard.d.commit(turn({ text: "haan", duplex: { transcriptHash: null, safetyPending: null, cutInReason: null, engineSummary: {} } }));
  assert.equal(heard.out.length, 1, "a heard turn is never held");
});
