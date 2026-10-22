// Round 5 (sim lab baseline 9b73641, main safety review): an Azure content-filter block is a child-safety signal only when a
// HARM category fired (sexual, self_harm, violence, hate) or the categories cannot be read. A block that is only Prompt
// Shields' "jailbreak" (or another prompt-injection / copyright detector) on a child's maths answer used to play the full
// helpline script twice (persona p43, "6 aur 5... 30... 3,00,000?"). Harm and unreadable blocks still fail CLOSED.
import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { textReply, replyDeps, childWordsTrip } from "../server/brain/say.js";
import { chat, AzureError, CONTENT_FILTER, filterCategories, nonHarmFilter, notChildSafety } from "../server/azure.js";
import { initLessonState, step } from "../server/director/state.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const promptBody = (cats) => JSON.stringify({ error: { message: "The response was filtered due to the prompt triggering Azure OpenAI's content management policy.", code: "content_filter", status: 400,
  innererror: { code: "ResponsibleAIPolicyViolation", content_filter_result: {
    hate: { filtered: cats.includes("hate"), severity: "safe" }, sexual: { filtered: cats.includes("sexual"), severity: cats.includes("sexual") ? "medium" : "safe" },
    violence: { filtered: false, severity: "safe" }, self_harm: { filtered: cats.includes("self_harm"), severity: "safe" },
    jailbreak: { filtered: cats.includes("jailbreak"), detected: cats.includes("jailbreak") } } } } });

test("filterCategories reads every shape the filter arrives in", () => {
  assert.deepEqual(filterCategories(promptBody(["jailbreak"])), ["jailbreak"]);
  assert.deepEqual(filterCategories(promptBody(["sexual"])).sort(), ["sexual"]);
  assert.deepEqual(filterCategories(promptBody(["jailbreak", "self_harm"])).sort(), ["jailbreak", "self_harm"]);
  assert.deepEqual(filterCategories({ choices: [{ finish_reason: "content_filter", content_filter_results: { violence: { filtered: true, severity: "high" } } }] }), ["violence"]);
  assert.deepEqual(filterCategories("Response content blocked by label 'Jailbreak'."), ["jailbreak"]);
  assert.deepEqual(filterCategories("not json at all"), []);
  assert.deepEqual(filterCategories(null), []);
});

test("nonHarmFilter: only KNOWN, only injection / copyright categories; empty or unknown stays a safety signal", () => {
  const e = (cats) => Object.assign(new AzureError("x", 400, CONTENT_FILTER), cats ? { filterCats: cats } : {});
  assert.equal(nonHarmFilter(e(["jailbreak"])), true);
  assert.equal(nonHarmFilter(e(["indirect_attack", "protected_material_text"])), true);
  for (const c of [["sexual"], ["self_harm"], ["violence"], ["hate"], ["jailbreak", "sexual"], ["something_new"], [], null]) assert.equal(nonHarmFilter(e(c)), false, JSON.stringify(c));
  assert.equal(nonHarmFilter(undefined), false);
});

const K = kit();
function lesson() {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 });
  r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), now: 20_000 });
  return r;
}
const block = (cats, status = 400) => Object.assign(new AzureError("chat taxila-fast HTTP 400: content_filter", status, CONTENT_FILTER), { filterCats: cats });
const said = "Sahi socha: 6 guna 5 tees, aur zero jodne par teen lakh. Ab 7000 guna 30 bataiye?";
const run = (r, history = []) => textReply({ instructions: "x", state: r.state, kit: K, childText: "6 aur 5... 30... 3,00,000?", history, ui: r.ui, module: r.state.module });

