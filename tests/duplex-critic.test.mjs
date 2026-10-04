// Critique of duplex v2 (2026-10-04): regression tests for the four runtime fixes and the adversarial world.
// docs/research/duplex/CRITIQUE.md §4.
import test from "node:test";
import assert from "node:assert/strict";
import { verdictNotBefore, verdictReady, verdictAnchor } from "../src/duplex/engineRules.ts";
import { VERDICT } from "../src/duplex/config.ts";
import { understand } from "../server/duplex/understand.js";
import { EchoSubtractor } from "../server/duplex/echo.js";
import { unreadableTail } from "../src/duplex/markers.ts";
import { sttReal, slow, translit } from "../evals/duplex/critic/perturb.mjs";

const tick = (o) => ({ t: o.t, context: { exchange: "closed_answer" }, markers: { values: ["15"], lastValueAgeMs: o.age, repairOpen: false },
  child: { voicing: !!o.voicing, lastOffsetAt: o.offset ?? null } });

test("G7 verdict clock anchors on the child's last voice, not the value word (a unit word cannot eat the wait)", () => {
  // "पंद्रह (ends 4330) सेंटीमीटर (ends 4990)": the verdict may not play before 4990 + delay
  const k = tick({ t: 5220, age: 5220 - 4330, offset: 4990 });
  assert.equal(verdictAnchor(k), 4990);
  assert.equal(verdictNotBefore(k), 4990 + VERDICT.delayMs);
  assert.equal(verdictReady({ ...k, t: 4990 + VERDICT.delayMs - 1 }, { horizonBlocked: false }), false);
  // value is the last thing said: anchor = value end
  assert.equal(verdictAnchor(tick({ t: 5000, age: 400, offset: 4500 })), 4600);
  // while the child is voicing, nothing is ready
  assert.equal(verdictReady(tick({ t: 9000, age: 5000, offset: 3000, voicing: true }), { horizonBlocked: false }), false);
});

test("IDK ends a turn only at its tail (a disclosure after 'पता नहीं' is not an idk_help turn end)", () => {
  assert.equal(understand("पता नहीं").idk, true);
  assert.equal(understand("उम्म … पता नहीं दीदी").idk, true);
  assert.equal(understand("मुझे नहीं पता यार").idk, true);
  assert.equal(understand("पता नहीं कभी कभी लगता है मैं ना").idk, false);
  assert.equal(understand("पता नहीं कभी कभी लगता है मैं ना").idkAny, true);
  assert.equal(understand("पता नहीं शायद बारह").idk, false);
});

test("echo: her question inside a late straddling item is removed by audio span, her empty-skeleton tail too", () => {
  const e = new EchoSubtractor();
  const her = "triangle के तीनों angles का sum कितना होता है?".split(" ");
  e.heard("u1", her.map((w, i) => ({ w, startMs: 200 + i * 300, endMs: 480 + i * 300 })));
  // the text arrives 3+ s after her last word (outside the 2 s arrival window) but describes audio from 200 ms
  const r = e.subtract("triangle के तीनों angles का sum कितना होता है? तीन सौ साठ डिग्री।", 6060, 900, { fromMs: 200, toMs: 6000 });
  assert.equal(r.text, "तीन सौ साठ डिग्री।");
});

test("echo: a word-timed single token on her own word is echo; the child's later repeat of it is kept", () => {
  const e = new EchoSubtractor();
  e.heard("u1", [{ w: "शेर", startMs: 1700, endMs: 1940 }, { w: "गाय", startMs: 1940, endMs: 2190 }, { w: "या", startMs: 2190, endMs: 2440 }, { w: "बाघ?", startMs: 2440, endMs: 2690 }]);
  const times = [{ w: "बाघ?", startMs: 2440, endMs: 2690 }, { w: "गाय", startMs: 3540, endMs: 3980 }];
  assert.equal(e.subtract("बाघ? गाय", 4560, 400, { fromMs: 200, toMs: 3980 }, times).text, "गाय");
  const times2 = [{ w: "बाघ", startMs: 3540, endMs: 3980 }];
  assert.equal(e.subtract("बाघ", 4560, 400, { fromMs: 3540, toMs: 3980 }, times2).text, "बाघ", "the child's own 'बाघ' after her question is an answer");
});

test("unreadable tail: another script in the newest words is flagged; Hinglish in either script is not", () => {
  assert.equal(unreadableTail("वो क्या कहते हैं? そうです先生。"), true);
  assert.equal(unreadableTail("సాయంత్రం"), true);
  assert.equal(unreadableTail("छब्बीस square cm"), false);
  assert.equal(unreadableTail("सात दिन।"), false);
});

test("adversarial world: sttReal is deterministic and only touches child words; slow() keeps gold consistent", () => {
  const mk = () => ({ words: [{ w: "उम्म", seg: 0, src: "child" }, { w: "बारह", seg: 1, src: "child" }, { w: "square", seg: 1, src: "child" }, { w: "कितना", seg: 2, src: "echo" }], segs: [] });
  const a = sttReal(mk(), 7), b = sttReal(mk(), 7);
  assert.deepEqual(a, b);
  assert.equal(a.words.find((w) => w.src === "echo").w, "कितना");
  assert.match(translit("square"), /[ऀ-ॿ]/u);
  const n = 200;
  const d = { meta: { endMs: n * 20 }, frames: { t: Array.from({ length: n }, (_, i) => i * 20), db: Array(n).fill(-50), f0: Array(n).fill(null), herDb: Array(n).fill(-120), childOn: Array(n).fill(0), ovOn: Array(n).fill(0) },
    gold: { childSegs: [{ start: 1000, end: 1500 }, { start: 2500, end: 3000 }], childWords: [{ start: 1000, end: 1500 }, { start: 2500, end: 3000 }], pauses: [{ afterSeg: 0, ms: 1000, start: 1500, end: 2500 }],
      trueEnd: 3000, childStart: 1000, childOnset: 1000, herSpan: { start: 0, end: 800 }, herWords: [], herBoundaries: [], overlays: [] } };
  slow(d, 1.6);
  assert.equal(d.gold.pauses[0].end - d.gold.pauses[0].start, 1600);
  assert.equal(d.gold.pauses[0].ms, 1600);
  assert.equal(d.gold.trueEnd, 3600);
  assert.equal(d.frames.t.length, n + 30);
  assert.equal(d.meta.endMs, n * 20 + 600);
});
