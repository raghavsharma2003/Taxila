const { initLessonState, step } = await import("/home/user/Taxila/server/director/state.js");
const { kitFromFile } = await import("/home/user/Taxila/server/content/kits.js");
const { getTopic } = await import("/home/user/Taxila/server/content/curriculum.js");
const { CTX, cls } = await import("/home/user/Taxila/tests/fixtures/kit.mjs");
const EVS = kitFromFile(getTopic("c5-evs-ch01-t01"));
const NE = cls("no_evidence"); const R = (type, src) => ({ ...NE, request: { type, whole: true, src } });
const turn = (r, c, text = "") => step(r.state, { event: "turn", kit: EVS, cls: c, text, typed: true, now: (r.state.turn + 1) * 20_000 });
let r = step(initLessonState({ topicId: EVS.topicId, kit: EVS, ctx: { ...CTX, lang: "hinglish", classLevel: 5, ageBand: "10-15" }, seed: 7, now: 0 }), { event: "start", kit: EVS, now: 0 });
for (let i = 0; i < 20 && !(r.state.phase === "practice" && r.move.itemId); i++) r = turn(r, NE);
const show = (lbl) => console.log(lbl.padEnd(34), r.move.kind.padEnd(10), String(r.move.itemId).padEnd(24), "pin", r.state.pinItem, r.state.pinRun, "chips", r.ui?.chips?.length ?? 0, "hint", r.state.hintLevel, r.move.capped ?? "", "|", (r.ui?.ask?.text ?? "").slice(0, 60));
show("pose");
for (const [lbl, c] of [["confused", R("confused", "p5")], ["back", R("back", "p5")], ["ek min (note slower)", R("slower", "note")], ["ek min (code back)", R("back", "p5")], ["haan", NE]]) { r = turn(r, c, lbl); show(lbl); }
