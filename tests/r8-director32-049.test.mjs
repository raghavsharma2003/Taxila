// Brain 049 (docs/patches/to-brain/049-director32-hindi-pictures-own-reason.md, dc-r8-director32): each new predicate pinned non-zero on the
// director32 rows the order lists (tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-23-director32; rows are 0-based indexes
// into a lesson's `director`), replayed with that run's own script snapshot, and each rule pinned from the order's sentences on an inline
// copy of a script that has the fields Learning 021 is writing (joints.noPicture, joints.yourTurn).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { lessonFlags, PENDING, PREDICATES } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const RUN = join(ROOT, "tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-23-director32");
const TOPIC = { c4: "c4-maths-ch05-t01", c5t01: "c5-maths-ch02-t01", c5t02: "c5-maths-ch02-t02", c5t03: "c5-maths-ch02-t03", c6: "c6-maths-ch06-t01",
  c4ch01: "c4-maths-ch01-t02", c6ch07: "c6-maths-ch07-t01" };
const cache = new Map();
export const lesson = (persona, t) => {
  const k = `${persona}|${t}`;
  if (!cache.has(k)) {
    const j = JSON.parse(readFileSync(join(RUN, `${persona}-${TOPIC[t].replace(/^c(\d)-maths-/, "c$1-")}.json`), "utf8"));
    cache.set(k, { rows: j.director, script: JSON.parse(readFileSync(join(RUN, "scripts", `${TOPIC[t]}.json`), "utf8")) });
  }
  return cache.get(k);
};
export const flagged = (persona, t, name, L = lesson(persona, t)) => new Set(lessonFlags(L).filter((f) => f.predicate === name).map((f) => f.row));
/** Learning 021's joints, inline: three noPicture forms and three yourTurn forms (the live scripts do not have them yet). */
export const JOINTS_021 = {
  noPicture: [{ hi: "Iski alag tasveer mere paas nahi hai, board wali hi dekhte hain.", en: "I don't have another picture of this; let's use the board." },
    { hi: "Is par aur tasveer nahi hai, isi board se sochte hain.", en: "There's no other picture for this; let's think with this board." },
    { hi: "Naya chitra nahi hai, par board par sab hai.", en: "No new picture, but it's all on the board." }],
  yourTurn: [{ hi: "Ab tum batao.", en: "Now you tell me." }, { hi: "Ab tumhari baari.", en: "Your turn now." }, { hi: "Chalo, ab tum socho.", en: "Go on, you think now." }],
};
export const with021 = (script) => ({ ...structuredClone(script), joints: { ...(script.joints ?? {}), ...structuredClone(JOINTS_021) } });

describe("B2: a picture request with nothing left to draw", () => {
  test("pictureKey, pictureGoneBeforeAsk and pictureNoLine are gated", () => {
    for (const k of ["pictureKey", "pictureGoneBeforeAsk", "pictureNoLine", "pictureSame"]) { assert.ok(PREDICATES[k], k); assert.ok(!PENDING.has(k), k); }
  });
  test("pictureKey reads director32 steering 16 in c5-t01, c5-t02, c6 (the key given at a picture request)", () => {
    for (const t of ["c5t01", "c5t02", "c6"]) assert.ok(flagged("steering", t, "pictureKey").has(16), t);
    for (const t of ["c4", "c5t03", "c6ch07"]) assert.equal(flagged("steering", t, "pictureKey").size, 0, t);
  });
  test("pictureGoneBeforeAsk reads director32 c6-ch07 steady 18 and stuck 18 (the scale replaced by the compare board before the question)", () => {
    assert.ok(flagged("steady", "c6ch07", "pictureGoneBeforeAsk").has(18));
    assert.ok(flagged("stuck", "c6ch07", "pictureGoneBeforeAsk").has(18));
  });
  test("pictureNoLine: nothing drawn, at a script with noPicture forms, and no form said", () => {
    const script = with021({});
    const ctx = { script, o: {} };
    const row = (text, picture = "none") => ({ who: "teacher", text, cell: { part: "x", column: "picture", picture } });
    assert.ok(PREDICATES.pictureNoLine([], row("Board par dekho. Kitne hisse hain?"), 1, ctx));
    assert.equal(PREDICATES.pictureNoLine([], row("Naya chitra nahi hai, par board par sab hai. Kitne hisse hain?"), 1, ctx), null);
    assert.equal(PREDICATES.pictureNoLine([], row("Board par dekho. Kitne hisse hain?"), 1, { script: {}, o: {} }), null, "until a script has them");
  });

  const S1 = () => lesson("steering", "c5t01").script;
  const PART = "c5-maths-ch02-t01-s1:rem:2:then";
  test("pickHelp: a picture request with the card's help spent is the noPicture line and the card kept — never the key", async () => {
    const { pickHelp, addSaid, ladderOf, helpPart } = await import("../server/director/help.js");
    const script = with021(S1());
    let said = [];
    for (const r of ladderOf(script, helpPart(script, PART))) said = addSaid(said, r.value.hi, 1);
    const d = pickHelp({ script, part: PART, request: "picture", said });
    assert.equal(d.card, "keep");
    assert.equal(d.key, null);
    assert.equal(d.rung, null);
    assert.ok(JOINTS_021.noPicture.some((f) => f.hi === d.pictureLine?.text), "one authored noPicture form");
    // (a give-up on the same spent card closes it with its key — the picture request's difference)
    assert.equal(pickHelp({ script, part: PART, request: "clarify", said }).card, "close");
  });
  test("pickHelp: with a hint left, the line then the hint; with no noPicture forms, the hint alone", async () => {
    const { pickHelp } = await import("../server/director/help.js");
    const d = pickHelp({ script: with021(S1()), part: PART, request: "picture", said: [] });
    assert.equal(d.card, "keep");
    assert.ok(d.rung?.text && d.pictureLine?.text);
    const d0 = pickHelp({ script: S1(), part: PART, request: "picture", said: [] });
    assert.ok(d0.rung?.text);
    assert.equal(d0.pictureLine, null);
  });
});
