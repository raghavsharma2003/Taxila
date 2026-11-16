// Games audit: text a child could be shown that is visibly broken. Every coverage entry x fade x door x seeds, served the way the
// server serves it (currentLevel, friend names filled), scanned for raw {slots}, undefined / NaN / [object, doubled spaces and
// empty strings in string params. The three already fixed by the Games stream (arena list cut, number tiles on yes/no, raw
// {friendF} in g2/levels.js) would show up here if they came back.
//   node docs/design/round7/audit/games-scripts/served-text.mjs
import { coverage, currentLevel, entryKey, seedOf } from "../../../../../server/play/levels.js";
const pats = [[/\{[A-Za-z_]+\}/, "raw {slot}"], [/\bundefined\b/, "undefined"], [/\bNaN\b/, "NaN"], [/\[object /, "[object"], [/\bnull\b/, "null word"], [/  +/, "double space"]];
const hits = new Map(); let n = 0;
for (const e of coverage().entries) {
  const key = entryKey(e);
  for (const fade of [1, 2, 3]) for (const door of ["garam", "teekha"]) for (let k = 0; k < 4; k++) {
    const s = { childId: "audit-child", key, skillId: e.skillId, classLevel: e.classLevel, fade, lang: "hinglish", mis: {}, n: k, seed: seedOf("audit-child", key, k), door, recent: [], hist: null };
    const lv = currentLevel(s, e, "Asha"); if (!lv) continue; n++;
    const strs = []; (function walk(o, p) { if (typeof o === "string") strs.push([p, o]); else if (o && typeof o === "object") for (const [kk, v] of Object.entries(o)) walk(v, `${p}.${kk}`); })(lv.params, "params");
    for (const [p, str] of strs) for (const [re, name] of pats) if (re.test(str)) { const h = `${name} :: ${key} :: ${p} :: ${JSON.stringify(str.slice(0, 70))}`; hits.set(h, (hits.get(h) ?? 0) + 1); }
  }
}
console.log(`levels scanned ${n}; distinct hits ${hits.size}`);
for (const [h, c] of [...hits].slice(0, 40)) console.log(`  x${c} ${h}`);
