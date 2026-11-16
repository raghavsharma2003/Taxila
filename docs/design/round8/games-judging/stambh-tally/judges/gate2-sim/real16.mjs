const R = "/home/user/taxila-int/";
const { coverage, entryKey, seedOf, nextBody, currentLevel, nameOnRepeat, afterLevelBody } = await import(R + "server/play/levels.js");
const { gradeActs, lessonEvidence } = await import(R + "server/play/grade.js");
const e = coverage().entries.find((x) => x.family === "stambh" && x.mode === "tally" && x.goal === "read");
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
for (const [fade, pL, doors, habit] of [[2, 0.3, ["garam","garam","garam"], "fixed16"], [1, 0.3, ["teekha","garam","garam"], "repeatFirst"], [3, 0.3, ["teekha","teekha","teekha"], "fixed28"]]) {
  let s = { childId: "k0", key: entryKey(e), skillId: e.skillId, lessonId: null, classLevel: e.classLevel, fade, lang: "hinglish", childArt: null, lastArt: null, mis: {}, n: 0, seed: seedOf("k0", entryKey(e), 0), door: "garam", recent: [], hist: null, pL };
  let first = null; const log = [];
  for (let i = 0; i < 4; i++) {
    const lv = currentLevel(s, e), n = lv.params.counts[0];
    let typed = habit === "fixed16" ? 16 : habit === "fixed28" ? 28 : (first ??= n);
    const acts = typed === n ? [{ kind: "total", row: 0, n }, { kind: "check" }] : [{ kind: "total", row: 0, n: typed }, { kind: "check" }, { kind: "total", row: 0, n }, { kind: "check" }];
    const g = gradeActs(lv, env(acts), { final: true });
    const rows = nameOnRepeat(lessonEvidence(g.grade, lv), s, lv);
    log.push(`L${i+1} n=${n} (fade ${s.fade}) typed ${typed} -> ${rows[0].misconceptionId ? "NAMED " + rows[0].named : rows[0].outcome}`);
    s = afterLevelBody(s, { grade: g.grade, level: lv });
    s = nextBody(s, e, doors[i] ?? "garam");
  }
  console.log(habit, fade, pL, doors.join("/"), "\n  " + log.join("\n  "));
}
