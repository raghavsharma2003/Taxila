// W2-F (LIVE-STUDIO §3.6, S2; owner priority 6): the gate. Pure parts: G0 static (AST), the graders (the host grades,
// malformed answers are simply wrong), the whiteboard archetype's gate (fits the stage, labels anchored, numbers from her
// line or the kit, arithmetic true, words hers or the book's, timed to her voice, the picture's counts hers) and the
// whiteboard planner (child-free, one repair, a deadline). Browser part (Chromium present): goldens pass at their params
// and held-out params, and seeded mutants are caught (the full suite is evals/live-studio/mutants.mjs).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { staticChecks } from "../server/studio/qa/static.js";
import { GRADERS, graderFor, rightAnswers } from "../server/studio/qa/graders.js";
import { gateWhiteboard, numbersIn, partitionCounts, withheldValues, kitNumbers } from "../server/studio/qa/whiteboard.js";
import { stateGraph } from "../server/studio/qa/gate.js";
import { planWhiteboard, _setChat, redactLine, fitOps, expandOps, clausesOf, sectorsForCutCircles, speechMsOf, REPAIR_MIN_MS } from "../server/studio/plan.js";
import { createLanes } from "../server/lanes.js";
import { archetype, FRAME_ARCHETYPES } from "../server/studio/archetypes/index.js";
import { cspFor, runtimeSource } from "../server/studio/qa/page.js";

const G = JSON.parse(readFileSync(new URL("../evals/live-studio/goldens/goldens.json", import.meta.url), "utf8"));
const golden = (id) => readFileSync(new URL(`../evals/live-studio/goldens/${id}.html`, import.meta.url), "utf8");

test("G0 static: the goldens are clean; each banned family is caught by the AST walk, not by a regex on text", () => {
  for (const id of FRAME_ARCHETYPES) {
    const bad = staticChecks(golden(id), { keys: Object.keys(G[id].strings) }).filter((c) => !c.pass);
    assert.deepEqual(bad, [], id);
  }
  const wrap = (js, markup = "<div></div>") => `<style></style>${markup}<script>${js}</script>`;
  const fails = (html, id) => { const c = staticChecks(html, { keys: ["title"] }).find((x) => x.id === id); assert.equal(c?.pass, false, `${id}: ${html.slice(0, 80)}`); };
  fails(wrap("fetch('x')"), "G0.no_banned_api");
  fails(wrap("window['fe'+'tch']('x')"), "G0.no_banned_api");
  fails(wrap("top.location='x'"), "G0.no_banned_api");
  fails(wrap("new Image().src='x'"), "G0.no_banned_api");
  fails(wrap("document.cookie='a'"), "G0.no_banned_api");
  fails(wrap("x.__proto__.y=1"), "G0.no_banned_api");
  fails(wrap("window.__studioHost({type:'done'})"), "G0.no_banned_api");
  fails(wrap("setTimeout('alert(1)',1)"), "G0.no_banned_api");
  fails(wrap("Studio.answer({n:3,d:4})"), "G0.no_literal_answer");
  fails(wrap("Studio.t('nope')"), "G0.table_keys_only");
  fails(wrap("var a=1", '<div onclick="x()"></div>'), "G0.no_inline_handlers");
  fails(wrap("var a=1", '<link rel="stylesheet" href="https://x">'), "G0.no_url");
  fails(wrap("var a = ;"), "G0.parses");
  // locals that shadow a banned name are fine; a computed key from a variable on window is not
  assert.equal(staticChecks(wrap("var open=false; function f(top){return top+1} Studio.answer(open)"), { keys: [] }).find((c) => c.id === "G0.no_banned_api").pass, true);
  fails(wrap("var k='x'; window[k]()"), "G0.no_banned_api");
});

