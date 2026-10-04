// W1-A acceptance, API battery (BUILD-PLAN §3 W1-A; flows G4-G6, comprehension G11, personalisation 13): 30 typed turns
// each at classes 5 and 8, with the answers a real child gives (wrong numbers, "yes", "pata nahi", hint and choices
// requests, a skip, taps). Bars, over every turn:
//   0 turns whose reply's final question differs from ui.ask.text (the pinned card question)
//   0 two-question turns
//   0 repair moves on typed input
//   0 shape words in ui.hint.text
//   0 goodbye words outside a wrap move
//   Skip poses the next item (and never ends the lesson)
//   NODE_USE_ENV_PROXY=1 node tests/prod/w1a-battery.mjs [--turns 30]        (TAXILA_BASE for a local server)
import { withTestAccount, ok, warn, done } from "./lib.mjs";
import { turner, askParity } from "./_w1a.mjs";
import { hintShapeWords } from "../../server/director/state.js";
import { wrapsUp } from "../../server/director/say.js";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const TURNS = Number(arg("--turns", "30"));
const ANSWERS = ["7", "yes", "pata nahi", "{hint}", "mujhe lagta hai 100", "{choices}", "{tap}", "12", "haan", "{tap}"];

async function battery(api, child, label) {
  const stats = { turns: 0, parityBad: [], twoQ: [], repairTyped: 0, hintShape: [], wrapOff: [], skips: [], lessons: 0 };
  let skipped = false;
  while (stats.turns < TURNS) {
    let s;
    try { s = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text", purpose: "lesson" }); }
    catch (e) { if (e.status !== 409) throw e; s = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text", purpose: "practice" }); }
    stats.lessons += 1;
    const t = turner(api, s.lessonId);
    let last = s;
    while (stats.turns < TURNS && !last.end) {
      const ui = last.ui ?? {};
      let r;
      // one Skip per child, on a question (the audit's G6: "Skip for now" ended the lesson)
      if (!skipped && stats.turns >= 6 && ui.ask?.itemId) {
        skipped = true;
        r = await t.help("skip", "Skip this for now");
        stats.skips.push({ from: ui.ask.itemId, to: r.ui?.ask?.itemId ?? null, kind: r.move?.kind, end: !!r.end });
      } else {
        const a = ANSWERS[stats.turns % ANSWERS.length];
        r = a === "{hint}" ? await t.help("hint", "Can I have a hint")
          : a === "{choices}" ? (ui.ask?.itemId ? await t.help("help_choices", "Show me choices") : await t.say("haan"))
            : a === "{tap}" ? (ui.chips?.length ? await t.tap(ui.chips[ui.chips.length - 1]) : await t.say("pata nahi"))
              : await t.say(a);
      }
      stats.turns += 1;
      const reply = r.teacherReply ?? "";
      const kind = r.move?.kind;
      if (r.ui?.ask?.itemId && reply && !["wrap", "safeguard"].includes(kind)) {
        const p = askParity(reply, r.ui.ask.text);
        if (!p.endsOnAsk) stats.parityBad.push({ kind, ask: r.ui.ask.text, final: p.finalQuestion, reply: reply.slice(0, 160) });
        if (p.questions > 1) stats.twoQ.push({ kind, reply: reply.slice(0, 160) });
      } else if (reply && !["wrap", "safeguard"].includes(kind) && askParity(reply, null).questions > 1) {
        stats.twoQ.push({ kind, reply: reply.slice(0, 160) });
      }
      if (kind === "repair") stats.repairTyped += 1;
      if (r.ui?.hint?.text && hintShapeWords(r.ui.hint.text)) stats.hintShape.push(r.ui.hint.text);
      if (kind !== "wrap" && wrapsUp(reply)) stats.wrapOff.push({ kind, reply: reply.slice(0, 120) });
      last = r;
    }
    await api("POST", "/api/lesson/end", { lessonId: s.lessonId }).catch(() => {});
  }
  ok(stats.parityBad.length === 0, `${label}: ${stats.parityBad.length}/${stats.turns} turns end on a question other than the card's${stats.parityBad.length ? ` ${JSON.stringify(stats.parityBad.slice(0, 2))}` : ""}`);
  ok(stats.twoQ.length === 0, `${label}: ${stats.twoQ.length} two-question turns${stats.twoQ.length ? ` ${JSON.stringify(stats.twoQ.slice(0, 2))}` : ""}`);
  ok(stats.repairTyped === 0, `${label}: ${stats.repairTyped} repair moves on typed input`);
  ok(stats.hintShape.length === 0, `${label}: ${stats.hintShape.length} shape words in ui.hint.text${stats.hintShape.length ? ` ${JSON.stringify(stats.hintShape.slice(0, 2))}` : ""}`);
  ok(stats.wrapOff.length === 0, `${label}: ${stats.wrapOff.length} goodbye lines outside a wrap move${stats.wrapOff.length ? ` ${JSON.stringify(stats.wrapOff.slice(0, 2))}` : ""}`);
  if (stats.skips.length) {
    const sk = stats.skips[0];
    ok(!sk.end && sk.kind !== "wrap" && sk.to !== sk.from, `${label}: Skip poses the next item (${sk.from} → ${sk.to}, ${sk.kind})`);
  } else warn(`${label}: no question came up for a Skip`);
  console.log(`${label}: ${stats.turns} turns over ${stats.lessons} lesson(s)`);
}

await withTestAccount(async ({ api, child }) => { await battery(api, child, "class 5"); }, { tag: "w1a-b5" });
await withTestAccount(async ({ api, child }) => { await battery(api, child, "class 8"); }, { tag: "w1a-b8", child: { firstName: "Kabir", classLevel: 8, languagePref: "hinglish", interests: ["space"] } });
done();
