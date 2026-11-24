// to-brain 053, builder B (parts C, D, E, F): docs/patches/to-brain/053-director34-second-picture-several-wrong-answers-walk-paths.md.
// Each new predicate is read on its director34 rows (tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-24-director34/, the
// run's own script snapshots) before it reads the dry matrix. A change to how a child's answer is read is tested with a stubbed model that
// disagrees (RULES d35): the goodbye's reply (C3) and the named wrong answers (F).
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { lessonFlags, PREDICATES, PENDING } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const RUN = join(ROOT, "tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-24-director34");
const lesson = (name) => { const d = JSON.parse(readFileSync(join(RUN, `${name}.json`), "utf8")); return { rows: d.director, script: JSON.parse(readFileSync(join(RUN, "scripts", `${d.topicId}.json`), "utf8")) }; };
const flagged = (name, pred) => new Set(lessonFlags(lesson(name)).filter((f) => f.predicate === pred).map((f) => f.row));
const fixture = (t) => JSON.parse(readFileSync(join(ROOT, "tests/fixtures/scripts-053b", `${t}.json`), "utf8"));

describe("C1: no code lead-in between a right verdict and its reason", () => {
  test("leadInAfterVerdict is gated and reads director34's rows (c6 steady 74, stuck 14, 38, 76; 86 in the run)", () => {
    assert.ok(PREDICATES.leadInAfterVerdict && !PENDING.has("leadInAfterVerdict"));
    assert.ok(flagged("steady-c6-ch06-t01", "leadInAfterVerdict").has(74));
    for (const r of [14, 38, 76]) assert.ok(flagged("stuck-c6-ch06-t01", "leadInAfterVerdict").has(r), String(r));
  });
  test("rightWhyLead says no opener: ', kyunki', the colon, or the reason as its own sentence", async () => {
    const { rightWhyLead } = await import("../server/brain/say.js");
    for (let n = 0; n < 6; n++) for (const last of [0, 1, 2, null]) {
      const t = rightWhyLead("Haan, sahi hai", "4 gap hain", { whyJoint: { n, last }, dekhoN: 0 }).text;
      assert.doesNotMatch(t, /(?:Suno|Dekho),/, t);
      assert.match(t, /^Haan, sahi hai(?:, kyunki 4 gap hain|: 4 gap hain|\. 4 gap hain)$/, t);
    }
  });
  test("an opener authored inside a script's reason is the script's: not flagged", () => {
    const script = { skills: [{ checks: [{ why: { hi: "Dekho, teen hisse barabar hain.", en: "x" } }] }] };
    const rows = [{ who: "child", text: "3", read: "correct" }, { who: "teacher", text: "Haan, sahi hai. Dekho, teen hisse barabar hain." }];
    assert.equal(PREDICATES.leadInAfterVerdict({ rows }, rows[1], 1, { script }), null);
    assert.ok(PREDICATES.leadInAfterVerdict({ rows }, { who: "teacher", text: "Haan, sahi hai. Suno, teen hisse barabar hain." }, 1, { script }));
  });
});

