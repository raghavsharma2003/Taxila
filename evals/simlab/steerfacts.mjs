// Off-kit steer cards (stream 2, cards/offkit-*.json; census F1 / F3): code checks from the steer turn on, no model.
//   named    — turns where her line names the steer subject (offkit_topic cards only; others have no subject)
//   split    — of those, turns where a board drawn on that turn shares no content word with her line ("together" fails:
//              she talks about the new subject while the board stays on the kit, or the reverse)
//   anySplit — any turn from the steer on where a board drawn on that turn shares no content word with her line (all cards)
//   nextMove — the server's move on the steer turn and the next one (did the Director act on it, or carry on?)
//   node evals/simlab/steerfacts.mjs <run-dir> <cards.json>   → <run-dir>/STEER.json and a per-lesson line on stdout
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { pageTurn } from "./judge.mjs";

const [dir, cardsFile] = process.argv.slice(2);
if (!dir || !cardsFile) throw new Error("usage: steerfacts.mjs <run-dir> <cards.json>");
const cards = new Map(JSON.parse(readFileSync(cardsFile, "utf8")).map((p) => [p.id, p]));
const STOP = new Set("the and for are you was has its she her him his our not but can hai aap tum par kar bhi hum ham kis jab tab sab yah vah koi ese ise use usi this that what with have your from they them then there here about which when will would could should does just also very more some into only than like been were okay haan nahi kya kaise kyun aapne aapka aapki tumne tumhara hain hota hoti karo kariye batao bataiye dekho dekhiye chaliye abhi phir lekin aur matlab yeh woh isko usko apne apna apni".split(" "));
const words = (s) => new Set(String(s ?? "").toLowerCase().normalize("NFKC").split(/[^\p{L}\p{N}]+/u).filter((w) => (/^\p{N}+$/u.test(w) || w.length >= 3) && !STOP.has(w)));
const shares = (a, b) => { const B = words(b); for (const w of words(a)) if (B.has(w) || [...B].some((x) => x.length >= 5 && w.length >= 5 && (x.startsWith(w.slice(0, 5)) || w.startsWith(x.slice(0, 5))))) return true; return false; };

const out = [];
for (const f of readdirSync(join(dir, "records")).filter((f) => f.endsWith(".json")).sort()) {
  const r = JSON.parse(readFileSync(join(dir, "records", f), "utf8"));
  const ev = cards.get(r.persona)?.steerEvent;
  if (!ev) continue;
  const at = ev.atTurn;
  const subj = ev.subject ? [...words(ev.subject)] : [];
  const boardsAt = new Map();
  for (const pg of r.boardPages ?? []) { const n = pageTurn(r, pg); boardsAt.set(n, [...(boardsAt.get(n) ?? []), pg.board]); }
  const row = { persona: r.persona, arm: r.arm, lane: r.lane, kind: ev.kind, subject: ev.subject ?? null, at, reached: r.turns.some((t) => t.n >= at && t.child), named: [], split: [], anySplit: [], nextMove: r.turns.filter((t) => t.n === at || t.n === at + 1).map((t) => `${t.n}:${t.move}`) };
  for (const t of r.turns.filter((t) => t.n >= at)) {
    const line = String(t.teacher ?? "");
    const boards = [...(boardsAt.get(t.n) ?? []), t.screen?.whiteboard].filter(Boolean);
    const apart = boards.length && boards.every((b) => !shares(line, b));
    if (apart) row.anySplit.push(t.n);
    if (subj.length && subj.some((w) => words(line).has(w) || line.toLowerCase().includes(w))) { row.named.push(t.n); if (apart) row.split.push(t.n); }
  }
  out.push(row);
  console.log(`${r.persona} ${r.arm}/${r.lane} ${ev.kind}${ev.subject ? `(${ev.subject})` : ""} @${at}${row.reached ? "" : " NOT REACHED"} moves=[${row.nextMove}] named=[${row.named}] split=[${row.split}] anySplit=[${row.anySplit}]`);
}
writeFileSync(join(dir, "STEER.json"), JSON.stringify(out, null, 1));
console.log(`${out.length} steer lessons; named-subject turns with the board apart: ${out.reduce((a, x) => a + x.split.length, 0)}; any board-apart turns after the steer: ${out.reduce((a, x) => a + x.anySplit.length, 0)}`);
