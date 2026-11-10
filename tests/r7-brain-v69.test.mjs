// dc-r7-script-walk-v6-9 (main's director17 judgement): each fix a predicate pinned on director17's own rows (0-based rows of the run's
// .json), walked live through turn.js planTurn (tests/fixtures/replay.mjs) and textReply on the run's own scripts.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { runScriptOf, rowsOf } from "./fixtures/replay.mjs";
import { initLessonState, step } from "../server/director/state.js";
import { classifyFast, targetFor } from "../server/director/classify.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { planTurn } from "../server/brain/turn.js";
import { newLearnerState } from "../server/comprehension/fuse.js";
import { textReply, replyDeps } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { setScriptForTest } from "../server/director/script.js";
import { whiteboardIntentOf, heldUpOf } from "../server/brain/propose.js";
import { findItem } from "../server/director/items.js";
import { REQUEST_TABLE, responseShape } from "../server/director/requestTable.js";
import { picLine } from "../server/brain/say.js";

const RUN = "2026-11-10-director17";
const TOPIC = { c4: "c4-maths-ch05-t01", "c5-t01": "c5-maths-ch02-t01", "c5-t02": "c5-maths-ch02-t02", c6: "c6-maths-ch06-t01" };
const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();

/** Walk a director17 lesson live up to teacher row `upto` (0-based): each child row read as the run read it (classifyFast, else the
 *  run's recorded read), planned by turn.js planTurn, her line from textReply on the run's own words, and HER LIVE LINE kept in the
 *  history (never the recorded one), the held board carried as turn.js carries it (next.heldUp), A4's unsaid card as turn.js marks
 *  it. → [{ n, out, pl, held, up, kit, rows }] for every teacher row walked. */
