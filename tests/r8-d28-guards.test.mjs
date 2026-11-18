// d28 guards — the law: on a scripted turn what is said is the walk's authored parts, whole and in order. No guard path (the length
// guard, the leak guard, the screen-mismatch guard, the must-say repair, a shape fix, a rewrite, a replacement, a trim) drops, rewrites,
// rewords or reorders an authored part; the guards remove or replace only her own sentences.
//
// Live (director28a, 16 lessons, 1,380 model calls) two turns lost an authored point and the child was asked a quick question about
// something never said:
//   steady c5-t02 row 2  hook + quick question; the e1 point gone (guard: long)
//   steady c4 row 106    verdict + why + quick question; the s3 e2 point gone (guard: mustsay, leak, screenmismatch)
// One cause for both (brain/say.js, the scripted assembly's "hers" filter): the point rides in the body as ONE element, the authored
// set held only its sentences, and a draft that copied or reworded the point made the whole point "hers" (hersLoose: 70% of its words
// in one sentence of hers). Each case is walked here on the live run's own child lines (tests/fixtures/replay.mjs, planTurn) with a draft
// of that shape, and failed on the say.js before the fix.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { replay, rowsOf } from "./fixtures/replay.mjs";
import { textReply, replyDeps, authoredLostOf, restoreAuthored, holdAuthored } from "../server/brain/say.js";
import { chat, chatStream } from "../server/azure.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { setScriptForTest } from "../server/director/script.js";
import { lessonFlags, PENDING } from "../evals/hybrid-side-by-side/dry-predicates.mjs";
import { draftsFor, authoredLost, scriptSentenceKeys, authoredSentencesOf } from "../evals/hybrid-side-by-side/adversarial.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const RUN = "2026-11-17-director28a";
const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
// (d29 final: the guards are pinned on the pilots as director28 ran them — Learning 017 deleted the quick questions these rows were said with;
// the guards themselves read any script)
const scriptOf = (t) => { const sc = JSON.parse(readFileSync(join(ROOT, "tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-17-director28/scripts", `${t}.json`), "utf8")); delete sc.recordedRun; return sc; };
const FLAGS = ["TAXILA_R7_SCRIPT", "TAXILA_R7_SPLIT", "TAXILA_R7_SPLIT_CLOSE", "TAXILA_L2", "TAXILA_R7_SCRIPT_DIR", "TAXILA_STRICT_AUTHORED"];
const KEEP = {};
const on = () => { for (const k of FLAGS) { KEEP[k] = process.env[k]; delete process.env[k]; } setScriptForTest(); };
const off = () => { replyDeps.chat = chat; replyDeps.chatStream = chatStream; setScriptForTest(); for (const k of FLAGS) { if (KEEP[k] === undefined) delete process.env[k]; else process.env[k] = KEEP[k]; } };

/** Her line on the live run's teacher row `row` (0-based), walked on the run's child lines, from `draft`. */
async function lineAt(persona, T, row, draft) {
  setScriptForTest(T, scriptOf(T));
  const { kit, last } = await replay(RUN, persona, T, row + 1);
  replyDeps.chat = async () => ({ text: draft }); replyDeps.chatStream = replyDeps.chat;
  const state = last.state;
  const out = await textReply({ instructions: instructionsFor(state, kit), state, kit, childText: last.child, history: state.recent.slice(0, -1), ui: last.p.r.ui, module: null });
  return { out, state, t: norm(out.reply) };
}
const at = (t, x) => t.indexOf(norm(x));
/** Brain 044 T1/T5/T6 move today's live walk off the live run's rows: the teacher row (0-based) where the walk first reaches a state, on the
 *  run's child lines. */
async function rowWhere(persona, T, pred) {
  setScriptForTest(T, scriptOf(T));
  const { plans } = await replay(RUN, persona, T, 400);
  const p = plans.find((x) => pred(x.state));
  return p ? p.row : null;
}
/** steady c4's turn on a point after a right answer (live: row 106, the s3 e2 point; today's walk on the run's lines reaches s1 e2 so). */
const S3E2 = (st) => st.lastMove?.scriptBeat?.kind === "explain" && !!st.lastMove?.point && st.lastVerdict === "correct" && !st.lastMove?.splitTeach;
/** A point whose quick question's key the point itself says. */
const QUICK_IN_POINT = (st) => !!st.lastMove?.quick?.prompt && !!st.lastMove?.point && !st.lastMove?.splitClose;

