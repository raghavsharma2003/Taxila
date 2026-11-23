// Round 7 (main, director3 judgement 2026-11-05): a fraction ON THE NUMBER LINE is drawn on the line (fraction-line@1),
// never as a shaded circle while she talks about "nishaan" and "gap". The named mark is "?", the asked fraction is never
// placed, only the kit's solved example hops to its point; every c5 "fractions on a line" board passes the full gate.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { codePick, fractionLineIn } from "../server/forge/explainer/pick.js";
import { expand } from "../server/forge/explainer/templates.js";
import { claimsCalls } from "../server/stagecraft/claims-board.js";
import { gateWhiteboard, withheldValues } from "../server/studio/qa/whiteboard.js";
import { retimeToLine } from "../server/stagecraft/board-sync.js";

const kit = JSON.parse(fs.readFileSync("data/kits/c5-maths.json", "utf8")).topics.find((t) => t.topicId === "c5-maths-ch02-t01");
const item = (suffix) => kit.items.find((i) => i.id.endsWith(suffix));
const speech = (l) => Math.max(1500, l.split(/\s+/).length * 400);

test("fractions on a line: the kit's example, a named mark, an asked fraction — each on the number line", () => {
  assert.deepEqual(codePick({ kit }), { template: "fraction-line@1", den: 5, target: [2, 5], show: true });
  assert.deepEqual(codePick({ kit, item: item("-i01") }), { template: "fraction-line@1", den: 2, mark: 1 }, "the middle mark, asked");
  assert.deepEqual(codePick({ kit, item: item("-i03") }), { template: "fraction-line@1", den: 5, target: [3, 5] }, "where 3/5 goes: not placed");
  assert.deepEqual(codePick({ kit, item: item("-i04") }), { template: "fraction-line@1", den: 4, wholes: 2, target: [5, 4] });
  assert.deepEqual(codePick({ kit, item: item("-i09") }), { template: "fraction-line@1", den: 10, mark: 7 }, "the 7th stone, asked");
  const picks = [null, ...kit.items].map((i) => codePick({ kit, item: i })?.template);
  assert.ok(!picks.includes("fraction-parts@1"), "no shaded circle anywhere in the lesson");
});

test("a fraction of a roti stays a roti; a decimal line and a mixed number are not fraction lines", () => {
  assert.equal(fractionLineIn("Shade 3 out of 4 equal parts of a roti."), null);
  assert.equal(fractionLineIn("A number line from 4.30 km to 4.40 km is split into 10 equal parts."), null);
  assert.equal(fractionLineIn("Write 2 1/3 on the number line"), null);
  const c6 = JSON.parse(fs.readFileSync("data/kits/c6-maths.json", "utf8")).topics.find((t) => t.topicId === "c6-maths-ch07-t02");
  const mixed = c6.items.find((i) => /mixed fraction/i.test(i.prompt_en));
  if (mixed) assert.notEqual(codePick({ kit: c6, item: mixed })?.template, "fraction-line@1", "writing 7/4 as a mixed fraction is not about the line");
});

test("her line about nishaan and gaps draws the line she describes (the claims board), a named mark she asks about is '?'", () => {
  assert.deepEqual(claimsCalls("Dekhiye, line par 4 equal parts hain. Teesra nishaan kya hai?")[0], { template: "fraction-line@1", den: 4, mark: 3 });
  assert.equal(claimsCalls("Screen par 0 se 1 tak line hai. Use 5 equal gaps mein baantiye; 2/5 kaunsa mark hoga?")[0].template, "fraction-line@1");
  assert.equal(claimsCalls("Screen par roti ke 4 equal parts dekhiye, 3 shaded hain.")[0].template, "fraction-parts@1");
});

test("the boards: the example hops gap by gap to 2/5 and names it; a named mark is never given a dot", () => {
  const show = expand({ template: "fraction-line@1", den: 5, target: [2, 5], show: true });
  assert.ok(show.ok, show.errors?.join(","));
  assert.equal(show.script.ops.filter((o) => o.op === "move").length, 2, "two hops");
  assert.ok(show.script.ops.some((o) => o.op === "text" && o.text === "2/5"));
  const mark = expand({ template: "fraction-line@1", den: 2, mark: 1 });
  assert.ok(!mark.script.ops.some((o) => o.op === "circle"), "no dot on the asked mark");
  assert.ok(mark.script.ops.some((o) => o.op === "text" && o.text === "?"));
  assert.ok(!JSON.stringify(mark.facts).includes("1/2"), "its fraction is not in the facts row either");
  assert.equal(expand({ template: "fraction-line@1", den: 13 }).ok, false);
});

