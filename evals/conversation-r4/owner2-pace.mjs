// Pace of owner-2 runs (round 4, stream 4A; the main session asked for turns-to-objective and lesson length beside any lever that
// can cost turns, e.g. TAXILA_ACK_CLOSE). From the recorded lessons only (owner-2.json), per arm:
//   first practice  the child turn at which the first practice question (a kit item or a faded step) is on the card
//   items posed     distinct questions put on the card in the 14 turns; items graded: answers with a verdict
//   held            teach turns that re-taught without a new question (move "reteach" with no item)
//   J after ack     turns the model judge flagged (J.confused / J.ignores_child) right after a bare "haan / ok"
//
//   node evals/conversation-r4/owner2-pace.mjs <armDir> [<armDir> …]     (each holding seed-*/owner-2.json)
import fs from "node:fs";
import path from "node:path";
import { bareAck } from "../../server/conversation/lexicon.js";

const median = (xs) => { const a = xs.filter((x) => x != null).sort((p, q) => p - q); return a.length ? a[Math.floor(a.length / 2)] : null; };
for (const arm of process.argv.slice(2)) {
  const firsts = [], posed = [], graded = [], held = [];
  let jTurns = 0, jAck = 0, defectTurns = 0, sessions = 0, turns = 0;
  for (const d of fs.readdirSync(arm).filter((x) => x.startsWith("seed-"))) {
    const f = path.join(arm, d, "owner-2.json");
    if (!fs.existsSync(f)) continue;
    const j = JSON.parse(fs.readFileSync(f, "utf8"));
    defectTurns += new Set(j.defects.map((x) => `${x.session}#${x.turn}`)).size;
    const J = new Map();
    for (const x of j.defects.filter((x) => /^J\.(confused|ignores_child)/.test(x.code))) J.set(`${x.session}#${x.turn}`, x);
    jTurns += J.size;
    jAck += [...J.values()].filter((x) => bareAck(x.child)).length;
    for (const L of j.lessons) {
      sessions++;
      turns += L.rows.length;
      const first = L.rows.find((r) => r.r?.ui?.phase === "practice" && r.r?.ui?.ask?.itemId);
      firsts.push(first ? first.n : null);
      posed.push(new Set(L.rows.map((r) => r.r?.ui?.ask?.itemId).filter(Boolean)).size);
      graded.push(L.rows.filter((r) => r.r?.ui?.verdict).length);
      held.push(L.rows.filter((r) => r.r?.move?.kind === "reteach" && !r.r?.ui?.ask?.itemId).length);
    }
  }
  const sum = (xs) => xs.reduce((a, b) => a + b, 0);
  console.log(`${path.basename(arm)}: ${sessions} sessions, ${turns} child turns | first practice at child turn (median) ${median(firsts)}`
    + ` (never reached: ${firsts.filter((x) => x == null).length}) | questions posed ${sum(posed)} | answers graded ${sum(graded)} | reteach turns with no question ${sum(held)}`
    + ` | turns with a defect ${defectTurns} | J turns ${jTurns} | J after a bare ack ${jAck}`);
}
