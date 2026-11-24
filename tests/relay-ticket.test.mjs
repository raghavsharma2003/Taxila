// Round 7, stream G (platform-d5-relay-in-india): the relay ticket. No network, no DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mintRelayTicket, verifyRelayTicket } from "../server/relay-ticket.js";

const env = { TAXILA_D5_TICKET_KEY: "k".repeat(40) };
const who = { lessonId: "L-1", childId: "C-1", guardianId: "G-1", mode: "on" };

test("a ticket verifies for its own lesson within its lifetime, and carries who it was minted for", () => {
  const t = mintRelayTicket(who, { env, now: 1000 });
  assert.deepEqual(verifyRelayTicket(t, { lessonId: "L-1", env, now: 1000 + 59_000 }), { ok: true, lessonId: "L-1", childId: "C-1", guardianId: "G-1", mode: "on" });
});

test("refused: another lesson, expired, a different key, a tampered payload, garbage, no key", () => {
  const t = mintRelayTicket(who, { env, now: 1000 });
  assert.equal(verifyRelayTicket(t, { lessonId: "L-2", env, now: 1000 }).reason, "lesson");
  assert.equal(verifyRelayTicket(t, { lessonId: "L-1", env, now: 1000 + 60_001 }).reason, "expired");
  assert.equal(verifyRelayTicket(t, { lessonId: "L-1", env: { TAXILA_D5_TICKET_KEY: "x".repeat(40) }, now: 1000 }).reason, "signature");
  const [body, sig] = t.split(".");
  const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url")), l: "L-2" })).toString("base64url");
  assert.equal(verifyRelayTicket(`${forged}.${sig}`, { lessonId: "L-2", env, now: 1000 }).reason, "signature");
  for (const bad of ["", "abc", "a.b.c", undefined, null]) assert.equal(verifyRelayTicket(bad, { lessonId: "L-1", env, now: 1000 }).ok, false);
  assert.equal(verifyRelayTicket(t, { lessonId: "L-1", env: {}, now: 1000 }).reason, "no_key");
});

test("used once: a relay that remembers signatures refuses a replay", () => {
  const seen = new Set();
  const t = mintRelayTicket(who, { env, now: 1000 });
  assert.equal(verifyRelayTicket(t, { lessonId: "L-1", env, now: 1000, seen }).ok, true);
  assert.equal(verifyRelayTicket(t, { lessonId: "L-1", env, now: 1001, seen }).reason, "reused");
});

test("minting needs a strong key and the three ids", () => {
  assert.throws(() => mintRelayTicket(who, { env: { TAXILA_D5_TICKET_KEY: "short" } }), /32 characters/);
  assert.throws(() => mintRelayTicket({ lessonId: "L" }, { env }), /childId/);
});