describe("C2: a side-topic reply fits what the child said", () => {
  test("asideReplyKind is gated and reads director34 c5-t03 steady 48 and steering 42 ('Virat' to 'tab tumhare saath kaun tha?')", () => {
    assert.ok(PREDICATES.asideReplyKind && !PENDING.has("asideReplyKind"));
    assert.ok(flagged("steady-c5-ch02-t03", "asideReplyKind").has(48));
    assert.ok(flagged("steering-c5-ch02-t03", "asideReplyKind").has(42));
  });
  test("replyKindOf: the question decides; the child's words where it does not", async () => {
    const { replyKindOf } = await import("../server/brain/asideReplies.js");
    const K = (q, a) => replyKindOf(q, a);
    assert.equal(K("Sixer ki baat tumne ki thi: tab tumhare saath kaun tha?", "Virat"), "person");
    assert.equal(K("Tumhara favourite kaun hai?", "Dhoni"), "person");
    assert.equal(K("Cricket kab khela tha?", "kal shaam"), "whenWhere");
    assert.equal(K("Tum kahan khelte ho?", "park mein"), "whenWhere");
    assert.equal(K("Pichhli baar cricket mein kya hua tha?", "sixer maara"), "done");
    assert.equal(K("Cricket mein tumhe sabse achha kya lagta hai?", "batting"), "liking");
    assert.equal(K("Cricket mein tumhe sabse achha kya lagta hai?", "bhai ke saath khelna"), "person");
    assert.equal(K("Cricket ki baari aa gayi: uske baare mein thoda aur batao na?", "batting sabse achhi lagti hai"), "liking");
    assert.equal(K("Cricket ki baari aa gayi: uske baare mein thoda aur batao na?", "kal sixer maara"), "whenWhere");
    assert.equal(K("Cricket ki baari aa gayi: uske baare mein thoda aur batao na?", "Virat"), "person");
  });
  test("with the library as it is (no kind forms): the neutral forms — never a liking form to a person or a time", async () => {
    const { asideReplyLine } = await import("../server/brain/asideReplies.js");
    const a = asideReplyLine({ said: "Virat", topic: "Sixer", asked: "Toh poora jawab: 3/5 = 9/15. Sixer ki baat tumne ki thi: tab tumhare saath kaun tha?", words: ["virat"] });
    assert.equal(a.kind, "person");
    assert.doesNotMatch(a.line, /achh[aie] lag|pasand|favourite/i, a.line);
    assert.match(a.line, /Virat/, "the child's own word, in their case");
    const w = asideReplyLine({ said: "kal shaam ko", topic: "cricket", asked: "Cricket kab khela tha?", words: ["shaam"] });
    assert.equal(w.form, "plain", w.line);
    // (a favourite asked of a person keeps the favourite form: it fits)
    assert.match(asideReplyLine({ said: "Virat", topic: "cricket", asked: "Main AI hoon, meri koi pasand nahi hoti. Tumhara favourite kaun hai?" }).line, /favourite/);
    // (a liking asked and said: as before)
    assert.match(asideReplyLine({ said: "batting", topic: "cricket", asked: "Cricket mein tumhe sabse achha kya lagta hai?", words: ["batting"] }).line, /achha lagta/);
  });
  test("with `replyKinds` in the library (Learning 023 rule 7, main's schema; fixture): each kind gets its own", async () => {
    const { asideReplyLine, setReplyKindFormsForTest, asideReplyForms } = await import("../server/brain/asideReplies.js");
    const lib = fixture("aside-reply-kinds");
    setReplyKindFormsForTest(lib);
    try {
      const pick = (asked, said, words = []) => asideReplyLine({ said, topic: "cricket", asked, words });
      const p = pick("Tab tumhare saath kaun tha?", "Virat", ["virat"]);
      assert.equal(p.kind, "person"); assert.ok(lib.replyKinds.person.some((f) => p.line.startsWith(f.hi.split("{")[0])), p.line); assert.match(p.line, /Virat/);
      const d = pick("Pichhli baar cricket mein kya hua tha?", "sixer maara");
      assert.equal(d.kind, "done"); assert.ok(lib.replyKinds.done.some((f) => d.line.startsWith(f.hi.split("{")[0])), d.line);
      const l = pick("Cricket mein tumhe sabse achha kya lagta hai?", "batting", ["batting"]);
      assert.equal(l.kind, "liking"); assert.ok(lib.replyKinds.liking.some((f) => l.line.startsWith(f.hi.split("{")[0])), l.line);
      const t = pick("Cricket kab khela tha?", "kal shaam");
      assert.equal(t.kind, "whenWhere"); assert.ok(lib.replyKinds.whenWhere.some((f) => t.line === f.hi || t.line.startsWith(f.hi.split("{")[0])), t.line);
      // (the predicate reads the kind forms as reply frames)
      assert.ok(asideReplyForms().phrase.some((re) => re.test("Achha, kal shaam ki baat hai.")));
    } finally { setReplyKindFormsForTest(null); }
  });
});