test("every c5 'fractions on a line' board passes the full gate on its item, the item's answers withheld", () => {
  let n = 0;
  for (const i of [null, ...kit.items]) {
    const p = codePick({ kit, item: i });
    if (p?.template !== "fraction-line@1") continue;
    n++;
    const x = expand(p);
    const line = i ? i.prompt_en : kit.workedExample.steps.join(" ");
    const g = gateWhiteboard(retimeToLine(x.script, line), { reply: line, speechMs: speech(line), withhold: i ? withheldValues(kit, { itemId: i.id, line }) : { values: [] } });
    assert.ok(g.pass, `${i?.id ?? "worked example"}: ${JSON.stringify(g.checks.filter((c) => !c.pass))}`);
  }
  assert.ok(n >= 15, `${n} boards`);
});

test("lesson-script form (Learning): to, labelled marks and a hop; a label of another value is refused", () => {
  const x = expand({ template: "fraction-line@1", den: 4, from: 0, to: 2, marks: [{ num: 4, label: "1" }, { num: 7, label: "7/4" }], hop: { num: 7 } });
  assert.ok(x.ok, x.errors?.join(","));
  assert.equal(x.script.ops.filter((o) => o.op === "move").length, 7, "one jump per quarter");
  assert.equal(x.facts.onScreen.hop, "7/4");
  assert.equal(x.facts.onScreen.marks, "1, 7/4");
  const crowd = expand({ template: "fraction-line@1", den: 6, to: 1, marks: [{ num: 2, label: "2/6" }, { num: 3, label: "3/6 = 1/2" }, { num: 5, label: "5/6" }] });
  assert.ok(crowd.ok, crowd.errors?.join(","));
  assert.match(expand({ template: "fraction-line@1", den: 4, marks: [{ num: 1, label: "1/2" }] }).errors.join(","), /label_value/, "1/4's point labelled 1/2 is false");
  assert.equal(expand({ template: "fraction-line@1", den: 4, from: 1 }).ok, false);
});

test("two denominators on one line (Learning, comparing fractions): marks on each den's side, the asking form places nothing", async () => {
  const { speechMsOf } = await import("../server/studio/plan.js");
  const gate = (c, line) => { const x = expand(c); assert.ok(x.ok, x.errors?.join(",")); return gateWhiteboard(retimeToLine(x.script, line), { reply: line, speechMs: speechMsOf(line) }); };
  const g1 = gate({ template: "fraction-line@1", dens: [5, 8], marks: [[3, 5], [3, 8]] }, "Upar 5 barabar gap, neeche 8 barabar gap. 3/5 aur 3/8 dekho: 3/5 aage hai.");
  assert.ok(g1.pass, JSON.stringify(g1.checks.filter((c) => !c.pass)));
  const ask = expand({ template: "fraction-line@1", dens: [3, 5], target: [[2, 3], [2, 5]] });
  assert.equal(ask.facts.onScreen.compare, "2/3 vs 2/5");
  assert.ok(!ask.script.ops.some((o) => o.op === "line" && o.ink === "mark"), "no point placed: which is bigger stays the child's");
  assert.equal(expand({ template: "fraction-line@1", dens: [5, 5] }).ok, false);
  assert.equal(expand({ template: "fraction-line@1", dens: [5, 8], marks: [[3, 7]] }).ok, false, "a mark on neither den");
});

