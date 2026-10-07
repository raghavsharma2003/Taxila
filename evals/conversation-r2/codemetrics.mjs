// Round 2 (conversation): code metrics over every turn of a conversation-v2 battery run dir (lessons/*.json): bare = a
// probe or setup turn (the child said a case line) answered with the card question and < 4 own words; repeatJ08 = a reply
// with Jaccard >= 0.8 to an earlier teacher line of the same lesson; fallbackLine = the fixed model-failure line.
// Usage: node evals/conversation-r2/codemetrics.mjs <runDir>
import fs from "fs";
const dir = process.argv[2];
const W = (t) => String(t ?? "").trim().split(/\s+/).filter(Boolean);
const jac = (a, b) => { const A = new Set(W(a.toLowerCase())), B = new Set(W(b.toLowerCase())); let i = 0; for (const x of A) if (B.has(x)) i++; return i / Math.max(1, A.size + B.size - i); };
const FALL = /meri baat atak gayi|lost my words for a second/i;
let n = 0, bare = 0, rep = 0, fall = 0, probeN = 0, probeBare = 0;
const ex = [];
for (const f of fs.readdirSync(dir + "/lessons")) {
  const j = JSON.parse(fs.readFileSync(`${dir}/lessons/${f}`, "utf8"));
  let said = [], lid = null;
  for (const t of j.turns ?? []) {
    if (t.lessonId !== lid) { said = []; lid = t.lessonId; }
    const r = t.teacherReply; if (!r || t.error) continue;
    n++;
    const ask = t.ui?.ask?.itemId ? t.ui.ask.text : null;
    const own = ask ? r.split(ask).join(" ") : r;
    const meaningful = /^(probe|setup):/.test(t.tag ?? ""); const isBare = meaningful && !!ask && W(own).length < 4;
    if (isBare) { bare++; ex.push(`${t.tag}: ${t.childText} -> ${r.slice(0, 90)}`); }
    if (/^(probe|setup):/.test(t.tag ?? "")) { probeN++; if (isBare) probeBare++; }
    if (said.some((p) => jac(p, r) >= 0.8)) rep++;
    if (FALL.test(r)) { fall++; ex.push(`FALLBACK ${t.tag}: ${t.childText} -> ${r.slice(0,60)}`); }
    said.push(r);
  }
}
console.log(JSON.stringify({ dir: dir.split("/").pop(), turns: n, bareNonFiller: bare, probeTurns: probeN, probeBare, repeatJ08: rep, fallbackLine: fall }));
console.log(ex.slice(0, 6).join("\n"));
