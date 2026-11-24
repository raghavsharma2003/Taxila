// round 7, director14 (main's v6.6, S9 and S9b): each item pinned on a director14 row (evals/hybrid-side-by-side/results/
// 2026-11-09-director14 on claude/r4-conversation 2c223fe9d; rows 0-based, the rows' text and boards copied here). Replayed through
// Studio's seam in Brain's picture-turn shape: page 0 the card's ref marked ofCard false (Studio's second view), then the card's
// own page, ofCard true.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as seam from "../server/studio/seam.js";
import * as BF from "../server/stagecraft/board-first.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";

const kitOf = (T) => kitFromFile(getTopic(T));
let lessonN = 0;

/** A lesson on Studio's seam: `send(ref, beat, text, more)` preselects on the empty line, then takes it on her line. */
function lesson(T, prompt) {
  const kit = kitOf(T), L = `r8d14-${lessonN++}`;
  seam.studioSeam.prefetch({ lessonId: L, purpose: "practice", kit, topicId: T, child: { id: `c-${L}`, class_level: 5, language_pref: "hinglish" } });
  let n = 0;
  const send = async (ref, beat, text, { segments = null, request = null, ofCard } = {}) => {
    const a = { intent: { intentId: `${L}:wb:${++n}`, lessonId: L, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: ref, scriptBeat: { scriptId: "s", beatId: "b", ...beat },
      ...(request ? { request } : {}), ...(typeof ofCard === "boolean" ? { ofCard } : {}) },
      line: { lessonId: L, teacherReplySeq: n, text: "" }, mode: "fresh", kit: { topicId: T, content: [], item: { id: "script:card", prompt_hi: prompt, prompt_en: "" } } };
    const row = seam.studioSeam.preselectWhiteboard({ ...a });
    const hint = seam.studioSeam.preselectedAltView(L);
    const k = seam.studioSeam.requestIntent({ ...a, intent: { ...a.intent, ...(segments ? { segments } : {}) }, line: { ...a.line, text } });
    return { row, hint, k: k?.state === "planning" && k.ready ? (await k.ready) ?? { state: "failed" } : k };
  };
  return { kit, send };
}
const pagesOf = (k) => (k?.artifact?.screens ?? [k?.artifact?.screen]).map((s) => s?.template);

const LINE8 = { template: "fraction-line@1", params: { den: 8, from: 0, to: 1 } };
const E2 = "Isi rekha ke neeche ki taraf 0 aur 1 ke beech 7 nishaan barabar doori par hain. Neeche ki taraf rekha kitne barabar gaps mein bati hai?";
const E2_BEAT = { kind: "check", ownBoard: true, answers: ["8"] };

test("director14 S9 (c5-t01 stuck row 18): the card's own page of a picture turn draws the card's own board — the example bar, then the 0-1 line of 8 gaps from \"Isi\"; a page marked ofCard true is never a second view", async () => {
  const s = lesson("c5-maths-ch02-t01", E2);
  assert.equal((await s.send(LINE8, E2_BEAT, E2, { ofCard: true })).k.state, "revealed");
  const alt = "Ek chhota udaharan dekho: ek patti 4 barabar hisson mein, ek hissa 1/4.";
  const p = await s.send(LINE8, E2_BEAT, `${alt} ${E2}`, { request: { kind: "picture" }, ofCard: false,
    segments: [{ atChar: alt.length + 1, boardRef: LINE8, scriptBeat: { scriptId: "s", beatId: "e2", ...E2_BEAT }, ofCard: true }] });
  assert.equal(p.hint, "example");
  assert.equal(p.k.state, "revealed");
  assert.deepEqual(pagesOf(p.k), ["fraction-bars@1", "fraction-line@1"]);
  assert.equal(p.k.artifact.altView, "example");
  assert.equal(p.k.artifact.script.switches[0].word, "isi");
  // (each part taken on its own, as the harness checks them: the card's LATER part — cardPage, from its ofCard true — is the
  // card's line even with the turn's picture request still on it; the first part, ofCard true as Brain marks the card's board
  // before her line exists, is still the second view)
  const kit = s.kit;
  const part = (id, extra) => ({ intent: { intentId: id, lessonId: "r8d14-p", kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: LINE8, scriptBeat: E2_BEAT, request: { kind: "picture" }, ...extra },
    line: { lessonId: "r8d14-p", text: "" }, mode: "fresh", kit: { topicId: "c5-maths-ch02-t01", content: [] } });
  assert.equal(BF.preselect(part("r8d14-p:s1", { ofCard: true, cardPage: true }), { kit })?.template, "fraction-line@1");
  assert.equal(BF.preselect(part("r8d14-p:s0", { ofCard: false }), { kit })?.template, "fraction-bars@1");
  assert.equal(BF.preselect(part("r8d14-p:s0b", { ofCard: true }), { kit })?.template, "fraction-bars@1", "the first page, marked as Brain marks it before her line");
});