test("graders: the host grades every archetype; right answers pass, malformed or wrong answers are wrong, never a throw", () => {
  for (const id of FRAME_ARCHETYPES) {
    const a = archetype(id), p = G[id].params;
    const g = graderFor(a, p);
    for (const junk of [null, undefined, 42, "x", { n: "a" }, [], { card: 7 }]) assert.equal(g(junk).correct, false, `${id} junk ${JSON.stringify(junk)}`);
    const g2 = graderFor(a, p);
    const answers = rightAnswers(a, p);
    assert.ok(answers.length >= 1, id);
    let last;
    for (const ans of answers) { last = g2(ans); assert.equal(last.correct, true, `${id} ${JSON.stringify(ans)}`); }
    assert.equal(last.complete, true, `${id} complete after the right answers`);
  }
  // order matters for item graders: the second item's answer is wrong while the first is open
  const g = GRADERS.fraction_items({ items: [{ id: "a", n: 3, d: 4 }, { id: "b", n: 2, d: 5 }] });
  assert.equal(g({ n: 2, d: 5 }).correct, false);
  assert.equal(g({ n: 3, d: 4 }).correct, true);
});

test("G7 state graph from the host log: ready once before answers, done once and only after the last right answer", () => {
  assert.deepEqual(stateGraph([{ type: "ready" }, { type: "answer", correct: false }, { type: "answer", correct: true, complete: true }, { type: "done" }]), [true, []]);
  assert.equal(stateGraph([{ type: "ready" }, { type: "done" }])[0], false);
  assert.equal(stateGraph([{ type: "answer", correct: true, complete: true }, { type: "ready" }, { type: "done" }])[0], false);
  assert.equal(stateGraph([{ type: "ready" }, { type: "answer", correct: true, complete: true }, { type: "done" }, { type: "done_again" }])[0], false);
});

