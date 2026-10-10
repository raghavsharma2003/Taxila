// Round 4 · stream 2 (content), brief item 3: her line matches the board. A battery of real text lessons through the
// production lesson API (a local production build or a deployed one): each lesson is walked to explanation beats and
// picture asks; EVERY board that reaches the child's slot (in the turn response, or later on the slot) is checked against
// the line she said over it, independently of the server's own gate:
//   M  meaning (server/studio/qa/semantics.js, wb-gate@3): W10 a claim about the screen that the board does not draw,
//      W11 a placeholder board, W12 the next step revealed, W13 fractions that disagree with her line
//   G  the full whiteboard gate W0-W9 against her line (numbers from truth, counts match her line, no answer reveal)
//   L  legible at the phone the lesson reported (the 360 phone's contract box; server/forge3/tray-gate.js boardAt)
// A board failing M or G is a CONTRADICTION. Bar: 0 contradictions over ≥ 50 boards. Also reported: slots that never
// filled while her line pointed at the screen (the fallback stays gated: never a board the gate refused), and how late a
// board arrived after her reply.
//
//   NODE_USE_ENV_PROXY=1 TAXILA_BASE=http://localhost:8795 node tests/prod/r4-content-boards.mjs [--boards 50] [--conc 3] [--out DIR]
// Costs model calls (one lesson per topic, ≤ 10 turns). File name is not a node --test pattern. Adult-scripted turns: no
// child has said any of this.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { arg, withTestAccount, ok, warn, done, BASE, PERSONAS, freshChild, openLesson, kitOf, RX, OUT as OWNER_OUT } from "./_owner.mjs";
import { normalizeScript } from "../../shared/whiteboard.js";
import { gateWhiteboard, withheldValues } from "../../server/studio/qa/whiteboard.js";
import { redactLine, speechMsOf } from "../../server/studio/plan.js";
import { claimsNotDrawn, placeholderBoard, nextStepRevealed, fractionsDisagree } from "../../server/studio/qa/semantics.js";
import { boardAt, contractBox } from "../../server/forge3/tray-gate.js";

const OUT = arg("out", join(OWNER_OUT, "r4-content-boards"));
const WANT = Number(arg("boards", "50")) || 50;
const CONC = Math.max(1, Math.min(4, Number(arg("conc", "3")) || 3));
mkdirSync(OUT, { recursive: true });
const TOPICS = [
  "c4-maths-ch05-t01", "c5-maths-ch02-t01", "c6-maths-ch07-t01", "c7-maths-ch08-t01", "c6-maths-ch06-t01", "c5-maths-ch01-t01", "c4-maths-ch02-t01", "c7-maths-ch02-t01",
  "c6-science-ch01-t01", "c7-science-ch01-t01", "c6-science-ch02-t01", "c7-science-ch04-t01", "c6-science-ch05-t01", "c7-science-ch07-t01",
  "c4-evs-ch01-t01", "c5-evs-ch01-t01", "c4-evs-ch03-t01", "c5-evs-ch04-t01", "c6-maths-ch03-t01", "c5-maths-ch05-t01", "c7-maths-ch05-t01", "c4-maths-ch08-t01",
  "c6-science-ch08-t01", "c7-science-ch10-t01",
];
const LINES = ["haan, main ready hoon", "samjhao na", "picture dikhao", "mujhe nahi pata, phir se samjhao", "board pe bana ke samjhao", "ek example se samjhao", "achha, aur batao", "samajh nahi aaya, diagram dikhao", "haan", "aur ek baar dikhao"];
const q = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)] : null; };
const meaningOf = (line, ops) => [...claimsNotDrawn(line, ops).map((x) => `W10 ${x}`), ...placeholderBoard(ops).map((x) => `W11 ${x}`),
  ...nextStepRevealed(line, ops).map((x) => `W12 ${x}`), ...fractionsDisagree(line, ops).map((x) => `W13 ${x}`)];