describe("C3: the goodbye's reply hears the child (stubbed model: every graded reply wrong)", () => {
  const TOPIC = "c5-maths-ch02-t02";
  let realFetch, env0, mods;
  const CHILD = { id: "00000000-0000-0000-0000-00000000d35b", legal_mode: "M1", class_level: 5 };
  const LESSON = { id: "11111111-1111-1111-1111-11111111d35b", started_at: new Date(0).toISOString() };
  const brief = { firstName: "Riya", classLevel: 5, ageBand: "10-15", languagePref: "hinglish", interests: ["cricket"], recentWins: [], activeMisconceptions: [], memoryCallbacks: [],
    vibe: { pace: "medium", verbosity: "brief", humour: "medium" }, relationshipStage: "first_meeting (0 sessions together)" };
  before(async () => {
    realFetch = globalThis.fetch; env0 = { ...process.env };
    process.env.AZURE_OPENAI_ENDPOINT = "https://example.test/openai/v1";
    process.env.AZURE_OPENAI_API_KEY = "test-key";
    delete process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_L2;
    mods = {
      state: await import("../server/director/state.js"), script: await import("../server/director/script.js"), kits: await import("../server/content/kits.js"),
      cur: await import("../server/content/curriculum.js"), turn: await import("../server/brain/turn.js"), cls: await import("../server/director/classify.js"),
      fuse: await import("../server/comprehension/fuse.js"), items: await import("../server/director/items.js"),
    };
    mods.script.setScriptForTest(TOPIC, JSON.parse(readFileSync(join(ROOT, "tests/fixtures/scripts-052e", `${TOPIC}.json`), "utf8")));
    globalThis.fetch = async (url, init) => {
      const body = JSON.parse(init.body);
      const name = body.response_format?.json_schema?.name ?? "";
      const out = name === "classify_teachback" ? { covered: [], misconceptions: ["none"], confidence: 0.9 }
        : name.startsWith("classify_") && name !== "classify_none" ? { match: "other_wrong", confidence: 0.9 } : { distress: false };
      const flags = { off_topic: false, distress: false, asks_for_answer: false, wants_to_stop: false };
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ ...flags, ...out }) }, finish_reason: "stop" }], usage: { prompt_tokens: 10, completion_tokens: 5 } }), { status: 200 });
    };
  });
  after(() => {
    globalThis.fetch = realFetch; mods?.script.setScriptForTest(undefined);
    for (const k of Object.keys(process.env)) if (!(k in env0)) delete process.env[k];
    Object.assign(process.env, env0);
  });
  const toClosing = (kit) => {
    const { step, initLessonState } = mods.state;
    const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a pretend little friend" }, ageBand: "10-15", lang: "hinglish",
      interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: kit.title ?? kit.topicId, classLevel: 5, sessionId: LESSON.id, lessonKey: "d35-053b-wrap", teacher: "director" };
    let r = step(initLessonState({ topicId: TOPIC, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
    for (let i = 0; i < 300 && !(r.state.phase === "teachback" && r.state.teachbackAsked); i++) {
      const it = r.state.activeItemId ? mods.items.findItem(r.state, kit, r.state.activeItemId) : null;
      r = step(r.state, { event: "turn", kit, cls: { outcome: it ? "correct" : "no_evidence", confidence: 0.9, flags: {} }, text: it ? String(it.answer) : "haan", now: (r.state.turn + 1) * 20_000 });
    }
    return r.state;
  };
  const turn = async (s, kit, text) => {
    const s0 = { ...s, brief, kitVerified: kit.verified, kitHash: kit.hash, mode: "text", recent: [...(s.recent ?? []), { who: "child", text }] };
    const activeItem = s0.activeItemId ? mods.items.findItem(s0, kit, s0.activeItemId) : null;
    const target = mods.cls.targetFor(s0, kit, activeItem);
    const cls = await mods.cls.classify({ target, childText: text, lang: "hinglish", classLevel: 5, typed: true });
    const p = await mods.turn.planTurn(s0, cls, { kit, child: CHILD, lesson: LESSON, activeItem, moduleOnly: false, moduleEvents: [], answer: text, childText: text, leaked: false,
      live: Promise.resolve({ state: mods.fuse.newLearnerState({ childId: CHILD.id, classLevel: 5 }), maxSeq: 0 }), carried: [], now: (s.turn + 1) * 20_000 });
    const line = [...(p.r.state.lastMove?.rendered ?? []), p.r.state.lastMove?.wrapAsk].filter(Boolean).join(" ");
    return { p, st: { ...p.r.state, recent: [...s0.recent, ...(line ? [{ who: "teacher", text: line }] : [])].slice(-12) } };
  };
  test("four replies, each its fitting form; 'Hmm' never opens the reply to a child who liked it", async () => {
    const kit = mods.kits.kitFromFile(mods.cur.getTopic(TOPIC));
    const s = toClosing(kit);
    const a = await turn(s, kit, String(s.teachbackGrade.key));
    assert.ok(a.st.wrapTwo, "the wrap's first turn asked its question");
    const { ackFits } = mods.state;
    const seen = {};
    for (const said of ["thoda mushkil tha", "aasaan laga", "maza aaya", "sawaal achhe the"]) {
      const w = await turn(a.st, kit, said);
      assert.equal(w.st.lastMove?.wrapPart, 2, said);
      assert.equal(w.p.cls.outcome, "no_evidence", `${said}: not graded`);
      const ack = String(w.st.lastMove?.wrapAck ?? "");
      seen[said] = (w.st.lastMove?.rendered ?? []).join(" ");
      assert.ok(ack, `${said}: an acknowledgement`);
      assert.ok(ackFits(ack, said), `${said}: "${ack}" fits`);
      if (said !== "thoda mushkil tha") assert.doesNotMatch(ack, /^hmm/i, `${said}: "${ack}"`);
      else assert.doesNotMatch(ack, /shukriya|thank/i, `${said}: a hard lesson is not thanked`);
    }
    if (process.env.D35_SHOW) console.log(JSON.stringify(seen, null, 1));
  });
  test("ackFitting: a liked lesson with only notes and a Hmm form gets the Hmm form without its Hmm", () => {
    const { ackFitting } = mods.state;
    const acks = ["Achha, sun liya maine.", "Theek hai, samajh gayi.", "Hmm, batane ke liye shukriya."];
    assert.deepEqual(ackFitting(acks, "aasaan laga"), ["Batane ke liye shukriya."]);
    assert.deepEqual(ackFitting(acks, "thoda mushkil tha"), ["Achha, sun liya maine.", "Theek hai, samajh gayi."]);
  });
});

