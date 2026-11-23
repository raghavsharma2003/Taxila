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

describe("B1: the Hindi switch line only where a form exists; never the same question sentence twice running", () => {
  test("hindiPromiseNoForm and reaskSameAfterHelp are gated", () => {
    for (const k of ["hindiPromiseNoForm", "reaskSameAfterHelp"]) { assert.ok(PREDICATES[k], k); assert.ok(!PENDING.has(k), k); }
  });
  test("hindiPromiseNoForm reads the order's rows (c4 offtopic 32; c5-t01 steady 38, stuck 8, offtopic 32, steering 8; c5-t03 steady 36, stuck 8, steering 8; c6, c6-ch07, c4-ch01 all four)", () => {
    const want = [["offtopic", "c4", 32], ["steady", "c5t01", 38], ["stuck", "c5t01", 8], ["offtopic", "c5t01", 32], ["steering", "c5t01", 8],
      ["steady", "c5t03", 36], ["stuck", "c5t03", 8], ["steering", "c5t03", 8]];
    for (const [p, t, n] of want) assert.ok(flagged(p, t, "hindiPromiseNoForm").has(n), `${p} ${t} ${n}`);
    for (const t of ["c6", "c6ch07", "c4ch01"]) for (const p of ["steady", "stuck", "offtopic", "steering"]) assert.equal(flagged(p, t, "hindiPromiseNoForm").size, 1, `${p} ${t}`);
  });
  test("reaskSameAfterHelp reads stuck 6 -> 8 in c5-t01, c5-t02, c5-t03, c6, c6-ch07 and steering 6 -> 8 in c5-t03, c6-ch07", () => {
    for (const t of ["c5t01", "c5t02", "c5t03", "c6", "c6ch07"]) assert.ok(flagged("stuck", t, "reaskSameAfterHelp").has(8), `stuck ${t}`);
    for (const t of ["c5t03", "c6ch07"]) assert.ok(flagged("steering", t, "reaskSameAfterHelp").has(8), `steering ${t}`);
  });
  test("reaskSameAfterHelp leaves a question with no other authored wording to reaskNoForm", () => {
    const script = { skills: [{ checks: [{ prompt: { hi: "Kitne kone hain?" } }] }] };
    const row = { who: "teacher", text: "Dhyaan se dekho. Kitne kone hain?" };
    assert.equal(PREDICATES.reaskSameAfterHelp([], row, 2, { script, o: {}, prevT: { who: "teacher", text: "Kitne kone hain?" } }), null);
    const s2 = { skills: [{ checks: [{ prompt: { hi: "Kitne kone hain?" }, reask: { hi: "Is shape mein kone kitne hain?" } }] }] };
    assert.ok(PREDICATES.reaskSameAfterHelp([], row, 2, { script: s2, o: {}, prevT: { who: "teacher", text: "Kitne kone hain?" } }));
  });
  test("pickHelp: a Hindi request at a card with a form is a Hindi request; without one, a help request (no switch line, never a key)", async () => {
    const { pickHelp } = await import("../server/director/help.js");
    const script = lesson("stuck", "c5t01").script;
    const sk = script.skills[0], e = sk.explain.find((b) => b.ask?.prompt);
    const part = `${sk.skillId}:${e.id}:card`;
    const d = pickHelp({ script, part, request: "hindi", said: [] });
    assert.equal(d.request, "give_up");
    assert.ok(d.hindiAsked && !d.hindiForm);
    const s2 = structuredClone(script);
    s2.skills[0].explain.find((b) => b.id === e.id).ask.hindi = { hi: "Seedhi boli mein: pehla mark kaunsa hai?", en: "Plainly: which is the first mark?" };
    const d2 = pickHelp({ script: s2, part, request: "hindi", said: [] });
    assert.equal(d2.request, "hindi");
    assert.equal(d2.card, "hindiForm");
  });
});