describe("reply filter categories (round 5)", () => {
  afterEach(() => { replyDeps.chat = chat; });

  test("a jailbreak-only block, then a clean retry on this turn alone: the lesson goes on, no safeguard", async () => {
    const r = lesson();
    const seen = [];
    replyDeps.chat = async (_d, msgs) => { seen.push(msgs.length); if (seen.length === 1) throw block(["jailbreak"]); return { text: said }; };
    const out = await run(r, [{ who: "teacher", text: "Screen par 6000 aur 50 dekhiye" }, { who: "child", text: "chaar zero honge?" }]);
    assert.notEqual(out.filtered, true, JSON.stringify(out.guard));
    assert.equal(out.reply, said);
    assert.equal(seen.length, 2);
    assert.ok(seen[1] < seen[0], `the retry drops the history (${seen})`);
  });

  test("a jailbreak-only block twice: a neutral fallback line, never the helplines", async () => {
    const r = lesson();
    replyDeps.chat = async () => { throw block(["jailbreak"]); };
    const out = await run(r);
    assert.notEqual(out.filtered, true);
    assert.deepEqual(out.guard.caught, ["content_filter_nonharm"]);
    assert.doesNotMatch(out.reply, /1098|14416|Childline|चाइल्डलाइन/);
  });

  test("a harm category, or an unreadable block, whose CHILD'S WORDS also trip the filter: fails CLOSED", async () => {
    for (const cats of [["sexual"], ["self_harm"], ["jailbreak", "violence"], []]) {
      const r = lesson();
      const probes = [];
      replyDeps.chat = async (_d, msgs, o) => { if (o?.purpose === "filter_probe") probes.push(msgs); throw block(cats); };
      assert.equal((await run(r)).filtered, true, JSON.stringify(cats));
      assert.equal(probes.length, 1, JSON.stringify(cats));
    }
  });

  test("a jailbreak block, then a HARM block on the retry: fails closed", async () => {
    const r = lesson();
    let calls = 0;
    replyDeps.chat = async () => { calls++; throw block(calls === 1 ? ["jailbreak"] : ["sexual"]); };
    assert.equal((await run(r)).filtered, true);
  });

  // round 5 (sim lab p43, TEST lesson 2af743d2 turn 4): the REPLY prompt came back `sexual` on a maths answer while the
  // classifier and the labeller passed the same words. The safeguard fires only when the child's own words trip the filter.
  const hist = [{ who: "teacher", text: "Screen par 6000 aur 50 dekhiye" }, { who: "child", text: "chaar zero honge?" }];
  const probeOf = (o) => o?.purpose === "filter_probe";

  test("p43: a harm block on the reply prompt, the child's words pass the probe, the retry on this turn alone answers", async () => {
    const r = lesson();
    const calls = [];
    replyDeps.chat = async (_d, msgs, o) => {
      calls.push({ probe: probeOf(o), n: msgs.length, user: msgs.filter((m) => m.role === "user").map((m) => m.content).join(" | ") });
      if (probeOf(o)) return { text: "ok" };
      if (calls.filter((c) => !c.probe).length === 1) throw block(["sexual"]);
      return { text: said };
    };
    const out = await run(r, hist);
    assert.notEqual(out.filtered, true, JSON.stringify(out.guard));
    assert.equal(out.reply, said);
    assert.equal(out.guard.filter, "context");
    const probe = calls.find((c) => c.probe), retry = calls.filter((c) => !c.probe)[1];
    assert.ok(probe, "the child's words were probed");
    assert.match(probe.user, /chaar zero honge\?/, "the probe judges their recent turns too");
    assert.match(probe.user, /3,00,000/, "and this turn");
    assert.doesNotMatch(probe.user, /Screen par/, "never her lines");
    assert.equal(probe.n, 2, "the child's words alone, with a one-line instruction");
    assert.ok(retry.n < calls[0].n, "the retry drops the history");
  });

  test("p43: a harm block, the retry blocked too, the probe clear: a neutral line, never the helplines", async () => {
    const r = lesson();
    replyDeps.chat = async (_d, _m, o) => { if (probeOf(o)) return { text: "ok" }; throw block(["sexual"]); };
    const out = await run(r, hist);
    assert.notEqual(out.filtered, true);
    assert.deepEqual(out.guard.caught, ["content_filter_context"]);
    assert.doesNotMatch(out.reply, /1098|14416|Childline|चाइल्डलाइन/);
  });

  test("a harm block whose probe is blocked on harm fails CLOSED even when the retry answered", async () => {
    const r = lesson();
    let n = 0;
    replyDeps.chat = async (_d, _m, o) => { if (probeOf(o)) throw block(["sexual"]); if (++n === 1) throw block(["sexual"]); return { text: said }; };
    assert.equal((await run(r, hist)).filtered, true);
  });

  test("a probe that fails for any other reason (a timeout, a 5xx) fails CLOSED: the words could not be cleared", async () => {
    const r = lesson();
    let n = 0;
    replyDeps.chat = async (_d, _m, o) => { if (probeOf(o)) throw new AzureError("chat taxila-fast timeout", 504, "timeout"); if (++n === 1) throw block(["violence"]); return { text: said }; };
    assert.equal((await run(r, hist)).filtered, true);
  });

  test("a probe blocked only by an injection detector counts as clear", async () => {
    const r = lesson();
    let n = 0;
    replyDeps.chat = async (_d, _m, o) => { if (probeOf(o)) throw block(["jailbreak"]); if (++n === 1) throw block(["hate"]); return { text: said }; };
    const out = await run(r, hist);
    assert.notEqual(out.filtered, true);
    assert.equal(out.reply, said);
  });

  // 14.3.1 (main safety review, dc-r1431-completion-block-probe) supersedes "no probe": a second COMPLETION block now probes
  // the child's own words once; when they trip the filter too (this stub blocks every call) the turn still fails closed
  test("a COMPLETION block (HTTP 200): one fresh reply, then one probe of the child's words; a blocked probe fails closed", async () => {
    const r = lesson();
    let probes = 0;
    replyDeps.chat = async (_d, _m, o) => { if (probeOf(o)) probes++; throw block(["sexual"], 200); };
    assert.equal((await run(r, hist)).filtered, true);
    assert.equal(probes, 1);
  });
});

