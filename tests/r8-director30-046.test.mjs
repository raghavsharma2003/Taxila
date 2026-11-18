// Brain 046 (docs/patches/to-brain/046-director30-cues-hindi-reasks.md, dc-r8-director30): each new or changed predicate pinned on the
// director30 rows the order lists (tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-18-director30; rows are 0-based indexes
// into a lesson's `director`), and each rule pinned from the order's sentences on small inline fragments. Learning 019 rewrites the pilot
// scripts and adds fields at the same time: nothing here pins a sentence of today's script.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { lessonFlags } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const RUN = join(ROOT, "tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-18-director30");
const TOPIC = { c4: "c4-maths-ch05-t01", c5t01: "c5-maths-ch02-t01", c5t02: "c5-maths-ch02-t02", c6: "c6-maths-ch06-t01" };
const FILE = { c4: "c4-ch05-t01", c5t01: "c5-ch02-t01", c5t02: "c5-ch02-t02", c6: "c6-ch06-t01" };
const cache = new Map();
const lesson = (persona, t) => {
  const k = `${persona}|${t}`;
  if (!cache.has(k)) {
    const j = JSON.parse(readFileSync(join(RUN, `${persona}-${FILE[t]}.json`), "utf8"));
    cache.set(k, { rows: j.director, script: JSON.parse(readFileSync(join(RUN, "scripts", `${TOPIC[t]}.json`), "utf8")) });
  }
  return cache.get(k);
};
const flagged = (persona, t, name) => new Set(lessonFlags(lesson(persona, t)).filter((f) => f.predicate === name).map((f) => f.row));

describe("Q1: a worked step is told only on its cue", () => {
  test("stepToldEarly reads the step told after a yes or an aside (c5-t01 stuck 22; c5-t02 stuck 22, offtopic 18; c6 stuck 22, offtopic 18)", () => {
    for (const [p, t, row] of [["stuck", "c5t01", 22], ["stuck", "c5t02", 22], ["offtopic", "c5t02", 18], ["stuck", "c6", 22], ["offtopic", "c6", 18]])
      assert.ok(flagged(p, t, "stepToldEarly").has(row), `${p} ${t} ${row}`);
  });
  test("stepToldEarly reads no step told after a wrong answer to it, nor at a second request with its simpler said", () => {
    const { rows, script } = lesson("stuck", "c5t01");
    // (row 22 told after "haan": the same row after a wrong answer, and after a second give-up, is the step's cue)
    for (const [intent, read, text] of [["miss", "incorrect", "1 km"], ["give_up", "no_evidence", "mujhe nahi pata"]]) {
      const rs = structuredClone(rows.slice(0, 23));
      rs[21] = { ...rs[21], intent, read, text };
      assert.ok(!lessonFlags({ rows: rs, script }).some((f) => f.predicate === "stepToldEarly" && f.row === 22), intent);
    }
  });
});

