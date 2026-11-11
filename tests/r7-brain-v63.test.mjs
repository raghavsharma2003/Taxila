// dc-r7-script-walk-v6-3 (main's director11 judgement, four hand judges): each fix is a PREDICATE pinned on director11's own rows,
// replayed through turn.js planTurn (tests/fixtures/replay.mjs) and textReply with the run's own v2.3 scripts and her own words.
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { inHindiWords } from "../server/brain/register.js";
import { replay, runScriptOf } from "./fixtures/replay.mjs";
import { textReply, replyDeps } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { setScriptForTest } from "../server/director/script.js";
import { step, scriptKeyOf } from "../server/director/state.js";
import { findItem } from "../server/director/items.js";
import { whiteboardIntentOf, boardItemOf, segmentsAt } from "../server/brain/propose.js";
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
      // (v6.4 H2″: the return is hers, or one short retry call: the stub answers that call with a line about their words)
      const r0 = pl.state.lastMove?.returned;
      replyDeps.chat = async (_d, msgs) => (/^You are a warm teacher/.test(msgs?.[0]?.content ?? "") && r0
        // (v6.6 A2: a return answers them, never echoes or praises their words: "Wah, … sunkar mazaa aa gaya!" is an echo now)
        ? { text: `${String(r0.said ?? r0.topic).split(/\s+/).find((w) => w.length > 4 && !/maine|mujhe|aapko/i.test(w)) ?? r0.topic} ke saath woh pal sach mein khaas raha hoga.` }
        : { text: rows[n].text });
      const out = await textReply({ instructions: instructionsFor(pl.state, kit), state: pl.state, kit, childText: pl.child, history: [], ui: pl.p.r.ui, module: null });
      said[pl.state.turn] = out.reply;
      if (/^\p{L}+: (?:iski baat|pakka)/iu.test(out.reply)) bad.push(`T${n} raw park template | ${out.reply.slice(0, 80)}`);
      if (/Cricket mein ek over mein chhe ball|Virat Kohli India ke liye batting karte hain/i.test(out.reply)) bad.push(`T${n} canned fact | ${out.reply}`);
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
      // (v6.4 H2″: the worked example's opening is a boundary; its steps and card are not)
      if (/^worked(?::step|$)/.test(pl.state.lastMove?.scriptBeat?.beatId ?? "")) why.push("mid-worked");
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
    // (v6.4 H2″ returns it at the first boundary now, so the run's end has it served: re-open it there to test the close)
    const s0 = { ...plans.at(-1).state };
    s0.later = (s0.later ?? []).map((e) => e.topic === "cricket" ? { ...e, servedAt: null } : e);
    assert.ok((s0.later ?? []).some((e) => e.share && e.servedAt == null && e.topic === "cricket"), "open at the end of the run");
    const s1 = { ...s0, ctx: { ...s0.ctx, lessonBrief: { ...(s0.ctx.lessonBrief ?? {}), hardStopAt: new Date(0).toISOString() } } };
    const r = step(s1, { event: "turn", kit, cls: { outcome: "no_evidence", confidence: 0.9, flags: {} }, text: "haan", now: 10_000_000 });
    assert.equal(r.move.returned?.topic, "cricket", JSON.stringify(r.move).slice(0, 300));
    // (v6.4 H2″: the line is hers, answering their words; the move carries those words)
    assert.ok(String(r.move.returned.said ?? "").length > 0, "their words carried");
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
  /** The pages of her line as the seam sends them (page 0 = boardRef/scriptBeat, then segments), each with its text. */
  const pagesOf = (last, out, kit) => {
    const a = whiteboardIntentOf({ lessonId: "v63", turn: last.state.turn, beat: { id: "visual", type: "explain" }, next: last.state, kit, item: boardItemOf(last.state, kit, findItem), line: { text: out.reply, parts: out.guard.parts } });
    const text = out.reply.replace(/\s+/g, " ").trim();
    const ps = [{ atChar: 0, boardRef: a.intent.boardRef, scriptBeat: a.intent.scriptBeat }, ...(a.intent.segments ?? [])];
    return ps.map((p, i) => ({ ...p, text: text.slice(p.atChar, ps[i + 1]?.atChar ?? text.length) }));
  };
  const P1_REM = [["stuck", "c6", 46], ["stuck", "c6", 60], ["offtopic", "c6", 56], ["stuck", "c5-t01", 21], ["offtopic", "c5-t01", 6], ["steering", "c5-t01", 7],
    ["stuck", "c5-t02", 13], ["stuck", "c4", 12]];
  test("P1 predicate: a remediation's words on the remediation's board, then the card on its own page (judges' 8 rows)", async () => {
    const bad = [];
    for (const [persona, topic, t] of P1_REM) {
      const { out, last } = await at(persona, topic, t);
      const kit = kitOf(topic);
      const ps = pagesOf(last, out, kit);
      const lm = last.state.lastMove;
      const sm0 = String(lm.simpler ?? "").split(/(?<=[.!?])\s/)[0];
      // (dc-r8-director20 W1: an authored simpler is said as written, in the Hindi mode too — v6.4 L1's rewrite applies to her own words only)
      const sm = sm0;
      const onRem = ps.find((p) => sm && p.text.includes(sm.slice(0, 30)));
      const rem = (kit && last.state.lastMove?.simplerBeat?.board) ?? null;
      if (!onRem || !String(onRem.scriptBeat?.beatId ?? "").startsWith("rem:")) bad.push(`${persona} ${topic} T${t}: remediation words on ${onRem?.scriptBeat?.beatId} | ${onRem?.text?.slice(0, 80)}`);
      if (!rem) bad.push(`${persona} ${topic} T${t}: no remediation board`);
      // (v6.5 P2′: or, when Studio would refuse the card's own page, the card is not said on this turn at all — logged)
      if (JSON.stringify(ps.at(-1).boardRef) !== JSON.stringify(lm.cardBeat?.board) && !out.guard.cardPageDropped) bad.push(`${persona} ${topic} T${t}: the card is not on its own board`);
    }
    assert.deepEqual(bad, []);
  });

  test("P1 predicate: a probe about the card just answered is asked on that card's board (c4 steady T58)", async () => {
    const { out, last } = await at("steady", "c4", 58);
    const ps = pagesOf(last, out, kitOf("c4"));
    assert.equal(last.state.lastMove.kind, "probe");
    for (const p of ps) assert.deepEqual(p.boardRef, last.state.lastMove.closeBeat.board, JSON.stringify(ps.map((x) => [x.scriptBeat?.beatId, x.text.slice(0, 40)])));
  });

  test("P1 predicate: a lone bridge is on the board that draws what it names: its own, else the beat it leads into (c6 steering T48)", async () => {
    const { out, last } = await at("steering", "c6", 48);
    const ps = pagesOf(last, out, kitOf("c6"));
    const sc = runScriptOf(RUN, TOPIC.c6);
    assert.deepEqual(ps[0].boardRef, sc.skills[0].bridgeBoard, "its own authored board (\"Is 6 cm lambe aur 4 cm chaude …\")");
    // with no board of its own: the board of the beat it leads into
    const T = TOPIC.c6;
    const bare = structuredClone(sc); delete bare.skills[0].bridgeBoard;
    setScriptForTest(T, bare);
    const { kit, rows, last: l2 } = await replay(RUN, "steering", T, 49);
    replyDeps.chat = async () => ({ text: rows[48].text });
    const o2 = await textReply({ instructions: instructionsFor(l2.state, kit), state: l2.state, kit, childText: l2.child, history: [], ui: l2.p.r.ui, module: null });
    const p2 = pagesOf(l2, o2, kit);
    const sk1 = bare.skills[1];
    assert.deepEqual(p2[0].boardRef, sk1.hook?.board ?? sk1.explain[0].board, JSON.stringify(p2.map((x) => [x.scriptBeat?.beatId, x.boardRef?.params])));
  });

  test("P1: her sentence about what they did, straight after the close, stays on the close's page (c4 steady T74, offtopic T50, stuck T54)", () => {
    const A = { template: "fraction-parts@1", params: { parts: 3, shade: 1 } }, B = { template: "compare@1", params: { left: { title: "Cake" } } };
    const verdict = "Haan, sahi hai, kyunki chocolate ke 3 barabar tukde the aur unme se 1 khaya gaya, yaani 1/3.";
    const theirs = "Tumne khaye hue tukde 1 ko upar aur kul tukde 3 ko neeche rakha.";
    const card = "Ek cake ke 4 tukde kiye: 2 bade aur 2 chhote. Kya yeh chhota tukda cake ka ek-chauthaai hai?";
    const line = `${verdict} ${theirs} ${card}`;
    const plan = [{ part: "close", boardRef: A, scriptBeat: { beatId: "c2" } }, { part: "body", boardRef: B, scriptBeat: { beatId: "c3" } }, { part: "card", boardRef: B, scriptBeat: { beatId: "c3" } }];
    const out = segmentsAt(plan, line, card, { prev: verdict, verdict });
    assert.equal(out.length, 2);
    assert.equal(out[1].atChar, line.indexOf("Ek cake"), "the switch is after her sentence about them, never before it");
  });
  test("R7 (main's D5 row): her own lesson claim before a scripted card goes (c4 steady T48: 'Dobara check karke dekha: tukde barabar hain')", async () => {
    const { out } = await at("steady", "c4", 48);
    assert.doesNotMatch(out.reply, /tukde barabar hain aur 1 tukda khaya gaya/, out.reply);
    // (dc-r8-director20 W1/G3, 2026-11-11: the card stays as written — no Hindi-word swap inside it)
    assert.match(out.reply, /Chocolate ka kitna hissa khaya, fraction mein batao\./, "the card stays: " + out.reply);
  });
  test("W1: a worked example poses its question before 'Diya hai …' (c5-t02 steady, the cake problem)", async () => {
    const T = TOPIC["c5-t02"];
    setScriptForTest(T, runScriptOf(RUN, T));
    const { kit, rows, last } = await replay(RUN, "steady", T, 65);
    assert.equal(last.state.lastMove?.scriptBeat?.beatId, "worked:problem");
    replyDeps.chat = async () => ({ text: rows[64].text });
    const out = await textReply({ instructions: instructionsFor(last.state, kit), state: last.state, kit, childText: last.child, history: [], ui: last.p.r.ui, module: null });
    const q = out.reply.indexOf("Kisne kam cake khaya?"), d = out.reply.indexOf("Diya hai");
    assert.ok(q >= 0 && d > q, out.reply);
  });

  test("W1: no lead-in of hers states the worked card's answer before they try it (c5-t02 steady row 26, offtopic row 32)", async () => {
    for (const [persona, n] of [["steady", 26], ["offtopic", 32]]) {
      const { out } = await at(persona, "c5-t02", n + 1);
      const card = "Rahul ka tukda 1/6 hai, Sana ka tukda 1/3.";
      const before = out.reply.slice(0, Math.max(0, out.reply.indexOf(card)));
      assert.doesNotMatch(before, /bada hoga|se bada|Sana/i, `${persona} row ${n}: ${out.reply}`);
      assert.ok(out.reply.includes(card), out.reply);
    }
  });
  test("R1: a right answer's verdict on a single page draws the card's answerBoard (c5-t02 steady T7, T63; stuck T17; offtopic T13)", async () => {
    const bad = [];
    for (const [persona, t] of [["steady", 7], ["steady", 63], ["stuck", 17], ["offtopic", 13]]) {
      const { out, last } = await at(persona, "c5-t02", t);
      const ps = pagesOf(last, out, kitOf("c5-t02"));
      const cb = last.state.lastMove?.closeBeat;
      if (!cb?.answerBoard || JSON.stringify(ps[0].boardRef) !== JSON.stringify(cb.board)) bad.push(`${persona} T${t}: ${ps[0].boardRef?.template} ${JSON.stringify(ps[0].boardRef?.params).slice(0, 60)}`);
    }
    assert.deepEqual(bad, []);
  });
  test("R2: her own acknowledgement of a probe's answer only on a confident read; else code's (c5-t02 steering T45)", async () => {
    const { last, rows, n } = await at("steering", "c5-t02", 45);
    const T = TOPIC["c5-t02"];
    const kit = kitOf("c5-t02");
    const unsure = { ...last.state, lastReadConfident: false };
    replyDeps.chat = async () => ({ text: rows[n].text });
    const out = await textReply({ instructions: instructionsFor(unsure, kit), state: unsure, kit, childText: last.child, history: [], ui: last.p.r.ui, module: null });
    assert.match(rows[n].text, /^Riya, tumne tukde gin kar unke size ki tulna ki\./, "(the run's own acknowledgement)");
    assert.doesNotMatch(out.reply, /size ki tulna/, out.reply);
    assert.match(out.reply, /^(?:Theek hai|Theek, yeh tumhari soch thi|Achha)/, out.reply);
    void T;
  });
  test("R2: Hindi number agreement after a count ('4 barabar tukde', never 'tukda'); a fraction is no count", async () => {
    const { inHindiWords, agree } = await import("../server/brain/register.js");
    assert.equal(inHindiWords("Ek pizza ke 4 barabar slice the. 1 slice kha liya gaya, aur 3 slice bache."), "Ek pizza ke 4 barabar tukde the. 1 tukda kha liya gaya, aur 3 tukde bache.");
    assert.equal(agree("1/4 hissa, 2 ka hissa, 5 bhuja"), "1/4 hissa, 2 ka hissa, 5 bhujayein");
  });

  test("R2: the teaching half of a split turn never promises 'the next step' when its own card follows (offtopic c6 e3)", async () => {
    const T = TOPIC.c6;
    setScriptForTest(T, runScriptOf(RUN, T));
    const { kit, rows, last } = await replay(RUN, "offtopic", T, 17);
    assert.ok(last.state.lastMove?.splitTeach, "the split teaching half: " + JSON.stringify(last.state.lastMove?.scriptBeat));
    replyDeps.chat = async () => ({ text: rows[16].text });
    const out = await textReply({ instructions: instructionsFor(last.state, kit), state: last.state, kit, childText: last.child, history: [], ui: last.p.r.ui, module: null });
    assert.match(rows[16].text, /Ab agla kadam dekhte hain\.$/, "(the run's tail)");
    assert.doesNotMatch(out.reply, /agla kadam|aage dekhte|aage chalte/i, out.reply);
  });
});