describe("the two live losses, at their cause", () => {
  beforeEach(on); afterEach(off);

  test("steady c5-t02 row 2: a draft that copies the point's first sentence (and runs long) keeps the hook, the point whole, then the quick question", async () => {
    const T = "c5-maths-ch02-t02";
    const draft = "Socho, do bilkul ek jaisi roti. Ek ke 4 barabar hisse kiye, doosri ke 8. Aaj dekhenge ki kis roti ka ek hissa bada hota hai. Yeh patti ek poora hai: 4 barabar hisse, aur ek mein rang bhara hai. Dhyan se dekho, har hissa barabar hai aur rang sirf ek mein bhara hai, aur baaki teen hisse khaali hain, theek waise hi jaise roti ke tukde. Is patti mein kitne barabar hisse hain?";
    const { out, state, t } = await lineAt("steady", T, 2, draft);
    const lm = state.lastMove;
    assert.equal(lm.scriptBeat?.beatId, "e1", "the walk is on the e1 point, as live");
    assert.ok(lm.point && lm.quick?.prompt && lm.sayFirst?.length, "hook, point and quick question on this turn");
    assert.ok(out.guard.caught.includes("long"), `the length guard fired, as live: ${out.guard.caught}`);
    assert.ok(at(t, lm.point) >= 0, `the point is said whole: ${t}`);
    assert.ok(at(t, lm.sayFirst[0]) < at(t, lm.point) && at(t, lm.point) < at(t, lm.quick.prompt), `hook, point, quick question in order: ${t}`);
    assert.ok(out.guard.lineParts.some((p) => p.part === "body" && norm(p.text) === norm(lm.point)), "the point is its own body part (its page)");
    assert.equal(out.guard.authoredRestored, undefined, "kept at the cause, not restored by the net");
  });

  test("steady c4 row 106: her rewording of the point that states the card's key (the leak guard fires) keeps verdict, point whole, quick question", async () => {
    const T = "c4-maths-ch05-t01";
    // (the item on the table is the e2 card, key 1/4 — "In dono pizza mein bada tukda kaunsa fraction hai?"; her rewording said "har tukda
    // 1/4", the leak guard caught it on the draft, and the point went with her copy in the assembly, not with the leak)
    const row = await rowWhere("steady", T, S3E2);
    assert.ok(row, "the walk reaches a point after a right answer");
    // (her draft rewords the point — its sentences run together — and states the card's key, as live)
    const { kit, last } = await replay(RUN, "steady", T, row + 1);
    const item = (await import("../server/director/items.js")).findItem(last.state, kit, last.state.activeItemId ?? last.state.splitHold?.activeItemId);
    const draft = `Bilkul sahi! Dekho, ${norm(last.state.lastMove.point).replace(/[.!?]+\s*/g, ", ").replace(/,\s*$/, "")}, toh jawab ${item?.answer ?? ""} hai. ${last.p.r.ui?.ask?.text ?? last.state.lastMove.quick?.prompt ?? ""}`;
    const { out, state, t } = await lineAt("steady", T, row, draft);
    const lm = state.lastMove;
    assert.equal(state.lastVerdict, "correct", "the e1 card was answered right, as live");
    assert.ok(out.guard.caught.includes("leak"), `the leak guard fired on her rewording (the card's key 1/4): ${out.guard.caught}`);
    assert.ok(at(t, lm.point) > 0, `the point is said whole, after the verdict: ${t}`);
    // (Brain 044 T1: the point's quick question where the point and its card do not fit; its card where they do)
    const next = lm.quick?.prompt ?? (state.lastUi?.ask?.text ?? "");
    assert.ok(at(t, lm.point) < at(t, next), `the quick question or the card after its point: ${t}`);
    assert.equal(out.guard.authoredRestored, undefined, "kept at the cause, not restored by the net");
  });

  test("the quick question's own point is never a leak of that quick question: the point says the key 1/6 and is said", async () => {
    // (Brain 044 T1: a quick question is asked only where a point and its card do not fit — found where today's walk asks one)
    const row = await rowWhere("steady", "c4-maths-ch05-t01", QUICK_IN_POINT);
    assert.ok(row, "today's walk asks a quick question on the run's lines");
    const { last } = await replay(RUN, "steady", "c4-maths-ch05-t01", row + 1);
    const { t, state } = await lineAt("steady", "c4-maths-ch05-t01", row, `Bilkul sahi! ${last.state.lastMove.quick.prompt}`);
    assert.ok(at(t, state.lastMove.point) >= 0, t);
  });
});

