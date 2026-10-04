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
import { gateWhiteboard, numbersIn, partitionCounts } from "../server/studio/qa/whiteboard.js";
import { stateGraph } from "../server/studio/qa/gate.js";
import { planWhiteboard, _setChat, redactLine, fitOps, expandOps, clausesOf } from "../server/studio/plan.js";
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
    assert.equal(o.quotaLane, "background");
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