// (main, c5-maths-ch02-t01 reader: "7/4" and "5/3" sat over the tick for 1, "4/6", "2/5", "3/4", "1/9" over the middle tick, on
// cards that ask where that fraction is: the fraction to find is the board's title, and its box is over no tick of the line)
test("a fraction-line title (the fraction to find) sits over no tick of the line: left of the 0 end, in the title row", async () => {
  const { textBox } = await import("../shared/whiteboard.js");
  const script = JSON.parse(fs.readFileSync("data/lesson-scripts/c5-maths-ch02-t01.json", "utf8"));
  const boards = [];
  const walk = (x) => { if (x && typeof x === "object") { if (x.template === "fraction-line@1" && x.params?.target != null) boards.push(x.params); for (const k in x) walk(x[k]); } };
  walk(script);
  boards.push({ den: 4, from: 0, to: 2, target: [7, 4] }, { den: 3, from: 0, to: 2, target: [5, 3] }, { den: 9, from: 0, to: 1, target: [1, 9] }, { dens: [2, 3], from: 0, to: 1, target: [[1, 2]] });
  for (const params of boards) {
    const x = expand({ template: "fraction-line@1", ...params });
    assert.ok(x.ok, JSON.stringify(params));
    const ops = x.script.ops, line = ops.find((o) => o.id === "line");
    const fr = (a, d) => `${a}/${d}`;
    const asked = Array.isArray(params.dens) ? (params.target.length === 1 ? fr(...params.target[0]) : null) : fr(...params.target);
    if (!asked) continue;
    const title = ops.find((o) => o.op === "text" && o.text === asked);
    assert.ok(title, `${JSON.stringify(params)}: its title`);
    const box = textBox(title.text, title.size, title.at, title.align ?? "middle");
    // every tick's x: the line's ends and wholes (from its range) and each inner tick
    const x0 = line.at[0] + 12, x1 = line.at[0] + line.w - 12;
    const ticks = [...Array.from({ length: line.range[1] - line.range[0] + 1 }, (_, i) => x0 + (i / (line.range[1] - line.range[0])) * (x1 - x0)),
      ...ops.filter((o) => o.op === "line" && o.from[0] === o.to[0]).map((o) => o.from[0])];
    const over = ticks.filter((t) => t >= box.x - 2 && t <= box.x + box.w + 2);
    assert.deepEqual(over, [], `${JSON.stringify(params)}: "${asked}" box ${box.x}..${box.x + box.w} sits over ticks ${over}`);
    assert.ok(box.x >= 0 && box.y >= 0, "on the board");
  }
});

// (2026-11-23, main: c5-maths-ch02-t01 s2's asked step "2/5 ke liye 0 se 1 ki line mein kitne barabar gaps banenge?" (key 5)
// stood on an uncut fraction-bars strip because no board drew an UNCUT 0-1 line. den 1 is that line, and nothing else)
test("the bare line (den 1): 0 and 1 at its ends, no tick between, passes the gate with the cut withheld; nothing else rides on it", async () => {
  const { altCall } = await import("../server/stagecraft/board-first.js");
  const x = expand({ template: "fraction-line@1", den: 1, from: 0, to: 1 });
  assert.ok(x.ok, x.errors?.join(","));
  const ops = x.script.ops, line = ops.find((o) => o.id === "line");
  assert.deepEqual(line.rows, [["0", "1"]]);
  assert.deepEqual(line.range, [0, 1]);
  assert.equal(ops.filter((o) => o.op === "line").length, 0, "no tick between 0 and 1: nothing is cut");
  assert.ok(!ops.some((o) => o.op === "circle" || o.op === "arrow" || o.op === "text"), "no dot, hop or label beyond the ends");
  assert.deepEqual(x.facts.counts.lines, [{ gaps: 1, ticks: 2, innerTicks: 0 }]);
  // (director33: the prompt no longer asks what the child "will cut" — her answer "5 gaps mein kaatungi" opened a safety turn)
  const said = "2/5 ke liye 0 se 1 ki line mein kitne barabar gaps banenge?";
  const g = gateWhiteboard(retimeToLine(x.script, said), { reply: said, speechMs: speech(said), withhold: { values: ["5", "paanch"] } });
  assert.ok(g.pass, JSON.stringify(g.checks.filter((c) => !c.pass)));
  // (its second view is none: an uncut bar would add nothing the line does not show)
  assert.equal(altCall({ template: "fraction-line@1", params: { den: 1, from: 0, to: 1 } }, { line: said, withheld: ["5"], keys: ["5"] }), null);
  for (const p of [{ to: 2 }, { mark: 1 }, { marks: [{ num: 1 }] }, { hop: { num: 1 } }, { target: [1, 1] }, { target: [1, 1], show: true }, { mixup: "gaps" }])
    assert.match(expand({ template: "fraction-line@1", den: 1, ...p }).errors.join(","), /fraction_line_bare/, JSON.stringify(p));
  assert.equal(expand({ template: "fraction-line@1", den: 0 }).ok, false);
});
