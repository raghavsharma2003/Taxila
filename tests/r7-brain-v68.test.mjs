// dc-r7-script-walk-v6-8 (main's director16 judgement): G1 — the grading matrix over EVERY scripted key in data/lesson-scripts (its
// key, its accepted forms, the unit dropped, the sign flipped, its listed wrong answer, a near number). Main's reversal: any
// misgrade, no paid run until this passes.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { classifyFast } from "../server/director/classify.js";
import { replay, runScriptOf } from "./fixtures/replay.mjs";
import { textReply, replyDeps } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { setScriptForTest } from "../server/director/script.js";

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
});