const boards = [], unfilled = [], late = [], errors = [], notebook = [];
const seen = new Set();
async function slotNow(api, lessonId, intentId) {
  try { const r = await api("GET", `/api/studio/slot?lessonId=${lessonId}&intentId=${encodeURIComponent(intentId)}`); return r?.slot ?? null; } catch { return null; }
}
async function lessonFor(topicId) {
  if (boards.length >= WANT) return;
  const classLevel = Number(topicId.match(/^c(\d)/)[1]);
  await withTestAccount(async ({ api }) => {
    const persona = { ...PERSONAS.aarav, classLevel, topics: [topicId] };
    const child = await freshChild(api, persona);
    const L = await openLesson(api, child, { topicId, persona });
    const name = child.first_name ?? persona.name;
    let kit = null; try { kit = kitOf(topicId); } catch { kit = null; }
    // the phone this battery stands for: the 360 x 800 Older (or Young) Desk's tray box, reported like the real Desk does
    const young = classLevel <= 4;
    const box = contractBox("p360", { young });
    await api("POST", "/api/studio/viewport", { lessonId: L.lessonId, box, young }).catch(() => null);
    try {
      for (const text of LINES) {
        if (boards.length >= WANT) break;
        const row = await L.turn(text);
        const r = row.r;
        if (r?.error) { errors.push({ topicId, text, error: r.error.message }); break; }
        const replyAt = Date.now();
        const slot = r?.ui?.studioSlot;
        if (slot?.intentId && (!slot.artifact || slot.artifact.kind === "whiteboard")) {
          let art = slot.artifact ?? null, st = slot.state, ms = 0;
          for (let k = 0; k < 24 && !art; k++) {
            await new Promise((res) => setTimeout(res, 400));
            const s = await slotNow(api, L.lessonId, slot.intentId);
            if (s?.artifact) { art = s.artifact; ms = Date.now() - replyAt; }
            st = s?.state ?? st;
            if (st === "failed") break;
          }
          if (!art) { unfilled.push({ topicId, state: st, pointsAt: RX.refers.test(String(r.teacherReply ?? "")), reply: String(r.teacherReply ?? "").slice(0, 160) }); }
          else if (art.kind === "whiteboard" && !seen.has(art.script?.scriptId)) {
            seen.add(art.script?.scriptId);
            if (ms) late.push(ms);
            const sc = art.script;
            const line = redactLine(r.teacherReply ?? "", [name]);
            const meaning = meaningOf(line, sc.ops ?? []);
            const n = normalizeScript(sc, { strict: false });
            const g = gateWhiteboard(n.ok ? n.script : sc, { reply: line, kit: kit ?? undefined, speechMs: speechMsOf(r.teacherReply ?? ""), banned: [name], withhold: withheldValues(kit, { line }) });
            const gateFails = g.checks.filter((c) => !c.pass).map((c) => c.id);
            const leg = boardAt(sc, box, { young });
            boards.push({ lessonId: L.lessonId, topicId, scriptId: sc.scriptId, ground: sc.board?.ground ?? null, line: line.slice(0, 220), meaning, gateFails, legible: leg.ok, minPx: leg.minPx, ms });
          }
        }
        if (r?.end) break;
      }
    } finally { await L.end(); }
    // the notebook (round 4 content): this lesson's boards, saved per lesson on the server, listed for the child (any
    // device) and replayed in the order they were drawn
    const mine = boards.filter((b) => b.lessonId === L.lessonId).map((b) => b.scriptId);
    try {
      const nb = await api("GET", `/api/studio/notebook?childId=${child.id}`);
      const pages = await api("GET", `/api/studio/notebook/pages?lessonId=${L.lessonId}`);
      const listed = (nb.pages ?? []).find((p) => p.lessonId === L.lessonId);
      const ids = (pages.boards ?? []).map((b) => b.script?.scriptId);
      const seqs = (pages.boards ?? []).map((b) => b.seq);
      notebook.push({ lessonId: L.lessonId, drawn: mine.length, listed: listed?.boards ?? 0, pages: ids.length, ordered: seqs.every((x, i) => i === 0 || x > seqs[i - 1]),
        everyDrawnSaved: mine.every((id) => ids.includes(id)) });
    } catch (e) { notebook.push({ lessonId: L.lessonId, error: String(e.message).slice(0, 120) }); }
  }, { tag: "r4cb" });
}

const queue = [...TOPICS, ...TOPICS];
await Promise.all(Array.from({ length: CONC }, async () => { while (queue.length && boards.length < WANT) { const t = queue.shift(); try { await lessonFor(t); } catch (e) { errors.push({ topicId: t, error: String(e.message).slice(0, 200) }); } } }));

const contra = boards.filter((b) => b.meaning.length || b.gateFails.length);
ok(boards.length >= WANT, `boards checked ${boards.length} ≥ ${WANT}`);
ok(contra.length === 0, `contradictions (meaning W10-W13 or gate W0-W9 against her line): ${contra.length}/${boards.length}${contra.length ? ` e.g. ${contra[0].topicId}: ${[...contra[0].meaning, ...contra[0].gateFails].slice(0, 3).join("; ")}` : ""}`);
const illegible = boards.filter((b) => !b.legible);
ok(illegible.length === 0, `boards illegible at the reported 360 phone box: ${illegible.length}/${boards.length}`);
const pointed = unfilled.filter((u) => u.pointsAt);
ok(pointed.length === 0, `board slots that never filled while her line pointed at the screen: ${pointed.length} (unfilled total ${unfilled.length})`);
if (late.length) warn(`board arrival after her reply (slot polls, 400 ms grain): p50 ${q(late, 0.5)} ms, p90 ${q(late, 0.9)} ms (n = ${late.length}; boards in the response itself count 0 and are not in n)`);
const nbBad = notebook.filter((n) => n.error || (n.drawn > 0 && (!n.everyDrawnSaved || !n.ordered || n.listed !== n.pages)));
ok(nbBad.length === 0, `notebook: every lesson's boards saved, listed and replayable in order (${notebook.length - nbBad.length}/${notebook.length} lessons${nbBad.length ? `; e.g. ${JSON.stringify(nbBad[0])}` : ""})`);
if (errors.length) warn(`errors: ${errors.length}: ${errors.slice(0, 3).map((e) => `${e.topicId}: ${e.error}`).join(" | ")}`);
const summary = { base: BASE, at: new Date().toISOString(), boards: boards.length, contradictions: contra.length, illegible: illegible.length, unfilled: unfilled.length, unfilledPointed: pointed.length,
  grounds: [...new Set(boards.map((b) => b.ground))], late: { n: late.length, p50: q(late, 0.5), p90: q(late, 0.9) }, errors: errors.length };
writeFileSync(join(OUT, "r4-content-boards.json"), JSON.stringify({ summary, boards, unfilled, errors, notebook }, null, 1));
console.log("summary", JSON.stringify(summary));
done();