describe("F: a card may name more than one wrong answer (fixture: c5-t03 s2 c1 and c3 with `wrongAnswers`)", () => {
  const T = "c5-maths-ch02-t03";
  const S2 = `${T}-s2`;
  const sk = () => fixture(T).skills.find((k) => k.skillId === S2);
  const card = async (id) => { const { scriptCheckItem } = await import("../server/director/script.js"); return scriptCheckItem(S2, sk().checks.find((c) => c.id === id)); };
  const fast = async (item, say) => { const { classifyFast } = await import("../server/director/classify.js"); const r = classifyFast({ target: { mode: "item", item, key: item.answer, also: item.acceptable }, childText: say, typed: false, asrConfidence: 0.95 }); return r?.result ?? null; };
  test("the reader: a card carries its named answers; the validator refuses more than three, a missing reason, an answer that is the key", async () => {
    const it = await card("c3");
    assert.equal(it.scriptCheck.wrongAnswers.length, 1);
    assert.deepEqual(it.scriptCheck.wrongAnswers[0].answer, ["9/12", "teesra", "teesra wala"]);
    const { validateSkillScriptV2, scriptCheckItem } = await import("../server/director/script.js");
    const kit = { skills: [{ id: S2 }], misconceptions: [{ id: "c5-maths-ch02-t03-m-one-part-only" }, { id: "c5-maths-ch02-t03-m-add-same" }], items: [] };
    const base = sk();
    const errsOf = (wa) => { const s = structuredClone(base); s.checks[2].wrongAnswers = wa; return validateSkillScriptV2(s, kit, { classLevel: 5 }).filter((e) => /wrongAnswers/.test(e)); };
    assert.deepEqual(errsOf(base.checks[2].wrongAnswers), []);
    const w = base.checks[2].wrongAnswers[0];
    assert.ok(errsOf([w, w, w, w]).some((e) => /at most three/.test(e)));
    assert.ok(errsOf([{ answer: "9/12" }]).some((e) => /why/.test(e)));
    assert.ok(errsOf([{ answer: "3/12", why: w.why }]).some((e) => /is the key/.test(e)));
    // (a card with none: read as before — no field carried)
    const { wrongAnswers, ...plain } = base.checks[2]; void wrongAnswers;
    assert.equal(scriptCheckItem(S2, plain).scriptCheck.wrongAnswers, undefined);
  });
  test("the grader: each named answer is a misconception, recorded by which one; wrongIfMis stays the first; unnamed answers as before", async () => {
    const c3 = await card("c3"), c1 = await card("c1");
    const got = async (it, say) => { const r = await fast(it, say); return r ? [r.outcome, r.wrongNamed ?? null, r.misconceptionId ?? null] : "model"; };
    assert.deepEqual(await got(c3, "9/12"), ["misconception", 1, null]);
    assert.deepEqual(await got(c3, "teesra wala"), ["misconception", 1, null]);
    assert.deepEqual(await got(c3, "1/12"), ["misconception", 0, "c5-maths-ch02-t03-m-one-part-only"]);
    assert.deepEqual(await got(c3, "pehla"), ["misconception", 0, "c5-maths-ch02-t03-m-one-part-only"]);
    assert.deepEqual(await got(c3, "3/12"), ["correct", null, null]);
    assert.deepEqual(await got(c3, "5/12"), ["incorrect", null, null]);
    assert.deepEqual(await got(c1, "teen"), ["misconception", 1, null]);
    assert.deepEqual(await got(c1, "12"), ["misconception", 2, null]);
    assert.deepEqual(await got(c1, "1"), ["misconception", 0, "c5-maths-ch02-t03-m-one-part-only"]);
    // (no wrongAnswers: no wrongNamed in the record at all — wrongIfMis and whyAlt work unchanged)
    const { scriptCheckItem } = await import("../server/director/script.js");
    const { wrongAnswers, ...plain } = sk().checks[2]; void wrongAnswers;
    const r = await fast(scriptCheckItem(S2, plain), "1/12");
    assert.equal(r.outcome, "misconception"); assert.equal(r.wrongListed, true); assert.ok(!("wrongNamed" in r));
    assert.equal((await fast(scriptCheckItem(S2, plain), "9/12")).outcome, "incorrect");
  });
  test("a stubbed model that disagrees (every reading 'correct') changes nothing code reads: the named answers stay misconceptions", async () => {
    const realFetch = globalThis.fetch, env0 = { ...process.env };
    process.env.AZURE_OPENAI_ENDPOINT = "https://example.test/openai/v1"; process.env.AZURE_OPENAI_API_KEY = "test-key";
    let calls = 0;
    globalThis.fetch = async (url, init) => {
      calls++;
      const name = JSON.parse(init.body).response_format?.json_schema?.name ?? "";
      const out = name.startsWith("classify_") ? { match: "correct", confidence: 0.95 } : { distress: false };
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ off_topic: false, distress: false, asks_for_answer: false, wants_to_stop: false, ...out }) }, finish_reason: "stop" }], usage: { prompt_tokens: 1, completion_tokens: 1 } }), { status: 200 });
    };
    try {
      const { classify } = await import("../server/director/classify.js");
      const c3 = await card("c3");
      const target = { mode: "item", item: c3, key: c3.answer, also: c3.acceptable, misconceptions: [], expectations: [] };
      for (const [say, n] of [["9/12", 1], ["teesra wala", 1], ["1/12", 0], ["mujhe lagta hai 9/12", 1]]) {
        const r = await classify({ target, childText: say, lang: "hinglish", classLevel: 5, typed: true });
        assert.equal(r.outcome, "misconception", say); assert.equal(r.wrongNamed, n, say);
      }
      assert.equal((await classify({ target, childText: "5/12", lang: "hinglish", classLevel: 5, typed: true })).outcome, "incorrect", "an unnamed answer-shaped reply: wrong in code");
      if (process.env.D35_SHOW) console.log("model calls", calls);
    } finally {
      globalThis.fetch = realFetch;
      for (const k of Object.keys(process.env)) if (!(k in env0)) delete process.env[k];
      Object.assign(process.env, env0);
    }
  });
  test("help: each named answer's reason once, as the first rung, to the child who gave it; then the card's simpler; then the key", async () => {
    const { pickHelp, addSaid, ownReasonFits } = await import("../server/director/help.js");
    const script = fixture(T);
    const part = `${S2}:check:c3`;
    const n1 = { outcome: "misconception", misconceptionId: null, wrongListed: true, wrongNamed: 1 };
    const n0 = { outcome: "misconception", misconceptionId: "c5-maths-ch02-t03-m-one-part-only", wrongListed: true, wrongNamed: 0 };
    const other = { outcome: "incorrect", misconceptionId: null, wrongListed: false };
    const d1 = pickHelp({ script, part, request: "hint", said: [], last: n1 });
    assert.equal(d1.rung.field, "whyAltHelp"); assert.match(d1.rung.path, /checks\[2\]\.wrongAnswers\[0\]\.why$/);
    const said = addSaid([], d1.rung.text);
    const d2 = pickHelp({ script, part, request: "hint", said, last: n1 });
    assert.match(d2.rung.path, /checks\[2\]\.simpler$/, "said once: then the card's simpler");
    // (the card's own named answer: its whyAlt, never the other answer's reason)
    const d0 = pickHelp({ script, part, request: "hint", said: [], last: n0 });
    assert.match(d0.rung.path, /checks\[2\]\.whyAlt$/);
    assert.equal(ownReasonFits(sk().checks[2], n1), false, "the whyAlt does not fit another named answer");
    // (an answer no reason names: the simpler first, as now)
    assert.match(pickHelp({ script, part, request: "hint", said: [], last: other }).rung.path, /checks\[2\]\.simpler$/);
  });
  test("the walk: another named answer gets its reason, not the card's remediation; the ladder runs per answer to the key", async () => {
    const { initLessonState, step } = await import("../server/director/state.js");
    const { setScriptForTest } = await import("../server/director/script.js");
    const { kitFromFile } = await import("../server/content/kits.js");
    const { getTopic } = await import("../server/content/curriculum.js");
    const { findItem } = await import("../server/director/items.js");
    setScriptForTest(T, fixture(T));
    try {
      const kit = kitFromFile(getTopic(T));
      const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "x" }, ageBand: "10-15", lang: "hinglish", interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: T, classLevel: 5, sessionId: "s", lessonKey: "d35-053b-f", teacher: "director" };
      let r = step(initLessonState({ topicId: T, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
      const want = `script:${S2}:c3`;
      for (let i = 0; i < 300 && r.state.activeItemId !== want; i++) {
        const it = r.state.activeItemId ? findItem(r.state, kit, r.state.activeItemId) : null;
        r = step(r.state, { event: "turn", kit, cls: { outcome: it ? "correct" : "no_evidence", confidence: 0.9, flags: {} }, text: it ? String(it.answer) : "haan", now: (r.state.turn + 1) * 20_000 });
      }
      assert.equal(r.state.activeItemId, want);
      const miss = (text) => { r = step(r.state, { event: "turn", kit, cls: { outcome: "misconception", misconceptionId: null, wrongListed: true, wrongNamed: 1, confidence: 1, flags: {}, source: "script_key" }, text, now: (r.state.turn + 1) * 20_000 }); return r.state.lastMove; };
      const m1 = miss("9/12");
      assert.notEqual(m1.scriptBeat?.kind, "remediation"); assert.equal(m1.help?.rung, "whyAltHelp"); assert.match(m1.simpler, /^9\/12 mein upar/);
      const m2 = miss("9/12");
      assert.equal(m2.help?.rung, "simpler");
      const m3 = miss("9/12");
      assert.equal(m3.help?.card, "close", "then the key");
    } finally { setScriptForTest(undefined); }
  });
  test("whyAltNoMiss reads each reason against its own answer", () => {
    const script = fixture(T);
    const reason = script.skills[1].checks[2].wrongAnswers[0].why.hi;
    const whyAlt = script.skills[1].checks[2].whyAlt.hi;
    const card3 = script.skills[1].checks[2].prompt.hi;
    const rows = (said, read, line) => [
      { who: "teacher", text: card3, card: card3, check: { itemId: `script:${S2}:c3` }, cell: { part: `${S2}:check:c3`, column: "card" } },
      { who: "child", text: said, read },
      { who: "teacher", text: `Nahi, yeh jawab nahi hai. ${line} ${card3}`, cell: { part: `${S2}:check:c3`, column: "misconception" }, seams: [{ left: "start", right: "missVerdict" }, { left: "missVerdict", right: "help" }, { left: "help", right: "card" }] },
    ];
    const read = (said, rd, line) => lessonFlags({ rows: rows(said, rd, line), script }).filter((f) => f.predicate === "whyAltNoMiss");
    assert.equal(read("9/12", "misconception", reason).length, 0, "its own answer");
    assert.equal(read("1/12", "misconception", reason).length, 1, "another named answer");
    assert.equal(read("1/12", "misconception", whyAlt).length, 0, "the whyAlt to its own answer");
    assert.equal(read("9/12", "misconception", whyAlt).length, 1, "the whyAlt to another named answer");
  });
});

