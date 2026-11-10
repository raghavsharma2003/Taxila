// dc-r7-script-walk-v6-8 (main's director16 judgement): G1 — the grading matrix over EVERY scripted key in data/lesson-scripts (its
// key, its accepted forms, the unit dropped, the sign flipped, its listed wrong answer, a near number). Main's reversal: any
// misgrade, no paid run until this passes.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { classifyFast } from "../server/director/classify.js";
import { replay, runScriptOf } from "./fixtures/replay.mjs";
import { textReply, replyDeps, BEAT_ASK, WORKED_ASK, rotateOf, wordAnswer } from "../server/brain/say.js";
import { heldCount, heldFlags } from "../evals/hybrid-side-by-side/held-units.mjs";
import { whiteboardIntentOf, heldUpOf } from "../server/brain/propose.js";
import { findItem } from "../server/director/items.js";
import { chat } from "../server/azure.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { setScriptForTest } from "../server/director/script.js";
import { planTurn } from "../server/brain/turn.js";
import { cardUnsaidNow } from "../server/director/state.js";

const DIR = new URL("../data/lesson-scripts/", import.meta.url).pathname;
const said = (x) => (x && typeof x === "object" ? x.hi ?? x.en ?? "" : String(x ?? ""));
const cardsOf = (script) => script.skills.flatMap((sk) => [
  ...(sk.explain ?? []).filter((b) => b.ask?.key != null).map((b) => ({ id: `${sk.skillId}:ask:${b.id}`, c: b.ask, meta: "scriptAsk" })),
  ...(sk.workedExample?.yourStep?.key != null ? [{ id: `${sk.skillId}:ask:worked`, c: sk.workedExample.yourStep, meta: "scriptAsk" }] : []),
  ...(sk.checks ?? []).filter((c) => c.key != null).map((c) => ({ id: `${sk.skillId}:${c.id}`, c, meta: "scriptCheck" })),
  ...(sk.remediation ?? []).filter((r) => r.then?.key != null).map((r) => ({ id: `${sk.skillId}:then:${r.targets}`, c: r.then, meta: "scriptThen" })),
]);
const targetOf = ({ id, c, meta }) => {
  const item = { id: `script:${id}`, answer: said(c.key), acceptable: (c.accept ?? []).map(said), [meta]: { wrongIfMis: c.wrongIfMis ?? null, targets: c.targets ?? null } };
  return { mode: "item", item, key: item.answer, also: item.acceptable, ideas: [], misconceptions: [], open: false };
};
const grade = (t, text) => classifyFast({ target: t, childText: text, typed: true })?.result?.outcome ?? null;
const UNIT = /\s*\b(?:cm|m|km|mm|metre|metres|meter|meters|centimetre|centimetres|kg|g)\b\.?$/i;

