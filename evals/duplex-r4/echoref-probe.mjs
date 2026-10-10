// duplex r4: does an echo REFERENCE (the mic envelope tracking her own output envelope) separate frames that are only her
// echo from frames where someone talks over her? AMI real speech (CC BY 4.0; evaluation only), TRAIN meetings by default:
// for every ordered (X = mic, Y = her) pair, frames where Y talks and X does not (no third speaker) are ECHO, frames where
// both talk are BOTH. Features per frame: the local Pearson correlation of the mic dB envelope with her dB envelope (window
// W frames, best lag 0-L frames), and the residual: mic dB over her dB + the pair's coupling (30th pct of mic - her while
// she talks). Prints AUCs. Offline, no engine.
//   node evals/duplex-r4/echoref-probe.mjs <frames_dir> [--meetings ES2004b,IS1008b]
import fs from "node:fs";
import path from "node:path";
const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const dir = argv[0];
const auc = (pos, neg) => { let s = 0; const n = Math.min(pos.length, 4000), m = Math.min(neg.length, 4000); const P = pos.slice(0, n), N = neg.slice(0, m); for (const p of P) for (const q of N) s += p > q ? 1 : p === q ? 0.5 : 0; return +(s / (n * m)).toFixed(3); };
const corr = (a, b) => { const n = a.length; let ma = 0, mb = 0; for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; } ma /= n; mb /= n; let sab = 0, saa = 0, sbb = 0; for (let i = 0; i < n; i++) { const x = a[i] - ma, y = b[i] - mb; sab += x * y; saa += x * x; sbb += y * y; } return saa > 0 && sbb > 0 ? sab / Math.sqrt(saa * sbb) : 0; };
const shuffle = (a, seed = 7) => { let s = seed; const r = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
for (const W of [8, 15, 25]) for (const L of [0, 3]) {
  const echo = { corr: [], resid: [] }, both = { corr: [], resid: [] };
  for (const m of opt("--meetings", "ES2004b,IS1008b").split(",")) {
    const M = JSON.parse(fs.readFileSync(path.join(dir, `${m}.json`), "utf8"));
    const ids = Object.keys(M.chans);
    const n = Math.min(...ids.map((c) => M.chans[c].db.length));
    const talk = {};
    for (const c of ids) { const a = new Uint8Array(n); for (const [s, e] of M.chans[c].words) for (let k = Math.floor(s / 20); k < Math.ceil(e / 20) && k < n; k++) a[k] = 1; talk[c] = a; }
    for (const X of ids) for (const Y of ids) {
      if (X === Y) continue;
      const mic = M.chans[X].db, her = M.chans[Y].db;
      const d = []; for (let k = 0; k < n; k += 5) if (talk[Y][k] && her[k] > -45) d.push(mic[k] - her[k]);
      d.sort((a, b) => a - b); const coupling = d[Math.floor(0.3 * d.length)] ?? -30;
      for (let k = W + L; k < n; k += 3) {
        if (!talk[Y][k] || her[k] < -45) continue;
        const third = ids.some((z) => z !== X && z !== Y && talk[z][k]);
        if (third) continue;
        const cls = talk[X][k] ? both : echo;
        let best = -1;
        for (let lag = 0; lag <= L; lag++) best = Math.max(best, corr(mic.slice(k - W + 1, k + 1), her.slice(k - W + 1 - lag, k + 1 - lag)));
        cls.corr.push(best); cls.resid.push(mic[k] - (her[k] + coupling));
      }
    }
  }
  shuffle(echo.corr); shuffle(both.corr); shuffle(echo.resid); shuffle(both.resid);
  console.log(`W ${W} L ${L}: echo n ${echo.corr.length} both n ${both.corr.length} | AUC(echo has HIGHER corr) ${auc(echo.corr, both.corr)} | AUC(both has HIGHER residual) ${auc(both.resid, echo.resid)}`);
}