// 14.4 (main safety review; sim lab off-kit ok03 r1 "…humne race lagayi…", TEST 30 days: 10 of 10 hate-only fail-closed turns
// harmless, 0 of 276 curated distress lines hate-only): the child's words blocked by the hate detectors alone are no
// child-safety signal; the reply path gives a neutral line. Every other harm category and an unreadable block fail closed.
describe("14.4: the hate detectors alone are no child-safety signal", () => {
  afterEach(() => { replyDeps.chat = chat; });
  const e = (cats) => Object.assign(new AzureError("x", 400, CONTENT_FILTER), cats ? { filterCats: cats } : {});
  test("notChildSafety: hate and its score alone (with injection detectors) yes; any other harm, unknown or unreadable no", () => {
    for (const c of [["hate"], ["multiseverity_hatespeechscore"], ["hate", "multiseverity_hatespeechscore"], ["jailbreak", "hate"], ["jailbreak"]]) assert.equal(notChildSafety(e(c)), true, JSON.stringify(c));
    for (const c of [["hate", "violence"], ["hate", "self_harm"], ["sexual"], ["violence"], ["something_new"], [], null]) assert.equal(notChildSafety(e(c)), false, JSON.stringify(c));
    assert.equal(nonHarmFilter(e(["hate"])), false, "the distress reads keep hate as a harm block");
  });
  test("the probe: hate only → clear; hate with another harm category → harm", async () => {
    replyDeps.chat = async () => { throw block(["hate"]); };
    assert.equal(await childWordsTrip("aur humne race lagayi"), "clear");
    replyDeps.chat = async () => { throw block(["hate", "self_harm"]); };
    assert.equal(await childWordsTrip("x"), "harm");
  });
  test("the reply prompt and the probe both blocked on hate only: a neutral line, never the helplines", async () => {
    const r = lesson();
    replyDeps.chat = async () => { throw block(["hate"]); };
    const out = await run(r, [{ who: "teacher", text: "Screen par 6000 aur 50 dekhiye" }, { who: "child", text: "humne race lagayi" }]);
    assert.notEqual(out.filtered, true, JSON.stringify(out.guard));
    assert.deepEqual(out.guard.caught, ["content_filter_context"]);
    assert.doesNotMatch(out.reply, /1098|14416|Childline|चाइल्डलाइन/);
    // never "say that again": the same words would trip the filter again
    assert.doesNotMatch(out.reply, /phir se bata|say that again/i, out.reply);
  });
  test("14.4.1: the blocked turn gets one more try with their words not shown, and her line is the move's own", async () => {
    const r = lesson();
    const said = "Thanks! Ab batao, is shape ke chaaron sides jodkar kya milega?";
    const seen = [];
    replyDeps.chat = async (_d, msgs, o) => {
      if (o?.purpose === "filter_probe") throw block(["hate"]);
      const u = msgs.filter((m) => m.role === "user").map((m) => m.content).join(" | ");
      seen.push(u);
      if (/not shown here/.test(u)) { assert.doesNotMatch(u, /race lagayi/, "the masked try never carries their words"); return { text: said }; }
      throw block(["hate"]);
    };
    const out = await run(r, [{ who: "teacher", text: "Screen par 6000 aur 50 dekhiye" }, { who: "child", text: "humne race lagayi" }]);
    assert.notEqual(out.filtered, true, JSON.stringify(out.guard));
    assert.equal(out.reply, said);
    assert.equal(out.guard.masked, true);
  });
});