describe("E: the judges' prompt is checked by code", () => {
  const PROMPTS = [join(ROOT, "evals/hybrid-side-by-side/results/2026-11-24-director34/judges/PROMPT.md"), "/home/user/taxila-int/evals/hybrid-side-by-side/results/2026-11-24-director34/judges/PROMPT.md"];
  test("quoted sentences: a quote found nowhere is reported, a script's own line, a slot form and a '…' quote are found", async () => {
    const { checkPrompt } = await import("../scripts/judge-prompt-check.mjs");
    const md = 'J7: c6-ch07-t03\'s false sentence is replaced ("Hisse ek size ke karo: 1/3 = 4/12 aur 2/4 = 6/12. Toh 2/4 zyada hai") and "Haan, pehle tum try karo." and "Aaj ke liye itna hi, kal phir milte" and an English "the card that is said whole".';
    const scriptDirs = [join(RUN, "scripts")];
    const bad = checkPrompt(md, { scriptDirs }).map((x) => x.sentence);
    assert.deepEqual(bad, ["Toh 2/4 zyada hai", "Aaj ke liye itna hi, kal phir milte"]);
  });
  test("director34's prompt (where present): the J7 quote 'Toh 2/4 zyada hai' is reported", { skip: !PROMPTS.some((p) => existsSync(p)) && "no director34 PROMPT.md in this checkout" }, async () => {
    const { checkPrompt } = await import("../scripts/judge-prompt-check.mjs");
    const md = readFileSync(PROMPTS.find((p) => existsSync(p)), "utf8");
    const bad = checkPrompt(md, { scriptDirs: [join(RUN, "scripts")] }).map((x) => x.sentence);
    assert.ok(bad.includes("Toh 2/4 zyada hai"), JSON.stringify(bad));
  });
  test("--endings: the turn endings by seam kind, generated from a run", async () => {
    const { turnEndings } = await import("../scripts/judge-prompt-check.mjs");
    const e = turnEndings(RUN);
    const kinds = e.map((x) => x.kind);
    for (const k of ["card", "checkin", "yourTurn"]) assert.ok(kinds.includes(k), k);
    assert.ok(e.every((x) => x.n > 0 && typeof x.example === "string"));
  });
});

