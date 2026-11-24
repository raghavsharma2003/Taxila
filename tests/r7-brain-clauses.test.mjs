// round 7 A5 (PIPELINE §A Brain item 10; main's transport decision 2026-11-04): the streamed, clause-guarded reply. With
// `Accept: text/event-stream` POST /api/lesson/turn sends each guarded clause as `event: clause` and the full TurnResponse
// last as `event: turn`; without it the response is plain JSON. The first clause leaves while the rest is written, and a
// sent clause is never withdrawn. Pure: a fake response and a stubbed model stream.
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { clauseStream, runTurn, wantsClauses } from "../server/brain/clauses.js";
import { HttpError } from "../server/http.js";
import { textReply, replyDeps } from "../server/brain/say.js";
import { chat, chatStream } from "../server/azure.js";
import { initLessonState, step } from "../server/director/state.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX, cls } from "./fixtures/kit.mjs";
import { kitPath } from "./fixtures/kit-path.mjs";
import { describe } from "node:test";

afterEach(() => { replyDeps.chat = chat; replyDeps.chatStream = chatStream; delete process.env.TAXILA_R7_CLAUSE_STREAM; });

function fakeRes() {
  const r = { status: 0, headers: {}, chunks: [], ended: false, body: null };
  return Object.assign(r, {
    headersSent: false,
    writeHead(s, h) { r.status = s; Object.assign(r.headers, h); r.headersSent = true; },
    setHeader(k, v) { r.headers[k.toLowerCase()] = v; },
    write(c) { r.chunks.push(c); },
    end(b) { if (b) r.body = b; r.ended = true; },
    events() { return r.chunks.map((c) => { const [, ev, data] = c.match(/^event: (\w+)\ndata: (.*)\n\n$/s); return { ev, data: JSON.parse(data) }; }); },
  });
}
const SSE = { headers: { accept: "text/event-stream" } };

describe("r7-brain-clauses (kit path: lesson scripts off)", () => {
kitPath();
test("only a client that asks for the stream gets it", () => {
  assert.equal(wantsClauses(SSE), true);
  assert.equal(wantsClauses({ headers: { accept: "application/json" } }), false);
  assert.equal(wantsClauses({ headers: {} }), false);
});

test("an early clause, then the rest of the guarded reply clause by clause, then the turn", () => {
  const res = fakeRes();
  const s = clauseStream(res);
  s.clause({ lessonId: "L", seq: 7, i: 0, text: "Achha, ek baat dekho.", final: false });
  assert.equal(res.headers["content-type"], "text/event-stream; charset=utf-8");
  assert.equal(res.headers["cache-control"], "no-store");
  assert.equal(res.headers["x-accel-buffering"], "no");
  s.finish({ lessonId: "L", teacherReply: "Achha, ek baat dekho.  Dono tukde ek jaise barabar hain. Ab batao, kitne tukde bane?", teacherReplySeq: 7 });
  const ev = res.events();
  assert.deepEqual(ev.map((e) => e.ev), ["clause", "clause", "clause", "turn"]);
  assert.deepEqual(ev.slice(0, 3).map((e) => [e.data.i, e.data.text, e.data.final, e.data.seq]),
    [[0, "Achha, ek baat dekho.", false, 7], [1, "Dono tukde ek jaise barabar hain.", false, 7], [2, "Ab batao, kitne tukde bane?", true, 7]]);
  assert.equal(ev[3].data.clausesKept, undefined);
  assert.ok(res.ended);
});

test("a turn that failed closed after s1 went out: an empty final clause and clausesKept false (the client speaks the turn)", () => {
  const res = fakeRes();
  const s = clauseStream(res);
  s.clause({ lessonId: "L", seq: 7, i: 0, text: "Achha, ek baat dekho.", final: false });
  s.finish({ lessonId: "L", teacherReply: "Main yahin hoon. Kya hua, batao?", teacherReplySeq: 7 });
  const ev = res.events();
  assert.deepEqual(ev[1].data, { lessonId: "L", seq: 7, i: 1, text: "", final: true });
  assert.equal(ev[2].ev, "turn");
  assert.equal(ev[2].data.clausesKept, false);
});

test("no early clause: every clause after the whole guard; a held turn (no reply) is the turn event alone", () => {
  const res = fakeRes();
  // (the TTS split: a piece under 18 characters rides with the next one, server/voice/sentences.js)
  clauseStream(res).finish({ lessonId: "L", teacherReply: "Sahi! Bilkul theek socha tumne. Ab agla sawaal dekhein?", teacherReplySeq: 3 });
  assert.deepEqual(res.events().map((e) => [e.ev, e.data.text ?? null, e.data.final ?? null]), [["clause", "Sahi! Bilkul theek socha tumne.", false], ["clause", "Ab agla sawaal dekhein?", true], ["turn", null, null]]);
  const res2 = fakeRes();
  clauseStream(res2).finish({ lessonId: "L", hold: true });
  assert.deepEqual(res2.events().map((e) => e.ev), ["turn"]);
});

test("runTurn: plain JSON without the header; a refusal before any clause is the plain JSON error; after one, event: turn", async () => {
  const res = fakeRes();
  await runTurn({ headers: {} }, res, async () => ({ teacherReply: "x" }), {});
  assert.equal(res.headers["content-type"], "application/json; charset=utf-8");
  assert.equal(JSON.parse(res.body).teacherReply, "x");
  const res2 = fakeRes();
  await assert.rejects(runTurn(SSE, res2, async () => { throw new HttpError(409, "stale"); }, {}), /stale/);
  assert.equal(res2.chunks.length, 0, "nothing written: the router answers 409 as JSON");
  const res3 = fakeRes();
  await runTurn(SSE, res3, async (h) => { h.onClause({ lessonId: "L", seq: 2, i: 0, text: "Ek baat.", final: false }); throw new HttpError(503, "busy"); }, {});
  const ev = res3.events();
  assert.deepEqual(ev.map((e) => e.ev), ["clause", "turn"]);
  assert.deepEqual(ev[1].data, { error: "busy", status: 503 });
});

// ── the Director side: the streamed draft's first sentence is locked and sent early ──
const RANI = kitFromFile(getTopic("c6-maths-ch06-t01"));
const K = { ...RANI, workedExample: { ...RANI.workedExample, fadedVersion: undefined } };
function posed() {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, lang: "hinglish" }, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
  for (let i = 0; i < 12 && !(r.ui?.ask?.itemId && r.move.kind === "practice"); i++) r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), text: "haan", now: (r.state.turn + 1) * 20_000 });
  return r;
}
const streamOf = (text) => async (_d, _m, o) => { let soFar = ""; for (const w of text.split(/(?<= )/)) { soFar += w; o.onDelta?.(w, soFar); } return { text }; };