describe("the net: the finished turn read against the turn's authored plan", () => {
  const plan = [{ part: "close", text: "Socho, do roti." }, { part: "body", text: "Yeh patti ek poora hai: 4 hisse. Woh ek hissa 1/4 hai." }, { part: "quick", text: "Is patti mein kitne hisse hain?" }];
  test("authoredLostOf: a part not said whole (a sentence missing, or reworded) and parts out of order", () => {
    assert.deepEqual(authoredLostOf("Socho, do roti. Yeh patti ek poora hai: 4 hisse. Woh ek hissa 1/4 hai. Is patti mein kitne hisse hain?", plan), { missing: [], order: true });
    assert.deepEqual(authoredLostOf("Socho, do roti. Is patti mein kitne hisse hain?", plan).missing, [1]);
    assert.deepEqual(authoredLostOf("Socho, do roti. Yeh patti ek poora hai: 4 hisse. Is patti mein kitne hisse hain?", plan).missing, [1], "half a point is a lost point");
    assert.deepEqual(authoredLostOf("Socho, do roti. Yeh patti poori hai: 4 hisse. Woh ek hissa 1/4 hai. Is patti mein kitne hisse hain?", plan).missing, [1], "a reworded sentence is a lost point");
    assert.equal(authoredLostOf("Yeh patti ek poora hai: 4 hisse. Woh ek hissa 1/4 hai. Socho, do roti. Is patti mein kitne hisse hain?", plan).order, false);
  });
  test("restoreAuthored: the lost part goes back in its place, with its own line part", () => {
    const lp = [{ part: "close", text: "Socho, do roti." }, { part: "quick", text: "Is patti mein kitne hisse hain?" }];
    const r = restoreAuthored("Socho, do roti. Is patti mein kitne hisse hain?", plan, [1], lp);
    assert.equal(r.reply, "Socho, do roti. Yeh patti ek poora hai: 4 hisse. Woh ek hissa 1/4 hai. Is patti mein kitne hisse hain?");
    assert.deepEqual(r.lineParts.map((p) => p.part), ["close", "body", "quick"]);
    assert.equal(r.lineParts[1].text, plan[1].text);
  });
  test("holdAuthored: under tests (strict) a lost part throws; in production it is restored and named", () => {
    const out = { reply: "Socho, do roti. Is patti mein kitne hisse hain?", guard: { lineParts: [{ part: "close", text: "Socho, do roti." }, { part: "quick", text: "Is patti mein kitne hisse hain?" }] } };
    // the strict reading is set here, not taken from the runner: the leak check runs many files in one process, where
    // NODE_TEST_CONTEXT is not set (integration 82's leak check failed on exactly this)
    const ctx = process.env.NODE_TEST_CONTEXT, strict = process.env.TAXILA_STRICT_AUTHORED;
    process.env.TAXILA_STRICT_AUTHORED = "1";
    try { assert.throws(() => holdAuthored(out, {}, plan), /authored part lost on a scripted turn/); }
    finally { if (strict === undefined) delete process.env.TAXILA_STRICT_AUTHORED; else process.env.TAXILA_STRICT_AUTHORED = strict; }
    delete process.env.NODE_TEST_CONTEXT;
    delete process.env.TAXILA_STRICT_AUTHORED;
    const warn = console.warn; console.warn = () => {};
    try {
      const r = holdAuthored(out, {}, plan);
      assert.equal(norm(r.reply), "Socho, do roti. Yeh patti ek poora hai: 4 hisse. Woh ek hissa 1/4 hai. Is patti mein kitne hisse hain?");
      assert.deepEqual(r.guard.authoredRestored, ["body"]);
      assert.deepEqual(r.guard.lineParts.map((p) => p.part), ["close", "body", "quick"]);
    } finally { console.warn = warn; if (ctx !== undefined) process.env.NODE_TEST_CONTEXT = ctx; if (strict !== undefined) process.env.TAXILA_STRICT_AUTHORED = strict; }
    assert.equal(holdAuthored(out, {}, []), out, "a turn with no plan (a safety turn, an early path) passes through");
  });
});

describe("the adversarial drafts, through the live reply path on the two live turns", () => {
  beforeEach(on); afterEach(off);
  for (const [T, row0] of [["c5-maths-ch02-t02", 2], ["c4-maths-ch05-t01", 106]]) {
    test(`${T} row ${row0}: every adversarial draft keeps what the stub's turn said of the script, whole and in order`, async () => {
      // (Brain 044: c4's live row 106 is where today's walk reaches the s3 e2 point after a right answer)
      const row = T === "c4-maths-ch05-t01" ? await rowWhere("steady", T, S3E2) : row0;
      const keys = scriptSentenceKeys(scriptOf(T));
      const base = await lineAt("steady", T, row, "Achha, chalo isko saath mein dekhte hain. Ek baar phir se batao?");
      const expected = authoredSentencesOf(base.t, keys);
      assert.ok(expected.length >= 3, `the stub's turn says the point: ${base.t}`);
      const { kit, last } = await replay(RUN, "steady", T, row + 1);
      const item = last.state.activeItemId ? (await import("../server/director/items.js")).findItem(last.state, kit, last.state.activeItemId) : null;
      for (const [kind, draft] of Object.entries(draftsFor(last.state, last.p.r.ui, item))) {
        const { t } = await lineAt("steady", T, row, draft);
        const l = authoredLost(expected, t);
        assert.deepEqual(l, { missing: [], order: true }, `${kind}: ${t}`);
      }
    });
  }
});

