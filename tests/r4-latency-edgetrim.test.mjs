// r4-latency: edgeTrim's tail rule must never delay loud audio. Part 0 of every multi-part reply is trimmed with
// { lead: true, tail: true } (server/routes/voice.js streamParts); the old rule held back the last MAX_TAIL_MS (800 ms) of
// ALL audio, so her first sound waited for ~800 ms of synthesis (+250-350 ms measured on DragonHD, 2026-10-10).
import test from "node:test";
import assert from "node:assert/strict";
import { edgeTrim, RATE, KEEP_MS, KEEP_TAIL_MS, MAX_TAIL_MS } from "../server/voice/expressive/pauses.js";

const ms = (n) => Math.round((RATE * n) / 1000);
const quiet = (d) => Buffer.alloc(ms(d) * 2);
const tone = (d) => { const b = Buffer.alloc(ms(d) * 2); for (let k = 0; k < ms(d); k++) b.writeInt16LE(Math.round(8000 * Math.sin((2 * Math.PI * 220 * k) / RATE)), k * 2); return b; };
const samples = (b) => b.length >> 1;

/** A source that records how many source bytes had been pulled when each output chunk came out. */
async function run(pieces, opts) {
  let pulled = 0;
  const firstAt = [];
  const out = [];
  async function* src() { for (const p of pieces) { pulled += p.length; yield p; } }
  for await (const c of edgeTrim(src(), opts)) { firstAt.push(pulled); out.push(Buffer.from(c)); }
  return { out: Buffer.concat(out), firstPulled: firstAt[0] ?? null };
}

test("tail: loud audio is yielded as soon as it arrives (no MAX_TAIL_MS hold-back of speech)", async () => {
  // 150 ms lead, then speech in 40 ms pieces, as DragonHD streams it
  const pieces = [quiet(150), ...Array.from({ length: 30 }, () => tone(40)), quiet(300)];
  const { firstPulled } = await run(pieces, { lead: true, tail: true });
  // the first output comes with the first loud piece, never after MAX_TAIL_MS more of it
  assert.ok(firstPulled <= (ms(150) + ms(40)) * 2, `first output after ${firstPulled / 2 / RATE * 1000} ms of source`);
  assert.ok(firstPulled < ms(MAX_TAIL_MS) * 2);
});

test("tail: the same bytes as the rule promises — lead cut to KEEP_MS, trailing quiet to KEEP_TAIL_MS, inner pauses kept", async () => {
  const src = Buffer.concat([quiet(300), tone(500), quiet(180), tone(400), quiet(350)]);
  for (const size of [97, 480, 960, 4801, 1 << 16]) {
    const pieces = [];
    for (let i = 0; i < src.length; i += size) pieces.push(src.subarray(i, i + size));
    const { out } = await run(pieces, { lead: true, tail: true });
    const expect = ms(KEEP_MS) + ms(500) + ms(180) + ms(400) + ms(KEEP_TAIL_MS);
    assert.ok(Math.abs(samples(out) - expect) <= ms(10) + 1, `chunk ${size}: ${samples(out)} vs ${expect}`);
  }
});

test("tail: a quiet run longer than MAX_TAIL_MS is trimmed only in its last MAX_TAIL_MS", async () => {
  const src = Buffer.concat([tone(200), quiet(1500)]);
  const pieces = [];
  for (let i = 0; i < src.length; i += 960) pieces.push(src.subarray(i, i + 960));
  const { out } = await run(pieces, { tail: true });
  assert.ok(Math.abs(samples(out) - (ms(200) + ms(1500 - MAX_TAIL_MS))) <= ms(10) + 1, `${samples(out)} samples`);
});

test("tail: an all-quiet part writes nothing beyond what MAX_TAIL_MS cannot cover", async () => {
  const { out } = await run([quiet(500)], { tail: true });
  assert.equal(samples(out), 0);
});