export async function walk(persona, topic, upto) {
  const T = TOPIC[topic];
  const sc = runScriptOf(RUN, T); delete sc.recordedRun;
  setScriptForTest(T, sc);
  const KEEP = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT;
  const turns = [];
  try {
    const rows = rowsOf(RUN, persona, T);
    const kit = kitFromFile(getTopic(T)), classLevel = Number(/^c(\d)/.exec(T)[1]);
    const CHILD = { id: "00000000-0000-0000-0000-00000000aaaa", legal_mode: "M1", class_level: classLevel }, LESSON = { id: "11111111-1111-1111-1111-11111111aaaa", started_at: new Date(0).toISOString() };
    const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a pretend little friend" }, ageBand: classLevel <= 3 ? "6-9" : "10-15", lang: "hinglish",
      interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: kit.title ?? kit.topicId, classLevel, sessionId: LESSON.id, teacher: "director" };
    const brief = { firstName: "Riya", classLevel, ageBand: ctx.ageBand, languagePref: "hinglish", interests: ["cricket"], recentWins: [], activeMisconceptions: [], memoryCallbacks: [],
      vibe: { pace: "medium", verbosity: "brief", humour: "medium" }, relationshipStage: "first_meeting (0 sessions together)" };
    const r0 = step(initLessonState({ topicId: T, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
    let s = { ...r0.state, brief, kitVerified: kit.verified, kitHash: kit.hash, mode: "text", recent: [{ who: "teacher", text: rows[0].text }] };
    let live = { state: newLearnerState({ childId: CHILD.id, classLevel }), maxSeq: 0 };
    let up = null;
    for (let i = 1; i < Math.min(upto, rows.length); i += 2) {
      const text = rows[i].text;
      s = { ...s, seq: s.seq + 1, recent: [...s.recent, { who: "child", text }] };
      const item = s.activeItemId ? findItem(s, kit, s.activeItemId) : null;
      const fast = classifyFast({ target: targetFor(s, kit, item), childText: text, lang: "hinglish", classLevel, typed: true });
      const [o, rq] = String(rows[i].read).split(" · ");
      const c = fast.result ?? { outcome: o.trim(), confidence: 0.9, source: "replay", flags: { ...fast.flags }, ...(rq ? { request: { type: rq.trim() } } : {}) };
      const before = s;
      const p = await planTurn(s, c, { kit, child: CHILD, lesson: LESSON, activeItem: item, moduleOnly: false, moduleEvents: [], answer: text, childText: text, leaked: false, live: Promise.resolve(live), carried: [], now: (i + 1) * 20_000 });
      live = { state: p.learner.after, maxSeq: 0 };
      const state = { ...p.r.state, mode: "text" };
      const n = i + 1;
      replyDeps.chat = async () => ({ text: rows[n]?.text ?? "" });
      const out = await textReply({ instructions: instructionsFor(state, kit), state, kit, childText: text, history: [], ui: p.r.ui, module: null });
      const next = { ...state, heldUp: up };
      const a = whiteboardIntentOf({ lessonId: "L", turn: n, beat: { id: "visual", type: "explain" }, next, kit, item: next.lastMove?.itemId ? findItem(next, kit, next.lastMove.itemId) : null,
        line: { text: out.reply, ...(out.guard?.parts ? { parts: out.guard.parts } : {}) } });
      const held = a.intent.held ?? null;
      const pl = { row: n, child: text, cls: c, before, p, state };
      turns.push({ n, out, pl, held, up, kit, rows });
      if (held) up = heldUpOf(held);
      s = { ...state, heldUp: up, recent: [...(state.recent ?? []), { who: "teacher", text: out.reply }] };
      if (out.guard?.cardHeld && s.activeItemId) s.cardUnsaid = s.activeItemId;
      if (out.guard?.asideEnd) s.asideReplyDue = true;
    }
  } finally { replyDeps.chat = chat; setScriptForTest(); if (KEEP !== undefined) process.env.TAXILA_R7_SCRIPT = KEEP; }
  return turns;
}

describe("r7-brain-v69.test.mjs", () => {
  // N1: a turn with no unit part (an aside question or return, an acknowledgement, a break or stop menu, a goodbye) draws nothing new
  describe("N1: a turn with no unit part keeps the board up, no switch", () => {
    const ROWS = [["steady", "c4", 46], ["steady", "c4", 90], ["stuck", "c4", 76], ["offtopic", "c4", 68], ["steady", "c5-t01", 88], ["offtopic", "c5-t01", 70],
      ["steering", "c5-t01", 66], ["steady", "c5-t02", 86], ["steady", "c6", 82]];
    // (c6 steady 42, "woh wala ho gaya, aage chalo" with an aside pending, now moves on to its next card first — T1 — so it has a unit part)
    for (const [persona, topic, n] of ROWS) test(`${persona} ${topic} ${n}`, async () => {
      const turns = await walk(persona, topic, n);
      const t = turns.find((x) => x.n === n);
      assert.ok(t, `row ${n} walked`);
      if (!t.held) return; // (nothing held: nothing drawn)
      assert.ok(!t.held.switchTo, `no switch: ${JSON.stringify(t.held.switchTo?.unit)} | ${t.out.reply.slice(0, 100)}`);
      if (t.up?.board) assert.deepEqual(t.held.board, t.up.board, `the board up stays (${t.up.unit} → ${t.held.unit}) | ${t.out.reply.slice(0, 100)}`);
    });
  });

  // N2: the bridge belongs to the next card's unit — after a give-up it switches at the bridge's first spoken part
  describe("N2: a bridge after a give-up switches to the next skill's first unit where the bridge begins", () => {
    for (const [persona, topic, n] of [["stuck", "c4", 74], ["stuck", "c5-t02", 52], ["offtopic", "c6", 40]]) test(`${persona} ${topic} ${n}`, async () => {
      // (the walk is live: the give-up-then-bridge turn is the one nearest the director17 row)
      const turns = await walk(persona, topic, n + 12);
      const t = turns.filter((x) => x.pl.state.lastMove?.bridgeBeat && (x.out.guard?.lineParts ?? []).some((p) => p.part === "bridge")).sort((a, b) => Math.abs(a.n - n) - Math.abs(b.n - n))[0];
      assert.ok(t, "a bridge turn near the row");
      const sk = t.pl.state.lastMove.bridgeBeat?.skillId;
      assert.ok(sk, "a bridge into the next skill");
      assert.match(String(t.held?.switchTo?.unit), new RegExp(`^${sk}:`), JSON.stringify(t.held));
      const parts = t.out.guard.lineParts;
      const text = norm(t.out.reply);
      const at = text.indexOf(norm(parts.find((p) => p.part === "bridge").text));
      assert.equal(t.held.switchTo.atChar, at, "the switch is where the bridge begins");
      assert.ok(!/:bridge$/.test(t.held.switchTo.unit), "never a unit of its own");
    });
  });

  // T1: the request table — one test per row, each replaying its director17 rows (live: her own lines are the history)
  describe("T1: the request table", () => {
    const sents = (t) => (norm(t).match(/[^.!?।]+[.!?।]+/g) ?? []).map((x) => norm(x).toLowerCase()).filter((x) => x.split(" ").length >= 5);
    const at = async (spec) => { const [persona, topic, n] = spec.split(" "); const turns = await walk(persona, topic, Number(n)); return { t: turns.find((x) => x.n === Number(n)), turns }; };
    /** Her sentences this turn that one of her last four turns already said (the card itself, re-posed, aside). */
    const repeats = (t, turns) => {
      const card = norm(t.pl.p.r.ui?.ask?.text ?? "").toLowerCase();
      const before = turns.filter((x) => x.n < t.n).slice(-4).map((x) => norm(x.out.reply).toLowerCase()).join(" ");
      return sents(t.out.reply).filter((x) => !card.includes(x.replace(/[.!?।]+$/, "")) && before.includes(x.replace(/[.!?।]+$/, "")));
    };
    test("the table: every row names a known shape, its beat kind and the director17 rows it replays; lookups are by request × beat", () => {
      const SHAPES = new Set(["live_fresh_else_key", "key", "card_first", "serve_request", "park_later", "return_once", "next_step", "move_on", "ack_then_card"]);
      for (const r of REQUEST_TABLE) { assert.ok(SHAPES.has(r.shape), r.id); assert.ok(r.request.length, r.id); }
      assert.equal(responseShape("language", "remediation"), "live_fresh_else_key");
      assert.equal(responseShape("miss", "spent_card"), "key");
      assert.equal(responseShape("dont_know", "checkin_after_point"), "card_first");
      assert.equal(responseShape("visual", "aside_reply"), "serve_request");
      assert.equal(responseShape("nothing", "point"), null);
    });
    for (const row of REQUEST_TABLE.filter((r) => ["T1.1", "T1.2", "T1.3", "T1.4"].includes(r.id))) for (const spec of row.rows) test(`${row.id} ${row.request.join("/")} on ${row.beat} (${spec}): the live part in fresh authored words, never a sentence of her last four turns; else the key`, async () => {
      const { t, turns } = await at(spec);
      assert.ok(["language", "clarify"].includes(t.pl.state.lastMove.request), `a ${t.pl.state.lastMove.request} turn`);
      assert.deepEqual(repeats(t, turns), [], t.out.reply);
      if (row.beat === "remediation" && !t.pl.state.lastMove.gave) assert.ok(t.pl.state.lastMove.simpler, "the remediation's own words re-said, never skipped");
    });
    test("T1.5 language/clarify on a spent card (sweep, the four stuck and steering lessons): every such turn says a fresh part or gives the key", async () => {
      const bad = [];
      for (const p of ["stuck", "steering"]) for (const topic of Object.keys(TOPIC)) {
        const turns = await walk(p, topic, 200);
        for (const t of turns) if (["language", "clarify"].includes(t.pl.state.lastMove?.request) && repeats(t, turns).length) bad.push(`${p} ${topic} ${t.n}: ${repeats(t, turns)[0]}`);
      }
      assert.deepEqual(bad, []);
    });
    test("T1.6 a miss after a spent simpler (c4 stuck 48, offtopic 34; and a sweep of the stuck lessons): never the same simpler again", async () => {
      const bad = [];
      for (const topic of Object.keys(TOPIC)) for (const p of ["stuck", "offtopic"]) {
        const turns = await walk(p, topic, 200);
        for (const t of turns) if (["incorrect", "misconception"].includes(t.pl.cls.outcome) && t.pl.before.activeItemId && repeats(t, turns).length) bad.push(`${p} ${topic} ${t.n}: ${repeats(t, turns)[0]}`);
      }
      assert.deepEqual(bad, []);
    });
    for (const spec of REQUEST_TABLE.find((r) => r.id === "T1.7").rows) test(`T1.7 "pata nahi" at the check-in after a point (${spec}): the card first, no simpler, no verdict`, async () => {
      const { t } = await at(spec);
      const m = t.pl.state.lastMove;
      assert.ok(!m.simpler, `no simpler: ${t.out.reply}`);
      assert.ok(t.pl.p.r.ui?.ask?.text && norm(t.out.reply).includes(norm(t.pl.p.r.ui.ask.text).slice(-40)), `the card is said: ${t.out.reply}`);
      assert.doesNotMatch(t.out.reply, /sahi nahi|galat|jawab nahi/i);
    });
    test("T1.8 a request where an aside reply was expected is served as that request, never graded, never acknowledged", async () => {
      const { planTurn: plan } = await import("../server/brain/turn.js");
      const { t } = await at("offtopic c4 26");
      // (as turn.js: her last turn ended on an aside question, the card unsaid)
      const st = { ...t.pl.before, cardUnsaid: t.pl.before.activeItemId ?? undefined, asideReplyDue: true };
      for (const [text, req] of [["drawing karke samjhao", "visual"], ["phir se bolo", "repeat"], ["pehle main try karun?", "selftry"]]) {
        const CHILD = { id: "00000000-0000-0000-0000-00000000aaaa", legal_mode: "M1", class_level: 4 }, LESSON = { id: "11111111-1111-1111-1111-11111111aaaa", started_at: new Date(0).toISOString() };
        const item = st.activeItemId ? findItem(st, t.kit, st.activeItemId) : null;
        const p = await plan(st, { outcome: "no_evidence", confidence: 0.9, source: "model", flags: {}, request: { type: req } }, { kit: t.kit, child: CHILD, lesson: LESSON, activeItem: item, moduleOnly: false, moduleEvents: [], answer: text, childText: text, leaked: false, live: Promise.resolve({ state: t.pl.p.learner.after, maxSeq: 0 }), carried: [], now: 9e6 });
        assert.equal(p.r.state.lastMove.request, req, `${text}: served as ${req}`);
        assert.ok(!p.r.state.lastMove.asideAck, `${text}: no acknowledgement`);
        assert.ok(!p.evidence.some((e) => /incorrect|miscon/i.test(JSON.stringify(e))), `${text}: never graded`);
      }
    });
    for (const spec of REQUEST_TABLE.find((r) => r.id === "T1.9").rows) test(`T1.9 an aside with no card open (${spec}): no "is sawaal ke baad"`, async () => {
      const { t } = await at(spec);
      assert.doesNotMatch(t.out.reply, /sawaal ke baad|sawaal khatam karke|after this question/i, t.out.reply);
    });
    for (const spec of REQUEST_TABLE.find((r) => r.id === "T1.10").rows) test(`T1.10 an aside said again is returned to now, once (${spec})`, async () => {
      const { t } = await at(spec);
      assert.ok(t.pl.state.lastMove.returned, t.out.reply);
      assert.doesNotMatch(t.out.reply, /likh li hai/);
    });
    test("T1.11 \"haan\" to her check-in during a worked step (stuck c4 54): the next step, never a stop menu", async () => {
      const { t } = await at("stuck c4 54");
      assert.notEqual(t.pl.state.lastMove.kind, "break", t.out.reply);
      assert.doesNotMatch(t.out.reply, /break|ruk jaate|chuno/i);
    });
    for (const spec of REQUEST_TABLE.find((r) => r.id === "T1.12").rows) test(`T1.12 "aage chalo" with an aside pending (${spec}): the walk moves on first, the aside waits`, async () => {
      const { t } = await at(spec);
      assert.ok(!t.pl.state.lastMove.returned, `no aside return this turn: ${t.out.reply}`);
      assert.doesNotMatch(t.out.reply, /cricket wali baat/i);
    });
  });
  // A5: the acknowledgement after an aside reply only for a reply about the aside, in three or more forms
  test("A5: never said to a number or a request; its forms are three or more (sweep of the 16 lessons)", async () => {
    const { ASIDE_ACK } = await import("../server/brain/say.js");
    assert.ok(ASIDE_ACK.hinglish.length >= 3 && ASIDE_ACK.english.length >= 3);
    const bad = [];
    for (const topic of Object.keys(TOPIC)) for (const p of ["steady", "stuck", "offtopic", "steering"]) {
      const turns = await walk(p, topic, 200);
      for (const t of turns) if (t.out.guard?.asideAck && (/\d/.test(t.pl.child) || (t.pl.cls.request?.type && t.pl.cls.request.type !== "uptake"))) bad.push(`${p} ${topic} ${t.n}: "${t.pl.child}"`);
    }
    assert.deepEqual(bad, []);
  });
  // R6: wording
  describe("R6: wording", () => {
    test("authored lines are never re-inflected; a slice after jitne/kitne/a count is plural", async () => {
      const { inHindiWords } = await import("../server/brain/register.js");
      assert.equal(inHindiWords("Tab jitne slice the, yahan 4."), "Tab jitne tukde the, yahan 4.");
      assert.equal(inHindiWords("1 slice kha liya."), "1 tukda kha liya.");
      const { t } = await at0("steady c4 6");
      assert.doesNotMatch(t.out.reply, /jitna tukda humne liya/);
    });
    test("the picture line: a full stop at the end, no question of its own, fractions in words", () => {
      assert.equal(picLine("2 barabar bar: ek 4 barabar hisson mein, 1 rangin (1/4); ek 1 barabar hisson mein"), "2 barabar bar: ek 4 barabar hisson mein, 1 rangin, ek-chauthaai; ek 1 barabar hisson mein.");
      assert.equal(picLine("Is aakaar ki 6 bhujayein seedhi karke ek line par: 8 m, 3 m; kul lambai kitni"), "Is aakaar ki 6 bhujayein seedhi karke ek line par: 8 m, 3 m.");
    });
    test("one step opener a turn, none before the problem (sweep of the 16 lessons)", async () => {
      const bad = [];
      for (const topic of Object.keys(TOPIC)) for (const p of ["steady", "stuck", "offtopic", "steering"]) {
        const turns = await walk(p, topic, 200);
        for (const t of turns) {
          const r = t.out.reply;
          if (/\b(?:Ab (?:doosra|teesra|agla) kadam|Pehla kadam)\b/.test(r) && (r.match(/(?:^|[.!?]\s+)(?:Ab|Phir|Pehle)\b/g) ?? []).length > 1) bad.push(`${p} ${topic} ${t.n}: ${r.slice(0, 100)}`);
          if (t.pl.state.lastMove?.scriptBeat?.beatId === "worked:problem" && /Pehle yeh hissa|shuruaati hissa|Pehla kadam/.test(r)) bad.push(`${p} ${topic} ${t.n} (problem): ${r.slice(0, 100)}`);
        }
      }
      assert.deepEqual(bad, []);
    });
  });
});
const at0 = async (spec) => { const [persona, topic, n] = spec.split(" "); const turns = await walk(persona, topic, Number(n)); return { t: turns.find((x) => x.n === Number(n)), turns }; };
