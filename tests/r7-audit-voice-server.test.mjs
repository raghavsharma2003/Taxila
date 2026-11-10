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