describe("r7-brain-v68.test.mjs", () => {
  describe("G1: the grading matrix over every scripted key", () => {
    for (const f of readdirSync(DIR).filter((x) => x.endsWith(".json"))) {
      test(`every card of ${f}: key and accepted forms right; the sign flipped, the listed wrong answer and a near number never right`, () => {
        const script = JSON.parse(readFileSync(DIR + f, "utf8"));
        const bad = [];
        let n = 0;
        for (const card of cardsOf(script)) {
          const t = targetOf(card);
          const key = t.key;
          n++;
          for (const form of [key, ...t.also]) if (grade(t, form) !== "correct") bad.push(`${card.id}: "${form}" → ${grade(t, form)}`);
          const num = /^-?\d+(?:\.\d+)?(?:\/\d+)?/.exec(key.trim())?.[0];
          if (num && !num.startsWith("-")) {
            for (const neg of [`-${key}`, `- ${key}`, `−${key}`, `minus ${key}`]) if (grade(t, neg) === "correct") bad.push(`${card.id}: "${neg}" graded right (sign)`);
            if (UNIT.test(key) && grade(t, key.replace(UNIT, "")) !== "correct") bad.push(`${card.id}: "${key.replace(UNIT, "")}" (unit dropped) not right`);
            if (!num.includes("/")) {
              const near = `${Number(num) + 1}${key.trim().slice(num.length)}`;
              if (![key, ...t.also].includes(near) && grade(t, near) === "correct") bad.push(`${card.id}: "${near}" graded right`);
            }
          }
          const w = card.c.wrongIfMis != null ? said(card.c.wrongIfMis) : null;
          if (w && ![key, ...t.also].includes(w) && grade(t, w) === "correct") bad.push(`${card.id}: listed wrong answer "${w}" graded right`);
        }
        assert.ok(n > 5, `${f}: only ${n} cards`);
        assert.deepEqual(bad, []);
      });
    }
    test("the director16 misgrade: '-1/7 km' to the key '1/7 km' is wrong, on the fast path and the model's", async () => {
      const t = { mode: "item", item: { id: "script:x", answer: "1/7 km", acceptable: ["1/7"], scriptThen: { wrongIfMis: null, targets: null } }, key: "1/7 km", also: ["1/7"], ideas: [], misconceptions: [] };
      assert.equal(grade(t, "-1/7 km"), "incorrect");
      const { signMismatch } = await import("../server/director/classify.js");
      assert.equal(signMismatch({ result: { outcome: "correct" } }, t, "-1/7 km").result.outcome, "incorrect");
      assert.equal(signMismatch({ result: { outcome: "correct" } }, t, "1/7 km").result.outcome, "correct");
    });
  });

  // V1″ (main on director16): the hook is authored only on every path — her copy after it (c4 stuck 2 and steering 2, c6 stuck 2 and
  // steering 2, c5-t02 steering 2), also when a later pass rewords her sentence; and the "?" drop never takes an authored sentence
  describe("V1″: the hook says the authored line only; authored questions stay", () => {
    const RUN = "2026-11-09-director16";
    const TOPIC = { c4: "c4-maths-ch05-t01", "c5-t02": "c5-maths-ch02-t02", c6: "c6-maths-ch06-t01", "c5-t01": "c5-maths-ch02-t01" };
    const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
    const reply = async (persona, topic, n, draft) => {
      const T = TOPIC[topic];
      const sc = runScriptOf(RUN, T); delete sc.recordedRun;
      setScriptForTest(T, sc);
      const KEEP = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT;
      try {
        const { kit, rows, last } = await replay(RUN, persona, T, n + 1);
        replyDeps.chat = async () => ({ text: draft(rows[n].text) });
        const out = await textReply({ instructions: instructionsFor(last.state, kit), state: last.state, kit, childText: last.child, history: (last.state.recent ?? []).slice(0, -1), ui: last.p.r.ui, module: null });
        return { out, last };
      } finally { replyDeps.chat = chat; setScriptForTest(); if (KEEP !== undefined) process.env.TAXILA_R7_SCRIPT = KEEP; }
    };
    const ROWS = [["stuck", "c4"], ["steering", "c4"], ["stuck", "c6"], ["steering", "c6"], ["steering", "c5-t02"]];
    // (her recorded line; her extra sentence alone; and that sentence reworded the way a later pass rewords it)
    // (the leak's own shape: "Riya, …" — the address is cut by a later pass, so her sentence's exact key was no longer hers)
    const last1 = (t) => t.split(/(?<=[.?!])\s+/).at(-1);
    const DRAFTS = [(t) => t, last1, (t) => `Riya, ${last1(t)}`, (t) => `Koi baat nahi, Riya. ${last1(t)}`];
    for (const [persona, topic] of ROWS) test(`${persona} ${topic} row 2: the hook is the authored line, whatever she wrote`, async () => {
      for (const d of DRAFTS) {
        const { out, last } = await reply(persona, topic, 2, d);
        assert.equal(last.state.lastMove?.kind, "hook");
        assert.equal(norm(out.reply), norm(last.state.lastMove.sayFirst.join(" ")), `draft ${d("x")}`);
      }
    });
    test("an authored point's own question is said (c5-t02 stuck 8: 'Neeche ka 4?' was dropped with the point), her own question is not", async () => {
      for (const d of [(t) => t, (t) => `${t} Tumhe kya lagta hai, kitne tukde?`]) {
        const { out } = await reply("stuck", "c5-t02", 8, d);
        assert.match(out.reply, /Neeche ka 4\? Patti ke 4 barabar tukde\./);
        assert.doesNotMatch(out.reply, /Tumhe kya lagta hai/);
      }
    });
  });

  // A4 (main on director16 c5-t01 steady 40: "…usmein tumhe sabse achha kya lagta hai?" ended her turn, the next card was pinned
  // unsaid and their "1/2" graded a misconception against it): an aside question ends her turn — no card posed or pinned; the
  // next turn acknowledges their reply in one code line (never graded), then says the card
  describe("A4: an aside question ends her turn; the unsaid card is never pinned nor graded", () => {
    const RUN = "2026-11-09-director16", T = "c5-maths-ch02-t01";
    test("c5-t01 steady 40-42", async () => {
      const sc = runScriptOf(RUN, T); delete sc.recordedRun;
      setScriptForTest(T, sc);
      const KEEP = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT;
      try {
        const { kit, rows, last } = await replay(RUN, "steady", T, 41);
        replyDeps.chat = async () => ({ text: rows[40].text });
        const out = await textReply({ instructions: instructionsFor(last.state, kit), state: last.state, kit, childText: last.child, history: [], ui: last.p.r.ui, module: null });
        // (v6.10 T2: row 39's "haan, woh maine bata diya" just after the card is asked for once more — the aside's return waits a turn)
        if (last.state.lastMove?.request === "ask_again") { assert.match(out.reply, /phir|once more|again/i); assert.ok(out.guard.askAgain); return; }
        assert.ok(out.guard.cardHeld, `the aside question ends the turn | ${out.reply}`);
        assert.match(out.reply, /[?？]\s*$/);
        const card = last.p.r.ui?.ask?.text ?? "";
        assert.ok(card && !out.reply.includes(card), "the card is not said");
        // (as brain/turn.js applies the guard)
        const s1 = { ...last.state, cardUnsaid: last.state.activeItemId, seq: last.state.seq + 1, recent: [...(last.state.recent ?? []), { who: "teacher", text: out.reply }, { who: "child", text: "1/2" }] };
        assert.ok(cardUnsaidNow(s1));
        const CHILD = { id: "00000000-0000-0000-0000-00000000aaaa", legal_mode: "M1", class_level: 5 }, LESSON = { id: "11111111-1111-1111-1111-11111111aaaa", started_at: new Date(0).toISOString() };
        const item = kit.items?.find((i) => i.id === s1.activeItemId) ?? null;
        const p = await planTurn(s1, { outcome: "misconception", confidence: 0.9, source: "replay", flags: {} }, { kit, child: CHILD, lesson: LESSON, activeItem: item, moduleOnly: false, moduleEvents: [], answer: "1/2", childText: "1/2", leaked: false, live: Promise.resolve({ state: last.p.learner.after, maxSeq: 0 }), carried: [], now: 9e6 });
        const st = { ...p.r.state, mode: "text" };
        assert.equal(st.activeItemId, s1.activeItemId, "the same card stays live");
        assert.ok(!["reteach", "hint"].includes(p.r.move.kind), `not graded: ${p.r.move.kind}`);
        assert.ok(!st.misses?.[s1.activeItemId], "no miss counted");
        assert.ok(!st.lastMove?.asideAck, "a number is an answer, not a reply about the aside (v6.9 A5)");
        assert.ok(!p.evidence.some((e) => /miscon|incorrect|wrong/i.test(JSON.stringify(e))), "no evidence graded");
        replyDeps.chat = async () => ({ text: "Achha! Ab sawaal dekho." });
        const o2 = await textReply({ instructions: instructionsFor(st, kit), state: st, kit, childText: "1/2", history: [], ui: p.r.ui, module: null });
        // (v6.9 A5, main on director17: "1/2" is an answer, not a reply about the aside — no acknowledgement; the card, never graded)
        assert.ok(!o2.guard.asideAck, o2.reply);
        assert.match(o2.reply, new RegExp(`${card.slice(0, 30).replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}`));
        assert.doesNotMatch(o2.reply, /sahi nahi|galat|jawab nahi/i);
      } finally { replyDeps.chat = chat; setScriptForTest(); if (KEEP !== undefined) process.env.TAXILA_R7_SCRIPT = KEEP; }
    });
  });

  // B1‴ (main on director16): a Hindi request re-says the live part in its other authored words; a worked step's own line during a
  // worked step; a simpler spent on Hindi is spent (the next miss gives the key); the greet's "pata nahi" never carries into e1 before
  // it is taught; a closed card is never reopened
  describe("B1‴: the live part, never a closed card's or an untaught beat's", () => {
    const RUN = "2026-11-09-director16";
    const TOPIC = { c4: "c4-maths-ch05-t01", "c5-t02": "c5-maths-ch02-t02", c6: "c6-maths-ch06-t01", "c5-t01": "c5-maths-ch02-t01" };
    const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
    const at = async (persona, topic, n) => {
      const T = TOPIC[topic];
      const sc = runScriptOf(RUN, T); delete sc.recordedRun;
      setScriptForTest(T, sc);
      const KEEP = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT;
      try {
        const { kit, rows, last } = await replay(RUN, persona, T, n + 1);
        replyDeps.chat = async () => ({ text: rows[n].text });
        const out = await textReply({ instructions: instructionsFor(last.state, kit), state: last.state, kit, childText: last.child, history: [], ui: last.p.r.ui, module: null });
        return { out, last, kit, sc };
      } finally { replyDeps.chat = chat; setScriptForTest(); if (KEEP !== undefined) process.env.TAXILA_R7_SCRIPT = KEEP; }
    };
    for (const persona of ["steady", "stuck", "offtopic", "steering"]) test(`c4 ${persona} row 4: after the hook, e1 is taught — never its simpler first`, async () => {
      const { last } = await at(persona, "c4", 4);
      assert.equal(last.state.lastMove.kind, "explain");
      assert.equal(last.state.lastMove.scriptBeat?.beatId, "e1");
      assert.ok(!last.state.lastMove.simpler && !last.state.lastMove.beatless);
    });
    test("c4 stuck 8: 'ab Hindi mein' is followed by the live part (e1) in words her last turn did not use, then the card", async () => {
      const { out, last, sc } = await at("stuck", "c4", 8);
      // (v6.9 T1: with nothing of the live part left unsaid in her last four turns, the key and its why)
      if (last.state.lastMove.gave?.answer) { assert.match(out.reply, /jawab/i); return; }
      // (v6.10 T2.5: a request never spends help — with nothing fresh and the card's help unspent by a miss, no key: the card again)
      if (!last.state.lastMove.simpler) { assert.doesNotMatch(out.reply, /jawab/i); assert.ok(norm(out.reply).endsWith(norm(last.p.r.ui.ask.text)), out.reply); return; }
      const e1 = sc.skills[0].explain.find((b) => b.id === "e1");
      const lastT = norm([...last.state.recent].reverse().find((t) => t.who === "teacher")?.text);
      const sim = norm(said(e1.ask?.simpler ?? e1.simpler));
      assert.ok(!lastT.includes(sim.slice(0, 40)));
      assert.ok(norm(out.reply).includes(sim.split(" ").slice(0, 5).join(" ")), out.reply);
      assert.ok(norm(out.reply).endsWith(norm(last.p.r.ui.ask.text)));
    });
    // (steady c4 36 left this list in v6.10: the recorded walk diverges at row 27 — T2's never-spending Hindi request leaves the card a hint,
    // so the miss there is hinted, not given; Hindi on a worked step is replayed live on director17 by T1.2, tests/r7-brain-v69.test.mjs)
    for (const [persona, topic, n] of [["offtopic", "c4", 34], ["offtopic", "c5-t02", 32]]) test(`${persona} ${topic} ${n}: Hindi during a worked step says that step's own line, on the worked board`, async () => {
      const { out, last, sc } = await at(persona, topic, n);
      const bid = last.before.lastMove?.scriptBeat?.beatId;
      assert.match(String(bid), /^worked:step\d+$/);
      const we = sc.skills.find((k) => k.skillId === last.before.lastMove.scriptBeat.skillId).workedExample;
      const st = we.steps[Number(/\d+$/.exec(bid)[0]) - 1];
      assert.ok(norm(out.reply).includes(norm(said(st.simpler)).split(" ").slice(0, 5).join(" ")), out.reply);
      assert.equal(last.state.lastMove.scriptBeat?.beatId, bid);
      assert.ok(!norm(out.reply).includes(norm(said(we.yourStep?.simpler ?? "")).slice(0, 30) || "\u0000"), "never the yourStep's simpler");
    });
    test("c6 steering 10: the then-card's simpler, spent on the Hindi request, is not said again — the miss gives the key", async () => {
      const { out, last } = await at("steering", "c6", 10);
      assert.ok(last.state.lastMove.gave, `the key given: ${last.state.lastMove.kind}`);
      assert.match(out.reply, /29 m/);
      assert.doesNotMatch(out.reply, /P se shuru karo/);
    });
    for (const topic of ["c6", "c5-t01"]) test(`steady ${topic} 38: a closed card (answered, its why pending) is never reopened by a Hindi request`, async () => {
      const { out, last } = await at("steady", topic, 38);
      assert.equal(last.before.pendingWhy, last.before.activeItemId);
      assert.notEqual(last.state.activeItemId, last.before.activeItemId);
      const card = norm(last.p.r.ui?.ask?.text ?? "");
      if (card) assert.ok(norm(out.reply).endsWith(card));
      assert.match(out.reply, /Hindi/);
    });
  });

  // R5 (main on director16): check-in forms rotate over the lesson; a worked close says its why once; no "Ab agla kadam" after a
  // remediation; no "Pehla kadam dekho. Pehle …"; a word key in the colon form; "aage chalo" never stops (v6.9 R6 reversed v6.8's
  // "1, jitna tukda … liya": authored lines are never re-inflected — tests/r7-brain-v69.test.mjs)
  describe("R5: her frames", () => {
    const RUN = "2026-11-09-director16";
    const TOPIC = { c4: "c4-maths-ch05-t01", "c5-t02": "c5-maths-ch02-t02", c6: "c6-maths-ch06-t01", "c5-t01": "c5-maths-ch02-t01" };
    test("rotateOf: never a form said in her last 4 turns; every form reachable", () => {
      const xs = BEAT_ASK.hinglish;
      const st = (turn, ...t) => ({ seed: 0, turn, recent: t.map((text) => ({ who: "teacher", text })) });
      for (let k = 0; k < 8; k++) assert.notEqual(rotateOf(xs, st(k, xs[0], "a")), xs[0]);
      assert.deepEqual(new Set(Array.from({ length: 8 }, (_, k) => rotateOf(xs, st(k)))), new Set(xs));
    });
    test("wordAnswer", () => {
      assert.ok(wordAnswer("Gopi ke paas") && !wordAnswer("29 m") && !wordAnswer("2/5"));
    });
    test("over all 16 director16 lessons walked live: no 'Pehla kadam dekho. Pehle', no 'Ab agla kadam' on a remediation, no 'jawab Gopi ke paas tha', a worked close's why once, ≥3 check-in forms per topic and none above half", async () => {
      const forms = [...new Set([...BEAT_ASK.hinglish, ...WORKED_ASK.hinglish])];
      const bad = [];
      const KEEP = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT;
      try {
        for (const [topic, T] of Object.entries(TOPIC)) {
          const per = {};
          for (const persona of ["steady", "stuck", "offtopic", "steering"]) {
            const sc = runScriptOf(RUN, T); delete sc.recordedRun; setScriptForTest(T, sc);
            const { kit, rows, plans } = await replay(RUN, persona, T, 1e9);
            for (const pl of plans) {
              const n = pl.row - 1; if (!rows[n]) continue;
              replyDeps.chat = async () => ({ text: rows[n].text });
              const r = (await textReply({ instructions: instructionsFor(pl.state, kit), state: pl.state, kit, childText: pl.child, history: [], ui: pl.p.r.ui, module: null })).reply;
              const tag = `${persona} ${topic} ${n}`;
              for (const f of forms) if (r.includes(f)) per[f] = (per[f] ?? 0) + 1;
              if (/Pehla kadam dekho\. Pehle/.test(r)) bad.push(`${tag}: doubled first step | ${r.slice(0, 100)}`);
              if (pl.state.lastMove?.scriptBeat?.kind === "remediation" && /Ab agla kadam/.test(r)) bad.push(`${tag}: next step after a remediation`);
              if (/jawab Gopi ke paas tha/.test(r)) bad.push(`${tag}: "jawab Gopi ke paas tha"`);
              const m = /Dekho, ([^.]+)\. Toh poora jawab: [^.]*kyunki ([^.]+)\./.exec(r);
              if (m && m[2].includes(m[1].slice(0, 30))) bad.push(`${tag}: the why twice`);
            }
          }
          const counts = Object.values(per), total = counts.reduce((a, b) => a + b, 0);
          if (counts.length < 3) bad.push(`${topic}: ${counts.length} check-in forms ${JSON.stringify(per)}`);
          if (total && Math.max(...counts) > total / 2) bad.push(`${topic}: one form over half ${JSON.stringify(per)}`);
        }
      } finally { replyDeps.chat = chat; setScriptForTest(); if (KEEP !== undefined) process.env.TAXILA_R7_SCRIPT = KEEP; }
      assert.deepEqual(bad, []);
    });
    test("c5-t02 steady 64: 'woh wala ho gaya, aage chalo' read by the model as a stop gets no stop menu — the walk goes on", async () => {
      const T = TOPIC["c5-t02"];
      const sc = runScriptOf(RUN, T); delete sc.recordedRun; setScriptForTest(T, sc);
      const KEEP = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT;
      try {
        const { kit, plans } = await replay(RUN, "steady", T, 65);
        const pl = plans.at(-1);
        const CHILD = { id: "00000000-0000-0000-0000-00000000aaaa", legal_mode: "M1", class_level: 5 }, LESSON = { id: "11111111-1111-1111-1111-11111111aaaa", started_at: new Date(0).toISOString() };
        const item = pl.before.activeItemId ? kit.items?.find((i) => i.id === pl.before.activeItemId) ?? null : null;
        const p = await planTurn(pl.before, { outcome: "no_evidence", confidence: 0.9, source: "model", flags: { wantsToStop: true } }, { kit, child: CHILD, lesson: LESSON, activeItem: item, moduleOnly: false, moduleEvents: [], answer: pl.child, childText: pl.child, leaked: false, live: Promise.resolve({ state: pl.p.learner.after, maxSeq: 0 }), carried: [], now: 9e6 });
        assert.ok(!p.r.move.checkin && p.r.move.kind !== "break", `${p.r.move.kind} ${p.r.move.checkin}`);
        assert.equal(p.r.move.request, "move_on");
      } finally { setScriptForTest(); if (KEEP !== undefined) process.env.TAXILA_R7_SCRIPT = KEEP; }
    });
  });

  // H5 (main's dc-r7-held-board): the held-board counter flags director16's 8 judged rows (a: c4 steady 46, offtopic 46, c6 offtopic
  // 36; b: c4 steady 36, offtopic 34, c5-t02 offtopic 32; c: c4 steady 18, c5-t02 stuck 18) — retired as a gate input above 1 miss —
  // and every silently pinned card as "an unsaid card on screen"
  describe("H5: the held-board counter on director16", () => {
    const D = new URL("./fixtures/eval-results/hybrid-side-by-side/results/2026-11-09-director16/", import.meta.url).pathname;
    const flagged = new Map();
    for (const f of readdirSync(D).filter((x) => x.endsWith(".json") && x !== "meter.json")) {
      const j = JSON.parse(readFileSync(D + f, "utf8"));
      const sc = JSON.parse(readFileSync(`${D}scripts/${j.topicId}.json`, "utf8"));
      for (const x of heldCount(j.director, sc)) flagged.set(`${f.replace(".json", "")} ${x.row}`, x.flags);
    }
    test("the 8 judged rows are flagged (≤1 miss)", () => {
      const EIGHT = ["steady-c4-ch05-t01 46", "offtopic-c4-ch05-t01 46", "offtopic-c6-ch06-t01 36", "steady-c4-ch05-t01 36", "offtopic-c4-ch05-t01 34", "offtopic-c5-ch02-t02 32", "steady-c4-ch05-t01 18", "stuck-c5-ch02-t02 18"];
      const missed = EIGHT.filter((k) => !flagged.has(k));
      assert.ok(missed.length <= 1, `missed: ${missed.join(", ")}`);
    });
    test("main's silent pins are flagged as an unsaid card on screen", () => {
      const PINS = ["steady-c5-ch02-t01 40", "stuck-c5-ch02-t01 38", "offtopic-c5-ch02-t01 20", "steering-c5-ch02-t01 26", "steady-c5-ch02-t02 40", "stuck-c5-ch02-t02 58", "offtopic-c5-ch02-t02 18", "offtopic-c5-ch02-t02 42", "offtopic-c4-ch05-t01 6", "steady-c6-ch06-t01 40"];
      assert.deepEqual(PINS.filter((k) => !(flagged.get(k) ?? []).some((x) => /unsaid card/.test(x.why))), []);
    });
  });

  // dc-r7-held-board: the predicates (propose.js heldPredicates, thrown under tests) over every turn of the 16 director16 lessons
  // walked live — on the run's own scripts and on Learning's D11 data — the board carried from turn to turn as production does
  describe("held board: Brain's predicates over 16 lessons", () => {
    const RUN = "2026-11-09-director16";
    const TOPIC = { c4: "c4-maths-ch05-t01", "c5-t02": "c5-maths-ch02-t02", c6: "c6-maths-ch06-t01", "c5-t01": "c5-maths-ch02-t01" };
    for (const data of ["director16", "D11"]) test(`${data} scripts: ≤1 change a turn, a change only at a spoken new unit's first part, every spoken part on the held unit; H5 reads 0 on the walk`, async () => {
      const KEEP = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT;
      const errs = [], h5 = [];
      let turns = 0, held = 0, switched = 0;
      try {
        for (const [topic, T] of Object.entries(TOPIC)) for (const persona of ["steady", "stuck", "offtopic", "steering"]) {
          const sc = data === "D11" ? JSON.parse(readFileSync(`${DIR}${T}.json`, "utf8")) : runScriptOf(RUN, T);
          delete sc.recordedRun; setScriptForTest(T, sc);
          const { kit, rows, plans } = await replay(RUN, persona, T, 1e9);
          let up = null;
          for (const pl of plans) {
            const n = pl.row - 1; if (!rows[n]) continue;
            replyDeps.chat = async () => ({ text: rows[n].text });
            const out = await textReply({ instructions: instructionsFor(pl.state, kit), state: pl.state, kit, childText: pl.child, history: [], ui: pl.p.r.ui, module: null });
            const next = { ...pl.state, heldUp: up };
            turns++;
            try {
              const a = whiteboardIntentOf({ lessonId: "L", turn: n, beat: { id: "visual", type: "explain" }, next, kit, item: next.lastMove?.itemId ? findItem(next, kit, next.lastMove.itemId) : null,
                line: { text: out.reply, ...(out.guard?.parts ? { parts: out.guard.parts } : {}) } });
              const H = a.intent.held;
              if (!H) continue;
              held++; if (H.switchTo) switched++;
              if (a.intent.segments) errs.push(`${persona} ${topic} ${n}: a held turn paged`);
              up = heldUpOf(H);
              // (H5 on the walk: no card pinned unsaid; every spoken part on its held unit)
              // (the held predicates above already hold every spoken part to its unit; here: no card on screen that is not said)
              const text = out.reply.replace(/\s+/g, " ").trim();
              // (v6.10 T2: an ask-again turn keeps the card said on the turn before it, and says only its one line)
              const f = heldFlags({ text, card: out.guard?.cardHeld || out.guard?.askAgain ? null : pl.p.r.ui?.ask?.text ?? null }, null); // (as turn.js: A4 drops ui.ask)
              if (f.length) h5.push(`${persona} ${topic} ${n}: ${f.map((x) => x.why).join("; ")}`);
            } catch (e) { errs.push(`${persona} ${topic} ${n}: ${e.message.slice(0, 160)}`); }
          }
        }
      } finally { replyDeps.chat = chat; setScriptForTest(); if (KEEP !== undefined) process.env.TAXILA_R7_SCRIPT = KEEP; }
      assert.deepEqual(errs, []);
      assert.ok(held > turns * 0.8, `${held} of ${turns} turns held`);
      assert.ok(switched > 0);
      assert.deepEqual(h5, []);
    });
  });

  // TEACHER-03 (owner's audit): a teach-back's verdict is the classifier model's label — the summary never shows a tick for it
  test("TEACHER-03: the child's summary shows no tick for a teach-back the model alone called right", async () => {
    const { lessonSummary } = await import("../server/routes/lesson.js");
    const item = { kind: "item", itemId: "i1", ask: "2+2?", answer: "4", verdict: "correct", verified: true, seq: 3, turn: 2 };
    const tb = { kind: "teachback", itemId: null, ask: null, answer: "neeche wala tukde ginta hai", verdict: "correct", withHelp: false, verified: false, byModel: true, seq: 9, turn: 6 };
    const s = lessonSummary({ did: [item, tb] }, { topic: { title: "Fractions" }, teacher: "asha" });
    assert.equal(s.cards.filter((c) => c.kind === "teachback").length, 0);
    assert.equal(s.cards.filter((c) => c.tick).length, 1);
    const s2 = lessonSummary({ did: [item, { ...tb, verified: true, byModel: false }] }, { topic: { title: "Fractions" }, teacher: "asha" });
    assert.equal(s2.cards.filter((c) => c.kind === "teachback" && c.tick).length, 1, "a verified teach-back (none today) would show");
  });
});
