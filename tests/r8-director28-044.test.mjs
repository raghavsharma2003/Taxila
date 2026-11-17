// Brain 044 (docs/patches/to-brain/044-fewer-kinds-of-turn.md, dc-r8-director28): fewer kinds of turn, help as a hard precondition, a joint
// keeps what is up. Each rule is pinned from the order's sentences on small inline fragments or today's scripts, and each new or changed
// predicate on the director28 rows the order lists (tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-17-director28; rows are
// 0-based indexes into a lesson's `director`). Learning 017 rewrites the four pilot scripts at the same time: nothing here pins a sentence
// of today's script.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { heldOf, heldPagesOf, pagePredicates } from "../server/brain/propose.js";
import { heldBoard } from "../server/stagecraft/board-first.js";
import { lessonFlags } from "../evals/hybrid-side-by-side/dry-predicates.mjs";
import { D29_PREDICATES } from "../evals/hybrid-side-by-side/d29-predicates.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const RUN = join(ROOT, "tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-17-director28");
const TOPIC = { c4: "c4-maths-ch05-t01", c5t01: "c5-maths-ch02-t01", c5t02: "c5-maths-ch02-t02", c6: "c6-maths-ch06-t01" };
const FILE = { c4: "c4-ch05-t01", c5t01: "c5-ch02-t01", c5t02: "c5-ch02-t02", c6: "c6-ch06-t01" };
const lesson = (persona, t) => {
  const j = JSON.parse(readFileSync(join(RUN, `${persona}-${FILE[t]}.json`), "utf8"));
  return { rows: j.director, script: JSON.parse(readFileSync(join(RUN, "scripts", `${TOPIC[t]}.json`), "utf8")) };
};
/** The rows of a lesson a predicate flags. */
const flagged = (persona, t, name) => new Set(lessonFlags(lesson(persona, t)).filter((f) => f.predicate === name).map((f) => f.row));
/** Run a test body with strict pages on (the paging law throws), restoring the flag after. */
const strict = (fn) => { const was = process.env.TAXILA_STRICT_PAGES; process.env.TAXILA_STRICT_PAGES = "1"; try { return fn(); } finally { if (was === undefined) delete process.env.TAXILA_STRICT_PAGES; else process.env.TAXILA_STRICT_PAGES = was; } };

const B = (n) => ({ template: "fraction-parts@1", params: { parts: n, shade: 1, whole: "bar" } });
const beat = (beatId, board, kind = "explain") => ({ scriptId: "t", skillId: "sk1", beatId, kind, ...(board ? { board } : {}) });

