// Round 4, stream 4A: a diagnostic probe for round3-conversation C (a share kept for later), LOCAL only. Runs scenario C
// N times and prints, per turn, the move kind, the must-note the Director gave (the debug read) and the reply, so a miss can
// be told apart as Director (no note) or words (note given, reply did not use it). Not a gate: it prints, it never fails.
//   NODE_USE_ENV_PROXY=1 TAXILA_BASE=http://127.0.0.1:<port> node tests/prod/r4-conversation-share-probe.mjs [--n 3]
import { withTestAccount, done } from "./lib.mjs";
import { PERSONAS, freshChild, openLesson } from "./_owner.mjs";
// --state: also read the lesson's stored Director state after each turn (LOCAL only, own DB branch): the parked entries and
// the move's must-note (the turn route's debug read carries no move)
const STATE = process.argv.includes("--state");
const { one } = STATE ? await import("../../server/db.js") : { one: null };

const argv = process.argv.slice(2);
const N = argv.includes("--n") ? Number(argv[argv.indexOf("--n") + 1]) : 3;
const kitAsk = (r) => (r?.ui?.ask?.itemId ? r.ui.ask.text : null);
const BACK = /\b(shaadi|wedding|cousin)\b|शादी/i;

await withTestAccount(async ({ api }) => {
  for (let k = 0; k < N; k++) {
    const p = PERSONAS.aarav;
    const L = await openLesson(api, await freshChild(api, p), { topicId: p.topics[0], persona: p });
    try {
      await L.turn("haan ready hoon", { kind: "greet" });
      for (let i = 0; i < 8 && !kitAsk(L.last); i++) await L.turn("haan, aage", { kind: "filler" });
      const show = async (tag, r) => {
        let extra = "";
        if (STATE) {
          const row = await one("select state->'lastMove' as m, state->'later' as later, state->'turn' as turn from lesson where id = $1", [L.lessonId]);
          extra = ` req=${row?.m?.request ?? "-"} must=${JSON.stringify(row?.m?.must ?? null)} later=${JSON.stringify((row?.later ?? []).map((e) => ({ t: e.topic, at: e.at, share: !!e.share, promise: e.promise, served: e.servedAt ?? null })))}`;
        }
        console.log(`${tag} ${r?.move?.kind}${extra}\n    ${String(r?.teacherReply ?? "").slice(0, 220)}`);
      };
      const s = await L.turn("meri cousin ki shaadi hai next week", { kind: "offtopic" });
      console.log(`--- run ${k + 1}`); await show("share", s.r);
      for (let i = 0; i < 8; i++) {
        const item = L.item(L.last);
        const row = await L.turn(item ? String(item.answer).slice(0, 60) : "achha", { kind: item ? "answer" : "filler" });
        await show(`t${i + 1}${BACK.test(String(row.r?.teacherReply ?? "")) ? " BACK" : ""}`, row.r);
        if (BACK.test(String(row.r?.teacherReply ?? ""))) break;
      }
    } finally { await L.end(); }
  }
});
done();
