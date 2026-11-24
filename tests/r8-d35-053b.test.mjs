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
  test("with kind forms in the library (Learning 023 rule 7, fixture): each kind gets its own", async () => {
    const { asideReplyLine, setReplyKindFormsForTest, asideReplyForms } = await import("../server/brain/asideReplies.js");
    const lib = fixture("aside-reply-kinds");
    setReplyKindFormsForTest(lib);
    try {
      const pick = (asked, said, words = []) => asideReplyLine({ said, topic: "cricket", asked, words });
      const p = pick("Tab tumhare saath kaun tha?", "Virat", ["virat"]);
      assert.equal(p.kind, "person"); assert.ok(lib.kinds.other.person.some((f) => p.line.startsWith(f.hi.split("{")[0])), p.line); assert.match(p.line, /Virat/);
      const d = pick("Pichhli baar cricket mein kya hua tha?", "sixer maara");
      assert.equal(d.kind, "done"); assert.ok(lib.kinds.other.done.some((f) => d.line.startsWith(f.hi.split("{")[0])), d.line);
      const l = pick("Cricket mein tumhe sabse achha kya lagta hai?", "batting", ["batting"]);
      assert.equal(l.kind, "liking"); assert.ok(lib.kinds.other.liking.some((f) => l.line.startsWith(f.hi.split("{")[0])), l.line);
      const t = pick("Cricket kab khela tha?", "kal shaam");
      assert.equal(t.kind, "whenWhere"); assert.ok(lib.kinds.other.whenWhere.some((f) => t.line === f.hi || t.line.startsWith(f.hi.split("{")[0])), t.line);
      // (the predicate reads the kind forms as reply frames)
      assert.ok(asideReplyForms().plain.includes(lib.kinds.other.whenWhere[0].hi));
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