describe("T4: a joint keeps what is up", () => {
  test("pageStart reads every T4 row of director28 (the try-first joint, the closing lead-in, the switch line, a board at its bridge's or hook's first word)", () => {
    const rows = [
      ["stuck", "c4", 28], ["steady", "c5t02", 32], ["offtopic", "c5t02", 38],
      ["steady", "c5t02", 132], ["steady", "c6", 112],
      ["steady", "c6", 4], ["stuck", "c6", 4], ["offtopic", "c6", 4], ["steering", "c6", 4],
      ["steady", "c5t02", 2], ["steady", "c5t02", 44], ["steady", "c5t02", 84], ["stuck", "c5t02", 56], ["offtopic", "c5t02", 2], ["offtopic", "c5t02", 50], ["steering", "c5t02", 60],
    ];
    for (const [p, t, i] of rows) assert.ok(flagged(p, t, "pageStart").has(i), `${p} ${t} row ${i}`);
  });
  test("pageStart reads 0 on a turn whose page starts at its part, after a joint that kept the board up", () => {
    const up = B(3), rem = B(4);
    const text = "Nahi, 2 sahi nahi hai. Ise ek alag tareeke se dekhte hain. Ek roti ke chaar barabar tukde socho aur unme se ek uthao. Yahan tak theek hai?";
    const at = (x) => text.indexOf(x);
    const r = { who: "teacher", text, seams: [{ left: "missVerdict", right: "remediation", joint: "beforeRemediation", form: "Ise ek alag tareeke se dekhte hain." }],
      pageParts: [{ part: "close", from: 0, beat: "e1", boards: [up] }, { part: "body", from: at("Ise"), beat: "rem:x", boards: [], lead: "beforeRemediation" }, { part: "body", from: at("Ek roti"), beat: "rem:x", boards: [rem] }],
      held: { pages: [{ from: 0, template: up.template }, { from: at("Ek roti"), template: rem.template }] }, segments: [{ from: 0, board: up }, { from: at("Ek roti"), board: rem }] };
    const prev = { who: "teacher", text: "Is patti mein kitne hisse hain?", boardRef: up, held: { pages: [{ from: 0, template: up.template }] } };
    const ctx = { o: {}, script: { joints: {} } };
    assert.equal(D29_PREDICATES.pageStart({ rows: [prev, r] }, prev, 0, ctx), null);
    assert.equal(D29_PREDICATES.pageStart({ rows: [prev, r] }, r, 1, ctx), null);
    // (the same turn with the remediation's page drawn at the joint's first word)
    const early = { ...r, held: { pages: [{ from: 0, template: up.template }, { from: at("Ise"), template: rem.template }] }, segments: [{ from: 0, board: up }, { from: at("Ise"), board: rem }] };
    const ctx2 = { o: {}, script: { joints: {} } };
    D29_PREDICATES.pageStart({ rows: [prev, early] }, prev, 0, ctx2);
    assert.match(String(D29_PREDICATES.pageStart({ rows: [prev, early] }, early, 1, ctx2)), /not at its body@rem:x's first word/);
  });

  test("heldOf: a seam's joint is said over the board up; the part it leads into pages at its own first word", () => strict(() => {
    const up = { board: B(3), unit: "sk1:e1" };
    const move = { kind: "reteach", scriptBeat: beat("rem:x", B(4), "remediation"), closeBeat: beat("e1", B(3)) };
    const list = [{ part: "close", text: "Nahi, yeh jawab nahi hai." }, { part: "body", text: "Ise ek alag tareeke se dekhte hain.", joint: "beforeRemediation" }, { part: "body", text: "Ek roti ke chaar barabar tukde socho." }];
    const line = list.map((p) => p.text).join(" ");
    const h = heldOf({ move, list, line, kit: null, up, graded: true });
    const pages = heldPagesOf(h);
    assert.equal(pages.length, 2);
    assert.equal(pages[1].atChar, line.indexOf("Ek roti"), "the remediation's page at its own first word, not at the joint's");
    assert.deepEqual(pages[0].board, B(3), "the joint is said over the board that was up");
  }));
  test("heldOf: with nothing up, the screen stays empty under a switch line or a hook until the first part that owns a board (`from`)", () => strict(() => {
    const move = { kind: "explain", scriptBeat: beat("e1", B(5)) };
    for (const lead of [{ part: "aside", text: "Koi baat nahi, ise doosre, aasaan shabdon mein bolti hoon.", kind: "opener" }, { part: "close", text: "Socho, do roti hain aur dono barabar hain.", kind: "hook" }, { part: "body", text: "Chalo, ab ek aakhri sawaal.", kind: "leadIn" }]) {
      const list = [lead, { part: "body", text: "Yeh patti ek poora hai: 5 barabar hisse." }, { part: "card", text: "Kitne hisse hain?" }];
      const line = list.map((p) => p.text).join(" ");
      const h = heldOf({ move: { ...move, cardBeat: beat("e1", B(5)) }, list, line, kit: null, up: null });
      assert.equal(h.from, line.indexOf("Yeh patti"), `${lead.kind}: the board comes at the point's first word`);
      assert.equal(heldPagesOf(h)[0].atChar, h.from);
    }
  }));
  test("heldOf: with a board up, a hook keeps it until the point's first word", () => strict(() => {
    const up = { board: B(2), unit: "sk0:c3" };
    const list = [{ part: "close", text: "Socho, do roti hain aur dono barabar hain.", kind: "hook" }, { part: "body", text: "Yeh patti ek poora hai: 5 barabar hisse." }, { part: "card", text: "Kitne hisse hain?" }];
    const line = list.map((p) => p.text).join(" ");
    const h = heldOf({ move: { kind: "explain", scriptBeat: beat("e1", B(5)), cardBeat: beat("e1", B(5)) }, list, line, kit: null, up });
    assert.deepEqual(h.board, B(2));
    assert.equal(h.switchTo.atChar, line.indexOf("Yeh patti"));
    assert.equal(h.from, undefined);
  }));
  test("the paging law throws on a page that starts before its part (pagePredicates)", () => {
    const text = "Chalo, ab ek aakhri sawaal. Taar kitni lambi hai?";
    const own = { board: B(7), unit: "end" };
    assert.throws(() => pagePredicates({ board: B(1), unit: "x", switchTo: { board: B(7), unit: "end", atChar: 0 + 1 } }, [{ part: "body", start: 0, own: null }, { part: "card", start: text.indexOf("Taar"), own }], text, { up: { board: B(1) } }), /P1/);
  });
  test("Studio's heldBoard draws an empty first page until `from` when nothing is up, and the held board from there", () => {
    const text = "Koi baat nahi, ise doosre, aasaan shabdon mein bolti hoon. Yeh patti ek poora hai: 5 barabar hisse, ek mein rang. Kitne hisse hain?";
    const from = text.indexOf("Yeh patti");
    const ask = { intent: { kind: "whiteboard", held: { board: { template: "fraction-parts@1", params: { parts: 5, shade: 1, whole: "bar" } }, unit: "sk1:e1", from }, style: { band: "B3", lang: "hinglish" } }, line: { text } };
    const r = heldBoard(ask, {});
    assert.ok(r?.ok, "drawn");
    assert.equal(r.screens.length, 2);
    assert.equal(r.screens[0].template, null, "nothing on screen under the switch line");
    assert.equal(r.screens[1].from, from);
    assert.equal(r.screens[1].template, "fraction-parts@1");
    // (with a board up, `from` changes nothing: the board up stays until the held board's switch, as before)
    const r2 = heldBoard({ ...ask, intent: { ...ask.intent, held: { ...ask.intent.held, from: undefined } } }, {});
    assert.equal(r2.screens.length, 1);
  });
});