describe("Q3: an aside reply's turn", () => {
  test("seamJoints reads her line to an aside said again going into the live part with no joint (c5-t01 offtopic 58; c5-t02, c6 offtopic 36)", () => {
    for (const [t, row] of [["c5t01", 58], ["c5t02", 36], ["c6", 36]]) assert.ok(flagged("offtopic", t, "seamJoints").has(row), `${t} ${row}`);
  });
  test("an aside line into a point, a card or help takes afterAside; the Hindi switch read as her aside line takes none", async () => {
    const { seamJoint } = await import("../server/brain/seams.js");
    for (const k of ["point", "card", "help", "remediation", "bridge"]) assert.equal(seamJoint("aside", k), "afterAside", k);
  });
  test("replyCheckin is gated and reads c4 offtopic 46 (reply, bridge, point, check-in, the card dropped for a due return)", async () => {
    const { PENDING } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
    assert.ok(!PENDING.has("replyCheckin"));
    assert.ok(flagged("offtopic", "c4", "replyCheckin").has(46));
  });
  test("returnAlone accepts a return whose question ends the turn after a remediation said alone (c6 steering 50's rule), not after a verdict alone", () => {
    const { rows, script } = lesson("steering", "c6");
    const ret = (script.joints.asideReturn ?? []).map((f) => String(f?.hi ?? f).replace("{aside}", "cricket")).find((x) => !/\{/.test(x));
    assert.ok(ret, "the script has an asideReturn form");
    const rem = { who: "teacher", text: `16 m sahi nahi hai. Socho, ek cheenti kone se chalti hai aur saamne wale kone tak jaati hai. ${ret}`,
      seams: [{ left: "start", right: "missVerdict" }, { left: "missVerdict", right: "remediation" }, { left: "remediation", right: "return" }] };
    const at = (r) => lessonFlags({ rows: [...rows.slice(0, 49), r], script }).filter((f) => f.predicate === "returnAlone" && f.row === 49);
    assert.deepEqual(at(rem), []);
    const bare = { ...rem, text: `16 m sahi nahi hai. ${ret}`, seams: [{ left: "start", right: "missVerdict" }, { left: "missVerdict", right: "return" }] };
    assert.equal(at(bare).length, 1);
  });
});

describe("Q2: a request for Hindi gets Hindi", () => {
  // (a patched copy of the run's script: every card of the lesson given a `hindi` form, as Learning 019 writes them; the words are the test's)
  const withHindi = (script) => {
    const s = structuredClone(script);
    let n = 0;
    const add = (o) => { if (o?.prompt && !o.hindi) o.hindi = { hi: `Seedhi boli mein sawaal ${++n}: tum kya kahoge?`, en: `Plainly, question ${n}: what do you say?` }; };
    for (const sk of s.skills ?? []) { for (const b of sk.explain ?? []) add(b.ask); for (const c of sk.checks ?? []) add(c); for (const r of sk.remediation ?? []) add(r.then);
      if (sk.workedExample) { add(sk.workedExample.yourStep); for (const st of sk.workedExample.steps ?? []) add(st.ask); } }
    return s;
  };
  test("hindiSpentCold reads the \"nothing easier\" line said to a Hindi request at a card with a hindi form (c4, c5-t02, c6 offtopic 32)", () => {
    for (const t of ["c4", "c5t02", "c6"]) {
      const { rows, script } = lesson("offtopic", t);
      assert.ok(lessonFlags({ rows, script: withHindi(script) }).some((f) => f.predicate === "hindiSpentCold" && f.row === 32), t);
      // (today's script has no form: the fallback is counted apart, pending)
      assert.ok(!flagged("offtopic", t, "hindiSpentCold").has(32) && flagged("offtopic", t, "hindiSpentHole").has(32), `${t} hole`);
    }
  });
  test("pickHelp: the first request for Hindi at a card is its hindi form alone; the second, the card's unsaid help then the form; none, as before", async () => {
    const { pickHelp } = await import("../server/director/help.js");
    const { script } = lesson("offtopic", "c6");
    const s = withHindi(script);
    const sk = s.skills[0], b = sk.explain[0];
    const part = `${sk.skillId}:${b.id}:card`;
    const d1 = pickHelp({ script: s, part, request: "hindi", said: [] });
    assert.equal(d1.card, "hindiForm");
    assert.equal(d1.hindiForm, b.ask.hindi.hi);
    assert.equal(d1.rung.text, "", "no wording before the form the first time");
    assert.ok(!d1.joint, "never the nothing-easier line");
    const { addSaid } = await import("../server/director/help.js");
    const said = addSaid([], b.ask.hindi.hi, 1);
    const d2 = pickHelp({ script: s, part, request: "hindi", said });
    assert.equal(d2.card, "hindiForm");
    assert.ok(d2.hindiAgain && d2.rung.text.length > 0, "the card's unsaid help, then the form again");
    const d0 = pickHelp({ script, part, request: "hindi", said: [] });
    assert.notEqual(d0.card, "hindiForm", "no form: as before");
  });
  test("an asked worked step's hindi form is read from its ask; a script with none has a compile hole for every card and asked step", async () => {
    const { hindiFormOf, helpPart } = await import("../server/director/help.js");
    const { compileScript } = await import("../server/director/compile.js");
    const { script } = lesson("offtopic", "c6");
    const s = withHindi(script);
    const sk = s.skills[0];
    const k = (sk.workedExample.steps ?? []).findIndex((st) => st.ask?.prompt);
    assert.ok(k >= 0);
    assert.equal(hindiFormOf(s, helpPart(s, `${sk.skillId}:worked:step${k + 1}`)), sk.workedExample.steps[k].ask.hindi.hi);
    const holes = compileScript(script).holes.filter((h) => h.field === "hindi");
    assert.ok(holes.some((h) => h.path === `skills[0].workedExample.steps[${k}].ask.hindi`));
    assert.ok(holes.some((h) => /explain\[0\]\.ask\.hindi$/.test(h.path)) && holes.some((h) => /remediation\[0\]\.then\.hindi$/.test(h.path)));
    assert.deepEqual(compileScript(s).holes.filter((h) => h.field === "hindi"), []);
  });
});

describe("Q4: the verdict, point and card turn is 65 words", () => {
  test("vpcLong reads a verdict-point-card turn over 65 words with the full why where the card has a short one (c5-t02 stuck 74, offtopic 52)", () => {
    assert.ok(flagged("stuck", "c5t02", "vpcLong").has(74));
    assert.ok(flagged("offtopic", "c5t02", "vpcLong").has(52));
  });
  test("vpcBridge reads a skill's bridge riding in a verdict-point-card turn (c4 steady 42, stuck 64, steering 56)", () => {
    for (const [p, row] of [["steady", 42], ["stuck", 64], ["steering", 56]]) assert.ok(flagged(p, "c4", "vpcBridge").has(row), `${p} ${row}`);
  });
  test("both are gated", async () => {
    const { PENDING } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
    assert.ok(!PENDING.has("vpcLong") && !PENDING.has("vpcBridge"));
  });
});

describe("Q5: re-asks and the worked close", () => {
  test("reaskRunning (gated) reads the same re-ask two turns running on the order's rows", async () => {
    const { PENDING } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
    assert.ok(!PENDING.has("reaskRunning") && PENDING.has("repeatedAuthored"));
    for (const [p, t, row] of [["steady", "c5t01", 8], ["stuck", "c5t01", 62], ["stuck", "c5t01", 70], ["stuck", "c5t01", 72], ["offtopic", "c5t01", 22], ["offtopic", "c5t01", 62],
      ["steering", "c5t01", 10], ["steady", "c5t02", 90], ["steering", "c4", 14], ["steering", "c4", 16]]) assert.ok(flagged(p, t, "reaskRunning").has(row), `${p} ${t} ${row}`);
  });
  test("reaskFigure reads the short ask after help in another wording that names none of the card's things (c5-t02 steering 10: a pizza)", () => {
    assert.ok(flagged("steering", "c5t02", "reaskFigure").has(10));
  });
  test("another figure: by numbers, and by another wording that names none of the card's things; sharesThing reads lesson talk as no thing", async () => {
    const { otherFigureOf, sharesThing } = await import("../server/brain/seams.js");
    assert.equal(otherFigureOf("Ek roti ke 6 hisse socho.", "Is line par 4/9 kahaan aayega?"), true);
    assert.equal(otherFigureOf("Line par 4 gap chalo, 9 mein se.", "Is line par 4/9 kahaan aayega?"), false);
    assert.equal(sharesThing("Pizza party socho: jitne zyada dost, utne chhote slice.", "9 aur 11 barabar hisson mein kati do dor mein se kis dor ka hissa chhota hai?"), false);
    assert.equal(sharesThing("Dono dor ek jitni lambi hain.", "9 aur 11 barabar hisson mein kati do dor mein se kis dor ka hissa chhota hai?"), true);
  });
  test("workedSeam (gated) reads a worked close straight into the next card (c5-t01 steady 26, 56, stuck 34, offtopic 48, steering 36; c5-t02 steady 26, 64, 82, stuck 34, offtopic 72, steering 36)", () => {
    for (const [p, t, row] of [["steady", "c5t01", 26], ["steady", "c5t01", 56], ["stuck", "c5t01", 34], ["offtopic", "c5t01", 48], ["steering", "c5t01", 36],
      ["steady", "c5t02", 26], ["steady", "c5t02", 64], ["steady", "c5t02", 82], ["stuck", "c5t02", 34], ["offtopic", "c5t02", 72], ["steering", "c5t02", 36]]) assert.ok(flagged(p, t, "workedSeam").has(row), `${p} ${t} ${row}`);
  });
  test("afterWorked: code's three forms of six words or fewer, and a compile hole where a script has none", async () => {
    const { CODE_SEAM_FORMS } = await import("../server/brain/seams.js");
    const { helpJointHoles } = await import("../server/director/help.js");
    for (const l of ["hinglish", "english"]) { assert.equal(CODE_SEAM_FORMS.afterWorked[l].length, 3); for (const f of CODE_SEAM_FORMS.afterWorked[l]) assert.ok(f.split(/\s+/).length <= 6, f); }
    assert.ok(helpJointHoles({ joints: {} }).some((h) => h.joint === "afterWorked"));
    assert.ok(!helpJointHoles({ joints: { afterWorked: [{ hi: "Ab tumhari baari.", en: "Your turn." }] } }).some((h) => h.joint === "afterWorked"));
  });
});

describe("Q6: small", () => {
  test("captionPart (gated) reads another part's caption said on a picture by an identical board (c5-t01 offtopic 26; c4 steady 18)", async () => {
    const { PENDING } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
    assert.ok(!PENDING.has("captionPart"));
    assert.ok(flagged("offtopic", "c5t01", "captionPart").has(26));
    assert.ok(flagged("steady", "c4", "captionPart").has(18));
  });
  test("viewCaptionOf picks the caption of the part the picture is of, not the first object with the same board", async () => {
    const { viewCaptionOf } = await import("../server/brain/say.js");
    const { setScriptForTest } = await import("../server/director/script.js");
    const { kitFromFile } = await import("../server/content/kits.js");
    const { getTopic } = await import("../server/content/curriculum.js");
    const said = (x) => (x && typeof x === "object" ? x.hi : x);
    // (c5-t01 offtopic 26: a picture on rem[0]'s follow-up card; the script's e2 point has the identical board and comes first)
    {
      const { rows, script } = lesson("offtopic", "c5t01");
      const r = rows[26], sk = script.skills[0], then = sk.remediation[0].then;
      assert.equal(JSON.stringify(then.board), JSON.stringify(sk.explain[1].board), "the fixture's two boards are identical");
      setScriptForTest(TOPIC.c5t01, script);
      try {
        const kit = kitFromFile(getTopic(TOPIC.c5t01));
        const st = { heldUp: { board: then.board, unit: r.held.intent.unit }, lastMove: { cardBeat: { skillId: sk.skillId, beatId: `then:${sk.remediation[0].targets}`, kind: "check", board: then.board, ownBoard: true } } };
        assert.equal(viewCaptionOf(kit, st, "hinglish"), said(then.viewCaption).trim());
      } finally { setScriptForTest(undefined); }
    }
    // (c4 steady 18: a picture on e2's card, whose own board is the point's board)
    {
      const { script } = lesson("steady", "c4");
      const sk = script.skills[0], e2 = sk.explain[1];
      assert.equal(JSON.stringify(e2.ask.board), JSON.stringify(e2.board));
      setScriptForTest(TOPIC.c4, script);
      try {
        const kit = kitFromFile(getTopic(TOPIC.c4));
        const st = { heldUp: { board: e2.board, unit: `${sk.skillId}:e2` }, lastMove: { cardBeat: { skillId: sk.skillId, beatId: "e2", kind: "explain", board: e2.ask.board, ownBoard: true } } };
        assert.equal(viewCaptionOf(kit, st, "hinglish"), said(e2.ask.viewCaption).trim());
        // (no card live: the picture is of the held point, and says the point's caption)
        assert.equal(viewCaptionOf(kit, { heldUp: { board: e2.board, unit: `${sk.skillId}:e2` }, lastMove: { scriptBeat: { skillId: sk.skillId, beatId: "e2", kind: "explain", board: e2.board } } }, "hinglish"), said(e2.viewCaption).trim());
      } finally { setScriptForTest(undefined); }
    }
  });
  test("whyShortSet (gated) reads whyShort set where the full why was said (c5-t02 steady 50, 66, 92, 94, stuck 74, offtopic 52, 76)", () => {
    for (const [p, row] of [["steady", 50], ["steady", 66], ["steady", 92], ["steady", 94], ["stuck", 74], ["offtopic", 52], ["offtopic", 76]])
      assert.ok(flagged(p, "c5t02", "whyShortSet").has(row), `${p} ${row}`);
  });
  test("the harness marks whyShort from what brain/say.js said (guard.rightWhy), not by a substring of the reply", () => {
    const src = readFileSync(join(ROOT, "evals/hybrid-side-by-side.mjs"), "utf8");
    assert.match(src, /tGuard\?\.rightWhy === "short" \|\| \(tGuard\?\.rightWhy == null && next\.lastMove\?\.whyShort\)/);
    assert.ok(!/scriptWhyShortOf\(kit, it/.test(src));
  });
  test("cellMissing (gated) reads a teacher row with no cell after a child's line (c5-t01 and c5-t02 stuck 22, a \"haan\")", () => {
    assert.ok(flagged("stuck", "c5t01", "cellMissing").has(22));
    assert.ok(flagged("stuck", "c5t02", "cellMissing").has(22));
  });
  test("a plain \"haan\" at an asked step is recorded on the step's part with the column \"yes\"", async () => {
    const { cellAddressOf } = await import("../server/director/state.js");
    const prev = { lastMove: { stepAsk: { skillId: "x-s1", step: 0 } } };
    assert.equal(cellAddressOf(prev, { event: "turn", text: "haan", cls: { outcome: "no_evidence" } }), null, "help still reads no column");
    assert.deepEqual(cellAddressOf(prev, { event: "turn", text: "haan", cls: { outcome: "no_evidence" } }, "yes"), { part: "x-s1:worked:step1:ask", column: "yes" });
  });
  test("missAsVerdict (gated) reads the closing question's miss recorded as verdict (c5-t02 steady 98); the seam pass records it missVerdict", async () => {
    assert.ok(flagged("steady", "c5t02", "missAsVerdict").has(98));
    const { applySeams } = await import("../server/brain/seams.js");
    const list = [{ part: "close", text: "12/7 sahi nahi hai." }, { part: "simpler", text: "Dono mein 7 hisse liye gaye." }, { part: "body", text: "Kaunsa chhota hai?" }];
    const out = applySeams(list.map((p) => p.text).join(" "), list, { kit: null, state: {}, lang: "hinglish", info: { authoredEnd: true } });
    assert.equal(out.seams[0].right, "missVerdict");
    const right = [{ part: "close", text: "Bilkul sahi, kyunki 1/9 ki kami chhoti hai." }, { part: "body", text: "Ab ek sawaal aur." }];
    assert.equal(applySeams(right.map((p) => p.text).join(" "), right, { kit: null, state: {}, lang: "hinglish", info: { authoredEnd: true } }).seams[0].right, "verdict");
  });
  test("whyLeadRunning (gated) reads the same lead-in to the why in two verdicts running (\"Dekho,\": c4 offtopic 18, 28; c5-t01 offtopic 12; c5-t02 offtopic 14)", () => {
    for (const [t, row] of [["c4", 18], ["c4", 42], ["c5t01", 12], ["c5t02", 14]]) assert.ok(flagged("offtopic", t, "whyLeadRunning").has(row), `${t} ${row}`);
  });
});

describe("Q6: the why's lead-in rotates", () => {
  test("rightWhyLead never takes the form of the verdict before, and the colon never follows \"Sahi jawab\"", async () => {
    const { rightWhyLead } = await import("../server/brain/say.js");
    for (let n = 0; n < 6; n++) for (const last of [0, 1, 2]) {
      const st = { ctx: { topicId: "t" }, recent: [], whyJoint: { last, n } };
      assert.notEqual(rightWhyLead("Bilkul sahi", "3 gap", st).k, last);
      const k = rightWhyLead("Sahi jawab", "3 gap", st).k;
      assert.notEqual(k, last); assert.notEqual(k, 2);
    }
  });
});

describe("Q5's leftover: a worked close does not say a why her turn before said", () => {
  test("whyRepeated reads c5-t02 steady 82's close why against row 80's told step; not c5-t02 steady 64's; and the close says no why there", async () => {
    const { whyRepeated } = await import("../server/director/state.js");
    const { setScriptForTest } = await import("../server/director/script.js");
    const { kitFromFile } = await import("../server/content/kits.js");
    const { getTopic } = await import("../server/content/curriculum.js");
    const { rows, script } = lesson("steady", "c5t02");
    setScriptForTest(TOPIC.c5t02, script);
    try {
      const kit = kitFromFile(getTopic(TOPIC.c5t02));
      const whyOf = (n) => script.skills[n].workedExample.why.hi;
      const out = (why, her) => ({ move: { workedDone: { answer: "x", why } }, state: { ctx: { lang: "hinglish" }, recent: [{ who: "teacher", text: her }, { who: "child", text: "y" }] } });
      assert.equal(whyRepeated(out(whyOf(2), rows[80].text), kit), true, "c5-t02 steady 82");
      assert.equal(whyRepeated(out(whyOf(1), rows[62].text ?? ""), kit), false, "a close whose why the step turn did not say");
      assert.equal(whyRepeated(out(whyOf(1), `Haan. ${whyOf(1)}. Tumhari baari?`), kit), true, "the same authored text");
      assert.equal(whyRepeated(out("", rows[80].text), kit), false);
    } finally { setScriptForTest(undefined); }
  });
});

describe("d31: the t2 predicates know the wrap's acknowledgements", () => {
  test("every wrap.ack form of the live scripts and the two staged scripts is a wrap acknowledgement, never an aside one", async () => {
    const { T2, wrapAckIn } = await import("./fixtures/t2-predicates.mjs");
    // (dc-r8-director31 item 10: c5-maths-ch02-t03 went live as judged, beside the four pilots)
    const dirs = { "data/lesson-scripts": [...Object.values(TOPIC), "c5-maths-ch02-t03"], "data/lesson-scripts-staged": ["c4-maths-ch01-t02", "c6-maths-ch07-t01"] };
    let n = 0;
    for (const [d, ts] of Object.entries(dirs)) for (const t of ts) for (const f of JSON.parse(readFileSync(join(ROOT, d, `${t}.json`), "utf8")).wrap.ack) {
      const row = { text: `${f.hi} Aaj humne bahut kuch dekha.` };
      assert.equal(wrapAckIn(row), f.hi, `${t}: ${f.hi}`);
      assert.equal(T2.asideAck(row), null, `${t}: ${f.hi}`);
      n++;
    }
    assert.ok(n >= 21);
    assert.ok(T2.asideAck({ text: "Wah, mazedaar. Chalo aage." }), "an aside acknowledgement is still read");
  });
});