test("director14 S9b (c6 stuck row 18): a picture asked right after a remediation — its lettered hexagon up, not the card's board — gets that board's own second view, the sides laid straight, then the card's pentagon from \"Paanch\"", async () => {
  const prompt = "Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?";
  const s = lesson("c6-maths-ch06-t01", prompt);
  const hex5 = { template: "shape@1", params: { shape: "hexagon", side: "5 cm" } };
  const remHex = { template: "measured@1", params: { shape: "hexagon", unit: "m", sides: [10, 4, 6, 5, 4, 9], names: ["A", "B", "C", "D", "E", "F"], trace: true } };
  const pent = { template: "measured@1", params: { shape: "pentagon", unit: "m", sides: [8, 5, 7, 6, 3], names: ["P", "Q", "R", "S", "T"] } };
  const row16 = "5 cm sahi nahi hai. A se shuru karke har bhuja ka naam aur lambai bolo: AB 10 m, BC 4 m, CD 6 m, DE 5 m, EF 4 m, FA 9 m. Jod tabhi poora hota hai jab tum wapas A par pahunchte ho. Ab tak samajh aaya?";
  const up = await s.send(hex5, { kind: "check", ownBoard: true, answers: ["30 cm"] }, row16, { segments: [{ atChar: 20, boardRef: remHex, scriptBeat: { scriptId: "s", beatId: "rem", kind: "remediation" } }] });
  assert.deepEqual(pagesOf(up.k), ["shape@1", "measured@1"]);
  const beat = { kind: "check", ownBoard: true, answers: ["29 m"] };
  const alt = "Dekho, wahi chhe bhujayein ab ek seedhi line par: 10 m, 4 m, 6 m, 5 m, 4 m, 9 m.";
  const p = await s.send(pent, beat, `${alt} ${prompt}`, { request: { kind: "picture" }, ofCard: false,
    segments: [{ atChar: alt.length + 1, boardRef: pent, scriptBeat: { scriptId: "s", beatId: "then", ...beat }, ofCard: true }] });
  assert.equal(p.hint, "unrolled", p.row);
  assert.match(String(p.row), /lengths 10 m, 4 m, 6 m, 5 m, 4 m, 9 m/);
  assert.equal(p.k.state, "revealed");
  assert.deepEqual(pagesOf(p.k), ["unrolled@1", "measured@1"]);
  assert.equal(p.k.artifact.altView, "unrolled");
  assert.equal(p.k.artifact.script.switches[0].word, "paanch");
  // (only a REMEDIATION's board up: after an explain board that is not the card, the card's own board is the picture, as before)
  const s2 = lesson("c6-maths-ch06-t01", prompt);
  await s2.send(remHex, { kind: "explain" }, "A se shuru karke har bhuja ka naam aur lambai bolo: AB 10 m, BC 4 m, CD 6 m, DE 5 m, EF 4 m, FA 9 m.");
  assert.equal((await s2.send(pent, beat, prompt, { request: { kind: "picture" } })).hint, null);
});
