// dc-r7-script-walk-v6-3 (main's director11 judgement, four hand judges): each fix is a PREDICATE pinned on director11's own rows,
// replayed through turn.js planTurn (tests/fixtures/replay.mjs) and textReply with the run's own v2.3 scripts and her own words.
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { replay, runScriptOf } from "./fixtures/replay.mjs";
import { textReply, replyDeps } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { setScriptForTest } from "../server/director/script.js";
import { step, scriptKeyOf } from "../server/director/state.js";
import { findItem } from "../server/director/items.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";

/** T1′: the closes a turn says — a right answer's verdict with its why, a give-up / worked answer, a carried close of another card. */
export function closesOf(reply) {
  const s = String(reply ?? "");
  const out = [];
  if (/^(?:haan|bilkul|sahi|shabaash|yes|right|correct)\b[^.!?]*\bkyunki\b/i.test(s)) out.push("verdict+why");
  if (/\btoh poora jawab\b|\bso the full answer\b/i.test(s)) out.push("worked");
  if (/\bis sawaal ka (?:sahi )?jawab\b|\bthis question'?s answer\b/i.test(s)) out.push("gave");
  if (/\bpehle wale sawaal ka (?:sahi )?jawab\b|\bthe earlier question'?s\b/i.test(s)) out.push("carried");
  return out;
}

describe("r7-brain-v63.test.mjs", () => {
  const RUN = "2026-11-08-director11";
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; setScriptForTest(); });
  afterEach(() => { replyDeps.chat = chat; setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });
  const TOPIC = { c4: "c4-maths-ch05-t01", "c5-t01": "c5-maths-ch02-t01", "c5-t02": "c5-maths-ch02-t02", c6: "c6-maths-ch06-t01" };
  /** The judges' "T<n>", checked per judge on the rows they quote: c4 and c6 count the run's rows from 0 (row n); c5-t01 counts
   *  her turns from 1 (row 2(n-1): stuck T22 = T23 is rows 42 = 44); c5-t02 counts the rows from 1 (row n-1: steady T17 is row 16,
   *  the two-close "Aur pehle wale sawaal ka jawab 1/4 tha"). */
  const kitOf = (topic) => kitFromFile(getTopic(TOPIC[topic]));
  const rowOf = (topic, n) => (topic === "c5-t01" ? 2 * (n - 1) : topic === "c5-t02" ? n - 1 : n);
  const at = async (persona, topic, t) => {
    const T = TOPIC[topic];
    const n = rowOf(topic, t);
    setScriptForTest(T, runScriptOf(RUN, T));
    const { kit, rows, last } = await replay(RUN, persona, T, n + 1);
    replyDeps.chat = async () => ({ text: rows[n].text });
    const out = await textReply({ instructions: instructionsFor(last.state, kit), state: last.state, kit, childText: last.child, history: [], ui: last.p.r.ui, module: null });
    return { out, rows, last, n };
  };

  const T1_ROWS = [["steady", "c6", 20], ["steady", "c6", 32], ["stuck", "c6", 52], ["offtopic", "c6", 28], ["steering", "c6", 12], ["steering", "c6", 32],
    ["steady", "c4", 24], ["stuck", "c4", 14], ["stuck", "c4", 54], ["offtopic", "c4", 12], ["offtopic", "c4", 20], ["steering", "c4", 30],
    ["steady", "c5-t01", 24], ["stuck", "c5-t01", 24], ["offtopic", "c5-t01", 15], ["steering", "c5-t01", 10],
    ["steady", "c5-t02", 17], ["stuck", "c5-t02", 15], ["offtopic", "c5-t02", 11]];
  test("T1′ predicate: one close at most, and never a close of a card other than the one just answered (judges' 19 rows)", async () => {
    const bad = [];
    for (const [persona, topic, t] of T1_ROWS) {
      const { out, rows, n, last } = await at(persona, topic, t);
      const was = closesOf(rows[n].text), now = closesOf(out.reply);
      if (now.length > 1 || now.includes("carried")) bad.push(`${persona} ${topic} T${t}: ${now.join("+")} (run: ${was.join("+")}) | ${out.reply.slice(0, 160)}`);
      // (a close of a card not answered in their last turn: a worked close on a why-probe's answer; a closed card's key said again)
      const b = last.before;
      if (now.includes("worked") && b.pendingWhy && b.pendingWhy === b.activeItemId) bad.push(`${persona} ${topic} T${t}: worked close on a probe answer | ${out.reply.slice(0, 120)}`);
      const keys = [...(b.itemsDone ?? []), ...(b.skipped ?? [])].filter((id) => String(id).startsWith("script:") && id !== b.activeItemId).map((id) => scriptKeyOf(kitOf(topic), id)).filter((a) => a != null && /\d/.test(String(a)));
      // (in the parts said ON the card — its reminder and its simpler — never in the just-answered card's own close)
      const lm = last.state.lastMove ?? {};
      const onCard = [lm.cardPoint, lm.simpler].filter(Boolean).join(" ");
      const said = keys.filter((k) => new RegExp(`(?<![\\d/])${String(k).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\d/])`).test(onCard) && out.reply.includes(onCard.split(/(?<=[.!?])\s/)[0]));
      if (now.includes("worked") && !/:ask:worked$/.test(String(b.activeItemId ?? ""))) bad.push(`${persona} ${topic} T${t}: worked close on another card's turn | ${out.reply.slice(0, 120)}`);
      if (said.length) bad.push(`${persona} ${topic} T${t}: a closed card's key said again (${said.join(", ")}) | ${out.reply.slice(0, 160)}`);
    }
    assert.deepEqual(bad, []);
  });
  /** H2′: every return of an aside in one replayed lesson that breaks the rules (park said first; at the promised point, once the
   *  promised card is closed; never mid-card, mid-hint, mid-remediation or mid-worked; a content word of their aside; no canned fact). */
  const STOPW = new Set(["maine", "mujhe", "mera", "meri", "mere", "hai", "hain", "tha", "thi", "kal", "aaj", "bahut", "pasand", "kiya", "khela", "aur", "lekin", "kya", "with", "that", "this", "have"]);
  const contentWords = (t) => (String(t ?? "").toLowerCase().match(/\p{L}{4,}/gu) ?? []).filter((w) => !STOPW.has(w));
  async function asideFaults(persona, topic) {
    const T = TOPIC[topic];
    setScriptForTest(T, runScriptOf(RUN, T));
    const { kit, rows, plans } = await replay(RUN, persona, T, 1e9);
    const said = {};
    const bad = [];
    for (const pl of plans) {
      const n = pl.row - 1;
      if (!rows[n]) continue;
      replyDeps.chat = async () => ({ text: rows[n].text });
      const out = await textReply({ instructions: instructionsFor(pl.state, kit), state: pl.state, kit, childText: pl.child, history: [], ui: pl.p.r.ui, module: null });
      said[pl.state.turn] = out.reply;
      if (/^\p{L}+: (?:iski baat|pakka)/iu.test(out.reply)) bad.push(`T${n} raw park template | ${out.reply.slice(0, 80)}`);
      if (/Cricket mein ek over mein chhe ball|Virat Kohli India ke liye batting karte hain/i.test(out.reply)) bad.push(`T${n} canned fact | ${out.reply.slice(0, 120)}`);
      const ret = pl.state.lastMove?.returned;
      if (!ret) continue;
      const e = (pl.state.later ?? []).find((x) => x.servedAt === pl.state.turn && x.share);
      if (!e) continue;
      const why = [];
      if (!said[e.at] || !contentWords(e.topic).some((w) => said[e.at].toLowerCase().includes(w))) why.push("no park said");
      const live = pl.state.activeItemId ?? null, was = pl.before.activeItemId ?? null;
      if (!e.onItem) why.push("no promised card");
      else if (live === e.onItem || String(live ?? "").includes(":then:") && was === e.onItem) why.push("promised card not closed");
      if (live && live === was) why.push("mid-card");
      if (String(live ?? "").includes(":then:")) why.push("mid-remediation");
      if (/^worked:/.test(pl.state.lastMove?.scriptBeat?.beatId ?? "")) why.push("mid-worked");
      if (pl.state.lastMove?.request) why.push("request turn");
      // (a content word of their aside, said in the return itself: not only in its "Aur X ki baat:" lead)
      const body = out.reply.replace(/\b(?:aur|and about)\s+\p{L}+\s+(?:ki baat)?:/giu, " ").toLowerCase();
      if (!contentWords(e.said).some((w) => body.includes(w))) why.push("no word of theirs");
      if (why.length) bad.push(`T${n} ${why.join(", ")} | ${out.reply.slice(0, 120)}`);
    }
    return bad;
  }
  for (const persona of ["offtopic", "steering", "steady", "stuck"]) for (const topic of Object.keys(TOPIC)) {
    test(`H2′ predicate: asides parked and returned at the promised point, in their words (${persona} ${topic})`, async () => {
      assert.deepEqual(await asideFaults(persona, topic), []);
    });
  }
  test("H2′: an aside still unreturned when the lesson closes is returned to at the close, in their words (steering c5-t01: cricket, open at the end)", async () => {
    const T = TOPIC["c5-t01"];
    setScriptForTest(T, runScriptOf(RUN, T));
    const { kit, plans } = await replay(RUN, "steering", T, 1e9);
    const s0 = plans.at(-1).state;
    assert.ok((s0.later ?? []).some((e) => e.share && e.servedAt == null && e.topic === "cricket"), "open at the end of the run");
    const s1 = { ...s0, ctx: { ...s0.ctx, lessonBrief: { ...(s0.ctx.lessonBrief ?? {}), hardStopAt: new Date(0).toISOString() } } };
    const r = step(s1, { event: "turn", kit, cls: { outcome: "no_evidence", confidence: 0.9, flags: {} }, text: "haan", now: 10_000_000 });
    assert.equal(r.move.returned?.topic, "cricket", JSON.stringify(r.move).slice(0, 300));
    assert.match(r.move.returned.line ?? "", /tumhe cricket pasand hai/);
  });
  const H1_ROWS = [["steady", "c5-t02", 33], ["stuck", "c5-t02", 49], ["steering", "c5-t02", 45], ["offtopic", "c5-t02", 55],
    ["stuck", "c4", 48], ["stuck", "c4", 58], ["stuck", "c6", 42], ["steering", "c6", 42]];
  test("H1′ predicate: only the live card's simpler, and only once it has been posed (judges' 8 rows)", async () => {
    const bad = [];
    for (const [persona, topic, t] of H1_ROWS) {
      const { out, last } = await at(persona, topic, t);
      const lm = last.state.lastMove ?? {};
      if (lm.simpler && last.before.activeItemId !== last.state.activeItemId) bad.push(`${persona} ${topic} T${t}: simpler of a card posed this turn | ${out.reply.slice(0, 160)}`);
    }
    assert.deepEqual(bad, []);
  });

  test("H1′ predicate: miss 3 is the live card's answer with its why (c5-t01 stuck T24: 1/8 m, never the worked card's 1/4 km)", async () => {
    const { out, last } = await at("stuck", "c5-t01", 24);
    assert.equal(last.state.lastMove?.gave?.answer, "1/8 m", JSON.stringify(last.state.lastMove?.gave));
    assert.match(out.reply, /1\/8 m/, out.reply);
    assert.doesNotMatch(out.reply, /1\/4 km/, out.reply);
    assert.ok(last.state.lastMove.gave.why, "with its why");
  });

  /** H1′ over a whole lesson: a helper line said twice on one card, or a second miss on a card that says the first miss's line. */
  async function repeats(persona, topic) {
    const T = TOPIC[topic];
    setScriptForTest(T, runScriptOf(RUN, T));
    const { plans } = await replay(RUN, persona, T, 1e9);
    const said = {};
    const bad = [];
    for (const pl of plans) {
      const lm = pl.state.lastMove ?? {}, id = pl.state.activeItemId;
      if (!lm.simpler || !id) continue;
      const k = lm.simpler.toLowerCase().replace(/[^\p{L}\p{N}/]+/gu, " ").trim();
      if ((said[id] ??= new Set()).has(k)) bad.push(`row ${pl.row - 1} ${id.split(":").slice(-1)[0]}: ${lm.simpler.slice(0, 80)}`);
      said[id].add(k);
    }
    return bad;
  }
  for (const persona of ["stuck", "steady", "offtopic", "steering"]) for (const topic of Object.keys(TOPIC)) {
    test(`H1′ predicate: no helper line twice on one card (${persona} ${topic})`, async () => {
      assert.deepEqual(await repeats(persona, topic), []);
    });
  }
});
