const R = "/home/user/taxila-int/";
const { coverage, entryKey, seedOf, nextBody, currentLevel, nameOnRepeat, afterLevelBody } = await import(R + "server/play/levels.js");
const { gradeActs, lessonEvidence } = await import(R + "server/play/grade.js");
const e = coverage().entries.find((x) => x.family === "stambh" && x.mode === "tally" && x.goal === "read");
const sessionOf = (over = {}) => ({ childId: "c1", key: entryKey(e), skillId: e.skillId, lessonId: null, classLevel: e.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null, mis: {}, n: 0, seed: 0, door: "garam", recent: [], hist: null, ...over });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
// pad
const PAD = ["1","2","3","4","5","6","7","8","9","0"], at = (k) => { const i = PAD.indexOf(k); return [Math.floor(i / 6), i % 6]; };
const keyAt = (r, c) => { const i = r * 6 + c; return r >= 0 && c >= 0 && c < 6 && i < 10 ? PAD[i] : null; };
const DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
const WAYS = { right: [(b,s)=>5*b+s,1], dropped: [(b)=>5*b,1], doubled: [(b,s)=>5*b+2*s,1], sixth: [(b,s)=>6*b+s,1], across: [(b)=>b,0], groups: [(b,s)=>b+s,0], ten: [(b,s)=>10*b+s,0], loose: [(b,s)=>s,0] };
const habits = {};
for (const [wn, [f, st]] of Object.entries(WAYS)) {
  const cs = { none: (b,s)=>f(b,s), "b-1": (b,s)=>f(b-1,s), "b+1": (b,s)=>f(b+1,s), "s-1": (b,s)=>s>0?f(b,s-1):f(b,s), "s+1": (b,s)=>f(b,s+1) };
  if (st) { cs["stroke-1"] = (b,s)=>f(b,s)-1; cs["stroke+1"] = (b,s)=>f(b,s)+1; }
  for (const [cn, g] of Object.entries(cs)) habits[`${wn}/${cn}`] = (n) => g(Math.floor(n/5), n%5);
  // consistent typing slips on her (way) number
  const v = (n) => f(Math.floor(n/5), n%5);
  for (const pos of [0,1]) for (const [dr,dc] of DIRS) habits[`${wn}/key${pos?"units":"tens"}${dr},${dc}`] = (n) => { const t = String(v(n)).padStart(2,"0"); const [r,c]=at(t[pos]); const k = keyAt(r+dr,c+dc); if (!k) return v(n); const u = pos? t[0]+k : k+t[1]; return Number(u); };
  habits[`${wn}/swap`] = (n) => { const t = String(v(n)); return t.length===2? Number(t[1]+t[0]) : v(n); };
  habits[`${wn}/dropTens`] = (n) => { const t = String(v(n)); return t.length===2? Number(t[1]) : v(n); };
  habits[`${wn}/dropUnits`] = (n) => { const t = String(v(n)); return t.length===2? Number(t[0]) : v(n); };
}
for (let X = 0; X <= 99; X++) habits[`fixed ${X}`] = () => X;
habits["first answer, read right, then repeat"] = (n, ctx) => (ctx.first ??= n);
habits["previous level's key"] = (n, ctx) => { const r = ctx.prev ?? n; ctx.prev = n; return r; };
habits["the mix-up (control)"] = (n) => n - Math.floor(n/5);
const cells = [];
for (const fade of [1,2,3]) for (const pL of [undefined,0.3,0.6,0.7,0.8,0.9]) for (const door of ["g","t","m"]) cells.push({ fade, pL, door });
const CH = Number(process.argv[2] || 40);
const res = {};
const run = (name, h) => {
  let worst = { p: 0 }, tot = 0, cnt = 0, levelsToName = [];
  for (const cell of cells) {
    let named = 0;
    for (let c = 0; c < CH; c++) {
      let s = sessionOf({ fade: cell.fade, childId: `k${c}`, seed: seedOf(`k${c}`, entryKey(e), 0), ...(cell.pL !== undefined ? { pL: cell.pL } : {}) });
      const ctx = {}; let got = false;
      for (let i = 0; i < 6 && !got; i++) {
        const lv = currentLevel(s, e), n = lv.params.counts[0];
        const typed = Math.max(0, Math.min(99, h(n, ctx)));
        const acts = typed === n ? [{ kind: "total", row: 0, n }, { kind: "check" }] : [{ kind: "total", row: 0, n: typed }, { kind: "check" }, { kind: "total", row: 0, n }, { kind: "check" }];
        const g = gradeActs(lv, env(acts), { final: true });
        const rows = nameOnRepeat(lessonEvidence(g.grade, lv), s, lv);
        if (rows.some((r) => r.misconceptionId)) { got = true; levelsToName.push(i + 1); break; }
        s = afterLevelBody(s, { grade: g.grade, level: lv });
        const door = cell.door === "g" ? "garam" : cell.door === "t" ? "teekha" : ((c >> i) & 1 ? "teekha" : "garam");
        s = nextBody(s, e, door);
      }
      if (got) named++;
    }
    const p = named / CH; tot += named; cnt += CH;
    if (p > worst.p) worst = { p, cell };
  }
  return { worst, mean: tot / cnt, levelsToName };
};
const only = process.argv[3];
for (const [name, h] of Object.entries(habits)) {
  if (only && !name.includes(only)) continue;
  const r = run(name, h);
  if (r.worst.p > 0 || name.includes("control")) console.log(name.padEnd(28), "worst cell", r.worst.p.toFixed(3), JSON.stringify(r.worst.cell ?? null), "mean", r.mean.toFixed(4), name.includes("control") ? JSON.stringify(r.levelsToName.reduce((a,x)=>(a[x]=(a[x]||0)+1,a),{})) : "");
}
