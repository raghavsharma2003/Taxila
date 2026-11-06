// Round 7 (main, director8 hand judge, c5 ch02-t02: ~40 "?" over a stated number, from 19 in director7): a scripted card's
// board writes "?" ONLY over the value the card asks for. Every number the spoken card states is drawn, even one that also
// sits in an accept form ("5 wali roti ka tukda", "her brother, 4/6"). Over every check and then-card of the pilot scripts
// (data/lesson-scripts) and, when present, Learning's staged batch (data/lesson-scripts-staged): her line is the card's
// prompt (Brain speaks it whole, last), Brain sends scriptBeat.answers [key, ...accept]. Pure: no DB, no model.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as BF from "../server/stagecraft/board-first.js";
import { gateCtxFor, statedAsUnknown, answerValues } from "../server/stagecraft/board-sync.js";
import { resolveBoardRef, refNumbersOf } from "../server/forge/explainer/board-ref.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";

const DIRS = ["data/lesson-scripts", "data/lesson-scripts-staged"].filter((d) => fs.existsSync(d));
const nums = (t) => (String(t ?? "").match(/\d+(?:\.\d+)?(?:\s*\/\s*\d+)?/g) ?? []).map((m) => m.replace(/\s+/g, ""));

function cards() {
  const out = [];
  for (const dir of DIRS) for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    const sc = JSON.parse(fs.readFileSync(`${dir}/${f}`, "utf8"));
    (sc.skills ?? []).forEach((k, si) => {
      for (const c of k.checks ?? []) if (c.board && c.prompt?.hi) out.push({ dir, T: sc.topicId, where: `s${si + 1} ${c.id}`, board: c.board, text: c.prompt.hi, answers: [c.key, ...(c.accept ?? [])].map(String), ownBoard: true });
      for (const r of k.remediation ?? []) if (r.then?.board && r.then?.prompt?.hi) out.push({ dir, T: sc.topicId, where: `s${si + 1} then:${String(r.targets).replace(/^.*-m-/, "m-")}`, board: r.then.board, text: r.then.prompt.hi, answers: [r.then.key, ...(r.then.accept ?? [])].filter((a) => a != null).map(String), ownBoard: true });
    });
  }
  return out;
}
function kitOf(T) { try { return kitFromFile(getTopic(T)); } catch { return null; } }

test("director8 S1: only the KEY's values are withheld, and never one her line states (accept forms quote the card's givens)", () => {
  assert.deepEqual(answerValues(["1/5", "one fifth", "5 wali roti ka tukda"], "Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein."), ["1/5"]);
  assert.deepEqual(answerValues(["her brother", "her brother, 4/6"], "Meena ne 2/6 khaya aur bhai ne 4/6."), []);
  assert.deepEqual(answerValues(["1/12, 1/6, 1/3"], "Kram mein lagao: 1/3, 1/12, 1/6."), []);
  assert.deepEqual(answerValues(["1/2"], "Dekho 2/4 par."), [], "an equal fraction states it");
  assert.deepEqual(answerValues(["30 m", "30"], "Parimap kitna hai?"), ["30"]);
});

test("director8 S1: a fraction line's asked mark whose value her line states is labelled, not '?' (c5-t02 c3)", () => {
  const ref = { template: "fraction-line@1", params: { den: 4, from: 0, to: 1, mark: 1 } };
  const x = { ops: [{ id: "q", op: "text", text: "?", at: [0, 0] }] };
  assert.equal(BF.statedMark(x, ref, "Haan, pehla nishaan 1/4 hai.")?.ops[0].text, "1/4");
  assert.equal(BF.statedMark(x, ref, "Pehla nishaan 2/8 ke barabar hai, yaani 2/8.")?.ops[0].text, "2/8");
  assert.equal(BF.statedMark(x, ref, "Woh nishaan 1/8 se bada hai ya chhota?"), null, "1/8 is not the mark: it stays the question");
});

test(`director8 S1: on every check and then-card (${DIRS.join(" + ")}), no number the card's prompt states is drawn as "?"`, () => {
  const all = cards(), bad = [];
  let drawn = 0, n = 0;
  for (const c of all) {
    const kit = kitOf(c.T);
    const id = `r8s1-${n++}`;
    const ask = { intent: { intentId: `${id}:wb:1`, lessonId: id, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: c.board,
      scriptBeat: { scriptId: "s", beatId: `${c.where}`, kind: "check", ownBoard: c.ownBoard, answers: c.answers } },
      line: { lessonId: id, text: "" }, mode: "fresh", kit: { topicId: c.T, content: [] } };
    BF.preselect(ask, { kit: kit ?? undefined });
    const real = { ...ask, line: { lessonId: id, text: c.text } };
    const t = BF.takePreselected(real, gateCtxFor(real, { kit: kit ?? undefined, redact: [], prior: [] }));
    if (!t?.script) continue;      // (a board refused on its line is the ladder's: never a "?" over a stated number)
    drawn++;
    const said = new Set(nums(c.text));
    // 1. no "?" the gate wrote stands for a number the card states
    const masked = statedAsUnknown(t.script, c.text, ask.intent.intentId);
    // 2. no number the board AUTHORS (labels, sides, items) and the card states is missing from what is drawn
    const shown = new Set(t.script.ops.flatMap((o) => (o.op === "text" || o.op === "label" ? nums(o.text) : o.op === "numwork" ? (o.rows ?? []).flat().map(String) : [])));
    const r = resolveBoardRef(c.board, {});
    const authored = r.ok ? refNumbersOf(r.call) : [];
    const missing = authored.filter((v) => said.has(v) && !shown.has(v));
    // 3. an asked fraction-line mark whose value the card states is labelled
    const markLeft = r.ok && r.call.template === "fraction-line@1" && Number.isInteger(r.call.mark) && [...said].some((s) => /\//.test(s) && Number(s.split("/")[0]) / Number(s.split("/")[1]) === r.call.mark / r.call.den)
      && t.script.ops.some((o) => o.op === "text" && String(o.text).trim() === "?");
    if (masked.length || missing.length || markLeft) bad.push(`${c.dir.replace("data/", "")} ${c.T} ${c.where}: ${[...masked.map((v) => `"?" over ${v}`), ...missing.map((v) => `${v} not drawn`), ...(markLeft ? ["asked mark '?' though stated"] : [])].join(", ")}`);
  }
  assert.ok(drawn >= 20, `cards drawn: ${drawn} of ${all.length}`);
  assert.deepEqual(bad, []);
});
