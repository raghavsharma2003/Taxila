// E2E review: stop-path repro. For each run: fresh lesson, K ordinary (mostly right) turns so an item is on the card,
// then a stop phrase, then a confirm (typed "haan, bas karo" or the stop chip). Records what she said and whether it ended.
//   NODE_USE_ENV_PROXY=1 TAXILA_BASE=http://127.0.0.1:8811 node stop-repro.mjs --runs 12
import { writeFileSync } from "node:fs";
const O = await import("/home/user/Taxila/tests/prod/_owner.mjs");
const { withTestAccount, openLesson, ordinaryTurn, freshChild, PERSONAS, arg, done, ok } = O;
const RUNS = Number(arg("runs", "12"));
const STOPS = ["bas, aaj ke liye itna hi", "bas, aaj ke liye itna hi", "aaj ke liye bas", "I'm done for today", "bas karo ab", "lesson khatam karo"];
const CONTINUE_WORDS = /\b(continue karte|aage badhte|chalo aage|let['’]?s continue|keep going|wapas (?:sawal|question)|isi jagah se|phir se (?:dekhte|karte))\b/i;
const out = [];
const classes = [4, 6, 7];
await withTestAccount(async ({ api, child: first }) => {
  for (let i = 0; i < RUNS; i++) {
    const cls = classes[i % 3];
    const persona = [PERSONAS.golu, { ...PERSONAS.aarav, name: "Diya", classLevel: 6 }, PERSONAS.kabir][i % 3];
    const child = i === 0 ? first : await freshChild(api, persona);
    let L;
    try { L = await openLesson(api, child, { persona }); } catch (e) { out.push({ i, err: String(e.message).slice(0, 200) }); continue; }
    const K = 2 + (i % 5);
    for (let k = 0; k < K && !L.ended; k++) { const t = ordinaryTurn(L, persona, { wrongRate: 0.2 }); await L.turn(t.text); }
    const before = L.last;
    const stop = STOPS[i % STOPS.length];
    const s1 = (await L.turn(stop)).r;
    const confirmByChip = i % 2 === 1;
    let s2 = null;
    if (!s1.end && !s1.error) {
      const chip = (s1.ui?.chips ?? []).find((c) => c.id === "stop:end");
      s2 = confirmByChip && chip ? (await L.turn(chip.label, { body: { chipId: "stop:end" } })).r : (await L.turn("haan, bas karo")).r;
    }
    const rec = {
      i, cls, topic: L.topicId, K, stop, beforeKind: before?.move?.kind, beforeAsk: before?.ui?.ask?.text ?? null,
      s1: { kind: s1.move?.kind, req: s1.move?.request, end: !!s1.end, chips: (s1.ui?.chips ?? []).map((c) => c.id), ask: s1.ui?.ask?.itemId ?? null, reply: s1.teacherReply, err: s1.error?.message },
      s2: s2 && { how: confirmByChip ? "chip" : "typed", kind: s2.move?.kind, end: !!s2.end, reply: s2.teacherReply, err: s2.error?.message },
      continueWords: CONTINUE_WORDS.test(String(s1.teacherReply ?? "")),
      endsOnCardQ: !!(before?.ui?.ask?.text && String(s1.teacherReply ?? "").includes(String(before.ui.ask.text).slice(0, 25))),
    };
    out.push(rec);
    console.log(JSON.stringify(rec).slice(0, 700));
    await L.end();
  }
}, { tag: "e2erev-stop", child: { classLevel: 4 } });
writeFileSync(new URL("./stop-repro.json", import.meta.url), JSON.stringify(out, null, 1));
const bad1 = out.filter((r) => r.s1 && (r.continueWords || r.endsOnCardQ || r.s1.ask));
const bad2 = out.filter((r) => r.s2 && !r.s2.end);
ok(bad1.length === 0, `stop check-in never says continue / re-asks the card question (${bad1.length}/${out.length})`);
ok(bad2.length === 0, `confirm after the check-in ends the lesson (${bad2.length}/${out.filter((r) => r.s2).length} did not)`);
done();
