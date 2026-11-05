// Round 7 (Platform 002, the India D5 relay taxila-d5-sin): taxila-web mints a single-use ticket after authorizeD5; the
// relay (TAXILA_ROLE=d5relay) accepts only a valid ticket for that lesson, with no cookie and no database; the client
// tries the relay first and falls back once to today's same-origin socket. Platform's server/relay-ticket.js is injected
// here (`lib`), with the same contract: mint(who) → string; verify(ticket, { lessonId, seen }) → { ok, … } | { ok:false, reason }.
import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { d5Ticket, relayWho, handleD5Upgrade } from "../server/duplex/d5route.js";
import { D5Stream, relayUrl } from "../src/duplex/d5Stream.ts";

const LESSON = "00000000-0000-0000-0000-000000000001";
const fakeLib = () => {
  const lib = {
    mintRelayTicket: (who) => `t.${who.lessonId}.${who.childId}.${who.guardianId}.${Math.random().toString(36).slice(2)}`,
    verifyRelayTicket: (ticket, { lessonId, seen }) => {
      const [t, l, c, g] = String(ticket).split(".");
      if (t !== "t") return { ok: false, reason: "signature" };
      if (l !== lessonId) return { ok: false, reason: "lesson" };
      if (seen?.has(ticket)) return { ok: false, reason: "reused" };
      seen?.add(ticket);
      return { ok: true, lessonId: l, childId: c, guardianId: g, mode: "on" };
    },
  };
  return async () => lib;
};
const okAuth = { lookupLesson: async () => ({ id: LESSON, child_id: "c1", ended_at: null }), child: async () => ({ guardian: { id: "g1" }, child: { id: "c1" } }),
  consent: async () => true, mode: async () => ({ duplex: "on", lane: "d5" }) };
const VL = { AZURE_AI_CENTRALINDIA_ENDPOINT: "https://vl.example.cognitiveservices.azure.com/", AZURE_AI_CENTRALINDIA_KEY: "k" };

test("ticket: minted only after authorizeD5 passes; no relay URL → { url: null } (today's path, and the rollback)", async () => {
  const lib = fakeLib();
  const out = await d5Ticket({ headers: {} }, { lessonId: LESSON }, { env: { ...VL, TAXILA_D5_RELAY_URL: "wss://d5-sin.example/api/duplex/voicelive/" }, authorize: okAuth, lib });
  assert.equal(out.url, "wss://d5-sin.example/api/duplex/voicelive");
  assert.match(out.ticket, new RegExp(`^t\\.${LESSON}\\.c1\\.g1\\.`));
  assert.deepEqual(await d5Ticket({ headers: {} }, { lessonId: LESSON }, { env: VL, authorize: okAuth, lib }), { url: null });
  await assert.rejects(d5Ticket({ headers: {} }, { lessonId: LESSON }, { env: { ...VL, TAXILA_D5_RELAY_URL: "wss://x" }, authorize: { ...okAuth, consent: async () => false }, lib }),
    (e) => e.status === 403, "no consent, no ticket");
});

test("relay accept: a valid ticket for this lesson once; another lesson's, a forged or a reused ticket is refused", async () => {
  const lib = fakeLib();
  const seen = new Set();
  const tk = (await lib()).mintRelayTicket({ lessonId: LESSON, childId: "c1", guardianId: "g1" });
  const req = (l, t) => ({ url: `/api/duplex/voicelive?lessonId=${l}&ticket=${encodeURIComponent(t)}`, headers: {} });
  const a = await relayWho(req(LESSON, tk), { lib, seen });
  assert.deepEqual(a.who, { guardian: { id: "g1" }, child: { id: "c1" }, lesson: { id: LESSON, state: null } });
  assert.equal((await relayWho(req(LESSON, tk), { lib, seen })).reason, "reused");
  assert.equal((await relayWho(req("00000000-0000-0000-0000-000000000002", (await lib()).mintRelayTicket({ lessonId: LESSON, childId: "c1", guardianId: "g1" })), { lib, seen })).reason, "lesson");
  assert.equal((await relayWho(req(LESSON, "forged"), { lib, seen })).reason, "signature");
});

class FakeSocket extends EventEmitter {
  constructor() { super(); this.out = []; this.destroyed = false; this.writable = true; }
  write(b) { this.out.push(String(b)); return true; }
  end(b) { if (b) this.out.push(String(b)); this.destroyed = true; }
  destroy() { this.destroyed = true; }
}
const upgrade = (q, extra = {}) => ({ method: "GET", url: `/api/duplex/voicelive?${q}`, headers: { upgrade: "websocket", connection: "Upgrade", "sec-websocket-version": "13", "sec-websocket-key": "dGhlIHNhbXBsZSBub25jZQ==", host: "d5-sin.example", origin: "https://taxila.dev", ...extra } });

test("relay role: no cookie and a cross-origin page are fine with a ticket; without one, 401; without the role, today's rules", async () => {
  const lib = fakeLib();
  const s1 = new FakeSocket();
  await handleD5Upgrade(upgrade(`lessonId=${LESSON}&ticket=bad`), s1, Buffer.alloc(0), { env: { ...VL, TAXILA_ROLE: "d5relay" }, relay: { lib } });
  assert.match(s1.out.join(""), /^HTTP\/1\.1 401/);
  assert.match(s1.out.join(""), /ticket refused \(signature\)/);
  const s2 = new FakeSocket();
  await handleD5Upgrade(upgrade(`lessonId=${LESSON}`), s2, Buffer.alloc(0), { env: VL });
  assert.match(s2.out.join(""), /^HTTP\/1\.1 403/, "taxila-web itself still refuses a cross-origin upgrade");
});

test("client: the relay first when offered; a refused relay costs one retry on the same-origin socket; no ticket → same origin only", async () => {
  const opened = [];
  class WS { constructor(url) { opened.push(url); this.readyState = 0; setTimeout(() => this.onclose?.({ code: 1006 }), 1); } close() {} }
  const loc = { protocol: "https:", host: "taxila.dev" };
  const st = new D5Stream({ WebSocket: WS, location: loc, workletUrl: "x", ticket: async () => ({ url: "https://d5-sin.example/api/duplex/voicelive", ticket: "T1" }) });
  await assert.rejects(st.start({ lessonId: LESSON, ctx: {}, mic: {}, onEvent() {}, onLost() {}, openTimeoutMs: 200 }));
  assert.deepEqual(opened, [`wss://d5-sin.example/api/duplex/voicelive?lessonId=${LESSON}&ticket=T1`, `wss://taxila.dev/api/duplex/voicelive?lessonId=${LESSON}`]);
  assert.equal(st.stats.relayFallbacks, 1);
  assert.equal(st.via, "same_origin");
  opened.length = 0;
  const plain = new D5Stream({ WebSocket: WS, location: loc, workletUrl: "x", ticket: async () => ({ url: null }) });
  await assert.rejects(plain.start({ lessonId: LESSON, ctx: {}, mic: {}, onEvent() {}, onLost() {}, openTimeoutMs: 200 }));
  assert.deepEqual(opened, [`wss://taxila.dev/api/duplex/voicelive?lessonId=${LESSON}`]);
  assert.equal(relayUrl("http://h/p?x=1", "L", "a b"), "ws://h/p?x=1&lessonId=L&ticket=a%20b");
});