test("the page: hash-only CSP pins exactly the scripts given; the runtime freezes Studio and hides the host binding", () => {
  const csp = cspFor(["a", "b"]);
  assert.match(csp, /script-src 'sha256-[^']+' 'sha256-[^']+'; /);
  assert.ok(!/unsafe-inline'[^;]*script|unsafe-eval/.test(csp.split("; ").find((d) => d.startsWith("script-src"))));
  assert.match(csp, /connect-src 'none'/);
  const rt = runtimeSource({ params: { a: 1 }, strings: { t: "x" } });
  assert.match(rt, /delete window\.__studioHost/);
  assert.match(rt, /Object\.freeze\(Studio\)/);
  assert.match(rt, /Math\.random = /);
});

// ───────────────────────────── the whiteboard gate ─────────────────────────────

const LINE = "0 se 1 tak 4 equal parts banayein; pehla point one-fourth hoga. 3/4 tak teen parts gino.";
const S = (ops, extra = {}) => ({ v: 1, scriptId: "s", line: { lessonId: "L" }, anchor: "line_audio_start", board: { w: 400, h: 300, ground: "chalk" }, mode: "fresh",
  durationMs: Math.max(...ops.map((o) => o.endMs)), ops, ...extra });
const GOOD_OPS = [
  { id: "c", op: "circle", c: [120, 150], r: 80, startMs: 0, endMs: 900 },
  { id: "s1", op: "sector", c: [120, 150], r: 80, fromDeg: 0, toDeg: 90, fill: "accent", startMs: 1000, endMs: 1500 },
  { id: "s2", op: "sector", c: [120, 150], r: 80, fromDeg: 90, toDeg: 180, startMs: 1500, endMs: 1900 },
  { id: "s3", op: "sector", c: [120, 150], r: 80, fromDeg: 180, toDeg: 270, startMs: 1900, endMs: 2300 },
  { id: "s4", op: "sector", c: [120, 150], r: 80, fromDeg: 270, toDeg: 360, startMs: 2300, endMs: 2700 },
  { id: "l1", op: "label", at: [300, 60], text: "1/4", to: [160, 110], startMs: 3000, endMs: 3600 },
  { id: "t1", op: "text", at: [300, 220], text: "4 equal parts", size: "m", startMs: 3800, endMs: 4600 },
  { id: "n1", op: "numwork", at: [250, 150], layout: "fraction", rows: [["3"], ["4"]], startMs: 5200, endMs: 6000 },
];
const ctx = (o = {}) => ({ reply: LINE, kit: { expectations: ["A fraction names equal parts of a whole"] }, ...o });
const failing = (r) => r.checks.filter((c) => !c.pass).map((c) => c.id);

test("whiteboard gate: a correct board passes and becomes the Brain's facts row", () => {
  const r = gateWhiteboard(S(GOOD_OPS), ctx());
  assert.deepEqual(failing(r), [], JSON.stringify(r.checks.filter((c) => !c.pass)));
  assert.equal(r.facts.archetype, "whiteboard");
  assert.ok(String(r.facts.onScreen.numbers ?? "").includes("1/4"));
});

test("whiteboard gate: each defect is caught by its check", () => {
  const swap = (id, patch) => GOOD_OPS.map((o) => (o.id === id ? { ...o, ...patch } : o));
  const cases = [
    ["W4.numbers_from_truth", swap("t1", { text: "7 equal parts" }), "a number she did not say"],
    ["W4.numbers_from_truth", [...GOOD_OPS, { id: "e", op: "numwork", at: [40, 40], layout: "column_add", rows: [["1", "2"], ["+", "1", "3"], ["2", "6"]], startMs: 6100, endMs: 6500 }], "a wrong sum"],
    ["W3.labels_anchored", swap("l1", { to: undefined }), "a label with no leader"],
    ["W3.labels_anchored", swap("l1", { to: [380, 20] }), "a leader pointing at nothing"],
    ["W7.register", swap("t1", { text: "cut it in four parts" }), "a sentence on the board"],
    ["W2.no_text_overlap", swap("t1", { at: [300, 66] }), "two texts on top of each other"],
    ["W1.fits_stage", swap("t1", { at: [395, 220] }), "text running off the board"],
    ["W5.words_from_line_or_kit", swap("t1", { text: "4 tasty pizzas" }), "words she never said"],
    ["W6.timing", swap("n1", { startMs: 9000, endMs: 14000 }), "drawing after her line ends"],
    ["W2.text_clear_of_lines", [...GOOD_OPS, { id: "ln", op: "line", from: [240, 214], to: [370, 214], startMs: 4700, endMs: 5000 }], "a line through a word"],
  ];
  for (const [check, ops, what] of cases) {
    const r = gateWhiteboard(S(ops), ctx());
    assert.ok(failing(r).includes(check), `${what}: expected ${check}, got ${failing(r).join(",") || "pass"}`);
  }
  const four = "0 se 1 tak 4 equal parts banayein; pehla point one-fourth hoga, chalo dekhte hain kaise.";
  const three = gateWhiteboard(S(GOOD_OPS.filter((o) => o.id !== "s4" && o.id !== "n1")), ctx({ reply: four }));
  assert.ok(failing(three).includes("W8.counts_match_line"), `3 parts where she said 4: got ${failing(three).join(",") || "pass"}`);
  assert.deepEqual(failing(gateWhiteboard(S(GOOD_OPS.filter((o) => o.id !== "n1")), ctx({ reply: four }))), [], "the 4-part board passes on that line");
  const named = gateWhiteboard(S(swap("t1", { text: "Riya 4 parts" })), ctx({ reply: `Riya, ${LINE}`, banned: ["Riya"] }));
  assert.ok(failing(named).includes("W7.register"), "the child's name is never written on the board");
  const cut = gateWhiteboard(S([GOOD_OPS[0], { id: "x1", op: "line", from: [40, 150], to: [200, 150], startMs: 1000, endMs: 1400 }, GOOD_OPS[5]]), ctx());
  assert.ok(failing(cut).includes("W8.counts_match_line"), "a circle cut by lines through its centre");
  assert.deepEqual(failing(gateWhiteboard({ v: 1, board: { w: 400, h: 300 }, ops: [{ id: "a", op: "blob", startMs: 0, endMs: 1 }] }, ctx())).slice(0, 1), ["W0.shape"]);
});

test("whiteboard numbers: digits, number words and fraction words she says; counts with partition words", () => {
  const n = numbersIn("Riya, 0 se 1 tak 4 equal gaps; pehla point one-fourth. 45,000 ko das se. aadha");
  for (const x of ["0", "1", "4", "1/4", "45000", "10", "1/2"]) assert.ok(n.has(x), x);
  assert.deepEqual([...partitionCounts("15 pencils ko 3 equal groups mein rakho: har group mein 5")], [3]);
  assert.deepEqual([...partitionCounts("aadha ko do barabar parts samjhiye; ek-tihai")].sort(), [2, 3]);
});

test("whiteboard planner: child-free prompt, layout fixers, one repair from the failing checks, a deadline, empty boards", async () => {
  assert.equal(redactLine("Riya, 0 se 1 tak 4 parts.", []), "0 se 1 tak 4 parts.");
  assert.equal(redactLine("Koi baat nahi, Riya. 4 parts.", ["Riya"]), "Koi baat nahi. 4 parts.");
  assert.deepEqual(clausesOf("ek, do. teen").map((c) => c.atMs), [0, 333, 667]);
  assert.deepEqual(expandOps([{ id: "a", op: "circle", t: [0, 500], c: [1, 2], r: 3, junk: 1 }]), [{ id: "a", op: "circle", startMs: 0, endMs: 500, c: [1, 2], r: 3 }]);
  const moved = fitOps([{ id: "t", op: "text", at: [396, 100], text: "far right", size: "m", startMs: 0, endMs: 1 }], { w: 400, h: 300 });
  assert.deepEqual(moved.fixes, ["fit:t"]);
  const compact = (ops) => ops.map(({ startMs, endMs, ...o }) => ({ ...o, t: [startMs, endMs] }));
  const sent = [];
  let call = 0;
  _setChat(async (_dep, msgs, o) => {
    sent.push(msgs.map((m) => m.content).join("\n"));
    assert.equal(o.quotaLane, "hot", "the live board is a hot call (W2-E patch w2e-plan-whiteboard-hot)");
    call++;
    // first answer writes a number she never said; the repair is told so and fixes it
    return { json: { ops: compact(call === 1 ? GOOD_OPS.map((x) => (x.id === "t1" ? { ...x, text: "9 parts" } : x)) : GOOD_OPS) }, usage: { prompt_tokens: 10, completion_tokens: 10 } };
  });
  const ask = { intent: { intentId: "L:wb:3", style: { band: "B3" } }, line: { lessonId: "L", teacherReplySeq: 7, text: `Riya, ${LINE}` }, mode: "fresh", kit: { topicId: "t", content: ["A fraction names equal parts of a whole"] } };
  const r = await planWhiteboard(ask, { redact: ["Riya"], budgetMs: 10_000 });
  assert.equal(r.ok, true, JSON.stringify(r.gate?.checks?.filter((c) => !c.pass)));
  assert.equal(r.attempts, 2);
  assert.match(sent[1], /W4\.numbers_from_truth/);
  for (const s of sent) assert.ok(!s.includes("Riya"), "the child's name never reaches the model");
  assert.equal(r.script.line.teacherReplySeq, 7);
  assert.equal(r.script.anchor, "line_audio_start");
  assert.equal(r.script.facts.archetype, "whiteboard");
  assert.ok(r.usd > 0, "the board's spend is counted (both rounds)");
  // nothing to draw → no board; a stalled model → the deadline, never a late board
  _setChat(async () => ({ json: { ops: [] } }));
  assert.equal((await planWhiteboard(ask)).empty, true);
  _setChat(() => new Promise(() => {}));
  const t0 = Date.now();
  const late = await planWhiteboard(ask, { budgetMs: 1800 });
  assert.equal(late.ok, false);
  assert.ok(Date.now() - t0 < 2500, "bounded by the budget");
  _setChat(null);
});

// ───────────────────────────── browser: goldens and mutants ─────────────────────────────

const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH;
const haveChromium = !!browsersDir && existsSync(browsersDir) && readdirSync(browsersDir).some((d) => d.startsWith("chromium"));
const SKIP = process.env.STUDIO_BROWSER === "0" ? "STUDIO_BROWSER=0" : !haveChromium ? "no Chromium under PLAYWRIGHT_BROWSERS_PATH" : false;
let browser;
before(async () => { if (!SKIP) browser = await (await import("playwright")).chromium.launch(); });
after(async () => { await browser?.close(); });

test("gate (browser): goldens pass at their params and at held-out params; seeded mutants are caught", { skip: SKIP, timeout: 240_000 }, async () => {
  const { runGate } = await import("../server/studio/qa/gate.js");
  const { MUTANTS } = await import("../evals/live-studio/mutants.mjs");
  const job = (id, html, which = "params") => ({ archetypeId: id, fragment: html, params: G[id][which], strings: G[id][`${which}Strings`] ?? G[id].strings, band: G[id].band, perf: false });
  for (const [id, which] of [["bar_chart_read", "params"], ["bar_chart_read", "alt"], ["sort_bins", "alt"]]) {
    const r = await runGate(browser, job(id, golden(id), which));
    assert.equal(r.pass, true, `${id} ${which}: ${JSON.stringify(r.checks.filter((c) => !c.pass))}`);
  }
  const pick = { bar_chart_read: ["bar_off_3px", "tick_wrong", "hint_colour", "names_overlap", "hardcoded_answer", "fetch_call", "no_done", "overflow"] };
  for (const [kind, ids] of Object.entries(pick)) for (const mid of ids) {
    const [, , edits] = MUTANTS[kind].find((m) => m[0] === mid);
    let html = golden(kind);
    for (const [f, rep] of edits) { assert.ok(html.includes(f), `${mid} applies`); html = html.split(f).join(rep); }
    const r = await runGate(browser, job(kind, html));
    assert.equal(r.pass, false, `${kind}/${mid} must be caught`);
  }
});

test("whiteboard continue mode: new words never land on the previous board's words (gate), and the fixer slides them off", () => {
  const prior = [{ id: "p1", op: "text", at: [300, 220], text: "4 equal parts", size: "m", startMs: 0, endMs: 500 }];
  const ops = [GOOD_OPS[0], { id: "n2", op: "text", at: [300, 222], text: "1/4", size: "m", startMs: 100, endMs: 600 }];
  const over = gateWhiteboard(S(ops, { mode: "continue" }), ctx({ prior }));
  assert.ok(failing(over).includes("W2.no_text_overlap"));
  const fixed = fitOps(ops, { w: 400, h: 300 }, 6, prior);
  assert.ok(fixed.fixes.includes("separate:n2"));
  assert.ok(!failing(gateWhiteboard(S(fixed.ops, { mode: "continue" }), ctx({ prior }))).includes("W2.no_text_overlap"));
});

// ───────────────────────────── W9: the board never answers the question she asks ─────────────────────────────

const ASK = "Ab tum batao, 3/8 aur 2/8 ko jodo, kitna hoga?";
const QKIT = {
  items: [
    { id: "i1", prompt_en: "Add 3/8 and 2/8.", prompt_hi: "3/8 aur 2/8 jodo.", answer: "5/8", acceptable: ["10/16"] },
    { id: "i2", prompt_en: "Add 245 and 132.", answer: "377" },
    { id: "i3", prompt_en: "Mark 7 on the number line from 0 to 10.", answer: "7" },
    { id: "i4", prompt_en: "What is the top number of a fraction called?", answer: "numerator" },
  ],
  workedExample: { problem: "1/5 + 2/5", steps: ["Same denominator: add the tops.", "1/5 + 2/5 = 3/5"], answer: "3/5" },
};
const qctx = (reply, itemId = "i1") => ({ reply, kit: QKIT, withhold: withheldValues(QKIT, { itemId, line: reply }) });
const T = (o) => ({ startMs: 300, endMs: 1200, ...o });

test("W9 no reveal: an equation, a column sum, a number-line target and a fraction result that answer an item are refused", () => {
  const cases = [
    ["equation result", [T({ id: "e", op: "text", at: [200, 150], text: "3/8 + 2/8 = 5/8", size: "m" })], ASK],
    ["equal fraction of the answer", [T({ id: "e", op: "numwork", at: [120, 150], layout: "equation", rows: [["3/8", "+", "2/8", "=", "10/16"]] })], ASK],
    ["column_add result", [T({ id: "c", op: "numwork", at: [150, 80], layout: "column_add", rows: [["2", "4", "5"], ["+", "1", "3", "2"], ["3", "7", "7"]] })], "245 aur 132 ko jodo, kitna aaya?"],
    ["fraction layout result", [T({ id: "f", op: "numwork", at: [120, 150], layout: "fraction", rows: [["3", "+", "2", "=", "5"], ["8", "", "8", "", "8"]] })], ASK],
    ["number-line tick at the answer", [T({ id: "n", op: "numwork", at: [80, 150], layout: "number_line", range: [0, 10], rows: [["0", "7", "10"]] })], "0 se 10 tak line hai, ab tum batao kahan aayega?"],
  ];
  for (const [what, ops, reply] of cases) {
    const r = gateWhiteboard(S(ops), qctx(reply, what.startsWith("column") ? "i2" : what.startsWith("number") ? "i3" : "i1"));
    assert.ok(failing(r).includes("W9.no_reveal"), `${what}: expected W9, got ${failing(r).join(",") || "pass"}`);
  }
  // a dot placed at the answer's position on the number line (no label) is a reveal too
  const nl = T({ id: "n", op: "numwork", at: [80, 150], layout: "number_line", range: [0, 10], rows: [["0", "10"]] });
  const g = gateWhiteboard(S([nl]), qctx("0 se 10 tak line, kahan aayega?", "i3"));
  assert.deepEqual(failing(g), [], JSON.stringify(g.checks.filter((c) => !c.pass)));
  const box = g.script.ops[0];
  const W = 160, x7 = box.at[0] + 12 + 0.7 * (W - 24);
  const dot = T({ id: "d", op: "circle", c: [x7, 150], r: 6, fill: "accent", startMs: 1300, endMs: 1600 });
  assert.ok(failing(gateWhiteboard(S([nl, dot]), qctx("0 se 10 tak line, kahan aayega?", "i3"))).includes("W9.no_reveal"), "a dot at 7");
  // the asked item's word answer, written on the board
  const word = gateWhiteboard(S([GOOD_OPS[0], T({ id: "l", op: "label", at: [300, 60], text: "numerator", to: [160, 110] })]),
    qctx("Fraction ka upar wala number kya kehlata hai?", "i4"));
  assert.ok(failing(word).includes("W9.no_reveal"), "the word answer of the asked item");
});

test("W9 no reveal: the worked example, the item's givens, an evenly spaced axis and a value she says herself all pass", () => {
  const we = "Dekho, 1/5 aur 2/5: same denominator, toh upar wale jodo, 3/5.";
  const r1 = gateWhiteboard(S([T({ id: "e", op: "text", at: [200, 150], text: "1/5 + 2/5 = 3/5", size: "m" })]), qctx(we));
  assert.ok(!failing(r1).includes("W9.no_reveal"), JSON.stringify(r1.checks.filter((c) => !c.pass)));
  const setup = gateWhiteboard(S([T({ id: "e", op: "text", at: [200, 150], text: "3/8 + 2/8 = ?", size: "m" })]), qctx(ASK));
  assert.ok(!failing(setup).includes("W9.no_reveal"), "the setup with an empty answer");
  const holder = gateWhiteboard(S([T({ id: "f", op: "numwork", at: [150, 150], layout: "fraction", rows: [["1"], ["?"]] }), T({ id: "t", op: "text", at: [200, 60], text: "1/__", size: "m" })]),
    qctx("Ek tukda, toh upar 1, neeche kitna?"));
  assert.deepEqual(failing(holder), [], "a placeholder is the setup's shape, not an invented number");
  const axis = gateWhiteboard(S([T({ id: "n", op: "numwork", at: [40, 150], layout: "number_line", range: [0, 10], rows: [["0", "2", "4", "6", "8", "10"]] })]), qctx("0 se 10 tak, do do ke kadam.", "i3"));
  assert.ok(!failing(axis).includes("W9.no_reveal"), "an axis is not a target");
  const said = "Haan, 3/8 aur 2/8 milke 5/8 hota hai.";
  const r2 = gateWhiteboard(S([T({ id: "e", op: "text", at: [200, 150], text: "3/8 + 2/8 = 5/8", size: "m" })]), qctx(said));
  assert.deepEqual(failing(r2), [], "she said it: the board only repeats her");
  // answers are never "allowed numbers" from the kit (W4) and the item's givens are never withheld
  assert.ok(!kitNumbers(QKIT).has("377"));
  assert.ok(kitNumbers(QKIT).has("3/5"), "the worked example stays");
  // the choices she reads out are hers to draw; unsaid, the answer stays withheld even though the prompt shows it
  assert.deepEqual(withheldValues({ items: [{ id: "c", prompt_en: "Which is bigger, 3/4 or 2/3?", answer: "3/4" }] }, { itemId: "c", line: "3/4 aur 2/3, kaun bada hai?" }).values, []);
  assert.deepEqual(withheldValues({ items: [{ id: "c", prompt_en: "Which is bigger, 3/4 or 2/3?", answer: "3/4" }] }, { itemId: "c", line: "kaun bada hai?" }).values, ["3/4"]);
});

test("whiteboard numbers: number words past twelve in both languages, and 'teen bata aath'", () => {
  const n = numbersIn("pachees aur twenty-five; chaubees hazaar; teen bata aath");
  for (const x of ["25", "24", "1000", "3/8"]) assert.ok(n.has(x), x);
  assert.ok(!n.has("50"), "never summed across aur");
  const r = gateWhiteboard(S([T({ id: "t", op: "text", at: [200, 150], text: "25", size: "l" })]), { reply: "Ek class mein pachees bachche hain." });
  assert.ok(!failing(r).includes("W4.numbers_from_truth"), JSON.stringify(r.checks.filter((c) => !c.pass)));
});

test("whiteboard timing: the line's duration counts what the voice says, not the digits", () => {
  assert.ok(speechMsOf("3/8 + 2/8 = 5/8") > Math.round(("3/8 + 2/8 = 5/8".length / 12) * 1000) * 2, "fractions are spoken as words");
  assert.ok(REPAIR_MIN_MS >= 3000);
});

test("pizza fixer: a circle cut by lines through its centre becomes N equal sectors when N is her count (shape, never truth)", () => {
  const c = { id: "p", op: "circle", c: [150, 150], r: 80, startMs: 0, endMs: 600 };
  const dia = (id, deg, t) => { const a = (deg * Math.PI) / 180; return { id, op: "line", from: [150 - 80 * Math.sin(a), 150 + 80 * Math.cos(a)], to: [150 + 80 * Math.sin(a), 150 - 80 * Math.cos(a)], startMs: t, endMs: t + 300 }; };
  const ops = [c, dia("a", 0, 700), dia("b", 45, 1000), dia("c", 90, 1300), dia("d", 135, 1600)];
  const fixes = [];
  const out = sectorsForCutCircles(ops, new Set([8]), fixes);
  assert.deepEqual(fixes, ["sectors:px8"]);
  assert.equal(out.filter((o) => o.op === "sector").length, 8);
  assert.equal(out.filter((o) => o.op === "line").length, 0);
  const line = "Pizza ko 8 barabar hisson mein kaato.";
  assert.deepEqual(failing(gateWhiteboard(S(out), { reply: line })).filter((x) => x.startsWith("W8")), []);
  assert.ok(failing(gateWhiteboard(S(ops), { reply: line })).includes("W8.counts_match_line"), "uncut by the fixer: refused");
  assert.equal(sectorsForCutCircles(ops, new Set([6]), []).length, ops.length, "N must be a count she said");
});

test("lanes: the hot whiteboard call is never queued, even on a shared pool whose background share is used up by builds", () => {
  let t = 0;
  const L = createLanes({ now: () => t, setTimer: () => 0, shared: ["taxila-fast"] });
  for (let i = 0; i < 3; i++) for (let k = 0; k < 20; k++) L.admit({ quotaLane: "background", deployment: "taxila-fast", kind: "chat_stream", estTokens: 20_000 });
  assert.ok(L.admit({ quotaLane: "background", deployment: "taxila-fast", kind: "chat" }) instanceof Promise, "background is saturated");
  for (let i = 0; i < 10; i++) assert.equal(L.admit({ quotaLane: "hot", deployment: "taxila-fast", kind: "chat" }), undefined, `whiteboard ${i + 1} goes at once`);
  assert.equal(L.caps["taxila-gpt6-luna"], 500_000);
});
