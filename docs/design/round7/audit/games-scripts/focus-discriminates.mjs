// Games audit: the Director's "focus" (the misconception the lesson just saw) is promised to make the NEXT level test exactly
// that belief (server/play/start.js, learnerInputs). For every coverage entry and every kit misconception mapped to it, serve
// levels with that focus and check the level's proof.discriminates really names it, and that the mal-rule's own acts do not win.
//   node docs/design/round7/audit/games-scripts/focus-discriminates.mjs [--json out.json]
import { writeFileSync } from "node:fs";
import { logicFor } from "../../../../../src/play/families/index.ts";
import { replayAll } from "../../../../../src/play/core/replay.ts";
import { coverage, currentLevel, entryKey, seedOf } from "../../../../../server/play/levels.js";
const env = (a) => a.map((act, i) => ({ seq: i + 1, t: 100 * (i + 1), via: "touch", act }));
const out = { checked: 0, notDiscriminating: [], malWinsOnFocus: [], noLevel: [] };
for (const e of coverage().entries) {
  if (!e.misMap || !Object.keys(e.misMap).length) continue;
  const L = logicFor(e.family, e.mode); if (!L) continue;
  const key = entryKey(e);
  for (const [malId, kitId] of Object.entries(e.misMap)) for (const fade of [1, 2, 3]) for (let n = 0; n < 3; n++) {
    const s = { childId: "audit-child", key, skillId: e.skillId, classLevel: e.classLevel, fade, lang: "hinglish", mis: { [kitId]: 0.7 }, focus: kitId, n, seed: seedOf("audit-child", key, n), door: "garam", recent: [], hist: null };
    const lv = currentLevel(s, e, "Asha");
    if (!lv) { out.noLevel.push({ key, kitId, fade, n }); continue; }
    out.checked++;
    const v = L.validate(lv); if (!v) continue;
    const disc = (v.proof?.discriminates ?? []);
    if (!disc.includes(kitId)) out.notDiscriminating.push({ key, kitId, malId, fade, n, discriminates: disc, targets: v.targets });
    if (L.malRules.includes(malId)) { let ma = null; try { ma = L.malActs(v, malId); } catch { /* */ } if (ma?.length && L.goalMet(v, replayAll(L, v, env(ma)).state)) out.malWinsOnFocus.push({ key, kitId, malId, fade, n }); }
  }
}
const byKit = {}; for (const x of out.notDiscriminating) { const k = `${x.key} :: ${x.kitId}`; byKit[k] = (byKit[k] ?? 0) + 1; }
console.log(`checked ${out.checked} focused levels; not discriminating the focus: ${out.notDiscriminating.length} (${Object.keys(byKit).length} entry/belief pairs); mal-rule acts win on the focus level: ${out.malWinsOnFocus.length}; no level: ${out.noLevel.length}`);
for (const [k, n] of Object.entries(byKit).slice(0, 80)) console.log(`  ${n}/9  ${k}`);
if (process.argv.includes("--json")) writeFileSync(process.argv[process.argv.indexOf("--json") + 1], JSON.stringify(out, null, 1));