describe("B2 (main's addition): a card marked noView never has its board's second view drawn", () => {
  const T = "c4-maths-ch05-t01";
  const picture = { event: "turn", text: "picture dikhao", cls: { outcome: "no_evidence", request: { type: "visual" } } };
  const atCard = (S, e, shown = null) => ({ turn: 9, ctx: { lang: "hinglish" }, lastMove: { kind: "explain" }, lastUi: { status: "your_turn", ask: { itemId: `script:${S}:ask:${e}` } }, ...(shown ? { picShown: shown } : {}) });
  test("noView: the pictureBoard if any, then nothing left to draw (help) — never the view; without the flag, the view as before", async () => {
    const { setScriptForTest } = await import("../server/director/script.js");
    const { pictureKindOf } = await import("../server/director/state.js");
    const { kitFromFile } = await import("../server/content/kits.js");
    const { getTopic } = await import("../server/content/curriculum.js");
    const kit = kitFromFile(getTopic(T));
    const pic = { ...picture, kit };
    const S = `${T}-s1`;
    try {
      assert.equal(pictureKindOf(atCard(S, "e2"), pic).kind, "view", "the fixture card's board has a second view");
      const s = JSON.parse(readFileSync(join(ROOT, "data/lesson-scripts", `${T}.json`), "utf8"));
      const e2 = s.skills[0].explain.find((b) => b.id === "e2");
      e2.ask.noView = true;
      setScriptForTest(T, s);
      assert.equal(pictureKindOf(atCard(S, "e2"), pic).kind, "hint", "no pictureBoard: straight to the nothing-left path");
      e2.ask.pictureBoard = { template: "fraction-parts@1", params: { parts: 4, shade: 1, whole: "circle" } };
      e2.ask.pictureCaption = { hi: "Yeh ek gol roti hai, chaar barabar tukdon mein.", en: "This is a round roti in four equal pieces." };
      setScriptForTest(T, s);
      const k1 = pictureKindOf(atCard(S, "e2"), pic);
      assert.equal(k1.kind, "pictureBoard");
      assert.equal(pictureKindOf(atCard(S, "e2", { [k1.part.id]: ["pictureBoard"] }), pic).kind, "hint", "after the pictureBoard: never the view");
    } finally { setScriptForTest(undefined); }
  });
});

describe("B3: the card's own other reason as the second help; a problem restated is no help at the child's own step; a mix-up met again gets the hint first", () => {
  test("keyBeforeHint and helpNotOwn are gated", () => {
    for (const k of ["keyBeforeHint", "helpNotOwn"]) { assert.ok(PREDICATES[k], k); assert.ok(!PENDING.has(k), k); }
  });
  test("keyBeforeHint reads c6-ch07 steady 48 and offtopic 62 (the key at a mix-up met again, its hint unsaid)", () => {
    assert.ok(flagged("steady", "c6ch07", "keyBeforeHint").has(48));
    assert.ok(flagged("offtopic", "c6ch07", "keyBeforeHint").has(62));
  });
  test("helpNotOwn reads a request at a marked card answered by the point's other wording (c5-t03 steering 16; c4-ch01 stuck 62, offtopic 56)", () => {
    assert.ok(flagged("steering", "c5t03", "helpNotOwn").has(16));
    assert.ok(flagged("stuck", "c4ch01", "helpNotOwn").has(62));
    assert.ok(flagged("offtopic", "c4ch01", "helpNotOwn").has(56));
  });
  test("pickHelp: at a marked card a give-up's second help is its whyAlt, before the point's other wording", async () => {
    const { pickHelp, addSaid } = await import("../server/director/help.js");
    const script = structuredClone(lesson("steering", "c5t03").script);
    const sk = script.skills.find((k) => (k.explain ?? []).some((b) => b.ask?.whyAltAsHelp && b.ask?.simpler && b.ask?.whyAlt));
    const b = sk.explain.find((x) => x.ask?.whyAltAsHelp && x.ask?.simpler && x.ask?.whyAlt);
    const part = `${sk.skillId}:${b.id}:card`;
    const said = addSaid([], typeof b.ask.simpler === "string" ? b.ask.simpler : b.ask.simpler.hi, 1);
    for (const request of ["give_up", "clarify", "hint"]) assert.equal(pickHelp({ script, part, request, said }).rung?.field, "whyAltHelp", request);
  });
  test("ladderOf: the child's own step has no problemAlt rung", async () => {
    const { ladderSpec, helpPart } = await import("../server/director/help.js");
    const script = lesson("stuck", "c4").script;
    const sk = script.skills.find((k) => k.workedExample?.yourStep && k.workedExample?.problemAlt);
    const fields = ladderSpec(script, helpPart(script, `${sk.skillId}:worked:yourStep`)).map((r) => r.path);
    assert.ok(!fields.some((p) => /problemAlt$/.test(p)), fields.join(","));
  });
  test("pickHelp: a card's own hint one of whose sentences reads near one said for another card is still the hint, never the key", async () => {
    const { pickHelp, addSaid } = await import("../server/director/help.js");
    const script = lesson("steady", "c6ch07").script;
    const sk = script.skills[1], c = sk.checks.find((x) => x.id === "c2");
    const near = sk.remediation.find((r) => r.then?.simpler)?.then.simpler;
    const said = addSaid([], typeof near === "string" ? near : near.hi, 1);
    const d = pickHelp({ script, part: `${sk.skillId}:check:c2`, request: "hint", said, misses: 1 });
    assert.equal(d.card, "keep");
    assert.equal(d.rung?.path, `skills[1].checks[${sk.checks.indexOf(c)}].simpler`);
  });
});
