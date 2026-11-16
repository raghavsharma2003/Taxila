const R = "/home/user/taxila-int/";
const { coverage, entryKey, levelsFor, seedOf, nextBody, currentLevel } = await import(R + "server/play/levels.js");
const e = coverage().entries.find((x) => x.family === "stambh" && x.mode === "tally" && x.goal === "read");
const sessionOf = (over = {}) => ({ childId: "c1", key: entryKey(e), skillId: e.skillId, lessonId: null, classLevel: e.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null, mis: {}, n: 0, seed: seedOf("c1", entryKey(e), 0), door: "garam", recent: [], hist: null, ...over });
const out = {};
const doorsArg = process.argv[2] || "g";
for (const fade of [1, 2, 3]) for (const pL of [undefined, 0.3, 0.5, 0.6, 0.7, 0.8, 0.9]) {
  const seqs = new Map();
  for (let c = 0; c < 200; c++) {
    let s = sessionOf({ fade, childId: `k${c}`, seed: seedOf(`k${c}`, entryKey(e), 0), ...(pL !== undefined ? { pL } : {}) });
    const seq = [];
    for (let i = 0; i < 4; i++) {
      const lv = currentLevel(s, e); seq.push(lv.params.counts[0] + (s.fade !== fade ? `f${s.fade}` : ""));
      let door = doorsArg === "g" ? "garam" : doorsArg === "t" ? "teekha" : (((c >> i) & 1) ? "teekha" : "garam");
      s = nextBody(s, e, door);
    }
    const k = seq.join(","); seqs.set(k, (seqs.get(k) || 0) + 1);
  }
  out[`fade${fade} pL${pL}`] = [...seqs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
}
for (const [k, v] of Object.entries(out)) console.log(k, JSON.stringify(v));
