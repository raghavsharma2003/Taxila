// Games audit: the server replays raw acts a child's device sends (server/play/grade.js gradeActs). Take each family's solver acts,
// replace one numeric field at a time with an extreme value (huge, negative, fractional, -0, 2^53), and send the whole act list
// through gradeActs (sanitizeActs + replay + grade). Reports: throws, hangs (> 150 ms for one request), and any extreme value that
// WINS (goalMet) when the original value was a different number the law should have refused.
//   node docs/design/round7/audit/games-scripts/fuzz-acts.mjs
import { logicFor } from "../../../../../src/play/families/index.ts";
import { coverage, currentLevel, entryKey, seedOf } from "../../../../../server/play/levels.js";
import { gradeActs, MAX_ACTS } from "../../../../../server/play/grade.js";
const EXTREMES = [1e9, -1e9, 2 ** 53, 1e300, -0, 0.5, -1, 1e5];
const seenKey = new Set(); const out = { requests: 0, throws: [], slow: [], extremeWins: [] };
for (const e of coverage().entries) {
  const fm = `${e.family}/${e.mode}/${e.goal}`; if (seenKey.has(fm)) continue; seenKey.add(fm);
  const key = entryKey(e), L = logicFor(e.family, e.mode);
  for (let n = 0; n < 2; n++) {
    const s = { childId: "audit-child", key, skillId: e.skillId, classLevel: e.classLevel, fade: 1 + (n % 3), lang: "hinglish", mis: {}, n, seed: seedOf("audit-child", key, n), door: "garam", recent: [], hist: null };
    const lv = currentLevel(s, e, "Asha"); if (!lv) continue; const v = L.validate(lv); const sol = L.solve(v); if (!sol) continue;
    for (let i = 0; i < Math.min(sol.length, 6); i++) for (const [k, val] of Object.entries(sol[i])) {
      if (typeof val !== "number") continue;
      for (const x of EXTREMES) {
        const acts = sol.map((a) => ({ ...a })); acts[i][k] = x;
        const raw = acts.map((act, j) => ({ seq: j + 1, t: 100 * (j + 1), via: "touch", act }));
        const t0 = performance.now(); let g;
        try { g = gradeActs(lv, JSON.parse(JSON.stringify(raw)), { final: true }); } catch (err) { out.throws.push(`${fm} act${i}.${k}=${x} ${String(err.message).slice(0, 80)}`); continue; }
        const ms = performance.now() - t0; out.requests++;
        if (ms > 150) out.slow.push(`${fm} act${i}.${k}=${x} ${ms.toFixed(0)}ms`);
        if (g?.solved && x !== val && Math.abs(x) >= 1e5) out.extremeWins.push(`${fm} act${i}.${k}: ${val} -> ${x} still solved`);
      }
    }
  }
}
console.log(`requests ${out.requests}  throws ${out.throws.length}  slow(>150ms) ${out.slow.length}  extreme-wins ${out.extremeWins.length}`);
const grp = {}; for (const x of out.extremeWins) { const m = /^(\S+) act\d+\.(\w+)/.exec(x); const g = `${m[1]} .${m[2]}`; grp[g] = (grp[g] ?? 0) + 1; }
console.log("extreme values that still win, grouped (family/mode/goal .field: count):"); for (const [g, n] of Object.entries(grp)) console.log(`  ${n}  ${g}`);
for (const k of ["throws", "slow"]) for (const x of out[k].slice(0, 12)) console.log(`  ${k}: ${x}`);
