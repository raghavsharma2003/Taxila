// round 5 (sim lab voice lane, TEST lessons a599ae9a / ec0d365e; persona p19): on the safeguard's STAY turn her model line
// broke a guard and the fallback was the FIRST turn's fixed line again, word for word, after the child had answered. The
// stay turn now has its own fixed line: different words, both helplines, every language mode and address form.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fallbackReply, safeguardStayLine } from "../server/brain/say.js";
import { floorViolations } from "../server/director/safety.js";
import { initLessonState, step } from "../server/director/state.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const K = kit();
function episode(ctx) {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx, seed: 5, now: 0 }), { event: "start", kit: K, now: 0 });
  r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence", { flags: { distress: true, distressKind: "self_harm" } }), now: 10_000 });
  const first = r.state;
  r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), now: 20_000 });
  return { first, stay: r.state, stayMove: r.move };
}

test("the stay turn's fallback is not the first turn's line, and names both helplines", () => {
  for (const lang of ["english", "hinglish", "hindi"]) for (const address of ["tum", "aap"]) {
    const { first, stay, stayMove } = episode({ ...CTX, lang, address });
    assert.equal(first.lastMove.kind, "safeguard");
    assert.equal(stayMove.kind, "safeguard", "the second turn stays with the child");
    const a = fallbackReply(first, null), b = fallbackReply(stay, null);
    assert.notEqual(a, b, `${lang}/${address}: the same fixed line twice`);
    assert.equal(b, safeguardStayLine({ lang, address }));
    for (const n of ["1098", "14416"]) assert.ok(b.includes(n), `${lang}/${address}: ${n}`);
    assert.deepEqual(floorViolations(b, { requireHelpline: true }), [], `${lang}/${address}`);
  }
});

test("an aap child hears aap forms on the stay line; a tum child never does", () => {
  assert.match(safeguardStayLine({ lang: "hinglish", address: "aap" }), /sakte hain\./);
  assert.doesNotMatch(safeguardStayLine({ lang: "hinglish", address: "tum" }), /sakte hain\./);
  assert.match(safeguardStayLine({ lang: "hindi", address: "aap" }), /सकते हैं।$/);
});
