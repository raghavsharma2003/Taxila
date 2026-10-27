import { readdirSync, readFileSync, existsSync } from "fs";
const root = "evals/simlab/results";
const tot = { runs: 0, lessons: 0, pend: 0, missed: 0, missedLessons: 0, lessonsWithPages: 0 };
const rows = [];
for (const run of readdirSync(root).sort()) {
  const d = `${root}/${run}/records`; if (!existsSync(d)) continue;
  let pend = 0, missed = 0, ml = 0, lessons = 0, withPages = 0;
  for (const f of readdirSync(d).filter((f) => f.endsWith(".json"))) {
    let r; try { r = JSON.parse(readFileSync(`${d}/${f}`, "utf8")); } catch { continue; }
    lessons++; if (r.boardPages) withPages++;
    const pages = (r.boardPages ?? []).map((p) => Date.parse(p.at));
    const T = (r.turns ?? []).filter((t) => t.at);
    let m = 0;
    for (let i = 0; i < T.length; i++) {
      const t = T[i], sl = t.ui?.studioSlot;
      if (!sl || sl.kind || !/planning/.test(sl.state ?? "")) continue;
      pend++;
      const from = Date.parse(t.at), nx = T[i + 1], to = nx ? Date.parse(nx.at) - (nx.ms ?? 0) : from + 60_000;
      if (pages.some((x) => x > from - 500 && x < to)) { missed++; m++; }
    }
    if (m) ml++;
  }
  if (!lessons) continue;
  tot.runs++; tot.lessons += lessons; tot.pend += pend; tot.missed += missed; tot.missedLessons += ml; tot.lessonsWithPages += withPages;
  rows.push(`${run}\tlessons=${lessons}\tpages=${withPages}\tplanningTurns=${pend}\tboardLandedUnseen=${missed}\tlessonsHit=${ml}`);
}
console.log(rows.join("\n")); console.log("TOTAL", JSON.stringify(tot));