describe("quickPoint: the live predicate", () => {
  test("reads the two live rows (and only them) on director28a's two lessons", () => {
    const flags = [];
    for (const [p, T] of [["steady", "c5-maths-ch02-t02"], ["steady", "c4-maths-ch05-t01"]]) {
      for (const x of lessonFlags({ rows: rowsOf(RUN, p, T), script: scriptOf(T) }).filter((y) => y.predicate === "quickPoint")) flags.push(`${p}-${T} ${x.row}`);
    }
    assert.deepEqual(flags, ["steady-c5-maths-ch02-t02 2", "steady-c4-maths-ch05-t01 106"]);
    assert.ok(!PENDING.has("quickPoint"), "gated");
  });
  test("a quick question re-asked after its point was said, or one whose words another beat shares, is not read", () => {
    const script = scriptOf("c5-maths-ch02-t02");
    const b = script.skills[0].explain[0];
    const Tt = (text) => ({ who: "teacher", text });
    const said = [Tt(`${b.point.hi} ${b.quick.prompt.hi}`), { who: "child", text: "phir se bolo" }, Tt(b.quick.prompt.hi)];
    assert.deepEqual(lessonFlags({ rows: said, script }).filter((y) => y.predicate === "quickPoint"), []);
    assert.deepEqual(lessonFlags({ rows: [Tt(b.quick.prompt.hi)], script }).filter((y) => y.predicate === "quickPoint").map((y) => y.row), [0]);
  });
});

// The class, closed on the four pilot lessons: the dry harness walks each pilot topic with the steady child (to the end of the script),
// and on every scripted turn feeds the live reply path an overlong draft, one that states the quick question's and the card's keys and
// contradicts the screen, one with two questions of hers, her one-sentence paraphrase of the parts, a flat one and an empty one. Each
// must say every authored sentence the stub's turn said, whole and in order (evals/hybrid-side-by-side/adversarial.mjs); the harness runs
// with TAXILA_STRICT_AUTHORED, so a lost part is also a thrown error there. On the say.js before the fix 8 rows lost a point.
test("the adversarial matrix: the four pilots, every scripted turn, six drafts each — no authored part lost", { timeout: 150_000 }, () => {
  const out = mkdtempSync(join(tmpdir(), "taxila-adv-"));
  try {
    const env = { ...process.env, DATABASE_URL: "", DATABASE_URL_DIRECT: "", TAXILA_DB: "" };
    delete env.NODE_TEST_CONTEXT;
    execFileSync(process.execPath, [join(ROOT, "evals/hybrid-side-by-side.mjs"), "--matrix", "--director-only", "--reactive", "--scenario", "steady", "--topics",
      "c4-maths-ch05-t01,c5-maths-ch02-t01,c5-maths-ch02-t02,c6-maths-ch06-t01", "--dry", "--adversarial", "--out", out],
      { cwd: ROOT, env, stdio: ["ignore", "ignore", "pipe"], timeout: 140_000, maxBuffer: 64 * 1024 * 1024 });
    const files = readdirSync(out).filter((f) => f.endsWith(".json") && f !== "meter.json");
    assert.equal(files.length, 4, `4 lessons written (${files.join(", ")})`);
    const lost = [];
    let probed = 0;
    for (const f of files) {
      const j = JSON.parse(readFileSync(join(out, f), "utf8"));
      probed += j.director.filter((r) => r.who === "teacher" && r.beat).length;
      j.director.forEach((r, i) => { for (const a of r.adversarial ?? []) lost.push(`${f} ${i} ${a.kind}: ${a.error ?? `missing ${JSON.stringify(a.missing)}${a.order ? "" : ", out of order"}`} | ${a.said}`); });
    }
    assert.ok(probed >= 150, `the steady walks reached the scripts' turns (${probed})`);
    assert.deepEqual(lost, []);
  } finally { rmSync(out, { recursive: true, force: true }); }
});