describe("D: the record", () => {
  test("a yes-or-no key said as its fact is recorded as a key (director34 c4-ch01-t02 stuck 42 was missVerdict)", async () => {
    const { seamPass } = await import("../server/brain/seams.js");
    const list = [{ part: "close", text: "Nahi, tile ka kona right angle hai; Sonu ki baat theek nahi thi." }, { part: "aside", text: "Yahan tak theek hai?" }];
    const st = { ctx: { lang: "hinglish" }, recent: [] };
    assert.equal(seamPass(list, { kit: null, state: st, info: { miss: true } }).seams[0].right, "missVerdict", "as before without the key fact");
    assert.equal(seamPass(list, { kit: null, state: st, info: { miss: true, keyFact: true } }).seams[0].right, "key");
  });
  test("the harness records the invitation as yourTurn and the own reason as whyAlt", () => {
    const src = readFileSync(join(ROOT, "evals/hybrid-side-by-side.mjs"), "utf8");
    assert.match(src, /const recordPart = \(pp, lm\) => \(pp\.kind === "yourTurn" \? "yourTurn" : pp\.part === "simpler" && lm\?\.help\?\.rung === "whyAltHelp" \? "whyAlt" : pp\.part\)/);
    assert.match(src, /const o = \{ part: recordPart\(pp, lmB\),/);
  });
  test("C2's re-read of d26's asideReplied: a word form to a person is the neutral form while the library has no person forms", () => {
    const rows = [{ who: "teacher", text: "Sixer ki baat tumne ki thi: tab tumhare saath kaun tha?" }, { who: "child", text: "Virat" },
      { who: "teacher", text: "Arre, Virat! Achha hua tumne bataya. Achha, ab padhai ki taraf mudte hain.", cell: { column: "aside_reply" } }];
    const ctx = { script: { skills: [] }, prevChild: "Virat", o: {} };
    assert.equal(PREDICATES.asideReplied({ rows }, rows[2], 2, ctx), null);
  });
});