test("a streamed draft: s1 leaves as soon as it is complete, and the final reply starts with it", async () => {
  const r = posed();
  assert.ok(r.ui?.ask?.itemId, "a pinned practice card");
  const ask = r.ui.ask.text;
  const draft = `Chalo, ab ek naya sawaal saath mein dekhte hain. ${ask}`;
  const got = [];
  let sentAt = null;
  replyDeps.chatStream = async (d, m, o) => { let s = ""; for (const w of draft.split(/(?<= )/)) { s += w; o.onDelta?.(w, s); if (got.length && sentAt === null) sentAt = s.length; } return { text: draft }; };
  replyDeps.chat = async () => { throw new Error("the streamed path makes no second call"); };
  const out = await textReply({ instructions: "x", state: { ...r.state, mode: "voice" }, kit: K, childText: "haan", verdict: "ungraded", history: [], ui: r.ui, module: null, onClause: (c) => got.push(c) });
  assert.equal(got.length, 1, JSON.stringify(out.guard));
  assert.equal(got[0].text, "Chalo, ab ek naya sawaal saath mein dekhte hain.");
  assert.ok(sentAt < draft.length, "sent before the draft was finished");
  assert.ok(out.reply.replace(/\s+/g, " ").startsWith(got[0].text), out.reply);
  assert.equal(out.guard.clause.sent, true);
});

test("a first sentence a guard would catch is never sent early; the whole guard runs as before", async () => {
  const r = posed();
  const got = [];
  replyDeps.chatStream = streamOf(`Kya tum taiyaar ho? ${r.ui.ask.text}`);
  const out = await textReply({ instructions: "x", state: { ...r.state, mode: "voice" }, kit: K, childText: "haan", verdict: "ungraded", history: [], ui: r.ui, module: null, onClause: (c) => got.push(c) });
  assert.equal(got.length, 0, "a question as s1 is not locked");
  assert.equal(out.guard.clause.sent, false);
  assert.equal(out.guard.clause.why, "s1_asks");
});

test("a stream that dies after s1 went out ends on the lock's fallback (s1 + the pinned question), never a withdrawal", async () => {
  const r = posed();
  const s1 = "Chalo, ab ek naya sawaal saath mein dekhte hain.";
  replyDeps.chatStream = async (_d, _m, o) => { o.onDelta?.(`${s1} Ab`, `${s1} Ab`); throw Object.assign(new Error("stalled"), { code: "stalled" }); };
  const got = [];
  const out = await textReply({ instructions: "x", state: { ...r.state, mode: "voice" }, kit: K, childText: "haan", verdict: "ungraded", history: [], ui: r.ui, module: null, onClause: (c) => got.push(c) });
  assert.equal(got.length, 1);
  assert.ok(out.reply.startsWith(s1), out.reply);
  assert.ok(out.reply.includes(r.ui.ask.text.slice(0, 12)), out.reply);
});

test("kill switch TAXILA_R7_CLAUSE_STREAM=off: the one-call path, nothing sent early", async () => {
  process.env.TAXILA_R7_CLAUSE_STREAM = "off";
  const r = posed();
  replyDeps.chat = async () => ({ text: `Chalo, ab ek naya sawaal saath mein dekhte hain. ${r.ui.ask.text}` });
  replyDeps.chatStream = async () => { throw new Error("no stream when off"); };
  const got = [];
  const out = await textReply({ instructions: "x", state: { ...r.state, mode: "voice" }, kit: K, childText: "haan", verdict: "ungraded", history: [], ui: r.ui, module: null, onClause: (c) => got.push(c) });
  assert.equal(got.length, 0);
  assert.equal(out.guard.clause, undefined);
});
});
