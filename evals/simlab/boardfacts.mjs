// Board facts by code, no judge (stream 2's board battery): what was drawn and what she said about it, per arm, with
// repeat arms (name_1, name_2, …) pooled under their name.   node evals/simlab/boardfacts.mjs <run-dir>  → BOARDFACTS.json
//   repeatPages     lessons / pages where the same board page was shown twice
//   newPages        board pages that came up on a turn; unsynced = her line on that turn shares no content word with the page
//   idKeys          her lines that speak a board-internal key (left1, step2, row3 …)
//   pointsAtNothing turns where her line points at the screen/board/picture while nothing is up, or only a planning slot
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";

const dir = process.argv[2];
const recs = readdirSync(join(dir, "records")).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(join(dir, "records", f), "utf8")));

// deictic pointing only (2183c32d review: a topic noun — "number line par jumps karenge", "drawing pasand hai?", "next
// picture se continue karenge", "football dekhte hain" — is not her pointing at the stage)
const POINT = /\b(?:screen|board|picture|photo|drawing|diagram|chart|number line|timeline|table)\s+(?:par|pe|mein|me|ke (?:left|right|upar|neeche|flow))\b|\bdekh(?:o|iye|iyega|iyenge)\b|\blook at\b|\bon the (?:screen|board)\b|\bin the picture\b|स्क्रीन (?:पर|में)|बोर्ड पर|तस्वीर में|चित्र में|देखो|देखिए/i;
const ID_KEY = /\b(?:left|right|row|col|step|item|node|box|label|top|bottom|stage|part)\d+\b/i;
const STOP = new Set("this that with from have what your kya hai hain aur yeh woh isko usko mein par kaise kitne kitna abhi phir karo dekho dekhiye board screen".split(" "));
const words = (s) => new Set(String(s ?? "").toLowerCase().normalize("NFKC").split(/[^\p{L}\p{N}]+/u).filter((w) => (w.length >= 4 || /^\p{N}+$/u.test(w)) && !STOP.has(w)));
const boardOf = (s) => s?.whiteboard ?? (s?.studio && !/nothing drawn/.test(s.studio) ? s.studio : null);
const shown = (s) => !!(s?.module || boardOf(s) || (s?.chips && s.chips.length)); // choice tiles / chips on screen are something shown
const planning = (s) => !!s?.studio && /nothing drawn|planning|pending/i.test(s.studio) && !s.whiteboard;

const out = {};
for (const r of recs) {
  const arm = `${String(r.arm).replace(/_\d+$/, "")}/${r.lane}`;
  const f = (out[arm] ??= { lessons: 0, turns: 0, repeatPageLessons: 0, repeatPages: 0, newPages: 0, unsyncedPages: 0, idKeyLines: 0, idKeyLessons: 0,
    pointsAtNothing: 0, pointsAtPlanning: 0, pointsLessons: 0, examples: { unsynced: [], idKeys: [], points: [] } });
  f.lessons++;
  const pages = (r.boardPages ?? []).map((pg) => pg.board);
  const dup = pages.filter((b, i) => b && pages.indexOf(b) !== i).length;
  if (dup) { f.repeatPageLessons++; f.repeatPages += dup; }
  let prevBoard = null, idHit = false, ptHit = false;
  for (const t of r.turns) {
    if (!t.teacher) continue;
    f.turns++;
    const s = t.screen ?? {};
    const b = boardOf(s);
    if (b && b !== prevBoard) {
      f.newPages++;
      const bw = words(b), lw = words(t.teacher);
      if (![...bw].some((w) => lw.has(w))) { f.unsyncedPages++; if (f.examples.unsynced.length < 4) f.examples.unsynced.push(`${r.persona}#${t.n}: board "${b.slice(0, 70)}" | she: "${t.teacher.slice(0, 90)}"`); }
    }
    if (ID_KEY.test(t.teacher)) { f.idKeyLines++; idHit = true; if (f.examples.idKeys.length < 4) f.examples.idKeys.push(`${r.persona}#${t.n}: ${t.teacher.slice(0, 120)}`); }
    if (POINT.test(t.teacher) && !shown(s)) {
      if (planning(s)) f.pointsAtPlanning++; else f.pointsAtNothing++;
      ptHit = true;
      if (f.examples.points.length < 4) f.examples.points.push(`${r.persona}#${t.n}${planning(s) ? " (planning)" : ""}: ${t.teacher.slice(0, 110)}`);
    }
    prevBoard = b ?? prevBoard;
  }
  if (idHit) f.idKeyLessons++;
  if (ptHit) f.pointsLessons++;
}
writeFileSync(join(dir, "BOARDFACTS.json"), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
